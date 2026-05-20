/* ============================================
   BASKETBALL WORLD — Shooter mini-game (canvas)
   - drag mouse / touch to set power + angle
   - release to shoot ball at hoop
   - physics: gravity, rim collision, swish detection
   - high score saved in localStorage (bw_shoot_hi)
   - 60-second arcade timer + combo multipliers
   ============================================ */
(function () {
  'use strict';

  const root = document.getElementById('shooter');
  if (!root) return;

  const canvas  = root.querySelector('canvas');
  const ctx     = canvas.getContext('2d');
  const elScore = root.querySelector('[data-shooter-score]');
  const elTime  = root.querySelector('[data-shooter-time]');
  const elHi    = root.querySelector('[data-shooter-hi]');
  const elCombo = root.querySelector('[data-shooter-combo]');
  const btnStart = root.querySelector('[data-shooter-start]');
  const btnReset = root.querySelector('[data-shooter-reset]');
  const elMsg    = root.querySelector('[data-shooter-msg]');

  const HI_KEY = 'bw_shoot_hi';
  let W = 0, H = 0, dpr = 1;
  let running = false;
  let last = 0;

  // game state
  const state = {
    score: 0,
    hi: parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0,
    timer: 60,
    combo: 0,
    multiplier: 1,
    lastBucketTime: 0
  };

  // ball
  const ball = {
    x: 0, y: 0, vx: 0, vy: 0, r: 18,
    rotation: 0,
    inFlight: false,
    visible: true,
    trail: []
  };

  // hoop
  const hoop = {
    x: 0, y: 0,           // backboard top-left visible coords
    rimY: 0, rimLeft: 0, rimRight: 0,
    rimRadius: 0,
    netHeight: 60,
    moveDir: 1,
    moveX: 0,
    moveRange: 0
  };

  // particles (for splash effect)
  const fx = [];

  // input
  let aiming = false;
  let aimStart = null;
  let aimEnd   = null;

  // === Game-tuning constants (single source of truth) ===
  const PHY = {
    gravity:    0.36,    // light gravity = slow, hangtime
    dampX:      0.995,
    dampY:      0.997,
    powerMult:  0.16,
    powerCap:   22,      // matches what's reachable to the hoop at any angle
    velCap:     24
  };

  function setStartPosition() {
    ball.x = W * 0.20;
    ball.y = H * 0.78;
    ball.vx = 0; ball.vy = 0;
    ball.inFlight = false;
    ball.visible = true;
    ball.scoredThisShot = false;
    ball.trail.length = 0;
  }

  function placeHoop() {
    hoop.rimY     = H * 0.40;            // lower → easier to reach
    hoop.rimLeft  = W * 0.62;            // closer to ball
    hoop.rimRadius = Math.max(22, Math.min(34, W * 0.05));
    hoop.rimRight = hoop.rimLeft + hoop.rimRadius * 2;
    hoop.x = hoop.rimRight + 4;
    hoop.y = hoop.rimY - 70;
    hoop.moveRange = Math.min(50, W * 0.06);
    hoop.moveX = 0;
    hoop.moveDir = 1;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width;
    H = r.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setStartPosition();
    placeHoop();
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnSplash(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      fx.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 1,
        life: 1,
        col: color,
        r: 2 + Math.random() * 3
      });
    }
  }

  function startShot() {
    if (!running) return;
    if (ball.inFlight) return;
    aiming = true;
    aimStart = { x: ball.x, y: ball.y };
    aimEnd   = { x: ball.x, y: ball.y };
  }
  function moveShot(e, rect) {
    if (!aiming) return;
    aimEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function releaseShot() {
    if (!aiming) return;
    aiming = false;
    const dx = aimStart.x - aimEnd.x;  // direction is OPPOSITE the drag (sling-shot style)
    const dy = aimStart.y - aimEnd.y;
    const power = Math.min(PHY.powerCap, Math.hypot(dx, dy) * PHY.powerMult);
    if (power < 3) return;             // too weak — ignore
    const angle = Math.atan2(dy, dx);
    ball.vx = Math.cos(angle) * power;
    ball.vy = Math.sin(angle) * power;
    ball.inFlight = true;
  }

  // mouse + touch
  function getRect() { return canvas.getBoundingClientRect(); }
  // Track mousemove on WINDOW (not just canvas) so the user can drag OUT of
  // the canvas and still build up power. Without this, the aim line stops
  // growing the moment the cursor leaves the canvas and it feels capped.
  function onWinMove(e) { if (aiming) moveShot(e, getRect()); }
  canvas.addEventListener('mousedown', () => startShot());
  window.addEventListener('mousemove', onWinMove);
  window.addEventListener('mouseup',   releaseShot);

  canvas.addEventListener('touchstart', e => { e.preventDefault(); startShot(); }, { passive: false });
  window.addEventListener('touchmove',  e => {
    if (!aiming) return;
    e.preventDefault();
    const t = e.touches[0];
    moveShot({ clientX: t.clientX, clientY: t.clientY }, getRect());
  }, { passive: false });
  window.addEventListener('touchend',   () => releaseShot());

  function update(dt) {
    // hoop movement (gentle horizontal)
    hoop.moveX += hoop.moveDir * 30 * dt;
    if (Math.abs(hoop.moveX) > hoop.moveRange) hoop.moveDir *= -1;

    // game timer
    state.timer -= dt;
    if (state.timer <= 0) {
      state.timer = 0;
      stop(true);
    }

    // ball physics — slow & graceful arc
    if (ball.inFlight) {
      // remember previous position for swept collision (line segment)
      const prevX = ball.x, prevY = ball.y;

      ball.vy += PHY.gravity;
      ball.vx *= PHY.dampX; ball.vy *= PHY.dampY;
      const sp = Math.hypot(ball.vx, ball.vy);
      if (sp > PHY.velCap) {
        ball.vx = (ball.vx / sp) * PHY.velCap;
        ball.vy = (ball.vy / sp) * PHY.velCap;
      }
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.rotation += ball.vx * 0.03;

      // SNAPSHOT after physics step but BEFORE any collision adjustments.
      // The bucket detection MUST use this — otherwise rim-post collisions
      // push the ball below the rim plane and fake a "score".
      const postPhyX = ball.x, postPhyY = ball.y;

      // trail
      ball.trail.push({ x: ball.x, y: ball.y, life: 1 });
      if (ball.trail.length > 16) ball.trail.shift();

      // current rim coords (factor in movement)
      const rimL = hoop.rimLeft  + hoop.moveX;
      const rimR = hoop.rimRight + hoop.moveX;
      const rimY = hoop.rimY;

      // rim collision (two small circles) — sets the "no bucket this frame" flag
      let rimHitThisFrame = false;
      [{ x: rimL, y: rimY }, { x: rimR, y: rimY }].forEach(p => {
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < ball.r + 3) {
          rimHitThisFrame = true;
          // bounce off the rim
          const nx = dx / d, ny = dy / d;
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
          ball.vx *= 0.62; ball.vy *= 0.62;
          ball.x = p.x + nx * (ball.r + 3);
          ball.y = p.y + ny * (ball.r + 3);
          spawnSplash(ball.x, ball.y, '#FDB927', 6);
        }
      });

      // backboard collision
      const bbX = hoop.x + hoop.moveX;
      if (ball.vx > 0 && ball.x + ball.r > bbX && ball.y > hoop.y && ball.y < hoop.y + 70) {
        ball.x = bbX - ball.r;
        ball.vx *= -0.55;
        spawnSplash(ball.x, ball.y, '#ffffff', 4);
      }

      // BUCKET — swept-line check using PRE-collision snapshot, AND only if
      // we didn't bounce off a rim post this frame. This kills the false-
      // positive where a rim hit pushes the ball below rimY and looks like
      // a clean pass-through.
      if (!ball.scoredThisShot && !rimHitThisFrame
          && ball.vy > 0 && prevY < rimY && postPhyY >= rimY) {
        // interpolate: at what fraction t in [0,1] did the segment cross rimY?
        const t = (rimY - prevY) / (postPhyY - prevY);
        const crossX = prevX + (postPhyX - prevX) * t;
        // require ball.r margin from rim posts so a ball center barely inside
        // (which physically would clip the post) doesn't count
        const margin = ball.r;
        if (crossX > rimL + margin && crossX < rimR - margin) {
          ball.scoredThisShot = true;
          const now = performance.now();
          if (now - state.lastBucketTime < 4500) state.combo++;
          else state.combo = 0;
          state.lastBucketTime = now;
          state.multiplier = 1 + state.combo;
          const points = 2 * state.multiplier;
          state.score += points;
          if (state.score > state.hi) {
            state.hi = state.score;
            localStorage.setItem(HI_KEY, String(state.hi));
          }
          elScore.textContent = state.score;
          elHi.textContent = state.hi;
          elCombo.textContent = 'x' + state.multiplier;
          elMsg.textContent = state.combo >= 2
            ? `🔥 ${state.combo + 1} la rand! +${points}`
            : `🏀 Cos! +${points}`;
          elMsg.classList.add('flash');
          setTimeout(() => elMsg.classList.remove('flash'), 600);
          spawnSplash(ball.x, ball.y, '#2ecc71', 30);
        }
      }

      // out of bounds: reset
      if (ball.y > H + 60 || ball.x < -60 || ball.x > W + 60) {
        if (!ball.scoredThisShot) {
          state.combo = 0;
          state.multiplier = 1;
          elCombo.textContent = 'x1';
          elMsg.textContent = '✗ Ratata';
          elMsg.classList.add('flash-miss');
          setTimeout(() => elMsg.classList.remove('flash-miss'), 500);
        }
        setStartPosition();
        ball.scoredThisShot = false;
      }
    }

    // particles
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      p.vy += 0.25;
      p.x += p.vx; p.y += p.vy;
      p.life -= dt * 1.4;
      if (p.life <= 0) fx.splice(i, 1);
    }

    elTime.textContent = Math.ceil(state.timer);
  }

  function draw() {
    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a1330');
    bg.addColorStop(1, '#0a0814');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // floor
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(0, H - 32, W, 32);
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, H - 32); ctx.lineTo(x, H); ctx.stroke(); }

    // hoop pole + backboard
    const rimL = hoop.rimLeft  + hoop.moveX;
    const rimR = hoop.rimRight + hoop.moveX;
    const rimY = hoop.rimY;
    const bbX  = hoop.x + hoop.moveX;

    ctx.fillStyle = '#222';
    ctx.fillRect(bbX, hoop.y, 8, H - 32 - hoop.y);
    // backboard
    ctx.fillStyle = '#f4f4f7';
    ctx.fillRect(bbX, hoop.y, -4, 70);
    ctx.fillStyle = '#e8551f';
    ctx.fillRect(bbX - 4, rimY - 18, -36, 4);

    // rim
    ctx.strokeStyle = '#e8551f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rimL, rimY); ctx.lineTo(rimR, rimY);
    ctx.stroke();
    // rim "posts" (the two collision circles)
    ctx.fillStyle = '#b13d10';
    ctx.beginPath(); ctx.arc(rimL, rimY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rimR, rimY, 4, 0, Math.PI * 2); ctx.fill();

    // net
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1;
    const segs = 8;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = rimL + (rimR - rimL) * t;
      const offsetX = Math.sin(performance.now() / 600 + i) * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, rimY);
      ctx.lineTo(rimL + (rimR - rimL) * t * 0.6 + (rimR - rimL) * 0.2 + offsetX, rimY + hoop.netHeight);
      ctx.stroke();
    }
    // net horizontal lines
    for (let i = 1; i <= 4; i++) {
      const y = rimY + (hoop.netHeight * i / 4);
      const shrink = (rimR - rimL) * 0.2 * (i / 4);
      ctx.beginPath();
      ctx.moveTo(rimL + shrink, y); ctx.lineTo(rimR - shrink, y);
      ctx.stroke();
    }

    // particles
    fx.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ball trail
    ball.trail.forEach((p, i) => {
      const t = (i + 1) / ball.trail.length;
      ctx.globalAlpha = t * 0.35;
      ctx.fillStyle = '#e8551f';
      ctx.beginPath();
      ctx.arc(p.x, p.y, ball.r * t, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ball
    if (ball.visible) {
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rotation);
      const grad = ctx.createRadialGradient(-ball.r * 0.3, -ball.r * 0.3, ball.r * 0.2, 0, 0, ball.r);
      grad.addColorStop(0, '#ffaf5f');
      grad.addColorStop(0.6, '#e8551f');
      grad.addColorStop(1, '#8a2a06');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ball.r, 0, Math.PI * 2); ctx.fill();
      // lines
      ctx.strokeStyle = '#3a1606';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-ball.r, 0); ctx.lineTo(ball.r, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -ball.r); ctx.lineTo(0, ball.r); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, ball.r, -Math.PI * 0.42, -Math.PI * 0.08); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, ball.r,  Math.PI * 0.08,  Math.PI * 0.42); ctx.stroke();
      ctx.restore();
    }

    // aim line + power gauge + trajectory prediction
    if (aiming && aimEnd && aimStart) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const len = Math.hypot(dx, dy);
      const power = Math.min(PHY.powerCap, len * PHY.powerMult);
      const angle = Math.atan2(dy, dx);
      const powerPct = power / PHY.powerCap;       // 0..1

      // 1. Red aim arrow — thin, semi-transparent, shows drag direction
      ctx.strokeStyle = `rgba(232,85,31,${0.5 + powerPct * 0.45})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + dx, ball.y + dy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. White predicted trajectory — LARGE dots so it's clearly visible
      let px = ball.x, py = ball.y;
      let pvx = Math.cos(angle) * power;
      let pvy = Math.sin(angle) * power;
      const dots = [];
      for (let i = 0; i < 60; i++) {
        pvy += PHY.gravity;
        pvx *= PHY.dampX; pvy *= PHY.dampY;
        px += pvx; py += pvy;
        if (py > H - 30 || px < 0 || px > W + 30) break;
        dots.push({ x: px, y: py, i });
      }
      // Draw every 2nd dot to look like a dotted line
      for (let i = 0; i < dots.length; i += 2) {
        const d = dots[i];
        const fade = 1 - (i / dots.length) * 0.6;     // fade trailing dots
        ctx.fillStyle = `rgba(255,255,255,${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Power gauge — vertical bar near the ball
      const gx = ball.x - ball.r - 22;
      const gy1 = ball.y - 80, gy2 = ball.y + 60;
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(gx, gy1, 8, gy2 - gy1);
      ctx.stroke();
      const fillH = (gy2 - gy1) * powerPct;
      const grad = ctx.createLinearGradient(0, gy1, 0, gy2);
      grad.addColorStop(0, '#FDB927');
      grad.addColorStop(0.5, '#e8551f');
      grad.addColorStop(1, '#b13d10');
      ctx.fillStyle = grad;
      ctx.fillRect(gx, gy2 - fillH, 8, fillH);
      // power %
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = '600 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(powerPct * 100) + '%', gx + 4, gy1 - 6);
    }

    // hint when game idle
    if (!running) {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.font = '600 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Apasa "Start" si trage incet de minge ca de o pratie', W / 2, H * 0.20);
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.65)';
      ctx.fillText('Punctele conteaza, nu viteza · linia alba arata traiectoria reala', W / 2, H * 0.20 + 26);

      // pulsing arrow pointing DOWN-LEFT from the ball — drag direction
      // is opposite the throw, and the hoop is up-right of the ball.
      const t = (performance.now() % 1600) / 1600;            // 0..1
      const ease = .5 - .5 * Math.cos(t * Math.PI * 2);      // 0..1..0
      const ox = -70 - 50 * ease;
      const oy =  40 + 30 * ease;
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.strokeStyle = `rgba(232,85,31,${0.55 + 0.35 * ease})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ox, oy);
      ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead
      const a = Math.atan2(oy, ox);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox - 10 * Math.cos(a - .35), oy - 10 * Math.sin(a - .35));
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox - 10 * Math.cos(a + .35), oy - 10 * Math.sin(a + .35));
      ctx.stroke();
      ctx.fillStyle = `rgba(232,85,31,${0.5 + 0.4 * ease})`;
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TRAGE', ox - 12, oy - 12);
      ctx.restore();
    }
  }

  function frame(now) {
    if (!last) last = now;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (running) update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    state.score = 0; state.timer = 60; state.combo = 0; state.multiplier = 1;
    elScore.textContent = '0';
    elTime.textContent  = '60';
    elCombo.textContent = 'x1';
    elMsg.textContent = '🏀 Hai! Trage cu mouse-ul';
    running = true;
    setStartPosition();
    btnStart.textContent = 'Restart';
    if (window.BWtoast) window.BWtoast('Joc pornit! Ai 60 secunde', 'info');
  }
  function stop(byTimeout) {
    running = false;
    btnStart.textContent = 'Start';
    if (byTimeout) {
      if (window.BWtoast) window.BWtoast(
        `Timpul s-a scurs! Scor: ${state.score} (best: ${state.hi})`,
        state.score >= state.hi && state.score > 0 ? 'success' : 'info'
      );
      elMsg.textContent = `⏱ Time! ${state.score} puncte`;
    }
  }
  function reset() {
    localStorage.removeItem(HI_KEY);
    state.hi = 0;
    elHi.textContent = '0';
    if (window.BWtoast) window.BWtoast('Best score resetat', 'warn');
  }

  btnStart?.addEventListener('click', start);
  btnReset?.addEventListener('click', reset);

  // initial paint
  resize();
  elHi.textContent = state.hi;
  elScore.textContent = '0';
  elTime.textContent  = '60';
  elCombo.textContent = 'x1';
  requestAnimationFrame(frame);

  // Re-measure after fonts load (layout shifts when Anton/Bricolage swap in)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => resize());
  }
  // Re-measure if the wrap actually resizes (e.g. devtools toggle, font load, orientation change)
  if (window.ResizeObserver) {
    let roT;
    const ro = new ResizeObserver(() => {
      clearTimeout(roT);
      roT = setTimeout(resize, 60);
    });
    ro.observe(canvas.parentElement || canvas);
  }
  // Fallback for browsers without RO
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  // One more measure on full window load (images, fonts, the works)
  window.addEventListener('load', () => setTimeout(resize, 120));
})();
