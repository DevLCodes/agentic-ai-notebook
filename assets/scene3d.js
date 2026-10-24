// Shared 3D engine for the concept pages: the same stage, shapes and packet timeline as the system-design
// walkthroughs. A page defines scenes ({ view, loop, steps, build(c) }) keyed by figure id and calls boot().
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const BG = 0xe6eaee;
const V3 = THREE.Vector3;

// ---------- palette ----------
const C = {
  source: 0x8795a3, ingest: 0x2a9d8f, kb: 0x4d5fd8, serve: 0xe3a13b, model: 0x7c5cff,
  gov: 0xb2456e, cross: 0x4a5562, dlq: 0xa9443c, ok: 0x46b06a, glass: 0xc9e2f2,
  rack: 0x3c4652, git: 0xe8603c, canary: 0xf2c230, v2: 0x2f9e6b, steel: 0x9aa5b1,
};
const P = {
  env: 0xffc857, doc: 0xffffff, chunk: 0x5fd3c3, vec: 0x8f9bff, bad: 0xe0413a, span: 0x75859a,
  ask: 0xffd27a, acl: 0xe27ab0, ans: 0xff9f86, ship: 0x46b06a, same: 0xb8c0c9,
};

// ---------- primitives ----------
function mat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.55, metalness: o.metal ?? 0,
    emissive: new THREE.Color(o.emi ?? color), emissiveIntensity: o.glow ?? 0,
    transparent: o.opacity != null, opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide, flatShading: !!o.flat,
    depthWrite: o.opacity == null || o.opacity > 0.6,
  });
  m.userData.base = o.glow ?? 0;
  return m;
}
function mesh(geo, color, o = {}) {
  const m = new THREE.Mesh(geo, mat(color, o));
  m.castShadow = o.cast ?? true;
  m.receiveShadow = true;
  return m;
}
function rb(w, h, d, color, o = {}) {
  const r = Math.max(0.002, Math.min(o.r ?? 0.12, h / 2 - 0.001, w / 2 - 0.001, d / 2 - 0.001));
  return mesh(new RoundedBoxGeometry(w, h, d, o.seg ?? 3, r), color, o);
}
function grp() { const g = new THREE.Group(); g.userData.glow = []; g.userData.h = 1; return g; }
function put(g, m, x = 0, y = 0, z = 0, glow = true) {
  m.position.set(x, y, z);
  g.add(m);
  if (glow) g.userData.glow.push(m);
  return m;
}
function rod(a, b, r, color, o) {
  const m = mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 14), color, o);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
function label(parent, html, cls, pos, center = [0.5, 1]) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const obj = new CSS2DObject(el);
  obj.position.copy(pos);
  obj.center.set(center[0], center[1]);
  parent.add(obj);
  return obj;
}

