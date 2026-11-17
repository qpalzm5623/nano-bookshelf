(function () {
  'use strict';
  var jd = location.hostname.toLowerCase() === 'jd.nanosbook.co.kr';
  document.documentElement.dataset.brand = jd ? 'JD' : 'NANO';
  if (window.NANO_RESTRICTED_MASTER) document.documentElement.dataset.restrictedMaster = 'true';
  function apply(root) {
    if (jd) {
      root.querySelectorAll('img[src*="images/common/logo"], img[data-portal-logo]').forEach(function (img) {
        if (img.dataset.jdLogo) return;
        img.src = '/resources/images/common/jd-logo.png';
        img.alt = '정답이 있는 독서';
        img.dataset.jdLogo = 'true';
      });
    }
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
  document.addEventListener('DOMContentLoaded', function () {
    if (jd) {
      document.title = document.title.replace(/나노의\s*책장/g, '정답이 있는 독서');
      var color = document.querySelector('meta[name="theme-color"]');
      if (color) color.content = '#1649db';
      document.querySelectorAll('link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function (el) { el.href = '/resources/images/common/jd-logo.png'; });
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
