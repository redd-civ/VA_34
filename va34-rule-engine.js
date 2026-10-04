/* VA-34 mechanical rule engine. Unknown/custom content returns "master", never invented. */
window.VA34_RULE_ENGINE={
  list(v){return String(v||'').split(String.fromCharCode(10)).flatMap(x=>x.split(',')).map(x=>x.trim()).filter(Boolean)},
  techRank(name){const t=window.VA34_RULES.technologies.find(x=>x.toLowerCase()===name.toLowerCase());return t?1:null},
  validateStarter(lord){
    const R=window.VA34_RULES, out=[];
    const troops=this.list(lord.startingTroops), magic=this.list(lord.startingMagic), tech=this.list(lord.startingTech);
    if(!lord.name) out.push({level:'error',text:'Не указано имя Владыки.'});
    if(!lord.ancestralName) out.push({level:'error',text:'Не указан родовой осколок.'});
    if(!lord.ancestralRace) out.push({level:'error',text:'Не указана раса родового осколка.'});
    if(!lord.ancestralTerrain) out.push({level:'error',text:'Не указан ландшафт родового осколка.'});
    if(troops.length>R.constants.maxStartingTroopTypes) out.push({level:'error',text:'Стартовых родов войск не больше 4.'});
    if(magic.length>R.constants.maxStartingMagicSchools) out.push({level:'error',text:'Стартовых школ магии не больше 2.'});
    if(tech.length<R.constants.startingTechLevelsMin||tech.length>R.constants.startingTechLevelsMax) out.push({level:'error',text:'Стартовых уровней технологий должно быть 4–5.'});
    magic.forEach(x=>{if(!R.magicSchools.some(y=>y.toLowerCase()===x.toLowerCase())) out.push({level:'master',text:'Школа магии «'+x+'» отсутствует в справочнике — требуется решение Мастера.'})});
    troops.forEach(x=>{if(!R.troopTypes.some(y=>y.toLowerCase()===x.toLowerCase())) out.push({level:'master',text:'Род войск «'+x+'» отсутствует в базовом справочнике — требуется решение Мастера.'})});
    tech.forEach(x=>{const m=x.match(/^(.+?)(?:\\s+(?:базовый|продвинутый|экспертный|мастерский|грандмастерский|эпичный|[+]{1,5}))?$/i);const name=(m?m[1]:x).trim();if(!R.technologies.some(y=>y.toLowerCase()===name.toLowerCase())) out.push({level:'master',text:'Технология «'+x+'» не найдена в справочнике — требуется решение Мастера.'})});
    if(lord.ancestralRace && !R.races.some(x=>x.name===lord.ancestralRace)) out.push({level:'master',text:'Раса «'+lord.ancestralRace+'» не найдена в справочнике — требуется решение Мастера.'});
    return out;
  }
};