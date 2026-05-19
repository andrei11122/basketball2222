/* ============================================
   BASKETBALL WORLD — players page extras
   - Player comparison tool (pick 2 → animated bar chart)
   - Favorites (star toggle on dock items → localStorage)
   ============================================ */
(function () {
  'use strict';

  const FAV_KEY = 'bw_favorites';
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch { return []; }
  }
  function setFavs(arr) {
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  }

  /* ============================================
     1. FAVORITES — star on each dock-item
     ============================================ */
  function initFavorites() {
    const dock = document.getElementById('players-dock');
    if (!dock) return;
    const favs = getFavs();
    dock.querySelectorAll('.dock-item').forEach(it => {
      let data;
      try { data = JSON.parse(it.dataset.player || '{}'); } catch { data = {}; }
      const key = (data.name || it.querySelector('img')?.alt || 'unknown').toLowerCase();
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'fav-star';
      star.setAttribute('aria-label', 'Adauga la favorite');
      star.innerHTML = '★';
      star.dataset.favKey = key;
      if (favs.includes(key)) star.classList.add('on');
      star.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const list = getFavs();
        const idx = list.indexOf(key);
        if (idx >= 0) {
          list.splice(idx, 1);
          star.classList.remove('on');
          window.BWtoast?.(`${data.name || key} sters din favorite`, 'info');
        } else {
          list.push(key);
          star.classList.add('on');
          window.BWtoast?.(`★ ${data.name || key} adaugat la favorite`, 'success');
          star.classList.add('pop');
          setTimeout(() => star.classList.remove('pop'), 450);
        }
        setFavs(list);
        updateFavCount();
      });
      it.appendChild(star);
    });
    updateFavCount();
  }
  function updateFavCount() {
    const n = getFavs().length;
    document.querySelectorAll('[data-fav-count]').forEach(el => {
      el.textContent = n;
      el.classList.toggle('show', n > 0);
    });
  }

  /* ============================================
     2. PLAYER COMPARISON — pick 2 players → bar chart
     ============================================ */
  function initComparison() {
    const wrap = document.getElementById('compare');
    if (!wrap) return;
    const dock = document.getElementById('players-dock');
    if (!dock) return;

    // Build "select" pickers from the same dock items
    const items = Array.from(dock.querySelectorAll('.dock-item'));
    const players = items.map((it, idx) => {
      let d = {};
      try { d = JSON.parse(it.dataset.player || '{}'); } catch {}
      return {
        idx,
        name: d.name || ('Jucator ' + (idx + 1)),
        team: d.team || '',
        img:  it.querySelector('img')?.src || '',
        accent: d.accent || '#e8551f',
        stats: d.stats || []
      };
    });

    const pickerA = wrap.querySelector('[data-pick="A"]');
    const pickerB = wrap.querySelector('[data-pick="B"]');
    [pickerA, pickerB].forEach(p => {
      p.innerHTML = players.map((pl, i) =>
        `<option value="${i}">${pl.name}</option>`).join('');
    });
    pickerA.value = 0;
    pickerB.value = Math.min(1, players.length - 1);

    const cardA = wrap.querySelector('[data-card="A"]');
    const cardB = wrap.querySelector('[data-card="B"]');
    const chart = wrap.querySelector('[data-chart]');
    const winner = wrap.querySelector('[data-winner]');

    function statValue(s) {
      // Convert "32K+", "30.1", "4", "3800+" to a sortable number
      if (!s) return 0;
      const m = String(s.value).match(/[\d.]+/);
      if (!m) return 0;
      let n = parseFloat(m[0]);
      if (/K/i.test(s.value)) n *= 1000;
      return n;
    }

    function render() {
      const a = players[parseInt(pickerA.value, 10)] || players[0];
      const b = players[parseInt(pickerB.value, 10)] || players[1] || players[0];

      [
        [cardA, a, '--accent: ' + a.accent],
        [cardB, b, '--accent: ' + b.accent]
      ].forEach(([card, p, style]) => {
        card.setAttribute('style', style);
        card.querySelector('img').src = p.img;
        card.querySelector('h3').textContent = p.name;
        card.querySelector('.cmp-team').textContent = p.team;
      });

      // Combined unique labels in order from A then B
      const labels = [];
      a.stats.forEach(s => labels.push(s.label));
      b.stats.forEach(s => { if (!labels.includes(s.label)) labels.push(s.label); });

      chart.innerHTML = '';
      let aWins = 0, bWins = 0;
      labels.forEach(label => {
        const sa = a.stats.find(s => s.label === label);
        const sb = b.stats.find(s => s.label === label);
        const va = statValue(sa);
        const vb = statValue(sb);
        const max = Math.max(va, vb, 1);
        const wa = (va / max) * 100;
        const wb = (vb / max) * 100;
        const aWin = va > vb;
        const bWin = vb > va;
        if (aWin) aWins++;
        if (bWin) bWins++;

        const row = document.createElement('div');
        row.className = 'cmp-row';
        row.innerHTML = `
          <div class="cmp-side a ${aWin ? 'win' : ''}">
            <span class="cmp-val">${sa ? sa.value : '—'}</span>
            <div class="cmp-bar"><i style="width:0"></i></div>
          </div>
          <div class="cmp-label">${label}</div>
          <div class="cmp-side b ${bWin ? 'win' : ''}">
            <div class="cmp-bar"><i style="width:0"></i></div>
            <span class="cmp-val">${sb ? sb.value : '—'}</span>
          </div>
        `;
        chart.appendChild(row);
        // animate fill
        const fillA = row.querySelector('.cmp-side.a .cmp-bar i');
        const fillB = row.querySelector('.cmp-side.b .cmp-bar i');
        requestAnimationFrame(() => {
          fillA.style.width = wa.toFixed(1) + '%';
          fillB.style.width = wb.toFixed(1) + '%';
        });
      });

      winner.classList.remove('a-wins', 'b-wins', 'draw');
      if (aWins > bWins) {
        winner.classList.add('a-wins');
        winner.innerHTML = `🏆 <strong>${a.name}</strong> conduce — ${aWins} - ${bWins}`;
      } else if (bWins > aWins) {
        winner.classList.add('b-wins');
        winner.innerHTML = `🏆 <strong>${b.name}</strong> conduce — ${bWins} - ${aWins}`;
      } else {
        winner.classList.add('draw');
        winner.innerHTML = `🤝 Egalitate <strong>${aWins} - ${bWins}</strong>`;
      }
    }

    pickerA.addEventListener('change', render);
    pickerB.addEventListener('change', render);

    // Swap button
    wrap.querySelector('[data-swap]')?.addEventListener('click', () => {
      const t = pickerA.value;
      pickerA.value = pickerB.value;
      pickerB.value = t;
      render();
    });

    // Shuffle = random both
    wrap.querySelector('[data-shuffle]')?.addEventListener('click', () => {
      let a, b;
      do {
        a = Math.floor(Math.random() * players.length);
        b = Math.floor(Math.random() * players.length);
      } while (a === b);
      pickerA.value = a;
      pickerB.value = b;
      render();
    });

    render();
  }

  // Wait until dock has been parsed (it sits in same page; safe to run after DOM ready)
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(() => {
    initFavorites();
    initComparison();
  });
})();
