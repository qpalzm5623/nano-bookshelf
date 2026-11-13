/**
 * ============================================================================
 * [나노의 책장 B2B 마스터 관리자] 전국 포트폴리오 관리 모듈 (Master Portfolio)
 *  - PostgreSQL DB(/api/manage?entity=portfolios) 전국 실시간 포트폴리오 조회
 *  - 검색 가능한 커스텀 가맹점 필터 드롭다운 (웜 베이지 디자인)
 *  - 실제 포트폴리오 상세 리포트 모달 & 인쇄 지원 (카톡 발송 버튼 제거)
 * ============================================================================
 */

(function(window) {
  'use strict';

  var MASTER_PF_PAGE_SIZE = 20;
  var masterPfPage = 1;
  var currentFilteredMasterPfList = [];
  var currentPfDetailCache = Object.create(null);
  var currentOpenMasterPfId = null;

  var pfSearchSeq = 0;
  var activePfSearchKey = '';
  var activePfSearchPromise = null;
  var isMasterPfLoading = false;
  var pfDropdownEventsBound = false;
  var pfDropdownFocusedIndex = -1;
  var knownPfClassNames = Object.create(null);
  var pfSearchDebounceTimer = null;

  // 서버 미연동 로컬 정적 HTML 프리뷰 전용 샘플 데이터
  var OFFLINE_SAMPLE_PORTFOLIOS = [
    {
      id: 'PF_SAMPLE_01',
      academyId: 'ACAD-001',
      academyName: '강남 대치 리딩랩',
      studentId: 'demo_student',
      studentName: '박지후',
      school: '대치초등학교',
      grade: '4학년',
      classGroup: 'A Class',
      title: '[박지후] 2026년 11월 독서 성장 포트폴리오',
      period: '2026-11-01 ~ 2026-11-12',
      from: '2026-11-01',
      to: '2026-11-12',
      bookCount: 2,
      quizAvgNum: 90,
      quizAvg: '90점',
      issueDate: '2026-11-12 11:30',
      kstDate: '2026-11-12',
      comment: '도서 핵심 사건을 정확히 파악하며 사고력 표현력이 꾸준히 향상되고 있습니다.',
      books: [
        { title: '오즈의 마법사', pub: '어스본코리아', cover: 'upload/book/book_default.jpg', date: '2026-11-10', score: 100, thought: '친구들과 협력하는 과정이 인상 깊었습니다.' },
        { title: '수호의 하얀 말', pub: '한림출판사', cover: 'upload/book/book_default.jpg', date: '2026-11-05', score: 80, thought: '하얀 말과의 우정이 감동적이었습니다.' }
      ]
    }
  ];

  // 운영 DB / API 연동 여부 판별
  function isRemoteServerMode() {
    if (typeof window === 'undefined') return false;
    return Boolean(window.NANO_SERVER_DATA || (window.NanoPortal && window.NanoPortal.remote));
  }

  // XSS 방지용 HTML 이스케이프
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 도서 표지 경로 안전 검증
  function resolveSafeBookCover(rawUrl) {
    var src = String(rawUrl || '').trim();
    if (!src || /^(javascript|vbscript):/i.test(src)) {
      return 'upload/book/book_default.jpg';
    }
    if (src.charAt(0) === '/' && src.charAt(1) !== '/') {
      src = src.slice(1);
    }
    if (/^(https?:\/\/|data:image\/|upload\/|resources\/|assets\/)/i.test(src)) {
      return src;
    }
    return 'upload/book/book_default.jpg';
  }

  // KST 기준 YYYY-MM-DD
  function getTodayYmd() {
    var now = new Date();
    var kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    return kst.toISOString().slice(0, 10);
  }

  // 가맹점 목록 수집 및 정규화 (본사 HQ 최상단 + 가나다순)
  function getMasterPfFranchiseList() {
    var rawList = [];
    if (typeof MIGRATED_FRANCHISES !== 'undefined' && Array.isArray(MIGRATED_FRANCHISES) && MIGRATED_FRANCHISES.length > 0) {
      rawList = MIGRATED_FRANCHISES;
    } else if (window.MIGRATED_FRANCHISES && Array.isArray(window.MIGRATED_FRANCHISES) && window.MIGRATED_FRANCHISES.length > 0) {
      rawList = window.MIGRATED_FRANCHISES;
    } else if (window.MIGRATED_ACADEMY_OPTIONS && Array.isArray(window.MIGRATED_ACADEMY_OPTIONS) && window.MIGRATED_ACADEMY_OPTIONS.length > 0) {
      rawList = window.MIGRATED_ACADEMY_OPTIONS;
    } else if (window.franchiseList && Array.isArray(window.franchiseList) && window.franchiseList.length > 0) {
      rawList = window.franchiseList;
    }

    var seen = Object.create(null);
    var result = [];
    rawList.forEach(function(f) {
      if (!f || f.deletedAt) return;
      var code = String(f.id || f.code || '').trim();
      var name = String(f.name || f.academyName || code).trim();
      if (!code || !name || seen[code]) return;
      seen[code] = true;
      result.push({ id: code, serverId: f.serverId || '', name: name });
    });

    result.sort(function(a, b) {
      if (a.id === 'HQ' && b.id !== 'HQ') return -1;
      if (b.id === 'HQ' && a.id !== 'HQ') return 1;
      return a.name.localeCompare(b.name, 'ko');
    });

    return result;
  }

  function getFranchiseNameMap() {
    var map = Object.create(null);
    getMasterPfFranchiseList().forEach(function(f) {
      map[f.id] = f.name;
      if (f.serverId) map[f.serverId] = f.name;
    });
    return map;
  }

  // 포트폴리오 데이터 표준화
  function normalizeMasterPortfolioItem(raw, franchiseMap) {
    if (!raw || typeof raw !== 'object') return null;
    var books = Array.isArray(raw.books) ? raw.books : [];
    var academyId = String(raw.academyId || '').trim();
    var academyName = String(raw.academyName || '').trim();
    if (!academyName && academyId && franchiseMap && franchiseMap[academyId]) {
      academyName = franchiseMap[academyId];
    }
    if (!academyName) academyName = academyId || '소속 미지정';

    var bookCount = typeof raw.bookCount === 'number' ? raw.bookCount : books.length;

    var quizAvgNum = typeof raw.quizAvgNum === 'number' && !isNaN(raw.quizAvgNum) ? raw.quizAvgNum : NaN;
    if (isNaN(quizAvgNum) && books.length > 0) {
      var validScores = books
        .map(function(b) { return b && b.score != null && b.score !== '' ? Number(String(b.score).replace(/[^0-9.]/g, '')) : NaN; })
        .filter(function(n) { return !isNaN(n); });
      if (validScores.length > 0) {
        quizAvgNum = Math.round((validScores.reduce(function(a, b) { return a + b; }, 0) / validScores.length) * 10) / 10;
      }
    }
    if (isNaN(quizAvgNum) && raw.quizAvg != null && raw.quizAvg !== '') {
      var parsedAvg = Number(String(raw.quizAvg).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedAvg)) quizAvgNum = parsedAvg;
    }

    var quizAvgText = !isNaN(quizAvgNum) ? (quizAvgNum + '점') : (raw.quizAvg || '-');

    var kstDate = String(raw.kstDate || '').trim();
    var issueDate = String(raw.issueDate || '').trim();
    if (!kstDate && raw.createdAt) {
      var dt = new Date(raw.createdAt);
      if (!isNaN(dt.getTime())) {
        var kstIso = new Date(dt.getTime() + 9 * 60 * 60 * 1000).toISOString();
        kstDate = kstIso.slice(0, 10);
        if (!issueDate) issueDate = kstIso.slice(0, 10) + ' ' + kstIso.slice(11, 16);
      }
    }
    if (!kstDate && issueDate) {
      kstDate = issueDate.slice(0, 10).replace(/\./g, '-');
    }

    var periodText = String(raw.period || '').trim();
    if (!periodText && (raw.from || raw.to)) {
      periodText = [raw.from || '', raw.to || ''].filter(Boolean).join(' ~ ');
    }

    return Object.assign({}, raw, {
      id: String(raw.id || ''),
      academyId: academyId,
      academyName: academyName,
      studentId: String(raw.studentId || '').trim(),
      studentName: String(raw.studentName || raw.name || '학생').trim(),
      school: String(raw.school || '').trim(),
      grade: String(raw.grade || '').trim(),
      classGroup: String(raw.classGroup || '미지정').trim() || '미지정',
      title: String(raw.title || ((raw.studentName || raw.name || '학생') + ' 독서 포트폴리오')).trim(),
      period: periodText,
      bookCount: bookCount,
      quizAvgNum: !isNaN(quizAvgNum) ? quizAvgNum : null,
      quizAvg: quizAvgText,
      issueDate: issueDate || kstDate || '-',
      kstDate: kstDate,
      books: books
    });
  }

  // 1. 초기화 함수 (탭 최초 진입 시 1회)
  function initMasterPortfolio() {
    bindMasterPfDropdownEvents();
    populateMasterPfAcademyFilter();
    populateMasterPfClassFilter();
    initMasterPfDateFilters();
    filterMasterPortfolioList();
  }

  // 2. 검색형 가맹점 드롭다운 이벤트 바인딩 (1회만 등록)
  function bindMasterPfDropdownEvents() {
    if (pfDropdownEventsBound || typeof document === 'undefined') return;
    pfDropdownEventsBound = true;

    var searchInput = document.getElementById('masterPfAcademySearchInput');
    var clearBtn = document.getElementById('masterPfAcademySearchClear');
    var optionsEl = document.getElementById('masterPfAcademyOptions');

    if (searchInput) {
      searchInput.addEventListener('input', function() {
        pfDropdownFocusedIndex = -1;
        if (clearBtn) clearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
        renderMasterPfAcademyDropdownOptions(searchInput.value);
      });

      searchInput.addEventListener('keydown', function(e) {
        var items = optionsEl ? Array.prototype.slice.call(optionsEl.querySelectorAll('.master-dropdown-item')) : [];
        if (e.key === 'Escape') {
          closeMasterPfAcademyDropdown();
          var trigger = document.getElementById('masterPfAcademyTrigger');
          if (trigger) trigger.focus();
          return;
        }
        if (e.key === 'ArrowDown' && items.length) {
          e.preventDefault();
          pfDropdownFocusedIndex = (pfDropdownFocusedIndex + 1) % items.length;
          updatePfDropdownFocus(items);
          return;
        }
        if (e.key === 'ArrowUp' && items.length) {
          e.preventDefault();
          pfDropdownFocusedIndex = pfDropdownFocusedIndex <= 0 ? items.length - 1 : pfDropdownFocusedIndex - 1;
          updatePfDropdownFocus(items);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (items.length) {
            var target = items[pfDropdownFocusedIndex >= 0 ? pfDropdownFocusedIndex : 0];
            if (target) selectMasterPfAcademyOption(target.getAttribute('data-value') || 'ALL');
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearBtn.style.display = 'none';
        pfDropdownFocusedIndex = -1;
        renderMasterPfAcademyDropdownOptions('');
      });
    }

    if (optionsEl) {
      optionsEl.addEventListener('click', function(e) {
        var btn = e.target && e.target.closest ? e.target.closest('.master-dropdown-item') : null;
        if (!btn) return;
        e.stopPropagation();
        selectMasterPfAcademyOption(btn.getAttribute('data-value') || 'ALL');
      });
    }

    document.addEventListener('click', function(e) {
      var wrapper = document.getElementById('masterPfAcademyDropdown');
      if (!wrapper || !wrapper.classList.contains('is-open')) return;
      if (!wrapper.contains(e.target)) {
        closeMasterPfAcademyDropdown();
      }
    });
  }

  function updatePfDropdownFocus(items) {
    items.forEach(function(item, idx) {
      if (idx === pfDropdownFocusedIndex) {
        item.classList.add('is-focused');
        if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('is-focused');
      }
    });
  }

  function toggleMasterPfAcademyDropdown(event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    var wrapper = document.getElementById('masterPfAcademyDropdown');
    if (!wrapper) return;
    if (wrapper.classList.contains('is-open')) {
      closeMasterPfAcademyDropdown();
    } else {
      openMasterPfAcademyDropdown();
    }
  }

  function openMasterPfAcademyDropdown() {
    var wrapper = document.getElementById('masterPfAcademyDropdown');
    var trigger = document.getElementById('masterPfAcademyTrigger');
    var searchInput = document.getElementById('masterPfAcademySearchInput');
    var clearBtn = document.getElementById('masterPfAcademySearchClear');
    if (!wrapper) return;

    pfDropdownFocusedIndex = -1;
    if (searchInput) {
      searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
    }
    renderMasterPfAcademyDropdownOptions('');
    wrapper.classList.add('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (searchInput) setTimeout(function() { searchInput.focus(); }, 10);
  }

  function closeMasterPfAcademyDropdown() {
    var wrapper = document.getElementById('masterPfAcademyDropdown');
    var trigger = document.getElementById('masterPfAcademyTrigger');
    if (!wrapper) return;
    wrapper.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    pfDropdownFocusedIndex = -1;
  }

  function syncMasterPfAcademyTriggerLabel(selectedVal) {
    var franchises = getMasterPfFranchiseList();
    var labelEl = document.getElementById('masterPfAcademyLabel');
    var hiddenInput = document.getElementById('masterPfAcademyFilter');
    var val = selectedVal || (hiddenInput ? hiddenInput.value : 'ALL') || 'ALL';
    if (!labelEl) return;

    if (val === 'ALL') {
      labelEl.textContent = franchises.length > 0 ? ('전체 가맹점 (' + franchises.length + '곳)') : '전체 가맹점';
      return;
    }
    var matched = franchises.find(function(f) { return f.id === val || f.name === val; });
    labelEl.textContent = matched ? matched.name : val;
  }

  function renderMasterPfAcademyDropdownOptions(keyword) {
    var optionsEl = document.getElementById('masterPfAcademyOptions');
    var hiddenInput = document.getElementById('masterPfAcademyFilter');
    if (!optionsEl) return;

    var franchises = getMasterPfFranchiseList();
    var currentVal = (hiddenInput && hiddenInput.value) || 'ALL';
    var q = String(keyword || '').trim().toLowerCase();

    var htmlParts = [];
    if (!q || '전체 가맹점'.indexOf(q) !== -1 || q === 'all') {
      var allLabel = franchises.length > 0 ? ('전체 가맹점 (' + franchises.length + '곳)') : '전체 가맹점';
      var isAllSelected = currentVal === 'ALL';
      htmlParts.push(
        '<button type="button" class="master-dropdown-item' + (isAllSelected ? ' is-selected' : '') + '" data-value="ALL" role="option" aria-selected="' + isAllSelected + '">' +
          '<span class="master-dropdown-item-name">' + escapeHtml(allLabel) + '</span>' +
          (isAllSelected ? '<i class="fa-solid fa-check" style="font-size:11px; color:#2f5436;"></i>' : '<span class="master-dropdown-item-code">ALL</span>') +
        '</button>'
      );
    }

    var filtered = q
      ? franchises.filter(function(f) {
          return f.name.toLowerCase().indexOf(q) !== -1 || f.id.toLowerCase().indexOf(q) !== -1;
        })
      : franchises;

    filtered.forEach(function(f) {
      var isSelected = currentVal === f.id || currentVal === f.name;
      htmlParts.push(
        '<button type="button" class="master-dropdown-item' + (isSelected ? ' is-selected' : '') + '" data-value="' + escapeHtml(f.id) + '" role="option" aria-selected="' + isSelected + '">' +
          '<span class="master-dropdown-item-name">' + escapeHtml(f.name) + '</span>' +
          (isSelected
            ? '<i class="fa-solid fa-check" style="font-size:11px; color:#2f5436;"></i>'
            : '<span class="master-dropdown-item-code">' + escapeHtml(f.id) + '</span>') +
        '</button>'
      );
    });

    optionsEl.innerHTML = htmlParts.length
      ? htmlParts.join('')
      : '<div class="master-dropdown-empty"><i class="fa-regular fa-circle-xmark mr-1"></i>일치하는 가맹점이 없습니다.</div>';
  }

  function selectMasterPfAcademyOption(value) {
    var hiddenInput = document.getElementById('masterPfAcademyFilter');
    var nextVal = value || 'ALL';
    if (hiddenInput) hiddenInput.value = nextVal;
    syncMasterPfAcademyTriggerLabel(nextVal);
    closeMasterPfAcademyDropdown();
    populateMasterPfClassFilter();
    filterMasterPortfolioList();
  }

  // 3. 가맹점 드롭다운 채우기
  function populateMasterPfAcademyFilter() {
    bindMasterPfDropdownEvents();
    var franchises = getMasterPfFranchiseList();
    var hiddenInput = document.getElementById('masterPfAcademyFilter');
    var currentVal = (hiddenInput && hiddenInput.value) || 'ALL';

    if (currentVal !== 'ALL' && !franchises.some(function(f) { return f.id === currentVal || f.name === currentVal; })) {
      currentVal = 'ALL';
      if (hiddenInput) hiddenInput.value = 'ALL';
    }
    syncMasterPfAcademyTriggerLabel(currentVal);
    renderMasterPfAcademyDropdownOptions('');
  }

  // 4. 클래스 필터 동적 채우기
  function populateMasterPfClassFilter(itemsToMerge) {
    var select = document.getElementById('masterPfClassFilter');
    if (!select) return;
    var currentVal = select.value || 'ALL';
    var academyInput = document.getElementById('masterPfAcademyFilter');
    var selectedAcademy = (academyInput && academyInput.value) || 'ALL';

    if (Array.isArray(itemsToMerge)) {
      itemsToMerge.forEach(function(item) {
        if (item && item.classGroup) knownPfClassNames[String(item.classGroup)] = true;
      });
    }

    var classSet = Object.create(null);
    ['유치부', 'A Class', 'B Class', '소나무반', '초등부', '미지정'].forEach(function(c) { classSet[c] = true; });
    Object.keys(knownPfClassNames).forEach(function(c) { classSet[c] = true; });

    if (Array.isArray(window.MIGRATED_MEMBERS)) {
      window.MIGRATED_MEMBERS.forEach(function(m) {
        if (!m || !m.classGroup) return;
        if (selectedAcademy === 'ALL' || m.academyId === selectedAcademy) {
          classSet[String(m.classGroup).trim()] = true;
        }
      });
    }

    var html = '<option value="ALL">전체 클래스</option>';
    Object.keys(classSet).sort(function(a, b) {
      if (a === '미지정') return 1;
      if (b === '미지정') return -1;
      return a.localeCompare(b, 'ko');
    }).forEach(function(c) {
      if (!c) return;
      html += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });
    select.innerHTML = html;
    select.value = Array.prototype.some.call(select.options, function(o) { return o.value === currentVal; }) ? currentVal : 'ALL';
  }

  // 5. 발급일자 기본값 초기화 (당월 1일 ~ 오늘 KST)
  function initMasterPfDateFilters(force) {
    var startEl = document.getElementById('masterPfStartDate');
    var endEl = document.getElementById('masterPfEndDate');
    if (!startEl || !endEl) return;

    var todayStr = getTodayYmd();
    var defaultStart = todayStr.slice(0, 7) + '-01';
    if (force || !startEl.value) startEl.value = defaultStart;
    if (force || !endEl.value) endEl.value = todayStr;
  }

  // 검색 입력 디바운스 (키 입력 시 과도한 API 호출 방지)
  function scheduleMasterPfSearch() {
    if (pfSearchDebounceTimer) clearTimeout(pfSearchDebounceTimer);
    pfSearchDebounceTimer = setTimeout(function() {
      pfSearchDebounceTimer = null;
      filterMasterPortfolioList();
    }, 260);
  }

  function renderMasterPfLoadingState() {
    var tbody = document.getElementById('masterPfTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="10" class="text-center py-5 text-muted">' +
        '<div class="spinner-border spinner-border-sm text-secondary mr-2" role="status"></div>' +
        '<span style="font-size: 13px; font-weight: 600;">DB에서 전국 포트폴리오 내역을 불러오는 중입니다...</span>' +
      '</td></tr>';
  }

  function renderMasterPfErrorState(msg) {
    var tbody = document.getElementById('masterPfTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="10" class="text-center py-5 text-danger">' +
        '<i class="fa-solid fa-triangle-exclamation mr-2"></i>' +
        escapeHtml(msg || '포트폴리오 내역을 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.') +
      '</td></tr>';
  }

  // 6. 마스터 포트폴리오 목록 조회 및 필터링 (서버 DB 우선 / 로컬 프리뷰 분리)
  async function filterMasterPortfolioList() {
    initMasterPfDateFilters();

    var academyVal = (document.getElementById('masterPfAcademyFilter') && document.getElementById('masterPfAcademyFilter').value) || 'ALL';
    var classVal = (document.getElementById('masterPfClassFilter') && document.getElementById('masterPfClassFilter').value) || 'ALL';
    var startVal = (document.getElementById('masterPfStartDate') && document.getElementById('masterPfStartDate').value) || '';
    var endVal = (document.getElementById('masterPfEndDate') && document.getElementById('masterPfEndDate').value) || '';
    var query = (document.getElementById('masterPfSearchInput') && document.getElementById('masterPfSearchInput').value
      ? document.getElementById('masterPfSearchInput').value.trim()
      : '');

    var franchiseMap = getFranchiseNameMap();

    if (isRemoteServerMode()) {
      if (!window.NanoPortal || typeof NanoPortal.api !== 'function') {
        renderMasterPfErrorState('포털 API 클라이언트를 사용할 수 없습니다.');
        return;
      }

      var paramsObj = { academy: academyVal, classGroup: classVal, startDate: startVal, endDate: endVal, search: query };
      var queryKey = JSON.stringify(paramsObj);

      if (activePfSearchPromise && activePfSearchKey === queryKey) {
        return activePfSearchPromise;
      }

      var mySeq = ++pfSearchSeq;
      activePfSearchKey = queryKey;
      isMasterPfLoading = true;
      renderMasterPfLoadingState();

      var task = (async function() {
        try {
          var qs = ['entity=portfolios', 'academy=' + encodeURIComponent(academyVal || 'ALL')];
          if (classVal && classVal !== 'ALL') qs.push('classGroup=' + encodeURIComponent(classVal));
          if (startVal) qs.push('startDate=' + encodeURIComponent(startVal));
          if (endVal) qs.push('endDate=' + encodeURIComponent(endVal));
          if (query) qs.push('search=' + encodeURIComponent(query));

          var res = await NanoPortal.api('/api/manage?' + qs.join('&'));
          if (mySeq !== pfSearchSeq) return;

          var rawItems = Array.isArray(res && res.items) ? res.items : [];
          var normalized = rawItems
            .map(function(item) { return normalizeMasterPortfolioItem(item, franchiseMap); })
            .filter(Boolean);

          currentFilteredMasterPfList = normalized;
          masterPfPage = 1;
          populateMasterPfClassFilter(normalized);
          updateMasterPfStats(normalized, res && res.stats);
          renderMasterPfTable(1);
        } catch (err) {
          if (mySeq !== pfSearchSeq) return;
          currentFilteredMasterPfList = [];
          masterPfPage = 1;
          updateMasterPfStats([], null);
          renderMasterPfErrorState(err && err.message ? err.message : '포트폴리오 조회 중 오류가 발생했습니다.');
          var badge = document.getElementById('masterPfTotalCount');
          if (badge) badge.textContent = '0';
          var pagEl = document.getElementById('masterPfPagination');
          if (pagEl) pagEl.innerHTML = '';
        } finally {
          if (activePfSearchKey === queryKey) {
            activePfSearchKey = '';
            activePfSearchPromise = null;
          }
          if (mySeq === pfSearchSeq) isMasterPfLoading = false;
        }
      })();

      activePfSearchPromise = task;
      return task;
    }

    // 로컬 정적 HTML 프리뷰 폴백
    var rawLocal = (Array.isArray(window.portfolioList) && window.portfolioList.length > 0)
      ? window.portfolioList.slice()
      : OFFLINE_SAMPLE_PORTFOLIOS.slice();

    var localNormalized = rawLocal
      .map(function(item) { return normalizeMasterPortfolioItem(item, franchiseMap); })
      .filter(Boolean);

    var qLower = query.toLowerCase();
    var filtered = localNormalized.filter(function(pf) {
      if (academyVal !== 'ALL' && pf.academyId !== academyVal && pf.academyName !== academyVal) return false;
      if (classVal !== 'ALL' && pf.classGroup !== classVal) return false;
      if (startVal && pf.kstDate && pf.kstDate < startVal) return false;
      if (endVal && pf.kstDate && pf.kstDate > endVal) return false;
      if (qLower) {
        var hay = [pf.studentName, pf.studentId, pf.title, pf.academyName, pf.school, pf.id].join(' ').toLowerCase();
        if (hay.indexOf(qLower) === -1) return false;
      }
      return true;
    });

    filtered.sort(function(a, b) {
      return String(b.issueDate || '').localeCompare(String(a.issueDate || ''));
    });

    currentFilteredMasterPfList = filtered;
    masterPfPage = 1;
    populateMasterPfClassFilter(filtered);
    updateMasterPfStats(localNormalized, null);
    renderMasterPfTable(1);
  }

  // 7. 상단 통계 카드 업데이트 (이번달 발급 / 누적 발급 / 포트폴리오 평균 북퀴즈)
  function updateMasterPfStats(items, serverStats) {
    var todayYm = getTodayYmd().slice(0, 7);
    var curMonthNum = Number(todayYm.slice(5, 7));

    var monthIssued = 0;
    var totalIssued = 0;
    var avgQuiz = 0;
    var totalBooks = 0;
    var avgBooks = 0;

    if (serverStats && typeof serverStats === 'object') {
      monthIssued = Number(serverStats.monthIssuedCount || 0);
      totalIssued = Number(serverStats.totalIssuedCount || 0);
      avgQuiz = Number(serverStats.avgQuizScore || 0);
      totalBooks = Number(serverStats.totalBookCount || 0);
      avgBooks = Number(serverStats.avgBookCount || 0);
    } else {
      var list = Array.isArray(items) ? items : [];
      totalIssued = list.length;
      monthIssued = list.filter(function(p) { return String(p.kstDate || '').slice(0, 7) === todayYm; }).length;
      var scored = list.filter(function(p) { return typeof p.quizAvgNum === 'number' && !isNaN(p.quizAvgNum); });
      avgQuiz = scored.length
        ? Math.round((scored.reduce(function(s, p) { return s + p.quizAvgNum; }, 0) / scored.length) * 10) / 10
        : 0;
      totalBooks = list.reduce(function(s, p) { return s + (Number(p.bookCount) || 0); }, 0);
      avgBooks = totalIssued ? Math.round((totalBooks / totalIssued) * 10) / 10 : 0;
    }

    var mCountEl = document.getElementById('masterPfMonthIssuedCount');
    if (mCountEl) mCountEl.textContent = monthIssued.toLocaleString();
    var mSubEl = document.getElementById('masterPfMonthIssuedSub');
    if (mSubEl) mSubEl.textContent = curMonthNum + '월 신규 발급 (' + monthIssued.toLocaleString() + '건)';

    var tCountEl = document.getElementById('masterPfTotalIssuedCount');
    if (tCountEl) tCountEl.textContent = totalIssued.toLocaleString();
    var tSubEl = document.getElementById('masterPfTotalIssuedSub');
    if (tSubEl) tSubEl.textContent = '전국 누적 ' + totalIssued.toLocaleString() + '건 통합 관리 중';

    var avgQuizEl = document.getElementById('masterPfAvgQuizScore');
    if (avgQuizEl) avgQuizEl.textContent = String(avgQuiz);
    var avgBookSubEl = document.getElementById('masterPfAvgBookSub');
    if (avgBookSubEl) avgBookSubEl.textContent = '포함 완독 도서 총 ' + totalBooks.toLocaleString() + '권 (평균 ' + avgBooks + '권)';
  }

  // 8. 포트폴리오 리스트 테이블 렌더링 (카톡 발송 버튼 제거)
  function renderMasterPfTable(page) {
    var tbody = document.getElementById('masterPfTableBody');
    if (!tbody) return;

    masterPfPage = page || 1;
    var list = currentFilteredMasterPfList || [];
    var totalCount = list.length;

    var countBadge = document.getElementById('masterPfTotalCount');
    if (countBadge) countBadge.textContent = totalCount.toLocaleString();

    if (totalCount === 0) {
      if (!isMasterPfLoading) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted"><i class="fa-regular fa-folder-open mr-2"></i>선택하신 조건에 일치하는 포트폴리오가 없습니다.</td></tr>';
      }
      renderMasterPfPagination(0, 1);
      return;
    }

    var totalPages = Math.ceil(totalCount / MASTER_PF_PAGE_SIZE);
    if (masterPfPage > totalPages) masterPfPage = totalPages;

    var startIdx = (masterPfPage - 1) * MASTER_PF_PAGE_SIZE;
    var pagedList = list.slice(startIdx, startIdx + MASTER_PF_PAGE_SIZE);

    tbody.innerHTML = pagedList.map(function(pf, idx) {
      var rowNo = totalCount - (startIdx + idx);
      var schoolGrade = [pf.school || '', pf.grade || ''].filter(Boolean).join(' ') || '-';

      return (
        '<tr>' +
          '<td class="text-center"><span class="font-weight-bold text-muted" style="font-size:12px;">' + rowNo + '</span></td>' +
          '<td class="text-center"><span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size:11.5px; max-width:135px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + escapeHtml(pf.academyName) + '">' + escapeHtml(pf.academyName) + '</span></td>' +
          '<td class="text-center"><span class="badge-soft badge-soft-neutral" style="font-size:11px;">' + escapeHtml(pf.classGroup || '미지정') + '</span></td>' +
          '<td class="text-center"><small class="text-muted">' + escapeHtml(schoolGrade) + '</small></td>' +
          '<td><strong style="font-size:13px; color:var(--text-main); cursor:pointer; text-decoration:underline;" data-student-id="' + escapeHtml(pf.studentId) + '" data-pf-id="' + escapeHtml(pf.id) + '" onclick="openMasterPfDetailModal(this.getAttribute(\'data-student-id\'), this.getAttribute(\'data-pf-id\'))">' + escapeHtml(pf.studentName) + '</strong></td>' +
          '<td>' +
            '<div class="font-weight-bold" style="font-size:13px; color:var(--text-main); cursor:pointer;" data-student-id="' + escapeHtml(pf.studentId) + '" data-pf-id="' + escapeHtml(pf.id) + '" onclick="openMasterPfDetailModal(this.getAttribute(\'data-student-id\'), this.getAttribute(\'data-pf-id\'))">' + escapeHtml(pf.title) + '</div>' +
            '<small class="text-muted">' + escapeHtml(pf.period || '') + '</small>' +
          '</td>' +
          '<td class="text-center"><span class="font-weight-bold text-dark">' + Number(pf.bookCount || 0) + '권</span></td>' +
          '<td class="text-center font-weight-bold" style="color:#2f5436;">' + escapeHtml(pf.quizAvg || '-') + '</td>' +
          '<td class="text-center text-muted" style="font-size:12px; white-space:nowrap;">' + escapeHtml(pf.issueDate || '-') + '</td>' +
          '<td class="text-center" style="white-space:nowrap;">' +
            '<button type="button" class="btn btn-xs btn-beige-primary mr-1" data-student-id="' + escapeHtml(pf.studentId) + '" data-pf-id="' + escapeHtml(pf.id) + '" onclick="openMasterPfDetailModal(this.getAttribute(\'data-student-id\'), this.getAttribute(\'data-pf-id\'))" style="border-radius:6px; font-size:11.5px; padding:4px 9px; font-weight:600;">' +
              '<i class="fa-solid fa-file-lines mr-1"></i>상세보기' +
            '</button>' +
            '<button type="button" class="btn btn-xs btn-outline-secondary" data-student-id="' + escapeHtml(pf.studentId) + '" data-pf-id="' + escapeHtml(pf.id) + '" onclick="printMasterPortfolio(this.getAttribute(\'data-student-id\'), this.getAttribute(\'data-pf-id\'))" style="border-radius:6px; font-size:11.5px; padding:4px 8px;" title="리포트 인쇄">' +
              '<i class="fa-solid fa-print"></i>' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');

    renderMasterPfPagination(totalPages, masterPfPage);
  }

  // 9. 페이지네이션
  function renderMasterPfPagination(totalPages, curPage) {
    var container = document.getElementById('masterPfPagination');
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    var startPage = Math.max(1, curPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    var html = '';
    html += '<button type="button" class="btn btn-xs btn-light border" ' +
      (curPage <= 1 ? 'disabled' : 'onclick="renderMasterPfTable(' + (curPage - 1) + ')"') +
      ' style="border-radius:6px; min-width:30px; height:30px;"><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>';

    for (var p = startPage; p <= endPage; p++) {
      var active = p === curPage;
      html += '<button type="button" class="btn btn-xs ' + (active ? 'btn-beige-primary font-weight-bold' : 'btn-light border') + '" ' +
        'onclick="renderMasterPfTable(' + p + ')" style="border-radius:6px; min-width:30px; height:30px;">' + p + '</button>';
    }

    html += '<button type="button" class="btn btn-xs btn-light border" ' +
      (curPage >= totalPages ? 'disabled' : 'onclick="renderMasterPfTable(' + (curPage + 1) + ')"') +
      ' style="border-radius:6px; min-width:30px; height:30px;"><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>';
    container.innerHTML = html;
  }

  // 10. 포트폴리오 상세 리포트 모달 열기 (단건 API 조회 후 상세 렌더링)
  async function openMasterPfDetailModal(studentId, pfId) {
    if (!pfId) return;
    var rowPf = (currentFilteredMasterPfList || []).find(function(p) { return String(p.id) === String(pfId); });
    if (!rowPf) return;

    currentOpenMasterPfId = String(pfId);
    var cached = currentPfDetailCache[String(pfId)] || null;
    renderMasterPortfolioModal(cached || rowPf);

    if (typeof $ === 'function') {
      $('#masterPortfolioReportModal').modal('show');
    }

    var loadingEl = document.getElementById('masterPfModalLoading');
    if (isRemoteServerMode() && !cached && window.NanoPortal && typeof NanoPortal.api === 'function') {
      if (loadingEl) loadingEl.classList.remove('d-none');
      try {
        var qs = 'entity=portfolios&academy=' + encodeURIComponent(rowPf.academyId || 'ALL') + '&id=' + encodeURIComponent(pfId);
        var res = await NanoPortal.api('/api/manage?' + qs);
        var fetched = Array.isArray(res && res.items) ? res.items[0] : null;
        if (fetched) {
          var normalized = normalizeMasterPortfolioItem(fetched, getFranchiseNameMap()) || fetched;
          currentPfDetailCache[String(pfId)] = normalized;
          if (currentOpenMasterPfId === String(pfId)) {
            renderMasterPortfolioModal(normalized);
          }
        }
      } catch (err) {
        if (typeof showMasterToast === 'function') {
          showMasterToast('포트폴리오 상세 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (loadingEl && currentOpenMasterPfId === String(pfId)) {
          loadingEl.classList.add('d-none');
        }
      }
    } else if (loadingEl) {
      loadingEl.classList.add('d-none');
    }
  }

  // 포트폴리오 상세 모달 DOM 바인딩
  function renderMasterPortfolioModal(pf) {
    if (!pf) return;
    var setText = function(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('masterPfModalSubtitle', (pf.academyName || '-') + ' · ' + (pf.studentName || '-') + ' · ' + (pf.issueDate || '-'));
    setText('masterPfModalReportName', pf.title || ((pf.studentName || '원생') + ' 독서 성장 포트폴리오'));
    setText('masterPfModalPeriod', pf.period || '-');
    setText('masterPfModalAcademy', pf.academyName || '-');
    setText('masterPfModalIssueDate', pf.issueDate || '-');
    setText('masterPfModalStudent', (pf.studentName || '-') + ' (' + (pf.classGroup || '미지정') + ')');
    setText('masterPfModalSchool', [pf.school || '', pf.grade || ''].filter(Boolean).join(' ') || '-');

    var books = Array.isArray(pf.books) ? pf.books : [];
    setText('masterPfModalBookCount', (pf.bookCount || books.length) + '권');
    setText('masterPfModalQuizAvg', pf.quizAvg || '-');
    setText('masterPfModalBooksCountBadge', '총 ' + books.length + '권');

    // 독서 역량 성장 관찰 카드
    var insightsSec = document.getElementById('masterPfModalInsightsSection');
    var insightsGrid = document.getElementById('masterPfModalInsightsGrid');
    var insights = [];
    if (Array.isArray(pf.aiInsights) && pf.aiInsights.length > 0) {
      insights = pf.aiInsights;
    } else if (Array.isArray(pf.insights) && pf.insights.length > 0) {
      insights = pf.insights;
    } else if (Array.isArray(pf.aiComments) && pf.aiComments.length > 0) {
      var catNames = ['문해력 & 중심 맥락 파악', '공감 능력 & 정서적 사유', '비판적 사고 & 문제 해결력', '자기표현 & 능동적 독서 태도'];
      insights = pf.aiComments.map(function(txt, idx) {
        return { category: catNames[idx] || '독서 성장 관찰', comment: txt };
      });
    }

    if (insightsSec && insightsGrid) {
      if (insights.length > 0) {
        insightsSec.style.display = 'block';
        insightsGrid.innerHTML = insights.map(function(ins) {
          var cat = (typeof ins === 'object' && ins.category) ? ins.category : '독서 역량 관찰';
          var body = (typeof ins === 'object' && ins.comment) ? ins.comment : String(ins || '');
          return (
            '<div class="master-pf-insight-card">' +
              '<div class="font-weight-bold mb-1" style="font-size:12px; color:#594e44;">' + escapeHtml(cat) + '</div>' +
              '<div style="font-size:12px; line-height:1.55; color:var(--text-main);">' + escapeHtml(body) + '</div>' +
            '</div>'
          );
        }).join('');
      } else {
        insightsSec.style.display = 'none';
        insightsGrid.innerHTML = '';
      }
    }

    // 포함 완독 도서 이력 카드
    var booksGrid = document.getElementById('masterPfModalBooksGrid');
    if (booksGrid) {
      if (books.length === 0) {
        booksGrid.innerHTML =
          '<div style="grid-column: 1 / -1; background:#ffffff; border:1px dashed var(--border-medium); border-radius:12px; padding:18px; text-align:center; font-size:12.5px; color:var(--text-muted);">' +
            '포함된 완독 도서 상세 목록이 없습니다.' +
          '</div>';
      } else {
        booksGrid.innerHTML = books.map(function(b) {
          var cover = resolveSafeBookCover(b.cover || b.coverUrl);
          var pubInfo = [b.pub || b.publisher || '', b.author || ''].filter(Boolean).join(' · ') || '도서';
          var scoreStr = b.score != null && b.score !== '' ? (String(b.score).replace(/점$/, '') + '점') : '-';
          var noteText = String(b.achievement || b.thought || b.comment || '').trim();

          return (
            '<div class="master-pf-book-item">' +
              '<img class="master-pf-book-cover" src="' + escapeHtml(cover) + '" alt="" onerror="this.onerror=null;this.src=\'upload/book/book_default.jpg\';">' +
              '<div style="min-width:0; flex:1;">' +
                '<div class="d-flex justify-content-between align-items-start" style="gap:6px;">' +
                  '<strong class="text-truncate" style="font-size:13px; color:var(--text-main); display:block;" title="' + escapeHtml(b.title || '도서') + '">' + escapeHtml(b.title || '도서') + '</strong>' +
                  '<span class="badge-soft badge-soft-success" style="font-size:10.5px; flex-shrink:0;">' + escapeHtml(scoreStr) + '</span>' +
                '</div>' +
                '<div class="text-muted text-truncate" style="font-size:11px;">' + escapeHtml(pubInfo) + (b.date ? (' · ' + escapeHtml(b.date)) : '') + '</div>' +
                (noteText ? ('<div class="mt-1 p-1 px-2 rounded" style="background:#fbf9f5; font-size:11.5px; color:#594e44; line-height:1.45;">' + escapeHtml(noteText) + '</div>') : '') +
              '</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    // 지도교사 / AI 종합 총평
    var commentCard = document.getElementById('masterPfModalCommentCard');
    var commentTextEl = document.getElementById('masterPfModalCommentText');
    var totalNote = String(pf.comment || pf.aiTeacherNote || pf.teacherNote || '').trim();
    if (commentCard && commentTextEl) {
      if (totalNote) {
        commentCard.style.display = 'block';
        commentTextEl.textContent = totalNote;
      } else {
        commentCard.style.display = 'none';
      }
    }
  }

  // 모달 내 인쇄 실행
  function printCurrentMasterPortfolioModal() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    document.body.classList.add('printing-master-portfolio');
    var cleanup = function() {
      document.body.classList.remove('printing-master-portfolio');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }

  // 목록 행의 인쇄 아이콘 클릭 시 상세 모달 로드 후 인쇄 실행
  async function printMasterPortfolio(studentId, pfId) {
    await openMasterPfDetailModal(studentId, pfId);
    setTimeout(printCurrentMasterPortfolioModal, 180);
  }

  // 11. 필터 초기화
  function resetMasterPfFilters() {
    var aFilter = document.getElementById('masterPfAcademyFilter');
    if (aFilter) aFilter.value = 'ALL';
    syncMasterPfAcademyTriggerLabel('ALL');
    closeMasterPfAcademyDropdown();
    populateMasterPfClassFilter();

    var cFilter = document.getElementById('masterPfClassFilter');
    if (cFilter) cFilter.value = 'ALL';
    var sInput = document.getElementById('masterPfSearchInput');
    if (sInput) sInput.value = '';

    initMasterPfDateFilters(true);
    filterMasterPortfolioList();
  }

  // 전역 등록 (마스터 HTML 및 master-core.js 호환 유지)
  window.initMasterPortfolio = initMasterPortfolio;
  window.initMasterPfDateFilters = initMasterPfDateFilters;
  window.populateMasterPfAcademyFilter = populateMasterPfAcademyFilter;
  window.populateMasterPfClassFilter = populateMasterPfClassFilter;
  window.filterMasterPortfolioList = filterMasterPortfolioList;
  window.scheduleMasterPfSearch = scheduleMasterPfSearch;
  window.resetMasterPfFilters = resetMasterPfFilters;
  window.renderMasterPfTable = renderMasterPfTable;
  window.openMasterPfDetailModal = openMasterPfDetailModal;
  window.printMasterPortfolio = printMasterPortfolio;
  window.printCurrentMasterPortfolioModal = printCurrentMasterPortfolioModal;
  window.toggleMasterPfAcademyDropdown = toggleMasterPfAcademyDropdown;
  window.selectMasterPfAcademyOption = selectMasterPfAcademyOption;

})(window);
