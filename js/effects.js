/* ============================================
   BASKETBALL WORLD — effects.js
   Visual sugar layer:
   - hero particles (basketball-ish orbs)
   - scroll-progress bar
   - 3D tilt on cards
   - toast notifications (window.BWtoast)
   - theme toggle (dark / light)
   - mouse-trail orange glow
   - back-to-top button
   - reduced-motion respect
   ============================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================
     1. SCROLL PROGRESS BAR (top of page)
     ============================================ */
  (function scrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    const fill = bar.querySelector('i');
    let raf = 0;
    function update() {
      raf = 0;
      const h = document.documentElement;
      const scrolled = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      fill.style.width = (scrolled * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  })();

  /* ============================================
     2. HERO PARTICLES (basketball orbs)
     ============================================ */
  (function heroParticles() {
    if (prefersReduced) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const orbs = [];
    const COUNT = window.innerWidth < 700 ? 14 : 26;

    function resize() {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeOrb() {
      const r = 8 + Math.random() * 28;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - .5) * 0.4,
        vy: (Math.random() - .5) * 0.4,
        r,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - .5) * 0.02,
        hue: 18 + Math.random() * 12,    // orange-ish
        alpha: 0.18 + Math.random() * 0.25
      };
    }

    function init() {
      resize();
      orbs.length = 0;
      for (let i = 0; i < COUNT; i++) orbs.push(makeOrb());
    }

    function drawBall(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.spin);
      // outer glow
      const g = ctx.createRadialGradient(0, 0, o.r * 0.2, 0, 0, o.r);
      g.addColorStop(0,  `hsla(${o.hue}, 85%, 60%, ${o.alpha + 0.15})`);
      g.addColorStop(0.6,`hsla(${o.hue}, 80%, 50%, ${o.alpha})`);
      g.addColorStop(1,  `hsla(${o.hue}, 80%, 40%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, o.r, 0, Math.PI * 2);
      ctx.fill();
      // ball lines (subtle)
      ctx.strokeStyle = `hsla(${o.hue}, 30%, 18%, ${o.alpha * 0.9})`;
      ctx.lineWidth = Math.max(0.5, o.r * 0.06);
      ctx.beginPath();
      ctx.moveTo(-o.r * 0.85, 0); ctx.lineTo(o.r * 0.85, 0);
      ctx.moveTo(0, -o.r * 0.85); ctx.lineTo(0, o.r * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, o.r * 0.85, -Math.PI * 0.45, -Math.PI * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, o.r * 0.85, Math.PI * 0.05, Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    let raf;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy; o.spin += o.spinSpeed;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        drawBall(o);
      }
      raf = requestAnimationFrame(loop);
    }

    init();
    loop();
    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(init, 120);
    });

    // pause when tab hidden — saves CPU
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else loop();
    });
  })();

  /* ============================================
     3. 3D TILT on cards
     ============================================ */
  (function tilt() {
    if (prefersReduced) return;
    if (window.innerWidth < 700) return; // skip on mobile
    // Cards that don't have their own hover-transform — safe to tilt.
    // .shooter-wrap is OUT: tilting the canvas breaks aim/click coords.
    // .quiz-wrap and .compare are out too — they hold form-like content.
    const targets = document.querySelectorAll('.media-card, .audio-card, .bigstat, .api-card, .cmp-card');
    const MAX = 8; // degrees
    targets.forEach(el => {
      el.classList.add('tiltable');
      let raf = 0;
      function onMove(e) {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const rx = (0.5 - py) * MAX;
          const ry = (px - 0.5) * MAX;
          el.style.setProperty('--tilt-x', rx.toFixed(2) + 'deg');
          el.style.setProperty('--tilt-y', ry.toFixed(2) + 'deg');
          el.style.setProperty('--tilt-shine-x', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--tilt-shine-y', (py * 100).toFixed(1) + '%');
        });
      }
      function reset() {
        el.style.removeProperty('--tilt-x');
        el.style.removeProperty('--tilt-y');
      }
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', reset);
    });
  })();

  /* ============================================
     4. TOAST NOTIFICATIONS — window.BWtoast(msg, kind)
     ============================================ */
  (function toasts() {
    const wrap = document.createElement('div');
    wrap.className = 'toasts';
    document.body.appendChild(wrap);

    window.BWtoast = function (msg, kind) {
      const t = document.createElement('div');
      t.className = 'toast toast-' + (kind || 'info');
      const icon = kind === 'success' ? '✓'
                 : kind === 'error'   ? '✗'
                 : kind === 'warn'    ? '!'
                 : 'i';
      t.innerHTML = `<span class="toast-ic">${icon}</span><span class="toast-msg"></span>`;
      t.querySelector('.toast-msg').textContent = msg;
      wrap.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      const ttl = setTimeout(close, 3800);
      function close() {
        clearTimeout(ttl);
        t.classList.remove('show');
        t.classList.add('out');
        setTimeout(() => t.remove(), 350);
      }
      t.addEventListener('click', close);
    };
  })();

  /* ============================================
     5. THEME TOGGLE (light / dark)
     ============================================ */
  (function themeToggle() {
    const KEY = 'bw_theme';
    function getTheme() { return localStorage.getItem(KEY) || 'dark'; }
    function setTheme(t) {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(KEY, t);
      document.querySelectorAll('[data-theme-btn]').forEach(b => {
        b.textContent = t === 'light' ? '🌙' : '☀';
        b.setAttribute('aria-label', t === 'light' ? 'Mod intunecat' : 'Mod luminos');
      });
    }
    // inject button in header next to lang switcher
    function injectButton() {
      const lang = document.querySelector('.header-lang');
      if (!lang || document.querySelector('[data-theme-btn]')) return;
      const btn = document.createElement('button');
      btn.className = 'theme-btn';
      btn.setAttribute('data-theme-btn', '');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        const t = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(t);
        if (window.BWtoast) window.BWtoast(
          t === 'light' ? 'Mod luminos activat' : 'Mod intunecat activat',
          'info'
        );
      });
      lang.parentNode.insertBefore(btn, lang);
    }
    // run after main.js injected its header items
    setTimeout(() => { injectButton(); setTheme(getTheme()); }, 0);
  })();

  /* ============================================
     5b. SEARCH TRIGGER pill in header (Ctrl+K hint)
     ============================================ */
  setTimeout(() => {
    const lang = document.querySelector('.header-lang');
    if (!lang) return;
    if (document.querySelector('.search-trigger')) return;
    const btn = document.createElement('button');
    btn.className = 'search-trigger';
    btn.type = 'button';
    btn.setAttribute('data-search-trigger', '');
    btn.innerHTML = '<span>🔍</span><span>Cauta...</span><kbd>Ctrl+K</kbd>';
    lang.parentNode.insertBefore(btn, lang);
  }, 0);

  /* ============================================
     6. MOUSE-TRAIL ORANGE GLOW (desktop only)
     ============================================ */
  (function trail() {
    if (prefersReduced || window.innerWidth < 900 || 'ontouchstart' in window) return;
    const dot = document.createElement('div');
    dot.className = 'cursor-glow';
    document.body.appendChild(dot);
    let tx = -100, ty = -100, x = -100, y = -100;
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    }
    loop();
    // size up over clickables
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, .card, .x-block, .quiz-opt, .dock-item')) dot.classList.add('big');
      else dot.classList.remove('big');
    });
  })();

  /* ============================================
     7. BACK-TO-TOP button
     ============================================ */
  (function backToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Sus');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 4 l-8 8 h5 v8 h6 v-8 h5 z" fill="currentColor"/></svg>';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
  })();

  /* ============================================
     8. KONAMI EASTER EGG — flashes a "Mamba Mentality" toast
     ============================================ */
  (function konami() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let i = 0;
    document.addEventListener('keydown', e => {
      if (e.key === seq[i]) {
        i++;
        if (i === seq.length) {
          i = 0;
          window.BWtoast?.('🐍 Mamba Mentality activated!', 'success');
          document.body.classList.add('mamba');
          setTimeout(() => document.body.classList.remove('mamba'), 4000);
        }
      } else { i = 0; }
    });
  })();

  /* ============================================
     9. KEYBOARD SHORTCUTS OVERLAY — press "?"
     ============================================ */
  (function shortcutsOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'shortcuts-overlay';
    overlay.innerHTML = `
      <div class="shortcuts-bg" data-close></div>
      <div class="shortcuts-box">
        <div class="shortcuts-head">
          <h3>Scurtaturi tastatura</h3>
          <button class="shortcuts-close" data-close aria-label="Inchide">✕</button>
        </div>
        <div class="shortcuts-grid">
          <div class="shortcuts-group">
            <h4>Navigatie</h4>
            <div class="sc-row"><kbd>Ctrl</kbd><kbd>K</kbd><span>Deschide cautare globala</span></div>
            <div class="sc-row"><kbd>Esc</kbd><span>Inchide meniu / cautare / overlay</span></div>
            <div class="sc-row"><kbd>↑</kbd><kbd>↓</kbd><span>Navigheaza in cautare</span></div>
            <div class="sc-row"><kbd>Enter</kbd><span>Deschide rezultatul selectat</span></div>
          </div>
          <div class="shortcuts-group">
            <h4>Ajutor</h4>
            <div class="sc-row"><kbd>?</kbd><span>Aceasta lista de scurtaturi</span></div>
            <div class="sc-row"><kbd>T</kbd><span>Schimba tema (intunecat / luminos)</span></div>
            <div class="sc-row"><kbd>G</kbd><span>Sus (back to top)</span></div>
          </div>
          <div class="shortcuts-group">
            <h4>Distractie</h4>
            <div class="sc-row mamba">
              <kbd>↑</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd><kbd>←</kbd><kbd>→</kbd><kbd>B</kbd><kbd>A</kbd>
              <span>🐍 Mamba Mentality</span>
            </div>
          </div>
        </div>
        <div class="shortcuts-foot">
          Apasa <kbd>?</kbd> oricand pentru a deschide din nou aceasta lista.
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    function open()  { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { overlay.classList.remove('open'); document.body.style.overflow = ''; }
    overlay.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));

    function isTyping() {
      const a = document.activeElement;
      return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
    }

    document.addEventListener('keydown', e => {
      if (isTyping()) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        overlay.classList.contains('open') ? close() : open();
      } else if (e.key === 'Escape' && overlay.classList.contains('open')) {
        close();
      } else if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) {
        // press T to toggle theme
        document.querySelector('[data-theme-btn]')?.click();
      } else if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  })();

})();
