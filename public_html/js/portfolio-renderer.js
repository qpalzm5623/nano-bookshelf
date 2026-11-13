/**
 * ============================================================================
 * 나노의 책장 — 포트폴리오 공용 렌더러 (Academy & Master 통합 모듈)
 * - 학원 관리자(admin_preview)와 마스터 관리자(master_preview)가 동일한 7대 섹션
 *   포트폴리오 문서(#portfolioPrintDoc)와 A4 격리 인쇄를 사용하도록 단일화합니다.
 * - 도서 정보 카테고리 1(소설 / 인물이야기(위인) / 비문학/정보글) 기반 독서 취향 분석과
 *   2열 그리드('책마다 쌓인 성장 기록' 한 줄 2권 배치)를 공통 적용합니다.
 * ============================================================================
 */
(function(window) {
  'use strict';

  var PORTFOLIO_BOOK_CATEGORIES = ['소설', '인물이야기(위인)', '비문학/정보글'];
  var PORTFOLIO_CATEGORY_COLOR_MAP = {
    '소설': '#1f8a7e',
    '인물이야기(위인)': '#f6c344',
    '비문학/정보글': '#e89936'
  };

  function escapePortfolioText(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function formatPortfolioSchoolGrade(value) {
    return String(value || '').replace(/(^|\s)(?:초등학교|초등|초|중학교|중등|중|고등학교|고등|고)\s*(?=\d\s*학년)/g, '$1').trim();
  }

  function formatPortfolioTeacher(value) {
    return String(value || '').replace(/\s*(?:지도\s*교사|담당\s*교사|지정\s*교사)\s*$/, '').trim() || '미지정';
  }

  // 도서 표지 경로 안전 검증 및 실제 존재하는 기본 표지 SVG 폴백 반환
  function resolvePortfolioBookCover(rawUrl) {
    var src = String(rawUrl || '').trim();
    if (!src || src === 'undefined' || src === 'null' || /^(javascript|vbscript):/i.test(src)) {
      return 'resources/images/book_default.svg';
    }
    if (src.indexOf('book_default.jpg') !== -1) {
      return 'resources/images/book_default.svg';
    }
    return src;
  }

  // 학원(academyBookList) 및 마스터(masterBooks / MIGRATED_BOOKS) 도서 카탈로그 통합 참조
  function getBookCatalogReference(extraCatalog) {
    if (Array.isArray(extraCatalog) && extraCatalog.length > 0) {
      return extraCatalog;
    }
    if (typeof window !== 'undefined') {
      if (Array.isArray(window.academyBookList) && window.academyBookList.length > 0) {
        return window.academyBookList;
      }
      if (Array.isArray(window.masterBooks) && window.masterBooks.length > 0) {
        return window.masterBooks;
      }
      if (Array.isArray(window.MIGRATED_BOOKS) && window.MIGRATED_BOOKS.length > 0) {
        return window.MIGRATED_BOOKS;
      }
    }
    return [];
  }

  function findMatchingCatalogBook(b, extraCatalog) {
    if (!b) return null;
    var catalog = getBookCatalogReference(extraCatalog);
    if (!catalog || catalog.length === 0) return null;
    var bTitle = String(b.title || '').trim();
    var bCleanTitle = bTitle.replace(/\s+/g, '').toLowerCase();
    var bId = String(b.bookId || b.bookNo || b.id || '').trim();

    return catalog.find(function(item) {
      if (!item) return false;
      if (bId && (String(item.serverId || '') === bId || String(item.id || '') === bId || String(item.bookNo || '') === bId)) {
        return true;
      }
      var itemTitle = String(item.title || '').trim();
      if (!itemTitle || !bTitle) return false;
      if (itemTitle === bTitle) return true;
      return itemTitle.replace(/\s+/g, '').toLowerCase() === bCleanTitle;
    }) || null;
  }

  // 도서 정보 카테고리 1(A: 소설, B: 인물이야기(위인), C: 비문학/정보글) 정규화
  function normalizePortfolioCategory1Label(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (s === '국내서' || s === '외서' || s === '구분 없음' || s === 'K' || s === 'F' || s === 'N') return '';
    var upper = s.toUpperCase();
    if (upper === 'B' || s.indexOf('인물') !== -1 || s.indexOf('위인') !== -1) return '인물이야기(위인)';
    if (upper === 'C' || s.indexOf('비문학') !== -1 || s.indexOf('정보글') !== -1 || s.indexOf('정보') !== -1) return '비문학/정보글';
    if (upper === 'A' || s === '소설') return '소설';
    return '';
  }

  function resolvePortfolioBookCategory1(b, extraCatalog) {
    if (!b) return '소설';
    var matched = findMatchingCatalogBook(b, extraCatalog);

    var directCandidates = [
      matched && matched.subCategory,
      b.subCategory,
      matched && matched.cat1,
      b.cat1
    ];
    for (var i = 0; i < directCandidates.length; i++) {
      var resolved = normalizePortfolioCategory1Label(directCandidates[i]);
      if (resolved) return resolved;
    }

    var codeCandidates = [
      b.bookNo,
      b.bookId,
      b.id,
      matched && matched.bookNo,
      matched && matched.id
    ];
    for (var j = 0; j < codeCandidates.length; j++) {
      var codeStr = String(codeCandidates[j] || '').trim().toUpperCase();
      var codeMatch = codeStr.match(/^[KFN]([ABC])\d/);
      if (codeMatch) {
        return normalizePortfolioCategory1Label(codeMatch[1]);
      }
    }

    var legacyText = [
      b.cat2,
      b.category,
      matched && matched.cat2,
      matched && matched.category,
      matched && matched.subject
    ].filter(Boolean).join(' ');
    if (/인물|위인|전기|자서전/.test(legacyText)) return '인물이야기(위인)';
    if (/비문학|정보|과학|자연|사회|역사|경제|수학|기술|철학|인문|지리/.test(legacyText)) return '비문학/정보글';
    if (/소설|문학|동화|그림책|이야기|시|수필/.test(legacyText)) return '소설';

    var titleText = String(b.title || (matched && matched.title) || '');
    if (/위인|전기|인물이야기/.test(titleText)) return '인물이야기(위인)';
    if (/과학|우주|자연|생물|역사|조선|한국사|세계사|경제|철학|수학|기술/.test(titleText)) return '비문학/정보글';

    return '소설';
  }

  function calculateRealBookCategoryStats(books, extraCatalog) {
    var counts = {
      '소설': 0,
      '인물이야기(위인)': 0,
      '비문학/정보글': 0
    };
    var total = 0;

    if (Array.isArray(books) && books.length > 0) {
      books.forEach(function(b) {
        var cat1Label = resolvePortfolioBookCategory1(b, extraCatalog);
        counts[cat1Label] = (counts[cat1Label] || 0) + 1;
        total++;
      });
    }

    var dist = {
      '소설': 0,
      '인물이야기(위인)': 0,
      '비문학/정보글': 0
    };

    if (total > 0) {
      var active = [];
      var floorSum = 0;
      PORTFOLIO_BOOK_CATEGORIES.forEach(function(catKey, orderIdx) {
        var count = counts[catKey] || 0;
        if (count <= 0) return;
        var exact = (count / total) * 100;
        var floored = Math.floor(exact);
        dist[catKey] = floored;
        floorSum += floored;
        active.push({ key: catKey, remainder: exact - floored, count: count, order: orderIdx });
      });
      var remainderToAllocate = 100 - floorSum;
      active.sort(function(a, b) {
        if (b.remainder !== a.remainder) return b.remainder - a.remainder;
        if (b.count !== a.count) return b.count - a.count;
        return a.order - b.order;
      });
      for (var k = 0; k < active.length && remainderToAllocate > 0; k++) {
        dist[active[k].key] += 1;
        remainderToAllocate--;
      }
    }

    return { dist: dist, counts: counts, total: total };
  }

  function extractRealBookTags(books, extraCatalog) {
    if (!Array.isArray(books) || books.length === 0) {
      return ['#성장소설', '#인간관계', '#철학적사유', '#공감과소통', '#자아탐색'];
    }
    var tagCounts = {};
    books.forEach(function(b) {
      var matched = findMatchingCatalogBook(b, extraCatalog);
      var rawList = [];
      if (matched) {
        if (Array.isArray(matched.tags)) rawList = rawList.concat(matched.tags);
        else if (typeof matched.tags === 'string') rawList = rawList.concat(matched.tags.split(','));
        if (matched.themeTag) rawList.push(matched.themeTag);
        if (matched.detailTag) rawList = rawList.concat(String(matched.detailTag).split(/\s+/));
        if (matched.rawTags) rawList = rawList.concat(String(matched.rawTags).split(','));
        if (matched.subject) rawList.push(matched.subject);
      }
      if (Array.isArray(b.tags)) rawList = rawList.concat(b.tags);
      else if (typeof b.tags === 'string') rawList = rawList.concat(b.tags.split(','));
      if (b.subject) rawList.push(b.subject);

      rawList.forEach(function(tag) {
        var cleaned = String(tag || '').replace(/^[#,\s]+|[,\s]+$/g, '').trim();
        if (!cleaned || cleaned.length < 2 || cleaned === '이야기' || cleaned === '전체' || cleaned === '선택') return;
        var hashTag = '#' + cleaned;
        tagCounts[hashTag] = (tagCounts[hashTag] || 0) + 1;
      });
    });

    var sortedTags = Object.keys(tagCounts).sort(function(a, b) {
      return tagCounts[b] - tagCounts[a];
    });

    if (sortedTags.length >= 3) {
      return sortedTags.slice(0, 5);
    }

    var fallbackDefaults = ['#자아성장', '#인간관계', '#상상력확장', '#공감과소통', '#문해력향상'];
    var merged = sortedTags.slice();
    fallbackDefaults.forEach(function(ft) {
      if (merged.indexOf(ft) === -1 && merged.length < 5) merged.push(ft);
    });
    return merged;
  }

  function getBookObservationComment(b, studentName, logs, extraCatalog) {
    var bTitle = String(b.title || '').trim();
    var bCleanTitle = bTitle.replace(/\s+/g, '').toLowerCase();

    // 1순위: 도서 객체 자체에 실린 교사 생각담기 코멘트 / 나노시트 AI 첨삭 요약 (마스터 DB 단건 조회 등)
    if (b.thoughtTeacherComment && String(b.thoughtTeacherComment).trim()) {
      return String(b.thoughtTeacherComment).trim();
    }
    if (b.worksheetAiResult) {
      var bw = b.worksheetAiResult;
      var bwComment = bw.summary || bw.goodPoints || '';
      if (bwComment && String(bwComment).trim()) {
        var bwCleaned = String(bwComment).replace(/\n+/g, ' ').trim();
        return bwCleaned.length > 140 ? (bwCleaned.slice(0, 137) + '…') : bwCleaned;
      }
    }

    // 2순위: 학원 화면의 실시간 learningLogs 배열 매칭
    if (Array.isArray(logs)) {
      var matchedLog = logs.find(function(l) {
        if (!l) return false;
        var lTitle = String(l.bookTitle || l.title || '').trim();
        if (!lTitle) return false;
        return lTitle === bTitle || lTitle.replace(/\s+/g, '').toLowerCase() === bCleanTitle;
      });

      if (matchedLog) {
        if (matchedLog.thoughtTeacherComment && matchedLog.thoughtTeacherComment.trim()) {
          return matchedLog.thoughtTeacherComment.trim();
        }
        if (matchedLog.worksheetAiResult) {
          var w = matchedLog.worksheetAiResult;
          var comment = w.summary || w.goodPoints || '';
          if (comment && comment.trim()) {
            var cleaned = comment.replace(/\n+/g, ' ').trim();
            if (cleaned.length > 140) cleaned = cleaned.slice(0, 137) + '…';
            return cleaned;
          }
        }
      }
    }

    // 3순위: 저장된 AI/교사 도서 성취 문구 (점수·북퀴즈 직접 언급 제거)
    if (b.achievement && String(b.achievement).indexOf('생성 전') === -1) {
      var rawAch = String(b.achievement);
      var cleanedAch = rawAch.replace(/북퀴즈(?:에서)?\s*\d+점을?\s*(?:기록|획득|받았|얻었)?[^.]*\./g, '')
                             .replace(/북퀴즈를?\s*성실히?\s*완수했습니다\.?/g, '등장인물의 선택과 감정에 깊이 공감하며 읽었습니다.')
                             .trim();
      if (cleanedAch.length >= 20) {
        return cleanedAch;
      }
    }

    // 4순위: 도서 카테고리 1 및 주제 기반 정성 관찰 서술
    var matchedBook = findMatchingCatalogBook(b, extraCatalog);
    var cat = matchedBook ? (matchedBook.category || matchedBook.subject || '') : (b.subject || '');
    var cat1Type = resolvePortfolioBookCategory1(b, extraCatalog);
    if (cat1Type === '인물이야기(위인)' || /인물|위인/.test(cat)) {
      return '《' + bTitle + '》 속 인물의 삶과 가치관, 시련을 극복하는 선택의 과정을 깊이 살펴보며, 자신의 태도와 목표를 되돌아보는 성숙한 안목을 길렀습니다.';
    } else if (/인문|철학/.test(cat)) {
      return '《' + bTitle + '》의 중심 질문을 진지하게 고민하며, 당연하게 여겼던 생각들에 대해 새로운 관점으로 질문을 던지고 가치관을 넓혀가는 성장을 이루었습니다.';
    } else if (/과학|자연/.test(cat)) {
      return '《' + bTitle + '》에 등장하는 자연과 과학 원리를 호기심을 갖고 탐구하며, 책에서 발견한 사실들을 바탕으로 논리적인 인과관계를 차분히 짚어냈습니다.';
    } else if (/사회|역사/.test(cat)) {
      return '《' + bTitle + '》을(를) 통해 다양한 시대적 배경과 사람들의 삶의 모습을 살펴보며, 공동체와 사회적 맥락을 균형 잡힌 시각으로 이해하는 안목을 길렀습니다.';
    } else if (cat1Type === '비문학/정보글') {
      return '《' + bTitle + '》에서 다루는 핵심 개념과 배경 지식을 체계적으로 정리하고, 근거와 정보를 바탕으로 논리적으로 사고를 확장하는 성장을 보여주었습니다.';
    } else if (cat1Type === '소설' || /문학|소설|동화/.test(cat)) {
      return '《' + bTitle + '》을(를) 읽으며 인물의 내면적 갈등과 선택에 깊이 공감하고, 이야기 속 상황을 자신의 일상 경험과 연결하여 풍부하게 사유하는 모습을 보였습니다.';
    }

    return '《' + bTitle + '》의 중심 서사와 핵심 맥락을 꼼꼼하게 파악하며 완독하였고, 작품 속 주제 의식을 자신의 언어로 주도적으로 정리해내는 성취를 보였습니다.';
  }

  function generateSmartTeacherNote(studentName, books, logs) {
    var worksheetHighlights = [];
    if (Array.isArray(books)) {
      books.forEach(function(b) {
        if (!b) return;
        if (b.worksheetAiResult && b.worksheetAiResult.goodPoints) {
          worksheetHighlights.push(b.worksheetAiResult.goodPoints);
        } else if (b.thoughtTeacherComment && String(b.thoughtTeacherComment).trim()) {
          worksheetHighlights.push(String(b.thoughtTeacherComment).trim());
        }
      });
    }
    if (worksheetHighlights.length === 0 && Array.isArray(logs)) {
      logs.forEach(function(l) {
        if (!l) return;
        if (l.worksheetAiResult && l.worksheetAiResult.goodPoints) {
          worksheetHighlights.push(l.worksheetAiResult.goodPoints);
        } else if (l.thoughtTeacherComment && l.thoughtTeacherComment.trim()) {
          worksheetHighlights.push(l.thoughtTeacherComment.trim());
        }
      });
    }
    var count = Array.isArray(books) ? books.length : 0;
    var note = studentName + ' 학생은 이번 기간 동안 총 ' + count + '권의 도서를 꾸준히 완독하며 책 읽는 즐거움과 주도적인 독서 태도를 훌륭하게 보여주었습니다. ';
    if (worksheetHighlights.length > 0) {
      var highlight = String(worksheetHighlights[0]).replace(/\n/g, ' ').replace(/^-\s*/, '').slice(0, 90).trim();
      note += '특히 독후 활동에서 ' + highlight + ' 점이 매우 인상적이었습니다. ';
    } else {
      note += '작품 속 다양한 인물들의 갈등과 선택에 깊이 공감하며 자신의 생각과 느낌을 주도적으로 확장해 나가는 모습이 돋보였습니다. ';
    }
    note += '앞으로도 따뜻한 인문학적 감수성과 논리적인 사고력을 바탕으로 더욱 큰 생각의 날개를 펼쳐갈 수 있도록 응원합니다.';
    return note;
  }

  function generatePortfolioInsights(student, pfData) {
    if (pfData && Array.isArray(pfData.aiInsights) && pfData.aiInsights.length > 0) {
      return pfData.aiInsights;
    }
    if (pfData && Array.isArray(pfData.aiComments) && pfData.aiComments.length > 0) {
      return pfData.aiComments;
    }

    var books = (pfData && pfData.books) || [];
    var firstTitle = (books[0] && books[0].title) ? ('《' + books[0].title + '》') : '완독 도서';

    return [
      {
        category: '문해력 & 중심 맥락 파악',
        icon: 'fa-solid fa-lightbulb',
        color: '#1f8a7e',
        comment: firstTitle + ' 등 다양한 작품에서 인물의 선택과 배경 맥락을 정밀하게 읽어내는 뛰어난 문해력을 발휘했습니다.'
      },
      {
        category: '공감 능력 & 정서적 사유',
        icon: 'fa-solid fa-heart',
        color: '#e67828',
        comment: '이야기 속 인물들의 갈등과 내면적 성장에 깊이 몰입하며 타인의 감정에 공감하는 따뜻한 인문학적 시선을 형성하고 있습니다.'
      },
      {
        category: '비판적 사고 & 문제 해결력',
        icon: 'fa-solid fa-scale-balanced',
        color: '#3b82f6',
        comment: '작품 속 사건의 인과관계를 논리적으로 분석하고, 다양한 관점에서 문제를 다각도로 짚어내는 뛰어난 사유 능력을 발휘했습니다.'
      },
      {
        category: '자기표현 & 능동적 독서 태도',
        icon: 'fa-solid fa-seedling',
        color: '#10b981',
        comment: '정해진 독서 목표를 꾸준히 달성하며 자신의 생각과 느낌을 주도적으로 정리하는 올바른 독서 습관을 확립했습니다.'
      }
    ];
  }

  function getCoordinatesForPercent(percent) {
    var x = Math.cos(2 * Math.PI * (percent / 100));
    var y = Math.sin(2 * Math.PI * (percent / 100));
    return [x, y];
  }

  function buildGenreDonutSvg(dist) {
    var total = 0;
    var keys = Object.keys(dist || {});
    for (var i = 0; i < keys.length; i++) total += Number(dist[keys[i]]) || 0;

    var colors = ['#1f8a7e', '#f6c344', '#e89936', '#72aaa1'];
    var accumulatedPercent = 0;
    var paths = [];

    if (total > 0) {
      keys.forEach(function(key, idx) {
        var val = Number(dist[key]) || 0;
        if (val <= 0) return;
        var color = PORTFOLIO_CATEGORY_COLOR_MAP[key] || colors[idx % colors.length];
        var percent = (val / total) * 100;
        if (percent >= 99.999) {
          paths.push('<circle cx="0" cy="0" r="1" fill="' + color + '"></circle>');
          return;
        }
        var startCoords = getCoordinatesForPercent(accumulatedPercent);
        accumulatedPercent += percent;
        var endCoords = getCoordinatesForPercent(accumulatedPercent);
        var largeArcFlag = percent > 50 ? 1 : 0;

        var pathData = [
          'M ' + startCoords[0] + ' ' + startCoords[1],
          'A 1 1 0 ' + largeArcFlag + ' 1 ' + endCoords[0] + ' ' + endCoords[1],
          'L 0 0'
        ].join(' ');

        paths.push('<path d="' + pathData + '" fill="' + color + '"></path>');
      });
    }

    return (
      '<svg viewBox="-1.1 -1.1 2.2 2.2" style="width:130px; height:130px; transform:rotate(-90deg); border-radius:50%; box-shadow:0 3px 10px rgba(0,0,0,0.06);">' +
        '<circle cx="0" cy="0" r="1" fill="#ece5d9"></circle>' +
        paths.join('') +
        '<circle cx="0" cy="0" r="0.65" fill="#fbf9f4"></circle>' +
      '</svg>'
    );
  }

  function buildPortfolioReportId(issueDate, pfId) {
    var dateStr = (issueDate ? String(issueDate).replace(/[^0-9]/g, '') : '20261029').slice(0, 8) || '20261029';
    var tailNum = '01';
    if (pfId) {
      var rawDigits = String(pfId).replace(/[^0-9]/g, '');
      if (rawDigits.length >= 2) tailNum = rawDigits.slice(-2);
    }
    return 'PF-' + dateStr + '-' + tailNum;
  }

  // 학원(portal-client)과 동일한 우선순위로 총평 텍스트 결정
  function resolvePortfolioTeacherNote(pfData) {
    if (!pfData) return '';
    if (pfData.teacherNote && String(pfData.teacherNote).indexOf('생성합니다') === -1 && String(pfData.teacherNote).trim()) {
      return String(pfData.teacherNote).trim();
    }
    if (pfData.commentSource === 'teacher') {
      return String(pfData.comment || pfData.aiTeacherNote || '').trim();
    }
    return String(pfData.aiTeacherNote || pfData.comment || '').trim();
  }

  // 마스터/학원 공통 7대 섹션 문서 HTML 조립 (1페이지: 요약·역량·취향, 2페이지: 2열 책별 성장 기록·총평)
  function buildPortfolioDocumentHtml(options) {
    var opts = options || {};
    var pfData = opts.pfData || {};
    var std = opts.std || null;
    var books = Array.isArray(opts.books) ? opts.books : (Array.isArray(pfData.books) ? pfData.books : []);
    var bookCatalog = opts.bookCatalog || getBookCatalogReference();
    var loadedLogs = Array.isArray(opts.loadedLogs) ? opts.loadedLogs : [];

    var studentId = String(opts.studentId || pfData.studentId || (std && std.id) || '').trim();
    var pfId = String(opts.pfId || pfData.id || '').trim();
    var studentName = String(opts.studentName || pfData.studentName || pfData.name || (std && std.name) || '학생').trim();

    var rawSchoolGrade = opts.schoolGrade || pfData.schoolGrade || '';
    if (!rawSchoolGrade) {
      var sSchool = String(pfData.school || (std && std.school) || '').trim();
      var sGrade = String(pfData.grade || (std && std.grade) || '').trim();
      if (sSchool && sGrade && sSchool.indexOf(sGrade) !== -1) rawSchoolGrade = sSchool;
      else rawSchoolGrade = [sSchool, sGrade].filter(Boolean).join(' ');
    }
    var schoolGrade = formatPortfolioSchoolGrade(rawSchoolGrade) || '-';

    var classGroup = String(opts.classGroup || pfData.classGroup || (std && std.classGroup) || '미지정').trim() || '미지정';
    var rawTeacher = String(opts.teacher || pfData.teacher || (std && (std.teacher || std.teacherName)) || '').trim();
    if (!rawTeacher || rawTeacher === '미지정' || rawTeacher === '-' || rawTeacher === '미지정 지도교사' || rawTeacher.indexOf('미지정') !== -1) {
      rawTeacher = '미지정';
    }
    var teacher = formatPortfolioTeacher(rawTeacher);

    var period = String(opts.period || pfData.period || (pfData.from && pfData.to ? (pfData.from + ' ~ ' + pfData.to) : '') || '-').trim();
    var periodHtml = escapePortfolioText(period).replace(/\d{4}-\d{2}-\d{2}/g, '<span class="pf-date">$&</span>');
    var issueDate = String(opts.issueDate || pfData.issueDate || pfData.kstDate || '-').trim();
    var reportId = opts.reportId || buildPortfolioReportId(issueDate, pfId);

    var bookCount = books.length;
    var rawAvg = Number(opts.quizAvg != null ? opts.quizAvg : (pfData.quizAvgNum != null ? pfData.quizAvgNum : String(pfData.quizAvg || '').replace(/[^0-9.]/g, '')));
    if ((!rawAvg || isNaN(rawAvg)) && books.length > 0) {
      rawAvg = books.reduce(function(sum, b) {
        var num = parseFloat(String((b && b.score) || '').replace(/[^0-9.]/g, ''));
        return sum + (isNaN(num) ? 0 : num);
      }, 0) / books.length;
    }
    if (isNaN(rawAvg)) rawAvg = 0;
    var quizAvg = Math.round(rawAvg);

    // ③ 독서에서 발견한 성장 (4대 핵심 역량)
    var insightItems = generatePortfolioInsights(std, pfData);
    var defaultCatNames = ['문해력 & 중심 맥락 파악', '공감 능력 & 정서적 사유', '비판적 사고 & 문제 해결력', '자기표현 & 능동적 독서 태도'];
    var defaultIcons = ['fa-solid fa-lightbulb', 'fa-solid fa-heart', 'fa-solid fa-scale-balanced', 'fa-solid fa-seedling'];
    var defaultCols = ['#1f8a7e', '#e67828', '#3b82f6', '#10b981'];
    var insightGridHtml = (
      '<div class="pf-insight-card-grid">' +
        insightItems.map(function(item, idx) {
          var cat = (typeof item === 'object' && item.category) ? item.category : (defaultCatNames[idx] || '독서 성장 관찰');
          var icon = (typeof item === 'object' && item.icon) ? item.icon : (defaultIcons[idx % 4]);
          var col = (typeof item === 'object' && item.color) ? item.color : (defaultCols[idx % 4]);
          var text = (typeof item === 'object' && item.comment) ? item.comment : String(item || '');
          return (
            '<div class="pf-insight-card">' +
              '<div class="pf-insight-card-head">' +
                '<i class="' + icon + '" style="color:' + col + ';"></i>' +
                '<span>' + escapePortfolioText(cat) + '</span>' +
              '</div>' +
              '<div class="pf-insight-card-body">' +
                escapePortfolioText(text) +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );

    // ④ 나의 독서 취향 (도넛 + 키워드 + 3대 카테고리 구성 비율)
    var catStats = calculateRealBookCategoryStats(books, bookCatalog);
    var dist = catStats.dist;
    var catCounts = catStats.counts;
    var distKeys = Object.keys(dist);
    var donutSvg = buildGenreDonutSvg(dist);
    var tags = extractRealBookTags(books, bookCatalog);
    var tagsHtml = tags.map(function(t) {
      return '<span class="pf-tag-badge">' + escapePortfolioText(t) + '</span>';
    }).join(' ');

    // ⑥ 책마다 쌓인 성장 기록 (한 줄 2개씩 2열 카드)
    var allowCoverZoom = opts.allowCoverZoom !== false;
    var booksGridHtml = books.map(function(b, idx) {
      var matchedBook = findMatchingCatalogBook(b, bookCatalog);
      var rawCover = (b.cover && b.cover !== 'undefined' && b.cover !== 'null')
        ? b.cover
        : ((b.coverUrl && b.coverUrl !== 'undefined' && b.coverUrl !== 'null')
            ? b.coverUrl
            : (matchedBook ? (matchedBook.cover || matchedBook.coverUrl) : ''));
      var coverUrl = resolvePortfolioBookCover(rawCover);

      var pubText = (b.pub && b.pub !== 'undefined' && b.pub !== 'null')
        ? b.pub
        : ((b.publisher && b.publisher !== 'undefined' && b.publisher !== 'null')
            ? b.publisher
            : (matchedBook ? (matchedBook.publisher || matchedBook.pub) : '나노출판'));

      var authorText = (b.author && b.author !== 'undefined' && b.author !== 'null')
        ? b.author
        : (matchedBook ? matchedBook.author : '');

      var cleanScoreText = String(b.score == null || b.score === '' ? '기록 없음' : b.score).replace(/북퀴즈\s*/g, '').trim();
      if (/^\d+(\.\d+)?$/.test(cleanScoreText)) {
        cleanScoreText = cleanScoreText + '점';
      }

      var commentText = getBookObservationComment(b, studentName, loadedLogs, bookCatalog);

      var bookDate = String(b.date || '').trim();
      var dateParts = bookDate.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:$|[T\s])/);
      var dateHtml = dateParts
        ? ('<span class="pf-book-year">(' + escapePortfolioText(dateParts[1]) + ')</span>' +
           '<span class="pf-book-month-day">' + escapePortfolioText(dateParts[2].padStart(2, '0') + '.' + dateParts[3].padStart(2, '0')) + '</span>')
        : ('<span class="pf-book-month-day">' + escapePortfolioText(bookDate || '완독일 미등록') + '</span>');

      var coverOnClick = allowCoverZoom
        ? ' onclick="' + escapePortfolioText('if(typeof openCoverModal==="function"){openCoverModal(' + JSON.stringify(coverUrl) + ', ' + JSON.stringify(b.title || '') + ', ' + JSON.stringify(pubText || '') + ');}') + '"'
        : '';

      return (
        '<article class="pf-book-col">' +
          '<div class="pf-book-row-card">' +
            '<div class="pf-book-meta-left">' +
              '<div class="pf-book-meta-info">' +
                '<span class="pf-book-number">No.' + (idx + 1) + '</span>' +
                '<span class="pf-book-date" aria-label="' + escapePortfolioText(bookDate || '완독일 미등록') + '">' + dateHtml + '</span>' +
              '</div>' +
              '<div class="pf-book-score-slot">' +
                '<span class="pf-book-score-pill">' + escapePortfolioText(cleanScoreText) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="pf-book-card-top">' +
              '<button type="button" class="pf-book-cover-wrap" aria-label="' + escapePortfolioText(b.title || '도서') + ' 표지"' + coverOnClick + (allowCoverZoom ? '' : ' style="cursor:default;" tabindex="-1"') + '>' +
                '<img src="' + escapePortfolioText(coverUrl) + '" class="pf-book-cover-img" alt="' + escapePortfolioText(b.title || '') + '" onerror="this.onerror=null; this.src=\'resources/images/book_default.svg\';">' +
              '</button>' +
              '<div class="pf-book-info-block">' +
                '<div class="pf-book-title">' + escapePortfolioText(b.title || '') + '</div>' +
                '<div class="pf-book-byline">' + escapePortfolioText((pubText || '') + (authorText ? (' · ' + authorText) : '')) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="pf-book-achievement-block">' +
              '<div class="pf-book-achievement-title"><i class="fa-solid fa-award mr-1"></i>독서 관찰</div>' +
              '<div class="pf-book-achievement-text">' + escapePortfolioText(commentText) + '</div>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    // ⑦ 선생님의 한마디
    var resolvedNote = resolvePortfolioTeacherNote(pfData);
    var currentTeacherNote = resolvedNote || generateSmartTeacherNote(studentName, books, loadedLogs);
    var allowTeacherNoteEdit = opts.allowTeacherNoteEdit !== false;
    var teacherNoteEditBtnHtml = allowTeacherNoteEdit
      ? ('<button type="button" class="btn btn-sm btn-outline-success pf-print-hide" style="font-size:11.5px; padding:2px 8px; border-radius:6px;" onclick="togglePfTeacherNoteEdit(true)" id="btnPfTeacherNoteEdit">' +
           '<i class="fa-solid fa-pen-to-square mr-1"></i>수정' +
         '</button>')
      : '';
    var teacherNoteEditWrapHtml = allowTeacherNoteEdit
      ? ('<div id="pfTeacherNoteEditWrap" style="display:none;" class="pf-print-hide mt-2">' +
           '<textarea id="pfTeacherNoteInput" class="form-control" rows="4" style="font-size:13px; border-color:#1f8a7e; line-height:1.6; resize:vertical;">' + escapePortfolioText(currentTeacherNote) + '</textarea>' +
           '<div class="d-flex justify-content-end mt-2" style="gap:8px;">' +
             '<button type="button" class="btn btn-sm btn-secondary" style="font-size:12px; padding:3px 10px;" onclick="togglePfTeacherNoteEdit(false)">취소</button>' +
             '<button type="button" class="btn btn-sm btn-success" style="font-size:12px; padding:3px 12px; background:#1f8a7e; border-color:#1f8a7e;" onclick="saveViewingPortfolioTeacherNote(' + JSON.stringify(studentId) + ', ' + JSON.stringify(pfId) + ')">' +
               '<i class="fa-solid fa-check mr-1"></i>저장' +
             '</button>' +
           '</div>' +
         '</div>')
      : '';

    return (
      '<div class="pf-page1-section">' +
        '<div class="pf-header-section mb-3 pb-3 border-bottom">' +
          '<div class="d-flex justify-content-between align-items-start mb-2 pf-header-top">' +
            '<div>' +
              '<div style="font-size:11px; font-weight:800; letter-spacing:1px; color:#1f8a7e; text-transform:uppercase;">나노의 책장 (Nano Bookshelf)</div>' +
              '<h3 class="font-weight-bold mb-1 pf-header-title">' +
                '<i class="fa-solid fa-book-bookmark text-success mr-2" style="color:#1f8a7e !important;"></i>독서 성장 포트폴리오' +
              '</h3>' +
              '<p class="text-muted mb-0" style="font-size:12px;">읽고, 생각하고, 성장한 기록을 한눈에 살펴보세요.</p>' +
            '</div>' +
            '<div class="text-right pf-header-meta">' +
              '<span class="pf-report-id mb-1">발급번호 ' + escapePortfolioText(reportId) + '</span>' +
              '<div class="text-muted" style="font-size:11.5px;">발급일: ' + escapePortfolioText(issueDate) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="pf-student-info-grid mt-2">' +
            '<div class="pf-student-info-cell"><span class="pf-info-label">학생명</span><strong class="pf-info-val">' + escapePortfolioText(studentName) + '</strong></div>' +
            '<div class="pf-student-info-cell"><span class="pf-info-label">학교 / 학년</span><strong class="pf-info-val">' + escapePortfolioText(schoolGrade) + '</strong></div>' +
            '<div class="pf-student-info-cell"><span class="pf-info-label">소속 / 지도교사</span><strong class="pf-info-val">' + escapePortfolioText(classGroup) + ' · ' + escapePortfolioText(teacher) + '</strong></div>' +
            '<div class="pf-student-info-cell"><span class="pf-info-label">분석 대상 기간</span><strong class="pf-info-val pf-info-highlight">' + periodHtml + '</strong></div>' +
          '</div>' +
        '</div>' +

        '<div class="mb-3">' +
          '<div class="pf-section-title mb-2"><i class="fa-solid fa-chart-simple"></i>이번 기간의 독서</div>' +
          '<div class="pf-stat-grid">' +
            '<div class="pf-stat-box"><div class="pf-stat-label">완독 도서수</div><div class="pf-stat-value">' + bookCount + '<span class="pf-stat-unit">권</span></div><div class="pf-stat-sub text-success font-weight-bold" style="color:#1f8a7e !important;">목표 완독 완료</div></div>' +
            '<div class="pf-stat-box"><div class="pf-stat-label">북퀴즈 완료</div><div class="pf-stat-value">' + bookCount + '<span class="pf-stat-unit">회</span></div><div class="pf-stat-sub text-success font-weight-bold" style="color:#1f8a7e !important;">응시율 100%</div></div>' +
            '<div class="pf-stat-box"><div class="pf-stat-label">평균 이해도</div><div class="pf-stat-value">' + quizAvg + '<span class="pf-stat-unit">점</span></div><div class="pf-stat-sub text-muted">북퀴즈 통과</div></div>' +
            '<div class="pf-stat-box"><div class="pf-stat-label">독서 성실도</div><div class="pf-stat-value">100<span class="pf-stat-unit">%</span></div><div class="pf-stat-sub text-success font-weight-bold" style="color:#1f8a7e !important;">성실한 루틴 완성</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="mb-3">' +
          '<div class="pf-panel">' +
            '<div class="pf-panel-head">' +
              '<h5 class="pf-section-title mb-0">' +
                '<i class="fa-solid fa-book-open-reader" style="color:#1f8a7e;"></i>독서에서 발견한 성장' +
              '</h5>' +
            '</div>' +
            insightGridHtml +
          '</div>' +
        '</div>' +

        '<div class="mb-3">' +
          '<div class="pf-section-title mb-2"><i class="fa-solid fa-pie-chart"></i>나의 독서 취향</div>' +
          '<div class="pf-preference-wrap">' +
            '<div class="pf-preference-row">' +
              '<div class="text-center pf-preference-chart-col">' +
                '<div style="position:relative; display:inline-block;">' +
                  donutSvg +
                  '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; pointer-events:none;">' +
                    '<div style="font-size:18px; font-weight:800; color:#124e47; line-height:1;">' + bookCount + '권</div>' +
                    '<div style="font-size:9.5px; color:#7d756d; font-weight:600; margin-top:2px;">누적 완독</div>' +
                  '</div>' +
                '</div>' +
                '<div class="text-muted mt-1" style="font-size:11px; font-weight:600;">도서 카테고리별 완독 분포</div>' +
              '</div>' +
              '<div class="pf-preference-detail-col">' +
                '<div class="mb-2">' +
                  '<div class="font-weight-bold mb-1.5 text-dark" style="font-size:12px;">선호 독서 테마 & 키워드</div>' +
                  '<div>' + tagsHtml + '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="font-weight-bold mb-1.5 text-dark" style="font-size:12px;">카테고리 구성 비율</div>' +
                  distKeys.map(function(k, index) {
                    var val = dist[k] || 0;
                    var cnt = (catCounts && catCounts[k]) || 0;
                    var barColor = PORTFOLIO_CATEGORY_COLOR_MAP[k] || ['#1f8a7e', '#f6c344', '#e89936', '#72aaa1'][index % 4];
                    var countLabel = bookCount > 0 ? (' (' + cnt + '권)') : '';
                    var valColor = val > 0 ? '#1f8a7e' : '#94a3b8';
                    return (
                      '<div class="mb-1.5" style="font-size:11.5px;">' +
                        '<div class="d-flex justify-content-between align-items-center mb-0.5">' +
                          '<span style="display:inline-flex; align-items:center; gap:6px; font-weight:600; color:#334155;">' +
                            '<span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:' + barColor + '; flex-shrink:0;"></span>' +
                            escapePortfolioText(k) +
                          '</span>' +
                          '<span class="font-weight-bold" style="color:' + valColor + ';">' + val + '%' + countLabel + '</span>' +
                        '</div>' +
                        '<div class="progress" style="height:5px; background:#ece5d9; border-radius:3px;">' +
                          '<div class="progress-bar" style="width:' + val + '%; background:' + barColor + '; border-radius:3px;"></div>' +
                        '</div>' +
                      '</div>'
                    );
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="pf-page-break"></div>' +

      '<div class="pf-page2-section">' +
        '<div class="pf-detail-header">' +
          '<div style="font-size:12px; font-weight:700; color:#1f8a7e;">' +
            '<i class="fa-solid fa-book-open mr-1"></i>나노의 책장 독서 성장 포트폴리오 <span class="text-muted font-weight-normal">| 도서별 세부 성취 및 지도교사 총평</span>' +
          '</div>' +
          '<div style="font-size:11px; color:#7d756d;">학생명: <strong class="text-dark">' + escapePortfolioText(studentName) + '</strong> (' + escapePortfolioText(schoolGrade) + ') · 발급번호: ' + escapePortfolioText(reportId) + '</div>' +
        '</div>' +

        '<div class="mb-3">' +
          '<div class="pf-section-title mb-2"><i class="fa-solid fa-award"></i>책마다 쌓인 성장 기록</div>' +
          '<div class="pf-books-grid-row">' +
            (booksGridHtml || '<div class="pf-empty">이 기간에 등록된 완독 도서가 없습니다.</div>') +
          '</div>' +
        '</div>' +

        '<div class="mb-3">' +
          '<div class="pf-panel pf-teacher-comment-box">' +
            '<div class="pf-panel-head d-flex justify-content-between align-items-center">' +
              '<strong class="pf-section-title mb-0"><i class="fa-solid fa-chalkboard-user mr-2 text-success" style="color:#1f8a7e !important;"></i>선생님의 한마디</strong>' +
              '<div class="d-flex align-items-center" style="gap:8px;">' +
                '<span class="pf-panel-badge">담당 교사: ' + escapePortfolioText(teacher) + '</span>' +
                teacherNoteEditBtnHtml +
              '</div>' +
            '</div>' +
            '<div id="pfTeacherNoteDisplay" style="line-height:1.75; font-size:13px; color:#374151;">' +
              escapePortfolioText(currentTeacherNote) +
            '</div>' +
            teacherNoteEditWrapHtml +
            '<div class="pf-signature mt-3 pt-2 border-top">' +
              '<span style="font-size:11px; color:#6b7280;">나노의 책장 독서 교육 연구소 인증 지도교사</span>' +
              '<div style="display:inline-flex; align-items:center; gap:5px; font-weight:700; color:#124e47; font-size:12.5px;">' +
                '<span>' + escapePortfolioText(teacher) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="pf-footer text-muted">' +
          '<div><span class="font-weight-bold" style="color:#1f8a7e;">나노의 책장</span> · 독서 교육 연구소 공식 발급 인증서</div>' +
          '<div>아이의 독서는 끝없는 가능성의 시작입니다. · © 나노의 책장 (Nano Bookshelf)</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderPortfolioDocumentHtml(docContainer, options) {
    if (!docContainer) return '';
    var html = buildPortfolioDocumentHtml(options);
    docContainer.innerHTML = html;
    return html;
  }

  // 학원/마스터 공통 격리 iframe 인쇄 (전역 모달·사이드바 인쇄 규칙 충돌 방지)
  function printHtmlInIsolatedFrame(innerHtml, bodyClass, title, onError) {
    if (typeof document === 'undefined') return;
    var frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);

    var frameWin = frame.contentWindow;
    var frameDoc = frameWin.document;
    var headStyles = Array.prototype.map.call(document.querySelectorAll('link[rel="stylesheet"], style'), function(node) {
      return node.outerHTML;
    }).join('\n');

    var pageRule = bodyClass === 'is-printing-portfolio'
      ? 'margin: 10mm 14mm 11mm !important; size: A4 portrait;'
      : (bodyClass === 'is-printing-poster' ? 'margin: 0 !important; size: A4 portrait;' : 'margin: 20px !important; size: auto;');

    var overrideCss =
      '@page { ' + pageRule + ' } ' +
      '@media print { @page { ' + pageRule + ' } ' +
      'html, body { height:auto !important; overflow:visible !important; background:#fff !important; margin:0 !important; padding:0 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } ' +
      'body * { visibility:visible !important; } }';

    var removeFrame = function() {
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    };
    var printStarted = false;
    var readinessTimer;

    var startPrint = async function() {
      if (printStarted) return;
      printStarted = true;
      clearTimeout(readinessTimer);
      try {
        var assets = Array.prototype.map.call(frameDoc.images || [], function(img) {
          return typeof img.decode === 'function' ? img.decode().catch(function() {}) : Promise.resolve();
        });
        if (frameDoc.fonts && frameDoc.fonts.ready) assets.push(frameDoc.fonts.ready);
        var assetTimer;
        await Promise.race([
          Promise.all(assets),
          new Promise(function(resolve) { assetTimer = setTimeout(resolve, 10000); })
        ]);
        clearTimeout(assetTimer);
        frameWin.focus();
        frameWin.addEventListener('afterprint', removeFrame);
        frameWin.print();
      } catch (error) {
        removeFrame();
        if (typeof onError === 'function') onError(error);
        return;
      }
      setTimeout(removeFrame, 120000);
    };

    frame.onload = startPrint;
    readinessTimer = setTimeout(startPrint, 10000);
    frameDoc.open();
    frameDoc.write(
      '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
      '<base href="' + escapePortfolioText(document.baseURI || '') + '">' +
      '<title>' + escapePortfolioText(title || '인쇄') + '</title>' +
      headStyles + '<style>' + overrideCss + '</style>' +
      '</head><body class="' + escapePortfolioText(bodyClass || '') + '">' + innerHtml + '</body></html>'
    );
    frameDoc.close();
  }

  window.NanoPortfolioRenderer = {
    PORTFOLIO_BOOK_CATEGORIES: PORTFOLIO_BOOK_CATEGORIES,
    PORTFOLIO_CATEGORY_COLOR_MAP: PORTFOLIO_CATEGORY_COLOR_MAP,
    escapePortfolioText: escapePortfolioText,
    formatPortfolioSchoolGrade: formatPortfolioSchoolGrade,
    formatPortfolioTeacher: formatPortfolioTeacher,
    resolvePortfolioBookCover: resolvePortfolioBookCover,
    getBookCatalogReference: getBookCatalogReference,
    findMatchingCatalogBook: findMatchingCatalogBook,
    normalizePortfolioCategory1Label: normalizePortfolioCategory1Label,
    resolvePortfolioBookCategory1: resolvePortfolioBookCategory1,
    calculateRealBookCategoryStats: calculateRealBookCategoryStats,
    extractRealBookTags: extractRealBookTags,
    getBookObservationComment: getBookObservationComment,
    generateSmartTeacherNote: generateSmartTeacherNote,
    generatePortfolioInsights: generatePortfolioInsights,
    buildGenreDonutSvg: buildGenreDonutSvg,
    buildPortfolioReportId: buildPortfolioReportId,
    resolvePortfolioTeacherNote: resolvePortfolioTeacherNote,
    buildPortfolioDocumentHtml: buildPortfolioDocumentHtml,
    renderPortfolioDocument: renderPortfolioDocumentHtml,
    printHtmlInIsolatedFrame: printHtmlInIsolatedFrame
  };
})(typeof window !== 'undefined' ? window : globalThis);

