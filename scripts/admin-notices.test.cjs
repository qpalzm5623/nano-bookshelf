const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(notices) {
  const elements = { academyNoticeViewContainer: { innerHTML: '' }, noticeViewSearch: { value: '' }, noticePinnedOnly: { checked: false }, noticeViewResultCount: { textContent: '' } };
  const context = { URL, document: { getElementById: id => elements[id] }, getAcademySystemNotices: () => notices, markAcademyNoticesAsRead() {}, updateAcademyNoticeBadge() {} };
  const source = fs.readFileSync('public_html/js/admin_notices.js', 'utf8');
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function escapeAcademyNoticeText'), source.indexOf('function checkAcademyNoticePopups')), context);
  return { elements, render: () => { context.renderAcademyNoticeViewList(); return elements.academyNoticeViewContainer.innerHTML; } };
}
test('본사 공지는 필독 우선·최신순으로 정렬하고 첫 공지만 펼쳐 표시한다', () => {
  const notices = [{ title: '일반 최신', createdAt: '2026-11-16' }, { title: '필독 이전', isPinned: true, createdAt: '2026-11-10' }, { title: '필독 최신', isPinned: true, createdAt: '2026-11-15' }];
  const f = setup(notices), html = f.render();
  assert.ok(html.indexOf('필독 최신') < html.indexOf('필독 이전'));
  assert.ok(html.indexOf('필독 이전') < html.indexOf('일반 최신'));
  assert.equal((html.match(/class="notice-card" open/g) || []).length, 1);
  assert.equal(notices[0].title, '일반 최신');
});
test('제목·본문 검색과 필독 필터를 함께 적용하고 결과 없음 상태를 안내한다', () => {
  const f = setup([{ title: '정기 점검', content: '새벽 점검', isPinned: true }, { title: '서비스 안내', content: '새벽 작업' }]);
  f.elements.noticeViewSearch.value = '새벽';
  f.elements.noticePinnedOnly.checked = true;
  let html = f.render();
  assert.ok(html.includes('정기 점검'));
  assert.ok(!html.includes('서비스 안내'));
  f.elements.noticeViewSearch.value = '없는 공지';
  assert.match(f.render(), /검색 조건에 맞는 공지가 없습니다/);
  assert.match(setup([]).render(), /아직 등록된 공지가 없습니다/);
});
test('공지 내용은 텍스트로 표시하고 안전한 안내 링크만 새 창으로 연다', () => {
  const f = setup([{ title: '<script>alert(1)</script>', content: '<img onerror=alert(1)>\n두 번째 줄', link: 'javascript:alert(1)' }]);
  const html = f.render();
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('\n두 번째 줄'));
  assert.ok(!html.includes('href='));
  assert.match(setup([{ title: '안내', link: 'https://example.com/info' }]).render(), /rel="noopener noreferrer"/);
});
