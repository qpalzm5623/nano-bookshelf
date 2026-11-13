
// 권장도서 목록 및 마스터 도서에서 '주제 분류 태그 선택'에 지정된 테마(#이야기, #인간 등) 추출
function getBookThemeTagDisplay(b) {
  if (!b) return '-';

  // 1) b 자체에 themeTag가 있는 경우
  if (b.themeTag && typeof b.themeTag === 'string' && b.themeTag.trim()) {
    const clean = b.themeTag.trim();
    return clean.startsWith('#') ? clean : '#' + clean;
  }

  // 2) b.tag 또는 b.themeName이 있는 경우
  if (b.themeName && typeof b.themeName === 'string' && b.themeName.trim()) {
    const clean = b.themeName.trim();
    return clean.startsWith('#') ? clean : '#' + clean;
  }
  if (b.tag && typeof b.tag === 'string' && b.tag.trim() && !b.tag.startsWith('권장')) {
    const clean = b.tag.trim();
    return clean.startsWith('#') ? clean : '#' + clean;
  }

  // 3) masterBooks 또는 window.MIGRATED_BOOKS에서 원본 도서 조회
  const allMaster = (typeof masterBooks !== 'undefined' && Array.isArray(masterBooks) && masterBooks.length > 0)
    ? masterBooks
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  if (allMaster.length > 0) {
    const matched = allMaster.find(mb => {
      if (b.bookId && (String(mb.id) === String(b.bookId) || String(mb.bookNo) === String(b.bookId))) return true;
      if (b.id && (String(mb.id) === String(b.id) || String(mb.bookNo) === String(b.id))) return true;
      if (b.title && mb.title && mb.title.trim() === b.title.trim()) return true;
      return false;
    });

    if (matched) {
      if (matched.themeTag && typeof matched.themeTag === 'string' && matched.themeTag.trim()) {
        const clean = matched.themeTag.trim();
        return clean.startsWith('#') ? clean : '#' + clean;
      }
      if (matched.themeName && typeof matched.themeName === 'string' && matched.themeName.trim()) {
        const clean = matched.themeName.trim();
        return clean.startsWith('#') ? clean : '#' + clean;
      }
      if (matched.tag && typeof matched.tag === 'string' && matched.tag.trim() && !matched.tag.startsWith('권장')) {
        const clean = matched.tag.trim();
        return clean.startsWith('#') ? clean : '#' + clean;
      }
      if (matched.subject && typeof matched.subject === 'string' && matched.subject.trim()) {
        const clean = matched.subject.trim();
        return clean.startsWith('#') ? clean : '#' + clean;
      }
      if (Array.isArray(matched.tags) && matched.tags.length > 0) {
        const hashTag = matched.tags.find(t => typeof t === 'string' && t.startsWith('#'));
        if (hashTag) return hashTag.trim();
      }
    }
  }

  // 4) b.subject 확인
  if (b.subject && typeof b.subject === 'string' && b.subject.trim()) {
    const clean = b.subject.trim();
    return clean.startsWith('#') ? clean : '#' + clean;
  }

  // 5) b.tags 배열 내 해시태그 확인
  if (Array.isArray(b.tags) && b.tags.length > 0) {
    const hashTag = b.tags.find(t => typeof t === 'string' && t.startsWith('#'));
    if (hashTag) return hashTag.trim();
  }

  // 6) b.detailTag 내 해시태그 파싱
  if (b.detailTag && typeof b.detailTag === 'string') {
    const match = b.detailTag.match(/#[^s,#]+/);
    if (match) return match[0];
  }

  // 7) themeList와 자동 매핑 여부 확인
  if (typeof themeList !== 'undefined' && Array.isArray(themeList) && themeList.length > 0) {
    for (const t of themeList) {
      if (t.bookIds && Array.isArray(t.bookIds)) {
        if (t.bookIds.includes(b.bookId) || t.bookIds.includes(b.id)) {
          return t.tag || ('#' + t.title);
        }
      }
    }
  }

  return '-';
}

/**
 * [Nano BookShelf B2B Master] Franchise Management Module
 * - Franchise Academy List Table Rendering & Pagination
 * - Academy Registration & Detail Modal
 * - Academy Deletion (7-day Temporary Safe Retention & Restoration)
 * - Recommended Books Management
 * - Franchise List Excel(CSV) Export
 */

// 2-4. 학년별 권장도서 관리 모듈 (Recommended Books)
// ==========================================
function getRecommendedBooks() {
  if (window.NANO_SERVER_DATA) return (window.MIGRATED_BOOKS || []).filter(function(b) { return b.isRecommended; }).map(function(b) { return Object.assign({}, b, {bookId:b.id}); });
  try {
    const stored = localStorage.getItem("NANO_RECOMMENDED_BOOKS");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(e);
  }
  // 기본 샘플 데이터 초기화
  const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0) ? masterBooks : (typeof mockBooks !== 'undefined' ? mockBooks : []);
  const initial = [];
  const grades = ["초등 1학년", "초등 2학년", "초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년", "중학교"];
  allMasterBooks.slice(0, 14).forEach((b, idx) => {
    const g = grades[idx % grades.length];
    initial.push({
      id: 'REC-' + (idx + 1),
      bookId: b.id,
      title: b.title,
      author: b.author || b.publisher || '작자 미상',
      publisher: b.publisher || '출판사',
      category: b.category || '문학',
      cover: b.cover || b.image || '',
      grade: g,
      createdAt: '2026-09-' + String(10 + (idx % 8)).padStart(2, '0')
    });
  });
  localStorage.setItem("NANO_RECOMMENDED_BOOKS", JSON.stringify(initial));
  return initial;
}

function saveRecommendedBooks(list) {
  try {
    localStorage.setItem("NANO_RECOMMENDED_BOOKS", JSON.stringify(list));
  } catch(e) {
    console.error(e);
  }
}

let selectedRecGrade = "ALL";
let recommendedCurrentPage = 1;
const RECOMMENDED_PAGE_SIZE = 20;

// 학년 탭 선택 시 필터링 및 1페이지 리셋
function selectRecGrade(grade) {
  selectedRecGrade = grade;
  recommendedCurrentPage = 1;
  const btns = document.querySelectorAll(".rec-grade-btn");
  btns.forEach(b => {
    if (b.getAttribute("data-grade") === grade) {
      b.className = "btn font-weight-bold rec-grade-btn active";
      b.style.background = "#7d5a2b";
      b.style.color = "#fff";
      b.style.border = "none";
    } else {
      b.className = "btn font-weight-bold rec-grade-btn";
      b.style.background = "#fff";
      b.style.color = "#5a4b3d";
      b.style.border = "1.5px solid #d4c4b0";
    }
  });
  renderRecommendedBooksTable();
}

function formatShortRecGrade(raw) {
  const norm = normalizeRecGradeCode(raw);
  if (norm === "유치부" || norm === "미취학") return "유치부";
  if (norm === "초등 1학년") return "초1";
  if (norm === "초등 2학년") return "초2";
  if (norm === "초등 3학년") return "초3";
  if (norm === "초등 4학년") return "초4";
  if (norm === "초등 5학년") return "초5";
  if (norm === "초등 6학년") return "초6";
  if (norm === "중등 1학년" || norm === "중학교") return "중등1";
  if (norm === "중등 2학년") return "중등2";
  if (norm === "중등 3학년") return "중등3";
  return norm || "전체";
}

