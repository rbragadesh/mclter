import { UNITS } from '../data/curriculum';
import { Stars } from '../components/common';
import { go } from '../lib/router';
import { useProgress } from '../lib/storage';

export function UnitView({ id }: { id: string }) {
  const unit = UNITS.find((u) => u.id === id);
  const p = useProgress();
  if (!unit) return <p className="empty">Unit not found.</p>;
  const firstOpen = unit.lessons.find((l) => !p.lessons[l.id]);
  return (
    <div className="unit">
      <div className="page-head">
        <button className="btn ghost small" onClick={() => go()}>
          ◀ Home
        </button>
        <div>
          <h2>
            {unit.icon} {unit.title}
          </h2>
          <p className="sub">{unit.titleEn}</p>
        </div>
      </div>
      <p className="goal">🎯 {unit.goal}</p>
      <div className="lesson-path">
        {unit.lessons.map((l, i) => {
          const rec = p.lessons[l.id];
          return (
            <button key={l.id} className={'lesson-node' + (rec ? ' done' : '') + (firstOpen?.id === l.id ? ' next' : '')} onClick={() => go('lesson', l.id)}>
              <span className="node-num">{i + 1}</span>
              <span className="node-icon">{l.icon}</span>
              <span className="node-text">
                <strong>{l.title}</strong>
                <small>{l.titleEn}</small>
              </span>
              {rec ? <Stars n={rec.stars} /> : <span className="node-go">▶</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
