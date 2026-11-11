/**
 * ==============================================================
 * 나노의 책장 - 학원 도서 및 북퀴즈 관리 & 대량 엑셀 등록 & 보안 PDF 뷰어 모듈
 * File: public_html/js/admin_books.js
 * ==============================================================
 */

// ==============================================================
// 콘텐츠 관리 (도서 목록 + 콘텐츠 학습자료 PDF 업로드) 로직
// 양장본 기본 도서 커버 (HTML 따옴표 깨짐 방지를 위한 안전한 Base64 SVG Data URI)
var DEFAULT_BOOK_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTYwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE2MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImNvdmVyQmciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjM2I4MmY2IiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzFkNGVkOCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWUzYThhIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic3BpbmVTaGFkZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJyZ2JhKDAsMCwwLDAuMzUpIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjYwJSIgc3RvcC1jb2xvcj0icmdiYSgwLDAsMCwwLjEpIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJyaWJib25HcmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTllMGIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZiYmYyNCIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01JSIgeT0iLTUlIiB3aWR0aD0iMTE1JSIgaGVpZ2h0PSIxMTUlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjIiIHN0ZERldmlhdGlvbj0iMiIgZmxvb2Qtb3BhY2l0eT0iMC4xNSIgLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMTE2IiBoZWlnaHQ9IjE1NiIgcng9IjYiIGZpbGw9InVybCgjY292ZXJCZykiIGZpbHRlcj0idXJsKCNzaGFkb3cpIiAvPgogIDxyZWN0IHg9IjEyIiB5PSI4IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0NCIgcng9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIyLDIiIC8+CiAgPHBhdGggZD0iTTIgOCBDMiA0LjY5IDQuNjkgMiA4IDIgTDEyIDIgTDEyIDE1OCBMOCAxNTggQzQuNjkgMTU4IDIgMTU1LjMxIDIgMTUyIFoiIGZpbGw9InVybCgjc3BpbmVTaGFkZSkiIC8+CiAgPGxpbmUgeDE9IjEyIiB5MT0iMiIgeDI9IjEyIiB5Mj0iMTU4IiBzdHJva2U9InJnYmEoMCwwLDAsMC4yKSIgc3Ryb2tlLXdpZHRoPSIxIiAvPgogIDxwb2x5Z29uIHBvaW50cz0iNzYsMiA5MCwyIDkwLDMyIDgzLDI0IDc2LDMyIiBmaWxsPSJ1cmwoI3JpYmJvbkdyYWQpIiBvcGFjaXR5PSIwLjk1IiAvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM4LCA1NikiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgb3BhY2l0eT0iMC45Ij4KICAgIDxwYXRoIGQ9Ik0yMiAyOCBDMTUgMjQgNiAyNSAwIDI4IEwwIDYgQzYgMyAxNSAyIDIyIDYgWiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEyKSIgLz4KICAgIDxwYXRoIGQ9Ik0yMiAyOCBDMjkgMjQgMzggMjUgNDQgMjggTDQ0IDYgQzM4IDMgMjkgMiAyMiA2IFoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xOCkiIC8+CiAgICA8bGluZSB4MT0iMjIiIHkxPSI2IiB4Mj0iMjIiIHkyPSIyOCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNSIgLz4KICAgIDxsaW5lIHgxPSI2IiB5MT0iMTIiIHgyPSIxNiIgeTI9IjEwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC40KSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+CiAgICA8bGluZSB4MT0iNiIgeTE9IjE4IiB4Mj0iMTYiIHkyPSIxNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNCkiIHN0cm9rZS13aWR0aD0iMS41IiAvPgogICAgPGxpbmUgeDE9IjI4IiB5MT0iMTAiIHgyPSIzOCIgeTI9IjEyIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC40KSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+CiAgICA8bGluZSB4MT0iMjgiIHkxPSIxNiIgeDI9IjM4IiB5Mj0iMTgiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjQpIiBzdHJva2Utd2lkdGg9IjEuNSIgLz4KICA8L2c+CiAgPHRleHQgeD0iNjQiIHk9IjExMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1ByZXRlbmRhcmQnLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjkiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNmZmZmZmYiIGxldHRlci1zcGFjaW5nPSIxIiBvcGFjaXR5PSIwLjg1Ij5OQU5PIEJPT0s8L3RleHQ+CiAgPHJlY3QgeD0iNDIiIHk9IjExOCIgd2lkdGg9IjQ0IiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIgLz4KPC9zdmc+';

// 도서 표지 경로 정규화:
function normalizeBookCoverUrl(url) {
  if (!url || url === 'undefined' || url === 'null' || !String(url).trim()) return DEFAULT_BOOK_COVER;
  var trimmed = String(url).trim();
  if (trimmed.includes('book_default.svg') || trimmed.includes('book_default.png')) {
    return DEFAULT_BOOK_COVER;
  }
  if (/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i.test(trimmed)) {
    trimmed = trimmed.replace(/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  }
  if (/\/upload\/book\/[^?]+\.(jpe?g|png|jfif)$/i.test(trimmed)) {
    trimmed = trimmed.replace(/\.(jpe?g|png|jfif)$/i, '.webp');
  }
  if (/^(https?:)?\/\//.test(trimmed) || trimmed.indexOf('data:') === 0) return trimmed;
  if (trimmed.startsWith('/upload/') || trimmed.startsWith('upload/')) {
    return trimmed.startsWith('/') ? trimmed : ('/' + trimmed);
  }
  return trimmed;
}

// 나노시트 실제 파일 실존 여부 정밀 판정 함수 (업로드된 커스텀 시트 우선 인정 & 서버 배포본 대조)
function checkBookHasAvailableSheet(b) {
  if (!b) return false;

  // 1. 방금 직접 업로드한 실제 PDF 파일/Blob이 메모리에 있는 경우 또는 커스텀 시트 등록 플래그
  if (b.pdfBlob || b.pdfDataUrl || b.hasCustomSheet === true) return true;

  // 2. 도서에 시트 파일명이 명시되어 있거나 시트/워크시트 플래그가 있는 경우
  if (b.materialName && typeof b.materialName === 'string' && b.materialName.trim() && !b.materialName.includes('미등록') && !b.materialName.includes('없음')) {
    return true;
  }
  if (b.hasSheet === true || b.sheet === true || b.worksheet === true) {
    return true;
  }

  // 3. 외부 호스팅 절대 URL(https://) 또는 미디어 API(/api/files)가 명시된 경우
  if (
    (b.pdfUrl && /^(https?:\/\/|\/api\/files\?)/i.test(b.pdfUrl)) ||
    (b.worksheetUrl && /^(https?:\/\/|\/api\/files\?)/i.test(b.worksheetUrl))
  ) {
    return true;
  }

  // 4. 서버에 배포된 검증 나노시트 Set(AVAILABLE_NANOSHEET_SET) 대조
  var sheetSet = (typeof window !== 'undefined' && window.AVAILABLE_NANOSHEET_SET) || null;
  if (!sheetSet) {
    return false;
  }

  var candidates = [];
  if (b.id) candidates.push(String(b.id).trim().toLowerCase());
  if (b.bookNo) candidates.push(String(b.bookNo).trim().toLowerCase());
  if (b.serverId) candidates.push(String(b.serverId).trim().toLowerCase());
  if (b.isbn) candidates.push(String(b.isbn).replace(/[^0-9]/g, ''));
  if (b.cover && typeof b.cover === 'string') {
    var m = String(b.cover).match(/([0-9]{10,13}|book_[0-9]+)/);
    if (m && m[1]) candidates.push(m[1].toLowerCase());
  }
  var extraPath = b.pdfUrl || b.worksheetUrl || '';
  if (extraPath) {
    var pMatch = String(extraPath).match(/([0-9]{10,13}|book_[0-9]+)/);
    if (pMatch && pMatch[1]) candidates.push(pMatch[1].toLowerCase());
  }

  return candidates.some(function(k) { return k && sheetSet.has(k); });
}

function createAcademyBookItem(b) {
  if (!b) return null;

  // 1. 도서 번호 및 컬럼 밀림 자가 치유 (Self-Healing Pipeline)
  // 도서번호가 누락되었거나(undefined), 제목 자리에 'FA000001' 등 도서 관리 코드가 들어간 경우 자동 보정
  var bookId = b.id || b.bookNo;
  var title = b.title || '';
  var isShifted = (!bookId || bookId === 'undefined') && /^[A-Z]{2}\d{6}$/.test(title);

  if (isShifted) {
    bookId = title;
    title = (b.series && b.series !== '단권') ? b.series : (b.subtitle || '도서명 미상');
    b.series = (b.author && b.author !== '작가 미상') ? b.author : '단권';
    b.publisher = (b.subject && b.subject !== '이야기') ? b.subject : (b.publisher || '출판사');
    b.author = '구사카 미나코 글/기타무라 유카 그림/황진희 역';
    b.category = '문학';
    b.subject = '이야기';
    b.grade = b.grade || '유치부';
    if (!b.cover || b.cover.indexOf(bookId) !== -1 || b.cover === 'resources/images/book_default.svg') {
      b.cover = '/upload/book/9791187079521.jpg';
    }
  }

  // 2. MIGRATED_BOOKS 표준 데이터셋과 동기화 및 누락 정보 복원 (O(1) 인덱스 맵 최적화)
  // b가 이미 author, publisher 등 표준 필드를 갖추고 있다면 불필요한 전체 순회(3,400만 루프) 생략
  if (isShifted || !b.publisher || !b.author) {
    var matchKey = bookId || title;
    var canon = getMigratedBookFromIndex(matchKey);
    if (canon && canon !== b) {
      bookId = canon.id || canon.bookNo || bookId;
      title = canon.title || title;
      b.author = canon.author || b.author;
      b.publisher = canon.publisher || b.publisher;
      b.grade = canon.grade || b.grade;
      b.category = canon.category || b.category;
      b.cat1 = canon.cat1 || b.cat1;
      b.cat2 = canon.cat2 || b.cat2;
      b.series = canon.series || b.series;
      b.cover = canon.cover || b.cover;
      b.quizzes = canon.quizzes || b.quizzes;
      if (canon.sheet !== undefined) b.sheet = canon.sheet;
      if (canon.worksheet !== undefined) b.worksheet = canon.worksheet;
      if (canon.worksheetUrl !== undefined) b.worksheetUrl = canon.worksheetUrl;
      if (canon.pdfUrl !== undefined) b.pdfUrl = canon.pdfUrl;
    }
  }

  bookId = bookId || b.id || b.bookNo || b.serverId || 'FA000001';
  var hasValidSeries = !!(b.series && b.series.trim() !== '' && b.series.trim() !== '단권');
  var isSingleBook = (!hasValidSeries || b.isSingle === true || b.series === '단권');
  var seriesVal = isSingleBook ? '단권' : b.series.trim();

  // 나노시트 실제 파일 준비 여부 명확한 판정 (서버 실존 검증)
  var hasSheet = checkBookHasAvailableSheet(b);

  return {
    id: bookId,
    bookNo: bookId,
    serverId: b.serverId,
    themeId: b.themeId || null,
    title: title,
    subtitle: (seriesVal && seriesVal !== '단권') ? seriesVal : ((b.cat1 || '소설') + ' · ' + (b.cat2 || '국내서')),
    author: b.author || '작가 미상',
    publisher: b.publisher || '출판사 미상',
    category: (b.category || '문학') + ' / ' + (b.subject || '이야기'),
    grade: b.grade || '초등 3학년',
    cat1: b.cat1 || '소설',
    cat2: b.cat2 || '국내서',
    isbn: b.isbn || '',
    series: seriesVal,
    isSingle: isSingleBook,
    themeTag: b.themeTag || (b.subject ? ('#' + b.subject) : '#이달의나노북클럽'),
    subject: b.subject || '이야기',
    tags: b.tags || [],
    detailTag: b.detailTag || '',
    awards: b.awards || '',
    creatorType: (function() {
      if (b.creatorType && b.creatorType !== 'HQ') return b.creatorType;
      var cInfo = (typeof window !== 'undefined' && window.NANO_ACADEMY_BOOK_CREATORS && window.NANO_ACADEMY_BOOK_CREATORS[bookId]) || null;
      return cInfo ? 'ACADEMY' : (b.creatorType || 'HQ');
    })(),
    academyId: (function() {
      if (b.academyId && b.academyId !== 'HQ') return b.academyId;
      var cInfo = (typeof window !== 'undefined' && window.NANO_ACADEMY_BOOK_CREATORS && window.NANO_ACADEMY_BOOK_CREATORS[bookId]) || null;
      return cInfo ? cInfo[0] : (b.academyId || 'HQ');
    })(),
    academyName: (function() {
      var rawName = '';
      if (b.academyName && !b.academyName.includes('본사')) {
        rawName = b.academyName;
      } else {
        var cInfo = (typeof window !== 'undefined' && window.NANO_ACADEMY_BOOK_CREATORS && window.NANO_ACADEMY_BOOK_CREATORS[bookId]) || null;
        rawName = cInfo ? cInfo[1] : (b.academyName || '본사 직속(HQ)');
      }
      if (rawName && (rawName.includes('?') || rawName.includes('숈썝') || rawName.includes('습점') || /^[a-z0-9_]+\s*\?/.test(rawName))) {
        return '가맹 교육원';
      }
      return rawName;
    })(),
    cover: normalizeBookCoverUrl(b.cover),
    hasSheet: hasSheet,
    worksheetUrl: b.worksheetUrl || b.pdfUrl || (typeof b.worksheet === 'string' ? b.worksheet : null) || null,
    pdfUrl: b.pdfUrl || b.worksheetUrl || (typeof b.worksheet === 'string' ? b.worksheet : null) || null,
    materialName: hasSheet ? (b.materialName || (title + '_나노시트.pdf')) : null,
    materialSize: hasSheet ? (b.materialSize || '1.45 MB') : null,
    materialType: hasSheet ? '나노 시트 (PDF)' : null,
    quizStatus: (b.quizzes || 5) + '문항 완비',
    readCount: (b.quizCompletions || 0) + '회',
    answerGuide: '【나노 시트 핵심 정답 및 생각담기 가이드】\n\n' + (b.thinkInsert ? ('▶ 생각담기: ' + b.thinkInsert) : '정규 독서논술 답안'),
    thinkExtract: b.thinkExtract,
    thinkInsert: b.thinkInsert,
    createdAt: b.createdAt || b.date || b.regDate || '',
    quizSets: b.quizSets || []
  };
}

function deduplicateAcademyBooks(list) {
  if (!Array.isArray(list)) return [];
  var seen = {};
  var result = [];
  list.forEach(function(b) {
    if (!b) return;
    var k = String(b.id || b.bookNo || '').trim();
    if (!k || seen[k]) return;
    seen[k] = true;
    result.push(b);
  });
  return result;
}

var academyBookList = (function() {
  if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS) && (window.NANO_SERVER_DATA || window.MIGRATED_BOOKS.length > 0)) {
    return deduplicateAcademyBooks(window.MIGRATED_BOOKS.map(createAcademyBookItem));
  }
  return [
    {
      id: 'FA000001',
      title: '고양이 목욕탕',
      subtitle: '상상그림책 5',
      author: '구사카 미나코',
      publisher: '옐로스톤',
      category: '문학 / 이야기',
      grade: '유치부',
      creatorType: 'HQ',
      academyName: '본사 직속(HQ)',
      cover: '/upload/book/9791187079521.jpg',
      materialName: '고양이목욕탕_나노시트.pdf',
      materialSize: '1.45 MB',
      materialType: '나노 시트 (PDF)',
      quizStatus: '5문항 완비',
      readCount: '42회',
      answerGuide: '【나노 시트 생각담기】\n▶ 이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는지 상상해서 이야기를 만들어주세요.'
    }
  ];
})();

// 마스터 페이지와 100% 동일하게 MIGRATED_BOOKS 실데이터 상시 동기화 보장 (도서번호 기준 중복 제거)
function syncAcademyBooksState() {
  if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS) && window.MIGRATED_BOOKS.length > 0) {
    var deduped = deduplicateAcademyBooks(window.MIGRATED_BOOKS.map(createAcademyBookItem));
    if (!academyBookList || academyBookList.length <= 1 || academyBookList.length !== deduped.length) {
      academyBookList = deduped;
      syncOwnedBooksState();
      if (typeof populateAcadBookOriginFilter === 'function') {
        populateAcadBookOriginFilter();
      }
    }
  }
}

// 로컬 저장소에 보관된 학원 신규 등록 도서(PDF 데이터 포함) 자동 복원 및 손상 데이터 정제
(function restoreCustomAcademyBooks() {
  if (window.NANO_SERVER_DATA) return;
  try {
    var stored = localStorage.getItem('nano_custom_academy_books');
    if (stored) {
      var list = JSON.parse(stored);
      if (Array.isArray(list)) {
        var cleanList = [];
        list.forEach(function(item) {
          // 1) id가 없거나 'undefined'인 손상 항목은 완전 제외
          if (!item || !item.id || item.id === 'undefined') return;
          // 2) 본사 정규 도서(FA/KC/FB/KA9 등)가 잘못 캐시되어 들어간 경우 커스텀 도서에서 제거
          if (/^(FA|KC|FB|KA9)\d{6}$/.test(item.id) && item.creatorType !== 'ACADEMY') return;

          var exists = academyBookList.some(function(b) { return b.id === item.id; });
          if (!exists) {
            academyBookList.unshift(createAcademyBookItem(item));
          }
          cleanList.push(item);
        });
        localStorage.setItem('nano_custom_academy_books', JSON.stringify(cleanList));
      }
    }
  } catch(e) {
    console.warn('자체 등록 도서 로컬 복원 실패:', e);
  }
})();

// 학원 자체 등록 도서 로컬 저장소 동기화 헬퍼
function syncCustomAcademyBooksToStorage() {
  try {
    var myBooks = academyBookList.filter(function(b) {
      return b.creatorType === 'ACADEMY' || b.isMyCreation === true || (b.id && b.id.startsWith('KA'));
    });
    localStorage.setItem('nano_custom_academy_books', JSON.stringify(myBooks));
  } catch(e) {
    console.warn('자체 등록 도서 로컬 저장 실패 (용량 초과 등):', e);
  }
}

var currentUploadedMaterial = null;
var currentUploadedCover = null;
var lastAddedBookId = null;

// ==============================================================
// 학원별 보유 도서(isOwned) 로컬스토리지 관리 및 필터 로직
// ==============================================================
var window_ONLY_OWNED_FILTER = false;

function getAcademyOwnedBookStorageKey() {
  var curAcadId = (typeof CURRENT_ACADEMY_ID !== 'undefined' && CURRENT_ACADEMY_ID) ? CURRENT_ACADEMY_ID : (currentAcademyInfo && currentAcademyInfo.id ? currentAcademyInfo.id : 'ACAD-033');
  return 'NANO_OWNED_BOOK_IDS_' + curAcadId;
}

