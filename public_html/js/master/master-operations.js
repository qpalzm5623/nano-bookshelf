/**
 * [Nano BookShelf B2B Master] Platform Operations Management Module
 * - Rolling Banner Management & Order Shifting
 * - Curated Book Themes & Automatic Book Mapping
 * - Platform Notices & Inspection Popup Management
 */

// 5. 서비스 운영 관리 모듈 (Operations)
// ==========================================
// ==========================================
// 5. 서비스 운영 관리 모듈 (Operations)
// ==========================================

// --- [5-A] 메인 배너 관리 (Banners) ---
let curBannerBooks = [];
let curBannerUploadedImgData = "";
let curBannerExistingImgUrl = "";

// 배너 연결 도서 ID로 masterBooks 도서 객체 탐색 헬퍼 (타입/포맷 차이 방어)
function findMasterBookByBannerBookId(rawId) {
  if (rawId === null || rawId === undefined || rawId === "") return null;
  if ((!Array.isArray(masterBooks) || masterBooks.length === 0) && typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS) && window.MIGRATED_BOOKS.length > 0) {
    masterBooks = window.MIGRATED_BOOKS;
  }
  const s = String(rawId).trim();
  if (!s) return null;
  let found = masterBooks.find(b =>
    String(b.id || "").trim() === s ||
    String(b.bookNo || "").trim() === s ||
    String(b.serverId || "").trim() === s
  );
  if (found) return found;
  const cleanNum = s.replace(/[^0-9]/g, "");
  if (cleanNum) {
    found = masterBooks.find(b => {
      const bIdNum = String(b.id || "").replace(/[^0-9]/g, "");
      const bNoNum = String(b.bookNo || "").replace(/[^0-9]/g, "");
      return (bIdNum && bIdNum === cleanNum) || (bNoNum && bNoNum === cleanNum);
    });
  }
  return found || null;
}

