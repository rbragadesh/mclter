import { SKILL } from '../skills/index.js';
import { levelProgress, accuracy } from '../mastery.js';
import { esc, topBar, icon, skillIcon } from '../ui.js';

export function skillHub(root, { id }, app) {
  const sk = SKILL[id];
  if (!sk) return app.go('');
  const p = app.state.skills[id];
  const acc = accuracy(p);
  const ladder = sk.levels
    .map((lv, i) => {
      const n = i + 1;
      const cls = n < p.level || (n === p.level && p.mastered) ? 'done' : n === p.level ? 'now' : '';
      return `<li class="${cls}"><span class="n">${n}</span>${esc(lv.name)}<small>Grade ${esc(lv.grade)}</small></li>`;
    })
    .join('');
  const tables = id === 'mult'
    ? `<div class="card"><h2 style="font-size:1.2rem;margin-bottom:12px">Practise one times table</h2>
        <div class="tables">${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<a class="btn" href="#/table/${n}" aria-label="${n} times table">${n}</a>`).join('')}
        <a class="btn" href="#/test/tables" aria-label="Times-table test">Test</a></div></div>`
    : '';
  root.innerHTML = `<div class="screen">
    ${topBar(app, { title: sk.title, sub: `Level ${p.level} of ${sk.levels.length}` })}
    <div class="hub">
      <div class="screen" style="gap:16px">
        <div class="card row" style="align-items:center;gap:18px;flex-wrap:nowrap">
          <span style="width:96px;flex:none">${skillIcon(id)}</span>
          <div style="min-width:0"><p style="margin:0 0 10px;font-weight:700">${esc(sk.blurb)}</p>
          <div class="bar" aria-label="Progress to next level"><i style="width:${Math.round(levelProgress(p) * 100)}%"></i></div>
          <p class="muted" style="margin:8px 0 0;font-size:.95rem">${p.attempts ? `${p.attempts} answered · ${Math.round((acc ?? 0) * 100)}% right lately` : 'Not started yet'}${p.mastered ? ' · Top level mastered!' : ''}</p></div>
        </div>
        <div class="row">
          <a class="btn big" href="#/learn/${id}" style="flex:1">${icon('eye')} See it</a>
          <a class="btn big primary" href="#/practice/${id}" style="flex:1">Practice ${icon('next')}</a>
        </div>
        ${tables}
      </div>
      <div class="card"><h2 style="font-size:1.2rem;margin-bottom:12px">The climb</h2><ol class="ladder">${ladder}</ol>
      <p class="muted" style="margin:12px 0 0;font-size:.95rem">Get 8 of 10 right to climb a level.</p></div>
    </div>
  </div>`;
}
