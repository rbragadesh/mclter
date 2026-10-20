import type { Activity } from '../data/curriculum';
import { Notebook, StoryMaker } from './CreativeActivities';
import { Concept, ListenPick, MeetLetter, PicturePick, WatchLetter, WriteLetter } from './LetterActivities';
import { BuildSentence, PoemReader, ReadSentence, StoryReader } from './ReadingActivities';
import { BuildWord, ListenWord, MissingLetter, ReadWord, WriteLetters } from './WordActivities';

export function ActivityView({ a, onDone }: { a: Activity; onDone: (score: number) => void }) {
  switch (a.type) {
    case 'warmup':
      return <WriteLetter letter={a.shape} mode="trace" warmup onDone={onDone} />;
    case 'meet':
      return <MeetLetter letter={a.letter} onDone={onDone} />;
    case 'watch':
      return <WatchLetter letter={a.letter} onDone={onDone} />;
    case 'write':
      return <WriteLetter letter={a.letter} mode={a.mode} onDone={onDone} />;
    case 'listen-pick':
      return <ListenPick target={a.target} options={a.options} onDone={onDone} />;
    case 'picture-pick':
      return <PicturePick word={a.word} letter={a.letter} options={a.options} onDone={onDone} />;
    case 'concept':
      return <Concept base={a.base} sign={a.sign} result={a.result} onDone={onDone} />;
    case 'read-word':
      return <ReadWord word={a.word} onDone={onDone} />;
    case 'listen-word':
      return <ListenWord target={a.target} options={a.options} onDone={onDone} />;
    case 'build-word':
      return <BuildWord word={a.word} extra={a.extra} onDone={onDone} />;
    case 'missing-letter':
      return <MissingLetter word={a.word} index={a.index} options={a.options} onDone={onDone} />;
    case 'write-word':
      return <WriteLetters text={a.word} mode={a.mode} onDone={onDone} />;
    case 'dictation':
      return <WriteLetters text={a.word} mode="memory" dictation onDone={onDone} />;
    case 'read-sentence':
      return <ReadSentence sentence={a.sentence} onDone={onDone} />;
    case 'build-sentence':
      return <BuildSentence sentence={a.sentence} onDone={onDone} />;
    case 'write-sentence':
      return <WriteLetters text={a.sentence} mode="guided" onDone={onDone} />;
    case 'story':
      return <StoryReader id={a.id} onDone={onDone} />;
    case 'poem':
      return <PoemReader id={a.id} onDone={onDone} />;
    case 'story-maker':
      return <StoryMaker onDone={onDone} />;
    case 'notebook':
      return <Notebook onDone={onDone} />;
  }
}

export function activityKey(a: Activity, i: number): string {
  return i + ':' + JSON.stringify(a);
}
