// A practice session or test: picks questions, checks answers, records progress.
// No DOM here — views drive it, tests exercise it directly.
import { SKILLS, makeQuestion, isCorrect, maxLevel, answerLabel } from './skills/index.js';
import { applyResult, reviewFact, pickFact, accuracy, dueCount } from './mastery.js';
import { addDay, daysSince } from './store.js';
import { chance, int, pick, shuffle, weighted } from './rng.js';

const PRACTICE = { tries: 2, hints: true, adaptive: true, stars: true, requeue: true };
const TEST = { tries: 1, hints: false, adaptive: false, stars: false, requeue: false };

export class Session {
  constructor({ state, kind = 'practice', type = kind, plan, rng, now = () => Date.now(), title = '' }) {
    this.state = state;
    this.kind = kind; // 'practice' | 'test'
    this.type = type; // practice skill id / 'mix' / 'table' / 'weekly' / 'olympiad' / 'tables'
    this.cfg = kind === 'test' ? TEST : PRACTICE;
    this.plan = plan.slice();
    this.rng = rng;
    this.now = now;
    this.title = title;
    this.i = -1;
    this.q = null;
    this.tries = 0;
    this.helped = false;
    this.used = new Set();
    this.results = [];
    this.stars = 0;
    this.events = [];
    this.requeued = 0;
    this.started = now();
  }

  get total() {
    return this.plan.length;
  }

  next() {
    this.i += 1;
    if (this.i >= this.plan.length) {
      this.q = null;
      return null;
    }
    this.q = this.generate(this.plan[this.i]);
    this.tries = 0;
    this.helped = false;
    return this.q;
  }

  levelFor(item) {
    if (item.level) return item.level;
    const p = this.state.skills[item.skill];
    // one question in five revisits the level below, so older skills stay fresh
    if (this.cfg.adaptive && p.level > 1 && chance(this.rng, 0.2)) return p.level - 1;
    return p.level;
  }

  generate(item) {
    if (item.again) return { ...item.again, again: true };
    const level = this.levelFor(item);
    const ctx = { table: item.table || null, pickFact: (pool) => pickFact(this.state.facts, pool, this.now(), this.rng) };
    let q;
    for (let k = 0; k < 15; k++) {
      q = makeQuestion(item.skill, level, this.rng, ctx);
      if (!this.used.has(q.sig)) break;
    }
    this.used.add(q.sig);
    q.points = item.points || 1;
    q.section = item.section || '';
    q.adaptive = this.cfg.adaptive && item.adaptive !== false;
    return q;
  }

  /** "Show me" in practice: the hint is free to look at, but the question no longer earns a star. */
  showMe() {
    this.helped = true;
  }

  submit(value) {
    const q = this.q;
    this.tries += 1;
    const ok = isCorrect(q, value);
    const final = ok || this.tries >= this.cfg.tries;
    let star = 0;
    let event = null;
    if (final) {
      const correct = ok && this.tries === 1 && !this.helped;
      event = this.record(q, correct, !ok, value);
      // a repeat of a missed question was just explained, so it earns no star
      if (correct && this.cfg.stars && !q.again) {
        star = 1;
        this.stars += 1;
        this.state.stars += 1;
      }
      if (!ok && this.cfg.requeue && this.requeued < 3 && !q.again) {
        // ask the same question again a few steps later, after she has seen the explanation
        this.plan.splice(Math.min(this.i + 3, this.plan.length), 0, { skill: q.skill, again: q });
        this.requeued += 1;
      }
    }
    return { ok, final, tries: this.tries, star, event, answer: answerLabel(q) };
  }

  record(q, correct, failed, given) {
    const now = this.now();
    const p = this.state.skills[q.skill];
    // repeats and non-adaptive questions update stats but never move the level
    const level = q.adaptive && !q.again ? q.level : -1;
    const event = applyResult(p, { level, correct, failed }, maxLevel(q.skill), now);
    if (q.fact && !q.again) this.state.facts[q.fact] = reviewFact(this.state.facts[q.fact], correct, now);
    addDay(this.state, { q: 1, c: correct ? 1 : 0 }, now);
    this.results.push({ skill: q.skill, level: q.level, correct, failed, points: q.points, section: q.section, given: given ?? '', q });
    if (event) this.events.push({ skill: q.skill, event, level: p.level });
    return event;
  }

  summary() {
    const perSkill = {};
    let score = 0;
    let max = 0;
    for (const r of this.results) {
      const s = (perSkill[r.skill] ||= [0, 0]);
      s[1] += 1;
      if (r.correct) s[0] += 1;
      max += r.points;
      if (r.correct) score += r.points;
    }
    return {
      kind: this.kind,
      type: this.type,
      title: this.title,
      total: this.results.length,
      correct: this.results.filter((r) => r.correct).length,
      score,
      max,
      stars: this.stars,
      ms: this.now() - this.started,
      perSkill,
      events: this.events,
      wrong: this.results.filter((r) => !r.correct),
    };
  }