// ---------- shapes: each returns a group standing on y = 0 ----------
function database(color, o = {}) {
  const r = o.r ?? 1.2, n = o.tiers ?? 3, th = o.th ?? 0.5, gap = 0.08;
  const g = grp();
  const light = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.55).getHex();
  for (let i = 0; i < n; i++) put(g, mesh(new THREE.CylinderGeometry(r, r, th, 48), color, { rough: 0.42 }), 0, th / 2 + i * (th + gap), 0);
  for (let i = 1; i < n; i++) put(g, mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, gap + 0.01, 48), light, { cast: false }), 0, i * (th + gap) - gap / 2, 0, false);
  const H = n * th + (n - 1) * gap;
  put(g, mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.012, 48), light, { cast: false }), 0, H + 0.006, 0, false);
  g.userData.h = H;
  g.userData.r = r;
  return g;
}
function topic(o = {}) {
  const n = o.parts ?? 3, len = o.len ?? 6, gap = o.gap ?? 0.9, rr = o.rad ?? 0.3, color = o.color ?? C.ingest;
  const segs = o.segs ?? Math.round(len * 1.4);
  const g = grp();
  const y = rr + 0.14;
  for (let p = 0; p < n; p++) {
    const z = (p - (n - 1) / 2) * gap;
    const tube = mesh(new THREE.CylinderGeometry(rr, rr, len, 28, 1, true), C.glass, { opacity: 0.32, side: THREE.DoubleSide, cast: false, rough: 0.15 });
    tube.rotation.z = Math.PI / 2;
    put(g, tube, 0, y, z, false);
    for (let k = 0; k <= segs; k++) {
      const ring = mesh(new THREE.TorusGeometry(rr + 0.012, k === 0 || k === segs ? 0.06 : 0.03, 8, 28), color, { cast: false });
      ring.rotation.y = Math.PI / 2;
      put(g, ring, -len / 2 + (k * len) / segs, y, z);
    }
    put(g, rb(len + 0.2, 0.1, rr * 1.5, 0xc3cbd4, { cast: false, r: 0.04 }), 0, 0.05, z, false);
    if (o.labels !== false && n > 1) label(g, `P${p}`, 'l3 cap', new V3(-len / 2 - 0.3, y, z), [1, 0.5]);
  }
  g.userData.h = 2 * rr + 0.2;
  g.userData.y = y;
  g.userData.len = len;
  g.userData.lane = (p) => (p - (n - 1) / 2) * gap;
  return g;
}
function server(o = {}) {
  const w = o.w ?? 1.2, h = o.h ?? 1.7, d = o.d ?? 1.0;
  const g = grp();
  put(g, rb(w, h, d, o.color ?? C.rack, { r: 0.1, emi: o.emi ?? C.ingest }), 0, h / 2, 0);
  for (let i = 0; i < 3; i++) {
    const y = h * (0.24 + i * 0.26);
    put(g, rb(w * 0.82, h * 0.18, 0.05, 0x6b7684, { cast: false, r: 0.02 }), 0, y, d / 2, false);
    put(g, mesh(new THREE.SphereGeometry(0.05, 10, 8), o.led ?? 0x46d27a, { glow: 1.4, cast: false }), w * 0.3, y, d / 2 + 0.04, false);
    put(g, rb(w * 0.4, 0.03, 0.02, 0x9aa5b1, { cast: false, r: 0.01 }), -w * 0.12, y, d / 2 + 0.03, false);
  }
  g.userData.h = h;
  return g;
}
function sheet(color = 0xffffff) {
  const g = grp();
  put(g, rb(0.9, 0.05, 1.2, color, { r: 0.02 }), 0, 0.025, 0);
  for (let i = 0; i < 4; i++) put(g, rb(i === 0 ? 0.42 : 0.66, 0.012, 0.07, 0xaeb7c2, { cast: false, r: 0.005 }), i === 0 ? -0.12 : 0, 0.056, -0.38 + i * 0.24, false);
  g.userData.h = 0.06;
  return g;
}
function stand(g, h) {
  put(g, mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.1, 32), C.steel), 0, 0.05, 0, false);
  put(g, mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 12), C.steel), 0, h / 2, 0, false);
}
function browser(accent = 0x4255d4) {
  const g = grp();
  stand(g, 0.7);
  put(g, rb(2.4, 1.6, 0.14, 0xf4f6f8, { r: 0.08 }), 0, 1.5, 0);
  put(g, rb(2.4, 0.28, 0.16, accent, { r: 0.07 }), 0, 2.18, 0.005);
  [0xe2674f, 0xe3a13b, 0x46b06a].forEach((c, i) => put(g, mesh(new THREE.SphereGeometry(0.05, 10, 8), c, { cast: false }), -1.0 + i * 0.15, 2.18, 0.09, false));
  put(g, rb(0.8, 0.62, 0.03, 0xcfd8f0, { cast: false, r: 0.02 }), -0.6, 1.42, 0.08, false);
  for (let i = 0; i < 4; i++) put(g, rb(i === 0 ? 0.6 : 0.9, 0.07, 0.03, 0xb8c0c9, { cast: false, r: 0.01 }), i === 0 ? 0.3 : 0.45, 1.72 - i * 0.2, 0.08, false);
  g.userData.h = 2.35;
  return g;
}
function wiki() {
  const g = grp();
  for (let i = 0; i < 5; i++) {
    const s = rb(1.4, 0.08, 1.8, i % 2 ? 0xf7f8f9 : 0xe9edf1, { r: 0.03 });
    s.rotation.y = (i - 2) * 0.07;
    put(g, s, (i - 2) * 0.03, 0.05 + i * 0.1, 0);
  }
  for (let k = 0; k < 4; k++) put(g, rb(k === 0 ? 0.6 : 1.0, 0.012, 0.08, 0x9aa5b1, { cast: false, r: 0.005 }), k === 0 ? -0.2 : 0, 0.5, -0.55 + k * 0.32, false);
  put(g, rb(0.16, 0.02, 0.55, C.gov, { cast: false, r: 0.01 }), 0.45, 0.51, -0.85, false);
  g.userData.h = 0.55;
  return g;
}
function gitRepo() {
  const g = grp();
  put(g, rb(1.8, 0.12, 1.3, 0x2b3440, { r: 0.05 }), 0, 0.06, 0, false);
  const A = new V3(-0.4, 0.5, 0), B = new V3(-0.4, 1.95, 0), Cn = new V3(0.45, 1.45, 0);
  g.add(rod(A, B, 0.07, 0x55606d));
  g.add(rod(A.clone().add(new V3(0, 0.25, 0)), Cn, 0.07, 0x55606d));
  for (const p of [A, B, Cn]) put(g, mesh(new THREE.SphereGeometry(0.22, 24, 16), C.git, { rough: 0.4 }), p.x, p.y, p.z);
  g.userData.h = 2.2;
  return g;
}
function bucket() {
  const g = grp();
  put(g, mesh(new THREE.CylinderGeometry(0.9, 0.68, 1.1, 40, 1, true), 0x7f93a8, { side: THREE.DoubleSide, rough: 0.45 }), 0, 0.55, 0);
  put(g, mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 40), 0x6c7f93), 0, 0.025, 0, false);
  const rim = mesh(new THREE.TorusGeometry(0.9, 0.05, 10, 40), 0x6c7f93);
  rim.rotation.x = Math.PI / 2;
  put(g, rim, 0, 1.1, 0, false);
  put(g, mesh(new THREE.TorusGeometry(0.9, 0.03, 8, 40, Math.PI), 0x6c7f93), 0, 1.1, 0, false);
  for (let i = 0; i < 2; i++) {
    const s = rb(0.6, 0.8, 0.03, 0xffffff, { r: 0.02 });
    s.rotation.z = i ? -0.22 : 0.2;
    const stripe = rb(0.6, 0.14, 0.035, 0xd04a3a, { r: 0.01, cast: false });
    stripe.position.set(0, 0.3, 0);
    s.add(stripe);
    put(g, s, i ? 0.25 : -0.2, 1.15, i ? 0.12 : -0.15, false);
  }
  g.userData.h = 2.0;
  return g;
}
function modelGem(color = C.model) {
  const g = grp();
  put(g, mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.3, 6), 0x3b3f58), 0, 0.15, 0, false);
  const gem = put(g, mesh(new THREE.IcosahedronGeometry(0.72, 0), color, { flat: true, rough: 0.3 }), 0, 1.12, 0);
  g.userData.spin = gem;
  g.userData.h = 1.85;
  return g;
}
function tray(color = C.dlq) {
  const g = grp();
  const w = 1.8, d = 1.3, h = 0.5, t = 0.08;
  put(g, rb(w, t, d, color, { r: 0.03 }), 0, t / 2, 0);
  put(g, rb(w, h, t, color, { r: 0.03 }), 0, h / 2, -d / 2 + t / 2);
  put(g, rb(w, h, t, color, { r: 0.03 }), 0, h / 2, d / 2 - t / 2);
  put(g, rb(t, h, d, color, { r: 0.03 }), -w / 2 + t / 2, h / 2, 0);
  put(g, rb(t, h, d, color, { r: 0.03 }), w / 2 - t / 2, h / 2, 0);
  g.userData.h = h;
  return g;
}
function robot(color = C.serve) {
  const g = grp();
  put(g, rb(1.2, 1.0, 0.9, color, { r: 0.2 }), 0, 0.5, 0);
  put(g, rb(1.0, 0.72, 0.82, 0xf3f4f6, { r: 0.2 }), 0, 1.42, 0);
  put(g, rb(0.78, 0.3, 0.04, 0x1c2530, { r: 0.08, cast: false }), 0, 1.45, 0.41, false);
  for (const x of [-0.18, 0.18]) put(g, mesh(new THREE.SphereGeometry(0.07, 12, 10), 0x7fe3ff, { glow: 1.2, cast: false }), x, 1.45, 0.44, false);
  g.add(rod(new V3(0, 1.78, 0), new V3(0, 2.08, 0), 0.03, C.steel));
  put(g, mesh(new THREE.SphereGeometry(0.09, 14, 10), color), 0, 2.12, 0);
  g.userData.h = 2.25;
  return g;
}
function person(color = 0xdfe6ee) {
  const g = grp();
  put(g, mesh(new THREE.CapsuleGeometry(0.38, 0.7, 6, 16), color, { rough: 0.7 }), 0, 0.76, 0);
  put(g, mesh(new THREE.SphereGeometry(0.3, 24, 16), 0xf1d3b8, { rough: 0.7 }), 0, 1.82, 0);
  g.userData.h = 2.1;
  return g;
}
function monitor(colors = [C.ingest, C.serve]) {
  const g = grp();
  stand(g, 0.8);
  put(g, rb(2.9, 1.8, 0.14, 0x2b3440, { r: 0.08, emi: 0x4255d4 }), 0, 1.65, 0);
  put(g, rb(2.62, 1.52, 0.02, 0x16202b, { cast: false, r: 0.02 }), 0, 1.65, 0.08, false);
  const bars = [];
  const n = colors.length, span = 2.1, bw = Math.min(0.42, (span / n) * 0.6);
  colors.forEach((c, i) => {
    const b = rb(bw, 1, 0.04, c, { cast: false, r: 0.01, glow: 0.45 });
    b.position.set(-span / 2 + (span / n) * (i + 0.5), 1.0, 0.11);
    g.add(b);
    bars.push(b);
  });
  const thr = rb(2.4, 0.03, 0.03, 0xff5a4e, { cast: false, r: 0.01, glow: 1 });
  thr.position.set(0, 1.0 + 0.9, 0.12);
  g.add(thr);
  g.userData.setBar = (i, v) => { const b = bars[i]; v = Math.max(0.02, v); b.scale.y = v; b.position.y = 1.0 + v / 2; };
  bars.forEach((_, i) => g.userData.setBar(i, 0.1));
  g.userData.thr = thr;
  g.userData.h = 2.6;
  return g;
}
function bird() {
  const g = grp();
  const body = mesh(new THREE.SphereGeometry(0.5, 24, 16), C.canary, { rough: 0.6 });
  body.scale.set(1.15, 0.85, 0.8);
  put(g, body, 0, 0.62, 0);
  put(g, mesh(new THREE.SphereGeometry(0.3, 24, 16), C.canary, { rough: 0.6 }), 0.45, 1.02, 0);
  const beak = mesh(new THREE.ConeGeometry(0.1, 0.26, 12), 0xf08a24);
  beak.rotation.z = -Math.PI / 2;
  put(g, beak, 0.83, 1.0, 0, false);
  for (const z of [-0.2, 0.2]) put(g, mesh(new THREE.SphereGeometry(0.05, 10, 8), 0x1c2530, { cast: false }), 0.62, 1.1, z, false);
  const tail = rb(0.4, 0.08, 0.32, 0xd9a514, { r: 0.03 });
  tail.rotation.z = 0.5;
  put(g, tail, -0.62, 0.78, 0, false);
  for (const z of [-0.14, 0.14]) g.add(rod(new V3(0, 0.3, z), new V3(0, 0.0, z), 0.03, 0xf08a24));
  g.userData.h = 1.35;
  return g;
}
function signpost(color = C.serve) {
  const g = grp();
  put(g, mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.12, 24), C.steel), 0, 0.06, 0, false);
  put(g, mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 12), C.steel), 0, 1.25, 0, false);
  const pivot = new THREE.Group();
  pivot.position.y = 2.15;
  g.add(pivot);
  const board = rb(1.6, 0.5, 0.12, color, { r: 0.06 });
  board.position.x = 0.85;
  pivot.add(board);
  const tip = mesh(new THREE.ConeGeometry(0.4, 0.5, 4), color);
  tip.rotation.z = -Math.PI / 2;
  tip.scale.set(1, 1, 0.3);
  tip.position.x = 1.88;
  pivot.add(tip);
  g.userData.glow.push(board, tip);
  g.userData.pivot = pivot;
  g.userData.h = 2.5;
  return g;
}
function shield(color = C.gov) {
  const g = grp();
  put(g, mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.12, 24), C.steel), 0, 0.06, 0, false);
  put(g, mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 12), C.steel), 0, 0.6, 0, false);
  const hex = mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.16, 6), color, { rough: 0.4 });
  hex.rotation.x = Math.PI / 2;
  hex.rotation.y = Math.PI / 6;
  put(g, hex, 0, 1.95, 0);
  put(g, rb(0.46, 0.38, 0.12, 0xf3f4f6, { r: 0.05 }), 0, 1.86, 0.12, false);
  put(g, mesh(new THREE.TorusGeometry(0.14, 0.045, 8, 18, Math.PI), 0xf3f4f6), 0, 2.05, 0.12, false);
  g.userData.hex = hex;
  g.userData.h = 2.8;
  return g;
}
function flag(color) {
  const g = grp();
  put(g, mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), 0x6b7684), 0, 0.6, 0, false);
  put(g, rb(0.55, 0.34, 0.03, color, { r: 0.02 }), 0.29, 1.02, 0);
  g.userData.h = 1.2;
  return g;
}
function cards() {
  const g = grp();
  for (let i = 0; i < 6; i++) {
    const c = rb(1.2, 0.05, 0.85, i % 2 ? 0xfff3dc : 0xffe3ad, { r: 0.03 });
    c.rotation.y = (i - 3) * 0.06;
    put(g, c, 0, 0.03 + i * 0.07, 0);
  }
  put(g, mesh(new THREE.SphereGeometry(0.09, 12, 10), C.ok, { cast: false }), 0.4, 0.48, 0.2, false);
  g.userData.h = 0.45;
  return g;
}
function tile(color) { return rb(0.36, 0.22, 0.36, color, { r: 0.05, glow: 0.15 }); }

