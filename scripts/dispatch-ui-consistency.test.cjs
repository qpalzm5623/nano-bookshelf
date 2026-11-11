const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('admin_preview.html CSS에 stat-label, stat-sub, stat-icon-bg 워터마크 스타일이 정의되어 있는지 검증', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.html'), 'utf8');
  assert.ok(html.includes('.stat-label,'), 'Should have .stat-label class');
  assert.ok(html.includes('.stat-sub {'), 'Should have .stat-sub class');
  assert.ok(html.includes('.stat-icon-bg {'), 'Should have .stat-icon-bg class');
  assert.ok(html.includes('position: absolute;'), 'stat-icon-bg should be position: absolute');
  assert.ok(html.includes('color: rgba(60, 50, 40, 0.05);'), 'stat-icon-bg should have subtle watermark opacity');
});

test('카톡 발송 내역(view-dispatch) 영역이 다른 관리자 메뉴와 일관된 폼 컨트롤 및 헤더 규격을 준수하는지 검증', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.html'), 'utf8');
  const dispatchSection = html.slice(html.indexOf('id="view-dispatch"'), html.indexOf('id="view-ranking"'));
  
  // select-beige 대신 다른 메뉴와 통일된 form-control 적용 여부
  assert.ok(!dispatchSection.includes('class="select-beige"'), 'Should not use legacy select-beige');
  assert.ok(dispatchSection.includes('id="academyDispatchTemplate" class="form-control"'), 'Template select should use form-control');
  assert.ok(dispatchSection.includes('id="academyDispatchStatus" class="form-control"'), 'Status select should use form-control');
  assert.ok(dispatchSection.includes('id="academyDispatchFrom" type="date" class="form-control"'), 'Date from should use form-control');
  assert.ok(dispatchSection.includes('id="academyDispatchTo" type="date" class="form-control"'), 'Date to should use form-control');

  // 통계 카드 및 테이블 헤더에 배지 및 통일된 폰트 규격 적용 여부
  assert.ok(dispatchSection.includes('badge-soft badge-soft-neutral'), 'Count badge should use badge-soft-neutral');
  assert.ok(dispatchSection.includes('background: #fbf9f5; font-size: 12px; font-weight: 700;'), 'Table header th should have unified style');
});

test('billing-ui.js에서 잔여 캐시와 연동 상태가 디자인 시스템 규격에 맞게 렌더링되는지 검증', () => {
  const js = fs.readFileSync(path.join(__dirname, '../public_html/js/billing-ui.js'), 'utf8');
  assert.ok(js.includes("numUnit(prefix+'Cash', money(s.balance), '원')"), 'Should render cash with numUnit');
  assert.ok(js.includes("badge-soft badge-soft-success"), 'Should render connection status with badge-soft-success');
});

