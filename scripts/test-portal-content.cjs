// 기존 API 단위 테스트의 최소 DB fixture에 콘텐츠 정책 의존성을 연결합니다.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
module.exports = function (http) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/portal-content.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => name === './portal-http' ? (http || {
    need(condition, message, status = 400) { if (!condition) throw Object.assign(new Error(message), { status }); }
  }) : require('../lib/quiz-authors.json'), exports);
  const load = exports.loadContentAccess;
  exports.loadContentAccess = (db, academies) => load({ ...db,
    portalSetting: { findMany: async () => [], ...db.portalSetting },
    academy: { findMany: async () => [], ...db.academy }
  }, academies);
  return exports;
};
