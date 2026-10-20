import { useMemo, useState } from 'react';
import { CONSONANTS, GRANTHA, VOWELS } from '../data/alphabet';
import { ALL_LESSONS, UNITS } from '../data/curriculum';
import { unitProgress } from './Home';
import { go } from '../lib/router';
import { exportProgress, importProgress, resetProgress, setSettings, streak, useProgress } from '../lib/storage';
import type { Strictness } from '../lib/strokeMatch';

const ALL_LETTERS = [
  ...VOWELS.map((v) => v.letter),
  'ஃ',
  ...CONSONANTS.map((c) => c.mei),
  ...CONSONANTS.flatMap((c) => VOWELS.map((v) => c.base + v.sign)),
  ...GRANTHA.map((g) => g.base),
];

function Gate({ onPass }: { onPass: () => void }) {
  const [a] = useState(() => 4 + Math.floor(Math.random() * 5));
  const [b] = useState(() => 5 + Math.floor(Math.random() * 4));
  const [val, setVal] = useState('');
  return (
    <div className="gate">
      <h2>👪 For grown-ups</h2>
      <p>
        What is {a} × {b}?
      </p>
      <div className="gate-input">{val || ' '}</div>
      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
          <button
            key={n}
            className="key"
            onClick={() => {
              const v = (val + n).slice(-3);
              setVal(v);
              if (Number(v) === a * b) onPass();
            }}
          >
            {n}
          </button>
        ))}
        <button className="key" onClick={() => setVal('')}>
          C
        </button>
      </div>
      <button className="btn ghost" onClick={() => go()}>
        ◀ Back
      </button>
    </div>
  );
}

async function downloadAllAudio(setMsg: (s: string) => void) {
  try {
    const base = import.meta.env.BASE_URL + 'audio/';
    const m = await (await fetch(base + 'manifest.json')).json();
    const files = [...new Set([...Object.values(m.ta), ...Object.values(m.en)])] as string[];
    const cache = await caches.open('tamil-audio-v1');
    let n = 0;
    for (let i = 0; i < files.length; i += 12) {
      await Promise.all(
        files.slice(i, i + 12).map(async (f) => {
          const url = base + f;
          if (!(await cache.match(url))) await cache.add(url);
          n++;
        }),
      );
      setMsg(`Downloading sounds… ${n} / ${files.length}`);
    }
    setMsg(`All ${files.length} sounds saved for offline use ✅`);
  } catch {
    setMsg('Could not download the sounds. Check the internet connection and try again.');
  }
}

