/* ============================================
   BASKETBALL WORLD — script principal
   - meniu hamburger
   - efecte scroll
   - animatii reveal
   - galerie lightbox
   - contoare statistici
   ============================================ */

(function () {
  'use strict';

  // ---------- LOADER ----------
  window.addEventListener('load', () => {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 700);
    }
  });

  // Show loader during navigation between local pages (gives time for the ball
  // to be visible & spinning while the next page loads).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')
        || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.host && a.host !== window.location.host) return;

    const loader = document.querySelector('.page-loader');
    if (loader) loader.classList.remove('hidden');
  });

  // Restore loader hidden state when user navigates back via history
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const loader = document.querySelector('.page-loader');
      if (loader) loader.classList.add('hidden');
    }
  });

  // ---------- INJECT OVERLAY MENU + LANG SWITCHER (so we don't repeat HTML on every page) ----------
  function injectOverlay() {
    if (document.querySelector('.nav-overlay')) return; // already there

    // Derive paths based on location (page can be /index.html or /pages/*.html)
    const isSubpage = window.location.pathname.toLowerCase().includes('/pages/');
    const home   = isSubpage ? '../index.html'        : 'index.html';
    const pPath  = isSubpage ? ''                     : 'pages/';

    const links = [
      { href: home,                  num: '01', i18n: 'nav.home',    text: 'Acasa' },
      { href: pPath + 'echipe.html', num: '02', i18n: 'nav.teams',   text: 'Echipe' },
      { href: pPath + 'jucatori.html', num: '03', i18n: 'nav.players', text: 'Jucatori' },
      { href: pPath + 'istorie.html', num: '04', i18n: 'nav.history', text: 'Istorie' },
      { href: pPath + 'galerie.html', num: '05', i18n: 'nav.gallery', text: 'Galerie' },
      { href: pPath + 'multimedia.html', num: '06', i18n: 'nav.media', text: 'Media' },
      { href: pPath + 'contact.html', num: '07', i18n: 'nav.contact', text: 'Contact' },
      { href: pPath + 'login.html',  num: '08', i18n: 'nav.login',   text: 'Login' },
      { href: pPath + 'register.html', num: '09', i18n: 'nav.register', text: 'Inregistrare' }
    ];

    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <ul class="overlay-menu">
          ${links.map(l => `
            <li><a href="${l.href}" data-num="${l.num}" data-i18n="${l.i18n}">${l.text}</a></li>
          `).join('')}
        </ul>
        <div class="overlay-bottom">
          <div class="lang-switcher">
            <button class="lang-btn" data-lang="ro">🇷🇴 Romana</button>
            <button class="lang-btn" data-lang="en">🇬🇧 English</button>
          </div>
        </div>
        <div class="overlay-footer">Basketball World · proiect informatica</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Inject mini lang switcher in header (next to hamburger)
    const headerNav = document.querySelector('.site-header .nav-container');
    const hamburger = document.querySelector('.hamburger');
    if (headerNav && hamburger && !document.querySelector('.header-lang')) {
      const headerLang = document.createElement('div');
      headerLang.className = 'lang-switcher header-lang';
      headerLang.innerHTML = `
        <button class="lang-btn" data-lang="ro">RO</button>
        <button class="lang-btn" data-lang="en">EN</button>
      `;
      hamburger.parentNode.insertBefore(headerLang, hamburger);
    }
  }
  injectOverlay();

  // ---------- HAMBURGER + OVERLAY MENU ----------
  const hamburger = document.querySelector('.hamburger');
  const overlay   = document.querySelector('.nav-overlay');

  function closeMenu() {
    hamburger?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openMenu() {
    hamburger?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  hamburger?.addEventListener('click', () => {
    if (overlay?.classList.contains('open')) closeMenu();
    else openMenu();
  });

  overlay?.querySelector('.overlay-close')?.addEventListener('click', closeMenu);
  // close when clicking a menu link
  overlay?.querySelectorAll('.overlay-menu a, .nav-cta').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
  // close when clicking outside content
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  // close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // ---------- LANGUAGE SWITCHER ----------
  const STORAGE_LANG = 'bw_lang';
  function getLang() { return localStorage.getItem(STORAGE_LANG) || 'ro'; }
  function setLang(lang) {
    if (!window.I18N || !window.I18N[lang]) return;
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.lang = lang;

    const dict = window.I18N[lang];
    // text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    // attribute translations: data-i18n-attr="placeholder:key1;title:key2"
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const pairs = el.dataset.i18nAttr.split(';');
      pairs.forEach(p => {
        const [attr, key] = p.split(':');
        if (attr && key && dict[key] !== undefined) el.setAttribute(attr.trim(), dict[key.trim()]);
      });
    });

    // update active state on all lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Auto-tag common UI text with data-i18n keys (so pages don't have to
  // sprinkle data-i18n on every nav/footer link manually).
  const autoMap = {
    'Acasa':       'nav.home',
    'Home':        'nav.home',
    'Echipe':      'nav.teams',
    'Teams':       'nav.teams',
    'Jucatori':    'nav.players',
    'Players':     'nav.players',
    'Istorie':     'nav.history',
    'History':     'nav.history',
    'Galerie':     'nav.gallery',
    'Gallery':     'nav.gallery',
    'Media':       'nav.media',
    'Contact':     'nav.contact',
    'Login':       'nav.login',
    'Cont':        'nav.account',
    'Inregistrare':'nav.register',
    'Linkuri rapide': 'ft.quickLinks',
    'Quick links':    'ft.quickLinks',
    'Resurse':        'ft.resources',
    'Resources':      'ft.resources',
    'Baza de date NBA': 'idx.explore.db'
  };
  document.querySelectorAll(
    '.nav-menu a, .footer-col a, .footer-col h4'
  ).forEach(el => {
    if (el.dataset.i18n) return;
    const t = el.textContent.trim();
    if (autoMap[t]) el.dataset.i18n = autoMap[t];
  });

  // apply saved lang on load
  if (window.I18N) setLang(getLang());

  // ---------- HEADER SCROLL ----------
  const header = document.querySelector('.site-header');
  function onScroll() {
    if (window.scrollY > 30) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- ACTIVE NAV LINK ----------
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const linkName = href.split('/').pop();
    if (linkName === currentPath) a.classList.add('active');
  });

  // ---------- REVEAL ON SCROLL ----------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .card, .tl-item, .team-card, .player-card-pro, .bigstat, .alt-event, .player-silhouette, .era-card, .team-flip, .x-block, .bar-row, .team-strip').forEach(el => observer.observe(el));

  // ---------- FISHEYE DOCK ----------
  document.querySelectorAll('.dock').forEach(dock => {
    const items = Array.from(dock.querySelectorAll('.dock-item'));
    if (!items.length) return;

    function applyFisheye(mouseX) {
      const rects = items.map(it => it.getBoundingClientRect());
      items.forEach((it, i) => {
        const r = rects[i];
        const center = r.left + r.width / 2;
        const dist = Math.abs(mouseX - center);
        // Wider influence range — fisheye spans further
        const max = 480;
        const t = Math.max(0, 1 - dist / max);
        // Stronger transformation:
        // scale 0.82 -> 1.22, brightness 0.5 -> 1.05, opacity 0.55 -> 1
        const scale = 0.82 + t * 0.40;
        const bright = 0.5 + t * 0.55;
        const sat = 0.6 + t * 0.55;
        const opacity = 0.55 + t * 0.45;
        const ty = -t * 24;
        if (!it.classList.contains('is-active')) {
          it.style.transform = `scale(${scale}) translateY(${ty}px)`;
          it.style.filter = `brightness(${bright}) saturate(${sat})`;
          it.style.opacity = opacity;
        }
        it.classList.toggle('is-near', t > 0.6);
      });
    }

    function resetItems() {
      items.forEach((it) => {
        if (it.classList.contains('is-active')) return;
        it.style.transform = '';
        it.style.filter = '';
        it.style.opacity = '';
        it.classList.remove('is-near');
      });
    }

    function setActive(i) {
      items.forEach((it, idx) => {
        it.classList.toggle('is-active', idx === i);
        it.style.transform = '';
        it.style.filter = '';
        it.style.opacity = '';
      });
      dock.dispatchEvent(new CustomEvent('dock:change', { detail: { index: i, item: items[i] } }));
    }

    dock.addEventListener('mousemove', (e) => applyFisheye(e.clientX));
    dock.addEventListener('mouseleave', resetItems);
    items.forEach((it, i) => {
      it.addEventListener('click', () => setActive(i));
    });

    // Do NOT auto-activate any item — they all start dimmed.
    // The focus panel (if present) will pre-render with the first item's data
    // without setting an is-active class, so users see a starting player
    // but the dock remains visually neutral.
  });

  // ---------- PLAYER FOCUS PANEL UPDATER ----------
  document.querySelectorAll('[data-player-focus]').forEach(panel => {
    const dockSel = panel.dataset.dockSel;
    const dock = dockSel ? document.querySelector(dockSel) : null;
    if (!dock) return;

    function render(data) {
      panel.style.setProperty('--focus-bg', data.bg || '#18141a');
      panel.style.setProperty('--focus-bg2', data.bg2 || '#0a0a0e');
      panel.style.setProperty('--focus-accent', data.accent || '#e8551f');
      panel.style.setProperty('--focus-glow', data.glow || 'rgba(232,85,31,.25)');
      panel.innerHTML = `
        <div class="pf-img">
          <span class="jersey-bg">${data.num || ''}</span>
          <img src="${data.img}" alt="${data.name}">
        </div>
        <div class="pf-body">
          <span class="pf-tag">${data.tag || 'Jucator'}</span>
          <h3 class="pf-name">${data.first || ''} <span>${data.last || data.name}</span></h3>
          <div class="pf-nick">${data.nick || ''}</div>
          <div class="pf-team">${data.team || ''}</div>
          <p class="pf-bio">${data.bio || ''}</p>
          <div class="pf-stats">
            ${(data.stats || []).map(s => `
              <div class="pf-stat"><strong>${s.value}</strong><span>${s.label}</span></div>
            `).join('')}
          </div>
        </div>
      `;
    }

    dock.addEventListener('dock:change', (e) => {
      const it = e.detail.item;
      const data = JSON.parse(it.dataset.player || '{}');
      data.img = it.querySelector('img').src;
      render(data);
    });

    // initial render — fire from currently active item (setActive runs before
    // this listener is attached, so re-derive the active item now)
    const active = dock.querySelector('.dock-item.is-active') || dock.querySelector('.dock-item');
    if (active) {
      const data = JSON.parse(active.dataset.player || '{}');
      data.img = active.querySelector('img').src;
      render(data);
    }
  });

  // ---------- BAR CHART ANIMATION ----------
  // (handled by .is-visible class via existing observer + CSS transitions)

  // ---------- GAMES YEAR FILTER ----------
  const yearButtons = document.querySelectorAll('.year-btn');
  const gameCards   = document.querySelectorAll('.game-card');
  yearButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      yearButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const year = btn.dataset.year;
      gameCards.forEach(card => {
        card.classList.toggle('hide', !(year === 'all' || card.dataset.year === year));
      });
    });
  });

  // ---------- COUNTERS (stats) ----------
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        el.textContent = (target % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  // ---------- GALLERY LIGHTBOX ----------
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');

  document.querySelectorAll('.gallery-item img, .gv-item img').forEach(img => {
    img.addEventListener('click', () => {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.src = img.src;
      lightbox.classList.add('open');
    });
  });
  lightbox?.addEventListener('click', () => lightbox.classList.remove('open'));

  // ---------- GALLERY FILTERS ----------
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems  = document.querySelectorAll('.gv-item');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      galleryItems.forEach(item => {
        const match = cat === 'all' || item.dataset.cat === cat;
        item.classList.toggle('hide', !match);
      });
    });
  });

  // ---------- SMOOTH SCROLL for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- CURRENT YEAR in footer ----------
  // Use specific attribute to avoid clobbering game-card[data-year] articles
  document.querySelectorAll('[data-current-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

})();
