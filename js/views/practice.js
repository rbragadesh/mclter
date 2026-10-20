import { SKILL, answerLabel } from '../skills/index.js';
import { Session, practicePlan, tablePlan, mixPlan, weeklyPlan, olympiadPlan, tablesTestPlan, givenLabel } from '../session.js';
import { esc, $, $$, topBar, icon, starSvg, numpad, choiceButtons, confetti, fmtDuration } from '../ui.js';
import { pick } from '../rng.js';

const PRAISE = ['Great job!', 'Yes!', 'Super!', 'You got it!', 'Brilliant!', 'Well done!', 'Nice thinking!'];

export function practice(root, { id, n }, app) {
  const { state } = app;
  const len = state.settings.sessionLength;
  let plan;
  let title;
  let type = id;
  let back = '#/';
  if (id === 'mix') {
    plan = mixPlan(state, len, app.rng);
    title = 'Daily Mix';
  } else if (id === 'table') {
    const t = Math.max(2, Math.min(10, Number(n) || 2));
    plan = tablePlan(t, len, app.rng);
    title = `${t} times table`;
    back = '#/skill/mult';
  } else if (SKILL[id]) {
    plan = practicePlan(id, len);
    title = SKILL[id].title;
    back = `#/skill/${id}`;
  } else return app.go('');
  if (!plan.length) {
    root.innerHTML = `<div class="screen">${topBar(app, { title })}<div class="card">All topics are switched off. A grown-up can turn them on in the parent area.</div></div>`;
    return null;
  }
  const session = new Session({ state, kind: 'practice', type, plan, rng: app.rng, title });
  return runSession(root, app, session, { back, again: location.hash });
}

const TESTS = {
  weekly: { title: 'Weekly Check-up', about: 'Questions from every topic at your level. No hints this time — just do your best!', count: 20 },
  olympiad: { title: 'Olympiad Mock', about: 'Section A is worth 1 point, B is 2 points and C is 3 points. The C questions are tricky — read carefully!', count: 15 },
  tables: { title: 'Times-table Test', about: 'Pick the tables to test.', count: 20 },
};

