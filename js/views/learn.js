// "See it" explorers: hands-on manipulatives to build each idea before practising it.
import { SKILL, makeQuestion } from '../skills/index.js';
import { fracWords } from '../skills/frac.js';
import { timeWords, fmt } from '../skills/time.js';
import { trick } from '../skills/mult.js';
import { esc, $, $$, topBar, icon } from '../ui.js';
import { tenFrames, tenFrameSum, numberLine, numberBond, baseTen, array, groups, objects, fractionShape, fractionWall, fracHTML, clock, hundredChart, barPartWhole } from '../visuals.js';

const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/** Steppers bound to a plain object. defs: [{key, label, min, max, step}] */
function steppers(el, model, defs, onChange) {
  el.insertAdjacentHTML(
    'beforeend',
    defs
      .map(
        (d) => `<div class="stepper" data-key="${d.key}">
      <button data-d="-1" aria-label="Less ${esc(d.label)}">−</button>
      <div class="lab">${esc(d.label)}<b data-v>${model[d.key]}</b></div>
      <button data-d="1" aria-label="More ${esc(d.label)}">+</button></div>`,
      )
      .join(''),
  );
  defs.forEach((d) => {
    const row = el.querySelector(`.stepper[data-key="${d.key}"]`);
    row.addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]');
      if (!b) return;
      const min = typeof d.min === 'function' ? d.min(model) : d.min;
      const max = typeof d.max === 'function' ? d.max(model) : d.max;
      model[d.key] = Math.max(min, Math.min(max, model[d.key] + Number(b.dataset.d) * (d.step || 1)));
      onChange();
    });
  });
  return () => defs.forEach((d) => (el.querySelector(`.stepper[data-key="${d.key}"] [data-v]`).textContent = model[d.key]));
}

function speaker(app) {
  let t = null;
  return (text) => {
    clearTimeout(t);
    t = setTimeout(() => app.say(text), 350);
  };
}

// ---------------------------------------------------------------- explorers per skill

const tenFramesTab = {
  label: 'Ten-frames',
  mount(stage, ctl, app) {
    const m = { n: 7 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [{ key: 'n', label: 'Counters', min: 0, max: 20 }], () => draw(true));
    ctl.insertAdjacentHTML('beforeend', '<p class="tip">A full ten-frame is 10. Can you see 10 and some more without counting one by one?</p>');
    function draw(speak) {
      sync();
      stage.innerHTML = `${tenFrames(Array(m.n).fill('yellow'), { frames: 2 })}<div class="say-big">${m.n}</div><div class="say-small">${NUM[m.n]}${m.n > 10 ? ` — 10 and ${m.n - 10} more` : ''}</div>`;
      if (speak) talk(`${m.n}`);
    }
    draw(false);
  },
};

const hundredTab = {
  label: 'Hundred chart',
  mount(stage, ctl, app) {
    const m = { by: 2, ring: null };
    ctl.innerHTML = `<div class="field"><span>Count by</span><div class="tabs">${[1, 2, 3, 4, 5, 10].map((k) => `<button data-by="${k}" aria-selected="${k === m.by}">${k}s</button>`).join('')}</div></div>
      <button class="btn" data-count>${icon('speaker')} Count with me</button>
      <p class="tip">Tap any number. Look down a column: each step down is 10 more.</p>`;
    function draw() {
      stage.innerHTML = `${hundredChart({ hi: (n) => n % m.by === 0, ring: m.ring })}<div class="say-small" data-info>${m.ring ? `${m.ring} is ${Math.floor(m.ring / 10)} tens and ${m.ring % 10} ones` : `Counting by ${m.by}s`}</div>`;
    }
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-by]');
      if (b) {
        m.by = Number(b.dataset.by);
        $$('[data-by]', ctl).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
        draw();
      }
      if (e.target.closest('[data-count]')) app.say(Array.from({ length: Math.min(20, Math.floor(100 / m.by)) }, (_, i) => (i + 1) * m.by).join(', '), { force: true, rate: 0.85 });
    });
    stage.addEventListener('click', (e) => {
      const g = e.target.closest('[data-n]');
      if (!g) return;
      m.ring = Number(g.dataset.n);
      draw();
      app.say(String(m.ring), { force: true });
    });
    draw();
  },
};

