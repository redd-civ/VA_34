const KEY='va34_cabinet_v1';
const RULES=window.VA34_RULES;
const emptyState={lord:{name:'',race:'',motto:'',energy:15,status:'Владыка',ability:'',traits:'',items:'',resources:'',ancestralName:'',ancestralRace:'',ancestralTerrain:'',ancestralIncome:0,ancestralGarrison:0,startingTroops:'',startingMagic:'',startingTech:''},shards:[],heroes:[],troops:[],tech:[],meta:{version:3}};
let state=load();
let cloudReady=false;
let cloudBusy=false;
let cloudInitStarted=false;

function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
    return {
      lord:{...emptyState.lord,...(raw.lord||{})},
      shards:Array.isArray(raw.shards)?raw.shards:[],
      heroes:Array.isArray(raw.heroes)?raw.heroes:[],
      troops:Array.isArray(raw.troops)?raw.troops:[],
      tech:Array.isArray(raw.tech)?raw.tech:[],
      meta:{...emptyState.meta,...(raw.meta||{})}
    };
  }catch(e){return structuredClone(emptyState)}
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  render();
  if(cloudReady && !cloudBusy){
    cloudBusy=true;
    VA34_CLOUD.saveState(state)
      .then(result=>{
        if(result && result.saved) setCloudStatus('Облако: сохранено','cloud');
      })
      .catch(err=>setCloudStatus('Ошибка облака: '+(err.message||'неизвестная ошибка'),'error'))
      .finally(()=>{cloudBusy=false});
  }
}
function setCloudStatus(text,kind='local'){
  const el=document.getElementById('cloudStatus');
  const mode=document.getElementById('storageMode');
  if(el){el.textContent=text;el.className='badge '+kind}
  if(mode) mode.textContent=text;
}
function hasLocalData(){
  return Boolean(
    state.lord.name || state.lord.race || state.lord.motto || state.lord.ability ||
    state.shards.length || state.heroes.length || state.troops.length || state.tech.length
  );
}
function withTimeout(promise,ms=10000){
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Таймаут подключения к Supabase (10 сек).')),ms)})
  ]).finally(()=>clearTimeout(timer));
}
async function initCloud(){
  if(cloudInitStarted) return;
  cloudInitStarted=true;
  setCloudStatus('Облако: проверка…','checking');
  try{
    const info=await withTimeout(VA34_CLOUD.init());
    if(!info.configured){setCloudStatus('Локально: Supabase не настроен');return}
    if(!info.authenticated){setCloudStatus('Локально: войдите в аккаунт');return}
    const requestedGame=new URLSearchParams(location.search).get('game');
    if(requestedGame) await VA34_CLOUD.setGame(requestedGame);
    const games=await withTimeout(VA34_CLOUD.getGameContext());
    const selector=document.getElementById('gameSelector');
    if(selector){
      selector.innerHTML=games.length?games.map(g=>`<option value="${esc(g.id)}" ${localStorage.getItem('va34_current_game_id')===g.id?'selected':''}>${esc(g.name)}</option>`).join(''):'<option value="">Нет доступных игр</option>';
      if(games.length && !localStorage.getItem('va34_current_game_id')) await VA34_CLOUD.setGame(games[0].id);
      if(games.length) selector.value=localStorage.getItem('va34_current_game_id')||games[0].id;
      selector.onchange=async()=>{await VA34_CLOUD.setGame(selector.value);location.reload()};
    }
    if(!games.length){cloudReady=false;setCloudStatus('Облако: вступите в игру','checking');render();return;}
    const remote=await withTimeout(VA34_CLOUD.getState());
    if(remote){
      state=remote;
      localStorage.setItem(KEY,JSON.stringify(state));
      cloudReady=true;
      render();
      setCloudStatus('Облако: синхронизировано','cloud');
      return;
    }
    if(hasLocalData()){
      cloudReady=true;
      await withTimeout(VA34_CLOUD.saveState(state));
      setCloudStatus('Облако: локальные данные перенесены','cloud');
    }else{
      cloudReady=true;
      await VA34_CLOUD.saveState(state);
      setCloudStatus('Облако: готово','cloud');
    }
    render();
  }catch(err){
    cloudReady=false;
    console.error('VA34 cloud init failed',err);
    const detail=[err.message,err.code,err.details,err.hint].filter(Boolean).join(' | ');
    setCloudStatus('Ошибка облака: '+(detail||'неизвестная ошибка'),'error');
  }
}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function options(items,current='',valueFn=x=>x,labelFn=x=>x){
  return items.map(x=>{
    const v=typeof x==='string'?x:valueFn(x), label=typeof x==='string'?x:labelFn(x);
    return `<option value="${esc(v)}" ${String(v)===String(current)?'selected':''}>${esc(label)}</option>`;
  }).join('');
}
function go(tab){
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===tab));
  document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.tab));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));