export function Parent() {
  const [ok, setOk] = useState(false);
  const p = useProgress();
  const [msg, setMsg] = useState('');
  const s = p.settings;

  const letterStats = useMemo(() => {
    const mastered = ALL_LETTERS.filter((g) => (p.letters[g]?.best ?? 0) >= 3).length;
    const practised = ALL_LETTERS.filter((g) => p.letters[g]).length;
    const weak = Object.entries(p.letters)
      .filter(([, x]) => x.attempts > 0)
      .map(([g, x]) => ({ g, rate: x.mistakes / x.attempts, best: x.best, attempts: x.attempts }))
      .filter((x) => x.rate >= 1 || x.best < 2)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 16);
    return { mastered, practised, weak };
  }, [p.letters]);

  if (!ok) return <Gate onPass={() => setOk(true)} />;

  const done = Object.keys(p.lessons).length;
  const wordsRight = Object.values(p.words).reduce((a, w) => a + w.right, 0);
  const wordsWrong = Object.values(p.words).reduce((a, w) => a + w.wrong, 0);

  return (
    <div className="parent">
      <div className="page-head">
        <button className="btn ghost small" onClick={() => go()}>
          ◀ Home
        </button>
        <h2>👪 Parent dashboard</h2>
      </div>

      <section className="cards">
        <div className="stat">
          <strong>
            {done}/{ALL_LESSONS.length}
          </strong>
          <span>lessons done</span>
        </div>
        <div className="stat">
          <strong>
            {letterStats.mastered}/{ALL_LETTERS.length}
          </strong>
          <span>letters written with ★★★</span>
        </div>
        <div className="stat">
          <strong>{letterStats.practised}</strong>
          <span>letters practised</span>
        </div>
        <div className="stat">
          <strong>{p.days.length}</strong>
          <span>days practised (streak {streak(p)})</span>
        </div>
        <div className="stat">
          <strong>{wordsRight + wordsWrong ? Math.round((100 * wordsRight) / (wordsRight + wordsWrong)) : 0}%</strong>
          <span>word questions right first time</span>
        </div>
      </section>

      <h3>Progress by unit</h3>
      <div className="unit-bars">
        {UNITS.map((u) => (
          <button key={u.id} className="unit-bar" onClick={() => go('unit', u.id)}>
            <span>
              G{u.grade} · {u.titleEn}
            </span>
            <span className="bar">
              <span style={{ width: `${unitProgress(u, p) * 100}%` }} />
            </span>
          </button>
        ))}
      </div>

      <h3>Letters that need practice</h3>
      {letterStats.weak.length === 0 ? (
        <p className="sub">Nothing yet — letters she struggles with will show up here.</p>
      ) : (
        <div className="letter-grid">
          {letterStats.weak.map((w) => (
            <button key={w.g} className="letter-btn weak" onClick={() => go('practice', w.g)} title={`${w.attempts} tries, ${w.rate.toFixed(1)} mistakes per try`}>
              {w.g}
              <small>{w.rate.toFixed(1)}✗</small>
            </button>
          ))}
        </div>
      )}

      <h3>Settings</h3>
      <div className="settings">
        <label>
          Child’s name (shown on the home screen)
          <input value={s.childName} onChange={(e) => setSettings({ childName: e.target.value })} placeholder="e.g. Nila" />
        </label>
        <fieldset>
          <legend>How strict is the handwriting check?</legend>
          {(
            [
              ['strict', 'Strict', 'Every stroke in order, in one go, without lifting.'],
              ['normal', 'Normal (recommended)', 'Order and direction are checked; lifting mid-stroke is allowed.'],
              ['flexible', 'Flexible', 'Only the shape is checked — any order or direction. Use this if her school teaches a different stroke order.'],
            ] as [Strictness, string, string][]
          ).map(([v, label, help]) => (
            <label key={v} className="radio">
              <input type="radio" name="strict" checked={s.strictness === v} onChange={() => setSettings({ strictness: v })} />
              <span>
                <strong>{label}</strong> — {help}
              </span>
            </label>
          ))}
        </fieldset>
        <label className="check">
          <input type="checkbox" checked={s.pencilOnly} onChange={(e) => setSettings({ pencilOnly: e.target.checked })} />
          Apple Pencil only (ignore fingers and palm on the writing pad)
        </label>
        <label className="check">
          <input type="checkbox" checked={s.englishPrompts} onChange={(e) => setSettings({ englishPrompts: e.target.checked })} />
          Spoken English instructions (“Start at the green dot”, “Follow the arrow”…)
        </label>
        <label className="check">
          <input type="checkbox" checked={s.showRoman} onChange={(e) => setSettings({ showRoman: e.target.checked })} />
          Show English letters under Tamil (ka, kaa…)
        </label>
        <label className="check">
          <input type="checkbox" checked={s.showEnglish} onChange={(e) => setSettings({ showEnglish: e.target.checked })} />
          Show English meanings of words and sentences
        </label>
      </div>

      <h3>Offline & backup</h3>
      <div className="row wrap">
        <button className="btn ghost" onClick={() => void downloadAllAudio(setMsg)}>
          ⬇️ Save all sounds for offline use (~12 MB)
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            const blob = new Blob([exportProgress()], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `tamil-progress-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }}
        >
          💾 Export progress
        </button>
        <label className="btn ghost">
          📂 Import progress
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMsg(importProgress(await f.text()) ? 'Progress imported ✅' : 'That file is not a progress backup.');
            }}
          />
        </label>
        <button
          className="btn ghost danger"
          onClick={() => {
            if (confirm('Erase all progress on this device? Settings are kept.')) resetProgress();
          }}
        >
          🗑️ Reset progress
        </button>
      </div>
      {msg && <p className="note">{msg}</p>}

      {(p.myStories.length > 0 || p.notebook.length > 0) && (
        <>
          <h3>Her writing</h3>
          {p.myStories.map((st) => (
            <div key={st.id} className="my-story">
              <span className="prompt-scene">{st.picture}</span>
              <p>{st.sentences.join(' ')}</p>
              <small>{new Date(st.created).toLocaleDateString()}</small>
            </div>
          ))}
          <div className="thumbs big">
            {p.notebook.map((n) => (
              <img key={n.id} src={n.image} alt={`Notebook page from ${new Date(n.created).toLocaleDateString()}`} />
            ))}
          </div>
        </>
      )}

      <h3>Teaching remotely</h3>
      <ul className="tips">
        <li>On the iPad, add this page to the Home Screen (Share → Add to Home Screen) so it opens full-screen like an app.</li>
        <li>In your video call (Zoom, Meet, FaceTime with SharePlay), let her share the iPad screen so you can watch her write. Screen sharing does not carry her touches to you — you guide by voice.</li>
        <li>Short and daily beats long and weekly: one lesson (10–15 minutes) a day.</li>
        <li>The app cannot hear her read aloud. For “I read it!” steps, you are the judge — ask her to read to you before she taps.</li>
        <li>Stroke order varies a little between schools. If her teacher shows a different order, switch the check to “Flexible”.</li>
      </ul>
    </div>
  );
}