const baseTenTab = {
  label: 'Base-ten blocks',
  mount(stage, ctl, app) {
    const m = { n: 34 };
    const talk = speaker(app);
    ctl.innerHTML = `<div class="tables" style="grid-template-columns:repeat(3,1fr)">${[100, 10, 1].map((v) => `<button class="btn" data-add="${v}">+${v}</button>`).join('')}${[100, 10, 1].map((v) => `<button class="btn" data-add="-${v}">−${v}</button>`).join('')}</div>
      <p class="tip">10 ones make 1 ten. 10 tens make 1 hundred.</p>`;
    function draw() {
      const h = Math.floor(m.n / 100);
      const t = Math.floor((m.n % 100) / 10);
      const o = m.n % 10;
      stage.innerHTML = `${baseTen(m.n)}<div class="say-big">${m.n}</div><div class="say-small">${h ? `${h} hundred${h > 1 ? 's' : ''} + ` : ''}${t} ten${t === 1 ? '' : 's'} + ${o} one${o === 1 ? '' : 's'} = ${[h * 100, t * 10, o].filter((x, i) => x || i === 2).join(' + ')}</div>`;
    }
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add]');
      if (!b) return;
      m.n = Math.max(0, Math.min(999, m.n + Number(b.dataset.add)));
      draw();
      talk(String(m.n));
    });
    draw();
  },
};

const addFramesTab = {
  label: 'Ten-frames',
  mount(stage, ctl, app) {
    const m = { a: 8, b: 5 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [
      { key: 'a', label: 'Red', min: 0, max: 10 },
      { key: 'b', label: 'Blue', min: 0, max: 10 },
    ], () => draw(true));
    const tip = document.createElement('p');
    tip.className = 'tip';
    ctl.append(tip);
    function draw(speak) {
      sync();
      const { a, b } = m;
      const s = a + b;
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      tip.textContent = s > 10 && small > 0 ? `Make 10 first: ${big} + ${10 - big} = 10, then ${small - (10 - big)} more = ${s}.` : 'Put the two groups together and count them all.';
      stage.innerHTML = `${tenFrameSum(a, b)}<div class="say-big">${a} + ${b} = ${s}</div>${numberLine(0, 20, { points: [a], jumps: b ? [{ from: a, to: s, label: `+${b}` }] : [] })}`;
      if (speak) talk(`${a} plus ${b} equals ${s}`);
    }
    draw(false);
  },
};

const bondsTab = {
  label: 'Number bonds',
  mount(stage, ctl, app) {
    const m = { whole: 10, part: 3 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [
      { key: 'whole', label: 'Whole', min: 2, max: 20 },
      { key: 'part', label: 'Part', min: 0, max: (x) => x.whole },
    ], () => draw(true));
    function draw(speak) {
      m.part = Math.min(m.part, m.whole);
      sync();
      const other = m.whole - m.part;
      const all = Array.from({ length: m.whole + 1 }, (_, i) => `${i} + ${m.whole - i}`);
      stage.innerHTML = `${numberBond(m.whole, m.part, other)}<div class="say-big">${m.part} + ${other} = ${m.whole}</div><div class="say-small">All the ways to make ${m.whole}: ${all.join(' · ')}</div>`;
      if (speak) talk(`${m.part} and ${other} make ${m.whole}`);
    }
    draw(false);
  },
};

const takeAwayTab = {
  label: 'Take away',
  mount(stage, ctl, app) {
    const m = { total: 13, take: 5 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [
      { key: 'total', label: 'Start with', min: 1, max: 20 },
      { key: 'take', label: 'Take away', min: 0, max: (x) => x.total },
    ], () => draw(true));
    ctl.insertAdjacentHTML('beforeend', '<p class="tip">Take away to 10 first, then the rest. 13 − 5: 13 − 3 = 10, 10 − 2 = 8.</p>');
    function draw(speak) {
      m.take = Math.min(m.take, m.total);
      sync();
      const left = m.total - m.take;
      stage.innerHTML = `${tenFrames([...Array(left).fill('orange'), ...Array(m.take).fill('x:orange')], { frames: 2 })}<div class="say-big">${m.total} − ${m.take} = ${left}</div>${numberLine(0, 20, { points: [m.total], jumps: m.take ? [{ from: m.total, to: left, label: `−${m.take}` }] : [] })}`;
      if (speak) talk(`${m.total} take away ${m.take} leaves ${left}`);
    }
    draw(false);
  },
};

