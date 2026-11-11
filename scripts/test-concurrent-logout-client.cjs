const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('portal-client.js는 handleConcurrentLogout를 NanoPortal에 노출하고 세션 워처를 5초 주기로 실행한다', () => {
  const content = fs.readFileSync(path.join(__dirname, '../public_html/js/portal-client.js'), 'utf8');
  assert.ok(content.includes('handleConcurrentLogout: handleConcurrentLogout'), 'handleConcurrentLogout should be exported to NanoPortal');
  assert.ok(content.includes('sessionWatcherTimer = setInterval(checkConcurrentSession, 5000);'), 'sessionWatcherTimer should run every 5s');
  assert.ok(content.includes("window.addEventListener('focus', function() {"), 'should attach focus listener');
});

test('student_preview.html의 toast는 다른 기기 로그인 메시지 수신 시 세션을 정리하고 index.html로 강제 이동한다', () => {
  const content = fs.readFileSync(path.join(__dirname, '../public_html/student_preview.html'), 'utf8');
  assert.ok(content.includes("msg.indexOf('다른 기기에서 로그인하여') !== -1"), 'toast should detect concurrent logout message');
  assert.ok(content.includes("location.replace('index.html')"), 'toast should redirect to index.html');
  assert.ok(content.includes("sessionStorage.setItem('nano_login_notice'"), 'toast should store notice in sessionStorage');
});

test('portal-extras.js의 notice는 다른 기기 로그인 메시지 수신 시 리다이렉트한다', () => {
  const content = fs.readFileSync(path.join(__dirname, '../public_html/js/portal-extras.js'), 'utf8');
  assert.ok(content.includes("message.indexOf('다른 기기에서 로그인하여') !== -1"), 'notice should detect concurrent logout message');
  assert.ok(content.includes("location.replace('index.html')"), 'notice should redirect to index.html');
});

