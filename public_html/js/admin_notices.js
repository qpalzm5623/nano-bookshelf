// ==============================================================
// 본사 시스템 공지사항 연동 및 관리자 로그인/접속 팝업 모듈
// ==============================================================
const defaultAcademySystemNotices = [
  {
    id: "NOT-1004",
    title: "[안내] 2026 가을맞이 신규 필독서 120종 업데이트 및 북퀴즈 출제 완료",
    target: "전체",
    category: "신규 도서 입고",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-28",
    content: "안녕하세요. 나노의 책장 본사 운영팀입니다.\n\n2026년도 2학기를 맞아 초등 및 중등 대상 교과 연계 필독도서 120종이 신규 등록되었으며, 각 도서별 문해력 5문항 북퀴즈 및 어휘 풀이가 완비되었습니다.\n\n각 가맹 학원에서는 [도서 배정] 메뉴에서 신규 도서를 확인하시고 원생들에게 추천 도서로 배정해 주시기 바랍니다.\n감사합니다.",
    link: ""
  },
  {
    id: "NOT-1003",
    title: "[긴급] 정기 시스템 서버 안정화 및 인프라 점검 안내 (10/05 02:00~06:00)",
    target: "가맹 학원",
    category: "시스템 점검",
    isPopup: true,
    popupStartDate: "2026-10-01",
    popupEndDate: "2026-10-05",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-25",
    content: "안정적인 북퀴즈 응시 및 대용량 독서 리포트 데이터 처리를 위한 클라우드 인프라 확장 점검이 진행될 예정입니다.\n\n■ 점검 일시: 2026년 10월 5일(월) 새벽 02:00 ~ 06:00 (약 4시간)\n■ 영향 범위: 점검 시간 동안 전체 플랫폼 접속 및 북퀴즈 응시 일시 중단\n\n원활한 서비스 제공을 위해 새벽 시간대에 진행되오니 원장님 및 지도교사 분들의 너른 양해 부탁드립니다.",
    link: ""
  },
  {
    id: "NOT-1001",
    title: "[안내] 가맹 학원 관리자 대시보드 리포트 발송 편의 기능 개선 배포",
    target: "가맹 학원",
    category: "서비스 업데이트",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: false,
    status: "게시중",
    createdAt: "2026-09-10",
    content: "학원 관리자 페이지에서 학부모 알림톡 리포트 발송 시, 학급별 일괄 전송 및 개별 발송 미리보기 기능이 한층 업그레이드되었습니다.\n\n또한 원생 삭제 시 실수 방지를 위한 2단계 원장님 비밀번호 인증 및 7일 임시 보존 기능이 적용되었습니다.",
    link: ""
  }
];

function getAcademySystemNotices() {
  var localCached = [];
  try {
    const raw = localStorage.getItem("NANO_MASTER_SYSTEM_NOTICES");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localCached = parsed;
    }
  } catch (e) {}

  if (window.NANO_SERVER_DATA) {
    return (window.NANO_SERVER_NOTICES || [])
      .map(function(sn) {
        var ln = localCached.find(function(x) { return (x.id && x.id === sn.id) || (x.title && x.title === sn.title); });
        if (!ln) return sn;
        return Object.assign({}, sn, {
          popupStartDate: sn.popupStartDate || ln.popupStartDate || "",
          popupEndDate: sn.popupEndDate || ln.popupEndDate || "",
          isPopup: typeof sn.isPopup === "boolean" ? sn.isPopup : !!ln.isPopup,
          status: sn.status || ln.status || "게시중",
          target: sn.target || ln.target || "전체",
          category: sn.category || ln.category || "일반 공지",
          link: sn.link || ln.link || ""
        });
      })
      .filter(function(n) {
        return n.status !== '비공개' && (!n.target || n.target === '전체' || n.target === '가맹 학원' || n.target === '원장' || n.target === '선생님');
      });
  }
  if (localCached.length > 0) {
    return localCached.filter(n => n.status === '게시중' && (n.target === '전체' || n.target === '가맹 학원'));
  }
  return defaultAcademySystemNotices;
}

// 본사 공지 읽음 처리 (공지 메뉴 클릭 시 호출)
function markAcademyNoticesAsRead() {
  try {
    const notices = getAcademySystemNotices();
    const noticeIds = notices.map(n => String(n.id || n.title || ''));
    localStorage.setItem('NANO_ACADEMY_NOTICES_READ_IDS', JSON.stringify(noticeIds));
    localStorage.setItem('NANO_ACADEMY_NOTICES_READ_TIME', Date.now().toString());
  } catch (e) {}

  const sidebarBadge = document.getElementById('sidebarNoticeCountBadge');
  const badge = document.getElementById('academyNoticeCountBadge');
  if (sidebarBadge) sidebarBadge.style.display = 'none';
  if (badge) badge.style.display = 'none';
}

