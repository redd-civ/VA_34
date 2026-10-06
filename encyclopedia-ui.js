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

    let end = source.length;
    for (const marker of endMarkers) {
      const p = source.indexOf(marker, start + startMarker.length);
      if (p >= 0 && p < end) end = p;
    }
    const raceSource = source.slice(start, end);

    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));

    const raceBlock = name => {
      const title = String(name);
      const re = new RegExp('(?:^|\\n)' + title.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '(?=\\n|$)');
      const match = re.exec(raceSource);
      if (!match) return '';
      const blockStart = match.index + (match[0].startsWith('\n') ? 1 : 0);
      let blockEnd = raceSource.length;
      for (const other of R.races) {
        if (!other || other.name === title) continue;
        const escaped = String(other.name).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
        const next = new RegExp('\\n' + escaped + '(?=\\n|$)').exec(raceSource.slice(blockStart + 1));
        if (next) {
          const p = blockStart + 1 + next.index + 1;
          if (p < blockEnd) blockEnd = p;
        }
      }
      return raceSource.slice(blockStart, blockEnd).trim();
    };

    const cards = R.races.map(r => {
      const block = raceBlock(r.name);
      return '<article class="catalog-card"><h3>🧬 '+esc(r.name)+'</h3>' +
        (block
          ? '<details open><summary>Описание и свойства из исходного файла</summary><pre class="race-source">'+esc(block)+'</pre></details>'
          : '<p class="notice">Запись есть в структурированном каталоге, но её заголовок не найден в текущем полном источнике.</p>') +
        '</article>';
    }).join('');

    races.innerHTML = '<h2>🧬 Расы</h2><p>Текст карточек берётся непосредственно из полного источника. Никакие свойства рас здесь не придумываются и не пересказываются.</p><div class="catalog-grid">'+cards+'</div>';
  };

  renderRacesFromSource();
  applySearch();
})();