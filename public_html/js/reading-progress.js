/* 서버와 학생 화면이 함께 사용하는 분야 분류와 성장 규칙. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NanoReading = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var rules = {
    nano: ['totalRead', 0, 30, 100], toto: ['humanRead', 50, 100, 150],
    booki: ['natureRead', 50, 100, 150], pico: ['techRead', 50, 100, 150],
    popo: ['histRead', 50, 100, 150], chichi: ['healthRead', 50, 100, 150],
    lumi: ['studyRead', 50, 100, 150], mir: ['allGenreMin', 15, 30, 50],
    jelly: ['totalRead', 50, 100, 200]
  };
  function match(value) {
    var text = String(value || '').toLowerCase();
    if (/건강|음식|요리|운동|영양|식습관|보건/.test(text)) return 'health';
    if (/자연|생물|환경|동물|식물|곤충|바다|생태|숲/.test(text)) return 'nature';
    if (/학습|수학|논리/.test(text)) return 'study';
    if (/기술|과학|우주|로봇|\bai\b|컴퓨터|물리|화학|\bit\b/.test(text)) return 'tech';
    if (/인간|생활|가족|사회|친구|우정|성장|심리|철학|마음/.test(text)) return 'human';
    if (/역사|이야기|문학|전래|신화|고전|소설|동화/.test(text)) return 'hist';
    return null;
  }
  function genre(book) {
    book = book || {};
    if (['human', 'nature', 'tech', 'hist', 'health', 'study'].indexOf(book.readingGenre) !== -1) return book.readingGenre;
    // 명시적으로 지정한 테마를 일반 태그·제목보다 우선합니다.
    return match(book.themeName || (book.theme && book.theme.name) || book.themeTag || book.tag)
      || match(book.subject) || match(book.tags) || match(book.cat)
      || match(book.title) || 'study';
  }
  function stats(books) {
    var result = { totalRead: 0, humanRead: 0, natureRead: 0, techRead: 0, histRead: 0, healthRead: 0, studyRead: 0, allGenreMin: 0 };
    var seen = new Set();
    (books || []).forEach(function (book) {
      var id = String(book.id || book.bookNo || '');
      if (!id || seen.has(id)) return;
      seen.add(id); result.totalRead++; result[genre(book) + 'Read']++;
    });
    result.allGenreMin = Math.min(result.humanRead, result.natureRead, result.techRead, result.histRead, result.healthRead, result.studyRead);
    return result;
  }
  function stage(id, counts) {
    var rule = rules[id] || rules.nano, count = counts[rule[0]] || 0;
    return count >= rule[3] ? 3 : count >= rule[2] ? 2 : count >= rule[1] ? 1 : 0;
  }
  return { rules: rules, genre: genre, stats: stats, stage: stage };
});