function renderRecommendedBooksTable() {
  const tbody = document.getElementById("recommendedBooksTableBody");
  const countSpan = document.getElementById("recBookCount");
  if (!tbody) return;

  const allList = getRecommendedBooks();
  
  const filtered = (selectedRecGrade === "ALL")
    ? allList
    : allList.filter(b => {
        const normBookGrade = normalizeRecGradeCode(b.grade || "");
        const normSelectedGrade = normalizeRecGradeCode(selectedRecGrade);
        if (normSelectedGrade === "중등 1학년" && normBookGrade === "중학교") {
          return true;
        }
        return normBookGrade === normSelectedGrade || b.grade === selectedRecGrade;
      });

  if (countSpan) {
    countSpan.textContent = allList.length;
  }

  const paginationContainer = document.getElementById("recommendedPagination");

  if (filtered.length === 0) {
    const gradeName = selectedRecGrade === "ALL" ? "" : `[${selectedRecGrade}] `;
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="fa-solid fa-book-open mb-2" style="font-size: 28px; opacity: 0.5;"></i>
          <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">${gradeName}등록된 추천 도서가 없습니다.</div>
          <small class="text-muted">우측 상단의 <strong>[+ 추천도서 추가]</strong> 버튼을 눌러 이 학년의 추천도서를 등록해보세요.</small>
        </td>
      </tr>
    `;
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  // 20권 단위 페이징 슬라이싱
  const totalPages = Math.ceil(filtered.length / RECOMMENDED_PAGE_SIZE) || 1;
  if (recommendedCurrentPage > totalPages) recommendedCurrentPage = totalPages;
  if (recommendedCurrentPage < 1) recommendedCurrentPage = 1;

  const startIdx = (recommendedCurrentPage - 1) * RECOMMENDED_PAGE_SIZE;
  const pagedList = filtered.slice(startIdx, startIdx + RECOMMENDED_PAGE_SIZE);

  tbody.innerHTML = pagedList.map((b, index) => {
    const coverHtml = `<img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 44px; height: 58px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">`;
    // 순번 내림차순 표시 (가장 상단이 전체 필터 건수부터 1까지 내려가도록 계산)
    const num = filtered.length - (startIdx + index);
    const displayGrade = b.grade ? formatShortRecGrade(b.grade) : "전체";

    let dateStr = "-";
    if (b.createdAt) {
      const rawDate = String(b.createdAt);
      if (rawDate.includes("T")) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
          const y = kst.getUTCFullYear();
          const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
          const day = String(kst.getUTCDate()).padStart(2, "0");
          dateStr = `${y}-${m}-${day}`;
        } else {
          dateStr = rawDate.split("T")[0];
        }
      } else {
        dateStr = rawDate.split(" ")[0] || rawDate;
      }
    }

    return `
      <tr>
        <td class="text-center font-weight-bold text-muted">${num}</td>
        <td class="text-center">${coverHtml}</td>
        <td class="text-left font-weight-bold" style="color: var(--text-main); font-size: 13.5px; padding-left: 20px;">
          ${b.title}
        </td>
        <td class="text-center text-muted" style="font-size: 12.5px;">
          ${b.author || '-'} / ${b.publisher || '-'}
        </td>
        <td class="text-center">
          <span class="badge-soft badge-soft-master font-weight-bold" style="font-size: 11.5px; padding: 4px 8px;">
            ${displayGrade}
          </span>
        </td>
        <td class="text-center">
          ${(() => {
            const themeTag = getBookThemeTagDisplay(b);
            if (themeTag && themeTag !== '-') {
              return `<span class="badge-soft badge-soft-warning font-weight-bold" style="font-size: 11.5px; padding: 4px 8px; border-radius: 6px;"><i class="fa-solid fa-tag mr-1" style="font-size: 10px;"></i>${themeTag}</span>`;
            }
            return `<span class="text-muted" style="font-size: 11.5px;">-</span>`;
          })()}
        </td>
        <td class="text-center text-muted" style="font-size: 12px; white-space: nowrap;">${dateStr}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" style="font-size: 11.5px; padding: 3px 8px;" onclick="deleteRecommendedBook('${b.id}')">
            <i class="fa-solid fa-trash mr-1"></i>해제
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderRecommendedPagination(totalPages, recommendedCurrentPage);
}

// 20권 단위 권장도서 페이지네이션 UI 렌더링
function renderRecommendedPagination(totalPages, curPage) {
  const container = document.getElementById("recommendedPagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  // 이전 페이지 버튼
  const isFirst = curPage === 1;
  html += `
    <button class="btn btn-sm" onclick="goToRecommendedPage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // 페이지 번호 (최대 7개 노출)
  let startP = Math.max(1, curPage - 3);
  let endP = Math.min(totalPages, startP + 6);
  if (endP - startP < 6) {
    startP = Math.max(1, endP - 6);
  }

  if (startP > 1) {
    html += `<button class="btn btn-sm" onclick="goToRecommendedPage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button class="btn btn-sm" onclick="goToRecommendedPage(${p})" style="${isActive ? 'background: #7d5a2b; color: #fff; font-weight: 700; border: 1px solid #7d5a2b;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 12px; padding: 4px 10px; border-radius: 6px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
    html += `<button class="btn btn-sm" onclick="goToRecommendedPage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">${totalPages}</button>`;
  }

  // 다음 페이지 버튼
  const isLast = curPage === totalPages;
  html += `
    <button class="btn btn-sm" onclick="goToRecommendedPage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// 특정 페이지로 이동
function goToRecommendedPage(page) {
  recommendedCurrentPage = page;
  renderRecommendedBooksTable();
  const tableEl = document.getElementById("recommendedBooksTableBody");
  if (tableEl) {
    tableEl.closest('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 권장도서 추가 모달 페이징 및 필터 상태
let recModalCurrentPage = 1;
const REC_MODAL_PAGE_SIZE = 30;
let recModalSearchDebounceTimer = null;

// 권장도서 추가 모달 열기 (선택된 학년 고정 + 도서 리스트 초기화)
function openAddRecommendedBookModal() {
  // 메인 화면에서 선택된 학년(selectedRecGrade) 반영 (전체 선택 상태이면 '초등 1학년' 기본값)
  const targetGrade = (selectedRecGrade && selectedRecGrade !== "ALL") ? selectedRecGrade : "초등 1학년";

  const hiddenGradeInput = document.getElementById("modalRecGrade");
  if (hiddenGradeInput) hiddenGradeInput.value = targetGrade;

  const badgeEl = document.getElementById("modalRecTargetGradeBadge");
  if (badgeEl) {
    badgeEl.innerText = targetGrade;
  }

  // 모달 내 도서 권장학년 셀렉트는 기본 'ALL'(전체 권장학년)으로 설정하여 도서 탐색 편의 제공
  const bookGradeSelect = document.getElementById("modalRecBookGradeGradeFilter") || document.getElementById("modalRecBookGradeFilter");
  if (bookGradeSelect) bookGradeSelect.value = "ALL";

  const searchInput = document.getElementById("modalRecBookSearch");
  if (searchInput) searchInput.value = "";

  recModalCurrentPage = 1;
  filterRecModalBooks(true);

  if (window.jQuery && typeof $('#recommendedBookModal').modal === 'function') {
    $('#recommendedBookModal').modal('show');
  }
}

// 탭 전환 호환성 유지용 (구버전 호환)
function switchRecModalTab(tab) {
  // 직접 등록 탭이 제거되었으므로 항상 라이브러리 모드로 동작
  filterRecModalBooks();
}

// 모달 검색 입력 디바운스 (타이핑 렉 방지)
function handleRecModalSearchInput() {
  clearTimeout(recModalSearchDebounceTimer);
  recModalSearchDebounceTimer = setTimeout(() => {
    recModalCurrentPage = 1;
    filterRecModalBooks();
  }, 250);
}

// 모달 필터 변경 (권장학년 드롭박스 변경 또는 엔터/검색버튼 클릭)
function handleRecModalFilterChange() {
  recModalCurrentPage = 1;
  filterRecModalBooks(true);
}

// 모달 내 도서 검색 및 30권씩 페이징 렌더링
function filterRecModalBooks(resetPage = false) {
  if (resetPage) recModalCurrentPage = 1;

  const container = document.getElementById("modalRecBookCandidateList");
  const countSpan = document.getElementById("modalRecBookCandidateCount");
  const pageSummary = document.getElementById("modalRecPaginationSummary");
  const paginationContainer = document.getElementById("modalRecPaginationContainer");
  const searchInput = document.getElementById("modalRecBookSearch");
  const query = (searchInput ? searchInput.value.trim().toLowerCase() : "");

  const bookGradeFilter = document.getElementById("modalRecBookGradeFilter")?.value || "ALL";
  const targetGrade = document.getElementById("modalRecGrade")?.value || "초등 1학년";

  const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0)
    ? masterBooks
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : (typeof mockBooks !== 'undefined' ? mockBooks : []));

  const recList = getRecommendedBooks();

  // 필터링: 도서 권장학년 + 도서명/저자/출판사 검색
  const candidates = allMasterBooks.filter(b => {
    // 1. 도서 권장학년 필터
    if (bookGradeFilter !== "ALL") {
      const normBookGrade = typeof normalizeBookGrade === 'function' ? normalizeBookGrade(b.grade) : normalizeRecGradeCode(b.grade);
      const normFilterGrade = typeof normalizeBookGrade === 'function' ? normalizeBookGrade(bookGradeFilter) : normalizeRecGradeCode(bookGradeFilter);
      if (normBookGrade !== normFilterGrade) return false;
    }

    // 2. 검색어 필터
    if (!query) return true;
    return (b.title && b.title.toLowerCase().includes(query)) ||
           (b.author && b.author.toLowerCase().includes(query)) ||
           (b.publisher && b.publisher.toLowerCase().includes(query));
  });

  const totalCount = candidates.length;
  if (countSpan) countSpan.textContent = totalCount.toLocaleString();

  if (totalCount === 0) {
    if (container) {
      container.innerHTML = `<div class="p-4 text-center text-muted" style="font-size: 13px;">
        <i class="fa-solid fa-book-open mb-2" style="font-size: 26px; opacity: 0.4;"></i>
        <div>일치하는 도서가 없습니다.</div>
      </div>`;
    }
    if (pageSummary) pageSummary.innerText = "0 / 0 페이지";
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  // 30권씩 페이징 계산
  const totalPages = Math.ceil(totalCount / REC_MODAL_PAGE_SIZE) || 1;
  if (recModalCurrentPage > totalPages) recModalCurrentPage = totalPages;
  if (recModalCurrentPage < 1) recModalCurrentPage = 1;

  if (pageSummary) pageSummary.innerText = `${recModalCurrentPage} / ${totalPages} 페이지`;

  const startIdx = (recModalCurrentPage - 1) * REC_MODAL_PAGE_SIZE;
  const pagedList = candidates.slice(startIdx, startIdx + REC_MODAL_PAGE_SIZE);

  if (container) {
    container.innerHTML = pagedList.map(b => {
      // 현재 지정 대상 학년에 이미 등록되어 있는지 체크
      const isAlreadyRec = recList.some(r =>
        (String(r.bookId) === String(b.id) || String(r.id) === String(b.id) || r.title === b.title) &&
        normalizeRecGradeCode(r.grade) === normalizeRecGradeCode(targetGrade)
      );

      const coverSrc = b.cover || b.image || '';
      const coverHtml = coverSrc
        ? `<img src="${coverSrc}" style="width: 42px; height: 56px; object-fit: cover; border-radius: 4px; border: 1px solid #e2dad0;" onerror="this.onerror=null; this.src='resources/images/book_default.svg';" class="mr-2 flex-shrink-0">`
        : `<div style="width: 42px; height: 56px; background: #ece7e1; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #8c7355;" class="mr-2 flex-shrink-0">도서</div>`;

      const bookGradeDisplay = b.grade ? formatShortRecGrade(b.grade) : '전체';
      const themeTag = typeof getBookThemeTagDisplay === 'function' ? getBookThemeTagDisplay(b) : '';

      return `
        <div class="d-flex align-items-center justify-content-between p-2 border-bottom" style="gap: 10px; transition: background 0.15s ease;">
          <div class="d-flex align-items-center" style="min-width: 0; flex: 1;">
            ${coverHtml}
            <div style="min-width: 0;">
              <div class="d-flex align-items-center gap-1 flex-wrap mb-1">
                <span class="badge-soft badge-soft-master" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;">${bookGradeDisplay}</span>
                ${themeTag && themeTag !== '-' ? `<span class="badge-soft badge-soft-warning font-weight-bold" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;">${themeTag}</span>` : ''}
                <strong class="text-truncate font-weight-bold" style="font-size: 13.5px; color: var(--text-main);" title="${b.title}">${b.title}</strong>
              </div>
              <div class="text-muted text-truncate" style="font-size: 12px;">${b.author || '-'} · ${b.publisher || '-'}</div>
            </div>
          </div>
          <div class="flex-shrink-0">
            ${isAlreadyRec
              ? `<button class="btn btn-sm btn-secondary disabled" style="font-size: 11.5px; padding: 4px 10px; border-radius: 6px; cursor: not-allowed;" disabled><i class="fa-solid fa-check mr-1"></i>이미 등록됨</button>`
              : `<button class="btn btn-sm btn-beige-primary" style="font-size: 11.5px; padding: 4px 12px; border-radius: 6px; font-weight: 700;" onclick="addBookToRecommended('${b.id}')">
                  <i class="fa-solid fa-plus mr-1"></i>추천도서 추가
                 </button>`
            }
          </div>
        </div>
      `;
    }).join("");
  }

  renderRecModalPagination(totalPages, recModalCurrentPage);
}

// 모달 내부 30권 단위 페이지네이션 바 렌더링
function renderRecModalPagination(totalPages, curPage) {
  const container = document.getElementById("modalRecPaginationContainer");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  const isFirst = curPage === 1;
  html += `
    <button type="button" class="btn btn-sm" onclick="goToRecModalPage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888; font-size: 11px; padding: 3px 8px; border-radius: 5px;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 11px; padding: 3px 8px; border-radius: 5px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  let startP = Math.max(1, curPage - 2);
  let endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) {
    startP = Math.max(1, endP - 4);
  }

  if (startP > 1) {
    html += `<button type="button" class="btn btn-sm" onclick="goToRecModalPage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 11px; padding: 3px 8px; border-radius: 5px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 11px; padding: 0 2px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button type="button" class="btn btn-sm" onclick="goToRecModalPage(${p})" style="${isActive ? 'background: #7d5a2b; color: #fff; font-weight: 700; border: 1px solid #7d5a2b;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 11px; padding: 3px 8px; border-radius: 5px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 11px; padding: 0 2px;">...</span>`;
    html += `<button type="button" class="btn btn-sm" onclick="goToRecModalPage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 11px; padding: 3px 8px; border-radius: 5px;">${totalPages}</button>`;
  }

  const isLast = curPage === totalPages;
  html += `
    <button type="button" class="btn btn-sm" onclick="goToRecModalPage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888; font-size: 11px; padding: 3px 8px; border-radius: 5px;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 11px; padding: 3px 8px; border-radius: 5px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function goToRecModalPage(page) {
  recModalCurrentPage = page;
  filterRecModalBooks(false);
  const listEl = document.getElementById("modalRecBookCandidateList");
  if (listEl) listEl.scrollTop = 0;
}

// 라이브러리에서 권장도서로 추가 (지정 대상 학년에 등록)
async function addBookToRecommended(bookId) {
  const grade = document.getElementById("modalRecGrade") ? document.getElementById("modalRecGrade").value : "초등 1학년";
  const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0)
    ? masterBooks
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : (typeof mockBooks !== 'undefined' ? mockBooks : []));

  const book = allMasterBooks.find(b => String(b.id) === String(bookId));
  if (!book) return;

  const list = getRecommendedBooks();
  const exists = list.some(r => (String(r.bookId) === String(bookId) || String(r.id) === String(bookId) || r.title === book.title) && normalizeRecGradeCode(r.grade) === normalizeRecGradeCode(grade));
  if (exists) {
    alert(`이미 [${grade}]의 권장도서로 등록되어 있습니다.`);
    return;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    const previousRecommended = book.isRecommended;
    book.isRecommended = true;
    try {
      await NanoPortal.saveBook(book);
    } catch (error) {
      book.isRecommended = previousRecommended;
      showMasterToast('권장도서로 지정하지 못했습니다: ' + error.message, 'danger');
      return;
    }
  } else {
    book.isRecommended = true;
  }

  list.unshift({
    id: 'REC-' + Date.now(),
    bookId: book.id,
    title: book.title,
    author: book.author || book.publisher || '작자 미상',
    publisher: book.publisher || '출판사',
    category: book.category || '문학',
    cover: book.cover || book.image || '',
    grade: grade,
    createdAt: new Date().toISOString().slice(0, 10)
  });

  saveRecommendedBooks(list);
  filterRecModalBooks(false);
  renderRecommendedBooksTable();
  showMasterToast(`[${book.title}] 도서가 [${grade}] 권장도서로 등록되었습니다.`);
}

async function saveDirectRecommendedBook(event) {
  if (event) event.preventDefault();

  const title = document.getElementById("directRecTitle")?.value.trim();
  const author = document.getElementById("directRecAuthor")?.value.trim();
  const publisher = document.getElementById("directRecPublisher")?.value.trim();
  const grade = document.getElementById("directRecGrade")?.value || "초등 1학년";
  const category = document.getElementById("directRecCategory")?.value || "문학";
  let cover = document.getElementById("directRecCover")?.value.trim();

  if (!title) {
    alert("도서명을 입력해주세요.");
    document.getElementById("directRecTitle")?.focus();
    return;
  }
  if (!author) {
    alert("저자명을 입력해주세요.");
    document.getElementById("directRecAuthor")?.focus();
    return;
  }
  if (!publisher) {
    alert("출판사명을 입력해주세요.");
    document.getElementById("directRecPublisher")?.focus();
    return;
  }

  if (!cover) {
    cover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&q=80";
  }

  const list = getRecommendedBooks();
  const exists = list.some(r => r.title === title && r.grade === grade);
  if (exists) {
    alert("이미 해당 학년에 동일한 도서명이 권장도서로 등록되어 있습니다.");
    return;
  }

  const newRecId = 'REC-' + Date.now();
  const newBookId = 'MB-REC-' + Date.now();

  const newRecItem = {
    id: newRecId,
    bookId: newBookId,
    title: title,
    author: author,
    publisher: publisher,
    category: category,
    cover: cover,
    grade: grade,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  const newMasterBook = {
    id: newBookId, title: title, author: author, publisher: publisher, grade: grade, category: category, cover: cover,
    isRecommended: true, isPublic: "Y", hasQuiz: false, quizzes: 0, likes: 0, recommends: 1, date: new Date().toISOString().slice(0, 10)
  };
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveBook(newMasterBook); }
    catch (error) { showMasterToast('권장도서를 등록하지 못했습니다: ' + error.message); return; }
  }

  list.unshift(newRecItem);
  saveRecommendedBooks(list);

  if (typeof masterBooks !== 'undefined' && Array.isArray(masterBooks)) {
    masterBooks.unshift(newMasterBook);
  }

  renderRecommendedBooksTable();

  if (document.getElementById("directRecTitle")) document.getElementById("directRecTitle").value = "";
  if (document.getElementById("directRecAuthor")) document.getElementById("directRecAuthor").value = "";
  if (document.getElementById("directRecPublisher")) document.getElementById("directRecPublisher").value = "";
  if (document.getElementById("directRecCover")) document.getElementById("directRecCover").value = "";

  if (window.jQuery && typeof $('#recommendedBookModal').modal === 'function') {
    $('#recommendedBookModal').modal('hide');
  }

  showMasterToast(`[${title}] 신규 권장도서가 [${grade}]에 성공적으로 등록되었습니다.`);
}

async function deleteRecommendedBook(recId) {
  const list = getRecommendedBooks();
  const target = list.find(b => b.id === recId);
  const targetName = target ? `[${target.title}] ` : '';

  if (!confirm(`${targetName}해당 도서를 권장도서 목록에서 해제하시겠습니까?`)) return;

  if (window.NanoPortal && NanoPortal.remote && target) {
    const book = masterBooks.find(item => item.id === target.bookId);
    if (book) {
      const previousRecommended = book.isRecommended;
      book.isRecommended = false;
      try { await NanoPortal.saveBook(book); }
      catch (error) { book.isRecommended = previousRecommended; showMasterToast('권장도서를 해제하지 못했습니다: ' + error.message); return; }
    }
  }

  const updatedList = list.filter(b => b.id !== recId);
  saveRecommendedBooks(updatedList);
  renderRecommendedBooksTable();
  showMasterToast(`${targetName}권장도서가 성공적으로 해제되었습니다.`);
}

// ------------------------------------------
// 권장도서 엑셀(CSV) 일괄 등록, 변경, 삭제 로직
// ------------------------------------------

// 권장 학년 코드 정규화 함수 (0: 유치부, 1~6: 초등 1~6학년, 7~9: 중등 1~3학년)
function normalizeRecGradeCode(raw) {
  if (raw === undefined || raw === null) return "초등 1학년";
  const str = String(raw).trim();
  if (!str) return "초등 1학년";

  // 단일 숫자 / 영문 코드 매핑
  if (str === "0" || str.toLowerCase() === "a") return "유치부";
  if (str === "1") return "초등 1학년";
  if (str === "2") return "초등 2학년";
  if (str === "3") return "초등 3학년";
  if (str === "4") return "초등 4학년";
  if (str === "5") return "초등 5학년";
  if (str === "6") return "초등 6학년";
  if (str === "7") return "중등 1학년";
  if (str === "8") return "중등 2학년";
  if (str === "9") return "중등 3학년";
  if (str.toLowerCase() === "b" || str === "10") return "중학교";

  // 한글/영문 텍스트 호환 매핑
  if (/미취학|유아|유치/i.test(str)) return "유치부";
  if (/^초\s*1|초등\s*1/i.test(str)) return "초등 1학년";
  if (/^초\s*2|초등\s*2/i.test(str)) return "초등 2학년";
  if (/^초\s*3|초등\s*3/i.test(str)) return "초등 3학년";
  if (/^초\s*4|초등\s*4/i.test(str)) return "초등 4학년";
  if (/^초\s*5|초등\s*5/i.test(str)) return "초등 5학년";
  if (/^초\s*6|초등\s*6/i.test(str)) return "초등 6학년";
  if (/중\s*1|중등\s*1|중학교\s*1/i.test(str)) return "중등 1학년";
  if (/중\s*2|중등\s*2|중학교\s*2/i.test(str)) return "중등 2학년";
  if (/중\s*3|중등\s*3|중학교\s*3/i.test(str)) return "중등 3학년";
  if (/중/i.test(str)) return "중학교";

  return str;
}

function downloadRecommendedExcelTemplate() {
  const csvLines = [
    '구분(R/U/D),권장 학년 코드 (0~9),콘텐츠넘버(도서ID)',
    '"[설명] R:등록 / U:변경 / D:삭제 (R, U, D만 기입)","[설명] 0:유치부, 1~6:초등1~6학년, 7:중1, 8:중2, 9:중3",[설명] 콘텐츠넘버(도서ID) 기입',
    'R,0,FA000001'
  ];
  const csvContent = "\uFEFF" + csvLines.join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `나노의책장_권장도서_일괄등록_양식.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showMasterToast("권장도서 일괄 등록/변경/삭제 표준 서식이 다운로드되었습니다.");
}

function openRecommendedExcelModal() {
  const fileInput = document.getElementById("recExcelFileInput");
  if (fileInput) fileInput.value = "";
  const nameText = document.getElementById("recExcelFileNameText");
  if (nameText) nameText.innerText = "클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭";
  if (window.jQuery && typeof $('#recommendedExcelModal').modal === 'function') {
    $('#recommendedExcelModal').modal('show');
  }
}

let curSelectedRecExcelFile = null;
function handleRecommendedExcelFileSelect(input) {
  if (input.files && input.files[0]) {
    curSelectedRecExcelFile = input.files[0];
    const nameText = document.getElementById("recExcelFileNameText");
    if (nameText) nameText.innerText = `선택된 파일: ${curSelectedRecExcelFile.name} (${Math.round(curSelectedRecExcelFile.size / 1024)} KB)`;
  }
}

async function handleRecommendedExcelUpload() {
  if (!curSelectedRecExcelFile) {
    alert("업로드할 엑셀(CSV) 파일을 선택해주세요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert("업로드된 파일에 처리할 데이터가 없습니다.");
        return;
      }

      // 첫 행(헤더) 제외
      const dataRows = lines.slice(1);
      const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0) ? masterBooks : (typeof mockBooks !== 'undefined' ? mockBooks : []);
      let recList = getRecommendedBooks();

      let addCount = 0;
      let updateCount = 0;
      let deleteCount = 0;
      let failCount = 0;
      let skippedHeaderCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.startsWith("#") || row.startsWith("//")) continue;

        // CSV 안전 파싱 (큰따옴표 처리)
        let cols = [];
        let inQuotes = false;
        let token = "";
        for (let c = 0; c < row.length; c++) {
          const char = row[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(token.replace(/^["']|["']$/g, '').trim());
            token = "";
          } else {
            token += char;
          }
        }
        cols.push(token.replace(/^["']|["']$/g, '').trim());

        if (cols.length < 3) {
          failCount++;
          continue;
        }

        const modeRaw = (cols[0] || "").trim();
        const gradeRaw = (cols[1] || "").trim();
        const bookId = (cols[2] || "").trim();

        // 엑셀 상단 가이드/설명 행 또는 헤더 행 자동 제외
        if (
          modeRaw.includes("설명") || modeRaw.includes("[") || modeRaw.includes("구분") ||
          gradeRaw.includes("설명") || gradeRaw.includes("[") || gradeRaw.includes("코드") ||
          bookId.includes("설명") || bookId.includes("[") || bookId.includes("콘텐츠") || bookId.includes("도서ID")
        ) {
          skippedHeaderCount++;
          continue;
        }

        // 구분 코드 (R: 등록, U: 변경, D: 삭제)
        const modeUpper = modeRaw.toUpperCase();
        let action = "";
        if (modeUpper === "R" || modeUpper.includes("등록") || modeUpper.includes("ADD") || modeUpper.includes("REG")) {
          action = "R";
        } else if (modeUpper === "U" || modeUpper.includes("변경") || modeUpper.includes("수정") || modeUpper.includes("UPDATE") || modeUpper.includes("MOD")) {
          action = "U";
        } else if (modeUpper === "D" || modeUpper.includes("삭제") || modeUpper.includes("해제") || modeUpper.includes("DEL") || modeUpper.includes("REMOVE")) {
          action = "D";
        } else {
          // 유효하지 않은 구분 코드 (설명 행일 가능성 포함)
          skippedHeaderCount++;
          continue;
        }

        if (!bookId) {
          failCount++;
          continue;
        }

        // 학년 코드 정규화 (0: 유치부, 1~6: 초1~6, 7~9: 중1~3)
        const grade = normalizeRecGradeCode(gradeRaw);

        // 마스터 도서 검색 (도서ID, 콘텐츠넘버 bookNo, 도서명 모두 매칭 지원)
        const matchedBook = allMasterBooks.find(b => b.id === bookId || b.bookNo === bookId || b.title === bookId);

        if (action === "D") {
          // D: 권장도서 목록에서 삭제(해제)
          const beforeLen = recList.length;
          recList = recList.filter(r => {
            const matchId = (r.bookId === bookId || r.bookNo === bookId || r.id === bookId || (matchedBook && r.bookId === matchedBook.id));
            const matchTitle = (matchedBook && r.title === matchedBook.title);
            return !(matchId || matchTitle);
          });

          if (recList.length < beforeLen) {
            deleteCount += (beforeLen - recList.length);
          } else {
            deleteCount++;
          }

          if (matchedBook && window.NanoPortal && NanoPortal.remote) {
            matchedBook.isRecommended = false;
            try { await NanoPortal.saveBook(matchedBook); } catch(err) { console.warn(err); }
          }
        } else if (action === "U") {
          // U: 기존 권장도서의 학년 변경
          const existingIdx = recList.findIndex(r => r.bookId === bookId || r.bookNo === bookId || r.id === bookId || (matchedBook && (r.bookId === matchedBook.id || r.title === matchedBook.title)));
          if (existingIdx !== -1) {
            recList[existingIdx].grade = grade;
            if (matchedBook) {
              recList[existingIdx].title = matchedBook.title || recList[existingIdx].title;
              recList[existingIdx].author = matchedBook.author || matchedBook.publisher || recList[existingIdx].author;
              recList[existingIdx].publisher = matchedBook.publisher || recList[existingIdx].publisher;
              recList[existingIdx].category = matchedBook.category || recList[existingIdx].category;
              if (matchedBook.cover || matchedBook.image) recList[existingIdx].cover = matchedBook.cover || matchedBook.image;
            }
            updateCount++;
          } else {
            // 목록에 없는 경우 등록으로 안전 처리
            const finalTitle = matchedBook ? matchedBook.title : bookId;
            const finalAuthor = matchedBook ? (matchedBook.author || matchedBook.publisher || "작자 미상") : "작자 미상";
            const finalPublisher = matchedBook ? (matchedBook.publisher || "출판사") : "출판사";
            const finalCategory = matchedBook ? (matchedBook.category || "문학") : "일반";
            const finalCover = matchedBook ? (matchedBook.cover || matchedBook.image || "") : "";

            recList.unshift({
              id: 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              bookId: matchedBook ? matchedBook.id : bookId,
              title: finalTitle,
              author: finalAuthor,
              publisher: finalPublisher,
              category: finalCategory,
              cover: finalCover,
              grade: grade,
              createdAt: new Date().toISOString().slice(0, 10)
            });
            updateCount++;
          }

          if (matchedBook) {
            matchedBook.grade = grade;
            matchedBook.isRecommended = true;
            if (window.NanoPortal && NanoPortal.remote) {
              try { await NanoPortal.saveBook(matchedBook); } catch(err) { console.warn(err); }
            }
          }
        } else {
          // R: 신규 권장도서 등록 (이미 등록된 경우 학년 갱신)
          const finalTitle = matchedBook ? matchedBook.title : bookId;
          const finalAuthor = matchedBook ? (matchedBook.author || matchedBook.publisher || "작자 미상") : "작자 미상";
          const finalPublisher = matchedBook ? (matchedBook.publisher || "출판사") : "출판사";
          const finalCategory = matchedBook ? (matchedBook.category || "문학") : "일반";
          const finalCover = matchedBook ? (matchedBook.cover || matchedBook.image || "") : "";

          const existingIdx = recList.findIndex(r => r.bookId === bookId || r.bookNo === bookId || r.id === bookId || (matchedBook && (r.bookId === matchedBook.id || r.title === matchedBook.title)));
          if (existingIdx !== -1) {
            recList[existingIdx].grade = grade;
            recList[existingIdx].title = finalTitle;
            recList[existingIdx].author = finalAuthor;
            recList[existingIdx].publisher = finalPublisher;
            recList[existingIdx].category = finalCategory;
            if (finalCover) recList[existingIdx].cover = finalCover;
            updateCount++;
          } else {
            recList.unshift({
              id: 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              bookId: matchedBook ? matchedBook.id : bookId,
              title: finalTitle,
              author: finalAuthor,
              publisher: finalPublisher,
              category: finalCategory,
              cover: finalCover,
              grade: grade,
              createdAt: new Date().toISOString().slice(0, 10)
            });
            addCount++;
          }

          if (matchedBook) {
            matchedBook.grade = grade;
            matchedBook.isRecommended = true;
            if (window.NanoPortal && NanoPortal.remote) {
              try { await NanoPortal.saveBook(matchedBook); } catch(err) { console.warn(err); }
            }
          }
        }
      }

      saveRecommendedBooks(recList);
      renderRecommendedBooksTable();

      if (window.jQuery && typeof $('#recommendedExcelModal').modal === 'function') {
        $('#recommendedExcelModal').modal('hide');
      }

      curSelectedRecExcelFile = null;
      let toastMsg = `권장도서 엑셀 일괄 처리 완료 (등록 ${addCount}건, 변경 ${updateCount}건, 삭제 ${deleteCount}건)`;
      if (failCount > 0) toastMsg += `, 오류/실패 ${failCount}건`;
      showMasterToast(toastMsg);
    } catch(err) {
      console.error(err);
      alert("엑셀 파일 파싱 중 오류가 발생했습니다: " + err.message);
    }
  };
  reader.readAsText(curSelectedRecExcelFile, "UTF-8");
}

// ==========================================

// 3. 가맹점 관리 모듈 (Franchise Management)
// ==========================================

// 상품별 월 표준 결제 금액 및 기본 사용인원 매핑
const PLAN_MONTHLY_FEES = {
  "Basic": "80,000원",
  "Standard": "120,000원",
  "Premium": "180,000원",
  "Royal": "300,000원"
};

const PLAN_MAX_STUDENTS = {
  "Basic": 25,
  "Standard": 50,
  "Premium": 100,
  "Royal": "협의"
};

// 이용 상품별 품격 있는 뱃지 스타일 헬퍼
function getPlanBadge(plan) {
  const normalized = normalizePlan(plan);
  switch (normalized) {
    case "VIP":
      return `<span class="badge-soft" style="background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-crown mr-1 text-warning"></i>VIP</span>`;
    case "Royal":
      return `<span class="badge-soft" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-gem mr-1 text-primary"></i>Royal</span>`;
    case "Premium":
      return `<span class="badge-soft" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-star mr-1 text-success"></i>Premium</span>`;
    case "Standard":
      return `<span class="badge-soft" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-bookmark mr-1"></i>Standard</span>`;
    case "Basic":
    default:
      return `<span class="badge-soft" style="background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-cube mr-1"></i>Basic</span>`;
  }
}

// 연락처 입력 시 하이픈(-) 자동 입력 처리 함수
function formatPhoneInput(input) {
  if (!input) return;
  let val = input.value.replace(/[^0-9]/g, "");
  if (val.length <= 3) {
    input.value = val;
  } else if (val.length <= 7) {
    input.value = val.substring(0, 3) + "-" + val.substring(3);
  } else if (val.length <= 11) {
    input.value = val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7, 11);
  } else {
    input.value = val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7, 11);
  }
}

// (가맹 학원 페이징 변수는 파일 상단에 선언됨)
const franchiseKoCollator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
let currentFilteredFranchises = null;

// 화면 표시 기준과 100% 일치하는 실질 가입일 추출 (마이그레이션 일자 폴백 반영)
function getEffectiveFranchiseJoinDate(acad) {
  if (!acad) return "";
  const raw = (acad.joinDate && acad.joinDate !== '2026-10-26')
    ? acad.joinDate
    : (acad.startDate || acad.joinDate || "");
  const trimmed = String(raw || "").trim();
  return trimmed === "-" ? "" : trimmed;
}

// 화면 표시 기준과 100% 일치하는 실질 원장명 추출 (대표교사 계정 이름 연동 반영)
function getEffectiveFranchiseDirectorName(acad) {
  if (!acad) return "";
  const adminStaff = typeof getFranchiseAdminStaff === "function" ? getFranchiseAdminStaff(acad) : null;
  let displayDirector = (acad.director || "").replace(/\s*원장\s*원장/g, " 원장").trim();
  if (adminStaff) {
    if (!displayDirector || displayDirector.endsWith(" 원장") || displayDirector.includes("원장")) {
      displayDirector = adminStaff.name || displayDirector;
    }
  }
  const trimmed = String(displayDirector || "").trim();
  return trimmed === "-" ? "" : trimmed;
}

// 6종 정렬 옵션(가입일 오름/내림, 학원명 오름/내림, 원장명 오름/내림)에 따른 정렬 처리
function sortFranchiseListByMode(data, sortMode) {
  const mode = sortMode || "joinDate_desc";
  return [...data].sort((a, b) => {
    const nameA = (a.name || "").trim();
    const nameB = (b.name || "").trim();

    if (mode === "joinDate_desc" || mode === "joinDate_asc") {
      const dateA = getEffectiveFranchiseJoinDate(a);
      const dateB = getEffectiveFranchiseJoinDate(b);
      // 가입일이 비어 있는 항목은 오름/내림차순 모두 하단으로 배치
      if (!dateA && !dateB) return franchiseKoCollator.compare(nameA, nameB);
      if (!dateA) return 1;
      if (!dateB) return -1;
      if (dateA !== dateB) {
        return mode === "joinDate_desc" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      }
      return franchiseKoCollator.compare(nameA, nameB);
    }

    if (mode === "director_asc" || mode === "director_desc") {
      const dirA = getEffectiveFranchiseDirectorName(a);
      const dirB = getEffectiveFranchiseDirectorName(b);
      // 원장명이 비어 있는 항목은 오름/내림차순 모두 하단으로 배치
      if (!dirA && !dirB) return franchiseKoCollator.compare(nameA, nameB);
      if (!dirA) return 1;
      if (!dirB) return -1;
      const cmp = franchiseKoCollator.compare(dirA, dirB);
      if (cmp !== 0) return mode === "director_desc" ? -cmp : cmp;
      return franchiseKoCollator.compare(nameA, nameB);
    }

    // name_asc / name_desc (학원명 오름차순 / 내림차순)
    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;
    const cmp = franchiseKoCollator.compare(nameA, nameB);
    if (cmp !== 0) return mode === "name_desc" ? -cmp : cmp;
    return getEffectiveFranchiseJoinDate(b).localeCompare(getEffectiveFranchiseJoinDate(a));
  });
}

// 정렬 드롭박스 변경 시 현재 조회된 목록을 즉시 재정렬하고 1페이지로 이동
function handleFranchiseSortChange() {
  franchiseCurrentPage = 1;
  const targetData = Array.isArray(currentFilteredFranchises) ? currentFilteredFranchises : franchiseList;
  renderFranchiseTable(targetData, false);
}

// 가맹점별 '미 결제 시 자동 미승인 반영' ON/OFF 토글 버튼 UI 헬퍼
function applyAutoUnapproveToggleUI(inputId, btnOnId, btnOffId, isOn) {
  const val = Boolean(isOn);
  const hiddenEl = document.getElementById(inputId);
  if (hiddenEl) hiddenEl.value = val ? "true" : "false";
  const btnOn = document.getElementById(btnOnId);
  const btnOff = document.getElementById(btnOffId);
  if (btnOn) {
    btnOn.style.background = val ? "#3d342d" : "transparent";
    btnOn.style.color = val ? "#ffffff" : "#8c7e72";
    btnOn.style.boxShadow = val ? "0 2px 5px rgba(61,52,45,0.22)" : "none";
  }
  if (btnOff) {
    btnOff.style.background = !val ? "#ffffff" : "transparent";
    btnOff.style.color = !val ? "#3d342d" : "#8c7e72";
    btnOff.style.boxShadow = !val ? "0 1px 3px rgba(61,52,45,0.12)" : "none";
  }
}

function setEditAutoUnapprove(isOn) {
  applyAutoUnapproveToggleUI("editAutoUnapprove", "btnEditAutoUnapproveOn", "btnEditAutoUnapproveOff", isOn);
}

function setRegAutoUnapprove(isOn) {
  applyAutoUnapproveToggleUI("regAutoUnapprove", "btnRegAutoUnapproveOn", "btnRegAutoUnapproveOff", isOn);
}

// 매월 말일까지 결제내역 관리에서 해당 가맹점의 결제 완료(PAID)가 확인되었는지 검사
function isAcademyPaymentConfirmedForMonthEnd(acad, payments) {
  const kstNow = new Date(Date.now() + 9 * 3600000);
  const curYear = kstNow.getUTCFullYear();
  const curMonth = kstNow.getUTCMonth() + 1;
  const curDay = kstNow.getUTCDate();
  const lastDayOfCurMonth = new Date(Date.UTC(curYear, curMonth, 0)).getUTCDate();
  const pad = n => (n < 10 ? "0" + n : String(n));
  const currentYm = `${curYear}-${pad(curMonth)}`;

  // 당월 말일이면 당월(currentYm)을 검사하고, 말일 이전이면 가장 최근 도래한 말일(직전월 말일) 기준으로 검사
  let targetYm = currentYm;
  let targetMonthEnd = `${currentYm}-${pad(lastDayOfCurMonth)}`;
  if (curDay < lastDayOfCurMonth) {
    const prevDate = new Date(Date.UTC(curYear, curMonth - 1, 0));
    const pYear = prevDate.getUTCFullYear();
    const pMonth = prevDate.getUTCMonth() + 1;
    const pLastDay = prevDate.getUTCDate();
    targetYm = `${pYear}-${pad(pMonth)}`;
    targetMonthEnd = `${targetYm}-${pad(pLastDay)}`;
  }
  const targetMonthStart = `${targetYm}-01`;

  // 학원 가입일/계약시작일이 검사 대상 월의 말일 이후(당월 신규 가입 후 아직 첫 말일 도래 전)이면 유예
  const acadStart = String(acad.startDate || acad.joinDate || "").slice(0, 10);
  if (acadStart && acadStart > targetMonthEnd) {
    return true;
  }

  const list = Array.isArray(payments)
    ? payments
    : (typeof masterPaymentList !== "undefined" && Array.isArray(masterPaymentList) ? masterPaymentList : []);

  return list.some(p => {
    if (!p) return false;
    const matchAcad = (p.academyId && p.academyId === acad.id) || (p.academyName && p.academyName === acad.name);
    if (!matchAcad) return false;
    if (String(p.productCode || p.planType || "").toUpperCase() === "KAKAO") return false;
    const isPaid = String(p.status || "").toLowerCase() === "paid";
    if (!isPaid) return false;

    const payYm = String(p.date || p.paidAt || "").slice(0, 7);
    if (payYm >= targetYm) return true;

    const sDate = String(p.startDate || "").slice(0, 10);
    const eDate = String(p.endDate || "").slice(0, 10);
    if (sDate && eDate && sDate <= targetMonthEnd && eDate >= targetMonthStart) return true;
    return false;
  });
}

// '미 결제 시 자동 미승인 반영' ON 가맹점의 상태를 결제내역 기준으로 실시간 동기화
function syncFranchiseAutoUnapprove(payments) {
  if (typeof franchiseList === "undefined" || !Array.isArray(franchiseList)) return;
  franchiseList.forEach(acad => {
    if (!acad || acad.status === "TERMINATED" || acad.status === "PAUSED") return;
    if (acad.autoUnapprove === true) {
      const confirmed = isAcademyPaymentConfirmedForMonthEnd(acad, payments);
      if (!confirmed) {
        acad.status = "UNAPPROVED";
        acad._autoUnapproved = true;
      } else if (acad.status === "UNAPPROVED") {
        acad.status = "ACTIVE";
        acad._autoUnapproved = false;
      }
    } else if (acad._autoUnapproved && acad.status === "UNAPPROVED") {
      acad.status = "ACTIVE";
      acad._autoUnapproved = false;
    }
  });
}

// 가맹점 테이블 렌더링 (선택된 정렬 방식 반영 + 20개씩 페이징)
function renderFranchiseTable(data = franchiseList, keepPage = false) {
  syncFranchiseAutoUnapprove();
  const tbody = document.getElementById("franchiseTableBody");
  if (!tbody) return;

  if (data === franchiseList) {
    currentFilteredFranchises = null;
  }

  const sortMode = document.getElementById("franchiseSortSelect")?.value || "joinDate_desc";
  const sortedData = sortFranchiseListByMode(data, sortMode);

  lastSortedFranchises = sortedData;
  const totalCount = sortedData.length;
  const totalPages = Math.ceil(totalCount / FRANCHISE_PAGE_SIZE) || 1;

  if (!keepPage) {
    if (franchiseCurrentPage > totalPages) franchiseCurrentPage = 1;
  }
  if (franchiseCurrentPage < 1) franchiseCurrentPage = 1;

  const countEl = document.getElementById("franchiseFilteredCount");
  if (countEl) {
    countEl.innerText = `${totalCount}개소 · ${franchiseCurrentPage} / ${totalPages} 페이지`;
  }

  if (totalCount === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-5 text-muted">일치하는 가맹 학원 정보가 없습니다.</td></tr>`;
    renderFranchisePagination(0, 1);
    return;
  }

  const startIdx = (franchiseCurrentPage - 1) * FRANCHISE_PAGE_SIZE;
  const pagedData = sortedData.slice(startIdx, startIdx + FRANCHISE_PAGE_SIZE);

  tbody.innerHTML = pagedData.map((acad, idx) => {
    // 슬롯(사용인원) 사용률 계산
    const maxStd = acad.maxStudents || 50;
    const curStd = acad.currentStudents || 0;
    const slotRate = Math.round((curStd / maxStd) * 100);
    let progressClass = "";
    if (slotRate >= 95) progressClass = "danger";
    else if (slotRate >= 80) progressClass = "warn";

    // 가맹 상태 뱃지 (계약 만료, 30일내 만료 임박, 미결제 자동 미승인 포함)
    const todayStr = new Date().toISOString().slice(0, 10);
    const isExpired = (acad.endDate && acad.endDate < todayStr && acad.status !== "TERMINATED" && acad.status !== "UNAPPROVED");
    let effStatus = isExpired ? "EXPIRED" : acad.status;
    if (!isExpired && acad.status !== "TERMINATED" && acad.status !== "PAUSED" && acad.status !== "UNAPPROVED" && acad.endDate) {
      const end = new Date(acad.endDate);
      const now = new Date();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        effStatus = "EXPIRING";
      }
    }

    let statusBadge = `<span class="badge-soft badge-soft-success" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-circle-check"></i> 정상 운영</span>`;
    if (effStatus === "UNAPPROVED") {
      statusBadge = `<span class="badge-soft badge-soft-danger" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-circle-exclamation"></i> 미승인</span>`;
    } else if (effStatus === "EXPIRED") {
      statusBadge = `<span class="badge-soft badge-soft-danger" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-calendar-xmark"></i> 계약 만료</span>`;
    } else if (effStatus === "EXPIRING") {
      statusBadge = `<span class="badge-soft badge-soft-warn" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-clock"></i> 만료 임박</span>`;
    } else if (effStatus === "PAUSED") {
      statusBadge = `<span class="badge-soft badge-soft-danger" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-pause"></i> 일시 정지</span>`;
    } else if (effStatus === "TERMINATED") {
      statusBadge = `<span class="badge-soft badge-soft-neutral" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-xmark"></i> 계약 해지</span>`;
    }

    // 가입일 표시 (마이그레이션 계약 시작일 우선 연동)
    const joinDateText = (acad.joinDate && acad.joinDate !== '2026-10-26') ? acad.joinDate : (acad.startDate || acad.joinDate || "-");

    // 이용 상품명 뱃지 (대소문자/한글 등 안전 정규화)
    const planBadge = getPlanBadge(acad.plan || "Standard");

    // 관리자 ID 및 정보 (기존 실제 원장/대표교사 로그인 계정 조회)
    const adminStaff = getFranchiseAdminStaff(acad);
    const adminIdText = getFranchiseAdminId(acad);

    let displayDirector = (acad.director || "").replace(/\s*원장\s*원장/g, " 원장").trim();
    let displayPhone = acad.phone || "";
    if (displayPhone === "010-0000-0000") displayPhone = "";
    if (typeof formatPhoneNumber === 'function' && displayPhone) displayPhone = formatPhoneNumber(displayPhone);

    if (adminStaff) {
      if (!displayDirector || displayDirector.endsWith(" 원장") || displayDirector.includes("원장")) {
        displayDirector = adminStaff.name || displayDirector;
      }
      if (!displayPhone || displayPhone === "010-0000-0000") {
        displayPhone = (adminStaff.phone && adminStaff.phone !== "010-0000-0000") ? adminStaff.phone : "";
      }
    }

    return `
      <tr>
        <!-- 1. 번호 -->
        <td class="text-center font-weight-bold text-muted" style="font-size: 12px; white-space: nowrap; padding: 8px 4px;">${startIdx + idx + 1}</td>
        <!-- 2. 이용 상품명 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">${planBadge}</td>
        <!-- 3. 가맹 학원명 (주소 아래 한 줄 띄어서 사업자번호 표시) -->
        <td style="padding: 8px 10px;">
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main); white-space: nowrap; margin-bottom: 3px;">${acad.name}</div>
          <div style="font-size: 11.5px; line-height: 1.4; white-space: nowrap;">
            <div style="color: #6c5f53;"><i class="fa-solid fa-location-dot mr-1" style="color: #9c8a79;"></i>${acad.region || '전국'}</div>
            <div style="color: #8c7e72; font-size: 11px; margin-top: 2px;"><i class="fa-regular fa-id-card mr-1" style="color: #a89a8c;"></i>사업자: ${acad.bizNumber || '-'}</div>
          </div>
        </td>
        <!-- 4. 관리자 ID -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">
          ${(adminIdText && !isSyntheticAdminId(adminIdText)) ? `
            <span class="badge-soft badge-soft-neutral" style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #495057; padding: 3px 6px;">${adminIdText}</span>
          ` : `
            <span class="badge-soft" style="font-size: 11px; padding: 3px 7px; border-radius: 6px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fde68a;" title="원장/관리자 계정 등록 대기 상태입니다.">
              <i class="fa-solid fa-user-clock mr-1"></i>계정 미등록
            </span>
          `}
        </td>
        <!-- 5. 원장명 / 연락처 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 6px;">
          <div style="font-size: 12.5px; white-space: nowrap; line-height: 1.3;">
            <strong style="color: var(--text-main); font-weight: 700;">${displayDirector || '-'}</strong>
            ${displayPhone ? `<span class="ml-1" style="font-size: 11.5px; font-weight: 600; color: #5c5044;">(${displayPhone})</span>` : ''}
          </div>
          ${acad.email ? `<div style="color: #7d7063; font-size: 10.5px; font-weight: 500; white-space: nowrap; margin-top: 2px; line-height: 1.2;"><i class="fa-regular fa-envelope mr-1" style="font-size: 9.5px;"></i>${acad.email}</div>` : ''}
        </td>
        <!-- 6. 가입일 -->
        <td class="text-center font-weight-bold" style="font-size: 12px; color: #5a4b3d; white-space: nowrap; letter-spacing: -0.2px; padding: 8px 4px;">
          ${joinDateText}
        </td>
        <!-- 7. 계약 기간 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 6px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-main); letter-spacing: -0.2px; white-space: nowrap;">${acad.startDate} ~ ${acad.endDate}</div>
          <small class="d-block mt-1" style="color: #8c7662; font-weight: 600; font-size: 10.5px; white-space: nowrap;">${getDDayText(acad.endDate)}</small>
        </td>
        <!-- 8. 원생 수 / 계약 슬롯 (사용인원) -->
        <td style="padding: 8px 6px;">
          <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 11px; white-space: nowrap;">
            <span class="font-weight-bold">${curStd}명 <small class="text-muted">/ ${maxStd}명</small></span>
            <span class="text-muted font-weight-bold">${slotRate}%</span>
          </div>
          <div class="slot-progress-wrap" style="height: 5px;">
            <div class="slot-progress-fill ${progressClass}" style="width: ${Math.min(slotRate, 100)}%;"></div>
          </div>
        </td>
        <!-- 9. 가맹 상태 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">${statusBadge}</td>
        <!-- 10. 관리 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">
          <div class="d-inline-flex gap-1" style="gap: 4px;">
            <button class="btn btn-xs btn-outline-secondary" onclick="openAcademyEditModal('${acad.id}')" title="학원 정보 및 계약/상품 수정" style="border-radius: 6px; font-size: 11px; padding: 3px 7px; border-color: var(--border-medium);">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="openAcademyDeleteConfirm('${acad.id}')" title="가맹 해지/삭제" style="border-radius: 6px; font-size: 11px; padding: 3px 7px;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderFranchisePagination(totalPages, franchiseCurrentPage);
}

// 20개 단위 페이지네이션 UI 렌더링
function renderFranchisePagination(totalPages, curPage) {
  const container = document.getElementById("franchisePagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  // 이전 페이지 버튼
  const isFirst = curPage === 1;
  html += `
    <button class="btn btn-sm" onclick="goToFranchisePage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // 페이지 번호 (최대 7개 노출)
  let startP = Math.max(1, curPage - 3);
  let endP = Math.min(totalPages, startP + 6);
  if (endP - startP < 6) {
    startP = Math.max(1, endP - 6);
  }

  if (startP > 1) {
    html += `<button class="btn btn-sm" onclick="goToFranchisePage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button class="btn btn-sm" onclick="goToFranchisePage(${p})" style="${isActive ? 'background: var(--btn-primary, #3d342d); color: #fff; font-weight: 700; border: 1px solid #3d342d;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 12px; padding: 4px 10px; border-radius: 6px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
    html += `<button class="btn btn-sm" onclick="goToFranchisePage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">${totalPages}</button>`;
  }

  // 다음 페이지 버튼
  const isLast = curPage === totalPages;
  html += `
    <button class="btn btn-sm" onclick="goToFranchisePage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// 특정 페이지로 이동
function goToFranchisePage(page) {
  franchiseCurrentPage = page;
  renderFranchiseTable(lastSortedFranchises, true);
  const tableEl = document.getElementById("franchiseTableBody");
  if (tableEl) {
    tableEl.closest('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getDDayText(endDateStr) {
  const end = new Date(endDateStr);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `<span class="text-danger font-weight-bold">만료됨</span>`;
  if (diff <= 30) return `<span class="text-warning font-weight-bold">D-${diff}</span>`;
  return `D-${diff}`;
}

// 가맹점 검색창 입력 실시간 핸들러 (지우기 ✕ 버튼 토글)
function handleFranchiseSearchInput(input) {
  const clearBtn = document.getElementById("btnFranchiseSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 검색창 입력만 지움 (적용된 검색 조건/목록은 유지, 검색 버튼 클릭 시 반영)
function clearFranchiseSearchInput() {
  const input = document.getElementById("franchiseSearchInput");
  if (input) input.value = "";
  const clearBtn = document.getElementById("btnFranchiseSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
}

// 검색 결과 배지의 [✕ 검색 해제] 클릭 시 이미 확정된 조건만으로 검색어 해제
function clearFranchiseSearch() {
  clearFranchiseSearchInput();
  const badgeEl = document.getElementById("franchiseSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  appliedFranchiseFilters.query = "";
  filterFranchiseList({ useApplied: true });
}

let appliedFranchiseDates = { start: "", end: "" };
let appliedFranchiseFilters = { initialized: false, query: "", status: "ALL", plan: "ALL" };

// 가맹점 필터링 (가입일 기간 2개 박스, 이용 상품명, 운영 상태, 검색어 — 조회/검색 버튼 또는 Enter 시 확정 반영)
function filterFranchiseList(options) {
  franchiseCurrentPage = 1; // 필터링 시 1페이지로 리셋
  const dateStore = typeof appliedFranchiseDates !== "undefined"
    ? appliedFranchiseDates
    : (filterFranchiseList._dates || (filterFranchiseList._dates = { start: "", end: "" }));
  const filterStore = typeof appliedFranchiseFilters !== "undefined"
    ? appliedFranchiseFilters
    : (filterFranchiseList._filters || (filterFranchiseList._filters = { initialized: false, query: "", status: "ALL", plan: "ALL" }));
  const useApplied = Boolean(options && options.useApplied && filterStore.initialized);
  if (!useApplied) {
    Object.assign(filterStore, {
      initialized: true,
      query: (document.getElementById("franchiseSearchInput")?.value || "").toLowerCase().trim(),
      status: document.getElementById("franchiseStatusFilter")?.value || "ALL",
      plan: document.getElementById("franchisePlanFilter")?.value || "ALL"
    });
  }
  const query = filterStore.query;
  const cleanQueryPhone = query.replace(/[^0-9]/g, '');

  // ✕ 버튼 상태 동기화 (입력창에 글자가 남아 있으면 지우기 버튼 표시)
  const rawInputVal = (document.getElementById("franchiseSearchInput")?.value || "").trim();
  const clearBtn = document.getElementById("btnFranchiseSearchClear");
  if (clearBtn) {
    clearBtn.style.display = rawInputVal.length > 0 ? "inline-flex" : "none";
  }

  const statusFilter = filterStore.status;
  const planFilter = filterStore.plan;
  if (!useApplied && (!options || options.applyDates !== false)) {
    dateStore.start = document.getElementById("franchiseStartDateFilter")?.value || "";
    dateStore.end = document.getElementById("franchiseEndDateFilter")?.value || "";
  }
  const startDateFilter = dateStore.start || "";
  const endDateFilter = dateStore.end || "";
  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = franchiseList.filter(item => {
    const itemJoinDate = item.joinDate || item.startDate || "";

    // 가맹점 원장(대표교사) 계정 정보 및 관리자 ID 연동 (화면 렌더링 기준과 100% 일치)
    const adminStaff = typeof getFranchiseAdminStaff === "function" ? getFranchiseAdminStaff(item) : null;
    const adminIdText = typeof getFranchiseAdminId === "function" ? getFranchiseAdminId(item) : (item.adminId || "");

    const rawPhone = item.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const staffPhone = (adminStaff && adminStaff.phone) || '';
    const cleanStaffPhone = staffPhone.replace(/[^0-9]/g, '');

    // 원본 전화번호(010-2021-3415 등 하이픈 포함) 및 숫자(2021, 01020213415 등) 다각도 매칭
    const matchPhone = (rawPhone && rawPhone.includes(query)) ||
      (cleanQueryPhone && cleanPhone && cleanPhone.includes(cleanQueryPhone)) ||
      (staffPhone && staffPhone.includes(query)) ||
      (cleanQueryPhone && cleanStaffPhone && cleanStaffPhone.includes(cleanQueryPhone));

    const staffName = (adminStaff && adminStaff.name) || '';
    const staffEmail = (adminStaff && adminStaff.email) || '';

    const matchQuery = !query || 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.director && item.director.toLowerCase().includes(query)) ||
      (staffName && staffName.toLowerCase().includes(query)) ||
      (item.region && item.region.toLowerCase().includes(query)) ||
      (item.bizNumber && item.bizNumber.includes(query)) ||
      (item.adminId && item.adminId.toLowerCase().includes(query)) ||
      (adminIdText && adminIdText.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (staffEmail && staffEmail.toLowerCase().includes(query)) ||
      matchPhone;

    // 계약 만료, 30일내 만료 임박 및 자동 미승인 판정 반영
    const isExpired = (item.endDate && item.endDate < todayStr && item.status !== "TERMINATED" && item.status !== "UNAPPROVED");
    let effStatus = isExpired ? "EXPIRED" : item.status;
    if (!isExpired && item.status !== "TERMINATED" && item.status !== "PAUSED" && item.status !== "UNAPPROVED" && item.endDate) {
      const end = new Date(item.endDate);
      const now = new Date();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        effStatus = "EXPIRING";
      }
    }

    const matchStatus = statusFilter === "ALL" || effStatus === statusFilter;
    const matchPlan = planFilter === "ALL" || normalizePlan(item.plan) === planFilter;

    // 가입일 기간 조건
    let matchDate = true;
    if (startDateFilter && itemJoinDate && itemJoinDate < startDateFilter) {
      matchDate = false;
    }
    if (endDateFilter && itemJoinDate && itemJoinDate > endDateFilter) {
      matchDate = false;
    }

    return matchQuery && matchStatus && matchPlan && matchDate;
  });

  // 검색어 활성 상태 뱃지 갱신
  const badgeEl = document.getElementById("franchiseSearchActiveBadge");
  if (badgeEl) {
    if (query) {
      badgeEl.style.display = "inline-flex";
      const displayQuery = query.length > 25 ? query.substring(0, 25) + '...' : query;
      badgeEl.innerHTML = `<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"${displayQuery}" 검색 결과 ${filtered.length.toLocaleString()}개소 <span class="badge-clear-link" onclick="clearFranchiseSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>`;
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  currentFilteredFranchises = filtered;
  renderFranchiseTable(filtered);
}

// 가맹점 필터 초기화
function resetFranchiseFilters() {
  franchiseCurrentPage = 1; // 초기화 시 1페이지로 리셋
  currentFilteredFranchises = null;
  const q = document.getElementById("franchiseSearchInput");
  if (q) q.value = "";
  const clearBtn = document.getElementById("btnFranchiseSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  const badgeEl = document.getElementById("franchiseSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  const st = document.getElementById("franchiseStatusFilter");
  if (st) st.value = "ALL";
  const pl = document.getElementById("franchisePlanFilter");
  if (pl) pl.value = "ALL";
  const sDate = document.getElementById("franchiseStartDateFilter");
  if (sDate) sDate.value = "";
  const eDate = document.getElementById("franchiseEndDateFilter");
  if (eDate) eDate.value = "";
  appliedFranchiseDates = { start: "", end: "" };
  const sortEl = document.getElementById("franchiseSortSelect");
  if (sortEl) sortEl.value = "joinDate_desc";
  renderFranchiseTable();
}

// 신규 학원 등록 모달 열기
function openAcademyRegisterModal() {
  const form = document.getElementById("academyRegisterForm");
  if (form) form.reset();
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];
  const sDate = document.getElementById("regStartDate");
  if (sDate) sDate.value = today;
  const eDate = document.getElementById("regEndDate");
  if (eDate) eDate.value = nextYear;
  const planEl = document.getElementById("regPlan");
  if (planEl) planEl.value = "Standard";
  const maxStudentsEl = document.getElementById("regMaxStudents");
  if (maxStudentsEl) maxStudentsEl.value = "50";
  $('#academyRegisterModal').modal('show');
}

// 요금제 변경 시 월 결제 금액 및 사용인원 자동 설정 핸들러 (직접 수정도 가능)
function handleEditPlanChange(plan) {
  const feeInput = document.getElementById("editMonthlyFee");
  if (feeInput) {
    feeInput.value = PLAN_MONTHLY_FEES[plan] || "120,000원";
  }
  const maxStudentsInput = document.getElementById("editMaxStudents");
  if (maxStudentsInput) {
    maxStudentsInput.value = PLAN_MAX_STUDENTS[plan] || 50;
  }
}

function handleRegPlanChange(plan) {
  const feeInput = document.getElementById("regMonthlyFee");
  if (feeInput) {
    feeInput.value = PLAN_MONTHLY_FEES[plan] || "120,000원";
  }
  const maxStudentsInput = document.getElementById("regMaxStudents");
  if (maxStudentsInput) {
    maxStudentsInput.value = PLAN_MAX_STUDENTS[plan] || 50;
  }
}

// 신규 가맹 학원 등록 모달 열기
function openAcademyRegisterModal() {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  if (document.getElementById("regJoinDate")) document.getElementById("regJoinDate").value = today;
  if (document.getElementById("regStartDate")) document.getElementById("regStartDate").value = today;
  if (document.getElementById("regEndDate")) document.getElementById("regEndDate").value = nextYearStr;
  if (document.getElementById("regPlan")) document.getElementById("regPlan").value = "Standard";
  if (document.getElementById("regMonthlyFee")) document.getElementById("regMonthlyFee").value = PLAN_MONTHLY_FEES["Standard"] || "120,000원";
  if (document.getElementById("regMaxStudents")) document.getElementById("regMaxStudents").value = PLAN_MAX_STUDENTS["Standard"] || 50;
  setRegAutoUnapprove(false);

  $('#academyRegisterModal').modal('show');
}

// 신규 학원 등록 제출 처리 (등록일, 계약시작일, 계약만료일, 월결제금액 등 반영)
function handleRegisterAcademy(e) {
  e.preventDefault();
  const name = document.getElementById("regAcademyName").value.trim();
  const bizNumber = document.getElementById("regBizNumber")?.value.trim() || "";
  const director = document.getElementById("regDirectorName").value.trim();
  const email = document.getElementById("regDirectorEmail")?.value.trim() || "";
  const phone = document.getElementById("regDirectorPhone").value.trim();
  const address = document.getElementById("regAddress")?.value.trim() || "";
  const postcode = document.getElementById("regPostcode")?.value.trim() || "";
  const addressDetail = document.getElementById("regAddressDetail")?.value.trim() || "";
  const region = address ? address.split(" ")[0] + " " + (address.split(" ")[1] || "") : "서울";
  const adminId = document.getElementById("regDirectorId")?.value.trim() || `director_${Date.now()}`;
  const joinDate = document.getElementById("regJoinDate")?.value || document.getElementById("regStartDate")?.value;
  const startDate = document.getElementById("regStartDate").value;
  const endDate = document.getElementById("regEndDate").value;
  const plan = document.getElementById("regPlan")?.value || "Standard";
  const maxStudents = parseInt(document.getElementById("regMaxStudents")?.value, 10) || 50;
  const monthlyFee = document.getElementById("regMonthlyFee")?.value.trim() || PLAN_MONTHLY_FEES[plan] || "120,000원";

  const newId = `ACAD-0${String(franchiseList.length + 1).padStart(2, '0')}`;
  const newAcad = {
    id: newId,
    name: name,
    bizNumber: bizNumber,
    director: director.includes("원장") ? director : director + " 원장",
    email: email,
    phone: phone,
    region: region + (address ? ` (${address})` : ""),
    postcode: postcode,
    address: address,
    addressDetail: addressDetail,
    adminId: adminId,
    adminPw: document.getElementById("regDirectorPw")?.value.trim() || "nano1234!",
    plan: plan,
    joinDate: joinDate,
    startDate: startDate,
    endDate: endDate,
    currentStudents: 0,
    maxStudents: maxStudents,
    monthlyFee: monthlyFee,
    paymentStatus: "PAID",
    status: "ACTIVE"
  };

  franchiseList.unshift(newAcad);
  saveFranchisesToStorage();
  $('#academyRegisterModal').modal('hide');
  document.getElementById("academyRegisterForm").reset();

  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${name}] 신규 가맹 학원(${plan} 플랜, 사용인원 ${maxStudents}명)이 성공적으로 등록되었습니다.`);
}

// 학원 수정 모달 열기 (등록일, 계약 시작일, 계약 만료일, 이용상품, 사용인원, 월 결제금액 바인딩)
function openAcademyEditModal(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  const currentAdminId = getFranchiseAdminId(acad);
  acad.adminId = currentAdminId;
  const adminStaff = getFranchiseAdminStaff(acad);
  if (adminStaff) {
    if (!acad.director || acad.director.endsWith(" 원장") || acad.director.includes("원장")) {
      acad.director = adminStaff.name || acad.director;
    }
    if (!acad.phone || acad.phone === "010-0000-0000") {
      acad.phone = (adminStaff.phone && adminStaff.phone !== "010-0000-0000") ? adminStaff.phone : acad.phone;
    }
  }

  document.getElementById("editAcademyId").value = acad.id;
  const badge = document.getElementById("editAcademyIdBadge");
  if (badge) badge.innerText = `아이디: ${currentAdminId}`;

  document.getElementById("editAcademyName").value = acad.name || "";
  document.getElementById("editBizNumber").value = acad.bizNumber || "";
  document.getElementById("editDirectorName").value = acad.director || "";
  if (document.getElementById("editDirectorEmail")) {
    document.getElementById("editDirectorEmail").value = acad.email || "";
  }
  document.getElementById("editDirectorPhone").value = (typeof formatPhoneNumber === 'function' && acad.phone) ? formatPhoneNumber(acad.phone) : (acad.phone || "");
  document.getElementById("editRegion").value = acad.region || "";

  // 등록일, 계약 시작일, 계약 만료일 바인딩
  if (document.getElementById("editJoinDate")) {
    document.getElementById("editJoinDate").value = (acad.joinDate && acad.joinDate !== '2026-10-26') ? acad.joinDate : (acad.startDate || acad.joinDate || "");
  }
  if (document.getElementById("editStartDate")) {
    document.getElementById("editStartDate").value = acad.startDate || acad.joinDate || "";
  }
  if (document.getElementById("editEndDate")) {
    document.getElementById("editEndDate").value = acad.endDate || "";
  }

  // 이용 상품 정규화 및 바인딩 (대소문자/한글 등 안전 정규화하여 select option과 정확히 매칭)
  const normalizedPlan = normalizePlan(acad.plan);
  acad.plan = normalizedPlan;
  if (document.getElementById("editPlan")) {
    document.getElementById("editPlan").value = normalizedPlan;
  }
  if (document.getElementById("editMaxStudents")) {
    document.getElementById("editMaxStudents").value = acad.maxStudents || 50;
  }

  // 월 결제 금액 바인딩 (숫자만 있는 경우 '원' 포맷팅)
  if (document.getElementById("editMonthlyFee")) {
    let fee = acad.monthlyFee || PLAN_MONTHLY_FEES[normalizedPlan] || "120,000원";
    const digitsOnly = String(fee).replace(/[^0-9]/g, '');
    if (digitsOnly && (!String(fee).includes('원') || /^\d+$/.test(String(fee).trim()))) {
      fee = Number(digitsOnly).toLocaleString() + '원';
    }
    document.getElementById("editMonthlyFee").value = fee;
  }

  // 관리자 아이디 표시 (비밀번호는 보안상 암호화되어 관리자도 평문 조회 불가)
  if (document.getElementById("editDirectorId")) {
    document.getElementById("editDirectorId").value = currentAdminId;
  }
  if (document.getElementById("editDirectorPw")) {
    document.getElementById("editDirectorPw").value = "";
  }

  document.getElementById("editStatus").value = acad.status || "ACTIVE";
  setEditAutoUnapprove(Boolean(acad.autoUnapprove));

  var walletEl = document.getElementById('editAcademyKakaoCount');
  if (!walletEl) { walletEl = document.createElement('div'); walletEl.id = 'editAcademyKakaoCount'; walletEl.className = 'alert alert-light border'; document.querySelector('#academyEditModal .modal-body').prepend(walletEl); }
  walletEl.textContent = '카카오톡 충전 횟수: ' + Number(acad.kakaoCount || 0).toLocaleString() + '건 · 잔액 ' + Number(acad.kakaoBalance || 0).toLocaleString() + '원';
  if (window.NanoBilling && window.NanoPortal?.remote) NanoBilling.wallet(acad.id);
  $('#academyEditModal').modal('show');
}

// 임시 비밀번호 간편 생성 헬퍼
function applyQuickDirectorPw() {
  const input = document.getElementById("editDirectorPw");
  if (!input) return;
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  input.value = `nano${year}!${rand}`;
  input.focus();
}

// 학원 수정 내용 저장 (등록일, 계약시작일, 계약만료일, 이용상품, 사용인원, 월결제금액 저장)
async function saveAcademyEdit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById("editAcademyId").value;
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;
  const previousAcademy = { ...acad };

  const oldName = acad.name;
  const newName = document.getElementById("editAcademyName").value.trim() || oldName;

  const directorEl = document.getElementById("editDirectorName");
  const directorVal = directorEl ? directorEl.value.trim() : "";
  const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s()_.-]+$/;
  if (directorVal && !nameRegex.test(directorVal)) {
    const errEl = document.getElementById("editDirectorNameError");
    if (errEl) errEl.classList.remove("d-none");
    if (directorEl) directorEl.focus();
    alert("원장 성함에는 특수문자나 기호를 입력할 수 없습니다. 한글 또는 영문으로 입력해주세요.");
    return;
  }

  acad.name = newName;
  acad.bizNumber = document.getElementById("editBizNumber").value.trim();
  acad.director = directorVal;
  if (document.getElementById("editDirectorEmail")) {
    acad.email = document.getElementById("editDirectorEmail").value.trim();
  }
  acad.phone = document.getElementById("editDirectorPhone").value.trim();
  acad.region = document.getElementById("editRegion").value.trim();
  acad.address = acad.region;

  // 관리자 고유 아이디 저장 보장
  acad.adminId = document.getElementById("editDirectorId")?.value.trim() || getFranchiseAdminId(acad);

  // 등록일, 계약 시작일, 계약 만료일 저장
  if (document.getElementById("editJoinDate")) {
    acad.joinDate = document.getElementById("editJoinDate").value || acad.joinDate;
  }
  if (document.getElementById("editStartDate")) {
    acad.startDate = document.getElementById("editStartDate").value || acad.startDate;
  }
  if (document.getElementById("editEndDate")) {
    acad.endDate = document.getElementById("editEndDate").value || acad.endDate;
  }

  // 이용 상품 및 사용인원
  if (document.getElementById("editPlan")) {
    acad.plan = normalizePlan(document.getElementById("editPlan").value);
  }
  if (document.getElementById("editMaxStudents")) {
    acad.maxStudents = parseInt(document.getElementById("editMaxStudents").value, 10) || acad.maxStudents;
  }

  // 월 결제 금액 저장 (숫자만 입력된 경우 '원' 포맷팅 적용)
  if (document.getElementById("editMonthlyFee")) {
    let rawFee = document.getElementById("editMonthlyFee").value.trim();
    const digits = rawFee.replace(/[^0-9]/g, '');
    if (digits && (!rawFee.includes('원') || /^\d+$/.test(rawFee))) {
      rawFee = Number(digits).toLocaleString() + '원';
    }
    acad.monthlyFee = rawFee || PLAN_MONTHLY_FEES[acad.plan] || acad.monthlyFee;
  }

  // 비밀번호 변경 저장 (새 비밀번호 입력 시 갱신 & 통합 회원 목록 원장 계정도 실시간 동시 동기화)
  const newPwEl = document.getElementById("editDirectorPw");
  let isPasswordUpdated = false;
  if (newPwEl && newPwEl.value.trim()) {
    const newPassword = newPwEl.value.trim();
    acad.adminPw = newPassword;
    isPasswordUpdated = true;
  }

  // 통합 회원 목록(memberList) 내 원장(DIRECTOR) 계정의 아이디/비밀번호 동기화 및 부재 시 신규 생성
  if (typeof memberList !== "undefined" && Array.isArray(memberList)) {
    let directorMember = memberList.find(m =>
      (m.academyId === id || m.academyName === oldName || m.academyName === newName) &&
      (m.role === "DIRECTOR" || m.grade === "원장" || m.username === acad.adminId)
    );
    if (directorMember) {
      directorMember.username = acad.adminId;
      directorMember.name = acad.director;
      directorMember.phone = acad.phone;
      if (isPasswordUpdated && acad.adminPw) directorMember.password = acad.adminPw;
    } else {
      memberList.unshift({
        id: Date.now(),
        academyId: acad.id,
        academyName: acad.name,
        role: "DIRECTOR",
        name: acad.director || "원장",
        username: acad.adminId,
        grade: "원장",
        className: "-",
        phone: acad.phone || "-",
        parentPhone: "-",
        points: 0,
        password: acad.adminPw || "nano123!",
        lastLogin: "-",
        createdAt: acad.joinDate || new Date().toISOString().slice(0, 10),
        status: "APPROVED"
      });
    }
    saveMembersToStorage();
  }

  acad.status = document.getElementById("editStatus").value;
  const editAutoUnapproveEl = document.getElementById("editAutoUnapprove");
  if (editAutoUnapproveEl) {
    const prevAuto = Boolean(acad.autoUnapprove);
    acad.autoUnapprove = editAutoUnapproveEl.value === "true";
    // OFF로 변경 시 기존에 자동 미승인 처리되었던 상태를 정상 운영으로 복원
    if (prevAuto && !acad.autoUnapprove && acad.status === "UNAPPROVED") {
      acad.status = "ACTIVE";
      acad._autoUnapproved = false;
    }
  }
  syncFranchiseAutoUnapprove();

  // 학원명이 변경된 경우, 연계된 회원 및 발송 내역의 학원명도 자동 동기화
  if (oldName !== newName) {
    memberList.forEach(m => {
      if (m.academyId === id || m.academyName === oldName) {
        m.academyName = newName;
      }
    });
    dispatchLogs.forEach(d => {
      if (d.academyId === id || d.academyName === oldName) {
        d.academyName = newName;
      }
    });
    saveMembersToStorage();
    populateMemberAcademyFilter();
    populateDispatchAcademyFilter();
  }

  // window.MIGRATED_FRANCHISES 메모리 배열에도 즉시 동기화
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_FRANCHISES)) {
    const mIdx = window.MIGRATED_FRANCHISES.findIndex(a => a.id === id);
    if (mIdx !== -1) {
      window.MIGRATED_FRANCHISES[mIdx] = { ...acad };
    }
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveAcademy(acad);
    } catch (error) {
      Object.assign(acad, previousAcademy);
      showMasterToast('학원 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }
  saveFranchisesToStorage();
  $('#academyEditModal').modal('hide');

  // 현재 필터/검색 조건 유지하여 즉시 재렌더링
  if (typeof filterFranchiseList === "function") {
    filterFranchiseList();
  } else {
    renderFranchiseTable(franchiseList, true);
  }
  updateFranchiseStats();

  const pwMsg = isPasswordUpdated ? ` (원장 PW가 '${acad.adminPw}'로 변경되었습니다.)` : '';
  showMasterToast(`[${acad.name}] 가맹 학원 정보가 갱신되었습니다.${pwMsg}`);
}

// 학원 삭제/해지 확인 모달
let pendingDeleteAcademyId = null;
function openAcademyDeleteConfirm(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  pendingDeleteAcademyId = id;
  document.getElementById("deleteAcademyName").innerText = acad.name;
  $('#academyDeleteConfirmModal').modal('show');
}

async function confirmDeleteAcademy() {
  if (!pendingDeleteAcademyId) return;
  const idx = franchiseList.findIndex(a => a.id === pendingDeleteAcademyId);
  if (idx === -1) return;

  const target = franchiseList[idx];

  // 운영 서버(Vercel + Neon DB)에 가맹 학원 삭제(해지) 요청 전송
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.deleteAcademy(target);
    } catch (error) {
      showMasterToast('가맹 학원을 삭제하지 못했습니다: ' + error.message);
      return;
    }
  }

  const deleted = franchiseList.splice(idx, 1)[0];
  saveFranchisesToStorage();
  $('#academyDeleteConfirmModal').modal('hide');
  pendingDeleteAcademyId = null;
  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${deleted.name}] 가맹 계약이 해지 및 삭제되었습니다.`);
}

function updateFranchiseStats() {
  const total = franchiseList.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // 만료 임박(30일내) 개수 실시간 동적 계산
  const expiringCount = franchiseList.filter(a => {
    if (a.status === "TERMINATED" || a.status === "PAUSED") return false;
    const isExpired = (a.endDate && a.endDate < todayStr);
    if (isExpired) return false;
    if (a.status === "EXPIRING") return true;
    if (!a.endDate) return false;
    const diffDays = Math.ceil((new Date(a.endDate) - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const activeCount = franchiseList.filter(a => {
    const isExpired = (a.endDate && a.endDate < todayStr && a.status !== "TERMINATED");
    return !isExpired && a.status === "ACTIVE";
  }).length;
  const expiredCount = franchiseList.filter(a => {
    return a.status === "EXPIRED" || (a.endDate && a.endDate < todayStr && a.status !== "TERMINATED");
  }).length;
  const pausedCount = franchiseList.filter(a => a.status === "PAUSED").length;

  const currentSlots = franchiseList.reduce((acc, cur) => acc + (cur.currentStudents || 0), 0);
  const maxSlots = franchiseList.reduce((acc, cur) => acc + (cur.maxStudents || 0), 0);
  const slotRate = maxSlots > 0 ? ((currentSlots / maxSlots) * 100).toFixed(1) : "0.0";

  if (document.getElementById("statFranchiseTotal")) {
    document.getElementById("statFranchiseTotal").innerHTML = `${total}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">개소</span>`;
    const sub = document.getElementById("statFranchiseTotal").nextElementSibling;
    if (sub && sub.classList.contains("stat-sub")) {
      sub.innerHTML = `<span class="text-success font-weight-bold">정상 ${activeCount}</span> / <span class="text-danger font-weight-bold">만료 ${expiredCount}</span> / 일시정지 ${pausedCount}`;
    }
  }
  if (document.getElementById("statFranchiseSlots")) {
    document.getElementById("statFranchiseSlots").innerHTML = `${currentSlots.toLocaleString()} <span style="font-size: 15px; font-weight: 600; color: var(--text-muted);">/ ${maxSlots.toLocaleString()}명</span>`;
    const sub = document.getElementById("statFranchiseSlots").nextElementSibling;
    if (sub && sub.classList.contains("stat-sub")) {
      sub.innerHTML = `슬롯 사용률 <strong class="text-primary font-weight-bold">${slotRate}%</strong>`;
    }
  }
  if (document.getElementById("statFranchiseExpiring")) {
    document.getElementById("statFranchiseExpiring").innerHTML = `${expiringCount}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">개소</span>`;
  }
}

function exportFranchiseExcel() {
  showMasterToast("가맹 학원 명단 및 B2B 계약 현황 엑셀 다운로드가 시작되었습니다.");
}

// ==========================================


// --- [Franchise Deletion & Retention / Restoration] ---

// [13] 가맹점 삭제 - 비밀번호 검증 + 7일 임시보존
// -----------------------------------------------------------
function loadDeletedAcademiesFromStorage() {
  try {
    const stored = localStorage.getItem("NANO_MASTER_DELETED_FRANCHISES");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("삭제 가맹 학원 로드 실패:", e);
  }
  return [];
}
let deletedAcademyList = loadDeletedAcademiesFromStorage(); // 임시 보존 삭제 목록

async function confirmDeleteAcademy() {
  if (!pendingDeleteAcademyId) return;

  const isRemote = window.NanoPortal && NanoPortal.remote;
  // 로컬 체험 화면에서만 데모 확인값을 사용합니다. 운영 서버는 로그인 세션의 본사 권한으로 검증합니다.
  const pwInput = document.getElementById("deleteConfirmPassword");
  const pwErrEl = document.getElementById("deletePasswordError");
  const MASTER_PASSWORD = "master1234!"; // 실제로는 서버 검증

  if (!isRemote && (!pwInput || !pwInput.value.trim())) {
    if (pwErrEl) pwErrEl.classList.remove("d-none");
    return;
  }
  if (!isRemote && pwInput.value !== MASTER_PASSWORD) {
    if (pwErrEl) pwErrEl.classList.remove("d-none");
    return;
  }
  if (pwErrEl) pwErrEl.classList.add("d-none");

  const idx = franchiseList.findIndex(a => a.id === pendingDeleteAcademyId);
  if (idx !== -1) {
    const deleted = franchiseList[idx];
    if (isRemote) {
      try {
        await NanoPortal.deleteAcademy(deleted);
      } catch (error) {
        showMasterToast('학원을 삭제하지 못했습니다: ' + error.message);
        return;
      }
    }
    franchiseList.splice(idx, 1);

    // 7일 임시 보존
    const deletedAt = new Date();
    const expireAt = new Date(deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    deletedAcademyList.unshift({
      ...deleted,
      deletedAt: deletedAt.toISOString().split("T")[0],
      expireAt: expireAt.toISOString().split("T")[0]
    });

    saveFranchisesToStorage();

    // 비밀번호 초기화
    if (pwInput) pwInput.value = "";

    $('#academyDeleteConfirmModal').modal('hide');
    renderFranchiseTable();
    updateFranchiseStats();
    populateMemberAcademyFilter();
    populateDispatchAcademyFilter();
    showMasterToast(`[${deleted.name}] 가맹 학원이 삭제되어 7일간 임시 보존됩니다. 복구는 '삭제 내역' 버튼에서 확인하세요.`);
  }
  pendingDeleteAcademyId = null;
}

// 삭제된 학원 임시 보존 목록 모달 열기
function openDeletedAcademyListModal() {
  renderDeletedAcademyList();
  $('#deletedAcademyListModal').modal('show');
}

function renderDeletedAcademyList() {
  const container = document.getElementById("deletedAcademyListContainer");
  if (!container) return;

  if (deletedAcademyList.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted"><i class="fa-solid fa-inbox mr-2"></i>임시 보존된 학원이 없습니다.</div>`;
    return;
  }

  const today = new Date();
  container.innerHTML = deletedAcademyList.map((acad, idx) => {
    const expireDate = new Date(acad.expireAt);
    const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;
    return `
      <div class="p-3 mb-2 rounded d-flex justify-content-between align-items-center" style="background: ${isExpired ? '#fff3f3' : '#fdfbf7'}; border: 1px solid ${isExpired ? '#f5c6cb' : '#ebd9c8'};">
        <div>
          <div class="font-weight-bold text-dark">${acad.name}</div>
          <small class="text-muted">삭제일: ${acad.deletedAt} / 만료일: ${acad.expireAt}</small>
          <span class="ml-2 ${isExpired ? 'badge-soft badge-soft-danger' : 'badge-soft badge-soft-warn'}" style="font-size: 11px;">
            ${isExpired ? '완전삭제 예정' : `${daysLeft}일 남음`}
          </span>
        </div>
        ${!isExpired ? `
        <button class="btn btn-sm btn-outline-success" onclick="restoreDeletedAcademy(${idx})" style="border-radius: 8px;">
          <i class="fa-solid fa-rotate-left mr-1"></i>복구
        </button>` : ''}
      </div>
    `;
  }).join("");
}

async function restoreDeletedAcademy(idx) {
  const restored = deletedAcademyList[idx];
  if (!restored) return;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.restoreAcademy(restored);
    } catch (error) {
      showMasterToast('학원을 복구하지 못했습니다: ' + error.message);
      return;
    }
  }
  deletedAcademyList.splice(idx, 1);
  delete restored.deletedAt;
  delete restored.expireAt;
  franchiseList.unshift(restored);
  saveFranchisesToStorage();
  renderDeletedAcademyList();
  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  showMasterToast(`[${restored.name}] 가맹 학원이 성공적으로 복구되었습니다.`);
}

// -----------------------------------------------------------


// --- [Franchise Excel Export] ---

// [14] 가맹점 명단 엑셀 실제 다운로드 (SheetJS 없을 시 CSV)
// -----------------------------------------------------------
function exportFranchiseExcel() {
  const headers = ["학원ID", "학원명", "사업자번호", "원장명", "이메일", "연락처", "지역", "관리자ID", "이용상품", "가맹일", "계약시작", "계약만료", "현재원생", "최대원생", "월결제금액", "상태"];
  // 현재 검색 필터 및 정렬 순서가 적용된 목록 우선 다운로드
  const targetList = Array.isArray(lastSortedFranchises) && (Array.isArray(currentFilteredFranchises) || lastSortedFranchises.length > 0)
    ? lastSortedFranchises
    : franchiseList;
  const rows = targetList.map(a => [
    a.id,
    a.name,
    a.bizNumber || "",
    getEffectiveFranchiseDirectorName(a) || a.director || "",
    a.email || "",
    a.phone,
    a.region,
    a.adminId,
    a.plan,
    getEffectiveFranchiseJoinDate(a) || a.joinDate || "",
    a.startDate,
    a.endDate,
    a.currentStudents,
    a.maxStudents,
    a.monthlyFee,
    a.status
  ]);

  const today = new Date().toISOString().split("T")[0];
  downloadAsCSV(`가맹 학원 명단 (${today}).csv`, headers, rows);
  showMasterToast("가맹 학원 명단이 CSV 파일로 다운로드되었습니다.");
}

// -----------------------------------------------------------


// --- [Franchise UI Event Handlers] ---

document.addEventListener("DOMContentLoaded", () => {
  // 메모 카운터
  const memoEl = document.getElementById("regMemo");
  const memoCount = document.getElementById("regMemoCount");
  if (memoEl && memoCount) {
    memoEl.addEventListener("input", () => {
      memoCount.textContent = `${memoEl.value.length} / 100자`;
    });
  }

  // 권장도서 학년 버튼 초기화 (드롭박스 대신 버튼 사용 시)
  const recGradeFilter = document.getElementById("recGradeFilter");
  if (recGradeFilter) {
    recGradeFilter.addEventListener("change", () => {
      // 드롭박스 변경 시 버튼도 동기화
      const selectedGrade = recGradeFilter.value;
      document.querySelectorAll(".rec-grade-btn").forEach(btn => {
        if (btn.dataset.grade === selectedGrade) {
          btn.style.background = "#7d5a2b";
          btn.style.color = "#fff";
          btn.style.border = "none";
        } else {
          btn.style.background = "#fff";
          btn.style.color = "#5a4b3d";
          btn.style.border = "1.5px solid #d4c4b0";
        }
      });
    });
  }
});


// --- [Franchise Modal & Registration Overrides] ---

// -----------------------------------------------------------
// [23] 가맹점 테이블 렌더링에 삭제 내역 버튼 추가
// -----------------------------------------------------------
// renderFranchiseTable 함수에서 삭제 확인 모달 열기 방식 개선 (openAcademyDeleteConfirm)
// openAcademyDeleteConfirm - 기존 함수 오버라이드
const _origOpenAcademyDeleteConfirm = typeof openAcademyDeleteConfirm === "function" ? openAcademyDeleteConfirm : null;
function openAcademyDeleteConfirm(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  pendingDeleteAcademyId = id;
  document.getElementById("deleteAcademyName").innerText = acad.name;

  // 비밀번호 초기화
  const pwInput = document.getElementById("deleteConfirmPassword");
  if (pwInput) pwInput.value = "";
  const pwErr = document.getElementById("deletePasswordError");
  if (pwErr) pwErr.classList.add("d-none");

  $('#academyDeleteConfirmModal').modal('show');
}

// -----------------------------------------------------------
// [24] handleRegisterAcademy 오버라이드 - 주소 및 메모 포함
// -----------------------------------------------------------
const _origHandleRegisterAcademy = typeof handleRegisterAcademy === "function" ? handleRegisterAcademy : null;
async function handleRegisterAcademy(e) {
  if (e && e.preventDefault) e.preventDefault();
  const directorEl = document.getElementById("regDirectorName");
  const director = directorEl ? directorEl.value.trim() : "";
  const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;
  if (!nameRegex.test(director)) {
    const errEl = document.getElementById("regDirectorNameError");
    if (errEl) errEl.classList.remove("d-none");
    if (directorEl) directorEl.focus();
    alert("원장님 성함에는 특수문자나 숫자를 입력할 수 없습니다. 한글 또는 영문으로 입력해주세요.");
    return;
  }

  // 이메일 형식 검증
  const emailEl = document.getElementById("regDirectorEmail");
  if (emailEl) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailEl.value.trim())) {
      const errEl = document.getElementById("regEmailError");
      if (errEl) errEl.classList.remove("d-none");
      emailEl.focus();
      return;
    }
  }

  const name = document.getElementById("regAcademyName").value.trim();
  const bizNumber = document.getElementById("regBizNumber")?.value.trim() || "";
  const email = emailEl?.value.trim() || "";
  const phone = document.getElementById("regDirectorPhone").value.trim();

  // 주소 처리 (카카오 API 사용)
  const postcode = document.getElementById("regPostcode")?.value.trim() || "";
  const baseAddr = document.getElementById("regAddress")?.value.trim() || "";
  const detailAddr = document.getElementById("regAddressDetail")?.value.trim() || "";
  const fullAddress = [baseAddr, detailAddr].filter(Boolean).join(" ");
  const region = fullAddress ? fullAddress.split(" ")[0] + " " + (fullAddress.split(" ")[1] || "") : "서울";

  const adminId = document.getElementById("regDirectorId")?.value.trim() || `director_${Date.now()}`;
  const joinDate = document.getElementById("regJoinDate")?.value || new Date().toISOString().split("T")[0];
  const startDate = document.getElementById("regStartDate").value;
  const endDate = document.getElementById("regEndDate").value;
  const plan = document.getElementById("regPlan")?.value || "Standard";
  const maxStudents = parseInt(document.getElementById("regMaxStudents")?.value, 10) || 50;
  const monthlyFee = document.getElementById("regMonthlyFee")?.value.trim() || PLAN_MONTHLY_FEES[plan] || "120,000원";
  const memo = document.getElementById("regMemo")?.value.trim() || "";

  const nextAcademyNumber = franchiseList.reduce((max, academy) => Math.max(max, Number(String(academy.id || '').replace(/\D/g, '')) || 0), 0) + 1;
  const newId = `ACAD-${String(nextAcademyNumber).padStart(3, '0')}`;
  const newAcad = {
    id: newId,
    name: name,
    bizNumber: bizNumber,
    director: director.includes("원장") ? director : director + " 원장",
    email: email,
    phone: phone,
    postcode: postcode,
    region: region,
    address: fullAddress,
    adminId: adminId,
    adminPw: document.getElementById("regDirectorPw")?.value.trim() || "nano1234!",
    plan: plan,
    joinDate: joinDate,
    startDate: startDate,
    endDate: endDate,
    currentStudents: 0,
    maxStudents: maxStudents,
    monthlyFee: monthlyFee,
    autoUnapprove: document.getElementById("regAutoUnapprove")?.value === "true",
    paymentStatus: "PAID",
    status: "ACTIVE",
    memo: memo
  };
  if (newAcad.autoUnapprove && !isAcademyPaymentConfirmedForMonthEnd(newAcad)) {
    newAcad.status = "UNAPPROVED";
    newAcad._autoUnapproved = true;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveAcademy(newAcad);
    } catch (error) {
      showMasterToast('학원을 등록하지 못했습니다: ' + error.message);
      return;
    }
  }
  franchiseList.unshift(newAcad);
  saveFranchisesToStorage();

  // 통합 회원 목록에도 원장(DIRECTOR) 계정 즉시 등록 보장
  const newDirectorMember = {
    id: Date.now(),
    academyId: newId,
    academyName: name,
    role: "DIRECTOR",
    name: newAcad.director,
    username: adminId,
    grade: "원장",
    className: "-",
    phone: phone,
    parentPhone: "-",
    points: 0,
    password: newAcad.adminPw,
    lastLogin: "-",
    createdAt: joinDate,
    status: "APPROVED"
  };
  if (typeof memberList !== "undefined" && Array.isArray(memberList)) {
    memberList.unshift(newDirectorMember);
    saveMembersToStorage();
  }
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_MEMBERS)) {
    window.MIGRATED_MEMBERS.unshift(newDirectorMember);
  }

  $('#academyRegisterModal').modal('hide');
  document.getElementById("academyRegisterForm").reset();

  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${name}] 신규 가맹 학원(${plan} 플랜, 사용인원 ${maxStudents}명)이 성공적으로 등록되었습니다.`);
}

// 가맹 학원 데이터 초기화 헬퍼 (테스트 후 원상복구용)
function resetMasterFranchiseData() {
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 데이터는 초기화할 수 없습니다. 필요한 항목을 직접 수정해 주세요.'); return; }
  localStorage.removeItem(STORAGE_KEY_FRANCHISES);
  localStorage.removeItem(STORAGE_KEY_DELETED_FRANCHISES);
  franchiseList = loadFranchisesFromStorage();
  deletedAcademyList = loadDeletedAcademiesFromStorage();
  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast("가맹 학원 데이터가 기본 샘플 목록으로 초기화되었습니다.");
}
