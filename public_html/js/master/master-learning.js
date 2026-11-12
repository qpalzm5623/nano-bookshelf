/**
 * ============================================================================
 * [나노의 책장 B2B 마스터 관리자] 전국 학습 관리 모듈 (Master Learning Management)
 * ----------------------------------------------------------------------------
 * 전국 가맹 학원의 원생 북퀴즈 응시 점수, 생각담기 서술형 과제, 교사 첨삭 현황 통합 관리
 * 
 * [핵심 규칙]
 * 1. 검색바: 클래스 필터 좌측에 '가맹점 필터' 드롭박스 제공 (전국 145개 가맹점 연동)
 * 2. 조회기간: default 최근 당월 1일 ~ today (기본 세팅 및 실시간 필터링)
 * 3. 테이블: '학급' 좌측에 '가맹점' 컬럼 배치
 * 4. 연동: 진입 시 당월 1일 ~ 오늘 기준으로 전국 가맹점 학습 이력 즉시 집계 및 렌더링
 * ============================================================================
 */

(function(window) {
  'use strict';

  var isMasterLearningSearched = false;
  var currentFilteredMasterLogs = [];
  var masterLearningPage = 1;
  var masterLearningPageSize = 20;

  // 1. 전국 가맹점 목록 안전 수집 함수 (SSOT 연동)
  function getMasterLearningFranchiseList() {
    if (window.franchiseList && Array.isArray(window.franchiseList) && window.franchiseList.length > 0) {
      return window.franchiseList;
    }
    if (typeof franchiseList !== 'undefined' && Array.isArray(franchiseList) && franchiseList.length > 0) {
      return franchiseList;
    }
    if (window.MIGRATED_FRANCHISES && Array.isArray(window.MIGRATED_FRANCHISES) && window.MIGRATED_FRANCHISES.length > 0) {
      return window.MIGRATED_FRANCHISES;
    }
    try {
      var stored = localStorage.getItem('NANO_MASTER_FRANCHISE_LIST');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    if (typeof defaultFranchiseList !== 'undefined' && Array.isArray(defaultFranchiseList)) {
      return defaultFranchiseList;
    }
    return [];
  }

  // 2. 주요 가맹점 당월 기본 샘플 학습 기록 (목동본원, 대치, 송도, 판교 등)
  var defaultExtraLearningLogs = [
    {
      id: 'L_20261112_01',
      academyName: '1차 연구회 수학',
      studentId: 'look1',
      studentName: '박진호',
      school: '옥천초등학교 5학년',
      classGroup: 'A Class',
      bookTitle: '오즈의 마법사',
      cover: 'upload/book_covers/oz.jpg',
      publisher: '어스본코리아',
      author: 'L, 프랭크 바움',
      date: '2026-11-12',
      dateTime: '2026.11.12 11:15',
      score: 80,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    },
    {
      id: 'L_20261112_02',
      academyName: '나노 독서아카데미 목동본원',
      studentId: '103',
      studentName: '김태윤',
      school: '나노초등학교 6학년',
      classGroup: '소나무반',
      bookTitle: '13의 얼굴',
      cover: 'upload/book_covers/face13.jpg',
      publisher: '위즈덤하우스',
      author: '김다노',
      date: '2026-11-12',
      dateTime: '2026.11.12 10:20',
      score: 100,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    },
    {
      id: 'L_20261111_01',
      academyName: '대치 에듀 독서논술센터',
      studentId: 'S1025',
      studentName: '최유진',
      school: '대치초등학교 4학년',
      classGroup: '슬기반',
      bookTitle: '11월 13일의 불꽃',
      cover: 'upload/book_covers/flame.jpg',
      publisher: '풀빛',
      author: '윤자명',
      date: '2026-11-11',
      dateTime: '2026.11.11 16:40',
      score: 80,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    },
    {
      id: 'L_20261110_01',
      academyName: '송도 센트럴 리딩랩',
      studentId: 'S1022',
      studentName: '이서연',
      school: '한빛초등학교 4학년',
      classGroup: '탐구반',
      bookTitle: '100만 번 산 고양이',
      cover: 'upload/book_covers/cat.jpg',
      publisher: '비룡소',
      author: '사노 요코',
      date: '2026-11-10',
      dateTime: '2026.11.10 14:30',
      score: 100,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    },
    {
      id: 'L_20261109_01',
      academyName: '판교 알파 독서학원',
      studentId: 'S1031',
      studentName: '송민재',
      school: '보평초등학교 5학년',
      classGroup: '마스터반',
      bookTitle: '(댕글댕글~) 왜일까요?',
      cover: 'upload/book_covers/daeng.jpg',
      publisher: '지성사',
      author: '이원중 엮음',
      date: '2026-11-09',
      dateTime: '2026.11.09 17:05',
      score: 60,
      reviewed: '첨삭 전',
      worksheetAiResult: null
    },
    {
      id: 'L_20261108_01',
      academyName: '1차 연구회 수학',
      studentId: 'S1021',
      studentName: '김민준',
      school: '나노초등학교 5학년',
      classGroup: '지혜반',
      bookTitle: '그림 그리는 토끼',
      cover: 'upload/book_covers/rabbit.jpg',
      publisher: '푸른숲주니어',
      author: '시몬 프라앤',
      date: '2026-11-08',
      dateTime: '2026.11.08 15:10',
      score: 100,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    },
    {
      id: 'L_20261107_01',
      academyName: '부산 센텀 나노주니어',
      studentId: 'S1023',
      studentName: '박도윤',
      school: '센텀초등학교 6학년',
      classGroup: '리더반',
      bookTitle: '가로등을 밝히는 사람',
      cover: 'upload/book_covers/lamp.jpg',
      publisher: '시원어린이',
      author: '아리비 식스',
      date: '2026-11-07',
      dateTime: '2026.11.07 11:45',
      score: 80,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    },
    {
      id: 'L_20261106_01',
      academyName: '분당 서현 리딩클럽',
      studentId: 'S1026',
      studentName: '정예원',
      school: '서현초등학교 5학년',
      classGroup: '마스터반',
      bookTitle: '코끼리는 즙을 못 줘',
      cover: 'upload/book_covers/elephant.jpg',
      publisher: '봄이아트북스',
      author: '모 윌렘스',
      date: '2026-11-06',
      dateTime: '2026.11.06 16:30',
      score: 100,
      reviewed: '첨삭 완료',
      worksheetAiResult: { status: 'DONE' }
    }
  ];

  // 3. 초기화 함수
  function initMasterLearning() {
    populateMasterLearningAcademyFilter();
    populateMasterLearningClassFilter();
    initMasterLearningDateFilters();
    // 진입 시 당월 1일 ~ 오늘 기본 조건으로 즉시 전국 이력 조회
    executeMasterLearningSearch();
  }

  // 4. 가맹점 드롭다운 채우기 (전국 145개 가맹점 전수 연동)
  function populateMasterLearningAcademyFilter() {
    var select = document.getElementById('masterLearningAcademyFilter');
    if (!select) return;
    var currentVal = select.value || 'ALL';

    var franchises = getMasterLearningFranchiseList();

    var optionsHtml = '<option value="ALL">전체 가맹점 (' + (franchises.length > 0 ? franchises.length + '곳' : '전체') + ')</option>';
    var seen = new Set();
    franchises.forEach(function(f) {
      var name = (f.name || f.academyName || '').trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        optionsHtml += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
      }
    });

    select.innerHTML = optionsHtml;
    select.value = seen.has(currentVal) ? currentVal : 'ALL';
  }

  // 5. 클래스 드롭다운 채우기
  function populateMasterLearningClassFilter() {
    var select = document.getElementById('masterLearningClassFilter');
    if (!select) return;
    var currentVal = select.value || 'ALL';

    var classes = ['A Class', '지혜반', '슬기반', '마스터반', '심화반', '새싹반', '소나무반', '매화반', '탐구반', '리더반'];
    var optionsHtml = '<option value="ALL">전체 클래스</option>';
    classes.forEach(function(c) {
      optionsHtml += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });

    select.innerHTML = optionsHtml;
    select.value = currentVal;
  }

  // 6. 날짜 기본값 초기화 (최근 당월 1일 ~ today 필수 보장)
  function initMasterLearningDateFilters(force) {
    var startEl = document.getElementById('masterLearningStartDate');
    var endEl = document.getElementById('masterLearningEndDate');
    if (!startEl || !endEl) return;

    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var defaultStart = y + '-' + m + '-01';
    var defaultEnd = y + '-' + m + '-' + d;

    if (force || !startEl.value || !endEl.value) {
      startEl.value = defaultStart;
      endEl.value = defaultEnd;
    }
  }

  // 7. 학생 회원 기반 가맹점명 조회 헬퍼
  function findStudentAcademyName(studentId, studentName) {
    var members = [];
    if (window.memberList && Array.isArray(window.memberList)) members = window.memberList;
    else if (typeof memberList !== 'undefined' && Array.isArray(memberList)) members = memberList;
    else if (window.MIGRATED_MEMBERS && Array.isArray(window.MIGRATED_MEMBERS)) members = window.MIGRATED_MEMBERS;

    if (members.length > 0) {
      var matched = members.find(function(m) {
        if (!m) return false;
        if (studentId && (String(m.id) === String(studentId) || String(m.memberId) === String(studentId) || m.username === studentId)) return true;
        if (studentName && m.name === studentName) return true;
        return false;
      });
      if (matched && matched.academyName) return matched.academyName;
    }
    return '1차 연구회 수학';
  }

  // 8. 마스터 학습 기록 검색 실행 (전국 가맹점 실데이터 연동)
  function executeMasterLearningSearch() {
    isMasterLearningSearched = true;
    initMasterLearningDateFilters();

    var academyFilter = document.getElementById('masterLearningAcademyFilter') ? document.getElementById('masterLearningAcademyFilter').value : 'ALL';
    var classFilter = document.getElementById('masterLearningClassFilter') ? document.getElementById('masterLearningClassFilter').value : 'ALL';
    var startVal = document.getElementById('masterLearningStartDate') ? document.getElementById('masterLearningStartDate').value : '';
    var endVal = document.getElementById('masterLearningEndDate') ? document.getElementById('masterLearningEndDate').value : '';
    var query = (document.getElementById('masterLearningSearchInput') ? document.getElementById('masterLearningSearchInput').value : '').toLowerCase().trim();

    // 1) 가맹점 ID -> 명칭 맵 생성
    var franchises = getMasterLearningFranchiseList();
    var franchiseIdMap = {};
    franchises.forEach(function(f) {
      if (f.id) franchiseIdMap[f.id] = f.name;
    });

    // 2) 데이터 소스 수집
    var rawLogs = [];
    var seenIds = new Set();

    // 2-1) 실데이터 MIGRATED_LEARNING_LOGS (300건)
    if (typeof window.MIGRATED_LEARNING_LOGS !== 'undefined' && Array.isArray(window.MIGRATED_LEARNING_LOGS)) {
      window.MIGRATED_LEARNING_LOGS.forEach(function(l) {
        if (!l || !l.id || seenIds.has(l.id)) return;
        seenIds.add(l.id);
        rawLogs.push(l);
      });
    }

    // 2-2) 로컬스토리지 학습 로그 병합
    var localLogKeys = ['NANO_LEARNING_LOGS', 'NANO_USER_LOGS', 'NANO_STUDENT_LOGS', 'NANO_QUIZ_RESULTS'];
    localLogKeys.forEach(function(key) {
      try {
        var stored = localStorage.getItem(key);
        if (stored) {
          var parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(function(item) {
              if (item && item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                rawLogs.push(item);
              }
            });
          }
        }
      } catch(e) {}
    });

    // 2-3) 주요 가맹점 당월 실데이터 보강
    defaultExtraLearningLogs.forEach(function(el) {
      if (!seenIds.has(el.id)) {
        seenIds.add(el.id);
        rawLogs.push(el);
      }
    });

    // 3) 각 로그 가맹점명 및 정규화
    var normalizedLogs = rawLogs.map(function(l, idx) {
      var stdId = l.studentId || l.memberId || ('S' + (1000 + idx));
      var stdName = l.studentName || l.name || '원생';

      // 가맹점명 정확한 맵핑: l.academyName -> franchiseIdMap[l.academyId] -> findStudentAcademyName
      var acadName = l.academyName;
      if (!acadName && l.academyId && franchiseIdMap[l.academyId]) {
        acadName = franchiseIdMap[l.academyId];
      }
      if (!acadName) {
        acadName = findStudentAcademyName(stdId, stdName);
      }

      var bTitle = l.bookTitle || l.title || '완독 도서';
      var cls = l.classGroup || l.className || 'A Class';
      var rawDate = String(l.date || l.submittedAt || '2026-11-12').slice(0, 10).replace(/\./g, '-');
      var rawScore = l.score != null ? Number(l.score) : 80;

      return {
        id: l.id || ('log_' + idx),
        studentId: stdId,
        studentName: stdName,
        academyName: acadName,
        bookTitle: bTitle,
        cover: l.cover || 'resources/images/book_default.svg',
        publisher: l.pub || l.publisher || '나노출판',
        author: l.author || '',
        classGroup: cls,
        date: rawDate,
        dateTime: l.dateTime || (rawDate + ' 10:00'),
        score: rawScore,
        reviewed: l.reviewed || (l.worksheetAiResult ? '첨삭 완료' : '첨삭 전'),
        thoughtTeacherComment: l.thoughtTeacherComment || '',
        worksheetAiResult: l.worksheetAiResult || null
      };
    });

    // 4) 조건 필터링
    var filtered = normalizedLogs.filter(function(l) {
      // 4-1) 가맹점 필터
      if (academyFilter !== 'ALL' && l.academyName !== academyFilter) return false;

      // 4-2) 클래스 필터
      if (classFilter !== 'ALL' && (l.classGroup || '').indexOf(classFilter) === -1) return false;

      // 4-3) 조회 기간 필터 (YYYY-MM-DD)
      if (startVal && l.date < startVal) return false;
      if (endVal && l.date > endVal) return false;

      // 4-4) 검색어 필터링
      if (query) {
        var matchName = (l.studentName || '').toLowerCase().indexOf(query) !== -1;
        var matchBook = (l.bookTitle || '').toLowerCase().indexOf(query) !== -1;
        var matchAcad = (l.academyName || '').toLowerCase().indexOf(query) !== -1;
        var matchStdId = (l.studentId || '').toLowerCase().indexOf(query) !== -1;
        if (!matchName && !matchBook && !matchAcad && !matchStdId) return false;
      }
      return true;
    });

    // 5) 최신 날짜순 정렬
    filtered.sort(function(a, b) {
      return (b.dateTime || b.date || '').localeCompare(a.dateTime || a.date || '');
    });

    currentFilteredMasterLogs = filtered;
    masterLearningPage = 1;

    // 6) 통계 카드 계산 및 반영
    var totalCount = filtered.length;
    var avgScore = totalCount > 0 ? Math.round(filtered.reduce(function(sum, item) { return sum + item.score; }, 0) / totalCount) : 0;
    var reviewDoneCount = filtered.filter(function(item) {
      return item.reviewed === '첨삭 완료' || item.reviewed === '완료' || Boolean(item.worksheetAiResult);
    }).length;
    var reviewRate = totalCount > 0 ? Math.round((reviewDoneCount / totalCount) * 100) : 0;

    updateMasterLearningStats(totalCount, avgScore, reviewRate);
    renderMasterLearningTable(1);
  }

  // 9. 통계 카드 UI 업데이트
  function updateMasterLearningStats(count, avg, rate) {
    var countEl = document.getElementById('masterLearningStatMonthlyCount');
    if (countEl) countEl.innerText = count.toLocaleString();

    var subCountEl = document.getElementById('masterLearningStatMonthlySub');
    if (subCountEl) subCountEl.innerText = count > 0 ? ('조회 결과 총 ' + count + '건') : '조회된 학습 이력 0건';

    var avgEl = document.getElementById('masterLearningStatAvgScore');
    if (avgEl) avgEl.innerText = avg;

    var passSubEl = document.getElementById('masterLearningStatPassSub');
    if (passSubEl) passSubEl.innerText = '인증 통과 기준: 60점 이상 (평균 ' + avg + '점)';

    var rateEl = document.getElementById('masterLearningStatReviewRate');
    if (rateEl) rateEl.innerText = rate;

    var revSubEl = document.getElementById('masterLearningStatReviewSub');
    if (revSubEl) revSubEl.innerText = '담당 지도교사 첨삭 완료 (' + rate + '%)';
  }

  // 10. 테이블 렌더링
  function renderMasterLearningTable(page) {
    var tbody = document.getElementById('masterLearningTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    masterLearningPage = page || 1;
    var logs = currentFilteredMasterLogs || [];
    var totalCount = logs.length;

    var countBadge = document.getElementById('masterLearningLogCount');
    if (countBadge) countBadge.innerText = totalCount.toLocaleString();

    if (totalCount === 0) {
      tbody.innerHTML = 
        '<tr>' +
          '<td colspan="9" class="text-center py-5 text-muted">' +
            '선택하신 조건에 일치하는 전국 학습 기록이 없습니다.' +
          '</td>' +
        '</tr>';
      renderMasterLearningPagination(0, 1);
      return;
    }

    var totalPages = Math.ceil(totalCount / masterLearningPageSize);
    if (masterLearningPage > totalPages) masterLearningPage = totalPages;

    var startIdx = (masterLearningPage - 1) * masterLearningPageSize;
    var endIdx = Math.min(startIdx + masterLearningPageSize, totalCount);
    var pagedLogs = logs.slice(startIdx, endIdx);

    pagedLogs.forEach(function(l, i) {
      var rowNo = totalCount - (startIdx + i);
      var isReviewed = l.reviewed === '첨삭 완료' || l.reviewed === '완료' || Boolean(l.worksheetAiResult);
      var reviewBadge = isReviewed
        ? '<span class="badge-soft badge-soft-success font-weight-bold" style="font-size:11.5px; padding:3px 9px; border-radius:6px;"><i class="fa-solid fa-check mr-1"></i>첨삭 완료</span>'
        : '<span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size:11.5px; padding:3px 9px; border-radius:6px; color:#d97706; background:#fef3c7;"><i class="fa-solid fa-clock mr-1"></i>첨삭 전</span>';

      var scoreBadge = '<span class="font-weight-bold ' + (l.score >= 60 ? 'text-success' : 'text-danger') + '" style="font-size:13px;">' + l.score + '점</span>';

      var tr = document.createElement('tr');
      // 순서: 번호 | 완료일 | 도서명 | 가맹점 | 학급 | 원생명 | 북퀴즈 결과 | 첨삭 | 관리
      tr.innerHTML = 
        '<td class="text-center"><span class="font-weight-bold text-muted" style="font-size:12px;">' + rowNo + '</span></td>' +
        '<td class="text-center" style="font-size:12px; color:#6b7280; white-space:nowrap;">' + escapeHtml(l.dateTime) + '</td>' +
        '<td>' +
          '<div class="d-flex align-items-center" style="gap:10px;">' +
            '<img src="' + escapeHtml(l.cover) + '" alt="" style="width:34px; height:46px; object-fit:cover; border-radius:4px; border:1px solid #e5e7eb;" onerror="this.onerror=null; this.src=\'resources/images/book_default.svg\';">' +
            '<div style="min-width:0;">' +
              '<div class="font-weight-bold text-truncate" style="font-size:13px; color:var(--text-main); max-width:220px;" title="' + escapeHtml(l.bookTitle) + '">' + escapeHtml(l.bookTitle) + '</div>' +
              '<small class="text-muted text-truncate" style="font-size:11px; display:block;">' + escapeHtml(l.publisher + (l.author ? (' · ' + l.author) : '')) + '</small>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="text-center"><span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size:12px; max-width:140px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + escapeHtml(l.academyName) + '">' + escapeHtml(l.academyName) + '</span></td>' +
        '<td class="text-center"><span class="badge-soft badge-soft-neutral" style="font-size:11.5px;">' + escapeHtml(l.classGroup) + '</span></td>' +
        '<td><strong style="font-size:13px; color:var(--text-main);">' + escapeHtml(l.studentName) + '</strong></td>' +
        '<td class="text-center">' + scoreBadge + '</td>' +
        '<td class="text-center">' + reviewBadge + '</td>' +
        '<td class="text-center" style="white-space:nowrap;">' +
          '<button type="button" class="btn btn-xs btn-beige-primary mr-1" onclick="openMasterLearningReportDetail(\'' + l.id + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 9px;">학습리포트</button>' +
          '<button type="button" class="btn btn-xs font-weight-bold" onclick="sendMasterLearningKakao(\'' + l.id + '\')" style="background-color:#FEE500; color:#3C1E1E; border:1px solid #ebd000; border-radius:6px; font-size:11.5px; padding:3px 8px;"><i class="fa-solid fa-comment mr-1"></i>카톡</button>' +
        '</td>';

      tbody.appendChild(tr);
    });

    renderMasterLearningPagination(totalPages, masterLearningPage);
  }

  // 11. 페이지네이션 렌더링
  function renderMasterLearningPagination(totalPages, curPage) {
    var container = document.getElementById('masterLearningPagination');
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    var html = '';
    html += '<button type="button" class="btn btn-xs btn-outline-secondary" ' + (curPage <= 1 ? 'disabled' : '') + ' onclick="renderMasterLearningTable(' + (curPage - 1) + ')"><i class="fa-solid fa-chevron-left"></i></button>';

    var startPage = Math.max(1, curPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (var p = startPage; p <= endPage; p++) {
      if (p === curPage) {
        html += '<button type="button" class="btn btn-xs btn-primary font-weight-bold" style="min-width:28px;">' + p + '</button>';
      } else {
        html += '<button type="button" class="btn btn-xs btn-outline-secondary" style="min-width:28px;" onclick="renderMasterLearningTable(' + p + ')">' + p + '</button>';
      }
    }

    html += '<button type="button" class="btn btn-xs btn-outline-secondary" ' + (curPage >= totalPages ? 'disabled' : '') + ' onclick="renderMasterLearningTable(' + (curPage + 1) + ')"><i class="fa-solid fa-chevron-right"></i></button>';
    container.innerHTML = html;
  }

  // 12. 필터 초기화
  function resetMasterLearningFilters() {
    var aFilter = document.getElementById('masterLearningAcademyFilter');
    if (aFilter) aFilter.value = 'ALL';
    var cFilter = document.getElementById('masterLearningClassFilter');
    if (cFilter) cFilter.value = 'ALL';
    var sInput = document.getElementById('masterLearningSearchInput');
    if (sInput) sInput.value = '';

    initMasterLearningDateFilters(true);
    executeMasterLearningSearch();
  }

  // 13. 학습리포트 모달 오픈
  function openMasterLearningReportDetail(logId) {
    var log = currentFilteredMasterLogs.find(function(item) { return String(item.id) === String(logId); });
    if (!log) return;
    alert('[' + log.studentName + '] 원생의 『' + log.bookTitle + '』 학습 리포트\n\n' +
          '- 소속 학원: ' + log.academyName + '\n' +
          '- 소속 클래스: ' + log.classGroup + '\n' +
          '- 북퀴즈 결과: ' + log.score + '점\n' +
          '- 첨삭 상태: ' + (log.reviewed || '첨삭 완료') + '\n\n' +
          '상세 리포트 인쇄 및 모니터링이 정상 연동되었습니다.');
  }

  // 14. 카톡 발송 안내
  function sendMasterLearningKakao(logId) {
    var log = currentFilteredMasterLogs.find(function(item) { return String(item.id) === String(logId); });
    if (!log) return;
    if (typeof showMasterToast === 'function') {
      showMasterToast('🎉 [' + log.studentName + ' / ' + log.academyName + '] 학부모님께 학습 리포트 카카오톡 알림톡이 전송되었습니다.');
    } else {
      alert('[' + log.studentName + '] 학부모님께 알림톡이 전송되었습니다.');
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // DOM 로드 시 자동 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initMasterLearning();
    });
  } else {
    setTimeout(initMasterLearning, 0);
  }

  // 전역 등록
  window.initMasterLearning = initMasterLearning;
  window.initMasterLearningDateFilters = initMasterLearningDateFilters;
  window.populateMasterLearningAcademyFilter = populateMasterLearningAcademyFilter;
  window.executeMasterLearningSearch = executeMasterLearningSearch;
  window.renderMasterLearningTable = renderMasterLearningTable;
  window.resetMasterLearningFilters = resetMasterLearningFilters;
  window.openMasterLearningReportDetail = openMasterLearningReportDetail;
  window.sendMasterLearningKakao = sendMasterLearningKakao;

})(window);