const arrayTab = {
  label: 'Arrays',
  mount(stage, ctl, app) {
    const m = { rows: 3, cols: 4 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [
      { key: 'rows', label: 'Rows', min: 1, max: 10 },
      { key: 'cols', label: 'In each row', min: 1, max: 10 },
    ], () => draw(true));
    ctl.insertAdjacentHTML('beforeend', `<button class="btn" data-flip>Turn it around</button><p class="tip" data-trick></p>`);
    $('[data-flip]', ctl).addEventListener('click', () => {
      [m.rows, m.cols] = [m.cols, m.rows];
      draw(true);
    });
    function draw(speak) {
      sync();
      const { rows, cols } = m;
      const p = rows * cols;
      $('[data-trick]', ctl).textContent = `${rows} × ${cols} and ${cols} × ${rows} are the same: ${p}. ${trick(rows, cols)}`;
      stage.innerHTML = `${array(rows, cols, { rowSums: true, size: rows > 6 || cols > 6 ? 30 : 40 })}<div class="say-big">${rows} × ${cols} = ${p}</div><div class="say-small">${rows} row${rows > 1 ? 's' : ''} of ${cols}${rows <= 6 ? `: ${Array(rows).fill(cols).join(' + ')} = ${p}` : ''}</div>`;
      if (speak) talk(`${rows} times ${cols} equals ${p}`);
    }
    draw(false);
  },
};

const tableGridTab = {
  label: 'Table grid',
  mount(stage, ctl, app) {
    const m = { r: 3, c: 4 };
    ctl.innerHTML = '<p class="tip">Tap a box. The coloured rectangle is an array: rows × columns.</p><p class="tip">Find the square numbers on the diagonal: 1, 4, 9, 16…</p>';
    function draw() {
      let cells = '<div class="tgrid-h"></div>';
      for (let c = 1; c <= 10; c++) cells += `<div class="tgrid-h">${c}</div>`;
      for (let r = 1; r <= 10; r++) {
        cells += `<div class="tgrid-h">${r}</div>`;
        for (let c = 1; c <= 10; c++) cells += `<button class="tgrid-c${r <= m.r && c <= m.c ? ' on' : ''}${r === m.r && c === m.c ? ' end' : ''}" data-r="${r}" data-c="${c}" aria-label="${r} times ${c}">${r * c}</button>`;
      }
      stage.innerHTML = `<div class="tgrid">${cells}</div><div class="say-big">${m.r} × ${m.c} = ${m.r * m.c}</div>`;
    }
    stage.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b) return;
      m.r = Number(b.dataset.r);
      m.c = Number(b.dataset.c);
      draw();
      app.say(`${m.r} times ${m.c} equals ${m.r * m.c}`, { force: true });
    });
    draw();
  },
};

const skipTab = {
  label: 'Skip count',
  mount(stage, ctl, app) {
    const m = { n: 3 };
    const sync = steppers(ctl, m, [{ key: 'n', label: 'Table of', min: 2, max: 10 }], () => draw());
    ctl.insertAdjacentHTML('beforeend', `<button class="btn" data-count>${icon('speaker')} Say the table</button>`);
    $('[data-count]', ctl).addEventListener('click', () => app.say(Array.from({ length: 10 }, (_, i) => `${i + 1} ${m.n === 1 ? '' : 'times'} ${m.n} is ${(i + 1) * m.n}`).join('. '), { force: true, rate: 0.9 }));
    function draw() {
      sync();
      const n = m.n;
      const seq = Array.from({ length: 10 }, (_, i) => (i + 1) * n);
      stage.innerHTML = `${numberLine(0, n * 10, { labelEvery: n, jumps: seq.map((v) => ({ from: v - n, to: v })) })}<div class="say-big" style="font-size:clamp(1.4rem,3.4vw,2.2rem)">${seq.join(', ')}</div>
        <div class="table-wrap"><table style="max-width:420px;margin:0 auto">${seq.map((v, i) => `<tr><td>${i + 1} × ${n}</td><td class="num"><b>${v}</b></td></tr>`).join('')}</table></div>`;
    }
    draw();
  },
};

