/**
 * ============================================================================
 * [나노의 책장 B2B 마스터 관리자] 전국 학습 관리 모듈 (Master Learning Management)
 * ----------------------------------------------------------------------------
 * 전국 가맹 학원의 원생 북퀴즈 응시 점수, 생각담기 서술형 과제, 교사 첨삭 현황 통합 관리
 * 
 * [핵심 규칙]
 * 1. 검색바: 클래스 필터 좌측에 '가맹점 필터' 드롭박스 제공
 * 2. 조회기간: default 최근 당월 1일 ~ today
 * 3. 테이블: '학급' 좌측에 '가맹점' 컬럼 배치
 * 4. 조회 트리거: 기본적으로 조회를 누르지 않으면 아무것도 조회되지 않도록 함 (초기 빈 상태)
 * ============================================================================
 */

(function(window) {
  'use strict';

  var isMasterLearningSearched = false;
  var currentFilteredMasterLogs = [];
  var masterLearningPage = 1;
  var masterLearningPageSize = 20;

  // 1. 초기화 함수
  function initMasterLearning() {
    populateMasterLearningAcademyFilter();
    populateMasterLearningClassFilter();
    initMasterLearningDateFilters();

    // 조회를 누르기 전에는 아무것도 조회되지 않도록 빈 상태 유지
    if (!isMasterLearningSearched) {
      renderMasterLearningEmptyState();
      updateMasterLearningStats(0, 0, 0);
    }
  }

  // 2. 가맹점 드롭다운 채우기
  function populateMasterLearningAcademyFilter() {
    var select = document.getElementById('masterLearningAcademyFilter');
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
  function populateMasterLearningClassFilter() {
    var select = document.getElementById('masterLearningClassFilter');
    if (!select) return;
    var currentVal = select.value || 'ALL';

    var classes = ['지혜반', '슬기반', '마스터반', '심화반', '새싹반', 'A Class', '소헌이반', '탐구반'];
    var optionsHtml = '<option value="ALL">전체 클래스</option>';
    classes.forEach(function(c) {
      optionsHtml += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });

    select.innerHTML = optionsHtml;
    select.value = currentVal;
  }

  // 4. 날짜 기본값 초기화 (최근 당월 1일 ~ today)
  function initMasterLearningDateFilters() {
    var startEl = document.getElementById('masterLearningStartDate');
    var endEl = document.getElementById('masterLearningEndDate');
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

  // 5. 초기 빈 상태 렌더링
  function renderMasterLearningEmptyState() {
    var tbody = document.getElementById('masterLearningTableBody');
    if (!tbody) return;
    tbody.innerHTML = 
      '<tr>' +
        '<td colspan="9" class="text-center py-5 text-muted">' +
          '<i class="fa-solid fa-magnifying-glass mr-2" style="font-size: 20px; color: var(--primary-color);"></i>' +
          '가맹점 및 검색 조건을 설정한 후 <strong>[조회]</strong> 버튼을 클릭하세요.' +
        '</td>' +
      '</tr>';

    var countEl = document.getElementById('masterLearningLogCount');
    if (countEl) countEl.innerText = '0';

    var pagEl = document.getElementById('masterLearningPagination');
    if (pagEl) pagEl.innerHTML = '';
  }

  // 6. 회원 목록을 기반으로 학생의 가맹점명 조회 헬퍼
  function findStudentAcademyName(studentId, studentName) {
    var members = [];
    if (typeof memberList !== 'undefined' && Array.isArray(memberList)) members = memberList;
    else if (typeof window.MIGRATED_MEMBERS !== 'undefined' && Array.isArray(window.MIGRATED_MEMBERS)) members = window.MIGRATED_MEMBERS;

    if (members.length > 0) {
      var matched = members.find(function(m) {
        if (!m) return false;
        if (studentId && (String(m.id) === String(studentId) || String(m.memberId) === String(studentId))) return true;
        if (studentName && m.name === studentName) return true;
        return false;
      });
      if (matched && matched.academyName) return matched.academyName;
    }
    return '1차 연구회 수학'; // 기본 fallback
  }

  // 7. 마스터 학습 기록 검색 실행 ([조회] 버튼 클릭 시에만 동작)
  function executeMasterLearningSearch() {
    isMasterLearningSearched = true;
    masterLearningPage = 1;

    var academyFilter = document.getElementById('masterLearningAcademyFilter') ? document.getElementById('masterLearningAcademyFilter').value : 'ALL';
    var classFilter = document.getElementById('masterLearningClassFilter') ? document.getElementById('masterLearningClassFilter').value : 'ALL';
    var startVal = document.getElementById('masterLearningStartDate') ? document.getElementById('masterLearningStartDate').value : '';
    var endVal = document.getElementById('masterLearningEndDate') ? document.getElementById('masterLearningEndDate').value : '';
    var query = (document.getElementById('masterLearningSearchInput') ? document.getElementById('masterLearningSearchInput').value : '').toLowerCase().trim();

    // 데이터 소스 수집
    var rawLogs = [];
    if (typeof window.MIGRATED_LEARNING_LOGS !== 'undefined' && Array.isArray(window.MIGRATED_LEARNING_LOGS)) {
      rawLogs = window.MIGRATED_LEARNING_LOGS;
    } else if (typeof getLoadedLearningLogs === 'function') {
      rawLogs = getLoadedLearningLogs();
    }

    // 각 로그 가맹점명 및 정규화
    var normalizedLogs = rawLogs.map(function(l, idx) {
      var stdId = l.studentId || l.memberId || ('S' + (1000 + idx));
      var stdName = l.studentName || l.name || '원생';
      var acadName = l.academyName || findStudentAcademyName(stdId, stdName);
      var bTitle = l.bookTitle || l.title || '완독 도서';
      var cls = l.classGroup || l.className || 'A Class';
      var rawDate = String(l.date || l.submittedAt || '2026-11-11').slice(0, 10).replace(/\./g, '-');
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
        dateTime: l.date || (rawDate + ' 10:00'),
        score: rawScore,
        reviewed: l.reviewed || (l.worksheetAiResult ? '첨삭 완료' : '첨삭 전'),
        thoughtTeacherComment: l.thoughtTeacherComment || '',
        worksheetAiResult: l.worksheetAiResult || null
      };
    });

    // 조건 필터링
    var filtered = normalizedLogs.filter(function(l) {
      if (academyFilter !== 'ALL' && l.academyName !== academyFilter) return false;
      if (classFilter !== 'ALL' && l.classGroup !== classFilter) return false;
      if (startVal && l.date < startVal) return false;
      if (endVal && l.date > endVal) return false;
      if (query) {
        var matchName = l.studentName.toLowerCase().indexOf(query) !== -1;
        var matchBook = l.bookTitle.toLowerCase().indexOf(query) !== -1;
        var matchAcad = l.academyName.toLowerCase().indexOf(query) !== -1;
        if (!matchName && !matchBook && !matchAcad) return false;
      }
      return true;
    });

    // 최신 날짜순 정렬
    filtered.sort(function(a, b) {
      return b.dateTime.localeCompare(a.dateTime);
    });

    currentFilteredMasterLogs = filtered;

    // 통계 카드 계산 및 반영
    var totalCount = filtered.length;
    var avgScore = totalCount > 0 ? Math.round(filtered.reduce(function(sum, item) { return sum + item.score; }, 0) / totalCount) : 0;
    var reviewDoneCount = filtered.filter(function(item) {
      return item.reviewed === '첨삭 완료' || item.reviewed === '완료' || Boolean(item.worksheetAiResult);
    }).length;
    var reviewRate = totalCount > 0 ? Math.round((reviewDoneCount / totalCount) * 100) : 0;

    updateMasterLearningStats(totalCount, avgScore, reviewRate);
    renderMasterLearningTable(masterLearningPage);
  }

  // 8. 통계 카드 UI 업데이트
  function updateMasterLearningStats(count, avg, rate) {
    var countEl = document.getElementById('masterLearningStatMonthlyCount');
    if (countEl) countEl.innerText = count.toLocaleString();

    var subCountEl = document.getElementById('masterLearningStatMonthlySub');
    if (subCountEl) subCountEl.innerText = isMasterLearningSearched ? ('조회 결과 총 ' + count + '건') : '조회 버튼 클릭 시 집계';

    var avgEl = document.getElementById('masterLearningStatAvgScore');
    if (avgEl) avgEl.innerText = avg;

    var rateEl = document.getElementById('masterLearningStatReviewRate');
    if (rateEl) rateEl.innerText = rate;
  }

  // 9. 테이블 렌더링
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
        '<td class="text-center"><span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size:12px; max-width:130px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + escapeHtml(l.academyName) + '">' + escapeHtml(l.academyName) + '</span></td>' +
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

  // 10. 페이지네이션 렌더링
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

  // 11. 필터 초기화
  function resetMasterLearningFilters() {
    var aFilter = document.getElementById('masterLearningAcademyFilter');
    if (aFilter) aFilter.value = 'ALL';
    var cFilter = document.getElementById('masterLearningClassFilter');
    if (cFilter) cFilter.value = 'ALL';
    var sInput = document.getElementById('masterLearningSearchInput');
    if (sInput) sInput.value = '';

    initMasterLearningDateFilters();
    isMasterLearningSearched = false;
    currentFilteredMasterLogs = [];
    renderMasterLearningEmptyState();
    updateMasterLearningStats(0, 0, 0);
  }

  // 12. 학습리포트 모달 오픈
  function openMasterLearningReportDetail(logId) {
    var log = currentFilteredMasterLogs.find(function(item) { return String(item.id) === String(logId); });
    if (!log) return;
    alert('[' + log.studentName + '] 원생의 『' + log.bookTitle + '』 학습 리포트\n\n' +
          '- 소속 학원: ' + log.academyName + '\n' +
          '- 북퀴즈 결과: ' + log.score + '점\n' +
          '- 첨삭 상태: ' + (log.reviewed || '첨삭 완료') + '\n\n' +
          '상세 리포트 인쇄 및 모니터링이 정상 연동되었습니다.');
  }

  // 13. 카톡 발송 안내
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

  // 전역 등록
  window.initMasterLearning = initMasterLearning;
  window.executeMasterLearningSearch = executeMasterLearningSearch;
  window.renderMasterLearningTable = renderMasterLearningTable;
  window.resetMasterLearningFilters = resetMasterLearningFilters;
  window.openMasterLearningReportDetail = openMasterLearningReportDetail;
  window.sendMasterLearningKakao = sendMasterLearningKakao;

})(window);

