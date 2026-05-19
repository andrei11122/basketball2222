/* ============================================
   BASKETBALL WORLD — global command palette
   Ctrl+K / Cmd+K → fuzzy search across the entire site
   ============================================ */
(function () {
  'use strict';

  // Derive paths based on current location (root vs /pages/)
  const sub = window.location.pathname.toLowerCase().includes('/pages/');
  const home = sub ? '../' : '';
  const p    = sub ? ''    : 'pages/';

  // Searchable items — pages, sections, key concepts.
  // Add `keys` = comma-separated synonyms for fuzzy matching.
  const ITEMS = [
    // Pages
    { title: 'Acasa',        sub: 'Pagina principala',     href: home + 'index.html',         icon: '🏠', keys: 'home, principal, index' },
    { title: 'Echipe',       sub: 'Franchize NBA',         href: p + 'echipe.html',           icon: '🏆', keys: 'teams, lakers, celtics, bulls, warriors' },
    { title: 'Jucatori',     sub: 'Profile + comparison',  href: p + 'jucatori.html',         icon: '🏀', keys: 'players, jordan, lebron, kobe, curry, wemby' },
    { title: 'Istorie',      sub: 'Cronologie + ere',      href: p + 'istorie.html',          icon: '📜', keys: 'history, timeline, naismith, 1891' },
    { title: 'Galerie',      sub: 'Foto + masonry',        href: p + 'galerie.html',          icon: '🖼️', keys: 'gallery, photo, images' },
    { title: 'Media · NBA',  sub: 'Video + audio + API',   href: p + 'multimedia.html',       icon: '🎬', keys: 'media, video, audio, finals, database' },
    { title: 'Contact',      sub: 'Maps + formular',       href: p + 'contact.html',          icon: '📍', keys: 'contact, mesaj, madison, garden' },
    { title: 'Login',        sub: 'Intra in cont',         href: p + 'login.html',            icon: '🔑', keys: 'login, autentificare, signin' },
    { title: 'Inregistrare', sub: 'Creeaza cont nou',      href: p + 'register.html',         icon: '📝', keys: 'register, signup, cont nou' },

    // Sections / features
    { title: 'Quiz NBA',         sub: '10 intrebari',                 href: home + 'index.html#quiz',     icon: '❓', keys: 'quiz, test, trivia, intrebari' },
    { title: 'Arunca la cos',    sub: 'Mini-joc canvas',              href: home + 'index.html#shooter',  icon: '🎯', keys: 'joc, game, shooter, arunca, aim' },
    { title: 'Comparare jucatori', sub: 'A vs B side-by-side',         href: p + 'jucatori.html#compare', icon: '⚖️', keys: 'compare, comparison, vs, versus' },
    { title: 'Cautare live NBA', sub: 'API TheSportsDB',              href: p + 'multimedia.html#player-search', icon: '🔍', keys: 'search api, jucatori live, thesportsdb' },
    { title: 'Finale NBA',       sub: 'Baza de date interna',         href: p + 'multimedia.html#games-container', icon: '🏆', keys: 'finale, finals, championships, games' },
    { title: 'Era Jordan',       sub: '1984-1998',                     href: p + 'istorie.html',           icon: '⭐', keys: 'jordan, bulls, 90s' },
    { title: 'Era Kobe',         sub: '2000-2010',                     href: p + 'istorie.html',           icon: '🐍', keys: 'kobe, mamba, lakers' },
    { title: 'Era LeBron',       sub: '2003 - prezent',                href: p + 'istorie.html',           icon: '👑', keys: 'lebron, king james' },
    { title: 'Era Curry',        sub: '2014-2022',                     href: p + 'istorie.html',           icon: '🔥', keys: 'curry, warriors, splash bros' },
    { title: 'Era Wembanyama',   sub: '2023 - ?',                      href: p + 'istorie.html',           icon: '🚀', keys: 'wemby, spurs, future' }
  ];

  // Build modal DOM
  const modal = document.createElement('div');
  modal.className = 'palette';
  modal.innerHTML = `
    <div class="palette-bg" data-close></div>
    <div class="palette-box" role="dialog" aria-modal="true" aria-label="Search">
      <div class="palette-input-wrap">
        <span class="palette-icon">🔍</span>
        <input type="text" class="palette-input" placeholder="Cauta orice... (Esc pentru iesire)" autocomplete="off">
        <span class="palette-kbd">ESC</span>
      </div>
      <div class="palette-results" role="listbox"></div>
      <div class="palette-footer">
        <span><kbd>↑↓</kbd> navigheaza</span>
        <span><kbd>Enter</kbd> deschide</span>
        <span><kbd>Ctrl+K</kbd> deschide cautarea</span>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input   = modal.querySelector('.palette-input');
  const results = modal.querySelector('.palette-results');
  let selected = 0;
  let filtered = ITEMS;

  function open() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 50);
    input.value = '';
    selected = 0;
    render(ITEMS);
  }
  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function fuzzyMatch(item, q) {
    if (!q) return true;
    const hay = (item.title + ' ' + item.sub + ' ' + (item.keys || '')).toLowerCase();
    return q.toLowerCase().split(/\s+/).every(tok => hay.includes(tok));
  }

  function render(list) {
    filtered = list;
    if (!list.length) {
      results.innerHTML = '<div class="palette-empty">Nu am gasit nimic. Incearca alt cuvant.</div>';
      return;
    }
    results.innerHTML = list.map((it, i) => `
      <a href="${it.href}" class="palette-item ${i === selected ? 'is-active' : ''}" data-idx="${i}">
        <span class="palette-item-ic">${it.icon}</span>
        <div class="palette-item-body">
          <strong>${it.title}</strong>
          <span>${it.sub}</span>
        </div>
        <span class="palette-item-arrow">↵</span>
      </a>
    `).join('');
    results.querySelectorAll('.palette-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        selected = parseInt(el.dataset.idx, 10);
        updateActive();
      });
    });
  }
  function updateActive() {
    results.querySelectorAll('.palette-item').forEach((el, i) => {
      el.classList.toggle('is-active', i === selected);
      if (i === selected) el.scrollIntoView({ block: 'nearest' });
    });
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    selected = 0;
    render(ITEMS.filter(it => fuzzyMatch(it, q)));
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selected = Math.min(filtered.length - 1, selected + 1);
      updateActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selected = Math.max(0, selected - 1);
      updateActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = filtered[selected];
      if (it) window.location.href = it.href;
    }
  });
  modal.querySelector('[data-close]')?.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.classList.contains('open') ? close() : open();
    }
  });

  // Make a small hint button accessible too: any element with data-search-trigger
  document.addEventListener('click', e => {
    if (e.target.closest('[data-search-trigger]')) {
      e.preventDefault();
      open();
    }
  });

  // expose for debug
  window.BWsearch = { open, close };
})();
