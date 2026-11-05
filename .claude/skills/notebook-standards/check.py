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
NAV = ["Home", "Designs", "Topics", "Roadmap", "Classic", "Glossary"]
ADVANCED_TOKENS = ["--bg: #e9ecef", "--paper: #f7f8f9", "--ink: #1c2530", "--accent: #4255d4",
                   "--c-serve: #d7932a", "--c-model: #e2674f", "--c-kb: #4d5fd8", "--c-ingest: #2a9d8f"]
BEGINNER_TOKENS = ["--paper: #fdfbf3", "--ink: #1f3a93", "--hl: #ffe066"]
SD_HUBS = {"index", "designs", "topics", "roadmap"}

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
    total = len(on_roadmap)
    m = re.search(r"/ (\d+) pages done", home)
    if m and int(m.group(1)) != total:
        fail(SD / "index.html", f"progress card says {m.group(1)} pages, roadmap has {total}")
    if sorted(on_roadmap) != sorted(on_home):
        fail(SD / "index.html", "home STAGES and roadmap STAGES list different pages")


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
        message = f"{f} is a new page. Extend an existing page instead, unless the owner agreed to a new one"
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
    check_glossary()
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
