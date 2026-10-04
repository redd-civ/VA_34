/* VA-34 mechanical rule engine. Unknown/custom content returns "master", never invented. */
window.VA34_RULE_ENGINE={
  list(v){return String(v||'').split(String.fromCharCode(10)).flatMap(x=>x.split(',')).map(x=>x.trim()).filter(Boolean)},
  levelNames:['базовый','продвинутый','экспертный','мастерский','грандмастерский','эпичный'],
  levelRoman:['I','II','III','IV','V','VI'],
  levelText(n){return this.levelNames[(+n||1)-1]||'базовый'},
  specialTZList(){return Array.isArray(window.VA34_SPECIAL_TZ)?window.VA34_SPECIAL_TZ:[]},
  findSpecialTZ(idOrName){
    const q=String(idOrName||'').trim().toLowerCase();
    if(!q)return null;
    return this.specialTZList().find(x=>String(x.id).toLowerCase()===q||String(x.name).toLowerCase()===q)||null;
  },
  validateSpecialTZ(value){
    if(value===true)return {allowed:true,level:'ok',code:'tz_approved',text:'Специальное ТЗ подтверждено.'};
    const tz=typeof value==='object'&&value?value:this.findSpecialTZ(value);
    if(!tz)return {allowed:false,level:'master',code:'unknown_special_tz',text:'Специальное ТЗ отсутствует в каталоге правил — требуется решение Мастера.'};
    if(typeof value==='object'&&value.approved===true)return {allowed:true,level:'ok',code:'tz_approved',text:'Специальное ТЗ одобрено Мастером.',tz};
    return {allowed:false,level:'master',code:'tz_requires_approval',text:'Специальное ТЗ найдено в каталоге, но ещё не подтверждено Мастером.',tz};
  },
  levelAccess(n,context={}){
    const level=+n||1;
    if(level<1||level>6)return {allowed:false,level:'error',code:'invalid_tech_level',text:'Неизвестный уровень развития.'};
    const tzApproved=context.specialTZ===true||(context.specialTZ&&context.specialTZ.approved===true);
    if(level===6&&!tzApproved&&!context.masterDecision)return {allowed:false,level:'master',code:'epic_requires_tz_or_master',text:'Эпичный уровень недоступен по умолчанию. Необходимо специальное ТЗ или решение Мастера.'};
    if(level===6&&context.masterDecision)return {allowed:true,level:'ok',code:'epic_master_approved',text:'Эпичный уровень разрешён решением Мастера.'};
    if(level===6&&tzApproved)return {allowed:true,level:'ok',code:'epic_tz_approved',text:'Эпичный уровень разрешён специальным ТЗ.'};
    return {allowed:true,level:'ok',code:'level_available',text:'Уровень доступен.'};
  },
  parseTech(x){
    const raw=String(x||'').trim();
    const m=raw.match(/^(.+?)(?:\s+(базовый|продвинутый|экспертный|мастерский|грандмастерский|эпичный|\+{1,6}|I{1,3}|[1-6]))?$/i);
    const levelRaw=(m&&m[2])||'базовый';
    const map={'базовый':1,'+':1,'i':1,'1':1,'продвинутый':2,'++':2,'ii':2,'2':2,'экспертный':3,'+++':3,'iii':3,'3':3,'мастерский':4,'++++':4,'iv':4,'4':4,'грандмастерский':5,'+++++':5,'v':5,'5':5,'эпичный':6,'++++++':6,'vi':6,'6':6};
    return {name:(m?m[1]:raw).trim(),level:map[String(levelRaw).toLowerCase()]||1};
  },
  developmentTotals(lord={}){
    const tech=this.list(lord.startingTech).map(x=>this.parseTech(x));
    const magic=this.list(lord.startingMagic).map(x=>this.parseTech(x));
    const technologyLevels=tech.reduce((s,x)=>s+x.level,0);
    const magicLevels=magic.reduce((s,x)=>s+x.level,0);
    return {technologyLevels,magicLevels,total:technologyLevels+magicLevels};
  },
  technologyCost(technology,level,profile='profile'){
    const n=String(technology||'');const l=Math.max(1,Math.min(6,+level||1));
    const costs=window.VA34_RULES&&window.VA34_RULES.technologyCosts;
    if(!costs||!costs[profile])return {allowed:false,level:'master',code:'unknown_tech_cost_profile',text:'Профиль стоимости технологии не определён в правилах.'};
    const key=['basic','advanced','expert','master','grandmaster','epic'][l-1];
    const raw=costs[profile][key];
    if(raw==null)return {allowed:false,level:'master',code:'unknown_tech_cost',text:'Стоимость этого уровня технологии не определена.'};
    const discountFloor=costs.minimumAfterDiscount??0.5;
    return {allowed:true,level:'ok',technology:n,techLevel:l,profile,cost:raw,discountFloor};
  },
  validateStarter(lord){
    const R=window.VA34_RULES,out=[];
    const troops=this.list(lord.startingTroops),magic=this.list(lord.startingMagic),tech=this.list(lord.startingTech);
    if(!lord.name)out.push({level:'error',code:'lord_name',text:'Не указано имя Владыки.'});
    if(!lord.ancestralName)out.push({level:'error',code:'ancestral_name',text:'Не указан родовой осколок.'});
    if(!lord.ancestralRace)out.push({level:'error',code:'ancestral_race',text:'Не указана раса родового осколка.'});
    if(!lord.ancestralTerrain)out.push({level:'error',code:'ancestral_terrain',text:'Не указан ландшафт родового осколка.'});
    if(troops.length>R.constants.maxStartingTroopTypes)out.push({level:'error',code:'troop_limit',text:'Стартовых родов войск не больше 4.'});
    if(magic.length>R.constants.maxStartingMagicSchools)out.push({level:'error',code:'magic_limit',text:'Стартовых школ магии не больше 2.'});
    const parsedTech=tech.map(x=>this.parseTech(x));
    let techLevels=0;
    parsedTech.forEach(t=>{
      techLevels+=t.level;
      if(!R.technologies.some(y=>String(y).toLowerCase()===t.name.toLowerCase()))out.push({level:'master',code:'unknown_tech',text:'Технология «'+t.name+'» отсутствует в справочнике — требуется решение Мастера.'});
      if(t.level>3)out.push({level:'error',code:'starter_tech_level',text:'Одна технология не может быть выше III уровня на старте: «'+t.name+'».'});
    });
    const parsedMagic=magic.map(x=>this.parseTech(x));
    const magicLevels=parsedMagic.reduce((sum,m)=>sum+m.level,0);
    const totalDevelopment=techLevels+magicLevels;
    if(totalDevelopment<4)out.push({level:'error',code:'starter_development_total',text:'Стартовый пул развития должен составлять не менее 4 уровней.'});
    if(totalDevelopment>7)out.push({level:'error',code:'starter_development_total',text:'Стартовый пул развития не может превышать 7 уровней.'});
    if(totalDevelopment>5)out.push({level:'master',code:'starter_development_over_5',text:'6–7 суммарных уровней развития на старте требуют разрешения Мастера.'});
    parsedMagic.forEach(m=>{if(!R.magicSchools.some(y=>y.toLowerCase()===m.name.toLowerCase()))out.push({level:'master',code:'unknown_magic',text:'Школа магии «'+m.name+'» отсутствует в справочнике — требуется решение Мастера.'});if(m.level>3)out.push({level:'error',code:'starter_magic_level',text:'Одна школа магии не может быть выше III уровня на старте: «'+m.name+'».'})});
    troops.forEach(x=>{if(!R.troopTypes.some(y=>y.toLowerCase()===x.toLowerCase()))out.push({level:'master',code:'unknown_troop',text:'Род войск «'+x+'» отсутствует в справочнике — требуется решение Мастера.'})});
    if(lord.ancestralRace&&!R.races.some(x=>x.name===lord.ancestralRace))out.push({level:'master',code:'unknown_race',text:'Раса «'+lord.ancestralRace+'» отсутствует в справочнике — требуется решение Мастера.'});
    return out;
  }
};