function starterList(v){return String(v||'').split(/[\\n,]+/).map(x=>x.trim()).filter(Boolean)}
function validateStarter(){
  const out=[];
  if(!state.lord.name) out.push('Укажите имя Владыки.');
  if(!state.lord.ancestralName) out.push('Укажите название родового осколка.');
  if(!state.lord.ancestralRace) out.push('Укажите расу родового осколка.');
  if(!state.lord.ancestralTerrain) out.push('Укажите ландшафт родового осколка.');
  const troops=starterList(state.lord.startingTroops), magic=starterList(state.lord.startingMagic);
  if(troops.length>RULES.constants.maxStartingTroopTypes) out.push('Стартовых родов войск не больше 4.');
  if(magic.length>RULES.constants.maxStartingMagicSchools) out.push('Стартовых школ магии не больше 2.');
  const tech=starterList(state.lord.startingTech);
  if(tech.length<RULES.constants.startingTechLevelsMin || tech.length>RULES.constants.startingTechLevelsMax) out.push('Стартовых уровней технологий должно быть 4–5.');
  return out;
}
function renderStarterValidation(items){
  const el=document.getElementById('lordValidation'); if(!el)return;
  el.innerHTML=items.length?'<strong>Нужно исправить:</strong><ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<span class="badge cloud">Заявка соответствует базовым стартовым ограничениям.</span>';
}
function fillLordRace(){
  lordRace.innerHTML='<option value="">— не указана —</option><option value="custom">Другая / пока не внесена в справочник</option>';
  // The current rules page names the race system but does not enumerate races.
  // Keep free-form legacy/custom values without inventing a race list.
  if(state.lord.race && !['custom',''].includes(state.lord.race)){
    const o=document.createElement('option');o.value=state.lord.race;o.textContent=state.lord.race;o.selected=true;lordRace.appendChild(o);
  }
  if(state.lord.race==='custom') lordRace.value='custom';
}
lordForm.onsubmit=e=>{
  e.preventDefault();
  state.lord={...state.lord,name:lordName.value.trim(),race:lordRace.value,motto:lordMotto.value,energy:+lordEnergy.value||0,ability:lordAbility.value,traits:lordTraits.value,items:lordItems.value,resources:lordResources.value,status:lordStatus.value||'Владыка',ancestralName:ancestralName.value.trim(),ancestralRace:ancestralRace.value,ancestralTerrain:ancestralTerrain.value,ancestralIncome:+ancestralIncome.value||0,ancestralGarrison:+ancestralGarrison.value||0,startingTroops:startingTroops.value,startingMagic:startingMagic.value,startingTech:startingTech.value};
  const issues=validateStarter();
  if(issues.length){renderStarterValidation(issues);go('lord');return}
  save();go('overview')
  save();go('overview')
};

