// Games: a 60-second speed round (opt-in timing) and Make 10 pairs.
import { int, pick, shuffle } from '../rng.js';
import { multKey } from '../skills/mult.js';
import { reviewFact } from '../mastery.js';
import { addDay } from '../store.js';
import { esc, $, topBar, numpad, confetti, fmtDuration } from '../ui.js';
import { tenFrames, groups, clock } from '../visuals.js';

const SPRINTS = {
  add10: { label: '+ up to 10', make: (r) => { const a = int(r, 0, 10); const b = int(r, 0, 10 - a); return [`${a} + ${b}`, a + b]; } },
  add20: { label: '+ up to 20', make: (r) => { const a = int(r, 1, 10); const b = int(r, 1, 10); return [`${a} + ${b}`, a + b]; } },
  sub20: { label: '− up to 20', make: (r) => { const a = int(r, 2, 20); const b = int(r, 1, Math.min(10, a)); return [`${a} − ${b}`, a - b]; } },
  mult: { label: '× tables', table: true, make: (r, t) => { const a = t || int(r, 2, 10); const b = int(r, 1, 10); return [`${a} × ${b}`, a * b, multKey(a, b)]; } },
  div: { label: '÷ tables', table: true, make: (r, t) => { const a = t || int(r, 2, 10); const b = int(r, 1, 10); return [`${a * b} ÷ ${a}`, b]; } },
};

const SECONDS = 60;

export function play(root, _p, app) {
  root.innerHTML = `<div class="screen">
    ${topBar(app, { title: 'Games' })}
    <div class="games">
      <a class="action" href="#/play/sprint">${clock(12, 10, { size: 90 })}<b>Speed Round</b><span>How many can you answer in ${SECONDS} seconds? Play this once you know the facts.</span></a>
      <a class="action" href="#/play/make10">${tenFrames(Array(7).fill('red').concat(Array(3).fill('blue')), { cell: 20 })}<b>Make 10</b><span>Tap two cards that add up to 10 (or 20, or 100).</span></a>
      <a class="action" href="#/learn/mult">${groups(3, 4, { color: 'blue', perRow: 3 })}<b>Times-table Explorer</b><span>Build arrays and tap the table grid.</span></a>
    </div>
  </div>`;
}

export function game(root, { game: g }, app) {
  if (g === 'sprint') return sprint(root, app);
  if (g === 'make10') return make10(root, app);
  return app.go('play');
}

// ---------------------------------------------------------------- speed round

function sprint(root, app) {
  const { state } = app;
  let mode = 'add10';
  let table = 0;
  let interval = null;
  let keyHandler = null;
  const onKey = (e) => keyHandler?.(e);
  window.addEventListener('keydown', onKey);
  const bestKey = () => `${mode}${SPRINTS[mode].table ? `:${table || 'all'}` : ''}`;

  function setup() {
    const best = state.games.sprint[bestKey()];
    root.innerHTML = `<div class="screen">
      ${topBar(app, { title: 'Speed Round', back: '#/play' })}
      <div class="center"><div class="card welcome-card">
        <div class="field"><span>What shall we race?</span><div class="tabs" id="sprint-mode">${Object.entries(SPRINTS).map(([k, v]) => `<button data-m="${k}" aria-selected="${k === mode}">${esc(v.label)}</button>`).join('')}</div></div>
        <div class="field" ${SPRINTS[mode].table ? '' : 'hidden'}><span>Which table?</span><div class="tabs" id="sprint-table">${[0, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => `<button data-t="${t}" aria-selected="${t === table}">${t || 'All'}</button>`).join('')}</div></div>
        <p class="muted" style="margin:0">${best ? `Best score: <b>${best}</b>` : 'No score yet. Speed comes after understanding — practise first if these are new.'}</p>
        <button class="btn big primary" id="go">Go! (${SECONDS} s)</button>
      </div></div></div>`;
    $('#sprint-mode', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      mode = b.dataset.m;
      setup();
    });
    $('#sprint-table', root)?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      table = Number(b.dataset.t);
      setup();
    });
    $('#go', root).addEventListener('click', run);
  }

  function run() {
    let score = 0;
    let answered = 0;
    const end = Date.now() + SECONDS * 1000;
    let current;
    root.innerHTML = `<div class="screen">
      ${topBar(app, { title: 'Speed Round', back: '#/play', right: `<span class="chip" data-score>0</span>` })}
      <div class="sprint-meter"><i style="width:100%" data-meter></i></div>
      <div class="practice">
        <section class="card qcard"><div class="qmath" data-q style="font-size:clamp(2.6rem,8vw,5rem)"></div><div class="fb" data-fb hidden></div></section>
        <section class="answer"><div data-input></div></section>
      </div></div>`;
    const qEl = $('[data-q]', root);
    const fb = $('[data-fb]', root);
    const next = () => {
      current = SPRINTS[mode].make(app.rng, table);
      qEl.textContent = `${current[0]} = ?`;
      app.current = { kind: 'number', answer: current[1] };
    };
    const pad = numpad($('[data-input]', root), {
      maxLen: 3,
      onSubmit: (v) => {
        const ok = Number(v) === current[1];
        answered += 1;
        if (current[2]) state.facts[current[2]] = reviewFact(state.facts[current[2]], ok, Date.now());
        if (ok) {
          score += 1;
          app.sfx.correct();
          $('[data-score]', root).textContent = score;
          fb.hidden = true;
        } else {
          app.sfx.wrong();
          fb.className = 'fb bad';
          fb.textContent = `${current[0]} = ${current[1]}`;
          fb.hidden = false;
        }
        pad.clear();
        next();
      },
    });
    keyHandler = (e) => {
      if (/^\d$/.test(e.key)) pad.press(e.key);
      else if (e.key === 'Backspace') pad.press('del');
      else if (e.key === 'Enter') pad.press('go');
    };
    next();
    interval = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      $('[data-meter]', root).style.width = `${(left / (SECONDS * 1000)) * 100}%`;
      if (left <= 0) {
        clearInterval(interval);
        finish(score, answered);
      }
    }, 250);
  }

  function finish(score, answered) {
    keyHandler = null;
    app.current = null;
    const key = bestKey();
    const prev = state.games.sprint[key] || 0;
    const isBest = score > prev;
    if (isBest) state.games.sprint[key] = score;
    addDay(state, { q: answered, c: score, ms: SECONDS * 1000 });
    state.sessions.push({ t: Date.now(), kind: 'game', type: `sprint:${key}`, n: answered, c: score, ms: SECONDS * 1000 });
    app.save();
    app.sfx.done();
    if (isBest && score > 0) confetti();
    root.innerHTML = `<div class="screen">${topBar(app, { title: 'Speed Round', back: '#/play' })}
      <div class="center"><div class="big-stars">${score}</div><p class="hello" style="font-size:1.6rem">${isBest && score ? 'New best score!' : `Best: ${Math.max(prev, score)}`}</p>
      <p class="muted">${answered} answered, ${score} right.</p>
      <div class="row"><button class="btn big primary" id="again">Again</button><a class="btn big" href="#/play">Games</a></div></div></div>`;
    app.say(`${score} right!${isBest && score ? ' New best score!' : ''}`);
    $('#again', root).addEventListener('click', setup);
  }

  setup();
  return () => {
    clearInterval(interval);
    window.removeEventListener('keydown', onKey);
  };
}