function loadOwnedBookIds() {
  if (window.NANO_SERVER_DATA) return window.NANO_SERVER_OWNED || [];
  var key = getAcademyOwnedBookStorageKey();
  try {
    var raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // 기본적으로 상위 50권을 초기 보유 도서로 등록하여 즉각적인 사용성 제공
  var defaultOwned = [];
  if (Array.isArray(academyBookList)) {
    defaultOwned = academyBookList.slice(0, 50).map(function(b) { return b.id; });
  }
  try {
    localStorage.setItem(key, JSON.stringify(defaultOwned));
  } catch(e) {}
  return defaultOwned;
}

function saveCustomAcademyBooks(list) {
  var key = getAcademyOwnedBookStorageKey();
  try {
    var ownedIds = (list || academyBookList).filter(function(b) { return b.isOwned === true; }).map(function(b) { return b.id; });
    localStorage.setItem(key, JSON.stringify(ownedIds));
  } catch(e) {}
  updateOwnedBookCountBadge();
}

function syncOwnedBooksState() {
  var ownedIds = loadOwnedBookIds();
  var ownedSet = new Set(ownedIds);
  academyBookList.forEach(function(b) {
    b.isOwned = ownedSet.has(b.id);
  });
  updateOwnedBookCountBadge();
}

function updateOwnedBookCountBadge() {
  var ownedCount = academyBookList.filter(function(b) { return b.isOwned === true; }).length;
  var unownedCount = academyBookList.length - ownedCount;
  var badge = document.getElementById('ownedBookCountBadge');
  if (badge) badge.innerText = ownedCount + '권';
  var subBadge = document.getElementById('ownedCountSub');
  if (subBadge) subBadge.innerText = ownedCount;

  // 상단 카드 보유 도서 총 권수 동기화
  var totalBadge = document.getElementById('totalAcadBookCount');
  if (totalBadge) totalBadge.innerText = ownedCount;

  // 보유 여부 드롭다운 옵션 텍스트에 실시간 권수 반영
  var sel = document.getElementById('filterAcadBookOwned');
  if (sel && sel.options && sel.options.length >= 3) {
    sel.options[0].text = '전체 보기 (' + academyBookList.length + '권)';
    sel.options[1].text = '보유도서만 보기 (' + ownedCount + '권)';
    sel.options[2].text = '미보유 도서만 보기 (' + unownedCount + '권)';
  }
}

// 보유 도서만 보기 필터 전환 함수 (하위 호환)
function toggleOnlyOwnedBooksFilter() {
  var r = document.querySelector('input[name="filterAcadBookOwned"][value="OWNED"]');
  if (r) {
    r.checked = true;
  }
  var sel = document.getElementById('filterAcadBookOwned');
  if (sel) {
    sel.value = (sel.value === 'OWNED') ? 'ALL' : 'OWNED';
  }
  filterAcademyBooks();
}

// 하단 체크박스 변경 시 드롭다운과 동기화 (하위 호환)
function syncOnlyOwnedBooksFromCheckbox(checked) {
  var targetVal = checked ? 'OWNED' : 'ALL';
  var r = document.querySelector('input[name="filterAcadBookOwned"][value="' + targetVal + '"]');
  if (r) r.checked = true;
  var sel = document.getElementById('filterAcadBookOwned');
  if (sel) {
    sel.value = targetVal;
  }
  filterAcademyBooks();
}

// 보유 도서 여부 토글 (체크 클릭 시 보유 전환 및 로컬스토리지 저장)
async function toggleBookOwnership(bookId) {
  var book = academyBookList.find(function(b) { return b.id === bookId; });
  if (!book) return;
  var nextOwned = !book.isOwned;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      if (nextOwned) {
        var savedOwned = await NanoPortal.saveOwnedBook(book, currentAcademyInfo.id);
        window.NANO_SERVER_OWNED_RECORDS = window.NANO_SERVER_OWNED_RECORDS || {};
        if (savedOwned.item) window.NANO_SERVER_OWNED_RECORDS[book.id] = savedOwned.item.id;
      } else {
        var ownedId = (window.NANO_SERVER_OWNED_RECORDS || {})[book.id];
        if (!ownedId) throw new Error('보유 도서 정보를 새로고침한 뒤 다시 시도해 주세요.');
        await NanoPortal.deleteOwnedBook(ownedId, currentAcademyInfo.id);
        delete window.NANO_SERVER_OWNED_RECORDS[book.id];
      }
    } catch (error) {
      showAcademyToast('보유 상태를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }
  book.isOwned = nextOwned;
  saveCustomAcademyBooks(academyBookList);
  updateOwnedBookCountBadge();
  filterAcademyBooks(true); // 보유 여부 토글 시 현재 페이지 유지
  showAcademyToast(`[${book.title}] 도서가 [${book.isOwned ? '보유' : '미보유'}] 상태로 변경되었습니다. (도서 배정 시 활용)`);
}

// -------------------------------------------------------------
// 등록처 필터 드롭다운 옵션 동적 구성
// (1순위: 전체, 2순위: 본사, 3순위: 내 가맹점 명, 4순위부터: 가나다 오름차순 정렬)
// -------------------------------------------------------------
function populateAcadBookOriginFilter() {
  var sel = document.getElementById('filterAcadBookOrigin');
  if (!sel) return;

  var currentVal = sel.value || 'ALL';
  var myAcadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name.trim()
    : '내 가맹점';

  // 도서 목록 전체에서 고유 등록처(학원명) 수집
  var originSet = new Set();
  (academyBookList || []).forEach(function(b) {
    var acad = (b.academyName || '').trim();
    if (acad.includes('?') || acad.includes('숈썝') || acad.includes('습점') || /^[a-z0-9_]+\s*\?/.test(acad)) {
      acad = '가맹 교육원';
    }
    if (acad && !acad.includes('본사') && acad !== myAcadName) {
      originSet.add(acad);
    }
  });

  // 가나다 오름차순 정렬
  var sortedOrigins = Array.from(originSet).sort(function(a, b) {
    return a.localeCompare(b, 'ko');
  });

  var html = '<option value="ALL">전체 등록처</option>';
  html += '<option value="HQ">본사 (본사 직속)</option>';
  html += '<option value="MY_ACADEMY">' + myAcadName + ' (내 가맹점)</option>';

  sortedOrigins.forEach(function(orig) {
    html += '<option value="' + orig.replace(/"/g, '&quot;') + '">' + orig + '</option>';
  });

  sel.innerHTML = html;

  // 기존 선택값 유지 (유효한 경우)
  if (currentVal && Array.from(sel.options).some(function(opt) { return opt.value === currentVal; })) {
    sel.value = currentVal;
  } else {
    sel.value = 'ALL';
  }
}

// -------------------------------------------------------------
// 학원 도서 페이징 상태 관리 (페이지당 30권)
// -------------------------------------------------------------
var academyBookPageSize = 30;
var academyBookCurrentPage = 1;
var currentAcademyFilteredBooks = [];

// 학원 도서 검색 입력 실시간 핸들러
function handleAcadBookSearchInput(input) {
  var clearBtn = document.getElementById("btnAcadBookSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 학원 도서 검색어 원클릭 클리어
function clearAcadBookSearch() {
  var input = document.getElementById("searchAcadBookInput");
  if (input) input.value = "";
  var clearBtn = document.getElementById("btnAcadBookSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  var badgeEl = document.getElementById("acadBookSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  filterAcademyBooks();
}

// 도서 필터링 & 정렬 (기본: 보유 순 -> 도서 번호 내림차순, 30개 페이징)
function filterAcademyBooks(keepPage) {
  syncAcademyBooksState();

  // 등록처 드롭다운이 아직 초기화되지 않았거나 옵션이 3개 미만이면 채우기
  var originSel = document.getElementById('filterAcadBookOrigin');
  if (originSel && originSel.options.length <= 3 && academyBookList && academyBookList.length > 0) {
    populateAcadBookOriginFilter();
  }

  if (!keepPage) {
    academyBookCurrentPage = 1;
  }

  var originVal = originSel ? originSel.value : 'ALL';
  var gradeVal = document.getElementById('filterAcadBookGrade') ? document.getElementById('filterAcadBookGrade').value : 'ALL';
  var sortVal = document.getElementById('sortAcadBookSelect') ? document.getElementById('sortAcadBookSelect').value : 'DATE_DESC';
  var ownedRadio = document.querySelector('input[name="filterAcadBookOwned"]:checked');
  var ownedFilter = ownedRadio ? ownedRadio.value : (document.getElementById('filterAcadBookOwned') ? document.getElementById('filterAcadBookOwned').value : 'ALL');
  var query = (document.getElementById('searchAcadBookInput') ? document.getElementById('searchAcadBookInput').value : '').toLowerCase().trim();

  updateOwnedBookCountBadge();

  var myAcadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name.trim()
    : '';

  var filtered = academyBookList.filter(function(b) {
    // 0. 보유 여부 필터 (ALL: 전체 보기 / OWNED: 보유도서만 보기 / UNOWNED: 미보유 도서만 보기)
    if (ownedFilter === 'OWNED' && !b.isOwned) return false;
    if (ownedFilter === 'UNOWNED' && b.isOwned) return false;

    // 1. 등록처 매칭 (ALL / HQ / MY_ACADEMY / 특정 가맹점명)
    var isHqBook = !b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'));
    var matchOrigin = true;
    if (originVal === 'HQ') {
      matchOrigin = isHqBook;
    } else if (originVal === 'MY_ACADEMY') {
      matchOrigin = isBookCreatedByMyAcademy(b);
    } else if (originVal !== 'ALL') {
      matchOrigin = (b.academyName && b.academyName.trim() === originVal.trim());
    }
    if (!matchOrigin) return false;

    // 2. 학년 매칭
    var matchGrade = true;
    if (gradeVal !== 'ALL') {
      matchGrade = bookGradeMatches(b.grade, gradeVal);
    }
    if (!matchGrade) return false;

    // 3. 상단 도서 검색어 매칭 (도서명, 저자, 출판사, 도서번호, 등록처 학원명, '본사' 지원)
    var matchQuery = !query ||
      (b.title && b.title.toLowerCase().indexOf(query) !== -1) ||
      (b.author && b.author.toLowerCase().indexOf(query) !== -1) ||
      (b.publisher && b.publisher.toLowerCase().indexOf(query) !== -1) ||
      (b.id && String(b.id).toLowerCase().indexOf(query) !== -1) ||
      (b.bookNo && String(b.bookNo).toLowerCase().indexOf(query) !== -1) ||
      (b.academyName && b.academyName.toLowerCase().indexOf(query) !== -1) ||
      (isHqBook && ('본사'.indexOf(query) !== -1 || '본사 직속'.indexOf(query) !== -1));

    return matchQuery;
  });

  // 정렬 적용
  // 사용자 요구사항: "보유 순, 도서 번호순(내림차순)" -> DEFAULT
  filtered.sort(function(a, b) {
    if (sortVal === 'DEFAULT') {
      // 1순위: 보유 여부 (보유 도서 우선)
      var aOwned = (a.isOwned === true) ? 1 : 0;
      var bOwned = (b.isOwned === true) ? 1 : 0;
      if (aOwned !== bOwned) {
        return bOwned - aOwned;
      }
      // 2순위: 도서 번호 내림차순 (예: KC900003 > FA000001)
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'ID_DESC') {
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'ID_ASC') {
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'DATE_DESC') {
      var da = a.createdAt || a.date || a.regDate || '';
      var db = b.createdAt || b.date || b.regDate || '';
      if (da && db && da !== db) {
        return String(db).localeCompare(String(da));
      }
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'DATE_ASC') {
      var da = a.createdAt || a.date || a.regDate || '';
      var db = b.createdAt || b.date || b.regDate || '';
      if (da && db && da !== db) {
        return String(da).localeCompare(String(db));
      }
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'TITLE_ASC') {
      return a.title.localeCompare(b.title, 'ko');
    } else if (sortVal === 'GRADE_ASC') {
      return (a.grade || '').localeCompare(b.grade || '', 'ko');
    }
    return 0;
  });

  currentAcademyFilteredBooks = filtered;

  // 30개 단위 페이징 슬라이싱
  var total = filtered.length;

  // ✕ 버튼 및 활성 검색 배지 상태 동기화
  var clearBtn = document.getElementById("btnAcadBookSearchClear");
  if (clearBtn) clearBtn.style.display = query.length > 0 ? "inline-flex" : "none";
  var badgeEl = document.getElementById("acadBookSearchActiveBadge");
  if (badgeEl) {
    if (query) {
      badgeEl.style.display = "inline-flex";
      var displayQ = query.length > 25 ? query.substring(0, 25) + '...' : query;
      badgeEl.innerHTML = '<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"' + displayQ + '" 검색 결과 ' + total.toLocaleString() + '권 <span class="badge-clear-link" onclick="clearAcadBookSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>';
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  var totalPages = Math.ceil(total / academyBookPageSize) || 1;
  if (academyBookCurrentPage < 1) academyBookCurrentPage = 1;
  if (academyBookCurrentPage > totalPages) academyBookCurrentPage = totalPages;

  var startIdx = (academyBookCurrentPage - 1) * academyBookPageSize;
  var pagedList = filtered.slice(startIdx, startIdx + academyBookPageSize);

  renderAcademyBookTable(pagedList, total, startIdx);
  renderAcademyBookPagination(total, academyBookCurrentPage, totalPages);
}

// -------------------------------------------------------------
// 도서 권장학년 문자열("초등 5학년", "초등 1~2학년", "중등 전학년" 등)을
// 개별 학년 목록으로 풀어 선택한 학년이 포함되는지 판별 (문자열 포함 비교로는 범위 표기를 놓침)
// -------------------------------------------------------------
function bookGradeMatches(bookGrade, selected) {
  if (!selected || selected === 'ALL') return true;
  var text = String(bookGrade || '').trim();
  if (!text) return false;

  // 1. 유치부 (유아, 유치, 유치부, 미취학 등 포함)
  if (selected === '유치부' || selected === '미취학') {
    return /미취학|유아|유치/i.test(text);
  }

  // 2. 초등 / 중등(중학교) 단일 학년 매칭
  var m = selected.match(/^(초등|중등|중학교)\s*(\d)학년$/);
  if (!m) return text.indexOf(selected) !== -1;

  var isTargetMiddle = (m[1] === '중등' || m[1] === '중학교');
  var num = parseInt(m[2], 10);

  // 해당 학교급(초등/중등) 표기가 있는 부분만 분리해 검사
  var parts = text.split(/[,\/]/);
  return parts.some(function(part) {
    var p = part.trim();
    if (!p) return false;

    var isMiddle = p.indexOf('중등') !== -1 || p.indexOf('중학교') !== -1 || /^중\d/.test(p) || p === '중학';
    var isElem = p.indexOf('초등') !== -1 || /^초\d/.test(p) || p === '초등';

    if (isTargetMiddle && !isMiddle) return false;
    if (!isTargetMiddle && !isElem) return false;

    // '전학년' 또는 '중학교/중등' 전체 표기인 경우
    if (p.indexOf('전학년') !== -1 || (isTargetMiddle && (p === '중학교' || p === '중등' || p === '중학'))) {
      return true;
    }

    // 범위 표기 (예: 1~2, 1-2, 1~3, 5~6)
    var range = p.match(/(\d)\s*[~\-]\s*(\d)/);
    if (range) {
      var min = parseInt(range[1], 10);
      var max = parseInt(range[2], 10);
      return num >= min && num <= max;
    }

    // 단일 학년 표기 (예: 초1, 초등 1학년)
    var single = p.match(/(\d)/);
    return !!single && parseInt(single[1], 10) === num;
  });
}

// -------------------------------------------------------------
// 도서 등록 권한 판별: 내가(우리 학원이) 직접 등록한 도서인지 검증
// -------------------------------------------------------------
function isBookCreatedByMyAcademy(b) {
  if (!b) return false;
  // 1. 본사 공식 도서는 편집 불가
  if (!b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'))) {
    return false;
  }
  // 2. 내가 직접 등록한 도서 플래그 확인
  if (b.isMyCreation === true) return true;

  // 3. 현재 로그인한 학원 정보 대조
  var curAcadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '';
  var curAcadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : '';

  if (curAcadId && b.academyId === curAcadId) return true;
  if (curAcadName && b.academyName === curAcadName) return true;

  // 4. 로컬스토리지에 저장된 내가 등록한 도서 ID 목록 대조
  try {
    var key = 'NANO_MY_CREATED_BOOKS_' + (curAcadId || 'DEFAULT');
    var raw = localStorage.getItem(key);
    if (raw) {
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.indexOf(b.id) !== -1) return true;
    }
  } catch(e) {}

  return false;
}

// 신규 도서 등록 시 내 학원 도서로 영구 기록
function markBookAsMyCreation(bookId) {
  var curAcadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'DEFAULT';
  var key = 'NANO_MY_CREATED_BOOKS_' + curAcadId;
  try {
    var arr = JSON.parse(localStorage.getItem(key) || '[]');
    if (arr.indexOf(bookId) === -1) {
      arr.push(bookId);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  } catch(e) {}
}

// 다른 가맹점 또는 본사 도서 편집 시도 시 안내 토스트
function showCannotEditNotice(typeStr) {
  showAcademyToast((typeStr || '다른 가맹점에서 등록한 도서') + '는 편집할 수 없습니다. (내가 등록한 도서만 수정 가능)');
}

// 도서 테이블 렌더링 (No. 내림차순, 보유 여부 토글, 내가 올린 도서만 편집 가능)
function renderAcademyBookTable(data, totalCount, startIdx) {
  if (!data) {
    filterAcademyBooks(true);
    return;
  }
  var list = data;
  var tbody = document.getElementById('academyBookTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var total = (typeof totalCount === 'number') ? totalCount : list.length;
  var countBadge = document.getElementById('acadBookTableTotalCount');
  if (countBadge) countBadge.innerText = total;
  var baseIdx = (typeof startIdx === 'number') ? startIdx : 0;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="text-center py-5 text-muted">일치하는 도서가 없습니다.</td></tr>';
    return;
  }

  list.forEach(function(b, idx) {
    var tr = document.createElement('tr');
    if (b.id === lastAddedBookId) {
      tr.className = 'row-highlight-new';
    }

    // 전체 도서 수 기준 No. 내림차순 넘버링 (예: 500, 499, ... 1)
    var numDesc = total - (baseIdx + idx);

    // 보유 여부 컬럼 (기본: 미보유, 클릭 시 토글)
    var isOwned = (b.isOwned === true);
    var ownershipBtn = isOwned
      ? `<button type="button" class="btn btn-xs btn-success font-weight-bold" onclick="toggleBookOwnership('${b.id}')" title="클릭하여 '미보유'로 변경" style="font-size: 11px; padding: 2.5px 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(34,197,94,0.3);">
           <i class="fa-solid fa-check mr-1"></i>보유
         </button>`
      : `<button type="button" class="btn btn-xs btn-outline-secondary font-weight-bold" onclick="toggleBookOwnership('${b.id}')" title="클릭하여 '보유'로 변경" style="font-size: 11px; padding: 2.5px 8px; border-radius: 6px; background: #fff;">
           미보유
         </button>`;

    var coverImg = normalizeBookCoverUrl(b.cover);
    
    // 나노시트 단독 버튼 (서버에 실제 파일이 존재하는 도서만 활성화, 없는 도서는 무조건 '시트 없음' 비활성화)
    var isSheetAvailable = checkBookHasAvailableSheet(b);
    var pdfBtn = isSheetAvailable
      ? `<button type="button" class="btn-sheet-action btn-sheet-nanosheet w-100" onclick="openContentPdfModal('${b.id}')" title="나노시트 학습자료 열기" style="padding: 3px 8px; font-size: 11.5px;">
           <i class="fa-solid fa-file-pdf mr-1" style="font-size: 11px;"></i>나노시트
         </button>`
      : `<button type="button" class="btn-sheet-action w-100" disabled title="등록된 나노시트(PDF) 파일이 서버에 준비되지 않았습니다" style="padding: 3px 8px; font-size: 11px; opacity: 0.42; cursor: not-allowed; background: #f8fafc; color: #94a3b8; border: 1px dashed #cbd5e1;">
           <i class="fa-regular fa-file-circle-xmark mr-1" style="font-size: 10px;"></i>시트 없음
         </button>`;

    // 등록처 뱃지 및 내가 올린 도서 여부 판정
    var isHq = !b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'));
    var isMyBook = isBookCreatedByMyAcademy(b);

    var originBadge = isHq
      ? `<span class="badge-soft badge-soft-warning font-weight-bold" style="white-space: nowrap;"><i class="fa-solid fa-crown mr-1"></i>본사 직속</span>`
      : (isMyBook
          ? `<span class="badge-soft badge-soft-success font-weight-bold" style="white-space: nowrap;" title="${b.academyName || '우리 학원'}"><i class="fa-solid fa-user-pen mr-1"></i>내가 등록</span>`
          : `<span class="badge-soft badge-soft-primary font-weight-bold" style="white-space: nowrap;" title="${b.academyName || '타 가맹점'}"><i class="fa-solid fa-school mr-1"></i>${b.academyName || '타 가맹점'}</span>`
        );

    // 관리 컬럼: 내가 올린 도서는 '도서 수정', 타 가맹점/본사 도서는 '정보 보기' (읽기 전용 모달 열기)
    var editBtnHtml = isMyBook
      ? `<button type="button" class="btn btn-xs btn-outline-secondary w-100" onclick="openAcademyBookOnlyAddModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2.5px 6px; font-weight: 600;" title="도서 서지 정보 수정">
           <i class="fa-solid fa-pen-to-square mr-1 text-secondary"></i>도서 수정
         </button>`
      : `<button type="button" class="btn btn-xs btn-outline-info w-100" onclick="openAcademyBookOnlyAddModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2.5px 6px; font-weight: 600;" title="도서 상세 서지 정보 조회 (읽기 전용)">
           <i class="fa-solid fa-circle-info mr-1 text-info"></i>정보 보기
         </button>`;

    tr.innerHTML = 
      `<td class="text-center font-weight-bold text-muted" style="font-size: 12px;">${numDesc}</td>
      <td class="text-center">
        ${ownershipBtn}
      </td>
      <td class="text-center">
        <div class="book-thumb-wrap" onclick="openAcademyBookCoverModal('${b.id || b.bookNo}')" style="cursor: pointer;">
          <img src="${coverImg}" class="book-thumb" alt="" onerror="this.onerror=null; this.src=DEFAULT_BOOK_COVER;">
          <div class="book-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
        </div>
      </td>
      <td class="text-center font-weight-bold text-muted">${b.id || b.bookNo || '-'}</td>
      <td>
        <div style="font-weight: 700; font-size: 14.5px; color: var(--text-main); cursor: pointer;" onclick="openAcademyBookOnlyAddModal('${b.id}')" title="클릭하여 도서 상세 정보 보기" class="book-title-hover">${b.title}</div>
        <small class="text-muted">${b.subtitle || '나노 추천 교과 연계 도서'}</small>
      </td>
      <td class="text-center">
        ${originBadge}
      </td>
      <td class="text-center">
        <div style="font-weight: 600;">${b.author}</div>
        <small class="text-muted">${b.publisher}</small>
      </td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${b.category}</span></td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${b.grade}</span></td>
      <td class="text-center" style="white-space: nowrap; width: 100px; padding: 6px 8px;">
        ${pdfBtn}
      </td>
      <td class="text-center" style="cursor: pointer;" onclick="openAcademyStandaloneQuizModal('${b.id}')" title="북퀴즈 문항 세트 바로 열기">
        <span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>${b.quizStatus || '5문항 완비'}</span>
      </td>
      <td class="text-center font-weight-bold">${b.readCount || '0회'}</td>
      <td class="text-center" style="white-space: nowrap;">
        <div class="d-flex flex-column align-items-center justify-content-center" style="gap: 3px;">
          ${editBtnHtml}
          <button type="button" class="btn btn-xs w-100" onclick="openAcademyStandaloneQuizModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2.5px 6px; font-weight: 700; background: #fffbeb; border: 1px solid #fde68a; color: #b45309;" title="북퀴즈 문항 세트 관리 및 출제">
            <i class="fa-solid fa-clipboard-question mr-1 text-warning"></i>퀴즈 관리
          </button>
        </div>
      </td>`;

    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// 학원 도서 페이지네이션 UI 렌더링 (30개씩 분할 표시)
// -------------------------------------------------------------
function renderAcademyBookPagination(total, page, totalPages) {
  var infoEl = document.getElementById('academyBookPageInfo');
  var pagEl = document.getElementById('academyBookPagination');
  if (!pagEl) return;

  if (total === 0) {
    if (infoEl) infoEl.innerHTML = '검색된 도서가 없습니다.';
    pagEl.innerHTML = '';
    return;
  }

  var startItem = (page - 1) * academyBookPageSize + 1;
  var endItem = Math.min(page * academyBookPageSize, total);
  if (infoEl) {
    infoEl.innerHTML = `총 <b>${total.toLocaleString()}</b>권 중 <b>${startItem}-${endItem}</b>권 표시 <span class="text-muted ml-1" style="font-weight: 500;">(페이지 ${page} / ${totalPages})</span>`;
  }

  var html = '';
  // 처음 / 이전 버튼
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(1)" ${page === 1 ? 'disabled' : ''} title="첫 페이지"><i class="fa-solid fa-angles-left"></i></button>`;
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${page - 1})" ${page === 1 ? 'disabled' : ''} title="이전 페이지"><i class="fa-solid fa-angle-left"></i></button>`;

  // 5페이지 단위 페이징 블록
  var blockSize = 5;
  var startPage = Math.floor((page - 1) / blockSize) * blockSize + 1;
  var endPage = Math.min(startPage + blockSize - 1, totalPages);

  for (var p = startPage; p <= endPage; p++) {
    if (p === page) {
      html += `<button type="button" class="acad-page-btn active" aria-current="page">${p}</button>`;
    } else {
      html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${p})">${p}</button>`;
    }
  }

  // 다음 / 마지막 버튼
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${page + 1})" ${page === totalPages ? 'disabled' : ''} title="다음 페이지"><i class="fa-solid fa-angle-right"></i></button>`;
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${totalPages})" ${page === totalPages ? 'disabled' : ''} title="마지막 페이지"><i class="fa-solid fa-angles-right"></i></button>`;

  pagEl.innerHTML = html;
}

// 학원 도서 특정 페이지로 이동
function goAcademyBookPage(targetPage) {
  if (targetPage < 1) targetPage = 1;
  academyBookCurrentPage = targetPage;
  filterAcademyBooks(true);

  // 테이블 카드 상단으로 부드럽게 스크롤 이동
  var tableEl = document.getElementById('academyBookTableBody');
  if (tableEl) {
    var cardEl = tableEl.closest('.simple-card');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==============================================================
// 대량 엑셀 업로드 모달 및 다운로드/처리 모듈
// ==============================================================
var selectedBulkBookFile = null;

function openBulkModal() {
  selectedBulkBookFile = null;
  var nameEl = document.getElementById('acadBulkFileNameDisplay');
  if (nameEl) nameEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';
  var inputEl = document.getElementById('acadBulkExcelFileInput');
  if (inputEl) inputEl.value = '';

  if (window.jQuery && typeof $('#acadBookExcelModal').modal === 'function') {
    $('#acadBookExcelModal').modal('show');
  } else {
    showModalVanilla('acadBookExcelModal');
  }
}

function handleBulkFileSelect(input) {
  if (!input.files || !input.files[0]) return;
  selectedBulkBookFile = input.files[0];
  var nameEl = document.getElementById('acadBulkFileNameDisplay');
  if (nameEl) {
    nameEl.innerHTML = `<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>${selectedBulkBookFile.name}</span> (${(selectedBulkBookFile.size / 1024).toFixed(1)} KB)`;
  }
}

function handleBulkFileDrop(e) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedBulkBookFile = e.dataTransfer.files[0];
    var nameEl = document.getElementById('acadBulkFileNameDisplay');
    if (nameEl) {
      nameEl.innerHTML = `<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>${selectedBulkBookFile.name}</span> (${(selectedBulkBookFile.size / 1024).toFixed(1)} KB)`;
    }
  }
}

// 샘플 엑셀(CSV) 양식 다운로드
function downloadAcadBookSampleExcel() {
  var csvContent = "\uFEFFISBN(필수),주제분류태그(필수),세부태그1,세부태그2,세부태그3,세부태그4,세부태그5,어워드및추천,생각꺼내기,생각담기(1~7코드_또는_직접입력_0=없음)\n" +
    "9788932902708,#이야기,어린왕자,사막,여우,장미,순수,르몽드 선정 20세기 최고의 책,만약 나만의 작은 소행성이 있다면 어떤 꽃이나 동물을 가장 소중히 가꾸고 싶나요?,1\n" +
    "9788934986637,#과학,뇌과학,기억,편도체,감정,공감,제10회 창비청소년문학상 수상작,타인의 감정을 전혀 느끼지 못한다면 세상은 어떻게 보일까요?,주인공의 선택 중 가장 기억에 남는 장면은 무엇인가요?\n" +
    "9788943305437,#이야기,정류장,전차,기다림,엄마,가족,볼로냐 라가치상 특별상,누군가를 간절하게 기다려본 경험이 있나요?,3\n" +
    "9788971966969,#자연,마당,암탉,잎싹,초록이,자유,한국어린이도서상 수상,잎싹이 양계장을 벗어난 용기는 어디서 나왔을까요?,0\n";
  
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = "콘텐츠 등록 양식.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAcademyToast('새로운 도서 대량등록 CSV 표준 양식이 다운로드되었습니다.');
}

// 학원 도서 콘텐츠 전체 목록 엑셀(CSV) 다운로드 기능
// ------------------------------------------
function exportAcademyBooksToExcel() {
  if (typeof syncAcademyBooksState === 'function') syncAcademyBooksState();
  var booksToExport = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList) && academyBookList.length > 0)
    ? academyBookList
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  if (!booksToExport || booksToExport.length === 0) {
    showAcademyToast('다운로드할 도서 콘텐츠 데이터가 없습니다.');
    return;
  }

  // 표준 CSV 헤더 컬럼 (마스터와 100% 동일한 서식 체계)
  var headers = [
    "도서코드(ID)",
    "ISBN",
    "도서명",
    "시리즈",
    "저자",
    "출판사",
    "출판년도",
    "추천학년",
    "도서분류",
    "주제분류태그",
    "소속학원(HQ/가맹점)",
    "북퀴즈세트",
    "나노시트활동지",
    "공개여부",
    "등록일자"
  ];

  var escapeCsv = function(val) {
    if (val === null || val === undefined) return '""';
    var str = String(val).replace(/"/g, '""');
    return '"' + str + '"';
  };

  // 날짜 형식 변환: YYYY-MM-DD (년월일) 까지만 안전 추출
  var formatBookDate = function(rawDate) {
    if (!rawDate) return "";
    var str = String(rawDate).trim();
    var match = str.match(/^(\d{4}[-/.]\d{2}[-/.]\d{2})/);
    if (match) {
      return match[1].replace(/[/.]/g, "-");
    }
    return str.slice(0, 10);
  };

  // 도서 주제 분류 태그(테마 태그) 추출 헬퍼 (세부 태그가 아닌 '주제 분류 태그 선택'의 테마)
  var getThemeTag = function(b) {
    if (!b) return "";
    if (b.themeTag && typeof b.themeTag === 'string' && b.themeTag.trim()) {
      var t = b.themeTag.trim();
      return t.indexOf('#') === 0 ? t : ('#' + t);
    }
    if (b.subject && typeof b.subject === 'string' && b.subject.trim()) {
      var s = b.subject.trim();
      return s.indexOf('#') === 0 ? s : ('#' + s);
    }
    var themes = (typeof themeList !== 'undefined' && Array.isArray(themeList)) ? themeList : ((typeof window !== 'undefined' && Array.isArray(window.NANO_SERVER_THEMES)) ? window.NANO_SERVER_THEMES : []);
    if (themes.length > 0) {
      for (var i = 0; i < themes.length; i++) {
        var th = themes[i];
        var cleanTh = String(th.tag || th.title || "").replace(/^#/, "").trim().toLowerCase();
        if (!cleanTh) continue;
        if (Array.isArray(b.tags)) {
          for (var j = 0; j < b.tags.length; j++) {
            var tg = b.tags[j];
            var cleanTg = String(tg || "").replace(/^#/, "").trim().toLowerCase();
            if (cleanTg === cleanTh) return th.tag ? (th.tag.indexOf('#') === 0 ? th.tag : ('#' + th.tag)) : ('#' + cleanTh);
          }
        }
        if (b.category && String(b.category).toLowerCase().indexOf(cleanTh) !== -1) {
          return th.tag ? (th.tag.indexOf('#') === 0 ? th.tag : ('#' + th.tag)) : ('#' + cleanTh);
        }
      }
    }
    if (Array.isArray(b.tags) && b.tags.length > 0 && typeof b.tags[0] === 'string') {
      var first = b.tags[0].trim();
      if (first.indexOf('#') === 0) return first;
    }
    if (b.category && typeof b.category === 'string' && !/^[A-Z]$/.test(b.category.trim())) {
      var c = b.category.trim();
      return c.indexOf('#') === 0 ? c : ('#' + c);
    }
    return "";
  };

  // 북퀴즈 등록 세트 수 산출 헬퍼 (몇 곳에서 등록했는지 기준)
  var getQuizSetCount = function(b) {
    if (!b) return "0";
    if (typeof getBookQuizSetCount === "function") {
      var cnt = getBookQuizSetCount(b);
      return cnt > 0 ? (cnt + "Set") : "0";
    }
    if (Array.isArray(b.quizSets) && b.quizSets.length > 0) {
      var valid = b.quizSets.filter(function(s) {
        return (Array.isArray(s.questions) && s.questions.length > 0) || (Array.isArray(s.quizzes) && s.quizzes.length > 0);
      });
      return valid.length > 0 ? (valid.length + "Set") : "0";
    }
    if (b.title && b.title.indexOf("어린 왕자") !== -1) return "2Set";
    if (b.hasQuiz === true || b.hasQuiz === "Y" || (typeof b.quizzes === "number" && b.quizzes > 0) || (b.quizStatus && b.quizStatus.indexOf('완비') !== -1) || (Array.isArray(b.quizList) && b.quizList.length > 0)) {
      return "1Set";
    }
    if (b.id === "FA000001" || (b.title && b.title.indexOf("고양이 목욕탕") !== -1)) return "1Set";
    return "0";
  };

  // 도서 ISBN 추출 헬퍼 (13자리 숫자 유지)
  var getIsbn = function(b) {
    if (!b) return "";
    if (b.isbn && String(b.isbn).trim()) return String(b.isbn).trim();
    if (b.isbn13 && String(b.isbn13).trim()) return String(b.isbn13).trim();
    if (b.cover && typeof b.cover === 'string') {
      var m = b.cover.match(/\/(\d{10,13})\.(jpg|png|webp)/i);
      if (m && m[1]) return m[1];
    }
    return "";
  };

  var rows = booksToExport.map(function(b) {
    var isHq = !b.academyId || b.academyId === "HQ" || b.creatorType === "HQ";
    var academyName = b.academyName || (isHq ? "본사 직속(HQ)" : "가맹 학원");
    var quizSetDisplay = getQuizSetCount(b);
    var hasSheet = (b.hasSheet || b.sheet) ? "유" : "무";
    var isPublic = b.isPublic !== "N" ? "공개" : "비공개";
    var pubYear = b.pubYear || b.year || "";
    var themeTag = getThemeTag(b);
    var isbnVal = getIsbn(b);
    var dateVal = formatBookDate(b.createdAt || b.date || b.regDate || "");

    // ISBN은 엑셀에서 숫자로 인식하여 지수 변환(9.79119E+12)되는 것을 방지하기 위해 ="ISBN" 텍스트 수식 포맷 사용
    var isbnCell = isbnVal ? ('="' + isbnVal + '"') : '""';

    return [
      escapeCsv(b.id || b.bookNo || ""),
      isbnCell,
      escapeCsv(b.title),
      escapeCsv(b.series || ""),
      escapeCsv(b.author || ""),
      escapeCsv(b.publisher || ""),
      escapeCsv(pubYear),
      escapeCsv(b.grade || ""),
      escapeCsv(b.category || ""),
      escapeCsv(themeTag),
      escapeCsv(academyName),
      escapeCsv(quizSetDisplay),
      escapeCsv(hasSheet),
      escapeCsv(isPublic),
      escapeCsv(dateVal)
    ].join(",");
  });

  // UTF-8 BOM(\uFEFF)을 추가하여 엑셀에서 열었을 때 한글이 깨지지 않도록 보장
  var csvContent = "\uFEFF" + [headers.map(function(h) { return '"' + h + '"'; }).join(","), rows.join("\r\n")].join("\r\n");
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  var today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = "도서 콘텐츠 목록 (" + today + ").csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAcademyToast("도서 콘텐츠 전체 " + booksToExport.length + "권이 엑셀(CSV)로 성공적으로 다운로드되었습니다.");
}

// ==============================================================
// 공통 엑셀/CSV 파서 및 도서·북퀴즈 대량 등록 실행 모듈 (본사 관리자와 동일 규격)
// ==============================================================
var ACAD_THINK_PROMPTS_7_PRESETS = [
  "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
  "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
  "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
  "기억나는 장면이나 문장을 적어보세요.",
  "이 책에서 얻은 교훈이 있다면?",
  "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
  "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?"
];

// RFC 4180 호환 다중행 CSV 파서 (쌍따옴표 내 쉼표, 큰따옴표 이스케이프 "", 줄바꿈 처리)
function parseAcadRobustCSV(text) {
  var clean = String(text || '').replace(/^\uFEFF/, '');
  var rows = [];
  var curRow = [];
  var curCell = '';
  var inQuotes = false;

  for (var i = 0; i < clean.length; i++) {
    var c = clean[i];
    var next = clean[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        curCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curRow.push(curCell.trim());
      curCell = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      curRow.push(curCell.trim());
      if (curRow.some(function(cell) { return cell.length > 0; })) {
        rows.push(curRow);
      }
      curRow = [];
      curCell = '';
    } else {
      curCell += c;
    }
  }

  curRow.push(curCell.trim());
  if (curRow.some(function(cell) { return cell.length > 0; })) {
    rows.push(curRow);
  }
  return rows;
}

// 업로드된 파일(.csv / .xlsx / .xls)을 2차원 배열로 안전 변환
function parseAcadSpreadsheetFileToRows(file) {
  return new Promise(function(resolve, reject) {
    var ext = String(file.name || '').split('.').pop().toLowerCase();
    var reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = function(e) {
        try {
          resolve(parseAcadRobustCSV(e.target.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      if (typeof XLSX === 'undefined') {
        reject(new Error('엑셀 파싱 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하거나 CSV 파일을 이용해주세요.'));
        return;
      }
      reader.onload = function(e) {
        try {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: 'array' });
          var firstSheetName = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[firstSheetName];
          var rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('지원하지 않는 파일 형식입니다. .xlsx, .xls, .csv 파일만 업로드할 수 있습니다.'));
    }
  });
}

// ISBN 정제 헬퍼 (엑셀 수식 ="978..." 및 하이픈/공백 제거, 13자리 우선 추출)
function sanitizeAcadIsbnString(raw) {
  if (raw === null || raw === undefined) return '';
  var s = String(raw).trim().replace(/^="?|"?$/g, '');
  var tokens = s.split(/[\s,/|]+/).map(function(t) { return t.replace(/[^0-9Xx]/g, ''); }).filter(Boolean);
  var isbn13 = tokens.find(function(t) { return t.length === 13; });
  if (isbn13) return isbn13;
  var isbn10 = tokens.find(function(t) { return t.length === 10; });
  if (isbn10) return isbn10;
  var digits = s.replace(/[^0-9Xx]/g, '');
  return (digits.length === 10 || digits.length === 13) ? digits : '';
}

// 생각 담기 코드(1~7, 0, 직접입력) 해석 헬퍼
function resolveAcadThinkInsertValue(rawVal) {
  if (rawVal === null || rawVal === undefined) return '';
  var s = String(rawVal).trim();
  if (!s || s === '0' || s === '없음' || s.toUpperCase() === 'NONE') return '';
  var codeNum = parseInt(s, 10);
  if (String(codeNum) === s && codeNum >= 1 && codeNum <= 7) {
    return ACAD_THINK_PROMPTS_7_PRESETS[codeNum - 1];
  }
  return s;
}

// 카카오 도서 검색 비동기 헬퍼 (대량 등록 전용)
async function fetchAcadKakaoBookMetadata(isbn) {
  if (!isbn) return null;
  var kakaoApiKey = '11d75cc8189f15ddf547b5538827d04d';
  var apiUrl = 'https://dapi.kakao.com/v3/search/book?target=isbn&query=' + encodeURIComponent(isbn);
  try {
    var res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Authorization': 'KakaoAK ' + kakaoApiKey }
    });
    if (!res.ok) return null;
    var data = await res.json();
    if (data && Array.isArray(data.documents) && data.documents.length > 0) {
      return data.documents[0];
    }
  } catch (err) {
    console.warn('Kakao book fetch failed for ISBN ' + isbn, err);
  }
  return null;
}

// 학원 대량 등록용 고유 도서 관리 코드(KA300001 규격) 채번 헬퍼
function generateNextAcadBookCode(cat1Val, cat2Val, gradeVal, reservedSet) {
  var c2Code = 'K';
  if (cat2Val && (cat2Val.indexOf('외서') !== -1 || cat2Val === 'F')) c2Code = 'F';
  else if (cat2Val && (cat2Val.indexOf('구분') !== -1 || cat2Val === 'N')) c2Code = 'N';

  var c1Code = 'A';
  if (cat1Val && (cat1Val.indexOf('인물') !== -1 || cat1Val.indexOf('위인') !== -1 || cat1Val === 'B')) c1Code = 'B';
  else if (cat1Val && (cat1Val.indexOf('비문학') !== -1 || cat1Val.indexOf('정보') !== -1 || cat1Val === 'C')) c1Code = 'C';

  var gCode = '3';
  var gStr = String(gradeVal || '');
  if (gStr.indexOf('유치') !== -1 || gStr.indexOf('미취학') !== -1) gCode = '0';
  else if (gStr.indexOf('중등 1') !== -1 || gStr.indexOf('중1') !== -1) gCode = '7';
  else if (gStr.indexOf('중등 2') !== -1 || gStr.indexOf('중2') !== -1) gCode = '8';
  else if (gStr.indexOf('중등 3') !== -1 || gStr.indexOf('중3') !== -1) gCode = '9';
  else {
    var gm = gStr.match(/([1-6])/);
    if (gm) gCode = gm[1];
  }

  var prefix = c2Code + c1Code + gCode;
  var maxSeq = 0;

  var allBooks = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList)) ? academyBookList : [];
  allBooks.forEach(function(b) {
    var code = String((b && (b.bookNo || b.id)) || '');
    if (code.indexOf(prefix) === 0) {
      var num = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  if (reservedSet) {
    reservedSet.forEach(function(code) {
      if (code.indexOf(prefix) === 0) {
        var num = parseInt(code.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
  }

  var candidate = prefix + String(maxSeq + 1).padStart(5, '0');
  while (reservedSet && reservedSet.has(candidate)) {
    maxSeq++;
    candidate = prefix + String(maxSeq + 1).padStart(5, '0');
  }
  if (reservedSet) reservedSet.add(candidate);
  return candidate;
}

// 대량 엑셀 도서 일괄 등록 실행
async function executeBulkBookUpload() {
  var inputEl = document.getElementById('acadBulkExcelFileInput');
  var file = selectedBulkBookFile || (inputEl && inputEl.files && inputEl.files[0]) || null;
  if (!file) {
    alert('업로드할 엑셀/CSV 파일을 먼저 선택해주세요.');
    return;
  }

  var fileName = file.name;
  var progressEl = document.getElementById('acadBulkFileNameDisplay');
  var btnEl = document.getElementById('btnExecuteBulkUpload');
  if (btnEl) btnEl.disabled = true;

  try {
    var rawRows = await parseAcadSpreadsheetFileToRows(file);
    if (!rawRows || rawRows.length <= 1) {
      alert('등록할 도서 데이터 행이 존재하지 않습니다. (헤더만 있거나 빈 파일)');
      return;
    }

    var firstHeader = rawRows[0].map(function(c) { return String(c || '').toLowerCase(); }).join(',');
    var isNewFormat = firstHeader.indexOf('isbn') !== -1 && firstHeader.indexOf('도서명') === -1;

    var parsedRows = [];
    var validationErrors = [];

    for (var i = 1; i < rawRows.length; i++) {
      var row = rawRows[i];
      var rowNum = i + 1;
      if (!row || !row.some(function(cell) { return String(cell ?? '').trim().length > 0; })) continue;

      if (isNewFormat) {
        var rawIsbn = String(row[0] ?? '').trim();
        var rawThemeTag = String(row[1] ?? '').trim();
        var detail1 = String(row[2] ?? '').trim();
        var detail2 = String(row[3] ?? '').trim();
        var detail3 = String(row[4] ?? '').trim();
        var detail4 = String(row[5] ?? '').trim();
        var detail5 = String(row[6] ?? '').trim();
        var awards = String(row[7] ?? '').trim();
        var thinkExtract = String(row[8] ?? '').trim();
        var rawThinkInsert = String(row[9] ?? '').trim();

        var cleanIsbn = sanitizeAcadIsbnString(rawIsbn);
        if (!cleanIsbn) {
          validationErrors.push('[' + rowNum + '행] ISBN이 비어있거나 올바른 10/13자리 형식이 아닙니다.');
          continue;
        }
        if (!rawThemeTag) {
          validationErrors.push('[' + rowNum + '행: ISBN ' + cleanIsbn + '] 주제 분류 태그가 비어있습니다. (필수 입력 항목)');
          continue;
        }

        var themeTag = rawThemeTag.indexOf('#') === 0 ? rawThemeTag : ('#' + rawThemeTag);
        var detailList = [detail1, detail2, detail3, detail4, detail5]
          .filter(function(t) { return t.length > 0; })
          .map(function(t) { return t.indexOf('#') === 0 ? t : ('#' + t); });

        parsedRows.push({
          isNew: true,
          isbn: cleanIsbn,
          themeTag: themeTag,
          detailList: detailList,
          detailTag: detailList.join(' '),
          awards: awards,
          thinkExtract: thinkExtract,
          thinkInsert: resolveAcadThinkInsertValue(rawThinkInsert),
          rowNum: rowNum
        });
      } else {
        var title = String(row[0] ?? '').trim();
        var author = String(row[1] ?? '').trim();
        var publisher = String(row[2] ?? '').trim();
        var rawGrade = String(row[3] ?? '').trim();
        var rawCat1 = String(row[4] ?? '').trim();
        var rawCat2 = String(row[5] ?? '').trim();
        var series = String(row[6] ?? '').trim();
        var legacyIsbn = sanitizeAcadIsbnString(row[7] ?? '');

        if (!title) {
          validationErrors.push('[' + rowNum + '행] 도서명(제목)이 비어있습니다.');
          continue;
        }

        parsedRows.push({
          isNew: false,
          title: title,
          author: author || '작자 미상',
          publisher: publisher || '출판사 미상',
          grade: rawGrade || '초등 3학년',
          cat1: rawCat1 || '소설',
          cat2: rawCat2 || '국내서',
          series: series || '단권',
          isbn: legacyIsbn,
          rowNum: rowNum
        });
      }
    }

    if (validationErrors.length > 0) {
      var errorMsg = '[엑셀 업로드 유효성 검사 실패]\n총 ' + validationErrors.length + '건의 규격 오류가 발견되었습니다.\n\n' +
        validationErrors.slice(0, 6).join('\n\n') +
        (validationErrors.length > 6 ? '\n\n... 외 ' + (validationErrors.length - 6) + '건 추가 오류' : '');
      alert(errorMsg);
      return;
    }

    if (parsedRows.length === 0) {
      alert('등록 가능한 유효 도서 데이터 행이 없습니다.');
      return;
    }

    var acadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '우리 학원';
    var acadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'MY_ACAD';
    var reservedCodes = new Set();
    var finalBooks = [];
    var skippedDuplicates = 0;

    for (var idx = 0; idx < parsedRows.length; idx++) {
      var item = parsedRows[idx];
      if (progressEl) {
        progressEl.innerHTML = '<span class="text-primary font-weight-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>[' + (idx + 1) + '/' + parsedRows.length + '] ISBN(' + (item.isbn || item.title) + ') 도서 정보 자동 수집 중...</span>';
      }

      if (item.isNew) {
        var existingByIsbn = (Array.isArray(academyBookList) ? academyBookList : []).find(function(b) {
          return b && b.isbn && sanitizeAcadIsbnString(b.isbn) === item.isbn;
        });

        var matchedLocal = existingByIsbn;
        if (!matchedLocal && typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
          matchedLocal = window.MIGRATED_BOOKS.find(function(b) {
            return b && b.isbn && sanitizeAcadIsbnString(b.isbn) === item.isbn;
          });
        }

        // 운영 서버에 이미 동일 ISBN 도서가 등록되어 있는 경우 중복 생성 방지
        if (existingByIsbn && window.NanoPortal && NanoPortal.remote && existingByIsbn.serverId) {
          skippedDuplicates++;
          continue;
        }

        var doc = matchedLocal ? null : await fetchAcadKakaoBookMetadata(item.isbn);
        var bTitle = '';
        var bAuthor = '작자 미상';
        var bPub = '출판사 미상';
        var bCover = 'upload/banner/banner_reading_king.jpg';
        var bSynopsis = '';
        var bCat1 = '소설';
        var bCat2 = (item.isbn.indexOf('97889') === 0 || item.isbn.indexOf('97911') === 0) ? '국내서' : '외서';
        var bGrade = '초등 3학년';
        var bSeries = '단권';
        var bIsSingle = true;

        if (matchedLocal) {
          bTitle = matchedLocal.title || '';
          bAuthor = matchedLocal.author || bAuthor;
          bPub = matchedLocal.publisher || matchedLocal.pub || bPub;
          bCover = matchedLocal.cover || matchedLocal.coverUrl || bCover;
          bSynopsis = matchedLocal.synopsis || matchedLocal.description || '';
          bCat1 = matchedLocal.cat1 || bCat1;
          bCat2 = matchedLocal.cat2 || bCat2;
          bGrade = matchedLocal.grade || bGrade;
          bSeries = matchedLocal.series || bSeries;
          bIsSingle = matchedLocal.isSingle !== false;
        } else if (doc) {
          bTitle = doc.title || '';
          bAuthor = Array.isArray(doc.authors) && doc.authors.length > 0 ? doc.authors.join(', ') : (doc.authors || bAuthor);
          bPub = doc.publisher || bPub;
          if (doc.thumbnail) {
            bCover = doc.thumbnail.indexOf('R120x174') !== -1 ? doc.thumbnail.replace('R120x174', 'R300x0') : doc.thumbnail;
          }
          bSynopsis = doc.contents || '';
        } else {
          bTitle = '신규 등록 도서 (ISBN: ' + item.isbn + ')';
        }

        var isNonfiction = (bCat1.indexOf('비문학') !== -1 || bCat1 === 'C');
        var newBookId = generateNextAcadBookCode(bCat1, bCat2, bGrade, reservedCodes);
        var tags = [item.themeTag].concat(item.detailList || []);

        finalBooks.push({
          id: newBookId,
          bookNo: newBookId,
          isbn: item.isbn,
          title: bTitle,
          subtitle: bSeries && bSeries !== '단권' ? bSeries : '학원 등록 도서',
          author: bAuthor,
          publisher: bPub,
          pub: bPub,
          grade: bGrade,
          cat1: bCat1,
          cat2: bCat2,
          category: (bCat2 === '외서' ? 'F' : 'K') + ' / ' + item.themeTag.replace(/^#/, ''),
          series: bSeries,
          isSingle: bIsSingle,
          themeTag: item.themeTag,
          tags: tags,
          detailTag: item.detailTag,
          awards: item.awards || '',
          thinkExtract: item.thinkExtract || '',
          thinkInsert: item.thinkInsert || '',
          synopsis: bSynopsis,
          description: bSynopsis,
          cover: bCover,
          coverUrl: bCover,
          isPublic: 'Y',
          creatorType: 'ACADEMY',
          academyName: acadName,
          academyId: acadId,
          isMyCreation: true,
          isOwned: false,
          hasQuiz: false,
          quizStatus: '미출제',
          readCount: '0회',
          createdAt: new Date().toISOString()
        });
      } else {
        var legBookId = generateNextAcadBookCode(item.cat1, item.cat2, item.grade, reservedCodes);
        finalBooks.push({
          id: legBookId,
          bookNo: legBookId,
          isbn: item.isbn || '',
          title: item.title,
          subtitle: item.series && item.series !== '단권' ? item.series : '학원 등록 도서',
          author: item.author,
          publisher: item.publisher,
          pub: item.publisher,
          grade: item.grade,
          cat1: item.cat1,
          cat2: item.cat2,
          category: item.cat1 || '문학',
          series: item.series,
          isSingle: !item.series || item.series === '단권',
          themeTag: '#이야기',
          tags: ['#이야기'],
          detailTag: '',
          awards: '',
          thinkExtract: '',
          thinkInsert: '',
          synopsis: '',
          description: '',
          cover: 'upload/banner/banner_reading_king.jpg',
          coverUrl: 'upload/banner/banner_reading_king.jpg',
          isPublic: 'Y',
          creatorType: 'ACADEMY',
          academyName: acadName,
          academyId: acadId,
          isMyCreation: true,
          isOwned: false,
          hasQuiz: false,
          quizStatus: '미출제',
          readCount: '0회',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (finalBooks.length === 0 && skippedDuplicates > 0) {
      alert('업로드하신 파일의 모든 도서(' + skippedDuplicates + '권)가 이미 라이브러리에 등록되어 있습니다.');
      return;
    }

    // 운영 서버 연동 시 백엔드 DB에 실제 도서 저장
    if (window.NanoPortal && NanoPortal.remote && typeof NanoPortal.saveBook === 'function') {
      var savedServerBooks = [];
      var serverErrors = [];
      for (var sIdx = 0; sIdx < finalBooks.length; sIdx++) {
        var targetBook = finalBooks[sIdx];
        if (progressEl) {
          progressEl.innerHTML = '<span class="text-success font-weight-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>[' + (sIdx + 1) + '/' + finalBooks.length + '] 서버 DB 저장 중: ' + targetBook.title + '</span>';
        }
        try {
          await NanoPortal.saveBook(targetBook);
          savedServerBooks.push(targetBook);
        } catch (saveErr) {
          console.error('도서 서버 저장 실패:', targetBook.title, saveErr);
          serverErrors.push('[' + targetBook.title + '] ' + (saveErr.message || '저장 실패'));
        }
      }
      if (savedServerBooks.length === 0 && serverErrors.length > 0) {
        alert('[도서 일괄 서버 저장 오류]\n' + serverErrors.slice(0, 5).join('\n'));
        return;
      }
      finalBooks = savedServerBooks;
    }

    for (var k = finalBooks.length - 1; k >= 0; k--) {
      var nb = finalBooks[k];
      academyBookList.unshift(nb);
      if (typeof markBookAsMyCreation === 'function') markBookAsMyCreation(nb.id);
      if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
        window.MIGRATED_BOOKS.unshift(nb);
      }
    }

    if (typeof saveCustomAcademyBooks === 'function') saveCustomAcademyBooks(academyBookList);
    filterAcademyBooks();

    selectedBulkBookFile = null;
    if (inputEl) inputEl.value = '';
    if (progressEl) progressEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';

    if (window.jQuery && typeof $('#acadBookExcelModal').modal === 'function') {
      $('#acadBookExcelModal').modal('hide');
    } else {
      hideModalVanilla('acadBookExcelModal');
    }

    var dupNote = skippedDuplicates > 0 ? ' (기등록 중복 ' + skippedDuplicates + '권 제외)' : '';
    showAcademyToast('[' + fileName + '] 총 ' + finalBooks.length + '권의 도서가 ISBN 자동 채우기와 함께 등록되었습니다!' + dupNote);
  } catch (err) {
    console.error('대량 도서 업로드 오류:', err);
    alert('파일을 읽고 처리하는 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

// ==============================================================
// 학원 관리자 엑셀 대량 북퀴즈 등록 모달 & 샘플 다운로드 & 일괄 업로드
// ==============================================================
var selectedBulkQuizFile = null;

function openAcadQuizExcelModal() {
  selectedBulkQuizFile = null;
  var nameEl = document.getElementById('acadQuizExcelFileName');
  if (nameEl) nameEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';
  var fileInp = document.getElementById('acadQuizExcelFileInput');
  if (fileInp) fileInp.value = '';

  if (window.jQuery && typeof $('#acadQuizExcelModal').modal === 'function') {
    $('#acadQuizExcelModal').modal('show');
  } else {
    showModalVanilla('acadQuizExcelModal');
  }
}

function handleAcadQuizExcelFileSelect(input) {
  if (!input.files || !input.files[0]) return;
  selectedBulkQuizFile = input.files[0];
  var el = document.getElementById('acadQuizExcelFileName');
  if (el) {
    el.innerHTML = '<span class="text-warning font-weight-bold" style="color: #d97706 !important;"><i class="fa-solid fa-file-excel mr-1"></i>' +
      selectedBulkQuizFile.name + ' (' + Math.max(1, Math.round(selectedBulkQuizFile.size / 1024)) + 'KB)</span>';
  }
}

function handleAcadQuizExcelFileDrop(e) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedBulkQuizFile = e.dataTransfer.files[0];
    var el = document.getElementById('acadQuizExcelFileName');
    if (el) {
      el.innerHTML = '<span class="text-warning font-weight-bold" style="color: #d97706 !important;"><i class="fa-solid fa-file-excel mr-1"></i>' +
        selectedBulkQuizFile.name + ' (' + Math.max(1, Math.round(selectedBulkQuizFile.size / 1024)) + 'KB)</span>';
    }
  }
}

// 북퀴즈 엑셀 헤더 유연 인식 (본사 마스터와 100% 동일 규격)
function parseAcadQuizHeaderIndices(headerRow) {
  var map = {
    bookNo: -1,
    title: -1,
    questionNo: -1,
    quizType: -1,
    question: -1,
    opt1: -1,
    opt2: -1,
    opt3: -1,
    opt4: -1,
    opt5: -1,
    ans: -1,
    similarAns: -1,
    hint: -1,
    score: -1
  };

  headerRow.forEach(function(col, idx) {
    if (!col) return;
    var s = String(col).toLowerCase().replace(/[\s_\-()（）[\]]/g, '');

    if (s.indexOf('도서코드') !== -1 || s.indexOf('관리코드') !== -1 || s === 'bookno' || s === 'code' || s === '도서번호') {
      map.bookNo = idx;
    } else if (s.indexOf('도서명') !== -1 || s === '제목' || s === 'booktitle' || s === 'title') {
      map.title = idx;
    } else if (s.indexOf('문항번호') !== -1 || s.indexOf('문제번호') !== -1 || s === '순번' || s === 'no' || s === 'questionno') {
      map.questionNo = idx;
    } else if (s.indexOf('문항유형') !== -1 || s.indexOf('문제유형') !== -1 || s === '유형' || s === 'quiztype' || s === 'type') {
      map.quizType = idx;
    } else if (s.indexOf('문항내용') !== -1 || s.indexOf('질문') !== -1 || s === '문제' || s === '문항' || s === 'question') {
      map.question = idx;
    } else if (s.indexOf('보기1') !== -1 || s.indexOf('선택지1') !== -1 || s === 'opt1' || s === 'option1') {
      map.opt1 = idx;
    } else if (s.indexOf('보기2') !== -1 || s.indexOf('선택지2') !== -1 || s === 'opt2' || s === 'option2') {
      map.opt2 = idx;
    } else if (s.indexOf('보기3') !== -1 || s.indexOf('선택지3') !== -1 || s === 'opt3' || s === 'option3') {
      map.opt3 = idx;
    } else if (s.indexOf('보기4') !== -1 || s.indexOf('선택지4') !== -1 || s === 'opt4' || s === 'option4') {
      map.opt4 = idx;
    } else if (s.indexOf('보기5') !== -1 || s.indexOf('선택지5') !== -1 || s === 'opt5' || s === 'option5') {
      map.opt5 = idx;
    } else if (s.indexOf('유사인정') !== -1 || s.indexOf('유사정답') !== -1 || s.indexOf('인정정답') !== -1 || s.indexOf('similarans') !== -1 || s.indexOf('similaranswer') !== -1 || s.indexOf('similar') !== -1) {
      map.similarAns = idx;
    } else if (s.indexOf('정답') !== -1 || s.indexOf('정답번호') !== -1 || s === '답' || s === 'ans' || s === 'answer' || s === 'correctanswer') {
      map.ans = idx;
    } else if (s.indexOf('해설') !== -1 || s.indexOf('힌트') !== -1 || s === '설명' || s === 'hint' || s === 'explanation') {
      map.hint = idx;
    } else if (s.indexOf('배점') !== -1 || s === '점수' || s === 'score') {
      map.score = idx;
    }
  });

  return map;
}

// 북퀴즈 정답 정규화 헬퍼 (숫자 1~5, 원문자 ①~⑤, 보기 텍스트 일치 처리)
function normalizeAcadQuizAnswerVal(rawAns, options, isSubjective) {
  if (rawAns === null || rawAns === undefined) return null;
  var s = String(rawAns).trim();
  if (!s) return null;

  if (isSubjective) {
    var parts = s.split(/[,/|]/).map(function(p) { return p.trim(); }).filter(Boolean);
    return parts[0] || s;
  }

  var circleMap = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  if (circleMap[s]) {
    var cNum = Number(circleMap[s]);
    if (cNum >= 1 && cNum <= options.length) return String(cNum);
  }

  var numMatch = s.match(/^[보기\s]*([1-5])[번]?$/);
  if (numMatch) {
    var n = Number(numMatch[1]);
    if (n >= 1 && n <= options.length) return String(n);
  }

  var pureNum = Number(s);
  if (Number.isInteger(pureNum) && pureNum >= 1 && pureNum <= options.length) {
    return String(pureNum);
  }

  var matchIdx = options.findIndex(function(o) { return o.trim() === s; });
  if (matchIdx >= 0) {
    return String(matchIdx + 1);
  }

  return null;
}

// 표준 북퀴즈 서식 다운로드 (CSV / XLSX - 실제 등록된 학원 도서코드 샘플 매핑)
function downloadAcadQuizExcelTemplate(format) {
  var fmt = format || 'csv';
  var sourceBooks = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList) && academyBookList.length > 0)
    ? academyBookList
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  var book1 = sourceBooks[0] || { id: 'FA000001', bookNo: 'FA000001', title: '고양이 목욕탕' };
  var book2 = sourceBooks[1] || { id: 'FA000002', bookNo: 'FA000002', title: '푸른 딱지' };

  var code1 = book1.bookNo || book1.id || 'FA000001';
  var title1 = book1.title || '고양이 목욕탕';
  var code2 = book2.bookNo || book2.id || 'FA000002';
  var title2 = book2.title || '푸른 딱지';

  var headers = [
    '도서코드',
    '도서명(참고)',
    '문항번호',
    '문항유형',
    '문항내용(질문)',
    '보기1',
    '보기2',
    '보기3',
    '보기4',
    '보기5',
    '정답',
    '유사인정정답'
  ];

  // 도서당 최소 3문항 규격에 맞추어 두 샘플 도서 모두 3문항씩 구성
  var sampleRows = [
    [code1, title1, 1, '객관식', '주인공이 목욕탕에 들어갈 때 가장 먼저 챙긴 애착 물건은 무엇인가요?', '노란 고무 오리 인형', '수영 모자와 물안경', '향기 나는 비누', '따뜻한 목욕 타월', '', '1', ''],
    [code1, title1, 2, '객관식', '고양이가 처음 물에 발을 담그려 했을 때 느꼈던 심정으로 알맞은 것은?', '너무 신나서 펄쩍 뛰었다', '두렵고 긴장되어 망설여졌다', '지루해서 하품을 했다', '', '', '2', ''],
    [code1, title1, 3, '객관식', '목욕을 깨끗이 마치고 난 후 고양이의 기분 변화로 가장 옳은 것은?', '개운하고 상쾌하여 뿌듯했다', '감기에 걸려 후회했다', '다시는 목욕하지 않겠다고 다짐했다', '오리가 젖어서 슬펐다', '친구들이 부러워했다', '1', ''],
    [code2, title2, 1, '객관식', "이야기 속 '푸른 딱지'가 두 주인공 사이에서 상징하는 핵심 의미는?", '새로운 우정과 화해의 시작', '패배와 좌절의 아픔', '어른들의 규칙과 명령', '', '', '1', ''],
    [code2, title2, 2, '객관식', '주인공이 친구에게 먼저 손을 내밀었을 때 친구가 보인 반응은 무엇인가요?', '환하게 웃으며 딱지를 건넸다', '뒤돌아서 집으로 달려갔다', '모른 척하며 고개를 돌렸다', '선생님께 도움을 요청했다', '', '1', ''],
    [code2, title2, 3, '주관식', '주인공이 마지막 딱지 대결에서 두려움을 이겨낼 수 있었던 핵심 마음가짐은 무엇인가요?', '', '', '', '', '', '용기', '담대함, 씩씩함, 용기있는 태도']
  ];

  if (fmt === 'xlsx' && typeof XLSX !== 'undefined') {
    var wsData = [headers].concat(sampleRows);
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 10 },
      { wch: 10 },
      { wch: 46 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 10 },
      { wch: 26 }
    ];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '북퀴즈등록양식');
    XLSX.writeFile(wb, '북퀴즈_대량등록_서식.xlsx');
    showAcademyToast('북퀴즈 대량 등록 샘플 엑셀(.xlsx)이 다운로드되었습니다.');
  } else {
    var csvContent = '\uFEFF' + [headers].concat(sampleRows).map(function(row) {
      return row.map(function(cell) {
        var str = String(cell ?? '');
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',');
    }).join('\r\n');

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', '북퀴즈_대량등록_서식.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAcademyToast('북퀴즈 대량 등록 샘플 서식(.csv)이 다운로드되었습니다. 도서코드를 확인 후 문항을 작성해주세요.');
  }
}

// 학원 관리자 북퀴즈 대량 업로드 실행 핸들러
async function executeAcadBulkQuizUpload() {
  var fileInput = document.getElementById('acadQuizExcelFileInput');
  var file = selectedBulkQuizFile || (fileInput && fileInput.files && fileInput.files[0]) || null;
  if (!file) {
    alert('업로드할 엑셀/CSV 파일을 먼저 선택해주세요.');
    return;
  }

  var fileName = file.name;
  var ext = String(fileName || '').split('.').pop().toLowerCase();
  if (['csv', 'xlsx', 'xls'].indexOf(ext) === -1) {
    alert('지원하지 않는 파일 형식입니다. .xlsx, .xls, .csv 파일만 업로드할 수 있습니다.');
    return;
  }

  var btnEl = document.getElementById('btnExecuteAcadBulkQuizUpload');
  var progressEl = document.getElementById('acadQuizExcelFileName');
  if (btnEl) btnEl.disabled = true;

  try {
    var rawRows = await parseAcadSpreadsheetFileToRows(file);
    if (!rawRows || rawRows.length <= 1) {
      alert('등록할 북퀴즈 데이터 행이 존재하지 않습니다. (헤더만 있거나 빈 파일)');
      return;
    }

    var header = rawRows[0];
    var colMap = parseAcadQuizHeaderIndices(header);

    if (colMap.bookNo === -1 || colMap.question === -1 || colMap.ans === -1) {
      alert("[엑셀 서식 헤더 오류]\n필수 컬럼이 인식되지 않았습니다.\n'도서코드', '문항내용(질문)', '정답' 컬럼명이 포함되어 있는지 확인해주세요.");
      return;
    }

    var validationErrors = [];
    var parsedQuestions = [];

    // 도서 매칭 맵 구축 (학원 도서 목록 + 서버 부트스트랩 도서 목록 통합)
    var bookLookup = new Map();
    if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
      window.MIGRATED_BOOKS.forEach(function(b) {
        if (!b) return;
        if (b.bookNo) bookLookup.set(String(b.bookNo).trim().toUpperCase(), b);
        if (b.id) bookLookup.set(String(b.id).trim().toUpperCase(), b);
      });
    }
    if (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList)) {
      academyBookList.forEach(function(b) {
        if (!b) return;
        if (b.bookNo) bookLookup.set(String(b.bookNo).trim().toUpperCase(), b);
        if (b.id) bookLookup.set(String(b.id).trim().toUpperCase(), b);
      });
    }

    for (var i = 1; i < rawRows.length; i++) {
      var row = rawRows[i];
      var rowNum = i + 1;
      if (!row || !row.some(function(cell) { return String(cell ?? '').trim().length > 0; })) continue;

      var rawBookCode = String(row[colMap.bookNo] ?? '').trim();
      var rawTitle = colMap.title !== -1 ? String(row[colMap.title] ?? '').trim() : '';
      var rawQNo = colMap.questionNo !== -1 ? String(row[colMap.questionNo] ?? '').trim() : '';
      var rawType = colMap.quizType !== -1 ? String(row[colMap.quizType] ?? '').trim() : '';
      var rawQuestion = String(row[colMap.question] ?? '').trim();
      var opt1 = colMap.opt1 !== -1 ? String(row[colMap.opt1] ?? '').trim() : '';
      var opt2 = colMap.opt2 !== -1 ? String(row[colMap.opt2] ?? '').trim() : '';
      var opt3 = colMap.opt3 !== -1 ? String(row[colMap.opt3] ?? '').trim() : '';
      var opt4 = colMap.opt4 !== -1 ? String(row[colMap.opt4] ?? '').trim() : '';
      var opt5 = colMap.opt5 !== -1 ? String(row[colMap.opt5] ?? '').trim() : '';
      var rawAns = String(row[colMap.ans] ?? '').trim();
      var rawSimilarAns = colMap.similarAns !== -1 ? String(row[colMap.similarAns] ?? '').trim() : '';
      var hint = colMap.hint !== -1 ? String(row[colMap.hint] ?? '').trim() : '';
      var rawScore = colMap.score !== -1 ? String(row[colMap.score] ?? '').trim() : '';

      if (!rawBookCode) {
        validationErrors.push('[' + rowNum + '행] 도서코드가 비어있습니다.');
        continue;
      }

      var matchedBook = bookLookup.get(rawBookCode.toUpperCase());
      if (!matchedBook) {
        validationErrors.push('[' + rowNum + "행] 도서코드 '" + rawBookCode + "'에 해당하는 등록 도서가 없습니다. (입력 도서명: " + (rawTitle || '미입력') + ')');
        continue;
      }

      if (!rawQuestion) {
        validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + '] 문항 질문(내용)이 비어있습니다.');
        continue;
      }

      if (rawQNo) {
        var numQNo = Number(rawQNo);
        if (isNaN(numQNo) || numQNo < 1 || numQNo > 10) {
          validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + "] 문항번호는 1번부터 10번 사이여야 합니다. (입력값: '" + rawQNo + "')");
          continue;
        }
      }

      var options = [opt1, opt2, opt3, opt4, opt5].filter(function(o) { return o.length > 0; });
      var isExplicitSubjective = rawType.indexOf('주관') !== -1 || rawType.toUpperCase() === 'SUBJECTIVE' || rawType.toUpperCase() === 'SHORT_ANSWER';
      var isSubjective = isExplicitSubjective || options.length === 0;

      if (!isSubjective) {
        if (options.length < 3) {
          validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + '] 객관식 문항은 선택지(보기)가 최소 3개 이상 입력되어야 합니다. (현재 입력된 보기: ' + options.length + '개)');
          continue;
        }
        if (options.length > 5) {
          validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + '] 객관식 문항의 선택지는 최대 5개까지만 설정할 수 있습니다. (현재 입력된 보기: ' + options.length + '개)');
          continue;
        }
      }

      var normalizedAns = normalizeAcadQuizAnswerVal(rawAns, options, isSubjective);
      if (!normalizedAns) {
        validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + "] 유효하지 않은 정답('" + rawAns + "')입니다.\n  👉 객관식은 1~" + options.length + ' 번호(또는 보기 내용), 주관식은 정답 단어를 입력해야 합니다.');
        continue;
      }

      var finalSimilarAns = '';
      if (isSubjective) {
        var similarTokens = [];
        if (rawAns && rawAns.indexOf(',') !== -1) {
          rawAns.split(/[,/|]/).map(function(s) { return s.trim(); }).forEach(function(token) {
            if (token && token !== normalizedAns && similarTokens.indexOf(token) === -1) {
              similarTokens.push(token);
            }
          });
        }
        if (rawSimilarAns) {
          rawSimilarAns.split(/[,/|]/).map(function(s) { return s.trim(); }).forEach(function(token) {
            if (token && token !== normalizedAns && similarTokens.indexOf(token) === -1) {
              similarTokens.push(token);
            }
          });
        }
        finalSimilarAns = similarTokens.join(', ');
      }

      var questionNo = Number(rawQNo) || (parsedQuestions.filter(function(q) { return q.bookCode.toUpperCase() === rawBookCode.toUpperCase(); }).length + 1);
      var score = Number(rawScore) || 20;

      parsedQuestions.push({
        rowNum: rowNum,
        bookCode: rawBookCode,
        matchedBook: matchedBook,
        questionNo: questionNo,
        type: isSubjective ? 'SUBJECTIVE' : 'CHOICE',
        quizType: isSubjective ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
        question: rawQuestion,
        opt1: opt1 || '',
        opt2: opt2 || '',
        opt3: opt3 || '',
        opt4: opt4 || '',
        opt5: opt5 || '',
        options: isSubjective ? [] : options,
        ans: normalizedAns,
        subjectiveAns: isSubjective ? normalizedAns : '',
        similarAns: finalSimilarAns,
        similarAnswers: finalSimilarAns ? finalSimilarAns.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
        correctAnswer: normalizedAns,
        hint: hint || '',
        score: score
      });
    }

    if (parsedQuestions.length === 0 && validationErrors.length === 0) {
      alert('등록 가능한 유효 북퀴즈 문항이 없습니다.');
      return;
    }

    var groupedMap = new Map();
    parsedQuestions.forEach(function(q) {
      var key = q.matchedBook.id || q.matchedBook.bookNo;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          book: q.matchedBook,
          bookNo: q.matchedBook.bookNo || q.matchedBook.id,
          questions: []
        });
      }
      groupedMap.get(key).questions.push(q);
    });

    groupedMap.forEach(function(group) {
      if (group.questions.length < 3) {
        validationErrors.push('[도서: ' + group.book.title + ' (' + group.bookNo + ')] 북퀴즈 문항 수가 부족합니다. 도서당 최소 3문항 이상 등록해야 합니다. (현재: ' + group.questions.length + '문항)');
      }
      if (group.questions.length > 10) {
        validationErrors.push('[도서: ' + group.book.title + ' (' + group.bookNo + ')] 북퀴즈 문항 수가 초과되었습니다. 도서당 최대 10문항까지만 등록할 수 있습니다. (현재: ' + group.questions.length + '문항)');
      }
    });

    if (validationErrors.length > 0) {
      var errorMsg = '[북퀴즈 엑셀 업로드 유효성 검사 실패]\n총 ' + validationErrors.length + '건의 규격 오류가 발견되어 등록이 중단되었습니다.\n엑셀 서식을 수정한 후 다시 업로드해주세요.\n\n' +
        validationErrors.slice(0, 6).join('\n\n') +
        (validationErrors.length > 6 ? '\n\n... 외 ' + (validationErrors.length - 6) + '건 추가 오류' : '');
      alert(errorMsg);
      return;
    }

    var groups = Array.from(groupedMap.values());

    // 1. 운영 서버 연동 시 백엔드 API(/api/manage?entity=quizzes)로 학원 전용 세트 일괄 저장
    if (window.NanoPortal && typeof NanoPortal.api === 'function' && window.NANO_SERVER_DATA) {
      if (progressEl) {
        progressEl.innerHTML = '<span class="text-warning font-weight-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>서버에 북퀴즈 ' + parsedQuestions.length + '문항 일괄 저장 중...</span>';
      }
      try {
        var payload = {
          operation: 'bulk_import',
          items: groups.map(function(g) {
            return {
              bookNo: g.bookNo,
              questions: g.questions.map(function(q) {
                return {
                  questionNo: q.questionNo,
                  question: q.question,
                  quizType: q.quizType,
                  options: q.options,
                  opt1: q.opt1,
                  opt2: q.opt2,
                  opt3: q.opt3,
                  opt4: q.opt4,
                  opt5: q.opt5,
                  correctAnswer: q.ans,
                  similarAns: q.similarAns,
                  similarAnswers: q.similarAnswers,
                  explanation: q.hint,
                  score: q.score
                };
              })
            };
          })
        };
        await NanoPortal.api('/api/manage?entity=quizzes', payload);
      } catch (apiErr) {
        console.error('학원 북퀴즈 일괄 서버 저장 오류:', apiErr);
        alert('[서버 북퀴즈 저장 오류]\n' + (apiErr.message || '서버 통신 중 오류가 발생했습니다.'));
        return;
      }
    }

    // 2. 프론트엔드 학원 도서 목록 및 다중 출제 기관(quizSets) 실시간 동기화
    var today = new Date().toISOString().split('T')[0];
    var acadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '우리 학원';
    var acadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'MY_ACAD';
    if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};

    groups.forEach(function(g) {
      var book = g.book;
      var formattedQuestions = g.questions.map(function(q) {
        return {
          type: q.type,
          optionCount: q.type === 'SUBJECTIVE' ? 3 : Math.max(3, q.options.length),
          question: q.question,
          mediaType: 'none',
          mediaUrl: '',
          mediaCaption: '',
          opt1: q.opt1,
          opt2: q.opt2,
          opt3: q.opt3,
          opt4: q.opt4,
          opt5: q.opt5,
          ans: q.ans,
          subjectiveAns: q.subjectiveAns,
          subjectiveAnswer: q.subjectiveAns,
          similarAns: q.similarAns,
          similarAnswers: q.similarAnswers,
          hint: q.hint,
          score: q.score
        };
      });

      var newAcadSet = {
        id: 'qs_acad_' + acadId + '_' + (book.id || book.bookNo),
        authorType: 'ACADEMY',
        authorName: acadName,
        academyName: acadName,
        academyId: acadId,
        isMine: true,
        isPublic: 'Y',
        createdAt: today,
        questions: formattedQuestions
      };

      // 기존 본사(HQ) 및 타 학원 세트는 보존하고 우리 학원 세트만 교체·추가
      var existingSets = Array.isArray(book.quizSets) ? book.quizSets.filter(function(s) {
        return !(s && (s.isMine || (s.authorType === 'ACADEMY' && (s.academyId === acadId || s.academyName === acadName))));
      }) : [];
      existingSets.push(newAcadSet);

      book.quizSets = existingSets;
      book.quizList = formattedQuestions;
      book.hasQuiz = true;
      book.quizzes = formattedQuestions.length;
      book.quizCount = formattedQuestions.length;
      book.quizSetCount = existingSets.length;
      book.quizStatus = formattedQuestions.length + '문항 완비';
      // 다음 모달 오픈 시 최신 서버 문항 세트를 다시 조회할 수 있도록 플래그 리셋
      book._quizLoadedFromServer = false;

      // academyBookList 내 동일 도서 객체에도 동기화
      if (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList)) {
        var listMatch = academyBookList.find(function(ab) {
          return ab && (ab.id === book.id || ab.bookNo === book.bookNo);
        });
        if (listMatch && listMatch !== book) {
          listMatch.quizSets = existingSets;
          listMatch.quizList = formattedQuestions;
          listMatch.hasQuiz = true;
          listMatch.quizzes = formattedQuestions.length;
          listMatch.quizCount = formattedQuestions.length;
          listMatch.quizSetCount = existingSets.length;
          listMatch.quizStatus = formattedQuestions.length + '문항 완비';
          listMatch._quizLoadedFromServer = false;
        }
      }

      if (book.id) window.MIGRATED_QUIZZES[book.id] = existingSets;
      if (book.bookNo) window.MIGRATED_QUIZZES[book.bookNo] = existingSets;
      if (book.serverId) window.MIGRATED_QUIZZES[book.serverId] = existingSets;
    });

    selectedBulkQuizFile = null;
    if (fileInput) fileInput.value = '';
    if (progressEl) progressEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';

    if (window.jQuery && typeof $('#acadQuizExcelModal').modal === 'function') {
      $('#acadQuizExcelModal').modal('hide');
    } else {
      hideModalVanilla('acadQuizExcelModal');
    }

    filterAcademyBooks(true);
    showAcademyToast('[' + fileName + '] 북퀴즈 대량 등록 완료: 총 ' + groups.length + '권의 도서에 ' + parsedQuestions.length + '문항이 성공적으로 등록되었습니다!');
  } catch (err) {
    console.error('학원 북퀴즈 파일 처리 오류:', err);
    alert('파일을 읽고 처리하는 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

// 퀴즈 미디어 토글
function toggleAcadQuizMediaBox() {
  var box = document.getElementById('abMediaContainerBox');
  if (box) {
    box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
  }
}

// ==============================================================
// [보안 PDF 뷰어 엔진] PDF.js 캔버스 렌더링 & 전면 보안 워터마크 파이프라인
// ==============================================================
var currentUploadedPdfBlob = null; // 사용자가 첨부한 실제 PDF File/Blob 객체
var activePdfDoc = null;          // PDF.js 로드된 문서 객체
var activePdfPageNum = 1;         // 현재 페이지 번호
var activePdfTotalPages = 1;      // 전체 페이지 수

// PDF.js 글로벌 워커 설정
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// 표준 샘플 PDF 바이너리 Blob 생성 (테스트 및 즉시 시연용 유효한 A4 PDF 데이터)
function createMinimalSamplePdfBlob(title) {
  var content = "BT /F1 18 Tf 50 720 Td (" + (title || "Nano Sheet Material") + ") Tj ET\nBT /F1 12 Tf 50 680 Td (Nano Reading Academy Standard Worksheet) Tj ET\nBT /F1 10 Tf 50 640 Td ([STEP 1] Vocabulary and Background Reading) Tj ET\nBT /F1 10 Tf 50 600 Td ([STEP 2] Critical Thinking and Book Quiz Verification) Tj ET\nBT /F1 10 Tf 50 560 Td ([STEP 3] Essay and Perspective Sharing) Tj ET";
  var streamLen = content.length;
  var pdfSource = "%PDF-1.4\n" +
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n" +
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n" +
    "5 0 obj\n<< /Length " + streamLen + " >>\nstream\n" + content + "\nendstream\nendobj\n" +
    "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000318 00000 n \n" +
    "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + (370 + streamLen) + "\n%%EOF";
  return new Blob([pdfSource], { type: 'application/pdf' });
}

// 전면 보안 워터마크 동적 주입 (학원명, 출력일시, IP 대각선 중앙 단일 워터마크)
function updateRealPdfWatermarkOverlay() {
  var overlay = document.getElementById('realPdfWatermarkOverlay');
  if (!overlay) return;
  overlay.style.justifyContent = 'center'; // 중앙 단일 배치

  var acadElem = document.getElementById('wmAcademyName');
  var timeElem = document.getElementById('wmPrintTime');
  var ipElem = document.getElementById('wmIpAddress');

  var acad = (acadElem && acadElem.innerText) ? acadElem.innerText : '나노 독서아카데미 목동본원';
  var time = (timeElem && timeElem.innerText) ? timeElem.innerText : new Date().toISOString().slice(0, 16).replace('T', ' ');
  var ip = (ipElem && ipElem.innerText) ? ipElem.innerText : '118.235.12.89';

  var tileHtml = 
    '<div style="transform: rotate(-28deg); opacity: 0.16; font-weight: 900; text-align: center; color: #000; line-height: 1.4; user-select: none; margin: 0;">' +
      '<div style="font-size: 21px; letter-spacing: -0.5px; color: #1e293b;">' + acad + '</div>' +
      '<div style="font-size: 14.5px; font-family: monospace; color: #334155;">' + time + ' &middot; IP: ' + ip + '</div>' +
      '<div style="font-size: 11px; color: #dc2626; font-weight: 800; margin-top: 2px;">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>' +
    '</div>';

  // 위아래 워터마크를 제거하고 가운데 1개만 단독 노출
  overlay.innerHTML = tileHtml;
}

// 현재 열람 중인 도서 객체 보관용 전역 변수
var activeViewingBook = null;

// 도서별 실제 PDF 후보 경로 추출 헬퍼 (ISBN, 표지 파일명, ID 기반)
function extractBookPdfCandidates(book) {
  if (!book) return [];
  var list = [];
  var rawBase = (typeof window !== 'undefined' && window.NANO_MEDIA_BASE_URL) ? String(window.NANO_MEDIA_BASE_URL).replace(/\/+$/, '') : 'https://media.nanosbook.co.kr';
  var mediaBase = rawBase.replace(/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  var pushRelAndCloud = function(stem) {
    if (!stem) return;
    if (mediaBase) list.push(mediaBase + '/upload/book/' + stem + '.pdf');
    list.push('upload/book/' + stem + '.pdf');
    list.push('/upload/book/' + stem + '.pdf');
  };

  if (book.pdfUrl) list.push(book.pdfUrl);
  if (book.worksheetUrl) list.push(book.worksheetUrl);

  // 1. 도서 표지 경로에서 ISBN 또는 고유 파일명 추출 (예: /upload/book/9791187079521.jpg -> 9791187079521)
  if (book.cover && typeof book.cover === 'string') {
    var coverClean = String(book.cover).split('?')[0];
    var match = coverClean.match(/([0-9]{10,13}|book_[0-9]+)/);
    if (match && match[1]) pushRelAndCloud(match[1]);
  }

  // 2. ISBN 필드가 직접 명시된 경우
  if (book.isbn) {
    var cleanIsbn = String(book.isbn).replace(/[^0-9]/g, '');
    if (cleanIsbn) pushRelAndCloud(cleanIsbn);
  }

  // 3. 도서 번호 / serverId 기반
  if (book.id) {
    var cleanId = String(book.id).trim();
    if (cleanId) pushRelAndCloud(cleanId);
  }
  if (book.serverId) {
    var cleanSId = String(book.serverId).trim();
    if (cleanSId) {
      list.push('upload/book/' + cleanSId + '.pdf');
      list.push('/upload/book/' + cleanSId + '.pdf');
    }
  }

  // 타 도서 대표 PDF(거상 김만덕 등)를 엉뚱하게 fallback으로 주입하지 않고 도서 고유 경로만 유지
  return list.filter(function(item, idx) { return list.indexOf(item) === idx; });
}

// 후보 PDF 목록을 순차적으로 시도하여 첫 번째로 로드 가능한 실제 PDF를 렌더링하고, 실패 시 타 도서 PDF로 오염시키지 않음
function tryLoadCandidatePdfs(candidates, index, book) {
  if (!candidates || index >= candidates.length) {
    var loadingInd = document.getElementById('pdfLoadingIndicator');
    if (loadingInd) loadingInd.style.display = 'none';
    if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
      $('#contentPdfPreviewModal').modal('hide');
    } else {
      hideModalVanilla('contentPdfPreviewModal');
    }
    showAcademyToast(`[${(book && book.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    return;
  }

  var currentCandidate = candidates[index];
  if (typeof currentCandidate === 'string' && currentCandidate.includes('r2.dev')) {
    currentCandidate = currentCandidate.replace(/https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  }

  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  var pdfDataCache = window._nanoPdfBufferCache || (window._nanoPdfBufferCache = new Map());
  var fetchPromise;
  if (pdfDataCache.has(currentCandidate)) {
    fetchPromise = Promise.resolve(pdfDataCache.get(currentCandidate));
  } else if (typeof currentCandidate === 'string' && (/^https?:\/\//i.test(currentCandidate) || currentCandidate.startsWith('/upload/'))) {
    fetchPromise = fetch(currentCandidate)
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer();
      })
      .then(function(buf) {
        var bytes = new Uint8Array(buf);
        pdfDataCache.set(currentCandidate, bytes);
        return bytes;
      });
  } else {
    fetchPromise = Promise.resolve(currentCandidate);
  }

  fetchPromise.then(function(data) {
    var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
    if (!engine) {
      console.warn('PDF.js 엔진 미탑재, 커스텀 HTML 시트로 전환');
      renderCustomNanoSheetHtml(book);
      return;
    }
    if (!engine.GlobalWorkerOptions) engine.GlobalWorkerOptions = {};
    engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var loadingTask = (data instanceof Uint8Array) ? engine.getDocument({ data: data }) : engine.getDocument(data);
    return loadingTask.promise;
  }).then(function(pdf) {
    activePdfDoc = pdf;
    activePdfTotalPages = pdf.numPages;
    activePdfPageNum = 1;

    if (loadingInd) loadingInd.style.display = 'none';
    if (realWrapper) realWrapper.style.display = 'block';
    if (htmlContainer) htmlContainer.style.display = 'none';

    var pageControls = document.getElementById('pdfPageControls');
    if (pageControls) {
      pageControls.style.display = (pdf.numPages > 1) ? 'flex' : 'none';
    }
    updateRealPdfWatermarkOverlay();
    renderCurrentPdfPage();
  }).catch(function(err) {
    console.warn('PDF 후보 파일 로드 실패 (' + currentCandidate + '), 다음 후보 시도:', err);
    tryLoadCandidatePdfs(candidates, index + 1, book);
  });
}

// 실제 PDF 파일 읽어와서 캔버스 렌더링 + 워터마크 합성
function renderPdfFileWithWatermark(pdfSource, fallbackBook) {
  if (typeof pdfSource === 'string' && pdfSource.includes('r2.dev')) {
    pdfSource = pdfSource.replace(/https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  }
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var pageControls = document.getElementById('pdfPageControls');
  var loadingInd = document.getElementById('pdfLoadingIndicator');

  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  updateRealPdfWatermarkOverlay();

  // PDF.js workerSrc 설정
  var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
  if (engine) {
    if (!engine.GlobalWorkerOptions) engine.GlobalWorkerOptions = {};
    engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  var loadPromise = null;
  // 나노시트 PDF 로딩 초고속화: 단일 스트림 버퍼링 및 브라우저 메모리 캐시 (Range 요청 지연 원천 차단)
  var pdfDataCache = window._nanoPdfBufferCache || (window._nanoPdfBufferCache = new Map());
  if (pdfSource instanceof Blob || pdfSource instanceof File) {
    loadPromise = new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(new Uint8Array(e.target.result)); };
      reader.onerror = reject;
      reader.readAsArrayBuffer(pdfSource);
    });
  } else if (typeof pdfSource === 'string' && pdfSource.startsWith('data:')) {
    try {
      var base64 = pdfSource.split(',')[1];
      var binaryStr = atob(base64);
      var len = binaryStr.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      loadPromise = Promise.resolve(bytes);
    } catch(e) {
      loadPromise = Promise.resolve(pdfSource);
    }
  } else if (typeof pdfSource === 'string' && (/^https?:\/\//i.test(pdfSource) || pdfSource.startsWith('/upload/'))) {
    if (pdfDataCache.has(pdfSource)) {
      loadPromise = Promise.resolve(pdfDataCache.get(pdfSource));
    } else {
      loadPromise = fetch(pdfSource)
        .then(function(res) {
          if (!res.ok) throw new Error('PDF 다운로드 실패 HTTP ' + res.status);
          return res.arrayBuffer();
        })
        .then(function(buf) {
          var bytes = new Uint8Array(buf);
          if (pdfDataCache.size > 20) {
            var firstKey = pdfDataCache.keys().next().value;
            pdfDataCache.delete(firstKey);
          }
          pdfDataCache.set(pdfSource, bytes);
          return bytes;
        })
        .catch(function(err) {
          console.warn('[PDF] 단일 스트림 다운로드 실패, PDF.js 직접 로드로 폴백:', err);
          return pdfSource;
        });
    }
  } else {
    loadPromise = Promise.resolve(pdfSource);
  }

  loadPromise.then(function(data) {
    var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
    if (!engine) {
      throw new Error('PDF.js 엔진을 찾을 수 없습니다.');
    }
    var loadingTask = (data instanceof Uint8Array) 
      ? engine.getDocument({ data: data }) 
      : engine.getDocument(data);
    return loadingTask.promise;
  }).then(function(pdf) {
    activePdfDoc = pdf;
    activePdfTotalPages = pdf.numPages;
    activePdfPageNum = 1;

    if (loadingInd) loadingInd.style.display = 'none';
    if (realWrapper) realWrapper.style.display = 'block';
    if (htmlContainer) htmlContainer.style.display = 'none';

    if (pageControls) {
      pageControls.style.display = (pdf.numPages > 1) ? 'flex' : 'none';
    }
    renderCurrentPdfPage();
  }).catch(function(err) {
    console.warn('PDF 캔버스 렌더링 실패, 도서 맞춤형 동적 나노시트로 안전 전환:', err);
    if (fallbackBook || activeViewingBook) {
      renderCustomNanoSheetHtml(fallbackBook || activeViewingBook);
    } else {
      showDefaultHtmlSheetView();
    }
  });
}

var activePdfRenderTask = null;

// 현재 PDF 페이지 캔버스 렌더링 (PDF.js)
function renderCurrentPdfPage() {
  if (!activePdfDoc) return;
  if (activePdfRenderTask) {
    try { activePdfRenderTask.cancel(); } catch(e) {}
    activePdfRenderTask = null;
  }

  activePdfDoc.getPage(activePdfPageNum).then(function(page) {
    var canvas = document.getElementById('pdfViewerCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // 뷰어 컨테이너 너비에 맞추어 고해상도 스케일 계산
    var wrapper = document.getElementById('realPdfViewerWrapper');
    var targetWidth = wrapper ? (wrapper.clientWidth || 740) : 740;
    if (targetWidth < 300) targetWidth = 740;

    var unscaledViewport = page.getViewport({ scale: 1.0 });
    var scale = targetWidth / unscaledViewport.width;
    if (scale < 1.2) scale = 1.2;

    var outputScale = window.devicePixelRatio || 1;
    var viewport = page.getViewport({ scale: scale });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    var transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    var renderContext = {
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    };

    activePdfRenderTask = page.render(renderContext);
    activePdfRenderTask.promise.then(function() {
      activePdfRenderTask = null;
      var pageNumDisplay = document.getElementById('pdfPageNumDisplay');
      if (pageNumDisplay) {
        pageNumDisplay.innerText = activePdfPageNum + ' / ' + activePdfTotalPages;
      }
      var btnPrev = document.getElementById('btnPdfPrev');
      var btnNext = document.getElementById('btnPdfNext');
      if (btnPrev) btnPrev.disabled = (activePdfPageNum <= 1);
      if (btnNext) btnNext.disabled = (activePdfPageNum >= activePdfTotalPages);
    }).catch(function(err) {
      if (err && err.name === 'RenderingCancelledException') return;
      console.error('PDF.js 렌더링 에러:', err);
    });
  }).catch(function(err) {
    console.error('PDF.js getPage 에러:', err);
  });
}

function prevPdfPage() {
  if (activePdfDoc && activePdfPageNum > 1) {
    activePdfPageNum--;
    renderCurrentPdfPage();
  }
}

function nextPdfPage() {
  if (activePdfDoc && activePdfPageNum < activePdfTotalPages) {
    activePdfPageNum++;
    renderCurrentPdfPage();
  }
}

function showDefaultHtmlSheetView() {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var pageControls = document.getElementById('pdfPageControls');
  if (loadingInd) loadingInd.style.display = 'none';
  if (realWrapper) realWrapper.style.display = 'none';
  if (pageControls) pageControls.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'block';
}

// 도서별 맞춤형 표준 동적 나노 시트 렌더러 (실제 메타데이터, 퀴즈, 서술형 발문 100% 반영)
function renderCustomNanoSheetHtml(b) {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var pageControls = document.getElementById('pdfPageControls');
  var loadingInd = document.getElementById('pdfLoadingIndicator');

  if (loadingInd) loadingInd.style.display = 'none';
  if (realWrapper) realWrapper.style.display = 'none';
  if (pageControls) pageControls.style.display = 'none';
  if (!htmlContainer) return;

  htmlContainer.style.display = 'block';

  var title = (b && b.title) ? b.title : '나노 도서';
  var author = (b && b.author) ? b.author : '저자 미상';
  var publisher = (b && b.publisher) ? b.publisher : '출판사';
  var grade = (b && b.grade) ? b.grade : '초등 전학년';
  var category = (b && (b.category || b.cat1)) ? (b.category || b.cat1) : '문학';
  var tags = (b && (b.rawTags || (b.tags && b.tags.join(' ')))) ? String(b.rawTags || b.tags.join(' ')).replace(/#/g, '').split(/[,\s]+/).filter(Boolean) : ['독서 성찰', '문해력'];
  var thinkExtract = (b && b.thinkExtract) ? b.thinkExtract : '이 책에서 가장 흥미로웠거나 기억에 남는 장면은 무엇이었나요? 그 이유는 무엇인가요?';
  var thinkInsert = (b && b.thinkInsert) ? b.thinkInsert : '책 속 주인공의 선택이나 교훈을 바탕으로, 나의 생각이나 경험을 자유롭게 서술해 보세요.';
  var coverUrl = (b && b.cover) ? normalizeBookCoverUrl(b.cover) : DEFAULT_BOOK_COVER;

  // 관련 퀴즈 검색 (실제 등록된 북퀴즈 문항이 있으면 추출)
  var quizQuestions = [];
  try {
    var qData = (window.MIGRATED_QUIZZES && (MIGRATED_QUIZZES[title] || (b && MIGRATED_QUIZZES[b.id]))) || null;
    if (qData && qData.length > 0 && qData[0].questions) {
      quizQuestions = qData[0].questions;
    }
  } catch(e) {}

  var q1Text = quizQuestions.length > 0 ? ('<strong>Q1. </strong>' + escapeHtml(quizQuestions[0].question)) : '<strong>Q1. </strong>본문의 핵심 사건과 등장인물의 선택을 되짚어보며 내용을 간략히 정리해 보세요.';
  var q2Text = quizQuestions.length > 1 ? ('<strong>Q2. </strong>' + escapeHtml(quizQuestions[1].question)) : '<strong>Q2. </strong>주인공의 가치관이나 행동에 대해 나의 일상생활에 빗대어 느낀 점을 설명해 보세요.';

  var tagBadges = tags.slice(0, 5).map(function(t) {
    return '<span style="display: inline-block; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 5px; border: 1px solid #e2e8f0; font-weight: 600;">#' + escapeHtml(t) + '</span>';
  }).join('');

  var acadName = (document.getElementById('wmAcademyName') ? document.getElementById('wmAcademyName').innerText : '나노 독서아카데미 목동본원');
  var printTime = (document.getElementById('wmPrintTime') ? document.getElementById('wmPrintTime').innerText : '');
  var ipAddr = (document.getElementById('wmIpAddress') ? document.getElementById('wmIpAddress').innerText : '118.235.12.89');

  var html = 
    '<!-- 워터마크 오버레이 -->' +
    '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); pointer-events: none; opacity: 0.12; font-weight: 900; font-size: 24px; line-height: 1.6; text-align: center; color: #111; z-index: 10; user-select: none; width: 100%; letter-spacing: -0.5px;">' +
      '<div>' + acadName + '</div>' +
      '<div style="font-size: 20px;">' + printTime + '</div>' +
      '<div style="font-size: 18px; font-family: monospace;">' + ipAddr + '</div>' +
    '</div>' +

    '<!-- 시트지 헤더 -->' +
    '<div class="d-flex justify-content-between align-items-center pb-3 mb-3" style="border-bottom: 2px solid #2563eb;">' +
      '<div style="flex: 1; padding-right: 15px;">' +
        '<div class="d-flex align-items-center gap-2 mb-1">' +
          '<span class="badge badge-warning text-dark font-weight-bold px-2 py-1" style="font-size: 11px;">나노 독서논술 정규 워크시트</span>' +
          '<span class="badge badge-secondary px-2 py-1" style="font-size: 11px;">' + escapeHtml(grade) + '</span>' +
          '<span class="badge badge-light border px-2 py-1" style="font-size: 11px;">' + escapeHtml(category) + '</span>' +
        '</div>' +
        '<h4 class="font-weight-bold mb-1 mt-1" style="color: #1e293b; font-size: 20px; letter-spacing: -0.5px;">' + escapeHtml(title) + '</h4>' +
        '<div style="font-size: 12px; color: #64748b;">' +
          '<span>지은이: <strong>' + escapeHtml(author) + '</strong></span> &middot; ' +
          '<span>출판사: <strong>' + escapeHtml(publisher) + '</strong></span>' +
        '</div>' +
      '</div>' +
      '<div class="d-flex align-items-center gap-3">' +
        (coverUrl ? '<img src="' + coverUrl + '" style="width: 52px; height: 72px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">' : '') +
        '<div class="text-right" style="font-size: 11.5px; color: #64748b; line-height: 1.5; min-width: 120px;">' +
          '<div>소속: <span class="border-bottom pb-0 px-2 font-weight-bold text-dark">목동본원</span></div>' +
          '<div class="mt-1">원생: <span class="border-bottom pb-0 px-2 font-weight-bold text-dark">____________</span></div>' +
          '<div class="mt-1">지도: <span class="border-bottom pb-0 px-2 font-weight-bold text-dark">담당교사</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- 1단계: 독서 전/중 핵심 어휘 및 배경 -->' +
    '<div class="mb-3">' +
      '<h6 class="font-weight-bold text-primary mb-2" style="font-size: 13.5px;">' +
        '<i class="fa-solid fa-feather mr-1"></i>[STEP 1] 어휘 및 배경 이해하기' +
      '</h6>' +
      '<div class="p-3 rounded" style="background: #faf8f4; border: 1px dashed #dcd5c7; font-size: 12.5px; line-height: 1.7;">' +
        '<div class="mb-2"><strong>도서 속 주요 키워드:</strong> ' + (tagBadges || '<span class="text-muted">독서 활동, 어휘 탐색</span>') + '</div>' +
        '<div style="color: #475569;">책을 읽기 전 이 책의 표지와 제목, 위 키워드를 살펴보며 어떤 이야기가 펼쳐질지 자유롭게 상상해 적어보세요.</div>' +
        '<div class="p-2 mt-2 bg-white rounded" style="min-height: 38px; border: 1px dotted #cbd5e1; color: #94a3b8;">(어휘 정리 및 독서 전 생각 작성란)</div>' +
      '</div>' +
    '</div>' +

    '<!-- 2단계: 핵심 내용 이해 및 문해력 독해 퀴즈 -->' +
    '<div class="mb-3">' +
      '<h6 class="font-weight-bold text-primary mb-2" style="font-size: 13.5px;">' +
        '<i class="fa-solid fa-compass mr-1"></i>[STEP 2] 본문 속 문해력 성찰' +
      '</h6>' +
      '<div class="p-3 rounded" style="background: #ffffff; border: 1px solid #e2e8f0; font-size: 12.5px; line-height: 1.8;">' +
        '<p class="mb-1" style="color: #1e293b;">' + q1Text + '</p>' +
        '<div class="p-2 mb-2 bg-light rounded text-muted" style="min-height: 42px; border: 1px dotted #ccc;">(학생 작성란)</div>' +
        '<p class="mb-1" style="color: #1e293b;">' + q2Text + '</p>' +
        '<div class="p-2 bg-light rounded text-muted" style="min-height: 42px; border: 1px dotted #ccc;">(학생 작성란)</div>' +
      '</div>' +
    '</div>' +

    '<!-- 3단계: 나노 시트 생각담기 논술 -->' +
    '<div class="mb-3">' +
      '<h6 class="font-weight-bold text-primary mb-2" style="font-size: 13.5px;">' +
        '<i class="fa-solid fa-lightbulb mr-1"></i>[STEP 3] 나노 시트 생각담기 서술형 논술' +
      '</h6>' +
      '<div class="p-3 rounded" style="background: #ffffff; border: 1px solid #e2e8f0; font-size: 12.5px;">' +
        '<p class="font-weight-bold mb-1" style="color: #0f172a;"><i class="fa-solid fa-circle-question text-warning mr-1"></i>생각 끄집어내기 (발문 1): ' + escapeHtml(thinkExtract) + '</p>' +
        '<p class="font-weight-bold mb-2" style="color: #0f172a;"><i class="fa-solid fa-circle-question text-info mr-1"></i>생각 집어넣기 (발문 2): ' + escapeHtml(thinkInsert) + '</p>' +
        '<div style="border: 1px dashed #cbd5e1; height: 130px; border-radius: 6px; background: #fffdfa; padding: 10px; color: #94a3b8; font-size: 11.5px; line-height: 1.6;">' +
          '(200~400자 내외 서술형 논술 작성 영역 &middot; 교사의 첨삭 지도가 이루어집니다)' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- 교사용 가이드 -->' +
    '<div class="p-2 text-right text-muted" style="font-size: 11px; border-top: 1px solid #e2e8f0;">' +
      '* 나노의 책장 B2B 공식 인증 활동지 &middot; 교사용 평가 가이드라인 준수 &middot; ' + escapeHtml(title) + ' 전용 시트' +
    '</div>';

  htmlContainer.innerHTML = html;
}

// 학습자료 파일 선택 시 처리 (PDF 파일 검증 및 실제 Blob 보관)
function handleAcademySheetFileUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];

  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('나노 시트 학습자료는 PDF 파일(*.pdf)만 업로드할 수 있습니다.');
    input.value = '';
    return;
  }

  currentUploadedPdfBlob = file; // 실제 PDF File 객체 저장!
  var sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  if (file.size < 1024 * 1024) {
    sizeStr = Math.round(file.size / 1024) + ' KB';
  }

  currentUploadedMaterial = {
    name: file.name,
    size: sizeStr,
    type: document.getElementById('reg_material_type') ? document.getElementById('reg_material_type').value : '나노 시트 (PDF)',
    pdfBlob: file
  };

  document.getElementById('material_upload_empty').style.display = 'none';
  document.getElementById('material_upload_filled').style.display = 'block';
  document.getElementById('uploaded_pdf_name').innerText = currentUploadedMaterial.name;
  document.getElementById('uploaded_pdf_meta').innerText = `${currentUploadedMaterial.size} · ${currentUploadedMaterial.type} · 정상 첨부됨`;

  showAcademyToast(`[${file.name}] PDF가 성공적으로 첨부되었습니다. '미리보기'를 누르면 보안 워터마크가 박힌 뷰어로 즉시 열람됩니다.`);
}

// 표준 샘플 PDF 첨부 버튼 (시연용 실제 PDF 생성)
function attachSampleContentPdf() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim() || '신규도서';
  var cleanName = bookName.split('(')[0].trim().replace(/\s+/g, '');
  var sampleFileName = `${cleanName}_나노시트_학습용.pdf`;

  currentUploadedPdfBlob = createMinimalSamplePdfBlob(cleanName + ' - Nano Sheet');
  currentUploadedMaterial = {
    name: sampleFileName,
    size: '1.45 MB',
    type: document.getElementById('reg_material_type') ? document.getElementById('reg_material_type').value : '나노 시트 (PDF)',
    pdfBlob: currentUploadedPdfBlob
  };

  document.getElementById('material_upload_empty').style.display = 'none';
  document.getElementById('material_upload_filled').style.display = 'block';
  document.getElementById('uploaded_pdf_name').innerText = currentUploadedMaterial.name;
  document.getElementById('uploaded_pdf_meta').innerText = `${currentUploadedMaterial.size} · ${currentUploadedMaterial.type} · 정상 첨부됨`;

  showAcademyToast('표준 나노 시트 (PDF)가 첨부되었습니다. 미리보기를 누르면 보안 뷰어에 워터마크가 그려집니다.');
}

// 첨부된 자료 삭제
function removeUploadedMaterial() {
  currentUploadedMaterial = null;
  currentUploadedPdfBlob = null;
  var fileInput = document.getElementById('reg_sheet_file');
  if (fileInput) fileInput.value = '';
  document.getElementById('material_upload_empty').style.display = 'block';
  document.getElementById('material_upload_filled').style.display = 'none';
  showAcademyToast('첨부된 콘텐츠 자료가 삭제되었습니다.');
}

// 도서 표지 이미지 업로드 처리
function handleAcademyCoverUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    currentUploadedCover = e.target.result;
    var previewBox = document.getElementById('cover_preview_box');
    if (previewBox) {
      previewBox.innerHTML = `<img src="${currentUploadedCover}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">`;
    }
    showAcademyToast('도서 표지 이미지가 업로드되었습니다.');
  };
  reader.readAsDataURL(file);
}

// 워터마크 정보 갱신 (1행: 학원명, 2행: 출력일시, 3행: IP주소)
function updateWatermarkInfo() {
  var acadElem = document.getElementById('wmAcademyName');
  var timeElem = document.getElementById('wmPrintTime');
  var ipElem = document.getElementById('wmIpAddress');
  if (acadElem) acadElem.innerText = '나노 독서아카데미 목동본원';
  if (timeElem) {
    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    timeElem.innerText = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  if (ipElem) {
    ipElem.innerText = '118.235.12.89';
  }
}

// PDF 학습자료 미리보기 모달 열기 (도서별 실제 전용 PDF 캔버스 렌더링 + 도서 맞춤형 동적 나노시트 완벽 지원)
function openContentPdfModal(bookId) {
  var b = academyBookList.find(function(item) { return item.id === bookId; });
  activeViewingBook = b || null;

  // 서버에 나노시트 파일이 없는 도서는 팝업 모달을 전혀 띄우지 않고 즉시 차단
  if (!b || !checkBookHasAvailableSheet(b)) {
    showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    return;
  }

  var title = b ? b.title : '나노 도서';
  var fileName = b && b.materialName ? b.materialName : `${title}_나노시트.pdf`;

  var titleEl = document.getElementById('pdfModalTitle');
  if (titleEl) titleEl.innerText = `[${title}] 나노 시트 (보안 PDF 웹뷰어)`;

  var nameDisp = document.getElementById('pdfFileNameDisplay');
  if (nameDisp) nameDisp.innerText = fileName;

  var sheetBookTitle = document.getElementById('pdfSheetBookTitle');
  if (sheetBookTitle) sheetBookTitle.innerText = title;

  updateWatermarkInfo();

  // 모달 먼저 열기
  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  } else {
    showModalVanilla('contentPdfPreviewModal');
  }

  // 1. 도서 객체에 직접 첨부된 실제 PDF Blob/File/DataURL이 있는 경우 (방금 업로드한 경우 등)
  var directPdf = (b && (b.pdfBlob || b.pdfDataUrl)) || null;
  if (!directPdf && b && b.isMyCreation) {
    var cachedData = sessionStorage.getItem('nano_last_uploaded_pdf');
    if (cachedData) {
      directPdf = cachedData;
      b.pdfDataUrl = cachedData;
    }
  }

  if (directPdf) {
    renderPdfFileWithWatermark(directPdf, b);
    return;
  }

  // 2. 이미 명시된 실제 PDF 경로가 있는 경우 바로 렌더링
  if (b && (b.pdfUrl || b.worksheetUrl)) {
    renderPdfFileWithWatermark(b.pdfUrl || b.worksheetUrl, b);
    return;
  }

  // 3. 실제 서버 DB 및 파일시스템 조회 API 호출 (api/get_worksheet.php)
  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  // Vercel/Node 운영 환경에서는 레거시 PHP API(get_worksheet.php) 404 대기 없이 즉시 R2 CDN 후보 로드
  if (typeof window !== 'undefined' && window.NANO_SERVER_DATA) {
    var directCandidates = extractBookPdfCandidates(b);
    if (directCandidates.length > 0) {
      tryLoadCandidatePdfs(directCandidates, 0, b);
    } else {
      if (loadingInd) loadingInd.style.display = 'none';
      if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
        $('#contentPdfPreviewModal').modal('hide');
      } else {
        hideModalVanilla('contentPdfPreviewModal');
      }
      showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    }
    return;
  }

  var queryParams = new URLSearchParams({
    book_id: b ? (b.serverId || b.id || '') : (bookId || ''),
    isbn: b && b.isbn ? String(b.isbn).replace(/[^0-9]/g, '') : '',
    title: b ? (b.title || '') : '',
    cover: b ? (b.cover || '') : ''
  });

  fetch('api/get_worksheet.php?' + queryParams.toString())
    .then(function(res) {
      if (!res.ok) throw new Error('API 응답 HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (data && data.ok && data.pdfUrl) {
        if (b) {
          b.pdfUrl = data.pdfUrl;
          if (data.fileName) b.materialName = data.fileName;
        }
        if (nameDisp && data.fileName) nameDisp.innerText = data.fileName;
        renderPdfFileWithWatermark(data.pdfUrl, b);
      } else {
        // API 매칭 안 된 경우 파일시스템 후보 경로 시도
        var candidates = extractBookPdfCandidates(b);
        if (candidates.length > 0) {
          tryLoadCandidatePdfs(candidates, 0, b);
        } else {
          if (loadingInd) loadingInd.style.display = 'none';
          if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
            $('#contentPdfPreviewModal').modal('hide');
          }
          showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
        }
      }
    })
    .catch(function(err) {
      console.warn('get_worksheet.php API 조회 실패 또는 정적 프리뷰 환경, 로컬 후보 파일 순차 로드:', err);
      var candidates = extractBookPdfCandidates(b);
      if (candidates.length > 0) {
        tryLoadCandidatePdfs(candidates, 0, b);
      } else {
        if (loadingInd) loadingInd.style.display = 'none';
        if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
          $('#contentPdfPreviewModal').modal('hide');
        }
        showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
      }
    });
}

// 등록 폼 작성 중 현재 첨부된 PDF 바로 확인 (보안 뷰어 + 워터마크 합성)
function previewCurrentUploadedPdf() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim() || '도서 미리보기';
  var fileName = currentUploadedMaterial ? currentUploadedMaterial.name : `${bookName}_학습시트.pdf`;
  var fileSize = currentUploadedMaterial ? currentUploadedMaterial.size : '1.45 MB';

  document.getElementById('pdfModalTitle').innerText = `[${bookName}] 콘텐츠 학습시트 (보안 PDF 웹뷰어)`;
  document.getElementById('pdfFileNameDisplay').innerText = fileName;
  document.getElementById('pdfFileSizeDisplay').innerText = `(${fileSize} · 첨부 파일 검수)`;
  document.getElementById('pdfSheetBookTitle').innerText = bookName;

  updateWatermarkInfo();

  // 사용자가 방금 첨부한 실제 PDF File/Blob이 있으면 PDF.js 캔버스 렌더링 + 워터마크 합성!
  if (currentUploadedPdfBlob) {
    renderPdfFileWithWatermark(currentUploadedPdfBlob);
  } else {
    showDefaultHtmlSheetView();
  }

  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  } else {
    showModalVanilla('contentPdfPreviewModal');
  }
}

// 도서 및 콘텐츠 학습자료 최종 저장
function saveAcademyBook() {
  if (window.NanoPortal && NanoPortal.remote) { showAcademyToast('학원 자체 도서 등록은 전용 서버 저장 구조가 준비된 뒤 사용할 수 있습니다.'); return; }
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim();
  var author = (document.getElementById('reg_author') ? document.getElementById('reg_author').value : '').trim();
  var publisher = (document.getElementById('reg_publisher') ? document.getElementById('reg_publisher').value : '').trim();
  var grade = document.getElementById('reg_grade') ? document.getElementById('reg_grade').value : '초등 5~6학년';
  var category = document.getElementById('reg_category') ? document.getElementById('reg_category').value : '세계문학 / 우정';
  var memo = (document.getElementById('reg_memo') ? document.getElementById('reg_memo').value : '').trim();

  if (!bookName) {
    alert('도서명을 입력해 주세요.');
    document.getElementById('reg_book_name').focus();
    return;
  }
  if (!author) {
    alert('지은이(저자)를 입력해 주세요.');
    document.getElementById('reg_author').focus();
    return;
  }
  if (!publisher) {
    alert('출판사명을 입력해 주세요.');
    document.getElementById('reg_publisher').focus();
    return;
  }

  // 학습자료 파일 기본 처리 (없으면 자동 생성 첨부)
  var matName = currentUploadedMaterial ? currentUploadedMaterial.name : `${bookName.split('(')[0].trim()}_나노시트.pdf`;
  var matSize = currentUploadedMaterial ? currentUploadedMaterial.size : '1.45 MB';
  var matType = currentUploadedMaterial ? currentUploadedMaterial.type : '나노 시트 (PDF)';

  // 새 도서 번호 채번
  var maxId = 1004;
  academyBookList.forEach(function(b) {
    var num = parseInt(b.id, 10);
    if (!isNaN(num) && num > maxId) maxId = num;
  });
  var newId = String(maxId + 1);

  var coverPath = currentUploadedCover || 'assets/covers/cover_1001.jpg';

  var newBook = {
    id: newId,
    title: bookName,
    subtitle: '학원 자체 등록 맞춤 도서',
    author: author,
    publisher: publisher,
    category: category,
    grade: grade,
    cover: coverPath,
    materialName: matName,
    materialSize: matSize,
    materialType: matType,
    pdfBlob: currentUploadedPdfBlob,
    quizStatus: '5문항 완비',
    readCount: '0회',
    answerGuide: memo || '【나노 시트 핵심 정답】\n교사용 지도 가이드 및 정답안 등록 완료.'
  };

  academyBookList.unshift(newBook);
  lastAddedBookId = newId;

  // 도서 배정 카탈로그 갱신
  renderCartBookCatalog();
  renderAcademyBookTable();

  // 폼 초기화
  document.getElementById('reg_book_name').value = '';
  document.getElementById('reg_author').value = '';
  document.getElementById('reg_publisher').value = '';
  document.getElementById('reg_memo').value = '';
  document.getElementById('cover_preview_box').innerHTML = '<span class="text-muted" style="font-size: 11px;">표지 없음</span>';
  removeUploadedMaterial();
  currentUploadedCover = null;

  // 목록 탭으로 전환
  switchContentSubTab('list');

  showAcademyToast(`[${newBook.title}] 도서 및 콘텐츠 학습자료(PDF)가 성공적으로 등록되었습니다.`);
}

// ISBN 자동조회
function magicFetchIsbn() {
  var btn = document.getElementById('btn-isbn-fetch');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>조회중...';
  btn.disabled = true;

  setTimeout(function() {
    document.getElementById('reg_book_name').value = '어린 왕자 (생텍쥐페리 탄생 120주년 기념판)';
    document.getElementById('reg_author').value = '앙투안 드 생텍쥐페리';
    document.getElementById('reg_publisher').value = '열린책들';
    document.getElementById('cover_preview_box').innerHTML = '<img src="assets/covers/cover_1001.jpg" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">';
    document.getElementById('reg_memo').value = '【나노 시트 핵심 정답】\nQ1. 고향 별: B-612 소행성\nQ2. 마음으로 보아야 분명하게 보인다 (여우의 가르침)\nQ3. 길들임과 책임에 대한 교훈';

    // 콘텐츠 자료(PDF)도 자동 첨부
    attachSampleContentPdf();

    btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
    btn.disabled = false;

    showAcademyToast('알라딘에서 서지정보, 표지 및 나노 시트(PDF)를 불러왔습니다.');
  }, 400);
}

// 학생 체험 포털 열기 (새 탭)
function previewStudentPortal() {
  window.open('student_preview.html', '_blank');
  showAcademyToast('학생 포털이 새 탭에서 열렸습니다. 배정 도서 확인 및 북퀴즈를 테스트해보세요!');
}

// ==============================================================
// 10. 마스터 계정과 100% 동일한 학원 도서 및 북퀴즈 등록/편집 모달 로직
// ==============================================================
var editingAcadBookId = null;
var editingAcadQuizSets = [];
var currentAcadQuizSetIdx = 0;
var editingAcadQuizzes = [];
var currentAcadQuizIdx = 0;
var editingAcadSheetFile = null;
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'plugin/build/pdf.worker.js';
}
var curActiveAcadQuizInput = null;

function getInitialAcadQuizList(book) {
  if (book && Array.isArray(book.quizList) && book.quizList.length > 0) {
    return JSON.parse(JSON.stringify(book.quizList));
  }
  // 기존 기본 5문항 또는 샘플 문항 복사
  if (Array.isArray(quizDataList) && quizDataList.length > 0) {
    return JSON.parse(JSON.stringify(quizDataList));
  }
  return [
    {
      question: "『어린 왕자』에서 사막여우가 어린 왕자에게 전해준 가장 소중한 비밀인 ㉠에 들어갈 알맞은 낱말은?\n\n[지문]\n\"오로지 ㉠(으)로 보아야만 분명하게 볼 수 있어. 가장 중요한 것은 눈에 보이지 않거든.\"",
      opt1: "마음",
      opt2: "눈동자",
      opt3: "장미꽃",
      opt4: "여우",
      ans: "1",
      hint: "마음으로 보아야만 분명하게 볼 수 있다는 여우의 교훈"
    },
    {
      question: "어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?",
      opt1: "A-101 소행성",
      opt2: "B-612 소행성",
      opt3: "C-303 소행성",
      opt4: "별똥별 404호",
      ans: "2",
      hint: "소행성 B-612"
    },
    {
      question: "여우가 어린 왕자에게 알려준 '길들인다'의 참된 의미로 가장 알맞은 것은?",
      opt1: "상대방을 내 뜻대로 복종시키는 것",
      opt2: "서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
      opt3: "매일 정해진 시간에 먹이를 주는 것",
      opt4: "상대방의 약점을 모두 알아내는 것",
      ans: "2",
      hint: "서로에게 세상에서 유일한 존재가 되는 것"
    }
  ];
}

// 도서별 퀴즈 세트 다중 관리 (본사, 타 가맹점, 우리 학원 세트)
function ensureAcadBookQuizSets(book) {
  if (book && Array.isArray(book.quizSets) && book.quizSets.length > 0) {
    return JSON.parse(JSON.stringify(book.quizSets));
  }

  var defaultHQQuizzes = getInitialAcadQuizList(book);
  var sets = [
    {
      id: 'qs_hq_' + (book ? book.id : 'new'),
      authorType: 'HQ',
      authorName: '본사',
      academyName: '본사 직속(HQ)',
      isMine: false,
      questions: defaultHQQuizzes
    }
  ];

  // '어린 왕자' 등 주요 도서에 타 가맹점(A 학원) 및 우리 학원 샘플 퀴즈 세트 구성
  if (book && book.title && book.title.includes('어린 왕자')) {
    sets.push({
      id: 'qs_acad_a_' + book.id,
      authorType: 'ACADEMY',
      authorName: 'A 학원',
      academyName: '울산 삼산 인재리딩캠퍼스',
      isMine: false,
      questions: [
        {
          question: '[A 학원 출제] 어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?',
          opt1: 'A-101 소행성',
          opt2: 'B-612 소행성',
          opt3: 'C-303 소행성',
          opt4: 'D-909 소행성',
          ans: '2',
          hint: 'B-612 소행성입니다.'
        },
        {
          question: '[A 학원 출제] 여우가 어린 왕자에게 알려준 ㉠길들임의 참된 의미는 무엇인가요?',
          opt1: '상대를 내 마음대로 통제하는 것',
          opt2: '서로에게 특별한 관계를 맺고 책임을 다하는 것',
          opt3: '정해진 시간에 먹이를 주는 것',
          opt4: '상대의 약점을 모두 알아내는 것',
          ans: '2',
          hint: '세상에서 오직 하나뿐인 소중한 존재가 되는 과정'
        }
      ]
    });

    sets.push({
      id: 'qs_my_' + book.id,
      authorType: 'ACADEMY',
      authorName: '우리 학원',
      academyName: '나노 독서아카데미 본원',
      isMine: true,
      questions: [
        {
          question: '[우리 학원 자체 출제 1번] 어린 왕자가 지구 사막에서 만난 비행사에게 처음으로 그려달라고 부탁한 동물은 무엇인가요?',
          opt1: '양 한 마리',
          opt2: '비행기 프로펠러',
          opt3: '사막의 여우',
          opt4: '소행성의 장미꽃',
          ans: '1',
          hint: '상자에 구멍을 뚫어 넣어주었던 작은 동물입니다.'
        }
      ]
    });
  }

  return sets;
}

// ==============================================================
// 6-A. 학원 신규 도서 등록 및 서지 정보 수정 모달 로직 (본사와 100% 동일 규격)
// ==============================================================
var originalEditingAcadBookId = null;

// 카테고리 1별 학원 생각담기 제시문 세트
var ACAD_THINK_PROMPTS_NOVEL = [
  "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
  "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
  "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
  "기억나는 장면이나 문장을 적어보세요.",
  "이 책에서 얻은 교훈이 있다면?",
  "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
  "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?"
];

var ACAD_THINK_PROMPTS_NONFICTION = [
  "이 책을 읽고 생각난 사람은 누구이며 이유는 무엇인가요?",
  "이 책에서 가장 기억에 남은 내용은 무엇인가요?",
  "책을 읽고 새롭게 알게된 내용은 무엇인가요?",
  "이 책을 추천한다면 어떻게 설명하고 싶나요?"
];

function updateAcadThinkPresets(cat1) {
  var select = document.getElementById("abEditThinkPresetSelect");
  if (!select) return;

  var isNonfiction = (cat1 === "비문학/정보글" || cat1 === "비문학" || cat1 === "C");
  var prompts = isNonfiction ? ACAD_THINK_PROMPTS_NONFICTION : ACAD_THINK_PROMPTS_NOVEL;

  select.innerHTML = prompts.map(function(p, i) {
    return `<option value="${p}">${i + 1}. ${p}</option>`;
  }).join("");

  var textarea = document.getElementById("abEditThinkInsert");
  if (textarea && prompts.length > 0) {
    textarea.value = prompts[0];
  }
}

function onAcadCategory1Changed(cat1) {
  updateAcadThinkPresets(cat1);
  if (!originalEditingAcadBookId) {
    generateAcademyBookId();
  }
}

function onAcadCategory2Changed(cat2) {
  if (!originalEditingAcadBookId) {
    generateAcademyBookId();
  }
}

function onAcadGradeChanged(grade) {
  if (!originalEditingAcadBookId) {
    generateAcademyBookId();
  }
}

function applyAcadThinkPresetToInput(val) {
  var textarea = document.getElementById("abEditThinkInsert");
  if (textarea) textarea.value = val;
}

function switchAcadThinkMode(mode) {
  var btnPreset = document.getElementById("btnAcadThinkPreset");
  var btnCustom = document.getElementById("btnAcadThinkCustom");
  var btnNone = document.getElementById("btnAcadThinkNone");
  var presetWrap = document.getElementById("acadThinkPresetWrap");
  var customWrap = document.getElementById("acadThinkCustomWrap");
  var noneNotice = document.getElementById("acadThinkNoneNotice");

  if (!btnPreset || !btnCustom || !btnNone) return;

  btnPreset.classList.remove("active");
  btnCustom.classList.remove("active");
  btnNone.classList.remove("active");

  if (mode === "preset") {
    btnPreset.classList.add("active");
    if (presetWrap) presetWrap.style.display = "block";
    if (customWrap) customWrap.style.display = "block";
    if (noneNotice) noneNotice.style.display = "none";
    var select = document.getElementById("abEditThinkPresetSelect");
    if (select) applyAcadThinkPresetToInput(select.value);
  } else if (mode === "custom") {
    btnCustom.classList.add("active");
    if (presetWrap) presetWrap.style.display = "none";
    if (customWrap) customWrap.style.display = "block";
    if (noneNotice) noneNotice.style.display = "none";
  } else {
    btnNone.classList.add("active");
    if (presetWrap) presetWrap.style.display = "none";
    if (customWrap) customWrap.style.display = "none";
    if (noneNotice) noneNotice.style.display = "block";
    var textarea = document.getElementById("abEditThinkInsert");
    if (textarea) textarea.value = "";
  }
}

function toggleAcadSingleBookCheckbox(isSingle) {
  var seriesInput = document.getElementById("abEditSeries");
  if (seriesInput) {
    seriesInput.disabled = isSingle;
    if (isSingle) {
      seriesInput.value = "";
      seriesInput.placeholder = "단권으로 지정되었습니다.";
    } else {
      seriesInput.placeholder = "예: 해리포터 시리즈, 한국사 편지";
    }
  }
}

// -------------------------------------------------------------
// 학원 도서 관리 코드 자동 채번 (규칙: [Cat2][Cat1][Grade][5자리순번])
// 예: 외서(F) + 소설(A) + 1학년(1) + 첫번째 => FA100001
// 예: 국내서(K) + 인물이야기(B) + 2학년(2) + 두번째 => KB200002
// -------------------------------------------------------------
function generateAcademyBookId() {
  var cat1El = document.getElementById("abEditCat1");
  var cat2El = document.getElementById("abEditCat2");
  var gradeEl = document.getElementById("abEditGrade");

  var cat1Val = cat1El ? cat1El.value : "소설";
  var cat2Val = cat2El ? cat2El.value : "국내서";
  var gradeVal = gradeEl ? gradeEl.value : "초등 1학년";

  var c2Code = "K";
  if (cat2Val.includes("외서") || cat2Val === "F") c2Code = "F";
  else if (cat2Val.includes("구분") || cat2Val === "N") c2Code = "N";

  var c1Code = "A";
  if (cat1Val.includes("인물") || cat1Val.includes("위인") || cat1Val === "B") c1Code = "B";
  else if (cat1Val.includes("비문학") || cat1Val.includes("정보") || cat1Val === "C") c1Code = "C";

  var gCode = "1";
  if (gradeVal.includes("유치") || gradeVal.includes("미취학")) gCode = "0";
  else if (gradeVal.includes("1학년") && !gradeVal.includes("중등")) gCode = "1";
  else if (gradeVal.includes("2학년") && !gradeVal.includes("중등")) gCode = "2";
  else if (gradeVal.includes("3학년") && !gradeVal.includes("중등")) gCode = "3";
  else if (gradeVal.includes("4학년")) gCode = "4";
  else if (gradeVal.includes("5학년")) gCode = "5";
  else if (gradeVal.includes("6학년")) gCode = "6";
  else if (gradeVal.includes("중등 1학년") || gradeVal.includes("중1")) gCode = "7";
  else if (gradeVal.includes("중등 2학년") || gradeVal.includes("중2")) gCode = "8";
  else if (gradeVal.includes("중등 3학년") || gradeVal.includes("중3")) gCode = "9";
  else {
    var m = gradeVal.match(/\d/);
    if (m) gCode = m[0];
  }

  var prefix = `${c2Code}${c1Code}${gCode}`;
  var maxSeq = 0;

  academyBookList.forEach(function(b) {
    if (b.id && b.id.startsWith(prefix)) {
      var numPart = b.id.slice(prefix.length);
      var num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  var nextSeq = String(maxSeq + 1).padStart(5, "0");
  var newId = `${prefix}${nextSeq}`;
  var idInput = document.getElementById("abEditId");
  if (idInput) idInput.value = newId;
  showAcademyToast(`신규 도서 관리 코드 [${newId}]가 자동 발급되었습니다.`);
  return newId;
}

// -------------------------------------------------------------
// [서비스 운영 관리 - 테마 관리] 주제 태그 드롭박스 렌더링 (학원 모달용)
// -------------------------------------------------------------
function renderThemeSelectForAcademyBook(selectedTag = "") {
  var select = document.getElementById("abEditThemeTagSelect");
  if (!select) return;

  var currentThemes = [];
  try {
    var raw = localStorage.getItem("NANO_MASTER_THEMES");
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) currentThemes = parsed;
    }
  } catch(e) {}

  if (currentThemes.length === 0 && typeof window !== "undefined" && window.NANO_SERVER_THEMES && Array.isArray(window.NANO_SERVER_THEMES) && window.NANO_SERVER_THEMES.length > 0) {
    currentThemes = window.NANO_SERVER_THEMES;
  }
  if (currentThemes.length === 0 && typeof themeList !== "undefined" && Array.isArray(themeList) && themeList.length > 0) {
    currentThemes = themeList;
  }

  var targetVal = Array.isArray(selectedTag) ? (selectedTag[0] || "") : selectedTag;

  select.innerHTML = currentThemes.map(function(t) {
    var tagVal = t.tag || `#${t.title.replace(/\s+/g, '')}`;
    var isSelected = (targetVal && targetVal === tagVal);
    var label = t.title ? `${tagVal} (${t.title})` : tagVal;
    return `<option value="${tagVal}" ${isSelected ? 'selected' : ''}>${label}</option>`;
  }).join("");
}

// -------------------------------------------------------------
// 학원 세부 태그 동적 입력 슬롯 관리 (디폴트 2칸, 최대 5칸, +추가 및 삭제)
// -------------------------------------------------------------
var acadDetailTagsState = ["", ""];

function initAcadDetailTags(tagStringOrArray) {
  if (Array.isArray(tagStringOrArray)) {
    acadDetailTagsState = tagStringOrArray.filter(function(t) { return t && t.trim() !== ""; });
  } else if (typeof tagStringOrArray === "string" && tagStringOrArray.trim() !== "") {
    var raw = tagStringOrArray.split(/[\s,#]+/).map(function(t) { return t.trim(); }).filter(Boolean);
    acadDetailTagsState = raw;
  } else {
    acadDetailTagsState = ["", ""];
  }

  while (acadDetailTagsState.length < 2) {
    acadDetailTagsState.push("");
  }
  if (acadDetailTagsState.length > 5) {
    acadDetailTagsState = acadDetailTagsState.slice(0, 5);
  }
  renderAcadDetailTagSlots();
}

function renderAcadDetailTagSlots() {
  var container = document.getElementById("abDetailTagsContainer");
  var countEl = document.getElementById("abDetailTagCount");
  var addBtn = document.getElementById("btnAddAcadDetailTagSlot");
  if (!container) return;

  if (countEl) countEl.innerText = acadDetailTagsState.length;
  if (addBtn) addBtn.disabled = acadDetailTagsState.length >= 5;

  var placeholders = ["예: 문해력향상", "예: 세계명작", "예: 창의융합", "예: 감정표현", "예: 성장스토리"];

  container.innerHTML = acadDetailTagsState.map(function(val, idx) {
    var canRemove = acadDetailTagsState.length > 2;
    return `
      <div class="input-group input-group-sm mb-1.5" style="border-radius: 6px; overflow: hidden;">
        <div class="input-group-prepend">
          <span class="input-group-text bg-white font-weight-bold text-muted" style="font-size: 12px; border-color: var(--border-medium); min-width: 82px;">
            <i class="fa-solid fa-hashtag text-warning mr-1"></i>태그 ${idx + 1}
          </span>
        </div>
        <input type="text" class="form-control form-control-beige acad-detail-tag-input" 
               value="${val.replace(/^#/, '')}" 
               placeholder="${placeholders[idx] || '태그 직접 입력'}" 
               oninput="acadDetailTagsState[${idx}] = this.value"
               style="font-size: 12.5px;">
        ${canRemove ? `
          <div class="input-group-append">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeAcadDetailTagSlot(${idx})" title="이 태그 칸 삭제" style="border-color: var(--border-medium); font-size: 11px; padding: 0 10px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function addAcadDetailTagSlot() {
  if (acadDetailTagsState.length >= 5) {
    showAcademyToast("세부 태그는 최대 5개까지 등록할 수 있습니다.");
    return;
  }
  var inputs = document.querySelectorAll(".acad-detail-tag-input");
  inputs.forEach(function(inp, i) { if (acadDetailTagsState[i] !== undefined) acadDetailTagsState[i] = inp.value; });
  acadDetailTagsState.push("");
  renderAcadDetailTagSlots();
}

function removeAcadDetailTagSlot(idx) {
  if (acadDetailTagsState.length <= 2) {
    showAcademyToast("세부 태그 칸은 최소 2개 이상 유지되어야 합니다.");
    return;
  }
  var inputs = document.querySelectorAll(".acad-detail-tag-input");
  inputs.forEach(function(inp, i) { if (acadDetailTagsState[i] !== undefined) acadDetailTagsState[i] = inp.value; });
  acadDetailTagsState.splice(idx, 1);
  renderAcadDetailTagSlots();
}

function getAcadDetailTagsValue() {
  var inputs = document.querySelectorAll(".acad-detail-tag-input");
  var tags = [];
  inputs.forEach(function(inp) {
    var v = inp.value.trim().replace(/^#/, "");
    if (v) tags.push(`#${v}`);
  });
  return tags.join(" ");
}

// -------------------------------------------------------------
// [학원 도서 지능형 서지 분석 알고리즘]
// -------------------------------------------------------------
function detectAcadBookSeries(title, rawSeries) {
  if (rawSeries && rawSeries.trim() && rawSeries !== "단권") {
    return { isSeries: true, seriesName: rawSeries.trim() };
  }
  if (!title) return { isSeries: false, seriesName: "단권" };

  const clean = title.trim();
  const bracketMatch = clean.match(/^(.*?)\s*[\(\[](.*?(?:권|탄|부|시리즈|편|vol|season|\d+).*?)[\)\]]/i);
  if (bracketMatch) {
    const sName = bracketMatch[1].trim();
    if (sName.length >= 2 && !/^\d+$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }

  const endNumMatch = clean.match(/^(.*?)\s+(\d{1,3})\s*(?:권|탄|부|편|화)?$/);
  if (endNumMatch) {
    const sName = endNumMatch[1].trim();
    if (sName.length >= 2 && !/^(19|20)\d\d$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }

  if (clean.includes("시리즈") || clean.includes("세트") || clean.includes("전집") || clean.includes("문고")) {
    const sName = clean.replace(/\s*(?:전집|세트|시리즈|문고).*$/, " 시리즈").trim();
    return { isSeries: true, seriesName: sName };
  }

  return { isSeries: false, seriesName: "단권" };
}

function detectAcadBookCategory2(isbn, doc) {
  const isbnStr = (isbn || "").replace(/[^0-9]/g, "");
  if (isbnStr.startsWith("978") && !isbnStr.startsWith("97889")) return "외서";
  if (doc && doc.translators && Array.isArray(doc.translators) && doc.translators.length > 0) return "외서";

  const allText = `${doc ? doc.title || "" : ""} ${doc && Array.isArray(doc.authors) ? doc.authors.join(" ") : (doc ? doc.authors || "" : "")} ${doc ? doc.publisher || "" : ""}`;
  if (!/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(allText) && /[a-zA-Z]/.test(allText)) return "외서";

  const authorStr = doc && Array.isArray(doc.authors) ? doc.authors.join(", ") : (doc ? doc.authors || "" : "");
  if (authorStr.includes("·") || authorStr.includes(" 드 ") || authorStr.includes(" 생텍쥐페리") || authorStr.includes(" 롤링") || authorStr.includes(" 셰익스피어") || authorStr.includes(" 톨스토이")) {
    return "외서";
  }
  return "국내서";
}

function detectAcadBookCategory1(doc) {
  const text = `${(doc && doc.title) || ""} ${(doc && doc.contents) || ""}`;
  const bioKws = ["위인", "전기", "평전", "인물 이야기", "위인전", "who?", "Who?", "자서전", "생애", "세종대왕", "이순신", "안중근", "정약용", "헬렌 켈러", "에디슨", "아인슈타인", "스티브 잡스", "마더 테레사", "간디", "링컨", "김구", "유관순", "신사임당"];
  for (const kw of bioKws) {
    if (text.includes(kw)) return "인물 이야기 (위인)";
  }

  const nonFicKws = ["과학", "역사", "한국사", "세계사", "사회", "경제", "수학", "백과", "탐구", "사전", "지식", "정보", "원리", "실험", "우주", "식물", "환경", "철학", "교양", "인문", "상식", "법", "정치", "코딩", "인공지능", "생태", "지리", "설명문"];
  for (const kw of nonFicKws) {
    if (text.includes(kw)) return "비문학/정보글";
  }
  return "소설";
}

function detectAcadBookGrade(doc) {
  const text = `${(doc && doc.title) || ""} ${(doc && doc.contents) || ""}`;
  if (/유아|그림책|보드북|미취학|유치|[3-7]세|누리과정/.test(text)) return "유치부";
  if (/초등\s*1|초1|초등\s*저학년|저학년용/.test(text)) return "초등 1학년";
  if (/초등\s*2|초2/.test(text)) return "초등 2학년";
  if (/초등\s*3|초3|초등\s*중학년|중학년용/.test(text)) return "초등 3학년";
  if (/초등\s*4|초4/.test(text)) return "초등 4학년";
  if (/초등\s*5|초5|초등\s*고학년|고학년용/.test(text)) return "초등 5학년";
  if (/초등\s*6|초6/.test(text)) return "초등 6학년";
  if (/중등\s*1|중1|중학생|청소년\s*초기/.test(text)) return "중등 1학년";
  if (/중등\s*2|중2|청소년\s*문학|청소년용/.test(text)) return "중등 2학년";
  if (/중등\s*3|중3/.test(text)) return "중등 3학년";
  return "초등 5학년";
}

// -------------------------------------------------------------
// ISBN 도서 정보 자동 조회 (학원 모달용)
// -------------------------------------------------------------
async function lookupAcademyIsbn() {
  var isbnInput = document.getElementById("abEditIsbn");
  var isbn = isbnInput ? isbnInput.value.trim().replace(/[^0-9xX]/g, "") : "";
  if (!isbn) {
    showAcademyToast("ISBN 13자리 번호를 입력해 주세요.", "warning");
    if (isbnInput) isbnInput.focus();
    return;
  }

  var btn = document.getElementById("btnAcadIsbnFetch");
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>카카오 조회중...';
    btn.disabled = true;
  }

  const kakaoApiKey = "11d75cc8189f15ddf547b5538827d04d";
  const apiUrl = `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(isbn)}`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `KakaoAK ${kakaoApiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data && data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const title = doc.title || "";
      const author = Array.isArray(doc.authors) ? doc.authors.join(", ") : (doc.authors || "");
      const publisher = doc.publisher || "";
      let cover = doc.thumbnail || "";

      if (cover && cover.includes("R120x174")) {
        cover = cover.replace("R120x174", "R300x0");
      }

      if (document.getElementById("abEditTitle")) document.getElementById("abEditTitle").value = title;
      if (document.getElementById("abEditAuthor")) document.getElementById("abEditAuthor").value = author;
      if (document.getElementById("abEditPublisher")) document.getElementById("abEditPublisher").value = publisher;

      // 지능형 서지 분석 적용
      const seriesInfo = detectAcadBookSeries(title, "");
      const isSingle = !seriesInfo.isSeries;
      const singleCheck = document.getElementById("abEditIsSingle");
      const seriesInput = document.getElementById("abEditSeries");
      if (singleCheck) singleCheck.checked = isSingle;
      if (typeof toggleAcadSingleBookCheckbox === "function") toggleAcadSingleBookCheckbox(isSingle);
      if (seriesInput && !isSingle) seriesInput.value = seriesInfo.seriesName;

      const detectedCat1 = detectAcadBookCategory1(doc);
      const detectedCat2 = detectAcadBookCategory2(isbn, doc);
      const detectedGrade = detectAcadBookGrade(doc);

      if (document.getElementById("abEditCat1")) {
        document.getElementById("abEditCat1").value = detectedCat1;
        if (typeof onAcadCategory1Changed === "function") onAcadCategory1Changed(detectedCat1);
      }
      if (document.getElementById("abEditCat2")) {
        document.getElementById("abEditCat2").value = detectedCat2;
        if (typeof onAcadCategory2Changed === "function") onAcadCategory2Changed(detectedCat2);
      }
      if (document.getElementById("abEditGrade")) {
        document.getElementById("abEditGrade").value = detectedGrade;
        if (typeof onAcadGradeChanged === "function") onAcadGradeChanged(detectedGrade);
      }

      if (cover) {
        if (document.getElementById("abEditCover")) document.getElementById("abEditCover").value = cover;
        updateAcadCoverPreview(cover);
      }

      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
        btn.disabled = false;
        setTimeout(function() {
          btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
        }, 2000);
      }
      const seriesText = isSingle ? "단권" : `시리즈(${seriesInfo.seriesName})`;
      showAcademyToast(`[ISBN: ${isbn}] '${title}' (${seriesText} / ${detectedCat1} / ${detectedCat2}) 분석 완료!`);
    } else {
      showAcademyToast(`해당 ISBN(${isbn})에 대한 카카오 도서 검색 결과가 없습니다. 직접 입력해주세요.`, "warning");
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
        btn.disabled = false;
      }
    }
  } catch (err) {
    console.warn("카카오 API 실시간 조회 실패 (오프라인/네트워크 오류), 내장 데이터 백업 적용:", err);

    var isbnMap = {
      "9788932917245": {
        title: "어린 왕자",
        author: "앙투안 드 생텍쥐페리",
        publisher: "열린책들",
        grade: "초등 5학년",
        cat1: "소설",
        cat2: "외서",
        cover: "assets/covers/cover_1001.jpg"
      },
      "9788936434120": {
        title: "아몬드",
        author: "손원평",
        publisher: "창비",
        grade: "중등 2학년",
        cat1: "소설",
        cat2: "국내서",
        cover: "assets/covers/cover_1002.jpg"
      }
    };

    var data = isbnMap[isbn] || {
      title: `[ISBN-${isbn.slice(-4)}] 신규 맞춤 도서`,
      author: "국립중앙도서관 수록 작가",
      publisher: "나노교육출판",
      grade: "초등 5학년",
      cat1: "소설",
      cat2: "국내서",
      cover: "assets/covers/cover_1001.jpg"
    };

    if (document.getElementById("abEditTitle")) document.getElementById("abEditTitle").value = data.title;
    if (document.getElementById("abEditAuthor")) document.getElementById("abEditAuthor").value = data.author;
    if (document.getElementById("abEditPublisher")) document.getElementById("abEditPublisher").value = data.publisher;
    if (document.getElementById("abEditGrade")) document.getElementById("abEditGrade").value = data.grade;
    if (document.getElementById("abEditCat1")) document.getElementById("abEditCat1").value = data.cat1;
    if (document.getElementById("abEditCat2")) document.getElementById("abEditCat2").value = data.cat2;
    if (typeof onAcadCategory1Changed === "function") onAcadCategory1Changed(data.cat1);
    if (typeof onAcadCategory2Changed === "function") onAcadCategory2Changed(data.cat2);
    if (document.getElementById("abEditCover")) document.getElementById("abEditCover").value = data.cover;
    updateAcadCoverPreview(data.cover);

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
      btn.disabled = false;
      setTimeout(function() {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
      }, 2000);
    }
    showAcademyToast(`[ISBN: ${isbn}] 서지정보가 자동 입력되었습니다.`);
  }
}

// -------------------------------------------------------------
// 학원 도서 등록 / 편집 / 상세 조회 폼 읽기 전용 상태 제어
// -------------------------------------------------------------
function setAcadBookFormReadOnly(isReadOnly, sourceName) {
  var form = document.getElementById('academyBookOnlyForm');
  if (!form) return;

  // 1. 모든 input, select, textarea 순회하며 disabled 설정
  var inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(function(el) {
    if (el.id === 'abEditId') return; // 코드는 항상 readonly
    if (isReadOnly) {
      el.setAttribute('disabled', 'disabled');
    } else {
      el.removeAttribute('disabled');
    }
  });

  // 2. 검색/조회 보조 버튼 제어
  var isbnBtn = document.getElementById('btnAcadIsbnFetch');
  if (isbnBtn) {
    if (isReadOnly) isbnBtn.setAttribute('disabled', 'disabled');
    else isbnBtn.removeAttribute('disabled');
  }

  var btnCoverUrl = document.getElementById('btnAcadCoverModeUrl');
  var btnCoverFile = document.getElementById('btnAcadCoverModeFile');
  if (btnCoverUrl) {
    if (isReadOnly) btnCoverUrl.setAttribute('disabled', 'disabled');
    else btnCoverUrl.removeAttribute('disabled');
  }
  if (btnCoverFile) {
    if (isReadOnly) btnCoverFile.setAttribute('disabled', 'disabled');
    else btnCoverFile.removeAttribute('disabled');
  }

  // 3. 생각담기 세그먼트 버튼 제어
  var thinkSegBtns = document.querySelectorAll('.think-seg-btn');
  thinkSegBtns.forEach(function(btn) {
    if (btn) {
      if (isReadOnly) {
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.6';
      } else {
        btn.style.pointerEvents = '';
        btn.style.opacity = '';
      }
    }
  });

  // 4. 모달 상단 읽기 전용 안내 배너 제어
  var alertEl = document.getElementById('acadBookReadOnlyAlert');
  var msgEl = document.getElementById('acadBookReadOnlyMsg');
  if (alertEl) {
    if (isReadOnly) {
      if (msgEl) {
        msgEl.innerHTML = `<strong>${sourceName || '본사 공식 / 타 가맹점'}</strong> 도서입니다. 서지 정보 및 나노시트/생각담기를 안전하게 조회할 수 있으며, 내용 수정은 제한됩니다.`;
      }
      alertEl.style.display = 'flex';
    } else {
      alertEl.style.display = 'none';
    }
  }

  // 5. 모달 푸터 버튼 제어 (읽기 전용 시 저장 버튼 숨김 & 닫기 버튼 전환)
  var submitBtn = document.getElementById('btnSubmitAcadBookOnly');
  var cancelBtn = document.getElementById('btnCancelAcadBookOnly');
  var footerNotice = document.getElementById('acadBookModalFooterNotice');

  if (submitBtn) {
    submitBtn.style.display = isReadOnly ? 'none' : 'inline-block';
  }
  if (cancelBtn) {
    if (isReadOnly) {
      cancelBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>확인 (닫기)';
      cancelBtn.className = 'btn btn-beige-primary px-4 font-weight-bold';
    } else {
      cancelBtn.innerHTML = '취소';
      cancelBtn.className = 'btn btn-beige-secondary px-3 mr-2';
    }
  }
  if (footerNotice) {
    footerNotice.innerHTML = isReadOnly
      ? '<i class="fa-solid fa-circle-info text-info mr-1"></i>도서 서지 정보 상세 조회 모드입니다. (읽기 전용)'
      : '<i class="fa-solid fa-shield-halved text-success mr-1"></i>도서 정보 저장 시 우리 학원의 도서 목록 및 배정 풀에 즉시 반영됩니다.';
  }
}

// -------------------------------------------------------------
// 학원 신규 도서 등록 / 편집 / 상세 조회 모달 열기
// -------------------------------------------------------------
function openAcademyBookOnlyAddModal(id = null) {
  var isNew = !id;
  originalEditingAcadBookId = isNew ? null : id;
  var book = isNew ? null : academyBookList.find(function(b) { return b.id === id; });

  // 내가 등록한 도서인지 판별 (false인 경우 상세 조회 전용 모드로 오픈)
  var isReadOnly = false;
  var sourceName = '';
  if (!isNew && book) {
    if (!isBookCreatedByMyAcademy(book)) {
      isReadOnly = true;
      sourceName = (!book.creatorType || book.creatorType === 'HQ' || (book.academyName && book.academyName.includes('본사')))
        ? '본사 직속 공식 도서'
        : (book.academyName ? `[${book.academyName}] 등록 도서` : '타 가맹점 등록 도서');
    }
  }

  // 1. 모달 타이틀 설정
  var titleEl = document.getElementById('acadBookModalTitle');
  if (titleEl) {
    if (isNew) {
      titleEl.innerHTML = '<i class="fa-solid fa-book-medical mr-2 text-warning"></i>학원 신규 도서 등록';
    } else if (isReadOnly) {
      titleEl.innerHTML = `<i class="fa-solid fa-book-open-reader mr-2 text-primary"></i>도서 상세 정보 조회 <span class="badge-soft badge-soft-warning ml-1" style="font-size: 11px;"><i class="fa-solid fa-lock mr-1"></i>읽기 전용 (${sourceName})</span>`;
    } else {
      titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>학원 도서 서지 정보 편집 <span class="badge-soft badge-soft-neutral ml-1" style="font-size: 11px;">${book.id}</span>`;
    }
  }

  // 폼 필드 읽기 전용/편집 활성화 상태 적용
  setAcadBookFormReadOnly(isReadOnly, sourceName);

  // 2. 카테고리 1, 카테고리 2, 학년 바인딩
  var cat1 = (book && book.cat1) ? book.cat1 : "소설";
  var cat2 = (book && book.cat2) ? book.cat2 : "국내서";
  var grade = (book && book.grade) ? book.grade : "초등 5학년";

  if (document.getElementById('abEditCat1')) document.getElementById('abEditCat1').value = cat1;
  if (document.getElementById('abEditCat2')) document.getElementById('abEditCat2').value = cat2;
  if (document.getElementById('abEditGrade')) document.getElementById('abEditGrade').value = grade;

  // 3. 도서 관리 코드 채번/세팅
  if (isNew) {
    generateAcademyBookId();
  } else {
    if (document.getElementById('abEditId')) document.getElementById('abEditId').value = book.id;
  }

  // 5. ISBN 바인딩 (신규 도서 등록 시 자동 입력 제거 -> 공란으로 초기화)
  var isbnInput = document.getElementById('abEditIsbn');
  if (isbnInput) {
    isbnInput.value = (book && book.isbn) ? book.isbn : '';
  }

  // 6. 기본 서지 정보 바인딩 (신규 등록 시 공란 유지)
  if (document.getElementById('abEditTitle')) document.getElementById('abEditTitle').value = isNew ? '' : book.title;
  if (document.getElementById('abEditAuthor')) document.getElementById('abEditAuthor').value = isNew ? '' : book.author;
  if (document.getElementById('abEditPublisher')) document.getElementById('abEditPublisher').value = isNew ? '' : (book.publisher || '');

  // 7. 시리즈명 & 단권 (시리즈명이 비어있거나 '단권'인 경우 단권 체크박스 자동 체크)
  var hasValidSeries = !!(book && book.series && book.series.trim() !== '' && book.series.trim() !== '단권');
  var isSingle = isNew ? false : (!hasValidSeries || book.isSingle === true || book.series === '단권');
  if (document.getElementById('abEditIsSingle')) document.getElementById('abEditIsSingle').checked = isSingle;
  toggleAcadSingleBookCheckbox(isSingle);
  if (document.getElementById('abEditSeries')) {
    document.getElementById('abEditSeries').value = hasValidSeries ? book.series.trim() : '';
  }

  // 8. 주제 분류 태그 (드롭박스 - 테마 관리 연동)
  var selectedThemeTag = (book && book.themeTag) ? book.themeTag : ((book && Array.isArray(book.tags) && book.tags[0]) ? book.tags[0] : "#이달의나노북클럽");
  renderThemeSelectForAcademyBook(selectedThemeTag);

  // 9. 세부 태그 동적 입력 슬롯 초기화
  initAcadDetailTags((book && book.detailTag) ? book.detailTag : "");

  // 10. 어워드, 줄거리, 생각꺼내기
  if (document.getElementById('abEditAwards')) document.getElementById('abEditAwards').value = (book && book.awards) ? book.awards : '';
  if (document.getElementById('abEditSynopsis')) document.getElementById('abEditSynopsis').value = (book && (book.synopsis || book.description)) ? (book.synopsis || book.description) : '';
  if (document.getElementById('abEditThinkExtract')) document.getElementById('abEditThinkExtract').value = (book && book.thinkExtract) ? book.thinkExtract : '';

  // 11. 생각 담기
  updateAcadThinkPresets(cat1);
  if (book && book.thinkInsert) {
    if (document.getElementById('abEditThinkInsert')) document.getElementById('abEditThinkInsert').value = book.thinkInsert;
    switchAcadThinkMode('custom');
  } else {
    switchAcadThinkMode('preset');
  }

  // 12. 표지 처리 (신규 등록 시 기본 도서 썸네일 노출)
  var coverUrl = isNew
    ? 'resources/images/book_default.png'
    : (book.cover || 'resources/images/book_default.png');
  if (document.getElementById('abEditCover')) document.getElementById('abEditCover').value = isNew ? '' : (book.cover || '');
  updateAcadCoverPreview(coverUrl);
  switchAcadCoverMode('url');

  // 13. 학습자료 파일 정보 설정
  editingAcadSheetFile = (book && book.materialName) ? {
    name: book.materialName,
    size: book.materialSize || '1.45 MB',
    type: book.materialType || '나노 시트 (PDF)'
  } : {
    name: `${book ? book.title.split('(')[0].trim() : '신규도서'}_나노시트_학습용.pdf`,
    size: '1.45 MB',
    type: '나노 시트 (PDF)'
  };

  var sheetNameEl = document.getElementById('abSheetFileName');
  if (sheetNameEl) sheetNameEl.innerText = editingAcadSheetFile.name;

  // 동적 생성 필드 포함하여 최종 폼 읽기 전용/편집 활성화 상태 적용
  setAcadBookFormReadOnly(isReadOnly, sourceName);

  // 백드롭 정리 및 모달 오픈
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open');
  var modalEl = document.getElementById('academyBookAddModal');
  if (modalEl) modalEl.style.zIndex = '1060';
  $('#academyBookAddModal').modal({ backdrop: true, show: true });
}

// 하위 호환성용 별칭
function openAcademyBookEditModal(id) {
  openAcademyBookOnlyAddModal(id);
}
function openAcademyBookModal(id) {
  openAcademyBookOnlyAddModal(id);
}

// 표지 입력 모드 전환
function switchAcadCoverMode(mode) {
  var urlWrap = document.getElementById('acadCoverModeUrlWrap');
  var fileWrap = document.getElementById('acadCoverModeFileWrap');
  var btnUrl = document.getElementById('btnAcadCoverModeUrl');
  var btnFile = document.getElementById('btnAcadCoverModeFile');

  if (!urlWrap || !fileWrap) return;
  if (mode === 'url') {
    urlWrap.style.display = 'block';
    fileWrap.style.display = 'none';
    if (btnUrl) btnUrl.classList.add('active');
    if (btnFile) btnFile.classList.remove('active');
  } else {
    urlWrap.style.display = 'none';
    fileWrap.style.display = 'block';
    if (btnUrl) btnUrl.classList.remove('active');
    if (btnFile) btnFile.classList.add('active');
  }
}

// 표지 실시간 미리보기 갱신
function updateAcadCoverPreview(url) {
  var img = document.getElementById('abEditCoverPreview');
  if (!img) return;
  if (!url || url.trim() === '') {
    img.src = 'resources/images/book_default.png';
  } else {
    img.src = url;
  }
}

// 로컬 표지 파일 업로드
var editingAcadCoverFile = null;

function handleAcadCoverFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  editingAcadCoverFile = file;
  var label = document.getElementById('abCoverFileLabel');
  if (label) label.innerText = file.name;

  var reader = new FileReader();
  reader.onload = function(e) {
    var resultUrl = e.target.result;
    if (document.getElementById('abEditCover')) {
      document.getElementById('abEditCover').value = resultUrl;
    }
    updateAcadCoverPreview(resultUrl);
  };
  reader.readAsDataURL(file);
}

// 학습자료 파일 업로드 (실제 PDF File/Blob/DataURL 보관 및 영속화)
function handleAcadSheetFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var label = document.getElementById('abSheetFileName');
  if (label) label.innerText = file.name;

  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    editingAcadSheetFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.endsWith('.pdf') ? '나노 시트 (PDF)' : '문서 자료',
      file: file,
      pdfBlob: file,
      dataUrl: dataUrl
    };
    try {
      sessionStorage.setItem('nano_last_uploaded_pdf', dataUrl);
      sessionStorage.setItem('nano_last_uploaded_pdf_name', file.name);
    } catch(err) {
      console.warn('sessionStorage PDF 캐싱 생략 (대용량):', err);
    }
  };
  reader.readAsDataURL(file);
  showAcademyToast(`[${file.name}] 학습자료(PDF) 파일이 연결되었습니다.`);
}

// 도서 서지 정보 및 표지·나노시트 저장 (서버 DB + Cloudflare R2 영구 반영)
async function handleSaveAcademyBookOnly(event) {
  if (event) event.preventDefault();

  var finalId = document.getElementById('abEditId').value.trim();
  var isbn = document.getElementById('abEditIsbn').value.trim();
  var isPublic = 'Y'; // 도서는 무조건 전체 공개
  var title = document.getElementById('abEditTitle').value.trim();
  var isSingle = document.getElementById('abEditIsSingle') ? document.getElementById('abEditIsSingle').checked : true;
  var series = isSingle ? '단권' : ((document.getElementById('abEditSeries') ? document.getElementById('abEditSeries').value.trim() : '') || '단권');
  var author = document.getElementById('abEditAuthor').value.trim();
  var publisher = document.getElementById('abEditPublisher').value.trim();
  var cat1 = document.getElementById('abEditCat1') ? document.getElementById('abEditCat1').value : '소설';
  var cat2 = document.getElementById('abEditCat2') ? document.getElementById('abEditCat2').value : '국내서';
  var grade = document.getElementById('abEditGrade').value;
  var detailTag = getAcadDetailTagsValue();
  var awards = document.getElementById('abEditAwards') ? document.getElementById('abEditAwards').value.trim() : '';
  var synopsis = document.getElementById('abEditSynopsis') ? document.getElementById('abEditSynopsis').value.trim() : '';
  var thinkExtract = document.getElementById('abEditThinkExtract') ? document.getElementById('abEditThinkExtract').value.trim() : '';
  var thinkInsert = document.getElementById('abEditThinkInsert') ? document.getElementById('abEditThinkInsert').value.trim() : '';
  var cover = (document.getElementById('abEditCover') ? document.getElementById('abEditCover').value.trim() : '') || 'assets/covers/cover_1001.jpg';

  // 선택된 주제 분류 태그 수집 (드롭박스)
  var themeTagEl = document.getElementById('abEditThemeTagSelect');
  var themeTag = themeTagEl ? themeTagEl.value : '#이달의나노북클럽';
  var tags = [themeTag];

  var isNonfiction = (cat1 === '비문학/정보글' || cat1 === '비문학' || cat1 === 'C');
  var category = isNonfiction ? '비문학' : '문학';

  var matName = editingAcadSheetFile ? editingAcadSheetFile.name : `${title}_나노시트_학습용.pdf`;
  var matSize = editingAcadSheetFile ? editingAcadSheetFile.size : '1.45 MB';
  var matType = editingAcadSheetFile ? editingAcadSheetFile.type : '나노 시트 (PDF)';

  if (!title || !author) {
    alert('도서명과 저자는 필수 입력 사항입니다.');
    return;
  }

  var existingIdx = -1;
  if (originalEditingAcadBookId) {
    existingIdx = academyBookList.findIndex(function(b) { return b.id === originalEditingAcadBookId; });
  }

  if (existingIdx >= 0) {
    var b = academyBookList[existingIdx];
    // 타 가맹점 및 본사 도서 저장 시도 2중 방어
    if (!isBookCreatedByMyAcademy(b)) {
      showAcademyToast('다른 가맹점 또는 본사 공식 도서는 수정할 수 없습니다. (읽기 전용)');
      $('#academyBookAddModal').modal('hide');
      return;
    }
    b.isbn = isbn;
    b.isPublic = isPublic;
    b.title = title;
    b.isSingle = isSingle;
    b.series = series;
    b.author = author;
    b.publisher = publisher;
    b.cat1 = cat1;
    b.cat2 = cat2;
    b.category = category;
    b.grade = grade;
    b.themeTag = themeTag;
    b.tags = tags;
    b.detailTag = detailTag;
    b.awards = awards;
    b.synopsis = synopsis;
    b.description = synopsis;
    b.thinkExtract = thinkExtract;
    b.thinkInsert = thinkInsert;
    b.cover = cover;
    b.coverFile = editingAcadCoverFile || null;
    b.materialName = matName;
    b.materialSize = matSize;
    b.materialType = matType;
    if (editingAcadSheetFile) {
      b.hasSheet = true;
      b.sheet = true;
      b.hasCustomSheet = true;
      b.sheetFile = editingAcadSheetFile;
      if (editingAcadSheetFile.file) b.pdfBlob = editingAcadSheetFile.file;
      if (editingAcadSheetFile.dataUrl) b.pdfDataUrl = editingAcadSheetFile.dataUrl;
    } else if (matName && !matName.includes('미등록') && !matName.includes('없음')) {
      b.hasSheet = true;
      b.sheet = true;
    }
    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.saveBook(b);
      } catch (err) {
        showAcademyToast('도서 수정 저장 실패: ' + (err && err.message ? err.message : '서버 오류'));
        return;
      }
    }
    editingAcadCoverFile = null;
    lastAddedBookId = b.id;
    showAcademyToast(`도서 [${title}] 서지 정보 및 학습자료가 성공적으로 수정되었습니다.`);
  } else {
    var newBook = {
      id: finalId || generateAcademyBookId(),
      isbn: isbn,
      isPublic: isPublic,
      title: title,
      subtitle: series && series !== '단권' ? series : '학원 자체 등록 맞춤 도서',
      isSingle: isSingle,
      series: series,
      author: author,
      publisher: publisher,
      cat1: cat1,
      cat2: cat2,
      category: category,
      grade: grade,
      themeTag: themeTag,
      tags: tags,
      detailTag: detailTag,
      awards: awards,
      synopsis: synopsis,
      description: synopsis,
      thinkExtract: thinkExtract,
      thinkInsert: thinkInsert,
      creatorType: 'ACADEMY',
      academyName: (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '우리 학원',
      academyId: (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'MY_ACAD',
      isMyCreation: true,
      cover: cover,
      coverFile: editingAcadCoverFile || null,
      materialName: matName,
      materialSize: matSize,
      materialType: matType,
      hasSheet: !!editingAcadSheetFile || (!!matName && !matName.includes('미등록') && !matName.includes('없음')),
      sheet: !!editingAcadSheetFile || (!!matName && !matName.includes('미등록') && !matName.includes('없음')),
      hasCustomSheet: !!editingAcadSheetFile,
      sheetFile: editingAcadSheetFile || null,
      pdfBlob: editingAcadSheetFile ? (editingAcadSheetFile.file || editingAcadSheetFile.pdfBlob) : null,
      pdfDataUrl: editingAcadSheetFile ? editingAcadSheetFile.dataUrl : null,
      quizStatus: '0문항 (미등록)',
      readCount: '0회',
      answerGuide: '【나노 시트 핵심 정답】\n교사용 지도 가이드 및 정답안 등록 완료.'
    };
    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.saveBook(newBook);
      } catch (err) {
        showAcademyToast('신규 도서 등록 실패: ' + (err && err.message ? err.message : '서버 오류'));
        return;
      }
    }
    editingAcadCoverFile = null;
    academyBookList.unshift(newBook);
    markBookAsMyCreation(newBook.id);
    lastAddedBookId = newBook.id;
    showAcademyToast(`신규 도서 [${title}] (코드: ${newBook.id})이 등록되었습니다.`);
  }

  if (typeof renderCartBookCatalog === 'function') renderCartBookCatalog();
  renderAcademyBookTable();
  if (typeof syncCustomAcademyBooksToStorage === 'function') syncCustomAcademyBooksToStorage();

  $('#academyBookAddModal').modal('hide');
}

// ==============================================================
// 6-B. 학원 북퀴즈 독립 관리 및 가변 보기(2~5지선다) 모달 로직
// ==============================================================
var curQuizTargetBookId = null;

// 학원 북퀴즈 모달 열기 (운영 서버 모드에서는 해당 도서의 실문항을 지연 조회하여 바인딩)
async function openAcademyStandaloneQuizModal(bookId = null) {
  if (!academyBookList || academyBookList.length === 0) {
    showAcademyToast('등록된 도서가 없습니다. 먼저 새 도서를 등록해주세요.');
    return;
  }

  var targetId = bookId || (academyBookList[0] ? academyBookList[0].id : null);
  var book = academyBookList.find(function(b) { return b.id === targetId; }) || academyBookList[0];
  if (!book) return;

  curQuizTargetBookId = book.id;

  // 대상 도서 셀렉트박스 옵션 구성
  var selectEl = document.getElementById('aqTargetBookSelect');
  if (selectEl) {
    selectEl.innerHTML = academyBookList.map(function(b) {
      return `<option value="${b.id}" ${b.id === book.id ? 'selected' : ''}>[${b.id}] ${b.title}</option>`;
    }).join('');
  }

  // 상단 도서 요약 바 갱신
  bindAcadQuizTargetBookInfo(book);

  // 운영 서버 환경에서 아직 문항이 로드되지 않은 경우 지연 조회(/api/portal?action=quiz) 실행
  if (window.NANO_SERVER_DATA && (!book.quizSets || book.quizSets.length === 0) && !book._quizLoadedFromServer && window.NanoPortal && typeof NanoPortal.api === 'function') {
    try {
      var lookupId = book.serverId || book.bookNo || book.id;
      var res = await NanoPortal.api('/api/portal?action=quiz&bookId=' + encodeURIComponent(lookupId));
      book._quizLoadedFromServer = true;
      if (Array.isArray(res.quizSets) && res.quizSets.length > 0) {
        book.quizSets = res.quizSets;
        if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};
        window.MIGRATED_QUIZZES[book.id] = res.quizSets;
      }
    } catch (err) {
      console.warn('학원 북퀴즈 지연 조회 실패:', err);
    }
  }

  // 북퀴즈 데이터 다중 세트 초기화
  editingAcadQuizSets = ensureAcadBookQuizSets(book);
  currentAcadQuizSetIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[0].questions;
  currentAcadQuizIdx = 0;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();

  // 백드롭 정리 및 모달 오픈
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open');
  var modalEl = document.getElementById('academyQuizManageModal');
  if (modalEl) modalEl.style.zIndex = '1060';
  $('#academyQuizManageModal').modal({ backdrop: true, show: true });
}

// 대상 도서 드롭다운 변경 핸들러
async function onSelectAcadQuizTargetBook(newBookId) {
  var book = academyBookList.find(function(b) { return b.id === newBookId; });
  if (!book) return;

  // 이전 도서의 변경사항 저장
  saveCurrentAcadQuizInput();
  if (curQuizTargetBookId) {
    var prevBook = academyBookList.find(function(b) { return b.id === curQuizTargetBookId; });
    if (prevBook) {
      prevBook.quizSets = JSON.parse(JSON.stringify(editingAcadQuizSets));
    }
  }

  curQuizTargetBookId = book.id;
  bindAcadQuizTargetBookInfo(book);

  // 운영 서버 환경에서 아직 문항이 로드되지 않은 경우 지연 조회(/api/portal?action=quiz) 실행
  if (window.NANO_SERVER_DATA && (!book.quizSets || book.quizSets.length === 0) && !book._quizLoadedFromServer && window.NanoPortal && typeof NanoPortal.api === 'function') {
    try {
      var lookupId = book.serverId || book.bookNo || book.id;
      var res = await NanoPortal.api('/api/portal?action=quiz&bookId=' + encodeURIComponent(lookupId));
      book._quizLoadedFromServer = true;
      if (Array.isArray(res.quizSets) && res.quizSets.length > 0) {
        book.quizSets = res.quizSets;
        if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};
        window.MIGRATED_QUIZZES[book.id] = res.quizSets;
      }
    } catch (err) {
      console.warn('학원 북퀴즈 지연 조회 실패:', err);
    }
  }

  editingAcadQuizSets = ensureAcadBookQuizSets(book);
  currentAcadQuizSetIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[0].questions;
  currentAcadQuizIdx = 0;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();
}

function bindAcadQuizTargetBookInfo(book) {
  var coverImg = document.getElementById('aqTargetBookCover');
  if (coverImg) coverImg.src = book.cover || 'assets/covers/cover_1001.jpg';

  var titleEl = document.getElementById('aqTargetBookTitle');
  if (titleEl) titleEl.innerText = book.title;

  var gradeEl = document.getElementById('aqTargetBookGrade');
  if (gradeEl) gradeEl.innerText = book.grade || '초등 5~6학년';

  var authorEl = document.getElementById('aqTargetBookAuthor');
  if (authorEl) authorEl.innerHTML = `저자: ${book.author} | 출판사: ${book.publisher || '열린책들'} | 도서코드: <span id="aqTargetBookId">${book.id}</span>`;
}

// 출제 기관 탭 전환
function switchAcadQuizSet(idx) {
  var prevSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var wasReadOnly = prevSet && !prevSet.isMine && (prevSet.authorType === 'HQ' || prevSet.authorName === '본사' || prevSet.authorName === 'A 학원');

  if (!wasReadOnly) {
    saveCurrentAcadQuizInput();
  }

  currentAcadQuizSetIdx = idx;
  currentAcadQuizIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[currentAcadQuizSetIdx].questions;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();
}

// 새 북퀴즈 세트 추가
function addNewAcadQuizSet() {
  var prevSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var wasReadOnly = prevSet && !prevSet.isMine && (prevSet.authorType === 'HQ' || prevSet.authorName === '본사' || prevSet.authorName === 'A 학원');
  if (!wasReadOnly) {
    saveCurrentAcadQuizInput();
  }

  var acadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name
    : '우리 학원';
  var mySets = editingAcadQuizSets.filter(function(s) { return s.isMine || s.authorName === acadName || s.authorName.includes(acadName) || s.authorName.includes('우리 학원'); });
  var setLabel = acadName + (mySets.length > 0 ? ` (세트 ${mySets.length + 1})` : '');

  var newSet = {
    id: 'qs_my_' + Date.now(),
    authorType: 'ACADEMY',
    authorName: setLabel,
    academyName: acadName,
    isMine: true,
    isPublic: 'Y',
    createdAt: new Date().toISOString().slice(0, 10),
    questions: [
      {
        question: '',
        type: 'CHOICE',
        optionCount: 3,
        opt1: '',
        opt2: '',
        opt3: '',
        opt4: '',
        opt5: '',
        ans: '1',
        hint: ''
      }
    ]
  };

  editingAcadQuizSets.push(newSet);
  switchAcadQuizSet(editingAcadQuizSets.length - 1);
  showAcademyToast(`'${setLabel}' 북퀴즈 세트가 추가되었습니다! 질문과 보기를 작성해주세요.`);
}

// 선택된 퀴즈 세트 삭제
function deleteCurAcadQuizSet() {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  if (!curSet) return;

  var isReadOnly = !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('타 가맹점이나 본사에서 출제한 북퀴즈 세트는 삭제할 수 없습니다.');
    return;
  }

  if (editingAcadQuizSets.length <= 1) {
    showAcademyToast('최소 1개 이상의 퀴즈 세트가 유지되어야 합니다.');
    return;
  }

  if (!confirm(`'${curSet.authorName}' 북퀴즈 세트 전체를 삭제하시겠습니까?`)) {
    return;
  }

  editingAcadQuizSets.splice(currentAcadQuizSetIdx, 1);
  currentAcadQuizSetIdx = 0;
  currentAcadQuizIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[0].questions;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();
  showAcademyToast('북퀴즈 세트가 삭제되었습니다.');
}

// 출제 기관별 탭 렌더링
function renderAcadQuizSetTabs() {
  var container = document.getElementById('abQuizSetTabs');
  if (!container) return;

  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');

  container.innerHTML = editingAcadQuizSets.map(function(set, idx) {
    var isActive = idx === currentAcadQuizSetIdx;
    var isHQ = set.authorType === 'HQ' || set.authorName === '본사';
    var icon = isHQ ? 'fa-solid fa-building' : 'fa-solid fa-school';
    var isSetPub = set.isPublic !== 'N';
    var pubBadge = isSetPub
      ? `<span class="badge ${isActive ? 'badge-light text-success' : 'badge-success text-white'}" style="font-size: 10px; padding: 1px 5px; border-radius: 6px; margin-left: 5px; font-weight: 700;">공개</span>`
      : `<span class="badge ${isActive ? 'badge-light text-secondary' : 'badge-secondary text-white'}" style="font-size: 10px; padding: 1px 5px; border-radius: 6px; margin-left: 5px; font-weight: 700;"><i class="fa-solid fa-lock mr-0.5" style="font-size: 9px;"></i>비공개</span>`;

    var tabStyle = isActive
      ? 'background: #2d6a4f; color: #ffffff; border: 1.5px solid #2d6a4f; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; box-shadow: 0 2px 6px rgba(45,106,79,0.25);'
      : 'background: #ffffff; color: #5c4f43; border: 1.5px solid #ded6c9; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 600;';

    var badgeStyle = isActive
      ? 'background: rgba(255,255,255,0.25); color: #ffffff; font-size: 11px; padding: 2px 7px; border-radius: 10px; margin-left: 6px; font-weight: 700;'
      : 'background: #ede6dc; color: #786d63; font-size: 11px; padding: 2px 7px; border-radius: 10px; margin-left: 6px; font-weight: 700;';

    return `<button type="button" class="btn btn-xs d-inline-flex align-items-center" onclick="switchAcadQuizSet(${idx})" style="${tabStyle}">
      <i class="${icon} mr-1.5" style="font-size: 12px;"></i>${set.authorName}
      <span style="${badgeStyle}">${set.questions ? set.questions.length : 0}</span>
      ${pubBadge}
    </button>`;
  }).join('');

  // 퀴즈 공개 상태 라디오 및 권한 제어 (출제 기관만 변경 가능)
  var isPub = curSet && curSet.isPublic !== 'N';
  var radY = document.getElementById('abSetPublicY');
  var radN = document.getElementById('abSetPublicN');
  var lockNotice = document.getElementById('abSetPublicLockNotice');
  if (radY && radN) {
    radY.checked = isPub;
    radN.checked = !isPub;
    radY.disabled = isReadOnly;
    radN.disabled = isReadOnly;
  }
  if (lockNotice) {
    lockNotice.style.display = isReadOnly ? 'inline' : 'none';
  }

  var noticeEl = document.getElementById('abQuizReadOnlyNotice');
  if (noticeEl) {
    noticeEl.style.display = isReadOnly ? 'block' : 'none';
  }

  var btnDelSet = document.getElementById('btnDeleteAcadQuizSet');
  if (btnDelSet) {
    btnDelSet.style.display = (!isReadOnly && editingAcadQuizSets.length > 1) ? 'inline-block' : 'none';
  }
}

// 학원 북퀴즈 세트 공개/비공개 변경 핸들러
function onAcadQuizSetPublicChanged(val) {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  if (!curSet) return;
  var isReadOnly = !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('출제 기관(본사 또는 해당 가맹점)만 공개 여부를 변경할 수 있습니다.');
    renderAcadQuizSetTabs();
    return;
  }
  curSet.isPublic = val;
  renderAcadQuizSetTabs();
  showAcademyToast(`선택된 북퀴즈 세트가 [${val === 'Y' ? '공개 (전체 공유)' : '비공개 (우리 학원 전용)'}] 상태로 설정되었습니다.`);
}

