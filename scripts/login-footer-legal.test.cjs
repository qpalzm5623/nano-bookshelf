const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.resolve(__dirname, '../public_html/index.html');

test('로그인 화면: 약관 및 개인정보처리방침이 로그인 버튼 바로 아래에 위치하는지 검증', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. 로그인 폼 내부의 버튼 바로 아래에 링크가 위치하는지 검증
  const btnLoginIndex = html.indexOf('id="btnLogin"');
  assert.ok(btnLoginIndex !== -1, 'btnLogin 버튼이 존재해야 합니다.');

  const formEndIndex = html.indexOf('</form>', btnLoginIndex);
  assert.ok(formEndIndex !== -1, '</form> 태그가 존재해야 합니다.');

  const formBottomSlice = html.substring(btnLoginIndex, formEndIndex);
  assert.ok(formBottomSlice.includes('class="login-legal-links"'), '로그인 버튼과 form 닫힘 사이에 login-legal-links가 존재해야 합니다.');
  assert.ok(formBottomSlice.includes("openNanoLegalModal('terms')"), '이용약관 모달 호출 함수가 포함되어 있어야 합니다.');
  assert.ok(formBottomSlice.includes("openNanoLegalModal('privacy')"), '개인정보처리방침 모달 호출 함수가 포함되어 있어야 합니다.');
});

test('로그인 화면: 하단 Footer 영역에 사업자 정보가 바닥 밀착 형태로 배치되고 불필요한 링크 바가 제거되었는지 검증', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const footerIndex = html.indexOf('<footer class="login-footer"');
  assert.ok(footerIndex !== -1, 'login-footer가 존재해야 합니다.');

  const footerEndIndex = html.indexOf('</footer>', footerIndex);
  assert.ok(footerEndIndex !== -1, '</footer> 태그가 존재해야 합니다.');

  const footerSlice = html.substring(footerIndex, footerEndIndex);

  // 1. 푸터 내부에서 이전의 legal-links-bar는 제거되어야 함
  assert.ok(!footerSlice.includes('class="legal-links-bar"'), '푸터 내부에서 legal-links-bar는 제거되어야 합니다.');

  // 2. 사업자 정보 및 카피라이트는 푸터에 유지
  assert.ok(footerSlice.includes('417-88-02543'), '사업자등록번호가 푸터에 포함되어 있어야 합니다.');
  assert.ok(footerSlice.includes('All Rights Reserved'), '저작권 문구가 푸터에 포함되어 있어야 합니다.');

  // 3. CSS 바닥 밀착 스타일 검증
  assert.ok(html.includes('.login-container {'), 'login-container 스타일이 있어야 합니다.');
  assert.ok(html.includes('flex: 1 0 auto;'), 'login-container는 flex: 1 0 auto로 푸터를 바닥으로 밀어내야 합니다.');
  assert.ok(html.includes('.login-footer {'), 'login-footer 스타일이 있어야 합니다.');
  assert.ok(html.includes('margin-top: auto;'), 'login-footer는 margin-top: auto로 화면 최하단에 배치되어야 합니다.');
});