const SHAPES = { database, topic, server, sheet, browser, wiki, gitRepo, bucket, modelGem, tray, robot, person, monitor, bird, signpost, shield, flag, cards };

// ---------- paths ----------
const V = (x, z, y = 0.9) => new V3(x, y, z);
function arc(a, b, h, n = 32) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const p = new V3().lerpVectors(a, b, s);
    p.y += h * Math.sin(Math.PI * s);
    pts.push(p);
  }
  return pts;
}
function poly(pts) {
  const segs = [];
  let L = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); segs.push(l); L += l; }
  return (f, out) => {
    let d = f * L;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) return out.lerpVectors(pts[i], pts[i + 1], segs[i] ? Math.min(1, d / segs[i]) : 1);
      d -= segs[i];
    }
    return out;
  };
}
function packetMesh(kind, color) {
  switch (kind) {
    case 'env': return rb(0.62, 0.16, 0.44, color ?? P.env, { r: 0.05, glow: 0.3 });
    case 'doc': return rb(0.5, 0.06, 0.66, color ?? P.doc, { r: 0.02, glow: 0.2 });
    case 'vec': return mesh(new THREE.OctahedronGeometry(0.27), color ?? P.vec, { glow: 0.35, flat: true });
    case 'span': return mesh(new THREE.SphereGeometry(0.13, 10, 8), color ?? P.span, { glow: 0.3 });
    case 'ask': return mesh(new THREE.SphereGeometry(0.24, 16, 12), color ?? P.ask, { glow: 0.35 });
    default: return rb(0.38, 0.38, 0.38, color ?? P.chunk, { r: 0.09, glow: 0.3 });
  }
}

