document.addEventListener('DOMContentLoaded', function () {
  var sidebar = document.querySelector('.simple-sidebar');
  var workspace = document.querySelector('.main-workspace');
  if (sidebar && workspace) {
    sidebar.id = 'nanoSidebar';
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'nano-menu-toggle'; button.textContent = '☰ 메뉴';
    button.setAttribute('aria-controls', sidebar.id); button.setAttribute('aria-expanded', 'false');
    function closeMenu() { document.body.classList.remove('nano-menu-open'); button.setAttribute('aria-expanded', 'false'); }
    button.addEventListener('click', function () {
      var open = document.body.classList.toggle('nano-menu-open'); button.setAttribute('aria-expanded', String(open));
    });
    workspace.prepend(button);
    sidebar.addEventListener('click', function (event) { if (event.target.closest('.nav-item-btn')) closeMenu(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && document.body.classList.contains('nano-menu-open')) { closeMenu(); button.focus(); } });
    workspace.addEventListener('click', function (event) { if (event.target !== button) closeMenu(); });
  }
  document.querySelectorAll('a[onclick]:not([href])').forEach(function (item) {
    item.setAttribute('role', 'button'); item.tabIndex = 0;
    item.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); } });
  });
  document.querySelectorAll('#masterToast, #academyToast, #toast').forEach(function (item) {
    item.setAttribute('role', 'status'); item.setAttribute('aria-live', 'polite'); item.setAttribute('aria-atomic', 'true');
  });
  document.querySelectorAll('.table-responsive').forEach(function (table) {
    table.tabIndex = 0; table.setAttribute('role', 'region'); table.setAttribute('aria-label', '목록 표. 좌우로 스크롤할 수 있습니다.');
    var hint = document.createElement('p'); hint.className = 'nano-table-hint'; hint.textContent = '표를 좌우로 밀어 나머지 항목을 확인하세요.'; table.before(hint);
  });
  document.querySelectorAll('a[href="index.html"]').forEach(function (link) {
    if (!(link.title + link.textContent).includes('로그아웃')) return;
    link.addEventListener('click', function (event) { event.preventDefault(); NanoPortal.logout().catch(function(e) { alert(e.message); }); });
  });
});

