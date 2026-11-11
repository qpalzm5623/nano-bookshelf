const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const sourceFiles = ['public_html/admin_preview.js', 'public_html/js/admin_worksheet_ai.js'];
const source = sourceFiles.filter(p => fs.existsSync(p)).map(p => fs.readFileSync(p, 'utf8')).join('\n');
const ast = ts.createSourceFile('admin_preview_combined.js', source, ts.ScriptTarget.Latest, true);
function setup() {
  let rows = [{ id: 'a', studentName: '검증 원생', classGroup: 'A', bookTitle: '검증 도서', date: '2026-11-05', score: 80, quizResults: ['보존'], comment: '기존 코멘트', reviewed: '첨삭 완료', sheet: '작성 완료', worksheetPhotos: [{dataUrl:'photo',base64:'sample',mimeType:'image/jpeg'}], worksheetAiResult: {summary:'요약', actualQuotes:[{quote:'인용',criteria:'자기표현',comment:'관찰'}],nextStep:'활동',parentGuide:'질문'} }];
  const elements = new Map(), stored = new Map(), modals = [], notices = [];
  const get = id => { if (!elements.has(id)) elements.set(id, {style:{},value:'',innerHTML:'',innerText:'',textContent:'',disabled:false}); return elements.get(id); };
  const ctx = vm.createContext({ console, Set, JSON, currentOpenCorrectionLogId:'a', currentWorksheetPhotos:[], currentWorksheetAiResult:null,
    STORAGE_KEY_WORKSHEET_STORE:'test-worksheet', confirm:()=>true,
    localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},
    document:{getElementById:get}, getLoadedLearningLogs:()=>JSON.parse(JSON.stringify(rows)),
    renderLearningTable(){}, renderWorksheetPhotoThumbnails(){}, showAcademyToast:msg=>notices.push(msg),
    $:()=>({modal:action=>modals.push(action)}), jQuery:true,
    NanoPortal:{remote:true, logs:()=>rows, request:async()=>({reviewRevision:'new'}), applyReview:log=>{rows=rows.map(row=>row.id===log.id?JSON.parse(JSON.stringify(log)):row);} }
  });
  ctx.window=ctx;
  for(const name of ['currentWorksheetCorrectionDone','currentWorksheetReviewRevision','worksheetCorrectionSaving','worksheetAnalysisJobs','worksheetEditableFields']) {
    const statement=ast.statements.find(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name));
    vm.runInContext(statement.getText(ast),ctx);
  }
  for(const name of ['saveWorksheetStore','saveCustomLearningLogs','escapePortfolioText','worksheetEditorField','renderWorksheetCorrectionEditor','readWorksheetCorrectionEditor','syncWorksheetCorrectionActions','openCorrectionModal','saveCorrectionFromModal','deleteCorrectionFromModal','runWorksheetAiAnalysis']) {
    vm.runInContext(ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text===name).getText(ast),ctx);
  }
  return {ctx,get,stored,modals,notices,rows:()=>rows,setRows:value=>{rows=value;}};
}

test('첨삭 전/후에 실행·업로드와 저장·삭제 버튼을 구분한다',()=>{
  const f=setup(); f.ctx.openCorrectionModal('a');
  assert.equal(f.get('worksheetUploadSection').style.display,'none');
  assert.equal(f.get('btnRunWorksheetAi').style.display,'none');
  assert.equal(f.get('btnSaveWorksheetCorrection').style.display,'inline-block');
  f.setRows([{...f.rows()[0],reviewed:'첨삭 전',worksheetAiResult:null}]); f.ctx.openCorrectionModal('a');
  assert.equal(f.get('worksheetUploadSection').style.display,'block');
  assert.equal(f.get('btnRunWorksheetAi').disabled,false);
  assert.equal(f.get('btnDeleteWorksheetCorrection').style.display,'none');
});

