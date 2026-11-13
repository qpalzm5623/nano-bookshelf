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
  function openModal(html) {
    var old = document.getElementById('nanoContentSharingDialog');
    if (old) old.remove();
    var dialog = document.createElement('dialog');
    dialog.id = 'nanoContentSharingDialog';
    dialog.className = 'sharing-dialog';
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

  // 나노시트 목록 확인 / 공개 범위 설정 / 추가 업로드 모달
  async function openSheets(book, openPdf) {
    if (!book) return;
    var bookId = book.serverId || book.bookNo || book.id;
    var data = await request('/api/content?action=worksheets&bookId=' + encodeURIComponent(bookId));
    if (!data.canUpload && data.items.length === 0) {
      notify('현재 열람할 수 있는 나노시트가 없습니다.');
      return;
    }
    if (!data.canUpload && data.items.length === 1) {
      openPdf(data.items[0].url, data.items[0]);
      return;
    }

    var sheetRows = data.items.map(function (s, idx) {
      var badgeCls = s.isPublic === 'Y' ? 'badge-soft-success' : 'badge-soft-warn';
      var badgeLabel = s.isPublic === 'Y' ? '전체 공개' : '비공개 · 공유 폴더 허용';
      return (
        '<div class="sharing-sheet-item">' +
          '<div class="sharing-sheet-top">' +
            '<div style="min-width: 0; flex: 1;">' +
              '<div style="font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">' +
                '<i class="fa-solid fa-file-pdf text-danger"></i>' +
                '<span>' + esc(s.name) + '</span>' +
                '<span class="badge-soft badge-soft-neutral">' + esc(s.academyName || '본사') + '</span>' +
                '<span class="badge-soft ' + badgeCls + '">' + badgeLabel + '</span>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn-beige-primary sharing-btn-sm" data-open="' + idx + '">' +
              '<i class="fa-solid fa-eye"></i> 열람하기' +
            '</button>' +
          '</div>' +
          (s.isMine ? (
            '<div class="sharing-sheet-controls">' +
              '<label style="font-size: 12px; font-weight: 700; margin: 0; color: var(--text-muted, #786d63);">공개 범위</label>' +
              '<select class="sharing-select" data-vis="' + idx + '" style="flex: 1; min-width: 210px;">' +
                '<option value="Y"' + (s.isPublic === 'Y' ? ' selected' : '') + '>공개 · 모든 학원 열람 가능</option>' +
                '<option value="N"' + (s.isPublic === 'N' ? ' selected' : '') + '>비공개 · 우리 학원 및 공유 폴더 학원만</option>' +
              '</select>' +
              '<button type="button" class="btn-beige-secondary sharing-btn-sm" data-save="' + idx + '">' +
                '<i class="fa-solid fa-check"></i> 범위 저장' +
              '</button>' +
            '</div>'
          ) : '') +
        '</div>'
      );
    }).join('');

    var uploadSection = data.canUpload ? (
      '<div class="sharing-sheet-upload-box">' +
        '<div style="font-weight: 800; font-size: 13.5px; display: flex; align-items: center; gap: 6px;">' +
          '<i class="fa-solid fa-cloud-arrow-up"></i> 우리 기관 새 나노시트 PDF 추가' +
        '</div>' +
        '<input type="file" id="sharingNewSheetFile" accept=".pdf,application/pdf" class="sharing-input" style="height: auto; padding: 8px 10px;">' +
        '<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">' +
          '<select id="sharingNewSheetVis" class="sharing-select" style="flex: 1; min-width: 220px;">' +
            '<option value="Y">공개 · 모든 학원 열람 가능</option>' +
            '<option value="N">비공개 · 우리 학원 및 공유 폴더 학원만</option>' +
          '</select>' +
          '<button type="button" class="btn-beige-primary sharing-btn-sm" id="sharingUploadBtn">' +
            '<i class="fa-solid fa-upload"></i> 나노시트 등록' +
          '</button>' +
        '</div>' +
        '<p class="sharing-status-text" id="sharingUploadStatus"></p>' +
      '</div>'
    ) : '';

    var dialog = openModal(
      '<form class="sharing-dialog-form" method="dialog">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-file-pdf text-danger"></i> ' + esc(book.title) + ' 나노시트</h3>' +
            '<p>기관별로 등록된 나노시트를 열람하거나 공개 범위를 관리할 수 있습니다.</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" value="close" id="sharingSheetCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body">' +
          (sheetRows ? '<div class="sharing-sheet-list">' + sheetRows + '</div>' : '<div class="sharing-empty-state"><i class="fa-regular fa-file-pdf sharing-empty-icon"></i><p>아직 등록된 나노시트가 없습니다.</p><small>아래 영역에서 새 PDF 파일을 업로드할 수 있습니다.</small></div>') +
          uploadSection +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-secondary" id="sharingSheetFootClose">닫기</button>' +
        '</div>' +
      '</form>'
    );

    dialog.querySelector('#sharingSheetCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingSheetFootClose').onclick = function () { dialog.close(); };

    dialog.querySelectorAll('[data-open]').forEach(function (button) {
      button.onclick = function () {
        var sheet = data.items[Number(button.dataset.open)];
        dialog.close();
        openPdf(sheet.url, sheet);
      };
    });

    dialog.querySelectorAll('[data-save]').forEach(function (button) {
      button.onclick = async function () {
        var index = Number(button.dataset.save);
        var select = dialog.querySelector('[data-vis="' + index + '"]');
        button.disabled = true;
        try {
          await saveSheet(book, null, select.value, data.items[index]);
          dialog.close();
          notify('나노시트 공개 범위를 저장했습니다.');
          await openSheets(book, openPdf);
        } catch (err) {
          notify(err.message);
        } finally {
          button.disabled = false;
        }
      };
    });

    var uploadBtn = dialog.querySelector('#sharingUploadBtn');
    if (uploadBtn) {
      uploadBtn.onclick = async function () {
        var input = dialog.querySelector('#sharingNewSheetFile');
        var status = dialog.querySelector('#sharingUploadStatus');
        var file = input.files && input.files[0];
        if (!file) {
          status.textContent = 'PDF 파일을 먼저 선택해 주세요.';
          return;
        }
        uploadBtn.disabled = true;
        try {
          await saveSheet(book, file, dialog.querySelector('#sharingNewSheetVis').value, null, function (pct) {
            status.textContent = '파일 업로드 중... ' + pct + '%';
          });
          book.hasSheet = true;
          book.sheet = true;
          dialog.close();
          notify('새 나노시트를 등록했습니다.');
          await openSheets(book, openPdf);
        } catch (err) {
          status.textContent = err.message;
        } finally {
          uploadBtn.disabled = false;
        }
      };
    }
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
    var catalogCount = (state.catalog || []).length;

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
          '<div class="sharing-kpi-num">' + catalogCount + '<span>권</span></div>' +
          '<div class="sharing-kpi-sub">직접 등록한 북퀴즈 · 나노시트 기준</div>' +
          '<i class="fa-solid fa-book-open sharing-kpi-icon"></i>' +
        '</div>' +
        '<div class="sharing-kpi-card">' +
          '<div class="sharing-kpi-title">내가 공유한 폴더</div>' +
          '<div class="sharing-kpi-num">' + myFolders.length + '<span>개</span></div>' +
          '<div class="sharing-kpi-sub">원장 ID 검증 후 등록된 공유 폴더</div>' +
          '<i class="fa-solid fa-folder-open sharing-kpi-icon"></i>' +
        '</div>' +
        '<div class="sharing-kpi-card">' +
          '<div class="sharing-kpi-title">공유받은 폴더</div>' +
          '<div class="sharing-kpi-num">' + receivedFolders.length + '<span>개</span></div>' +
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
              '<small>직접 등록한 북퀴즈나 나노시트가 포함된 도서를 묶어 다른 학원장님에게 공유해 보세요.</small>' +
              '<button type="button" class="btn-beige-primary sharing-btn-sm" id="sharingEmptyCreateBtn">' +
                '<i class="fa-solid fa-folder-plus"></i> 첫 공유 폴더 만들기' +
              '</button>' +
            '</div>');

    var receivedBodyHtml = state.loading
      ? '<div class="sharing-empty-state"><i class="fa-solid fa-spinner fa-spin sharing-empty-icon"></i><p>공유받은 폴더를 불러오는 중입니다...</p></div>'
      : (receivedFolders.length > 0
          ? '<div class="sharing-folder-list">' + receivedFolders.map(function (folder) {
              return (
                '<div class="sharing-folder-item">' +
                  '<div class="sharing-folder-top">' +
                    '<div class="sharing-folder-name-wrap">' +
                      '<div class="sharing-folder-icon"><i class="fa-solid fa-share-nodes"></i></div>' +
                      '<div>' +
                        '<div class="sharing-folder-name">' + esc(folder.name) + '</div>' +
                        '<div class="sharing-folder-meta">공유 제공: <strong>' + esc(folder.ownerAcademyName) + '</strong> · 포함 도서 <strong>' + (folder.books ? folder.books.length : 0) + '권</strong></div>' +
                      '</div>' +
                    '</div>' +
                    '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-circle-check"></i> 열람 가능</span>' +
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
            '<h2 class="sharing-card-title"><i class="fa-solid fa-folder-open" style="color: var(--btn-primary, #1f8a7e);"></i> 내가 공유한 폴더 <span class="badge-soft badge-soft-neutral">' + myFolders.length + '개</span></h2>' +
            '<p class="sharing-card-hint">폴더에 담은 도서의 비공개 북퀴즈·나노시트도 지정 학원에서는 열람할 수 있습니다.</p>' +
          '</div>' +
          '<div class="sharing-card-body">' + ownBodyHtml + '</div>' +
        '</div>' +
        '<div class="simple-card">' +
          '<div class="sharing-card-head">' +
            '<h2 class="sharing-card-title"><i class="fa-solid fa-inbox" style="color: var(--btn-primary, #1f8a7e);"></i> 공유받은 폴더 <span class="badge-soft badge-soft-neutral">' + receivedFolders.length + '개</span></h2>' +
            '<p class="sharing-card-hint">공유받은 도서의 북퀴즈와 나노시트는 도서 목록·학생 학습 화면에서 자동으로 이용 가능합니다.</p>' +
          '</div>' +
          '<div class="sharing-card-body">' + receivedBodyHtml + '</div>' +
        '</div>' +
      '</div>';

    var createBtn = document.getElementById('sharingCreateBtn');
    if (createBtn) createBtn.onclick = function () { editFolder(null); };
    var emptyCreateBtn = document.getElementById('sharingEmptyCreateBtn');
    if (emptyCreateBtn) emptyCreateBtn.onclick = function () { editFolder(null); };
    var refreshBtn = document.getElementById('sharingRefreshBtn');
    if (refreshBtn) refreshBtn.onclick = function () { refresh(); };

    root.querySelectorAll('[data-edit-folder]').forEach(function (button) {
      button.onclick = function () { editFolder(button.dataset.editFolder); };
    });
    root.querySelectorAll('[data-delete-folder]').forEach(function (button) {
      button.onclick = function () { deleteFolder(button.dataset.deleteFolder); };
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
    if (!confirm('[' + folder.name + '] 공유 폴더를 삭제하시겠습니까?\n폴더를 삭제하면 공유받던 학원의 비공개 콘텐츠 열람 권한도 즉시 해제됩니다.')) {
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

  // 공유 폴더 생성 및 수정 모달
  async function editFolder(id) {
    var folder = id ? state.items.find(function (item) { return item.id === id; }) : null;

    // 아직 카탈로그가 비어 있거나 새로 열 때 최신 목록 동기화
    if (!state.catalog.length && !state.error) {
      try {
        var catRes = await request('/api/content?action=catalog');
        state.catalog = catRes.items || [];
      } catch (e) {}
    }

    var selectedIds = new Set(folder ? (folder.bookIds || []) : []);
    var recipients = (folder && Array.isArray(folder.recipients))
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

    var filterType = 'ALL'; // 'ALL' | 'QUIZ' | 'SHEET' | 'SELECTED'
    var displayLimit = 100;
    var verifiedCandidate = null;
    var lookupStatus = { type: 'idle', message: '' }; // 'idle' | 'loading' | 'verified' | 'error'

    var dialog = openModal(
      '<form class="sharing-dialog-form" id="sharingFolderForm">' +
        '<div class="sharing-dialog-head">' +
          '<div>' +
            '<h3><i class="fa-solid fa-folder-plus" style="color: var(--btn-primary, #1f8a7e);"></i> ' + (folder ? '공유 폴더 수정' : '공유 폴더 생성') + '</h3>' +
            '<p>내가 등록한 북퀴즈·나노시트 도서를 선택하고 공유받을 학원장 ID를 조회하여 등록하세요.</p>' +
          '</div>' +
          '<button type="button" class="sharing-close-icon" id="sharingCloseBtn" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="sharing-dialog-body">' +
          '<div class="sharing-section">' +
            '<div class="sharing-label-row">' +
              '<label class="sharing-label" for="sharingFolderName">폴더명 <span class="sharing-required-dot">*필수</span></label>' +
            '</div>' +
            '<input id="sharingFolderName" class="sharing-input" maxlength="100" required placeholder="예: 초등 5학년 심화 독서 모음" value="' + esc(folder ? folder.name : '') + '">' +
          '</div>' +

          '<div class="sharing-section">' +
            '<div class="sharing-label-row">' +
              '<span class="sharing-label">도서 선택 <span class="badge-soft badge-soft-success" id="sharingSelectedCountBadge">0권 선택됨</span></span>' +
              '<div style="display: flex; gap: 6px; align-items: center;">' +
                '<button type="button" class="sharing-text-btn" id="sharingSelectVisibleBtn">목록 전체 선택</button>' +
                '<span style="color: var(--border-medium, #d8cfc1);">|</span>' +
                '<button type="button" class="sharing-text-btn" id="sharingClearBooksBtn">선택 해제</button>' +
              '</div>' +
            '</div>' +
            '<div class="sharing-book-toolbar">' +
              '<div class="sharing-book-search-wrap">' +
                '<i class="fa-solid fa-magnifying-glass"></i>' +
                '<input type="text" id="sharingBookSearch" class="sharing-input" placeholder="도서명 · 도서 코드 · 저자로 검색">' +
              '</div>' +
              '<div class="sharing-filter-pills" id="sharingFilterPills">' +
                '<button type="button" class="sharing-pill-btn active" data-filter="ALL">전체 (' + state.catalog.length + ')</button>' +
                '<button type="button" class="sharing-pill-btn" data-filter="QUIZ">북퀴즈</button>' +
                '<button type="button" class="sharing-pill-btn" data-filter="SHEET">나노시트</button>' +
                '<button type="button" class="sharing-pill-btn" data-filter="SELECTED">선택됨</button>' +
              '</div>' +
            '</div>' +
            '<p class="sharing-help">내가 등록한 북퀴즈나 나노시트가 있는 도서만 리스트에 표시됩니다.</p>' +
            '<div class="sharing-book-list" id="sharingBookListBox"></div>' +
          '</div>' +

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
            '<p class="sharing-help">등록된 학원의 원장·선생님·학생 모두 이용할 수 있습니다. 도서나 학원을 해제하고 저장하면 공유가 즉시 종료됩니다.</p>' +
          '</div>' +
        '</div>' +
        '<div class="sharing-dialog-foot">' +
          '<button type="button" class="btn-beige-secondary" id="sharingCancelBtn">취소</button>' +
          '<button type="submit" class="btn-beige-primary" id="sharingSaveBtn"><i class="fa-solid fa-check"></i> ' + (folder ? '변경 저장' : '공유 폴더 등록') + '</button>' +
        '</div>' +
      '</form>'
    );

    var searchInput = dialog.querySelector('#sharingBookSearch');
    var bookBox = dialog.querySelector('#sharingBookListBox');
    var countBadge = dialog.querySelector('#sharingSelectedCountBadge');
    var filterPills = dialog.querySelectorAll('#sharingFilterPills .sharing-pill-btn');
    var directorInput = dialog.querySelector('#sharingDirectorSearchInput');
    var lookupBtn = dialog.querySelector('#sharingDirectorLookupBtn');
    var lookupBox = dialog.querySelector('#sharingDirectorLookupResult');
    var recipientBox = dialog.querySelector('#sharingRecipientList');
    var recipientBadge = dialog.querySelector('#sharingRecipientCountBadge');

    function getFilteredBooks() {
      var query = (searchInput.value || '').trim().toLowerCase();
      return state.catalog.filter(function (b) {
        if (filterType === 'QUIZ' && !b.hasQuiz) return false;
        if (filterType === 'SHEET' && !b.hasSheet) return false;
        if (filterType === 'SELECTED' && !selectedIds.has(b.id)) return false;
        if (!query) return true;
        return (
          String(b.title || '').toLowerCase().indexOf(query) !== -1 ||
          String(b.bookNo || '').toLowerCase().indexOf(query) !== -1 ||
          String(b.author || '').toLowerCase().indexOf(query) !== -1
        );
      });
    }

    function renderBookList() {
      countBadge.textContent = selectedIds.size + '권 선택됨';
      filterPills.forEach(function (pill) {
        var f = pill.dataset.filter;
        pill.classList.toggle('active', f === filterType);
        if (f === 'SELECTED') pill.textContent = '선택됨 (' + selectedIds.size + ')';
      });

      if (state.catalog.length === 0) {
        bookBox.innerHTML =
          '<div class="sharing-list-empty">' +
            '<i class="fa-regular fa-folder-open" style="font-size: 22px; opacity: 0.45; display: block; margin-bottom: 6px;"></i>' +
            '<strong>등록한 북퀴즈나 나노시트가 있는 도서가 아직 없습니다.</strong><br>' +
            '<span>콘텐츠 관리에서 도서·나노시트 또는 북퀴즈를 직접 등록한 뒤 다시 확인해 주세요.</span>' +
          '</div>';
        return;
      }

      var filtered = getFilteredBooks();
      if (filtered.length === 0) {
        bookBox.innerHTML = '<div class="sharing-list-empty">조건에 일치하는 도서가 없습니다.</div>';
        return;
      }

      var slice = filtered.slice(0, displayLimit);
      var rowsHtml = slice.map(function (b) {
        var isSelected = selectedIds.has(b.id);
        var thumbUrl = safeImg(b.coverUrl);
        var thumbHtml = thumbUrl
          ? '<img src="' + esc(thumbUrl) + '" alt="" onerror="this.remove()">'
          : '<i class="fa-solid fa-book"></i>';
        var quizLabel = b.quizCount ? ('북퀴즈 ' + b.quizCount + '문항') : '북퀴즈';
        var subParts = [b.bookNo, b.author, b.grade].filter(Boolean);
        return (
          '<label class="sharing-book-row' + (isSelected ? ' is-selected' : '') + '" data-book-id="' + esc(b.id) + '">' +
            '<input type="checkbox" value="' + esc(b.id) + '"' + (isSelected ? ' checked' : '') + '>' +
            '<span class="sharing-book-thumb">' + thumbHtml + '</span>' +
            '<span class="sharing-book-info">' +
              '<span class="sharing-book-title" style="display: block;">' + esc(b.title) + '</span>' +
              '<span class="sharing-book-sub" style="display: block;">' + esc(subParts.join(' · ')) + '</span>' +
            '</span>' +
            '<span class="sharing-book-badges">' +
              (b.hasQuiz ? '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-list-check"></i> ' + esc(quizLabel) + '</span>' : '') +
              (b.hasSheet ? '<span class="badge-soft badge-soft-master"><i class="fa-solid fa-file-pdf"></i> 나노시트</span>' : '') +
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

      bookBox.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
        box.onchange = function () {
          if (box.checked) selectedIds.add(box.value);
          else selectedIds.delete(box.value);
          var row = box.closest('.sharing-book-row');
          if (row) row.classList.toggle('is-selected', box.checked);
          countBadge.textContent = selectedIds.size + '권 선택됨';
          filterPills.forEach(function (pill) {
            if (pill.dataset.filter === 'SELECTED') pill.textContent = '선택됨 (' + selectedIds.size + ')';
          });
        };
      });

      var moreBtn = bookBox.querySelector('#sharingShowMoreBooksBtn');
      if (moreBtn) {
        moreBtn.onclick = function () {
          displayLimit += 100;
          renderBookList();
        };
      }
    }

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

    searchInput.oninput = function () {
      displayLimit = 100;
      renderBookList();
    };

    filterPills.forEach(function (pill) {
      pill.onclick = function () {
        filterType = pill.dataset.filter;
        displayLimit = 100;
        renderBookList();
      };
    });

    dialog.querySelector('#sharingSelectVisibleBtn').onclick = function () {
      getFilteredBooks().forEach(function (b) { selectedIds.add(b.id); });
      renderBookList();
    };
    dialog.querySelector('#sharingClearBooksBtn').onclick = function () {
      selectedIds.clear();
      renderBookList();
    };

    lookupBtn.onclick = lookupDirector;
    directorInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        lookupDirector();
      }
    });

    dialog.querySelector('#sharingCloseBtn').onclick = function () { dialog.close(); };
    dialog.querySelector('#sharingCancelBtn').onclick = function () { dialog.close(); };

    dialog.querySelector('#sharingFolderForm').onsubmit = async function (event) {
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
          id: folder && folder.id,
          revision: folder && folder.revision,
          name: dialog.querySelector('#sharingFolderName').value,
          bookIds: Array.from(selectedIds),
          directorUsernames: recipients.map(function (r) { return r.username; })
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
    renderRecipients();
    renderLookupResult();
  }

  global.ContentSharing = {
    refresh: refresh,
    editFolder: editFolder,
    deleteFolder: deleteFolder,
    openSheets: openSheets,
    saveSheet: saveSheet
  };
})(window);
