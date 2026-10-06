(() => {
  const input = document.getElementById('navSearch');
  const empty = document.getElementById('navSearchEmpty');
  if (!input) return;

  const groups = [...document.querySelectorAll('.nav-group')];
  const sections = [...document.querySelectorAll('.main-content > .section')];

  const norm = value => String(value || '').toLocaleLowerCase('ru-RU').trim();

  function applySearch() {
    const q = norm(input.value);
    let navMatches = 0;
    let sectionMatches = 0;

    groups.forEach(group => {
      const links = [...group.querySelectorAll('a[href^="#"]')];
      let groupMatches = 0;
      links.forEach(link => {
        const id = link.getAttribute('href').slice(1);
        const section = document.getElementById(id);
        const haystack = norm((link.textContent || '') + ' ' + (section?.textContent || ''));
        const match = !q || haystack.includes(q);
        link.hidden = !match;
        if (match) groupMatches++;
      });
      group.hidden = q && groupMatches === 0;
      if (groupMatches) navMatches += groupMatches;
    });

    sections.forEach(section => {
      if (!q) {
        section.hidden = false;
        return;
      }
      const match = norm(section.textContent).includes(q);
      section.hidden = !match;
      if (match) sectionMatches++;
    });

    empty.style.display = q && navMatches === 0 && sectionMatches === 0 ? 'block' : 'none';
  }

  input.addEventListener('input', applySearch);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      input.value = '';
      applySearch();
      input.blur();
    }
  });

  document.querySelectorAll('.nav-panel a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const group = link.closest('.nav-group');
      if (group) group.open = true;
    });
  });

  // Исправление извлечения рас: VA34_RULES_SOURCE содержит реальные переводы строк,
  // поэтому искать '\\n' как два символа было ошибкой. Здесь используются именно '\n'.
  const renderRacesFromSource = () => {
    const races = document.getElementById('races');
    const R = window.VA34_RULES;
    const source = window.VA34_RULES_SOURCE;
    if (!races || !R || !Array.isArray(R.races) || typeof source !== 'string') return;

    const startMarker = 'Вдохновение Астрала. Расы';
    const endMarkers = ['Список родов войск', 'Технологии'];
    const start = source.indexOf(startMarker);
    if (start < 0) return;

    // Ищем конец раздела только по отдельной строке-заголовку. Нельзя использовать
    // обычный indexOf по всему тексту: внутри описаний встречаются фразы вроде
    // «Технологии Древних», которые не являются началом раздела «Технологии».
    const sourceLines = source.split(/\\n/);
    const startLine = sourceLines.findIndex(line => String(line).includes(startMarker));
    let endLine = sourceLines.length;
    for (let i = startLine + 1; i < sourceLines.length; i++) {
      const cleanLine = String(sourceLines[i]).replace(/\\u00a0/g, ' ').trim();
      if (endMarkers.includes(cleanLine)) {
        endLine = i;
        break;
      }
    }
    const raceSource = sourceLines.slice(startLine, endLine).join('\\n');

    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));

    const raceBlock = name => {
      const title = String(name).trim();
      const lines = raceSource.split(/\n/);
      const clean = value => String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();

      // PDF may contain extra spaces or non-breaking spaces in race headings.
      const startIndex = lines.findIndex(line => clean(line) === clean(title));
      if (startIndex < 0) return '';

      const raceNames = new Set(R.races.map(r => clean(r && r.name)));
      let endIndex = lines.length;
      for (let i = startIndex + 1; i < lines.length; i++) {
        if (raceNames.has(clean(lines[i]))) {
          endIndex = i;
          break;
        }
      }
      return lines.slice(startIndex, endIndex).join('\n').trim();
    };

    const cardHtml = r => {
      const block = raceBlock(r.name);
      return '<article class="catalog-card race-card"><h3>🧬 '+esc(r.name)+'</h3>' +
        (block
          ? '<details><summary>Описание и свойства из исходного файла</summary><pre class="race-source">'+esc(block)+'</pre></details>'
          : '<p class="notice">Запись есть в структурированном каталоге, но её заголовок не найден в текущем полном источнике.</p>') +
        '</article>';
    };

    // Группируем только по явно читаемой связи в названии: это визуальная
    // группировка каталога, а не утверждение о происхождении/таксономии расы.
    const groups = [
      ['Люди', ['Люди','Азраки','Мимарийцы','Селестиане','Тифлинги','Альвионцы','Авионы']],
      ['Ангелы и родственные', ['Ангелы','Серафимы']],
      ['Великаны', ['Великаны','Инеистые великаны','Огненные великаны','Морские великаны','Гиганты','Циклопы','Титаны']],
      ['Гноллы', ['Гноллы','Гноллы хаоса']],
      ['Гномы', ['Гномы','Темные гномы','Дуэргары (серые гномы)','Свирфнеблины','Карлики']],
      ['Гоблины', ['Гоблины','Ночные гоблины','Хобгоблины','Светлые гоблины','Гремлины','Девлинги']],
      ['Джинны и родственные', ['Джинны','Ифриты','Мариды','Дэвы']],
      ['Драконы', ['Дракониды','Драконы']],
      ['Конструкты', ['Конструкты','Големы','Горгульи','Очистители','Кристаллиты']],
      ['Крысиные', ['Крысотараканы','Крыссары']],
      ['Нежить', ['Нежить','Зомби','Скелеты','Баргесты','Упыри','Мумии','Призраки','Рыцари смерти','Вампиры','Личи','Некроконструкты']],
      ['Природные духи', ['Нимфы','Дриады','Ореады','Наяды']],
      ['Орки', ['Орки','Орки Хаоса']],
      ['Сатиры', ['Сатиры','Темные сатиры']],
      ['Слоупоки', ['Слоупоки','Слоупоки крови']],
      ['Тролли', ['Тролли','Йети (они же снежные тролли)']],
      ['Феи', ['Феи','Пикси']],
      ['Элементали', ['Элементали','Огненные','Воздушные','Земляные','Адские (хаоса)','Светлые (сияния)','Тени']],
      ['Эльфы', ['Эльфы','Высшие эльфы','Темные эльфы','Ночные эльфы']],
      ['Кицунэ и родственные', ['Кицунэ','Девятихвостые лисы (кьюби)']],
      ['Тануки и тенгу', ['Тануки','Тенгу']],
      ['Демоны', ['Демоны','Бесы','Импы','Гоги','Черти','Церберы','Суккубы','Ледяные демоны','Крылатые демоны']],
      ['Прочие', []]
    ];

    const used = new Set();
    let groupedHtml = '';
    for (const [label, names] of groups) {
      const members = names.map(name => R.races.find(r => r.name === name)).filter(Boolean);
      members.forEach(r => used.add(r.name));
      if (!members.length) continue;
      groupedHtml += '<section class="race-group"><h3>'+esc(label)+'</h3><div class="catalog-grid">'+members.map(cardHtml).join('')+'</div></section>';
    }
    const rest = R.races.filter(r => !used.has(r.name));
    if (rest.length) {
      groupedHtml += '<section class="race-group"><h3>Прочие расы</h3><div class="catalog-grid">'+rest.map(cardHtml).join('')+'</div></section>';
    }

    races.innerHTML = '<h2>🧬 Расы</h2><p>Подвиды и родственные записи визуально сгруппированы рядом по их названию. Это только организация интерфейса: группировка не добавляет правила, происхождение или иерархию, которых нет в источнике.</p>'+groupedHtml;
  };

  renderRacesFromSource();
  applySearch();
})();