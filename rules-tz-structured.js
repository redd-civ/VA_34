/*
 * ВА-34: структурирование раздела «Уровни ТЗ».
 * Источник остаётся rules-source-data.js; этот слой только выделяет блоки
 * по фактическим заголовкам исходного PDF и раскладывает их по категориям.
 * Текст блоков не редактируется и не дополняется.
 */
(() => {
  const source = typeof window.VA34_RULES_SOURCE === 'string' ? window.VA34_RULES_SOURCE : '';
  if (!source) return;

  const lines = source.split(/\n/);
  const start = lines.findIndex(x => x.trim() === 'Уровни ТЗ');
  const end = lines.findIndex((x, i) => i > start && x.trim() === 'Допцифры к ТЗ');
  if (start < 0 || end < 0) return;

  const headingDefs = [
    ['Сельское хозяйство - пассивно бонусный доход +1/1.5/2/3/4 на','tech'],
    ['Экономика - пассивно бонусный доход +1/1.5/2/3/4','tech'],
    ['Дипломатия - пассивно плюс к переговорам','tech'],
    ['Кузнечное дело (металлургия) -','tech'],
    ['Инженерное дело - пассивно удешевление построек - 1 на','tech'],
    ['Военное дело - пассивно плюс в бою','tech'],
    ['Артефактология/Артефакторика -','tech'],
    ['Разведка -','tech'],['Маскировка -','tech'],['Шпионаж -','tech'],
    ['Демонология - пассивно больше э за жертвы населения, чем без','magic'],
    ['Техномагия - пассивно усиление механических и волшебных','magic'],
    ['Колдовство','magic'],['Магия разума','magic'],['Магия иллюзий','magic'],
    ['Магия земли','magic'],['Магия природы','magic'],['Биомантия (бионика)','magic'],
    ['Магия воздуха','magic'],['Ритуалистика','magic'],['Волшебство','magic'],
    ['Магия огня','magic'],['Магия воды','magic'],['Магия льда','magic'],
    ['Магия света (священная)','magic'],
    ['Магия призыва - призванные существа сильны и остаются после','magic'],
    ['Некромантия','magic'],['Магия теней (тьмы)','magic'],['Чума','magic'],
    ['Магия крови - сильнее прочих школ магии, но с побочными','magic'],
    ['Разрушение –','magic'],['Рунная магия – перманентное изменение свойств предметов,','magic'],
    ['Поглощение - можно перенять неограниченное количество видов','magic'],
    ['Контрразведка – эффективно контрит шпионаж, разведку и','tech'],
    ['Антимагия – эффективно контрит магию уровнем на 1 выше','magic'],
    ['Магия войны','magic'],['Магия металла','magic'],['Шаманизм','magic'],
    ['Инквизиторская магия','magic'],
    ['Пропаганда - пассивно немного ослабляет шпионаж и повышает','tech'],
    ['Солнечная магия','magic'],['Астральная магия','magic'],
    ['Ваагх - на выбор положительное событие в своем мире или','magic'],
    ['Огнестрел - на старте что-то типа аркебуз и пистолей.','tech'],
    ['Кораблестроение - на старте что-то типа античных галер','tech'],
    ['Магия порталов','magic'],
    ['Энерговооружение - пассивно повышается дальнобойность и','tech'],
    ['Энергощиты','tech'],['Кристалломантия (пассивно укрепляет Кристаллинов)','tech'],
    ['Контрабанда - пассивно растет защита и сложность обнаружения','tech'],
    ['Благословенная магия - чисто про бафы и помощь:','magic'],
    ['Астромантия - конкретно для мира каджитов придумана виверном','special'],
    ['Алхимия - гибкие и сильные эффекты. Слабые зелья требуют','tech'],
    ['Целебные травы - непрокачиваемая технология, зависящая от','special'],
    ['Скальдическая поэзия - придумана Спелл для ульфенов','special'],
    ['Химия - вспомогательная технология для хайтека','tech'],
    ['Роботизация - доступна высокотехнологичным мирам','tech'],
    ['Расценки кредитов и вкладов экономики','special'],['Призыв осколков','special'],
    ['Клонирование','special'],['Торговля','special'],['Щиты','special']
  ];

  const normalize = s => String(s).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const findExact = title => {
    const target = normalize(title);
    const i = lines.findIndex((line, n) => n > start && n < end && normalize(line) === target);
    if (i < 0) throw new Error('Не найден заголовок ТЗ: '+title);
    return i;
  };

  const points = headingDefs.map(([title, category]) => ({title, category, index:findExact(title)}));
  points.sort((a,b) => a.index-b.index);

  const blocks = points.map((p,i) => {
    const stop = i+1 < points.length ? points[i+1].index : end;
    return {
      title: p.title,
      category: p.category,
      sourceStartLine: p.index + 1,
      sourceEndLine: stop,
      text: lines.slice(p.index, stop).join('\n').trim()
    };
  });

  const intro = lines.slice(start, points[0].index).join('\n').trim();
  const categoryOrder = {tech:0, magic:1, special:2};
  const ordered = [...blocks].sort((a,b) => categoryOrder[a.category]-categoryOrder[b.category] || a.sourceStartLine-b.sourceStartLine);

  window.VA34_TZ_STRUCTURED = {
    intro,
    blocks: ordered,
    validation: {
      sourceRange: [start + 1, end + 1],
      blockCount: ordered.length,
      categories: ['tech','magic','special']
    }
  };
})();
