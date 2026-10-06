(() => {
  const R = window.VA34_RULES;
  if (!R) return;
  const esc = v => String(v ?? '').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const list = arr => '<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';

  const races = document.getElementById('races');
  if (races) {
    const rawRaceSource = window.VA34_RULES_SOURCE ? String(window.VA34_RULES_SOURCE).replace(/\\\\n/g,'\\n') : '';
    const raceSourceStart = rawRaceSource.indexOf('Вдохновение Астрала. Расы');
    const raceSourceEnd = rawRaceSource.indexOf('Список родов войск', raceSourceStart);
    const raceSource = raceSourceStart >= 0
      ? rawRaceSource.slice(raceSourceStart, raceSourceEnd > raceSourceStart ? raceSourceEnd : rawRaceSource.length)
      : '';
    const raceBlock = name => {
      if (!raceSource) return '';
      const pos = raceSource.indexOf('\\n'+String(name)+'\\n');
      if (pos < 0) return '';
      const start = pos + 1;
      let end = raceSource.length;
      R.races.forEach(other => {
        if (other.name === name) return;
        const p = raceSource.indexOf('\\n'+String(other.name)+'\\n', start);
        if (p >= 0 && p < end) end = p;
      });
      return raceSource.slice(start, end).trim();
    };
    const cards = R.races.map(r => {
      const block = raceBlock(r.name);
      return '<article class="catalog-card"><h3>🧬 '+esc(r.name)+'</h3>'+
        (block ? '<details><summary>Описание и свойства из исходного файла</summary><pre class="race-source">'+esc(block)+'</pre></details>' : '<p class="notice">Запись есть в источнике, но автоматическое извлечение блока не удалось.</p>')+
        '</article>';
    }).join('');
    races.innerHTML = '<h2>🧬 Расы</h2><p>Проверено по библиотечному файлу «компиляция ВА34.pdf». В справочник внесены только расы и подвиды, реально присутствующие в источнике. Текст свойств не пересказывается и не дополняется предположениями.</p><div class="catalog-grid">'+cards+'</div>';
  };

  const iconFor = (name, category='') => {
    const n = String(name || '').toLocaleLowerCase('ru-RU');
    if (category === 'troop') {
      if (n.includes('тяжёл')) return '🛡️';
      if (n.includes('лёгк') || n.includes('пехот')) return '⚔️';
      if (n.includes('кавалер')) return '🐎';
      if (n.includes('стрел')) return '🏹';
      if (n.includes('маг')) return '🧙';
      if (n.includes('летун')) return '🪽';
      if (n.includes('монстр')) return '🐉';
      if (n.includes('артиллер')) return '💥';
      return '⚔️';
    }
    if (category === 'magic') {
      if (n.includes('огн') || n.includes('солнеч')) return '🔥';
      if (n.includes('вод') || n.includes('лёд')) return '❄️';
      if (n.includes('воздух')) return '🌪️';
      if (n.includes('земл')) return '🪨';
      if (n.includes('свет') || n.includes('свящ') || n.includes('благослов')) return '☀️';
      if (n.includes('призыв')) return '🌀';
      if (n.includes('некром') || n.includes('тен') || n.includes('чум')) return '☠️';
      if (n.includes('кров')) return '🩸';
      if (n.includes('природ') || n.includes('биомант')) return '🌿';
      if (n.includes('рун')) return '🔯';
      if (n.includes('портал')) return '🌀';
      if (n.includes('техном')) return '⚡';
      if (n.includes('металл')) return '🔩';
      if (n.includes('разум') || n.includes('иллюз')) return '🧠';
      if (n.includes('войн')) return '⚔️';
      if (n.includes('разруш')) return '💥';
      if (n.includes('демон')) return '😈';
      if (n.includes('ритуал')) return '🕯️';
      if (n.includes('астрал')) return '✨';
      return '🔮';
    }
    if (category === 'tech') {
      if (n.includes('сельск') || n.includes('ферм')) return '🌾';
      if (n.includes('эконом')) return '💰';
      if (n.includes('дипломат')) return '🤝';
      if (n.includes('кузне') || n.includes('металл')) return '⚒️';
      if (n.includes('инженер')) return '🛠️';
      if (n.includes('военн')) return '⚔️';
      if (n.includes('артефакт')) return '💎';
      if (n.includes('развед')) return '🔭';
      if (n.includes('маскиров')) return '🫥';
      if (n.includes('шпионаж') || n.includes('контрразвед')) return '🕵️';
      if (n.includes('пропаганд')) return '📣';
      if (n.includes('огнестрел')) return '🔫';
      if (n.includes('кораблестро')) return '⛵';
      if (n.includes('энерговооруж')) return '⚡';
      if (n.includes('энергощит') || n === 'щиты') return '🛡️';
      if (n.includes('кристалломант')) return '💠';
      if (n.includes('контрабанд')) return '🧳';
      if (n.includes('алхим')) return '⚗️';
      if (n.includes('хими')) return '🧪';
      if (n.includes('робот')) return '🤖';
      if (n.includes('торгов')) return '🪙';
      if (n.includes('клониров')) return '🧬';
      return '⚙️';
    }
    if (category === 'terrain') {
      if (n.includes('лес')) return '🌲';
      if (n.includes('гор') || n.includes('скал')) return '⛰️';
      if (n.includes('пустын')) return '🏜️';
      if (n.includes('болот')) return '🐊';
      if (n.includes('равнин') || n.includes('степ')) return '🌾';
      if (n.includes('тундр') || n.includes('снег') || n.includes('лед')) return '❄️';
      if (n.includes('вулкан') || n.includes('лав')) return '🌋';
      if (n.includes('море') || n.includes('океан') || n.includes('вод')) return '🌊';
      if (n.includes('город')) return '🏙️';
      return '🗺️';
    }
    if (category === 'skill') return n.includes('бо') || n.includes('военн') ? '⚔️' : n.includes('маг') ? '🔮' : n.includes('диплом') ? '🤝' : '🎯';
    if (category === 'perk') return n.includes('защит') ? '🛡️' : n.includes('атак') || n.includes('урон') ? '⚔️' : n.includes('маг') ? '🔮' : '✨';
    if (category === 'race') {
      if (n.includes('ангел') || n.includes('сераф')) return '👼';
      if (n.includes('демон') || n.includes('бес') || n.includes('черт') || n.includes('суккуб')) return '😈';
      if (n.includes('дракон')) return '🐉';
      if (n.includes('эльф')) return '🧝';
      if (n.includes('гном') || n.includes('дварф')) return '⛏️';
      if (n.includes('орк')) return '👹';
      if (n.includes('гоблин')) return '👺';
      if (n.includes('нежить') || n.includes('зомби') || n.includes('скелет') || n.includes('лич') || n.includes('вампир')) return '☠️';
      if (n.includes('гигант') || n.includes('великан') || n.includes('титан')) return '🗿';
      if (n.includes('фе') || n.includes('пикси') || n.includes('нимф') || n.includes('дриад')) return '🧚';
      if (n.includes('элементал')) return '🌟';
      if (n.includes('кры')) return '🐀';
      if (n.includes('тролл') || n.includes('йети')) return '👣';
      if (n.includes('джин') || n.includes('ифрит') || n.includes('марид')) return '🧞';
      if (n.includes('кицун') || n.includes('лиса')) return '🦊';
      if (n.includes('танук')) return '🦝';
      if (n.includes('тенг')) return '🪽';
      if (n.includes('сатир')) return '🐐';
      if (n.includes('человек') || n === 'люди') return '🧑';
      return '🧬';
    }
    return '◆';
  };

  window.VA34_ICON_FOR = iconFor;

  const troops = document.getElementById('troops');
  if (troops) {
    /*
     * Оформление повторяет карточки войск со страницы Таминара:
     * тип -> описание -> отдельные блоки преимуществ/недостатков.
     * Содержимое берётся только из явно указанного в источнике текста.
     */
    const troopRules = [
      {name:'Лёгкая пехота', type:'Базовый род', pos:'Бонус на пересечённой местности и в городских условиях; наиболее многочисленна.', neg:'Не указан в источнике.'},
      {name:'Тяжёлая пехота', type:'Базовый род', pos:'Бонус против лёгкой пехоты и кавалерии.', neg:'Не указан в источнике.'},
      {name:'Кавалерия', type:'Базовый род', pos:'Бонус против стрелков и магов.', neg:'Не указан в источнике.'},
      {name:'Стрелки', type:'Базовый род', pos:'Бонус против летунов, монстров и лёгкой пехоты.', neg:'Не указан в источнике.'},
      {name:'Маги', type:'Базовый род', pos:'Сильны против всех и усиливаются по мере прокачки соответствующей школы.', neg:'Уязвимы, особенно если их подловили без маны или во время сотворения чар.'},
      {name:'Летуны', type:'Базовый род', pos:'Бонус против магов и артиллерии.', neg:'Не указан в источнике.'},
      {name:'Монстры', type:'Базовый род', pos:'Зависит от конкретного монстра; как правило, бонус против пехоты и/или кавалерии.', neg:'Зависит от конкретного монстра; универсальный недостаток не задан.'},
      {name:'Артиллерия', type:'Базовый род', pos:'Бонус против укреплений, монстров, стрелков и пехоты.', neg:'Не указан в источнике.'}
    ];
    const troopCard = t =>
      '<article class="troop-card catalog-card">'+
      '<h3>'+iconFor(t.name,'troop')+' '+esc(t.name)+'</h3>'+
      '<p class="troop-type">'+esc(t.type)+'</p>'+
      '<div class="troop-traits">'+
        '<div class="troop-trait troop-trait-pos"><div class="troop-trait-title">▲ Преимущества</div><div>'+esc(t.pos)+'</div></div>'+
        '<div class="troop-trait troop-trait-neg"><div class="troop-trait-title">▼ Недостатки</div><div>'+esc(t.neg)+'</div></div>'+
      '</div>'+
      '</article>';
    troops.innerHTML =
      '<h2>🛡️ Рода войск</h2>'+
      '<p>Основные рода войск оформлены отдельными карточками. Для каждого отдельно показаны преимущества и недостатки, но только те, которые прямо следуют из исходных правил.</p>'+
      '<div class="troop-list">'+troopRules.map(troopCard).join('')+'</div>'+
      '<div class="notice"><strong>Правило создания войска:</strong> при описании конкретного войска нужно указать его род, преимущества и недостатки. Поддержка без прикрытия основными войсками крайне уязвима; гибриды на старте либо не допускаются, либо будут ослаблены.</div>';
  }

  const resources = document.getElementById('resources');
  if (resources) resources.innerHTML = '<h2>💎 Ресурсы</h2><p>Ресурс — особый вид сырья. Его можно накапливать и организовывать поставки. По текущему правилу поставка может идти максимум двум Владыкам одновременно, включая хозяина ресурса.</p><div class="notice"><strong>Важно:</strong> отдельного фиксированного списка названий ресурсов в текущем справочнике правил нет. Поэтому инструмент позволяет Мастеру и игрокам указывать название и свойства ресурса свободным текстом, не придумывая официальный каталог.</div>';

  const source = document.getElementById('source-rules');
  if (source && window.VA34_RULES_SOURCE) {
    const raw = String(window.VA34_RULES_SOURCE);
    const lines = raw.split(/\\n/);
    const escHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    source.innerHTML = '<h2>📚 Полный свод правил из файла «компиляция ВА34.pdf»</h2>'+
      '<p>Ниже приведено всё содержимое файла правил, доступного в библиотеке на момент заполнения энциклопедии. Текст не сокращается и не дополняется предположениями.</p>'+
      '<div class="rule-source"><pre>'+lines.map(escHtml).join('\\n')+'</pre></div>';
  }

  const magic = document.getElementById('magic');
  if (magic) {
    const legacyMagicTZ = Array.isArray(window.VA34_SPECIAL_TZ)
      ? window.VA34_SPECIAL_TZ.filter(t => t && t.school)
      : [];
    /*
     * Нормализация названий источника без объединения разных школ.
     * Явно названные поднаправления остаются отдельными карточками.
     */
    const magicNameNormalize = {
      "Магия огня":"Огонь",
      "Солнечная магия":"Солнечная",
      "Магия воды":"Вода",
      "Магия воздуха":"Воздух",
      "Магия земли":"Земля",
      "Магия света (священная)":"Священная (свет)",
      "Магия призыва":"Призыв",
      "Некромантия (смерть)":"Некромантия",
      "Магия теней (тьмы)":"Магия теней",
      "Чума":"Магия чумы",
      "Магия природы":"Природа",
      "Биомантия (бионика)":"Биомантия",
      "Магия металла":"Металл",
      "Магия порталов":"Портальная",
      "Ваагх":"Ваагх!"
    };

    const magicDisplaySchools = [
      ...R.magicSchools.map(name => ({name, parent:null})),
      {name:"Магия иллюзий", parent:"Колдовство"},
      {name:"Магия разума", parent:"Колдовство"},
      {name:"Солнечная", parent:"Огонь"},
      {name:"Магия льда", parent:"Вода"},
      {name:"Инквизиторская", parent:"Священная (свет)"},
      {name:"Благословенная", parent:"Священная (свет)"},
      {name:"Магия теней", parent:"Некромантия"},
      {name:"Магия чумы", parent:"Некромантия"},
      {name:"Биомантия", parent:"Природа"}
    ];
    const magicSourceSections = [
      ["Волшебство",["Волшебство"]],["Колдовство",["Колдовство"]],["Магия разума",["Магия разума"]],["Магия иллюзий",["Магия иллюзий"]],
      ["Огонь",["Магия огня","Огонь"]],["Солнечная",["Солнечная магия"]],["Вода",["Магия воды","Вода"]],["Магия льда",["Магия льда"]],
      ["Воздух",["Воздух","Магия воздуха"]],["Земля",["Земля","Магия земли"]],["Священная (свет)",["Магия света (священная)","Священная (свет)"]],
      ["Инквизиторская",["Инквизиторская магия"]],["Благословенная",["Благословенная магия","Благословенная"]],["Призыв",["Магия призыва","Призыв"]],
      ["Некромантия",["Некромантия","Некромантия (смерть)"]],["Магия теней",["Магия теней (тьмы)","Магия теней"]],
      ["Магия чумы",["Чума","Магия чумы"]],["Демонология",["Демонология"]],["Разрушение",["Разрушение"]],
      ["Природа",["Магия природы","Природа"]],["Биомантия",["Биомантия"]],["Рунная",["Рунная магия","Рунная"]],
      ["Кровь",["Магия крови","Кровь"]],["Поглощение",["Поглощение"]],["Ритуалистика",["Ритуалистика"]],["Шаманизм",["Шаманизм"]],
      ["Магия войны",["Магия войны"]],["Металл",["Магия металла","Металл"]],["Ваагх!",["Ваагх!","Ваагх"]],
      ["Портальная",["Магия порталов","Портальная"]],["Астральная магия",["Астральная магия"]],["Вуду",["Вуду"]],
      ["Антимагия",["Антимагия"]],["Техномагия",["Техномагия"]]
    ];
    const magicLevelPatterns = [
      [6,/^Эпическ/i],[5,/^Грандмастерск|^Грандамастерск/i],[4,/^Мастерск/i],[3,/^Экспертн|^Экспертный/i]
    ];
    const normalizeMagicText = value => String(value || '')
      .replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n+/g,' ').trim();
    const extractMagicTZFromSource = () => {
      const source = typeof window.VA34_RULES_SOURCE === 'string' ? window.VA34_RULES_SOURCE : '';
      if (!source) return [];
      const allLines = source.split(/\n/);
      const clean = value => String(value).replace(/\u00a0/g,' ').replace(/^\s*\d+\s*[.)]\s*/,'').replace(/\s+/g,' ').trim();

      // IMPORTANT: magic TЗ are extracted only from the actual «Уровни ТЗ»
      // catalogue. This prevents later technology/update headings from
      // becoming part of «Магия порталов» or another school.
      const tzStart = allLines.findIndex(x => clean(x) === 'Уровни ТЗ');
      const tzEnd = allLines.findIndex((x,i) => i > tzStart && clean(x) === 'Допцифры к ТЗ');
      if (tzStart < 0 || tzEnd < 0) return [];

      const magicHeadings = new Set();
      magicSourceSections.forEach(([school,headings]) => headings.forEach(h => magicHeadings.add(clean(h))));

      const technologyHeadings = new Set([
        'Сельское хозяйство - пассивно бонусный доход +1/1.5/2/3/4 на',
        'Экономика - пассивно бонусный доход +1/1.5/2/3/4',
        'Дипломатия - пассивно плюс к переговорам',
        'Кузнечное дело (металлургия) -',
        'Инженерное дело - пассивно удешевление построек - 1 на',
        'Военное дело - пассивно плюс в бою',
        'Артефактология/Артефакторика -',
        'Разведка -','Маскировка -','Шпионаж -','Контрразведка – эффективно контрит шпионаж, разведку и',
        'Пропаганда - пассивно немного ослабляет шпионаж и повышает',
        'Огнестрел - на старте что-то типа аркебуз и пистолей.',
        'Кораблестроение - на старте что-то типа античных галер',
        'Энерговооружение - пассивно повышается дальнобойность и',
        'Энергощиты',
        'Кристалломантия (пассивно укрепляет Кристаллинов)',
        'Контрабанда - пассивно растет защита и сложность обнаружения',
        'Алхимия - гибкие и сильные эффекты. Слабые зелья требуют',
        'Химия - вспомогательная технология для хайтека',
        'Роботизация - доступна высокотехнологичным мирам'
      ].map(clean));

      const starts = [];
      for (let i=tzStart+1; i<tzEnd; i++) {
        const heading = clean(allLines[i]);
        if (!magicHeadings.has(heading)) continue;
        // A real magic-TЗ heading has a level marker shortly below it.
        let hasLevel = false;
        for (let j=i+1; j<Math.min(tzEnd,i+12); j++) {
          if (/^(Экспертн|Мастерск|Грандмастерск|Грандамастерск|Эпическ)/i.test(clean(allLines[j]))) {
            hasLevel = true; break;
          }
          if (magicHeadings.has(clean(allLines[j])) || technologyHeadings.has(clean(allLines[j]))) break;
        }
        if (hasLevel) starts.push({school:magicSourceSections.find(([s,hs]) => hs.some(h=>clean(h)===heading))[0], heading, index:i});
      }

      const boundaryHeadings = new Set([...magicHeadings, ...technologyHeadings]);
      const nextBoundary = startIndex => {
        for (let i=startIndex+1; i<tzEnd; i++) {
          if (boundaryHeadings.has(clean(allLines[i]))) return i;
        }
        return tzEnd;
      };

      const result = [];
      starts.forEach(item => {
        const blockLines = allLines.slice(item.index+1, nextBoundary(item.index));
        const levelStarts = [];
        blockLines.forEach((line,i) => {
          const value=clean(line);
          for (const [level,re] of magicLevelPatterns) if (re.test(value)) { levelStarts.push([i,level]); break; }
        });
        levelStarts.forEach(([s,level],n) => {
          const e=n+1<levelStarts.length ? levelStarts[n+1][0] : blockLines.length;
          const effect=normalizeMagicText(blockLines.slice(s,e).join('\n'));
          if (effect) result.push({
            id:'source-magic-'+result.length,
            name:item.school+' — '+({3:'Экспертное',4:'Мастерское',5:'Грандмастерское',6:'Эпическое'}[level]||'ТЗ'),
            category:'magic_level',school:item.school,requiredLevel:level,effect,
            source:'компиляция ВА34.pdf — раздел «'+item.heading+'»'
          });
        });
      });
      return result;
    };
    const sourceMagicTZ = extractMagicTZFromSource();
    const magicTZ = sourceMagicTZ.length ? sourceMagicTZ : legacyMagicTZ;
    const knownSchoolTZ = {};
    const unlinkedMagicTZ = [];
    magicTZ.forEach(t => {
      const rawSchool = String(t.school);
      const school = magicNameNormalize[rawSchool] || rawSchool;
      if (magicDisplaySchools.some(s => s.name === school)) (knownSchoolTZ[school] ||= []).push({...t, school});
      else unlinkedMagicTZ.push(t);
    });
    const magicTZHtml = name => {
      const rows = knownSchoolTZ[name] || [];
      if (!rows.length) return '<p class="muted">Отдельных ТЗ, прямо привязанных к этой школе в текущем перенесённом источнике, не задано.</p>';
      return '<details class="tech-tz"><summary>Специальные ТЗ ('+rows.length+')</summary><div class="catalog-grid compact">'+rows.map(t => '<article class="catalog-card"><h4>'+esc(t.name)+'</h4><p><strong>Требование:</strong> уровень школы в источнике не указан.</p><p><strong>Эффект:</strong> '+esc(t.effect||'—')+'</p>'+(t.cost?'<p><strong>Стоимость:</strong> '+esc(JSON.stringify(t.cost))+'</p>':'')+'<p class="muted"><strong>Источник:</strong> '+esc(t.source||'исходные правила')+'</p></article>').join('')+'</div></details>';
    };
    const unlinked = unlinkedMagicTZ.length
      ? '<div class="notice"><strong>Отдельные магические ТЗ без однозначной привязки:</strong><ul>'+unlinkedMagicTZ.map(t=>'<li>'+esc(t.name)+' — источник указывает «'+esc(t.school)+'», но карточка с таким названием не найдена.</li>').join('')+'</ul></div>'
      : '';
    magic.innerHTML = '<h2>🔮 Школы магии</h2><p>Базовые школы и явно названные в источнике поднаправления показываются раздельно. Связь поднаправления с базовой школой обозначается только как справочная принадлежность и не сливает их в одну школу.</p><div class="catalog-grid">'+magicDisplaySchools.map(x=>'<article class="catalog-card"><h3>'+window.VA34_ICON_FOR(x.name,'magic')+' '+esc(x.name)+'</h3>'+(x.parent?'<p class="muted">Поднаправление школы: '+esc(x.parent)+'</p>':'')+'<p>'+esc((R.magicSourceNotes&&R.magicSourceNotes[x.name])||'Отдельное описание в текущем справочнике отсутствует.')+'</p>'+magicTZHtml(x.name)+'</article>').join('')+'</div>'+unlinked;
  }

  const terrain = document.getElementById('terrain');
  if (terrain) terrain.innerHTML = '<h2>🌲 Ландшафт</h2><p>Ландшафт влияет на применение войск и условия боя. Текущий справочник содержит '+R.terrains.length+' базовых типов.</p><div class="catalog-grid compact">'+R.terrains.map(x=>'<article class="catalog-card"><h3>'+iconFor(x,'terrain')+' '+esc(x)+'</h3><p>Базовый тип местности.</p></article>').join('')+'</div>';

  const skills = document.getElementById('skills');
  if (skills) skills.innerHTML = '<h2>⚡ Навыки героев</h2><p>Максимум — 6 разных навыков. Для мирных навыков действуют специальные скидки: инженер и управляющий — 1 за уровень, исследователь — 0,5 за уровень. Один навык ориентировочно соответствует 1 энергии эффективности.</p><div class="catalog-grid compact">'+R.heroSkills.map(x=>'<article class="catalog-card"><h3>'+iconFor(x,'skill')+' '+esc(x)+'</h3></article>').join('')+'</div>';

  const perks = document.getElementById('perks');
  if (perks) perks.innerHTML = '<h2>✨ Перки героев</h2><p>Перки — дополнительные особенности героя. Текущий справочник содержит следующие названия:</p><div class="catalog-grid compact">'+R.heroPerks.map(x=>'<article class="catalog-card"><h3>'+iconFor(x,'perk')+' '+esc(x)+'</h3></article>').join('')+'</div>';

  const tech = document.getElementById('tech');
  if (tech) {
    /*
     * ТЗ, привязанные к уровням технологий, показываются непосредственно
     * после описания соответствующей технологии. Источник не расширяем:
     * если для технологии ТЗ пока не перенесено, явно показываем это.
     */
    const levelNames = {1:'Базовый',2:'Продвинутый',3:'Экспертный',4:'Мастерский',5:'Грандмастерский',6:'Эпичный'};
    const legacyTechnologyTZ = Array.isArray(window.VA34_SPECIAL_TZ)
      ? window.VA34_SPECIAL_TZ.filter(t => t && t.technology)
      : [];
    const structuredTechnologyTZ = Array.isArray(R.technologyTZ) ? R.technologyTZ : [];
    const structuredNames = new Set(structuredTechnologyTZ.map(t => String(t.technology)));
    const technologyTZ = structuredTechnologyTZ.concat(
      legacyTechnologyTZ.filter(t => !structuredNames.has(String(t.technology)))
    );
    const byTechnology = {};
    technologyTZ.forEach(t => {
      const key = String(t.technology);
      (byTechnology[key] ||= []).push(t);
    });
    const tzHtml = name => {
      const rows = byTechnology[name] || [];
      const hasTZ = R.technologyTZStatus && Object.prototype.hasOwnProperty.call(R.technologyTZStatus, name)
        ? R.technologyTZStatus[name]
        : rows.length > 0;
      if (!rows.length && !hasTZ) {
        return '<details class="tech-tz"><summary>ТЗ технологии</summary><div class="notice">ТЗ не предусмотрено согласно исходному файлу. Пассивные бонусы этой технологии действуют независимо от ТЗ.</div></details>';
      }
      if (!rows.length && hasTZ) {
        return '<details class="tech-tz"><summary>ТЗ технологии</summary><div class="notice">ТЗ заявлено в исходном файле, но ещё не перенесено в структурированный каталог.</div></details>';
      }
      const body = rows.map(t => {
        const req = t.requirement ? '<p><strong>Требование:</strong> '+esc(t.requirement)+'</p>' : '';
        const cost = t.cost ? '<p><strong>Стоимость:</strong> '+esc(JSON.stringify(t.cost))+'</p>' : '';
        return '<article class="catalog-card"><h4>'+esc(t.name)+'</h4>'+req+'<p><strong>Эффект:</strong> '+esc(t.effect||'—')+'</p>'+cost+'<p class="muted"><strong>Источник:</strong> '+esc(t.source||'исходные правила')+'</p></article>';
      }).join('');
      return '<details class="tech-tz"><summary>ТЗ технологии ('+rows.length+')</summary><div class="catalog-grid compact">'+body+'</div></details>';
    };
    tech.innerHTML = '<h2>⚙️ Технологии</h2><p>Ниже перенесены технологии из исходного файла. Для каждой показывается базовое описание, а доступные уровни ТЗ будут добавляться из структурированного каталога. Незаполненные уровни не заменяются предположениями.</p><div class="catalog-grid">'+R.technologies.map(x=>'<article class="catalog-card"><h3>'+window.VA34_ICON_FOR(x,'technology')+' '+esc(x)+'</h3><p>'+esc((R.technologySourceNotes&&R.technologySourceNotes[x]) || R.technologyNotes[x] || 'Описание в источнике не задано.')+'</p>'+tzHtml(x)+'</article>').join('')+'</div>';
  }

  const levels = document.getElementById('techlevels');
  if (levels) levels.innerHTML += '<h3>Полная шкала уровней</h3><table><tr><th>Уровень</th><th>Ранг</th><th>Статус</th></tr>'+R.techLevels.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.rank+'</td><td>'+(x.rank===6?'Эпичный: требуется специальное ТЗ или решение Мастера.':'Обычный уровень развития')+'</td></tr>').join('')+'</table>';

  const hero = document.getElementById('heroes');
  if (hero) hero.innerHTML += '<div class="notice"><strong>Витязи:</strong> ближайшие помощники героев. Они не прокачиваются и при гибели погибают навсегда; лимита на их количество правила не задают. Герой и витязь не могут участвовать более чем в одном действии за пределами мира за ход.</div>';

  const general = document.getElementById('general');
  if (general) general.innerHTML += '<h3>📚 Справочник данных</h3><p>Кабинет игрока использует те же справочники рас, родов войск, магии, ландшафтов, навыков, перков и технологий, что и эта страница. Неизвестные или индивидуальные элементы можно оставить на согласование Мастеру.</p>';

  const special = document.getElementById('special-tz');
  if (special && Array.isArray(window.VA34_SPECIAL_TZ)) {
    const otherTZ = window.VA34_SPECIAL_TZ.filter(t => !t.technology && !t.school);
    special.innerHTML = '<h2>🧩 Прочие специальные ТЗ</h2><p>Технологические ТЗ перенесены непосредственно в карточки соответствующих технологий. Здесь остаются только ТЗ, не привязанные к технологии.</p><div class="catalog-grid">'+otherTZ.map(t=>'<article class="catalog-card"><h3>'+esc(t.name)+'</h3><p><strong>Требование:</strong> '+esc(t.requiredLevel ? ("уровень "+t.requiredLevel+" / "+(["I","II","III","IV","V","VI"][(+t.requiredLevel||1)-1]||t.requiredLevel)) : "отдельное специальное ТЗ")+'</p><p><strong>Эффект:</strong> '+esc(t.effect)+'</p>'+(t.cost?'<p><strong>Стоимость:</strong> '+esc(JSON.stringify(t.cost))+'</p>':'')+'<p class="muted"><strong>Источник:</strong> '+esc(t.source||'исходные правила')+'</p></article>').join('')+'</div>';
  }
  const shard = document.getElementById('shard');
  if (shard) shard.innerHTML = '<h2>🏝️ Осколок</h2><table><tr><th>Размер</th><th>Значение</th></tr>'+R.shardSizes.map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+s.value+'</td></tr>').join('')+'</table><p><strong>Типы:</strong> '+R.shardTypes.map(s=>esc(s.name)).join(', ')+'.</p><p><strong>Настроения:</strong> '+R.moods.map(esc).join(', ')+'.</p><ul><li>Лимит зданий: floor(размер); родовой — 4.</li><li>Хранение энергии: 20 э + 10 э за осколок.</li><li>Новый контент начинает действовать со следующего хода.</li></ul>';
  const sourceShard = document.getElementById('source');
  if (sourceShard) sourceShard.innerHTML = '<h2>💠 Источник</h2><ul><li>Сохраняется после захвата и продолжает давать преимущества.</li><li>Сила определяется гарнизоном.</li><li>Гарнизон уменьшается на 1 каждый ход, минимум до 1.</li><li>Защита обычного мира на источник не распространяется.</li><li>Источник можно захватить или уничтожить.</li></ul>';
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