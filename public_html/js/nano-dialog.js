// 나노의 책장 통합 화면 중앙 알림/확인 모달 (브라우저 상단 기본 alert/confirm 대체)
// 브라우저 환경에서는 window.alert를 자동 오버라이드하여 모든 alert가 화면 중앙 모달로 표시되며,
// confirm 호출부에서는 await nanoConfirm(...)으로 예쁜 중앙 확인 모달을 사용할 수 있습니다.
(function (globalScope) {
  'use strict';

  var STYLE_ID = 'nanoDialogStyles';
  var OVERLAY_ID = 'nanoDialogOverlay';
  var dialogQueue = Promise.resolve();

  function injectDialogStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.nano-dialog-overlay {',
      '  position: fixed; inset: 0; z-index: 11050;',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 20px;',
      '  background: rgba(24, 21, 18, 0.52);',
      '  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);',
      '  opacity: 0; transition: opacity 160ms ease;',
      '}',
      '.nano-dialog-overlay.is-open { opacity: 1; }',
      '.nano-dialog-card {',
      '  width: 100%; max-width: 440px; max-height: min(84vh, 650px);',
      '  background: #ffffff; border-radius: 18px; border: 1px solid #e7dfd4;',
      '  box-shadow: 0 24px 64px rgba(24, 19, 13, 0.28);',
      '  display: flex; flex-direction: column; overflow: hidden;',
      '  font-family: "Noto Sans KR", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  transform: translateY(10px) scale(0.97);',
      '  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);',
      '}',
      '.nano-dialog-overlay.is-open .nano-dialog-card { transform: translateY(0) scale(1); }',
      '.nano-dialog-accent { height: 4px; width: 100%; flex-shrink: 0; }',
      '.nano-dialog-accent.tone-info { background: #1f8a7e; }',
      '.nano-dialog-accent.tone-success { background: #16a34a; }',
      '.nano-dialog-accent.tone-warning { background: #d97706; }',
      '.nano-dialog-accent.tone-danger { background: #dc2626; }',
      '.nano-dialog-accent.tone-kakao { background: #fae100; }',
      '.nano-dialog-header {',
      '  display: flex; align-items: center; justify-content: space-between; gap: 12px;',
      '  padding: 18px 20px 14px; border-bottom: 1px solid #f1ece4;',
      '}',
      '.nano-dialog-title-wrap { display: flex; align-items: center; gap: 11px; min-width: 0; }',
      '.nano-dialog-icon {',
      '  width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;',
      '  display: flex; align-items: center; justify-content: center; font-size: 16px;',
      '}',
      '.nano-dialog-icon.tone-info { background: #eef7f5; color: #1f8a7e; }',
      '.nano-dialog-icon.tone-success { background: #ecfdf5; color: #16a34a; }',
      '.nano-dialog-icon.tone-warning { background: #fffbeb; color: #d97706; }',
      '.nano-dialog-icon.tone-danger { background: #fef2f2; color: #dc2626; }',
      '.nano-dialog-icon.tone-kakao { background: #fae100; color: #3c1e1e; }',
      '.nano-dialog-title {',
      '  margin: 0; font-size: 15.5px; font-weight: 800; color: #1f1a15; line-height: 1.35;',
      '  letter-spacing: -0.02em; word-break: keep-all;',
      '}',
      '.nano-dialog-close {',
      '  border: none; background: transparent; color: #8c8276; cursor: pointer;',
      '  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;',
      '  display: inline-flex; align-items: center; justify-content: center; font-size: 18px;',
      '  transition: background-color 140ms ease, color 140ms ease;',
      '}',
      '.nano-dialog-close:hover { background: #f3efe9; color: #2b241d; }',
      '.nano-dialog-body {',
      '  padding: 18px 22px; overflow-y: auto; flex: 1;',
      '  font-size: 13.8px; line-height: 1.65; color: #2f2821;',
      '  white-space: pre-wrap; word-break: keep-all; overflow-wrap: anywhere;',
      '}',
      '.nano-dialog-kakao-recipient {',
      '  display: flex; align-items: center; justify-content: space-between; gap: 10px;',
      '  background: #fffbeb; border: 1px solid #f5e29b; border-radius: 10px;',
      '  padding: 9px 13px; margin-bottom: 12px; font-size: 13px;',
      '}',
      '.nano-dialog-kakao-recipient-label { font-weight: 700; color: #7c5800; flex-shrink: 0; }',
      '.nano-dialog-kakao-recipient-val { font-weight: 800; color: #2b241d; text-align: right; }',
      '.nano-dialog-kakao-bubble {',
      '  background: #faf8f4; border: 1px solid #ebe3d7; border-radius: 12px;',
      '  padding: 13px 15px; margin-bottom: 11px; color: #26201a;',
      '  font-size: 13.5px; line-height: 1.65; white-space: pre-wrap;',
      '}',
      '.nano-dialog-kakao-link {',
      '  background: #f5f7f6; border: 1px dashed #cfd9d3; border-radius: 9px;',
      '  padding: 8px 11px; margin-bottom: 12px; font-size: 11.8px; color: #475569;',
      '  word-break: break-all;',
      '}',
      '.nano-dialog-question { font-weight: 700; color: #1f1a15; font-size: 13.8px; }',
      '.nano-dialog-note-warn {',
      '  margin-top: 10px; padding: 9px 12px; border-radius: 9px;',
      '  background: #fffbeb; border: 1px solid #fde68a; color: #92400e;',
      '  font-size: 12.5px; line-height: 1.55;',
      '}',
      '.nano-dialog-footer {',
      '  padding: 14px 20px 18px; background: #faf9f6; border-top: 1px solid #f1ece4;',
      '  display: flex; justify-content: flex-end; align-items: center; gap: 9px; flex-shrink: 0;',
      '}',
      '.nano-dialog-btn {',
      '  height: 40px; padding: 0 18px; border-radius: 10px; font-size: 13.5px;',
      '  font-weight: 700; cursor: pointer; transition: all 140ms ease;',
      '  display: inline-flex; align-items: center; justify-content: center; gap: 6px;',
      '  border: 1px solid transparent;',
      '}',
      '.nano-dialog-btn:focus-visible { outline: 3px solid rgba(31, 138, 126, 0.32); outline-offset: 2px; }',
      '.nano-dialog-btn-cancel { background: #f2ede5; color: #4a4036; border-color: #e4ddd3; }',
      '.nano-dialog-btn-cancel:hover { background: #e8e1d6; color: #2b241d; }',
      '.nano-dialog-btn-primary { background: #1f8a7e; color: #ffffff; box-shadow: 0 2px 8px rgba(31, 138, 126, 0.24); }',
      '.nano-dialog-btn-primary:hover { background: #187268; }',
      '.nano-dialog-btn-danger { background: #dc2626; color: #ffffff; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.24); }',
      '.nano-dialog-btn-danger:hover { background: #b91c1c; }',
      '.nano-dialog-btn-kakao { background: #fae100; color: #3c1e1e; border-color: #ecd200; box-shadow: 0 2px 8px rgba(250, 225, 0, 0.28); }',
      '.nano-dialog-btn-kakao:hover { background: #f0d700; }',
      '@media (max-width: 575.98px) {',
      '  .nano-dialog-overlay { padding: 14px; }',
      '  .nano-dialog-card { border-radius: 15px; max-width: 100%; }',
      '  .nano-dialog-header { padding: 15px 16px 12px; }',
      '  .nano-dialog-body { padding: 15px 16px; font-size: 13.5px; }',
      '  .nano-dialog-footer { padding: 12px 16px 15px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function detectDialogMeta(rawText, isConfirm, opts) {
    var msg = String(rawText == null ? '' : rawText).trim();
    var lines = msg.split(/\r?\n/);
    var firstLine = (lines[0] || '').trim();

    if (/알림톡\s*발송\s*미리보기/.test(firstLine) && (msg.indexOf('받는 분:') >= 0 || msg.indexOf('연결 링크:') >= 0)) {
      return {
        kind: 'kakao',
        tone: 'kakao',
        title: (opts && opts.title) || firstLine.replace(/^\[|\]$/g, '').trim(),
        confirmText: (opts && opts.confirmText) || '알림톡 발송',
        cancelText: (opts && opts.cancelText) || '취소',
        iconSvg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.77 1.79 5.21 4.5 6.62-.15.56-.54 2.02-.62 2.34-.1.39.14.38.3.28.12-.08 1.98-1.35 2.79-1.9.95.14 1.97.22 3.03.22 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>'
      };
    }

    var tone = (opts && opts.tone) || 'info';
    if (!opts || !opts.tone) {
      if (isConfirm && /(삭제|비우|해제|초기화|복구|탈퇴|종료|로그아웃)/.test(msg)) {
        tone = 'danger';
      } else if (/(오류|실패|없습니다|입력|선택|불가|초과|유효|중복|주의|차단|누락|확인해\s*주|확인해주세요|⚠)/.test(msg)) {
        tone = isConfirm ? 'warning' : 'warning';
      } else if (!isConfirm && /(완료|저장|성공|복사|불러왔습니다|적용되었습니다)/.test(msg)) {
        tone = 'success';
      }
    }

    var bracketMatch = firstLine.match(/^\[([^\]]{2,40})\]$/);
    var defaultTitle = isConfirm
      ? (tone === 'danger' ? '삭제 · 변경 확인' : '작업 확인')
      : (tone === 'warning' ? '확인 안내' : (tone === 'success' ? '처리 완료' : '알림 안내'));

    var iconMap = {
      danger: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };

    return {
      kind: 'standard',
      tone: tone,
      title: (opts && opts.title) || (bracketMatch ? bracketMatch[1] : defaultTitle),
      stripFirstLine: Boolean(bracketMatch && lines.length > 1),
      confirmText: (opts && opts.confirmText) || (tone === 'danger' && /삭제/.test(msg) ? '삭제하기' : '확인'),
      cancelText: (opts && opts.cancelText) || '취소',
      iconSvg: iconMap[tone] || iconMap.info
    };
  }

  function renderDialogBody(bodyEl, rawText, meta) {
    var msg = String(rawText == null ? '' : rawText).trim();
    if (meta.kind === 'kakao') {
      bodyEl.style.whiteSpace = 'normal';
      var blocks = msg.split(/\n\s*\n/);
      var recipientText = '';
      var linkText = '';
      var questionText = '';
      var contentParts = [];

      blocks.slice(1).forEach(function (block) {
        var trimmed = block.trim();
        if (!trimmed) return;
        if (trimmed.indexOf('받는 분:') === 0) {
          recipientText = trimmed.replace(/^받는 분:\s*/, '');
        } else if (trimmed.indexOf('연결 링크:') === 0) {
          linkText = trimmed.replace(/^연결 링크:\s*/, '');
        } else if (/발송(하시겠습니까|할까요)\??$/.test(trimmed)) {
          questionText = trimmed;
        } else {
          contentParts.push(trimmed);
        }
      });

      if (recipientText) {
        var recBox = document.createElement('div');
        recBox.className = 'nano-dialog-kakao-recipient';
        var recLabel = document.createElement('span');
        recLabel.className = 'nano-dialog-kakao-recipient-label';
        recLabel.textContent = '받는 분';
        var recVal = document.createElement('span');
        recVal.className = 'nano-dialog-kakao-recipient-val';
        recVal.textContent = recipientText;
        recBox.appendChild(recLabel);
        recBox.appendChild(recVal);
        bodyEl.appendChild(recBox);
      }

      if (contentParts.length > 0) {
        var bubble = document.createElement('div');
        bubble.className = 'nano-dialog-kakao-bubble';
        bubble.textContent = contentParts.join('\n\n');
        bodyEl.appendChild(bubble);
      }

      if (linkText) {
        var linkBox = document.createElement('div');
        linkBox.className = 'nano-dialog-kakao-link';
        linkBox.textContent = '연결 링크: ' + linkText;
        bodyEl.appendChild(linkBox);
      }

      if (questionText) {
        var qEl = document.createElement('div');
        qEl.className = 'nano-dialog-question';
        qEl.textContent = questionText;
        bodyEl.appendChild(qEl);
      }
      return;
    }

    var displayText = msg;
    if (meta.stripFirstLine) {
      displayText = msg.split(/\r?\n/).slice(1).join('\n').trim();
    }

    var paragraphs = displayText.split(/\n/);
    var normalLines = [];
    var warnLines = [];
    paragraphs.forEach(function (line) {
      if (/^[※*]/.test(line.trim())) {
        warnLines.push(line.trim());
      } else {
        normalLines.push(line);
      }
    });

    if (normalLines.length > 0) {
      var mainTextEl = document.createElement('div');
      mainTextEl.textContent = normalLines.join('\n').trim();
      bodyEl.appendChild(mainTextEl);
    }

    if (warnLines.length > 0) {
      var warnEl = document.createElement('div');
      warnEl.className = 'nano-dialog-note-warn';
      warnEl.textContent = warnLines.join('\n');
      bodyEl.appendChild(warnEl);
    }
  }

  function showCenteredDialog(message, isConfirm, opts) {
    if (typeof document === 'undefined' || !document.body) {
      if (isConfirm && typeof globalScope.confirm === 'function') {
        return Promise.resolve(Boolean(globalScope.confirm(message)));
      }
      return Promise.resolve(isConfirm ? false : undefined);
    }

    var run = function () {
      return new Promise(function (resolve) {
        injectDialogStyles();

        var existing = document.getElementById(OVERLAY_ID);
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        var meta = detectDialogMeta(message, isConfirm, opts);
        var overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'nano-dialog-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'nanoDialogTitle');

        var card = document.createElement('div');
        card.className = 'nano-dialog-card';

        var accent = document.createElement('div');
        accent.className = 'nano-dialog-accent tone-' + meta.tone;
        card.appendChild(accent);

        var header = document.createElement('div');
        header.className = 'nano-dialog-header';

        var titleWrap = document.createElement('div');
        titleWrap.className = 'nano-dialog-title-wrap';

        var iconWrap = document.createElement('div');
        iconWrap.className = 'nano-dialog-icon tone-' + meta.tone;
        iconWrap.innerHTML = meta.iconSvg;

        var titleEl = document.createElement('h5');
        titleEl.id = 'nanoDialogTitle';
        titleEl.className = 'nano-dialog-title';
        titleEl.textContent = meta.title;

        titleWrap.appendChild(iconWrap);
        titleWrap.appendChild(titleEl);
        header.appendChild(titleWrap);

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'nano-dialog-close';
        closeBtn.setAttribute('aria-label', '닫기');
        closeBtn.textContent = '×';
        header.appendChild(closeBtn);
        card.appendChild(header);

        var bodyEl = document.createElement('div');
        bodyEl.className = 'nano-dialog-body';
        renderDialogBody(bodyEl, message, meta);
        card.appendChild(bodyEl);

        var footer = document.createElement('div');
        footer.className = 'nano-dialog-footer';

        var cancelBtn = null;
        if (isConfirm) {
          cancelBtn = document.createElement('button');
          cancelBtn.type = 'button';
          cancelBtn.className = 'nano-dialog-btn nano-dialog-btn-cancel';
          cancelBtn.textContent = meta.cancelText;
          footer.appendChild(cancelBtn);
        }

        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'nano-dialog-btn ' + (
          meta.tone === 'kakao'
            ? 'nano-dialog-btn-kakao'
            : (meta.tone === 'danger' ? 'nano-dialog-btn-danger' : 'nano-dialog-btn-primary')
        );
        confirmBtn.textContent = isConfirm ? meta.confirmText : ((opts && opts.confirmText) || '확인');
        footer.appendChild(confirmBtn);
        card.appendChild(footer);

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        var previousFocus = document.activeElement;
        var settled = false;

        function cleanup(result) {
          if (settled) return;
          settled = true;
          document.removeEventListener('keydown', onKeyDown, true);
          overlay.classList.remove('is-open');
          setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (previousFocus && typeof previousFocus.focus === 'function') {
              try { previousFocus.focus(); } catch (e) {}
            }
          }, 140);
          resolve(result);
        }

        function onKeyDown(e) {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cleanup(isConfirm ? false : undefined);
          } else if (e.key === 'Enter' && document.activeElement !== cancelBtn && document.activeElement !== closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            cleanup(isConfirm ? true : undefined);
          }
        }

        document.addEventListener('keydown', onKeyDown, true);
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) {
            cleanup(isConfirm ? false : undefined);
          }
        });
        closeBtn.addEventListener('click', function () {
          cleanup(isConfirm ? false : undefined);
        });
        if (cancelBtn) {
          cancelBtn.addEventListener('click', function () { cleanup(false); });
        }
        confirmBtn.addEventListener('click', function () {
          cleanup(isConfirm ? true : undefined);
        });

        var triggerOpen = function () {
          overlay.classList.add('is-open');
          setTimeout(function () {
            try {
              if (isConfirm && meta.tone === 'danger' && cancelBtn) cancelBtn.focus();
              else confirmBtn.focus();
            } catch (e) {}
          }, 20);
        };
        if (typeof globalScope.requestAnimationFrame === 'function') {
          globalScope.requestAnimationFrame(triggerOpen);
        } else {
          setTimeout(triggerOpen, 0);
        }
      });
    };

    var next = dialogQueue.then(run, run);
    dialogQueue = next.catch(function () {});
    return next;
  }

  function nanoAlert(message, opts) {
    return showCenteredDialog(message, false, opts);
  }

  function nanoConfirm(message, opts) {
    return showCenteredDialog(message, true, opts);
  }

  globalScope.nanoAlert = nanoAlert;
  globalScope.nanoConfirm = nanoConfirm;

  // 브라우저 DOM 환경에서는 기본 window.alert도 상단 브라우저 창 대신 화면 중앙 모달로 자동 전환
  if (typeof document !== 'undefined' && typeof globalScope.alert === 'function') {
    globalScope.nativeAlert = globalScope.alert.bind(globalScope);
    globalScope.alert = function (message) {
      return nanoAlert(message);
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
