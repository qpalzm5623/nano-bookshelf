const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file, deps = {}, extra = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>deps[name]||require(name),Buffer,process,console,URL,URLSearchParams,AbortSignal,Date,...extra});return exports;
}
const http = load('lib/portal-http.ts', {'./prisma':{prisma:{}},'./portal-auth':{}});
const learning = load('lib/portal-learning.ts');
function ledger() {
  const attempts=[],awards=[], member={points:0,bookCount:0};let queue=Promise.resolve();
  const tx={
    $queryRaw:async()=>[],
    quizAttempt:{findUnique:async({where})=>attempts.find(a=>a.id===where.id),findMany:async({where})=>attempts.filter(a=>a.memberId===where.memberId&&a.bookId===where.bookId),create:async({data})=>{attempts.push(data);return data;},aggregate:async()=>({_avg:{score:80}})},
    pointHistory:{findUnique:async({where})=>awards.find(a=>a.id===where.id),create:async({data})=>{awards.push(data);return data;}},
    member:{update:async({data})=>{member.points+=data.points.increment;member.bookCount+=data.bookCount.increment;}},bookAssignment:{updateMany:async()=>({count:1})}
  };
  return {attempts,awards,member,$transaction:fn=>{const result=queue.then(()=>fn(tx));queue=result.catch(()=>{});return result;}};
}
const student={id:'s1',username:'student',role:'STUDENT',academyId:'a1',academy:{code:'A1'}};
const book={id:'b1',title:'검증 도서'};
const attempt=(id,thinkReply='')=>({id,memberId:'s1',bookId:'b1',thinkReply,score:80});
test('동시 최초 제출은 완독 100P와 생각담기 50P를 한 번씩만 적립한다',async()=>{
  const db=ledger();const result=await Promise.all([learning.saveAttempt(db,student,book,attempt('L_1','생각')),learning.saveAttempt(db,student,book,attempt('L_2','새 생각'))]);
  assert.equal(result.reduce((sum,r)=>sum+r.earned,0),150);assert.equal(db.member.points,150);assert.equal(db.member.bookCount,1);assert.equal(db.awards.length,2);
});
test('완독 후 처음 작성한 생각담기만 추가 50P, 재시도는 0P다',async()=>{
  const db=ledger();assert.equal((await learning.saveAttempt(db,student,book,attempt('L_1'))).earned,100);
  assert.equal((await learning.saveAttempt(db,student,book,attempt('L_2','생각'))).earned,50);
  assert.equal((await learning.saveAttempt(db,student,book,attempt('L_2','생각'))).earned,0);assert.equal(db.attempts.length,2);
});
test('이관 기록은 보상 없이 저장하며 이미 완료한 도서의 보상을 다시 만들지 않는다',async()=>{
  const db=ledger();await learning.saveAttempt(db,student,book,attempt('L_old','생각'),true);
  assert.equal((await learning.saveAttempt(db,student,book,attempt('L_new','생각'))).earned,0);assert.equal(db.member.points,0);assert.equal(db.member.bookCount,1);
});
test('다른 학생의 제출 ID는 재사용할 수 없다',async()=>{
  const db=ledger();db.attempts.push({...attempt('L_other'),memberId:'other'});
  await assert.rejects(()=>learning.saveAttempt(db,student,book,attempt('L_other')),/ATTEMPT_OWNER/);
});
test('월별 집계는 한국 시간 월경계와 연도 경계를 사용한다',()=>{
  const window=learning.monthWindow('lastMonth',new Date('2026-12-31T15:00:00Z'));
  assert.equal(window.gte.toISOString(),'2026-11-30T15:00:00.000Z');assert.equal(window.lt.toISOString(),'2026-12-31T15:00:00.000Z');
});
function response(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(d){this.data=d;return this;},send(d){this.data=d;return this;}};}
function api(file,user,db,extras={}){return load(file,{'../lib/prisma':{prisma:db},'../lib/portal-http':{...http,authenticate:async()=>user,academyScope:async(u,code)=>{if(code&&code!==u.academy.code)http.master(u);return u.academyId;}},'../lib/portal-auth':{hashPassword:()=>'$testhash'},'../lib/portal-learning':learning},extras).default;}
const teacher={...student,role:'TEACHER'};
test('교사는 회원·학원 변경 불가, 타 학원 조회도 불가하다',async()=>{
  const run=api('api/manage.ts',teacher,{});
  for(const entity of ['members','academies']){const res=response();await run({method:'POST',query:{entity},body:{operation:'save',data:{}}},res);assert.equal(res.code,403);}
  const res=response();await run({method:'GET',query:{entity:'members',academy:'OTHER'}},res);assert.equal(res.code,403);
});
test('삭제 대상 ID가 없으면 전체 삭제 쿼리를 실행하지 않는다',async()=>{
  const run=api('api/manage.ts',teacher,{bookAssignment:{deleteMany:async()=>assert.fail('삭제 실행')}});const res=response();
  await run({method:'POST',query:{entity:'assignments'},body:{operation:'delete',data:{}}},res);assert.equal(res.code,400);
});
test('학생은 타 학생 첨삭 파일을 열 수 없고 교사도 타 학원 파일을 열 수 없다',async()=>{
  const db={portalFile:{findUnique:async()=>({academyId:'a1',attemptId:'attempt',mime:'application/pdf',name:'첨삭.pdf',data:Buffer.from('%PDF-')})},quizAttempt:{findUnique:async()=>({memberId:'other'})}};
  const res=response();await api('api/files.ts',student,db)({method:'GET',query:{id:'file'}},res);assert.equal(res.code,403);
  const denied=response();await api('api/files.ts',{...teacher,academyId:'a2'},db)({method:'GET',query:{id:'file'}},denied);assert.equal(denied.code,404);
});
test('확장자만 PDF인 HTML 첨부파일을 거부한다',async()=>{
  const db={quizAttempt:{findFirst:async()=>({id:'attempt',member:{academyId:'a1'}})}};const res=response();
  await api('api/files.ts',teacher,db)({method:'POST',query:{},body:{attemptId:'attempt',name:'attack.pdf',base64:Buffer.from('<script>test</script>').toString('base64')}},res);assert.equal(res.code,400);
});
test('2MB를 넘는 파일은 저장하지 않는다',async()=>{
  const db={quizAttempt:{findFirst:async()=>({id:'attempt',member:{academyId:'a1'}})}};const res=response();
  await api('api/files.ts',teacher,db)({method:'POST',query:{},body:{base64:'A'.repeat(2800001)}},res);assert.equal(res.code,413);
});
test('외부 서비스 설정이 없으면 발송 요청을 보내지 않는다',async()=>{
  const res=response();await api('api/services.ts',teacher,{}, {process:{env:{}},fetch:async()=>assert.fail('외부 전송')})({method:'POST',query:{},body:{action:'send'}},res);assert.equal(res.code,503);
});
test('동일 리포트 재발송 및 결과 불명 상태를 자동 재시도하지 않는다',async()=>{
  let count=0,record=null;
  const env={ALIGO_ENABLED:'true',ALIGO_API_KEY:'test',ALIGO_USER_ID:'test',ALIGO_SENDER_KEY:'test',ALIGO_SENDER:'01000000000',ALIGO_TEMPLATE_CODE:'test',ALIGO_REPORT_TEMPLATE:'#{학생명} #{점수}'};
  const db={quizAttempt:{findFirst:async()=>({id:'attempt',score:80,bookId:'b1',member:{name:'학생',parentPhone:'01011112222',reportYn:true,academyId:'a1'}})},book:{findUnique:async()=>book},aligoDispatchLog:{findUnique:async()=>record,create:async({data})=>{record=data;return record;},update:async({data})=>Object.assign(record,data)}};
  const run=api('api/services.ts',teacher,db,{process:{env},fetch:async()=>{count++;throw new Error('timeout');}});
  const preview=response();await run({method:'POST',query:{},body:{action:'preview',logId:'attempt'}},preview);
  const req={method:'POST',query:{},body:{action:'send',logId:'attempt',fingerprint:preview.data.fingerprint}};
  const first=response();await run(req,first);assert.equal(first.code,502);assert.equal(record.status,'UNKNOWN');
  const second=response();await run(req,second);assert.equal(second.data.duplicate,true);assert.equal(count,1);
});
test('포인트 페이지 조회는 요청자 회원으로 제한하고 다음 커서를 반환한다',async()=>{
  let query;const items=Array.from({length:201},(_,i)=>({id:'p'+i}));
  const run=api('api/activity.ts',student,{pointHistory:{findMany:async q=>{query=q;return items;}}});const res=response();
  await run({method:'GET',query:{action:'points',cursor:'old',memberId:'other'}},res);assert.equal(query.where.memberId,'s1');assert.equal(query.skip,1);assert.equal(res.data.items.length,200);assert.equal(res.data.nextCursor,'p199');
});
test('개인 설정의 다른 기기 변경은 덮어쓰지 않는다',async()=>{
  const run=api('api/activity.ts',student,{portalSetting:{updateMany:async()=>({count:0})}});const res=response();
  await run({method:'POST',query:{action:'preferences'},body:{revision:1,value:{wishlist:['B1'],interests:[]}}},res);assert.equal(res.code,409);
});
test('새 운영 화면 스크립트가 구문 검사에 통과한다',()=>{
  for(const name of ['manage','portal-extras','portal-client'])new vm.Script(fs.readFileSync(path.join(__dirname,'../public_html/js/'+name+'.js'),'utf8'),{filename:name});
});
test('도서 편집의 긴 글 입력창은 읽기 전용 type 속성을 변경하지 않고 열린다',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../public_html/js/manage.js'),'utf8');
  const ast=ts.createSourceFile('manage.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  let fn;function walk(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='openEditor')fn=node.getText(ast);ts.forEachChild(node,walk);}walk(ast);
  const elements=new Map();
  function element(tag='div') {const value={tagName:tag.toUpperCase(),children:[],value:'',options:[],append(child){this.children.push(child);if(child.tagName==='OPTION')this.options.push(child);},replaceChildren(){this.children=[];},showModal(){this.open=true;},querySelector(){return {focus(){}};}};if(tag==='textarea')Object.defineProperty(value,'type',{get:()=> 'textarea'});return value;}
  const context=vm.createContext({busy:false,editing:{},entity:'books',labels:{books:'도서'},schemas:{books:[['description','소개','textarea'],['thinkQuiz','생각담기','textarea']]},lookups:{},user:{role:'master'},crypto:require('node:crypto'),document:{createElement:element},$:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);}});
  vm.runInContext("'use strict';\n"+fn,context);await context.openEditor({id:'b',description:'소개 문장',thinkQuiz:'나의 생각은?'});
  assert.equal(elements.get('editor').open,true);assert.equal(elements.get('fields').children[0].children[0].value,'소개 문장');
});
test('배포 준비는 기존 비밀번호를 유지하며 해시로 바꾸고 두 번째 실행은 다시 바꾸지 않는다',async()=>{
  const {prepare}=require('./prepare-portal.cjs');const auth=load('lib/portal-auth.ts');
  const keys=['VERCEL_ENV','DATABASE_URL','DIRECT_URL','PORTAL_AUTH_SECRET'];const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  Object.assign(process.env,{VERCEL_ENV:'production',DATABASE_URL:'postgresql://test.invalid/db',DIRECT_URL:'postgresql://test.invalid/db',PORTAL_AUTH_SECRET:'test-only-secret-more-than-32-characters'});
  const members=[{id:'old',password:'legacy-existing-password'},{id:'modern',password:auth.hashPassword('already-hashed-password')}];const original=members[1].password;let updates=0;
  const db={$queryRaw:async()=>[], $executeRawUnsafe:async()=>0,$disconnect:async()=>{},member:{findMany:async()=>members,count:async()=>1,updateMany:async({where,data})=>{const m=members.find(m=>m.id===where.id&&m.password===where.password);if(!m)return {count:0};m.password=data.password;updates++;return {count:1};}}};db.$transaction=async arg=>typeof arg==='function'?arg(db):Promise.all(arg);
  try{await prepare(db);await prepare(db);assert.equal(auth.verifyPassword('legacy-existing-password',members[0].password),true);assert.equal(members[1].password,original);assert.equal(updates,1);}finally{for(const key of keys)if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}
});
