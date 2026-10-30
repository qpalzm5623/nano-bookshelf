/** 모바일·태블릿 PWA 설치: 지원 브라우저는 설치 버튼, 그 외에는 홈 화면 추가 안내. */
(function () {
  'use strict';

  const ua = navigator.userAgent || '';
  // iPadOS의 데스크톱 웹사이트 모드는 Macintosh로 보고됩니다.
  const isIOS = /iPad|iPhone|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const isMobile = isIOS || /Android/i.test(ua) || navigator.userAgentData?.mobile === true;
  const isInApp = /KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\/|; wv\)/i.test(ua);
  const displayMode = window.matchMedia('(display-mode: standalone)');
  const hideKey = 'nano_pwa_banner_hide_until';
  let installed = false;
  let dismissed = false;
  let deferredPrompt = null;
  let installing = false;

  // 저장소 사용이 차단된 브라우저에서도 설치 안내는 동작합니다.
  function isHidden() {
    if (dismissed) return true;
    try {
      return Date.now() < Number(localStorage.getItem(hideKey));
    } catch (_) {
      return false;
    }
  }

  function isStandalone() {
    return installed || displayMode.matches || navigator.standalone === true;
  }

  function removeBanner() {
    document.getElementById('nanoPwaInstallBanner')?.remove();
  }

  function dismissBanner() {
    dismissed = true;
    try {
      localStorage.setItem(hideKey, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch (_) { /* 현재 페이지에서는 dismissed로 중복 노출을 막습니다. */ }
    removeBanner();
  }

  function manualInstructions() {
    if (isInApp) {
      return isIOS
        ? 'Safari에서 이 주소를 열어 공유 → 홈 화면에 추가를 선택하세요. 웹 앱으로 열기 옵션이 보이면 켜고 추가하세요.'
        : '앱 메뉴에서 외부 브라우저로 열거나 주소를 Chrome에 붙여넣은 뒤, 메뉴 → 앱 설치 또는 홈 화면에 추가를 선택하세요.';
    }
    if (isIOS) {
      return '공유 → 홈 화면에 추가를 선택하고, 웹 앱으로 열기 옵션이 보이면 켜고 추가하세요. 항목이 없으면 Safari에서 열어 주세요.';
    }
    return '브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택하세요. 항목이 보이지 않으면 Chrome에서 열어 주세요.';
  }

  function updateBanner(message) {
    const description = document.getElementById('nanoPwaInstallDescription');
    const button = document.getElementById('btnPwaInstallAction');
    if (!description || !button) return;
    description.textContent = message || (deferredPrompt
      ? '설치 후 홈 화면 아이콘을 누르면 주소창 없이 앱으로 열립니다.'
      : manualInstructions());
    button.hidden = !deferredPrompt;
    button.disabled = installing;
    button.textContent = installing ? '설치 확인 중…' : '설치';
  }

  async function installApp() {
    if (!deferredPrompt || installing) return;
    const prompt = deferredPrompt;
    installing = true;
    updateBanner();
    try {
      // 브라우저 설치 창은 사용자가 버튼을 누른 시점에만 열 수 있습니다.
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') {
        installed = true;
        removeBanner();
      } else {
        dismissBanner();
      }
    } catch (_) {
      deferredPrompt = null;
      updateBanner('설치 창을 열지 못했습니다. ' + manualInstructions());
    } finally {
      installing = false;
      const button = document.getElementById('btnPwaInstallAction');
      if (button) button.disabled = false;
    }
  }

  function renderInstallBanner() {
    if (!isMobile || !window.isSecureContext || isStandalone() || isHidden() || !document.body) return;
    if (document.getElementById('nanoPwaInstallBanner')) {
      updateBanner();
      return;
    }

    if (!document.getElementById('nanoPwaInstallStyle')) {
      const style = document.createElement('style');
      style.id = 'nanoPwaInstallStyle';
      style.textContent = `
        #nanoPwaInstallBanner {
          position: fixed; bottom: calc(80px + env(safe-area-inset-bottom, 0px));
          left: 50%; transform: translateX(-50%); box-sizing: border-box;
          width: calc(100% - 32px); max-width: 460px;
          max-height: calc(100dvh - 120px); overflow-y: auto;
          background: #fff; color: #2d241e; border: 1.5px solid #e5ded2;
          border-radius: 18px; box-shadow: 0 12px 32px rgba(45,36,30,.18);
          padding: 14px; z-index: 999999; display: grid;
          grid-template-columns: 44px minmax(0, 1fr) 44px; gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Pretendard Variable', sans-serif;
          text-align: left; line-height: 1.5;
        }
        #nanoPwaInstallBanner img { width: 44px; height: 44px; border-radius: 10px; }
        #nanoPwaInstallBanner h2 { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
        #nanoPwaInstallDescription { font-size: 13px; color: #65594d; margin: 0; overflow-wrap: anywhere; }
        #nanoPwaInstallBanner button { min-height: 44px; font: inherit; cursor: pointer; border-radius: 10px; }
        #btnPwaInstallAction { margin-top: 10px; padding: 8px 18px; border: 0; background: #2d6a4f; color: #fff; }
        #btnPwaInstallAction:disabled { opacity: .7; cursor: wait; }
        #btnPwaCloseBanner { align-self: start; width: 44px; padding: 0; border: 0; background: transparent; color: #65594d; font-size: 24px !important; }
        #nanoPwaInstallBanner button:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
      `;
      document.head.appendChild(style);
    }

    const banner = document.createElement('section');
    banner.id = 'nanoPwaInstallBanner';
    banner.setAttribute('aria-labelledby', 'nanoPwaInstallTitle');
    banner.innerHTML = `
      <img src="resources/images/icons/icon-192.png" alt="" width="44" height="44">
      <div>
        <h2 id="nanoPwaInstallTitle">나노의 책장 앱 설치</h2>
        <p id="nanoPwaInstallDescription" aria-live="polite"></p>
        <button type="button" id="btnPwaInstallAction" hidden>설치</button>
      </div>
      <button type="button" id="btnPwaCloseBanner" aria-label="설치 안내 24시간 닫기">×</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('btnPwaInstallAction').addEventListener('click', installApp);
    document.getElementById('btnPwaCloseBanner').addEventListener('click', dismissBanner);
    banner.addEventListener('keydown', event => {
      if (event.key === 'Escape') dismissBanner();
    });
    updateBanner();
  }

  // 닫은 상태에서도 이벤트를 수신해 브라우저 기본 배너의 중복 노출을 막습니다.
  window.addEventListener('beforeinstallprompt', event => {
    if (!isMobile || !window.isSecureContext) return;
    event.preventDefault();
    deferredPrompt = event;
    renderInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    removeBanner();
  });
  displayMode.addEventListener?.('change', () => {
    if (isStandalone()) removeBanner();
  });

  // 설치 이벤트가 없는 iOS·인앱 브라우저·Android에도 수동 설치 방법을 안내합니다.
  function scheduleBanner() {
    if (isMobile && window.isSecureContext) setTimeout(renderInstallBanner, 2500);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBanner, { once: true });
  } else {
    scheduleBanner();
  }
})();