// 읽지 않은 본사 공지 수 계산
function getUnreadAcademyNoticeCount() {
  const notices = getAcademySystemNotices();
  if (!notices || notices.length === 0) return 0;

  try {
    const rawReadIds = localStorage.getItem('NANO_ACADEMY_NOTICES_READ_IDS');
    if (rawReadIds) {
      const readIds = JSON.parse(rawReadIds);
      if (Array.isArray(readIds)) {
        const unread = notices.filter(n => !readIds.includes(String(n.id || n.title || '')));
        return unread.length;
      }
    }
  } catch (e) {}

  return notices.length;
}

function updateAcademyNoticeBadge(forceZeroUnread) {
  const badge = document.getElementById('academyNoticeCountBadge');
  const sidebarBadge = document.getElementById('sidebarNoticeCountBadge');
  const viewBadge = document.getElementById('noticeViewTotalCountBadge');
  const notices = getAcademySystemNotices();
  const totalCount = notices.length;
  const unreadCount = forceZeroUnread ? 0 : getUnreadAcademyNoticeCount();

  if (badge) {
    badge.innerText = unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
  if (sidebarBadge) {
    sidebarBadge.innerText = unreadCount;
    sidebarBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
  if (viewBadge) {
    viewBadge.innerText = `게시 중 공지 ${totalCount}건`;
  }
}

// 공지 제목과 본문은 텍스트로 표시하고 외부 안내 링크는 HTTP(S)만 허용합니다.
function escapeAcademyNoticeText(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// 필독 우선 목록: 첫 공지를 펼쳐 두고 나머지는 제목을 보고 선택합니다.
function renderAcademyNoticeViewList() {
  const notices = getAcademySystemNotices().slice().sort(function(a, b) {
    return Number(!!b.isPinned) - Number(!!a.isPinned) || String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  const container = document.getElementById('academyNoticeViewContainer');
  markAcademyNoticesAsRead();
  updateAcademyNoticeBadge(true);
  if (!container) return;

  const search = document.getElementById('noticeViewSearch');
  const pinnedOnly = document.getElementById('noticePinnedOnly');
  const query = String(search && search.value || '').trim().toLocaleLowerCase();
  const filtered = notices.filter(function(n) {
    return (!(pinnedOnly && pinnedOnly.checked) || n.isPinned) &&
      (!query || [n.title, n.content].join(' ').toLocaleLowerCase().includes(query));
  });
  const count = document.getElementById('noticeViewResultCount');
  if (count) count.textContent = filtered.length + '건 · 필독 우선 / 최신순';
  if (!filtered.length) {
    container.innerHTML = '<div class="notice-empty"><i class="fa-regular fa-folder-open" aria-hidden="true"></i><h3>' +
      (notices.length ? '검색 조건에 맞는 공지가 없습니다.' : '아직 등록된 공지가 없습니다.') +
      '</h3><p>' + (notices.length ? '다른 검색어를 입력하거나 필독 필터를 해제해 주세요.' : '새로운 본사 소식이 등록되면 이곳에서 확인할 수 있습니다.') + '</p></div>';
    return;
  }

  const esc = escapeAcademyNoticeText;
  container.innerHTML = filtered.map(function(n, index) {
    const pinned = n.isPinned ? '<span class="notice-tag pinned">필독</span>' : '';
    const popup = n.isPopup ? '<span class="notice-tag secondary">팝업 안내</span>' : '';
    let link = '';
    try {
      const url = new URL(String(n.link || '').trim());
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        link = '<a class="notice-link" href="' + esc(url.href) + '" target="_blank" rel="noopener noreferrer">관련 안내 확인하기 <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span class="sr-only"> (새 창)</span></a>';
      }
    } catch (e) { /* 링크가 없는 공지는 본문만 표시합니다. */ }
    return '<details class="notice-card"' + (index === 0 ? ' open' : '') + '>' +
      '<summary><span class="notice-number' + (n.isPinned ? ' is-pinned' : '') + '" aria-hidden="true">' +
      (n.isPinned ? '<i class="fa-solid fa-thumbtack"></i>' : String(index + 1).padStart(2, '0')) + '</span>' +
      '<span class="notice-summary-copy"><span class="notice-tags">' + pinned + '<span class="notice-tag">' + esc(n.category || '일반 공지') + '</span>' + popup + '</span>' +
      '<span class="notice-title">' + esc(n.title) + '</span></span>' +
      '<time class="notice-date">' + esc(String(n.createdAt || '').slice(0, 10)) + '</time><i class="fa-solid fa-chevron-down notice-chevron" aria-hidden="true"></i></summary>' +
      '<div class="notice-detail"><div class="notice-byline">본사 운영팀 <span aria-hidden="true">·</span> 안내 대상: ' + esc(n.target || '전체') + '</div>' +
      '<div class="notice-body">' + esc(n.content || '') + '</div>' + link + '</div></details>';
  }).join('');
}
function getAcademyNoticeKstTodayStr() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getAcademyNoticeUserScopes() {
  const scopes = [];
  try {
    if (window.NANO_BOOTSTRAP_MEMBER_ID) scopes.push(String(window.NANO_BOOTSTRAP_MEMBER_ID));
    const auth = JSON.parse(sessionStorage.getItem('nano_auth_user') || 'null');
    if (auth) {
      if (auth.memberId && !scopes.includes(String(auth.memberId))) scopes.push(String(auth.memberId));
      if (auth.id && !scopes.includes(String(auth.id))) scopes.push(String(auth.id));
    }
  } catch (e) {}
  if (scopes.length === 0) scopes.push('local');
  return scopes;
}

function isAcademyNoticeHiddenToday(noticeId, todayStr) {
  const idStr = String(noticeId || '').trim();
  if (!idStr) return false;
  if (window.NANO_SERVER_HIDDEN_NOTICES && window.NANO_SERVER_HIDDEN_NOTICES[idStr] >= todayStr) {
    return true;
  }
  try {
    const scopes = getAcademyNoticeUserScopes();
    for (const scope of scopes) {
      const val = localStorage.getItem('NANO_HIDE_ADMIN_POPUP_' + scope + '_' + idStr);
      if (val && val >= todayStr) return true;
    }
    const legacyVal = !window.NANO_SERVER_DATA ? localStorage.getItem('NANO_HIDE_ADMIN_POPUP_' + idStr) : '';
    if (legacyVal && legacyVal >= todayStr) return true;
  } catch (e) {}
  return false;
}

const _academyNoticeHideSynced = {};
function persistAcademyNoticeHideToday(noticeId, shouldHide) {
  const idStr = String(noticeId || '').trim();
  if (!idStr) return;
  const todayStr = getAcademyNoticeKstTodayStr();
  const hideFlag = !!shouldHide;
  const stateSig = todayStr + ':' + (hideFlag ? '1' : '0');

  window.NANO_SERVER_HIDDEN_NOTICES = window.NANO_SERVER_HIDDEN_NOTICES || {};
  if (hideFlag) {
    window.NANO_SERVER_HIDDEN_NOTICES[idStr] = todayStr;
  } else {
    delete window.NANO_SERVER_HIDDEN_NOTICES[idStr];
  }
  try {
    const scopes = getAcademyNoticeUserScopes();
    for (const scope of scopes) {
      const scopedKey = 'NANO_HIDE_ADMIN_POPUP_' + scope + '_' + idStr;
      if (hideFlag) localStorage.setItem(scopedKey, todayStr);
      else localStorage.removeItem(scopedKey);
    }
    if (!window.NANO_SERVER_DATA) {
      if (hideFlag) localStorage.setItem('NANO_HIDE_ADMIN_POPUP_' + idStr, todayStr);
      else localStorage.removeItem('NANO_HIDE_ADMIN_POPUP_' + idStr);
    }
  } catch (e) {}
  if (window.NanoPortal && window.NanoPortal.remote && typeof fetch === 'function') {
    if (_academyNoticeHideSynced[idStr] === stateSig) return;
    _academyNoticeHideSynced[idStr] = stateSig;
    fetch('/api/activity?action=hide_notice', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeId: idStr, hide: hideFlag })
    }).then(function(res) {
      if (!res || !res.ok) delete _academyNoticeHideSynced[idStr];
    }).catch(function() {
      delete _academyNoticeHideSynced[idStr];
    });
  }
}

function onToggleAcademyNoticeHideToday(checked) {
  const modal = document.getElementById('academyNoticePopupModal');
  if (!modal) return;
  const notId = modal.getAttribute('data-current-notice-id');
  if (notId) {
    persistAcademyNoticeHideToday(notId, !!checked);
  }
}

function checkAcademyNoticePopups() {
  const existingModal = document.getElementById('academyNoticePopupModal');
  if (existingModal && existingModal.classList.contains('show')) return;

  const notices = getAcademySystemNotices();
  const todayStr = getAcademyNoticeKstTodayStr();

  const activePopups = notices.filter(n => {
    if (!n.isPopup) return false;
    if (n.popupStartDate && n.popupStartDate > todayStr) return false;
    if (n.popupEndDate && n.popupEndDate < todayStr) return false;
    if (isAcademyNoticeHiddenToday(n.id, todayStr)) return false;
    return true;
  });

  if (activePopups.length === 0) return;

  const targetNotice = activePopups[0];
  showAcademyNoticePopup(targetNotice);
}

function showAcademyNoticePopup(not) {
  const modal = document.getElementById('academyNoticePopupModal');
  if (!modal) return;

  const catBadge = document.getElementById('anpCatBadge');
  const title = document.getElementById('anpTitle');
  const date = document.getElementById('anpDate');
  const content = document.getElementById('anpContent');
  const linkBox = document.getElementById('anpLinkBox');
  const chk = document.getElementById('anpDoNotShowToday');

  if (catBadge) catBadge.innerText = not.category || '본사 시스템 공지';
  if (title) title.innerText = not.title;
  if (date) date.innerText = not.createdAt || '';
  if (content) content.innerHTML = (not.content || '').replace(/\n/g, '<br>');
  if (chk) chk.checked = false;

  if (linkBox) {
    if (not.link && not.link.trim()) {
      linkBox.style.display = 'block';
      linkBox.innerHTML = '<a href="' + not.link + '" target="_blank" class="btn btn-sm btn-outline-warning text-dark font-weight-bold" style="font-size: 12px; border-radius: 6px;"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>관련 안내 링크 바로가기</a>';
    } else {
      linkBox.style.display = 'none';
    }
  }

  modal.setAttribute('data-current-notice-id', not.id);
  if (window.jQuery && !modal.dataset.hideBound) {
    modal.dataset.hideBound = '1';
    window.jQuery(modal).on('hide.bs.modal', function() {
      const curId = modal.getAttribute('data-current-notice-id');
      const curChk = document.getElementById('anpDoNotShowToday');
      if (curChk && curChk.checked && curId) {
        persistAcademyNoticeHideToday(curId, true);
      }
    });
  }
  if (window.jQuery && typeof $('#academyNoticePopupModal').modal === 'function') {
    $('#academyNoticePopupModal').modal('show');
  } else {
    modal.style.display = 'block';
    modal.classList.add('show');
  }
}

function closeAcademyNoticePopup() {
  const modal = document.getElementById('academyNoticePopupModal');
  if (!modal) return;
  const notId = modal.getAttribute('data-current-notice-id');
  const chk = document.getElementById('anpDoNotShowToday');
  if (chk && chk.checked && notId) {
    persistAcademyNoticeHideToday(notId, true);
  }
  if (window.jQuery && typeof $('#academyNoticePopupModal').modal === 'function') {
    $('#academyNoticePopupModal').modal('hide');
  } else {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

function openAcademyNoticeListModal() {
  const notices = getAcademySystemNotices();
  const listEl = document.getElementById('academyNoticeListContainer');
  if (!listEl) return;

  if (notices.length === 0) {
    listEl.innerHTML = '<div class="text-center py-5 text-muted"><i class="fa-solid fa-bullhorn fa-2x mb-2" style="color: #cbd5e1;"></i><p class="mb-0 font-weight-bold" style="font-size: 13.5px;">등록된 본사 공지사항이 없습니다.</p></div>';
  } else {
    listEl.innerHTML = notices.map(n => {
      const isPinnedBadge = n.isPinned ? '<span class="badge badge-danger mr-1" style="font-size: 10.5px; font-weight: 800;"><i class="fa-solid fa-thumbtack mr-1"></i>필독</span>' : '';
      const catBadge = '<span class="badge badge-light border text-muted mr-1" style="font-size: 11px;">' + (n.category || '공지') + '</span>';
      const targetBadge = '<span class="badge badge-info" style="font-size: 10.5px;">' + n.target + '</span>';
      const popupBadge = n.isPopup ? '<span class="badge badge-warning text-dark ml-1" style="font-size: 10.5px;"><i class="fa-solid fa-window-restore mr-1"></i>팝업</span>' : '';
      const contentFormatted = (n.content || '').replace(/\n/g, '<br>');
      const linkHtml = (n.link && n.link.trim()) ? '<div class="mt-2"><a href="' + n.link + '" target="_blank" class="text-primary font-weight-bold" style="font-size: 12px;"><i class="fa-solid fa-link mr-1"></i>참고 링크 바로가기</a></div>' : '';

      return '<div class="card mb-3 border-beige shadow-sm" style="border-radius: 12px; overflow: hidden;">'
        + '<div class="card-header bg-white d-flex align-items-center justify-content-between flex-wrap py-2 px-3" style="border-bottom: 1px solid var(--border-light);">'
        +   '<div class="d-flex align-items-center flex-wrap" style="gap: 5px;">'
        +     isPinnedBadge
        +     catBadge
        +     targetBadge
        +     popupBadge
        +     '<strong style="font-size: 14px; color: var(--text-main);" class="ml-1">' + n.title + '</strong>'
        +   '</div>'
        +   '<small class="text-muted">' + (n.createdAt || '') + '</small>'
        + '</div>'
        + '<div class="card-body py-3 px-3" style="background: #faf8f5;">'
        +   '<div style="font-size: 13px; color: var(--text-main); line-height: 1.65; white-space: normal; word-break: break-word;">'
        +     contentFormatted
        +   '</div>'
        +   linkHtml
        + '</div>'
        + '</div>';
    }).join('');
  }

  if (window.jQuery && typeof $('#academyNoticeListModal').modal === 'function') {
    $('#academyNoticeListModal').modal('show');
  } else {
    const modal = document.getElementById('academyNoticeListModal');
    if (modal) { modal.style.display = 'block'; modal.classList.add('show'); }
  }
}

// 본사 마스터에서 공지사항 저장 시 실시간 동기화
window.addEventListener('storage', function(e) {
  if (e.key === 'NANO_MASTER_SYSTEM_NOTICES') {
    updateAcademyNoticeBadge();
    checkAcademyNoticePopups();
  }
});

// 초기 로드 시 공지 배지 및 팝업 점검 & 구독 자동갱신 UI 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    updateAcademyNoticeBadge();
    checkAcademyNoticePopups();
    if (typeof updateAutoRenewUI === 'function') updateAutoRenewUI();
  });
} else {
  updateAcademyNoticeBadge();
  checkAcademyNoticePopups();
  if (typeof updateAutoRenewUI === 'function') updateAutoRenewUI();
}



