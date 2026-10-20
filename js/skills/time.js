import { int, pick } from '../rng.js';
import { clock } from '../visuals.js';
import { choiceQ } from './util.js';

export const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

export function timeWords(h, m) {
  const next = (h % 12) + 1;
  if (m === 0) return `${h} o'clock`;
  if (m === 30) return `half past ${h}`;
  if (m === 15) return `quarter past ${h}`;
  if (m === 45) return `quarter to ${next}`;
  return m < 30 ? `${m} minutes past ${h}` : `${60 - m} minutes to ${next}`;
}

/** Add minutes on a 12-hour clock. */
export function addMinutes(h, m, delta) {
  const total = ((((h % 12) * 60 + m + delta) % 720) + 720) % 720;
  return [Math.floor(total / 60) || 12, total % 60];
}

const opt = (h, m, words) => ({ value: fmt(h, m), label: fmt(h, m), html: words ? `<b>${fmt(h, m)}</b><small>${timeWords(h, m)}</small>` : `<b>${fmt(h, m)}</b>` });
const hr = (h) => ((h - 1 + 12) % 12) + 1;

export default {
  id: 'time',
  title: 'Clock',
  color: 'red',
  blurb: "Read an analog clock: o'clock, half past, quarter past and to, then 5 minutes.",
  levels: [
    { name: "O'clock", grade: '1' },
    { name: 'Half past', grade: '1' },
    { name: 'Quarter past and quarter to', grade: '2' },
    { name: 'Every 5 minutes', grade: '2' },
    { name: 'How much later?', grade: '2' },
  ],
  generate(level, rng) {
    const h = int(rng, 1, 12);
    const base = { text: 'What time is it?', say: 'What time does the clock show?' };
    if (level === 1) {
      return choiceQ(rng, { ...base, visual: clock(h, 0), hint: { text: 'The long hand on 12 means o\'clock. The short hand shows the hour.' }, explain: `The short hand points to ${h} and the long hand points to 12: ${h} o'clock.` }, opt(h, 0, true), [
        opt(hr(h + 1), 0, true),
        opt(hr(h - 1), 0, true),
        ...(h !== 12 ? [opt(12, h * 5, true)] : [opt(6, 0, true)]),
      ]);
    }
    if (level === 2) {
      return choiceQ(rng, { ...base, visual: clock(h, 30), hint: { text: 'Long hand on 6 means half past. The short hand has just gone past the hour.' }, explain: `The short hand is between ${h} and ${hr(h + 1)}, and the long hand is on 6: half past ${h}.` }, opt(h, 30, true), [
        opt(hr(h + 1), 30, true),
        opt(h, 0, true),
        opt(6, h * 5 === 60 ? 0 : h * 5, true),
      ]);
    }
    if (level === 3) {
      const m = pick(rng, [15, 45, 15, 45, 30]);
      const wrong = m === 15 ? [opt(h, 45, true), opt(hr(h - 1), 15, true), opt(h, 30, true)] : m === 45 ? [opt(hr(h + 1), 45, true), opt(h, 15, true), opt(hr(h + 1), 15, true)] : [opt(hr(h + 1), 30, true), opt(h, 15, true), opt(h, 45, true)];
      return choiceQ(rng, { ...base, visual: clock(h, m), hint: { text: 'Long hand on 3: quarter past. On 6: half past. On 9: quarter to the next hour.' }, explain: `It is ${timeWords(h, m)} (${fmt(h, m)}).` }, opt(h, m, true), wrong);
    }
    if (level === 4) {
      const m = pick(rng, [5, 10, 20, 25, 35, 40, 50, 55]);
      return choiceQ(rng, { ...base, visual: clock(h, m), hint: { text: 'Count by 5s around the clock from 12 to the long hand.' }, explain: `The long hand points to ${m / 5}. ${m / 5} × 5 = ${m} minutes. It is ${fmt(h, m)}.` }, opt(h, m), [
        opt(h, m / 5),
        opt(hr(h + 1), m),
        opt(h, (m + 5) % 60 || 5),
      ]);
    }
    const m = pick(rng, [0, 30]);
    const delta = pick(rng, [60, 120, 180, 30]);
    const [h2, m2] = addMinutes(h, m, delta);
    const label = delta === 30 ? '30 minutes' : `${delta / 60} hour${delta > 60 ? 's' : ''}`;
    const [hb, mb] = addMinutes(h, m, -delta);
    const [hc, mc] = addMinutes(h, m, delta + 60);
    const [hd, md] = addMinutes(h, m, delta + 30);
    return choiceQ(
      rng,
      {
        text: `What time will it be in ${label}?`,
        say: `This clock shows the time now. What time will it be in ${label}?`,
        visual: clock(h, m),
        hint: { text: `Now it is ${fmt(h, m)}. Move the hands forward ${label}.` },
        explain: `${fmt(h, m)} plus ${label} is ${fmt(h2, m2)}.`,
      },
      opt(h2, m2),
      [opt(hb, mb), opt(hc, mc), opt(hd, md)],
    );
  },
};
