(() => {
  const TURN_KEY = 'va34_turn_v1';
  const CABINET_KEY = 'va34_cabinet_v1';
  const RULES = window.VA34_RULES || {};
  const ENGINE = window.VA34_RULE_ENGINE;

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
  function parseNumber(v, fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
  function techLevelName(n){return (ENGINE?.levelNames?.[(+n||1)-1]||'базовый');}

  function developmentActions(turn){
    return turn.actions.filter(a=>a.kind==='extra' && (a.actionType==='technology' || a.actionType==='magic' || a.actionType==='development'));
  }

  function validateDevelopmentActions(turn, cabinet, errors, warnings){
    const actions=developmentActions(turn);
    if(!actions.length)return {levels:0,different:0,cost:0};
    const byTech=new Map(), different=new Set(), levelTotal={};
    let levels=0, cost=0;
    actions.forEach((a,i)=>{
      const label='Развитие №'+(i+1);
      const isMagic=a.actionType==='magic';
      const name=String(a.developmentName||a.techName||'').trim();
      const level=parseNumber(a.developmentLevel||a.techLevel,1);
      if(!name){errors.push(label+': не указано развитие.');return;}
      if(level<1||level>6){errors.push(label+': неверный уровень развития.');return;}
      if(ENGINE && level===6){
        const special=ENGINE.validateSpecialTZ(a.specialTZ||false);
        const access=ENGINE.levelAccess(level,{specialTZ:special.allowed&&special.tz?{...special.tz,approved:true}:false,masterDecision:a.masterDecision===true});
        if(!access.allowed){
          if(access.level==='master')warnings.push(label+': '+access.text);
          else errors.push(label+': '+access.text);
        }
      }
      if(!isMagic){
        const key=name.toLowerCase();
        different.add(key);
        levelTotal[key]=(levelTotal[key]||0)+level;
        if((levelTotal[key])>3)errors.push(label+': одной технологии нельзя повышать более чем на 3 уровня за ход.');
      }
      levels+=level;
      const key=(isMagic?'magic:':'tech:')+name.toLowerCase();
      byTech.set(key,(byTech.get(key)||0)+level);
      if(!isMagic && different.size>3)errors.push('За ход можно развивать не более 3 разных технологий.');
      if(!isMagic && level>3)errors.push(label+': за один ход нельзя развить одну технологию более чем на 3 уровня.');
      if(isMagic && level>3)errors.push(label+': за один ход нельзя развить одну школу магии более чем на 3 уровня.');

      if(!isMagic && ENGINE){
        const profile=a.costProfile||'profile';
        const price=ENGINE.technologyCost(name,level,profile);
        if(!price.allowed)warnings.push(label+': '+price.text);
        else {
          const discount=parseNumber(a.discountPercent,0);
          const multiplier=Math.max(0.5,1-Math.max(0,Math.min(100,discount))/100);
          const computed=Math.max(price.discountFloor,price.cost*multiplier);
          const declared=parseNumber(a.cost,NaN);
          if(Number.isFinite(declared) && Math.abs(declared-computed)>0.001){
            errors.push(label+': заявлена стоимость '+declared+', расчётная стоимость '+computed.toFixed(2)+' энергии.');
          }
          cost+=computed;
        }
      }
    });
    if(levels>6)errors.push('Суммарно технологий за ход нельзя развивать более чем на 6 уровней.');
    return {levels,different:different.size,cost};
  }

  function validate(turn){
    const cabinet=loadCabinet(), energy=Number(cabinet?.lord?.energy||0);
    const main=turn.actions.filter(a=>a.kind==='main').length;
    const extra=turn.actions.filter(a=>a.kind==='extra').length;
    const total=main+extra, errors=[], warnings=[];
    if(turn.status==='submitted') return {errors,warnings,main,extra,total,energy,spent:turn.actions.reduce((s,a)=>s+Number(a.cost||0),0),development:{levels:0,different:0,cost:0}};
    if(main>2) errors.push('Основных действий больше 2.');
    if(extra>5) errors.push('Дополнительных действий больше 5.');
    if(total>5) errors.push('Всего действий больше разрешённого максимума.');
    if(total===5&&main>0) errors.push('5 действий разрешены только если все они дополнительные.');
    if(main===2&&extra>2) errors.push('При 2 основных действиях можно выполнить не более 2 дополнительных.');
    if(main===1&&extra>3) errors.push('При 1 основном действии можно выполнить не более 3 дополнительных.');
    let spent=0;
    turn.actions.forEach((a,i)=>{
      const cost=Number(a.cost||0); spent+=cost;
      if(!String(a.title||'').trim()) errors.push('Действие №'+(i+1)+': не указано название.');
      if(cost<0) errors.push('Действие №'+(i+1)+': стоимость не может быть отрицательной.');
      if(a.actionType==='specialTZ' && ENGINE){
        const tz=ENGINE.validateSpecialTZ(a.specialTZ);
        if(!tz.allowed && tz.level==='master')warnings.push('Действие №'+(i+1)+': '+tz.text);
        else if(!tz.allowed)errors.push('Действие №'+(i+1)+': '+tz.text);
      }
    });
    const development=validateDevelopmentActions(turn,cabinet,errors,warnings);
    const computedDevelopmentCost=development.cost;
    if(computedDevelopmentCost>0){
      const declaredDevelopment=turn.actions.filter(a=>a.actionType==='technology').reduce((s,a)=>s+parseNumber(a.cost,0),0);
      const rawOther=turn.actions.reduce((s,a)=>s+parseNumber(a.cost,0),0)-declaredDevelopment;
      const normalizedSpent=rawOther+computedDevelopmentCost;
      if(normalizedSpent>energy)errors.push('Недостаточно энергии после расчёта развития: требуется '+normalizedSpent.toFixed(2)+', доступно '+energy+'.');
    } else if(spent>energy) errors.push('Недостаточно энергии: требуется '+spent+', доступно '+energy+'.');
    if(!turn.actions.length) warnings.push('Ход пока пуст.');
    if(turn.actions.length&&spent===0) warnings.push('Все действия имеют стоимость 0. Проверьте стоимость.');
    return {errors,warnings,main,extra,total,spent,energy,development};
  }

  function developmentOptions(kind='technology'){
    const items=kind==='magic'?(RULES.magicSchools||[]):(RULES.technologies||[]);
    const prefix=kind==='magic'?'🔮 ':'⚙ ';
    return '<option value="">— выбрать —</option>'+items.map(x=>'<option value="'+esc(x)+'">'+prefix+esc(x)+'</option>').join('');
  }
  function actionForm(){
    return '<form id="turnActionForm" class="form-grid"><label>Тип действия<select name="kind"><option value="main">Основное</option><option value="extra">Дополнительное</option></select></label><label>Тип механики<select name="actionType"><option value="attack">Атака</option><option value="other">Прочее</option></select></label><label>Стоимость энергии<input name="cost" type="number" min="0" step="0.5" value="0"></label><div id="developmentFields" class="wide" style="display:none"><label>Технология / школа магии<select name="developmentName">'+developmentOptions('technology')+'</select></label><label>Уровень развития<select name="developmentLevel">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+LEVEL_LABEL(n)+'</option>').join('')+'</select></label><label>Профиль стоимости<select name="costProfile"><option value="profile">Профильная</option><option value="nonProfile">Непрофильная</option><option value="veryNonProfile">Очень непрофильная</option></select></label><label>Скидка на стоимость, %<input name="discountPercent" type="number" min="0" max="100" step="0.5" value="0"></label></div><label class="wide">Название действия<input name="title" required placeholder="Например: разведка, атака или развитие"></label><label class="wide">Описание / цель<textarea name="description" rows="4" placeholder="Что именно делает Владыка"></textarea></label><div><button class="primary" type="submit">Добавить действие</button></div></form>';
  }
  function LEVEL_LABEL(n){const names=['Базовый','Продвинутый','Экспертный','Мастерский','Грандмастерский','Эпичный'];return names[n-1]+' ('+['I','II','III','IV','V','VI'][n-1]+')';}

  async function hydrate(){
    if(loadingCloud||!window.VA34_CLOUD?.configured) return;
    loadingCloud=true;
    try {
      const info=await window.VA34_CLOUD.init();
      if(!info.authenticated) return;
      cloudReady=true;
      const cloudTurn=await window.VA34_CLOUD.getTurn();
      if(cloudTurn) { localStorage.setItem(TURN_KEY,JSON.stringify(cloudTurn)); render(); }
      else await window.VA34_CLOUD.saveTurn(loadTurn());
      const status=document.getElementById('turnCloudStatus'); if(status) status.textContent='Облако хода: синхронизировано';
    } catch(e) { console.error('VA-34 turn cloud load:',e); showCloudError(e); }
    finally { loadingCloud=false; }
  }

  function render(){
    const box=document.getElementById('turnPanel'); if(!box)return;
    const turn=loadTurn(), v=validate(turn);
    const dev=v.development||{levels:0,different:0,cost:0};
    box.innerHTML='<div class="hero-panel"><div><span class="badge">'+esc(turn.status==='submitted'?'ХОД ОТПРАВЛЕН':'ЧЕРНОВИК ХОДА')+'</span><h2>Ход №'+esc(turn.number)+'</h2><p>Основных: '+v.main+' · Дополнительных: '+v.extra+' · Энергия: '+v.spent+'/'+v.energy+'</p><div id="turnCloudStatus" class="muted">Облако хода: проверка…</div></div><div class="stats"><div><strong>'+v.total+'</strong><span>действий</span></div><div><strong>'+v.main+'</strong><span>основных</span></div><div><strong>'+v.extra+'</strong><span>дополнительных</span></div><div><strong>'+v.energy+'</strong><span>энергии</span></div></div></div>'+
      '<div class="notice"><strong>Развитие за ход:</strong> '+dev.levels+' уровней · '+dev.different+' разных технологий · расчётная стоимость развития '+dev.cost.toFixed(2)+' э. Лимит: 6 уровней, не более 3 уровней одной технологии и не более 3 разных технологий.</div>'+
      (v.errors.length?v.errors.map(x=>'<div class="warning">❌ '+esc(x)+'</div>').join(''):'<div class="ok">✓ Ограничения по структуре и доступным механикам хода соблюдены.</div>')+
      (v.warnings.length?v.warnings.map(x=>'<div class="warning">⚠️ '+esc(x)+'</div>').join(''):'')+
      '<div class="section-head"><h2>Действия</h2><div><button id="nextTurnBtn" class="primary" '+(turn.status==='submitted'?'':'style="display:none"')+'>Следующий ход</button></div></div>'+
      (turn.actions.length?'<div class="entity-list">'+turn.actions.map((a,i)=>'<article class="entity"><h3>'+(i+1)+'. '+esc(a.title)+'</h3><div class="meta">'+(a.kind==='main'?'Основное':'Дополнительное')+' · '+Number(a.cost||0)+' энергии'+(a.actionType&&a.actionType!=='normal'?' · '+esc(a.actionType):'')+'</div><p>'+esc(a.description||'')+'</p><div class="entity-actions">'+(turn.status==='draft'?'<button data-remove-turn="'+esc(a.id)+'">Удалить</button>':'')+'</div></article>').join('')+'</div>':'<div class="notice">В этом ходе ещё нет действий.</div>')+
      '<div class="section-head"><h2>Добавить действие</h2><span class="muted">Проверка выполняется до отправки</span></div>'+
      (turn.status==='draft'?actionForm():'<div class="notice">Ход отправлен. После проверки можно начать следующий ход.</div>')+
      '<div class="data-actions"><button id="validateTurnBtn" class="primary">Проверить ход</button><button id="submitTurnBtn" class="primary" '+(v.errors.length||!turn.actions.length||turn.status!=='draft'?'disabled':'')+'>Отправить ход</button><button id="clearTurnBtn" class="danger">Очистить черновик</button></div>';

    const f=document.getElementById('turnActionForm');
    if(f){
      const kindField=f.elements.kind, typeField=f.elements.actionType, nameField=f.elements.developmentName;
      const devFields=document.getElementById('developmentFields');
      const syncActionFields=()=>{
        const kind=kindField.value;
        const current=typeField.value;
        const options=kind==='main'?[['attack','Атака'],['other','Прочее']]:[['technology','Развитие технологий'],['magic','Развитие магии'],['other','Прочее']];
        typeField.innerHTML=options.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('');
        if(options.some(([value])=>value===current))typeField.value=current;
        else typeField.value=kind==='main'?'attack':'technology';
        const type=typeField.value;
        if(devFields)devFields.style.display=(type==='technology'||type==='magic')?'grid':'none';
        if(nameField)nameField.innerHTML=developmentOptions(type==='magic'?'magic':'technology');
      };
      kindField.onchange=syncActionFields;
      typeField.onchange=syncActionFields;
      syncActionFields();
      f.onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(f));const isDev=x.actionType==='technology'||x.actionType==='magic';let cost=Number(x.cost||0);if(isDev&&ENGINE&&x.actionType==='technology'){const p=ENGINE.technologyCost(x.developmentName,x.developmentLevel,x.costProfile);if(p.allowed){const discount=Math.max(0,Math.min(100,Number(x.discountPercent||0)));cost=Math.max(p.discountFloor,p.cost*(1-discount/100));}}turn.actions.push({id:uid(),kind:x.kind,cost,title:x.title.trim(),description:x.description||'',actionType:x.actionType,developmentName:x.developmentName||'',developmentLevel:Number(x.developmentLevel||1),techName:x.developmentName||'',techLevel:Number(x.developmentLevel||1),costProfile:x.costProfile||'profile',discountPercent:Number(x.discountPercent||0),specialTZ:''});saveTurn(turn);};
    }
    box.querySelectorAll('[data-remove-turn]').forEach(b=>b.onclick=()=>{turn.actions=turn.actions.filter(a=>a.id!==b.dataset.removeTurn);saveTurn(turn);});
    const submit=document.getElementById('submitTurnBtn'); if(submit)submit.onclick=async()=>{const check=validate(turn);if(check.errors.length){render();return;}turn.status='submitted';turn.submittedAt=new Date().toISOString();await saveTurn(turn);};
    const clear=document.getElementById('clearTurnBtn'); if(clear)clear.onclick=()=>{if(confirm('Очистить текущий черновик хода?'))saveTurn(defaultTurn());};
    const next=document.getElementById('nextTurnBtn'); if(next)next.onclick=async()=>{const n={number:turn.number+1,status:'draft',actions:[],submittedAt:null};await saveTurn(n);};
    const validateBtn=document.getElementById('validateTurnBtn'); if(validateBtn)validateBtn.onclick=()=>render();
  }

  window.VA34_TURN={load:loadTurn,validate,render,hydrate};
  document.addEventListener('DOMContentLoaded',()=>{render();hydrate();});
  if(document.readyState!=='loading'){render();hydrate();}
})();