// 기존 테스트의 DB 대역에 브랜드 메타데이터 조회를 연결합니다. 실제 DB에는 연결하지 않습니다.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
module.exports = function (db = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/portal-brand.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const prisma = { ...db, portalSetting: { findUnique: async () => null, findMany: async () => [], ...db.portalSetting } };
  new Function('require', 'exports', code)(() => ({ prisma }), exports);
  return exports;
};
