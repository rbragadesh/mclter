# தமிழ் படி — Learn Tamil (Grade 1–2)

A web app for teaching a child to **read and write Tamil from scratch**, built for an iPad
(finger or Apple Pencil) and for a parent guiding remotely over a video call.

- **Writing with feedback, stroke by stroke.** Every one of the 247 letters, plus the grantha
  letters, has a stroke-order model. As she writes, each stroke is checked: right start point,
  right direction, right order, right shape. Mistakes get an immediate, specific correction
  ("Oops, the other way! Follow the arrow", "Draw the stroke with the green dot first") and,
  after repeated mistakes, an animation of that stroke.
- **Three levels of help:** trace over the letter (with start dot and arrows) → write over a faint
  letter → write from memory in an empty four-line box. From memory, the app also notices when the
  whole letter looks like a different one (e.g. ல written instead of வ).
- **Reading:** letter sounds, picture words, "which letter/word did you hear?", building words
  from letter tiles, missing letters, sentences, 8 illustrated stories with questions,
  ஆத்திசூடி, two Thirukkural couplets, a Bharathiyar song and a nursery rhyme. Every Tamil
  word, sentence and story page can be heard.
- **Writing words, sentences and stories:** words and sentences letter by letter (each letter
  checked), dictation, a story maker (word bank + Tamil keyboard) and a free notebook.
- **Parent dashboard:** lessons done, letters mastered, letters that need practice, her saved
  stories and notebook pages, settings (strictness, Apple-Pencil-only), backup/restore.
- **Works offline** once opened (installable to the Home Screen as an app). Progress is kept on
  the iPad; nothing is sent anywhere.

## Curriculum

176 short lessons (about 10–15 minutes each) in two years:

| Grade 1 | Grade 2 |
| --- | --- |
| Pre-writing lines and curves | உயிர்மெய் உ/ஊ rows (கு கூ … — every consonant has its own shape) |
| உயிர் எழுத்துகள் (12) and ஃ | எ/ஏ/ஐ rows (கெ கே கை — the கொம்பு comes first) |
| மெய் எழுத்துகள் (18): வல்லினம், மெல்லினம், இடையினம் | ஒ/ஓ/ஔ rows (கொ கோ கௌ) |
| உயிர்மெய் அ row (க ங ச …) and first words (மரம், படம், கடல் …) | கிரந்த எழுத்துகள் ஜ ஷ ஸ ஹ க்ஷ ஸ்ரீ |
| ஆ row (கா …), இ/ஈ rows (கி கீ …) | ~200 words by theme (animals, food, body, home, colours, numbers, days, actions…) |
| First sentences (இது மரம்.) | Longer sentences, copying sentences |
| Short stories, rhyme, Thirukkural 1 | Stories, dictation, "my own story", notebook, ஆத்திசூடி, Kural, Bharathiyar |

The order follows the usual Tamil Nadu (Samacheer Kalvi) and CBSE Tamil progression for
classes 1–2: vowels → consonants → vowel-consonants row by row → words → sentences → stories.
Word lessons only ever use letters that have already been taught (this is checked by a test).
**It is not a copy of any textbook**: the textbooks are copyrighted and their exact chapter order
differs between boards and years. The stories are original or classic fables retold in simple
words; the verse is public domain (Avvaiyar, Thiruvalluvar, Subramania Bharati, a folk rhyme).

## Using it on the iPad

1. Open the app's address in Safari (see *Publishing* below).
2. Share → **Add to Home Screen**. It now opens full-screen and works without internet.
3. Parent screen → **Save all sounds for offline use** (about 12 MB) if she will use it offline.
4. For remote lessons, she shares the iPad screen in your video call (Zoom/Meet/FaceTime
   SharePlay); you watch and talk her through it. Screen sharing does not send your taps to her
   iPad.

The parent screen is behind a small multiplication question.

Progress lives in the browser storage of the app on that iPad. The Home Screen app and Safari
keep **separate** storage, so always open it the same way, and use *Parent → Export progress*
now and then as a backup (also the way to move to a new iPad).

## Publishing (free, GitHub Pages)

1. In this repository: **Settings → Pages → Source: GitHub Actions** (one time).
2. The *Deploy to GitHub Pages* workflow builds, tests and publishes on every push to `main`
   (or run it by hand from the Actions tab). The address is `https://rbragadesh.github.io/tamil-padi/`.

Any static host works too: `npm run build` and upload the `dist/` folder.

This app is kept separate from the maths app (`rbragadesh/mclter`). Both are served from
`rbragadesh.github.io`, so they share the browser's storage on the iPad; each keeps its own
data under its own names (`tamil-padi-progress-v1` and `tamil-*` caches here) and only ever
clears its own caches.

## Honest limitations

- **Stroke order conventions vary.** The stroke orders were authored for this app following the
  common rules (start at the letter's loop and keep the pen moving; vertical lines top-to-bottom;
  bars left-to-right; parts left-to-right). I could not verify every letter against an official
  chart. If her teacher teaches a letter differently, set *Parent → Flexible* (only the shape is
  checked), or change that letter in `tools/stroke_spec.py` (see below).
- **Letter shapes follow print (Noto Sans Tamil)**, with print-only details such as the
  overhanging top bar of க left out. Handwriting taught in some schools is rounder.
- **It cannot hear her read.** "I read it!" steps are honour-based — the parent is the judge.
- **Free writing is not graded.** Words, sentences and dictation are checked letter by letter
  because the app knows what she should write; her own stories and notebook pages are saved for
  you to read, not marked.
- **Speech is synthesised** (Microsoft's neural Tamil voice), generated with the unofficial
  `edge-tts` tool. Single letters and words generally sound right, but I could not listen to the
  1,000+ clips myself — spot-check them. Because this repository is public, the clips are publicly
  redistributed; for anything beyond family use, regenerate them with your own Azure Speech key or
  replace them with your own recordings (keep the same file names).
- The handwriting check is tuned for a child's finger on an iPad: generous about wobble, strict
  about direction and order. Expect occasional false "try again"s on very messy strokes; the
  *Show me* button appears after three tries.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests: stroke checker, every letter, content and curriculum checks
npm run build && npx playwright test   # end-to-end tests in an iPad-sized browser
```

Source layout:

- `src/lib/strokeMatch.ts` — the handwriting checker (DTW shape match + start/direction/order).
- `src/data/strokes.json` — stroke model of every glyph (generated, see below).
- `src/data/` — alphabet, words, sentences, stories, poems, curriculum.
- `src/components/WritingPad.tsx` — the writing surface.
- `tools/` — Python scripts that build the stroke data and the audio.

### Changing a letter's stroke order

Strokes are authored as a few waypoints per stroke in `tools/stroke_spec.py`; the build routes
them along the skeleton of the Noto Sans Tamil glyph, so the waypoints only need to be roughly
right.

```bash
pip install -r tools/requirements.txt
cd tools
python3 inspect_glyph.py out.png katamil        # skeleton with labelled coordinates
python3 render_strokes.py out.png katamil       # your strokes: numbers, start points, arrows
python3 build_strokes.py                        # writes ../src/data/strokes.json
```

### Regenerating audio

```bash
npx esbuild tools/js/collect-texts.ts --bundle --platform=node --format=esm --outfile=/tmp/collect.mjs
node /tmp/collect.mjs /tmp/texts.json
python3 tools/gen_audio.py /tmp/texts.json      # only new or changed texts are fetched
```

## Licences

- Noto Sans Tamil: SIL Open Font License 1.1 (`public/fonts/OFL.txt`).
- Stories: original or retold fables. Verse: public domain.