(function installLevelDisplay(){
  const names=['Базовый','Продвинутый','Экспертный','Мастерский','Грандмастерский','Эпичный'];
  const roman=['I','II','III','IV','V','VI'];
  function syncMagic(){
    const rows=[...document.querySelectorAll('[data-starter-magic]')].map(row=>{const name=row.querySelector('[data-magic-name]').value;const level=+(row.querySelector('[data-magic-level]')||{}).value||1;return name?name+' '+level:''}).filter(Boolean);
    startingMagic.value=rows.join(', ');state.lord.startingMagic=startingMagic.value;renderStarterMagicBuilder(false);renderStarterValidation(starterIssues());
  }
  function decorate(){
    document.querySelectorAll('#starterTechBuilder [data-tech-level]').forEach(select=>{for(let i=0;i<names.length;i++){let option=select.querySelector('option[value="'+(i+1)+'"]');if(!option){option=document.createElement('option');option.value=String(i+1);select.appendChild(option)}option.textContent=names[i]+' ('+roman[i]+')'}});
    document.querySelectorAll('#starterMagicBuilder [data-starter-magic]').forEach(row=>{let select=row.querySelector('[data-magic-level]');if(!select){select=document.createElement('select');select.setAttribute('data-magic-level','');names.forEach((name,i)=>{const o=document.createElement('option');o.value=String(i+1);o.textContent=name+' ('+roman[i]+')';select.appendChild(o)});const old=row.querySelector('.muted');if(old)old.replaceWith(select);else row.insertBefore(select,row.querySelector('[data-remove-magic]'))}const parsed=window.VA34_RULE_ENGINE.parseTech((window.starterList?starterList(state.lord.startingMagic):state.lord.startingMagic).split(',')[Array.from(document.querySelectorAll('[data-starter-magic]')).indexOf(row)]||'');select.value=String(parsed.level||1);select.onchange=syncMagic;row.querySelector('[data-magic-name]').onchange=syncMagic});
  }
  function watch(){decorate();const techBox=document.getElementById('starterTechBuilder'),magicBox=document.getElementById('starterMagicBuilder');if(!techBox&&!magicBox)return false;const observer=new MutationObserver(decorate);if(techBox)observer.observe(techBox,{childList:true,subtree:true});if(magicBox)observer.observe(magicBox,{childList:true,subtree:true});return true}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(watch,0));else setTimeout(watch,0);
})();
