(() => {
  const R = window.VA34_RULES;
  if (!R) return;
  const esc = v => String(v ?? '').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const list = arr => '<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';

  const races = document.getElementById('races');
  if (races) races.innerHTML = '<h2>🧬 Расы</h2><p>Раса влияет на стоимость развития, свойства войск, доступные направления и дипломатию. Ниже — полный текущий справочник рас проекта; положительные и отрицательные особенности взяты из текущей базы правил и не заменяются догадками.</p><div class="catalog-grid">'+R.races.map(r => '<article class="catalog-card"><h3>'+esc(r.name)+'</h3><p><strong>Карма / мировоззрение:</strong> '+esc(r.alignment)+'</p><p><strong>Особенности:</strong></p>'+list(r.traits)+'<p><strong>Ограничения:</strong></p>'+list(r.limitations)+'</article>').join('')+'</div>';

  const troops = document.getElementById('troops');
  if (troops) troops.innerHTML = '<h2>🛡️ Рода войск</h2><p>Текущий справочник содержит следующие базовые рода войск:</p><div class="catalog-grid compact">'+R.troopTypes.map(x=>'<article class="catalog-card"><h3>🛡️ '+esc(x)+'</h3></article>').join('')+'</div><div class="notice">Отдельные числовые характеристики родов войск в опубликованном справочнике не заданы и поэтому здесь не добавляются.</div>';

  const resources = document.getElementById('resources');
  if (resources) resources.innerHTML = '<h2>💎 Ресурсы</h2><p>Ресурс — особый вид сырья. Его можно накапливать и организовывать поставки. По текущему правилу поставка может идти максимум двум Владыкам одновременно, включая хозяина ресурса.</p><div class="notice"><strong>Важно:</strong> отдельного фиксированного списка названий ресурсов в текущем справочнике правил нет. Поэтому инструмент позволяет Мастеру и игрокам указывать название и свойства ресурса свободным текстом, не придумывая официальный каталог.</div>';

  const magic = document.getElementById('magic');
  if (magic) magic.innerHTML = '<h2>🔮 Школы магии</h2><p>Школы магии развиваются теми же уровнями, что и технологии. На экспертном уровне и выше открываются специальные ТЗ.</p><div class="catalog-grid">'+R.magicSchools.map((x,i)=>'<article class="catalog-card"><h3>🔮 '+esc(x)+'</h3><p>Школа магии №'+(i+1)+'. Конкретные эффекты определяются уровнем школы и доступными правилами/специальными ТЗ.</p></article>').join('')+'</div>';

  const terrain = document.getElementById('terrain');
  if (terrain) terrain.innerHTML = '<h2>🌲 Ландшафт</h2><p>Ландшафт влияет на применение войск и условия боя. Текущий справочник содержит '+R.terrains.length+' базовых типов.</p><div class="catalog-grid compact">'+R.terrains.map(x=>'<article class="catalog-card"><h3>🌲 '+esc(x)+'</h3><p>Базовый тип местности.</p></article>').join('')+'</div>';

  const skills = document.getElementById('skills');
  if (skills) skills.innerHTML = '<h2>⚡ Навыки героев</h2><p>Максимум — 6 разных навыков. Для мирных навыков действуют специальные скидки: инженер и управляющий — 1 за уровень, исследователь — 0,5 за уровень. Один навык ориентировочно соответствует 1 энергии эффективности.</p><div class="catalog-grid compact">'+R.heroSkills.map(x=>'<article class="catalog-card"><h3>⚡ '+esc(x)+'</h3></article>').join('')+'</div>';

  const perks = document.getElementById('perks');
  if (perks) perks.innerHTML = '<h2>✨ Перки героев</h2><p>Перки — дополнительные особенности героя. Текущий справочник содержит следующие названия:</p><div class="catalog-grid compact">'+R.heroPerks.map(x=>'<article class="catalog-card"><h3>✨ '+esc(x)+'</h3></article>').join('')+'</div>';

  const tech = document.getElementById('tech');
  if (tech) {
    /*
     * ТЗ, привязанные к уровням технологий, показываются непосредственно
     * после описания соответствующей технологии. Источник не расширяем:
     * если для технологии ТЗ пока не перенесено, явно показываем это.
     */
    const levelNames = {1:'Базовый',2:'Продвинутый',3:'Экспертный',4:'Мастерский',5:'Грандмастерский',6:'Эпичный'};
    const technologyTZ = Array.isArray(window.VA34_SPECIAL_TZ)
      ? window.VA34_SPECIAL_TZ.filter(t => t && t.technology)
      : [];
    const byTechnology = {};
    technologyTZ.forEach(t => {
      const key = String(t.technology);
      (byTechnology[key] ||= []).push(t);
    });
    const tzHtml = name => {
      const rows = byTechnology[name] || [];
      if (!rows.length) {
        return '<details class="tech-tz"><summary>ТЗ технологии</summary><div class="notice">В текущем перенесённом каталоге отдельные ТЗ для этой технологии пока не заданы. Новые правила не добавляются предположительно.</div></details>';
      }
      const body = rows.map(t => {
        const level = Number(t.requiredLevel);
        const levelLabel = levelNames[level] || (t.requiredLevel ? String(t.requiredLevel) : 'Без уровня');
        const cost = t.cost ? '<p><strong>Стоимость:</strong> '+esc(JSON.stringify(t.cost))+'</p>' : '';
        const roman = level >= 1 && level <= 6 ? ['I','II','III','IV','V','VI'][level-1] : '';
        return '<article class="catalog-card"><h4>'+esc(t.name)+'</h4><p><strong>Уровень:</strong> '+esc(levelLabel)+(roman ? ' ('+roman+')' : '')+'</p><p><strong>Эффект:</strong> '+esc(t.effect||'—')+'</p>'+cost+'<p class="muted"><strong>Источник:</strong> '+esc(t.source||'исходные правила')+'</p></article>';
      }).join('');
      return '<details class="tech-tz"><summary>ТЗ технологии ('+rows.length+')</summary><div class="catalog-grid compact">'+body+'</div></details>';
    };
    tech.innerHTML = '<h2>⚙️ Технологии</h2><p>Технологии развиваются по уровням: базовый → продвинутый → экспертный → мастерский → грандмастерский → эпичный. За ход можно развить не более 3 уровней одной технологии, не более 3 разных технологий и не более 6 уровней суммарно.</p><div class="catalog-grid">'+R.technologies.map(x=>'<article class="catalog-card"><h3>⚙ '+esc(x)+'</h3><p>'+esc(R.technologyNotes[x] || 'Направление присутствует в официальном справочнике технологий. Отдельного числового эффекта в текущем источнике не задано; его не выдумываем.')+'</p>'+tzHtml(x)+'</article>').join('')+'</div>';
  }

  const levels = document.getElementById('techlevels');
  if (levels) levels.innerHTML += '<h3>Полная шкала уровней</h3><table><tr><th>Уровень</th><th>Ранг</th><th>Статус</th></tr>'+R.techLevels.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.rank+'</td><td>'+(x.rank===6?'Эпичный: требуется специальное ТЗ или решение Мастера.':'Обычный уровень развития')+'</td></tr>').join('')+'</table>';

  const hero = document.getElementById('heroes');
  if (hero) hero.innerHTML += '<div class="notice"><strong>Витязи:</strong> ближайшие помощники героев. Они не прокачиваются и при гибели погибают навсегда; лимита на их количество правила не задают. Герой и витязь не могут участвовать более чем в одном действии за пределами мира за ход.</div>';

  const general = document.getElementById('general');
  if (general) general.innerHTML += '<h3>📚 Справочник данных</h3><p>Кабинет игрока использует те же справочники рас, родов войск, магии, ландшафтов, навыков, перков и технологий, что и эта страница. Неизвестные или индивидуальные элементы можно оставить на согласование Мастеру.</p>';

  const special = document.getElementById('special-tz');
  if (special && Array.isArray(window.VA34_SPECIAL_TZ)) {
    const otherTZ = window.VA34_SPECIAL_TZ.filter(t => !t.technology);
    special.innerHTML = '<h2>🧩 Прочие специальные ТЗ</h2><p>Технологические ТЗ перенесены непосредственно в карточки соответствующих технологий. Здесь остаются только ТЗ, не привязанные к технологии.</p><div class="catalog-grid">'+otherTZ.map(t=>'<article class="catalog-card"><h3>'+esc(t.name)+'</h3><p><strong>Требование:</strong> '+esc(t.requiredLevel ? ("уровень "+t.requiredLevel+" / "+(["I","II","III","IV","V","VI"][(+t.requiredLevel||1)-1]||t.requiredLevel)) : "отдельное специальное ТЗ")+'</p><p><strong>Эффект:</strong> '+esc(t.effect)+'</p>'+(t.cost?'<p><strong>Стоимость:</strong> '+esc(JSON.stringify(t.cost))+'</p>':'')+'<p class="muted"><strong>Источник:</strong> '+esc(t.source||'исходные правила')+'</p></article>').join('')+'</div>';
  }
  const shard = document.getElementById('shard');
  if (shard) shard.innerHTML = '<h2>🏝️ Осколок</h2><table><tr><th>Размер</th><th>Значение</th></tr>'+R.shardSizes.map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+s.value+'</td></tr>').join('')+'</table><p><strong>Типы:</strong> '+R.shardTypes.map(s=>esc(s.name)).join(', ')+'.</p><p><strong>Настроения:</strong> '+R.moods.map(esc).join(', ')+'.</p><ul><li>Лимит зданий: floor(размер); родовой — 4.</li><li>Хранение энергии: 20 э + 10 э за осколок.</li><li>Новый контент начинает действовать со следующего хода.</li></ul>';
  const source = document.getElementById('source');
  if (source) source.innerHTML = '<h2>💠 Источник</h2><ul><li>Сохраняется после захвата и продолжает давать преимущества.</li><li>Сила определяется гарнизоном.</li><li>Гарнизон уменьшается на 1 каждый ход, минимум до 1.</li><li>Защита обычного мира на источник не распространяется.</li><li>Источник можно захватить или уничтожить.</li></ul>';
  const mechanics = document.getElementById('mechanics');
  if (mechanics) {
    const fmt = v => esc(typeof v === 'object' ? JSON.stringify(v) : v);
    const techRows = R.technologyCosts ? [
      ['Профильная', R.technologyCosts.profile],
      ['Непрофильная', R.technologyCosts.nonProfile],
      ['Очень непрофильная', R.technologyCosts.veryNonProfile]
    ].map(([name,c]) => '<tr><td>'+esc(name)+'</td><td>'+fmt(c.basic)+'</td><td>'+fmt(c.advanced)+'</td><td>'+fmt(c.expert)+'</td><td>'+fmt(c.master)+'</td><td>'+fmt(c.grandmaster)+'</td><td>'+fmt(c.epic)+'</td></tr>').join('') : '';
    mechanics.innerHTML += '<h3>📐 Структурированный справочник механик</h3>' +
      '<table><tr><th>Параметр</th><th>Значение</th></tr>' +
      '<tr><td>Базовый запас энергии</td><td>'+fmt(R.constants?.defaultEnergyStorage)+'</td></tr>' +
      '<tr><td>Прирост хранения за осколок</td><td>'+fmt(R.constants?.energyStoragePerShard)+'</td></tr>' +
      '<tr><td>Минимум после скидки</td><td>'+fmt(R.technologyCosts?.minimumAfterDiscount)+'</td></tr>' +
      '<tr><td>Макс. родов войск на старте</td><td>'+fmt(R.constants?.maxStartingTroopTypes)+'</td></tr>' +
      '<tr><td>Макс. школ магии на старте</td><td>'+fmt(R.constants?.maxStartingMagicSchools)+'</td></tr>' +
      '<tr><td>Стартовое развитие</td><td>'+fmt(R.constants?.startingTechLevelsMin)+'–'+fmt(R.constants?.startingTechLevelsMax)+' уровней</td></tr>' +
      '<tr><td>Макс. героев</td><td>'+fmt(R.heroRules?.maxHeroes)+'</td></tr>' +
      '<tr><td>Макс. навыков героя</td><td>'+fmt(R.constants?.maxHeroSkills)+'</td></tr>' +
      '<tr><td>Действий по умолчанию</td><td>'+fmt(R.constants?.defaultActions)+'</td></tr>' +
      '<tr><td>Макс. уровней одной технологии за ход</td><td>'+fmt(R.constants?.maxTechLevelsPerTurn)+'</td></tr>' +
      '<tr><td>Макс. разных технологий за ход</td><td>'+fmt(R.constants?.maxDifferentTechsPerTurn)+'</td></tr>' +
      '<tr><td>Макс. уровней развития за ход</td><td>'+fmt(R.constants?.maxTotalTechLevelsPerTurn)+'</td></tr>' +
      '<tr><td>Макс. стартовых осколков</td><td>'+fmt(R.constants?.maxStartingShards)+'</td></tr>' +
      '<tr><td>Макс. стартовых героев</td><td>'+fmt(R.constants?.maxStartingHeroes)+'</td></tr>' +
      '<tr><td>Стартовых родовых осколков</td><td>ровно 1</td></tr>' +
      '<tr><td>Гарнизон осколка</td><td>не выше снабжения</td></tr>' +
      '<tr><td>Лимит зданий обычного осколка</td><td>floor(размер)</td></tr>' +
      '<tr><td>Лимит зданий родового осколка</td><td>'+fmt(R.constants?.ancestralBuildingLimit)+'</td></tr>' +
      '<tr><td>Эффективный лимит энергии магии</td><td>'+fmt(R.constants?.effectiveMagicEnergyCap)+'</td></tr>' +
      '<tr><td>Большая логистика: первое действие</td><td>'+fmt(R.logistics?.large?.firstCost)+' э</td></tr>' +
      '<tr><td>Большая логистика: рост цены</td><td>+'+fmt(R.logistics?.large?.nextIncrease)+' э</td></tr>' +
      '<tr><td>Малая логистика: первое действие</td><td>'+fmt(R.logistics?.small?.firstCost)+' э</td></tr>' +
      '<tr><td>Малая логистика: рост цены</td><td>+'+fmt(R.logistics?.small?.nextIncrease)+' э</td></tr>' +
      '<tr><td>Логистика: технический максимум основных</td><td>'+fmt(R.actionRules?.logisticsMainMax)+'</td></tr>' +
      '<tr><td>Логистика: технический максимум дополнительных</td><td>'+fmt(R.actionRules?.logisticsExtraMax)+'</td></tr>' +
      '<tr><td>Бонус отказа от рода войск</td><td>до +'+fmt(R.refusalBonuses?.maxIncomeBonusPerTroopRefusal)+' дохода за отказ; учитывается до +'+fmt(R.refusalBonuses?.maxIncomeBonusFromTroopRefusals)+' от отказов</td></tr>' +
      '<tr><td>Общий максимум бонуса отказа</td><td>до +'+fmt(R.refusalBonuses?.maxIncomeBonus)+' дохода</td></tr>' +
      '<tr><td>Защита мира (структурированный источник)</td><td>'+fmt(R.worldRules?.defenseEnergyRatio)+'</td></tr>' +
      '<tr><td>Колонизация маленького осколка</td><td>'+fmt(R.worldRules?.colonization?.small)+'</td></tr>' +
      '<tr><td>Каждый следующий размер колонизации</td><td>+'+fmt(R.worldRules?.colonization?.perSizeAfterSmall)+'</td></tr>' +
      '</table>' +
      '<h3>⚙️ Стоимость развития по структурированному справочнику</h3>' +
      '<table><tr><th>Профиль</th><th>I</th><th>II</th><th>III</th><th>IV</th><th>V</th><th>VI</th></tr>'+techRows+'</table>' +
      '<div class="notice"><strong>Расхождения источников сохраняются:</strong> старый текст правил и структурированный справочник имеют разные значения для стоимости технологий, логистики, призыва героев и защиты мира. Каталог не подменяет решение Мастера.</div>';
  }

  const world = document.getElementById('world');
  if (world) world.innerHTML += '<h3>🌍 Структура мира</h3><ul><li>Мир состоит из осколков.</li><li>Доход мира складывается из доходов его осколков.</li><li>На осколке учитываются размер, доход, здания, население, настроение, гарнизон, снабжение, укрепления, ресурсы и другие заданные правилами параметры.</li><li>Новый контент начинает действовать со следующего хода.</li></ul><p class="notice">Полного числового каталога зданий, ресурсов и всех модификаторов в источниках нет; поэтому энциклопедия не подставляет значения от себя.</p>';

  const ancestral = document.getElementById('ancestral');
  if (ancestral) ancestral.innerHTML += '<h3>👑 Родовой осколок</h3><ul><li>В стартовом состоянии должен быть ровно один родовой осколок.</li><li>Лимит зданий родового осколка — 4.</li><li>Для гарнизона действует общее ограничение: гарнизон не может превышать снабжение.</li><li>Родовой осколок входит в число осколков, учитываемых при расчёте хранения энергии.</li></ul>';

  const actions = document.getElementById('actions');
  if (actions) actions.innerHTML += '<h3>📜 Режимы действий</h3><table><tr><th>Режим</th><th>Основные</th><th>Дополнительные</th></tr>'+R.actionModes.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.main+'</td><td>'+x.extra+'</td></tr>').join('')+'</table><ul><li>Основное действие можно превратить в дополнительное.</li><li>Дополнительное нельзя превратить в основное.</li><li>Мелкие действия не занимают лимит.</li><li>Логистика может увеличить доступное число действий в пределах заданных технических максимумов.</li></ul>';

  const mainActions = document.getElementById('mainactions');
  if (mainActions) mainActions.innerHTML += '<h3>⚔️ Ограничения основных действий</h3><ul><li>Без логистики доступно не более 2 основных действий.</li><li>Основное действие может быть использовано как дополнительное.</li><li>Общие правила допускают специальные ТЗ, способные дать дополнительные возможности.</li></ul><p class="notice">Полного единого перечня всех основных действий с числовой стоимостью в структурированном справочнике нет.</p>';

  const extraActions = document.getElementById('extraactions');
  if (extraActions) extraActions.innerHTML += '<h3>➕ Ограничения дополнительных действий</h3><ul><li>Без логистики доступно не более 5 дополнительных действий.</li><li>Мелкие действия бесплатны и не занимают лимит.</li><li>Некоторые специальные ТЗ прямо используют дополнительное действие.</li></ul><p class="notice">Для действий, у которых в источниках не задана числовая стоимость или точная формула, значение здесь не придумывается.</p>';

  const heroes = document.getElementById('heroes');
  if (heroes) heroes.innerHTML += '<h3>🎭 Ограничения героев</h3><ul><li>Максимум — 5 героев.</li><li>Рекомендуется 2 стартовых навыка.</li><li>Максимум — 6 разных навыков.</li><li>Неодиночный герой имеет максимум 30 уровень.</li><li>Каждые 10 уровней дают звание и бонус.</li><li>Герой вне мира может участвовать не более чем в одном действии за ход.</li><li>При гибели герой теряет опыт и воскресает в конце цикла.</li><li>Витязь при гибели погибает навсегда.</li><li>Усталость и ранения восстанавливаются в конце хода.</li><li>Технологии влияют на войска, но не на героев и витязей.</li></ul><h3>💰 Найм и призыв</h3><ul><li>Найм: базовая стоимость 10 э; последующие наймы увеличивают цену на 5 э; максимум 30 э.</li><li>При максимальной стоимости найма допускается 3 навыка.</li><li>Формула призыва героя из структурированного справочника: первый призыв 12 э, следующая стоимость умножается на 2.</li></ul><p class="notice">Текстовая страница и структурированный справочник расходятся по формуле призыва; конфликт сохранён отдельно и не скрыт.</p>';

  const diplo = document.getElementById('diplo');
  if (diplo) diplo.innerHTML += '<h3>🤝 Посольства и обмены</h3><ul><li>Посольства могут обмениваться одной технологией за ход.</li><li>Каждая сторона оплачивает 50% базовой стоимости передаваемой технологии.</li><li>Одновременно допускается максимум 3 посольства, если правилами не расширен лимит.</li><li>Владыка не может принять или предложить более одной технологии за ход.</li><li>Обмен энергией и трофеями проводится через посланника как основное действие или на встрече на осколке.</li><li>Собственные осколки можно разделять и делать нейтральными.</li></ul>';

  const order = document.getElementById('order');
  if (order) order.innerHTML += '<h3>🔄 Полный порядок хода</h3><ol>'+R.turnPhases.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><p class="notice">Порядок фиксирован в структурированном справочнике; отдельные подпункты фаз не расширяются предположениями.</p>';

  const victory = document.getElementById('victory');
  if (victory) victory.innerHTML = '<h2>🏆 Критерий победы</h2><ul><li>Побеждает Владыка с наибольшим размером мира к концу игры.</li><li>Стандартная игра длится до конца 30-го хода включительно.</li></ul>';
})();