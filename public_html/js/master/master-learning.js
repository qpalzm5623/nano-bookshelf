/* ============================================================================
 * 나노의 책장 - 마스터 관리자 학습 관리 모듈 (master-learning.js)
 *  - PostgreSQL DB(/api/portal?action=learning) 전국 실시간 학습 이력 조회
 *  - 검색 가능한 커스텀 가맹점 필터 드롭다운 (웜 베이지 디자인)
 *  - 실제 학습 리포트 상세 모달 및 인쇄 지원 (카톡 버튼 제거)
 * ============================================================================ */

(function() {
  var MASTER_LEARNING_PAGE_SIZE = 15;
  var MAX_SERVER_FETCH_PAGES = 6; // 최대 3,000건 (500 * 6)

  var currentFilteredMasterLogs = [];
  var masterLearningCurrentPage = 1;
  var masterReportDetailCache = Object.create(null);
  var currentOpenMasterReportId = null;

  // 중복 호출(초기 탭 진입 시 initMasterLearning + executeMasterLearningSearch 연속 호출) 방지 상태
  var masterLearningSearchSeq = 0;
  var activeSearchKey = '';
  var activeSearchPromise = null;
  var isMasterLearningLoading = false;
  var dropdownEventsBound = false;
  var dropdownFocusedIndex = -1;
  var knownMasterClassNamesByAcademy = Object.create(null);
  var appliedMasterLearningDates = { startDate: '', endDate: '' };

  // 로컬 정적 HTML(서버 미연동) 전용 미리보기 샘플 데이터 — 운영 DB 모드에서는 절대 사용하지 않음
  var OFFLINE_SAMPLE_LOGS = [
    {
      id: 'L_SAMPLE_01',
      academyId: 'ACAD-001',
      academyName: '강남 대치 리딩랩',
      studentId: 'student_demo1',
      studentName: '박지후',
      classGroup: 'A Class',
      school: '대치초등학교 4학년',
      bookId: 'FA000003',
      bookTitle: '오즈의 마법사',
      bookPub: '어스본코리아 · L. 프랭크 바움',
      cover: 'upload/book/book_default.jpg',
      grade: '초등 4학년',
      date: '2026-11-12',
      submittedAt: '2026-11-12T02:15:00.000Z',
      score: 80,
      earnedPoints: 25,
      correctCount: 4,
      isCertified: true,
      sheet: '작성 완료',
      reviewed: '첨삭 완료',
      thoughtQuestion: '도로시와 친구들이 마법사를 만나고 싶어 했던 이유는 무엇인가요?',
      studentThoughtAnswer: '각자 부족하다고 생각했던 지혜와 마음, 용기를 얻고 싶었기 때문입니다.',
      thoughtTeacherComment: '등장인물별 소망을 정확히 짚어내어 정리한 점이 인상적입니다.',
      quizResults: [
        { qNum: 1, question: '도로시가 회오리바람을 타고 도착한 나라는?', userChoiceText: '먼치킨의 나라', correctChoiceText: '먼치킨의 나라', isCorrect: true },
        { qNum: 2, question: '허수아비가 원했던 것은 무엇인가요?', userChoiceText: '뇌(지혜)', correctChoiceText: '뇌(지혜)', isCorrect: true }
      ],
      worksheetPhotos: [],
      worksheetAiResult: null
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

  // 안전한 이미지 URL만 허용
  function resolveSafeCoverUrl(rawUrl, fallbackBook) {
    var src = rawUrl || (fallbackBook && (fallbackBook.cover || fallbackBook.coverUrl)) || '';
    src = String(src || '').trim();
    if (!src) return 'upload/book/book_default.jpg';
    if (/^(javascript|vbscript):/i.test(src)) return 'upload/book/book_default.jpg';
    if (src.charAt(0) === '/' && src.charAt(1) !== '/') {
      src = src.slice(1);
    }
    if (/^(https?:\/\/|data:image\/|upload\/|resources\/|assets\/)/i.test(src)) {
      return src;
    }
    return 'upload/book/book_default.jpg';
  }

  // 원본 나노시트 사진 URL 안전 검증 (data:image/* 또는 허용된 상대/원격 경로)
  function resolveSafePhotoSrc(photo) {
    var raw = typeof photo === 'string' ? photo : (photo && (photo.dataUrl || photo.url || photo.src)) || '';
    raw = String(raw || '').trim();
    if (!raw) return '';
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^\/?(upload|resources)\//i.test(raw)) return raw.charAt(0) === '/' ? raw.slice(1) : raw;
    return '';
  }

  // MIGRATED_BOOKS 인덱스 검색 (도서 표지/출판사/학년 보완용)
  function findMigratedBookMeta(bookId, bookTitle) {
    var books = (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : [];
    if (!books.length) return null;
    if (bookId) {
      var byId = books.find(function(b) { return b.id === bookId || b.bookNo === bookId; });
      if (byId) return byId;
    }
    if (bookTitle) {
      var cleanKey = String(bookTitle).replace(/\s+/g, '').toLowerCase();
      return books.find(function(b) {
        return String(b.title || '').replace(/\s+/g, '').toLowerCase() === cleanKey;
      }) || null;
    }
    return null;
  }

  // KST 날짜·시간 문자열 포맷 (YYYY-MM-DD HH:mm)
  function formatKstDateTime(log) {
    var rawIso = log && (log.submittedAt || log.completedAt);
    if (rawIso) {
      var dt = new Date(rawIso);
      if (!isNaN(dt.getTime())) {
        var kst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
        var iso = kst.toISOString();
        return iso.slice(0, 10) + ' ' + iso.slice(11, 16);
      }
    }
    return (log && log.date) ? String(log.date) : '-';
  }

  // 오늘 날짜 (로컬/KST 기준 YYYY-MM-DD)
  function getTodayYmd() {
    var now = new Date();
    var kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    return kst.toISOString().slice(0, 10);
  }

  // 가맹점 코드 -> 표시명 조회 맵
  function getFranchiseNameMap() {
    var map = Object.create(null);
    var list = getMasterLearningFranchiseList();
    list.forEach(function(f) {
      if (f.id) map[f.id] = f.name;
      if (f.serverId) map[f.serverId] = f.name;
    });
    return map;
  }

  // 1. 가맹점 목록 추출 (전국 활성 가맹점, 중복 제거 및 정렬)
  function getMasterLearningFranchiseList() {
    var list = [];
    if (typeof MIGRATED_FRANCHISES !== 'undefined' && Array.isArray(MIGRATED_FRANCHISES) && MIGRATED_FRANCHISES.length > 0) {
      list = MIGRATED_FRANCHISES;
    } else if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_FRANCHISES) && window.MIGRATED_FRANCHISES.length > 0) {
      list = window.MIGRATED_FRANCHISES;
    } else if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_ACADEMY_OPTIONS) && window.MIGRATED_ACADEMY_OPTIONS.length > 0) {
      list = window.MIGRATED_ACADEMY_OPTIONS;
    } else if (typeof franchiseList !== 'undefined' && Array.isArray(franchiseList) && franchiseList.length > 0) {
      list = franchiseList;
    }

    var seen = Object.create(null);
    var result = [];
    list.forEach(function(f) {
      if (!f) return;
      var code = String(f.id || f.code || '').trim();
      var name = String(f.name || code).trim();
      if (!code || !name || seen[code]) return;
      if (f.deletedAt) return;
      seen[code] = true;
      result.push({
        id: code,
        serverId: f.serverId || '',
        name: name,
        status: f.status || 'ACTIVE'
      });
    });

    // 본사(HQ)를 최상단에 두고 나머지는 가나다순 정렬
    result.sort(function(a, b) {
      if (a.id === 'HQ' && b.id !== 'HQ') return -1;
      if (b.id === 'HQ' && a.id !== 'HQ') return 1;
      return a.name.localeCompare(b.name, 'ko');
    });

    return result;
  }

  // 학습 로그 객체 표준화
  function normalizeMasterLearningLog(raw, franchiseMap) {
    if (!raw || typeof raw !== 'object') return null;
    var bookMeta = (!raw.cover || !raw.bookPub || !raw.grade)
      ? findMigratedBookMeta(raw.bookId, raw.bookTitle)
      : null;

    var academyId = String(raw.academyId || '').trim();
    var resolvedAcademyName = String(raw.academyName || '').trim();
    if (!resolvedAcademyName && academyId && franchiseMap && franchiseMap[academyId]) {
      resolvedAcademyName = franchiseMap[academyId];
    }
    if (!resolvedAcademyName) {
      resolvedAcademyName = academyId || '소속 미지정';
    }

    var bookPub = String(raw.bookPub || '').trim();
    if (!bookPub && bookMeta) {
      bookPub = [bookMeta.publisher, bookMeta.author].filter(Boolean).join(' · ');
    }

    return Object.assign({}, raw, {
      academyId: academyId,
      academyName: resolvedAcademyName,
      classGroup: String(raw.classGroup || '미지정').trim() || '미지정',
      studentName: String(raw.studentName || raw.name || '학생').trim(),
      bookTitle: String(raw.bookTitle || (bookMeta && bookMeta.title) || '도서').trim(),
      bookPub: bookPub || '도서 정보 없음',
      grade: String(raw.grade || (bookMeta && bookMeta.grade) || '').trim(),
      cover: resolveSafeCoverUrl(raw.cover, bookMeta),
      score: Number(raw.score || 0),
      earnedPoints: Number(raw.earnedPoints || 0),
      reviewed: raw.reviewed === '첨삭 완료' ? '첨삭 완료' : (raw.reviewed || '대기'),
      sheet: raw.sheet === '작성 완료' ? '작성 완료' : '작성 전',
      worksheetPhotos: Array.isArray(raw.worksheetPhotos) ? raw.worksheetPhotos : [],
      worksheetPhotoCount: typeof raw.worksheetPhotoCount === 'number'
        ? raw.worksheetPhotoCount
        : (Array.isArray(raw.worksheetPhotos) ? raw.worksheetPhotos.length : 0),
      quizResults: Array.isArray(raw.quizResults) ? raw.quizResults : [],
      formattedDateTime: formatKstDateTime(raw)
    });
  }

  // 2. 마스터 학습 관리 초기화 (학습 관리 탭 최초 진입 시 1회)
  function initMasterLearning() {
    bindMasterAcademyDropdownEvents();
    populateMasterLearningAcademyFilter();
    populateMasterLearningClassFilter();
    initMasterLearningDateFilters();
    executeMasterLearningSearch();
  }

  // 3. 검색형 가맹점 드롭다운 이벤트 바인딩 (1회만 등록)
  function bindMasterAcademyDropdownEvents() {
    if (dropdownEventsBound || typeof document === 'undefined') return;
    dropdownEventsBound = true;

    var searchInput = document.getElementById('masterLearningAcademySearchInput');
    var clearBtn = document.getElementById('masterLearningAcademySearchClear');
    var optionsEl = document.getElementById('masterLearningAcademyOptions');

    if (searchInput) {
      searchInput.addEventListener('input', function() {
        dropdownFocusedIndex = -1;
        if (clearBtn) {
          clearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
        }
        renderMasterAcademyDropdownOptions(searchInput.value);
      });

      searchInput.addEventListener('keydown', function(e) {
        var items = optionsEl ? Array.prototype.slice.call(optionsEl.querySelectorAll('.master-dropdown-item')) : [];
        if (e.key === 'Escape') {
          closeMasterAcademyDropdown();
          var trigger = document.getElementById('masterLearningAcademyTrigger');
          if (trigger) trigger.focus();
          return;
        }
        if (e.key === 'ArrowDown' && items.length) {
          e.preventDefault();
          dropdownFocusedIndex = (dropdownFocusedIndex + 1) % items.length;
          updateDropdownKeyboardFocus(items);
          return;
        }
        if (e.key === 'ArrowUp' && items.length) {
          e.preventDefault();
          dropdownFocusedIndex = dropdownFocusedIndex <= 0 ? items.length - 1 : dropdownFocusedIndex - 1;
          updateDropdownKeyboardFocus(items);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (items.length) {
            var target = items[dropdownFocusedIndex >= 0 ? dropdownFocusedIndex : 0];
            if (target) selectMasterAcademyOption(target.getAttribute('data-value') || 'ALL');
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
        dropdownFocusedIndex = -1;
        renderMasterAcademyDropdownOptions('');
      });
    }

    if (optionsEl) {
      optionsEl.addEventListener('click', function(e) {
        var btn = e.target && e.target.closest ? e.target.closest('.master-dropdown-item') : null;
        if (!btn) return;
        e.stopPropagation();
        selectMasterAcademyOption(btn.getAttribute('data-value') || 'ALL');
      });
    }

    document.addEventListener('click', function(e) {
      var wrapper = document.getElementById('masterLearningAcademyDropdown');
      if (!wrapper || !wrapper.classList.contains('is-open')) return;
      if (!wrapper.contains(e.target)) {
        closeMasterAcademyDropdown();
      }
    });
  }

  function updateDropdownKeyboardFocus(items) {
    items.forEach(function(item, idx) {
      if (idx === dropdownFocusedIndex) {
        item.classList.add('is-focused');
        if (typeof item.scrollIntoView === 'function') {
          item.scrollIntoView({ block: 'nearest' });
        }
      } else {
        item.classList.remove('is-focused');
      }
    });
  }

  function toggleMasterAcademyDropdown(event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    var wrapper = document.getElementById('masterLearningAcademyDropdown');
    if (!wrapper) return;
    if (wrapper.classList.contains('is-open')) {
      closeMasterAcademyDropdown();
    } else {
      openMasterAcademyDropdown();
    }
  }

  function openMasterAcademyDropdown() {
    var wrapper = document.getElementById('masterLearningAcademyDropdown');
    var trigger = document.getElementById('masterLearningAcademyTrigger');
    var searchInput = document.getElementById('masterLearningAcademySearchInput');
    var clearBtn = document.getElementById('masterLearningAcademySearchClear');
    if (!wrapper) return;

    dropdownFocusedIndex = -1;
    if (searchInput) {
      searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
    }
    renderMasterAcademyDropdownOptions('');
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

  function closeMasterAcademyDropdown() {
    var wrapper = document.getElementById('masterLearningAcademyDropdown');
    var trigger = document.getElementById('masterLearningAcademyTrigger');
    if (!wrapper) return;
    wrapper.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    dropdownFocusedIndex = -1;
  }

  function syncMasterAcademyTriggerLabel(selectedVal) {
    var franchises = getMasterLearningFranchiseList();
    var labelEl = document.getElementById('masterLearningAcademyLabel');
    var hiddenInput = document.getElementById('masterLearningAcademyFilter');
    var count = franchises.length;
    var val = selectedVal || (hiddenInput ? hiddenInput.value : 'ALL') || 'ALL';

    if (!labelEl) return;
    if (val === 'ALL') {
      labelEl.textContent = count > 0 ? ('전체 가맹점 (' + count + '곳)') : '전체 가맹점';
      return;
    }
    var matched = franchises.find(function(f) { return f.id === val || f.name === val; });
    labelEl.textContent = matched ? matched.name : val;
  }

  function renderMasterAcademyDropdownOptions(keyword) {
    var optionsEl = document.getElementById('masterLearningAcademyOptions');
    var hiddenInput = document.getElementById('masterLearningAcademyFilter');
    if (!optionsEl) return;

    var franchises = getMasterLearningFranchiseList();
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

    if (htmlParts.length === 0) {
      optionsEl.innerHTML = '<div class="master-dropdown-empty"><i class="fa-regular fa-circle-xmark mr-1"></i>일치하는 가맹점이 없습니다.</div>';
    } else {
      optionsEl.innerHTML = htmlParts.join('');
    }
  }

  function selectMasterAcademyOption(value) {
    var hiddenInput = document.getElementById('masterLearningAcademyFilter');
    var prevVal = (hiddenInput && hiddenInput.value) || 'ALL';
    var nextVal = value || 'ALL';
    if (hiddenInput) {
      hiddenInput.value = nextVal;
    }
    if (prevVal !== nextVal) {
      var classSelect = document.getElementById('masterLearningClassFilter');
      if (classSelect) classSelect.value = 'ALL';
    }
    syncMasterAcademyTriggerLabel(nextVal);
    closeMasterAcademyDropdown();
    populateMasterLearningClassFilter();
    executeMasterLearningSearch({ applyDates: false });
  }

  // 4. 가맹점 드롭다운 채우기 (전국 활성 가맹점 연동)
  function populateMasterLearningAcademyFilter() {
    bindMasterAcademyDropdownEvents();
    var franchises = getMasterLearningFranchiseList();
    var hiddenInput = document.getElementById('masterLearningAcademyFilter');
    var currentVal = (hiddenInput && hiddenInput.value) || 'ALL';

    if (currentVal !== 'ALL' && !franchises.some(function(f) { return f.id === currentVal || f.name === currentVal; })) {
      currentVal = 'ALL';
      if (hiddenInput) hiddenInput.value = 'ALL';
    }
    syncMasterAcademyTriggerLabel(currentVal);
    renderMasterAcademyDropdownOptions('');

    // 상단 안내 배지 가맹점 수를 실제 가맹점 수로 동기화
    var hintEl = document.querySelector('#tab-master-learning small.text-muted');
    if (hintEl && franchises.length > 0 && hintEl.textContent.indexOf('가맹점의 실시간 학습 이력') !== -1) {
      hintEl.innerHTML = '<i class="fa-solid fa-circle-check text-success mr-1"></i>전국 ' + franchises.length + '개 가맹점의 실시간 학습 이력이 연동됩니다.';
    }
  }

  // 5. 클래스 필터 동적 채우기 (특정 가맹점 선택 시에만 활성화, 전체 가맹점 선택 시 비활성화)
  function populateMasterLearningClassFilter(logsToMerge) {
    if (Array.isArray(logsToMerge)) {
      logsToMerge.forEach(function(l) {
        if (!l || !l.classGroup) return;
        var aid = String(l.academyId || '').trim();
        var clsName = String(l.classGroup).trim();
        if (aid && clsName) {
          if (!knownMasterClassNamesByAcademy[aid]) {
            knownMasterClassNamesByAcademy[aid] = Object.create(null);
          }
          knownMasterClassNamesByAcademy[aid][clsName] = true;
        }
      });
    }

    var select = document.getElementById('masterLearningClassFilter');
    if (!select) return;
    var academyInput = document.getElementById('masterLearningAcademyFilter');
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
    var academyKnown = knownMasterClassNamesByAcademy[selectedAcademy];
    if (academyKnown) {
      Object.keys(academyKnown).forEach(function(c) { classSet[c] = true; });
    }

    if (typeof window !== 'undefined') {
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
    }

    var sortedClasses = Object.keys(classSet).filter(Boolean).sort(function(a, b) {
      if (a === '미지정') return 1;
      if (b === '미지정') return -1;
      return a.localeCompare(b, 'ko');
    });

    var html = '<option value="ALL">전체 클래스</option>';
    sortedClasses.forEach(function(cls) {
      html += '<option value="' + escapeHtml(cls) + '">' + escapeHtml(cls) + '</option>';
    });
    select.innerHTML = html;
    select.value = (sortedClasses.indexOf(currentVal) !== -1) ? currentVal : 'ALL';
  }

  // 6. 날짜 필터 초기화 (기본: 당월 1일 ~ 오늘 KST 기준)
  function initMasterLearningDateFilters() {
    var startEl = document.getElementById('masterLearningStartDate');
    var endEl = document.getElementById('masterLearningEndDate');
    if (!startEl || !endEl) return;

    var todayStr = getTodayYmd();
    var firstDayStr = todayStr.slice(0, 7) + '-01';
    if (!startEl.value) startEl.value = firstDayStr;
    if (!endEl.value) endEl.value = todayStr;
    appliedMasterLearningDates.startDate = startEl.value || '';
    appliedMasterLearningDates.endDate = endEl.value || '';
  }

  // 서버에서 전국 또는 선택 가맹점 학습 이력 조회
  async function fetchMasterLearningLogsFromServer(params) {
    if (!window.NanoPortal || typeof NanoPortal.api !== 'function') {
      throw new Error('포털 API 클라이언트를 사용할 수 없습니다.');
    }

    var collected = [];
    var cursor = '';
    var pageCount = 0;

    do {
      var qs = [
        'action=learning',
        'summary=1',
        'limit=500',
        'academy=' + encodeURIComponent(params.academy || 'ALL')
      ];
      if (params.classGroup && params.classGroup !== 'ALL') {
        qs.push('classGroup=' + encodeURIComponent(params.classGroup));
      }
      if (params.startDate) qs.push('startDate=' + encodeURIComponent(params.startDate));
      if (params.endDate) qs.push('endDate=' + encodeURIComponent(params.endDate));
      if (params.searchQuery) qs.push('search=' + encodeURIComponent(params.searchQuery));
      if (cursor) qs.push('cursor=' + encodeURIComponent(cursor));

      var res = await NanoPortal.api('/api/portal?' + qs.join('&'));
      var batch = Array.isArray(res && res.logs) ? res.logs : [];
      collected = collected.concat(batch);
      cursor = (res && res.nextCursor) ? String(res.nextCursor) : '';
      pageCount++;
    } while (cursor && pageCount < MAX_SERVER_FETCH_PAGES);

    return collected;
  }

  // 로딩 상태 테이블 렌더링
  function renderMasterLearningLoadingState() {
    var tbody = document.getElementById('masterLearningTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center py-5 text-muted">' +
        '<div class="spinner-border spinner-border-sm text-secondary mr-2" role="status"></div>' +
        '<span style="font-size: 13px; font-weight: 600;">DB에서 전국 학습 이력을 불러오는 중입니다...</span>' +
      '</td></tr>';
  }

  // 에러 상태 테이블 렌더링
  function renderMasterLearningErrorState(message) {
    var tbody = document.getElementById('masterLearningTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center py-5 text-danger">' +
        '<i class="fa-solid fa-triangle-exclamation mr-2"></i>' +
        escapeHtml(message || '학습 이력을 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.') +
      '</td></tr>';
  }

  // 7. 마스터 학습 이력 통합 조회 (서버 DB 우선 / 로컬 프리뷰 분리, 날짜는 조회 버튼 클릭 시 반영)
  async function executeMasterLearningSearch(options) {
    var academyInput = document.getElementById('masterLearningAcademyFilter');
    var classSelect = document.getElementById('masterLearningClassFilter');
    var startEl = document.getElementById('masterLearningStartDate');
    var endEl = document.getElementById('masterLearningEndDate');
    var searchInput = document.getElementById('masterLearningSearchInput');

    if (!options || options.applyDates !== false) {
      appliedMasterLearningDates.startDate = (startEl && startEl.value) || '';
      appliedMasterLearningDates.endDate = (endEl && endEl.value) || '';
    }

    var academyFilter = (academyInput && academyInput.value) || 'ALL';
    var classFilter = (academyFilter !== 'ALL' && classSelect && !classSelect.disabled && classSelect.value)
      ? classSelect.value
      : 'ALL';
    var startDate = appliedMasterLearningDates.startDate || '';
    var endDate = appliedMasterLearningDates.endDate || '';
    var searchQuery = (searchInput && searchInput.value ? searchInput.value.trim() : '');

    var franchiseMap = getFranchiseNameMap();

    if (isRemoteServerMode()) {
      var requestParams = {
        academy: academyFilter,
        classGroup: classFilter,
        startDate: startDate,
        endDate: endDate,
        searchQuery: searchQuery
      };
      var queryKey = JSON.stringify(requestParams);

      // 동일한 조건으로 이미 조회 중이면 기존 요청을 재사용하여 중복 트래픽 차단
      if (activeSearchPromise && activeSearchKey === queryKey) {
        return activeSearchPromise;
      }

      var mySeq = ++masterLearningSearchSeq;
      activeSearchKey = queryKey;
      isMasterLearningLoading = true;
      renderMasterLearningLoadingState();

      var task = (async function() {
        try {
          var serverLogs = await fetchMasterLearningLogsFromServer(requestParams);
          if (mySeq !== masterLearningSearchSeq) return;

          var normalized = serverLogs
            .map(function(item) { return normalizeMasterLearningLog(item, franchiseMap); })
            .filter(Boolean);

          normalized.sort(function(a, b) {
            return String(b.submittedAt || b.date || '').localeCompare(String(a.submittedAt || a.date || '')) ||
              String(b.id).localeCompare(String(a.id));
          });

          currentFilteredMasterLogs = normalized;
          masterLearningCurrentPage = 1;
          populateMasterLearningClassFilter(normalized);
          updateMasterLearningStats(currentFilteredMasterLogs, startDate, endDate);
          renderMasterLearningTable();
        } catch (err) {
          if (mySeq !== masterLearningSearchSeq) return;
          currentFilteredMasterLogs = [];
          masterLearningCurrentPage = 1;
          updateMasterLearningStats([], startDate, endDate);
          renderMasterLearningErrorState(err && err.message ? err.message : '학습 이력 조회 중 오류가 발생했습니다.');
          var countEl = document.getElementById('masterLearningLogCount');
          if (countEl) countEl.textContent = '0';
          var pagEl = document.getElementById('masterLearningPagination');
          if (pagEl) pagEl.innerHTML = '';
        } finally {
          if (activeSearchKey === queryKey) {
            activeSearchKey = '';
            activeSearchPromise = null;
          }
          if (mySeq === masterLearningSearchSeq) {
            isMasterLearningLoading = false;
          }
        }
      })();

      activeSearchPromise = task;
      return task;
    }

    // 로컬 정적 HTML(서버 미연동) 미리보기 폴백
    var rawLogs = (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_LEARNING_LOGS) && window.MIGRATED_LEARNING_LOGS.length > 0)
      ? window.MIGRATED_LEARNING_LOGS.slice()
      : OFFLINE_SAMPLE_LOGS.slice();

    var localNormalized = rawLogs
      .map(function(item) { return normalizeMasterLearningLog(item, franchiseMap); })
      .filter(Boolean);

    var qLower = searchQuery.toLowerCase();
    var filtered = localNormalized.filter(function(l) {
      if (academyFilter !== 'ALL' && l.academyId !== academyFilter && l.academyName !== academyFilter) return false;
      if (classFilter !== 'ALL' && l.classGroup !== classFilter) return false;
      if (startDate && l.date < startDate) return false;
      if (endDate && l.date > endDate) return false;
      if (qLower) {
        var matched =
          l.studentName.toLowerCase().indexOf(qLower) !== -1 ||
          String(l.studentId || '').toLowerCase().indexOf(qLower) !== -1 ||
          l.bookTitle.toLowerCase().indexOf(qLower) !== -1 ||
          l.academyName.toLowerCase().indexOf(qLower) !== -1;
        if (!matched) return false;
      }
      return true;
    });

    filtered.sort(function(a, b) {
      return String(b.submittedAt || b.date || '').localeCompare(String(a.submittedAt || a.date || ''));
    });

    currentFilteredMasterLogs = filtered;
    masterLearningCurrentPage = 1;
    populateMasterLearningClassFilter(filtered);
    updateMasterLearningStats(currentFilteredMasterLogs, startDate, endDate);
    renderMasterLearningTable();
  }

  // 8. 상단 KPI 요약 지표 실시간 동기화
  function updateMasterLearningStats(logs, startDate, endDate) {
    var countEl = document.getElementById('masterLearningStatMonthlyCount');
    var subEl = document.getElementById('masterLearningStatMonthlySub');
    var avgEl = document.getElementById('masterLearningStatAvgScore');
    var passSubEl = document.getElementById('masterLearningStatPassSub');
    var reviewRateEl = document.getElementById('masterLearningStatReviewRate');
    var reviewSubEl = document.getElementById('masterLearningStatReviewSub');

    var total = logs.length;
    if (countEl) countEl.textContent = total.toLocaleString();
    if (subEl) {
      if (startDate && endDate) {
        subEl.textContent = '조회 기간 (' + startDate + ' ~ ' + endDate + ')';
      } else {
        subEl.textContent = '전체 기간 조회 결과';
      }
    }

    if (total === 0) {
      if (avgEl) avgEl.textContent = '0';
      if (passSubEl) passSubEl.textContent = '인증 통과 기준: 60점 이상 (0건)';
      if (reviewRateEl) reviewRateEl.textContent = '0';
      if (reviewSubEl) reviewSubEl.textContent = '첨삭 완료 0건 / 총 0건';
      return;
    }

    var sumScore = 0;
    var passCount = 0;
    var reviewedCount = 0;
    logs.forEach(function(l) {
      var s = Number(l.score || 0);
      sumScore += s;
      if (s >= 60) passCount++;
      if (l.reviewed === '첨삭 완료') reviewedCount++;
    });

    var avg = Math.round(sumScore / total);
    var passRate = Math.round((passCount / total) * 100);
    var revRate = Math.round((reviewedCount / total) * 100);

    if (avgEl) avgEl.textContent = String(avg);
    if (passSubEl) passSubEl.textContent = '완독 인증 ' + passCount.toLocaleString() + '건 (' + passRate + '%)';
    if (reviewRateEl) reviewRateEl.textContent = String(revRate);
    if (reviewSubEl) reviewSubEl.textContent = '첨삭 완료 ' + reviewedCount.toLocaleString() + '건 / 총 ' + total.toLocaleString() + '건';
  }

  // 9. 테이블 렌더링
  function renderMasterLearningTable() {
    var tbody = document.getElementById('masterLearningTableBody');
    var countEl = document.getElementById('masterLearningLogCount');
    if (!tbody) return;

    var total = currentFilteredMasterLogs.length;
    if (countEl) countEl.textContent = total.toLocaleString();

    if (total === 0) {
      if (!isMasterLearningLoading) {
        tbody.innerHTML =
          '<tr><td colspan="9" class="text-center py-5 text-muted">' +
            '<i class="fa-regular fa-folder-open mr-2" style="font-size: 16px;"></i>조건에 일치하는 학습 이력이 없습니다.' +
          '</td></tr>';
      }
      renderMasterLearningPagination();
      return;
    }

    var startIdx = (masterLearningCurrentPage - 1) * MASTER_LEARNING_PAGE_SIZE;
    var pageLogs = currentFilteredMasterLogs.slice(startIdx, startIdx + MASTER_LEARNING_PAGE_SIZE);

    tbody.innerHTML = pageLogs.map(function(l, idx) {
      var num = total - (startIdx + idx);
      var coverSrc = escapeHtml(resolveSafeCoverUrl(l.cover));
      var scoreVal = Number(l.score || 0);
      var scoreColor = scoreVal >= 60 ? '#2f5436' : '#962a22';
      var reviewBadge = l.reviewed === '첨삭 완료'
        ? '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>첨삭 완료</span>'
        : '<span class="badge-soft badge-soft-warn"><i class="fa-regular fa-clock mr-1"></i>첨삭 전</span>';

      return (
        '<tr>' +
          '<td class="text-muted font-weight-bold" style="font-size:12px;">' + num + '</td>' +
          '<td style="font-size:12px; color:#64748b; white-space:nowrap;">' + escapeHtml(l.formattedDateTime || l.date || '-') + '</td>' +
          '<td style="text-align:left;">' +
            '<div class="d-flex align-items-center" style="gap: 10px; min-width: 180px;">' +
              '<img src="' + coverSrc + '" alt="" onerror="this.onerror=null;this.src=\'upload/book/book_default.jpg\';" ' +
                'style="width:32px; height:44px; object-fit:cover; border-radius:4px; border:1px solid var(--border-light); flex-shrink:0; background:#f5f1ea;">' +
              '<div style="min-width:0;">' +
                '<div class="font-weight-bold text-dark text-truncate" style="font-size:13px; max-width:240px;" title="' + escapeHtml(l.bookTitle) + '">' + escapeHtml(l.bookTitle) + '</div>' +
                '<small class="text-muted text-truncate d-block" style="font-size:11px; max-width:240px;">' + escapeHtml(l.bookPub) + '</small>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size:11px; max-width:135px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;" title="' + escapeHtml(l.academyName) + '">' + escapeHtml(l.academyName) + '</span></td>' +
          '<td><span class="badge-soft badge-soft-neutral" style="font-size:11px;">' + escapeHtml(l.classGroup || '미지정') + '</span></td>' +
          '<td class="font-weight-bold" style="color:var(--text-main);" title="' + escapeHtml(l.studentId || '') + '">' + escapeHtml(l.studentName) + '</td>' +
          '<td><strong style="font-size:13px; color:' + scoreColor + ';">' + scoreVal + '점</strong></td>' +
          '<td>' + reviewBadge + '</td>' +
          '<td class="text-center" style="white-space:nowrap;">' +
            '<button type="button" class="btn btn-xs btn-beige-primary" data-log-id="' + escapeHtml(String(l.id)) + '" ' +
              'onclick="openMasterLearningReportDetail(this.getAttribute(\'data-log-id\'))" ' +
              'style="border-radius:6px; font-size:11.5px; padding:4px 10px; font-weight:600;">' +
              '<i class="fa-solid fa-file-lines mr-1"></i>학습리포트' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');

    renderMasterLearningPagination();
  }

  // 10. 페이지네이션 렌더링 및 페이지 이동
  function renderMasterLearningPagination() {
    var pagEl = document.getElementById('masterLearningPagination');
    if (!pagEl) return;

    var totalPages = Math.ceil(currentFilteredMasterLogs.length / MASTER_LEARNING_PAGE_SIZE);
    if (totalPages <= 1) {
      pagEl.innerHTML = '';
      return;
    }

    var startPage = Math.max(1, masterLearningCurrentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    var html = '';
    html += '<button type="button" class="btn btn-xs btn-light border" ' +
      (masterLearningCurrentPage <= 1 ? 'disabled' : 'onclick="changeMasterLearningPage(' + (masterLearningCurrentPage - 1) + ')"') +
      ' style="border-radius:6px; min-width:30px; height:30px;"><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>';

    for (var p = startPage; p <= endPage; p++) {
      var active = p === masterLearningCurrentPage;
      html += '<button type="button" class="btn btn-xs ' + (active ? 'btn-beige-primary font-weight-bold' : 'btn-light border') + '" ' +
        'onclick="changeMasterLearningPage(' + p + ')" style="border-radius:6px; min-width:30px; height:30px;">' + p + '</button>';
    }

    html += '<button type="button" class="btn btn-xs btn-light border" ' +
      (masterLearningCurrentPage >= totalPages ? 'disabled' : 'onclick="changeMasterLearningPage(' + (masterLearningCurrentPage + 1) + ')"') +
      ' style="border-radius:6px; min-width:30px; height:30px;"><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>';

    pagEl.innerHTML = html;
  }

  function changeMasterLearningPage(page) {
    var totalPages = Math.max(1, Math.ceil(currentFilteredMasterLogs.length / MASTER_LEARNING_PAGE_SIZE));
    var target = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    masterLearningCurrentPage = target;
    renderMasterLearningTable();
  }

  // 11. 필터 초기화
  function resetMasterLearningFilters() {
    var academyInput = document.getElementById('masterLearningAcademyFilter');
    var classEl = document.getElementById('masterLearningClassFilter');
    var startEl = document.getElementById('masterLearningStartDate');
    var endEl = document.getElementById('masterLearningEndDate');
    var searchEl = document.getElementById('masterLearningSearchInput');

    if (academyInput) academyInput.value = 'ALL';
    syncMasterAcademyTriggerLabel('ALL');
    closeMasterAcademyDropdown();
    populateMasterLearningClassFilter();

    if (classEl) classEl.value = 'ALL';
    if (searchEl) searchEl.value = '';

    var todayStr = getTodayYmd();
    if (startEl) startEl.value = todayStr.slice(0, 7) + '-01';
    if (endEl) endEl.value = todayStr;

    executeMasterLearningSearch();
  }

  // 12. 학습 리포트 상세 모달 열기 (필요 시 단건 API로 문항·사진 전체 로드)
  async function openMasterLearningReportDetail(logId) {
    if (!logId) return;
    var rowLog = currentFilteredMasterLogs.find(function(item) { return String(item.id) === String(logId); });
    if (!rowLog) return;

    currentOpenMasterReportId = String(logId);
    var cachedFull = masterReportDetailCache[String(logId)] || null;
    var initialLog = cachedFull || rowLog;

    renderMasterLearningReportModal(initialLog);

    var modalEl = document.getElementById('masterLearningReportModal');
    if (modalEl && typeof $ === 'function') {
      $('#masterLearningReportModal').modal('show');
    }

    // 서버 모드이고 아직 단건 상세를 불러오지 않은 경우 전체 문항/원본 사진을 비동기 로드
    var needsDetailFetch = isRemoteServerMode() && !cachedFull;
    var loadingEl = document.getElementById('masterReportLoadingState');
    if (needsDetailFetch && window.NanoPortal && typeof NanoPortal.api === 'function') {
      if (loadingEl) loadingEl.classList.remove('d-none');
      try {
        var res = await NanoPortal.api('/api/portal?action=learning&id=' + encodeURIComponent(logId));
        var fetched = Array.isArray(res && res.logs) ? res.logs[0] : null;
        if (fetched) {
          var normalizedFull = normalizeMasterLearningLog(fetched, getFranchiseNameMap()) || fetched;
          masterReportDetailCache[String(logId)] = normalizedFull;
          if (currentOpenMasterReportId === String(logId)) {
            renderMasterLearningReportModal(normalizedFull);
          }
        }
      } catch (err) {
        if (typeof showMasterToast === 'function') {
          showMasterToast('상세 이력을 불러오는 중 일부 정보를 가져오지 못했습니다.');
        }
      } finally {
        if (loadingEl && currentOpenMasterReportId === String(logId)) {
          loadingEl.classList.add('d-none');
        }
      }
    } else if (loadingEl) {
      loadingEl.classList.add('d-none');
    }
  }

  // 학습 리포트 모달 DOM 바인딩
  function renderMasterLearningReportModal(log) {
    if (!log) return;

    var setText = function(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('masterReportSubtitle', (log.studentName || '-') + ' · ' + (log.academyName || '-') + ' · ' + (log.formattedDateTime || log.date || '-'));

    var coverImg = document.getElementById('masterReportCoverImg');
    if (coverImg) {
      coverImg.src = resolveSafeCoverUrl(log.cover);
      coverImg.alt = (log.bookTitle || '도서') + ' 표지';
    }

    setText('masterReportBookGrade', log.grade || '학년 미지정');
    setText('masterReportEarnedPoints', (Number(log.earnedPoints || 0)).toLocaleString() + ' P');
    setText('masterReportBookTitle', log.bookTitle || '도서');
    setText('masterReportBookPub', log.bookPub || '출판사 및 저자 정보 없음');
    setText('masterReportAcademy', log.academyName || log.academyId || '-');
    setText('masterReportDate', log.formattedDateTime || log.date || '-');
    setText('masterReportStudent', (log.studentName || '-') + ' (' + (log.classGroup || '미지정') + ')');
    setText('masterReportStudentSub', log.school || log.studentId || '-');

    var score = Number(log.score || 0);
    setText('masterReportScore', score + '점');

    var scoreEl = document.getElementById('masterReportScore');
    var passBadgeEl = document.getElementById('masterReportPassBadge');
    var certBadgeEl = document.getElementById('masterReportCertifiedBadge');
    if (score >= 80) {
      if (scoreEl) scoreEl.style.color = '#2f5436';
      if (passBadgeEl) {
        passBadgeEl.className = 'badge-soft badge-soft-success';
        passBadgeEl.textContent = '우수 완독 인증';
      }
      if (certBadgeEl) {
        certBadgeEl.className = 'badge-soft badge-soft-success font-weight-bold';
        certBadgeEl.textContent = '완독 인증 도서';
      }
    } else if (score >= 60) {
      if (scoreEl) scoreEl.style.color = '#2f5436';
      if (passBadgeEl) {
        passBadgeEl.className = 'badge-soft badge-soft-success';
        passBadgeEl.textContent = '완독 인증 통과';
      }
      if (certBadgeEl) {
        certBadgeEl.className = 'badge-soft badge-soft-success font-weight-bold';
        certBadgeEl.textContent = '완독 인증 도서';
      }
    } else {
      if (scoreEl) scoreEl.style.color = '#962a22';
      if (passBadgeEl) {
        passBadgeEl.className = 'badge-soft badge-soft-danger';
        passBadgeEl.textContent = '미통과 (재도전 권장)';
      }
      if (certBadgeEl) {
        certBadgeEl.className = 'badge-soft badge-soft-warn font-weight-bold';
        certBadgeEl.textContent = '미인증 응시';
      }
    }

    // 북퀴즈 문항별 결과
    var quizzes = Array.isArray(log.quizResults) ? log.quizResults : [];
    var totalQ = quizzes.length;
    var correctQ = quizzes.filter(function(q) { return q && q.isCorrect; }).length;
    var summaryEl = document.getElementById('masterReportQuizSummary');
    var quizContainer = document.getElementById('masterReportQuizDetailContainer');

    if (summaryEl) {
      if (totalQ > 0) {
        var accRate = Math.round((correctQ / totalQ) * 100);
        summaryEl.innerHTML = '총 ' + totalQ + '문항 중 <strong style="color:' + (accRate >= 60 ? '#2f5436' : '#962a22') + ';">' + correctQ + '문항</strong> 정답 (정답률 ' + accRate + '%)';
      } else {
        summaryEl.textContent = '정답 수: ' + Number(log.correctCount || 0) + '문항 (' + score + '점)';
      }
    }

    if (quizContainer) {
      if (totalQ === 0) {
        quizContainer.innerHTML =
          '<div style="grid-column: 1 / -1; background:#ffffff; border:1px dashed var(--border-medium); border-radius:12px; padding:18px; text-align:center; font-size:12.5px; color:var(--text-muted);">' +
            '문항별 상세 답안이 기록되지 않은 학습 이력입니다.' +
          '</div>';
      } else {
        quizContainer.innerHTML = quizzes.map(function(q, idx) {
          var qNum = q.qNum || (idx + 1);
          var isCorrect = Boolean(q.isCorrect);
          var badge = isCorrect
            ? '<span class="badge-soft badge-soft-success" style="font-size:10.5px;">정답</span>'
            : '<span class="badge-soft badge-soft-danger" style="font-size:10.5px;">오답</span>';

          var choicesHtml = isCorrect
            ? '<div class="master-report-choice-box correct">' +
                '<div class="font-weight-bold" style="font-size:11px; color:#2f5436;">학생 선택 답안</div>' +
                '<div class="mt-1" style="color:var(--text-main);">' + escapeHtml(q.userChoiceText || '-') + '</div>' +
              '</div>'
            : '<div class="master-report-choice-box wrong mb-1">' +
                '<div class="font-weight-bold" style="font-size:11px; color:#962a22;">학생 선택 오답</div>' +
                '<div class="mt-1" style="color:#962a22; text-decoration:line-through;">' + escapeHtml(q.userChoiceText || '-') + '</div>' +
              '</div>' +
              '<div class="master-report-choice-box correct">' +
                '<div class="font-weight-bold" style="font-size:11px; color:#2f5436;">실제 정답</div>' +
                '<div class="mt-1 font-weight-bold" style="color:#2f5436;">' + escapeHtml(q.correctChoiceText || '-') + '</div>' +
              '</div>';

          return (
            '<div class="master-report-quiz-card ' + (isCorrect ? 'is-correct' : 'is-wrong') + '">' +
              '<div class="d-flex justify-content-between align-items-center mb-2">' +
                '<strong style="font-size:12px; color:var(--text-muted);">Q' + String(qNum).padStart(2, '0') + ' · 문제 ' + qNum + '</strong>' +
                badge +
              '</div>' +
              '<div class="font-weight-bold mb-2" style="font-size:13px; line-height:1.45; color:var(--text-main);">' + escapeHtml(q.question || '-') + '</div>' +
              choicesHtml +
            '</div>'
          );
        }).join('');
      }
    }

    // 생각 담기 & 교사 코멘트
    var thoughtSec = document.getElementById('masterReportThoughtSection');
    var studentReply = String(log.studentThoughtAnswer || log.thoughtAnswer || '').trim();
    var teacherComment = String(log.thoughtTeacherComment || log.comment || '').trim();
    var thoughtQ = String(log.thoughtQuestion || '').trim();
    var hasThoughtData = Boolean(thoughtQ || studentReply || teacherComment);

    if (thoughtSec) {
      if (!hasThoughtData) {
        thoughtSec.style.display = 'none';
      } else {
        thoughtSec.style.display = 'block';
        setText('masterReportThoughtQuestion', thoughtQ || '책을 읽고 가장 기억에 남는 내용과 느낀 점을 자유롭게 적어보세요.');
        setText('masterReportThoughtAnswer', studentReply || '작성된 원생 답안이 없습니다.');
        var visBadge = document.getElementById('masterReportThoughtVisibilityBadge');
        if (visBadge) {
          visBadge.className = log.thoughtHidden ? 'badge-soft badge-soft-warn' : 'badge-soft badge-soft-success';
          visBadge.textContent = log.thoughtHidden ? '리포트 비공개' : '리포트 포함';
        }
        var commentWrap = document.getElementById('masterReportThoughtCommentWrap');
        if (commentWrap) {
          if (teacherComment) {
            commentWrap.style.display = 'block';
            setText('masterReportThoughtComment', teacherComment);
          } else {
            commentWrap.style.display = 'none';
          }
        }
      }
    }

    // 나노시트 첨삭 및 원본 사진
    var wsSec = document.getElementById('masterReportWorksheetSection');
    var aiRes = log.worksheetAiResult && typeof log.worksheetAiResult === 'object' ? log.worksheetAiResult : null;
    var photos = Array.isArray(log.worksheetPhotos) ? log.worksheetPhotos : [];
    var hasWorksheetSection = Boolean(aiRes || photos.length > 0 || log.sheet === '작성 완료' || log.reviewed === '첨삭 완료');

    if (wsSec) {
      if (!hasWorksheetSection) {
        wsSec.style.display = 'none';
      } else {
        wsSec.style.display = 'block';
        var sheetBadge = document.getElementById('masterReportSheetBadge');
        if (sheetBadge) {
          sheetBadge.className = log.sheet === '작성 완료' ? 'badge-soft badge-soft-success' : 'badge-soft badge-soft-neutral';
          sheetBadge.textContent = log.sheet === '작성 완료' ? '시트 작성 완료' : '시트 작성 전';
        }
        var revBadge = document.getElementById('masterReportReviewBadge');
        if (revBadge) {
          revBadge.className = log.reviewed === '첨삭 완료' ? 'badge-soft badge-soft-success' : 'badge-soft badge-soft-warn';
          revBadge.textContent = log.reviewed === '첨삭 완료' ? '첨삭 완료' : '첨삭 전';
        }

        var photosEl = document.getElementById('masterReportWorksheetPhotos');
        if (photosEl) {
          var safePhotos = photos.map(resolveSafePhotoSrc).filter(Boolean);
          if (safePhotos.length > 0) {
            photosEl.innerHTML = safePhotos.map(function(src, idx) {
              return (
                '<button type="button" class="master-report-photo-btn" data-photo-src="' + escapeHtml(src) + '" onclick="openMasterWorksheetLightbox(this.getAttribute(\'data-photo-src\'))">' +
                  '<img src="' + escapeHtml(src) + '" alt="나노시트 ' + (idx + 1) + '페이지">' +
                  '<span>' + (idx + 1) + '페이지 확대</span>' +
                '</button>'
              );
            }).join('');
          } else {
            photosEl.innerHTML = '<div class="text-muted p-3 rounded w-100 text-center" style="background:#fbf9f5; border:1px dashed var(--border-medium); font-size:12px;">등록된 나노시트 사진이 없습니다.</div>';
          }
        }

        setText(
          'masterReportWorksheetSummary',
          (aiRes && aiRes.summary) || (log.comment && log.comment.trim()) || '아직 AI/지도교사 나노시트 종합 소견이 등록되지 않았습니다.'
        );
        var nextStepEl = document.getElementById('masterReportWorksheetNextStep');
        if (nextStepEl) {
          nextStepEl.innerHTML = '• <strong>이렇게 해보세요:</strong> ' + escapeHtml((aiRes && aiRes.nextStep) || '글의 핵심 이유나 느낀 점을 한 문장 더 구체화해 보세요.');
        }
        var parentGuideEl = document.getElementById('masterReportWorksheetParentGuide');
        if (parentGuideEl) {
          parentGuideEl.innerHTML = '• <strong>가정 대화 가이드:</strong> ' + escapeHtml((aiRes && aiRes.parentGuide) || '아이가 완독 후 정리한 생각을 칭찬하고 인상 깊은 장면을 물어봐 주세요.');
        }
      }
    }
  }

  // 나노시트 원본 이미지 확대 보기
  function openMasterWorksheetLightbox(imgSrc) {
    if (!imgSrc) return;
    var safeSrc = resolveSafePhotoSrc(imgSrc);
    if (!safeSrc) return;
    var img = document.getElementById('masterLearningLightboxImg');
    if (img) img.src = safeSrc;
    if (typeof $ === 'function') {
      $('#masterLearningPhotoLightboxModal').modal('show');
    }
  }

  // 학습 리포트 인쇄
  function printMasterLearningReport() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    document.body.classList.add('printing-master-report');
    var cleanup = function() {
      document.body.classList.remove('printing-master-report');
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('afterprint', cleanup);
      }
    };
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('afterprint', cleanup);
    }
    // 인쇄 전용 2열·페이지 분할 스타일이 적용된 뒤 인쇄 창 호출
    setTimeout(function() {
      window.print();
      setTimeout(cleanup, 1000);
    }, 60);
  }

  // 모달이 열린 상태에서 브라우저 직접 인쇄(Ctrl+P) 시에도 인쇄 레이아웃 유지
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeprint', function() {
      var modal = typeof document !== 'undefined' ? document.getElementById('masterLearningReportModal') : null;
      if (modal && modal.classList && modal.classList.contains('show')) {
        document.body.classList.add('printing-master-report');
      }
    });
    window.addEventListener('afterprint', function() {
      if (typeof document !== 'undefined' && document.body && document.body.classList) {
        document.body.classList.remove('printing-master-report');
      }
    });
  }

  // 전역 함수 바인딩 (마스터 HTML 및 master-core.js 호환 유지)
  window.initMasterLearning = initMasterLearning;
  window.populateMasterLearningAcademyFilter = populateMasterLearningAcademyFilter;
  window.populateMasterLearningClassFilter = populateMasterLearningClassFilter;
  window.initMasterLearningDateFilters = initMasterLearningDateFilters;
  window.executeMasterLearningSearch = executeMasterLearningSearch;
  window.resetMasterLearningFilters = resetMasterLearningFilters;
  window.changeMasterLearningPage = changeMasterLearningPage;
  window.openMasterLearningReportDetail = openMasterLearningReportDetail;
  window.openMasterWorksheetLightbox = openMasterWorksheetLightbox;
  window.printMasterLearningReport = printMasterLearningReport;
  window.toggleMasterAcademyDropdown = toggleMasterAcademyDropdown;
  window.selectMasterAcademyOption = selectMasterAcademyOption;
})();