test('요약·인용·그림·표현·성장·가정 대화 수정값을 저장하고 재열람한다',async()=>{
  const f=setup(); f.ctx.openCorrectionModal('a');
  for(const field of f.ctx.worksheetEditableFields) f.get('worksheetEdit-'+field[0]).value='수정 '+field[0];
  for(const key of ['quote','criteria','comment']) f.get('worksheetQuote-0-'+key).value='수정 '+key;
  await f.ctx.saveCorrectionFromModal();
  assert.equal(f.rows()[0].worksheetAiResult.nextStep,'수정 nextStep');
  assert.equal(f.rows()[0].worksheetAiResult.actualQuotes[0].quote,'수정 quote');
  assert.deepEqual(f.rows()[0].quizResults,['보존']);
  assert.equal(f.modals.at(-1),'hide');
  f.ctx.openCorrectionModal('a');
  assert.match(f.get('worksheetAiEditor').innerHTML,/수정 parentGuide/);
});

test('삭제 확인 취소와 서버 실패 때 기록·편집 화면을 유지한다',async()=>{
  const f=setup(); f.ctx.openCorrectionModal('a');
  let confirms=0; f.ctx.confirm=()=>{confirms++;return false;};
  await f.ctx.deleteCorrectionFromModal();
  assert.equal(confirms,1); assert.equal(f.rows()[0].reviewed,'첨삭 완료');
  f.ctx.confirm=()=>true; f.ctx.NanoPortal.request=async()=>{throw Error('저장 실패');};
  await f.ctx.deleteCorrectionFromModal();
  assert.equal(f.rows()[0].worksheetAiResult.summary,'요약');
  assert.equal(f.modals.includes('hide'),false);
  assert.equal(f.stored.size,0);
  assert.equal(f.get('btnDeleteWorksheetCorrection').disabled,false);
});

test('삭제 성공 시 첨삭과 로컬 사본을 비우고 원본 사진·퀴즈를 보존한 채 모달을 닫는다',async()=>{
  const f=setup(); f.ctx.openCorrectionModal('a');
  f.ctx.saveWorksheetStore('a',f.rows()[0].worksheetAiResult,f.rows()[0].worksheetPhotos);
  await f.ctx.deleteCorrectionFromModal();
  assert.equal(f.rows()[0].worksheetAiResult,null);
  assert.equal(f.rows()[0].comment,''); assert.equal(f.rows()[0].reviewed,'첨삭 전');
  assert.equal(f.rows()[0].worksheetPhotos.length,1); assert.equal(f.rows()[0].score,80);
  assert.equal(JSON.parse(f.stored.get('test-worksheet')).a.aiResult,null);
  assert.equal(f.modals.at(-1),'hide');
  f.ctx.openCorrectionModal('a'); assert.equal(f.get('worksheetAiResultCard').style.display,'none');
});

test('편집 가능한 AI 텍스트의 HTML이 실행용 마크업으로 들어가지 않는다',()=>{
  const f=setup(); f.ctx.openCorrectionModal('a');
  f.ctx.currentWorksheetAiResult.summary='</textarea><img src=x onerror=alert(1)>';
  f.ctx.renderWorksheetCorrectionEditor();
  assert.ok(!f.get('worksheetAiEditor').innerHTML.includes('<img'));
  assert.match(f.get('worksheetAiEditor').innerHTML,/&lt;\/textarea&gt;/);
});

test('분석 도중 다른 원생 모달을 열어도 원래 사진과 결과가 원래 기록에만 저장된다',async()=>{
  const f=setup();
  f.setRows([{...f.rows()[0],reviewed:'첨삭 전',worksheetAiResult:null},{...f.rows()[0],id:'b',studentName:'다른 원생',worksheetAiResult:{summary:'다른 결과'}}]);
  let resolve; f.ctx.NanoPortal.api=()=>new Promise(done=>{resolve=done;});
  f.ctx.openCorrectionModal('a'); const pending=f.ctx.runWorksheetAiAnalysis();
  assert.equal(f.ctx.worksheetAnalysisJobs.has('a'),true);
  f.ctx.openCorrectionModal('b');
  resolve({ok:true,result:{summary:'새 결과',actualQuotes:[],nextStep:'새 활동',parentGuide:'새 질문'}}); await pending;
  assert.equal(f.rows()[0].worksheetAiResult.summary,'새 결과');
  assert.equal(f.ctx.currentWorksheetAiResult.summary,'다른 결과');
  assert.equal(f.ctx.currentOpenCorrectionLogId,'b');
  assert.equal(f.ctx.worksheetAnalysisJobs.size,0);
});
