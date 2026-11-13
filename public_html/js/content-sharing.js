(function (global) {
  'use strict';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(action, data) { return global.NanoPortal.api('/api/content?action=' + action, data, 60000); }
  function staff() { var user = global.NanoPortal && NanoPortal.user(); return user && ['student', 'STUDENT'].indexOf(user.role) < 0; }
  function message(el, text, error) { el.textContent = text; el.className = 'sharing-status' + (error ? ' error' : ''); }
  function dialog(title) {
    var el = document.createElement('dialog');
    el.className = 'sharing-dialog';
    el.setAttribute('aria-label', title);
    el.innerHTML = '<header><h2>' + esc(title) + '</h2><button type="button" aria-label="닫기">닫기</button></header><div class="sharing-body"></div>';
    document.body.appendChild(el);
    el.querySelector('header button').onclick = function () { el.close(); };
    el.addEventListener('close', function () { el.remove(); });
    el.showModal();
    return el;
  }
  function busy(form, enabled) {
    form.querySelectorAll('button, input, select, textarea').forEach(function (el) { el.disabled = enabled; });
  }
  async function refresh() {
    var view = document.getElementById('view-content-sharing');
    if (!view) return;
    view.innerHTML = '<div class="content-sharing"><div class="sharing-heading"><div><h2>콘텐츠 공유</h2><p>직접 등록한 북퀴즈와 나노시트를 다른 학원과 함께 사용하세요.</p></div><button type="button" class="sharing-primary" id="sharingCreate">공유 폴더 생성</button></div><div class="sharing-status" role="status">공유 폴더를 불러오는 중입니다.</div><div class="sharing-results"></div></div>';
    view.querySelector('#sharingCreate').onclick = function () { editFolder(); };
    var status = view.querySelector('.sharing-status'), results = view.querySelector('.sharing-results');
    try {
      var data = await api('folders');
      if (!status.isConnected) return;
      message(status, '폴더에 담긴 도서의 비공개 콘텐츠도 공유받은 학원의 원장·선생님·학생이 이용할 수 있습니다.');
      function cards(items, mine) {
        return '<div class="sharing-folders">' + (items.length ? items.map(function (f) {
          return '<article class="sharing-folder"><h3>' + esc(f.name) + '</h3><p>' + (mine ? '도서 ' + f.books.length + '권 · 공유 학원 ' + f.recipients.length + '곳' : esc(f.ownerAcademyName) + '에서 공유') + '</p><ul>' + f.books.map(function (b) { return '<li>' + esc(b.title) + '</li>'; }).join('') + '</ul>' + (mine ? '<p>' + f.recipients.map(function (r) { return esc(r.academyName) + ' (' + esc(r.username) + ')'; }).join(', ') + '</p><button type="button" data-edit-folder="' + esc(f.id) + '">폴더 편집</button>' : '') + '</article>';
        }).join('') : '<p>아직 공유 폴더가 없습니다.</p>') + '</div>';
      }
      results.innerHTML = '<h3>내가 공유한 폴더</h3>' + cards(data.items, true) + '<h3>공유받은 폴더</h3>' + cards(data.received, false);
      results.querySelectorAll('[data-edit-folder]').forEach(function (button) { button.onclick = function () { editFolder(data.items.find(function (f) { return f.id === button.dataset.editFolder; })); }; });
    } catch (err) {
      message(status, err.message || '공유 폴더를 불러오지 못했습니다.', true);
      results.innerHTML = '<button type="button">다시 불러오기</button>';
      results.firstChild.onclick = refresh;
    }
  }
  async function editFolder(folder) {
    var modal = dialog(folder ? '공유 폴더 편집' : '공유 폴더 생성');
    var body = modal.querySelector('.sharing-body');
    body.innerHTML = '<p role="status">등록한 콘텐츠를 불러오는 중입니다.</p>';
    try {
      var result = await api('catalog');
      if (!modal.isConnected) return;
      var selected = new Set(folder ? folder.bookIds : []);
      var available = new Set(result.items.map(function (b) { return b.id; }));
      selected.forEach(function (id) { if (!available.has(id)) selected.delete(id); });
      body.innerHTML = '<form><label for="sharingName">폴더명</label><input id="sharingName" required maxlength="100" value="' + esc(folder && folder.name) + '"><label for="sharingSearch">도서 선택</label><input id="sharingSearch" type="search" placeholder="도서명·도서 코드 검색"><p class="sharing-help">직접 등록한 북퀴즈 또는 나노시트가 있는 도서만 표시됩니다.</p><div class="sharing-book-list"></div><p class="sharing-selection" aria-live="polite"></p><label for="sharingDirectors">공유받을 학원장 ID</label><textarea id="sharingDirectors" rows="3" placeholder="학원장 로그인 ID를 쉼표 또는 줄바꿈으로 구분해 입력하세요.">' + esc(folder ? folder.recipients.map(function (r) { return r.username; }).join('\n') : '') + '</textarea><p class="sharing-help">등록된 학원의 원장·선생님·학생 모두 이용할 수 있습니다. 도서 선택을 해제하거나 학원장 ID를 지우고 저장하면 공유가 해제됩니다.</p><p class="sharing-status" role="status"></p><footer><button type="button" data-cancel>취소</button><button type="submit" class="sharing-primary">' + (folder ? '변경 저장' : '등록') + '</button></footer></form>';
      var form = body.querySelector('form'), list = body.querySelector('.sharing-book-list');
      function renderBooks() {
        var term = body.querySelector('#sharingSearch').value.toLowerCase().trim();
        var books = result.items.filter(function (b) { return (b.title + ' ' + b.bookNo).toLowerCase().includes(term); });
        list.innerHTML = books.length ? books.map(function (b) { return '<label class="sharing-book"><input type="checkbox" value="' + esc(b.id) + '" ' + (selected.has(b.id) ? 'checked' : '') + '><span>' + esc(b.title) + '<small>' + esc(b.bookNo) + ' · ' + [b.hasQuiz ? '북퀴즈' : '', b.hasSheet ? '나노시트' : ''].filter(Boolean).join(' / ') + '</small></span></label>'; }).join('') : '<p class="sharing-help">선택 가능한 도서가 없습니다.</p>';
        body.querySelector('.sharing-selection').textContent = selected.size + '권 선택됨';
      }
      body.querySelector('#sharingSearch').oninput = renderBooks;
      list.onchange = function (e) { if (e.target.type === 'checkbox') { e.target.checked ? selected.add(e.target.value) : selected.delete(e.target.value); body.querySelector('.sharing-selection').textContent = selected.size + '권 선택됨'; } };
      body.querySelector('[data-cancel]').onclick = function () { modal.close(); };
      form.onsubmit = async function (e) {
        e.preventDefault();
        var status = body.querySelector('.sharing-status');
        var payload = { name: body.querySelector('#sharingName').value.trim(), bookIds: Array.from(selected), directorUsernames: body.querySelector('#sharingDirectors').value.split(/[\s,;]+/).filter(Boolean) };
        if (folder) { payload.id = folder.id; payload.revision = folder.revision; }
        if (!folder && (!selected.size || !payload.directorUsernames.length)) { message(status, '도서와 공유받을 학원장 ID를 하나 이상 등록해 주세요.', true); return; }
        busy(form, true); message(status, '학원장 ID를 확인하고 저장하는 중입니다.');
        try { await api('folder', payload); modal.close(); await refresh(); }
        catch (err) { message(status, err.message, true); }
        finally { busy(form, false); }
      };
      renderBooks();
      body.querySelector('#sharingName').focus();
    } catch (err) { body.textContent = err.message || '콘텐츠를 불러오지 못했습니다. 다시 열어 주세요.'; }
  }
  async function uploadFile(file) {
    if (!file || file.size <= 0 || file.size > 25 * 1024 * 1024) throw new Error('25MB 이하 PDF 파일을 선택해 주세요.');
    if (await file.slice(0, 5).text() !== '%PDF-') throw new Error('유효한 PDF 파일을 선택해 주세요.');
    var ids = [];
    for (var offset = 0; offset < file.size; offset += 3 * 1024 * 1024) {
      var base64 = await new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result).split(',')[1]); };
        reader.onerror = function () { reject(new Error('PDF 파일을 읽지 못했습니다.')); };
        reader.readAsDataURL(file.slice(offset, offset + 3 * 1024 * 1024));
      });
      ids.push((await api('sheet-chunk', { base64: base64 })).id);
    }
    return ids;
  }
  async function saveSheet(book, file, visibility) {
    var fileIds = await uploadFile(file);
    var result = await api('worksheet', { bookId: book.serverId || book.bookNo || book.id, name: file.name || book.title + '_나노시트.pdf', isPublic: visibility || 'Y', fileIds: fileIds });
    book.hasSheet = true; book.sheet = true;
    book.worksheetUrl = result.item.url; book.pdfUrl = result.item.url;
    return result.item;
  }
  async function openSheets(book, onSelect) {
    if (!book) return;
    var modal = dialog(book.title + ' · 나노시트');
    var body = modal.querySelector('.sharing-body');
    body.innerHTML = '<div class="sharing-status" role="status"></div><div class="sharing-sheets"></div>' + (staff() ? '<form class="sharing-upload"><h3>우리 학원 나노시트 등록</h3><label for="sharingPdf">PDF 파일 (최대 25MB)</label><input type="file" id="sharingPdf" accept="application/pdf,.pdf" required><label for="sharingSheetVisibility">공개 범위</label><select id="sharingSheetVisibility"><option value="Y">공개 · 모든 학원</option><option value="N">비공개 · 우리 학원 및 공유받은 학원</option></select><footer><button type="submit" class="sharing-primary">나노시트 등록</button></footer></form>' : '');
    var status = body.querySelector('.sharing-status'), list = body.querySelector('.sharing-sheets');
    async function load() {
      message(status, '이용 가능한 나노시트를 불러오는 중입니다.');
      try {
        var data = await api('worksheets&bookId=' + encodeURIComponent(book.serverId || book.bookNo || book.id));
        if (!modal.isConnected) return;
        message(status, data.items.length ? '등록 학원을 확인하고 사용할 나노시트를 선택하세요.' : '현재 이용 가능한 나노시트가 없습니다.');
        list.innerHTML = data.items.map(function (s, i) { return '<div class="sharing-sheet"><div><strong>' + esc(s.name) + '</strong><small>' + esc(s.academyName) + ' · ' + (s.isPublic === 'N' ? '비공개 / 공유 허용' : '전체 공개') + '</small></div>' + (s.isMine ? '<select aria-label="' + esc(s.name) + ' 공개 범위" data-visibility="' + i + '"><option value="Y" ' + (s.isPublic !== 'N' ? 'selected' : '') + '>공개</option><option value="N" ' + (s.isPublic === 'N' ? 'selected' : '') + '>비공개</option></select>' : '') + '<button type="button" data-sheet="' + i + '">열기</button></div>'; }).join('');
        list.querySelectorAll('[data-sheet]').forEach(function (button) { button.onclick = function () { var sheet = data.items[Number(button.dataset.sheet)]; if (onSelect) { modal.close(); onSelect(sheet.url, sheet); } else { window.open(sheet.url, '_blank', 'noopener'); } }; });
        list.querySelectorAll('[data-visibility]').forEach(function (select) {
          select.onchange = async function () {
            var sheet = data.items[Number(select.dataset.visibility)]; select.disabled = true;
            try { await api('worksheet', { bookId: sheet.bookId, id: sheet.id, revision: sheet.revision, name: sheet.name, isPublic: select.value }); await load(); }
            catch (err) { select.value = sheet.isPublic; message(status, err.message, true); }
            finally { select.disabled = false; }
          };
        });
      } catch (err) { message(status, err.message, true); }
    }
    var form = body.querySelector('form');
    if (form) form.onsubmit = async function (event) {
      event.preventDefault();
      var file = form.querySelector('#sharingPdf').files[0], visibility = form.querySelector('select').value;
      busy(form, true); message(status, '나노시트를 등록하는 중입니다.');
      try { await saveSheet(book, file, visibility); form.reset(); await load(); if (global.renderAcademyBookTable) global.renderAcademyBookTable(); }
      catch (err) { message(status, err.message, true); }
      finally { busy(form, false); }
    };
    await load();
  }
  global.ContentSharing = { refresh: refresh, openSheets: openSheets, saveSheet: saveSheet, uploadFile: uploadFile };
})(window);