// ==============================================================
// 15분 미활동 자동 로그아웃 확인 모달 & 뒤로가기 세션 유지 공통 모듈
// ==============================================================
(function () {
  // 15분 = 900초 = 900,000ms
  var INACTIVITY_LIMIT = 15 * 60 * 1000;
  // 카운트다운 대기 시간 = 60초
  var COUNTDOWN_TOTAL = 60;

  var lastActivity = Date.now();
  var checkInterval = null;
  var countdownInterval = null;
  var countdownRemaining = COUNTDOWN_TOTAL;
  var isModalVisible = false;

  // 세션 타임아웃 확인 모달 동적 생성 및 주입
  function createTimeoutModal() {
    if (document.getElementById('nanoSessionModalOverlay')) return;

    var style = document.createElement('style');
    style.id = 'nanoSessionModalStyle';
    style.textContent = `
      #nanoSessionModalOverlay {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(35, 27, 21, 0.65);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 9999999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        animation: nanoFadeIn .2s ease-out;
      }
      @keyframes nanoFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      #nanoSessionModalCard {
        background: #ffffff;
        border-radius: 22px;
        max-width: 430px;
        width: 100%;
        padding: 28px 24px;
        box-shadow: 0 25px 60px -10px rgba(45, 35, 25, 0.35);
        border: 1.5px solid #ece4d8;
        text-align: center;
        box-sizing: border-box;
        font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
        animation: nanoPopUp .25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes nanoPopUp {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .nano-session-icon {
        width: 58px;
        height: 58px;
        background: #fff4eb;
        border: 2px solid #fed7aa;
        color: #e06d53;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        margin-bottom: 16px;
      }
      .nano-session-title {
        font-size: 19px;
        font-weight: 800;
        color: #2b231d;
        margin-bottom: 8px;
        letter-spacing: -0.3px;
      }
      .nano-session-desc {
        font-size: 13.5px;
        color: #6e6259;
        line-height: 1.55;
        margin-bottom: 18px;
      }
      .nano-session-timer-box {
        background: #fdfaf6;
        border: 1.5px dashed #f59e0b;
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 22px;
        font-size: 13.5px;
        font-weight: 700;
        color: #b45309;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .nano-session-timer-num {
        font-size: 20px;
        font-weight: 900;
        color: #dc2626;
        min-width: 28px;
        display: inline-block;
      }
      .nano-session-actions {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
      }
      .nano-session-btn {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: all .15s ease-in-out;
      }
      .nano-session-btn-logout {
        background: #f5f2eb;
        color: #786d63;
        border: 1px solid #dfd7cc;
      }
      .nano-session-btn-logout:hover {
        background: #eae5dc;
        color: #3d342d;
      }
      .nano-session-btn-stay {
        background: #1f8a7e;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(31, 138, 126, 0.25);
      }
      .nano-session-btn-stay:hover {
        background: #176f65;
        box-shadow: 0 6px 16px rgba(31, 138, 126, 0.35);
      }
    `;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'nanoSessionModalOverlay';
    overlay.innerHTML = `
      <div id="nanoSessionModalCard" role="dialog" aria-modal="true" aria-labelledby="nanoSessionTitle">
        <div class="nano-session-icon">⏳</div>
        <div class="nano-session-title" id="nanoSessionTitle">로그인을 유지하시겠습니까?</div>
        <div class="nano-session-desc">
          15분 동안 활동이 감지되지 않아 안내해 드립니다.<br>
          계속 이용하시려면 아래 <strong>[로그인 유지]</strong> 버튼을 눌러주세요.
        </div>
        <div class="nano-session-timer-box">
          <i class="fa-solid fa-clock"></i>
          <span><span class="nano-session-timer-num" id="nanoSessionCountdown">60</span>초 후 자동으로 로그아웃됩니다.</span>
        </div>
        <div class="nano-session-actions">
          <button type="button" class="nano-session-btn nano-session-btn-logout" id="nanoSessionBtnLogout">
            로그아웃
          </button>
          <button type="button" class="nano-session-btn nano-session-btn-stay" id="nanoSessionBtnStay">
            로그인 유지
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 이벤트 리스너 연결
    document.getElementById('nanoSessionBtnLogout').addEventListener('click', function () {
      executeSafeLogout();
    });

    document.getElementById('nanoSessionBtnStay').addEventListener('click', function () {
      keepSessionAlive();
    });
  }

  // 안전 로그아웃 실행 (사용자 확인 미응답 또는 [로그아웃] 클릭 시)
  function executeSafeLogout() {
    isModalVisible = false;
    if (countdownInterval) clearInterval(countdownInterval);
    if (checkInterval) clearInterval(checkInterval);

    var overlay = document.getElementById('nanoSessionModalOverlay');
    if (overlay) overlay.style.display = 'none';

    if (window.NanoPortal && typeof window.NanoPortal.logout === 'function') {
      window.NanoPortal.logout().catch(function () {
        sessionStorage.removeItem('nano_auth_user');
        window.location.href = 'index.html';
      });
    } else {
      sessionStorage.removeItem('nano_auth_user');
      window.location.href = 'index.html';
    }
  }

  // 로그인 유지 (확인) 처리
  function keepSessionAlive() {
    isModalVisible = false;
    if (countdownInterval) clearInterval(countdownInterval);
    lastActivity = Date.now();

    var overlay = document.getElementById('nanoSessionModalOverlay');
    if (overlay) overlay.style.display = 'none';

    // 토스트 안내 지원
    if (typeof window.toast === 'function') {
      window.toast('로그인 상태가 15분 연장되었습니다.');
    } else if (typeof window.showToast === 'function') {
      window.showToast('로그인 상태가 15분 연장되었습니다.');
    }
  }

  // 타임아웃 경고 모달 표시 (15분 미활동 도달 시)
  function showTimeoutModal() {
    if (isModalVisible) return;
    createTimeoutModal();

    isModalVisible = true;
    countdownRemaining = COUNTDOWN_TOTAL;

    var numEl = document.getElementById('nanoSessionCountdown');
    if (numEl) numEl.textContent = String(countdownRemaining);

    var overlay = document.getElementById('nanoSessionModalOverlay');
    if (overlay) overlay.style.display = 'flex';

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(function () {
      countdownRemaining--;
      if (numEl) numEl.textContent = String(countdownRemaining);

      if (countdownRemaining <= 0) {
        clearInterval(countdownInterval);
        executeSafeLogout();
      }
    }, 1000);
  }

  // 사용자 활동 감지 리스너 (모달이 떠있지 않을 때만 타이머 갱신)
  var activityThrottle = 0;
  function registerActivity() {
    if (isModalVisible) return; // 모달이 뜬 상태에서는 반드시 확인 버튼을 눌러야 연장됨
    var now = Date.now();
    if (now - activityThrottle > 1000) {
      activityThrottle = now;
      lastActivity = now;
    }
  }

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (eventName) {
    window.addEventListener(eventName, registerActivity, { passive: true });
  });

  // 15분 경과 여부 주기적 체크 (5초마다 점검)
  checkInterval = setInterval(function () {
    if (isModalVisible) return;
    if (Date.now() - lastActivity >= INACTIVITY_LIMIT) {
      showTimeoutModal();
    }
  }, 5000);

  // 뒤로가기 시 로그인 풀림 방지 (히스토리 가드)
  function initHistoryGuard() {
    try {
      if (!history.state || !history.state.nanoSessionGuard) {
        history.pushState({ nanoSessionGuard: true }, '', location.href);
      }
      window.addEventListener('popstate', function (event) {
        var pathname = window.location.pathname.toLowerCase();
        // student_preview.html은 자체 SPA 패널 히스토리 관리에서 유연하게 처리
        if (pathname.includes('student_preview')) return;

        // admin_preview 및 master_preview에서 뒤로가기 시 index.html로의 실수 이탈 방지
        history.pushState({ nanoSessionGuard: true }, '', location.href);
      });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initHistoryGuard();
    });
  } else {
    initHistoryGuard();
  }
})();

// ==============================================================
// [전역 표준] 모든 연락처 섹션 하이픈 자동 포맷팅 유틸리티 & 리스너
// ==============================================================
(function () {
  function formatPhoneNumber(val) {
    if (val == null) return '-';
    if (typeof val === 'object' && val !== null && 'value' in val) {
      val.value = formatPhoneNumber(val.value);
      return val.value;
    }
    var str = String(val).trim();
    if (!str || str === '-' || str === 'null' || str === 'undefined') return '-';

    // 이미 표준 하이픈 규격이면 그대로 반환
    if (/^\d{2,4}-\d{3,4}-\d{4}$/.test(str)) return str;

    var clean = str.replace(/[^0-9]/g, '');
    if (!clean) return str;

    // 1. 서울 지역번호 02
    if (clean.startsWith('02')) {
      if (clean.length === 9) {
        return clean.slice(0, 2) + '-' + clean.slice(2, 5) + '-' + clean.slice(5);
      } else if (clean.length === 10) {
        return clean.slice(0, 2) + '-' + clean.slice(2, 6) + '-' + clean.slice(6);
      } else if (clean.length < 9) {
        return clean.length <= 2 ? clean : clean.slice(0, 2) + '-' + clean.slice(2);
      }
    }

    // 2. 전국 대표번호 (1544, 1588, 1600 등 8자리)
    if (clean.length === 8 && /^(15|16|18)\d{2}/.test(clean)) {
      return clean.slice(0, 4) + '-' + clean.slice(4);
    }

    // 3. 휴대폰(010, 011 등) 및 일반 지역번호(031, 032, 051 등)
    if (clean.length === 11) {
      return clean.slice(0, 3) + '-' + clean.slice(3, 7) + '-' + clean.slice(7);
    } else if (clean.length === 10) {
      return clean.slice(0, 3) + '-' + clean.slice(3, 6) + '-' + clean.slice(6);
    } else if (clean.length === 12) {
      return clean.slice(0, 4) + '-' + clean.slice(4, 8) + '-' + clean.slice(8);
    } else if (clean.length > 11) {
      return clean.slice(0, 3) + '-' + clean.slice(3, 7) + '-' + clean.slice(7, 11);
    }

    // 4. 입력 중이거나 짧은 경우
    if (clean.length < 7) return '-';
    if (clean.length === 7) return clean.slice(0, 3) + '-' + clean.slice(3);
    return clean.slice(0, 3) + '-' + clean.slice(3, 7) + '-' + clean.slice(7);
  }

  // 전역 유틸리티 함수로 등록 (어느 JS 파일에서나 즉시 호출 가능)
  if (typeof window !== 'undefined') {
    window.formatPhoneNumber = formatPhoneNumber;
    window.formatPhoneInput = function(input) {
      if (!input) return;
      input.value = formatPhoneNumber(input.value);
    };
  }

  // 실시간 입력(input) 시 사이트 내 모든 전화번호 입력창 자동 하이픈 삽입
  document.addEventListener('input', function (e) {
    var target = e.target;
    if (!target || target.tagName !== 'INPUT') return;
    var id = (target.id || '').toLowerCase();
    var name = (target.name || '').toLowerCase();
    var type = (target.type || '').toLowerCase();
    var placeholder = (target.placeholder || '').toLowerCase();

    // 통합 검색창은 연락처도 검색하지만 전화번호 입력란은 아닙니다.
    if (type === 'search' || id.includes('search') || name.includes('search') || placeholder.includes('검색') || e.isComposing) return;

    var isPhoneField = type === 'tel' ||
      id.includes('phone') || id.includes('cell') || id.includes('tel') ||
      name.includes('phone') || name.includes('cell') || name.includes('tel') ||
      placeholder.includes('010') || placeholder.includes('연락처') || placeholder.includes('전화');

    if (isPhoneField) {
      var prevLen = target.value.length;
      var cursor = target.selectionStart;
      target.value = formatPhoneNumber(target.value);
      var newLen = target.value.length;
      if (cursor != null) {
        var newCursor = cursor + (newLen - prevLen);
        target.setSelectionRange(newCursor, newCursor);
      }
    }
  });
})();
