import { useState } from 'react';
import { CONSONANTS, VOWELS, spokenName } from '../data/alphabet';
import { WritingPad } from '../components/WritingPad';
import { StrokeAnimation } from '../components/StrokeAnimation';
import { SpeakButton, Stars } from '../components/common';
import { go } from '../lib/router';
import { shapeFor } from '../lib/shapes';
import { recordLetter, useProgress } from '../lib/storage';
import type { WriteMode } from '../lib/strokeMatch';

/** Free writing practice for any letter, in any mode. */
export function Practice({ letter }: { letter?: string }) {
  const p = useProgress();
  const [mode, setMode] = useState<WriteMode | 'watch'>('trace');
  const [round, setRound] = useState(0);
  const [last, setLast] = useState<number | null>(null);

  if (!letter || !shapeFor(letter)) {
    // choose a letter; weakest ones first
    const weak = Object.entries(p.letters)
      .filter(([, s]) => s.best < 3)
      .sort((a, b) => a[1].best - b[1].best || b[1].mistakes - a[1].mistakes)
      .slice(0, 12)
      .map(([g]) => g);
    return (
      <div className="practice-pick">
        <div className="page-head">
          <button className="btn ghost small" onClick={() => go()}>
            ◀ Home
          </button>
          <h2>✍️ எழுதிப் பழகு · Practise writing</h2>
        </div>
        {weak.length > 0 && (
          <>
            <h3>Needs more practice</h3>
            <div className="letter-grid">
              {weak.map((g) => (
                <button key={g} className="letter-btn weak" onClick={() => go('practice', g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}
        <h3>உயிர் · Vowels</h3>
        <div className="letter-grid">
          {[...VOWELS.map((v) => v.letter), 'ஃ'].map((g) => (
            <button key={g} className="letter-btn" onClick={() => go('practice', g)}>
              {g}
            </button>
          ))}
        </div>
        <h3>மெய் · Consonants</h3>
        <div className="letter-grid">
          {CONSONANTS.map((c) => (
            <button key={c.base} className="letter-btn" onClick={() => go('practice', c.base)}>
              {c.base}
            </button>
          ))}
        </div>
        <p className="sub">For all 247 letters, open the Letters chart and tap ✍️.</p>
        <button className="btn ghost" onClick={() => go('letters')}>
          அ Letters chart
        </button>
      </div>
    );
  }

  const shape = shapeFor(letter)!;
  const stat = p.letters[letter];
  return (
    <div className="practice">
      <div className="page-head">
        <button className="btn ghost small" onClick={() => go('practice')}>
          ◀ Letters
        </button>
        <h2 className="practice-letter">
          {letter} <SpeakButton text={spokenName(letter)} />
        </h2>
        {stat && <Stars n={stat.best} />}
      </div>
      <div className="mode-tabs" role="tablist">
        {(
          [
            ['watch', '👀 Watch'],
            ['trace', '✏️ Trace'],
            ['guided', '🌫️ Light guide'],
            ['memory', '🧠 From memory'],
          ] as const
        ).map(([m, label]) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => (setMode(m), setLast(null))}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'watch' ? (
        <div className="watch-box">
          <StrokeAnimation shape={shape} replay={round} />
          <button className="btn ghost" onClick={() => setRound((r) => r + 1)}>
            ↺ Again
          </button>
        </div>
      ) : (
        <>
          <WritingPad
            key={mode + round}
            letter={letter}
            mode={mode}
            onDone={(r) => {
              recordLetter(letter, r.stars, r.mistakes);
              setLast(r.stars);
            }}
          />
          {last !== null && (
            <div className="row">
              <Stars n={last} />
              <button className="btn" onClick={() => (setRound((x) => x + 1), setLast(null))}>
                ↺ Write it again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
