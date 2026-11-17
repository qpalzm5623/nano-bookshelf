(function () {
  'use strict';
  var jd = location.hostname.toLowerCase() === 'jd.nanosbook.co.kr';
  document.documentElement.dataset.brand = jd ? 'JD' : 'NANO';
  if (window.NANO_RESTRICTED_MASTER) document.documentElement.dataset.restrictedMaster = 'true';

  var JD_LOGO_SRC = '/resources/images/common/jd-logo.png';
  if (jd) {
    // 캐시된 portal-brand.css 여부와 무관하게 파싱 단계에서 기본 로고 노출을 즉시 차단
    if (document.head) {
      var noFoucStyle = document.createElement('style');
      noFoucStyle.textContent = 'html[data-brand="JD"] img[src*="images/common/logo"]:not([data-jd-logo]),html[data-brand="JD"] img[data-portal-logo]:not([data-jd-logo]){visibility:hidden!important;}';
      document.head.appendChild(noFoucStyle);
    }
    if (typeof Image === 'function') {
      var preloadLogo = new Image();
      preloadLogo.src = JD_LOGO_SRC;
    }
  }

  function swapLogoImg(img) {
    if (!jd || !img || img.dataset.jdLogo) return;
    img.src = JD_LOGO_SRC;
    img.alt = '정답이 있는 독서';
    img.dataset.jdLogo = 'true';
  }

  function applyLogos(root) {
    if (!jd || !root) return;
    if (root.nodeType === 1 && root.matches && root.matches('img[src*="images/common/logo"], img[data-portal-logo]')) {
      swapLogoImg(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('img[src*="images/common/logo"], img[data-portal-logo]').forEach(swapLogoImg);
    }
  }

  function apply(root) {
    applyLogos(root);
    if (!window.NANO_RESTRICTED_MASTER) return;
    document.documentElement.dataset.restrictedMaster = 'true';
    root.querySelectorAll('[onclick], [data-target]').forEach(function (el) {
      var action = el.getAttribute('onclick') || '';
      var target = el.getAttribute('data-target') || '';
      if (/^(openAcademyRegisterModal|openAcademyDeleteConfirm|restoreDeletedAcademy|quickToggleStudentApproval|openMemberExcelModal|openMasterMemberAddModal|retryDispatch|openAligoCharge|openMasterQuizExcel|openQuizExcelUploadModal)/.test(action) || target === '#academyRegisterModal') {
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
      }
    });
    root.querySelectorAll('#academyEditModal input, #academyEditModal select, #academyEditModal textarea, #memberDetailModal input, #memberDetailModal select, #memberDetailModal textarea').forEach(function (el) { el.disabled = true; });
    root.querySelectorAll('#academyEditModal button, #memberDetailModal button').forEach(function (el) {
      if (el.getAttribute('data-dismiss') !== 'modal' && !el.classList.contains('close')) el.disabled = true;
    });
  }

  // HTML 파싱 단계부터 즉시 로고를 치환해 기본 로고가 첫 프레임에 그려지지 않도록 방지
  if (jd && typeof MutationObserver === 'function' && document.documentElement) {
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j] && added[j].nodeType === 1) applyLogos(added[j]);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (jd) {
      document.title = document.title.replace(/나노의\s*책장/g, '정답이 있는 독서');
      var color = document.querySelector('meta[name="theme-color"]');
      if (color) color.content = '#1649db';
      document.querySelectorAll('link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function (el) { el.href = JD_LOGO_SRC; });
    }
    apply(document);
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; apply(document); });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
