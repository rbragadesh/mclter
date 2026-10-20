import { useState } from 'react';
import { ALL_LESSONS, UNITS, type Unit } from '../data/curriculum';
import { go } from '../lib/router';
import { streak, useProgress, type Progress } from '../lib/storage';

export function unitProgress(u: Unit, p: Progress): number {
  const done = u.lessons.filter((l) => p.lessons[l.id]).length;
  return done / u.lessons.length;
}

export function nextLesson(p: Progress) {
  return ALL_LESSONS.find((l) => !p.lessons[l.id]) ?? ALL_LESSONS[0];
}

function Ring({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="28" r={r} className="ring-bg" />
      <circle cx="28" cy="28" r={r} className="ring-fg" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 28 28)" />
    </svg>
  );
}

export function Home() {
  const p = useProgress();
  const nl = nextLesson(p);
  const nlUnit = UNITS.find((u) => u.lessons.some((l) => l.id === nl.id))!;
  const [grade, setGrade] = useState<1 | 2>(nlUnit.grade);
  const name = p.settings.childName;
  const days = streak(p);

  return (
    <div className="home">
      <header className="hero">
        <div>
          <h1>
            வணக்கம்{name ? `, ${name}` : ''}! <span className="wave">👋</span>
          </h1>
          <p className="hero-sub">Let’s learn Tamil — read it, write it, love it.</p>
        </div>
        <div className="hero-stats">
          <span className="pill">⭐ {p.stars}</span>
          <span className="pill">🔥 {days} day{days === 1 ? '' : 's'}</span>
        </div>
      </header>

      <button className="continue" onClick={() => go('lesson', nl.id)}>
        <span className="continue-icon">{nl.icon}</span>
        <span className="continue-text">
          <small>{Object.keys(p.lessons).length ? 'Continue' : 'Start here'}</small>
          <strong>{nl.title}</strong>
          <span>
            {nlUnit.titleEn} · {nl.titleEn}
          </span>
        </span>
        <span className="continue-go">▶</span>
      </button>

      <nav className="quick">
        <button onClick={() => go('letters')}>
          <span>அ</span>Letters chart
        </button>
        <button onClick={() => go('practice')}>
          <span>✍️</span>Practise writing
        </button>
        <button onClick={() => go('library')}>
          <span>📚</span>Stories & songs
        </button>
        <button onClick={() => go('parent')}>
          <span>👪</span>Parent
        </button>
      </nav>

      <div className="grade-tabs" role="tablist">
        {[1, 2].map((g) => (
          <button key={g} role="tab" aria-selected={grade === g} className={grade === g ? 'on' : ''} onClick={() => setGrade(g as 1 | 2)}>
            {g === 1 ? 'முதல் வகுப்பு · Grade 1' : 'இரண்டாம் வகுப்பு · Grade 2'}
          </button>
        ))}
      </div>

      <div className="units">
        {UNITS.filter((u) => u.grade === grade).map((u) => {
          const v = unitProgress(u, p);
          return (
            <button key={u.id} className={'unit-card' + (u.id === nlUnit.id ? ' current' : '') + (v === 1 ? ' complete' : '')} onClick={() => go('unit', u.id)}>
              <span className="unit-icon">{u.icon}</span>
              <span className="unit-text">
                <strong>{u.title}</strong>
                <span>{u.titleEn}</span>
              </span>
              <span className="unit-ring">
                <Ring value={v} />
                <small>
                  {u.lessons.filter((l) => p.lessons[l.id]).length}/{u.lessons.length}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
