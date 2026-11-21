/* "Check yourself" block for topic pages. Each topic page has an empty
   <section id="check-yourself" hidden></section> before Related. If the page's
   deck is listed in decks/index.json, this fills it with 3 random quiz questions
   (rendered by study.js) and a link to the full flashcards; otherwise it stays hidden.
   Finishing the 3 questions marks the topic "quizzed" (q) in progress.js, unless it is already done. */
(function () {
  'use strict';
  var root = document.getElementById('check-yourself');
  if (!root || !window.fetch) return;
  var slug = location.pathname.split('/').pop().replace(/\.html$/, '');
  var COUNT = 3;

  function engine() {
    if (window.StudyEngine) return Promise.resolve(window.StudyEngine);
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = 'study.js';
      s.onload = function () { window.StudyEngine ? ok(window.StudyEngine) : fail(new Error('study.js')); };
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  function pick(list, n) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, n);
  }

  function markQuizzed() {
    var P = window.ASDProgress;
    if (P && P.get(slug) !== 'd') P.set(slug, 'q');
  }

  fetch('decks/index.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      if (!Array.isArray(list) || list.indexOf(slug) < 0) return null;
      return engine().then(function (E) {
        return E.load('decks/' + slug + '.json').then(function (deck) { return { E: E, deck: deck }; });
      });
    })
    .then(function (got) {
      if (!got || !got.deck.quiz || !got.deck.quiz.length) return;
      var deck = { title: COUNT + ' quick questions', page: got.deck.page, cards: got.deck.cards, quiz: pick(got.deck.quiz, COUNT) };
      root.innerHTML = '<h2>Check yourself</h2><p>Three random questions from this page. For every card and the full quiz, open <a href="study.html#' + slug + '/cards">the ' + got.deck.title + ' flashcards</a>.</p>';
      var box = document.createElement('div');
      root.appendChild(box);
      root.hidden = false;
      got.E.mount(box, deck, 'quiz', { scoped: true, onFinish: markQuizzed });
    })
    .catch(function () { root.hidden = true; });
})();
