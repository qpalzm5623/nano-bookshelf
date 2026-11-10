const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>deps[name] || require(name),process:{env:{}},console,Date,Buffer,URLSearchParams,AbortSignal});
  return exports;
}
const policy = load('lib/billing-policy.ts',{});
const need=(value,message)=>{if(!value)throw Error(message);};
function database(initial=50000) {
  let data={balance:initial,logs:{},ledger:[],payments:{}};
  let queue=Promise.resolve();
  const tx={
    academy:{updateMany:async({where,data:patch})=>{
      if(where.kakaoBalance && data.balance<where.kakaoBalance.gte)return {count:0};
      data.balance+=patch.kakaoBalance.increment;return {count:1};
    }},
    kakaoLedger:{create:async({data:row})=>{assert.ok(!data.ledger.some(x=>x.id===row.id));data.ledger.push(row);}},
    aligoDispatchLog:{
      findUnique:async({where})=>data.logs[where.id],
      create:async({data:row})=>{assert.ok(!data.logs[row.id]);return data.logs[row.id]={...row,refundedAt:null};},
      updateMany:async({where,data:patch})=>{const row=data.logs[where.id];if(!row||!where.status.in.includes(row.status))return {count:0};Object.assign(row,patch);return {count:1};},
      update:async({where,data:patch})=>Object.assign(data.logs[where.id],patch)
    },
    payment:{
      findUnique:async({where})=>structuredClone(where.id?data.payments[where.id]:Object.values(data.payments).find(p=>p.payCode===where.payCode)),
      create:async({data:p})=>data.payments[p.id]={...p,revision:1,deletedAt:null},
      updateMany:async({where,data:patch})=>{const p=data.payments[where.id];if(!p||p.revision!==where.revision||p.deletedAt)return {count:0};Object.assign(p,{...patch,revision:p.revision+1});return {count:1};}
    }
  };
  return {get data(){return data;},...tx,classGroup:{findUnique:async()=>({name:'독서반'})},$transaction:fn=>{
    const result=queue.then(async()=>{const before=structuredClone(data);try{return await fn(tx);}catch(e){data=before;throw e;}});
    queue=result.catch(()=>{});return result;
  }};
}
function wallet(db){return load('lib/kakao-wallet.ts',{'./prisma':{prisma:db},'./portal-http':{need},'./billing-policy':policy,undici:{ProxyAgent:class{}}});}
const member={id:'student',name:'학생',classGroupId:'class'};
const dispatch=id=>({id,academyId:'academy',recipientName:'보호자',recipientPhone:'01011112222',templateCode:'TT',message:'리포트'});

test('5,500원은 공급가 5,000원 적립, 588건 후 2원 잔액 이월',()=>{
  const amount=policy.paymentAmounts(5500,'KAKAO');
  assert.equal(amount.credit,50000);assert.equal(amount.vat,500);
  assert.equal(amount.credit-588*policy.KAKAO_UNIT,20);
  assert.throws(()=>policy.paymentAmounts(5501,'KAKAO'));
});
test('동일 발송 동시 요청은 한 번만 차감',async()=>{
  const db=database(),w=wallet(db);
  const results=await Promise.all([w.reserveDispatch(dispatch('one'),member,{}),w.reserveDispatch(dispatch('one'),member,{})]);
  assert.equal(results.filter(x=>!x.duplicate).length,1);assert.equal(db.data.balance,49915);assert.equal(db.data.ledger.length,1);
});
test('잔액 1건으로 서로 다른 2건 동시 발송 시 한 건만 예약',async()=>{
  const db=database(85),w=wallet(db);
  const results=await Promise.allSettled([w.reserveDispatch(dispatch('a'),member,{}),w.reserveDispatch(dispatch('b'),member,{})]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(db.data.balance,0);assert.equal(Object.keys(db.data.logs).length,1);
});
test('최종 실패의 반복 수신은 1회만 환급',async()=>{
  const db=database(),w=wallet(db);await w.reserveDispatch(dispatch('one'),member,{});
  await Promise.all([w.settleDispatch('one','FAILED'),w.settleDispatch('one','FAILED')]);
  assert.equal(db.data.balance,50000);assert.equal(db.data.ledger.filter(x=>x.kind==='REFUND').length,1);
});
test('문자 대체 및 결과 불명은 환급하지 않는다',async()=>{
  for(const status of ['SMS_FALLBACK','UNKNOWN']){
    const db=database(),w=wallet(db);await w.reserveDispatch(dispatch('one'),member,{});await w.settleDispatch('one',status);
    assert.equal(db.data.balance,49915);
  }
  assert.equal(policy.deliveryOutcome({msgid:'1',smid:'123',rslt:'U'}),'SMS_FALLBACK');
  assert.equal(policy.deliveryOutcome({msgid:'Q1',rsltdate:'date',rslt:'U',rslt_message:'불일치'}),null);
  assert.equal(policy.deliveryOutcome({msgid:'1',smid:'0',rsltdate:'date',rslt:'U',rslt_message:'메시지가 템플릿과 일치하지않음'}),'FAILED');
});
function billing(db,role='MASTER'){
  const w=wallet(db);
  return load('api/billing.ts',{'../lib/prisma':{prisma:db},'../lib/portal-http':{need,authenticate:async()=>({role,academyId:'academy'}),staff:()=>{},master:user=>need(user.role==='MASTER','권한'),academyScope:async()=> 'academy',text:v=>String(v||''),failure:(res,e)=>res.status(400).json({error:e.message})},'../lib/billing-policy':policy,'../lib/kakao-wallet':w,'../lib/payment-view':{},'../lib/dispatch-view':{}}).default;
}
async function request(handler,body){const res={code:200,setHeader(){},status(n){this.code=n;return this;},json(value){this.body=value;return this;}};await handler({method:'POST',body},res);return res;}
const pay={operation:'save',requestId:'12345678-1234-1234-1234-123456789012',academyId:'A',productCode:'KAKAO',amount:5500,method:'TRANSFER',status:'PAID'};
test('동일 수동 결제 요청은 한 번 적립하고 중복 확인에도 적립하지 않는다',async()=>{
  const db=database(0),run=billing(db);
  const first=await request(run,pay);assert.equal(first.code,200);
  await request(run,pay);assert.equal(db.data.balance,50000);
  await request(run,{...pay,id:first.body.id,revision:1});assert.equal(db.data.balance,50000);
});
test('사용한 충전액으로 결제 취소 시 음수 잔액 없이 전체 롤백',async()=>{
  const db=database(0),run=billing(db),w=wallet(db);
  const first=await request(run,pay);await w.reserveDispatch(dispatch('one'),member,{});
  const result=await request(run,{...pay,id:first.body.id,revision:1,operation:'delete'});
  assert.equal(result.code,400);assert.equal(db.data.balance,49915);assert.equal(db.data.payments[first.body.id].status,'PAID');
});
test('학원 구매 신청은 대기 상태로만 저장하고 입금 확인 전 적립하지 않는다',async()=>{
  const db=database(0),run=billing(db,'DIRECTOR');
  const result=await request(run,{...pay,operation:'topup'});
  assert.equal(result.code,200);assert.equal(result.body.status,'PENDING');assert.equal(db.data.balance,0);
  const denied=await request(run,pay);assert.equal(denied.code,400);
});
