// Grown-ups area: progress, test history, settings, backup and printable worksheets.
import { SKILLS, SKILL, makeQuestion, answerLabel } from '../skills/index.js';
import { accuracy } from '../mastery.js';
import { multKey } from '../skills/mult.js';
import { streak, dayKey, exportCode, importCode, defaultState, setGrade, save } from '../store.js';
import { int } from '../rng.js';
import { esc, $, topBar, numpad, modal, toast, fmtDuration, fmtDate } from '../ui.js';

const UNLOCK_MS = 10 * 60e3;
let unlockedUntil = 0;

/** Swap in an empty copy of el so a re-render never stacks a second set of listeners. */
function fresh(el) {
  const box = el.cloneNode(false);
  el.replaceWith(box);
  return box;
}

export function parent(root, { tab = 'progress' }, app) {
  if (Date.now() > unlockedUntil) return gate(root, app, tab);
  const tabs = [
    ['progress', 'Progress'],
    ['tests', 'Tests'],
    ['settings', 'Settings'],
    ['worksheet', 'Worksheets'],
  ];
  root.innerHTML = `<div class="screen">
    ${topBar(app, { title: 'Grown-ups', sub: app.state.profile.name ? `${app.state.profile.name}'s progress` : '' })}
    <nav class="tabs no-print" role="tablist">${tabs.map(([id, l]) => `<a class="btn small${id === tab ? ' primary' : ''}" role="tab" aria-selected="${id === tab}" href="#/parent/${id}">${l}</a>`).join('')}</nav>
    <div data-body class="screen"></div></div>`;
  const body = $('[data-body]', root);
  ({ progress, tests, settings, worksheet }[tab] || progress)(body, app);
}

function gate(root, app, tab) {
  const a = int(app.rng, 12, 19);
  const b = int(app.rng, 3, 9);
  root.innerHTML = `<div class="screen">${topBar(app, { title: 'Grown-ups only' })}
    <div class="center"><div class="card gate screen" style="gap:14px">
      <p style="margin:0;font-weight:800;font-size:1.3rem">To open the grown-ups' page, answer:</p>
      <div class="qmath">${a} × ${b} = ?</div>
      <div data-pad></div>
    </div></div></div>`;
  const pad = numpad($('[data-pad]', root), {
    maxLen: 3,
    onSubmit: (v) => {
      if (Number(v) === a * b) {
        unlockedUntil = Date.now() + UNLOCK_MS;
        parent(root, { tab }, app);
      } else {
        pad.shake();
        pad.clear();
      }
    },
  });
  app.current = { kind: 'number', answer: a * b };
}

// ---------------------------------------------------------------- charts

/** Single-series column chart. Bars ≤24px with rounded tops; hover titles; the last value labelled. */
function columns(values, labels, { max = Math.max(1, ...values), unit = '', height = 170, low = () => false } = {}) {
  const n = values.length;
  const W = 640;
  const padL = 34;
  const padB = 26;
  const top = 18;
  const plotH = height - padB - top;
  const slot = (W - padL) / Math.max(1, n);
  const bw = Math.min(24, slot * 0.6);
  const y = (v) => top + plotH - (v / max) * plotH;
  let s = '';
  [0, 0.5, 1].forEach((f) => {
    const v = Math.round(max * f);
    s += `<line x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11">${v}${unit}</text>`;
  });
  values.forEach((v, i) => {
    const x = padL + i * slot + (slot - bw) / 2;
    const yt = y(v);
    const base = top + plotH;
    const r = Math.min(4, (base - yt) / 2);
    if (v > 0) s += `<path d="M${x} ${base}V${yt + r}Q${x} ${yt} ${x + r} ${yt}H${x + bw - r}Q${x + bw} ${yt} ${x + bw} ${yt + r}V${base}Z" class="bar-col${low(v) ? ' low' : ''}"><title>${esc(labels[i])}: ${v}${unit}</title></path>`;
    if (i % Math.ceil(n / 7) === 0 || i === n - 1) s += `<text x="${x + bw / 2}" y="${height - 8}" text-anchor="middle" font-size="11">${esc(labels[i])}</text>`;
    if (i === n - 1 && v > 0) s += `<text x="${x + bw / 2}" y="${yt - 5}" text-anchor="middle" font-size="12" font-weight="800">${v}${unit}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${height}" role="img" style="width:100%;height:auto">${s}</svg>`;
}

const pctPill = (acc, n) => {
  if (acc === null || n < 5) return '<span class="pill none">too few</span>';
  const p = Math.round(acc * 100);
  const cls = p >= 80 ? 'good' : p >= 60 ? 'warn' : 'bad';
  return `<span class="pill ${cls}">${p}%</span>`;
};

// ---------------------------------------------------------------- progress

function progress(el, app) {
  el = fresh(el);
  const { state } = app;
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ key: dayKey(d.getTime()), label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), ...(state.days[dayKey(d.getTime())] || { q: 0, c: 0, ms: 0 }) });
  }
  const week = days.slice(-7);
  const wq = week.reduce((s, d) => s + d.q, 0);
  const wc = week.reduce((s, d) => s + d.c, 0);
  const wms = week.reduce((s, d) => s + d.ms, 0);

  const rows = SKILLS.map((sk) => {
    const p = state.skills[sk.id];
    const on = state.settings.enabled[sk.id] !== false;
    return `<tr${on ? '' : ' class="muted"'}><td><b>${esc(sk.title)}</b>${on ? '' : ' (off)'}<div class="muted" style="font-size:.85rem">${esc(sk.levels[p.level - 1].name)}</div></td>
      <td><span class="mini-step"><button data-lv="${sk.id}" data-d="-1" aria-label="Lower level">−</button><b style="min-width:3.4em;text-align:center">${p.level} / ${sk.levels.length}</b><button data-lv="${sk.id}" data-d="1" aria-label="Raise level">+</button></span></td>
      <td>${pctPill(accuracy(p), p.recent.length)}</td><td class="num">${p.attempts}</td><td>${p.last ? fmtDate(p.last) : '—'}</td></tr>`;
  }).join('');

  const missed = Object.entries(state.facts)
    .filter(([k, f]) => k.startsWith('m:') && f.miss > 0 && f.box <= 2)
    .sort((a, b) => b[1].miss - a[1].miss)
    .slice(0, 8)
    .map(([k, f]) => `<span class="pill bad">${k.slice(2).replace('x', ' × ')} (missed ${f.miss})</span>`)
    .join(' ');
  const weak = SKILLS.filter((sk) => state.skills[sk.id].recent.length >= 10 && accuracy(state.skills[sk.id]) < 0.6).map((sk) => esc(sk.title));

  let heat = '<div class="h"></div>';
  for (let c = 1; c <= 10; c++) heat += `<div class="h">${c}</div>`;
  for (let r = 1; r <= 10; r++) {
    heat += `<div class="h">${r}</div>`;
    for (let c = 1; c <= 10; c++) {
      const f = state.facts[multKey(r, c)];
      heat += `<div class="b${f ? f.box : 0}" title="${r} × ${c}: ${f ? `seen ${f.seen}, missed ${f.miss}` : 'not practised yet'}">${r * c}</div>`;
    }
  }

  el.innerHTML = `
    <div class="stats">
      <div class="stat"><span>Questions this week</span><b>${wq}</b></div>
      <div class="stat"><span>Right first time</span><b>${wq ? Math.round((wc / wq) * 100) : 0}%</b></div>
      <div class="stat"><span>Time this week</span><b>${Math.round(wms / 60000)} min</b></div>
      <div class="stat"><span>Day streak</span><b>${streak(state.days)}</b></div>
    </div>
    <div class="card"><h2 style="font-size:1.1rem">Questions answered per day</h2><p class="muted" style="margin:4px 0 8px;font-size:.9rem">Last 14 days. 10–15 minutes a day beats one long weekend session.</p>${columns(days.map((d) => d.q), days.map((d) => d.label))}</div>
    ${weak.length || missed ? `<div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Needs attention</h2>${weak.length ? `<p style="margin:0 0 8px">Below 60% lately: <b>${weak.join(', ')}</b>. Try the “See it” screen together before more practice.</p>` : ''}${missed ? `<p style="margin:0">Most-missed facts: ${missed}</p>` : ''}</div>` : ''}
    <div class="card table-wrap"><h2 style="font-size:1.1rem;margin-bottom:8px">Topics</h2>
      <table><thead><tr><th>Topic</th><th>Level</th><th>Last 20</th><th class="num">Answered</th><th>Last</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted" style="font-size:.9rem;margin:10px 0 0">Levels move by themselves (up after 8 of 10 right, down after 3 misses in a row). Use − / + to place her yourself.</p></div>
    <div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Times-table facts</h2>
      <div class="heat" style="max-width:520px">${heat}</div>
      <div class="legend" style="margin-top:10px"><span><i class="b0" style="background:var(--card-2)"></i>Not yet</span><span><i style="background:color-mix(in srgb,var(--m-green) 18%,var(--card))"></i>Just missed</span><span><i style="background:color-mix(in srgb,var(--m-green) 45%,var(--card))"></i>Learning</span><span><i style="background:color-mix(in srgb,var(--m-green) 90%,var(--card))"></i>Solid (remembered over weeks)</span></div>
    </div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lv]');
    if (!b) return;
    const p = state.skills[b.dataset.lv];
    const max = SKILL[b.dataset.lv].levels.length;
    p.level = Math.max(1, Math.min(max, p.level + Number(b.dataset.d)));
    p.window = [];
    p.failRun = 0;
    p.mastered = false;
    app.save();
    progress(el, app);
  });
}

// ---------------------------------------------------------------- tests

function tests(el, app) {
  el = fresh(el);
  const list = app.state.tests.slice().reverse();
  const last = app.state.tests.slice(-12);
  const rows = list
    .map(
      (t, i) => `<tr><td>${fmtDate(t.t)}</td><td>${esc(t.title || t.type)}</td><td class="num">${t.score} / ${t.max}</td><td>${pctPill(t.score / t.max, 99)}</td><td class="num">${fmtDuration(t.ms)}</td>
      <td>${t.wrong.length ? `<button class="btn small" data-open="${i}">${t.wrong.length} to review</button>` : '—'}</td></tr>
      <tr data-detail="${i}" hidden><td colspan="6"><div class="review">${t.wrong.map((w) => `<div class="item"><div><b>${esc(w.text)}</b>${w.math ? `<div>${w.math}</div>` : ''}<div class="muted">${esc(SKILL[w.skill]?.title || '')}</div></div><div><div class="ans">${esc(w.answer)}</div><div class="given">${esc(w.given)}</div></div></div>`).join('')}</div>
      <div class="muted" style="margin-top:6px">${Object.entries(t.perSkill).map(([id, [c, n]]) => `${esc(SKILL[id]?.title || id)} ${c}/${n}`).join(' · ')}</div></td></tr>`,
    )
    .join('');
  el.innerHTML = `
    <div class="card"><h2 style="font-size:1.1rem;margin-bottom:10px">Start a test</h2>
      <div class="row"><a class="btn primary" href="#/test/weekly">Weekly Check-up (20)</a><a class="btn" href="#/test/olympiad">Olympiad Mock (15)</a><a class="btn" href="#/test/tables">Times-table Test (20)</a></div>
      <p class="muted" style="margin:10px 0 0;font-size:.95rem">Tests give no hints and one try per question, so the score shows what she can do alone. Do the Weekly Check-up on the same day each week.</p></div>
    ${last.length ? `<div class="card"><h2 style="font-size:1.1rem">Test scores</h2><p class="muted" style="margin:4px 0 8px;font-size:.9rem">Percent of points, last ${last.length} tests. Orange is below 60%.</p>${columns(last.map((t) => Math.round((t.score / t.max) * 100)), last.map((t) => fmtDate(t.t)), { max: 100, unit: '%', low: (v) => v < 60 })}</div>` : ''}
    <div class="card table-wrap"><h2 style="font-size:1.1rem;margin-bottom:8px">History</h2>
      ${rows ? `<table><thead><tr><th>Date</th><th>Test</th><th class="num">Score</th><th>%</th><th class="num">Time</th><th>Mistakes</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="muted" style="margin:0">No tests yet. Start with the Weekly Check-up.</p>'}</div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (!b) return;
    const row = $(`[data-detail="${b.dataset.open}"]`, el);
    row.hidden = !row.hidden;
  });
}

// ---------------------------------------------------------------- settings

function settings(el, app) {
  el = fresh(el);
  const { state } = app;
  const s = state.settings;
  const toggle = (key, label, help = '') => `<label class="toggle" for="set-${key}"><span>${label}${help ? `<br><small class="muted">${help}</small>` : ''}</span><input type="checkbox" id="set-${key}" data-set="${key}" ${s[key] ? 'checked' : ''}></label>`;
  el.innerHTML = `
    <div class="grid2">
      <div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Child</h2>
        <label class="field" for="set-name">Name<input id="set-name" value="${esc(state.profile.name)}" maxlength="20"></label>
        <div class="field" style="margin-top:12px"><span>Grade</span><div class="seg"><button data-grade="1" aria-pressed="${state.profile.grade === 1}">Grade 1</button><button data-grade="2" aria-pressed="${state.profile.grade === 2}">Grade 2</button></div>
        <small class="muted">Changing grade only moves topics she hasn't started.</small></div>
        <div class="field" style="margin-top:12px"><span>Questions per practice</span><div class="seg" style="grid-template-columns:repeat(4,1fr)">${[5, 10, 15, 20].map((n) => `<button data-len="${n}" aria-pressed="${s.sessionLength === n}">${n}</button>`).join('')}</div></div>
      </div>
      <div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Sound & reading</h2>
        ${toggle('speech', 'Read aloud', 'Uses the iPad voice. Check the iPad is not on silent.')}
        ${toggle('autoRead', 'Read each question automatically')}
        ${toggle('sound', 'Sound effects')}
        ${toggle('showTimer', 'Show a clock during tests', 'Off by default: timing too early can make children anxious.')}
        <button class="btn small" data-test-voice style="margin-top:12px">Test the voice</button>
      </div>
    </div>
    <div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Topics shown</h2>
      <div class="grid2">${SKILLS.map((sk) => `<label class="toggle" for="en-${sk.id}"><span>${esc(sk.title)}</span><input type="checkbox" id="en-${sk.id}" data-en="${sk.id}" ${s.enabled[sk.id] !== false ? 'checked' : ''}></label>`).join('')}</div>
      <p class="muted" style="font-size:.9rem;margin:10px 0 0">Hidden topics stay out of the Daily Mix and the Weekly Check-up.</p></div>
    <div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Backup</h2>
      <p style="margin:0 0 10px">Progress is saved on this iPad only. Copy the backup code into Notes or an email now and then. Paste it here to restore, or to move to another device.</p>
      <div class="row"><button class="btn" data-copy>Copy backup code</button><button class="btn" data-restore>Restore from code</button></div>
      <textarea id="backup-code" style="margin-top:10px" placeholder="Backup code appears here, or paste one to restore" aria-label="Backup code"></textarea></div>
    <div class="card"><h2 style="font-size:1.1rem;margin-bottom:8px">Start over</h2>
      <button class="btn danger" data-reset>Erase all progress</button></div>`;

  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.set) {
      s[t.dataset.set] = t.checked;
      app.applySettings();
    }
    if (t.dataset.en) s.enabled[t.dataset.en] = t.checked;
    if (t.id === 'set-name' && t.value.trim()) state.profile.name = t.value.trim();
    app.save();
  });
  el.addEventListener('click', async (e) => {
    const g = e.target.closest('[data-grade]');
    if (g) {
      setGrade(state, Number(g.dataset.grade));
      app.save();
      return settings(el, app);
    }
    const len = e.target.closest('[data-len]');
    if (len) {
      s.sessionLength = Number(len.dataset.len);
      app.save();
      return settings(el, app);
    }
    if (e.target.closest('[data-test-voice]')) app.say(`Hello ${state.profile.name || 'there'}! What is 3 plus 4?`, { force: true });
    if (e.target.closest('[data-copy]')) {
      const code = exportCode(state);
      const ta = $('#backup-code', el);
      ta.value = code;
      try {
        await navigator.clipboard.writeText(code);
        toast('Backup code copied.');
      } catch {
        ta.select();
        toast('Select the code above and copy it.');
      }
    }
    if (e.target.closest('[data-restore]')) {
      let next;
      try {
        next = importCode($('#backup-code', el).value);
      } catch (err) {
        return toast(err.message, { ms: 5000 });
      }
      modal({
        title: 'Restore this backup?',
        body: `<p>This replaces the progress on this iPad with the backup for <b>${esc(next.profile.name || 'this child')}</b> (${next.stars} stars).</p>`,
        actions: [
          { label: 'Cancel' },
          { label: 'Restore', primary: true, onClick: () => { app.state = next; save(next); app.applySettings(); toast('Backup restored.'); app.go('parent/progress'); } },
        ],
      });
    }
    if (e.target.closest('[data-reset]')) {
      modal({
        title: 'Erase all progress?',
        body: '<p>Stars, levels, tests and settings will be deleted from this iPad. Copy a backup code first if you might want them back.</p>',
        actions: [
          { label: 'Cancel', primary: true },
          { label: 'Erase', danger: true, onClick: () => { app.state = defaultState(); save(app.state); app.applySettings(); app.go('welcome'); } },
        ],
      });
    }
  });
}

// ---------------------------------------------------------------- worksheet

function worksheet(el, app) {
  el = fresh(el);
  const opts = SKILLS.map((sk) => `<optgroup label="${esc(sk.title)}">${sk.levels.map((lv, i) => `<option value="${sk.id}:${i + 1}"${sk.id === 'add' && i === 2 ? ' selected' : ''}>${esc(sk.title)} ${i + 1}: ${esc(lv.name)}</option>`).join('')}</optgroup>`).join('');
  el.innerHTML = `<div class="card no-print row" style="align-items:flex-end">
      <label class="field" for="ws-skill" style="flex:2;min-width:240px">Topic and level<select id="ws-skill">${opts}<option value="mix">Mixed — her current levels</option></select></label>
      <label class="field" for="ws-n" style="flex:1;min-width:120px">Questions<select id="ws-n"><option>10</option><option selected>12</option><option>20</option></select></label>
      <button class="btn primary" data-make>Make worksheet</button><button class="btn" data-print>Print</button>
    </div>
    <p class="muted no-print" style="margin:0">Olympiad exams are on paper. A printed sheet now and then gets her used to writing answers and choosing (A)–(D). The answer key prints on page 2.</p>
    <div data-sheet></div>`;
  const make = () => {
    const v = $('#ws-skill', el).value;
    const n = Number($('#ws-n', el).value);
    const used = new Set();
    const qs = [];
    for (let i = 0; qs.length < n && i < n * 20; i++) {
      const [skill, lv] = v === 'mix' ? [SKILLS[i % SKILLS.length].id, 0] : v.split(':');
      if (v === 'mix' && app.state.settings.enabled[skill] === false) continue;
      const q = makeQuestion(skill, Number(lv) || app.state.skills[skill].level, app.rng);
      if (used.has(q.sig)) continue;
      used.add(q.sig);
      qs.push(q);
    }
    const letters = 'ABCD';
    const title = v === 'mix' ? 'Mixed practice' : (() => { const [id, lv] = v.split(':'); return `${SKILL[id].title} — ${SKILL[id].levels[lv - 1].name}`; })();
    $('[data-sheet]', el).innerHTML = `<article class="sheet">
      <h2>${esc(title)}</h2><p style="margin:4px 0 0">Name: <span class="blank" style="min-width:200px"></span> &nbsp; Date: <span class="blank"></span></p>
      <div class="qs">${qs
        .map((q, i) => {
          const math = q.math ? `<div style="font-size:1.4rem">${(Array.isArray(q.math) ? q.math : [q.math]).join('<br>')}</div>` : '';
          const ans = q.kind === 'choice' ? `<div class="opts">${q.choices.map((c, k) => `<span>(${letters[k]}) ${c.html || esc(c.label)}</span>`).join('')}</div>` : '<div>Answer: <span class="blank"></span></div>';
          return `<div class="wq"><div>${i + 1}. ${esc(q.text)}</div>${math}${q.visual || ''}${ans}</div>`;
        })
        .join('')}</div>
      <div class="answers"><b>Answer key</b><br>${qs.map((q, i) => `${i + 1}. ${q.kind === 'choice' ? `(${letters[q.choices.findIndex((c) => String(c.value) === String(q.answer))]}) ` : ''}${esc(answerLabel(q))}`).join('<br>')}</div>
    </article>`;
  };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-make]')) make();
    if (e.target.closest('[data-print]')) {
      if (!$('.sheet', el)) make();
      window.print();
    }
  });
  make();
}