const shareTab = {
  label: 'Share',
  mount(stage, ctl, app) {
    const m = { total: 14, plates: 3 };
    let timer = null;
    const sync = steppers(ctl, m, [
      { key: 'total', label: 'Cookies', min: 0, max: 30 },
      { key: 'plates', label: 'Plates', min: 1, max: 6 },
    ], () => draw(0));
    ctl.insertAdjacentHTML('beforeend', `<button class="btn primary" data-deal>Share them out!</button><p class="tip">Give one to each plate, again and again. Any that can't go round are left over.</p>`);
    function draw(dealt) {
      sync();
      const per = Math.floor(dealt / m.plates);
      const extra = dealt % m.plates;
      const done = dealt === m.total;
      const q = Math.floor(m.total / m.plates);
      const r = m.total % m.plates;
      // while dealing, the first `extra` plates hold one more than the rest
      const plates = Array.from({ length: m.plates }, (_, i) => per + (i < extra && !done ? 1 : 0));
      const shown = done && dealt ? groups(m.plates, q, { emoji: '🍪', leftover: r, perRow: 3 }) : unevenGroups(plates, m.total - dealt);
      stage.innerHTML = `${shown}<div class="say-big">${done && dealt ? `${m.total} ÷ ${m.plates} = ${q}${r ? ` <small class="muted">(${r} left over)</small>` : ''}` : dealt ? 'Sharing…' : `${m.total} cookies, ${m.plates} plates`}</div>`;
      if (done && dealt) app.say(`Each plate gets ${q}${r ? `, and ${r} ${r === 1 ? 'is' : 'are'} left over` : ''}.`);
    }
    $('[data-deal]', ctl).addEventListener('click', () => {
      clearInterval(timer);
      let d = 0;
      timer = setInterval(() => {
        d += 1;
        draw(d);
        app.sfx.tap();
        if (d >= m.total) clearInterval(timer);
      }, Math.max(120, 1800 / Math.max(1, m.total)));
    });
    draw(0);
    return () => clearInterval(timer);
  },
};

/** Plates that may hold different counts (mid-deal), plus the pile still waiting. */
function unevenGroups(counts, waiting) {
  const parts = counts.map((c) => groups(1, c, { emoji: '🍪' }));
  const pile = waiting ? `<div style="width:min(100%,${Math.min(10, waiting) * 34 + 8}px)">${objects(waiting, '🍪', { perRow: 10, size: 34 })}</div><div class="say-small">${waiting} still to share</div>` : '';
  return `<div class="row" style="justify-content:center;gap:6px">${parts.map((p) => `<div style="width:120px">${p}</div>`).join('')}</div>${pile}`;
}

const cutTab = {
  label: 'Cut & shade',
  mount(stage, ctl, app) {
    const m = { d: 4, shape: 'circle', on: new Set([0]) };
    const sync = steppers(ctl, m, [{ key: 'd', label: 'Equal parts', min: 1, max: 12 }], () => {
      m.on = new Set([...m.on].filter((i) => i < m.d));
      draw();
    });
    ctl.insertAdjacentHTML('beforeend', `<div class="tabs">${['circle', 'rect'].map((s) => `<button data-shape="${s}" aria-selected="${s === m.shape}">${s === 'circle' ? 'Pizza' : 'Chocolate bar'}</button>`).join('')}</div><p class="tip">Tap the parts to colour them. The bottom number is how many equal parts. The top number is how many are coloured.</p>`);
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-shape]');
      if (!b) return;
      m.shape = b.dataset.shape;
      $$('[data-shape]', ctl).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      draw();
    });
    stage.addEventListener('click', (e) => {
      const parts = $$('.shade, .part', stage.querySelector('.viz'));
      const i = parts.indexOf(e.target);
      if (i < 0) return;
      if (m.on.has(i)) m.on.delete(i);
      else m.on.add(i);
      draw();
      app.say(fracWords(m.on.size, m.d) || '', { force: true });
    });
    function draw() {
      sync();
      const n = m.on.size;
      stage.innerHTML = `<div class="tap" style="width:min(100%,360px)">${fractionShape({ shape: m.shape, d: m.d, shaded: [...m.on], size: 240 })}</div><div class="say-big">${fracHTML(n, m.d)}</div><div class="say-small">${n} of ${m.d} equal parts — ${fracWords(n, m.d)}</div>`;
    }
    draw();
  },
};