  /** Save the session to history. Call once, at the end. */
  finish() {
    const s = this.summary();
    const t = this.now();
    addDay(this.state, { ms: s.ms }, t);
    this.state.sessions.push({ t, kind: s.kind, type: s.type, n: s.total, c: s.correct, ms: s.ms });
    if (this.state.sessions.length > 300) this.state.sessions.splice(0, this.state.sessions.length - 300);
    if (this.kind === 'test') {
      this.state.tests.push({
        t,
        type: s.type,
        title: s.title,
        score: s.score,
        max: s.max,
        n: s.total,
        c: s.correct,
        ms: s.ms,
        perSkill: s.perSkill,
        wrong: s.wrong.slice(0, 20).map((r) => ({ skill: r.skill, text: r.q.text, math: Array.isArray(r.q.math) ? r.q.math.join('  ') : r.q.math || '', answer: answerLabel(r.q), given: givenLabel(r.q, r.given) })),
      });
      if (this.state.tests.length > 60) this.state.tests.splice(0, this.state.tests.length - 60);
    }
    return s;
  }
}

export function givenLabel(q, given) {
  if (given === '' || given === null || given === undefined) return '—';
  if (q.kind === 'number') return String(given);
  return q.choices.find((c) => String(c.value) === String(given))?.label ?? String(given);
}

// ---------------------------------------------------------------- plans

const enabledSkills = (state) => SKILLS.filter((s) => state.settings.enabled[s.id] !== false);

export const practicePlan = (skill, n) => Array.from({ length: n }, () => ({ skill }));

/** One times table: facts plus some missing-factor questions. Never changes the level. */
export const tablePlan = (table, n, rng) => Array.from({ length: n }, () => ({ skill: 'mult', level: chance(rng, 0.7) ? 5 : 6, table, adaptive: false }));

/** Daily mix: weak and neglected skills come up more; at most 3 questions per skill. */
export function mixPlan(state, n, rng, now = Date.now()) {
  const skills = enabledSkills(state);
  if (!skills.length) return [];
  const weights = skills.map((s) => {
    const p = state.skills[s.id];
    const acc = accuracy(p) ?? 0.6;
    let w = 1 + (1 - acc) * 3 + (Math.min(daysSince(p.last, now), 7) / 7) * 2;
    if (s.id === 'mult' && p.level >= 4 && dueCount(state.facts, 'm:', now) > 0) w += 2;
    return w;
  });
  const count = {};
  const plan = [];
  let guard = 0;
  while (plan.length < n && guard++ < 500) {
    const s = weighted(rng, skills, weights);
    if ((count[s.id] || 0) >= Math.max(3, Math.ceil(n / skills.length))) continue;
    count[s.id] = (count[s.id] || 0) + 1;
    plan.push({ skill: s.id });
  }
  return plan;
}

/** Weekly check-up: every enabled skill at its current level, extra questions on weak skills. */
export function weeklyPlan(state, n, rng) {
  const skills = enabledSkills(state);
  if (!skills.length) return [];
  const base = Math.max(1, Math.floor(n / skills.length));
  const plan = [];
  for (const s of skills) {
    const lv = state.skills[s.id].level;
    for (let k = 0; k < base; k++) plan.push({ skill: s.id, level: k % 3 === 2 && lv > 1 ? lv - 1 : lv });
  }
  const weakest = skills.slice().sort((a, b) => (accuracy(state.skills[a.id]) ?? 0.5) - (accuracy(state.skills[b.id]) ?? 0.5));
  for (let k = 0; plan.length < n; k++) {
    const s = weakest[k % weakest.length];
    plan.push({ skill: s.id, level: state.skills[s.id].level });
  }
  return shuffle(rng, plan.slice(0, Math.max(n, skills.length)));
}

/**
 * Olympiad mock: three sections worth 1, 2 and 3 points, like Math Kangaroo / SOF IMO papers.
 * Section C always reaches into the hardest puzzle and story levels.
 */
export function olympiadPlan(state, rng) {
  const on = (ids) => ids.filter((id) => state.settings.enabled[id] !== false);
  const lv = (id, bump) => Math.min(maxLevel(id), state.skills[id].level + bump);
  const fallback = (ids) => (on(ids).length ? on(ids) : ['logic']);
  const A = fallback(['count', 'place', 'add', 'sub', 'time']);
  const B = fallback(['mult', 'div', 'frac', 'add', 'sub', 'time']);
  const plan = [];
  for (let k = 0; k < 5; k++) {
    const id = A[k % A.length];
    plan.push({ skill: id, level: lv(id, 0), points: 1, section: 'A' });
  }
  plan.push({ skill: 'logic', level: lv('logic', 0), points: 2, section: 'B' });
  plan.push({ skill: 'logic', level: lv('logic', 1), points: 2, section: 'B' });
  plan.push({ skill: 'story', level: lv('story', 0), points: 2, section: 'B' });
  for (let k = 0; k < 2; k++) {
    const id = pick(rng, B);
    plan.push({ skill: id, level: lv(id, 1), points: 2, section: 'B' });
  }
  const hardLogic = () => Math.max(4, lv('logic', 1));
  const hardStory = () => Math.max(4, lv('story', 1));
  plan.push({ skill: 'logic', level: hardLogic(), points: 3, section: 'C' });
  plan.push({ skill: 'logic', level: maxLevel('logic'), points: 3, section: 'C' });
  plan.push({ skill: 'story', level: hardStory(), points: 3, section: 'C' });
  plan.push({ skill: 'story', level: maxLevel('story'), points: 3, section: 'C' });
  plan.push({ skill: 'logic', level: int(rng, 3, maxLevel('logic')), points: 3, section: 'C' });
  return plan;
}

/** Times-table test: n facts from the chosen tables, a quarter of them as missing-factor. */
export const tablesTestPlan = (tables, n, rng) => Array.from({ length: n }, () => ({ skill: 'mult', level: chance(rng, 0.75) ? 5 : 6, table: pick(rng, tables) }));
