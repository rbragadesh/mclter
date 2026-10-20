# Math Climb

A visual maths practice app for grades 1–2, built to install on an iPad home screen and work offline.
Every idea is shown with a classroom manipulative first (ten-frames, base-ten blocks, arrays, number lines,
fraction pieces, a clock, a balance scale, bar models), then practised with hints, then tested without them.

No accounts, no ads, no server, no build step. Progress stays on the iPad.

## What's inside

| Topic | Levels (grade) | The picture she works with |
|---|---|---|
| Counting | count to 10 → ten-frames to 20 → one/ten more → bigger/smaller → skip counting | objects, ten-frames, hundred chart |
| Place value | tens & ones → hundreds → value of a digit | base-ten blocks |
| Addition | within 10 → make 10 → within 20 (make-10 trick) → 2-digit → three numbers | ten-frames, number bonds, number line |
| Subtraction | take away → within 20 → missing part → 2-digit | crossed-out counters, number line |
| Multiplication | equal groups → arrays → skip counting → tables 2/3/4/5/10 → all tables → missing factor | plates, dot arrays, table grid |
| Division | sharing → grouping → arrays → facts → remainders | plates, animated sharing |
| Fractions | equal parts → halves/thirds/quarters → name it → find the picture → compare → fraction of a group | pizzas, bars, fraction wall |
| Clock | o'clock → half past → quarter past/to → 5 minutes → elapsed time | analog clock |
| Puzzles (Olympiad) | shape patterns → number patterns → balance & picture equations → number pyramids → tricky patterns & odd one out → legs/wheels reasoning | balance scale, pyramids, bead chains |
| Story problems (Olympiad) | add/take away → compare → groups & sharing → two-step → trick questions (positions in a line, "between", cuts vs pieces, ages) | bar models, a line of children, ribbons |

**Modes**

- **See it**: hands-on explorers for each topic (build an array, deal cookies onto plates, shade fraction parts, move clock hands, tap the times-table grid).
- **Practice**: 10 questions (5–20 in settings). Two tries per question; after a wrong answer the picture hint appears. A missed question comes back three questions later.
- **Daily Mix**: picks weak and neglected topics, plus times-table facts that are due for review.
- **Weekly Check-up**: 20 questions across all topics at her level, one try, no hints. Home shows *Ready!* when a week has passed.
- **Olympiad Mock**: 15 questions in sections worth 1, 2 and 3 points, in the style of Math Kangaroo / SOF IMO.
- **Times-table Test**: 20 facts from the tables you pick.
- **Games**: 60-second Speed Round (opt-in timing), Make 10 / 20 / 100 pairs.
- **Grown-ups** (lock button, behind a multiplication question): progress per topic, level overrides, a times-table heat map, test history with every mistake, settings, backup codes, and printable worksheets with an answer key.

**How levels move.** 8 of the last 10 right at the current level moves her up. Three questions in a row missed even after the hint moves her down one. One question in five revisits the level below. Times-table facts use spaced review (Leitner boxes): a missed fact comes back in minutes; a solid one comes back after weeks.

## Put it on the iPad

The app has to be served over HTTPS once. After that it runs from the home screen with no internet.

1. **Host it** (one time). On GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, choose the branch with this code and `/ (root)`, then *Save*. After a minute it is live at `https://rbragadesh.github.io/mclter/`.
   (Netlify Drop or Cloudflare Pages work too: drag the folder in. There is nothing to build.)
2. On the iPad, open that address in **Safari** (not Chrome; only Safari can install home-screen apps on iPad).
3. Tap **Share** → **Add to Home Screen** → **Add**.
4. Open **Math Climb** from the home screen. Enter her name and grade.
5. Turn the volume up. Questions are read aloud with the iPad's own voice.

**Updates.** When you change the code, run `npm run bump` (a test fails if you forget), then push. The next time the app opens online, it shows *A new version is ready — Update*.

**Backups.** Progress lives on that iPad only. Home-screen apps are exempt from Safari's 7-day data clean-up, but deleting the app or clearing Safari data erases it. Use *Grown-ups → Settings → Copy backup code* now and then, and paste it into Notes.

Requires iPadOS 16.2 or later (the colour styles use `color-mix`).

## Develop

```sh
npm install          # only Playwright, for the browser tests
npm start            # http://localhost:8080
npm test             # 39 unit tests: every generator × level × 400 seeds, mastery, storage, sessions, PWA files
npm run test:e2e     # 12 browser tests at iPad sizes, offline mode, dark mode; screenshots in test-results/
npm run bump         # after changing any app file
python3 scripts/make_icons.py   # regenerate icons (needs Pillow)
```

Code map: `js/skills/*.js` generate questions (pure functions with a seeded RNG), `js/visuals.js` draws the manipulatives as SVG,
`js/mastery.js` holds the level and review rules, `js/session.js` runs practice and tests, `js/views/*` are the screens,
`sw.js` is the offline cache.

## Limits worth knowing

- Tested in Chromium at iPad sizes, **not on a real iPad or in Safari's WebKit engine**. Try it on the iPad before relying on it, especially read-aloud.
- Olympiad papers also include spatial puzzles (counting triangles, cube nets, mirror images) and many hand-crafted trick questions. The generators cover patterns, balances, pyramids, picture equations and the classic traps, not spatial reasoning. Pair the app with a past-paper book.
- One child per iPad. A second child needs a second install, or a backup code swapped in and out.
- Answers are typed or tapped, never handwritten. Use the printable worksheets for pencil practice.
