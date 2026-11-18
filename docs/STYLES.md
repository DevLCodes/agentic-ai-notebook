# Style: the field manual

This repo holds only the advanced agentic system design pages, in `system-design/`. Every page uses one look: a clean, quiet reference with grey paper, crisp type, precise diagrams and 3D scenes. The voice is dense and exact, with numbers, trade-offs, failure modes and interview framing. Fonts are Bricolage Grotesque (display), Instrument Sans (body) and IBM Plex Mono (labels, code); body text is 16px at 1.6 line height in a 760px reading column.

The beginner concept notebooks moved to DevLCodes/agentic-ai-beginner and the classic (non-agentic) system design pages moved to DevLCodes/classic-system-designs; each has its own style. The root `*.html` files and `classic-system-design/*.html` here are only redirect stubs. The header's "Classic" link points to https://devlcodes.github.io/classic-system-designs/.

## Details

**Tokens** (copy the `:root` block from `system-design/index.html`):
`--bg #e9ecef`, `--paper #f7f8f9`, `--ink #1c2530`, `--muted #586473`, `--line #cdd4dc`, `--line-strong #9aa5b1`, `--accent #4255d4`, `--code-bg #eef1f4`, `--wire #7d8996`. Diagram layer colours are semantic and fixed across every page: ingest `#2a9d8f`, knowledge base `#4d5fd8`, serving `#d7932a`, model `#e2674f`, governance `#b2456e`, cross-cutting `#4a5562`, dead-letter/error `#b23a3a`, ok `#2f8f5b`, each with a pale `--t-*` tint for fills.

**Layout**: slim `.sitebar` on top, then either a card grid (hubs), or `.doc`: a sticky numbered `.toc` rail (220px) beside a 760px `article`. Sections are separated by hairlines, not decoration. Mono uppercase `.eyebrow` / `.k` labels sit above titles.

**Components**
- `.fig` with an inline `svg.dg` diagram using the semantic layer classes (`.k-ingest`, `.k-kb`, `.k-serve`…), or a `.fig3d` scene built with `assets/scene3d.js` (three@0.160.0 importmap).
- `.note` (accent left border), `.formula` (mono, boxed), `.table` wrappers for wide tables, `.related` pill links, `.pager` prev/next.
- `.lab` blocks for interactive calculators, in the same quiet styling.
- Study: `system-design/study.html` (the hub) and `system-design/study.js` (the engine) turn each topic's deck into flashcards and a quiz, in the same quiet styling. See "Study decks" below.
- Progress lives on `system-design/roadmap.html` (with a summary card on the home page), stored in the `asd_roadmap` cookie by `system-design/progress.js`. Every page in `system-design/` loads that script.

**Don't**: use handwriting fonts, rotated stickies, highlighter strokes or paper textures. Don't recolour the layer palette; a reader learns "orange is serving" once and relies on it everywhere.

## Checklist for a new page
1. Copy the `:root` tokens and base CSS from an existing page (`system-design/chunking.html`), not from memory.
2. Add `<script src="progress.js"></script>` before `</body>`, a card on `system-design/designs.html` or `topics.html`, and a node in the `STAGES` lists of `roadmap.html` and the home page progress card. Keep the shared site header (Home, Designs, Topics, Roadmap, Study, Classic, Glossary) identical on every page.
3. Check it at 390px wide: no horizontal scroll, 16px side gutter.
4. Run `python3 .claude/skills/notebook-standards/check.py` and fix every failure. Before adding a page at all, see `.claude/skills/notebook-standards/SKILL.md`: new content extends an existing page by default.

## Study decks

Each topic page can have a deck of flashcards and quiz questions at `system-design/decks/<page-slug>.json`. The format is shared by every study task; don't change it:

```json
{
  "title": "Embeddings",
  "page": "embeddings.html",
  "cards": [
    {"front": "term or question", "back": "1-3 plain sentences", "link": "embeddings.html#section-id"}
  ],
  "quiz": [
    {"q": "question", "choices": ["four", "plausible", "options", "here"], "answer": 0, "why": "one sentence", "link": "embeddings.html#section-id"}
  ]
}
```

- 8 to 12 cards and 5 to 8 questions per page. Check every answer against the page itself, not memory.
- Every `link` points at a real section `id` on a system-design page. Wrong choices should be plausible, and the right answer should not always sit in the same position (the engine shuffles choices anyway).
- Add the slug to `system-design/decks/index.json`. The hub reads that list so it never requests a deck that doesn't exist, and shows topics in the order of `topics.html`. Topics without a deck stay hidden, so adding a deck means one JSON file plus one line in the list.
- `check.py` validates every deck: the keys, card and question counts, four distinct choices, the answer index, that every link resolves to a section id, and that `index.json` lists exactly the deck files.

**The engine** (`study.js`, no dependencies) exposes `StudyEngine.load(url)` and `StudyEngine.mount(element, deck, "cards" | "quiz")`. It injects its own CSS built on the `:root` tokens, so it works on any field-manual page.
- Flashcards: flip, previous and next, shuffle, mark as known, and skip known cards. Known cards are saved in `localStorage` (`study_known:<page>`), wrapped in try/catch so blocked storage only loses the saving.
- Quiz: one question at a time, choices shuffled, instant feedback with the `why` and a link to the section, a score at the end, and a retry of only the wrong ones.
- Keyboard: Space flips (also when a button has focus), the arrow keys move, K marks known; in the quiz 1 to 4 pick an answer and Enter or the right arrow moves on.
- Check yourself: every topic page has an empty `<section id="check-yourself" hidden></section>` before Related and loads `check-yourself.js`. When the page's slug is in `decks/index.json`, the block shows 3 random quiz questions and a link to the flashcards; finishing it marks the topic quizzed (`q`) in `progress.js`. A new deck lights it up with no page edit; new topic pages copy the placeholder and script tag.
- The hub routes with the hash: `study.html#<slug>/cards` and `study.html#<slug>/quiz` can be linked directly.