function shardForm(s={}){
  const type=s.type||'ordinary';
  return `<form class="form-grid" id="shardForm">
<label>Название<input name="name" value="${esc(s.name)}" required></label>
<label>Тип<select name="type">${options(RULES.shardTypes,type,x=>x.id,x=>x.name)}</select></label>
<label>Размер<select name="size">${options(RULES.shardSizes,s.size??1,x=>x.value,x=>x.name+' — '+x.value)}</select></label>
<label>Доход<input name="income" type="number" min="0" step=".5" value="${s.income??0}"></label>
<label>Раса<input name="race" value="${esc(s.race)}" placeholder="Справочник рас ещё не заполнен"></label>
<label>Население<input name="population" value="${esc(s.population)}"></label>
<label>Настроение<select name="mood">${options(RULES.moods,s.mood||'Спокойное')}</select></label>
<label>Гарнизон<input name="garrison" type="number" min="0" step=".5" value="${s.garrison??0}"></label>
<label>Снабжение<input name="supply" type="number" min="0" step=".5" value="${s.supply??0}"></label>
<label>Укрепления / защита<input name="defense" type="number" min="0" step=".5" value="${s.defense??0}"></label>
<label>Ландшафт<select name="terrain"><option value="">— не указан —</option>${options(RULES.terrains,s.terrain)}</select></label>
<label>Здания<input name="buildings" type="number" min="0" step="1" value="${s.buildings??0}"></label>
<label class="wide">Ресурсы / трофеи<textarea name="resources">${esc(s.resources)}</textarea></label>
<label class="wide">Описание<textarea name="description">${esc(s.description)}</textarea></label>
<div><button class="primary" type="submit">Сохранить</button> <button type="button" class="danger" id="cancelShard">Отмена</button></div></form>`;
}
function editShard(s){
  shardsList.innerHTML=shardForm(s);
  const f=shardsList.querySelector('form');
  f.onsubmit=e=>{
    e.preventDefault();
    const x=Object.fromEntries(new FormData(f));
    Object.assign(s,x,{size:+x.size,income:+x.income||0,garrison:+x.garrison||0,supply:+x.supply||0,defense:+x.defense||0,buildings:+x.buildings||0});
    save();
  };
  cancelShard.onclick=render;
}
newShard.onclick=()=>{const s={id:id(),type:'ordinary',size:1,income:0,garrison:0,supply:0,defense:0,buildings:0};state.shards.push(s);editShard(s)};

const fieldNames={
  heroes:{name:'Имя',race:'Раса',level:'Уровень',xp:'Опыт',skills:'Навыки',perks:'Перки',knights:'Витязи',items:'Предметы',artifacts:'Артефакты',description:'Описание'},
  troops:{name:'Название',type:'Тип войск',tier:'Уровень',quantity:'Количество',traits:'Особенности',description:'Описание'},
  tech:{name:'Название',kind:'Технология / магия',level:'Уровень',cost:'Стоимость',description:'Описание'}
};
function textOrSelect(kind,k,value){
  if(kind==='troops' && k==='type'){
    return `<select name="type"><option value="">— не указан —</option>${options(RULES.troopTypes,value)}</select>`;
  }
  if(kind==='tech' && k==='kind'){
    return `<select name="kind"><option value="technology" ${value==='technology'?'selected':''}>Технология</option><option value="magic" ${value==='magic'?'selected':''}>Школа магии</option></select>`;
  }
  if(kind==='tech' && k==='name'){
    const arr=[...RULES.technologies.map(x=>({v:x,t:'⚙ '+x})),...RULES.magicSchools.map(x=>({v:x,t:'🔮 '+x}))];
    return `<select name="name"><option value="">— выбрать из справочника —</option>${arr.map(x=>`<option value="${esc(x.v)}" ${x.v===value?'selected':''}>${esc(x.t)}</option>`).join('')}</select>`;
  }
  if(kind==='heroes' && k==='skills') return `<input name="skills" value="${esc(value)}" placeholder="До 6 навыков через запятую">`;
  if(kind==='heroes' && k==='perks') return `<input name="perks" value="${esc(value)}" placeholder="Перки через запятую">`;
  return `<input name="${k}" value="${esc(value)}">`;
}
function simpleAdd(kind,label){
  const obj={id:id()};
  const fields=kind==='heroes'?['name','race','level','xp','skills','perks','knights','items','artifacts','description']:kind==='troops'?['name','type','tier','quantity','traits','description']:['name','kind','level','cost','description'];
  fields.forEach(x=>obj[x]=x==='kind'?'technology':'');
  state[kind].push(obj);save();editSimple(kind,obj,label)
}
function editSimple(kind,obj,label){
  const box=document.getElementById(kind+'List');
  const fields=kind==='heroes'?['name','race','level','xp','skills','perks','knights','items','artifacts','description']:kind==='troops'?['name','type','tier','quantity','traits','description']:['name','kind','level','cost','description'];
  box.innerHTML=`<form class="form-grid" id="simpleForm"><h3 class="wide">${label}</h3>${fields.map(k=>`<label>${fieldNames[kind][k]||k}${textOrSelect(kind,k,obj[k]??'')}</label>`).join('')}<div><button class="primary" type="submit">Сохранить</button></div></form>`;
  const f=document.getElementById('simpleForm');
  f.onsubmit=e=>{e.preventDefault();Object.assign(obj,Object.fromEntries(new FormData(f)));save()}
}
newHero.onclick=()=>simpleAdd('heroes','Новый герой');
newTroop.onclick=()=>simpleAdd('troops','Новый род войск');
newTech.onclick=()=>simpleAdd('tech','Новое развитие');