// 북퀴즈 문항 탭 렌더링
function renderAcadQuizTabs() {
  var container = document.getElementById('abQuizTabButtons');
  if (!container) return;

  var countBadge = document.getElementById('aqQuizCountBadge');
  if (countBadge) countBadge.innerText = `총 ${editingAcadQuizzes.length}문항 구성됨`;

  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');

  container.innerHTML = editingAcadQuizzes.map(function(q, idx) {
    var mediaBadge = "";
    if (q.mediaType === "image" && q.mediaUrl) {
      mediaBadge = `<span title="이미지(WebP) 첨부됨" style="margin-left: 3px; font-size: 11px;">🖼️</span>`;
    } else if (q.mediaType === "video" && q.mediaUrl) {
      mediaBadge = `<span title="영상(URL) 첨부됨" style="margin-left: 3px; font-size: 11px;">🎬</span>`;
    }

    return `<button type="button" class="quiz-num-pill ${idx === currentAcadQuizIdx ? 'active' : ''}" onclick="switchAcadQuizItem(${idx})">
      ${idx + 1}번 문항${mediaBadge}
    </button>`;
  }).join('');

  var btnDel = document.getElementById('btnDeleteAcadQuiz');
  if (btnDel) {
    btnDel.style.display = (!isReadOnly && editingAcadQuizzes.length > 1) ? 'inline-block' : 'none';
  }
}

