// 본사와 학원이 동일한 서버 저장·검증 화면을 사용합니다.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = { rankings:'월별 랭킹',owned:'보유 도서',portfolios:'포트폴리오',members:'회원',classes:'학급',assignments:'도서 배정',academies:'가맹 학원',books:'도서',quizzes:'북퀴즈',banners:'배너',themes:'테마',notices:'공지',payments:'입금 내역',dispatch:'알림톡 내역',services:'서비스 연결' };
  // [필드명, 표시명, 입력 종류, 필수 여부 또는 선택 항목]
  const schemas = {
    owned:[['bookId','보유 도서','books',true]],
    portfolios:[['memberId','학생','members',true],['from','학습 시작일','date',true],['to','학습 종료일','date',true],['comment','교사 총평','textarea']],
    members:[['name','이름','text',true],['username','아이디','text',true],['password','비밀번호 (수정 시 빈칸이면 유지)','password'],['role','권한','select','STUDENT:학생|TEACHER:교사|DIRECTOR:원장'],['status','상태','select','PENDING:미승인|APPROVED:승인|SUSPENDED:정지|WITHDRAWN:퇴원'],['classGroupId','학급','classes'],['grade','학년'],['school','학교'],['gender','성별','select',':미등록|남:남|여:여'],['phone','본인 연락처'],['parentName','보호자 성함'],['parentPhone','보호자 연락처'],['parentEmail','보호자 이메일','email'],['reportYn','학부모 리포트 발송 동의','checkbox']],
    classes:[['name','학급명','text',true],['targetGrade','대상 학년']],
    assignments:[['bookId','배정 도서','books',true],['memberId','개별 학생 (학급 선택 시 학급 우선)','members'],['classGroupId','학급 전체 배정','classes']],
    academies:[['code','학원 코드','text',true],['name','학원명','text',true],['directorName','원장 성함','text',true],['phone','연락처'],['address','주소'],['maxStudents','원생 정원','number',true],['monthlyFee','월 이용료','number'],['plan','요금제','select','BASIC|STANDARD|PREMIUM|VIP|ROYAL'],['status','상태','select','ACTIVE:운영|SUSPENDED:중지|TERMINATED:계약종료'],['startDate','계약 시작일','date',true],['endDate','계약 종료일','date',true]],
    books:[['bookNo','도서 코드','text',true],['title','도서명','text',true],['author','저자','text',true],['publisher','출판사'],['isbn','ISBN'],['grade','권장 학년'],['category','분류'],['description','소개','textarea'],['thinkQuiz','생각담기 질문','textarea'],['tags','태그 (쉼표 구분)'],['series','시리즈'],['coverUrl','표지 HTTPS 주소','url'],['worksheetUrl','학습지 HTTPS 주소','url'],['themeId','테마','themes'],['isRecommended','추천 도서','checkbox']],
    quizzes:[['bookId','도서','books',true],['questionNo','문항 번호','number',true],['question','문제','textarea',true],['options','보기 (한 줄에 하나씩, 2~5개)','textarea',true],['correctAnswer','정답 보기 번호 (1부터)','number',true]],
    banners:[['title','배너명','text',true],['imageUrl','이미지 HTTPS 주소','url'],['linkUrl','연결 HTTPS 주소','url'],['orderNo','노출 순서','number'],['isActive','노출','checkbox']],
    themes:[['code','테마 코드','text',true],['name','테마명','text',true],['description','설명','textarea']],
    notices:[['title','제목','text',true],['content','내용','textarea',true],['targetRole','대상','select',':전체|STUDENT:학생|TEACHER:교사|DIRECTOR:원장'],['isPinned','상단 고정','checkbox']],
    payments:[['amount','확인한 실제 입금액','number',true],['paidAt','입금 확인일','date',true],['plan','요금제','select','BASIC|STANDARD|PREMIUM|VIP|ROYAL'],['slotCount','계약 정원','number',true]]
  };
  let entity = new URLSearchParams(location.search).get('section') || 'members';
  let user, items = [], editing = {}, busy = false, lookups = {};
  $('editor').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  function status(message, error = false) { $('status').textContent = message; $('status').className = error ? 'error' : ''; }
  async function api(url, body) {
    const response = await fetch(url, { credentials:'same-origin',cache:'no-store',method:body === undefined ? 'GET':'POST',headers:{'Content-Type':'application/json'},body:body === undefined ? undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000) });
    let result; try { result = await response.json(); } catch { throw new Error('서버에 연결할 수 없습니다.'); }
    if (!response.ok) throw new Error(result.error || '요청을 처리하지 못했습니다.');
    return result;
  }
  function url(target = entity) { return '/api/manage?entity=' + encodeURIComponent(target) + '&academy=' + encodeURIComponent($('academy').value) + '&period=' + $('rankPeriod').value + (target === 'quizzes' ? '&bookId=' + encodeURIComponent($('bookFilter').value) : ''); }
  function canEdit() { return !!schemas[entity] && (user.role === 'master' || (user.role === 'admin' && ['members','classes','assignments','owned','portfolios'].includes(entity)) || (user.role === 'teacher' && ['assignments','owned','portfolios'].includes(entity))); }
  function option(value, name) { const item = document.createElement('option'); item.value = value; item.textContent = name; return item; }
  async function loadLookups() {
    const selectedBook = $('bookFilter').value;
    for (const type of ['members','classes','books','themes']) lookups[type] = (await api(url(type))).items;
    $('bookFilter').replaceChildren(...lookups.books.map(b => option(b.id,b.title)));
    if (lookups.books.some(b => b.id === selectedBook)) $('bookFilter').value = selectedBook;
  }
  async function load() {
    if (busy) return; busy = true; $('refresh').disabled = true; status('불러오는 중…');
    $('title').textContent = labels[entity] || '운영 관리';
    $('addButton').hidden = !canEdit(); $('importButton').hidden = entity !== 'members' || !canEdit();
    $('rankPeriodLabel').hidden = entity !== 'rankings'; $('bookLabel').hidden = entity !== 'quizzes'; $('exportButton').hidden = entity === 'services'; $('services').hidden = entity !== 'services';
    document.querySelectorAll('#menu button').forEach(b => b.classList.toggle('active',b.dataset.entity === entity));
    try {
      if(entity === 'services') {
        const config = await api('/api/services'); $('services').replaceChildren();
        const p = document.createElement('p'); p.textContent = config.aligoReady ? '알림톡: 연결됨. 리포트 화면에서 수신자와 내용을 확인한 후 발송하세요.' : '알림톡: 비활성. 운영 설정 필요: ' + (config.missing.join(', ') || 'ALIGO_ENABLED=true'); $('services').append(p);
        const payment = document.createElement('p'); payment.textContent = config.paymentUrl ? '결제 안내 페이지가 연결되어 있습니다. 결제 후 입금·승인 결과를 확인해 주세요.' : '결제 서비스: 미연결. 결제 업체 계약 후 PAYMENT_PORTAL_URL을 설정하세요. 본사는 확인한 입금만 별도로 기록할 수 있습니다.'; $('services').append(payment);
        if(config.paymentUrl){const link=document.createElement('a');link.href=config.paymentUrl;link.target='_blank';link.rel='noopener';link.textContent='결제 서비스 열기';$('services').append(link);}
        items=[];
      } else items = (await api(url())).items;
      render(); status('서버의 최신 목록입니다.');
    } catch(e) { status(e.message,true); } finally { busy=false;$('refresh').disabled=false; }
  }
  function render() {
    const query=$('search').value.toLowerCase().trim(); const rows=items.filter(item=>JSON.stringify(item).toLowerCase().includes(query)); $('rows').replaceChildren();
    for(const item of rows){const tr=document.createElement('tr'); const name=document.createElement('td');
      name.textContent=item.title||item.name||item.book?.title||item.recipientName||item.payCode||item.question||item.id;
      const detail=document.createElement('td'); detail.textContent=[item.rank?item.rank+'위':'',item.points!=null?Number(item.points).toLocaleString()+'P':'',item.username,item.role,item.status,item.className,item.member?.name,item.code,item.bookNo,item.grade,item.phone,item.amount != null ? Number(item.amount).toLocaleString()+'원':'',item.createdAt?.slice(0,10)].filter(Boolean).join(' · ');
      const actions=document.createElement('td');
      if(canEdit()&&!(entity==='members'&&(item.role==='MASTER'||(user.role!=='master'&&item.role==='DIRECTOR')))&&!['assignments','owned','payments'].includes(entity)){const edit=document.createElement('button');edit.textContent='수정';edit.onclick=()=>openEditor(item);actions.append(edit);}
      if(canEdit()&&!(entity==='members'&&(item.role==='MASTER'||(user.role!=='master'&&item.role==='DIRECTOR')))&&entity!=='payments'){const remove=document.createElement('button');remove.textContent=entity==='members'?'퇴원 처리':'삭제';remove.onclick=()=>removeItem(item);actions.append(remove);}
      if(entity==='books'&&user.role==='master'){const quiz=document.createElement('button');quiz.textContent='문항 관리';quiz.onclick=()=>{entity='quizzes';$('bookFilter').value=item.id;load();};actions.append(quiz);}
      if(entity==='portfolios'){const view=document.createElement('button');view.textContent='리포트 보기 / 인쇄';view.onclick=()=>{
        const report=document.createElement('dialog');const heading=document.createElement('h2');heading.textContent=item.title;report.append(heading);
        const text=document.createElement('p');text.textContent=item.from+' ~ '+item.to+' · 학습 '+item.books.length+'회 · 완독 '+new Set(item.books.map(b=>b.bookId)).size+'권';report.append(text);
        for(const book of item.books){const row=document.createElement('p');row.textContent=book.date+' · '+book.title+' · '+book.score+'점';report.append(row);}
        const comment=document.createElement('p');comment.textContent=item.comment;comment.style.whiteSpace='pre-wrap';report.append(comment);
        const print=document.createElement('button');print.textContent='인쇄 / PDF';print.onclick=()=>window.print();const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>{report.close();report.remove();};report.append(print,close);document.body.append(report);report.showModal();};actions.append(view);}
      tr.append(name,detail,actions);$('rows').append(tr);
    }
    if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.textContent=query?'검색 결과가 없습니다.':'등록된 항목이 없습니다.';tr.append(td);$('rows').append(tr);}
    $('count').textContent=rows.length+'건'+(entity==='books'?' · 도서는 최대 1,000건 표시':'');
  }
  async function openEditor(item = {}) {
    if(busy)return;
    editing=Object.assign({requestId:crypto.randomUUID()},item);$('fields').replaceChildren();$('formError').textContent='';$('editorTitle').textContent=labels[entity]+' '+(item.id?'수정':'등록');
    for(const [key,title,type='text',rule] of schemas[entity]){
      const label=document.createElement('label');label.textContent=title;if(type==='textarea')label.className='wide';
      const input=document.createElement(type==='textarea'?'textarea':type==='select'||lookups[type]?'select':'input');input.name=key;input.id='field-'+key;
      if(type==='select')for(const entry of rule.split('|')){const [value,name]=entry.split(':');if(key==='role'&&user.role!=='master'&&value==='DIRECTOR')continue;input.append(option(value,name||value));}
      else if(lookups[type]){input.append(option('','선택하지 않음'));for(const row of lookups[type]){if(type==='members'&&row.role!=='STUDENT')continue;input.append(option(row.id,row.title||row.name));}}
      else if(input.tagName==='INPUT') input.type=type;
      if(type==='checkbox')input.checked=item[key]===true; else input.value=Array.isArray(item[key])?item[key].join('\n'):type==='date'?String(item[key]||'').slice(0,10):item[key]??(key==='bookId'?$('bookFilter').value:type==='select'?input.options[0]?.value||'':'');
      if(rule===true)input.required=true;if(type==='password'){input.value='';input.minLength=12;input.maxLength=128;input.autocomplete='new-password';input.required=!item.id;}
      if(type==='number'){input.min=0;input.step=1;}label.append(input);$('fields').append(label);
    }
    $('editor').showModal();$('fields').querySelector('input,select,textarea')?.focus();
  }
  async function save(event){event.preventDefault();if(busy)return;busy=true;$('save').disabled=true;$('formError').textContent='';
    const data={id:editing.id,updatedAt:editing.updatedAt,revision:editing.revision,requestId:editing.requestId};for(const [key,,type] of schemas[entity]){const input=$('field-'+key);data[key]=type==='checkbox'?input.checked:type==='number'?Number(input.value):key==='options'?input.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):input.value;}
    try{await api(url(),{operation:'save',data});$('editor').close();busy=false;await load();status('서버에 저장했습니다.');if(['members','classes','books'].includes(entity))await loadLookups();}
    catch(e){$('formError').textContent=e.message;}finally{busy=false;$('save').disabled=false;}
  }
  async function removeItem(item){if(busy||!confirm((item.name||item.title||'선택 항목')+'을(를) '+(entity==='members'?'퇴원 처리':'삭제')+'하시겠습니까?'))return;busy=true;try{await api(url(),{operation:'delete',data:{id:item.id}});busy=false;await load();}catch(e){status(e.message,true);}finally{busy=false;}}
  function exportRows(){const keys=Object.keys(items[0]||{}).filter(key=>!['password'].includes(key));const csv='\uFEFF'+[keys,...items.map(item=>keys.map(key=>typeof item[key]==='object'?JSON.stringify(item[key]):item[key]))].map(row=>row.map(NanoPreviewData.csvCell).join(',')).join('\r\n');const link=document.createElement('a');const blob=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.href=blob;link.download=entity+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(blob),1000);}
  async function importCSV(file){if(!file)return;try{if(file.size>2*1024*1024)throw new Error('CSV는 2MB 이하로 나눠 등록해 주세요.');const rows=NanoPreviewData.parseCSV(await file.text());const expected=['이름','아이디','비밀번호','학년','학급','학생연락처','학부모연락처','등록학원코드(예:ACAD-001)'];if(expected.some((name,index)=>rows[0]?.[index]!==name))throw new Error('기존 표준 CSV 양식의 열 순서를 사용해 주세요.');
      const data=rows.slice(1).map((row,index)=>{if(row.length!==8||row[7]!==$('academy').value)throw new Error((index+2)+'행의 학원 코드와 열 개수를 확인해 주세요.');const cls=lookups.classes.find(c=>c.name===row[4]);if(row[4]&&!cls)throw new Error((index+2)+'행의 학급을 먼저 등록해 주세요.');return {name:row[0],username:row[1],password:row[2],grade:row[3],classGroupId:cls?.id||null,phone:row[5],parentPhone:row[6],role:'STUDENT',status:'PENDING',reportYn:false};});
      if(!data.length||data.length>200)throw new Error('1~200명의 행을 입력해 주세요.');if(!confirm($('academy').selectedOptions[0].textContent+'에 '+data.length+'명을 미승인 상태로 등록합니다.\n'+data.slice(0,10).map(m=>m.name+' ('+m.username+')').join('\n')+'\n계속하시겠습니까?'))return;
      await api(url('members'),{operation:'import',rows:data});await loadLookups();await load();status(data.length+'명의 서버 계정을 등록했습니다.');
    }catch(e){status(e.message,true);}finally{$('csvFile').value='';}}
  async function start(){try{user=(await api('/api/portal?action=session')).user;if(!['master','admin','teacher'].includes(user.role))throw new Error('관리자 로그인이 필요합니다.');$('account').textContent=user.name;$('backLink').href=user.role==='master'?'master_preview.html':'admin_preview.html';
      const allowed=user.role==='master'?Object.keys(labels):['members','classes','assignments','owned','portfolios','books','payments','notices','dispatch','rankings','services'];if(!allowed.includes(entity))entity='members';
      for(const name of allowed){const button=document.createElement('button');button.dataset.entity=name;button.textContent=labels[name];button.onclick=()=>{if(!busy){entity=name;$('search').value='';load();}};$('menu').append(button);}
      if(user.role==='master'){const data=await api('/api/manage?entity=academies');for(const a of data.items)$('academy').append(option(a.code,a.name));$('academy').value=new URLSearchParams(location.search).get('academy')||user.academyId;}else{$('academy').append(option(user.academyId,user.academyName));$('academy').disabled=true;}
      await loadLookups();await load();
    }catch(e){status(e.message,true);$('addButton').hidden=true;}}
  $('editForm').onsubmit=save;$('cancel').onclick=()=>{if(!busy)$('editor').close();};$('addButton').onclick=()=>openEditor();$('refresh').onclick=load;$('search').oninput=render;
  $('academy').onchange=async()=>{if(busy)return;try{await loadLookups();await load();}catch(e){status(e.message,true);}};$('bookFilter').onchange=load;$('rankPeriod').onchange=load;$('exportButton').onclick=exportRows;$('importButton').onclick=()=>$('csvFile').click();$('csvFile').onchange=()=>importCSV($('csvFile').files[0]);start();
})();
