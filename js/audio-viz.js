/* ============================================
   BASKETBALL WORLD — audio visualizer
   Web Audio API: connect each <audio data-audio> to an
   analyser node and render an animated bar equalizer
   on a canvas injected next to the audio element.
   ============================================ */
(function () {
  'use strict';

  const audios = document.querySelectorAll('audio[data-audio]');
  if (!audios.length) return;

  let ctxAudio = null;
  function ac() {
    if (!ctxAudio) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctxAudio = new C();
    }
    return ctxAudio;
  }

  audios.forEach((audio) => {
    // Canvas injected after the <audio>
    const canvas = document.createElement('canvas');
    canvas.className = 'audio-viz';
    audio.parentNode.insertBefore(canvas, audio.nextSibling);
    const ctx = canvas.getContext('2d');

    let analyser, dataArr, source;
    let raf = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width  = r.width  * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function setup() {
      const a = ac();
      if (!a || analyser) return;
      try {
        source = a.createMediaElementSource(audio);
        analyser = a.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(a.destination);
        dataArr = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        // some browsers block on first interaction — silently ignore
      }
    }

    function draw() {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      if (!analyser) { raf = requestAnimationFrame(draw); return; }
      analyser.getByteFrequencyData(dataArr);
      const bars = Math.min(48, dataArr.length);
      const gap = 2;
      const bw = (r.width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = dataArr[i] / 255;            // 0..1
        const h = Math.max(2, v * r.height * 0.95);
        const x = i * (bw + gap);
        const y = r.height - h;
        const grad = ctx.createLinearGradient(0, y, 0, r.height);
        grad.addColorStop(0, '#FDB927');
        grad.addColorStop(.5, '#e8551f');
        grad.addColorStop(1, '#7a2a06');
        ctx.fillStyle = grad;
        // rounded top
        const rad = Math.min(bw / 2, 3);
        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.lineTo(x + bw - rad, y);
        ctx.quadraticCurveTo(x + bw, y, x + bw, y + rad);
        ctx.lineTo(x + bw, r.height);
        ctx.lineTo(x, r.height);
        ctx.lineTo(x, y + rad);
        ctx.quadraticCurveTo(x, y, x + rad, y);
        ctx.closePath();
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    function start() {
      setup();
      if (ctxAudio && ctxAudio.state === 'suspended') ctxAudio.resume();
      canvas.classList.add('active');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      canvas.classList.remove('active');
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    audio.addEventListener('play',  start);
    audio.addEventListener('pause', stop);
    audio.addEventListener('ended', stop);
  });
})();
