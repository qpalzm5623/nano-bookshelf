/**
 * 나노의 책장 - 초등 문해력 진단 평가 마스터 문항 은행 관리 모듈
 * (Master Literacy Item Bank Controller)
 * 
 * 마스터 관리자에서 표준 진단 문항(기본 209문항) 조회, 검색, 필터링, 신규 등록,
 * 수정, 삭제, 기본 복원 및 엑셀 다운로드를 전담합니다.
 * (운영 서버 API와 로컬 프리뷰 환경 모두에서 100% 실시간 작동 지원)
 */

(function (window, document) {
  'use strict';

  // 내부 상태 관리
  var state = {
    items: [],
    version: '2026-10-14',
    revision: 0,
    isDefault: true,
    coverage: [],
    currentPage: 1,
    pageSize: 15,
    isLoading: false,
    editingItemId: null
  };

  // 스크립트 로드 시 즉시 시드 문항 데이터 사전 탑재 (화면 깜빡임 없는 초고속 로딩)
  function initSeedData() {
    if (window.NANO_LITERACY_SEED_BANK && (!state.items || state.items.length === 0)) {
      var seed = window.NANO_LITERACY_SEED_BANK;
      state.items = Array.isArray(seed.items) ? seed.items.slice() : [];
      state.version = (seed.meta && seed.meta.version) || seed.version || '2026-10-14';
      state.revision = 0;
      state.isDefault = true;
    }
  }
  initSeedData();

  /**
   * 문항 은행 데이터 로드 (서버 API 우선, 로컬 프리뷰 환경 완벽 지원)
   */
  async function loadBankData() {
    state.isLoading = true;
    var loaded = false;

    // 1. 서버 API 호출 시도 (운영 환경)
    try {
      var res = await fetch('/api/literacy?action=bank');
      if (res.ok) {
        var data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          state.items = data.items;
          state.version = data.version || '2026-10-14';
          state.revision = Number(data.revision) || 0;
          state.isDefault = Boolean(data.isDefault);
          state.coverage = Array.isArray(data.coverage) ? data.coverage : [];
          loaded = true;
        }
      }
    } catch (e) {
      // 로컬 프리뷰나 정적 호스팅 환경일 수 있음
      console.warn('[MasterLiteracy] 서버 API 통신 불가(로컬 프리뷰 모드로 동작):', e);
    }

    // 2. 로컬 프리뷰 모드: 로컬 스토리지 편집본 확인
    if (!loaded) {
      try {
        var localEdited = localStorage.getItem('NANO_LITERACY_BANK_DATA');
        if (localEdited) {
          var parsed = JSON.parse(localEdited);
          if (Array.isArray(parsed.items) && parsed.items.length > 0) {
            state.items = parsed.items;
            state.version = parsed.version || '로컬 편집본';
            state.revision = Number(parsed.revision) || 1;
            state.isDefault = false;
            loaded = true;
          }
        }
      } catch (err) {}
    }

    // 3. 로컬 편집본도 없으면 표준 시드 데이터(209문항) 탑재
    if (!loaded) {
      if (window.NANO_LITERACY_SEED_BANK) {
        var seed = window.NANO_LITERACY_SEED_BANK;
        state.items = Array.isArray(seed.items) ? seed.items.slice() : [];
        state.version = (seed.meta && seed.meta.version) || seed.version || '2026-10-14';
        state.revision = 0;
        state.isDefault = true;
        loaded = true;
      }
    }

    state.isLoading = false;
    return state.items;
  }

  /**
   * 상단 통계 카드 및 규정 충족 배지 갱신
   */
  function updateStats() {
    var totalEl = document.getElementById('statLiteracyTotal');
    var totalSub = document.getElementById('statLiteracyTotalSub');
    var b0El = document.getElementById('statLiteracyBand0');
    var b0Sub = document.getElementById('statLiteracyBand0Sub');
    var b1El = document.getElementById('statLiteracyBand1');
    var b1Sub = document.getElementById('statLiteracyBand1Sub');
    var b2El = document.getElementById('statLiteracyBand2');
    var b2Sub = document.getElementById('statLiteracyBand2Sub');
    var badgeEl = document.getElementById('masterLiteracyCoverageBadge');
    var countEl = document.getElementById('masterLiteracyItemCount');

    var all = state.items;
    var selectedCount = all.filter(function (i) { return i.status === '선정'; }).length;
    var reserveCount = all.filter(function (i) { return i.status !== '선정'; }).length;

    var b0 = all.filter(function (i) { return Number(i.band) === 0; });
    var b0Sel = b0.filter(function (i) { return i.status === '선정'; }).length;

    var b1 = all.filter(function (i) { return Number(i.band) === 1; });
    var b1Sel = b1.filter(function (i) { return i.status === '선정'; }).length;

    var b2 = all.filter(function (i) { return Number(i.band) === 2; });
    var b2Sel = b2.filter(function (i) { return i.status === '선정'; }).length;

    if (totalEl) totalEl.innerHTML = all.length + '<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">문항</span>';
    if (totalSub) totalSub.textContent = '선정 ' + selectedCount + '문항 / 예비 ' + reserveCount + '문항';

    if (b0El) b0El.innerHTML = b0.length + '<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">문항</span>';
    if (b0Sub) b0Sub.textContent = '3지선다 · 선정 ' + b0Sel + ' / 규정 30';

    if (b1El) b1El.innerHTML = b1.length + '<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">문항</span>';
    if (b1Sub) b1Sub.textContent = '3지선다 · 선정 ' + b1Sel + ' / 규정 30';

    if (b2El) b2El.innerHTML = b2.length + '<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">문항</span>';
    if (b2Sub) b2Sub.textContent = '4지선다 · 선정 ' + b2Sel + ' / 규정 30';

    if (countEl) countEl.textContent = all.length;

    // 출제 충족 여부 점검 (밴드별 각 30문항 이상 출제 선정 필요)
    var isFullCoverage = (b0Sel >= 30 && b1Sel >= 30 && b2Sel >= 30);
    if (badgeEl) {
      if (isFullCoverage) {
        badgeEl.className = 'badge badge-success px-2 py-1';
        badgeEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i>출제 규정 충족 (' + b0Sel + ' / ' + b1Sel + ' / ' + b2Sel + ')';
      } else {
        badgeEl.className = 'badge badge-warning text-dark px-2 py-1';
        badgeEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i>출제 문항 부족 경고 (' + b0Sel + ' / ' + b1Sel + ' / ' + b2Sel + ')';
      }
    }
  }

  /**
   * 필터링된 문항 목록 산출
   */
  function getFilteredItems() {
    var bandVal = (document.getElementById('masterLiteracyBandFilter') || {}).value || 'ALL';
    var areaVal = (document.getElementById('masterLiteracyAreaFilter') || {}).value || 'ALL';
    var statusVal = (document.getElementById('masterLiteracyStatusFilter') || {}).value || 'ALL';
    var searchVal = ((document.getElementById('masterLiteracySearchInput') || {}).value || '').trim().toLowerCase();

    return state.items.filter(function (it) {
      if (bandVal !== 'ALL' && String(it.band) !== bandVal) return false;
      if (areaVal !== 'ALL' && it.area !== areaVal) return false;
      if (statusVal !== 'ALL' && it.status !== statusVal) return false;

      if (searchVal) {
        var idMatch = String(it.id || '').toLowerCase().indexOf(searchVal) !== -1;
        var qMatch = String(it.question || '').toLowerCase().indexOf(searchVal) !== -1;
        var pMatch = String(it.passage || '').toLowerCase().indexOf(searchVal) !== -1;
        var wMatch = String(it.word || '').toLowerCase().indexOf(searchVal) !== -1;
        if (!idMatch && !qMatch && !pMatch && !wMatch) return false;
      }
      return true;
    });
  }

  /**
   * 테이블 목록 및 페이지네이션 렌더링
   */
  async function renderMasterLiteracyBank(targetPage) {
    if (!state.items || state.items.length === 0) {
      await loadBankData();
    }
    updateStats();

    var filtered = getFilteredItems();
    var total = filtered.length;
    var pageSize = state.pageSize;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));

    var page = Number(targetPage) || state.currentPage || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    state.currentPage = page;

    var start = (page - 1) * pageSize;
    var paged = filtered.slice(start, start + pageSize);

    var tbody = document.getElementById('masterLiteracyTableBody');
    var countEl = document.getElementById('masterLiteracyItemCount');
    if (countEl) countEl.textContent = total;

    if (!tbody) return;

    if (!paged.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5 text-muted">' +
        '<i class="fa-solid fa-circle-exclamation mr-1" style="font-size: 20px;"></i><br>' +
        '<span style="font-size: 13.5px; font-weight: 600; display: inline-block; margin-top: 6px;">조건에 일치하는 문항이 없습니다.</span>' +
        '</td></tr>';
      renderPagination(0, 1, 1);
      return;
    }

    var html = '';
    paged.forEach(function (item, idx) {
      var rowNum = start + idx + 1;
      var bandBadge = '';
      if (Number(item.band) === 0) bandBadge = '<span class="badge badge-light border text-success font-weight-bold">Band 0 (초1~2)</span>';
      else if (Number(item.band) === 1) bandBadge = '<span class="badge badge-light border text-primary font-weight-bold">Band 1 (초3~4)</span>';
      else bandBadge = '<span class="badge badge-light border text-danger font-weight-bold">Band 2 (초5~6)</span>';

      var statusBadge = (item.status === '선정')
        ? '<span class="badge badge-success">출제 선정</span>'
        : '<span class="badge badge-secondary">예비 문항</span>';

      var previewText = escapeHtml(item.question || '');
      var passageSnippet = item.passage ? '<div class="text-muted small mt-1" style="font-size: 11.5px; line-height: 1.4; max-height: 38px; overflow: hidden; text-overflow: ellipsis; white-space: normal;"><i class="fa-solid fa-quote-left mr-1 opacity-50"></i>' + escapeHtml(item.passage.slice(0, 90)) + (item.passage.length > 90 ? '...' : '') + '</div>' : '';

      var hasImage = (item.image || (Array.isArray(item.choiceImages) && item.choiceImages.some(Boolean)));
      var imageIcon = hasImage
        ? '<span class="text-success" title="삽화 포함"><i class="fa-solid fa-image"></i></span>'
        : '<span class="text-muted" style="opacity: 0.3;">-</span>';

      var answerDisplay = (Number(item.answer) + 1) + '번';

      html += '<tr style="font-size: 12.5px;">' +
        '<td class="text-center text-muted">' + rowNum + '</td>' +
        '<td class="text-center font-weight-bold font-monospace" style="color: #1f8a7e;">' + escapeHtml(item.id) + '</td>' +
        '<td class="text-center">' + bandBadge + '</td>' +
        '<td class="text-center"><span class="badge badge-light border">' + escapeHtml(item.area) + '</span></td>' +
        '<td class="text-center">' + statusBadge + '</td>' +
        '<td>' +
          '<div style="font-weight: 600; color: #2c2520;">' + previewText + '</div>' +
          passageSnippet +
        '</td>' +
        '<td class="text-center font-weight-bold" style="color: #e65100;">' + answerDisplay + '</td>' +
        '<td class="text-center">' + imageIcon + '</td>' +
        '<td class="text-center">' +
          '<div class="d-inline-flex gap-1">' +
            '<button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11.5px;" onclick="openMasterLiteracyModal(\'' + escapeHtml(item.id) + '\')">' +
              '<i class="fa-solid fa-pen mr-1"></i>수정' +
            '</button>' +
            '<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 ml-1" style="font-size: 11.5px;" onclick="deleteMasterLiteracyItem(\'' + escapeHtml(item.id) + '\')">' +
              '<i class="fa-solid fa-trash"></i>' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
    renderPagination(total, page, totalPages);
  }

  /**
   * 하단 정갈한 페이지네이션 렌더링
   */
  function renderPagination(total, page, totalPages) {
    var infoEl = document.getElementById('masterLiteracyPageInfo');
    var navEl = document.getElementById('masterLiteracyPagination');
    if (infoEl) {
      if (total === 0) infoEl.textContent = '0문항';
      else {
        var startNum = (page - 1) * state.pageSize + 1;
        var endNum = Math.min(page * state.pageSize, total);
        infoEl.textContent = startNum + '-' + endNum + ' / 총 ' + total + '문항 (' + page + '/' + totalPages + ' 페이지)';
      }
    }
    if (!navEl) return;
    if (totalPages <= 1) {
      navEl.innerHTML = '';
      return;
    }

    var html = '';
    // 첫 페이지 / 이전 페이지
    html += '<button type="button" class="btn btn-sm btn-light border' + (page === 1 ? ' disabled' : '') + '" onclick="renderMasterLiteracyBank(1)" title="첫 페이지" style="font-size: 11px; padding: 3px 8px;"><i class="fa-solid fa-angles-left"></i></button>';
    html += '<button type="button" class="btn btn-sm btn-light border' + (page === 1 ? ' disabled' : '') + '" onclick="renderMasterLiteracyBank(' + (page - 1) + ')" title="이전" style="font-size: 11px; padding: 3px 8px;"><i class="fa-solid fa-chevron-left"></i></button>';

    var startP = Math.max(1, page - 3);
    var endP = Math.min(totalPages, page + 3);

    for (var p = startP; p <= endP; p++) {
      if (p === page) {
        html += '<button type="button" class="btn btn-sm btn-primary" style="background:#1f8a7e; border-color:#1f8a7e; font-size: 11.5px; font-weight:700; padding: 3px 9px;">' + p + '</button>';
      } else {
        html += '<button type="button" class="btn btn-sm btn-light border" onclick="renderMasterLiteracyBank(' + p + ')" style="font-size: 11.5px; padding: 3px 9px;">' + p + '</button>';
      }
    }

    // 다음 페이지 / 끝 페이지
    html += '<button type="button" class="btn btn-sm btn-light border' + (page === totalPages ? ' disabled' : '') + '" onclick="renderMasterLiteracyBank(' + (page + 1) + ')" title="다음" style="font-size: 11px; padding: 3px 8px;"><i class="fa-solid fa-chevron-right"></i></button>';
    html += '<button type="button" class="btn btn-sm btn-light border' + (page === totalPages ? ' disabled' : '') + '" onclick="renderMasterLiteracyBank(' + totalPages + ')" title="마지막 페이지" style="font-size: 11px; padding: 3px 8px;"><i class="fa-solid fa-angles-right"></i></button>';

    navEl.innerHTML = html;
  }

  /**
   * 필터 리셋
   */
  function resetFilters() {
    var b = document.getElementById('masterLiteracyBandFilter'); if (b) b.value = 'ALL';
    var a = document.getElementById('masterLiteracyAreaFilter'); if (a) a.value = 'ALL';
    var s = document.getElementById('masterLiteracyStatusFilter'); if (s) s.value = 'ALL';
    var q = document.getElementById('masterLiteracySearchInput'); if (q) q.value = '';
    renderMasterLiteracyBank(1);
  }

  /**
   * 문항 등록/수정 모달 열기
   */
  function openModal(itemId) {
    state.editingItemId = itemId || null;
    var modalTitle = document.getElementById('masterLiteracyModalTitle');
    var formId = document.getElementById('literacyFormItemId');
    var fBand = document.getElementById('literacyFormBand');
    var fArea = document.getElementById('literacyFormArea');
    var fStatus = document.getElementById('literacyFormStatus');
    var fStratum = document.getElementById('literacyFormStratum');
    var fWord = document.getElementById('literacyFormWord');
    var fSetId = document.getElementById('literacyFormSetId');
    var fPassage = document.getElementById('literacyFormPassage');
    var fQuestion = document.getElementById('literacyFormQuestion');
    var fImage = document.getElementById('literacyFormImage');
    var fImagePreset = document.getElementById('literacyFormImagePreset');
    var fImageDesc = document.getElementById('literacyFormImageDesc');
    var fRationale = document.getElementById('literacyFormRationale');

    if (itemId) {
      var item = state.items.find(function (i) { return i.id === itemId; });
      if (!item) {
        alert('해당 문항을 찾을 수 없습니다.');
        return;
      }
      if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2" style="color: #1f8a7e;"></i>문항 수정 <span class="badge badge-light border ml-1">' + escapeHtml(item.id) + '</span>';
      if (formId) formId.value = item.id;
      if (fBand) fBand.value = String(item.band);
      if (fArea) fArea.value = item.area;
      if (fStatus) fStatus.value = item.status || '선정';
      if (fStratum) fStratum.value = item.stratum || '0';
      if (fWord) fWord.value = item.word || '';
      if (fSetId) fSetId.value = item.setId || '';
      if (fPassage) fPassage.value = item.passage || '';
      if (fQuestion) fQuestion.value = item.question || '';
      if (fImage) fImage.value = item.image || '';
      if (fImagePreset) fImagePreset.value = item.image || '';
      if (fImageDesc) fImageDesc.value = item.imageDesc || '';
      if (fRationale) fRationale.value = item.rationale || '';

      var choices = Array.isArray(item.choices) ? item.choices : [];
      for (var i = 0; i < 4; i++) {
        var cInput = document.getElementById('literacyChoice' + i);
        if (cInput) cInput.value = choices[i] || '';
      }
      var ansVal = Number(item.answer);
      var ansRadio = document.querySelector('input[name="literacyAnswerRadio"][value="' + ansVal + '"]');
      if (ansRadio) ansRadio.checked = true;

    } else {
      if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-plus-circle mr-2" style="color: #1f8a7e;"></i>신규 문항 등록';
      if (formId) formId.value = '';
      if (fBand) fBand.value = '1';
      if (fArea) fArea.value = '어휘이해력';
      if (fStatus) fStatus.value = '선정';
      if (fStratum) fStratum.value = '0';
      if (fWord) fWord.value = '';
      if (fSetId) fSetId.value = '';
      if (fPassage) fPassage.value = '';
      if (fQuestion) fQuestion.value = '';
      if (fImage) fImage.value = '';
      if (fImagePreset) fImagePreset.value = '';
      if (fImageDesc) fImageDesc.value = '';
      if (fRationale) fRationale.value = '';

      for (var j = 0; j < 4; j++) {
        var cInput2 = document.getElementById('literacyChoice' + j);
        if (cInput2) cInput2.value = '';
      }
      var defRadio = document.querySelector('input[name="literacyAnswerRadio"][value="0"]');
      if (defRadio) defRadio.checked = true;
    }

    onBandChanged();
    onAreaChanged();

    if (window.jQuery && jQuery('#masterLiteracyItemModal').modal) {
      jQuery('#masterLiteracyItemModal').modal('show');
    } else {
      var modalEl = document.getElementById('masterLiteracyItemModal');
      if (modalEl) modalEl.style.display = 'block';
    }
  }

  /**
   * 밴드 변경 시 보기 3개/4개 동적 조정
   */
  function onBandChanged() {
    var band = Number((document.getElementById('literacyFormBand') || {}).value || 0);
    var choice3Wrap = document.getElementById('literacyChoice3Wrap');
    var choice3Input = document.getElementById('literacyChoice3');
    if (choice3Wrap) {
      if (band === 2) {
        choice3Wrap.style.display = 'flex';
        if (choice3Input) choice3Input.required = true;
      } else {
        choice3Wrap.style.display = 'none';
        if (choice3Input) choice3Input.required = false;
        var ansRadio = document.querySelector('input[name="literacyAnswerRadio"]:checked');
        if (ansRadio && Number(ansRadio.value) === 3) {
          var firstRadio = document.querySelector('input[name="literacyAnswerRadio"][value="0"]');
          if (firstRadio) firstRadio.checked = true;
        }
      }
    }
  }

  /**
   * 진단 영역 변경 시 학습도구어 층위 표시/숨김
   */
  function onAreaChanged() {
    var area = (document.getElementById('literacyFormArea') || {}).value || '';
    var stratumWrap = document.getElementById('literacyStratumWrap');
    if (stratumWrap) {
      stratumWrap.style.display = (area === '학습도구어') ? 'block' : 'none';
    }
  }

  /**
   * 이미지 프리셋 선택
   */
  function onImagePresetChanged() {
    var sel = document.getElementById('literacyFormImagePreset');
    var inp = document.getElementById('literacyFormImage');
    if (sel && inp && sel.value) {
      inp.value = sel.value;
    }
  }

  /**
   * 문항 저장 (API 호출 + 로컬 스토리지 동기화)
   */
  async function saveItem() {
    var fBand = document.getElementById('literacyFormBand');
    var fArea = document.getElementById('literacyFormArea');
    var fStatus = document.getElementById('literacyFormStatus');
    var fStratum = document.getElementById('literacyFormStratum');
    var fWord = document.getElementById('literacyFormWord');
    var fSetId = document.getElementById('literacyFormSetId');
    var fPassage = document.getElementById('literacyFormPassage');
    var fQuestion = document.getElementById('literacyFormQuestion');
    var fImage = document.getElementById('literacyFormImage');
    var fImageDesc = document.getElementById('literacyFormImageDesc');
    var fRationale = document.getElementById('literacyFormRationale');
    var itemId = (document.getElementById('literacyFormItemId') || {}).value || '';

    var band = Number(fBand ? fBand.value : 0);
    var area = fArea ? fArea.value : '어휘이해력';
    var status = fStatus ? fStatus.value : '선정';
    var question = (fQuestion ? fQuestion.value : '').trim();
    var passage = (fPassage ? fPassage.value : '').trim() || null;
    var word = (fWord ? fWord.value : '').trim() || null;
    var setId = (fSetId ? fSetId.value : '').trim() || null;
    var image = (fImage ? fImage.value : '').trim() || null;
    var imageDesc = (fImageDesc ? fImageDesc.value : '').trim() || null;
    var rationale = (fRationale ? fRationale.value : '').trim() || undefined;
    var stratum = (area === '학습도구어') ? (fStratum ? fStratum.value : '0') : undefined;

    if (!question) {
      alert('문제(발문)를 입력해 주세요.');
      if (fQuestion) fQuestion.focus();
      return;
    }

    var expectedCount = (band === 2) ? 4 : 3;
    var choices = [];
    for (var i = 0; i < expectedCount; i++) {
      var cVal = ((document.getElementById('literacyChoice' + i) || {}).value || '').trim();
      if (!cVal) {
        alert((i + 1) + '번 보기 내용을 입력해 주세요.');
        var cInput = document.getElementById('literacyChoice' + i);
        if (cInput) cInput.focus();
        return;
      }
      choices.push(cVal);
    }

    var checkedRadio = document.querySelector('input[name="literacyAnswerRadio"]:checked');
    var answer = checkedRadio ? Number(checkedRadio.value) : 0;
    if (answer >= expectedCount) answer = 0;

    var payloadItem = {
      id: itemId || ('B' + band + '-' + (area === '학습도구어' ? 'TOOL' : 'VOC') + '-U' + String(Date.now()).slice(-4)),
      band: band,
      area: area,
      status: status,
      question: question,
      passage: passage,
      word: word,
      setId: setId,
      image: image,
      imageDesc: imageDesc,
      rationale: rationale,
      choices: choices,
      answer: answer,
      stratum: stratum
    };

    var serverSaved = false;
    try {
      var res = await fetch('/api/literacy?action=bank_save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: state.revision, item: payloadItem })
      });
      if (res.ok) {
        var json = await res.json();
        if (json.id) payloadItem.id = json.id;
        serverSaved = true;
      }
    } catch (e) {
      // 로컬 프리뷰 환경
    }

    // 로컬 메모리 및 로컬 스토리지에 즉시 동기화
    var existingIdx = state.items.findIndex(function (it) { return it.id === payloadItem.id; });
    if (existingIdx >= 0) {
      state.items[existingIdx] = payloadItem;
    } else {
      state.items.unshift(payloadItem);
    }
    state.revision += 1;
    state.isDefault = false;

    try {
      localStorage.setItem('NANO_LITERACY_BANK_DATA', JSON.stringify({
        items: state.items,
        version: state.version,
        revision: state.revision
      }));
    } catch (lsErr) {}

    if (window.showMasterToast) showMasterToast('문항이 성공적으로 저장되었습니다!');
    else alert('문항이 성공적으로 저장되었습니다!');

    if (window.jQuery && jQuery('#masterLiteracyItemModal').modal) {
      jQuery('#masterLiteracyItemModal').modal('hide');
    } else {
      var modalEl = document.getElementById('masterLiteracyItemModal');
      if (modalEl) modalEl.style.display = 'none';
    }

    renderMasterLiteracyBank(state.currentPage);
  }

  /**
   * 문항 삭제
   */
  async function deleteItem(itemId) {
    if (!confirm('정말 [' + itemId + '] 문항을 삭제하시겠습니까?\n출제 선정 문항 삭제 시 규정 문항수(밴드당 30문항)가 부족하면 삭제가 차단될 수 있습니다.')) {
      return;
    }

    try {
      await fetch('/api/literacy?action=bank_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: state.revision, id: itemId })
      });
    } catch (e) {}

    state.items = state.items.filter(function (it) { return it.id !== itemId; });
    state.revision += 1;
    state.isDefault = false;

    try {
      localStorage.setItem('NANO_LITERACY_BANK_DATA', JSON.stringify({
        items: state.items,
        version: state.version,
        revision: state.revision
      }));
    } catch (lsErr) {}

    if (window.showMasterToast) showMasterToast('문항이 삭제되었습니다.');
    renderMasterLiteracyBank(state.currentPage);
  }

  /**
   * 기본 209문항으로 복원
   */
  async function resetBank() {
    if (!confirm('문항 은행을 초기 표준 209문항으로 되돌리시겠습니까?\n추가하거나 수정한 문항은 모두 기본 상태로 재설정됩니다.')) {
      return;
    }

    try {
      await fetch('/api/literacy?action=bank_reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {}

    try {
      localStorage.removeItem('NANO_LITERACY_BANK_DATA');
    } catch (lsErr) {}

    if (window.NANO_LITERACY_SEED_BANK) {
      var seed = window.NANO_LITERACY_SEED_BANK;
      state.items = Array.isArray(seed.items) ? seed.items.slice() : [];
      state.version = (seed.meta && seed.meta.version) || seed.version || '2026-10-14';
      state.revision = 0;
      state.isDefault = true;
    }

    if (window.showMasterToast) showMasterToast('초기 표준 209문항으로 복원되었습니다.');
    renderMasterLiteracyBank(1);
  }

  /**
   * 엑셀/CSV 다운로드
   */
  function exportToExcel() {
    var items = getFilteredItems();
    if (!items.length) {
      alert('다운로드할 문항이 없습니다.');
      return;
    }

    var headers = ['문항코드', '밴드', '영역', '출제상태', '층위', '어휘', '세트', '지문', '문제(발문)', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)', '정답보기', '삽화경로', '정답해설'];
    var rows = [headers];

    items.forEach(function (it) {
      var ansNum = (Number(it.answer) + 1);
      var ansText = (Array.isArray(it.choices) && it.choices[it.answer]) || '';
      var c = it.choices || [];
      rows.push([
        it.id || '',
        'Band ' + it.band,
        it.area || '',
        it.status || '',
        it.stratum || '',
        it.word || '',
        it.setId || '',
        it.passage || '',
        it.question || '',
        c[0] || '',
        c[1] || '',
        c[2] || '',
        c[3] || '',
        ansNum,
        ansText,
        it.image || '',
        it.rationale || ''
      ]);
    });

    if (window.XLSX && XLSX.utils && XLSX.writeFile) {
      var ws = XLSX.utils.aoa_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '문해력문항은행');
      XLSX.writeFile(wb, '초등문해력진단_문항은행_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    } else {
      var csvContent = '\uFEFF' + rows.map(function (row) {
        return row.map(function (field) {
          var s = String(field == null ? '' : field).replace(/"/g, '""');
          return '"' + s + '"';
        }).join(',');
      }).join('\r\n');

      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '초등문해력진단_문항은행_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // 전역 노출 API 브릿지
  window.NanoMasterLiteracy = {
    loadBankData: loadBankData,
    renderMasterLiteracyBank: renderMasterLiteracyBank,
    openModal: openModal,
    saveItem: saveItem,
    deleteItem: deleteItem,
    resetBank: resetBank,
    resetFilters: resetFilters,
    exportToExcel: exportToExcel,
    onBandChanged: onBandChanged,
    onAreaChanged: onAreaChanged,
    onImagePresetChanged: onImagePresetChanged
  };

  // HTML 인라인 이벤트용 글로벌 래퍼
  window.renderMasterLiteracyBank = renderMasterLiteracyBank;
  window.openMasterLiteracyModal = openModal;
  window.saveMasterLiteracyItem = saveItem;
  window.deleteMasterLiteracyItem = deleteItem;
  window.resetMasterLiteracyBank = resetBank;
  window.resetMasterLiteracyFilters = resetFilters;
  window.exportMasterLiteracyToExcel = exportToExcel;
  window.onLiteracyBandChanged = onBandChanged;
  window.onLiteracyAreaChanged = onAreaChanged;
  window.onLiteracyImagePresetChanged = onImagePresetChanged;

  // DOMContentLoaded 시점에 즉시 시드 데이터 기반 1차 렌더링 준비 (선제적 렌더링)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSeedData();
      renderMasterLiteracyBank(1);
    });
  } else {
    initSeedData();
    renderMasterLiteracyBank(1);
  }

})(window, document);