// 보안 나노시트 전체 페이지 일괄 인쇄 (렌더링된 전체 A4 캔버스 + 페이지별 워터마크 고화질 출력)
function collectNanoSheetPrintCanvases(realWrapper) {
  var list = [];
  if (realWrapper && typeof realWrapper.querySelectorAll === 'function') {
    var nodes = realWrapper.querySelectorAll('canvas.nano-pdf-page-canvas');
    for (var i = 0; i < nodes.length; i++) list.push(nodes[i]);
  }
  if (list.length === 0) {
    var singleCanvas = document.getElementById('pdfViewerCanvas');
    if (singleCanvas) list.push(singleCanvas);
  }
  return list;
}

function buildNanoSheetPrintHtml(imageList, acadName, printTime, ipAddr) {
  var wmBlock =
    '<div class="wm-block">' +
      '<div class="wm-title">' + acadName + '</div>' +
      '<div class="wm-sub">' + printTime + ' &middot; IP: ' + ipAddr + '</div>' +
      '<div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>' +
    '</div>';
  // 페이지당 중앙 1회만 워터마크가 표시되도록 단일 블록과 중앙 정렬 사용
  var wmOverlayHtml = '<div class="wm-overlay">' + wmBlock + '</div>';
  var pagesHtml = imageList.map(function(imgData) {
    return (
      '<div class="sheet-wrapper">' +
        '<img src="' + imgData + '" class="sheet-canvas-img" />' +
        wmOverlayHtml +
      '</div>'
    );
  }).join('');

  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8">' +
    '<title>나노 시트 보안 출력 - ' + acadName + '</title>' +
    '<style>' +
      '@page { size: A4 portrait; margin: 0; }' +
      '* { box-sizing: border-box; }' +
      'html, body { margin: 0; padding: 0; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }' +
      '.sheet-wrapper { position: relative; width: 210mm; height: 296mm; margin: 0 auto; overflow: hidden; background: #fff; display: flex; justify-content: center; align-items: center; page-break-inside: avoid; break-inside: avoid; page-break-after: always; break-after: page; }' +
      '.sheet-wrapper:last-child { page-break-after: auto; break-after: auto; }' +
      'img.sheet-canvas-img { width: 100%; height: 100%; max-width: 210mm; max-height: 296mm; object-fit: contain; display: block; }' +
      '.wm-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; user-select: none; }' +
      '.wm-block { transform: rotate(-28deg); opacity: 0.16; font-weight: 900; text-align: center; color: #000; line-height: 1.4; user-select: none; margin: 0; }' +
      '.wm-title { font-size: 22px; letter-spacing: -0.5px; color: #1e293b; }' +
      '.wm-sub { font-size: 14.5px; font-family: monospace; color: #334155; }' +
      '.wm-warn { font-size: 11px; color: #dc2626; font-weight: 800; margin-top: 2px; }' +
    '</style></head><body>' +
    pagesHtml +
    '<script>' +
      'function triggerNanoSheetPrint() {' +
        'var imgs = Array.prototype.slice.call(document.images || []);' +
        'Promise.all(imgs.map(function(img) {' +
          'if (img.complete) return Promise.resolve();' +
          'return new Promise(function(res) { img.onload = res; img.onerror = res; });' +
        '})).then(function() {' +
          'setTimeout(function() {' +
            'window.focus(); window.print();' +
          '}, 200);' +
        '});' +
      '}' +
      'window.onafterprint = function() { setTimeout(function() { window.close(); }, 300); };' +
      'window.onload = triggerNanoSheetPrint;' +
    '<\/script></body></html>';
}

