// Small DOM helpers and shared widgets: icons, top bar, number pad, choices, modal, toast, confetti.
import { esc, tenFrames, baseTen, tenFrameSum, objects, array, groups, fractionShape, clock, shapePattern, barPartWhole } from './visuals.js';
import { sfx } from './sound.js';

export { esc };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const I = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  next: '<path d="M5 12h13"/><path d="M13 6l6 6-6 6"/>',
};

export const icon = (name) => `<svg class="ico-line" viewBox="0 0 24 24" aria-hidden="true">${I[name]}</svg>`;

export const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" class="star-ico"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>';
export const flameSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" class="flame-ico"><path d="M12 2.5c1 3.3 5.5 5.4 5.5 10.6A5.5 5.5 0 0 1 12 21.5a5.5 5.5 0 0 1-5.5-5.5c0-2.6 1.4-4.2 2.7-5.3.2 1.6.9 2.7 2 3.3C10.6 10.6 11 6 12 2.5z"/></svg>';

/** Little picture of each topic's manipulative, used on tiles. */
export function skillIcon(id) {
  switch (id) {
    case 'count':
      return tenFrames(Array(7).fill('yellow'), { cell: 30 });
    case 'place':
      return baseTen(23);
    case 'add':
      return tenFrameSum(4, 3);
    case 'sub':
      return objects(5, '🍎', { crossed: 2, size: 40 });
    case 'mult':
      return array(3, 4, { size: 30 });
    case 'div':
      return groups(3, 2, { color: 'purple', perRow: 3 });
    case 'frac':
      return fractionShape({ shape: 'circle', d: 4, shaded: [0], size: 100, color: 'green' });
    case 'time':
      return clock(3, 0, { size: 120 });
    case 'logic':
      return shapePattern([{ k: 'circle', c: 'red' }, { k: 'triangle', c: 'blue' }], { size: 56 });
    case 'story':
      return barPartWhole([{ v: 3, label: '3' }, { v: 2, label: '?' }], '5', { width: 200 });
    default:
      return '';
  }
}

export function topBar(app, { title, sub = '', back = '#/', right = '' } = {}) {
  const stars = app.state.stars;
  return `<header class="top">
    <a class="icon-btn" href="${back}" aria-label="${back === '#/' ? 'Home' : 'Back'}">${icon(back === '#/' ? 'home' : 'back')}</a>
    <h1>${esc(title)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</h1>
    ${right}
    <span class="chip" aria-label="${stars} stars">${starSvg}<span data-stars>${stars}</span></span>
  </header>`;
}

// ---------------------------------------------------------------- number pad

export function numpad(el, { onSubmit, maxLen = 4 }) {
  let value = '';
  let disabled = false;
  el.classList.add('numpad');
  el.innerHTML = `<div class="display empty" aria-live="polite">?</div>
    <div class="pad">
      ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('')}
      <button class="key del" data-k="del" aria-label="Delete">⌫</button>
      <button class="key" data-k="0">0</button>
      <button class="key go" data-k="go" aria-label="Check answer">✓</button>
    </div>`;
  const display = $('.display', el);
  const render = () => {
    display.textContent = value || '?';
    display.classList.toggle('empty', !value);
  };
  const press = (k) => {
    if (disabled) return;
    if (k === 'go') {
      if (value) onSubmit(value);
      return;
    }
    sfx.tap();
    if (k === 'del') value = value.slice(0, -1);
    else if (value.length < maxLen) value = value === '0' ? k : value + k;
    render();
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (b) press(b.dataset.k);
  });
  return {
    press,
    get value() {
      return value;
    },
    clear() {
      value = '';
      render();
    },
    disable(d) {
      disabled = d;
      $$('.key', el).forEach((k) => (k.disabled = d));
    },
    shake() {
      display.classList.remove('shake');
      void display.offsetWidth;
      display.classList.add('shake');
    },
  };
}

// ---------------------------------------------------------------- multiple choice

export function choiceButtons(el, choices, onPick) {
  const textOnly = choices.every((c) => !c.html) && choices.some((c) => String(c.label).length > 6);
  el.innerHTML = `<div class="choices${textOnly ? ' choice-text' : ''}">${choices
    .map((c, i) => `<button class="choice" data-i="${i}" aria-label="${esc(c.label)}">${c.html || esc(c.label)}</button>`)
    .join('')}</div>`;
  let disabled = false;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.choice');
    if (!b || disabled || b.classList.contains('picked-wrong')) return;
    sfx.tap();
    onPick(choices[Number(b.dataset.i)].value, b);
  });
  return {
    disable(d) {
      disabled = d;
    },
    mark(value, cls) {
      const i = choices.findIndex((c) => String(c.value) === String(value));
      if (i >= 0) $(`.choice[data-i="${i}"]`, el).classList.add(cls);
    },
  };
}

// ---------------------------------------------------------------- modal & toast

/** In-page confirm dialog (window.confirm is unreliable in home-screen apps). */
export function modal({ title, body = '', actions = [{ label: 'OK', primary: true }] }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <h2>${esc(title)}</h2>${body ? `<div>${body}</div>` : ''}
    <div class="row">${actions.map((a, i) => `<button class="btn${a.primary ? ' primary' : ''}${a.danger ? ' danger' : ''}" data-a="${i}">${esc(a.label)}</button>`).join('')}</div>
  </div>`;
  const close = () => back.remove();
  back.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (b) {
      close();
      actions[Number(b.dataset.a)].onClick?.();
    } else if (e.target === back) close();
  });
  document.body.append(back);
  back.querySelector('.btn.primary, .btn')?.focus();
  return close;
}

export function toast(msg, { action, onAction, ms = 3500 } = {}) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) t.querySelector('button').addEventListener('click', () => {
    t.remove();
    onAction?.();
  });
  document.body.append(t);
  if (ms) setTimeout(() => t.remove(), ms);
}

// ---------------------------------------------------------------- confetti

export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.append(c);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const cols = ['--m-red', '--m-blue', '--m-yellow', '--m-green', '--m-orange', '--m-purple'].map((v) => css.getPropertyValue(v).trim() || '#f5b800');
  const bits = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    s: 6 + Math.random() * 8,
    r: Math.random() * 6,
    c: cols[Math.floor(Math.random() * cols.length)],
  }));
  let frame = 0;
  const step = () => {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.vy += 0.45;
      b.x += b.vx;
      b.y += b.vy;
      b.r += 0.15;
      g.save();
      g.translate(b.x, b.y);
      g.rotate(b.r);
      g.fillStyle = b.c;
      g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
      g.restore();
    }
    if (++frame < 110) requestAnimationFrame(step);
    else c.remove();
  };
  requestAnimationFrame(step);
}

export function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