// ---------- one interactive stage ----------
const live = [];

function makeStage(fig, def) {
  const host = fig.querySelector('.stage3d');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    return null;
  }
  const big = !!def.hero;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const lr = new CSS2DRenderer();
  lr.domElement.className = 'labels3';
  host.appendChild(lr.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 100, 200);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);
  const view = def.view;
  const target = new V3(...view.target);

  scene.add(new THREE.HemisphereLight(0xf3f6ff, 0x8e98a3, 1.15));
  const sun = new THREE.DirectionalLight(0xfff2df, 2.4);
  sun.position.set(target.x - 14, 30, target.z + 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024);
  const ext = Math.max(view.w, view.d) * 0.62;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 100 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 5;
  sun.target.position.copy(target);
  scene.add(sun, sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ color: 0xdce1e6, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ctx = {
    scene, C, P, V, V3, arc, SHAPES, THREE, rb, mesh, tile, label, LOOP: def.loop,
    packets: [], glowers: [], shows: [], tickers: [],
  };
  // place a shape with a name label
  ctx.obj = (shape, x, z, name, sub, o = {}) => {
    const g = typeof shape === 'string' ? SHAPES[shape](...(o.args ?? [])) : shape;
    g.position.set(x, o.y ?? 0, z);
    if (o.rot) g.rotation.y = o.rot;
    scene.add(g);
    g.userData.arrivals = [];
    if (name) {
      g.userData.lab = label(g, `<b>${name}</b>${sub ? `<span>${sub}</span>` : ''}`, 'lbl', new V3(0, g.userData.h + (o.lift ?? 0.35), 0));
      g.userData.el = g.userData.lab.element;
    }
    ctx.glowers.push(g);
    return g;
  };
  ctx.top = (g, lift = 0.3) => new V3(g.position.x, g.position.y + g.userData.h + lift, g.position.z);
  ctx.pulse = (g, ...ts) => g.userData.arrivals.push(...ts);
  ctx.show = (g, t0, t1 = 1e9, mode = 'pop') => {
    const css = [];
    g.traverse((o) => { if (o.isCSS2DObject) css.push(o); });
    ctx.shows.push({ g, t0, t1, mode, css, y0: g.position.y, s0: g.scale.clone() });
  };
  ctx.tick = (fn) => ctx.tickers.push(fn);
  ctx.lane = (pts) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.01) continue;
      const m = rb(len + 0.22, 0.05, 0.22, 0xb4bcc6, { r: 0.02, seg: 2, cast: false, rough: 0.8 });
      m.position.set((a.x + b.x) / 2, 0.03, (a.z + b.z) / 2);
      m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      scene.add(m);
    }
  };
  ctx.note = (html, x, z, y = 0.3, center = [0.5, 0]) => label(scene, html, 'lane-lbl', new V3(x, y, z), center);
  ctx.packet = (sp) => {
    const n = sp.n ?? 1;
    const at = poly(sp.pts);
    for (let k = 0; k < n; k++) {
      const t0 = sp.t0 + k * (sp.st ?? 0.12), t1 = sp.t1 + k * (sp.st ?? 0.12);
      const m = packetMesh(sp.kind ?? 'chunk', sp.color);
      const sc = (sp.s ?? 1) * (def.ps ?? 1.3);
      m.visible = false;
      scene.add(m);
      let lab = null;
      if (sp.label && k === 0) lab = label(m, sp.label, 'l3 pk', new V3(0, 0.35, 0));
      ctx.packets.push({ m, at, t0, dur: t1 - t0, lab, s: sc });
      if (sp.to && k === n - 1) sp.to.userData.arrivals.push(t1);
    }
    if (sp.from) sp.from.userData.arrivals.push(sp.t0 + 0.05);
  };

  const built = def.build(ctx);
  const steps = def.steps;

  // ---------- camera ----------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.enableZoom = false;
  controls.enablePan = false;
  if (coarse) { controls.enabled = false; renderer.domElement.style.touchAction = 'auto'; }
  let userCam = false, dist = 40, portrait = false;
  const resetBtn = fig.querySelector('.reset3');
  controls.addEventListener('start', () => { userCam = true; if (resetBtn) resetBtn.hidden = false; });
  resetBtn?.addEventListener('click', () => { userCam = false; resetBtn.hidden = true; controls.target.copy(target); });

  function placeCamera(t) {
    // portrait screens look down the long axis, so the flow runs top to bottom
    const az = THREE.MathUtils.degToRad(view.az ?? 0) + (portrait ? Math.PI / 2 : 0) + (reduceMotion ? 0 : 0.08 * Math.sin((2 * Math.PI * t) / def.loop));
    const el = THREE.MathUtils.degToRad(portrait ? Math.min(66, (view.el ?? 45) + 14) : view.el ?? 45);
    camera.position.set(
      target.x + Math.sin(az) * Math.cos(el) * dist,
      target.y + Math.sin(el) * dist,
      target.z + Math.cos(az) * Math.cos(el) * dist
    );
    camera.lookAt(target);
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    portrait = camera.aspect < 0.85;
    dist = portrait
      ? Math.max((view.d / 2) / Math.tan(hf / 2), (view.w / 2) / Math.tan(vf / 2))
      : Math.max((view.w / 2) / Math.tan(hf / 2), (view.d / 2) / Math.tan(vf / 2));
    scene.fog.near = dist + 25;
    scene.fog.far = dist + 120;
    renderer.setSize(w, h);
    lr.setSize(w, h);
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // ---------- controls: play, steps, caption ----------
  const playBtn = fig.querySelector('.pp');
  const stepsEl = fig.querySelector('.steps3');
  const capEl = fig.querySelector('.out3');
  const metaEl = fig.querySelector('.meta3');
  const fillEl = fig.querySelector('.fill3');
  const stepBtns = steps.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(i + 1);
    b.setAttribute('aria-label', `Step ${i + 1}`);
    b.addEventListener('click', () => { simT = s.t + 0.001; setPlaying(false); });
    stepsEl.appendChild(b);
    return b;
  });
  let playing = !reduceMotion;
  let simT = reduceMotion ? (def.still ?? steps[steps.length - 1].t + 0.6) : 0;
  function setPlaying(p) { playing = p; playBtn.textContent = p ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(!p)); }
  setPlaying(playing);
  playBtn.addEventListener('click', () => setPlaying(!playing));
  let cur = -1;
  function setStep(i) {
    if (i === cur) return;
    cur = i;
    capEl.textContent = steps[i].text;
    metaEl.textContent = `Step ${i + 1} of ${steps.length}`;
    stepBtns.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'step' : 'false'));
    if (def.onStep) def.onStep(i, steps[i]);
  }

  const L = def.loop;
  const mod = (a) => ((a % L) + L) % L;
  const tmp = new V3();
  function update(t) {
    for (const p of ctx.packets) {
      const rel = mod(t - p.t0);
      const on = rel <= p.dur;
      if (on) {
        const f = rel / p.dur;
        p.at(f, tmp);
        p.m.position.copy(tmp);
        p.m.scale.setScalar(p.s * Math.max(0.001, Math.min(1, f / 0.12, (1 - f) / 0.12)));
        p.m.rotation.y = f * Math.PI;
      }
      p.m.visible = on;
      if (p.lab) p.lab.visible = on;
    }
    for (const g of ctx.glowers) {
      let k = 0;
      for (const ta of g.userData.arrivals) {
        const rel = mod(t - ta);
        if (rel < 1.6) k = Math.max(k, Math.exp(-rel / 0.38));
      }
      for (const m of g.userData.glow) m.material.emissiveIntensity = m.material.userData.base + 0.55 * k;
      const on = k > 0.3;
      if (g.userData.el && on !== g.userData.on) { g.userData.on = on; g.userData.el.classList.toggle('on', on); }
      if (g.userData.spin) g.userData.spin.rotation.y = t * 0.6;
    }
    for (const s of ctx.shows) {
      const on = t >= s.t0 && t < s.t1;
      s.g.visible = on;
      for (const c of s.css) c.visible = on;
      if (!on) continue;
      let k = Math.min(1, (t - s.t0) / 0.3);
      let y = s.y0;
      if (s.mode === 'drop' && s.t1 - t < 0.7) {
        const f = 1 - (s.t1 - t) / 0.7;
        y = s.y0 + 0.9 * f - 1.6 * f * f;
        k = Math.min(k, 1 - f * 0.9);
      }
      s.g.position.y = y;
      s.g.scale.copy(s.s0).multiplyScalar(Math.max(0.001, k));
    }
    for (const fn of ctx.tickers) fn(t);
    let i = 0;
    while (i + 1 < steps.length && t >= steps[i + 1].t) i++;
    setStep(i);
    if (fillEl) fillEl.style.width = `${(t / L) * 100}%`;
  }

  fig.classList.add('ready');
  const clock = new THREE.Clock();
  const st = {
    visible: true,
    frame() {
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!st.visible) return;
      if (playing) simT = mod(simT + dt);
      update(simT);
      if (userCam) controls.update(); else placeCamera(simT);
      renderer.render(scene, camera);
      lr.render(scene, camera);
    },
  };
  new IntersectionObserver((es) => { st.visible = es[0].isIntersecting; }).observe(host);
  return st;
}

function boot(defs) {
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const def = defs[e.target.id];
      if (!def) continue;
      try {
        const st = makeStage(e.target, def);
        if (st) live.push(st);
      } catch (err) {
        console.error(err);
      }
    }
  }, { rootMargin: '400px 0px' });
  for (const id in defs) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
  (function loop() {
    for (const st of live) st.frame();
    requestAnimationFrame(loop);
  })();
}

export { boot };
