/* ============================================
   BASKETBALL WORLD — Player of the Day rotator
   - reads data-players JSON from #potd
   - auto-rotates every 7s
   - click dots to jump; pause on hover
   ============================================ */
(function () {
  'use strict';
  const root = document.getElementById('potd');
  if (!root) return;

  let players;
  try {
    const raw = root.dataset.players.replace(/\{\{q\}\}/g, "'");
    players = JSON.parse(raw);
  } catch (e) {
    console.warn('PoTD JSON parse failed:', e);
    return;
  }
  if (!players?.length) return;

  const elImg     = root.querySelector('.potd-img img');
  const elName    = root.querySelector('.potd-name');
  const elBio     = root.querySelector('.potd-bio');
  const elStats   = root.querySelector('.potd-stats');
  const elKicker  = root.querySelector('.potd-kicker span');
  const elDots    = root.querySelector('.potd-dots');

  // Build dots
  elDots.innerHTML = players.map((_, i) =>
    `<i data-i="${i}" role="button" aria-label="Player ${i+1}"></i>`).join('');

  let idx = 0;
  let timer = 0;

  function splitName(name) {
    const parts = name.split(' ');
    if (parts.length < 2) return [name, ''];
    const last = parts.pop();
    return [parts.join(' '), last];
  }

  function render(i, opts = {}) {
    const p = players[i];
    if (!p) return;
    root.style.setProperty('--potd-accent', p.accent || '#D9531E');

    // fade old image
    elImg.classList.add('fade');
    setTimeout(() => {
      elImg.src = p.img;
      elImg.alt = p.name;
      elImg.onload = () => elImg.classList.remove('fade');
      // safety in case cached
      requestAnimationFrame(() => elImg.classList.remove('fade'));
    }, 260);

    const [first, last] = splitName(p.name);
    elName.innerHTML = `${first} <em>${last}</em>`;
    elKicker.textContent = p.kicker || 'Player of the day';
    elBio.textContent = p.bio || p.tagline || '';

    elStats.innerHTML = (p.stats || []).map(s =>
      `<div class="potd-stat"><strong>${s.v}</strong><span>${s.l}</span></div>`).join('');

    elDots.querySelectorAll('i').forEach((d, di) => d.classList.toggle('on', di === i));
    idx = i;
  }

  function next() { render((idx + 1) % players.length); }
  function start() {
    stop();
    timer = setInterval(next, 7000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = 0; } }

  elDots.addEventListener('click', e => {
    const dot = e.target.closest('i[data-i]');
    if (!dot) return;
    render(parseInt(dot.dataset.i, 10));
    start();
  });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  // initial — pick a deterministic player based on the day of the year so
  // it actually means "player of the day"
  const dayIdx = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  ) % players.length;
  render(dayIdx);
  start();
})();
