const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..', 'public_html');

test('문해력에서 다른 메뉴로 전환하면 화면과 선택 표시가 하나만 남는다', () => {
  const html = fs.readFileSync(path.join(root, 'master_preview.html'), 'utf8');
  const ids = [...html.matchAll(/<section id="tab-master-([^"]+)"/g)].map(m => m[1]);
  // 고정 목록에 없는 새 메뉴도 자동으로 초기화되어야 한다.
  ids.push('future-menu');
  const elements = new Map();
  for (const id of ids) {
    const classes = new Set(['active']);
    elements.set('nav-master-' + id, { classList: { add: c => classes.add(c), remove: c => classes.delete(c) }, classes });
    elements.set('tab-master-' + id, { style: { display: 'block' } });
  }
  const source = fs.readFileSync(path.join(root, 'js/master/master-core.js'), 'utf8');
  new vm.Script(source);
  const ast = ts.createSourceFile('master-core.js', source, ts.ScriptTarget.Latest, true);
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'switchMasterTab');
  const rendered = [];
  const ctx = vm.createContext({
    document: {
      getElementById: id => elements.get(id), querySelector: () => null,
      querySelectorAll: selector => ids.map(id => elements.get((selector === '.master-tab-view' ? 'tab-master-' : 'nav-master-') + id))
    },
    window: { scrollTo() {} }, ensureMasterTabRendered: id => rendered.push(id), purgeAutofilledSearchInputs() {}
  });
  vm.runInContext(fn.getText(ast), ctx);
  for (const target of ['literacy', 'operations', 'literacy', ...ids]) {
    ctx.switchMasterTab(target);
    assert.deepEqual(ids.filter(id => elements.get('tab-master-' + id).style.display !== 'none'), [target]);
    assert.deepEqual(ids.filter(id => elements.get('nav-master-' + id).classes.has('active')), [target]);
    assert.equal(rendered.at(-1), target);
  }
});
