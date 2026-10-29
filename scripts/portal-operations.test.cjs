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
const attempt=(id,thinkReply='',score=80,completedAt=new Date())=>({id,memberId:'s1',bookId:'b1',thinkReply,score,completedAt,correctCount:Math.floor(score/20),questionCount:5});

test('인증 시 정답 수 × 3P와 생각담기 5P를 지급하고 인증 실패는 지급하지 않는다',async()=>{
  const db=ledger();
  const failed=await learning.saveAttempt(db,student,book,attempt('L_fail','생각',40));
  assert.equal(failed.earned,0);assert.equal(db.member.bookCount,0);
  const passed=await learning.saveAttempt(db,student,book,attempt('L_pass','생각',80));
  assert.equal(passed.earned,17);assert.equal(passed.isCertified,true);
  assert.equal(db.member.points,17);assert.equal(db.member.bookCount,1);
  assert.equal(db.awards[0].amount,12);assert.equal(db.awards[1].amount,5);
  assert.match(db.awards[0].content,/정답 4개 × 3P/);
});

test('초4 이상 권장도서는 퀴즈·생각담기 각각 20% 가중 후 반올림한다',async()=>{
  for(const [grade,expectedQuiz,expectedThought] of [['초3',12,5],['초4',14,6],['초6',14,6],['중1',14,6],['고1',14,6]]) {
    const db=ledger();
    const result=await learning.saveAttempt(db,student,{...book,grade},attempt('L_grade','생각',80));
    assert.equal(result.earned,expectedQuiz+expectedThought);
    assert.equal(db.awards[0].amount,expectedQuiz);assert.equal(db.awards[1].amount,expectedThought);
    assert.equal(db.awards[0].content.includes('20% 가중'),grade!=='초3');
  }
  // 3문항 정답: 9×1.2=10.8 → 11P, 만점 5문항: 15×1.2=18P.
  for(const [score,earned] of [[60,17],[100,24]]) {
    const result=await learning.saveAttempt(ledger(),student,{...book,grade:'초4'},attempt('L_round','생각',score));
    assert.equal(result.earned,earned);
  }
});

test('인증 경계·만점·문항 수·빈 생각담기에 따라 정확한 포인트를 지급한다',async()=>{
  for(const [score,correctCount,questionCount,thinkReply,earned] of [
    [60,3,5,'생각',14],[100,5,5,'생각',20],[80,8,10,'생각',29],
    [60,3,5,'',9],[60,3,5,'   ',9],[59,59,100,'생각',0]
  ]) {
    const result=await learning.saveAttempt(ledger(),student,book,{...attempt('L_edge',thinkReply,score),correctCount,questionCount});
    assert.equal(result.earned,earned);
  }
});

test('동일 도서 인증 2회차까지 지급하고 동시 제출·중복 재시도로 추가 적립하지 않는다',async()=>{
  const db=ledger();
  const results=await Promise.all(['L_1','L_2','L_3'].map(id=>learning.saveAttempt(db,student,book,attempt(id,'생각',80))));
  assert.deepEqual(results.map(r=>r.earned),[17,17,0]);
  assert.equal((await learning.saveAttempt(db,student,book,attempt('L_1','생각',80))).earned,17);
  assert.equal(db.member.points,34);assert.equal(db.awards.length,4);assert.equal(db.member.bookCount,1);
});

test('동일 도서에서 당일 3회 실패 시 추가 제출을 차단하고 다른 도서는 허용한다',async()=>{
  const db=ledger();
  for(let i=0;i<3;i++) await learning.saveAttempt(db,student,book,attempt('L_fail_'+i,'',40));
  await assert.rejects(()=>learning.saveAttempt(db,student,book,attempt('L_blocked','',80)),/DAILY_LIMIT_EXCEEDED/);
  assert.equal(db.attempts.length,3);
  const result=await learning.saveAttempt(db,student,{id:'b2',title:'다른 책'},{...attempt('L_other_book','',80),bookId:'b2'});
  assert.equal(result.earned,12);
});