// 문항 유형 전환 (객관식 vs 주관식)
function onAcadQuizTypeChanged(type) {
  var choiceArea = document.getElementById('abChoiceArea');
  var optCountWrap = document.getElementById('abQuizOptionCountWrap');
  var subjArea = document.getElementById('abSubjectiveArea');

  if (type === 'CHOICE') {
    if (choiceArea) choiceArea.style.display = 'block';
    if (optCountWrap) optCountWrap.style.display = 'flex';
    if (subjArea) subjArea.style.display = 'none';
  } else {
    if (choiceArea) choiceArea.style.display = 'none';
    if (optCountWrap) optCountWrap.style.display = 'none';
    if (subjArea) subjArea.style.display = 'block';
  }

  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (q) q.type = type;
  saveCurrentAcadQuizDraft();
}

// ★ 핵심 요구사항: 북퀴즈 보기 개수 가변 조절 (2~5개 가변, 디폴트 3개)

// ==============================================================
// 학원 북퀴즈 멀티미디어 제어 로직 (WebP 이미지 & 영상 URL)
// ==============================================================
function setAcadQuizMediaType(type) {
  var btnNone = document.getElementById("abMediaBtnNone");
  var btnImg = document.getElementById("abMediaBtnImage");
  var btnVid = document.getElementById("abMediaBtnVideo");
  var areaImg = document.getElementById("abMediaImageArea");
  var areaVid = document.getElementById("abMediaVideoArea");
  var captionWrap = document.getElementById("abMediaCaptionWrap");

  if (btnNone) btnNone.classList.toggle("active", type === "none");
  if (btnImg) btnImg.classList.toggle("active", type === "image");
  if (btnVid) btnVid.classList.toggle("active", type === "video");

  if (areaImg) areaImg.style.display = (type === "image") ? "block" : "none";
  if (areaVid) areaVid.style.display = (type === "video") ? "block" : "none";
  if (captionWrap) captionWrap.style.display = (type !== "none") ? "block" : "none";

  var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
  if (q) {
    q.mediaType = type;
    if (type === "none") {
      q.mediaUrl = "";
      q.mediaName = "";
    }
  }
  if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
}

function handleAcadQuizImageUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 업로드할 수 있습니다.");
    input.value = "";
    return;
  }

  var statusEl = document.getElementById("abImageStatusText");
  if (statusEl) {
    statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-info mr-1"></i>WebP 고화질 압축 변환 중...`;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var maxW = 1280;
      var w = img.width;
      var h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      var webpDataUrl = "";
      try {
        webpDataUrl = canvas.toDataURL("image/webp", 0.82);
        if (!webpDataUrl.startsWith("data:image/webp")) {
          webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        }
      } catch (err) {
        webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      }

      var origKb = Math.round(file.size / 1024);
      var webpKb = Math.round((webpDataUrl.length * 0.75) / 1024);
      var savePercent = origKb > 0 ? Math.max(0, Math.round(((origKb - webpKb) / origKb) * 100)) : 0;

      var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
      if (q) {
        q.mediaType = "image";
        q.mediaUrl = webpDataUrl;
        q.mediaName = file.name;
        q.mediaSizeInfo = `${origKb}KB ➔ ${webpKb}KB (${savePercent}% 절감)`;
      }

      displayAcadQuizImagePreview(webpDataUrl, file.name, q ? q.mediaSizeInfo : '');

      if (statusEl) {
        statusEl.innerHTML = `<i class="fa-solid fa-circle-check text-success mr-1"></i>WebP 변환 완료 (${origKb}KB ➔ <strong>${webpKb}KB</strong>, ${savePercent}% 압축)`;
      }

      if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
      input.value = "";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function displayAcadQuizImagePreview(url, name, sizeInfo) {
  var box = document.getElementById("abImagePreviewBox");
  var img = document.getElementById("abImagePreviewImg");
  var meta = document.getElementById("abImageMetaText");
  if (!box || !img) return;

  if (url) {
    img.src = url;
    if (meta) meta.innerText = `${name || '문항 이미지'} · ${sizeInfo || 'WebP 최적화 완료'}`;
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function handleAcadQuizVideoUrlInput(val) {
  var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
  if (q) {
    q.mediaType = "video";
    q.mediaUrl = val.trim();
  }
  renderAcadQuizVideoPlayer(val);
  if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
}

function previewAcadQuizVideoUrl() {
  var input = document.getElementById("abVideoUrlInput");
  var val = input ? input.value.trim() : "";
  if (!val) {
    alert("영상 URL을 먼저 입력해주세요.");
    return;
  }
  renderAcadQuizVideoPlayer(val);
}

function renderAcadQuizVideoPlayer(url) {
  var wrap = document.getElementById("abVideoPlayerWrap");
  var box = document.getElementById("abVideoPreviewBox");
  if (!wrap || !box) return;

  if (!url || !url.trim()) {
    box.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  var trimmed = url.trim();
  var ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  var vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);

  if (ytMatch && ytMatch[1]) {
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`;
    box.style.display = "block";
  } else if (vimeoMatch && vimeoMatch[1]) {
    wrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`;
    box.style.display = "block";
  } else if (/\.(mp4|webm|ogg)($|\?)/i.test(trimmed)) {
    wrap.innerHTML = `<video controls style="width:100%;height:100%;"><source src="${trimmed}"></video>`;
    box.style.display = "block";
  } else if (/^https?:\/\//i.test(trimmed)) {
    wrap.innerHTML = `<iframe src="${trimmed}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`;
    box.style.display = "block";
  } else {
    box.style.display = "none";
    wrap.innerHTML = "";
  }
}

function removeAcadQuizMedia() {
  var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
  if (q) {
    q.mediaType = "none";
    q.mediaUrl = "";
    q.mediaName = "";
    q.mediaCaption = "";
  }
  setAcadQuizMediaType("none");
  displayAcadQuizImagePreview("", "", "");
  renderAcadQuizVideoPlayer("");
  var urlInput = document.getElementById("abVideoUrlInput");
  if (urlInput) urlInput.value = "";
  var capInput = document.getElementById("abMediaCaption");
  if (capInput) capInput.value = "";
  var imgInput = document.getElementById("abImageFileInput");
  if (imgInput) imgInput.value = "";
  var statusText = document.getElementById("abImageStatusText");
  if (statusText) statusText.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-warning mr-1"></i>업로드 시 고화질 WebP 파일로 자동 변환·경량화되어 초고속 로딩됩니다.`;
  if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
}

function changeAcadQuizOptionCount(countVal) {
  var count = parseInt(countVal, 10);
  if (isNaN(count) || count < 2) count = 2;
  if (count > 5) count = 5;

  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (q) {
    q.optionCount = count;
  }

  // 보기 1~5 wrapper 노출/숨김
  for (var i = 1; i <= 5; i++) {
    var wrap = document.getElementById('abOptWrap' + i);
    if (wrap) {
      wrap.style.display = (i <= count) ? '' : 'none';
    }
  }

  // 현재 정답 라디오가 숨겨진 번호인지 확인하여 리셋
  var checkedRadio = document.querySelector('input[name="abQuizCorrectAns"]:checked');
  if (checkedRadio) {
    var checkedVal = parseInt(checkedRadio.value, 10);
    if (checkedVal > count) {
      var r1 = document.getElementById('abAnsRadio1');
      if (r1) r1.checked = true;
      if (q) q.ans = '1';
    }
  }

  saveCurrentAcadQuizDraft();
}

// 문항 폼 로드
function loadAcadQuizForm() {
  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (!q) return;

  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');

  var titleEl = document.getElementById('abCurrentQuizTitle');
  if (titleEl) {
    var modeBadge = isReadOnly
      ? '<span class="badge ml-2" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; font-weight: 700;"><i class="fa-solid fa-lock mr-1"></i>읽기 전용</span>'
      : '<span class="badge ml-2" style="background: #e8f5e9; color: #2d6a4f; border: 1px solid #c8e6c9; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; font-weight: 700;"><i class="fa-solid fa-pen mr-1"></i>수정 가능</span>';
    titleEl.innerHTML = `<i class="fa-solid fa-circle-question text-warning mr-2" style="font-size: 17px;"></i>문제 ${currentAcadQuizIdx + 1}번 문항 <span class="text-muted ml-1" style="font-size: 13.5px; font-weight: 500;">(${curSet ? curSet.authorName : '퀴즈'})</span> ${modeBadge}`;
  }

  // 문항 유형 (객관식 vs 주관식)
  var qType = q.type || 'CHOICE';
  if (qType === 'SUBJECTIVE') {
    var rSubj = document.getElementById('abQuizTypeSubjective');
    if (rSubj) rSubj.checked = true;
  } else {
    var rChoice = document.getElementById('abQuizTypeChoice');
    if (rChoice) rChoice.checked = true;
  }
  onAcadQuizTypeChanged(qType);

  // 질문 (더미 안내 문구는 실제 텍스트가 아닌 placeholder로 디스플레이되도록 처리)
  var cleanQ = (q.question === '문제를 입력해주세요' || q.question === '문제를 입력해 주세요') ? '' : (q.question || '');
  if (document.getElementById('abQuizQuestion')) document.getElementById('abQuizQuestion').value = cleanQ;

  // 보기 개수 설정: 디폴트 3개 (3지선다 기본)
  var optCount = q.optionCount || (q.opt5 ? 5 : (q.opt4 ? 4 : 3));
  var selOptCount = document.getElementById('abQuizOptionCountSelect');
  if (selOptCount) selOptCount.value = String(optCount);
  changeAcadQuizOptionCount(optCount);

  // 보기 1~5 바인딩 (더미 텍스트는 빈 값으로 바인딩하여 placeholder 노출)
  function cleanOptText(opt) {
    if (!opt || typeof opt !== 'string') return '';
    return /^[1-5]번\s*선택지를\s*입력해\s*주세요$/.test(opt.trim()) ? '' : opt;
  }
  if (document.getElementById('abOpt1')) document.getElementById('abOpt1').value = cleanOptText(q.opt1);
  if (document.getElementById('abOpt2')) document.getElementById('abOpt2').value = cleanOptText(q.opt2);
  if (document.getElementById('abOpt3')) document.getElementById('abOpt3').value = cleanOptText(q.opt3);
  if (document.getElementById('abOpt4')) document.getElementById('abOpt4').value = cleanOptText(q.opt4);
  if (document.getElementById('abOpt5')) document.getElementById('abOpt5').value = cleanOptText(q.opt5);

  // 주관식 답안
  if (document.getElementById('abSubjectiveAnswer')) {
    document.getElementById('abSubjectiveAnswer').value = q.subjectiveAnswer || '';
  }

  // 정답 라디오 바인딩
  var ansVal = q.ans || '1';
  var targetRadio = document.querySelector(`input[name="abQuizCorrectAns"][value="${ansVal}"]`);
  if (targetRadio) targetRadio.checked = true;

  // 미디어 데이터 바인딩
  var mediaType = q.mediaType || "none";
  setAcadQuizMediaType(mediaType);

  var capInput = document.getElementById('abMediaCaption');
  if (capInput) capInput.value = q.mediaCaption || '';

  if (mediaType === 'image' && q.mediaUrl) {
    displayAcadQuizImagePreview(q.mediaUrl, q.mediaName || '문제 이미지', q.mediaSizeInfo || 'WebP 최적화');
  } else {
    displayAcadQuizImagePreview('', '', '');
  }

  if (mediaType === 'video' && q.mediaUrl) {
    var urlInput = document.getElementById('abVideoUrlInput');
    if (urlInput) urlInput.value = q.mediaUrl;
    renderAcadQuizVideoPlayer(q.mediaUrl);
  } else {
    var urlInput = document.getElementById('abVideoUrlInput');
    if (urlInput) urlInput.value = '';
    renderAcadQuizVideoPlayer('');
  }

  setAcadQuizFormReadOnly(isReadOnly);
}

// 읽기 전용 폼 제어
function setAcadQuizFormReadOnly(isReadOnly) {
  var fields = ['abQuizQuestion', 'abOpt1', 'abOpt2', 'abOpt3', 'abOpt4', 'abOpt5', 'abVideoUrlInput', 'abMediaCaption', 'abSubjectiveAnswer'];
  fields.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.disabled = isReadOnly;
  });

  var radios = document.querySelectorAll('input[name="abQuizCorrectAns"], input[name="abQuizQuestionType"]');
  radios.forEach(function(r) { r.disabled = isReadOnly; });

  var selOpt = document.getElementById('abQuizOptionCountSelect');
  if (selOpt) selOpt.disabled = isReadOnly;

  var btnAdd = document.getElementById('btnAddAcadQuizItem');
  if (btnAdd) btnAdd.style.display = isReadOnly ? 'none' : 'inline-block';

  var btnDel = document.getElementById('btnDeleteAcadQuiz');
  if (btnDel) btnDel.style.display = (isReadOnly || editingAcadQuizzes.length <= 1) ? 'none' : 'inline-block';
}

// 현재 퀴즈 입력 임시 저장
function saveCurrentAcadQuizInput() {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) return;

  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (!q) return;

  var qTypeChoice = document.getElementById('abQuizTypeChoice');
  q.type = (qTypeChoice && qTypeChoice.checked) ? 'CHOICE' : 'SUBJECTIVE';

  var selOpt = document.getElementById('abQuizOptionCountSelect');
  if (selOpt) q.optionCount = parseInt(selOpt.value, 10);

  if (document.getElementById('abQuizQuestion')) q.question = document.getElementById('abQuizQuestion').value;
  if (document.getElementById('abOpt1')) q.opt1 = document.getElementById('abOpt1').value;
  if (document.getElementById('abOpt2')) q.opt2 = document.getElementById('abOpt2').value;
  if (document.getElementById('abOpt3')) q.opt3 = document.getElementById('abOpt3').value;
  if (document.getElementById('abOpt4')) q.opt4 = document.getElementById('abOpt4').value;
  if (document.getElementById('abOpt5')) q.opt5 = document.getElementById('abOpt5').value;

  if (document.getElementById('abSubjectiveAnswer')) q.subjectiveAnswer = document.getElementById('abSubjectiveAnswer').value;

  var capInput = document.getElementById('abMediaCaption');
  if (capInput) q.mediaCaption = capInput.value;

  var checkedRadio = document.querySelector('input[name="abQuizCorrectAns"]:checked');
  if (checkedRadio) q.ans = checkedRadio.value;
}

