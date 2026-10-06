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

    // The dedicated source link is always available, but it is not part of the
    // main-page section search because the source lives on another page.
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

  applySearch();
})();