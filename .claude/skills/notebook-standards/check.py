#!/usr/bin/env python3
"""Check the Agentic AI notebook against docs/STYLES.md and the site's wiring.

Usage: python3 .claude/skills/notebook-standards/check.py [--base main] [--allow-new-page] [--all]
Problems in files changed since --base fail the run (exit 1). Problems in untouched files are
listed as EXISTING and don't fail it, unless --all is given. Standard library only.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[3]
SD = ROOT / "system-design"
CLASSIC = ROOT / "classic-system-design"
NAV = ["Home", "Designs", "Topics", "Roadmap", "Study", "Classic", "Glossary"]
ADVANCED_TOKENS = ["--bg: #e9ecef", "--paper: #f7f8f9", "--ink: #1c2530", "--accent: #4255d4",
                   "--c-serve: #d7932a", "--c-model: #e2674f", "--c-kb: #4d5fd8", "--c-ingest: #2a9d8f"]
BEGINNER_TOKENS = ["--paper: #fdfbf3", "--ink: #1f3a93", "--hl: #ffe066"]
SD_HUBS = {"index", "designs", "topics", "roadmap", "study"}

errors: list[tuple[str, str]] = []
warnings: list[str] = []


def fail(path: Path, message: str) -> None:
    errors.append((str(path.relative_to(ROOT)), message))


class Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.refs: list[str] = []
        self.nav: list[str] = []
        self._in_nav = 0
        self._in_a = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a" and a.get("name"):
            self.ids.add(a["name"])
        for key in ("href", "src"):
            if a.get(key) and tag in ("a", "script", "img", "link", "source"):
                self.refs.append(a[key])
        if tag == "nav" and a.get("aria-label") == "Site":
            self._in_nav += 1
        if tag == "a" and self._in_nav:
            self._in_a = True
            self.nav.append("")

    def handle_endtag(self, tag):
        if tag == "nav" and self._in_nav:
            self._in_nav -= 1
        if tag == "a":
            self._in_a = False

    def handle_data(self, data):
        if self._in_a and self._in_nav:
            self.nav[-1] += data.strip()


def parse(path: Path) -> Links:
    p = Links()
    p.feed(path.read_text(encoding="utf-8"))
    return p


def pages() -> list[Path]:
    # Root *.html files are redirect stubs to the beginner repo (DevLCodes/agentic-ai-beginner); not checked.
    return sorted(SD.glob("*.html")) + sorted(CLASSIC.glob("*.html"))


def check_style(path: Path, text: str) -> None:
    advanced = path.parent in (SD, CLASSIC)
    if advanced:
        missing = [t for t in ADVANCED_TOKENS if t not in text]
        if missing:
            fail(path, f"field-manual tokens missing or changed: {', '.join(missing)}")
        if "fonts.googleapis.com" not in text:
            fail(path, "field-manual pages load Bricolage Grotesque, Instrument Sans and IBM Plex Mono")
        if re.search(r"var\(--hand\)|class=\"sticky", text):
            fail(path, "handwriting font or sticky note on a field-manual page")
    else:
        missing = [t for t in BEGINNER_TOKENS if t not in text]
        if missing:
            fail(path, f"notebook tokens missing or changed: {', '.join(missing)}")
        if "fonts.googleapis.com" in text:
            fail(path, "notebook pages use system handwriting fonts only, no web fonts")


def check_nav(path: Path, links: Links) -> None:
    if path.parent in (SD, CLASSIC) and links.nav != NAV:
        fail(path, f"site header should be {NAV}, found {links.nav}")


def check_links(path: Path, links: Links, cache: dict[Path, Links]) -> None:
    for ref in links.refs:
        u = urlparse(ref)
        if u.scheme or ref.startswith(("//", "mailto:", "javascript:", "data:")) or "${" in ref:
            continue
        target = (path.parent / unquote(u.path)).resolve() if u.path else path
        if u.path.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            fail(path, f"broken link {ref}")
            continue
        if u.fragment and target.suffix == ".html":
            if target not in cache:
                cache[target] = parse(target)
            if u.fragment not in cache[target].ids:
                fail(path, f"link {ref} points at a missing #{u.fragment}")


def check_system_design() -> None:
    roadmap = (SD / "roadmap.html").read_text(encoding="utf-8")
    home = (SD / "index.html").read_text(encoding="utf-8")
    hubs = (SD / "topics.html").read_text(encoding="utf-8") + (SD / "designs.html").read_text(encoding="utf-8")
    on_roadmap = re.findall(r"\['([\w-]+)', '[^']*'\]", roadmap.split("var STAGES")[1].split("];")[0])
    home_stages = home.split("var STAGES")[1].split("];")[0]
    on_home = re.findall(r"'([\w-]+)'", home_stages)
    for page in SD.glob("*.html"):
        slug = page.stem
        text = page.read_text(encoding="utf-8")
        if '<script src="progress.js"></script>' not in text:
            fail(page, "system-design pages load progress.js before </body>")
        if slug in SD_HUBS:
            continue
        if slug not in on_roadmap:
            fail(page, "not in the STAGES list of roadmap.html")
        if slug not in on_home:
            fail(page, "not in the STAGES list of the home page progress card (index.html)")
        if f'href="{slug}.html"' not in hubs and slug != "glossary":
            fail(page, "no card on topics.html or designs.html")
        if slug.endswith("-architecture") and "Topic · " not in text:
            fail(page, "vendor architecture pages use the eyebrow 'Topic · <Vendor>'")
    topics = (SD / "topics.html").read_text(encoding="utf-8")
    for gid, label, n in re.findall(r'<a href="#([\w-]+)">([^<]+)<small>(\d+)</small></a>', topics):
        m = re.search(rf'id="{gid}">.*?<ul class="grid">(.*?)</ul>', topics, re.S)
        if m and len(re.findall(r'class="card"', m.group(1))) != int(n):
            fail(SD / "topics.html", f"group chip '{label}' says {n}, the group has {len(re.findall('class=.card.', m.group(1)))} cards")
    total = len(on_roadmap)
    m = re.search(r"/ (\d+) pages done", home)
    if m and int(m.group(1)) != total:
        fail(SD / "index.html", f"progress card says {m.group(1)} pages, roadmap has {total}")
    if sorted(on_roadmap) != sorted(on_home):
        fail(SD / "index.html", "home STAGES and roadmap STAGES list different pages")


NVIDIA_TERMS = re.compile(r"\b(NVIDIA|NIM|Triton|TensorRT(?:-LLM)?|CUDA|NeMo|H100|H200|A100|L40S|B200)\b")


def check_vendor_placement() -> None:
    """NVIDIA products belong on nvidia-architecture.html; neutral topics name them only in
    their "In the real world" and "Related" sections."""
    topics = re.findall(r'href="([\w-]+)\.html"', (SD / "topics.html").read_text(encoding="utf-8"))
    for slug in set(topics):
        page = SD / f"{slug}.html"
        if slug.endswith("-architecture") or slug in SD_HUBS | {"glossary", "fluency", "numbers"} or not page.exists():
            continue
        text = page.read_text(encoding="utf-8")
        body = text[text.find("<main>"):]
        body = re.sub(r'<section id="(real-world|related)">.*?</section>', "", body, flags=re.S)
        body = re.sub(r"<[^>]+>", " ", body)
        found = sorted(set(NVIDIA_TERMS.findall(body)))
        if found:
            fail(page, f"NVIDIA terms outside 'In the real world': {', '.join(found)}; move them to nvidia-architecture.html")


DECK_KEYS = {"title", "page", "cards", "quiz"}


def check_decks() -> None:
    """Every system-design/decks/<slug>.json follows the shared deck format (docs/STYLES.md)."""
    import json
    deck_dir = SD / "decks"
    files = sorted(p.stem for p in deck_dir.glob("*.json") if p.name != "index.json")
    manifest = deck_dir / "index.json"
    if files or manifest.exists():
        try:
            listed = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            listed = None
        if not isinstance(listed, list) or sorted(listed) != files or len(set(listed)) != len(listed):
            fail(manifest, f"must be a JSON list of every deck slug in decks/, exactly: {json.dumps(files)}")
    for path in sorted(p for p in deck_dir.glob("*.json") if p.name != "index.json"):
        try:
            deck = json.loads(path.read_text(encoding="utf-8"))
        except ValueError as e:
            fail(path, f"not valid JSON: {e}")
            continue
        if not isinstance(deck, dict) or set(deck) != DECK_KEYS:
            fail(path, f"deck keys must be exactly {sorted(DECK_KEYS)}")
            continue
        slug = path.stem
        if deck["page"] != f"{slug}.html":
            fail(path, f'"page" should be "{slug}.html"')
        if not (SD / f"{slug}.html").exists():
            fail(path, f"no topic page system-design/{slug}.html")
        if not isinstance(deck["title"], str) or not deck["title"].strip():
            fail(path, '"title" must be a non-empty string')
        cards, quiz = deck["cards"], deck["quiz"]
        if not isinstance(cards, list) or not 8 <= len(cards) <= 12:
            fail(path, "needs 8 to 12 cards")
            cards = cards if isinstance(cards, list) else []
        if not isinstance(quiz, list) or not 5 <= len(quiz) <= 8:
            fail(path, "needs 5 to 8 quiz questions")
            quiz = quiz if isinstance(quiz, list) else []
        links = []
        fronts = []
        for n, c in enumerate(cards, 1):
            if not isinstance(c, dict) or set(c) != {"front", "back", "link"} or not all(isinstance(c[k], str) and c[k].strip() for k in c):
                fail(path, f"card {n} needs non-empty front, back and link only")
                continue
            fronts.append(c["front"])
            links.append((f"card {n}", c["link"]))
        for dup in {f for f in fronts if fronts.count(f) > 1}:
            fail(path, f"card front used twice: {dup}")
        for n, q in enumerate(quiz, 1):
            if not isinstance(q, dict) or set(q) != {"q", "choices", "answer", "why", "link"}:
                fail(path, f"question {n} needs exactly q, choices, answer, why and link")
                continue
            ch = q["choices"]
            if not isinstance(ch, list) or len(ch) != 4 or not all(isinstance(x, str) and x.strip() for x in ch) or len(set(ch)) != 4:
                fail(path, f"question {n} needs 4 different non-empty choices")
            elif not isinstance(q["answer"], int) or isinstance(q["answer"], bool) or not 0 <= q["answer"] < len(ch):
                fail(path, f"question {n} answer index {q['answer']!r} is out of range")
            if not all(isinstance(q[k], str) and q[k].strip() for k in ("q", "why", "link")):
                fail(path, f"question {n} needs non-empty q, why and link")
                continue
            links.append((f"question {n}", q["link"]))
        for where, link in links:
            page, _, frag = link.partition("#")
            target = SD / page
            if not page.endswith(".html") or "/" in page or not target.exists():
                fail(path, f"{where} link {link} is not a system-design page")
            elif not frag:
                fail(path, f"{where} link {link} needs a #section id")
            elif frag not in parse(target).ids:
                fail(path, f"{where} link {link} points at a missing #{frag}")


def check_glossary() -> None:
    path = SD / "glossary.html"
    text = path.read_text(encoding="utf-8")
    items = re.findall(r'<dl class="gl-item" id="([^"]+)"[^>]*><dt>([^<]+)', text)
    ids = [i for i, _ in items]
    for dup in {i for i in ids if ids.count(i) > 1}:
        fail(path, f"term id {dup} used more than once")
    for block in re.split(r'<h2 class="gl-letter"', text)[1:]:
        letter = re.match(r' id="letter-(\w)"', block).group(1)
        names = [n.strip() for n in re.findall(r'<dl class="gl-item"[^>]*><dt>([^<]+)', block)]
        if names != sorted(names, key=str.lower):
            fail(path, f"terms under {letter} are not in alphabetical order")
        for n in names:
            if n[0].upper() != letter:
                fail(path, f"{n} sits under letter {letter}")
    count = len(items)
    for file, pattern in ((path, r"(\d+) terms used"), (SD / "index.html", r"Browse (\d+) terms")):
        m = re.search(pattern, file.read_text(encoding="utf-8"))
        if m and int(m.group(1)) != count:
            fail(file, f"says {m.group(1)} terms, glossary has {count}")


def check_beginner(path: Path, text: str) -> None:
    if path.name == "index.html":
        return
    if 'id="quiz"' not in text:
        fail(path, "notebook pages end with a sticky-note quiz")
    if f'href="{path.name}"' not in (ROOT / "index.html").read_text(encoding="utf-8"):
        fail(path, "not on the roadmap in index.html")


def check_new_pages(base: str, allow: bool) -> None:
    try:
        out = subprocess.run(["git", "diff", "--name-only", "--diff-filter=A", base],
                             cwd=ROOT, capture_output=True, text=True, check=True).stdout
        out += subprocess.run(["git", "ls-files", "--others", "--exclude-standard"],
                              cwd=ROOT, capture_output=True, text=True, check=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        warnings.append(f"couldn't compare with {base}; new-page check skipped")
        return
    new = sorted({f for f in out.split() if f.endswith(".html")})
    for f in new:
        message = (f"{f} is a new page. Allowed only for a new <vendor>-architecture topic or a new vendor-neutral "
                   "topic (SKILL.md section 1); rerun with --allow-new-page once it follows those rules")
        if allow:
            warnings.append(message)
        else:
            errors.append((f, message))


def changed_files(base: str) -> set[str] | None:
    try:
        diff = subprocess.run(["git", "diff", "--name-only", base], cwd=ROOT,
                              capture_output=True, text=True, check=True).stdout
        new = subprocess.run(["git", "ls-files", "--others", "--exclude-standard"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return set(diff.split()) | set(new.split())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="main", help="branch to compare against for new pages")
    ap.add_argument("--allow-new-page", action="store_true", help="the owner agreed to a new page")
    ap.add_argument("--all", action="store_true", help="fail on problems in untouched files too")
    args = ap.parse_args()

    cache: dict[Path, Links] = {}
    for path in pages():
        text = path.read_text(encoding="utf-8")
        links = cache.setdefault(path.resolve(), parse(path))
        check_style(path, text)
        check_nav(path, links)
        check_links(path, links, cache)
        if path.parent == ROOT:
            check_beginner(path, text)
    check_system_design()
    check_vendor_placement()
    check_glossary()
    check_decks()
    check_new_pages(args.base, args.allow_new_page)

    changed = None if args.all else changed_files(args.base)
    failures = [e for e in errors if changed is None or e[0] in changed]
    existing = [e for e in errors if e not in failures]
    for w in warnings:
        print(f"WARN      {w}")
    for f, m in existing:
        print(f"EXISTING  {f}: {m}")
    for f, m in failures:
        print(f"FAIL      {f}: {m}")
    print(f"{len(pages())} pages checked: {len(failures)} failures, {len(existing)} existing, {len(warnings)} warnings")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
