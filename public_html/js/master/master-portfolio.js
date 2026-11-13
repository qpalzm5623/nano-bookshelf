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
  var knownPfClassNamesByAcademy = Object.create(null);
  var pfSearchDebounceTimer = null;
  var appliedMasterPfDates = { startDate: '', endDate: '' };

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
        { title: '오즈의 마법사', pub: '어스본코리아', cover: 'resources/images/book_default.svg', date: '2026-11-10', score: 100, thought: '친구들과 협력하는 과정이 인상 깊었습니다.' },
        { title: '수호의 하얀 말', pub: '한림출판사', cover: 'resources/images/book_default.svg', date: '2026-11-05', score: 80, thought: '하얀 말과의 우정이 감동적이었습니다.' }
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
      return 'resources/images/book_default.svg';
    }
    if (src.charAt(0) === '/' && src.charAt(1) !== '/') {
      src = src.slice(1);
    }
    if (/^(https?:\/\/|data:image\/|upload\/|resources\/|assets\/)/i.test(src)) {
      return src;
    }
    return 'resources/images/book_default.svg';
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
    // 검색 입력창 포커스 시 바깥 카드(.simple-card) 스크롤이 이동해 다른 필터가 가려지는 현상 방지
    var resetToolbarScroll = function() {
      var card = wrapper.closest ? wrapper.closest('.simple-card') : null;
      if (card) { card.scrollTop = 0; card.scrollLeft = 0; }
    };
    resetToolbarScroll();
    if (searchInput) {
      setTimeout(function() {
        try { searchInput.focus({ preventScroll: true }); } catch (e) { searchInput.focus(); }
        resetToolbarScroll();
      }, 10);
    }
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
    var prevVal = (hiddenInput && hiddenInput.value) || 'ALL';
    var nextVal = value || 'ALL';
    if (hiddenInput) hiddenInput.value = nextVal;
    if (prevVal !== nextVal) {
      var classSelect = document.getElementById('masterPfClassFilter');
      if (classSelect) classSelect.value = 'ALL';
    }
    syncMasterPfAcademyTriggerLabel(nextVal);
    closeMasterPfAcademyDropdown();
    populateMasterPfClassFilter();
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

  // 4. 클래스 필터 동적 채우기 (특정 가맹점 선택 시에만 활성화, 전체 가맹점 선택 시 비활성화)
  function populateMasterPfClassFilter(itemsToMerge) {
    if (Array.isArray(itemsToMerge)) {
      itemsToMerge.forEach(function(item) {
        if (!item || !item.classGroup) return;
        var aid = String(item.academyId || '').trim();
        var clsName = String(item.classGroup).trim();
        if (aid && clsName) {
          if (!knownPfClassNamesByAcademy[aid]) {
            knownPfClassNamesByAcademy[aid] = Object.create(null);
          }
          knownPfClassNamesByAcademy[aid][clsName] = true;
        }
      });
    }

    var select = document.getElementById('masterPfClassFilter');
    if (!select) return;
    var academyInput = document.getElementById('masterPfAcademyFilter');
    var selectedAcademy = (academyInput && academyInput.value) || 'ALL';

    if (!selectedAcademy || selectedAcademy === 'ALL') {
      select.disabled = true;
      select.setAttribute('aria-disabled', 'true');
      select.title = '특정 가맹점을 선택하면 클래스 필터가 활성화됩니다.';
      select.innerHTML = '<option value="ALL">가맹점 먼저 선택</option>';
      select.value = 'ALL';
      return;
    }

    var currentVal = select.value || 'ALL';
    select.disabled = false;
    select.setAttribute('aria-disabled', 'false');
    select.title = '선택한 가맹점의 클래스별 필터링';

    var classSet = Object.create(null);
    var academyKnown = knownPfClassNamesByAcademy[selectedAcademy];
    if (academyKnown) {
      Object.keys(academyKnown).forEach(function(c) { classSet[c] = true; });
    }

    var serverClasses = (Array.isArray(window.NANO_SERVER_CLASSES) && window.NANO_SERVER_CLASSES.length > 0)
      ? window.NANO_SERVER_CLASSES
      : (Array.isArray(window.MIGRATED_CLASSES) ? window.MIGRATED_CLASSES : []);
    serverClasses.forEach(function(c) {
      if (!c || !c.name) return;
      if (String(c.academyId || c.academyCode || '').trim() === selectedAcademy) {
        classSet[String(c.name).trim()] = true;
      }
    });

    if (Array.isArray(window.MIGRATED_MEMBERS)) {
      window.MIGRATED_MEMBERS.forEach(function(m) {
        if (!m) return;
        if (String(m.academyId || '').trim() !== selectedAcademy) return;
        if (m.role && m.role !== 'STUDENT' && m.role !== 'student') return;
        var clsName = String(m.classGroup || m.className || '').trim();
        if (clsName) classSet[clsName] = true;
      });
    }

    var sortedClasses = Object.keys(classSet).filter(Boolean).sort(function(a, b) {
      if (a === '미지정') return 1;
      if (b === '미지정') return -1;
      return a.localeCompare(b, 'ko');
    });

    var html = '<option value="ALL">전체 클래스</option>';
    sortedClasses.forEach(function(c) {
      html += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });
    select.innerHTML = html;
    select.value = (sortedClasses.indexOf(currentVal) !== -1) ? currentVal : 'ALL';
  }

  // 5. 발급일자 기본값 초기화 (당월 1일 ~ 오늘 KST)
  function initMasterPfDateFilters(force) {
    var startEl = document.getElementById('masterPfStartDate');
    var endEl = document.getElementById('masterPfEndDate');
    if (!startEl || !endEl) return;

    var todayStr = getTodayYmd();
    var defaultStart = todayStr.slice(0, 7) + '-01';
    var changed = false;
    if (force || !startEl.value) { startEl.value = defaultStart; changed = true; }
    if (force || !endEl.value) { endEl.value = todayStr; changed = true; }
    if (force || changed || (!appliedMasterPfDates.startDate && !appliedMasterPfDates.endDate)) {
      appliedMasterPfDates.startDate = startEl.value || '';
      appliedMasterPfDates.endDate = endEl.value || '';
    }
  }

  // 검색 입력 시 자동 조회하지 않고 조회 버튼 클릭 또는 Enter 시에만 조회합니다.
  function scheduleMasterPfSearch() {
    if (pfSearchDebounceTimer) {
      clearTimeout(pfSearchDebounceTimer);
      pfSearchDebounceTimer = null;
    }
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
  async function filterMasterPortfolioList(options) {
    initMasterPfDateFilters();

    var startEl = document.getElementById('masterPfStartDate');
    var endEl = document.getElementById('masterPfEndDate');
    if (!options || options.applyDates !== false) {
      appliedMasterPfDates.startDate = (startEl && startEl.value) || '';
      appliedMasterPfDates.endDate = (endEl && endEl.value) || '';
    }

    var academyVal = (document.getElementById('masterPfAcademyFilter') && document.getElementById('masterPfAcademyFilter').value) || 'ALL';
    var classSelect = document.getElementById('masterPfClassFilter');
    var classVal = (academyVal !== 'ALL' && classSelect && !classSelect.disabled && classSelect.value)
      ? classSelect.value
      : 'ALL';
    var startVal = appliedMasterPfDates.startDate || '';
    var endVal = appliedMasterPfDates.endDate || '';
    var query = (document.getElementById('masterPfSearchInput') && document.getElementById('masterPfSearchInput').value
      ? document.getElementById('masterPfSearchInput').value.trim()
      : '');

    var franchiseMap = getFranchiseNameMap();

    if (isRemoteServerMode()) {
      if (!window.NanoPortal || typeof NanoPortal.api !== 'function') {
        isMasterPfLoading = false;
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
          // 0건 조회 결과에서도 빈 상태 안내를 그릴 수 있도록 렌더링 직전에 로딩 플래그를 해제합니다.
          if (mySeq === pfSearchSeq) isMasterPfLoading = false;
          renderMasterPfTable(1);
        } catch (err) {
          if (mySeq !== pfSearchSeq) return;
          isMasterPfLoading = false;
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

    isMasterPfLoading = false;

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

  // 포트폴리오 공용 뷰 모드(A4 / 모바일 390px) 전환
  function setMasterPortfolioViewMode(mode) {
    var viewport = document.getElementById('masterPortfolioViewport');
    var btnA4 = document.getElementById('btnMasterPfViewA4');
    var btnMobile = document.getElementById('btnMasterPfViewMobile');
    var isMobile = mode === 'mobile';

    if (viewport) {
      viewport.classList.remove('portfolio-view-a4', 'portfolio-view-mobile');
      viewport.classList.add(isMobile ? 'portfolio-view-mobile' : 'portfolio-view-a4');
    }
    if (btnA4) btnA4.classList.toggle('active', !isMobile);
    if (btnMobile) btnMobile.classList.toggle('active', isMobile);
  }

  function getMasterPfBookCatalog() {
    if (Array.isArray(window.masterBooks) && window.masterBooks.length > 0) {
      return window.masterBooks;
    }
    if (Array.isArray(window.MIGRATED_BOOKS) && window.MIGRATED_BOOKS.length > 0) {
      return window.MIGRATED_BOOKS;
    }
    return [];
  }

  function resolveMasterPfStudentRecord(pf) {
    if (!pf || !Array.isArray(window.MIGRATED_MEMBERS)) return null;
    var studentId = String(pf.studentId || '').trim();
    var memberId = String(pf.memberId || '').trim();
    return window.MIGRATED_MEMBERS.find(function(m) {
      if (!m) return false;
      if (memberId && String(m.id || '') === memberId) return true;
      if (studentId && (String(m.username || '') === studentId || String(m.id || '') === studentId)) return true;
      return false;
    }) || null;
  }

  function resolveMasterPfTeacherName(pf, std) {
    var direct = String((pf && (pf.teacher || pf.teacherName)) || '').trim();
    if (direct && direct !== '미지정' && direct !== '-' && direct.indexOf('미지정') === -1) {
      return direct;
    }
    if (std) {
      var stdTeacher = String(std.teacher || std.teacherName || '').trim();
      if (stdTeacher && stdTeacher !== '미지정' && stdTeacher !== '-' && stdTeacher.indexOf('미지정') === -1) {
        return stdTeacher;
      }
    }
    var classGroup = String((pf && pf.classGroup) || (std && std.classGroup) || '').trim();
    var academyId = String((pf && pf.academyId) || '').trim();
    var classPool = (Array.isArray(window.NANO_SERVER_CLASSES) && window.NANO_SERVER_CLASSES.length > 0)
      ? window.NANO_SERVER_CLASSES
      : (Array.isArray(window.MIGRATED_CLASSES) ? window.MIGRATED_CLASSES : []);
    if (classGroup && classPool.length > 0) {
      var matchedCls = classPool.find(function(c) {
        if (!c || String(c.name || '').trim() !== classGroup) return false;
        if (!academyId || !c.academyId) return true;
        return String(c.academyId) === academyId;
      }) || classPool.find(function(c) {
        return c && String(c.name || '').trim() === classGroup;
      });
      if (matchedCls) {
        var clsTeacher = String(matchedCls.teacherName || matchedCls.teacher || '').trim();
        if (clsTeacher && clsTeacher !== '미지정' && clsTeacher !== '-') {
          return clsTeacher;
        }
      }
    }
    return '미지정';
  }

  // 10. 포트폴리오 상세 리포트 모달 열기 (단건 API 조회 후 상세 렌더링)
  async function openMasterPfDetailModal(studentId, pfId) {
    if (!pfId) return;
    var rowPf = (currentFilteredMasterPfList || []).find(function(p) { return String(p.id) === String(pfId); });
    if (!rowPf) return;

    currentOpenMasterPfId = String(pfId);
    setMasterPortfolioViewMode('a4');
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

  // 포트폴리오 상세 모달 DOM 바인딩 (학원 관리자 공용 #portfolioPrintDoc 렌더러 사용)
  function renderMasterPortfolioModal(pf) {
    if (!pf) return;
    var subtitleEl = document.getElementById('masterPfModalSubtitle');
    if (subtitleEl) {
      subtitleEl.textContent = (pf.academyName || '-') + ' · ' + (pf.studentName || '-') + ' · ' + (pf.issueDate || '-');
    }

    var docContainer = document.getElementById('portfolioPrintDoc');
    if (!docContainer) return;

    var std = resolveMasterPfStudentRecord(pf);
    var teacherName = resolveMasterPfTeacherName(pf, std);
    var books = Array.isArray(pf.books) ? pf.books : [];

    if (window.NanoPortfolioRenderer && typeof window.NanoPortfolioRenderer.renderPortfolioDocument === 'function') {
      var rawSchool = String(pf.school || (std && std.school) || '').trim();
      var rawGrade = String(pf.grade || (std && std.grade) || '').trim();
      var combinedSchool = (rawSchool && rawGrade && rawSchool.indexOf(rawGrade) !== -1)
        ? rawSchool
        : [rawSchool, rawGrade].filter(Boolean).join(' ');

      window.NanoPortfolioRenderer.renderPortfolioDocument(docContainer, {
        pfData: pf,
        std: std,
        studentId: pf.studentId || '',
        pfId: pf.id || '',
        studentName: pf.studentName || '학생',
        schoolGrade: combinedSchool || pf.schoolGrade || '',
        classGroup: pf.classGroup || (std && std.classGroup) || '미지정',
        teacher: teacherName,
        period: pf.period || '-',
        issueDate: pf.issueDate || pf.kstDate || '-',
        books: books,
        quizAvg: pf.quizAvgNum != null ? pf.quizAvgNum : pf.quizAvg,
        loadedLogs: [],
        bookCatalog: getMasterPfBookCatalog(),
        allowTeacherNoteEdit: false,
        allowCoverZoom: false
      });
      return;
    }

    // 공용 렌더러 미로드 환경 대비 최소 폴백
    var fallbackNote = String(pf.teacherNote || pf.comment || pf.aiTeacherNote || '').trim();
    docContainer.innerHTML =
      '<div class="p-4">' +
        '<h4 class="font-weight-bold mb-2">' + escapeHtml(pf.title || ((pf.studentName || '원생') + ' 독서 성장 포트폴리오')) + '</h4>' +
        '<div class="text-muted mb-3" style="font-size:13px;">' + escapeHtml(pf.academyName || '-') + ' · ' + escapeHtml(pf.studentName || '-') + ' (' + escapeHtml(pf.classGroup || '미지정') + ') · ' + escapeHtml(pf.period || '-') + '</div>' +
        '<div class="pf-books-grid-row">' +
          books.map(function(b) {
            return '<div class="p-2 border rounded">' + escapeHtml((b && b.title) || '도서') + '</div>';
          }).join('') +
        '</div>' +
        (fallbackNote ? '<div class="mt-3 p-3 bg-light rounded">' + escapeHtml(fallbackNote) + '</div>' : '') +
      '</div>';
  }

  // 모달 내 인쇄 실행 (학원 관리자와 동일한 격리 A4 iframe 인쇄)
  function printCurrentMasterPortfolioModal() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    var docEl = document.getElementById('portfolioPrintDoc');
    if (docEl && window.NanoPortfolioRenderer && typeof window.NanoPortfolioRenderer.printHtmlInIsolatedFrame === 'function') {
      var printBodyHtml = '<div id="portfolioPrintDoc" class="portfolio-document-view" style="max-width:800px; margin:0 auto; padding:0; background:#ffffff;">' + docEl.innerHTML + '</div>';
      window.NanoPortfolioRenderer.printHtmlInIsolatedFrame(
        printBodyHtml,
        'is-printing-portfolio',
        '나노의 책장 독서 성장 포트폴리오',
        function() {
          if (typeof showMasterToast === 'function') {
            showMasterToast('포트폴리오 인쇄 화면을 준비하지 못했습니다. 다시 시도해 주세요.');
          }
        }
      );
      return;
    }

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
  window.setMasterPortfolioViewMode = setMasterPortfolioViewMode;
  window.printMasterPortfolio = printMasterPortfolio;
  window.printCurrentMasterPortfolioModal = printCurrentMasterPortfolioModal;
  window.toggleMasterPfAcademyDropdown = toggleMasterPfAcademyDropdown;
  window.selectMasterPfAcademyOption = selectMasterPfAcademyOption;

})(window);
