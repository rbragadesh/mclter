import { SKILLS } from '../skills/index.js';
import { streak, daysSince, setGrade, dayKey } from '../store.js';
import { levelProgress } from '../mastery.js';
import { esc, icon, starSvg, flameSvg, skillIcon, $ } from '../ui.js';
import { tenFrameSum, clock, pyramid } from '../visuals.js';

export function weeklyDue(state, now = Date.now()) {
  const last = [...state.tests].reverse().find((t) => t.type === 'weekly');
  const answered = SKILLS.reduce((s, sk) => s + state.skills[sk.id].attempts, 0);
  return answered >= 20 && daysSince(last?.t, now) >= 7;
}

export function home(root, _p, app) {
  const { state } = app;
  const s = streak(state.days);
  const today = state.days[dayKey()];
  const due = weeklyDue(state);
  const tiles = SKILLS.filter((sk) => state.settings.enabled[sk.id] !== false)
    .map((sk) => {
      const p = state.skills[sk.id];
      const dots = sk.levels.map((_, i) => `<i class="${i < p.level - 1 || (i === p.level - 1 && p.mastered) ? 'on' : ''}"></i>`).join('');
      return `<a class="tile" href="#/skill/${sk.id}" style="--tint: var(--m-${sk.color})" aria-label="${esc(sk.title)}, level ${p.level}">
        <span class="ico">${skillIcon(sk.id)}</span>
        <span><b>${esc(sk.title)}${sk.olympiad ? '<span class="olympiad-tag">Olympiad</span>' : ''}</b>
        <span class="lvl">Level ${p.level}: ${esc(sk.levels[p.level - 1].name)}</span>
        <span class="dots" aria-hidden="true">${dots}</span>
        <span class="bar" style="margin-top:6px" aria-hidden="true"><i style="width:${Math.round(levelProgress(p) * 100)}%"></i></span></span>
      </a>`;
    })
    .join('');

  root.innerHTML = `<div class="screen">
    <header class="top">
      <h1 class="hello">Hi, ${esc(state.profile.name)}!</h1>
      <span class="chip streak" aria-label="${s} day streak">${flameSvg}${s} day${s === 1 ? '' : 's'}</span>
      <span class="chip" aria-label="${state.stars} stars">${starSvg}${state.stars}</span>
      <a class="icon-btn" href="#/parent" aria-label="Grown-ups">${icon('lock')}</a>
    </header>
    <nav class="quick" aria-label="Start">
      <a class="action hero" href="#/practice/mix">${tenFrameSum(6, 3)}<b>Daily Mix</b><span>${today?.q ? `${today.q} done today — keep going!` : '10 questions picked for you'}</span></a>
      <a class="action" href="#/test/weekly">${due ? '<span class="badge">Ready!</span>' : ''}${clock(10, 10, { size: 90 })}<b>Weekly Check-up</b><span>20 questions, no hints</span></a>
      <a class="action" href="#/test/olympiad">${pyramid([[null], [5, 4], [2, 3, 1]])}<b>Olympiad Mock</b><span>15 puzzles, 1–3 points each</span></a>
      <a class="action" href="#/play">${starBig()}<b>Games</b><span>Speed round, Make 10</span></a>
    </nav>
    <h2 class="section-title">Topics</h2>
    <nav class="topics" aria-label="Topics">${tiles}</nav>
  </div>`;
}

const starBig = () => `<svg class="viz" viewBox="0 0 24 24" style="--vw:24"><path class="f-yellow" d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>`;

export function welcome(root, _p, app) {
  const { state } = app;
  let grade = state.profile.grade || 1;
  root.innerHTML = `<div class="screen center">
    <h1 class="hello">Math Climb</h1>
    <form class="card welcome-card" id="welcome-form">
      <label class="field" for="kid-name">What's your name?
        <input id="kid-name" name="name" autocomplete="off" autocapitalize="words" maxlength="20" value="${esc(state.profile.name)}" placeholder="Type your name" required>
      </label>
      <div class="field"><span>Which grade are you in?</span>
        <div class="seg" role="group" aria-label="Grade">
          <button type="button" data-g="1" aria-pressed="${grade === 1}">Grade 1</button>
          <button type="button" data-g="2" aria-pressed="${grade === 2}">Grade 2</button>
        </div>
      </div>
      <p class="muted" style="margin:0">Grown-ups: progress, tests and settings are behind the lock button on the home screen.</p>
      <button class="btn big primary" type="submit">Let's go!</button>
    </form>
  </div>`;
  root.querySelectorAll('[data-g]').forEach((b) =>
    b.addEventListener('click', () => {
      grade = Number(b.dataset.g);
      root.querySelectorAll('[data-g]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }),
  );
  $('#welcome-form', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#kid-name', root).value.trim();
    if (!name) return;
    state.profile.name = name;
    setGrade(state, grade);
    app.save();
    app.say(`Hi ${name}! Let's climb some maths.`);
    app.go('');
  });
}
