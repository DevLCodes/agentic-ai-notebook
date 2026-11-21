/* Study engine: renders any deck (system-design/decks/<slug>.json) as flashcards or a quiz.
   No dependencies. Deck format is documented in docs/STYLES.md.

   Usage:
     StudyEngine.load('decks/embeddings.json').then(function (deck) {
       StudyEngine.mount(document.getElementById('study'), deck, 'cards' | 'quiz');
     });
   Options: mount(el, deck, mode, { base, scoped, onFinish(right, total) }); scoped limits
   keys to when the block has focus or is on screen, onFinish runs when a quiz ends.
   mount() returns { destroy() }. Only one deck is mounted at a time per page. */
(function () {
  'use strict';

  var CSS = [
    '.st { display: grid; gap: 16px; }',
    '.st-head { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: baseline; justify-content: space-between; }',
    '.st-head h2 { margin: 0; }',
    '.st-meta { font-family: var(--font-mono); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }',
    '.st-bar { height: 4px; border-radius: 999px; background: var(--track); overflow: hidden; }',
    '.st-bar i { display: block; height: 100%; width: 0; background: var(--accent); transition: width .2s; }',
    '.st-card { position: relative; min-height: 240px; display: grid; align-content: center; gap: 10px; padding: 28px 24px; background: var(--paper); border: 1px solid var(--line); border-radius: 16px; cursor: pointer; text-align: center; }',
    '.st-card:hover { border-color: var(--line-strong); }',
    '.st-card:focus-visible, .st button:focus-visible, .st a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }',
    '.st-card .st-side { font-family: var(--font-mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }',
    '.st-card .st-front { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: clamp(22px, 4vw, 30px); line-height: 1.2; text-wrap: balance; overflow-wrap: anywhere; }',
    '.st-card .st-answer { margin: 0 auto; max-width: 36em; font-size: 17px; overflow-wrap: anywhere; }',
    '.st-card.is-back { background: #fff; border-color: var(--accent); }',
    '.st-card.is-known::after { content: "Known"; position: absolute; top: 12px; right: 14px; font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--c-ok); }',
    '.st-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }',
    '.st-row.spread { justify-content: space-between; }',
    '.st button { font: 600 14px var(--font-body); color: var(--ink); background: #fff; border: 1px solid var(--line); border-radius: 9px; padding: 8px 14px; cursor: pointer; }',
    '.st button:hover { border-color: var(--ink); }',
    '.st button:disabled { opacity: .45; cursor: default; border-color: var(--line); }',
    '.st button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }',
    '.st button[aria-pressed="true"] { background: var(--t-serve); border-color: var(--c-serve); }',
    '.st-hint { margin: 0; font-size: 13.5px; color: var(--muted); }',
    '.st-hint kbd { font-family: var(--font-mono); font-size: 12px; padding: 1px 6px; border: 1px solid var(--line-strong); border-bottom-width: 2px; border-radius: 5px; background: #fff; }',
    '.st label { display: inline-flex; gap: 6px; align-items: center; font-size: 14px; }',
    '.st input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--accent); }',
    '.st-q { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 21px; line-height: 1.3; overflow-wrap: anywhere; }',
    '.st-choices { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }',
    '.st .st-choice { width: 100%; text-align: left; font-weight: 500; font-size: 15.5px; padding: 12px 14px; display: flex; gap: 10px; align-items: baseline; overflow-wrap: anywhere; }',
    '.st .st-choice b { font-family: var(--font-mono); font-size: 12px; color: var(--muted); flex: none; }',
    '.st .st-choice.right { background: #e3f3ea; border-color: var(--c-ok); }',
    '.st .st-choice.wrong { background: var(--t-dlq); border-color: var(--c-dlq); }',
    '.st .st-choice:disabled { opacity: 1; cursor: default; }',
    '.st-why { border-left: 3px solid var(--accent); background: var(--paper); padding: 12px 16px; border-radius: 0 10px 10px 0; }',
    '.st-why.ok { border-left-color: var(--c-ok); }',
    '.st-why.bad { border-left-color: var(--c-dlq); }',
    '.st-why p { margin: 0 0 6px; }',
    '.st-why p:last-child { margin: 0; }',
    '.st-score { font-family: var(--font-display); font-weight: 700; font-size: 44px; line-height: 1; margin: 0; }',
    '.st-missed { margin: 0; padding-left: 20px; display: grid; gap: 6px; }',
    '@media (prefers-reduced-motion: reduce) { .st-bar i { transition: none; } }'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('study-engine-css')) return;
    var s = document.createElement('style');
    s.id = 'study-engine-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  // Known cards live in localStorage, keyed by deck page and card front. Storage may be blocked.
  function storeKey(deck) { return 'study_known:' + deck.page; }
  function readKnown(deck) {
    try { var v = JSON.parse(localStorage.getItem(storeKey(deck)) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeKnown(deck, list) {
    try { localStorage.setItem(storeKey(deck), JSON.stringify(list)); } catch (e) { /* not saved */ }
  }

  function typingTarget(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function sectionLink(href, base) {
    return el('a', { href: (base || '') + href, text: 'Read the section →' });
  }

  var current = null;

  function mount(root, deck, mode, opts) {
    injectCss();
    if (current) current.destroy();
    opts = opts || {};
    root.innerHTML = '';
    var box = el('div', { class: 'st' });
    root.appendChild(box);
    var keyHandler = null;
    var upHandler = null;

    function onKeys(down) {
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      if (upHandler) document.removeEventListener('keyup', upHandler);
      keyHandler = function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey || typingTarget(e.target)) return;
        if (!document.body.contains(box)) return;
        // Embedded on a content page, keys only act while the block has focus or is on screen.
        if (opts.scoped && !root.contains(document.activeElement) && !inView(box)) return;
        down(e);
      };
      // A handled Space on a focused button would also "click" it on keyup; stop that.
      upHandler = function (e) {
        if ((e.key === ' ' || e.key === 'Spacebar') && e.target && e.target.tagName === 'BUTTON' && box.contains(e.target) && e.target.dataset.space !== 'native') e.preventDefault();
      };
      document.addEventListener('keydown', keyHandler);
      document.addEventListener('keyup', upHandler);
    }

    function inView(n) {
      var r = n.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
    }

    function header(sub) {
      return el('div', { class: 'st-head' }, [
        el('h2', { text: deck.title }),
        el('span', { class: 'st-meta', text: sub })
      ]);
    }

    /* ---------- Flashcards ---------- */
    function cards() {
      var known = readKnown(deck);
      var order = range(deck.cards.length);
      var pos = 0;
      var back = false;
      var skipKnown = false;

      var meta = el('span', { class: 'st-meta' });
      var bar = el('i');
      var side = el('span', { class: 'st-side' });
      var front = el('p', { class: 'st-front' });
      var backText = el('p', { class: 'st-answer' });
      var link = el('p', { class: 'st-link' });
      var card = el('div', { class: 'st-card', role: 'button', tabindex: '0', 'aria-live': 'polite', onclick: flip });
      card.appendChild(side); card.appendChild(front); card.appendChild(backText);
      var prev = el('button', { type: 'button', text: '← Previous', onclick: function () { move(-1); } });
      var next = el('button', { type: 'button', class: 'primary', text: 'Next →', onclick: function () { move(1); } });
      var knownBtn = el('button', { type: 'button', 'aria-pressed': 'false', onclick: toggleKnown });
      var shuffleBtn = el('button', { type: 'button', text: 'Shuffle', onclick: function () { order = shuffle(order); pos = 0; back = false; draw(); } });
      var skip = el('input', { type: 'checkbox', onchange: function () { skipKnown = skip.checked; pos = 0; back = false; draw(); } });

      function visible() {
        if (!skipKnown) return order;
        var v = order.filter(function (i) { return known.indexOf(deck.cards[i].front) < 0; });
        return v;
      }

      function draw() {
        var v = visible();
        var done = known.filter(function (f) { return deck.cards.some(function (c) { return c.front === f; }); }).length;
        meta.textContent = done + ' of ' + deck.cards.length + ' known';
        if (!v.length) {
          side.textContent = 'All done';
          front.textContent = 'Every card is marked known.';
          backText.textContent = 'Untick "Skip known cards" to go through them again.';
          backText.hidden = false;
          link.innerHTML = '';
          card.className = 'st-card';
          prev.disabled = next.disabled = knownBtn.disabled = true;
          bar.style.width = '100%';
          return;
        }
        if (pos >= v.length) pos = v.length - 1;
        var c = deck.cards[v[pos]];
        var isKnown = known.indexOf(c.front) >= 0;
        side.textContent = (back ? 'Answer' : 'Card') + ' ' + (pos + 1) + ' / ' + v.length;
        front.textContent = c.front;
        backText.textContent = c.back;
        backText.hidden = !back;
        card.setAttribute('aria-label', back ? c.front + '. ' + c.back : c.front + '. Press Space to flip.');
        card.className = 'st-card' + (back ? ' is-back' : '') + (isKnown ? ' is-known' : '');
        link.innerHTML = '';
        if (back && c.link) link.appendChild(sectionLink(c.link, opts.base));
        prev.disabled = pos === 0;
        next.disabled = pos === v.length - 1;
        knownBtn.disabled = false;
        knownBtn.setAttribute('aria-pressed', String(isKnown));
        knownBtn.textContent = isKnown ? '✓ Known' : 'Mark as known';
        bar.style.width = ((pos + 1) / v.length * 100) + '%';
      }

      function flip() { if (visible().length) { back = !back; draw(); } }
      function move(d) {
        var v = visible();
        var p = pos + d;
        if (p < 0 || p >= v.length) return;
        pos = p; back = false; draw();
      }
      function toggleKnown() {
        var v = visible();
        if (!v.length) return;
        var f = deck.cards[v[pos]].front;
        var i = known.indexOf(f);
        if (i >= 0) known.splice(i, 1); else known.push(f);
        writeKnown(deck, known);
        if (skipKnown && i < 0) back = false;
        draw();
      }

      box.appendChild(el('div', { class: 'st-head' }, [el('h2', { text: deck.title }), meta]));
      box.appendChild(el('div', { class: 'st-bar', 'aria-hidden': 'true' }, [bar]));
      box.appendChild(card);
      box.appendChild(link);
      box.appendChild(el('div', { class: 'st-row spread' }, [
        el('div', { class: 'st-row' }, [prev, next]),
        el('div', { class: 'st-row' }, [knownBtn, shuffleBtn])
      ]));
      box.appendChild(el('div', { class: 'st-row spread' }, [
        el('label', null, [skip, 'Skip known cards']),
        el('p', { class: 'st-hint' }, [el('kbd', { text: 'Space' }), ' flip · ', el('kbd', { text: '←' }), ' ', el('kbd', { text: '→' }), ' move · ', el('kbd', { text: 'K' }), ' known'])
      ]));

      onKeys(function (e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
          if (e.target === skip) return;
          e.preventDefault(); flip();
        } else if (e.key === 'Enter' && e.target === card) { e.preventDefault(); flip(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
        else if (e.key === 'k' || e.key === 'K') { toggleKnown(); }
      });
      draw();
    }

    /* ---------- Quiz ---------- */
    function quiz(subset) {
      var items = (subset || range(deck.quiz.length)).map(function (i) {
        var q = deck.quiz[i];
        return { i: i, q: q, order: shuffle(range(q.choices.length)) };
      });
      var pos = 0;
      var picked = null;
      var missed = [];
      var right = 0;

      function draw() {
        box.innerHTML = '';
        var bar = el('i');
        bar.style.width = (pos / items.length * 100) + '%';
        if (pos >= items.length) return finish();
        var it = items[pos];
        box.appendChild(header('Question ' + (pos + 1) + ' of ' + items.length + (subset ? ' · retry' : '')));
        box.appendChild(el('div', { class: 'st-bar', 'aria-hidden': 'true' }, [bar]));
        box.appendChild(el('p', { class: 'st-q', id: 'st-q', text: it.q.q }));
        var list = el('ul', { class: 'st-choices', 'aria-labelledby': 'st-q' });
        it.order.forEach(function (ci, n) {
          var b = el('button', { type: 'button', class: 'st-choice', 'data-space': 'native', onclick: function () { choose(ci); } },
            [el('b', { text: String(n + 1) }), el('span', { text: it.q.choices[ci] })]);
          if (picked !== null) {
            b.disabled = true;
            if (ci === it.q.answer) b.className += ' right';
            else if (ci === picked) b.className += ' wrong';
          }
          list.appendChild(el('li', null, [b]));
        });
        box.appendChild(list);
        if (picked !== null) {
          var ok = picked === it.q.answer;
          var why = el('div', { class: 'st-why ' + (ok ? 'ok' : 'bad'), role: 'status' }, [
            el('p', null, [el('strong', { text: ok ? 'Right. ' : 'Not quite. ' }), it.q.why]),
            it.q.link ? el('p', null, [sectionLink(it.q.link, opts.base)]) : null
          ]);
          box.appendChild(why);
          var nx = el('button', { type: 'button', class: 'primary', 'data-space': 'native', text: pos === items.length - 1 ? 'See score' : 'Next question →', onclick: advance });
          box.appendChild(el('div', { class: 'st-row' }, [nx]));
          nx.focus();
        } else {
          box.appendChild(el('p', { class: 'st-hint' }, ['Pick an answer, or press ', el('kbd', { text: '1' }), '–', el('kbd', { text: String(it.order.length) }), '.']));
        }
      }

      function choose(ci) {
        if (picked !== null) return;
        picked = ci;
        if (ci === items[pos].q.answer) right++; else missed.push(items[pos].i);
        draw();
      }
      function advance() { if (picked === null) return; pos++; picked = null; draw(); }

      function finish() {
        box.appendChild(header(subset ? 'Retry finished' : 'Quiz finished'));
        box.appendChild(el('p', { class: 'st-score', text: right + ' / ' + items.length }));
        var pct = Math.round(right / items.length * 100);
        box.appendChild(el('p', { class: 'st-hint', text: pct === 100 ? 'Every answer right.' : pct + '% right. Review the sections below, then retry the ones you missed.' }));
        if (missed.length) {
          var ul = el('ul', { class: 'st-missed' });
          missed.forEach(function (i) {
            var q = deck.quiz[i];
            ul.appendChild(el('li', null, [q.q + ' ', q.link ? el('a', { href: (opts.base || '') + q.link, text: 'Section' }) : null]));
          });
          box.appendChild(ul);
        }
        var row = el('div', { class: 'st-row' });
        var wrong = missed.slice();
        if (wrong.length) row.appendChild(el('button', { type: 'button', class: 'primary', 'data-space': 'native', text: 'Retry wrong ones (' + wrong.length + ')', onclick: function () { quiz(wrong); } }));
        row.appendChild(el('button', { type: 'button', 'data-space': 'native', text: 'Start over', onclick: function () { quiz(); } }));
        box.appendChild(row);
        var first = row.querySelector('button');
        if (first) first.focus();
        if (opts.onFinish) opts.onFinish(right, items.length);
      }

      onKeys(function (e) {
        if (pos >= items.length) return;
        var n = parseInt(e.key, 10);
        if (picked === null && n >= 1 && n <= items[pos].order.length) { e.preventDefault(); choose(items[pos].order[n - 1]); }
        else if (picked !== null && (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A'))) { e.preventDefault(); advance(); }
      });
      draw();
    }

    if (mode === 'quiz') quiz(); else cards();

    current = {
      destroy: function () {
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        if (upHandler) document.removeEventListener('keyup', upHandler);
        root.innerHTML = '';
        current = null;
      }
    };
    return current;
  }

  function load(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ': ' + r.status);
      return r.json();
    });
  }

  window.StudyEngine = { load: load, mount: mount, readKnown: readKnown };
})();
