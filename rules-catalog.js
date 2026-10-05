(() => {
  const R = window.VA34_RULES;
  if (!R) return;
  const esc = v => String(v ?? '').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const list = arr => '<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';

  const races = document.getElementById('races');
  if (races) races.innerHTML = '<h2>🧬 Расы</h2><p>Раса влияет на стоимость развития, свойства войск, доступные направления и дипломатию. Ниже — полный текущий справочник рас проекта; положительные и отрицательные особенности взяты из текущей базы правил и не заменяются догадками.</p><div class="catalog-grid">'+R.races.map(r => '<article class="catalog-card"><h3>'+esc(r.name)+'</h3><p><strong>Карма / мировоззрение:</strong> '+esc(r.alignment)+'</p><p><strong>Особенности:</strong></p>'+list(r.traits)+'<p><strong>Ограничения:</strong></p>'+list(r.limitations)+'</article>').join('')+'</div>';

  const troops = document.getElementById('troops');
  if (troops) troops.innerHTML = '<h2>🛡️ Рода войск</h2><p>Базовый справочник содержит '+R.troopTypes.length+' рода войск. Конкретная эффективность зависит от расы, технологий, магии, ландшафта и условий действия.</p><div class="catalog-grid">'+R.troopTypes.map((x,i)=>'<article class="catalog-card"><h3>'+esc(x)+'</h3><p>Базовый род войск №'+(i+1)+'. Развитие и применение уточняются соответствующими технологиями и правилами кампании.</p></article>').join('')+'</div>';

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
  if (tech) tech.innerHTML = '<h2>⚙️ Технологии</h2><p>Технологии развиваются по уровням: базовый → продвинутый → экспертный → мастерский → грандмастерский → эпичный. За ход можно развить не более 3 уровней одной технологии, не более 3 разных технологий и не более 6 уровней суммарно.</p><div class="catalog-grid">'+R.technologies.map(x=>'<article class="catalog-card"><h3>⚙ '+esc(x)+'</h3><p>'+esc(R.technologyNotes[x] || 'Направление присутствует в официальном справочнике технологий. Отдельного числового эффекта в текущем источнике не задано; его не выдумываем.')+'</p></article>').join('')+'</div>';

  const levels = document.getElementById('techlevels');
  if (levels) levels.innerHTML += '<h3>Полная шкала уровней</h3><table><tr><th>Уровень</th><th>Ранг</th><th>Статус</th></tr>'+R.techLevels.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.rank+'</td><td>'+(x.rank===6?'Эпичный: требуется специальное ТЗ или решение Мастера.':'Обычный уровень развития')+'</td></tr>').join('')+'</table>';

  const hero = document.getElementById('heroes');
  if (hero) hero.innerHTML += '<div class="notice"><strong>Витязи:</strong> ближайшие помощники героев. Они не прокачиваются и при гибели погибают навсегда; лимита на их количество правила не задают. Герой и витязь не могут участвовать более чем в одном действии за пределами мира за ход.</div>';

  const general = document.getElementById('general');
  if (general) general.innerHTML += '<h3>📚 Справочник данных</h3><p>Кабинет игрока использует те же справочники рас, родов войск, магии, ландшафтов, навыков, перков и технологий, что и эта страница. Неизвестные или индивидуальные элементы можно оставить на согласование Мастеру.</p>';
})();