const wallTab = {
  label: 'Fraction wall',
  mount(stage, ctl, app) {
    let sel = { d: 3, i: 0 };
    ctl.innerHTML = '<p class="tip">Tap a piece. Which is bigger: 1/3 or 1/5? The more pieces the whole is cut into, the smaller each piece.</p><p class="tip">Line up 2/4 with 1/2. Same size! They are equal.</p>';
    function draw() {
      stage.innerHTML = `${fractionWall([1, 2, 3, 4, 5, 6, 8, 10], { selected: sel })}<div class="say-big">${fracHTML(sel.i + 1, sel.d)}</div><div class="say-small">${fracWords(sel.i + 1, sel.d)}</div>`;
    }
    stage.addEventListener('click', (e) => {
      const g = e.target.closest('[data-d]');
      if (!g) return;
      sel = { d: Number(g.dataset.d), i: Number(g.dataset.i) };
      draw();
      app.say(fracWords(sel.i + 1, sel.d), { force: true });
    });
    draw();
  },
};

const clockTab = {
  label: 'Clock',
  mount(stage, ctl, app) {
    const m = { h: 3, m: 0 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [
      { key: 'h', label: 'Hour', min: 1, max: 12 },
      { key: 'm', label: 'Minutes', min: 0, max: 55, step: 5 },
    ], () => draw(true));
    ctl.insertAdjacentHTML('beforeend', `<div class="tables" style="grid-template-columns:repeat(2,1fr)">${[
      [0, "o'clock"],
      [15, 'quarter past'],
      [30, 'half past'],
      [45, 'quarter to'],
    ].map(([v, l]) => `<button class="btn small" data-min="${v}">${l}</button>`).join('')}</div>
      <p class="tip">The short red hand shows the hour. The long blue hand shows minutes: each number is 5 minutes.</p>`);
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-min]');
      if (!b) return;
      m.m = Number(b.dataset.min);
      draw(true);
    });
    function draw(speak) {
      sync();
      stage.innerHTML = `<div style="width:min(100%,340px)">${clock(m.h, m.m, { size: 300 })}</div><div class="say-big">${fmt(m.h, m.m)}</div><div class="say-small">${timeWords(m.h, m.m)}</div>`;
      if (speak) talk(timeWords(m.h, m.m));
    }
    draw(false);
  },
};

const barTab = {
  label: 'Bar model',
  mount(stage, ctl, app) {
    const m = { a: 7, b: 5 };
    const talk = speaker(app);
    const sync = steppers(ctl, m, [
      { key: 'a', label: 'Part A', min: 1, max: 20 },
      { key: 'b', label: 'Part B', min: 1, max: 20 },
    ], () => {
      draw();
      talk(`${m.a} and ${m.b} make ${m.a + m.b}`);
    });
    ctl.insertAdjacentHTML('beforeend', '<p class="tip">One bar model, two stories! If you know both parts, add. If you know the whole and one part, take away.</p>');
    function draw() {
      sync();
      const { a, b } = m;
      stage.innerHTML = `${barPartWhole([{ v: a, label: a }, { v: b, label: b }], a + b)}
        <ol class="steps"><li>Ria has ${a} stickers and gets ${b} more. How many now? <b>${a} + ${b} = ${a + b}</b></li>
        <li>Ria has ${a + b} stickers and gives away ${b}. How many left? <b>${a + b} − ${b} = ${a}</b></li></ol>`;
    }
    draw();
  },
};

const clueTab = {
  label: 'Clue words',
  mount(stage, ctl) {
    ctl.innerHTML = '<p class="tip">Read the story. Find who, what, and the question. Draw it. Then choose + − × ÷.</p>';
    const rows = [
      ['altogether, in all, more, total', '+', 'add'],
      ['left, gave away, fewer, how many more', '−', 'take away / compare'],
      ['each, groups of, rows of, every', '×', 'equal groups'],
      ['share equally, split, each get', '÷', 'divide'],
    ];
    stage.innerHTML = `<div class="table-wrap" style="width:100%"><table><thead><tr><th>When you see…</th><th>Try</th></tr></thead><tbody>${rows.map(([w, s, n]) => `<tr><td>${w}</td><td><b style="font-size:1.6rem">${s}</b> ${n}</td></tr>`).join('')}</tbody></table></div>
      <p class="tip" style="width:100%">Clue words help, but always check: does my answer make sense?</p>`;
  },
};

