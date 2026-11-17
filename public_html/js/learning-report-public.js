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
  function textCard(title, text) {
    return text ? '<h3>' + esc(title) + '</h3><p class="report-text">' + esc(text) + '</p>' : '';
  }
  function render(data) {
    var a = data.attempt || {}, book = data.book || {}, student = data.student || {};
    var quizzes = Array.isArray(data.quizResults) ? data.quizResults : [];
    var correct = quizzes.filter(function (q) { return q.isCorrect; }).length;
    var score = Number(a.score) || 0;
    var badge = score >= 80 ? '우수 완독 인증' : score >= 60 ? '완독 인증 통과' : '미통과 (재도전 권장)';
    var html = '<section class="report-overview-card"><div class="report-overview-left"><div class="report-cover-wrapper"><img src="' + esc(imageUrl(book.cover)) + '" alt="도서 표지" onerror="this.onerror=null;this.src=\'resources/images/book_default.svg\'"></div><div><small>완독 도서 · ' + esc(book.grade) + '</small><h2 id="learnModalBook">' + esc(book.title) + '</h2><small id="learnModalBookPub">' + esc([book.publisher, book.author].filter(Boolean).join(' · ')) + '</small></div></div>' +
      '<div class="report-sub-card highlight"><small>북퀴즈 최종 성적</small><div class="score-row"><strong id="learnModalScore">' + score + '점</strong><span class="report-quiz-badge">' + badge + '</span></div></div>' +
      '<div class="report-meta-grid"><div class="report-sub-card"><small>학습 및 퀴즈 일시</small><strong>' + esc(a.completedDate) + '</strong></div><div class="report-sub-card"><small>원생 정보</small><strong id="learnModalStudent">' + esc(student.name) + (student.classGroup ? ' (' + esc(student.classGroup) + ')' : '') + '</strong><small id="learnModalStudentSchool">' + esc([student.school, student.grade].filter(Boolean).join(' ')) + '</small></div></div></section>';
    html += '<h3>북퀴즈 문항별 결과</h3>';
    if (quizzes.length) {
      html += '<p><small>총 ' + quizzes.length + '문항 중 ' + correct + '문항 정답 (정답률 ' + Math.round(correct / quizzes.length * 100) + '%)</small></p><div class="report-quiz-grid">';
      html += quizzes.map(function (q, index) {
        var num = q.qNum || index + 1, state = q.isCorrect ? 'correct' : 'wrong';
        return '<article class="report-quiz-card is-' + state + '"><div class="report-quiz-header"><span><span class="report-quiz-q-badge">Q</span>' + esc(String(num).padStart(2, '0')) + ' 문제 ' + esc(num) + '번 문항</span><span class="report-quiz-badge ' + state + '">' + (q.isCorrect ? '정답 (+' + Math.round(100 / quizzes.length) + '점)' : '오답 (0점)') + '</span></div><p class="report-quiz-question">' + esc(q.question) + '</p><div class="report-choice-box ' + state + '"><span class="report-choice-label">학생 선택 ' + (q.isCorrect ? '답안' : '오답') + '</span><span class="report-choice-val ' + (q.isCorrect ? '' : 'strike') + '">' + esc(q.userChoiceText || '미응답') + '</span></div>' +
          (q.isCorrect ? '' : '<div class="report-choice-box actual"><span class="report-choice-label">실제 정답</span><span class="report-choice-val">' + esc(q.correctChoiceText) + '</span></div>') + '</article>';
      }).join('') + '</div>';
    } else {
      html += '<p class="msg">저장된 문항별 답안이 없습니다.</p>';
    }
    if (data.thoughtQuestion || data.thoughtAnswer || data.comment) {
      html += '<section class="report-thought-card"><h2>생각 담기</h2>' + textCard('질문', data.thoughtQuestion) + textCard('학생 답안', data.thoughtAnswer) + textCard('지도교사 코멘트', data.comment) + '</section>';
    }
    var ai = data.worksheetAiResult || {}, photos = Array.isArray(data.worksheetPhotos) ? data.worksheetPhotos : [];
    if (data.worksheetAiResult || photos.length) {
      html += '<section class="report-thought-card"><h2>나노시트 첨삭 리포트</h2>' + photos.map(function (photo, i) {
        var src = esc(imageUrl(photo.dataUrl));
        return '<a class="worksheet-photo" href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="나노시트 원본 ' + (i + 1) + '페이지" loading="lazy">' + (i + 1) + '페이지 · 눌러서 크게 보기</a>';
      }).join('') + textCard('이번 활동에서 돋보인 점', ai.summary) + textCard('다음 성장을 위한 발걸음', ai.nextStep) + textCard('집에서 함께 나눌 이야기', ai.parentGuide) + '</section>';
    }
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