function printNanoSheetViewer() {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var canvases = collectNanoSheetPrintCanvases(realWrapper);

  if (canvases.length === 0 || !realWrapper || realWrapper.style.display === 'none') {
    window.print();
    return;
  }

  var escWm = typeof escapeWatermarkHtml === 'function'
    ? escapeWatermarkHtml
    : function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var wmAcadEl = document.getElementById('wmAcademyName');
  var rawAcadName = (wmAcadEl && wmAcadEl.innerText && wmAcadEl.innerText.trim() && wmAcadEl.innerText.trim() !== '가맹 학원')
    ? wmAcadEl.innerText.trim()
    : (typeof getWatermarkAcademyName === 'function' ? getWatermarkAcademyName() : '가맹 학원');
  var wmTimeEl = document.getElementById('wmPrintTime');
  var rawPrintTime = (wmTimeEl && wmTimeEl.innerText && wmTimeEl.innerText.trim() && wmTimeEl.innerText.trim() !== '-')
    ? wmTimeEl.innerText.trim()
    : new Date().toISOString().slice(0, 16).replace('T', ' ');
  var wmIpEl = document.getElementById('wmIpAddress');
  var rawIpAddr = (wmIpEl && wmIpEl.innerText && wmIpEl.innerText.trim() && wmIpEl.innerText.trim() !== '-')
    ? wmIpEl.innerText.trim()
    : (typeof getWatermarkClientIp === 'function' ? getWatermarkClientIp() : 'IP 미확인');
  var acadName = escWm(rawAcadName);
  var printTime = escWm(rawPrintTime);
  var ipAddr = escWm(rawIpAddr);

  var printWin = window.open('', '_blank', 'width=850,height=1100');
  if (!printWin) {
    window.print();
    return;
  }

  var flushPrintPages = function() {
    var currentCanvases = collectNanoSheetPrintCanvases(document.getElementById('realPdfViewerWrapper'));
    if (currentCanvases.length === 0) currentCanvases = canvases;
    var imageList = currentCanvases.map(function(canvas) {
      return canvas.toDataURL('image/png');
    });
    printWin.document.open();
    printWin.document.write(buildNanoSheetPrintHtml(imageList, acadName, printTime, ipAddr));
    printWin.document.close();
  };

  // 아직 전체 페이지 캔버스 렌더링이 진행 중인 경우 완료 후 전체 페이지를 한 번에 출력
  var hasPendingRender = (typeof activePdfRenderPromise !== 'undefined' && activePdfRenderPromise)
    || canvases.some(function(c) { return typeof c.getAttribute === 'function' && c.getAttribute('data-rendered') === '0'; });

  if (hasPendingRender && typeof activePdfRenderPromise !== 'undefined' && activePdfRenderPromise) {
    printWin.document.write('<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#475569;">전체 나노 시트 페이지를 준비 중입니다...</body></html>');
    printWin.document.close();
    activePdfRenderPromise.then(flushPrintPages, flushPrintPages);
  } else {
    flushPrintPages();
  }
}

