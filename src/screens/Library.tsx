import { POEMS } from '../data/poems';
import { STORIES } from '../data/stories';
import { English } from '../components/common';
import { go } from '../lib/router';
import { useProgress } from '../lib/storage';

export function Library() {
  const p = useProgress();
  const lessonFor = (id: string) => (p.lessons['story-' + id] ? '✅' : '');
  return (
    <div className="library">
      <div className="page-head">
        <button className="btn ghost small" onClick={() => go()}>
          ◀ Home
        </button>
        <h2>📚 கதைகளும் பாடல்களும் · Stories & songs</h2>
      </div>
      <h3>கதைகள் · Stories</h3>
      <div className="book-grid">
        {STORIES.map((s) => (
          <button key={s.id} className="book" onClick={() => go('lesson', 'story-' + s.id)}>
            <span className="book-cover">{s.cover}</span>
            <strong>{s.title}</strong>
            <English text={s.titleEn} />
            <small>
              Grade {s.grade} {lessonFor(s.id)}
            </small>
          </button>
        ))}
      </div>
      <h3>பாடல்கள் · Verses and songs</h3>
      <div className="book-grid">
        {POEMS.map((poem) => (
          <button key={poem.id} className="book" onClick={() => go('lesson', poem.id === 'nila-nila' ? 'poem-nila' : 'poem-' + poem.id)}>
            <span className="book-cover">{poem.cover}</span>
            <strong>{poem.title}</strong>
            <English text={poem.titleEn} />
          </button>
        ))}
      </div>
      <h3>நான் எழுதியவை · Things I made</h3>
      <div className="book-grid">
        <button className="book" onClick={() => go('lesson', 'story-maker')}>
          <span className="book-cover">🧚</span>
          <strong>என் கதை</strong>
          <English text="Make my own story" />
        </button>
        <button className="book" onClick={() => go('lesson', 'notebook')}>
          <span className="book-cover">📒</span>
          <strong>நோட்டுப் புத்தகம்</strong>
          <English text="My notebook" />
        </button>
      </div>
      {p.myStories.map((s) => (
        <div key={s.id} className="my-story">
          <span className="prompt-scene">{s.picture}</span>
          <p>{s.sentences.join(' ')}</p>
        </div>
      ))}
    </div>
  );
}