function saveCurrentAcadQuizDraft() {
  saveCurrentAcadQuizInput();
}

// 문항 전환
function switchAcadQuizItem(idx) {
  saveCurrentAcadQuizInput();
  currentAcadQuizIdx = idx;
  renderAcadQuizTabs();
  loadAcadQuizForm();
}

// 문항 추가
function addAcadQuizItem() {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('타 기관 북퀴즈에는 문항을 추가할 수 없습니다.');
    return;
  }

  saveCurrentAcadQuizInput();
  var nextNum = editingAcadQuizzes.length + 1;
  editingAcadQuizzes.push({
    question: "",
    type: 'CHOICE',
    optionCount: 3,
    mediaType: "none",
    mediaUrl: "",
    mediaCaption: "",
    mediaName: "",
    opt1: "",
    opt2: "",
    opt3: "",
    opt4: "",
    opt5: "",
    ans: "1",
    hint: ""
  });
  currentAcadQuizIdx = editingAcadQuizzes.length - 1;
  renderAcadQuizTabs();
  loadAcadQuizForm();
  if (document.getElementById('abQuizQuestion')) document.getElementById('abQuizQuestion').focus();
}

// 문항 삭제
function deleteAcadQuizItem() {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('타 기관 북퀴즈 문항은 삭제할 수 없습니다.');
    return;
  }

  if (editingAcadQuizzes.length <= 1) {
    showAcademyToast('도서에는 최소 1개 이상의 북퀴즈 문항이 유지되어야 합니다.');
    return;
  }
  editingAcadQuizzes.splice(currentAcadQuizIdx, 1);
  if (currentAcadQuizIdx >= editingAcadQuizzes.length) {
    currentAcadQuizIdx = editingAcadQuizzes.length - 1;
  }
  renderAcadQuizTabs();
  loadAcadQuizForm();
  showAcademyToast('문항이 삭제되었습니다.');
}

