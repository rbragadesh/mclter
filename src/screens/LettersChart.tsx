import { useState } from 'react';
import { AYTHAM, CONSONANTS, GRANTHA, SHRI, VOWELS, romanOf, spokenName } from '../data/alphabet';
import { go } from '../lib/router';
import { speak } from '../lib/audio';
import { useProgress, type Progress } from '../lib/storage';

function cls(g: string, p: Progress) {
  const s = p.letters[g];
  if (!s) return 'cell-l';
  return 'cell-l stars-' + s.best;
}

/** The full உயிர்மெய் table: tap to hear, double-tap (or ✍️) to practise writing. */
export function LettersChart() {
  const p = useProgress();
  const [sel, setSel] = useState<string | null>(null);
  const pick = (g: string) => {
    setSel(g);
    void speak(spokenName(g));
  };
  const Cell = ({ g }: { g: string }) => (
    <button className={cls(g, p) + (sel === g ? ' sel' : '')} onClick={() => pick(g)} onDoubleClick={() => go('practice', g)}>
      {g}
    </button>
  );
  return (
    <div className="chart">
      <div className="page-head">
        <button className="btn ghost small" onClick={() => go()}>
          ◀ Home
        </button>
        <div>
          <h2>தமிழ் எழுத்துகள்</h2>
          <p className="sub">Tap a letter to hear it. The colour shows how well she writes it.</p>
        </div>
      </div>
      {sel && (
        <div className="chart-sel">
          <span className="chart-sel-letter">{sel}</span>
          <span className="roman">{romanOf(sel)}</span>
          <button className="btn small" onClick={() => go('practice', sel)}>
            ✍️ Write it
          </button>
        </div>
      )}
      <div className="legend">
        <span className="cell-l">not yet</span>
        <span className="cell-l stars-1">★</span>
        <span className="cell-l stars-2">★★</span>
        <span className="cell-l stars-3">★★★</span>
      </div>
      <div className="table-scroll">
        <table className="uyirmei">
          <thead>
            <tr>
              <th />
              {VOWELS.map((v) => (
                <th key={v.letter}>
                  <Cell g={v.letter} />
                </th>
              ))}
              <th>
                <Cell g={AYTHAM.letter} />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...CONSONANTS, ...GRANTHA].map((c) => (
              <tr key={c.base} className={c.group === 'grantha' ? 'grantha' : ''}>
                <th>
                  <Cell g={c.mei} />
                </th>
                {VOWELS.map((v) => (
                  <td key={v.letter}>
                    <Cell g={c.base + v.sign} />
                  </td>
                ))}
                <td />
              </tr>
            ))}
            <tr className="grantha">
              <th />
              <td>
                <Cell g={SHRI.letter} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
