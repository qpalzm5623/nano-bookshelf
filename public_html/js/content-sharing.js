/* ============================================================
 * 콘텐츠 공유 관리 & 보안 나노시트 선택 모달 (Admin & Master 공용)
 * ============================================================ */
(function (global) {
  var state = { items: [], received: [], catalog: [], loading: false, error: '' };
  var CHUNK_SIZE = 750000;

  // XSS 방지를 위한 HTML 이스케이프
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 안전한 이미지 경로만 허용
  function safeImg(url) {
    var raw = String(url || '').trim();
    if (!raw || /^javascript:/i.test(raw)) return '';
    if (/^(https?:\/\/|\/|\.\/|resources\/|assets\/|images\/|data:image\/)/i.test(raw)) return raw;
    return '';
  }

  // 호스트 포털 토스트 또는 기본 알림 호출
  function notify(message) {
    if (typeof global.showAcademyToast === 'function') return global.showAcademyToast(message);
    if (typeof global.showMasterToast === 'function') return global.showMasterToast(message);
    alert(message);
  }

  // 공통 JSON 요청 (세션 쿠키 + JSON 본문)
  async function request(url, body) {
    var options = { credentials: 'same-origin' };
    if (body !== undefined) {
      options.method = 'POST';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    var response = await fetch(url, options);
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || ('요청을 처리하지 못했습니다. (' + response.status + ')'));
    return data;
  }

  // 모달 <dialog> 생성 헬퍼
  function openModal(html, extraClass) {
    var old = document.getElementById('nanoContentSharingDialog');
    if (old) old.remove();
    var dialog = document.createElement('dialog');
    dialog.id = 'nanoContentSharingDialog';
    dialog.className = extraClass ? ('sharing-dialog ' + extraClass) : 'sharing-dialog';
    dialog.innerHTML = html;
    dialog.addEventListener('close', function () {
      dialog.remove();
    });
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', 'open');
    }
    return dialog;
  }

  // PDF 파일 Base64 분할 업로드 (최대 25MB)
  async function uploadFile(file, onProgress) {
    if (!file || file.size > 25 * 1024 * 1024) throw new Error('25MB 이하의 PDF 파일을 선택해 주세요.');
    var header = await file.slice(0, 5).text();
    if (header !== '%PDF-') throw new Error('유효한 PDF 파일만 등록할 수 있습니다.');
    var ids = [];
    for (var offset = 0, index = 0; offset < file.size; offset += CHUNK_SIZE, index++) {
      var chunk = file.slice(offset, offset + CHUNK_SIZE);
      var bytes = new Uint8Array(await chunk.arrayBuffer());
      var binary = '';
      for (var i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
      }
      var res = await request('/api/content?action=sheet-chunk', {
        name: file.name,
        index: index,
        base64: btoa(binary)
      });
      ids.push(res.id);
      if (onProgress) onProgress(Math.min(100, Math.round(((offset + chunk.size) / file.size) * 100)));
    }
    return ids;
  }

  async function saveSheet(book, file, isPublic, existing, onProgress) {
    var payload = {
      id: existing && existing.id,
      revision: existing ? existing.revision : 0,
      bookId: book.serverId || book.id || book.bookNo,
      name: (file && file.name) || (existing && existing.name) || ((book.title || 'book') + '_나노시트.pdf'),
      isPublic: isPublic
    };
    if (file) payload.fileIds = await uploadFile(file, onProgress);
    return request('/api/content?action=worksheet', payload);
  }

  // 로컬 미리보기(비서버) 환경 여부 판별
  function isServerMode() {
    if (typeof global === 'undefined') return false;
    if (global.NANO_SERVER_DATA === true) return true;
    return !!(global.NanoPortal && global.NanoPortal.remote);
  }

  // 나노시트 목록 확인(view) / 업로드·공개설정·삭제(manage) 공용 모달
  async function openSheets(book, openPdf, opts) {
    if (!book) return;
    opts = opts || {};
    var mode = opts.mode === 'manage' ? 'manage' : 'view';
    var onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
    var bookId = book.serverId || book.bookNo || book.id;

    async function fetchSheetState() {
      if (isServerMode()) {
        return request('/api/content?action=worksheets&bookId=' + encodeURIComponent(bookId));
      }
      // 오프라인/정적 미리보기 모드 로컬 fallback
      var list = Array.isArray(book.worksheetList) ? book.worksheetList.slice() : [];
      if (list.length === 0 && (book.hasSheet || book.sheet || book.pdfBlob || book.pdfDataUrl || book.worksheetUrl)) {
        list = [{
          id: 'local-' + book.id,
          bookId: book.id,
          name: book.materialName || ((book.title || '도서') + '_나노시트.pdf'),
          academyName: book.academyName || '본사',
          isPublic: 'Y',
          isMine: true,
          revision: 0,
          url: book.worksheetUrl || book.pdfUrl || book.pdfDataUrl || ''
        }];
      }
      book.worksheetList = list;
      return { canUpload: true, items: list };
    }

    var data;
    try {
      data = await fetchSheetState();
    } catch (err) {
      notify((err && err.message) || '나노시트 목록을 불러오지 못했습니다.');
      return;
    }
    data.items = Array.isArray(data.items) ? data.items : [];
    var canUpload = data.canUpload !== false;

    function syncBookMeta() {
      book.worksheetList = data.items.slice();
      book.hasSheet = data.items.length > 0;
      book.sheet = data.items.length > 0;
      book.worksheetUrl = data.items[0] ? data.items[0].url : null;
      book.pdfUrl = data.items[0] ? data.items[0].url : null;
      book.materialName = data.items[0] ? data.items[0].name : null;
      if (onChange) onChange(data.items, book);
    }

    // 공개/비공개 라디오 버튼 공통 렌더러 (목록 변경 및 신규 업로드 폼에서 재사용)
    function renderVisRadios(inputName, selectedVal, extraAttr, ariaLabel) {
      var isPub = selectedVal !== 'N';
      return (
        '<div class="sharing-vis-radio-group" role="radiogroup" aria-label="' + esc(ariaLabel || '공개 여부') + '">' +
          '<label class="sharing-vis-radio-option' + (isPub ? ' is-selected is-public' : '') + '">' +
            '<input type="radio" name="' + inputName + '" value="Y"' + (extraAttr ? ' ' + extraAttr : '') + (isPub ? ' checked' : '') + '>' +
            '<span>공개</span>' +
          '</label>' +
          '<label class="sharing-vis-radio-option' + (!isPub ? ' is-selected is-private' : '') + '">' +
            '<input type="radio" name="' + inputName + '" value="N"' + (extraAttr ? ' ' + extraAttr : '') + (!isPub ? ' checked' : '') + '>' +
            '<span>비공개</span>' +
          '</label>' +
        '</div>'
      );
    }

    function syncRadioGroupStyles(groupEl, activeVal) {
      if (!groupEl) return;
      groupEl.querySelectorAll('.sharing-vis-radio-option').forEach(function (labelEl) {
        var r = labelEl.querySelector('input[type="radio"]');
        var isMatch = Boolean(r && r.value === activeVal);
        labelEl.className = 'sharing-vis-radio-option' + (isMatch ? (' is-selected ' + (activeVal === 'Y' ? 'is-public' : 'is-private')) : '');
      });
    }

    function buildBodyHtml(statusMsg, isError) {
      var sheetRows = data.items.map(function (s, idx) {
        var isPublic = s.isPublic !== 'N';
        var visClass = isPublic ? 'is-public' : 'is-private';
        var visLabel = isPublic ? '공개' : '비공개';
        var itemCls = 'sharing-sheet-item' + (s.isMine ? ' is-mine' : '');
        var controlsHtml = '';
        if (mode === 'manage') {
          if (s.isMine) {
            controlsHtml =
              '<div class="sharing-sheet-controls">' +
                renderVisRadios('sharingSheetVis_' + idx, isPublic ? 'Y' : 'N', 'data-vis-radio="' + idx + '"', '나노시트 공개 여부') +
                '<button type="button" class="sharing-btn-danger-outline" data-delete="' + idx + '" style="height: 34px; padding: 0 11px;">' +
                  '<i class="fa-solid fa-trash-can"></i> 삭제' +
                '</button>' +
              '</div>';
          } else {
            controlsHtml =
              '<div class="sharing-sheet-readonly">' +
                '<i class="fa-solid fa-lock mr-1"></i>타 기관(또는 본사)이 등록한 나노시트입니다. 본인이 등록한 시트만 수정·삭제할 수 있습니다.' +
              '</div>';
          }
        }

        return (
          '<div class="' + itemCls + '">' +
            '<div class="sharing-sheet-top">' +
              '<div class="sharing-sheet-info">' +
                '<div class="sharing-sheet-name">' +
                  '<i class="fa-solid fa-file-pdf text-danger"></i>' +
                  '<span>' + esc(s.name) + '</span>' +
                '</div>' +
                '<div class="sharing-sheet-meta">' +
                  '<span class="sharing-sheet-badge">' + esc(s.academyName || '본사') + '</span>' +
                  '<span class="sharing-sheet-badge ' + visClass + '">' + visLabel + '</span>' +
                  (s.isMine ? '<span class="sharing-sheet-badge is-mine"><i class="fa-solid fa-user-check"></i> 내 등록</span>' : '') +
                '</div>' +
              '</div>' +
              '<button type="button" class="btn-beige-primary sharing-btn-sm" data-open="' + idx + '">' +
                '<i class="fa-solid fa-eye"></i> ' + (mode === 'manage' ? '미리보기' : '열람하기') +
              '</button>' +
            '</div>' +
            controlsHtml +
          '</div>'
        );
      }).join('');

      var listSectionTitle =
        '<div class="sharing-sheet-section-title">' +
          '<span>등록된 나노시트 (' + data.items.length + '건)</span>' +
          (mode === 'view' ? '<span style="font-size: 11.5px; font-weight: 600; color: var(--text-muted, #786d63);">원하는 나노시트를 선택해 열람하세요.</span>' : '') +
        '</div>';

      var listHtml = sheetRows
        ? '<div class="sharing-sheet-list">' + sheetRows + '</div>'
        : (mode === 'manage'
            ? '<div class="sharing-empty-state"><i class="fa-regular fa-file-pdf sharing-empty-icon"></i><p>아직 등록된 나노시트가 없습니다.</p><small>아래에서 새 PDF 나노시트를 업로드하고 공개/비공개 여부를 선택할 수 있습니다.</small></div>'
            : '<div class="sharing-empty-state"><i class="fa-regular fa-file-pdf sharing-empty-icon"></i><p>열람할 수 있는 나노시트가 없습니다.</p><small>관리 컬럼의 [나노시트 관리] 버튼에서 새 나노시트를 등록해 주세요.</small></div>');

      var uploadSection = (mode === 'manage' && canUpload) ? (
        '<div class="sharing-sheet-upload-box">' +
          '<div style="font-weight: 800; font-size: 13.5px; display: flex; align-items: center; gap: 6px;">' +
            '<i class="fa-solid fa-cloud-arrow-up text-primary"></i> 새 나노시트 PDF 업로드' +
          '</div>' +
          '<input type="file" id="sharingNewSheetFile" accept=".pdf,application/pdf" class="sharing-input" style="height: auto; padding: 8px 10px;">' +
          '<div class="sharing-sheet-upload-row">' +
            renderVisRadios('sharingNewSheetVis', 'Y', '', '새 나노시트 공개 여부') +
            '<button type="button" class="btn-beige-primary sharing-btn-sm" id="sharingUploadBtn" style="margin-left: auto;">' +
              '<i class="fa-solid fa-upload"></i> 나노시트 등록' +
            '</button>' +
          '</div>' +
          '<p class="sharing-status-text' + (isError ? ' is-error' : '') + '" id="sharingUploadStatus">' + esc(statusMsg || '') + '</p>' +
        '</div>'
      ) : (statusMsg ? '<p class="sharing-status-text' + (isError ? ' is-error' : '') + '" id="sharingUploadStatus">' + esc(statusMsg) + '</p>' : '');

      return listSectionTitle + listHtml + uploadSection;
    }

    var headTitle = mode === 'manage' ? (esc(book.title) + ' — 나노시트 관리') : (esc(book.title) + ' — 나노시트 선택');
    var headDesc = mode === 'manage'
      ? '나노시트(PDF) 업로드, 공개/비공개 설정 변경 및 본인 등록 시트 삭제를 관리합니다.'
      : '등록된 나노시트 목록에서 열람할 자료를 선택하세요.';

    var dialog = openModal(
      '<form class="sharing-dialog-form" method="dialog">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-file-pdf text-danger"></i> ' + headTitle + '</h3>' +
            '<p>' + headDesc + '</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" value="close" id="sharingSheetCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body" id="sharingSheetBody">' +
          buildBodyHtml('', false) +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-secondary" id="sharingSheetFootClose">닫기</button>' +
        '</div>' +
      '</form>'
    );

    dialog.querySelector('#sharingSheetCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingSheetFootClose').onclick = function () { dialog.close(); };

    function renderAndBindBody(statusMsg, isError) {
      var bodyEl = dialog.querySelector('#sharingSheetBody');
      if (bodyEl) bodyEl.innerHTML = buildBodyHtml(statusMsg, isError);
      bindBodyEvents();
    }

    function bindBodyEvents() {
      dialog.querySelectorAll('[data-open]').forEach(function (button) {
        button.onclick = function () {
          var sheet = data.items[Number(button.dataset.open)];
          if (!sheet) return;
          dialog.close();
          openPdf(sheet.url, sheet);
        };
      });

      // 공개/비공개 라디오 선택 시 즉시 저장 반영
      dialog.querySelectorAll('input[data-vis-radio]').forEach(function (radio) {
        radio.onchange = async function () {
          if (!radio.checked) return;
          var index = Number(radio.dataset.visRadio);
          var target = data.items[index];
          var nextVis = radio.value === 'N' ? 'N' : 'Y';
          if (!target || (target.isPublic !== 'N' ? 'Y' : 'N') === nextVis) return;

          var groupEl = radio.closest('.sharing-vis-radio-group');
          var peerRadios = groupEl ? groupEl.querySelectorAll('input[type="radio"]') : [radio];
          peerRadios.forEach(function (el) { el.disabled = true; });
          syncRadioGroupStyles(groupEl, nextVis);
          try {
            if (isServerMode()) {
              await saveSheet(book, null, nextVis, target);
              data = await fetchSheetState();
              data.items = Array.isArray(data.items) ? data.items : [];
            } else {
              target.isPublic = nextVis;
            }
            syncBookMeta();
            var labelText = nextVis === 'Y' ? '공개' : '비공개';
            notify('나노시트를 ' + labelText + ' 상태로 변경했습니다.');
            renderAndBindBody('[' + labelText + '] 상태로 변경되었습니다.', false);
          } catch (err) {
            notify(err.message);
            renderAndBindBody(err.message || '공개 설정 변경에 실패했습니다.', true);
          }
        };
      });

      dialog.querySelectorAll('input[name="sharingNewSheetVis"]').forEach(function (radio) {
        radio.onchange = function () {
          if (radio.checked) syncRadioGroupStyles(radio.closest('.sharing-vis-radio-group'), radio.value);
        };
      });

      dialog.querySelectorAll('[data-delete]').forEach(function (button) {
        button.onclick = async function () {
          var index = Number(button.dataset.delete);
          var target = data.items[index];
          if (!target) return;
          var deleteSheetMsg = '[' + target.name + '] 나노시트를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.';
          if (!(typeof nanoConfirm === 'function' ? await nanoConfirm(deleteSheetMsg) : confirm(deleteSheetMsg))) return;
          button.disabled = true;
          try {
            if (isServerMode()) {
              await request('/api/content?action=worksheet', {
                operation: 'delete',
                bookId: bookId,
                id: target.id
              });
              data = await fetchSheetState();
              data.items = Array.isArray(data.items) ? data.items : [];
            } else {
              data.items.splice(index, 1);
            }
            syncBookMeta();
            notify('나노시트를 삭제했습니다.');
            renderAndBindBody('선택한 나노시트가 삭제되었습니다.', false);
          } catch (err) {
            notify(err.message);
            renderAndBindBody(err.message || '나노시트 삭제에 실패했습니다.', true);
          } finally {
            button.disabled = false;
          }
        };
      });

      var uploadBtn = dialog.querySelector('#sharingUploadBtn');
      if (uploadBtn) {
        uploadBtn.onclick = async function () {
          var input = dialog.querySelector('#sharingNewSheetFile');
          var visEl = dialog.querySelector('input[name="sharingNewSheetVis"]:checked');
          var status = dialog.querySelector('#sharingUploadStatus');
          var file = input && input.files && input.files[0];
          if (!file) {
            if (status) {
              status.className = 'sharing-status-text is-error';
              status.textContent = 'PDF 파일을 먼저 선택해 주세요.';
            }
            return;
          }
          uploadBtn.disabled = true;
          try {
            var visVal = visEl ? visEl.value : 'Y';
            if (isServerMode()) {
              await saveSheet(book, file, visVal, null, function (pct) {
                if (status) {
                  status.className = 'sharing-status-text';
                  status.textContent = '파일 업로드 중... ' + pct + '%';
                }
              });
              data = await fetchSheetState();
              data.items = Array.isArray(data.items) ? data.items : [];
            } else {
              var localUrl = URL.createObjectURL(file);
              data.items.push({
                id: 'local-' + Date.now(),
                bookId: book.id,
                name: file.name,
                academyName: (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '본사',
                isPublic: visVal,
                isMine: true,
                revision: 0,
                url: localUrl
              });
            }
            syncBookMeta();
            notify('새 나노시트를 등록했습니다.');
            renderAndBindBody('새 나노시트가 등록되었습니다.', false);
          } catch (err) {
            if (status) {
              status.className = 'sharing-status-text is-error';
              status.textContent = err.message || '업로드 중 오류가 발생했습니다.';
            }
          } finally {
            uploadBtn.disabled = false;
          }
        };
      }
    }

    bindBodyEvents();
  }

  // 폴더 칩 목록 렌더링 (최대 5권 미리보기 + 더보기 토글)
  function renderFolderBookChips(books) {
    var list = Array.isArray(books) ? books : [];
    if (list.length === 0) {
      return '<span class="sharing-card-hint">선택된 도서가 없습니다.</span>';
    }
    var visible = list.slice(0, 6);
    var html = visible.map(function (b) {
      return '<span class="sharing-chip"><i class="fa-solid fa-book" style="font-size: 10px; opacity: 0.6;"></i>' + esc(b.title) + '</span>';
    }).join('');
    if (list.length > 6) {
      html += '<span class="sharing-chip">외 ' + (list.length - 6) + '권</span>';
    }
    return html;
  }

  // 메인 화면(#view-content-sharing) 렌더링
  function render() {
    var root = document.getElementById('view-content-sharing');
    if (!root) return;

    var myFolders = state.items || [];
    var receivedFolders = state.received || [];
    var catalogItems = state.catalog || [];
    var catalogCount = catalogItems.length;
    var catalogBookIdSet = new Set();
    catalogItems.forEach(function (b) {
      if (b && b.id) catalogBookIdSet.add(String(b.id));
    });

    function extractFolderBookIds(folder) {
      var list = Array.isArray(folder && folder.books) ? folder.books : null;
      if (list && list.length > 0) {
        return list.map(function (b) { return b && b.id ? String(b.id) : ''; }).filter(Boolean);
      }
      if (Array.isArray(folder && folder.bookIds)) {
        return folder.bookIds.map(function (bid) { return bid ? String(bid) : ''; }).filter(Boolean);
      }
      return [];
    }

    var sharedAcademyKeySet = new Set();
    var sharedBookIdSet = new Set();
    myFolders.forEach(function (folder) {
      var recs = Array.isArray(folder.recipients) ? folder.recipients : [];
      if (recs.length === 0) return;
      recs.forEach(function (r) {
        if (!r) return;
        var academyKey = String(r.academyId || r.username || r.directorId || r.academyName || '').trim();
        if (academyKey) sharedAcademyKeySet.add(academyKey);
      });
      extractFolderBookIds(folder).forEach(function (bid) {
        if (catalogBookIdSet.has(bid)) sharedBookIdSet.add(bid);
      });
    });
    var sharedAcademyCount = sharedAcademyKeySet.size;
    var sharedCatalogBookCount = sharedBookIdSet.size;

    var receivedBookIdSet = new Set();
    receivedFolders.forEach(function (folder) {
      extractFolderBookIds(folder).forEach(function (bid) {
        receivedBookIdSet.add(bid);
      });
    });
    var receivedBookCount = receivedBookIdSet.size;

    var headerHtml =
      '<div class="workspace-header">' +
        '<div>' +
          '<h1 class="workspace-title"><i class="fa-solid fa-folder-tree"></i> 콘텐츠 공유</h1>' +
          '<div class="workspace-subtitle">직접 등록한 북퀴즈와 나노시트를 지정한 가맹 학원과 공유 폴더로 함께 사용할 수 있습니다.</div>' +
        '</div>' +
        '<div class="sharing-header-actions">' +
          '<button type="button" class="btn-beige-secondary" id="sharingRefreshBtn">' +
            '<i class="fa-solid fa-rotate-right"></i> 새로고침' +
          '</button>' +
          '<button type="button" class="btn-beige-primary" id="sharingCreateBtn">' +
            '<i class="fa-solid fa-folder-plus"></i> 공유 폴더 생성' +
          '</button>' +
        '</div>' +
      '</div>';

    var kpiHtml =
      '<div class="sharing-kpi-grid">' +
        '<div class="sharing-kpi-card">' +
          '<div class="sharing-kpi-title">공유 가능한 내 도서</div>' +
          '<div class="sharing-kpi-num">' +
            catalogCount + '<span>권</span>' +
            '<span class="sharing-kpi-sep" aria-hidden="true">·</span>' +
            '<span class="sharing-kpi-subcount">공유 중 <strong>' + sharedCatalogBookCount + '</strong>권</span>' +
          '</div>' +
          '<div class="sharing-kpi-sub">비공개 북퀴즈 · 나노시트 포함 도서 기준</div>' +
          '<i class="fa-solid fa-book-open sharing-kpi-icon"></i>' +
        '</div>' +
        '<div class="sharing-kpi-card">' +
          '<div class="sharing-kpi-title">내가 공유한 폴더</div>' +
          '<div class="sharing-kpi-num">' +
            myFolders.length + '<span>개</span>' +
            '<span class="sharing-kpi-sep" aria-hidden="true">·</span>' +
            '<span class="sharing-kpi-subcount">공유 학원 <strong>' + sharedAcademyCount + '</strong>곳</span>' +
          '</div>' +
          '<div class="sharing-kpi-sub">원장 ID 검증 후 등록된 공유 폴더</div>' +
          '<i class="fa-solid fa-folder-open sharing-kpi-icon"></i>' +
        '</div>' +
        '<div class="sharing-kpi-card">' +
          '<div class="sharing-kpi-title">공유받은 폴더</div>' +
          '<div class="sharing-kpi-num">' +
            receivedFolders.length + '<span>개</span>' +
            '<span class="sharing-kpi-sep" aria-hidden="true">·</span>' +
            '<span class="sharing-kpi-subcount">총 <strong>' + receivedBookCount + '</strong>권</span>' +
          '</div>' +
          '<div class="sharing-kpi-sub">본사 또는 타 가맹 학원이 공유한 폴더</div>' +
          '<i class="fa-solid fa-share-nodes sharing-kpi-icon"></i>' +
        '</div>' +
      '</div>';

    var ownBodyHtml = state.loading
      ? '<div class="sharing-empty-state"><i class="fa-solid fa-spinner fa-spin sharing-empty-icon"></i><p>공유 폴더 목록을 불러오는 중입니다...</p></div>'
      : (myFolders.length > 0
          ? '<div class="sharing-folder-list">' + myFolders.map(function (folder) {
              var recs = Array.isArray(folder.recipients) ? folder.recipients : [];
              var recHtml = recs.length > 0
                ? recs.map(function (r) {
                    var label = r.directorName
                      ? esc(r.academyName) + ' · ' + esc(r.directorName) + ' (' + esc(r.username) + ')'
                      : esc(r.academyName) + ' (' + esc(r.username) + ')';
                    return '<span class="sharing-chip is-academy"><i class="fa-solid fa-school" style="font-size: 10px;"></i>' + label + '</span>';
                  }).join('')
                : '<span class="sharing-card-hint">등록된 수신 학원이 없습니다.</span>';
              return (
                '<div class="sharing-folder-item">' +
                  '<div class="sharing-folder-top">' +
                    '<div class="sharing-folder-name-wrap">' +
                      '<div class="sharing-folder-icon"><i class="fa-solid fa-folder"></i></div>' +
                      '<div>' +
                        '<div class="sharing-folder-name">' + esc(folder.name) + '</div>' +
                        '<div class="sharing-folder-meta">도서 <strong>' + (folder.bookIds ? folder.bookIds.length : 0) + '권</strong> · 공유 학원 <strong>' + recs.length + '곳</strong></div>' +
                      '</div>' +
                    '</div>' +
                    '<div class="sharing-folder-actions">' +
                      '<button type="button" class="btn-beige-secondary sharing-btn-sm" data-recipients-folder="' + esc(folder.id) + '">' +
                        '<i class="fa-solid fa-users"></i> 공유 대상 설정' +
                      '</button>' +
                      '<button type="button" class="btn-beige-secondary sharing-btn-sm" data-edit-folder="' + esc(folder.id) + '">' +
                        '<i class="fa-solid fa-pen-to-square"></i> 수정' +
                      '</button>' +
                      '<button type="button" class="sharing-btn-danger-outline" data-delete-folder="' + esc(folder.id) + '">' +
                        '<i class="fa-solid fa-trash-can"></i> 삭제' +
                      '</button>' +
                    '</div>' +
                  '</div>' +
                  '<div class="sharing-folder-tags">' +
                    '<div class="sharing-tag-group">' +
                      '<span class="sharing-tag-label">포함 도서</span>' +
                      '<div class="sharing-chip-wrap">' + renderFolderBookChips(folder.books) + '</div>' +
                    '</div>' +
                    '<div class="sharing-tag-group">' +
                      '<span class="sharing-tag-label">공유 학원</span>' +
                      '<div class="sharing-chip-wrap">' + recHtml + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>'
              );
            }).join('') + '</div>'
          : '<div class="sharing-empty-state">' +
              '<i class="fa-regular fa-folder-open sharing-empty-icon"></i>' +
              '<p>아직 생성한 공유 폴더가 없습니다.</p>' +
              '<small>직접 등록한 비공개 북퀴즈나 나노시트가 포함된 도서를 묶어 다른 학원장님에게 공유해 보세요.</small>' +
              '<button type="button" class="btn-beige-primary sharing-btn-sm" id="sharingEmptyCreateBtn">' +
                '<i class="fa-solid fa-folder-plus"></i> 첫 공유 폴더 만들기' +
              '</button>' +
            '</div>');

    var receivedBodyHtml = state.loading
      ? '<div class="sharing-empty-state"><i class="fa-solid fa-spinner fa-spin sharing-empty-icon"></i><p>공유받은 폴더를 불러오는 중입니다...</p></div>'
      : (receivedFolders.length > 0
          ? '<div class="sharing-folder-list">' + receivedFolders.map(function (folder) {
              var bookCount = folder.books ? folder.books.length : 0;
              return (
                '<div class="sharing-folder-item is-clickable" data-received-folder="' + esc(folder.id) + '" role="button" tabindex="0" aria-label="' + esc(folder.name) + ' 도서 목록 보기">' +
                  '<div class="sharing-folder-top">' +
                    '<div class="sharing-folder-name-wrap">' +
                      '<div class="sharing-folder-icon"><i class="fa-solid fa-share-nodes"></i></div>' +
                      '<div>' +
                        '<div class="sharing-folder-name">' + esc(folder.name) + '</div>' +
                        '<div class="sharing-folder-meta">공유 제공: <strong>' + esc(folder.ownerAcademyName) + '</strong> · 포함 도서 <strong>' + bookCount + '권</strong></div>' +
                      '</div>' +
                    '</div>' +
                    '<div class="sharing-folder-actions">' +
                      '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-circle-check"></i> 열람 가능</span>' +
                      '<button type="button" class="btn-beige-secondary sharing-btn-sm" data-received-folder-btn="' + esc(folder.id) + '">' +
                        '<i class="fa-solid fa-book-open"></i> 도서 목록 (' + bookCount + '권)' +
                      '</button>' +
                    '</div>' +
                  '</div>' +
                  '<div class="sharing-folder-tags">' +
                    '<div class="sharing-tag-group">' +
                      '<span class="sharing-tag-label">공유 도서</span>' +
                      '<div class="sharing-chip-wrap">' + renderFolderBookChips(folder.books) + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>'
              );
            }).join('') + '</div>'
          : '<div class="sharing-empty-state">' +
              '<i class="fa-solid fa-inbox sharing-empty-icon"></i>' +
              '<p>아직 공유받은 폴더가 없습니다.</p>' +
              '<small>다른 가맹 학원이나 본사에서 우리 학원장 ID로 공유하면 이곳에 표시되며, 콘텐츠 관리에서 바로 열람할 수 있습니다.</small>' +
            '</div>');

    var errorBanner = state.error
      ? '<div class="simple-card" style="padding: 14px 20px; border-color: #f0c9c6; background: #fdf2f2; color: #a83b34; font-size: 13px; font-weight: 600;">' +
          '<i class="fa-solid fa-circle-exclamation mr-2"></i>' + esc(state.error) +
        '</div>'
      : '';

    root.innerHTML =
      '<div class="content-sharing">' +
        headerHtml +
        kpiHtml +
        errorBanner +
        '<div class="simple-card">' +
          '<div class="sharing-card-head">' +
            '<h2 class="sharing-card-title"><i class="fa-solid fa-folder-open" style="color: var(--btn-primary, #1f8a7e);"></i> 내가 공유한 폴더 <span class="badge-soft badge-soft-neutral">' + myFolders.length + '개 · 공유 학원 ' + sharedAcademyCount + '곳</span></h2>' +
            '<p class="sharing-card-hint">폴더에 담은 도서의 비공개 북퀴즈·나노시트도 지정 학원에서는 열람할 수 있습니다.</p>' +
          '</div>' +
          '<div class="sharing-card-body">' + ownBodyHtml + '</div>' +
        '</div>' +
        '<div class="simple-card">' +
          '<div class="sharing-card-head">' +
            '<h2 class="sharing-card-title"><i class="fa-solid fa-inbox" style="color: var(--btn-primary, #1f8a7e);"></i> 공유받은 폴더 <span class="badge-soft badge-soft-neutral">' + receivedFolders.length + '개 · 총 ' + receivedBookCount + '권</span></h2>' +
            '<p class="sharing-card-hint">폴더를 클릭하면 포함된 도서 목록을 자세히 확인할 수 있습니다.</p>' +
          '</div>' +
          '<div class="sharing-card-body">' + receivedBodyHtml + '</div>' +
        '</div>' +
      '</div>';

    var createBtn = document.getElementById('sharingCreateBtn');
    if (createBtn) createBtn.onclick = function () { openCreateFolderModal(); };
    var emptyCreateBtn = document.getElementById('sharingEmptyCreateBtn');
    if (emptyCreateBtn) emptyCreateBtn.onclick = function () { openCreateFolderModal(); };
    var refreshBtn = document.getElementById('sharingRefreshBtn');
    if (refreshBtn) refreshBtn.onclick = function () { refresh(); };

    root.querySelectorAll('[data-recipients-folder]').forEach(function (button) {
      button.onclick = function () { openRecipientsModal(button.dataset.recipientsFolder); };
    });
    root.querySelectorAll('[data-edit-folder]').forEach(function (button) {
      button.onclick = function () { openFolderBooksModal(button.dataset.editFolder); };
    });
    root.querySelectorAll('[data-delete-folder]').forEach(function (button) {
      button.onclick = function () { deleteFolder(button.dataset.deleteFolder); };
    });
    root.querySelectorAll('[data-received-folder]').forEach(function (card) {
      card.onclick = function () { openReceivedFolderModal(card.dataset.receivedFolder); };
      card.onkeydown = function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openReceivedFolderModal(card.dataset.receivedFolder);
        }
      };
    });
    root.querySelectorAll('[data-received-folder-btn]').forEach(function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        openReceivedFolderModal(button.dataset.receivedFolderBtn);
      };
    });
  }

  // 데이터 로드 & 새로고침
  async function refresh() {
    var root = document.getElementById('view-content-sharing');
    if (!root) return;
    state.loading = true;
    state.error = '';
    render();
    try {
      var results = await Promise.all([
        request('/api/content?action=folders'),
        request('/api/content?action=catalog')
      ]);
      state.items = results[0].items || [];
      state.received = results[0].received || [];
      state.catalog = results[1].items || [];
    } catch (err) {
      state.error = err.message || '콘텐츠 공유 정보를 불러오지 못했습니다.';
    } finally {
      state.loading = false;
      render();
    }
  }

  // 공유 폴더 삭제
  async function deleteFolder(id) {
    var folder = state.items.find(function (item) { return item.id === id; });
    if (!folder) return;
    var deleteFolderMsg = '[' + folder.name + '] 공유 폴더를 삭제하시겠습니까?\n폴더를 삭제하면 공유받던 학원의 비공개 콘텐츠 열람 권한도 즉시 해제됩니다.';
    if (!(typeof nanoConfirm === 'function' ? await nanoConfirm(deleteFolderMsg) : confirm(deleteFolderMsg))) {
      return;
    }
    try {
      await request('/api/content?action=folder', { operation: 'delete', id: folder.id });
      notify('공유 폴더를 삭제했습니다.');
      await refresh();
    } catch (err) {
      notify(err.message);
    }
  }

  // 도서 표지 썸네일 공통 마크업 (좌측 선택 리스트 / 우측 선택됨 리스트 공용)
  function renderBookThumbHtml(book) {
    var thumbUrl = safeImg(book && book.coverUrl);
    return thumbUrl
      ? '<img src="' + esc(thumbUrl) + '" alt="" onerror="this.remove()">'
      : '<i class="fa-solid fa-book"></i>';
  }

  // 카탈로그 정렬 비교 (등록일 순 / 가나다순 오름·내림차순 지원)
  function compareCatalogBooks(a, b, sortKey, sortDir) {
    var dir = sortDir === 'DESC' ? -1 : 1;
    if (sortKey === 'TITLE') {
      var titleCmp = String((a && a.title) || '').localeCompare(String((b && b.title) || ''), 'ko', { numeric: true });
      if (titleCmp !== 0) return titleCmp * dir;
    } else {
      var aTime = a && a.createdAt ? Date.parse(a.createdAt) : 0;
      var bTime = b && b.createdAt ? Date.parse(b.createdAt) : 0;
      if (Number.isNaN(aTime)) aTime = 0;
      if (Number.isNaN(bTime)) bTime = 0;
      if (aTime !== bTime) return (aTime - bTime) * dir;
    }
    var codeCmp = String((a && (a.bookNo || a.id)) || '').localeCompare(
      String((b && (b.bookNo || b.id)) || ''),
      'ko',
      { numeric: true }
    );
    return codeCmp * dir;
  }

  // 1단계: 공유 폴더 생성 모달 (폴더명만 입력하여 생성)
  function openCreateFolderModal() {
    var dialog = openModal(
      '<form class="sharing-dialog-form" id="sharingCreateFolderForm">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-folder-plus" style="color: var(--btn-primary, #1f8a7e);"></i> 공유 폴더 생성</h3>' +
            '<p>폴더명만 입력해 생성한 뒤, 카드의 [수정]과 [공유 대상 설정] 버튼으로 도서와 학원을 연결하세요.</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" id="sharingCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body">' +
          '<div class="sharing-section">' +
            '<div class="sharing-label-row">' +
              '<label class="sharing-label" for="sharingFolderName">폴더명 <span class="sharing-required-dot">*필수</span></label>' +
            '</div>' +
            '<input id="sharingFolderName" class="sharing-input" maxlength="100" required placeholder="예: 초등 5학년 심화 독서 모음">' +
            '<p class="sharing-help">폴더가 생성되면 도서 추가 및 공유할 학원 지정이 가능합니다.</p>' +
          '</div>' +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-secondary" id="sharingCancelBtn">취소</button>' +
          '<button type="submit" class="btn-beige-primary" id="sharingSaveBtn"><i class="fa-solid fa-check"></i> 폴더 생성</button>' +
        '</div>' +
      '</form>',
      'is-compact'
    );

    var nameInput = dialog.querySelector('#sharingFolderName');
    if (nameInput) nameInput.focus();
    dialog.querySelector('#sharingCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingCancelBtn').onclick = function () { dialog.close(); };

    dialog.querySelector('#sharingCreateFolderForm').onsubmit = async function (event) {
      event.preventDefault();
      var name = String(nameInput.value || '').trim();
      if (!name) {
        notify('폴더명을 입력해 주세요.');
        nameInput.focus();
        return;
      }
      var saveBtn = dialog.querySelector('#sharingSaveBtn');
      saveBtn.disabled = true;
      try {
        await request('/api/content?action=folder', {
          name: name,
          bookIds: [],
          directorUsernames: []
        });
        dialog.close();
        notify('공유 폴더를 생성했습니다.');
        await refresh();
      } catch (err) {
        notify(err.message);
      } finally {
        saveBtn.disabled = false;
      }
    };
  }

  // 2단계-1: 공유 대상 설정 모달 (학원장 ID 조회로 추가/삭제 전용)
  function openRecipientsModal(id) {
    var folder = state.items.find(function (item) { return item.id === id; });
    if (!folder) return;

    var recipients = Array.isArray(folder.recipients)
      ? folder.recipients.map(function (r) {
          return {
            directorId: r.directorId || '',
            username: r.username,
            directorName: r.directorName || '',
            academyId: r.academyId || '',
            academyName: r.academyName || ''
          };
        })
      : [];

    var verifiedCandidate = null;
    var lookupStatus = { type: 'idle', message: '' };

    var dialog = openModal(
      '<form class="sharing-dialog-form" id="sharingRecipientsForm">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-users" style="color: var(--btn-primary, #1f8a7e);"></i> 공유 대상 설정</h3>' +
            '<p>대상 폴더: <strong>' + esc(folder.name) + '</strong> · 포함 도서 ' + (folder.bookIds ? folder.bookIds.length : 0) + '권</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" id="sharingCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body">' +
          '<div class="sharing-section">' +
            '<div class="sharing-label-row">' +
              '<label class="sharing-label" for="sharingDirectorSearchInput">공유받을 학원장 ID <span class="badge-soft badge-soft-neutral" id="sharingRecipientCountBadge">' + recipients.length + '곳 등록</span></label>' +
            '</div>' +
            '<div class="sharing-lookup-bar">' +
              '<input type="text" id="sharingDirectorSearchInput" class="sharing-input" maxlength="100" autocomplete="off" placeholder="공유받을 학원장 로그인 ID를 입력하세요">' +
              '<button type="button" class="btn-beige-primary" id="sharingDirectorLookupBtn">' +
                '<i class="fa-solid fa-magnifying-glass"></i> 조회하기' +
              '</button>' +
            '</div>' +
            '<div id="sharingDirectorLookupResult"></div>' +
            '<div class="sharing-recipient-box" id="sharingRecipientList"></div>' +
            '<p class="sharing-help">등록된 학원의 원장·선생님·학생 모두 해당 폴더의 도서와 비공개 콘텐츠를 이용할 수 있습니다. 대상을 제거하고 저장하면 즉시 권한이 회수됩니다.</p>' +
          '</div>' +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-secondary" id="sharingCancelBtn">취소</button>' +
          '<button type="submit" class="btn-beige-primary" id="sharingSaveBtn"><i class="fa-solid fa-check"></i> 대상 저장</button>' +
        '</div>' +
      '</form>'
    );

    var directorInput = dialog.querySelector('#sharingDirectorSearchInput');
    var lookupBtn = dialog.querySelector('#sharingDirectorLookupBtn');
    var lookupBox = dialog.querySelector('#sharingDirectorLookupResult');
    var recipientBox = dialog.querySelector('#sharingRecipientList');
    var recipientBadge = dialog.querySelector('#sharingRecipientCountBadge');

    function renderLookupResult() {
      if (lookupStatus.type === 'idle') {
        lookupBox.innerHTML = '';
        return;
      }
      if (lookupStatus.type === 'loading') {
        lookupBox.innerHTML =
          '<div class="sharing-lookup-result is-loading">' +
            '<span><i class="fa-solid fa-spinner fa-spin mr-1"></i> ' + esc(lookupStatus.message) + '</span>' +
          '</div>';
        return;
      }
      if (lookupStatus.type === 'error') {
        lookupBox.innerHTML =
          '<div class="sharing-lookup-result is-error" role="alert">' +
            '<span><i class="fa-solid fa-circle-exclamation mr-1"></i> ' + esc(lookupStatus.message) + '</span>' +
          '</div>';
        return;
      }
      if (lookupStatus.type === 'verified' && verifiedCandidate) {
        var alreadyAdded = recipients.some(function (r) { return r.username === verifiedCandidate.username; });
        var titleText = verifiedCandidate.academyName + (verifiedCandidate.directorName ? (' · ' + verifiedCandidate.directorName + ' 원장') : '');
        lookupBox.innerHTML =
          '<div class="sharing-lookup-result is-verified">' +
            '<div class="sharing-verified-info">' +
              '<strong><i class="fa-solid fa-circle-check mr-1"></i> 확인된 계정: ' + esc(titleText) + '</strong>' +
              '<span>로그인 ID: ' + esc(verifiedCandidate.username) + '</span>' +
            '</div>' +
            (alreadyAdded
              ? '<span class="badge-soft badge-soft-neutral">이미 등록됨</span>'
              : '<button type="button" class="btn-beige-primary sharing-btn-sm" id="sharingAddVerifiedBtn"><i class="fa-solid fa-plus"></i> 대상 학원 등록</button>') +
          '</div>';

        var addBtn = lookupBox.querySelector('#sharingAddVerifiedBtn');
        if (addBtn) {
          addBtn.onclick = function () {
            if (!recipients.some(function (r) { return r.username === verifiedCandidate.username; })) {
              recipients.push(verifiedCandidate);
            }
            verifiedCandidate = null;
            lookupStatus = { type: 'idle', message: '' };
            directorInput.value = '';
            renderLookupResult();
            renderRecipients();
          };
        }
      }
    }

    function renderRecipients() {
      recipientBadge.textContent = recipients.length + '곳 등록';
      if (recipients.length === 0) {
        recipientBox.innerHTML = '<span class="sharing-card-hint">조회 후 [대상 학원 등록]을 누르면 공유받을 학원 목록에 추가됩니다.</span>';
        return;
      }
      recipientBox.innerHTML = recipients.map(function (r, idx) {
        var namePart = r.directorName ? (r.academyName + ' · ' + r.directorName) : r.academyName;
        return (
          '<span class="sharing-recipient-chip">' +
            '<i class="fa-solid fa-school" style="color: var(--btn-primary, #1f8a7e); font-size: 11px;"></i>' +
            '<span>' + esc(namePart) + '</span>' +
            '<span class="sharing-chip-id">(' + esc(r.username) + ')</span>' +
            '<button type="button" class="sharing-chip-remove" data-remove-recipient="' + idx + '" aria-label="제거">&times;</button>' +
          '</span>'
        );
      }).join('');

      recipientBox.querySelectorAll('[data-remove-recipient]').forEach(function (btn) {
        btn.onclick = function () {
          recipients.splice(Number(btn.dataset.removeRecipient), 1);
          renderRecipients();
          renderLookupResult();
        };
      });
    }

    async function lookupDirector() {
      var username = (directorInput.value || '').trim();
      if (!username) {
        verifiedCandidate = null;
        lookupStatus = { type: 'error', message: '조회할 학원장 로그인 ID를 입력해 주세요.' };
        renderLookupResult();
        directorInput.focus();
        return;
      }
      verifiedCandidate = null;
      lookupStatus = { type: 'loading', message: '계정을 조회하고 있습니다...' };
      lookupBtn.disabled = true;
      renderLookupResult();
      try {
        var res = await request('/api/content?action=director&username=' + encodeURIComponent(username));
        verifiedCandidate = res.item;
        lookupStatus = { type: 'verified', message: '' };
      } catch (err) {
        verifiedCandidate = null;
        lookupStatus = { type: 'error', message: err.message || '계정을 확인할 수 없습니다.' };
      } finally {
        lookupBtn.disabled = false;
        renderLookupResult();
      }
    }

    lookupBtn.onclick = lookupDirector;
    directorInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        lookupDirector();
      }
    });
    dialog.querySelector('#sharingCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingCancelBtn').onclick = function () { dialog.close(); };

    dialog.querySelector('#sharingRecipientsForm').onsubmit = async function (event) {
      event.preventDefault();
      if (verifiedCandidate && !recipients.some(function (r) { return r.username === verifiedCandidate.username; })) {
        notify('조회된 학원장 [' + verifiedCandidate.academyName + ']의 [대상 학원 등록] 버튼을 눌러 목록에 먼저 추가해 주세요.');
        return;
      }
      if ((directorInput.value || '').trim() && !verifiedCandidate) {
        notify('입력하신 학원장 ID를 먼저 [조회하기] 버튼으로 확인해 주세요.');
        directorInput.focus();
        return;
      }
      var saveBtn = dialog.querySelector('#sharingSaveBtn');
      saveBtn.disabled = true;
      try {
        await request('/api/content?action=folder', {
          id: folder.id,
          revision: folder.revision,
          name: folder.name,
          bookIds: Array.isArray(folder.bookIds) ? folder.bookIds : [],
          directorUsernames: recipients.map(function (r) { return r.username; })
        });
        dialog.close();
        notify('공유 대상을 저장했습니다.');
        await refresh();
      } catch (err) {
        notify(err.message);
      } finally {
        saveBtn.disabled = false;
      }
    };

    renderRecipients();
    renderLookupResult();
    if (directorInput) directorInput.focus();
  }

  // 2단계-2: 폴더 도서 수정 모달 (좌측 도서 선택 + 우측 선택된 도서 리스트)
  async function openFolderBooksModal(id) {
    var folder = state.items.find(function (item) { return item.id === id; });
    if (!folder) return;

    if (!state.error) {
      try {
        var catRes = await request('/api/content?action=catalog');
        if (catRes && Array.isArray(catRes.items)) {
          state.catalog = catRes.items;
          render();
        }
      } catch (e) {}
    }

    // 기존 폴더 도서가 공개로 바뀌어도 우측 목록에서 확인 및 제거할 수 있도록 병합 맵 생성
    var bookLookup = new Map();
    (Array.isArray(folder.books) ? folder.books : []).forEach(function (b) {
      if (b && b.id) bookLookup.set(b.id, b);
    });
    state.catalog.forEach(function (b) {
      if (b && b.id) bookLookup.set(b.id, b);
    });

    var gradeSet = new Set();
    state.catalog.forEach(function (b) {
      var g = String((b && b.grade) || '').trim();
      if (g) gradeSet.add(g);
    });
    var gradeOptions = Array.from(gradeSet).sort(function (a, b) {
      return a.localeCompare(b, 'ko', { numeric: true });
    });

    var selectedIds = new Set(Array.isArray(folder.bookIds) ? folder.bookIds : []);
    var existingRecipients = Array.isArray(folder.recipients)
      ? folder.recipients.map(function (r) { return r.username; }).filter(Boolean)
      : [];
    var sortKey = 'DATE'; // 'DATE' | 'TITLE'
    var sortDir = 'DESC'; // 'DESC' | 'ASC'
    var displayLimit = 100;

    var dialog = openModal(
      '<form class="sharing-dialog-form" id="sharingFolderForm">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-pen-to-square" style="color: var(--btn-primary, #1f8a7e);"></i> 공유 폴더 도서 관리</h3>' +
            '<p>비공개 북퀴즈·나노시트가 포함된 내 도서를 좌측에서 선택하고 우측 선택 목록에서 관리하세요.</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" id="sharingCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body">' +
          '<div class="sharing-section">' +
            '<div class="sharing-label-row">' +
              '<label class="sharing-label" for="sharingFolderName">폴더명 <span class="sharing-required-dot">*필수</span></label>' +
            '</div>' +
            '<input id="sharingFolderName" class="sharing-input" maxlength="100" required placeholder="폴더명을 입력하세요" value="' + esc(folder.name) + '">' +
          '</div>' +

          '<div class="sharing-split-grid">' +
            '<div class="sharing-split-pane">' +
              '<div class="sharing-pane-head">' +
                '<span class="sharing-label">도서 선택 <span class="badge-soft badge-soft-neutral" id="sharingCatalogCountBadge">' + state.catalog.length + '권</span></span>' +
                '<button type="button" class="sharing-text-btn sharing-text-btn-select" id="sharingSelectVisibleBtn"><i class="fa-solid fa-check-double"></i> 목록 전체 선택</button>' +
              '</div>' +
              '<div class="sharing-book-toolbar">' +
                '<select id="sharingGradeFilter" class="sharing-select sharing-grade-select" aria-label="권장학년 필터">' +
                  '<option value="">전체 학년</option>' +
                  gradeOptions.map(function (g) {
                    return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
                  }).join('') +
                '</select>' +
                '<div class="sharing-book-search-wrap">' +
                  '<i class="fa-solid fa-magnifying-glass"></i>' +
                  '<input type="text" id="sharingBookSearch" class="sharing-input" placeholder="도서명 · 도서 코드 · 저자로 검색">' +
                '</div>' +
              '</div>' +
              '<p class="sharing-help">내가 등록한 북퀴즈 또는 나노시트 중 비공개로 설정된 항목이 있는 도서만 표시됩니다.</p>' +
              '<div class="sharing-book-list" id="sharingBookListBox"></div>' +
              '<div class="sharing-book-footer">' +
                '<span class="sharing-card-hint" id="sharingFilteredSummary">0권 표시 중</span>' +
                '<div class="sharing-sort-controls">' +
                  '<button type="button" class="sharing-sort-btn active" id="sharingSortDateBtn">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i> 등록일 순 <span class="sharing-sort-dir">(내림차순)</span>' +
                  '</button>' +
                  '<button type="button" class="sharing-sort-btn" id="sharingSortTitleBtn">' +
                    '<i class="fa-solid fa-arrow-down-a-z"></i> 가나다순 <span class="sharing-sort-dir">(오름차순)</span>' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="sharing-split-pane is-selected-pane">' +
              '<div class="sharing-pane-head">' +
                '<span class="sharing-label">선택된 도서 <span class="badge-soft badge-soft-success" id="sharingSelectedCountBadge">' + selectedIds.size + '권 선택됨</span></span>' +
                '<button type="button" class="sharing-text-btn sharing-text-btn-clear" id="sharingClearBooksBtn"><i class="fa-solid fa-rotate-left"></i> 전체 해제</button>' +
              '</div>' +
              '<p class="sharing-help">좌측 목록에서 체크한 도서가 아래에 표시되며, 제거는 우측 X 버튼 또는 [전체 해제]를 이용해 주세요.</p>' +
              '<div class="sharing-selected-list" id="sharingSelectedBookListBox"></div>' +
            '</div>' +
          '</div>' +

          '<p class="sharing-help">현재 설정된 공유 학원 <strong>' + existingRecipients.length + '곳</strong>은 유지됩니다. 공유 학원 변경은 폴더 카드의 [공유 대상 설정] 버튼을 이용해 주세요.</p>' +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-secondary" id="sharingCancelBtn">취소</button>' +
          '<button type="submit" class="btn-beige-primary" id="sharingSaveBtn"><i class="fa-solid fa-check"></i> 변경 저장</button>' +
        '</div>' +
      '</form>',
      'is-wide'
    );

    var nameInput = dialog.querySelector('#sharingFolderName');
    var gradeSelect = dialog.querySelector('#sharingGradeFilter');
    var searchInput = dialog.querySelector('#sharingBookSearch');
    var catalogCountBadge = dialog.querySelector('#sharingCatalogCountBadge');
    var bookBox = dialog.querySelector('#sharingBookListBox');
    var filteredSummary = dialog.querySelector('#sharingFilteredSummary');
    var sortDateBtn = dialog.querySelector('#sharingSortDateBtn');
    var sortTitleBtn = dialog.querySelector('#sharingSortTitleBtn');
    var countBadge = dialog.querySelector('#sharingSelectedCountBadge');
    var selectedBox = dialog.querySelector('#sharingSelectedBookListBox');

    function getFilteredBooks() {
      var grade = String(gradeSelect.value || '').trim();
      var query = (searchInput.value || '').trim().toLowerCase();
      var filtered = state.catalog.filter(function (b) {
        if (grade && String(b.grade || '').trim() !== grade) return false;
        if (!query) return true;
        return (
          String(b.title || '').toLowerCase().indexOf(query) !== -1 ||
          String(b.bookNo || '').toLowerCase().indexOf(query) !== -1 ||
          String(b.author || '').toLowerCase().indexOf(query) !== -1
        );
      });
      return filtered.slice().sort(function (a, b) {
        return compareCatalogBooks(a, b, sortKey, sortDir);
      });
    }

    function updateSortButtons() {
      var dateDirText = sortKey === 'DATE' && sortDir === 'ASC' ? '오름차순' : '내림차순';
      var titleDirText = sortKey === 'TITLE' && sortDir === 'DESC' ? '내림차순' : '오름차순';
      sortDateBtn.classList.toggle('active', sortKey === 'DATE');
      sortTitleBtn.classList.toggle('active', sortKey === 'TITLE');
      var dateSpan = sortDateBtn.querySelector('.sharing-sort-dir');
      var titleSpan = sortTitleBtn.querySelector('.sharing-sort-dir');
      if (dateSpan) dateSpan.textContent = '(' + dateDirText + ')';
      if (titleSpan) titleSpan.textContent = '(' + titleDirText + ')';
    }

    function renderSelectedPane() {
      countBadge.textContent = selectedIds.size + '권 선택됨';
      var ids = Array.from(selectedIds);
      if (ids.length === 0) {
        selectedBox.innerHTML =
          '<div class="sharing-list-empty">' +
            '<i class="fa-regular fa-square-check" style="font-size: 20px; opacity: 0.45; display: block; margin-bottom: 6px;"></i>' +
            '<strong>선택된 도서가 없습니다.</strong><br>' +
            '<span>좌측 도서 목록에서 공유할 도서를 체크해 주세요.</span>' +
          '</div>';
        return;
      }

      selectedBox.innerHTML = ids.map(function (bookId, idx) {
        var b = bookLookup.get(bookId) || { id: bookId, title: bookId, bookNo: '', author: '', grade: '' };
        var subParts = [b.bookNo, b.author, b.grade].filter(Boolean);
        return (
          '<div class="sharing-selected-row" data-selected-book-id="' + esc(bookId) + '">' +
            '<span class="sharing-selected-order">' + (idx + 1) + '</span>' +
            '<span class="sharing-book-thumb">' + renderBookThumbHtml(b) + '</span>' +
            '<span class="sharing-book-info">' +
              '<span class="sharing-book-title" style="display: block;">' + esc(b.title) + '</span>' +
              '<span class="sharing-book-sub" style="display: block;">' + esc(subParts.join(' · ') || '도서 정보') + '</span>' +
            '</span>' +
            '<button type="button" class="sharing-selected-remove" data-remove-book="' + esc(bookId) + '" aria-label="도서 제거" title="선택에서 제거">' +
              '<i class="fa-solid fa-xmark"></i>' +
            '</button>' +
          '</div>'
        );
      }).join('');

      selectedBox.querySelectorAll('[data-remove-book]').forEach(function (btn) {
        btn.onclick = function () {
          var targetId = btn.dataset.removeBook;
          selectedIds.delete(targetId);
          renderBookList(true);
          renderSelectedPane();
        };
      });
    }

    function renderBookList(preserveScroll) {
      var prevScrollTop = preserveScroll ? (bookBox.scrollTop || 0) : 0;
      updateSortButtons();
      if (state.catalog.length === 0) {
        catalogCountBadge.textContent = '0권';
        filteredSummary.textContent = '0권 표시 중';
        bookBox.innerHTML =
          '<div class="sharing-list-empty">' +
            '<i class="fa-regular fa-folder-open" style="font-size: 22px; opacity: 0.45; display: block; margin-bottom: 6px;"></i>' +
            '<strong>비공개 북퀴즈나 나노시트가 설정된 도서가 없습니다.</strong><br>' +
            '<span>콘텐츠 관리에서 비공개 북퀴즈 또는 비공개 나노시트를 등록한 뒤 다시 확인해 주세요.</span>' +
          '</div>';
        return;
      }

      var filtered = getFilteredBooks();
      catalogCountBadge.textContent = filtered.length + '권';
      if (filtered.length === 0) {
        filteredSummary.textContent = '0권 표시 중';
        bookBox.innerHTML = '<div class="sharing-list-empty">조건에 일치하는 도서가 없습니다.</div>';
        return;
      }

      var slice = filtered.slice(0, displayLimit);
      filteredSummary.textContent = '총 ' + filtered.length + '권 중 ' + slice.length + '권 표시';
      var rowsHtml = slice.map(function (b) {
        var isSelected = selectedIds.has(b.id);
        var privateQCount = b.privateQuizCount || b.quizCount;
        var quizLabel = privateQCount ? ('비공개 북퀴즈 ' + privateQCount + '문항') : '비공개 북퀴즈';
        var showPrivateQuiz = b.hasPrivateQuiz !== undefined ? b.hasPrivateQuiz : b.hasQuiz;
        var showPrivateSheet = b.hasPrivateSheet !== undefined ? b.hasPrivateSheet : b.hasSheet;
        var subParts = [b.bookNo, b.author, b.grade].filter(Boolean);
        return (
          '<label class="sharing-book-row' + (isSelected ? ' is-selected' : '') + '" data-book-id="' + esc(b.id) + '">' +
            '<input type="checkbox" value="' + esc(b.id) + '"' + (isSelected ? ' checked disabled' : '') + '>' +
            '<span class="sharing-book-thumb">' + renderBookThumbHtml(b) + '</span>' +
            '<span class="sharing-book-info">' +
              '<span class="sharing-book-title" style="display: block;">' + esc(b.title) + '</span>' +
              '<span class="sharing-book-sub" style="display: block;">' + esc(subParts.join(' · ')) + '</span>' +
            '</span>' +
            '<span class="sharing-book-badges">' +
              (showPrivateQuiz ? '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-lock"></i> ' + esc(quizLabel) + '</span>' : '') +
              (showPrivateSheet ? '<span class="badge-soft badge-soft-master"><i class="fa-solid fa-file-pdf"></i> 비공개 나노시트</span>' : '') +
              (isSelected ? '<span class="badge-soft sharing-selected-pill"><i class="fa-solid fa-check"></i> 선택됨</span>' : '') +
            '</span>' +
          '</label>'
        );
      }).join('');

      var remaining = filtered.length - slice.length;
      if (remaining > 0) {
        rowsHtml +=
          '<div class="sharing-more-wrap">' +
            '<button type="button" class="sharing-text-btn" id="sharingShowMoreBooksBtn">' +
              '<i class="fa-solid fa-angles-down"></i> ' + remaining + '권 더 보기 (검색어로 빠르게 찾을 수 있습니다)' +
            '</button>' +
          '</div>';
      }

      bookBox.innerHTML = rowsHtml;
      if (preserveScroll) bookBox.scrollTop = prevScrollTop;

      bookBox.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
        box.onchange = function () {
          // 선택된 도서는 좌측에서 체크 해제할 수 없고 우측 영역에서만 제거할 수 있습니다.
          if (selectedIds.has(box.value)) {
            box.checked = true;
            box.disabled = true;
            return;
          }
          if (!box.checked) return;
          selectedIds.add(box.value);
          renderBookList(true);
          renderSelectedPane();
        };
      });

      var moreBtn = bookBox.querySelector('#sharingShowMoreBooksBtn');
      if (moreBtn) {
        moreBtn.onclick = function () {
          displayLimit += 100;
          renderBookList(true);
        };
      }
    }

    gradeSelect.onchange = function () {
      displayLimit = 100;
      renderBookList();
    };

    searchInput.oninput = function () {
      displayLimit = 100;
      renderBookList();
    };

    sortDateBtn.onclick = function () {
      if (sortKey === 'DATE') sortDir = sortDir === 'DESC' ? 'ASC' : 'DESC';
      else {
        sortKey = 'DATE';
        sortDir = 'DESC';
      }
      renderBookList();
    };

    sortTitleBtn.onclick = function () {
      if (sortKey === 'TITLE') sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC';
      else {
        sortKey = 'TITLE';
        sortDir = 'ASC';
      }
      renderBookList();
    };

    dialog.querySelector('#sharingSelectVisibleBtn').onclick = function () {
      getFilteredBooks().forEach(function (b) { selectedIds.add(b.id); });
      renderBookList(true);
      renderSelectedPane();
    };

    dialog.querySelector('#sharingClearBooksBtn').onclick = function () {
      selectedIds.clear();
      renderBookList(true);
      renderSelectedPane();
    };

    dialog.querySelector('#sharingCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingCancelBtn').onclick = function () { dialog.close(); };

    dialog.querySelector('#sharingFolderForm').onsubmit = async function (event) {
      event.preventDefault();
      var folderName = String(nameInput.value || '').trim();
      if (!folderName) {
        notify('폴더명을 입력해 주세요.');
        nameInput.focus();
        return;
      }
      var saveBtn = dialog.querySelector('#sharingSaveBtn');
      saveBtn.disabled = true;
      try {
        await request('/api/content?action=folder', {
          id: folder.id,
          revision: folder.revision,
          name: folderName,
          bookIds: Array.from(selectedIds),
          directorUsernames: existingRecipients
        });
        dialog.close();
        notify('공유 폴더를 저장했습니다.');
        await refresh();
      } catch (err) {
        notify(err.message);
      } finally {
        saveBtn.disabled = false;
      }
    };

    renderBookList();
    renderSelectedPane();
  }

  // 공유받은 폴더 도서 목록 상세 모달
  function openReceivedFolderModal(id) {
    var folder = (state.received || []).find(function (item) { return item.id === id; });
    if (!folder) return;

    var books = Array.isArray(folder.books) ? folder.books : [];
    var gradeSet = new Set();
    books.forEach(function (b) {
      var g = String((b && b.grade) || '').trim();
      if (g) gradeSet.add(g);
    });
    var gradeOptions = Array.from(gradeSet).sort(function (a, b) {
      return a.localeCompare(b, 'ko', { numeric: true });
    });

    var sortKey = 'TITLE'; // 공유받은 도서는 기본 가나다 오름차순으로 찾기 쉽게 정렬
    var sortDir = 'ASC';

    var dialog = openModal(
      '<div class="sharing-dialog-form">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-folder-open" style="color: var(--btn-primary, #1f8a7e);"></i> ' + esc(folder.name) + '</h3>' +
            '<p>공유 제공: <strong>' + esc(folder.ownerAcademyName) + '</strong> · 총 <strong>' + books.length + '권</strong>의 도서가 공유되었습니다.</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" id="sharingCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body">' +
          '<div class="sharing-section">' +
            '<div class="sharing-book-toolbar">' +
              '<select id="sharingReceivedGradeFilter" class="sharing-select sharing-grade-select" aria-label="권장학년 필터">' +
                '<option value="">전체 학년</option>' +
                gradeOptions.map(function (g) {
                  return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
                }).join('') +
              '</select>' +
              '<div class="sharing-book-search-wrap">' +
                '<i class="fa-solid fa-magnifying-glass"></i>' +
                '<input type="text" id="sharingReceivedBookSearch" class="sharing-input" placeholder="공유받은 도서명 · 도서 코드 · 저자로 검색">' +
              '</div>' +
            '</div>' +
            '<div class="sharing-selected-list" id="sharingReceivedBookListBox" style="max-height: 430px;"></div>' +
            '<div class="sharing-book-footer">' +
              '<span class="sharing-card-hint" id="sharingReceivedSummary">총 ' + books.length + '권</span>' +
              '<div class="sharing-sort-controls">' +
                '<button type="button" class="sharing-sort-btn" id="sharingReceivedSortDateBtn">' +
                  '<i class="fa-solid fa-clock-rotate-left"></i> 등록일 순 <span class="sharing-sort-dir">(내림차순)</span>' +
                '</button>' +
                '<button type="button" class="sharing-sort-btn active" id="sharingReceivedSortTitleBtn">' +
                  '<i class="fa-solid fa-arrow-down-a-z"></i> 가나다순 <span class="sharing-sort-dir">(오름차순)</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="sharing-help">공유받은 도서의 북퀴즈와 나노시트는 콘텐츠 관리(도서 목록) 및 학생 학습 화면에서 별도 설정 없이 바로 이용할 수 있습니다.</p>' +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-primary" id="sharingReceivedCloseBtn">닫기</button>' +
        '</div>' +
      '</div>'
    );

    var gradeSelect = dialog.querySelector('#sharingReceivedGradeFilter');
    var searchInput = dialog.querySelector('#sharingReceivedBookSearch');
    var listBox = dialog.querySelector('#sharingReceivedBookListBox');
    var summary = dialog.querySelector('#sharingReceivedSummary');
    var sortDateBtn = dialog.querySelector('#sharingReceivedSortDateBtn');
    var sortTitleBtn = dialog.querySelector('#sharingReceivedSortTitleBtn');

    function renderList() {
      var dateDirText = sortKey === 'DATE' && sortDir === 'ASC' ? '오름차순' : '내림차순';
      var titleDirText = sortKey === 'TITLE' && sortDir === 'DESC' ? '내림차순' : '오름차순';
      sortDateBtn.classList.toggle('active', sortKey === 'DATE');
      sortTitleBtn.classList.toggle('active', sortKey === 'TITLE');
      sortDateBtn.querySelector('.sharing-sort-dir').textContent = '(' + dateDirText + ')';
      sortTitleBtn.querySelector('.sharing-sort-dir').textContent = '(' + titleDirText + ')';

      if (books.length === 0) {
        summary.textContent = '0권';
        listBox.innerHTML =
          '<div class="sharing-list-empty">' +
            '<i class="fa-regular fa-folder-open" style="font-size: 20px; opacity: 0.45; display: block; margin-bottom: 6px;"></i>' +
            '<strong>이 공유 폴더에 등록된 도서가 아직 없습니다.</strong>' +
          '</div>';
        return;
      }

      var grade = String(gradeSelect.value || '').trim();
      var query = (searchInput.value || '').trim().toLowerCase();
      var filtered = books.filter(function (b) {
        if (grade && String(b.grade || '').trim() !== grade) return false;
        if (!query) return true;
        return (
          String(b.title || '').toLowerCase().indexOf(query) !== -1 ||
          String(b.bookNo || '').toLowerCase().indexOf(query) !== -1 ||
          String(b.author || '').toLowerCase().indexOf(query) !== -1
        );
      }).slice().sort(function (a, b) {
        return compareCatalogBooks(a, b, sortKey, sortDir);
      });

      summary.textContent = '총 ' + books.length + '권 중 ' + filtered.length + '권 표시';
      if (filtered.length === 0) {
        listBox.innerHTML = '<div class="sharing-list-empty">조건에 일치하는 도서가 없습니다.</div>';
        return;
      }

      listBox.innerHTML = filtered.map(function (b, idx) {
        var subParts = [b.bookNo, b.author, b.grade].filter(Boolean);
        return (
          '<div class="sharing-selected-row">' +
            '<span class="sharing-selected-order">' + (idx + 1) + '</span>' +
            '<span class="sharing-book-thumb">' + renderBookThumbHtml(b) + '</span>' +
            '<span class="sharing-book-info">' +
              '<span class="sharing-book-title" style="display: block;">' + esc(b.title) + '</span>' +
              '<span class="sharing-book-sub" style="display: block;">' + esc(subParts.join(' · ') || '도서 정보') + '</span>' +
            '</span>' +
            '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-circle-check"></i> 열람 가능</span>' +
          '</div>'
        );
      }).join('');
    }

    gradeSelect.onchange = renderList;
    searchInput.oninput = renderList;
    sortDateBtn.onclick = function () {
      if (sortKey === 'DATE') sortDir = sortDir === 'DESC' ? 'ASC' : 'DESC';
      else {
        sortKey = 'DATE';
        sortDir = 'DESC';
      }
      renderList();
    };
    sortTitleBtn.onclick = function () {
      if (sortKey === 'TITLE') sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC';
      else {
        sortKey = 'TITLE';
        sortDir = 'ASC';
      }
      renderList();
    };

    dialog.querySelector('#sharingCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingReceivedCloseBtn').onclick = function () { dialog.close(); };

    renderList();
  }

  // 기존 호출 호환용 엔트리
  async function editFolder(id) {
    if (!id) return openCreateFolderModal();
    return openFolderBooksModal(id);
  }

  global.ContentSharing = {
    refresh: refresh,
    editFolder: editFolder,
    openCreateFolderModal: openCreateFolderModal,
    openRecipientsModal: openRecipientsModal,
    openFolderBooksModal: openFolderBooksModal,
    openReceivedFolderModal: openReceivedFolderModal,
    deleteFolder: deleteFolder,
    openSheets: openSheets,
    saveSheet: saveSheet
  };
})(window);