// ---------------------------------------------------------------- make 10

function make10(root, app) {
  const { state } = app;
  let target = 10;
  let tick = null;

  function pairs() {
    const out = [];
    const used = new Set();
    while (out.length < 12) {
      let a;
      if (target === 10) a = int(app.rng, 1, 9);
      else if (target === 20) a = int(app.rng, 2, 18);
      else a = pick(app.rng, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]);
      const b = target - a;
      const k = `${Math.min(a, b)}`;
      if (used.has(k) && used.size < (target === 10 ? 5 : 9)) continue;
      used.add(k);
      out.push(a, b);
    }
    return shuffle(app.rng, out);
  }

  function start() {
    const cards = pairs();
    const t0 = Date.now();
    let sel = null;
    let left = cards.length;
    root.innerHTML = `<div class="screen">
      ${topBar(app, { title: `Make ${target}`, back: '#/play', right: '<span class="chip timer" data-time>0 s</span>' })}
      <div class="tabs">${[10, 20, 100].map((t) => `<button data-target="${t}" aria-selected="${t === target}">Make ${t}</button>`).join('')}</div>
      <div class="cards10">${cards.map((n, i) => `<button class="card10" data-i="${i}" aria-label="${n}">${n}${target === 10 ? tenFrames(Array(n).fill('red'), { cell: 16, frames: 1 }) : ''}</button>`).join('')}</div>
      <p class="muted" style="font-weight:700">Tap two cards that add up to ${target}.</p></div>`;
    app.current = { kind: 'pairs', cards, target };
    clearInterval(tick);
    tick = setInterval(() => {
      const el = $('[data-time]', root);
      if (el) el.textContent = `${Math.floor((Date.now() - t0) / 1000)} s`;
    }, 1000);
    root.querySelector('.tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-target]');
      if (!b) return;
      target = Number(b.dataset.target);
      start();
    });
    root.querySelector('.cards10').addEventListener('click', (e) => {
      const b = e.target.closest('.card10');
      if (!b || b.classList.contains('gone')) return;
      if (sel === b) {
        b.classList.remove('sel');
        sel = null;
        return;
      }
      if (!sel) {
        sel = b;
        b.classList.add('sel');
        app.sfx.tap();
        return;
      }
      const a = cards[Number(sel.dataset.i)];
      const c = cards[Number(b.dataset.i)];
      if (a + c === target) {
        app.sfx.correct();
        sel.classList.add('gone');
        b.classList.add('gone');
        sel.classList.remove('sel');
        app.say(`${a} and ${c} make ${target}`);
        sel = null;
        left -= 2;
        if (!left) done(Date.now() - t0);
      } else {
        app.sfx.wrong();
        [sel, b].forEach((x) => {
          x.classList.remove('sel', 'shake');
          void x.offsetWidth;
          x.classList.add('shake');
        });
        app.say(`${a} and ${c} make ${a + c}. Try again.`);
        sel = null;
      }
    });
  }

  function done(ms) {
    clearInterval(tick);
    const k = String(target);
    const prev = state.games.make10[k];
    const isBest = !prev || ms < prev;
    if (isBest) state.games.make10[k] = ms;
    addDay(state, { q: 6, c: 6, ms });
    state.sessions.push({ t: Date.now(), kind: 'game', type: `make${target}`, n: 6, c: 6, ms });
    app.save();
    app.sfx.done();
    confetti();
    root.innerHTML = `<div class="screen">${topBar(app, { title: `Make ${target}`, back: '#/play' })}
      <div class="center"><div class="big-stars">${fmtDuration(ms)}</div><p class="hello" style="font-size:1.6rem">${isBest ? 'Your fastest yet!' : `Best: ${fmtDuration(prev)}`}</p>
      <div class="row"><button class="btn big primary" id="again">Again</button><a class="btn big" href="#/play">Games</a></div></div></div>`;
    $('#again', root).addEventListener('click', start);
  }

  start();
  return () => clearInterval(tick);
}
