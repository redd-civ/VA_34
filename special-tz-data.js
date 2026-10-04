// VA-34 special technical assignments (ТЗ) explicitly present in the source rules.
// No invented acquisition conditions or rewards are added here.
window.VA34_SPECIAL_TZ = [
  {
    id:"engineering-fortification",
    name:"Инженерное дело — укрепления",
    category:"technology_level",
    technology:"Инженерное дело",
    requiredLevel:1,
    effect:"+8 к защите мира; возможность возведения укреплений (1 э = 1.5 силы, лимит 3×размер осколка).",
    source:"Спец-ТЗ технологий — Инженерное дело — Базовый"
  },
  {
    id:"engineering-mines",
    name:"Инженерное дело — минирование",
    category:"technology_level",
    technology:"Инженерное дело",
    requiredLevel:3,
    effect:"Можно минировать свои и нейтральные осколки: бесплатно дополнительным действием или сильнее за до 5 э.",
    source:"Спец-ТЗ технологий — Инженерное дело — Экспертный"
  },
  {
    id:"engineering-building-limit",
    name:"Инженерное дело — расширение лимита построек",
    category:"technology_level",
    technology:"Инженерное дело",
    requiredLevel:4,
    effect:"Увеличение лимита построек на доход с 5 до 10.",
    source:"Спец-ТЗ технологий — Инженерное дело — Мастерский"
  },
  {
    id:"engineering-artificial-shard",
    name:"Инженерное дело — искусственный осколок",
    category:"technology_level",
    technology:"Инженерное дело",
    requiredLevel:5,
    effect:"Возможность создать дополнительным действием в составе мира один искусственный осколок.",
    source:"Спец-ТЗ технологий — Инженерное дело — Грандмастерский"
  },
  {
    id:"engineering-free-building",
    name:"Инженерное дело — бесплатное здание",
    category:"technology_level",
    technology:"Инженерное дело",
    requiredLevel:6,
    effect:"Возведение в ход 1 здания без затраты энергии и действия (стоимостью около 14–15 э).",
    source:"Спец-ТЗ технологий — Инженерное дело — Эпический"
  },
  {
    id:"war-training-ground",
    name:"Военное дело — тренировочные плацы",
    category:"technology_level",
    technology:"Военное дело",
    requiredLevel:1,
    effect:"Можно создавать тренировочные плацы раз в цикл вне лимита действий.",
    source:"Спец-ТЗ технологий — Военное дело — Базовый"
  },
  {
    id:"war-reattack",
    name:"Военное дело — повторная атака",
    category:"technology_level",
    technology:"Военное дело",
    requiredLevel:3,
    effect:"40% атаковавших и оставшихся гарнизоном войск можно послать в новую атаку.",
    source:"Спец-ТЗ технологий — Военное дело — Экспертный"
  },
  {
    id:"war-attack-action",
    name:"Военное дело — дополнительная атака",
    category:"technology_level",
    technology:"Военное дело",
    requiredLevel:4,
    effect:"+1 основное действие, которое можно потратить только на атаку.",
    source:"Спец-ТЗ технологий — Военное дело — Мастерский"
  },
  {
    id:"war-declared-war",
    name:"Военное дело — объявленная война",
    category:"technology_level",
    technology:"Военное дело",
    requiredLevel:6,
    effect:"Нападения на Владык с предварительным объявлением войны намного более эффективны.",
    source:"Спец-ТЗ технологий — Военное дело — Эпический"
  },
  {
    id:"water-tech-disable",
    name:"Отключение технологий водой",
    category:"special",
    school:"Вода",
    effect:"Отключение ТЗ магии воды стандартных технологий — 2 э за уровень; эпика — 10 э.",
    cost:{standardPerLevel:2,epic:10},
    source:"Прочее — ТЗ магии воды"
  },
  {
    id:"light-paradise",
    name:"Преобразование в рай",
    category:"special",
    school:"Священная (свет)",
    effect:"6 э за осколок; +1 дохода и настроение «Счастливое».",
    cost:{perShard:6},
    source:"Прочее — ТЗ света"
  },
  {
    id:"water-flooding",
    name:"Полузатопление осколка",
    category:"special",
    school:"Вода",
    effect:"Полузатопление осколка водой.",
    cost:{formula:"~2 э × размер осколка"},
    source:"Прочее — ТЗ воды"
  },
  {
    id:"shadow-light-drain",
    name:"Вытягивание света",
    category:"special",
    school:"Магия теней",
    effect:"+4 э за осколок; ухудшает боеспособность не видящих в темноте.",
    cost:{perShard:4},
    source:"Прочее — ТЗ магии теней"
  },
  {
    id:"artifact-mini-art",
    name:"Мини-артефакты",
    category:"special",
    technology:"Артефакторика",
    effect:"Новое свойство стоит стандартно 8 э; Т1 — 4 свойства, Т2 — 3 и т. д.",
    cost:{property:8},
    source:"Прочее — ТЗ артефакторики"
  },
  {
    id:"nature-fertility",
    name:"Плодородие",
    category:"special",
    school:"Природа",
    effect:"+3 к доходу на 3 хода.",
    cost:{fixed:5},
    source:"Прочее — ТЗ природы"
  }
];
