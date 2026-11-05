# Style: the field manual

This repo holds the advanced agentic system design pages (`system-design/`) and, until it moves to DevLCodes/classic-system-designs, `classic-system-design/`. Every page uses one look: a clean, quiet reference with grey paper, crisp type, precise diagrams and 3D scenes. The voice is dense and exact, with numbers, trade-offs, failure modes and interview framing. Fonts are Bricolage Grotesque (display), Instrument Sans (body) and IBM Plex Mono (labels, code); body text is 16px at 1.6 line height in a 760px reading column.

The beginner concept notebooks moved to DevLCodes/agentic-ai-beginner, which has its own notebook style. The root `*.html` files here are only redirect stubs.

## Details

**Tokens** (copy the `:root` block from `system-design/index.html`):
`--bg #e9ecef`, `--paper #f7f8f9`, `--ink #1c2530`, `--muted #586473`, `--line #cdd4dc`, `--line-strong #9aa5b1`, `--accent #4255d4`, `--code-bg #eef1f4`, `--wire #7d8996`. Diagram layer colours are semantic and fixed across every page: ingest `#2a9d8f`, knowledge base `#4d5fd8`, serving `#d7932a`, model `#e2674f`, governance `#b2456e`, cross-cutting `#4a5562`, dead-letter/error `#b23a3a`, ok `#2f8f5b`, each with a pale `--t-*` tint for fills.

**Layout**: slim `.sitebar` on top, then either a card grid (hubs), or `.doc`: a sticky numbered `.toc` rail (220px) beside a 760px `article`. Sections are separated by hairlines, not decoration. Mono uppercase `.eyebrow` / `.k` labels sit above titles.

**Components**
- `.fig` with an inline `svg.dg` diagram using the semantic layer classes (`.k-ingest`, `.k-kb`, `.k-serve`…), or a `.fig3d` scene built with `assets/scene3d.js` (three@0.160.0 importmap).
- `.note` (accent left border), `.formula` (mono, boxed), `.table` wrappers for wide tables, `.related` pill links, `.pager` prev/next.
- `.lab` blocks for interactive calculators, in the same quiet styling.
- Progress lives on `system-design/roadmap.html` (with a summary card on the home page), stored in the `asd_roadmap` cookie by `system-design/progress.js`. Every page in `system-design/` loads that script.

**Don't**: use handwriting fonts, rotated stickies, highlighter strokes or paper textures. Don't recolour the layer palette; a reader learns "orange is serving" once and relies on it everywhere.

## Checklist for a new page
1. Copy the `:root` tokens and base CSS from an existing page (`system-design/chunking.html`), not from memory.
2. Add `<script src="progress.js"></script>` before `</body>`, a card on `system-design/designs.html` or `topics.html`, and a node in the `STAGES` lists of `roadmap.html` and the home page progress card. Keep the shared site header (Home, Designs, Topics, Roadmap, Classic, Glossary) identical on every page.
3. Check it at 390px wide: no horizontal scroll, 16px side gutter.
4. Run `python3 .claude/skills/notebook-standards/check.py` and fix every failure. Before adding a page at all, see `.claude/skills/notebook-standards/SKILL.md`: new content extends an existing page by default.
