/* ============================================
   BASKETBALL WORLD — Quiz NBA
   - 10 intrebari (RO/EN)
   - scor live, bara de progres, animatii
   - best score persistat in localStorage (bw_quiz_best)
   ============================================ */
(function () {
  'use strict';

  const root = document.getElementById('quiz');
  if (!root) return;

  const BEST_KEY = 'bw_quiz_best';

  // Banca de intrebari — index 0 = corect, traduceri ro/en
  const QUESTIONS = [
    {
      ro: { q: 'In ce an a fost inventat baschetul?',
            o: ['1891', '1901', '1936', '1946'] },
      en: { q: 'In what year was basketball invented?',
            o: ['1891', '1901', '1936', '1946'] },
      a: 0
    },
    {
      ro: { q: 'Cine este considerat "GOAT-ul" baschetului?',
            o: ['LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Magic Johnson'] },
      en: { q: 'Who is widely considered the GOAT of basketball?',
            o: ['LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Magic Johnson'] },
      a: 1
    },
    {
      ro: { q: 'Care echipa NBA are cele mai multe titluri?',
            o: ['L.A. Lakers', 'Chicago Bulls', 'Boston Celtics', 'Golden State Warriors'] },
      en: { q: 'Which NBA team has the most championships?',
            o: ['L.A. Lakers', 'Chicago Bulls', 'Boston Celtics', 'Golden State Warriors'] },
      a: 2
    },
    {
      ro: { q: 'Cati jucatori are o echipa in teren simultan?',
            o: ['4', '5', '6', '7'] },
      en: { q: 'How many players from one team are on court at once?',
            o: ['4', '5', '6', '7'] },
      a: 1
    },
    {
      ro: { q: 'Cine detine recordul de 3-uri marcate intr-un meci (13)?',
            o: ['Ray Allen', 'Klay Thompson', 'Damian Lillard', 'Stephen Curry'] },
      en: { q: 'Who holds the record for 3-pointers in a single game (13)?',
            o: ['Ray Allen', 'Klay Thompson', 'Damian Lillard', 'Stephen Curry'] },
      a: 3
    },
    {
      ro: { q: 'Cine este cel mai mare marcator din istoria NBA?',
            o: ['Michael Jordan', 'Kareem Abdul-Jabbar', 'LeBron James', 'Karl Malone'] },
      en: { q: 'Who is the all-time leading scorer in NBA history?',
            o: ['Michael Jordan', 'Kareem Abdul-Jabbar', 'LeBron James', 'Karl Malone'] },
      a: 2
    },
    {
      ro: { q: 'In ce an a fost introdusa linia de 3 puncte in NBA?',
            o: ['1969', '1979', '1986', '1992'] },
      en: { q: 'In what year was the 3-point line introduced in the NBA?',
            o: ['1969', '1979', '1986', '1992'] },
      a: 1
    },
    {
      ro: { q: 'Cine a marcat 81 de puncte intr-un singur meci NBA (2006)?',
            o: ['Kobe Bryant', 'Wilt Chamberlain', 'Michael Jordan', 'Devin Booker'] },
      en: { q: 'Who scored 81 points in a single NBA game (2006)?',
            o: ['Kobe Bryant', 'Wilt Chamberlain', 'Michael Jordan', 'Devin Booker'] },
      a: 0
    },
    {
      ro: { q: 'Care este inaltimea cosului oficial in baschet?',
            o: ['2.50 m', '3.05 m', '3.20 m', '3.50 m'] },
      en: { q: 'What is the official height of a basketball hoop?',
            o: ['2.50 m', '3.05 m', '3.20 m', '3.50 m'] },
      a: 1
    },
    {
      ro: { q: 'Cine a fost ales nr. 1 in NBA Draft 2023?',
            o: ['Scoot Henderson', 'Brandon Miller', 'Victor Wembanyama', 'Amen Thompson'] },
      en: { q: 'Who was selected #1 in the 2023 NBA Draft?',
            o: ['Scoot Henderson', 'Brandon Miller', 'Victor Wembanyama', 'Amen Thompson'] },
      a: 2
    }
  ];

  // refs
  const elStep   = document.getElementById('q-step');
  const elBar    = document.getElementById('q-bar');
  const elScore  = document.getElementById('q-score');
  const elQ      = document.getElementById('q-question');
  const elOpts   = document.getElementById('q-options');
  const elBest   = document.getElementById('q-best');
  const elReset  = document.getElementById('q-reset');
  const elBody   = root.querySelector('.quiz-body');
  const elFooter = root.querySelector('.quiz-footer');
  const elEnd    = document.getElementById('q-end');
  const elAgain  = document.getElementById('q-again');
  const elEndEmoji = document.getElementById('q-end-emoji');
  const elEndTitle = document.getElementById('q-end-title');
  const elEndText  = document.getElementById('q-end-text');

  // state
  let order = [];
  let cur = 0;
  let score = 0;
  let locked = false;

  function getLang() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('bw_lang')) || 'ro';
  }
  function tr(qData) {
    return qData[getLang()] || qData.ro;
  }
  function getBest() {
    const v = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    return isNaN(v) ? 0 : v;
  }
  function setBest(v) {
    localStorage.setItem(BEST_KEY, String(v));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start() {
    order = shuffle(QUESTIONS.map((_, i) => i));
    cur = 0;
    score = 0;
    locked = false;
    elScore.textContent = '0';
    elEnd.hidden = true;
    elBody.style.display = '';
    elFooter.style.display = '';
    elBest.textContent = getBest();
    render();
  }

  function render() {
    locked = false;
    const idx = order[cur];
    const data = tr(QUESTIONS[idx]);
    elStep.textContent = String(cur + 1);
    elBar.style.width = ((cur / QUESTIONS.length) * 100) + '%';
    elQ.textContent = data.q;

    elOpts.innerHTML = '';
    data.o.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.type = 'button';
      btn.innerHTML = `<span class="quiz-opt-letter">${'ABCD'[i]}</span><span class="quiz-opt-text">${opt}</span>`;
      btn.addEventListener('click', () => answer(i, btn));
      elOpts.appendChild(btn);
    });

    // reveal animation
    elQ.style.animation = 'none';
    void elQ.offsetWidth;
    elQ.style.animation = 'quiz-pop .45s ease both';
  }

  function answer(i, btn) {
    if (locked) return;
    locked = true;
    const idx = order[cur];
    const correct = QUESTIONS[idx].a;
    const buttons = elOpts.querySelectorAll('.quiz-opt');

    buttons.forEach((b, bi) => {
      b.disabled = true;
      if (bi === correct) b.classList.add('is-correct');
      if (bi === i && i !== correct) b.classList.add('is-wrong');
    });

    if (i === correct) {
      score++;
      elScore.textContent = String(score);
      btn.classList.add('is-correct', 'is-hit');
    }

    setTimeout(() => {
      cur++;
      elBar.style.width = ((cur / QUESTIONS.length) * 100) + '%';
      if (cur >= QUESTIONS.length) finish();
      else render();
    }, 900);
  }

  function finish() {
    const best = getBest();
    const isNew = score > best;
    if (isNew) setBest(score);
    elBest.textContent = isNew ? score : best;

    elBody.style.display = 'none';
    elFooter.style.display = 'none';
    elEnd.hidden = false;

    const lang = getLang();
    let emoji, title, text;
    if (score === 10)       { emoji = '🏆'; }
    else if (score >= 8)    { emoji = '🔥'; }
    else if (score >= 5)    { emoji = '👍'; }
    else                    { emoji = '💪'; }
    elEndEmoji.textContent = emoji;

    if (lang === 'en') {
      title = isNew ? 'New best score!' : 'Quiz finished';
      text  = `You scored ${score} out of ${QUESTIONS.length}. ` + (isNew ? 'Best ever!' : `Best: ${best}/${QUESTIONS.length}.`);
    } else {
      title = isNew ? 'Scor nou record!' : 'Quiz terminat';
      text  = `Ai obtinut ${score} din ${QUESTIONS.length}. ` + (isNew ? 'Cel mai bun rezultat de pana acum!' : `Best: ${best}/${QUESTIONS.length}.`);
    }
    elEndTitle.textContent = title;
    elEndText.textContent  = text;
  }

  elReset?.addEventListener('click', () => {
    localStorage.removeItem(BEST_KEY);
    elBest.textContent = '0';
    start();
  });
  elAgain?.addEventListener('click', start);

  // initial best on load
  elBest.textContent = getBest();
  start();
})();
