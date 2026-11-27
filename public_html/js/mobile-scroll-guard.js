/* iOS에서도 화면 경계를 당길 때 빈 공간이 생기지 않도록 터치 이동을 제한합니다. */
(function () {
  'use strict';
  var login = document.querySelector('.login-container');
  var root = login ? document.body : document.getElementById('characterSelectModal');
  if (!root) return;
  var previousY = 0;
  var scroller = null;
  root.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1) return;
    previousY = event.touches[0].clientY;
    scroller = event.target.closest(login ? '.login-container, .legal-modal-body' : '.student-modal-body');
  }, { passive: true });
  root.addEventListener('touchmove', function (event) {
    if (event.touches.length !== 1) {
      if (login && event.cancelable) event.preventDefault();
      return;
    }
    var y = event.touches[0].clientY;
    var delta = previousY - y;
    previousY = y;
    if (!scroller) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    var max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    var next = scroller.scrollTop + delta;
    if (max === 0 || next <= 0 || next >= max) {
      scroller.scrollTop = Math.max(0, Math.min(max, next));
      if (event.cancelable) event.preventDefault();
    }
  }, { passive: false });
  if (login) {
    // 핀치와 더블 탭 확대를 로그인 화면에만 제한합니다.
    ['gesturestart', 'gesturechange', 'dblclick'].forEach(function (name) {
      root.addEventListener(name, function (event) { event.preventDefault(); }, { passive: false });
    });
    if (window.visualViewport) {
      var resize = function () {
        document.documentElement.style.setProperty('--login-height', window.visualViewport.height + 'px');
      };
      window.visualViewport.addEventListener('resize', resize);
      resize();
    }
  }
})();
