/* Reading progress for Agentic System Designs, kept in one first-party cookie.
   Cookie "asd_roadmap" holds "slug.state" pairs joined by "|": v = visited, d = done.
   Every page in this folder loads this file; topic pages mark themselves visited,
   and the index renders the roadmap from the same data. */
(function () {
  var NAME = 'asd_roadmap';
  var MAX_AGE = 60 * 60 * 24 * 365;
  var dir = location.pathname.replace(/[^/]*$/, '') || '/';

  function read() {
    var map = {};
    var m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
    if (!m) return map;
    decodeURIComponent(m[1]).split('|').forEach(function (pair) {
      var i = pair.lastIndexOf('.');
      if (i > 0) map[pair.slice(0, i)] = pair.slice(i + 1);
    });
    return map;
  }

  function write(map) {
    var value = Object.keys(map).filter(function (k) { return map[k]; })
      .map(function (k) { return k + '.' + map[k]; }).join('|');
    var attrs = '; path=' + dir + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    document.cookie = value
      ? NAME + '=' + encodeURIComponent(value) + attrs + '; max-age=' + MAX_AGE
      : NAME + '=' + attrs + '; max-age=0';
  }

  var api = {
    all: read,
    get: function (slug) { return read()[slug] || ''; },
    set: function (slug, state) { var m = read(); if (state) m[slug] = state; else delete m[slug]; write(m); },
    visit: function (slug) { var m = read(); if (!m[slug]) { m[slug] = 'v'; write(m); } },
    reset: function () { write({}); }
  };
  window.ASDProgress = api;

  var slug = location.pathname.split('/').pop().replace(/\.html$/, '');
  if (slug && slug !== 'index') api.visit(slug);
})();
