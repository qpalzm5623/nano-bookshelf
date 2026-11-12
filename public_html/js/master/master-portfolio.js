/**
 * ============================================================================
 * [나노의 책장 B2B 마스터 관리자] 전국 포트폴리오 관리 모듈 (Master Portfolio Management)
 * ----------------------------------------------------------------------------
 * 전국 가맹 학원의 원생 포트폴리오 발급 내역 및 알림톡 발송 현황 통합 관리
 *
 * [핵심 규칙]
 * 1. 검색바: 클래스 필터 좌측에 '가맹점 필터' 제공
 * 2. 발급일자 필터: default 최근 당월 1일 ~ today
 * 3. 리스트 컬럼 순서: No. | 가맹점 | 소속 클래스 | 학교/학년 | 원생명 | 포트폴리오 명칭 | 포함 완독 도서(권수만) | 북퀴즈 평균 | 발급일자 | 관리
 * 4. 관리 컬럼: 상태 컬럼 제거, 카톡 버튼은 인쇄 버튼 우측에 배치
 * ============================================================================
 */

(function(window) {
  'use strict';

  var masterPfPage = 1;
  var masterPfPageSize = 20;
  var currentFilteredMasterPfList = [];

  // 전국 기본 포트폴리오 데이터셋 (학원 관리자 기본 샘플 + 전국 가맹점 확장)
  var defaultMasterPortfolios = [
    {
      id: 'PF-2026-1107',
      academyName: '1차 연구회 수학',
      studentId: 'S1024',
      studentName: '박진호',
      school: '옥천초등학교',
      grade: '5학년',
      classGroup: 'A Class',
      title: '[박진호] 2026년 3분기 독서 포트폴리오',
      period: '2026.10.30 ~ 2026.11.11',
      bookCount: 13,
      quizAvg: '72점',
      issueDate: '2026.11.12 11:30',
      status: '카톡 발송하기',
      kakaoSent: false
    },
    {
      id: 'PF-2026-0901',
      academyName: '1차 연구회 수학',
      studentId: 'S1021',
      studentName: '김민준',
      school: '나노초등학교',
      grade: '초등 5학년',
      classGroup: '지혜반',
      title: '2026년 3분기 독서 포트폴리오',
      period: '2026년 3분기 (7~9월)',
      bookCount: 4,
      quizAvg: '94.2점',
      issueDate: '2026.11.08 14:20',
      status: '발송 완료',
      kakaoSent: true
    },
    {
      id: 'PF-2026-0902',
      academyName: '목동 독서토론 학원',
      studentId: 'S1023',
      studentName: '박도윤',
      school: '나노초등학교',
      grade: '초등 6학년',
      classGroup: '리더반',
      title: '2026년 3분기 독서 심화 포트폴리오',
      period: '2026년 3분기 (7~9월)',
      bookCount: 5,
      quizAvg: '96.5점',
      issueDate: '2026.11.05 10:15',
      status: '발송 완료',
      kakaoSent: true
    },
    {
      id: 'PF-2026-0815',
      academyName: '대치 리더스 논술',
      studentId: 'S1025',
      studentName: '최유진',
      school: '대치초등학교',
      grade: '초등 4학년',
      classGroup: '슬기반',
      title: '2026년 3분기 독서성장 포트폴리오',
      period: '2026년 3분기',
      bookCount: 6,
      quizAvg: '88.4점',
      issueDate: '2026.11.03 16:40',
      status: '카톡 발송하기',
      kakaoSent: false
    },
    {
      id: 'PF-2026-0812',
      academyName: '분당 영재논술 학원',
      studentId: 'S1026',
      studentName: '정예원',
      school: '서현초등학교',
      grade: '초등 5학년',
      classGroup: '마스터반',
      title: '2026년 8월호 독서 포트폴리오',
      period: '2026년 8월 월호',
      bookCount: 3,
      quizAvg: '95.8점',
      issueDate: '2026.11.01 16:00',
      status: '발송 완료',
      kakaoSent: true
    },
    {
      id: 'PF-2026-0810',
      academyName: '송도 글로벌 독서학원',
      studentId: 'S1022',
      studentName: '이서연',
      school: '한빛초등학교',
      grade: '초등 4학년',
      classGroup: '탐구반',
      title: '2026년 8월호 성장 독서 포트폴리오',
      period: '2026년 8월 월호',
      bookCount: 3,
      quizAvg: '91.5점',
      issueDate: '2026.10.28 11:30',
      status: '카톡 발송하기',
      kakaoSent: false
    }
  ];

  // 1. 초기화 함수
  function initMasterPortfolio() {
    populateMasterPfAcademyFilter();
    populateMasterPfClassFilter();
    initMasterPfDateFilters();
    filterMasterPortfolioList();
  }

  // 2. 가맹점 드롭다운 채우기
  function populateMasterPfAcademyFilter() {
    var select = document.getElementById('masterPfAcademyFilter');
    if (!select) return;
    var currentVal = select.value || 'ALL';

    var franchises = [];
    if (typeof franchiseList !== 'undefined' && Array.isArray(franchiseList) && franchiseList.length > 0) {
      franchises = franchiseList;
    } else if (typeof defaultFranchiseList !== 'undefined' && Array.isArray(defaultFranchiseList)) {
      franchises = defaultFranchiseList;
    } else if (typeof window.MIGRATED_FRANCHISES !== 'undefined' && Array.isArray(window.MIGRATED_FRANCHISES)) {
      franchises = window.MIGRATED_FRANCHISES;
    }

    var optionsHtml = '<option value="ALL">전체 가맹점</option>';
    var seen = new Set();
    franchises.forEach(function(f) {
      var name = (f.name || f.academyName || '').trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        optionsHtml += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
      }
    });

    select.innerHTML = optionsHtml;
    select.value = currentVal;
  }

  // 3. 클래스 드롭다운 채우기
  function populateMasterPfClassFilter() {
    var select = document.getElementById('masterPfClassFilter');
    if (!select) return;
    var currentVal = select.value || 'ALL';

    var classes = ['A Class', '지혜반', '슬기반', '마스터반', '리더반', '심화반', '탐구반', '새싹반'];
    var optionsHtml = '<option value="ALL">전체 클래스</option>';
    classes.forEach(function(c) {
      optionsHtml += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });

    select.innerHTML = optionsHtml;
    select.value = currentVal;
  }

  // 4. 발급일자 기본값 초기화 (최근 당월 1일 ~ today)
  function initMasterPfDateFilters() {
    var startEl = document.getElementById('masterPfStartDate');
    var endEl = document.getElementById('masterPfEndDate');
    if (!startEl || !endEl) return;
    if (!startEl.value || !endEl.value) {
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');
      startEl.value = y + '-' + m + '-01';
      endEl.value = y + '-' + m + '-' + d;
    }
  }

  // 5. 마스터 전체 포트폴리오 리스트 수집
  function getAllMasterPortfolios() {
    var list = [];
    // 1) 학원 관리자용 portfolioList가 메모리에 있다면 병합
    if (typeof portfolioList !== 'undefined' && Array.isArray(portfolioList)) {
      portfolioList.forEach(function(p) {
        list.push({
          id: p.id,
          academyName: p.academyName || '1차 연구회 수학',
          studentId: p.studentId || '',
          studentName: p.studentName || '원생',
          school: p.school || '초등학교',
          grade: p.grade || '',
          classGroup: p.classGroup || '지혜반',
          title: p.title || '독서 포트폴리오',
          period: p.period || '',
          bookCount: p.bookCount || 1,
          quizAvg: p.quizAvg || '85점',
          issueDate: p.issueDate || '2026.11.11 10:00',
          status: p.status || (p.kakaoSent ? '발송 완료' : '카톡 발송하기'),
          kakaoSent: Boolean(p.kakaoSent)
        });
      });
    }

    // 2) 기본 전국 샘플 중 중복되지 않는 건 추가
    defaultMasterPortfolios.forEach(function(dp) {
      if (!list.some(function(item) { return item.id === dp.id; })) {
        list.push(dp);
      }
    });

    return list;
  }

  // 6. 포트폴리오 필터링 및 렌더링
  function filterMasterPortfolioList() {
    initMasterPfDateFilters();

    var academyVal = document.getElementById('masterPfAcademyFilter') ? document.getElementById('masterPfAcademyFilter').value : 'ALL';
    var classVal = document.getElementById('masterPfClassFilter') ? document.getElementById('masterPfClassFilter').value : 'ALL';
    var startVal = document.getElementById('masterPfStartDate') ? document.getElementById('masterPfStartDate').value : '';
    var endVal = document.getElementById('masterPfEndDate') ? document.getElementById('masterPfEndDate').value : '';
    var query = (document.getElementById('masterPfSearchInput') ? document.getElementById('masterPfSearchInput').value : '').toLowerCase().trim();

    var allList = getAllMasterPortfolios();

    var filtered = allList.filter(function(pf) {
      if (academyVal !== 'ALL' && pf.academyName !== academyVal) return false;
      if (classVal !== 'ALL' && pf.classGroup.indexOf(classVal) === -1) return false;

      // 발급일자 필터링
      if (startVal || endVal) {
        var rawDate = String(pf.issueDate || pf.createdAt || pf.date || '').slice(0, 10).replace(/\./g, '-');
        if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          if (startVal && rawDate < startVal) return false;
          if (endVal && rawDate > endVal) return false;
        }
      }

      // 검색어 필터링
      if (query) {
        var matchName = pf.studentName.toLowerCase().indexOf(query) !== -1;
        var matchTitle = pf.title.toLowerCase().indexOf(query) !== -1;
        var matchId = pf.id.toLowerCase().indexOf(query) !== -1;
        var matchAcad = pf.academyName.toLowerCase().indexOf(query) !== -1;
        if (!matchName && !matchTitle && !matchId && !matchAcad) return false;
      }

      return true;
    });

    // 최신 발급일자 순 정렬
    filtered.sort(function(a, b) {
      return (b.issueDate || '').localeCompare(a.issueDate || '');
    });

    currentFilteredMasterPfList = filtered;
    masterPfPage = 1;

    // 통계 카드 업데이트
    updateMasterPfStats(allList);
    renderMasterPfTable(1);
  }

  // 7. 상단 통계 카드 업데이트
  function updateMasterPfStats(allList) {
    var now = new Date();
    var curYear = now.getFullYear();
    var curMonth = now.getMonth() + 1;
    var ymDot = curYear + '.' + (curMonth < 10 ? '0' + curMonth : curMonth);
    var ymDash = curYear + '-' + (curMonth < 10 ? '0' + curMonth : curMonth);

    var listToCalc = allList || getAllMasterPortfolios();
    var totalCount = listToCalc.length;

    var thisMonthCount = listToCalc.filter(function(p) {
      var d = String(p.issueDate || p.createdAt || p.date || '');
      return d.indexOf(ymDot) !== -1 || d.indexOf(ymDash) !== -1;
    }).length;

    var kakaoSentCount = listToCalc.filter(function(p) {
      return p.kakaoSent === true || p.status === '발송 완료';
    }).length;

    var kakaoRate = totalCount > 0 ? Math.round((kakaoSentCount / totalCount) * 100) : 0;

    var mCountEl = document.getElementById('masterPfMonthIssuedCount');
    if (mCountEl) mCountEl.innerText = thisMonthCount.toLocaleString();

    var mSubEl = document.getElementById('masterPfMonthIssuedSub');
    if (mSubEl) mSubEl.innerText = curMonth + '월 신규 발급 (' + thisMonthCount + '건)';

    var tCountEl = document.getElementById('masterPfTotalIssuedCount');
    if (tCountEl) tCountEl.innerText = totalCount.toLocaleString();

    var tSubEl = document.getElementById('masterPfTotalIssuedSub');
    if (tSubEl) tSubEl.innerText = '전국 누적 ' + totalCount + '건 통합 관리 중';

    var kRateEl = document.getElementById('masterPfKakaoSentRate');
    if (kRateEl) kRateEl.innerText = kakaoRate;

    var kSubEl = document.getElementById('masterPfKakaoSentSub');
    if (kSubEl) kSubEl.innerText = kakaoSentCount + '건 발송 완료 (' + kakaoRate + '%)';
  }

  // 8. 포트폴리오 리스트 테이블 렌더링
  function renderMasterPfTable(page) {
    var tbody = document.getElementById('masterPfTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    masterPfPage = page || 1;
    var list = currentFilteredMasterPfList || [];
    var totalCount = list.length;

    var countBadge = document.getElementById('masterPfTotalCount');
    if (countBadge) countBadge.innerText = totalCount.toLocaleString();

    if (totalCount === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted">선택하신 조건에 일치하는 포트폴리오가 없습니다.</td></tr>';
      renderMasterPfPagination(0, 1);
      return;
    }

    var totalPages = Math.ceil(totalCount / masterPfPageSize);
    if (masterPfPage > totalPages) masterPfPage = totalPages;

    var startIdx = (masterPfPage - 1) * masterPfPageSize;
    var endIdx = Math.min(startIdx + masterPfPageSize, totalCount);
    var pagedList = list.slice(startIdx, endIdx);

    pagedList.forEach(function(pf, idx) {
      var rowNo = totalCount - (startIdx + idx);
      var displayIssueDate = pf.issueDate || '2026.11.12 10:00';

      // 카톡 액션 버튼 (상세/인쇄 버튼 우측에 배치)
      var kakaoActionHtml = '';
      if (pf.kakaoSent === true || pf.status === '발송 완료') {
        kakaoActionHtml = '<span class="badge-soft badge-soft-success font-weight-bold" style="font-size:11px; padding:3px 8px; border-radius:6px;"><i class="fa-solid fa-check mr-1"></i>발송 완료</span>';
      } else {
        kakaoActionHtml = '<button type="button" class="btn btn-xs font-weight-bold" onclick="sendMasterPfKakaoDirect(\'' + pf.id + '\', event)" ' +
          'style="background-color:#FEE500; color:#3C1E1E; border:1px solid #ebd000; border-radius:6px; font-size:11px; padding:3px 8px; box-shadow:0 1px 3px rgba(0,0,0,0.08); cursor:pointer;">' +
          '<i class="fa-solid fa-comment mr-1"></i>카톡 발송' +
          '</button>';
      }

      var tr = document.createElement('tr');
      // 컬럼 순서 (요구사항): No. | 가맹점 | 소속 클래스 | 학교/학년 | 원생명 | 포트폴리오 명칭 | 포함 완독 도서(권수만) | 북퀴즈 평균 | 발급일자 | 관리
      tr.innerHTML = 
        '<td class="text-center"><span class="font-weight-bold text-muted" style="font-size:12px;">' + rowNo + '</span></td>' +
        '<td class="text-center"><span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size:12px; max-width:130px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + escapeHtml(pf.academyName) + '">' + escapeHtml(pf.academyName) + '</span></td>' +
        '<td class="text-center"><span class="badge-soft badge-soft-neutral" style="font-size:11.5px;">' + escapeHtml(pf.classGroup || '-') + '</span></td>' +
        '<td class="text-center"><small class="text-muted">' + escapeHtml((pf.school || '초등학교') + ' ' + (pf.grade || '')) + '</small></td>' +
        '<td><strong style="font-size:13px; color:var(--text-main); cursor:pointer; text-decoration:underline;" onclick="openMasterPfDetailModal(\'' + pf.studentId + '\', \'' + pf.id + '\')">' + escapeHtml(pf.studentName) + '</strong></td>' +
        '<td>' +
          '<div class="font-weight-bold" style="font-size:13px; color:var(--text-main); cursor:pointer;" onclick="openMasterPfDetailModal(\'' + pf.studentId + '\', \'' + pf.id + '\')">' + escapeHtml(pf.title) + '</div>' +
          '<small class="text-muted">' + escapeHtml(pf.period || '') + '</small>' +
        '</td>' +
        '<td class="text-center"><span class="font-weight-bold text-dark">' + pf.bookCount + '권</span></td>' +
        '<td class="text-center text-success font-weight-bold">' + (pf.quizAvg || '-') + '</td>' +
        '<td class="text-center text-muted" style="font-size:12px; white-space:nowrap;">' + escapeHtml(displayIssueDate) + '</td>' +
        '<td class="text-center" style="white-space:nowrap;">' +
          '<button type="button" class="btn btn-xs btn-beige-primary mr-1" onclick="openMasterPfDetailModal(\'' + pf.studentId + '\', \'' + pf.id + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 9px;">상세보기</button>' +
          '<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="printMasterPortfolio(\'' + pf.studentId + '\', \'' + pf.id + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;" title="리포트 인쇄"><i class="fa-solid fa-print"></i></button>' +
          kakaoActionHtml +
        '</td>';

      tbody.appendChild(tr);
    });

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

    var html = '';
    html += '<button type="button" class="btn btn-xs btn-outline-secondary" ' + (curPage <= 1 ? 'disabled' : '') + ' onclick="renderMasterPfTable(' + (curPage - 1) + ')"><i class="fa-solid fa-chevron-left"></i></button>';

    var startPage = Math.max(1, curPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (var p = startPage; p <= endPage; p++) {
      if (p === curPage) {
        html += '<button type="button" class="btn btn-xs btn-primary font-weight-bold" style="min-width:28px;">' + p + '</button>';
      } else {
        html += '<button type="button" class="btn btn-xs btn-outline-secondary" style="min-width:28px;" onclick="renderMasterPfTable(' + p + ')">' + p + '</button>';
      }
    }

    html += '<button type="button" class="btn btn-xs btn-outline-secondary" ' + (curPage >= totalPages ? 'disabled' : '') + ' onclick="renderMasterPfTable(' + (curPage + 1) + ')"><i class="fa-solid fa-chevron-right"></i></button>';
    container.innerHTML = html;
  }

  // 10. 마스터 포트폴리오 상세 팝업 오픈
  function openMasterPfDetailModal(studentId, pfId) {
    var pf = (currentFilteredMasterPfList || []).find(function(p) { return p.id === pfId; });
    if (!pf) return;
    alert('[' + pf.studentName + '] 원생 독서 성장 포트폴리오 (' + pf.id + ')\n\n' +
          '- 소속 학원: ' + pf.academyName + '\n' +
          '- 소속 클래스: ' + pf.classGroup + ' (' + pf.school + ' ' + pf.grade + ')\n' +
          '- 발급 일자: ' + pf.issueDate + '\n' +
          '- 완독 도서수: ' + pf.bookCount + '권 (북퀴즈 평균: ' + pf.quizAvg + ')\n\n' +
          '인쇄 및 원문 보기는 인쇄 버튼을 통해 진행하실 수 있습니다.');
  }

  // 11. 인쇄 함수
  function printMasterPortfolio(studentId, pfId) {
    var pf = (currentFilteredMasterPfList || []).find(function(p) { return p.id === pfId; });
    if (!pf) return;
    window.open('portfolio_report.html?id=' + encodeURIComponent(pfId) + '&student=' + encodeURIComponent(studentId), '_blank');
  }

  // 12. 카톡 발송 직접 토글
  function sendMasterPfKakaoDirect(pfId, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    var pf = (currentFilteredMasterPfList || []).find(function(p) { return p.id === pfId; });
    if (!pf) return;

    pf.kakaoSent = true;
    pf.status = '발송 완료';
    renderMasterPfTable(masterPfPage);

    if (typeof showMasterToast === 'function') {
      showMasterToast('🎉 [' + pf.studentName + ' / ' + pf.academyName + '] 학부모님께 포트폴리오 카카오톡 알림톡이 발송되었습니다.');
    } else {
      alert('[' + pf.studentName + '] 학부모님께 알림톡이 전송되었습니다.');
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 전역 등록
  window.initMasterPortfolio = initMasterPortfolio;
  window.filterMasterPortfolioList = filterMasterPortfolioList;
  window.renderMasterPfTable = renderMasterPfTable;
  window.openMasterPfDetailModal = openMasterPfDetailModal;
  window.printMasterPortfolio = printMasterPortfolio;
  window.sendMasterPfKakaoDirect = sendMasterPfKakaoDirect;

})(window);