test('한국 시간 자정이 지나면 전날의 3회 실패 제한이 해제된다',async()=>{
  let now='2026-10-29T14:59:59Z';
  class ClockDate extends Date {
    constructor(value) { super(value === undefined ? now : value); }
    static now() { return +new Date(now); }
  }
  const timed=load('lib/portal-learning.ts',{}, {Date:ClockDate});
  const db=ledger();
  for(let i=0;i<3;i++) await timed.saveAttempt(db,student,book,attempt('L_fail_'+i,'',40,new Date(now)));
  await assert.rejects(()=>timed.saveAttempt(db,student,book,attempt('L_before','',80,new Date(now))),/DAILY_LIMIT_EXCEEDED/);
  now='2026-10-29T15:00:00Z';
  assert.equal((await timed.saveAttempt(db,student,book,attempt('L_after','',80,new Date(now)))).earned,12);
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

test('문자 도서 코드로 과제를 배정해도 도서 번호를 숫자로 변환하지 않는다',async()=>{
  let saved;
  const db={book:{findFirst:async({where})=>{
    assert.equal(where.OR[1].bookNo,'FA000001');return {id:'book-server-id'};
  }},member:{findMany:async()=>[{id:'s1'}]},$transaction:async fn=>fn({
    $queryRaw:async()=>[],bookAssignment:{findFirst:async()=>null,create:async({data})=>{saved=data;}}
  })};
  const res=response();
  await api('api/manage.ts',teacher,db)({method:'POST',query:{entity:'assignments'},body:{operation:'save',data:{bookId:'FA000001',memberId:'s1'}}},res);
  assert.equal(res.code,200);assert.equal(saved.bookId,'book-server-id');assert.equal(saved.academyId,'a1');
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
test('랭킹 DB 집계 결과와 상위권 밖 본인의 순위·캐릭터를 함께 반환한다',async()=>{
  let parameters, sql;
  const rankingStudent={...student,classGroupId:'class-1',classGroup:{name:'실제 반'},academy:{code:'A1',name:'실제 학원'}};
  const ranked=[{id:'s2',name:'김학생',rank:1n,participants:150n,amount:20n,books:2n,points:900,academyName:'실제 학원',className:'실제 반'},
    {id:'s1',name:'박진호',rank:120n,participants:150n,amount:8n,books:1n,points:8,academyName:'실제 학원',className:'실제 반'}];
  const db={
    $queryRaw:async(strings,...values)=>{sql=strings.join('?');parameters=values;return ranked;},
    portalSetting:{findMany:async()=>[{key:'character:s2',value:{characterId:'booki'}}]},
    quizAttempt:{findMany:async()=>Array.from({length:100},(_,i)=>({memberId:'s2',bookId:'b'+i})).concat([{memberId:'s1',bookId:'b0'}])},
    book:{findMany:async()=>Array.from({length:100},(_,i)=>({id:'b'+i,theme:{name:'자연·생물'}}))}
  };
  const res=response();await api('api/activity.ts',rankingStudent,db)({method:'GET',query:{action:'rankings',scope:'class',period:'month'}},res);
  assert.equal(res.code,200);assert.equal(res.data.participants,150);assert.equal(res.data.myRank,120);assert.equal(res.data.rows.length,1);
  assert.equal(res.data.rows[0].charId,'booki');assert.equal(res.data.rows[0].stage,2);assert.equal(res.data.myBooks,1);
  assert.equal(res.data.academyName,'실제 학원');assert.equal(res.data.className,'실제 반');
  assert.ok(parameters.includes('class-1'));assert.ok(parameters.includes('a1'));assert.ok(parameters.includes('s1'));
  assert.match(sql,/ROW_NUMBER/);assert.match(sql,/rank <= 100 OR id/);assert.doesNotThrow(()=>JSON.stringify(res.data));
});
test('학급 미지정 학생의 요청은 학원 범위로 조회하고 전국에서는 이름을 가린다',async()=>{
  let values;
  const noClass={...student,classGroupId:null,classGroup:null,academy:{code:'A1',name:'실제 학원'}};
  const db={$queryRaw:async(strings,...v)=>{values=v;return [{id:'s2',name:'김학생',rank:1n,participants:1n,amount:0n,books:0n,points:0,academyName:'실제 학원',className:null}];},
    portalSetting:{findMany:async()=>[]},quizAttempt:{findMany:async()=>[]},book:{findMany:async()=>[]}};
  const res=response();await api('api/activity.ts',noClass,db)({method:'GET',query:{action:'rankings',scope:'class',period:'month'}},res);
  assert.equal(res.data.scope,'academy');assert.equal(res.data.hasClass,false);assert.equal(values[0],false);assert.equal(values[2],true);
  const national=response();await api('api/activity.ts',noClass,db)({method:'GET',query:{action:'rankings',scope:'national'}},national);
  assert.equal(values[0],true);assert.equal(national.data.rows[0].name,'김**');
});
test('개인 설정의 다른 기기 변경은 덮어쓰지 않는다',async()=>{
  const run=api('api/activity.ts',student,{portalSetting:{updateMany:async()=>({count:0})}});const res=response();
  await run({method:'POST',query:{action:'preferences'},body:{revision:1,value:{wishlist:['B1'],interests:[]}}},res);assert.equal(res.code,409);
});
test('대시보드 운영 스크립트가 구문 검사에 통과하고 별도 관리 페이지를 참조하지 않는다',()=>{
  for(const name of ['portal-extras','portal-client','preview-ux'])new vm.Script(fs.readFileSync(path.join(__dirname,'../public_html/js/'+name+'.js'),'utf8'),{filename:name});
  for(const name of ['master_preview.js','admin_preview.js']) {
    const source=fs.readFileSync(path.join(__dirname,'../public_html/'+name),'utf8');
    new vm.Script(source,{filename:name});
    assert.equal(source.includes('openManage'),false);
    assert.equal(source.includes('manage.html'),false);
  }
  assert.equal(fs.existsSync(path.join(__dirname,'../public_html/manage.html')),false);
});
test('배포 준비는 기존 비밀번호를 유지하며 해시로 바꾸고 두 번째 실행은 다시 바꾸지 않는다',async()=>{
  const {prepare}=require('./prepare-portal.cjs');const auth=load('lib/portal-auth.ts');
  const keys=['VERCEL_ENV','DATABASE_URL','DIRECT_URL','PORTAL_AUTH_SECRET'];const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  Object.assign(process.env,{VERCEL_ENV:'production',DATABASE_URL:'postgresql://test.invalid/db',DIRECT_URL:'postgresql://test.invalid/db',PORTAL_AUTH_SECRET:'test-only-secret-more-than-32-characters'});
  const members=[{id:'old',password:'legacy-existing-password'},{id:'modern',password:auth.hashPassword('already-hashed-password')}];const original=members[1].password;let updates=0;
  const db={$queryRaw:async()=>[], $executeRawUnsafe:async()=>0,$disconnect:async()=>{},member:{findMany:async()=>members,count:async()=>1,updateMany:async({where,data})=>{const m=members.find(m=>m.id===where.id&&m.password===where.password);if(!m)return {count:0};m.password=data.password;updates++;return {count:1};}}};db.$transaction=async arg=>typeof arg==='function'?arg(db):Promise.all(arg);
  try{await prepare(db);await prepare(db);assert.equal(auth.verifyPassword('legacy-existing-password',members[0].password),true);assert.equal(members[1].password,original);assert.equal(updates,1);}finally{for(const key of keys)if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}
});


test('요약의 월 합계는 200건 제한과 무관하며 과거 월·다음 커서를 제공한다',async()=>{
  let aggregateWhere;
  const db={pointHistory:{findMany:async()=>Array.from({length:201},(_,i)=>({id:'p'+i,amount:5})),aggregate:async({where})=>{aggregateWhere=where;return {_sum:{amount:1500}};}},
    bookAssignment:{findMany:async()=>[]},quizAttempt:{findMany:async()=>[],aggregate:async()=>({_avg:{score:80}})},$queryRaw:async()=>[{month:'2026-10'},{month:'2025-01'}]};
  const res=response();await api('api/activity.ts',student,db)({method:'GET',query:{action:'summary'}},res);
  assert.equal(res.code,200);assert.equal(res.data.currentMonthPoints,1500);assert.equal(res.data.pointLogs.length,200);assert.equal(res.data.pointNextCursor,'p199');
  assert.deepEqual(Array.from(res.data.pointMonths),['2026-10','2025-01']);assert.equal(aggregateWhere.memberId,'s1');assert.ok(aggregateWhere.createdAt.gte < aggregateWhere.createdAt.lt);
});
test('월별 포인트 조회는 KST 경계와 본인 조건을 적용한다',async()=>{
  let where;
  const run=api('api/activity.ts',student,{pointHistory:{findMany:async q=>{where=q.where;return [];}}});
  const res=response();await run({method:'GET',query:{action:'points',month:'2026-10'}},res);
  assert.equal(res.code,200);assert.equal(where.memberId,'s1');assert.equal(where.createdAt.gte.toISOString(),'2026-09-30T15:00:00.000Z');assert.equal(where.createdAt.lt.toISOString(),'2026-10-31T15:00:00.000Z');
  const invalid=response();await run({method:'GET',query:{action:'points',month:'2026-13'}},invalid);assert.equal(invalid.code,400);
});
test('과거 제출의 지급액도 원장 ID로 복원하고 다른 지급 건을 섞지 않는다',async()=>{
  let query;
  const earned=await learning.earnedForAttempt({pointHistory:{findMany:async q=>{query=q;return [{amount:12},{amount:5}];}}},{id:'L_old',memberId:'s1',bookId:'b1',answers:{}});
  const {createHash}=require('node:crypto');
  assert.equal(earned,17);assert.equal(query.where.memberId,'s1');assert.equal(query.where.id.in.length,4);
  assert.ok(query.where.id.in.includes('award_'+createHash('sha256').update(JSON.stringify(['s1','b1','THOUGHT_1','L_old'])).digest('hex')));
});
test('분야 분류는 서버 테마를 기본 문학 분류보다 우선하며 고유 도서만 센다',()=>{
  const reading=require('../public_html/js/reading-progress');
  const counts=reading.stats([{id:'b1',themeName:'자연·생물',cat:'K / 이야기'},{id:'b1',themeName:'자연·생물'},{id:'b2',theme:{name:'학습·수학'},subject:'과학'},{id:'b3',subject:'건강·음식'}]);
  assert.equal(counts.totalRead,3);assert.equal(counts.natureRead,1);assert.equal(counts.histRead,0);assert.equal(counts.studyRead,1);assert.equal(counts.healthRead,1);
  for(const [id,rule] of Object.entries(reading.rules)) {
    for(const [count,expected] of [[rule[1]-1,0],[rule[1],1],[rule[2],2],[rule[3],3]]) assert.equal(reading.stage(id,{[rule[0]]:count}),expected,id);
  }
});
test('서버 캐릭터 저장은 실독서 기록으로 해금을 검증한다',async()=>{
  let saved;let completed=49;
  const db={quizAttempt:{findMany:async()=>Array.from({length:completed},(_,i)=>({memberId:'s1',bookId:'b'+i}))},book:{findMany:async()=>Array.from({length:completed},(_,i)=>({id:'b'+i,theme:{name:'자연·생물'}}))},
    portalSetting:{upsert:async q=>{saved=q;},findUnique:async()=>saved?{value:saved.create.value}:null}};
  const run=api('api/activity.ts',student,db);
  const locked=response();await run({method:'POST',query:{action:'character'},body:{characterId:'booki',stage:3}},locked);assert.equal(locked.code,409);assert.equal(saved,undefined);
  completed=50;const unlocked=response();await run({method:'POST',query:{action:'character'},body:{characterId:'booki',stage:3}},unlocked);assert.equal(unlocked.data.stage,1);assert.equal(saved.where.key,'character:s1');
  const read=response();await run({method:'GET',query:{action:'character'}},read);assert.equal(read.data.characterId,'booki');
  const invalid=response();await run({method:'POST',query:{action:'character'},body:{characterId:'constructor'}},invalid);assert.equal(invalid.code,400);
});
test('인기 도서는 기간별 실제 인증 수만 집계한다',async()=>{
  const starts=[];
  const db={quizAttempt:{groupBy:async q=>{starts.push(q.where.completedAt.gte);assert.equal(q.where.score.gte,60);return [{bookId:'b1',_count:{id:3}}];}},book:{findMany:async()=>[{id:'b1',bookNo:'B001'}]}};
  for(const period of ['daily','weekly','monthly']) {const res=response();await api('api/activity.ts',student,db)({method:'GET',query:{action:'popular',period}},res);assert.equal(res.data.items[0].count,3);assert.equal(res.data.items[0].bookId,'B001');}
  assert.equal(+starts[0]-+starts[1],6*86400000);assert.equal(starts[2].getUTCHours(),15);
});
test('문항 묶음은 먼저 검증하고 중간 저장 실패 시 전체 롤백한다',async()=>{
  let state=[{id:'q1',question:'기존1',questionNo:1},{id:'q2',question:'기존2',questionNo:2}], transactions=0;
  const db={book:{findUnique:async()=>({id:'b1'})},$transaction:async fn=>{
    transactions++;const working=structuredClone(state);const tx={$queryRaw:async()=>[],bookQuiz:{findMany:async()=>working,
      update:async({where,data})=>{if(where.id==='q2')throw new Error('저장 실패');Object.assign(working.find(q=>q.id===where.id),data);return working[0];},deleteMany:async()=>({count:0})}};
    const result=await fn(tx);state=working;return result;
  }};
  const run=api('api/manage.ts',{...teacher,role:'MASTER'},db), questions=[1,2].map(n=>({question:'새문항'+n,options:['가','나'],correctAnswer:1}));
  const invalid=response();await run({method:'POST',query:{entity:'quizzes'},body:{operation:'replace',data:{bookId:'b1',questions:[{...questions[0],options:['같음','같음']}]}}},invalid);
  assert.equal(invalid.code,400);assert.equal(transactions,0);
  const failed=response();await run({method:'POST',query:{entity:'quizzes'},body:{operation:'replace',data:{bookId:'b1',questions}}},failed);
  assert.equal(failed.code,500);assert.deepEqual(state.map(q=>q.question),['기존1','기존2']);assert.equal(transactions,1);
});
