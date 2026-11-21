---
name: notebook-standards
description: Standards for any change to the Agentic AI notebook site. Use before adding or editing content, adding a topic, glossary term, quiz question or diagram, and before committing or opening a PR in this repo. Decides where content goes (vendor-specific concepts in a <vendor>-architecture topic, vendor-neutral concepts in their own topic, never in numbers, fluency, glossary or design pages), applies docs/STYLES.md, and runs check.py.
---

# Notebook standards

The style rules live in `docs/STYLES.md`; read it first. This skill adds where content goes, and a check you run before every commit.

## 1. Decide where the content goes

All content goes in `system-design/`, in the field-manual style of the [live System Design home](https://devlcodes.github.io/agentic-ai-notebook/system-design/index.html). Beginner material doesn't go here: it lives in DevLCodes/agentic-ai-beginner, and the root `*.html` files are only redirect stubs to it. Non-agentic building blocks and walkthroughs don't go here either: they live in DevLCodes/classic-system-designs (its own repo and style), and `classic-system-design/*.html` are only redirect stubs to it.

Sort every concept with these rules, in order. Stop at the first rule that matches.

1. **Vendor-specific concept** (a product, service or feature of one company, such as NIM, Triton, TensorRT-LLM, CUDA, NeMo, GPU generations; or Bedrock, Vertex AI, Azure AI Foundry): put it in that vendor's architecture topic, `system-design/<vendor>-architecture.html`. NVIDIA content goes in `nvidia-architecture.html`. If the vendor has no page yet, create one, named this way and with an eyebrow of `Topic · <Vendor>`.
2. **Vendor-neutral concept with an existing topic** (such as KV cache, batching or quantization in `llm-serving.html`; reranking in `reranking.html`): add it to that topic as an `h3` in the right `section`, or as a new `section` with a `.toc` entry.
3. **Vendor-neutral concept with no topic yet:** first ask whether it is part of a broader existing topic. Checkpointing an agent's state is part of agent memory, so it belongs in `agent-memory.html`, not a page of its own. Create a separate topic page only when the concept is a subject in its own right that no existing topic contains. Don't put it in a page about an unrelated subject.
4. **Interview phrasing of a concept already covered:** add a `details.qa` to `system-design/fluency.html`, with a deep-dive link to the topic page.
5. **Every new term:** add it to `system-design/glossary.html` and link it to the topic page that explains it.
6. **A concept that outgrows its section:** when the owner asks for a concept on its own page, or a subject in its own right needs an interactive lab or more than one screen of explanation, give it its own vendor-neutral topic (as `quantization.html` and `batching.html` were split from `llm-serving.html`). Leave a two or three sentence summary in the parent section that ends with a link to the new page, so the idea is explained in one place only. A lab alone is not a reason for a new page: a sub-part of a topic keeps its lab inside that topic, as the restart scene sits in `agent-memory.html#durable`.

Never put new concepts in these pages:

- **`numbers.html`** holds figures and estimates (tokens, prices, latency) only. Link to it for figures; explain concepts on topic pages.
- **`fluency.html`** holds interview Q&A only. Explain the concept on a topic page first.
- **`glossary.html`** holds one-line definitions only.
- **A design walkthrough** (such as `finsight.html`) holds one system end to end. It links to topics; it doesn't teach them.

A vendor page may mention neutral ideas in one line, with a link to the neutral topic. A neutral topic may name vendor products only in its "In the real world" table, with a link to the vendor page.

Find existing coverage before writing:

```bash
grep -ril "<subject words>" --include=*.html system-design
```

When rules 1 or 3 create a page, follow the new-page checklist in `docs/STYLES.md`. Then run the check with `--allow-new-page`, and say in the PR which rule created the page.

Product names go in the page's "In the real world" table.

## 2. Match the section's style

- **`system-design/`:** dense and exact. Use `.note`, `.formula`, `.table`, `.related` and `svg.dg` with the fixed layer colours. No handwriting fonts or stickies.
- **Explain before you list.** Open each topic with the intuition: one picture, analogy or worked example a newcomer can follow. Then explain how it works, then give numbers, tables and trade-offs. Define every term the first time it appears. A reader who knows software but not this topic should understand the first section without reading anything else.
- **Make it interactive when the idea is a trade-off.** If the concept is about a knob and its effect, such as bits against error or batching mode against latency, add a `.lab` that lets the reader turn the knob. Build it in plain JavaScript inside the page, with `.lab`, `.lab-row`, `.seg` buttons and a `.lab-out` result line, copied from an existing lab such as `chunking.html`.
- **Prefer 3D for mechanisms people must remember.** Lifecycles, data flowing between machines, memory filling and overflowing, and things sharing hardware read best as a Three.js scene: put a `<figure class="fig3d">` with `.stage3d`, `.ctl3` buttons and an `.out3` result line on the page, and add a `mount…` function to `assets/gpu3d.js` (or a sibling module) that animates the change when a control is pressed. Keep a one-line text result so the idea survives without WebGL.
- Copy markup from a neighbouring element on the same page rather than writing new CSS.
- Give any section you link to an `id`.

## 3. Keep the wiring in sync

When you add or remove a term or a page, update every place that counts or lists it:

- The glossary lead ("N terms used…") and the home card ("Browse N terms")
- `STAGES` in `system-design/roadmap.html` and in the home page script, plus "/ N pages done"
- The cards in `system-design/topics.html` or `designs.html`, and the group chip count at the top of `topics.html`
- The shared header (Home, Designs, Topics, Roadmap, Study, Classic, Glossary) on every page in `system-design/`

## 3a. Study decks (flashcards and quiz)

A topic's flashcards and quiz live in `system-design/decks/<page-slug>.json`, rendered by `system-design/study.js` on the hub `system-design/study.html`. The format and engine are documented in `docs/STYLES.md` under "Study decks"; don't change the format.

To add a deck:
1. Read the topic page and write 8 to 12 cards and 5 to 8 questions from what it says, each with a `link` to the section that explains it. Wrong choices should be plausible.
2. Add the slug to `system-design/decks/index.json`.
3. Run the check (it validates the schema, answer indexes, links and the index list), then open `study.html#<slug>/cards` and `study.html#<slug>/quiz` on the local server.

Deck-only changes need no hub, roadmap or STAGES edits: the hub picks up the topic from `topics.html`.

## 4. Run the check

```bash
python3 .claude/skills/notebook-standards/check.py
```

It checks the following:
- Style tokens, fonts and the shared header for each section
- That every relative link and `#anchor` resolves
- That `progress.js` is loaded and each page appears in `STAGES` and on the hubs
- Glossary order, duplicates and counts
- Topic group chip counts
- Every study deck in `system-design/decks/` (schema, answer index in range, links resolve) and that `decks/index.json` lists exactly those decks
- That NVIDIA product names on topic pages appear only in "In the real world" and "Related"; elsewhere they belong on `nvidia-architecture.html`
- That no new page was added since `main` without `--allow-new-page`

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
- `check.py` runs on the system `python3`, which may be 3.9. Keep it to the standard library with `from __future__ import annotations`.
