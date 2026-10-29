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
  let pointPages = new Map(), pointGeneration = 0, pointMonths = [], monthEarned = 0;
  function pointView(p) {
    const korea = new Date(+new Date(p.createdAt) + 9 * 3600000).toISOString();
    const thought = /^THOUGHT_/.test(p.pointType || '');
    return { datetime: korea.slice(0,16).replace('T',' '), month: korea.slice(0,7), point: p.amount,
      bookTitle: p.content || '포인트 내역', activity: thought ? '생각담기 적립' : /^QUIZ_PASS_/.test(p.pointType || '') ? '북퀴즈 인증 적립' : '포인트 변동',
      type: thought ? 'thought' : 'quiz', typeName: thought ? '생각담기' : '포인트' };
  }
  function acceptPointSummary(summary) {
    pointGeneration++;
    pointPages = new Map([['all', { items: summary.pointLogs || [], cursor: summary.pointNextCursor || null, loaded: true, visible: 10 }]]);
    pointMonths = summary.pointMonths || []; monthEarned = summary.currentMonthPoints || 0;
    if (curPointMonthFilter !== 'all' && !pointMonths.includes(curPointMonthFilter)) curPointMonthFilter = 'all';
    const chips = document.getElementById('pointMonthFilterChips');
    if (chips) {
      chips.replaceChildren();
      for (const month of ['all', ...pointMonths]) {
        const b = document.createElement('button'); b.type = 'button';
        b.className = 'point-month-chip' + (month === curPointMonthFilter ? ' active' : '');
        b.textContent = month === 'all' ? '전체 내역' : month;
        b.onclick = () => window.filterPointHistory(month, b); chips.append(b);
      }
    }
    isPointLoading = false;
    return renderRemotePoints(false);
  }
  async function renderRemotePoints(more) {
    const month = curPointMonthFilter, generation = pointGeneration;
    let page = pointPages.get(month);
    if (!page) { page = { items: [], cursor: null, loaded: false, visible: 10 }; pointPages.set(month, page); }
    if (page.loading) return;
    const desired = more ? page.visible + 10 : page.visible;
    const list = document.getElementById('pointLogList'), loader = document.getElementById('pointLogLoadingIndicator');
    const end = document.getElementById('pointLogEndMessage'), earned = document.getElementById('currentMonthEarnedPoints');
    if (earned) earned.textContent = (monthEarned >= 0 ? '+' : '') + monthEarned.toLocaleString() + ' P';
    if (!page.loaded || (desired > page.items.length && page.cursor)) {
      page.loading = true; isPointLoading = true;
      if (loader) loader.style.display = 'block';
      if (end) end.style.display = 'none';
      if (!page.loaded && list) list.textContent = '포인트 내역을 불러오고 있어요…';
      try {
        const query = new URLSearchParams({ action: 'points' });
        if (month !== 'all') query.set('month', month);
        if (page.cursor) query.set('cursor', page.cursor);
        const result = await NanoPortal.api('/api/activity?' + query);
        if (generation !== pointGeneration || month !== curPointMonthFilter) return;
        const seen = new Set(page.items.map(p => p.id));
        page.items.push(...result.items.filter(p => !seen.has(p.id)));
        page.cursor = result.nextCursor; page.loaded = true;
      } catch (e) {
        if (generation === pointGeneration && month === curPointMonthFilter) {
          notice(e.message);
          if (list && !page.loaded) { list.replaceChildren(); const retry = document.createElement('button'); retry.textContent = '포인트 조회 다시 시도'; retry.onclick = () => renderRemotePoints(false); list.append(retry); }
        }
        return;
      } finally {
        page.loading = false;
        if (generation === pointGeneration && month === curPointMonthFilter) { isPointLoading = false; if (loader) loader.style.display = 'none'; }
      }
    }
    page.visible = desired;
    studentPointLogs = page.items.map(pointView);
    hasMorePointLogs = page.items.length > desired || !!page.cursor;
    if (list) list.innerHTML = studentPointLogs.slice(0, desired).map(createPointLogItemHtml).join('') || '<p>포인트 내역이 없습니다.</p>';
    if (end) end.style.display = hasMorePointLogs ? 'none' : 'block';
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
  window.addEventListener('nano:ready',async()=>{
    if(!NanoPortal.remote||started)return;started=true;
    const user=NanoPortal.user();if(!user||user.role==='master')return;
    // 상단 '학습 기록 · 첨삭 파일' 툴바 UI는 사용자 요청으로 삭제됨
    if(user.role==='student'){
      // 기존의 성공 안내를 먼저 띄우는 로컬 토글 대신 저장 후 화면에 반영합니다.
      window.toggleWish=(id,event)=>{event?.preventDefault();event?.stopPropagation();return changePreference('wishlist',id);};
      window.toggleInterestTag=tag=>changePreference('interests',tag);
      window.renderPointHistory = () => renderRemotePoints(false);
      window.loadMorePointLogs = () => renderRemotePoints(true);
      window.filterPointHistory = (month, button) => {
        curPointMonthFilter = month; isPointLoading = false;
        document.querySelectorAll('.point-month-chip').forEach(b => b.classList.toggle('active', b === button));
        return renderRemotePoints(false);
      };
      // 월 합계는 전체 기준 서버 집계, 내역은 필요한 페이지까지만 조회합니다.
      window.addEventListener('nano:activity',()=>{const summary=NanoPortal.activity();if(summary)acceptPointSummary(summary);});
      NanoPortal.api('/api/activity?action=character').then(async data => {
        // 기존 기기에서 선택한 친구는 서버 검증을 거쳐 한 번만 이전합니다.
        let local = null;
        try { local = localStorage.getItem('NANO_STUDENT_AVATAR_ID' + getStudentStoragePrefix()); } catch(e) { /* 기기 저장소가 차단되어도 서버 설정은 사용합니다. */ }
        if (data.hasSelection === false && local && local !== 'nano' && Object.prototype.hasOwnProperty.call(NanoReading.rules, local)) {
          try { data = await NanoPortal.api('/api/activity?action=character', { characterId: local }); } catch(e) { notice('기존 캐릭터 확인: ' + e.message); }
        }
        window.nanoServerCharacterId = data.characterId; updateAllCharacterAvatars();
      }).catch(e => notice('캐릭터 조회 실패: ' + e.message));
      try{const data=await NanoPortal.api('/api/activity?action=preferences');preferences=data.value;revision=data.revision;applyPreferences();const summary=NanoPortal.activity();if(summary)acceptPointSummary(summary);}
      catch(e){notice('개인 기록 조회 실패: '+e.message);}
    }
  });
})();