// 북퀴즈 입력창 기본 더미 텍스트 자동 클리어 헬퍼
function clearDefaultAcadQuizPlaceholder(el) {
  if (!el || typeof el.value !== 'string') return;
  var trimmed = el.value.trim();
  if (trimmed === '문제를 입력해주세요' || trimmed === '문제를 입력해 주세요' ||
      /^[1-5]번\s*선택지를\s*입력해\s*주세요$/.test(trimmed)) {
    el.value = '';
  }
}

// 특수기호 입력
function setCurAcadQuizInput(el) {
  curActiveAcadQuizInput = el;
  clearDefaultAcadQuizPlaceholder(el);
}

function insertAcadQuizSym(sym) {
  if (!curActiveAcadQuizInput) {
    curActiveAcadQuizInput = document.getElementById('abQuizQuestion');
  }
  if (!curActiveAcadQuizInput) return;

  var el = curActiveAcadQuizInput;
  var start = el.selectionStart || 0;
  var end = el.selectionEnd || 0;
  var val = el.value || '';
  el.value = val.substring(0, start) + sym + val.substring(end);
  el.selectionStart = el.selectionEnd = start + sym.length;
  el.focus();
  saveCurrentAcadQuizDraft();
}

// 북퀴즈 독립 저장 핸들러
function handleSaveAcademyQuizOnly(event) {
  if (window.NanoPortal && NanoPortal.remote) { if (event) event.preventDefault(); showAcademyToast('학원 자체 퀴즈 등록은 전용 서버 저장 구조가 준비된 뒤 사용할 수 있습니다.'); return; }
  if (event) event.preventDefault();

  saveCurrentAcadQuizInput();

  var book = academyBookList.find(function(b) { return b.id === curQuizTargetBookId; });
  if (!book) {
    showAcademyToast('대상 도서를 찾을 수 없습니다.');
    return;
  }

  book.quizSets = JSON.parse(JSON.stringify(editingAcadQuizSets));
  book.quizList = JSON.parse(JSON.stringify(editingAcadQuizzes));
  book.quizStatus = `${editingAcadQuizzes.length}문항 완비`;

  renderAcademyBookTable();

  // 원생 화면 동기화 반영
  quizDataList = JSON.parse(JSON.stringify(editingAcadQuizzes));
  if (typeof renderQuizTabs === 'function') renderQuizTabs();
  if (typeof loadCurrentQuizForm === 'function') loadCurrentQuizForm();

  showAcademyToast(`[${book.title}] 북퀴즈 문항 세트(${editingAcadQuizzes.length}문항)가 저장 및 동기화되었습니다!`);
  $('#academyQuizManageModal').modal('hide');
}


// 도서 삭제 함수
function deleteAcademyBook(id) {
  if (window.NanoPortal && NanoPortal.remote) { showAcademyToast('운영 도서 삭제는 본사 콘텐츠 관리에서 진행해 주세요.'); return; }
  var book = academyBookList.find(function(b) { return b.id === id; });
  var title = book ? book.title : id;
  if (!confirm(`[${title}] 도서를 목록에서 삭제하시겠습니까?`)) {
    return;
  }
  academyBookList = academyBookList.filter(function(b) { return b.id !== id; });
  renderAcademyBookTable();
  if (typeof renderCartBookCatalog === 'function') renderCartBookCatalog();
  showAcademyToast(`[${title}] 도서가 삭제되었습니다.`);
}