function renderBannerList() {
  const container = document.getElementById("bannerListContainer");
  if (!container) return;

  const activeCount = bannerList.filter(b => b.active === "Y").length;
  const countEl = document.getElementById("bannerCount");
  if (countEl) countEl.innerText = activeCount;

  container.innerHTML = bannerList.map((b, index) => {
    const effectiveBookIds = getEffectiveBannerBookIds(b);
    b.bookIds = effectiveBookIds;
    const bookCount = effectiveBookIds.length;
    const clicks = typeof b.clicks === "number" ? b.clicks.toLocaleString() : (b.clicks || "0");
    const regDate = b.createdAt || "2026-09-01";
    const displayOrder = (b.order != null && !isNaN(b.order)) ? b.order : (index + 1);

    return `
    <div class="banner-preview-box" style="padding: 18px 22px; gap: 20px; align-items: center; border-radius: 14px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); transition: all 0.2s ease;">
      <div style="font-size: 16px; font-weight: 800; color: #8c827a; min-width: 42px; text-align: center; letter-spacing: -0.5px; background: #f5f2ec; padding: 6px 8px; border-radius: 8px;">
        #${displayOrder}
      </div>
      <div class="banner-img-thumb" onclick="previewBannerImage('${b.imageUrl || ''}', '${b.title}')" title="배너 이미지 크게 보기 (클릭)" style="background: #ece7e1; cursor: pointer; width: 140px; height: 68px; border-radius: 10px; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
        ${b.imageUrl ? `
          <img src="${b.imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="banner-thumb-hover-overlay">
            <i class="fa-solid fa-magnifying-glass-plus text-white" style="font-size: 18px;"></i>
          </div>
          <div class="d-none w-100 h-100 align-items-center justify-content-center text-muted" style="background: #ece7e1;">
            <i class="fa-solid fa-image" style="font-size: 22px; opacity: 0.5;"></i>
          </div>
        ` : `
          <div class="d-flex w-100 h-100 align-items-center justify-content-center text-muted">
            <i class="fa-solid fa-image" style="font-size: 22px; opacity: 0.5;"></i>
          </div>
        `}
      </div>
      <div class="flex-grow-1" style="min-width: 0;">
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span class="badge-soft ${b.active === 'Y' ? 'badge-soft-success' : 'badge-soft-neutral'}" style="font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
            ${b.active === 'Y' ? '노출중' : '숨김'}
          </span>
          <strong style="font-size: 15.5px; font-weight: 700; color: var(--text-main); line-height: 1.4;">${b.title}</strong>
        </div>
        <div class="text-muted text-truncate mb-2" style="font-size: 13px; line-height: 1.4;">${b.sub || '서브 설명 없음'}</div>
        <div class="d-flex align-items-center flex-wrap text-muted" style="font-size: 12.5px; margin-top: 3px;">
          <span style="margin-right: 18px;"><i class="fa-regular fa-calendar-check mr-1 text-primary"></i>등록일: <strong>${regDate}</strong></span>
          <span style="margin-right: 18px;"><i class="fa-solid fa-arrow-pointer mr-1 text-success"></i>클릭수: <strong>${clicks}회</strong></span>
          <span><i class="fa-solid fa-book-bookmark mr-1 text-warning"></i>연결 도서: <strong>${bookCount}권</strong></span>
        </div>
      </div>
      <div class="d-flex align-items-center flex-shrink-0" style="gap: 8px;">
        <!-- 순서 조정 버튼 (위/아래) -->
        <div class="d-flex flex-column" style="gap: 3px;">
          <button class="btn btn-xs btn-outline-secondary" onclick="moveBannerOrder('${b.id}', 'up')" title="위로" style="border-radius: 5px; padding: 3px 8px; font-size: 11px; line-height: 1.2;">▲</button>
          <button class="btn btn-xs btn-outline-secondary" onclick="moveBannerOrder('${b.id}', 'down')" title="아래로" style="border-radius: 5px; padding: 3px 8px; font-size: 11px; line-height: 1.2;">▼</button>
        </div>
        <button class="btn btn-sm btn-outline-primary font-weight-bold" onclick="openBannerModal('${b.id}')" style="border-radius: 8px; padding: 6px 14px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 5px;">
          <i class="fa-solid fa-pen" style="font-size: 11px;"></i>편집
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="toggleBannerActive('${b.id}')" style="border-radius: 8px; padding: 6px 12px; font-size: 12.5px;">
          ${b.active === 'Y' ? '숨김 전환' : '노출 전환'}
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBanner('${b.id}')" style="border-radius: 8px; padding: 6px 12px; font-size: 12.5px;" title="배너 삭제">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
  }).join("");
}

function previewBannerImage(url, title) {
  if (!url) {
    showMasterToast("등록된 배너 이미지가 없습니다.");
    return;
  }
  const imgEl = document.getElementById("bannerViewModalImg");
  const titleEl = document.getElementById("bannerViewModalTitle");
  if (imgEl) imgEl.src = url;
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-image mr-2 text-warning"></i>${title || '배너 이미지 미리보기'}`;
  }
  $('#bannerViewModal').modal('show');
}

function updateBannerModalPreview(val) {
  const box = document.getElementById("bannerModalPreviewBox");
  const img = document.getElementById("bannerModalPreviewImg");
  const notice = document.getElementById("bannerModalEmptyNotice");
  if (!box || !img) return;

  if (val) {
    img.style.display = "block";
    img.src = val;
    if (notice) notice.style.display = "none";
  } else {
    img.style.display = "none";
    img.src = "";
    if (notice) notice.style.display = "flex";
  }
}

function handleBannerFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert("배너 이미지 원본 크기는 최대 10MB를 초과할 수 없습니다.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const rawDataUrl = evt.target.result;
    // 이미지 최적화 (Canvas를 이용해 배너 최적 비율 최대 960px x 320px, JPEG 0.75로 초경량 압축하여 용량 문제 원천 방지)
    const tempImg = new Image();
    tempImg.onload = function() {
      try {
        const maxWidth = 1000;
        const maxHeight = 500;
        let w = tempImg.width;
        let h = tempImg.height;

        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(tempImg, 0, 0, w, h);

        // 75% 품질 JPEG로 압축 (용량 30~50KB 수준으로 초경량화되어 LocalStorage에 영구 안전 보존)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        curBannerUploadedImgData = compressedDataUrl;
        curBannerExistingImgUrl = ""; // 새 파일이 등록되었으므로 기존 이미지 대체
        updateBannerModalPreview(curBannerUploadedImgData);
        showMasterToast("배너 이미지가 최적화되어 등록되었습니다.");
      } catch(err) {
        console.warn("이미지 압축 실패, 원본 사용:", err);
        curBannerUploadedImgData = rawDataUrl;
        curBannerExistingImgUrl = "";
        updateBannerModalPreview(curBannerUploadedImgData);
        showMasterToast("배너 이미지가 등록되었습니다.");
      }
    };
    tempImg.onerror = function() {
      alert("유효한 이미지 파일이 아닙니다.");
      e.target.value = "";
    };
    tempImg.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

function handleBannerImageRemove() {
  curBannerUploadedImgData = "";
  curBannerExistingImgUrl = "";
  const fileInput = document.getElementById("bannerImageFile");
  if (fileInput) fileInput.value = "";
  updateBannerModalPreview("");
  showMasterToast("배너 이미지가 제거되었습니다.");
}

function handleBannerPresetChange(val) {
  // 프리셋 미사용으로 빈 함수 유지
}

function openBannerModal(bannerId) {
  curBannerUploadedImgData = "";
  curBannerExistingImgUrl = "";
  const fileInput = document.getElementById("bannerImageFile");
  if (fileInput) fileInput.value = "";

  const modalHeader = document.getElementById("bannerModalHeaderTitle");
  const editIdInput = document.getElementById("bannerEditId");
  const titleInput = document.getElementById("bannerTitle");
  const subInput = document.getElementById("bannerSub");
  const orderInput = document.getElementById("bannerOrder");
  const activeSelect = document.getElementById("bannerActive");

  if (bannerId) {
    const target = bannerList.find(b => String(b.id) === String(bannerId));
    if (!target) return;

    const linkMeta = parseBannerMetaFromLink(target.linkUrl || target.link || "");
    const effectiveBookIds = getEffectiveBannerBookIds(target);
    target.bookIds = effectiveBookIds;
    if (!target.sub && linkMeta.sub) target.sub = linkMeta.sub;

    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-pen mr-2 text-warning"></i>홈 메인 롤링 배너 편집`;
    if (editIdInput) editIdInput.value = target.id;
    if (titleInput) titleInput.value = target.title;
    if (subInput) subInput.value = target.sub || "";
    if (orderInput) orderInput.value = target.order || 1;
    if (activeSelect) activeSelect.value = target.active || "Y";

    curBannerExistingImgUrl = target.imageUrl || "";
    updateBannerModalPreview(curBannerExistingImgUrl);

    // masterBooks의 정규화된 id로 매칭하여 유지
    curBannerBooks = [];
    effectiveBookIds.forEach(rawId => {
      const matchedBook = findMasterBookByBannerBookId(rawId);
      const canonicalId = matchedBook ? String(matchedBook.id) : String(rawId).trim();
      if (canonicalId && !curBannerBooks.some(id => String(id) === canonicalId)) {
        curBannerBooks.push(canonicalId);
      }
    });
  } else {
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-plus mr-2 text-warning"></i>신규 홈 메인 롤링 배너 등록`;
    if (editIdInput) editIdInput.value = "";
    if (titleInput) titleInput.value = "";
    if (subInput) subInput.value = "";
    if (orderInput) orderInput.value = bannerList.length + 1;
    if (activeSelect) activeSelect.value = "Y";

    curBannerExistingImgUrl = "";
    updateBannerModalPreview("");

    curBannerBooks = [];
  }

  const sInput = document.getElementById("bmSearchInput");
  const cSelect = document.getElementById("bmCategorySelect");
  if (sInput) sInput.value = "";
  if (cSelect) cSelect.value = "";

  populateBmThemeOptions();
  bmAvailableCurrentPage = 1;

  renderBmMappedBooks();
  renderBmAvailableBooks();

  $('#bannerEditModal').modal('show');
}

// 테마관리에서 등록된 태그 목록 동적 바인딩
function populateBmThemeOptions() {
  const select = document.getElementById("bmCategorySelect");
  if (!select) return;

  const tagSet = new Set();
  const sourceThemes = (typeof themeList !== "undefined" && Array.isArray(themeList) && themeList.length > 0)
    ? themeList
    : ((typeof window !== "undefined" && Array.isArray(window.NANO_SERVER_THEMES)) ? window.NANO_SERVER_THEMES : []);

  sourceThemes.forEach(t => {
    // 테마관리에 등록된 대표 태그 추출
    const tTag = String(t.tag || t.title || t.name || '').replace(/^#/, '').trim();
    if (tTag) tagSet.add(tTag);
  });

  const sortedTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
  let html = '<option value="">전체 주제별 태그</option>';
  sortedTags.forEach(tag => {
    html += `<option value="${tag}">#${tag}</option>`;
  });
  select.innerHTML = html;
}

function renderBmMappedBooks() {
  const container = document.getElementById("bmMappedListContainer");
  const countEl = document.getElementById("bmMappedCount");
  const leftCountEl = document.getElementById("bmLeftCount");
  if (!container) return;

  const mapped = curBannerBooks.map(id => findMasterBookByBannerBookId(id)).filter(Boolean);
  if (countEl) countEl.innerText = mapped.length;
  if (leftCountEl) leftCountEl.innerText = mapped.length;

  if (mapped.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fa-solid fa-book-open mb-2" style="font-size: 26px; opacity: 0.35;"></i>
        <div style="font-size: 12.5px; font-weight: 600;">연결된 도서가 없습니다.</div>
        <small style="font-size: 11px;">우측 도서 목록에서 [+ 추가] 버튼을 눌러주세요.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = mapped.map((b, idx) => `
    <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded-lg border shadow-2xs" style="gap: 12px; padding: 10px 12px !important; border-radius: 10px !important;">
      <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
        <span class="badge-soft badge-soft-neutral" style="font-size: 11px; font-weight: 700; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0;">${idx + 1}</span>
        <div style="width: 36px; height: 48px; border-radius: 6px; overflow: hidden; background: #ece7e1; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.06);">
          ${b.cover ? `
            <img src="${b.cover}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="d-none w-100 h-100 align-items-center justify-content-center text-muted" style="background: #ece7e1;">
              <i class="fa-solid fa-book" style="font-size: 14px; opacity: 0.5;"></i>
            </div>
          ` : `
            <i class="fa-solid fa-book text-muted" style="font-size: 14px; opacity: 0.5;"></i>
          `}
        </div>
        <div style="min-width: 0; flex: 1;">
          <div class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${b.title}</div>
          <div class="text-truncate text-muted" style="font-size: 11.5px;">${b.author || '저자 미상'} · ${b.publisher || '출판사 미상'}</div>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeBookFromCurBanner('${b.id}')" style="border-radius: 7px; font-size: 11.5px; padding: 4px 10px; font-weight: 600; white-space: nowrap; flex-shrink: 0;">
        <i class="fa-solid fa-xmark mr-1"></i>제외
      </button>
    </div>
  `).join("");
}

// 배너 도서 목록 30권 단위 페이징 상태
let bmAvailableCurrentPage = 1;
const BM_AVAILABLE_PAGE_SIZE = 30;

function onBmFilterChange() {
  bmAvailableCurrentPage = 1;
  renderBmAvailableBooks();
}

function renderBmAvailableBooks() {
  const container = document.getElementById("bmAvailableListContainer");
  if (!container) return;

  if ((!Array.isArray(masterBooks) || masterBooks.length === 0) && typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS) && window.MIGRATED_BOOKS.length > 0) {
    masterBooks = window.MIGRATED_BOOKS;
  }

  const keyword = (document.getElementById("bmSearchInput") ? document.getElementById("bmSearchInput").value : "").trim().toLowerCase();
  const category = (document.getElementById("bmCategorySelect") ? document.getElementById("bmCategorySelect").value : "").trim();

  let filtered = masterBooks.filter(b => {
    const matchKw = !keyword || (b.title && b.title.toLowerCase().includes(keyword)) || (b.author && b.author.toLowerCase().includes(keyword)) || (b.publisher && b.publisher.toLowerCase().includes(keyword));
    const matchCat = !category || 
      (b.themeTag && String(b.themeTag).includes(category)) || 
      (Array.isArray(b.tags) && b.tags.some(t => {
        const cleanT = String(t || '').replace(/^#/, '').trim();
        return cleanT === category || cleanT.includes(category);
      })) || 
      (b.detailTag && typeof b.detailTag === 'string' && (b.detailTag.includes(category) || b.detailTag.includes('#' + category))) ||
      b.category === category;
    return matchKw && matchCat;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / BM_AVAILABLE_PAGE_SIZE) || 1;
  if (bmAvailableCurrentPage > totalPages) bmAvailableCurrentPage = totalPages;
  if (bmAvailableCurrentPage < 1) bmAvailableCurrentPage = 1;

  if (totalCount === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 24px; opacity: 0.35;"></i>
        <div style="font-size: 12.5px;">일치하는 마스터 도서가 없습니다.</div>
      </div>
    `;
    renderBmAvailablePagination(0, 1, 1);
    return;
  }

  const startIdx = (bmAvailableCurrentPage - 1) * BM_AVAILABLE_PAGE_SIZE;
  const pagedBooks = filtered.slice(startIdx, startIdx + BM_AVAILABLE_PAGE_SIZE);

  container.innerHTML = pagedBooks.map(b => {
    const isAdded = curBannerBooks.some(id => String(id) === String(b.id) || String(id) === String(b.bookNo || ''));
    const cleanTag = (b.themeTag || b.category || '').replace(/^#+/, '');
    const tagDisplay = cleanTag ? `#${cleanTag}` : '';

    return `
      <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded-lg border shadow-2xs" style="gap: 12px; padding: 10px 12px !important; border-radius: 10px !important;">
        <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
          <div style="width: 36px; height: 48px; border-radius: 6px; overflow: hidden; background: #ece7e1; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.06);">
            ${b.cover ? `
              <img src="${b.cover}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="d-none w-100 h-100 align-items-center justify-content-center text-muted" style="background: #ece7e1;">
                <i class="fa-solid fa-book" style="font-size: 14px; opacity: 0.5;"></i>
              </div>
            ` : `
              <i class="fa-solid fa-book text-muted" style="font-size: 14px; opacity: 0.5;"></i>
            `}
          </div>
          <div style="min-width: 0; flex: 1;">
            <div class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${b.title}</div>
            <div class="text-truncate text-muted" style="font-size: 11.5px; display: flex; align-items: center; gap: 4px; flex-wrap: nowrap;">
              <span class="text-truncate">${b.author || '저자 미상'} · ${b.publisher || '출판사'}</span>
              ${tagDisplay ? `<span class="badge-soft badge-soft-neutral flex-shrink-0" style="font-size: 10.5px; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${tagDisplay}</span>` : ''}
            </div>
          </div>
        </div>
        ${isAdded ? `
          <button type="button" class="btn btn-sm btn-secondary font-weight-bold" disabled style="border-radius: 7px; font-size: 11.5px; padding: 5px 12px; opacity: 0.75; white-space: nowrap; flex-shrink: 0;">
            <i class="fa-solid fa-check mr-1"></i>추가됨
          </button>
        ` : `
          <button type="button" class="btn btn-sm btn-outline-primary font-weight-bold" onclick="addBookToCurBanner('${b.id}')" style="border-radius: 7px; font-size: 11.5px; padding: 5px 14px; white-space: nowrap; flex-shrink: 0; transition: all 0.15s ease;">
            <i class="fa-solid fa-plus mr-1"></i>추가
          </button>
        `}
      </div>
    `;
  }).join("");

  renderBmAvailablePagination(totalCount, bmAvailableCurrentPage, totalPages);
}

// 30권 페이징 네비게이션 렌더링
function renderBmAvailablePagination(total, page, totalPages) {
  const container = document.getElementById("bmAvailablePagination");
  if (!container) return;

  if (total === 0 || totalPages <= 1) {
    container.innerHTML = `<span class="text-muted" style="font-size: 11px;">총 <strong>${total}</strong>권</span>`;
    return;
  }

  let html = `
    <span class="text-muted" style="font-size: 11px;">총 <strong>${total}</strong>권 (${page}/${totalPages}p)</span>
    <div class="d-flex align-items-center gap-1">
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goBmAvailablePage(${page - 1})" ${page <= 1 ? 'disabled style="opacity: 0.4;"' : ''} style="border-radius: 4px; padding: 2px 6px;">
        <i class="fa-solid fa-chevron-left" style="font-size: 10px;"></i>
      </button>
  `;

  let startP = Math.max(1, page - 2);
  let endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) startP = Math.max(1, endP - 4);

  for (let p = startP; p <= endP; p++) {
    const isActive = p === page;
    html += `
      <button type="button" class="btn btn-xs ${isActive ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" onclick="goBmAvailablePage(${p})" style="border-radius: 4px; min-width: 22px; padding: 2px 5px; font-size: 11px;">
        ${p}
      </button>
    `;
  }

  html += `
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goBmAvailablePage(${page + 1})" ${page >= totalPages ? 'disabled style="opacity: 0.4;"' : ''} style="border-radius: 4px; padding: 2px 6px;">
        <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i>
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function goBmAvailablePage(page) {
  bmAvailableCurrentPage = page;
  renderBmAvailableBooks();
  const c = document.getElementById("bmAvailableListContainer");
  if (c) c.scrollTop = 0;
}

function addBookToCurBanner(bookId) {
  const sId = String(bookId).trim();
  if (!sId) return;
  if (!curBannerBooks.some(id => String(id) === sId)) {
    curBannerBooks.push(sId);
    renderBmMappedBooks();
    renderBmAvailableBooks();
  }
}

function removeBookFromCurBanner(bookId) {
  const sId = String(bookId).trim();
  curBannerBooks = curBannerBooks.filter(id => {
    if (String(id) === sId) return false;
    const matched = findMasterBookByBannerBookId(id);
    if (matched && String(matched.id) === sId) return false;
    return true;
  });
  renderBmMappedBooks();
  renderBmAvailableBooks();
}

function clearCurBannerBooks() {
  if (confirm("현재 배너에 선택된 모든 도서를 비우시겠습니까?")) {
    curBannerBooks = [];
    renderBmMappedBooks();
    renderBmAvailableBooks();
  }
}

async function handleSaveBanner(e) {
  e.preventDefault();
  const editId = document.getElementById("bannerEditId").value;
  const title = document.getElementById("bannerTitle").value.trim();
  const sub = document.getElementById("bannerSub").value.trim();
  const imageUrl = curBannerUploadedImgData || curBannerExistingImgUrl || "";
  const order = parseInt(document.getElementById("bannerOrder").value, 10) || 1;
  const active = document.getElementById("bannerActive").value;

  const normalizedBookIds = curBannerBooks.map(id => String(id).trim()).filter(Boolean);
  const encodedLinkUrl = "#books=" + encodeURIComponent(normalizedBookIds.join(",")) + (sub ? "&sub=" + encodeURIComponent(sub) : "");

  const nowTime = Date.now();
  let savedBanner = null;
  let bannerMessage = '';
  if (editId) {
    const target = bannerList.find(b => String(b.id) === String(editId));
    if (target) {
      target.title = title;
      target.sub = sub;
      target.imageUrl = imageUrl;
      target.order = order;
      target.active = active;
      target.bookIds = [...normalizedBookIds];
      target.linkUrl = encodedLinkUrl;
      target.link = encodedLinkUrl;
      target.updatedAt = nowTime;
      savedBanner = target;
      bannerMessage = `'${title}' 배너 정보가 수정되었습니다.`;
    }
  } else {
    const todayStr = new Date().toISOString().split("T")[0];
    const newBanner = {
      id: nowTime,
      title: title,
      sub: sub,
      imageUrl: imageUrl,
      order: order,
      active: active,
      clicks: 0,
      createdAt: todayStr,
      updatedAt: nowTime,
      bookIds: [...normalizedBookIds],
      linkUrl: encodedLinkUrl,
      link: encodedLinkUrl
    };
    bannerList.push(newBanner);
    savedBanner = newBanner;
    bannerMessage = `'${title}' 신규 메인 배너가 등록되었습니다.`;
  }

  if (window.NanoPortal && NanoPortal.remote && savedBanner) {
    try {
      // 서버 URL 검증기 호환을 위해 상대경로 imageUrl에 './' 접두어 안전 보정 후 전송
      const origImg = savedBanner.imageUrl || "";
      if (origImg && !/^(https?:\/\/|\/|\.\/|data:image\/|#)/i.test(origImg)) {
        savedBanner.imageUrl = "./" + origImg.replace(/^\/+/, "");
      }
      await NanoPortal.saveBanner(savedBanner);
      savedBanner.imageUrl = origImg;
      savedBanner.bookIds = [...normalizedBookIds];
      savedBanner.linkUrl = encodedLinkUrl;
      savedBanner.link = encodedLinkUrl;
    } catch (error) {
      console.warn("[배너 서버 저장 경고] 로컬 스토리지에 배너 도서 구성을 유지합니다:", error);
    }
  }

  saveOperationsToStorage();
  $('#bannerEditModal').modal('hide');
  renderBannerList();
  showMasterToast(bannerMessage);
}

async function toggleBannerActive(id) {
  const b = bannerList.find(item => String(item.id) === String(id));
  if (!b) return;
  b.active = b.active === "Y" ? "N" : "Y";
  b.updatedAt = Date.now();
  b.bookIds = getEffectiveBannerBookIds(b);
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      const origImg = b.imageUrl || "";
      if (origImg && !/^(https?:\/\/|\/|\.\/|data:image\/|#)/i.test(origImg)) {
        b.imageUrl = "./" + origImg.replace(/^\/+/, "");
      }
      await NanoPortal.saveBanner(b);
      b.imageUrl = origImg;
    } catch (error) {
      console.warn("[배너 상태 변경 경고]:", error);
    }
  }
  saveOperationsToStorage();
  renderBannerList();
  showMasterToast(`배너 노출 상태가 [${b.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

async function deleteBanner(id) {
  const b = bannerList.find(item => String(item.id) === String(id));
  const name = b ? b.title : "선택 배너";
  if (confirm(`'${name}' 배너를 정말 삭제하시겠습니까?`)) {
    if (window.NanoPortal && NanoPortal.remote) {
      try { await NanoPortal.deleteBanner(b); }
      catch (error) { showMasterToast('배너를 삭제하지 못했습니다: ' + error.message); return; }
    }
    bannerList = bannerList.filter(item => String(item.id) !== String(id));
    saveOperationsToStorage();
    renderBannerList();
    showMasterToast("배너가 삭제되었습니다.");
  }
}

// --- [5-B] 테마 관리 (도서 큐레이션 테마 및 태그 관리) ---
let curThemeUploadedImgData = "";

// 테마별 자동 매핑 도서 계산 헬퍼 함수
function getThemeAutoMappedBooks(theme) {
  if (!theme) return [];
  const targetTag = (theme.tag || '').trim();
  const cleanTarget = targetTag.replace(/^#/, '');

  return masterBooks.filter(b => {
    // 1. 도서 tags 배열에 일치하는 태그가 있는지 확인
    if (b.tags && Array.isArray(b.tags)) {
      const hasTag = b.tags.some(t => {
        const cleanT = (t || '').trim().replace(/^#/, '');
        return cleanT === cleanTarget || (t || '').trim() === targetTag;
      });
      if (hasTag) return true;
    }
    // 2. detailTag에 태그가 포함되어 있는지 확인
    if (b.detailTag && typeof b.detailTag === 'string') {
      if (b.detailTag.includes(cleanTarget) || b.detailTag.includes(targetTag)) return true;
    }
    // 3. 기존 수동 bookIds가 등록되어 있는 경우 하위 호환
    if (theme.bookIds && Array.isArray(theme.bookIds) && theme.bookIds.includes(b.id)) {
      return true;
    }
    return false;
  });
}

function renderThemeTable() {
  const tbody = document.getElementById("themeTableBody");
  if (!tbody) return;

  const countEl = document.getElementById("themeCount");
  if (countEl) countEl.innerText = themeList.length;

  if (themeList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">등록된 테마(태그)가 없습니다.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = themeList.map((t, idx) => {
    const autoMappedBooks = getThemeAutoMappedBooks(t);
    const bookCount = autoMappedBooks.length;
    const imgUrl = t.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-soft); text-align: center;">${idx + 1}</td>
        <td style="text-align: center;">
          <div style="width: 60px; height: 42px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-medium); cursor: pointer; margin: 0 auto; background: #f0ece5;" onclick="previewThemeImage('${t.id}')" title="이미지 크게 보기 (클릭)">
            <img src="${imgUrl}" alt="${t.tag}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='upload/banner/banner_reading_king.jpg'">
          </div>
        </td>
        <td style="text-align: left;">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge-soft badge-soft-warning font-weight-bold" style="font-size: 12.5px;">${t.tag}</span>
            <strong style="font-size: 14px; color: var(--text-main);">${t.title}</strong>
          </div>
          ${t.subTag ? `<div class="text-muted" style="font-size: 12px;"><i class="fa-solid fa-hashtag mr-1 text-secondary"></i>${t.subTag}</div>` : ''}
          <div class="text-secondary text-truncate" style="font-size: 11.5px; max-width: 360px; line-height: 1.4; margin-top: 2px;">
            ${t.desc || '테마 설명이 없습니다.'}
          </div>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="goToMasterBooksWithThemeTag('${(t.tag || t.title || '').replace(/'/g, "\\'")}')" style="border-radius: 12px; font-size: 12px; padding: 4px 10px; cursor: pointer; transition: all 0.2s;" title="마스터 콘텐츠 관리에서 해당 도서 목록 보기 (클릭)">
            <i class="fa-solid fa-bolt mr-1"></i>${bookCount}권
          </button>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-xs ${t.active === 'Y' ? 'btn-success' : 'btn-secondary'}" onclick="toggleThemeActive('${t.id}')" style="border-radius: 14px; font-size: 11.5px; padding: 3px 10px;">
            ${t.active === 'Y' ? '노출 (Y)' : '숨김 (N)'}
          </button>
        </td>
        <td style="text-align: center;">
          <div class="d-flex align-items-center justify-content-center gap-1">
            <button class="btn btn-xs btn-outline-secondary" onclick="openThemeModal('${t.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;" title="태그 정보 수정">
              <i class="fa-solid fa-pen mr-1"></i>편집
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="deleteTheme('${t.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 7px;" title="태그 삭제">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  populateMasterContentCategoryOptions();
  populateBmThemeOptions();
}

// 테마 관리에서 특정 테마 태그 클릭 시 마스터 콘텐츠 관리 탭으로 이동 및 해당 태그로 필터링
function goToMasterBooksWithThemeTag(themeTag) {
  if (!themeTag) return;
  const tagWithHash = '#' + String(themeTag).replace(/^#/, '').trim();

  // 1. 마스터 콘텐츠 관리 탭으로 이동
  switchMasterTab('contents');

  // 2. 검색 드롭다운 옵션 동기화
  populateMasterContentCategoryOptions();

  // 3. 주제/태그 셀렉트박스에서 해당 태그 선택
  const catSelect = document.getElementById("contentCategoryFilter");
  if (catSelect) {
    let found = false;
    for (let i = 0; i < catSelect.options.length; i++) {
      if (catSelect.options[i].value === tagWithHash || catSelect.options[i].value === tagWithHash.replace(/^#/, '')) {
        catSelect.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const newOpt = new Option(tagWithHash, tagWithHash, true, true);
      catSelect.add(newOpt);
    }
  }

  // 4. 기타 검색창 및 학년/등록처 필터 초기화
  const searchInput = document.getElementById("contentSearchInput");
  if (searchInput) searchInput.value = "";
  const gradeSelect = document.getElementById("contentGradeFilter");
  if (gradeSelect) gradeSelect.value = "ALL";
  const academySelect = document.getElementById("contentAcademyFilter");
  if (academySelect) academySelect.value = "ALL";

  // 5. 1페이지로 리셋 후 도서 목록 렌더링
  contentCurrentPage = 1;
  renderMasterContents();

  // 6. 도서 목록 영역으로 스크롤 이동
  setTimeout(() => {
    const tableEl = document.getElementById("tab-master-contents");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 80);
}

function handleThemeFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert("이미지 크기는 최대 10MB를 초과할 수 없습니다.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const rawDataUrl = evt.target.result;
    const tempImg = new Image();
    tempImg.onload = function() {
      try {
        const maxWidth = 800;
        const maxHeight = 450;
        let w = tempImg.width;
        let h = tempImg.height;

        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(tempImg, 0, 0, w, h);

        // 80% 품질 JPEG로 압축 (용량 30~50KB 수준으로 최적화하여 서버 및 로컬에 안전 저장)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        curThemeUploadedImgData = compressedDataUrl;
        updateThemeModalPreview();
        showMasterToast("태그 대표 이미지가 최적화되어 등록되었습니다.");
      } catch(err) {
        console.warn("이미지 최적화 실패, 원본 사용:", err);
        curThemeUploadedImgData = rawDataUrl;
        updateThemeModalPreview();
        showMasterToast("태그 대표 이미지가 업로드되었습니다.");
      }
    };
    tempImg.onerror = function() {
      alert("유효한 이미지 파일이 아닙니다.");
      e.target.value = "";
    };
    tempImg.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

function handleThemeImageRemove() {
  curThemeUploadedImgData = "";
  const fileInput = document.getElementById("themeImageFile");
  if (fileInput) fileInput.value = "";
  const imgSelect = document.getElementById("themeImageUrl");
  if (imgSelect) imgSelect.value = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  updateThemeModalPreview();
  showMasterToast("대표 이미지가 기본 이미지로 초기화되었습니다.");
}

function previewThemeImage(themeId) {
  const t = themeList.find(item => String(item.id) === String(themeId));
  if (!t) return;
  const imgUrl = t.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  previewBannerImage(imgUrl, `${t.tag} 대표 이미지`);
}

function handleThemePresetChange(val) {
  curThemeUploadedImgData = "";
  const fileInput = document.getElementById("themeImageFile");
  if (fileInput) fileInput.value = "";
  updateThemeModalPreview();
}

function updateThemeModalPreview() {
  const box = document.getElementById("themeModalPreviewBox");
  if (!box) return;

  const tagVal = (document.getElementById("themeTagTitle") ? document.getElementById("themeTagTitle").value.trim() : "") || "#주제태그";
  const subTagVal = (document.getElementById("themeSubTag") ? document.getElementById("themeSubTag").value.trim() : "") || "#보조태그";
  const descVal = (document.getElementById("themeDesc") ? document.getElementById("themeDesc").value.trim() : "") || "태그에 대한 설명이 여기에 표시됩니다.";
  const presetImg = document.getElementById("themeImageUrl") ? document.getElementById("themeImageUrl").value : "";
  const finalImg = curThemeUploadedImgData || presetImg || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  const activeVal = document.getElementById("themeActive") ? document.getElementById("themeActive").value : "Y";

  box.innerHTML = `
    <div style="position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #e5e0d8;">
      <img src="${finalImg}" alt="${tagVal}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
      <span class="badge" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #fff; font-size: 10.5px; border-radius: 4px; padding: 2px 6px;">
        ${activeVal === 'Y' ? '노출' : '숨김'}
      </span>
    </div>
    <div style="padding: 10px;">
      <div class="badge-soft badge-soft-warning font-weight-bold mb-1" style="font-size: 12.5px; display: inline-block;">${tagVal}</div>
      <div class="text-muted text-truncate mb-1" style="font-size: 10.5px; font-weight: 600;">${subTagVal}</div>
      <div class="pt-2 border-top d-flex justify-content-between align-items-center">
        <span style="font-size: 11px; color: var(--text-soft);"><i class="fa-solid fa-book-open mr-1"></i>추천 도서 <strong>6</strong>권</span>
        <span class="badge-soft badge-soft-success" style="font-size: 10.5px;">주제별 도서</span>
      </div>
    </div>
  `;
}

function openThemeModal(themeId) {
  curThemeUploadedImgData = "";
  const fileInput = document.getElementById("themeImageFile");
  if (fileInput) fileInput.value = "";

  const modalHeader = document.getElementById("themeModalHeaderTitle");
  const editIdInput = document.getElementById("themeEditId");
  const tagTitleInput = document.getElementById("themeTagTitle");
  const subTagInput = document.getElementById("themeSubTag");
  const descInput = document.getElementById("themeDesc");
  const imgSelect = document.getElementById("themeImageUrl");
  const activeSelect = document.getElementById("themeActive");

  if (themeId) {
    const target = themeList.find(item => String(item.id) === String(themeId));
    if (!target) return;
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-pen mr-2 text-warning"></i>테마(태그) 정보 수정`;
    if (editIdInput) editIdInput.value = target.id;
    if (tagTitleInput) tagTitleInput.value = target.tag || target.title;
    if (subTagInput) subTagInput.value = target.subTag || "";
    if (descInput) descInput.value = target.desc || "";
    if (imgSelect) imgSelect.value = target.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
    if (activeSelect) activeSelect.value = target.active || "Y";
  } else {
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-tags mr-2 text-warning"></i>신규 테마(태그) 등록`;
    if (editIdInput) editIdInput.value = "";
    if (tagTitleInput) tagTitleInput.value = "";
    if (subTagInput) subTagInput.value = "";
    if (descInput) descInput.value = "";
    if (imgSelect) imgSelect.value = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
    if (activeSelect) activeSelect.value = "Y";
  }

  updateThemeModalPreview();
  $('#themeEditModal').modal('show');
}

async function handleSaveTheme(e) {
  e.preventDefault();
  const editId = document.getElementById("themeEditId").value;
  const tagTitle = document.getElementById("themeTagTitle").value.trim();
  const subTag = document.getElementById("themeSubTag").value.trim();
  const desc = document.getElementById("themeDesc").value.trim();
  const presetImg = document.getElementById("themeImageUrl") ? document.getElementById("themeImageUrl").value : "";
  const finalImage = curThemeUploadedImgData || presetImg || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  const active = document.getElementById("themeActive").value;

  // 태그 포맷팅 (# 붙이기)
  let formattedTag = tagTitle;
  if (!formattedTag.startsWith("#")) {
    formattedTag = "#" + formattedTag;
  }

  let savedTheme = null;
  let previousTheme = null;
  let themeMessage = '';
  if (editId) {
    const target = themeList.find(item => String(item.id) === String(editId));
    if (target) {
      previousTheme = { ...target };
      target.title = formattedTag.replace("#", "");
      target.tag = formattedTag;
      target.subTag = subTag;
      target.desc = desc;
      target.image = finalImage;
      target.active = active;
      savedTheme = target;
      themeMessage = `'${formattedTag}' 태그 정보가 수정되었습니다.`;
    }
  } else {
    const todayStr = new Date().toISOString().split("T")[0];
    const newTheme = {
      id: Date.now(),
      title: formattedTag.replace("#", ""),
      tag: formattedTag,
      subTag: subTag,
      desc: desc,
      image: finalImage,
      bookIds: [],
      active: active,
      createdAt: todayStr
    };
    themeList.push(newTheme);
    savedTheme = newTheme;
    themeMessage = `'${formattedTag}' 신규 태그가 등록되었습니다.`;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      const serverResult = await NanoPortal.saveTheme(savedTheme);
      if (serverResult && serverResult.image) {
        savedTheme.image = serverResult.image;
      }
    } catch (error) {
      if (previousTheme) Object.assign(savedTheme, previousTheme);
      else themeList = themeList.filter(item => item !== savedTheme);
      showMasterToast('테마를 저장하지 못했습니다: ' + error.message, 'danger');
      return;
    }
  }

  saveOperationsToStorage();
  $('#themeEditModal').modal('hide');
  curThemeUploadedImgData = "";
  renderThemeTable();
  showMasterToast(themeMessage);
}

async function toggleThemeActive(id) {
  const t = themeList.find(item => String(item.id) === String(id));
  if (!t) return;
  const prevActive = t.active;
  t.active = t.active === "Y" ? "N" : "Y";
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveTheme(t); }
    catch (error) { t.active = prevActive; showMasterToast('테마 노출 상태를 변경하지 못했습니다: ' + error.message); return; }
  }
  saveOperationsToStorage();
  renderThemeTable();
  showMasterToast(`[${t.tag}] 노출 상태가 [${t.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

async function deleteTheme(themeId) {
  const target = themeList.find(item => String(item.id) === String(themeId));
  if (!target) return;

  if (confirm(`'${target.tag}' 태그를 정말 삭제하시겠습니까?\n매핑된 도서 연결 정보도 함께 해제됩니다.`)) {
    if (window.NanoPortal && NanoPortal.remote) {
      try { await NanoPortal.deleteTheme(target); }
      catch (error) { showMasterToast('테마를 삭제하지 못했습니다: ' + error.message); return; }
    }
    themeList = themeList.filter(item => item.id !== themeId);
    saveOperationsToStorage();
    renderThemeTable();
    showMasterToast("태그가 삭제되었습니다.");
  }
}

// 4. 테마별 자동 매핑 도서 목록 모달 열기 (수동 매핑 불필요, 자동 매핑 리스트 뷰)
function openThemeBooksModal(themeId) {
  const theme = themeList.find(t => t.id === themeId);
  if (!theme) return;
  curThemeBooksThemeId = themeId;

  const headerTitle = document.getElementById("tbmHeaderTitle");
  if (headerTitle) {
    headerTitle.innerHTML = `<i class="fa-solid fa-tags mr-2 text-warning"></i>${theme.tag} 자동 매핑 도서 목록`;
  }
  const headerSub = document.getElementById("tbmHeaderSub");
  if (headerSub) {
    headerSub.innerText = `도서 등록 시 지정된 주제 태그(${theme.tag})로 자동 연동된 도서 목록입니다. (별도 수동 매핑 불필요)`;
  }
  const infoTitle = document.getElementById("tbmInfoTitle");
  if (infoTitle) infoTitle.innerText = theme.title;
  const infoTag = document.getElementById("tbmInfoTag");
  if (infoTag) infoTag.innerText = theme.tag;
  const infoDesc = document.getElementById("tbmInfoDesc");
  if (infoDesc) infoDesc.innerText = theme.desc || "테마 안내글";

  const searchInp = document.getElementById("tbmAutoSearchInput");
  if (searchInp) searchInp.value = "";

  renderTbmAutoMappedBooks();
  $('#themeBooksModal').modal('show');
}

// 5. 테마 자동 매핑 도서 리스트 렌더링 (단일 테이블 형태)
function renderTbmAutoMappedBooks() {
  const tbody = document.getElementById("tbmAutoTableBody");
  const theme = themeList.find(t => t.id === curThemeBooksThemeId);
  if (!tbody || !theme) return;

  const allAutoMapped = getThemeAutoMappedBooks(theme);
  const searchInput = document.getElementById("tbmAutoSearchInput");
  const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();

  const countEl = document.getElementById("tbmMappingCount");
  if (countEl) countEl.innerText = allAutoMapped.length;

  // 검색어 필터링 (도서명, 저자, 출판사, 분야)
  let filtered = allAutoMapped;
  if (keyword) {
    filtered = allAutoMapped.filter(b => 
      (b.title && b.title.toLowerCase().includes(keyword)) ||
      (b.author && b.author.toLowerCase().includes(keyword)) ||
      (b.publisher && b.publisher.toLowerCase().includes(keyword)) ||
      (b.category && b.category.toLowerCase().includes(keyword))
    );
  }

  const leftCountEl = document.getElementById("tbmLeftCount");
  if (leftCountEl) leftCountEl.innerText = filtered.length;

  if (filtered.length === 0) {
    if (allAutoMapped.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted" style="background: #faf9f6;">
            <i class="fa-solid fa-book-open mb-2" style="font-size: 36px; opacity: 0.35;"></i>
            <p class="mb-1 font-weight-bold" style="font-size: 14.5px; color: var(--text-main);">현재 이 테마에 자동 매핑된 도서가 없습니다.</p>
            <small style="font-size: 12px; color: var(--text-muted);">
              [마스터 도서 등록/수정]에서 주제 분류 태그를 <strong>${theme.tag}</strong>(으)로 선택하시면 이곳에 자동으로 실시간 연동됩니다.
            </small>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 24px; opacity: 0.4;"></i>
            <p class="mb-0" style="font-size: 13px;">'${keyword}' 검색어와 일치하는 도서가 없습니다.</p>
          </td>
        </tr>
      `;
    }
    return;
  }

  tbody.innerHTML = filtered.map((b, idx) => {
    const coverUrl = b.cover || "resources/images/book_default.svg";
    const seriesText = b.series && b.series !== "단권" ? `<span class="badge-soft badge-soft-warning ml-1" style="font-size: 10px;">${b.series}</span>` : "";
    const acadName = b.academy || "본사 (공용)";
    const isPublic = b.isPublic !== "N";

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-soft); font-size: 12px;">${idx + 1}</td>
        <td>
          <div style="width: 42px; height: 56px; border-radius: 4px; overflow: hidden; background: #ece7e1; margin: 0 auto; box-shadow: 0 2px 6px rgba(0,0,0,0.08); border: 1px solid var(--border-medium);">
            <img src="${coverUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
          </div>
        </td>
        <td style="text-align: left;">
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main); margin-bottom: 2px;">
            ${b.title} ${seriesText}
          </div>
          <div class="text-muted" style="font-size: 11.5px;">
            <i class="fa-solid fa-barcode mr-1 opacity-50"></i>${b.id}
            ${b.tags && b.tags.length > 0 ? `<span class="text-secondary ml-1">· ${b.tags.join(" ")}</span>` : ""}
          </div>
        </td>
        <td style="text-align: left;">
          <div class="font-weight-bold" style="font-size: 12.5px; color: #475569;">${b.author || '-'}</div>
          <div class="text-muted" style="font-size: 11.5px;">${b.publisher || '-'}</div>
        </td>
        <td>
          <span class="badge-soft badge-soft-neutral" style="font-size: 11px;">${b.category || '기타'}</span>
        </td>
        <td>
          <span class="badge-soft badge-soft-warning font-weight-bold" style="font-size: 11px;">${b.grade || '전체'}</span>
        </td>
        <td>
          <span class="badge badge-light border text-muted" style="font-size: 11px;">${acadName}</span>
        </td>
        <td>
          <span class="badge ${isPublic ? 'badge-success' : 'badge-secondary'}" style="font-size: 11px; padding: 4px 8px; border-radius: 10px;">
            ${isPublic ? '노출' : '숨김'}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

// ==========================================
// 5-2. 플랫폼 전체 공지사항 및 점검 팝업 관리 모듈 (Notice Management)
// ==========================================
const STORAGE_KEY_SYSTEM_NOTICES = "NANO_MASTER_SYSTEM_NOTICES";

const defaultSystemNotices = [
  {
    id: "NOT-1004",
    title: "[안내] 2026 가을맞이 신규 필독서 120종 업데이트 및 북퀴즈 출제 완료",
    target: "전체",
    category: "신규 도서 입고",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-28",
    content: "안녕하세요. 나노의 책장 본사 운영팀입니다.\n\n2026년도 2학기를 맞아 초등 및 중등 대상 교과 연계 필독도서 120종이 신규 등록되었으며, 각 도서별 문해력 5문항 북퀴즈 및 어휘 풀이가 완비되었습니다.\n\n각 가맹 학원에서는 [도서 배정] 메뉴에서 신규 도서를 확인하시고 원생들에게 추천 도서로 배정해 주시기 바랍니다.\n감사합니다.",
    link: ""
  },
  {
    id: "NOT-1003",
    title: "[긴급] 정기 시스템 서버 안정화 및 인프라 점검 안내 (10/05 02:00~06:00)",
    target: "가맹 학원",
    category: "시스템 점검",
    isPopup: true,
    popupStartDate: "2026-10-01",
    popupEndDate: "2026-10-05",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-25",
    content: "안정적인 북퀴즈 응시 및 대용량 독서 리포트 데이터 처리를 위한 클라우드 인프라 확장 점검이 진행될 예정입니다.\n\n■ 점검 일시: 2026년 10월 5일(월) 새벽 02:00 ~ 06:00 (약 4시간)\n■ 영향 범위: 점검 시간 동안 전체 플랫폼 접속 및 북퀴즈 응시 일시 중단\n\n원활한 서비스 제공을 위해 새벽 시간대에 진행되오니 원장님 및 지도교사 분들의 너른 양해 부탁드립니다.",
    link: ""
  },
  {
    id: "NOT-1002",
    title: "[공지] 제3회 전국 나노 독서왕 퀴즈 챌린지 랭킹 대회 개최 요강",
    target: "학생",
    category: "이벤트/대회",
    isPopup: true,
    popupStartDate: "2026-09-20",
    popupEndDate: "2026-10-20",
    isPinned: false,
    status: "게시중",
    createdAt: "2026-09-18",
    content: "전국 모든 가맹 학원의 원생들이 참여하는 [제3회 전국 나노 독서왕 퀴즈 챌린지]가 시작됩니다!\n\n■ 참여 대상: 나노의 책장 재원 원생 누구나\n■ 챌린지 기간: 2026년 9월 20일 ~ 10월 20일 (1개월간)\n■ 시상: 전국 개인 랭킹 1~10위 장학 상품권 및 메달 수여, 최우수 학원 현판 제공\n\n매일 책을 읽고 북퀴즈에 도전하여 전국 랭킹에 이름을 올려보세요!",
    link: ""
  },
  {
    id: "NOT-1001",
    title: "[안내] 가맹 학원 관리자 대시보드 리포트 발송 편의 기능 개선 배포",
    target: "가맹 학원",
    category: "서비스 업데이트",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: false,
    status: "게시중",
    createdAt: "2026-09-10",
    content: "학원 관리자 페이지에서 학부모 알림톡 리포트 발송 시, 학급별 일괄 전송 및 개별 발송 미리보기 기능이 한층 업그레이드되었습니다.\n\n또한 원생 삭제 시 실수 방지를 위한 2단계 원장님 비밀번호 인증 및 7일 임시 보존 기능이 적용되었습니다.",
    link: ""
  }
];

function loadNoticesFromStorage() {
  var localCached = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SYSTEM_NOTICES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach(n => {
          if (n.target === '학부모') n.target = '전체';
        });
        localCached = parsed;
      }
    }
  } catch (e) {
    console.warn("시스템 공지 로컬 캐시 로드 실패:", e);
  }

  if (window.NANO_SERVER_DATA) {
    var serverNotices = window.NANO_SERVER_NOTICES || [];
    // 서버 공지에 팝업 시작/종료일 등 메타데이터가 비어있는 경우 로컬 스토리지 캐시와 병합하여 유실 방지
    return serverNotices.map(function(sn) {
      var matchedLocal = localCached.find(function(ln) {
        return (ln.id && ln.id === sn.id) || (ln.title && ln.title === sn.title);
      });
      if (!matchedLocal) return sn;
      return Object.assign({}, sn, {
        popupStartDate: sn.popupStartDate || matchedLocal.popupStartDate || "",
        popupEndDate: sn.popupEndDate || matchedLocal.popupEndDate || "",
        isPopup: typeof sn.isPopup === "boolean" ? sn.isPopup : !!matchedLocal.isPopup,
        isPinned: typeof sn.isPinned === "boolean" ? sn.isPinned : !!matchedLocal.isPinned,
        category: sn.category || matchedLocal.category || "일반 공지",
        status: sn.status || matchedLocal.status || "게시중",
        target: (sn.target && sn.target !== '원장' && sn.target !== '선생님') ? sn.target : (matchedLocal.target || "가맹 학원"),
        link: sn.link || matchedLocal.link || ""
      });
    });
  }
  if (localCached.length > 0) return localCached;
  return JSON.parse(JSON.stringify(defaultSystemNotices));
}

function saveNoticesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM_NOTICES, JSON.stringify(systemNoticeList));
    // 타 탭(학원 관리자, 학생 프리뷰) 실시간 동기화 지원
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY_SYSTEM_NOTICES,
      newValue: JSON.stringify(systemNoticeList)
    }));
  } catch (e) {
    console.error("시스템 공지 저장 실패:", e);
  }
}

