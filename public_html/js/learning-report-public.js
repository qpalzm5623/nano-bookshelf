/* 서명된 공개 API의 학습 기록만 표시하며 관리자 편집 기능은 포함하지 않습니다. */
(function () {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function imageUrl(value) {
    var src = String(value || '').trim();
    return /^(https?:\/\/|data:image\/(?:png|jpeg|webp|gif);base64,|\/?(?:upload|resources|images)\/)/i.test(src) ? src : 'resources/images/book_default.svg';
  }
  function textCard(title, text, cls) {
    return text ? '<div class="public-text-block ' + (cls || '') + '"><h3>' + esc(title) + '</h3><p class="report-text">' + esc(text) + '</p></div>' : '';
  }
  function render(data) {
    var a = data.attempt || {}, book = data.book || {}, student = data.student || {};
    var quizzes = Array.isArray(data.quizResults) ? data.quizResults : [];
    var correct = quizzes.filter(function (q) { return q.isCorrect; }).length;
    var score = Math.max(0, Math.min(100, Number(a.score) || 0));
    var isFail = score < 60;
    var badge = score >= 80 ? '우수 완독 인증' : score >= 60 ? '완독 인증 통과' : '미통과 (재도전 권장)';
    var badgeCls = score >= 80 ? 'chip-amber' : score >= 60 ? 'chip-teal' : 'chip-danger';
    var certLabel = isFail ? '미인증 응시' : '완독 인증 도서';
    var certCls = isFail ? 'chip-amber' : 'chip-teal';
    var academyName = student.academyName || '나노의 책장';

    var html = '<section class="report-overview-card">' +
      '<div class="report-overview-left">' +
        '<div class="report-cover-wrapper"><img src="' + esc(imageUrl(book.cover)) + '" alt="도서 표지" onerror="this.onerror=null;this.src=\'resources/images/book_default.svg\'"></div>' +
        '<div class="report-book-meta">' +
          '<div class="public-chip-row">' +
            '<span class="lr-chip ' + certCls + '">' + esc(certLabel) + '</span>' +
            (book.grade ? '<span class="lr-chip chip-neutral">' + esc(book.grade) + '</span>' : '') +
            (book.readingGenre ? '<span class="lr-chip chip-amber">' + esc(book.readingGenre) + '</span>' : '') +
          '</div>' +
          '<h2 id="learnModalBook">' + esc(book.title) + '</h2>' +
          '<small id="learnModalBookPub">' + esc([book.publisher, book.author].filter(Boolean).join(' · ')) + '</small>' +
        '</div>' +
      '</div>' +
      '<div class="report-sub-card highlight' + (isFail ? ' is-fail' : '') + '">' +
        '<div class="lr-score-wrap">' +
          '<div class="lr-score-ring' + (isFail ? ' is-fail' : '') + '" style="--score-pct:' + score + ';"><span class="lr-score-ring-inner">' + score + '</span></div>' +
          '<div class="public-score-info">' +
            '<div class="public-score-head"><span class="lr-score-label">북퀴즈 최종 성적</span><span class="lr-chip ' + badgeCls + '">' + esc(badge) + '</span></div>' +
            '<div class="score-row"><strong id="learnModalScore">' + score + '점</strong><small>(100점 만점 기준)</small></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="report-meta-grid">' +
        '<div class="report-sub-card lr-meta-tile"><div class="lr-meta-head"><span class="lr-meta-icon is-teal" aria-hidden="true">📅</span><span class="lr-meta-label">학습 및 퀴즈 일시</span></div><strong class="lr-meta-value">' + esc(a.completedDate) + '</strong></div>' +
        '<div class="report-sub-card lr-meta-tile"><div class="lr-meta-head"><span class="lr-meta-icon is-amber" aria-hidden="true">🎓</span><span class="lr-meta-label">원생 정보</span></div><strong class="lr-meta-value" id="learnModalStudent">' + esc(student.name) + (student.classGroup ? ' (' + esc(student.classGroup) + ')' : '') + '</strong><small class="lr-meta-sub" id="learnModalStudentSchool">' + esc([student.school, student.grade].filter(Boolean).join(' ')) + '</small></div>' +
      '</div>' +
    '</section>';

    html += '<section class="public-quiz-section"><div class="public-section-head"><h3><span class="lr-section-bar"></span>북퀴즈 문항별 결과</h3>' +
      (quizzes.length ? '<span class="lr-summary-pill">총 ' + quizzes.length + '문항 중 <strong>' + correct + '문항</strong> 정답 (정답률 ' + Math.round(correct / quizzes.length * 100) + '%)</span>' : '') +
      '</div>';
    if (quizzes.length) {
      html += '<div class="report-quiz-grid">';
      html += quizzes.map(function (q, index) {
        var num = q.qNum || index + 1, state = q.isCorrect ? 'correct' : 'wrong';
        return '<article class="report-quiz-card is-' + state + '"><div class="report-quiz-header"><span class="public-q-title"><span class="report-quiz-q-badge">Q' + esc(String(num).padStart(2, '0')) + '</span>문제 ' + esc(num) + '번 문항</span><span class="report-quiz-badge ' + state + '">' + (q.isCorrect ? '정답 (+' + Math.round(100 / quizzes.length) + '점)' : '오답 (0점)') + '</span></div><p class="report-quiz-question">' + esc(q.question) + '</p><div class="report-choice-box ' + state + '"><span class="report-choice-label">학생 선택 ' + (q.isCorrect ? '답안' : '오답') + '</span><span class="report-choice-val ' + (q.isCorrect ? '' : 'strike') + '">' + esc(q.userChoiceText || '미응답') + '</span></div>' +
          (q.isCorrect ? '' : '<div class="report-choice-box actual"><span class="report-choice-label">실제 정답</span><span class="report-choice-val">' + esc(q.correctChoiceText) + '</span></div>') + '</article>';
      }).join('') + '</div>';
    } else {
      html += '<p class="msg">저장된 문항별 답안이 없습니다.</p>';
    }
    html += '</section>';

    if (data.thoughtQuestion || data.thoughtAnswer || data.comment) {
      html += '<section class="report-thought-card"><div class="public-section-head"><h2><span class="lr-section-bar is-amber"></span>생각 담기</h2></div>' +
        textCard('질문', data.thoughtQuestion, 'is-amber-box') +
        textCard('학생 답안', data.thoughtAnswer, 'is-answer-box') +
        textCard('지도교사 코멘트', data.comment, 'is-teal-box') +
        '</section>';
    }
    var ai = data.worksheetAiResult || {}, photos = Array.isArray(data.worksheetPhotos) ? data.worksheetPhotos : [];
    if (data.worksheetAiResult || photos.length) {
      html += '<section class="report-thought-card"><div class="public-section-head"><h2><span class="lr-section-bar"></span>나노시트 첨삭 리포트</h2></div>' + photos.map(function (photo, i) {
        var src = esc(imageUrl(photo.dataUrl));
        return '<a class="worksheet-photo" href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="나노시트 원본 ' + (i + 1) + '페이지" loading="lazy"><span>' + (i + 1) + '페이지 · 눌러서 크게 보기</span></a>';
      }).join('') +
        textCard('이번 활동에서 돋보인 점', ai.summary, 'is-teal-box') +
        textCard('다음 성장을 위한 발걸음', ai.nextStep, 'is-amber-box') +
        textCard('집에서 함께 나눌 이야기', ai.parentGuide, 'is-answer-box') +
        '</section>';
    }

    html += '<footer class="report-brand-footer">' +
      '<div class="report-brand-footer-left">' +
        '<img src="resources/images/common/logo.png" alt="나노의 책장" data-portal-logo class="report-footer-logo">' +
        '<span class="report-footer-slogan">아이의 독서는 끝없는 가능성의 시작입니다.</span>' +
      '</div>' +
      '<div class="report-brand-footer-right"><strong>' + esc(academyName) + '</strong> · Official Reading Report</div>' +
    '</footer>';

    return html;
  }
  // 동일 렌더러를 회귀 검증에서도 사용합니다.
  if (typeof module !== 'undefined' && module.exports) module.exports = { render:render };
  if (typeof document === 'undefined') return;
  (async function () {
    var view = document.getElementById('learningReportModalBody');
    var q = new URLSearchParams(location.search);
    try {
      if (!q.get('id')) throw new Error('학습 기록 정보가 없습니다. 알림톡 링크를 확인해 주세요.');
      var res = await fetch('/api/services?action=public_quiz_result&id=' + encodeURIComponent(q.get('id')) + '&t=' + encodeURIComponent(q.get('t') || ''));
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || '학습 리포트를 불러올 수 없습니다.');
      view.innerHTML = render(data);
    } catch (err) {
      view.textContent = err.message || '리포트를 불러오지 못했습니다. 학원에 문의해 주세요.';
    }
  })();
})();
