import { useEffect, useState } from 'react';
import { isMuted, setMuted, unlockAudio } from './lib/audio';
import { go, useRoute } from './lib/router';
import { Home } from './screens/Home';
import { LessonPlayer } from './screens/LessonPlayer';
import { LettersChart } from './screens/LettersChart';
import { Library } from './screens/Library';
import { Parent } from './screens/Parent';
import { Practice } from './screens/Practice';
import { UnitView } from './screens/UnitView';

export function App() {
  const route = useRoute();
  const [muted, setMutedState] = useState(isMuted());

  // iPad: sound can only start after a tap
  useEffect(() => {
    const once = () => unlockAudio();
    window.addEventListener('pointerdown', once, { once: true });
    return () => window.removeEventListener('pointerdown', once);
  }, []);

  // no pinch-zoom / double-tap zoom while writing
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', stop);
    return () => document.removeEventListener('gesturestart', stop);
  }, []);

  const [page, ...args] = route;
  let view;
  switch (page) {
    case 'unit':
      view = <UnitView id={args[0]} />;
      break;
    case 'lesson':
      view = <LessonPlayer id={args[0]} />;
      break;
    case 'letters':
      view = <LettersChart />;
      break;
    case 'practice':
      view = <Practice letter={args[0]} />;
      break;
    case 'library':
      view = <Library />;
      break;
    case 'parent':
      view = <Parent />;
      break;
    default:
      view = <Home />;
  }

  return (
    <div className={'app' + (page === 'lesson' ? ' in-lesson' : '')}>
      {page !== 'lesson' && (
        <header className="topbar">
          <button className="brand" onClick={() => go()}>
            <span className="brand-mark">அ</span> தமிழ் படி
          </button>
          <button
            className="btn ghost small"
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            aria-label={muted ? 'Sound on' : 'Sound off'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </header>
      )}
      <main>{view}</main>
    </div>
  );
}
