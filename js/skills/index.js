import count from './count.js';
import place from './place.js';
import add from './add.js';
import sub from './sub.js';
import mult from './mult.js';
import div from './div.js';
import frac from './frac.js';
import time from './time.js';
import logic from './logic.js';
import story from './story.js';

export const SKILLS = [count, place, add, sub, mult, div, frac, time, logic, story];
export const SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const maxLevel = (id) => SKILL[id].levels.length;

/** Generate one question and stamp it with skill/level/signature. */
export function makeQuestion(skillId, level, rng, ctx = {}) {
  const skill = SKILL[skillId];
  const lv = Math.max(1, Math.min(level, skill.levels.length));
  const q = skill.generate(lv, rng, ctx);
  q.skill = skillId;
  q.level = lv;
  const math = Array.isArray(q.math) ? q.math.join('|') : q.math || '';
  q.sig = `${skillId}|${q.text}|${math}|${q.answer}`;
  return q;
}

export function isCorrect(q, value) {
  if (value === null || value === undefined || value === '') return false;
  if (q.kind === 'number') return Number(value) === q.answer;
  return String(value) === String(q.answer);
}

/** Human-readable correct answer (for reviews and worksheets). */
export function answerLabel(q) {
  if (q.kind === 'number') return String(q.answer);
  const c = q.choices.find((o) => String(o.value) === String(q.answer));
  return c ? c.label : String(q.answer);
}
