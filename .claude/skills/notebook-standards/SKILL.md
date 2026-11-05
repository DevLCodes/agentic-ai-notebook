---
name: notebook-standards
description: Standards for any change to the Agentic AI notebook site. Use before adding or editing content, adding a topic, glossary term, quiz question or diagram, and before committing or opening a PR in this repo. Decides where new content goes (extend an existing page by default), applies docs/STYLES.md, and runs check.py.
---

# Notebook standards

The style rules live in `docs/STYLES.md`; read it first. This skill adds where content goes, and a check you run before every commit.

## 1. Put the content in an existing page

New content extends a page that already covers the subject. A new page needs the owner's explicit agreement, because each one adds hub cards, roadmap entries, progress counts and a quiz to keep in sync.

Find the home before writing:

```bash
grep -ril "<subject words>" --include=*.html .
```

Design content goes in `system-design/`, in the field-manual style of the [live System Design home](https://devlcodes.github.io/agentic-ai-notebook/system-design/index.html). Beginner material does not go here: it lives in DevLCodes/agentic-ai-beginner, and the root `*.html` files are only redirect stubs to it.

| Content | Usually goes in |
|---|---|
| A design concept, mechanism or trade-off | The `system-design/` topic page on that subject, as a new `h3` inside the right `section`, with a matching `.toc` entry if you add a `section` |
| Interview depth | `system-design/fluency.html` as a `details.qa` in the right section, ending with a `.say` line and a deep-dive link |
| Numbers: tokens, cost, latency, GPU memory and serving | `system-design/numbers.html` |
| A term | `system-design/glossary.html`, in alphabetical order under its letter, linking to where it's explained |
| Product names | The page's "In the real world" table |
| A check on understanding | A new entry in that notebook's quiz array `Q` |

If nothing fits, ask the owner before you create a page. When a page is agreed, follow the new-page checklist in `docs/STYLES.md` and run the check with `--allow-new-page`.

## 2. Match the section's style

- **`system-design/` and `classic-system-design/` (the default):** dense and exact. Use `.note`, `.formula`, `.table`, `.related` and `svg.dg` with the fixed layer colours. No handwriting fonts or stickies.
- Copy markup from a neighbouring element on the same page rather than writing new CSS.
- Give any section you link to an `id`.

## 3. Keep the wiring in sync

When you add or remove a term, a page or a quiz question, update every place that counts or lists it:

- The glossary lead ("N terms used…") and the home card ("Browse N terms")
- `STAGES` in `system-design/roadmap.html` and in the home page script, plus "/ N pages done"
- The cards in `system-design/topics.html` or `designs.html`

## 4. Run the check

```bash
python3 .claude/skills/notebook-standards/check.py
```

It checks the following:
- Style tokens, fonts and the shared header for each section
- That every relative link and `#anchor` resolves
- That `progress.js` is loaded and each page appears in `STAGES` and on the hubs
- Glossary order, duplicates and counts
- That notebooks have quizzes
- That no new page was added since `main`

A failure in a file you changed blocks the commit. Problems in files you didn't touch are listed as `EXISTING`. Mention them in the PR, but don't fix them unasked. Use `--all` to make those fail too.

## 5. Look at it

The script can't see layout. Serve the site, open each changed page and check two things:
- At desktop width and at 390 px, nothing scrolls sideways and nothing is cut off.
- Diagrams don't overlap and formulas fit.

```bash
python3 -m http.server 8765
```

## 6. Commit and PR

Work on a branch, open a PR into `main` and say which existing pages changed. Paste the check's summary line into the PR description.

## Gotchas

- Glossary entries are one long line of HTML. Edit them with a script or an exact match, never with line-based tools.
- Quiz answer order is shuffled by a formula in the page script. Write each question with its correct index as listed; the shuffle handles display.
- `check.py` runs on the system `python3`, which may be 3.9. Keep it to the standard library with `from __future__ import annotations`.
