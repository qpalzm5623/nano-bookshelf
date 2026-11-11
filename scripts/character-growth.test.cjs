const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).join('\n');
const ast = ts.createSourceFile('student.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

function characterUi(extra = {}) {
  const elements = new Map();
  const ctx = vm.createContext({
    document: { getElementById: id => {
      if (!elements.has(id)) elements.set(id, { style: {}, innerHTML: '', innerText: '', textContent: '' });
      return elements.get(id);
    } },
    getStudentActivityStats: () => ({ totalRead: 200, studyRead: 150 }),
    getStudentQuizIdentity: () => ({ studentId: 'student1' }),
    localStorage: { getItem: () => 'lumi' },
    NanoQuizResult: { avatar: (id, size, stage) => '<svg data-character="' + id + '" data-stage="' + stage + '"></svg>' },
    tempSelectedCharId: 'lumi',
    ...extra
  });
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(root, 'public_html/js/reading-progress.js'), 'utf8'), ctx);
  for (const name of ['NANO_CHARACTERS', 'CHAR_RECOMMEND_REACTIONS']) {
    const node = ast.statements.find(item => ts.isVariableStatement(item) && item.declarationList.declarations.some(decl => decl.name.getText(ast) === name));
    assert.ok(node, name);
    vm.runInContext(node.getText(ast), ctx);
  }
  for (const name of ['getCharacterById', 'getCharacterGrowth', 'getCharacterUnlockStatus', 'getStudentStoragePrefix', 'getUserCharacterId', 'getCharacterSvg', 'renderCharacterSelectModal', 'openCelebrationModal']) {
    const node = ast.statements.find(item => ts.isFunctionDeclaration(item) && item.name.text === name);
    assert.ok(node, name);
    vm.runInContext(node.getText(ast), ctx);
  }
  return { ctx, elements };
}

test('냥이와 양양으로 바뀌어도 기존 선택 ID와 1~3단계 독서 기록을 유지한다', () => {
  for (const [id, name, statsKey, thresholds] of [
    ['lumi', '냥이', 'studyRead', [50, 100, 150]],
    ['jelly', '양양', 'totalRead', [50, 100, 200]]
  ]) {
    const { ctx } = characterUi({ localStorage: { getItem: () => id } });
    const char = ctx.getCharacterById(id);
    assert.match(char.name, new RegExp('^' + name));
    thresholds.forEach((count, index) => {
      ctx.getStudentActivityStats = () => ({ [statsKey]: count });
      assert.equal(ctx.getCharacterUnlockStatus(char).currentStage, index + 1);
      assert.equal(ctx.getUserCharacterId(), id);
    });
    ctx.NanoPortal = { remote: true };
    ctx.nanoServerCharacterId = id;
    assert.equal(ctx.getUserCharacterId(), id);
  }
});

test('9종의 성장 미리보기와 축하 대사가 선택한 캐릭터 및 단계에 맞는다', () => {
  const { ctx, elements } = characterUi();
  ctx.getCharacterUnlockStatus = () => ({ unlocked: true, currentStage: 2, percent: 75, statusText: '3단계까지 50권 남음' });
  for (const char of ctx.NANO_CHARACTERS) {
    ctx.tempSelectedCharId = char.id;
    ctx.renderCharacterSelectModal();
    const preview = elements.get('charGrowthPreview').innerHTML;
    assert.equal((preview.match(/aria-current="step"/g) || []).length, 1);
    assert.equal((preview.match(/data-character=/g) || []).length, 3);
    for (const stage of [1, 2, 3]) {
      const growth = ctx.getCharacterGrowth(char, stage);
      assert.ok(preview.includes(growth.title));
      assert.ok(preview.includes('data-character="' + char.id + '" data-stage="' + stage + '"'));
      ctx.openCelebrationModal(char.id, stage);
      assert.equal(elements.get('celebQuote').innerText, '"' + growth.quote + '"');
      assert.equal(elements.get('celebEvolvedTag').textContent, stage + '단계 · ' + growth.title);
    }
  }
  assert.equal(new Set(ctx.NANO_CHARACTERS.flatMap(char => char.growth.map(stage => stage.title))).size, 27);
  assert.equal(new Set(Object.values(ctx.CHAR_RECOMMEND_REACTIONS)).size, 9);
});
