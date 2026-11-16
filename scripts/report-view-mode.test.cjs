const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.resolve(__dirname, '../public_html/admin_preview.html');
const jsPath = path.resolve(__dirname, '../public_html/admin_preview.js');

test('학습 리포트 모달: HTML 구조 및 PC/카톡 뷰 토글 버튼 검증', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. 다이얼로그 ID 및 뷰 토글 버튼 존재 여부
  assert.ok(html.includes('id="learningReportModalDialog"'), 'learningReportModalDialog ID가 존재해야 합니다.');
  assert.ok(html.includes('id="btnReportViewPc"'), 'PC 리포트 뷰 토글 버튼이 존재해야 합니다.');
  assert.ok(html.includes('id="btnReportViewKakao"'), '카톡 화면 뷰 토글 버튼이 존재해야 합니다.');
  assert.ok(!html.includes('id="kakaoPreviewBanner"'), '카톡 미리보기 안내 배너는 표시하지 않습니다.');

  // 2. 모달 푸터가 modal-content 내부에 정상 위치하는지 태그 계층 검증
  // learningDetailModal 내부의 modal-footer 바로 뒤에 modal-content, modal-dialog, learningDetailModal 닫힘이 이어져야 함
  const learningModalStart = html.indexOf('id="learningDetailModal"');
  assert.ok(learningModalStart !== -1, 'learningDetailModal이 존재해야 합니다.');

  const nextModalIndex = html.indexOf('id="modalCorrection"');
  assert.ok(nextModalIndex > learningModalStart, 'modalCorrection 모달이 learningDetailModal 뒤에 와야 합니다.');

  const modalSlice = html.substring(learningModalStart, nextModalIndex);
  const footerIndex = modalSlice.indexOf('<div class="modal-footer');
  assert.ok(footerIndex !== -1, 'learningDetailModal 내에 modal-footer가 존재해야 합니다.');

  const footerToEndSlice = modalSlice.substring(footerIndex);
  const closingDivs = footerToEndSlice.match(/<\/div>/g) || [];
  // footer 내부의 d-flex 닫힘(1) + footer 자체 닫힘(1) + modal-content 닫힘(1) + modal-dialog 닫힘(1) + modal 닫힘(1) = 5개
  assert.equal(closingDivs.length, 5, 'modal-footer부터 모달 종료까지 정확히 5개의 </div>가 닫혀야 합니다.');
});

test('학습 리포트 모달: CSS 스타일(PC 1040px 와이드 기본 vs 카톡 440px 모바일) 검증', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 기본 PC 뷰: 1040px 와이드 모달
  assert.ok(html.includes('#learningReportModalDialog {'), 'PC 다이얼로그 스타일이 정의되어 있어야 합니다.');
  assert.ok(html.includes('max-width: 1040px !important;'), 'PC 기본 최대 너비는 1040px이어야 합니다.');

  // 카톡 화면 뷰: 440px 모바일 스마트폰 규격
  assert.ok(html.includes('#learningReportModalDialog.view-mode-kakao {'), '카톡 뷰 모드 스타일이 정의되어 있어야 합니다.');
  assert.ok(html.includes('max-width: 440px !important;'), '카톡 화면 뷰 최대 너비는 440px이어야 합니다.');
  assert.ok(html.includes('#learningReportModalDialog.view-mode-kakao .report-quiz-grid'), '카톡 뷰 퀴즈 1열 그리드 스타일이 있어야 합니다.');
});

test('학습 리포트 모달: JS switchReportViewMode 구현 및 기본 뷰(PC) 초기화 검증', () => {
  const js = fs.readFileSync(jsPath, 'utf8');

  assert.ok(js.includes('function switchReportViewMode(mode)'), 'switchReportViewMode 함수가 구현되어 있어야 합니다.');
  assert.ok(js.includes("currentReportViewMode = (mode === 'kakao') ? 'kakao' : 'pc'"), 'mode 전환 로직이 포함되어 있어야 합니다.');
  assert.ok(js.includes("dialog.classList.add('view-mode-kakao')"), '카톡 모드 시 view-mode-kakao 클래스 추가 로직이 있어야 합니다.');
  assert.ok(js.includes("dialog.classList.remove('view-mode-kakao')"), 'PC 모드 시 view-mode-kakao 클래스 제거 로직이 있어야 합니다.');

  // openLearningDetailModal 진입 시 PC 모드로 초기화하는지
  const openModalIndex = js.indexOf('function openLearningDetailModal(id)');
  assert.ok(openModalIndex !== -1, 'openLearningDetailModal 함수가 존재해야 합니다.');
  const openModalSlice = js.substring(openModalIndex, openModalIndex + 500);
  assert.ok(openModalSlice.includes("switchReportViewMode('pc')"), '모달 오픈 시 PC 리포트 뷰로 초기화되어야 합니다.');
});

test('학습 목록은 발송완료로 바뀌고 상세 화면만 재발송을 허용한다', async () => {
  const vm = require('node:vm');
  const js = fs.readFileSync(jsPath, 'utf8');
  let sentTime = null;
  let status = 'ACCEPTED';
  let refreshes = 0;
  const requests = [];
  const modal = { innerHTML: '' };
  const portal = { remote: true, api: async (_url, body) => {
    requests.push(body);
    return body.action === 'preview' ? { name: '보호자', recipient: '010', message: '리포트', targetUrl: '/report', fingerprint: 'fp' } : { status };
  } };
  const ctx = {
    window: { NanoPortal: portal }, NanoPortal: portal,
    crypto: { randomUUID: () => '11111111-1111-4111-8111-111111111111' },
    getKakaoReportLog: () => sentTime, saveKakaoReportLog: (_id, value) => { sentTime = value; },
    formatCurrentDateTimeShort: () => '11-16 12:00', escapePortfolioText: String,
    nanoConfirm: async () => true, showAcademyToast() {},
    renderLearningTable: () => { refreshes++; },
    document: { getElementById: () => modal }, currentOpenLearningLogId: 'log1',
  };
  vm.createContext(ctx);
  vm.runInContext(js.slice(js.indexOf('function getKakaoReportBtnHtml'), js.indexOf('// A4 리포트 인쇄 실행')), ctx);
  await ctx.sendLearningReportKakao('log1', null, false);
  assert.match(ctx.getKakaoReportBtnHtml('log1', false), /disabled/);
  assert.match(ctx.getKakaoReportBtnHtml('log1', false), /발송완료/);
  assert.doesNotMatch(ctx.getKakaoReportBtnHtml('log1', false), /onclick/);
  assert.match(modal.innerHTML, /카톡 재발송/);
  await ctx.sendLearningReportKakao('log1', null, true);
  assert.equal(requests[2].resendKey, requests[3].resendKey);
  assert.ok(requests[2].resendKey);
  assert.equal(refreshes, 2);
  sentTime = null;
  status = 'FAILED';
  await ctx.sendLearningReportKakao('log1', null, false);
  assert.equal(sentTime, null);
  assert.equal(refreshes, 2);
});

test('학습 리포트 발송과 인쇄는 상단 보기 전환 버튼 왼쪽에 한 번만 표시된다', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const modal = html.slice(html.indexOf('id="learningDetailModal"'), html.indexOf('id="modalCorrection"'));
  assert.equal((modal.match(/id="modalKakaoSendBtnContainer"/g) || []).length, 1);
  assert.ok(modal.indexOf('id="modalKakaoSendBtnContainer"') < modal.indexOf('id="btnReportViewPc"'));
  assert.ok(modal.indexOf('onclick="printLearningReport()"') < modal.indexOf('id="btnReportViewPc"'));
});
