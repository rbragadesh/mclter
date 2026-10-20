import { useEffect, useState } from 'react';
import { ActivityView, activityKey } from '../activities/ActivityView';
import { ALL_LESSONS, findLesson } from '../data/curriculum';
import { NextButton, Stars } from '../components/common';
import { sfx, speak, stopSpeech } from '../lib/audio';
import { PROMPTS } from '../lib/prompts';
import { go } from '../lib/router';
import { recordLesson, useSettings } from '../lib/storage';

export function LessonPlayer({ id }: { id: string }) {
  const found = findLesson(id);
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  useEffect(() => {
    setStep(0);
    setScores([]);
  }, [id]);
  useEffect(() => () => stopSpeech(), []);

  if (!found) return <p className="empty">Lesson not found.</p>;
  const { lesson, unit } = found;
  const total = lesson.activities.length;
  const finished = step >= total;
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const stars = avg >= 0.85 ? 3 : avg >= 0.55 ? 2 : 1;

  const next = (score: number) => {
    stopSpeech();
    const s = [...scores, score];
    setScores(s);
    if (step + 1 >= total) {
      const a = s.reduce((x, y) => x + y, 0) / s.length;
      recordLesson(lesson.id, a >= 0.85 ? 3 : a >= 0.55 ? 2 : 1);
      sfx.win();
      if (settings.englishPrompts) setTimeout(() => void speak(PROMPTS.lessonDone, 'en'), 600);
    }
    setStep(step + 1);
  };

  const idx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
  const following = ALL_LESSONS[idx + 1];

  return (
    <div className="lesson">
      <div className="lesson-head">
        <button className="btn ghost small" onClick={() => go('unit', unit.id)} aria-label="Back to unit">
          ✕
        </button>
        <div className="progress-bar" aria-label={`Step ${Math.min(step + 1, total)} of ${total}`}>
          <div className="progress-fill" style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
        <span className="lesson-title">{lesson.title}</span>
        {!finished && (
          <button className="btn ghost small" onClick={() => next(0)} title="Skip this activity">
            Skip ⏭
          </button>
        )}
      </div>
      <div className="lesson-body">
        {finished ? (
          <div className="act lesson-done">
            <div className="big-done">🏆</div>
            <h2>அருமை! Lesson complete</h2>
            <Stars n={stars} />
            <div className="row">
              <button className="btn ghost" onClick={() => (setStep(0), setScores([]))}>
                ↺ Do it again
              </button>
              {following && <NextButton label={`Next: ${following.title}`} onClick={() => go('lesson', following.id)} />}
            </div>
            <button className="btn ghost small" onClick={() => go()}>
              🏠 Home
            </button>
          </div>
        ) : (
          <ActivityView key={activityKey(lesson.activities[step], step)} a={lesson.activities[step]} onDone={next} />
        )}
      </div>
    </div>
  );
}