export function test(root, { type }, app) {
  const t = TESTS[type];
  if (!t) return app.go('');
  const chosen = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const picker =
    type === 'tables'
      ? `<div class="tables" id="table-pick">${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button class="btn" data-t="${n}" aria-pressed="true">${n}</button>`).join('')}</div>`
      : '';
  root.innerHTML = `<div class="screen">
    ${topBar(app, { title: t.title, back: type === 'tables' ? '#/skill/mult' : '#/' })}
    <div class="center"><div class="card welcome-card">
      <h2>${esc(t.title)}</h2>
      <p style="margin:0;font-weight:700">${esc(t.about)}</p>
      ${picker}
      <p class="muted" style="margin:0">${t.count} questions · one try each · results go to the grown-ups' page.</p>
      <button class="btn big primary" id="start-test">Start</button>
    </div></div></div>`;
  app.say(`${t.title}. ${t.about}`);
  if (type === 'tables') {
    $$('#table-pick [data-t]', root).forEach((b) =>
      b.addEventListener('click', () => {
        const n = Number(b.dataset.t);
        if (chosen.has(n) && chosen.size > 1) chosen.delete(n);
        else chosen.add(n);
        b.setAttribute('aria-pressed', String(chosen.has(n)));
        b.classList.toggle('primary', chosen.has(n));
      }),
    );
    $$('#table-pick [data-t]', root).forEach((b) => b.classList.add('primary'));
  }
  let stop = null;
  $('#start-test', root).addEventListener('click', () => {
    const { state } = app;
    const plan = type === 'weekly' ? weeklyPlan(state, t.count, app.rng) : type === 'olympiad' ? olympiadPlan(state, app.rng) : tablesTestPlan([...chosen], t.count, app.rng);
    const title = type === 'tables' ? `${t.title} (${[...chosen].sort((a, b) => a - b).join(', ')})` : t.title;
    const session = new Session({ state, kind: 'test', type, plan, rng: app.rng, title });
    stop = runSession(root, app, session, { back: '#/', again: null });
  });
  return () => stop?.();
}

// ---------------------------------------------------------------- the question loop

function runSession(root, app, session, { back, again }) {
  const { state } = app;
  const isTest = session.kind === 'test';
  let timers = [];
  let tick = null;
  let keyHandler = null;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function showQuestion() {
    clearTimers();
    const q = session.next();
    if (!q) return showResults();
    app.current = q;
    app.qid = (app.qid || 0) + 1;
    const sk = SKILL[q.skill];
    const sub = isTest
      ? `Question ${session.i + 1} of ${session.total}${q.section ? ` · Section ${q.section} · ${q.points} point${q.points > 1 ? 's' : ''}` : ''}`
      : `${sk.title} · Level ${q.level}${q.again ? ' · try again' : ''}`;
    const timer = isTest && state.settings.showTimer ? '<span class="chip timer" data-timer>0:00</span>' : '';
    const math = q.math ? `<div class="qmath">${(Array.isArray(q.math) ? q.math : [q.math]).map((l) => `<span class="line">${l}</span>`).join('')}</div>` : '';
    root.innerHTML = `<div class="screen">
      ${topBar(app, { title: session.title, sub, back, right: `<div class="progress" aria-label="Progress"><i style="width:${(session.i / session.total) * 100}%"></i></div>${timer}` })}
      <div class="practice">
        <section class="card qcard" aria-live="polite">
          <div class="qhead"><div class="qtext">${esc(q.text)}</div>
            <button class="icon-btn" data-say aria-label="Read it to me">${icon('speaker')}</button></div>
          ${math}
          ${q.visual ? `<div class="qviz">${q.visual}</div>` : ''}
          <div class="hint-box" data-hint hidden></div>
          <div class="fb" data-fb hidden></div>
        </section>
        <section class="answer">
          <div data-input></div>
          ${!isTest && q.hint ? `<button class="btn" data-showme>${icon('eye')} Show me</button>` : ''}
          <button class="btn big primary" data-next hidden>Next ${icon('next')}</button>
        </section>
      </div></div>`;

    const input = $('[data-input]', root);
    const fb = $('[data-fb]', root);
    const hintBox = $('[data-hint]', root);
    const nextBtn = $('[data-next]', root);
    const showMeBtn = $('[data-showme]', root);
    let widget;

    const showHint = () => {
      if (!q.hint || !hintBox.hidden) return;
      hintBox.innerHTML = `<div>${esc(q.hint.text)}</div>${q.hint.visual ? `<div class="hintviz">${q.hint.visual}</div>` : ''}`;
      hintBox.hidden = false;
      hintBox.classList.add('pop');
      if (showMeBtn) showMeBtn.hidden = true;
    };

    const finishWrong = (res) => {
      fb.className = 'fb bad';
      fb.innerHTML = `<div>The answer is ${esc(res.answer)}.</div><div class="explain">${esc(q.explain || '')}</div>`;
      if (q.kind === 'choice') widget.mark(q.answer, 'reveal');
      fb.hidden = false;
      showHint();
      nextBtn.hidden = false;
      nextBtn.focus();
      app.say(`The answer is ${res.answer}. ${q.explain || ''}`);
    };

    const onAnswer = (value, btn) => {
      const res = session.submit(value);
      app.save();
      if (isTest) {
        widget.disable(true);
        if (q.kind === 'choice' && btn) btn.classList.add('picked-right');
        app.sfx.tap();
        later(showQuestion, 350);
        return;
      }
      if (res.ok) {
        widget.disable(true);
        if (btn) btn.classList.add('picked-right');
        app.sfx.correct();
        const praise = res.tries > 1 ? 'You fixed it!' : pick(app.rng, PRAISE);
        fb.className = 'fb good pop';
        fb.innerHTML = `<div>${praise}${res.star ? ` +1 ${starSvg.replace('<svg', '<svg style="width:1em;height:1em;vertical-align:-.12em"')}` : ''}</div>${q.explain && res.tries > 1 ? `<div class="explain">${esc(q.explain)}</div>` : ''}`;
        fb.hidden = false;
        $('[data-stars]', root).textContent = state.stars;
        app.say(praise);
        if (res.event === 'up' || res.event === 'mastered') {
          app.sfx.level();
          confetti();
          const p = state.skills[q.skill];
          fb.innerHTML += `<div class="levelup">${res.event === 'up' ? `Level up! Now level ${p.level}: ${esc(SKILL[q.skill].levels[p.level - 1].name)}` : 'You mastered the top level!'}</div>`;
          later(showQuestion, 2600);
        } else later(showQuestion, res.tries > 1 ? 2200 : 1100);
        return;
      }
      app.sfx.wrong();
      if (!res.final) {
        if (q.kind === 'choice' && btn) btn.classList.add('picked-wrong');
        else {
          widget.shake();
          widget.clear();
        }
        fb.className = 'fb try';
        fb.innerHTML = '<div>Not quite. Look at the picture and try again.</div>';
        fb.hidden = false;
        showHint();
        app.say(`Not quite. ${q.hint?.text || 'Try again.'}`);
        return;
      }
      widget.disable(true);
      if (q.kind === 'choice' && btn) btn.classList.add('picked-wrong');
      finishWrong(res);
    };

    if (q.kind === 'number') widget = numpad(input, { onSubmit: onAnswer, maxLen: String(q.answer).length + 2 });
    else widget = choiceButtons(input, q.choices, onAnswer);

    $('[data-say]', root).addEventListener('click', () => app.say(q.say || q.text, { force: true }));
    showMeBtn?.addEventListener('click', () => {
      session.showMe();
      showHint();
      app.say(q.hint.text);
    });
    nextBtn.addEventListener('click', showQuestion);

    keyHandler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!nextBtn.hidden && e.key === 'Enter') return showQuestion();
      if (q.kind === 'number') {
        if (/^\d$/.test(e.key)) widget.press(e.key);
        else if (e.key === 'Backspace') widget.press('del');
        else if (e.key === 'Enter') widget.press('go');
      } else if (/^[1-4]$/.test(e.key)) $$('.choice', input)[Number(e.key) - 1]?.click();
    };
    if (state.settings.autoRead) app.say(q.say || q.text);
  }

  function showResults() {
    clearTimers();
    const s = session.finish();
    app.save();
    app.current = null;
    app.sfx.done();
    const pct = s.max ? Math.round((s.score / s.max) * 100) : 0;
    if (pct >= 70) confetti();
    const events = s.events
      .map((e) => {
        const sk = SKILL[e.skill];
        if (e.event === 'up') return `<div class="levelup">${esc(sk.title)}: up to level ${e.level} — ${esc(sk.levels[e.level - 1].name)}</div>`;
        if (e.event === 'mastered') return `<div class="levelup">${esc(sk.title)}: top level mastered!</div>`;
        return `<div class="muted" style="font-weight:700">${esc(sk.title)}: we'll practise level ${e.level} a bit more.</div>`;
      })
      .join('');
    const review = s.wrong
      .map((r) => {
        const q = r.q;
        const math = Array.isArray(q.math) ? q.math.join('  ') : q.math || '';
        return `<div class="item"><div><b>${esc(q.text)}</b>${math ? `<div>${math}</div>` : ''}</div>
          <div><div class="ans">${esc(answerLabel(q))}</div>${isTest ? `<div class="given">${esc(givenLabel(q, r.given))}</div>` : ''}</div>${q.visual || ''}</div>`;
      })
      .join('');
    const perSkill = isTest
      ? `<div class="card table-wrap" style="width:100%;max-width:820px"><table><thead><tr><th>Topic</th><th class="num">Right</th></tr></thead><tbody>${Object.entries(s.perSkill)
          .map(([id, [c, n]]) => `<tr><td>${esc(SKILL[id].title)}</td><td class="num">${c} / ${n}</td></tr>`)
          .join('')}</tbody></table></div>`
      : '';
    const headline = isTest
      ? `<div class="big-stars">${s.score}<span class="muted" style="font-size:.45em">/ ${s.max} points</span></div><p class="hello" style="font-size:1.6rem">${pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Great work!' : pct >= 50 ? 'Good try — keep climbing!' : 'Good effort! Practice will help.'}</p>`
      : `<div class="big-stars">${starSvg}+${s.stars}</div><p class="hello" style="font-size:1.6rem">You got ${s.correct} of ${s.total} right first time!</p>`;
    root.innerHTML = `<div class="screen">
      ${topBar(app, { title: session.title, sub: `Finished in ${fmtDuration(s.ms)}`, back })}
      <div class="screen result">
        ${headline}
        ${events}
        <div class="row" style="justify-content:center">
          ${again ? `<a class="btn big primary" href="${again}" data-again>Play again</a>` : ''}
          <a class="btn big${again ? '' : ' primary'}" href="#/">Home</a>
        </div>
        ${perSkill}
        ${review ? `<div class="review"><h2 class="section-title">${isTest ? 'Let’s look at these again' : 'Remember these'}</h2>${review}</div>` : ''}
      </div></div>`;
    $('[data-again]', root)?.addEventListener('click', (e) => {
      e.preventDefault();
      app.go(again.replace(/^#\/?/, ''));
    });
    app.say(isTest ? `You scored ${s.score} out of ${s.max}.` : `You got ${s.correct} out of ${s.total} right first time.`);
  }

  const onKey = (e) => keyHandler?.(e);
  window.addEventListener('keydown', onKey);
  if (isTest && state.settings.showTimer) {
    tick = setInterval(() => {
      const el = $('[data-timer]', root);
      if (el) {
        const sec = Math.floor((Date.now() - session.started) / 1000);
        el.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
      }
    }, 1000);
  }
  showQuestion();
  return () => {
    clearTimers();
    clearInterval(tick);
    window.removeEventListener('keydown', onKey);
  };
}