let systemNoticeList = loadNoticesFromStorage();

function renderNoticeTable() {
  const tbody = document.getElementById("noticeTableBody");
  if (!tbody) return;

  if (systemNoticeList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="fa-solid fa-bullhorn fa-2x mb-2" style="color: #cbd5e1;"></i><br>
          <strong style="font-size: 14px; color: var(--text-main);">등록된 시스템 공지사항이 없습니다.</strong><br>
          <span style="font-size: 12.5px;">우측 상단의 <strong>[+ 신규 공지 작성]</strong> 버튼을 눌러 첫 공지를 등록해보세요.</span>
        </td>
      </tr>
    `;
    return;
  }

  // 상단 고정(isPinned) 우선 정렬 후 최신순
  const sortedList = [...systemNoticeList].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.id || "").localeCompare(a.id || "");
  });

  tbody.innerHTML = sortedList.map((not, idx) => {
    // 대상 뱃지 (전체 / 가맹 학원 / 학생)
    let targetBadge = '<span class="badge badge-secondary" style="font-size: 11px;">전체</span>';
    if (not.target === '가맹 학원' || not.target === '원장' || not.target === '선생님') {
      targetBadge = '<span class="badge badge-primary" style="font-size: 11px; background: #3b82f6;">가맹 학원</span>';
    } else if (not.target === '학생') {
      targetBadge = '<span class="badge badge-success" style="font-size: 11px; background: #10b981;">학생</span>';
    }

    // 팝업기간 표시 (공지 제목과 대상 사이 컬럼)
    let popupPeriodHtml = '<span class="text-muted" style="font-size: 12px;">-</span>';
    if (not.isPopup) {
      if (not.popupStartDate || not.popupEndDate) {
        popupPeriodHtml = `<span class="text-dark font-weight-bold" style="font-size: 12px;"><i class="fa-regular fa-calendar-check text-primary mr-1"></i>${not.popupStartDate || '상시'} ~ ${not.popupEndDate || '상시'}</span>`;
      } else {
        popupPeriodHtml = `<span class="text-muted" style="font-size: 12px;">상시 노출</span>`;
      }
    }

    // 팝업 여부 뱃지
    const popupBadge = not.isPopup
      ? `<span class="badge-soft badge-soft-warn font-weight-bold" style="font-size: 11px;"><i class="fa-solid fa-window-restore mr-1"></i>팝업 ON</span>`
      : `<span class="text-muted" style="font-size: 11.5px;">일반 공지</span>`;

    // 분류 뱃지
    const categoryBadge = `<span class="badge badge-light border text-muted mr-1" style="font-size: 11px;">${not.category || '일반'}</span>`;

    // 상단 고정 뱃지
    const pinnedBadge = not.isPinned
      ? `<span class="badge badge-warning text-dark ml-1 font-weight-bold" style="font-size: 10px; padding: 2px 5px;"><i class="fa-solid fa-thumbtack mr-1"></i>고정</span>`
      : '';

    // 상태 뱃지
    const isPub = not.status === '게시중';
    const statusBadge = `
      <span class="badge ${isPub ? 'badge-success' : 'badge-secondary'}" onclick="toggleNoticeStatus('${not.id}')" style="cursor: pointer; font-size: 11px; padding: 4px 8px; border-radius: 10px;" title="클릭 시 상태 전환">
        ${isPub ? '게시중' : '비공개'}
      </span>
    `;

    // 등록일자 깔끔한 YYYY-MM-DD 포맷팅 (ISO 타임스탬프 줄바꿈 방지)
    const displayDate = (not.createdAt ? String(not.createdAt).slice(0, 10) : (not.date || "-")).slice(0, 10);

    return `
      <tr>
        <td class="text-center font-weight-bold text-muted" style="font-size: 12.5px; white-space: nowrap; width: 70px;">
          <span>${idx + 1}</span>${not.isPinned ? ' <i class="fa-solid fa-thumbtack text-danger ml-1" style="font-size: 11px;" title="상단 고정"></i>' : ''}
        </td>
        <td style="text-align: left;">
          <div class="d-flex align-items-center flex-wrap">
            ${categoryBadge}
            <span class="font-weight-bold text-dark notice-item-title" onclick="viewNoticeDetail('${not.id}')" style="cursor: pointer; font-size: 13.5px; transition: color 0.15s;" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color=''">
              ${not.title}
            </span>
            ${pinnedBadge}
          </div>
        </td>
        <td class="text-center" style="white-space: nowrap;">${popupPeriodHtml}</td>
        <td class="text-center" style="white-space: nowrap;">${targetBadge}</td>
        <td class="text-center" style="white-space: nowrap;">${popupBadge}</td>
        <td class="text-center text-muted" style="font-size: 12px; white-space: nowrap;">${displayDate}</td>
        <td class="text-center" style="white-space: nowrap;">${statusBadge}</td>
        <td class="text-center" style="white-space: nowrap; width: 140px;">
          <div class="d-flex justify-content-center align-items-center" style="gap: 6px; flex-wrap: nowrap;">
            <button class="btn btn-xs btn-outline-secondary" onclick="openNoticeModal('${not.id}')" title="수정" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px; white-space: nowrap; display: inline-flex; align-items: center;">
              <i class="fa-solid fa-pen mr-1"></i>수정
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="deleteNotice('${not.id}')" title="삭제" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px; white-space: nowrap; display: inline-flex; align-items: center;">
              <i class="fa-solid fa-trash-can mr-1"></i>삭제
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openNoticeModal(noticeId) {
  const modalTitleEl = document.getElementById("noticeModalTitle");
  const editIdEl = document.getElementById("noticeEditId");
  const titleEl = document.getElementById("noticeTitle");
  const targetEl = document.getElementById("noticeTarget");
  const catEl = document.getElementById("noticeCategory");
  const statusEl = document.getElementById("noticeStatus");
  const isPinnedEl = document.getElementById("noticeIsPinned");
  const isPopupEl = document.getElementById("noticeIsPopup");
  const popStartEl = document.getElementById("noticePopupStartDate");
  const popEndEl = document.getElementById("noticePopupEndDate");
  const contentEl = document.getElementById("noticeContent");
  const linkEl = document.getElementById("noticeLink");

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (noticeId) {
    const not = systemNoticeList.find(n => n.id === noticeId);
    if (!not) return;
    if (modalTitleEl) modalTitleEl.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>시스템 공지사항 수정';
    if (editIdEl) editIdEl.value = not.id;
    if (titleEl) titleEl.value = not.title || "";
    const normTarget = (not.target === '원장' || not.target === '선생님') ? '가맹 학원' : (not.target || "전체");
    if (targetEl) targetEl.value = normTarget;
    if (catEl) catEl.value = not.category || "일반 공지";
    if (statusEl) statusEl.value = not.status || "게시중";
    if (isPinnedEl) isPinnedEl.checked = !!not.isPinned;
    if (isPopupEl) isPopupEl.checked = !!not.isPopup;
    const defaultStart = (not.createdAt || not.date || todayStr).slice(0, 10);
    if (popStartEl) popStartEl.value = not.popupStartDate || (not.isPopup ? defaultStart : todayStr);
    if (popEndEl) popEndEl.value = not.popupEndDate || (not.isPopup ? nextWeek : nextWeek);
    if (contentEl) contentEl.value = not.content || "";
    if (linkEl) linkEl.value = not.link || "";
  } else {
    if (modalTitleEl) modalTitleEl.innerHTML = '<i class="fa-solid fa-bullhorn mr-2 text-warning"></i>신규 시스템 공지 등록';
    if (editIdEl) editIdEl.value = "";
    if (titleEl) titleEl.value = "";
    if (targetEl) targetEl.value = "전체";
    if (catEl) catEl.value = "일반 공지";
    if (statusEl) statusEl.value = "게시중";
    if (isPinnedEl) isPinnedEl.checked = false;
    if (isPopupEl) isPopupEl.checked = false;

    if (popStartEl) popStartEl.value = todayStr;
    if (popEndEl) popEndEl.value = nextWeek;
    if (contentEl) contentEl.value = "";
    if (linkEl) linkEl.value = "";
  }

  toggleNoticePopupDateSection();

  if (window.jQuery && typeof $('#noticeModal').modal === 'function') {
    $('#noticeModal').modal('show');
  }
}

function toggleNoticePopupDateSection() {
  const isPopup = document.getElementById("noticeIsPopup")?.checked;
  const section = document.getElementById("noticePopupDateSection");
  if (section) {
    section.style.display = isPopup ? "flex" : "none";
  }
}

async function saveNotice(event) {
  if (event) event.preventDefault();

  const editId = document.getElementById("noticeEditId")?.value.trim();
  const title = document.getElementById("noticeTitle")?.value.trim();
  const target = document.getElementById("noticeTarget")?.value || "전체";
  const category = document.getElementById("noticeCategory")?.value || "일반 공지";
  const status = document.getElementById("noticeStatus")?.value || "게시중";
  const isPinned = !!document.getElementById("noticeIsPinned")?.checked;
  const isPopup = !!document.getElementById("noticeIsPopup")?.checked;
  const popupStartDate = document.getElementById("noticePopupStartDate")?.value || "";
  const popupEndDate = document.getElementById("noticePopupEndDate")?.value || "";
  const content = document.getElementById("noticeContent")?.value.trim();
  const link = document.getElementById("noticeLink")?.value.trim() || "";

  if (!title) {
    alert("공지 제목을 입력해주세요.");
    document.getElementById("noticeTitle")?.focus();
    return;
  }
  if (!content) {
    alert("공지 본문 내용을 입력해주세요.");
    document.getElementById("noticeContent")?.focus();
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  if (editId) {
    const idx = systemNoticeList.findIndex(n => n.id === editId);
    if (idx !== -1) {
      const previousNotice = { ...systemNoticeList[idx] };
      systemNoticeList[idx] = {
        ...systemNoticeList[idx],
        title,
        target,
        category,
        status,
        isPinned,
        isPopup,
        popupStartDate: isPopup ? popupStartDate : "",
        popupEndDate: isPopup ? popupEndDate : "",
        content,
        link
      };
      if (window.NanoPortal && NanoPortal.remote) {
        try { await NanoPortal.saveNotice(systemNoticeList[idx]); }
        catch (error) { systemNoticeList[idx] = previousNotice; showMasterToast('공지사항을 저장하지 못했습니다: ' + error.message); return; }
      }
      saveNoticesToStorage();
      renderNoticeTable();
      if (window.jQuery && typeof $('#noticeModal').modal === 'function') {
        $('#noticeModal').modal('hide');
      }
      showMasterToast(`[${title}] 공지사항이 성공적으로 수정되었습니다.`);
    }
  } else {
    // 신규 생성
    let maxNum = 1004;
    systemNoticeList.forEach(n => {
      if (n.id && n.id.startsWith("NOT-")) {
        const num = parseInt(n.id.replace("NOT-", ""), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const newId = "NOT-" + (maxNum + 1);

    const newNotice = {
      id: newId,
      title,
      target,
      category,
      status,
      isPinned,
      isPopup,
      popupStartDate: isPopup ? popupStartDate : "",
      popupEndDate: isPopup ? popupEndDate : "",
      createdAt: todayStr,
      content,
      link
    };

    systemNoticeList.unshift(newNotice);
    if (window.NanoPortal && NanoPortal.remote) {
      try { await NanoPortal.saveNotice(newNotice); }
      catch (error) { systemNoticeList = systemNoticeList.filter(notice => notice !== newNotice); showMasterToast('공지사항을 등록하지 못했습니다: ' + error.message); return; }
    }
    saveNoticesToStorage();
    renderNoticeTable();
    if (window.jQuery && typeof $('#noticeModal').modal === 'function') {
      $('#noticeModal').modal('hide');
    }
    showMasterToast(`[${title}] 신규 공지사항이 성공적으로 등록되었습니다.`);
  }
}

async function deleteNotice(noticeId) {
  const not = systemNoticeList.find(n => n.id === noticeId);
  if (!not) return;

  if (!confirm(`[${not.title}]\n\n이 공지사항을 삭제하시겠습니까?`)) return;

  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.deleteNotice(not); }
    catch (error) { showMasterToast('공지사항을 삭제하지 못했습니다: ' + error.message); return; }
  }

  systemNoticeList = systemNoticeList.filter(n => n.id !== noticeId);
  saveNoticesToStorage();
  renderNoticeTable();
  showMasterToast(`[${not.title}] 공지사항이 삭제되었습니다.`);
}

async function toggleNoticeStatus(noticeId) {
  const not = systemNoticeList.find(n => n.id === noticeId);
  if (!not) return;

  const prevStatus = not.status;
  not.status = (not.status === "게시중") ? "비공개" : "게시중";
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveNotice(not); }
    catch (error) { not.status = prevStatus; showMasterToast('공지 상태를 변경하지 못했습니다: ' + error.message); return; }
  }
  saveNoticesToStorage();
  renderNoticeTable();
  showMasterToast(`[${not.title}] 공지 상태가 '${not.status}'(으)로 변경되었습니다.`);
}

function viewNoticeDetail(noticeId) {
  const not = systemNoticeList.find(n => n.id === noticeId);
  if (!not) return;

  const catEl = document.getElementById("viewNoticeCategory");
  const targetEl = document.getElementById("viewNoticeTarget");
  const pinnedEl = document.getElementById("viewNoticePinnedBadge");
  const popupEl = document.getElementById("viewNoticePopupBadge");
  const titleEl = document.getElementById("viewNoticeTitle");
  const dateEl = document.getElementById("viewNoticeDate");
  const contentEl = document.getElementById("viewNoticeContent");
  const linkSection = document.getElementById("viewNoticeLinkSection");
  const linkEl = document.getElementById("viewNoticeLink");

  if (catEl) catEl.innerText = not.category || "일반 공지";
  if (targetEl) targetEl.innerText = "대상: " + (not.target || "전체");
  if (pinnedEl) {
    if (not.isPinned) pinnedEl.classList.remove("d-none");
    else pinnedEl.classList.add("d-none");
  }
  if (popupEl) {
    if (not.isPopup) popupEl.classList.remove("d-none");
    else popupEl.classList.add("d-none");
  }
  if (titleEl) titleEl.innerText = not.title;
  if (dateEl) dateEl.innerText = not.createdAt;
  if (contentEl) contentEl.innerText = not.content || "(내용 없음)";

  if (linkSection && linkEl) {
    if (not.link) {
      linkSection.classList.remove("d-none");
      linkEl.href = not.link;
      linkEl.innerText = not.link;
    } else {
      linkSection.classList.add("d-none");
    }
  }

  if (window.jQuery && typeof $('#noticeDetailModal').modal === 'function') {
    $('#noticeDetailModal').modal('show');
  }
}

// ==========================================


// --- [Banner Order Reordering] ---

// [18] 배너 순서 조정 (리스트에서 위/아래 버튼)
// -----------------------------------------------------------
async function moveBannerOrder(id, direction) {
  const idx = bannerList.findIndex(b => String(b.id) === String(id));
  if (idx === -1) return;
  const beforeOrder = bannerList.map(b => ({ id: b.id, order: b.order }));

  if (direction === "up" && idx > 0) {
    // 순서 교환
    const temp = bannerList[idx].order;
    bannerList[idx].order = bannerList[idx - 1].order;
    bannerList[idx - 1].order = temp;
    const tempBanner = bannerList[idx];
    bannerList[idx] = bannerList[idx - 1];
    bannerList[idx - 1] = tempBanner;
  } else if (direction === "down" && idx < bannerList.length - 1) {
    const temp = bannerList[idx].order;
    bannerList[idx].order = bannerList[idx + 1].order;
    bannerList[idx + 1].order = temp;
    const tempBanner = bannerList[idx];
    bannerList[idx] = bannerList[idx + 1];
    bannerList[idx + 1] = tempBanner;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await Promise.all(bannerList.map(b => NanoPortal.saveBanner(b)));
    } catch (error) {
      beforeOrder.forEach(previous => { const banner = bannerList.find(b => b.id === previous.id); if (banner) banner.order = previous.order; });
      bannerList.sort((a, b) => (a.order || 0) - (b.order || 0));
      showMasterToast('배너 순서를 저장하지 못했습니다: ' + error.message);
      renderBannerList();
      return;
    }
  }
  saveOperationsToStorage();
  renderBannerList();
}

// -----------------------------------------------------------