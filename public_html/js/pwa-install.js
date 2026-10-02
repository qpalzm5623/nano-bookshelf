/**
 * 나노의 책장 (Nano BookShelf) PWA 설치 유도 및 모바일 최적화 스크립트
 * - Android: beforeinstallprompt 이벤트 기반 원클릭 설치 지원
 * - iOS: Safari '홈 화면에 추가' 안내 툴팁 제공
 * - 독립형(Standalone) 앱 모드 실행 시 배너 자동 숨김
 */

(function () {
  'use strict';

  // 이미 독립 실행형(PWA 설치 모드)으로 구동 중이면 배너 미노출
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
  if (isStandalone) {
    return;
  }

  // 사용자가 24시간 내에 닫은 경우 미노출
  const hideUntil = localStorage.getItem('nano_pwa_banner_hide_until');
  if (hideUntil && new Date().getTime() < parseInt(hideUntil, 10)) {
    return;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;

  let deferredPrompt = null;

  // 배너 HTML 및 스타일 생성
  function renderInstallBanner(type) {
    if (document.getElementById('nanoPwaInstallBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'nanoPwaInstallBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(120%);
      width: calc(100% - 32px);
      max-width: 440px;
      background: #ffffff;
      border: 1.5px solid #e5ded2;
      border-radius: 18px;
      box-shadow: 0 16px 36px rgba(45, 36, 30, 0.18), 0 4px 12px rgba(0,0,0,0.06);
      padding: 14px 16px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Pretendard Variable', sans-serif;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const iconHtml = `
      <img src="resources/images/icons/icon-192.png" alt="나노의 책장"
           style="width: 48px; height: 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); flex-shrink: 0; background: #f8f6f0;"
           onerror="this.src='resources/images/common/logo.png'">
    `;

    let contentHtml = '';
    if (type === 'android') {
      contentHtml = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 14px; font-weight: 700; color: #2d241e; line-height: 1.3;">나노의 책장 앱 설치</div>
          <div style="font-size: 12px; color: #7d7165; margin-top: 2px;">홈 화면에 추가하여 앱처럼 편리하게 이용하세요!</div>
        </div>
        <button id="btnPwaInstallAction" style="
          background: #2d6a4f;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
        ">설치</button>
      `;
    } else {
      // iOS Safari 안내
      contentHtml = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13.5px; font-weight: 700; color: #2d241e; line-height: 1.3;">홈 화면에 앱으로 추가하기</div>
          <div style="font-size: 11.5px; color: #7d7165; margin-top: 2px; line-height: 1.4;">
            하단 공유 <span style="display:inline-block; vertical-align:middle;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></span> 버튼 누른 후 <strong>[홈 화면에 추가]</strong>를 선택하세요.
          </div>
        </div>
      `;
    }

    const closeBtn = `
      <button id="btnPwaCloseBanner" aria-label="닫기" style="
        background: transparent;
        border: none;
        color: #a09589;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        padding: 4px;
        margin-left: 2px;
      ">&times;</button>
    `;

    banner.innerHTML = iconHtml + contentHtml + closeBtn;
    document.body.appendChild(banner);

    // 슬라이드업 애니메이션
    requestAnimationFrame(() => {
      setTimeout(() => {
        banner.style.transform = 'translateX(-50%) translateY(0)';
      }, 100);
    });

    // 닫기 버튼 핸들러 (24시간 동안 숨김)
    document.getElementById('btnPwaCloseBanner').addEventListener('click', () => {
      banner.style.transform = 'translateX(-50%) translateY(120%)';
      setTimeout(() => banner.remove(), 400);
      const tomorrow = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('nano_pwa_banner_hide_until', tomorrow.toString());
    });

    // Android 설치 액션 핸들러
    if (type === 'android') {
      const installBtn = document.getElementById('btnPwaInstallAction');
      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] User response to install prompt:', outcome);
          deferredPrompt = null;
          banner.style.transform = 'translateX(-50%) translateY(120%)';
          setTimeout(() => banner.remove(), 400);
        });
      }
    }
  }

  // Android: beforeinstallprompt 이벤트 감지
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    renderInstallBanner('android');
  });

  // iOS Safari: 모바일 사파리 접속 시 안내
  if (isIOS && !isStandalone) {
    // 페이지 로드 3초 후 은은하게 안내 배너 렌더링
    window.addEventListener('load', () => {
      setTimeout(() => {
        renderInstallBanner('ios');
      }, 2500);
    });
  }

  // 앱 설치 완료 감지
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] 나노의 책장 앱이 성공적으로 설치되었습니다.');
    const banner = document.getElementById('nanoPwaInstallBanner');
    if (banner) banner.remove();
  });
})();
