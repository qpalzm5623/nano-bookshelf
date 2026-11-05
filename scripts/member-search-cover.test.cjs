const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('연락처 통합 검색은 한글·숫자·삭제·한글 조합 입력을 변경하지 않는다', () => {
  let listener;
  const ctx = { window: {}, document: { addEventListener: (_, fn) => { listener = fn; } } };
  const source = read('public_html/js/preview-ux.js');
  vm.runInNewContext(source.slice(source.lastIndexOf('(function () {')), ctx);
  for (const value of ['', '김은', '학생1', '01012345678', '010-1234', '-김은']) {
    const input = { tagName: 'INPUT', type: 'search', id: 'memberSearchInput', placeholder: '이름, 연락처 검색...', value };
    listener({ target: input });
    assert.equal(input.value, value);
  }
  const phone = { tagName: 'INPUT', type: 'tel', value: '01012345678' };
  listener({ target: phone });
  assert.equal(phone.value, '010-1234-5678');
});

test('회원 입력·학원 선택·지우기·정렬은 새 검색을 적용하지 않고 검색 버튼만 적용한다', () => {
  const elements = {};
  const el = id => elements[id] ||= { value: '', style: {}, innerHTML: '' };
  const ctx = vm.createContext({ document: { getElementById: el }, currentSelectedAcademy: 'ALL', memberCurrentPage: 1,
    memberDateSortOrder: 'none', lastFilteredMembers: [{ name: '기존 결과' }],
    memberList: [{ name: '김은', academyName: '학원A' }, { name: '이름', academyName: '학원B' }],
    $: () => ({ dropdown() {} }), renderAcademyDropdownList() {}, updateMemberDateSortUI() {},
    renderMemberTable: rows => { ctx.rows = rows; } });
  const source = read('public_html/js/master/master-members.js');
  const ast = ts.createSourceFile('members.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  for (const name of ['handleMemberSearchInput', 'selectMemberAcademy', 'clearMemberSearch', 'toggleMemberDateSort', 'filterMemberList']) {
    vm.runInContext(ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === name).getText(ast), ctx);
  }
  el('memberRoleFilter').value = el('memberStatusFilter').value = 'ALL';
  el('memberSearchInput').value = '김은';
  ctx.handleMemberSearchInput(el('memberSearchInput'));
  ctx.selectMemberAcademy('학원A');
  assert.equal(ctx.rows, undefined);
  ctx.filterMemberList();
  assert.equal(ctx.rows.length, 1);
  assert.equal(ctx.rows[0].name, '김은');
  const searched = ctx.rows;
  ctx.clearMemberSearch();
  assert.equal(ctx.rows, searched);
  el('memberSearchInput').value = '다른 검색어';
  ctx.toggleMemberDateSort();
  assert.equal(ctx.rows, ctx.lastFilteredMembers);
  const html = read('public_html/master_preview.html');
  const tag = html.match(/<input[^>]+id="memberSearchInput"[^>]*>/)[0];
  assert.doesNotMatch(tag, /filterMemberList/);
  assert.match(html, /<button[^>]+onclick="filterMemberList\(\)"/);
});

test('공개 자산 빌드는 JFIF 표지를 복사하고 비공개 회원 첨부를 제외한다', () => {
  const copied = [];
  const folders = { public_html: ['upload', 'index.html', 'admin_preview.html', 'master_preview.html', 'student_preview.html'],
    'public_html/upload': ['book', 'member'], 'public_html/upload/book': ['cover.jfif', 'cover.jpg'], 'public_html/upload/member': ['private.jpg'] };
  const rel = file => path.relative(root, file).replace(/\\/g, '/');
  const fakeFs = { existsSync: () => false, mkdirSync() {}, statSync: file => ({ isDirectory: () => !!folders[rel(file)] }),
    readdirSync: file => folders[rel(file)], copyFileSync: from => copied.push(rel(from)), readFileSync: () => '', writeFileSync() {} };
  vm.runInNewContext(read('scripts/build-portal.cjs'), { __dirname, require: name => name === 'node:fs' ? fakeFs : require(name), console: { log() {} } });
  assert.deepEqual(copied, ['public_html/upload/book/cover.jfif', 'public_html/upload/book/cover.jpg', 'public_html/index.html', 'public_html/admin_preview.html', 'public_html/master_preview.html', 'public_html/student_preview.html']);
});
