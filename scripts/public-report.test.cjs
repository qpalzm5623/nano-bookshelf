const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { render } = require('../public_html/js/learning-report-public.js');

test('공개 학습 리포트는 정오답과 첨삭을 보여주고 외부 입력을 이스케이프한다', () => {
  const html = render({
    attempt: { score: 50 }, book: { title: '<script>bad()</script>', cover: 'javascript:bad()' },
    quizResults: [
      { qNum: 1, question: '문제 하나', isCorrect: true, userChoiceText: '정답 선택' },
      { qNum: 2, question: '문제 둘', isCorrect: false, userChoiceText: '오답 선택', correctChoiceText: '실제 답' },
    ],
    thoughtAnswer: '학생의 생각', comment: '교사 의견',
    worksheetAiResult: { summary: '분석 결과', nextStep: '다음 활동', parentGuide: '대화 주제' },
  });
  for (const text of ['정답 선택', '오답 선택', '실제 답', '학생의 생각', '교사 의견', '분석 결과', '다음 활동', '대화 주제', '정답률 50%']) assert.ok(html.includes(text));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('<script>'));
});

test('상세 답안이 없는 구형 학습 기록도 빈 상태를 표시한다', () => {
  assert.ok(render({ attempt: { score: 80 } }).includes('저장된 문항별 답안이 없습니다.'));
});

test('공개 포트폴리오는 미리보기 공용 문서를 편집 기능 없이 렌더링한다', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/portfolio-renderer.js'), 'utf8'), context);
  const html = context.window.NanoPortfolioRenderer.buildPortfolioDocumentHtml({
    pfData: { name: '테스트 학생', school: '나노초등학교', grade: '5학년', issueDate: '2026-11-13 09:59', books: [] },
    allowTeacherNoteEdit: false, allowCoverZoom: false,
  });
  assert.ok(html.includes('독서 성장 포트폴리오'));
  assert.ok(html.includes('테스트 학생'));
  assert.ok(html.includes('2026-11-13 09:59'));
  assert.ok(!html.includes('textarea'));
  assert.ok(!html.includes('togglePfTeacherNoteEdit'));
});

test('문해력 공유 페이지는 정기진단만 렌더링한다', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../public_html/literacy_report.html'), 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const box = { innerHTML: '' };
  const modes = [];
  await vm.runInNewContext(script, {
    document: { getElementById: () => box }, location: { search: '?r=test&t=token' }, URLSearchParams,
    NanoLiteracy: { api: async () => ({ record: { student: { name: '학생' } } }), esc: String,
      renderReport: (_rec, _history, mode) => { modes.push(mode); return '정기 결과'; } },
  });
  assert.deepEqual(modes, ['regular']);
  assert.ok(!box.innerHTML.includes('신규상담'));
  assert.ok(box.innerHTML.includes('정기 결과'));
});
