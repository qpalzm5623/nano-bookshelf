// 운영 화면의 학습 내역·개인 설정은 인증된 서버 API만 사용합니다.
(function () {
  'use strict';
  let started = false;
  let preferences = { wishlist: [], interests: [] }, revision = 0, saving = false;
  const notice = message => typeof toast === 'function' ? toast(message) : typeof showAcademyToast === 'function' ? showAcademyToast(message) : alert(message);
  function download(name, data) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function applyPreferences() {
    studentWishlist = preferences.wishlist.slice(); userInterestTags = preferences.interests.slice();
    renderWishList(); renderInterestTags(); renderInterestRecommendations();
    if(typeof currentDetailBookId !== 'undefined' && currentDetailBookId) updateDetailWishUI(currentDetailBookId);
  }
  async function changePreference(kind, value) {
    if(saving) return; saving=true;
    const next = {wishlist:preferences.wishlist.slice(),interests:preferences.interests.slice()};
    const index=next[kind].indexOf(String(value));
    if(index<0) { next[kind].push(String(value)); if(kind==='interests'&&next[kind].length>3)next[kind].shift(); }
    else next[kind].splice(index,1);
    try { const result=await NanoPortal.api('/api/activity?action=preferences',{value:next,revision}); preferences=next;revision=result.revision;applyPreferences();notice('서버에 저장했습니다.'); }
    catch(e) { notice(e.message); } finally { saving=false; }
  }
  async function points() {
    const all=[];let cursor='';
    do { const result=await NanoPortal.api('/api/activity?action=points'+(cursor?'&cursor='+encodeURIComponent(cursor):''));all.push(...result.items);cursor=result.nextCursor; } while(cursor);
    studentPointLogs=all.map(p=>{const korea=new Date(+new Date(p.createdAt)+9*3600000).toISOString();return {datetime:korea.slice(0,16).replace('T',' '),month:korea.slice(0,7),point:p.amount,bookTitle:p.content||'포인트 내역',activity:p.pointType||'적립',type:'quiz',typeName:p.pointType==='THOUGHT_FIRST'?'생각담기':'포인트'};});
    const chips=document.getElementById('pointMonthFilterChips');
    if(chips){chips.replaceChildren();for(const month of ['all',...new Set(studentPointLogs.map(p=>p.month))]){const b=document.createElement('button');b.type='button';b.className='point-month-chip'+(month==='all'?' active':'');b.textContent=month==='all'?'전체 내역':month;b.onclick=()=>filterPointHistory(month,b);chips.append(b);}}
    curPointMonthFilter='all';renderPointHistory(true);
  }
  async function showHistory() {
    try {
      await NanoPortal.refreshLearning();
      const dialog=document.createElement('dialog');dialog.style.cssText='width:min(850px,92vw);max-height:85vh;border:1px solid #ccd9d1;border-radius:16px;padding:24px';
      const heading=document.createElement('h2');heading.textContent='학습·첨삭 내역';dialog.append(heading);
      const search=document.createElement('input');search.type='search';search.placeholder='도서·학생 검색';search.setAttribute('aria-label','학습 기록 검색');search.style.cssText='width:100%;padding:12px;margin:12px 0';dialog.append(search);
      const list=document.createElement('div');dialog.append(list);
      const logs=NanoPortal.logs()||[];
      function render(){list.replaceChildren();const filtered=logs.filter(l=>(l.bookTitle+' '+l.studentName).includes(search.value.trim()));
        if(!filtered.length)list.textContent='학습 기록이 없습니다.';
        for(const log of filtered){const row=document.createElement('article');row.style.cssText='padding:16px 0;border-bottom:1px solid #ddd';
          const title=document.createElement('h3');title.textContent=log.bookTitle+' · '+log.studentName;row.append(title);
          const detail=document.createElement('p');detail.textContent=log.date+' · '+log.score+'점 · '+log.reviewed;row.append(detail);
          const comment=document.createElement('p');comment.style.whiteSpace='pre-wrap';comment.textContent=log.comment||'아직 첨삭 의견이 없습니다.';row.append(comment);
          for(const file of log.files||[]){const a=document.createElement('a');a.href='/api/files?id='+encodeURIComponent(file.id);a.textContent='첨부: '+file.name;a.style.cssText='display:block;padding:8px 0';row.append(a);}list.append(row);
        }}
      search.oninput=render;render();const close=document.createElement('button');close.textContent='닫기';close.style.cssText='padding:12px 20px;margin-top:16px';close.onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.append(close);document.body.append(dialog);dialog.showModal();search.focus();
    }catch(e){notice(e.message);}
  }
  async function importLocal() {
    const user=NanoPortal.user();
    try {
      const logs=NanoLearningStore.read(user.academyId,[]).filter(l=>String(l.studentId)===user.id);
      if(!logs.length){notice('이 브라우저에 이관할 본인 학습 기록이 없습니다.');return;}
      download('nano-local-learning-backup.json',logs);
      if(!confirm(logs.length+'건의 로컬 기록을 서버 문항으로 다시 채점하여 이관합니다. 기존 기록은 보존하고 이관 건에는 포인트를 새로 지급하지 않습니다. 계속하시겠습니까?'))return;
      let count=0;const failures=[];
      for(const log of logs){try{await NanoPortal.request('learning',{id:log.id,studentId:user.id,bookId:String(log.bookId),thoughtAnswer:log.thoughtAnswer||log.studentThoughtAnswer||'',quizResults:log.quizResults||[],importing:true,sourceDate:log.submittedAt||log.date});count++;}catch(e){failures.push({id:log.id,bookTitle:log.bookTitle,error:e.message});}}
      await Promise.all([NanoPortal.refreshLearning(),NanoPortal.refreshActivity()]);refreshStudentLearningData();
      notice(count+'건 처리 · '+failures.length+'건 확인 필요. 로컬 원본은 유지했습니다.');if(failures.length)download('nano-import-errors.json',failures);
    }catch(e){notice(e.message);}
  }
  window.addEventListener('nano:ready',async()=>{
    if(!NanoPortal.remote||started)return;started=true;
    const user=NanoPortal.user();if(!user||user.role==='master')return;
    const bar=document.createElement('details');bar.className='nano-learning-tools';
    const summary=document.createElement('summary');summary.textContent='학습 기록 · 첨삭 파일';bar.append(summary);
    const actions=document.createElement('div');actions.className='nano-tool-actions';bar.append(actions);
    function button(label,run){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await run();}finally{b.disabled=false;}};actions.append(b);}
    button('학습·첨삭 파일 보기',showHistory);
    button(user.role==='student'?'내 학습 기록 내보내기':'학원 학습 기록 내보내기',async()=>{await NanoPortal.refreshLearning();download('nano-learning.json',NanoPortal.logs());});
    if(user.role==='student'){
      button('이 기기의 이전 기록 이관',importLocal);
      // 기존의 성공 안내를 먼저 띄우는 로컬 토글 대신 저장 후 화면에 반영합니다.
      window.toggleWish=(id,event)=>{event?.preventDefault();event?.stopPropagation();return changePreference('wishlist',id);};
      window.toggleInterestTag=tag=>changePreference('interests',tag);
      try{const data=await NanoPortal.api('/api/activity?action=preferences');preferences=data.value;revision=data.revision;applyPreferences();await points();}
      catch(e){notice('개인 기록 조회 실패: '+e.message);}
      window.addEventListener('nano:activity',()=>points().catch(e=>notice(e.message)));
    }
    const host=document.querySelector('.main-workspace');
    if(host) { const note=host.querySelector('.nano-storage-notice'); if(note)note.after(bar);else host.prepend(bar); }
    else { const header=document.querySelector('header');if(header)header.after(bar);else document.body.prepend(bar); }
  });
})();