function renderList(kind,el,formatter){
  const arr=state[kind];
  el.innerHTML=arr.length?arr.map(x=>`<article class="entity"><h3>${esc(x.name||'Без названия')}</h3><div class="meta">${formatter(x)}</div><div class="entity-actions"><button data-edit="${x.id}">Изменить</button><button data-del="${x.id}">Удалить</button></div></article>`).join(''):'<div class="notice">Пока ничего нет.</div>';
  el.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const x=arr.find(x=>x.id===b.dataset.edit);kind==='shards'?editShard(x):editSimple(kind,x,kind==='heroes'?'Герой':kind==='troops'?'Род войск':'Развитие')});
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{state[kind]=arr.filter(x=>x.id!==b.dataset.del);save()});
}

function commaCount(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean).length}
function render(){
  fillLordRace();
  lordName.value=state.lord.name;lordMotto.value=state.lord.motto;lordEnergy.value=state.lord.energy;lordAbility.value=state.lord.ability;lordTraits.value=state.lord.traits;lordItems.value=state.lord.items||'';lordResources.value=state.lord.resources||'';lordStatus.value=state.lord.status||'Владыка';
  ancestralName.value=state.lord.ancestralName||''; ancestralIncome.value=state.lord.ancestralIncome||0; ancestralGarrison.value=state.lord.ancestralGarrison||0;
  startingTroops.value=state.lord.startingTroops||''; startingMagic.value=state.lord.startingMagic||''; startingTech.value=state.lord.startingTech||'';
  ancestralRace.innerHTML='<option value="">— выбрать —</option>'+RULES.races.map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join(''); ancestralRace.value=state.lord.ancestralRace||'';
  ancestralTerrain.innerHTML='<option value="">— выбрать —</option>'+options(RULES.terrains,state.lord.ancestralTerrain);
  overviewTitle.textContent=state.lord.name||'Новый Владыка';overviewRace.textContent=state.lord.race&&state.lord.race!=='custom'?state.lord.race:'Раса не указана';
  const size=state.shards.reduce((a,s)=>a+(+s.size||0),0),income=state.shards.reduce((a,s)=>a+(+s.income||0),0),limit=RULES.constants.defaultEnergyStorage+RULES.constants.energyStoragePerShard*state.shards.length;
  statShards.textContent=state.shards.length;statSize.textContent=size;statIncome.textContent=income;statEnergy.textContent=limit;
  worldSummary.innerHTML=`<span><strong>${state.shards.length}</strong> осколков</span><span><strong>${size}</strong> размер</span><span><strong>${income}</strong> доход</span><span><strong>${state.shards.filter(s=>s.type==='ancestral').length}</strong> родовых</span>`;
  const warnings=[];
  if(state.shards.filter(s=>s.type==='ancestral').length!==1)warnings.push('Должен быть ровно один родовой осколок.');
  state.shards.forEach(s=>{
    const max=s.type==='ancestral'?RULES.constants.ancestralBuildingLimit:Math.floor(+s.size||0);
    if((+s.buildings||0)>max)warnings.push(`Осколок «${s.name||'без названия'}»: зданий ${s.buildings}, допустимо ${max}.`);
    if((+s.garrison||0)>(+s.supply||0))warnings.push(`Осколок «${s.name||'без названия'}»: гарнизон превышает снабжение.`);
  });
  if(state.troops.length>RULES.constants.maxStartingTroopTypes)warnings.push(`Войска: заявлено ${state.troops.length} рода(ов), на старте разрешено не более ${RULES.constants.maxStartingTroopTypes}.`);
  const magicCount=state.tech.filter(t=>t.kind==='magic').length;
  if(magicCount>RULES.constants.maxStartingMagicSchools)warnings.push(`Магия: заявлено ${magicCount} школ, на старте разрешено не более ${RULES.constants.maxStartingMagicSchools}.`);
  const techLevels=state.tech.reduce((a,t)=>a+(+t.level||0),0);
  if(techLevels>RULES.constants.startingTechLevelsMax)warnings.push(`Стартовое развитие: указано ${techLevels} уровней; заявка Владыки допускает 4–5 стартовых уровней суммарно.`);
  if(state.tech.length && techLevels<RULES.constants.startingTechLevelsMin)warnings.push(`Стартовое развитие: указано ${techLevels} уровней; для стандартной заявки требуется 4–5.`);
  state.heroes.forEach(h=>{if(commaCount(h.skills)>RULES.constants.maxHeroSkills)warnings.push(`Герой «${h.name||'без имени'}»: навыков ${commaCount(h.skills)}, допустимо не более ${RULES.constants.maxHeroSkills}.`)});
  if(state.heroes.length>RULES.constants.maxHeroes)warnings.push(`Герои: ${state.heroes.length}; по правилам максимум ${RULES.constants.maxHeroes}.`);
  renderList('shards',shardsList,s=>`тип: ${s.type}; размер: ${s.size}; доход: ${s.income}; гарнизон: ${s.garrison}/${s.supply}; защита: ${s.defense||0}; зданий: ${s.buildings}`);
  renderList('heroes',heroesList,s=>`уровень: ${s.level||0}; навыки: ${s.skills||'—'}`);
  renderList('troops',troopsList,s=>`тип: ${s.type||'—'}; уровень: ${s.tier||'—'}; количество: ${s.quantity||'—'}`);
  renderList('tech',techList,s=>`тип: ${s.kind==='magic'?'магия':'технология'}; уровень: ${s.level||0}`);
  warningsEl.innerHTML=warnings.length?warnings.map(x=>`<div class="warning">⚠️ ${esc(x)}</div>`).join(''):'<div class="ok">✓ Основные проверяемые ограничения сейчас соблюдены.</div>';
  jsonPreview.textContent=JSON.stringify(state,null,2);
}
exportData.onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='va34-data.json';a.click();URL.revokeObjectURL(a.href)}
importData.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());state={...emptyState,...x,lord:{...emptyState.lord,...(x.lord||{})},shards:Array.isArray(x.shards)?x.shards:[],heroes:Array.isArray(x.heroes)?x.heroes:[],troops:Array.isArray(x.troops)?x.troops:[],tech:Array.isArray(x.tech)?x.tech:[]};save();alert('Данные импортированы.')}catch(err){alert('Не удалось прочитать JSON.')}e.target.value=''}
resetData.onclick=()=>{if(confirm('Удалить все локальные данные?')){state=structuredClone(emptyState);save()}}
const warningsEl=document.getElementById('warnings');
render();
initCloud();
