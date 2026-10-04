// VA-34 structured rule catalog.
// Only rules explicitly present in the current rules page are encoded here.
// Missing details are intentionally left out rather than invented.
window.VA34_RULES = {
  shardSizes: [
    {id:"tiny", name:"Крохотный", value:0.5},
    {id:"small", name:"Маленький", value:1},
    {id:"modest", name:"Небольшой", value:1.5},
    {id:"medium", name:"Средний", value:2},
    {id:"large", name:"Большой", value:3},
    {id:"huge", name:"Огромный", value:4},
    {id:"gigantic", name:"Гигантский", value:5},
    {id:"gargantuan", name:"Гаргантюозный", value:7}
  ],
  shardTypes:[
    {id:"ancestral",name:"Родовой"},
    {id:"ordinary",name:"Обычный"},
    {id:"source",name:"Источник"}
  ],
  moods:["Спокойное","Довольное","Счастливое","Недовольное","В ярости"],
  terrains:["Лес","Горы","Равнина","Болото","Город","Лавовый","Водный","Подземелье"],
  troopTypes:["Тяжёлая пехота","Лёгкая пехота","Стрелки","Кавалерия","Артиллерия","Инженеры","Разведчики"],
  magicSchools:["Волшебство","Ритуалистика","Магия призыва","Демонология","Некромантия","Магия теней","Магия света","Магия земли","Магия металла","Руны"],
  heroSkills:["Артефактолог","Исследователь","Инженер","Управляющий","Дипломат","Живучесть","Чемпион","Маг","Следопыт","Снайпер","Диверсант"],
  heroPerks:["Светлый страж","Светлый щит","Силач","Следопыт","Снайпер","Тёмный рыцарь","Тень смерти","Техноаура","Трюкач/диверсант"],
  technologies:["Инженерное дело","Военное дело","Кузнечное дело","Магия","Логистика","Разведка","Маскировка","Охрана порядка","Сельское хозяйство","Стрельба"],
  techLevels:[
    {id:"basic",name:"Базовый",rank:1},
    {id:"advanced",name:"Продвинутый",rank:2},
    {id:"expert",name:"Экспертный",rank:3},
    {id:"master",name:"Мастерский",rank:4},
    {id:"grandmaster",name:"Грандмастерский",rank:5},
    {id:"epic",name:"Эпичный",rank:6}
  ],
  constants:{
    defaultActions:4,
    defaultEnergyStorage:20,
    energyStoragePerShard:10,
    ancestralBuildingLimit:4,
    maxStartingTroopTypes:4,
    maxStartingMagicSchools:2,
    startingTechLevelsMin:4,
    startingTechLevelsMax:5,
    maxHeroSkills:6,
    maxHeroes:5,
    maxTechLevelsPerTurn:3,
    maxDifferentTechsPerTurn:3,
    maxTotalTechLevelsPerTurn:6
  }
};