/** Worked examples: generate a question, think, then reveal the answer and explanation. */
const examplesTab = (label, skill, levels) => ({
  label,
  mount(stage, ctl, app) {
    ctl.innerHTML = `<button class="btn primary" data-show>Show the answer</button><button class="btn" data-new>New example</button>
      <p class="tip">Try it in your head first. Then check!</p>`;
    let q;
    function draw() {
      q = makeQuestion(skill, levels[Math.floor(app.rng() * levels.length)], app.rng);
      const math = q.math ? `<div class="qmath">${(Array.isArray(q.math) ? q.math : [q.math]).map((l) => `<span class="line">${l}</span>`).join('')}</div>` : '';
      const choices = q.kind === 'choice' ? `<div class="row" style="justify-content:center">${q.choices.map((c) => `<span class="chip" style="font-size:1.3rem">${c.html || esc(c.label)}</span>`).join('')}</div>` : '';
      stage.innerHTML = `<div class="qtext" style="text-align:center">${esc(q.text)}</div>${math}${q.visual || ''}${choices}<div class="fb good" data-ans hidden></div>`;
      app.say(q.say || q.text);
    }
    ctl.addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) draw();
      if (e.target.closest('[data-show]')) {
        const box = $('[data-ans]', stage);
        const label = q.kind === 'number' ? q.answer : q.choices.find((c) => String(c.value) === String(q.answer))?.label;
        box.innerHTML = `<div>Answer: ${esc(label)}</div><div class="explain">${esc(q.explain || '')}</div>${q.hint?.visual || ''}`;
        box.hidden = false;
        app.say(`${label}. ${q.explain || ''}`);
      }
    });
    draw();
  },
});

const EXPLORERS = {
  count: [tenFramesTab, hundredTab],
  place: [baseTenTab, hundredTab],
  add: [addFramesTab, bondsTab],
  sub: [takeAwayTab, bondsTab],
  mult: [arrayTab, tableGridTab, skipTab],
  div: [shareTab, arrayTab],
  frac: [cutTab, wallTab],
  time: [clockTab],
  logic: [examplesTab('Patterns', 'logic', [1, 2, 5]), examplesTab('Balance', 'logic', [3]), examplesTab('Pyramids', 'logic', [4]), examplesTab('Think it through', 'logic', [6])],
  story: [barTab, clueTab, examplesTab('Trick questions', 'story', [5])],
};

export function learn(root, { id }, app) {
  const sk = SKILL[id];
  if (!sk) return app.go('');
  const tabs = EXPLORERS[id];
  let current = 0;
  let cleanup = null;
  root.innerHTML = `<div class="screen">
    ${topBar(app, { title: `See it: ${sk.title}`, back: `#/skill/${id}` })}
    ${tabs.length > 1 ? `<div class="tabs" role="tablist">${tabs.map((t, i) => `<button role="tab" data-tab="${i}" aria-selected="${i === 0}">${esc(t.label)}</button>`).join('')}</div>` : ''}
    <div class="learn">
      <section class="card stage" data-stage></section>
      <aside class="card controls" data-controls></aside>
    </div>
    <div class="row"><a class="btn big primary" href="#/practice/${id}">Practice now ${icon('next')}</a></div>
  </div>`;
  const mount = (i) => {
    cleanup?.();
    current = i;
    const stage = $('[data-stage]', root);
    const ctl = $('[data-controls]', root);
    // replace the nodes so listeners from the previous tab are dropped
    const s2 = stage.cloneNode(false);
    const c2 = ctl.cloneNode(false);
    stage.replaceWith(s2);
    ctl.replaceWith(c2);
    cleanup = tabs[i].mount(s2, c2, app) || null;
    $$('[data-tab]', root).forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.tab) === current)));
  };
  // listen on this screen, not on #app, which outlives it
  root.firstElementChild.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) mount(Number(b.dataset.tab));
  });
  mount(0);
  return () => cleanup?.();
}
