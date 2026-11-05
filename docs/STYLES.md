# Two styles, on purpose

This site has two audiences, and each gets its own look. Keep them apart: a page takes the style of the section it lives in, never a mix.

| | **Beginner: the notebook** | **Advanced: the field manual** |
| --- | --- | --- |
| For | Engineers learning agents for the first time | Engineers designing real systems or preparing for a design interview |
| Where | Repo root: `index.html` (the learning roadmap) and the 13 concept pages (`agentic-loop.html` … `open-weight-models.html`) | `system-design/` (designs, topics, glossary) and `classic-system-design/` |
| Feel | A hand-written notebook on a desk: ruled paper, sticky notes, highlighter, doodles | A clean, quiet reference: grey paper, crisp type, precise diagrams, 3D scenes |
| Voice | Friendly and step by step. One idea at a time, lots of "try this" | Dense and exact. Numbers, trade-offs, failure modes, interview framing |
| Fonts | System handwriting only, so it works offline: `--hand` (Noteworthy, Bradley Hand, Segoe Print…), `--title` (Marker Felt, Chalkboard SE…), `--mono` (Courier New) | Google Fonts: Bricolage Grotesque (display), Instrument Sans (body), IBM Plex Mono (labels, code) |
| Base size | 19px body on a 30px ruled line (`--lh`) | 16px body, 1.6 line height, 760px reading column |

## Beginner: the notebook

**Tokens** (copy the `:root` block from `agentic-loop.html`; don't invent new colours):
`--desk #e9edf2` (dotted desk background), `--paper #fdfbf3`, `--rule #c9dcef` (ruled lines), `--margin #e8a0a0` (red margin line), `--ink #1f3a93` (headings, strokes), `--pencil #555` (muted), `--red #c0392b`, `--green #1e8449`, `--hl #ffe066` (highlighter), stickies `--sticky #fff59d`, `--pink #ffd1dc`, `--blue #cdeafe`, `--mint #c8f0d8`, `--tan #fbe6a2`.

**Layout**: one `.page` sheet (max 1040px) with punched holes and a margin line, text sitting on the ruled lines. `h2` gets a tilted highlighter stroke behind it. Parts are introduced with a red uppercase `.part` label.

**Components**
- `.sticky` (and `.pink` / `.blue` / `.mint`): key takeaways, slightly rotated, with a tape strip.
- `.box`: hand-drawn bordered aside (the wobbly `border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px`).
- `svg.doodle`: diagrams drawn as if by hand: round line caps, `--ink` strokes, `--tan` fills, handwriting labels.
- Buttons share the wobbly border and turn highlighter-yellow on hover. Focus is a dashed red outline.
- `.out` (`.good` / `.bad`): lab output panels. `table.hand`: dashed rows.
- `.cards` quiz: sticky-note cards with option buttons, right/wrong colouring, and a `.why` reveal. Every concept page ends with one.
- Progress lives on the roadmap (`index.html`) in `localStorage`.

**Don't**: load web fonts, use 3D scenes, use the grey palette, or write long tables of numbers. If a section needs that depth, it belongs in `system-design/` with a link from the concept page.

## Advanced: the field manual

**Tokens** (copy the `:root` block from `system-design/index.html`):
`--bg #e9ecef`, `--paper #f7f8f9`, `--ink #1c2530`, `--muted #586473`, `--line #cdd4dc`, `--line-strong #9aa5b1`, `--accent #4255d4`, `--code-bg #eef1f4`, `--wire #7d8996`. Diagram layer colours are semantic and fixed across every page: ingest `#2a9d8f`, knowledge base `#4d5fd8`, serving `#d7932a`, model `#e2674f`, governance `#b2456e`, cross-cutting `#4a5562`, dead-letter/error `#b23a3a`, ok `#2f8f5b`, each with a pale `--t-*` tint for fills.

**Layout**: slim `.sitebar` on top, then either a card grid (hubs), or `.doc`: a sticky numbered `.toc` rail (220px) beside a 760px `article`. Sections are separated by hairlines, not decoration. Mono uppercase `.eyebrow` / `.k` labels sit above titles.

**Components**
- `.fig` with an inline `svg.dg` diagram using the semantic layer classes (`.k-ingest`, `.k-kb`, `.k-serve`…), or a `.fig3d` scene built with `assets/scene3d.js` (three@0.160.0 importmap).
- `.note` (accent left border), `.formula` (mono, boxed), `.table` wrappers for wide tables, `.related` pill links, `.pager` prev/next.
- `.lab` blocks for interactive calculators, in the same quiet styling.
- Progress lives on `system-design/roadmap.html` (with a summary card on the home page), stored in the `asd_roadmap` cookie by `system-design/progress.js`. Every page in `system-design/` loads that script.

**Don't**: use handwriting fonts, rotated stickies, highlighter strokes or paper textures. Don't recolour the layer palette; a reader learns "orange is serving" once and relies on it everywhere.

## Crossing between the two
- Link across freely, but don't borrow components. A concept page links "go deeper" to a system-design topic; a system-design page links "new to this?" back to a concept page.
- `classic-system-design/` is foundational content but uses the advanced style, because it sits beside the designs and shares their diagram language.

## Checklist for a new page
1. Pick the section first; the section decides the style.
2. Copy the `:root` tokens and base CSS from an existing page in that section (`agentic-loop.html` or `system-design/chunking.html`), not from memory.
3. Beginner: end with a sticky-note quiz and add the page to the roadmap in `index.html`. Advanced: add `<script src="progress.js"></script>` before `</body>`, a card on `system-design/designs.html` or `topics.html`, and a node in the `STAGES` lists of `roadmap.html` and the home page progress card. Keep the shared site header (Home, Designs, Topics, Roadmap, Classic, Glossary, Beginner notebook) identical on every page.
4. Check it at 390px wide: no horizontal scroll, 16px side gutter.
5. Run `python3 .claude/skills/notebook-standards/check.py` and fix every failure. Before adding a page at all, see `.claude/skills/notebook-standards/SKILL.md`: new content extends an existing page by default.
