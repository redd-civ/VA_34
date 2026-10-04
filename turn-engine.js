(() => {
  const TURN_KEY = 'va34_turn_v1';
  const CABINET_KEY = 'va34_cabinet_v1';

  const defaultTurn = () => ({ number: 1, status: 'draft', actions: [], submittedAt: null });
  let cloudReady = false;
  let loadingCloud = false;

  function loadTurn(){
    try {
      const x = JSON.parse(localStorage.getItem(TURN_KEY) || 'null');
      return x && Array.isArray(x.actions) ? x : defaultTurn();
    } catch(e){ return defaultTurn(); }
  }
  function localSave(turn){
    localStorage.setItem(TURN_KEY, JSON.stringify(turn));
    render();
  }
  async function saveTurn(turn){
    localStorage.setItem(TURN_KEY, JSON.stringify(turn));
    render();
    if (cloudReady && window.VA34_CLOUD) {
      try {
        const result = await window.VA34_CLOUD.saveTurn(turn);
        if (result && result.turn) localStorage.setItem(TURN_KEY, JSON.stringify(result.turn));
        render();
      } catch(e) {
        console.error('VA-34 turn cloud save:', e);
        showCloudError(e);
      }
    }
  }
  function loadCabinet(){
    try { return JSON.parse(localStorage.getItem(CABINET_KEY) || '{}'); } catch(e){ return {}; }
  }
  function esc(v=''){
    return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function showCloudError(e){
    const box=document.getElementById('turnCloudStatus');
    if(box) box.textContent='Облако хода: ошибка — '+(e.message||e);
  }

  function validate(turn){
    const cabinet=loadCabinet(), energy=Number(cabinet?.lord?.energy||0);
    const main=turn.actions.filter(a=>a.kind==='main').length;
    const extra=turn.actions.filter(a=>a.kind==='extra').length;
    const total=main+extra, errors=[], warnings=[];
    if(turn.status==='submitted') return {errors,warnings,main,extra,total,energy,spent:turn.actions.reduce((s,a)=>s+Number(a.cost||0),0)};
    if(main>2) errors.push('Основных действий больше 2.');
    if(extra>5) errors.push('Дополнительных действий больше 5.');
    if(total>5) errors.push('Всего действий больше разрешённого максимума.');
    if(total===5&&main>0) errors.push('5 действий разрешены только если все они дополнительные.');
    if(main===2&&extra>2) errors.push('При 2 основных действиях можно выполнить не более 2 дополнительных.');
    if(main===1&&extra>3) errors.push('При 1 основном действии можно выполнить не более 3 дополнительных.');
    let spent=0;
    turn.actions.forEach((a,i)=>{ const cost=Number(a.cost||0); spent+=cost; if(!String(a.title||'').trim()) errors.push('Действие №'+(i+1)+': не указано название.'); if(cost<0) errors.push('Действие №'+(i+1)+': стоимость не может быть отрицательной.'); });
    if(spent>energy) errors.push('Недостаточно энергии: требуется '+spent+', доступно '+energy+'.');
    if(!turn.actions.length) warnings.push('Ход пока пуст.');
    if(turn.actions.length&&spent===0) warnings.push('Все действия имеют стоимость 0. Проверьте стоимость.');
    return {errors,warnings,main,extra,total,spent,energy};
  }

  function actionForm(){
    return '<form id="turnActionForm" class="form-grid"><label>Тип действия<select name="kind"><option value="main">Основное</option><option value="extra">Дополнительное</option></select></label><label>Стоимость энергии<input name="cost" type="number" min="0" step="0.5" value="0"></label><label class="wide">Название действия<input name="title" required placeholder="Например: атака нейтрального осколка"></label><label class="wide">Описание / цель<textarea name="description" rows="4" placeholder="Что именно делает Владыка"></textarea></label><div><button class="primary" type="submit">Добавить действие</button></div></form>';
  }

  async function hydrate(){
    if(loadingCloud||!window.VA34_CLOUD?.configured) return;
    loadingCloud=true;
    try {
      const info=await window.VA34_CLOUD.init();
      if(!info.authenticated) return;
      cloudReady=true;
      const cloudTurn=await window.VA34_CLOUD.getTurn();
      if(cloudTurn) {
        localStorage.setItem(TURN_KEY,JSON.stringify(cloudTurn));
        render();
      } else {
        await window.VA34_CLOUD.saveTurn(loadTurn());
      }
      const status=document.getElementById('turnCloudStatus');
      if(status) status.textContent='Облако хода: синхронизировано';
    } catch(e) { console.error('VA-34 turn cloud load:',e); showCloudError(e); }
    finally { loadingCloud=false; }
  }

  function render(){
    const box=document.getElementById('turnPanel'); if(!box)return;
    const turn=loadTurn(), v=validate(turn);
    box.innerHTML='<div class="hero-panel"><div><span class="badge">'+esc(turn.status==='submitted'?'ХОД ОТПРАВЛЕН':'ЧЕРНОВИК ХОДА')+'</span><h2>Ход №'+esc(turn.number)+'</h2><p>Основных: '+v.main+' · Дополнительных: '+v.extra+' · Энергия: '+v.spent+'/'+v.energy+'</p><div id="turnCloudStatus" class="muted">Облако хода: проверка…</div></div><div class="stats"><div><strong>'+v.total+'</strong><span>действий</span></div><div><strong>'+v.main+'</strong><span>основных</span></div><div><strong>'+v.extra+'</strong><span>дополнительных</span></div><div><strong>'+v.energy+'</strong><span>энергии</span></div></div></div>'+
      (v.errors.length?v.errors.map(x=>'<div class="warning">❌ '+esc(x)+'</div>').join(''):'<div class="ok">✓ Ограничения по структуре хода соблюдены.</div>')+
      (v.warnings.length?v.warnings.map(x=>'<div class="warning">⚠️ '+esc(x)+'</div>').join(''):'')+
      '<div class="section-head"><h2>Действия</h2><div><button id="nextTurnBtn" class="primary" '+(turn.status==='submitted'?'':'style="display:none"')+'>Следующий ход</button></div></div>'+
      (turn.actions.length?'<div class="entity-list">'+turn.actions.map((a,i)=>'<article class="entity"><h3>'+(i+1)+'. '+esc(a.title)+'</h3><div class="meta">'+(a.kind==='main'?'Основное':'Дополнительное')+' · '+Number(a.cost||0)+' энергии</div><p>'+esc(a.description||'')+'</p><div class="entity-actions">'+(turn.status==='draft'?'<button data-remove-turn="'+esc(a.id)+'">Удалить</button>':'')+'</div></article>').join('')+'</div>':'<div class="notice">В этом ходе ещё нет действий.</div>')+
      '<div class="section-head"><h2>Добавить действие</h2><span class="muted">Проверка выполняется до отправки</span></div>'+
      (turn.status==='draft'?actionForm():'<div class="notice">Ход отправлен. После проверки можно начать следующий ход.</div>')+
      '<div class="data-actions"><button id="validateTurnBtn" class="primary">Проверить ход</button><button id="submitTurnBtn" class="primary" '+(v.errors.length||!turn.actions.length||turn.status!=='draft'?'disabled':'')+'>Отправить ход</button><button id="clearTurnBtn" class="danger">Очистить черновик</button></div>';

    const f=document.getElementById('turnActionForm');
    if(f)f.onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(f));turn.actions.push({id:uid(),kind:x.kind,cost:Number(x.cost||0),title:x.title.trim(),description:x.description||''});saveTurn(turn);};
    box.querySelectorAll('[data-remove-turn]').forEach(b=>b.onclick=()=>{turn.actions=turn.actions.filter(a=>a.id!==b.dataset.removeTurn);saveTurn(turn);});
    const submit=document.getElementById('submitTurnBtn');
    if(submit)submit.onclick=async()=>{const check=validate(turn);if(check.errors.length){render();return;}turn.status='submitted';turn.submittedAt=new Date().toISOString();await saveTurn(turn);};
    const clear=document.getElementById('clearTurnBtn');
    if(clear)clear.onclick=()=>{if(confirm('Очистить текущий черновик хода?'))saveTurn(defaultTurn());};
    const next=document.getElementById('nextTurnBtn');
    if(next)next.onclick=async()=>{const n={number:turn.number+1,status:'draft',actions:[],submittedAt:null};await saveTurn(n);};
    const validateBtn=document.getElementById('validateTurnBtn'); if(validateBtn)validateBtn.onclick=()=>render();
  }

  window.VA34_TURN={load:loadTurn,validate,render,hydrate};
  document.addEventListener('DOMContentLoaded',()=>{render();hydrate();});
  if(document.readyState!=='loading'){render();hydrate();}
})();