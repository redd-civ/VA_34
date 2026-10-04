/* VA-34 mechanical rule engine. Unknown/custom content returns "master", never invented. */
window.VA34_RULE_ENGINE={
  list(v){return String(v||'').split(String.fromCharCode(10)).flatMap(x=>x.split(',')).map(x=>x.trim()).filter(Boolean)},
  parseTech(x){
    const raw=String(x||'').trim();
    const m=raw.match(/^(.+?)(?:\s+(базовый|продвинутый|экспертный|мастерский|грандмастерский|эпичный|\+{1,6}|I{1,3}|[1-6]))?$/i);
    const levelRaw=(m&&m[2])||'базовый';
    const map={'базовый':1,'+':1,'i':1,'1':1,'продвинутый':2,'++':2,'ii':2,'2':2,'экспертный':3,'+++':3,'iii':3,'3':3,'мастерский':4,'++++':4,'iv':4,'4':4,'грандмастерский':5,'+++++':5,'v':5,'5':5,'эпичный':6,'++++++':6,'vi':6,'6':6};
    return {name:(m?m[1]:raw).trim(),level:map[String(levelRaw).toLowerCase()]||1};
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
      if(!R.technologies.some(y=>String(y).toLowerCase()===t.name.toLowerCase()))
        out.push({level:'master',code:'unknown_tech',text:'Технология «'+t.name+'» отсутствует в справочнике — требуется решение Мастера.'});
      if(t.level>3)out.push({level:'error',code:'starter_tech_level',text:'Одна технология не может быть выше III уровня на старте: «'+t.name+'».'});
    });
    const magicLevels=magic.length;
    const totalDevelopment=techLevels+magicLevels;
    if(totalDevelopment<4)out.push({level:'error',code:'starter_development_total',text:'Стартовый пул развития должен составлять не менее 4 уровней.'});
    if(totalDevelopment>7)out.push({level:'error',code:'starter_development_total',text:'Стартовый пул развития не может превышать 7 уровней.'});
    if(totalDevelopment>5)out.push({level:'master',code:'starter_development_over_5',text:'6–7 суммарных уровней развития на старте требуют разрешения Мастера.'});
    magic.forEach(x=>{if(!R.magicSchools.some(y=>y.toLowerCase()===x.toLowerCase()))out.push({level:'master',code:'unknown_magic',text:'Школа магии «'+x+'» отсутствует в справочнике — требуется решение Мастера.'})});
    troops.forEach(x=>{if(!R.troopTypes.some(y=>y.toLowerCase()===x.toLowerCase()))out.push({level:'master',code:'unknown_troop',text:'Род войск «'+x+'» отсутствует в справочнике — требуется решение Мастера.'})});
    if(lord.ancestralRace&&!R.races.some(x=>x.name===lord.ancestralRace))out.push({level:'master',code:'unknown_race',text:'Раса «'+lord.ancestralRace+'» отсутствует в справочнике — требуется решение Мастера.'});
    return out;
  }};
