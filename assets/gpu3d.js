// 3D labs for model serving and agents: fitting a model on GPUs, CUDA streams, GPU sharing (MIG vs time-slicing),
// NIM request routing, serving levers, a request's journey through a NIM container, and restarting an agent pod.
// Each page calls the mount function it needs with its own <figure class="fig3d"> element.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const V3 = THREE.Vector3;
const COL = {
  weights: 0xe2674f, kv: 0x4d5fd8, over: 0x8a96a3, glass: 0xbfd9ec, chassis: 0x2b333d, nvlink: 0x7c5cff,
  net: 0xe3a13b, bad: 0xd23c32, ok: 0x2f9e6b, token: 0xffc857, ingest: 0x2a9d8f, serve: 0xe3a13b, gov: 0xb2456e,
};
const LAYER_COLS = [0xe2674f, 0xe3a13b, 0xd9c23a, 0x46b06a, 0x2a9d8f, 0x4d9fd8, 0x4d5fd8, 0x8a5cd8];

// ---------- stage ----------
function stage(host, opts = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'labels3';
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe6eaee);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c2cc, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 14, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 14, bottom: -8, near: 1, far: 50 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(...(opts.cam || [0, 8, 18]));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...(opts.target || [0, 2, 0]));
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 6;
  controls.maxDistance = 60;
  if (coarse) { controls.enabled = false; renderer.domElement.style.touchAction = 'auto'; }

  const tickers = [], clock = new THREE.Clock();
  let visible = true;
  const camGoal = { pos: camera.position.clone(), target: controls.target.clone(), active: false };
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (!visible) return;
    tickers.forEach(f => f(reduceMotion ? 0 : dt, reduceMotion ? 0 : t));
    if (camGoal.active) {
      const k = 1 - Math.exp(-dt * 3);
      camera.position.lerp(camGoal.pos, reduceMotion ? 1 : k);
      controls.target.lerp(camGoal.target, reduceMotion ? 1 : k);
      if (camera.position.distanceTo(camGoal.pos) < 0.05) camGoal.active = false;
    }
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  });
  host.classList.add('ready');
  return {
    scene, camera, controls, host,
    tick(f) { tickers.push(f); },
    frame(target, dist, height) {
      camGoal.target.set(...target);
      const dir = camera.position.clone().sub(controls.target).setY(0).normalize();
      if (!isFinite(dir.x) || dir.length() < 0.5) dir.set(0.25, 0, 1).normalize();
      const narrow = Math.max(1, 1.7 / camera.aspect);   // pull back on tall, narrow screens
      camGoal.pos.copy(camGoal.target).add(dir.multiplyScalar(dist * narrow)).setY(height * narrow);
      camGoal.active = true;
    },
  };
}

// ---------- helpers ----------
function material(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.45, metalness: o.metal ?? 0.05,
    emissive: new THREE.Color(o.emi ?? color), emissiveIntensity: o.glow ?? 0,
    transparent: o.opacity != null, opacity: o.opacity ?? 1, depthWrite: o.opacity == null || o.opacity > 0.6,
  });
}
function box(w, h, d, color, o = {}) {
  const r = Math.max(0.002, Math.min(o.r ?? 0.06, h / 2 - 0.001, w / 2 - 0.001, d / 2 - 0.001));
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), material(color, o));
  m.castShadow = o.cast ?? true;
  m.receiveShadow = true;
  return m;
}
function label(parent, html, cls, pos) {
  const el = document.createElement('div');
  el.className = 'l3 ' + (cls || '');
  el.innerHTML = html;
  const obj = new CSS2DObject(el);
  obj.position.copy(pos);
  obj.center.set(0.5, 1);
  parent.add(obj);
  return obj;
}
// smooth movers: set obj.userData.goal = { y, sy, x, op } and the ticker eases toward it
function ease(list, dt) {
  const k = 1 - Math.exp(-dt * 7);
  list.forEach(o => {
    const g = o.userData.goal;
    if (!g) return;
    const a = dt === 0 ? 1 : k;
    if (g.x != null) o.position.x += (g.x - o.position.x) * a;
    if (g.y != null) o.position.y += (g.y - o.position.y) * a;
    if (g.z != null) o.position.z += (g.z - o.position.z) * a;
    if (g.sy != null) o.scale.y += (g.sy - o.scale.y) * a;
    if (g.sx != null) o.scale.x += (g.sx - o.scale.x) * a;
    if (g.op != null && o.material) o.material.opacity += (g.op - o.material.opacity) * a;
  });
}
function seg(root, attr, fn) {
  root.querySelectorAll('[data-' + attr + ']').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-' + attr + ']').forEach(o => o.setAttribute('aria-pressed', o === b));
    fn(b.dataset[attr]);
  }));
}

// ---------- 1. fitting a model ----------
const MODELS = { 8: { layers: 32, kv: 131072 }, 70: { layers: 80, kv: 327680 }, 405: { layers: 126, kv: 516096 } };
const PER_SERVER = 8, CONTEXT = 4096, OVERHEAD = 2, HEADROOM = 0.95, SIZES = [1, 2, 4, 8, 16];
const precName = p => p === 2 ? 'BF16' : p === 1 ? 'FP8' : 'INT4';
function need(model, prec, users) {
  const m = MODELS[model], kvb = prec === 2 ? 2 : 1;
  return { weights: model * prec, kv: m.kv / 2 * kvb * CONTEXT * users / 1e9, layers: m.layers };
}
function perGpu(n, model, prec, users) { const r = need(model, prec, users); return { w: r.weights / n, kv: r.kv / n, total: (r.weights + r.kv) / n + OVERHEAD, layers: r.layers }; }
function minGpus(model, prec, users, mem) { for (const n of SIZES) if (perGpu(n, model, prec, users).total <= mem * HEADROOM) return n; return 32; }

export function mountFit(fig, opts = {}) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3');
  const st = { model: 70, prec: 2, mem: 80, split: 'tp', n: 1, users: 4 };
  const S = stage(host, { cam: [3, 9, 19], target: [0, 2.4, 0] });
  if (!S) return;
  const { scene } = S;
  const movers = [], H = 4.2, GW = 1.05, GD = 1.5, GAP = 0.4, SERVER_GAP = 2.4;

  // the model: a tower of layer slabs on the left
  const tower = new THREE.Group();
  scene.add(tower);
  const slabs = LAYER_COLS.map((c, i) => {
    const s = box(2.2, 0.32, 2.2, c, { r: 0.05, glow: 0.08 });
    s.position.y = 0.2 + i * 0.36;
    s.userData.goal = { y: s.position.y, sy: 1 };
    tower.add(s); movers.push(s);
    return s;
  });
  const towerLabel = label(tower, '', 'cap', new V3(0, 3.5, 0));
  label(tower, 'the model: 8 groups of layers', 'cap', new V3(0, -0.15, 1.4));

  // GPUs: 16 glass cards in two servers
  const gpus = [];
  const chassis = [0, 1].map(s => {
    const c = box(PER_SERVER * (GW + GAP) + 0.4, 0.35, GD + 0.8, COL.chassis, { r: 0.08, rough: 0.6 });
    scene.add(c);
    const nv = box(PER_SERVER * (GW + GAP) - GAP, 0.12, 0.12, COL.nvlink, { glow: 0.6, r: 0.05, cast: false });
    scene.add(nv);
    const tag = label(c, 'server ' + (s + 1) + ' · purple bar = fast GPU-to-GPU link', 'cap', new V3(0, -0.25, GD / 2 + 1.1));
    return { c, nv, tag };
  });
  const cable = box(SERVER_GAP, 0.07, 0.07, COL.net, { glow: 0.5, cast: false });
  scene.add(cable);
  const cableLabel = label(cable, 'network between servers: much slower', 'cap', new V3(0, 0.5, 0));
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    scene.add(g);
    const glass = box(GW, H, GD, COL.glass, { opacity: 0.22, rough: 0.1, cast: false });
    glass.position.y = H / 2;
    const rim = box(GW + 0.08, 0.06, GD + 0.08, 0x1c2530, { cast: false });
    rim.position.y = H;
    const fills = { kv: box(GW * 0.86, 1, GD * 0.86, COL.kv, { r: 0.02, glow: 0.1 }), over: box(GW * 0.86, 1, GD * 0.86, COL.over, { r: 0.02 }),
      spill: box(GW * 0.9, 1, GD * 0.9, COL.bad, { r: 0.02, glow: 0.4, opacity: 0.85 }) };
    const stripes = LAYER_COLS.map(c => { const m = box(GW * 0.86, 1, GD * 0.86, c, { r: 0.01, glow: 0.12 }); m.userData.goal = { y: 0.3, sy: 0.001 }; g.add(m); movers.push(m); return m; });
    Object.values(fills).forEach(m => { m.userData.goal = { y: 0.3, sy: 0.001 }; m.scale.y = 0.001; g.add(m); movers.push(m); });
    g.add(glass, rim);
    const name = label(g, String(i + 1), 'cap', new V3(0, H + 0.32, 0));
    const gb = label(g, '', '', new V3(0, H + 0.75, 0));
    g.userData.goal = { y: 0 };
    movers.push(g);
    gpus.push({ g, glass, rim, fills, stripes, name, gb });
  }
  // traffic: a beam for tensor parallel, tokens for pipeline parallel
  const beam = box(1, 0.16, GD * 1.05, COL.nvlink, { glow: 2.2, opacity: 0.9, cast: false });
  scene.add(beam);
  const tokens = [0, 1, 2, 3, 4, 5, 6, 7].map(() => {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), material(COL.token, { glow: 1.4 }));
    scene.add(t);
    return t;
  });
  const flyers = [];

  function xOf(i) { const s = Math.floor(i / PER_SERVER), j = i % PER_SERVER; return 3 + s * (PER_SERVER * (GW + GAP) + SERVER_GAP) + j * (GW + GAP); }
  function layout() {
    const servers = st.n > PER_SERVER ? 2 : 1;
    tower.position.set(-1.2, 0, 0);
    chassis.forEach((c, s) => {
      const x0 = xOf(s * PER_SERVER), x1 = xOf(s * PER_SERVER + PER_SERVER - 1), cx = (x0 + x1) / 2;
      const on = s < servers;
      c.c.position.set(cx, on ? 0.17 : -2, 0); c.nv.position.set(cx, on ? H + 0.35 : -2, -GD / 2 + 0.05);
      c.tag.visible = on;
    });
    cable.position.set((xOf(7) + xOf(8)) / 2, servers > 1 ? H * 0.5 : -3, -GD / 2 - 0.3);
    cableLabel.visible = servers > 1;
    gpus.forEach((G, i) => { G.g.position.x = xOf(i); G.g.position.z = 0; G.g.visible = i < Math.max(st.n, 8 * servers) && i < 16; G.on = i < st.n; });
    const right = xOf(Math.max(st.n, PER_SERVER * servers) - 1);
    const cx = (-3 + right) / 2, span = right + 4;
    S.frame([cx, 2.9, 0], Math.max(18, span * 1.15), Math.max(8, span * 0.5));
  }

  function verdict() {
    const { model, prec, mem, split, n, users } = st, g = perGpu(n, model, prec, users), fits = g.total <= mem * HEADROOM;
    const one = minGpus(model, prec, users, mem), oneAt8 = minGpus(model, 1, users, mem), oneAt4 = minGpus(model, 0.55, users, mem);
    const parts = [];
    let rec = { n: one, split: one > PER_SERVER ? 'pp' : 'tp', prec };
    if (one === 1) {
      const used = perGpu(1, model, prec, users).total / mem;
      parts.push(used < 0.3 ? 'The model fills only ' + Math.round(used * 100) + '% of one GPU. Don’t split it: share the GPU between several models or teams in isolated slices, or use a smaller GPU.'
        : 'Fits on one GPU. Don’t split it: run one copy per GPU and add replicas for more users.');
      if (n > 1) parts.push('Splitting across ' + n + ' GPUs only adds GPU-to-GPU traffic.');
      return { text: parts.join(' '), fits, rec };
    }
    if (prec === 2 && oneAt8 === 1) { parts.push('Recommend quantization first: at FP8 it fits on one GPU, if your eval set shows no regression.'); rec = { n: 1, split: 'tp', prec: 1 }; }
    else if (prec !== 0.55 && oneAt4 < one) parts.push('At INT4 it would need ' + oneAt4 + ' GPU' + (oneAt4 > 1 ? 's' : '') + ' instead of ' + one + ', if quality holds.');
    if (one <= PER_SERVER) parts.push((prec === 2 ? 'Without quantizing: ' : 'At ' + precName(prec) + ': ') + 'tensor parallel across ' + one + ' GPUs in one server.');
    else parts.push('Needs ' + one + ' GPUs, more than one server: tensor parallel inside each server, pipeline parallel between them.');
    if (!fits) parts.push('Right now each GPU would need ' + g.total.toFixed(0) + ' GB: it overflows.');
    else if (split === 'tp' && n > PER_SERVER) parts.push('Watch the beam turn red: tensor parallel across servers pushes per-layer traffic over the slow network. Use pipeline parallel between servers.');
    else if (split === 'pp' && n > 1) parts.push('Pipeline with ' + users + ' user' + (users > 1 ? 's' : '') + ' in flight keeps each GPU busy about ' + Math.round(Math.min(users, n) / n * 100) + '% of the time; idle GPUs go dark.');
    else if (split === 'tp' && n > 1) parts.push('Every layer is sliced ' + n + ' ways, so every GPU works on every token and swaps results after each layer: that’s the purple pulse.');
    return { text: parts.join(' '), fits, rec };
  }

  function update(fly) {
    const { model, prec, mem, split, n, users } = st, g = perGpu(n, model, prec, users);
    const scale = H / mem, thick = prec === 2 ? 1 : prec === 1 ? 0.5 : 0.28;
    slabs.forEach((s, i) => { s.userData.goal.sy = thick; s.userData.goal.y = 0.2 + i * 0.36 * thick + 0.16 * thick; });
    towerLabel.element.innerHTML = '<b>' + model + 'B</b> at ' + precName(prec) + ' · ' + (model * prec).toFixed(0) + ' GB of weights';
    towerLabel.position.y = 0.6 + 8 * 0.36 * thick;
    layout();
    gpus.forEach((G, i) => {
      const on = i < n, wH = on ? g.w * scale : 0, kH = on ? g.kv * scale : 0, oH = on ? OVERHEAD * scale : 0;
      // weights as stripes: tensor parallel = a thin slice of every layer; pipeline = a few whole layers
      const groups = split === 'tp' || n === 1 ? LAYER_COLS.map((_, k) => k) : LAYER_COLS.map((_, k) => k).filter(k => Math.floor(k * n / 8) === i || (n > 8 && Math.floor(i * 8 / n) === k));
      const own = new Set(groups), per = Math.min(wH, H - 0.04) / Math.max(1, own.size);
      let y = 0.02;
      G.stripes.forEach((m, k) => {
        const h = own.has(k) ? per : 0;
        m.userData.goal.sy = Math.max(0.001, h); m.userData.goal.y = y + h / 2; y += h;
      });
      const capped = (h0, h) => Math.max(0, Math.min(h, H - h0));
      const kvH = capped(y, kH); G.fills.kv.userData.goal = { sy: Math.max(0.001, kvH), y: y + kvH / 2 }; y += kvH;
      const ovH = capped(y, oH); G.fills.over.userData.goal = { sy: Math.max(0.001, ovH), y: y + ovH / 2 }; y += ovH;
      const total = wH + kH + oH, spillAll = Math.max(0, total - H), spill = Math.min(spillAll, 2.2);
      G.fills.spill.userData.goal = { sy: Math.max(0.001, spill), y: H + spill / 2 + 0.05, op: spill > 0 ? 0.85 : 0 };
      G.over = spill > 0;
      G.gb.position.y = H + (G.over ? Math.min(spillAll, 2.2) + 0.9 : 0.75);
      G.gb.visible = on && i === 0;
      G.gb.element.textContent = on ? (g.total.toFixed(0) + ' of ' + mem + ' GB' + (n > 1 ? ' on each GPU' : '')) : '';
      G.gb.element.className = 'l3 ' + (on ? (G.over ? 'miss' : 'sc') : 'cap');
      G.glass.material.color.set(on ? COL.glass : 0x9aa5b1);
      G.glass.material.opacity = on ? 0.26 : 0.07;
      G.rim.material.color.set(on ? 0x1c2530 : 0x9aa5b1);
      G.name.element.style.opacity = on ? 1 : 0.4;
    });
    if (fly && !reduceMotion) launchFlyers();
    const v = verdict();
    out.textContent = v.text;
    fig._rec = v.rec;
  }
  function launchFlyers() {
    const n = Math.min(st.n, 16);
    for (let i = 0; i < n; i++) {
      const groups = st.split === 'tp' || n === 1 ? [0, 2, 4, 6] : LAYER_COLS.map((_, k) => k).filter(k => Math.floor(k * n / 8) === i).slice(0, 3);
      groups.forEach((k, j) => {
        const f = box(st.split === 'tp' && n > 1 ? 2.2 / n + 0.2 : 1.6, 0.18, 1.2, LAYER_COLS[k], { glow: 0.5, cast: false });
        const from = new V3(tower.position.x, slabs[k].position.y, 0), to = new V3(xOf(i), 1 + k * 0.25, 0);
        f.position.copy(from);
        f.userData.fly = { from, to, t: -j * 0.06 - i * 0.05 };
        scene.add(f); flyers.push(f);
      });
    }
  }

  // animation
  let tTraffic = 0;
  S.tick((dt, t) => {
    ease(movers, dt);
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i], d = f.userData.fly;
      d.t += dt * 1.1;
      const u = Math.min(1, Math.max(0, d.t)), e = u * u * (3 - 2 * u);
      f.position.lerpVectors(d.from, d.to, e);
      f.position.y += Math.sin(u * Math.PI) * 2.2;
      f.scale.setScalar(1 - 0.6 * e);
      if (u >= 1) { scene.remove(f); f.geometry.dispose(); f.material.dispose(); flyers.splice(i, 1); }
    }
    const { n, split, users } = st, g = perGpu(n, st.model, st.prec, users), wTop = Math.min(H, g.w * H / st.mem);
    tTraffic += dt;
    // tensor parallel: a beam sweeps up the layers across all active GPUs
    const crossServer = split === 'tp' && n > PER_SERVER;
    beam.visible = split === 'tp' && n > 1;
    if (beam.visible) {
      const speed = crossServer ? 0.35 : 1.2, u = (tTraffic * speed) % 1;
      const x0 = xOf(0) - GW / 2, x1 = xOf(n - 1) + GW / 2;
      beam.scale.x = x1 - x0; beam.position.set((x0 + x1) / 2, 0.05 + u * Math.max(0.3, wTop), 0);
      beam.material.color.set(crossServer ? COL.bad : COL.nvlink); beam.material.emissive.set(crossServer ? COL.bad : COL.nvlink);
      beam.material.opacity = 0.55 + 0.4 * Math.sin(t * 9) ** 2;
    }
    cable.material.emissiveIntensity = crossServer ? 0.8 + 0.6 * Math.sin(t * 6) : 0.4;
    // pipeline parallel (or a single GPU): tokens climb one GPU and hop to the next
    const inFlight = split === 'pp' || n === 1 ? Math.min(users, Math.max(1, n), tokens.length) : 0;
    const busy = new Set();
    tokens.forEach((tk, j) => {
      tk.visible = j < inFlight;
      if (!tk.visible) return;
      const total = (tTraffic * 0.8 + j / inFlight * n) % n, gi = Math.floor(total), u = total - gi;
      busy.add(gi);
      tk.position.set(xOf(gi), 0.15 + u * Math.max(0.4, wTop), GD / 2 + 0.25);
    });
    gpus.forEach((G, i) => {
      if (!G.on) return;
      const idle = (split === 'pp' && n > 1 && !busy.has(i));
      const pulse = G.over ? 0.35 + 0.35 * Math.sin(t * 7) ** 2 : idle ? 0 : 0.08;
      G.glass.material.emissiveIntensity = pulse;
      G.glass.material.emissive.set(G.over ? COL.bad : 0xffffff);
      G.stripes.forEach(m => { m.material.emissiveIntensity = idle ? 0 : 0.14; m.material.opacity = 1; });
    });
  });

  // controls
  seg(fig, 'model', v => { st.model = +v; update(true); });
  seg(fig, 'prec', v => { st.prec = +v; update(false); });
  seg(fig, 'mem', v => { st.mem = +v; update(false); });
  seg(fig, 'split', v => { st.split = v; update(true); });
  seg(fig, 'n', v => { st.n = +v; update(true); });
  const users = fig.querySelector('[data-users]'), usersO = fig.querySelector('[data-users-o]');
  if (users) users.addEventListener('input', () => { st.users = +users.value; usersO.textContent = users.value; update(false); });
  const recBtn = fig.querySelector('[data-rec]');
  if (recBtn) recBtn.addEventListener('click', () => {
    const r = fig._rec; if (!r) return;
    st.n = r.n; st.split = r.split; st.prec = r.prec;
    fig.querySelectorAll('[data-n]').forEach(o => o.setAttribute('aria-pressed', +o.dataset.n === st.n));
    fig.querySelectorAll('[data-split]').forEach(o => o.setAttribute('aria-pressed', o.dataset.split === st.split));
    fig.querySelectorAll('[data-prec]').forEach(o => o.setAttribute('aria-pressed', +o.dataset.prec === st.prec));
    update(true);
  });
  update(true);
}

// ---------- 2. CUDA streams: a 3D timeline that replays ----------
export function mountStreams(fig) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3');
  const S = stage(host, { cam: [-1, 8.5, 14], target: [-0.5, 0.4, 0.5] });
  if (!S) return;
  const { scene } = S;
  const st = { streams: 1, kind: 'big' };
  const OPS = [['in', 2, COL.ingest, 'copy in'], ['compute', 4, COL.nvlink, 'compute'], ['out', 1, COL.kv, 'copy out']];
  const REQ_COLS = [0xe2674f, 0xe3a13b, 0x46b06a, 0x4d9fd8];
  const T = 28, X0 = -8, X1 = 8, x = v => X0 + v / T * (X1 - X0);
  let blocks = [], lanes = [], playhead, t0 = 0, end = 28;
  function schedule(streams, kind) {
    const free = { in: [0], out: [0], compute: kind === 'small' ? [0, 0] : [0] }, sf = new Array(streams).fill(0), bars = [];
    for (let r = 0; r < 4; r++) {
      const s = r % streams; let t = sf[s];
      OPS.forEach(([op, dur]) => {
        const lanesF = free[op]; let b = 0; lanesF.forEach((v, i) => { if (v < lanesF[b]) b = i; });
        const start = Math.max(t, lanesF[b]); lanesF[b] = start + dur; t = start + dur;
        bars.push({ r, op, lane: b, start, end: t });
      });
      sf[s] = t;
    }
    return bars;
  }
  playhead = box(0.06, 0.05, 1, COL.bad, { glow: 1.2, cast: false });
  const ph = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: COL.bad, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
  scene.add(playhead, ph);
  const timeLbl = label(scene, '', 'q', new V3(0, 3.2, 0));
  function build() {
    blocks.forEach(b => { scene.remove(b.m); }); lanes.forEach(l => scene.remove(l)); blocks = []; lanes = [];
    const bars = schedule(st.streams, st.kind);
    end = Math.max(...bars.map(b => b.end));
    const rows = st.kind === 'small' ? [['in', 0, 'copy in'], ['compute', 0, 'compute (half of GPU)'], ['compute', 1, 'compute (other half)'], ['out', 0, 'copy out']] : [['in', 0, 'copy in'], ['compute', 0, 'compute (whole GPU)'], ['out', 0, 'copy out']];
    rows.forEach(([op, lane, name], i) => {
      const z = (i - (rows.length - 1) / 2) * 1.5;
      const track = box(X1 - X0 + 0.4, 0.12, 1.1, 0xd5dbe2, { r: 0.04, cast: false });
      track.position.set(0, 0.06, z); scene.add(track); lanes.push(track);
      const l = label(track, name, 'cap', new V3(X0 + 1.4, 0.95, 0)); lanes.push(l);
      bars.filter(b => b.op === op && b.lane === lane).forEach(b => {
        const w = (x(b.end) - x(b.start)) - 0.08, col = REQ_COLS[b.r];
        const m = box(w, 0.7, 0.9, col, { r: 0.08, glow: 0.15 });
        m.position.set((x(b.start) + x(b.end)) / 2, 0.47, z);
        m.scale.y = 0.001;
        scene.add(m); blocks.push({ m, b });
      });
    });
    for (let v = 0; v <= T; v += 4) { const l = label(scene, String(v), 'cap', new V3(x(v), 0, (rows.length / 2) * 1.5 + 0.4)); lanes.push(l); }
    ph.scale.set(0.02, 2.4, rows.length * 1.5); ph.rotation.y = Math.PI / 2;
    t0 = 0;
    const serial = schedule(1, st.kind);
    const busy = bars.filter(b => b.op === 'compute').reduce((a, b) => a + b.end - b.start, 0) / (end * (st.kind === 'small' ? 2 : 1));
    out.textContent = 'All four requests finish at time ' + end + (st.streams > 1 ? ', against ' + Math.max(...serial.map(b => b.end)) + ' with one stream' : '') + '. Compute is busy ' + Math.round(busy * 100) + '% of the time. ' +
      (st.streams === 1 ? 'One queue: every copy leaves the compute units idle, so the purple lane has gaps.'
        : st.kind === 'small' ? 'Two small kernels run side by side on the two halves of the GPU: what extra Triton instances buy you.'
        : 'Copies now hide behind compute, so the purple lane is nearly solid. With a large model, more streams can’t beat the compute time itself.');
  }
  S.tick((dt, t) => {
    t0 += dt * 6;
    const loop = end + 6, now = reduceMotion ? end : (t0 % loop);
    playhead.position.set(x(Math.min(now, end)), 1.4, 0); playhead.scale.set(1, 1, 1);
    ph.position.set(x(Math.min(now, end)), 1.2, 0);
    timeLbl.position.set(x(Math.min(now, end)), 2.6, 0);
    timeLbl.element.textContent = now >= end ? 'done at ' + end : 't = ' + Math.floor(now);
    blocks.forEach(({ m, b }) => {
      const u = Math.min(1, Math.max(0, (now - b.start) / (b.end - b.start)));
      m.scale.y = Math.max(0.001, u);
      m.position.y = 0.12 + 0.35 * u;
      m.material.emissiveIntensity = u > 0 && u < 1 ? 0.6 : 0.12;
    });
  });
  seg(fig, 'st', v => { st.streams = +v; build(); });
  seg(fig, 'k', v => { st.kind = v; build(); });
  build();
}

// ---------- 3. sharing a GPU: isolated slices vs time-slicing ----------
const PROFILES = [['1g.10gb', 1, 10], ['2g.20gb', 2, 20], ['3g.40gb', 3, 40], ['7g.80gb', 7, 80]];
export function mountShare(fig, opts = {}) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3');
  const S = stage(host, { cam: [0, 8, 14], target: [0, 2, 0] });
  if (!S) return;
  const { scene } = S;
  const sliceName = opts.sliceName || 'slice';
  const st = { mode: 'mig', needs: [15, 15, 30], spike: false };
  const TEAM = [COL.kv, COL.ingest, COL.serve], GW = 9.8, GH = 4.4, GD = 2.2, CAP = 80, S7 = GW / 7;
  const shell = box(GW + 0.3, GH + 0.2, GD + 0.3, COL.glass, { opacity: 0.18, rough: 0.1, cast: false });
  shell.position.y = GH / 2 + 0.25;
  const base = box(GW + 0.9, 0.4, GD + 0.9, COL.chassis, { r: 0.08 });
  base.position.y = 0.2;
  scene.add(shell, base);
  label(base, 'one 80 GB GPU', 'cap', new V3(0, -0.1, GD / 2 + 0.55));
  const walls = [];
  for (let i = 1; i < 7; i++) {
    const w = box(0.05, GH, GD, 0x1c2530, { opacity: 0.55, cast: false });
    w.position.set(-GW / 2 + i * S7, GH / 2 + 0.4, 0); w.userData.goal = { sy: 1, op: 0.55 }; scene.add(w); walls.push(w);
  }
  const teams = TEAM.map((c, i) => {
    const m = box(1, 1, GD * 0.8, c, { r: 0.06, glow: 0.12 });
    m.position.y = 8; m.userData.goal = { y: 8 }; scene.add(m);
    const tag = label(scene, '', '', new V3(0, 8, 0));
    return { m, tag, i };
  });
  const movers = [...walls, ...teams.map(t => t.m)];
  const boom = label(scene, '', 'miss', new V3(0, GH + 1.6, 0));
  function plan() {
    const needs = st.needs.map((n, i) => n + (st.spike && i === 0 ? 45 : 0));
    if (st.mode === 'mig') {
      const picks = st.needs.map(n => n === 0 ? null : PROFILES.find(p => p[2] >= n) || 'big');
      let c = 0;
      const placed = picks.map((p, i) => {
        if (!p || p === 'big') return null;
        const r = { x: -GW / 2 + c * S7, w: p[1] * S7, cap: p[2], name: p[0], used: needs[i] };
        c += p[1];
        return r;
      });
      return { picks, placed, compute: c, needs };
    }
    return { needs };
  }
  function update() {
    const p = plan();
    walls.forEach(w => { w.userData.goal = { sy: st.mode === 'mig' ? 1 : 0.001, op: st.mode === 'mig' ? 0.55 : 0 }; });
    let msg = '', crash = [];
    if (st.mode === 'mig') {
      if (p.picks.includes('big')) msg = 'A team needs more than 80 GB. A ' + sliceName + ' can’t join GPUs: quantize that model or split it across GPUs.';
      else if (p.compute > 7) msg = 'Doesn’t fit: needs ' + p.compute + ' of 7 compute slices. Give a team its own GPU or quantize a model.';
      teams.forEach((t, i) => {
        const r = p.placed[i];
        if (!r || p.compute > 7) { t.m.userData.goal = { y: 9, x: -GW / 2 + i * 2, sx: 1.5, sy: 1 }; t.tag.element.textContent = st.needs[i] ? 'no room' : ''; return; }
        const used = Math.min(r.used, r.cap), h = used / CAP * GH * (7 / (r.w / S7)) * (r.w / S7) / 7;
        const hh = Math.max(0.15, Math.min(GH, r.used / r.cap * GH));
        t.m.userData.goal = { x: r.x + r.w / 2, y: 0.4 + hh / 2, sx: r.w - 0.14, sy: hh };
        t.tag.element.textContent = 'Team ' + 'ABC'[i] + ' · ' + r.name;
        if (r.used > r.cap) crash.push(i);
      });
      if (!msg) msg = crash.length ? 'Team A spiked past its ' + p.placed[0].cap + ' GB ' + sliceName + ' and hit out-of-memory, but only Team A. B and C keep running: their memory is separate hardware.'
        : 'Each team gets its own ' + sliceName + ' with its own memory and compute. Press "Spike Team A" to see what isolation buys.';
    } else {
      const total = p.needs.reduce((a, b) => a + b, 0);
      let y = 0.4;
      teams.forEach((t, i) => {
        const h = p.needs[i] / CAP * GH;
        t.m.userData.goal = { x: 0, y: y + h / 2, sx: GW - 0.3, sy: Math.max(0.001, h) }; y += h;
        t.tag.element.textContent = p.needs[i] ? 'Team ' + 'ABC'[i] + ' · ' + p.needs[i] + ' GB' : '';
      });
      if (total > CAP) crash = [0, 1, 2];
      msg = total > CAP ? 'Time-slicing shares one memory pool. Team A’s spike pushed the total to ' + total + ' GB, so everyone hits out-of-memory, including teams that did nothing wrong.'
        : 'Time-slicing: teams take turns on the whole GPU and share one memory pool, ' + total + ' of 80 GB used. Press "Spike Team A".';
    }
    teams.forEach((t, i) => { t.crash = crash.includes(i); t.tag.element.className = 'l3 ' + (t.crash ? 'miss' : 'sc'); });
    boom.element.textContent = crash.length ? (crash.length > 1 ? 'out of memory: all teams' : 'out of memory: Team A only') : '';
    boom.visible = crash.length > 0;
    out.textContent = msg;
  }
  S.tick((dt, t) => {
    ease(movers, dt);
    teams.forEach(tm => {
      tm.tag.position.set(tm.m.position.x + (st.mode === 'ts' ? (tm.i - 1) * 3 : 0), tm.m.position.y + tm.m.scale.y / 2 + 0.15, GD / 2);
      tm.m.material.emissive.set(tm.crash ? COL.bad : TEAM[tm.i]);
      tm.m.material.emissiveIntensity = tm.crash ? 0.5 + 0.4 * Math.sin(t * 10) ** 2 : 0.12;
      if (tm.crash && !reduceMotion) tm.m.position.x += Math.sin(t * 60) * 0.015;
    });
  });
  seg(fig, 'mode', v => { st.mode = v; update(); });
  ['a', 'b', 'c'].forEach((k, i) => {
    const s = fig.querySelector('[data-team=' + k + ']'), o = fig.querySelector('[data-team-o=' + k + ']');
    if (!s) return;
    o.textContent = s.value + ' GB';
    s.addEventListener('input', () => { st.needs[i] = +s.value; o.textContent = s.value + ' GB'; update(); });
  });
  const spike = fig.querySelector('[data-spike]');
  if (spike) spike.addEventListener('click', () => { st.spike = !st.spike; spike.setAttribute('aria-pressed', st.spike); spike.textContent = st.spike ? 'Calm Team A' : 'Spike Team A (+45 GB)'; update(); });
  update();
}

// ---------- 4. NIM routing: where an OpenAI-SDK request goes ----------
function curve(points) { return new THREE.CatmullRomCurve3(points.map(p => new V3(...p))); }
function tube(c, color, o = {}) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 64, o.r ?? 0.05, 8, false), material(color, { glow: o.glow ?? 0.2, opacity: o.opacity }));
  return m;
}
export function mountNim(fig) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3'), code = fig.querySelector('pre');
  const S = stage(host, { cam: [-1, 15, 12], target: [0, 0.4, 0] });
  if (!S) return;
  const { scene } = S;
  const st = { url: 'nim', model: 'small' };
  const agent = box(2.2, 1.2, 1.6, COL.chassis, { r: 0.12 });
  agent.position.set(-6.5, 0.6, 0); scene.add(agent);
  label(agent, 'your agent<br>OpenAI Python SDK', '', new V3(0, 1.4, 0));
  const DEST = {
    default: { pos: [5.5, 0.5, -5], color: 0x9aa5b1, name: 'api.openai.com<br><small>SDK default</small>' },
    nim: { pos: [5.5, 0.5, 0], color: 0x76b900, name: 'integrate.api.nvidia.com<br><small>NVIDIA-hosted NIM</small>' },
    self: { pos: [5.5, 0.5, 5], color: COL.chassis, name: 'your GPUs<br><small>self-hosted NIM container</small>' },
  };
  const paths = {}, models = {};
  Object.entries(DEST).forEach(([k, d]) => {
    const b = box(2.6, 1, 2.2, d.color, { r: 0.14, opacity: k === 'default' ? undefined : undefined });
    b.position.set(...d.pos); scene.add(b);
    label(b, d.name, '', new V3(-0.4, 2.3, -1.1));
    if (k !== 'default') {
      models[k] = {
        small: box(0.7, 0.5, 0.7, COL.ingest, { glow: 0.1 }),
        large: box(1.0, 1.1, 1.0, COL.nvlink, { glow: 0.1 }),
      };
      models[k].small.position.set(d.pos[0] - 0.6, 1.25, d.pos[2]); models[k].large.position.set(d.pos[0] + 0.55, 1.55, d.pos[2]);
      scene.add(models[k].small, models[k].large);
      label(models[k].small, '8B', 'cap', new V3(0, 0.45, 0)); label(models[k].large, '70B', 'cap', new V3(0, 0.75, 0));
    }
    const c = curve([[-5.3, 0.8, 0], [-1.5, 2.6, d.pos[2] * 0.4], [2.5, 2.2, d.pos[2] * 0.9], [d.pos[0] - 1.35, 0.8, d.pos[2]]]);
    const t = tube(c, 0xb8c0c9, { r: 0.045 });
    scene.add(t);
    paths[k] = { c, t };
  });
  const packet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), material(COL.token, { glow: 1.2 }));
  scene.add(packet);
  const reply = label(scene, '', 'sc', new V3(0, 3, 0));
  let t0 = 0;
  function update() {
    Object.entries(paths).forEach(([k, p]) => { p.t.material.color.set(k === st.url ? (k === 'default' ? COL.bad : COL.nvlink) : 0xb8c0c9); p.t.material.emissive.set(k === st.url ? (k === 'default' ? COL.bad : COL.nvlink) : 0x000000); p.t.material.emissiveIntensity = k === st.url ? 0.6 : 0; });
    Object.values(models).forEach(m => { m.small.material.emissiveIntensity = 0.05; m.large.material.emissiveIntensity = 0.05; });
    const MODELS = { small: 'meta/llama-3.1-8b-instruct', large: 'meta/llama-3.3-70b-instruct' };
    const URLS = { nim: 'https://integrate.api.nvidia.com/v1', self: 'http://nim-70b.internal:8000/v1', default: null };
    const url = URLS[st.url], key = st.url === 'default' ? 'os.environ["OPENAI_API_KEY"]' : st.url === 'self' ? '"not-used"' : 'os.environ["NVIDIA_API_KEY"]';
    code.textContent = 'client = OpenAI(\n' + (url ? '    base_url="' + url + '",\n' : '    # no base_url: the SDK uses https://api.openai.com/v1\n') + '    api_key=' + key + ',\n)\nclient.chat.completions.create(model="' + MODELS[st.model] + '", ...)';
    const fit = st.model === 'small' ? 'The 8B model suits routing, classification and high-volume tool calls, where latency matters most.' : 'The 70B model suits hard reasoning and final answers, where accuracy matters more than latency.';
    out.textContent = st.url === 'default' ? 'The request goes to OpenAI, which has no "' + MODELS[st.model] + '" model, so it bounces back with an error. Only base_url and the key need to change.'
      : st.url === 'nim' ? 'Same SDK, same code: only base_url, the key and the model string changed, and the request reaches NVIDIA’s hosted NIM. ' + fit
      : 'Same code again, now reaching a NIM container on your own GPUs: moving from hosted to self-hosted is a configuration change. ' + fit;
    t0 = 0;
  }
  S.tick((dt, t) => {
    t0 += dt * 0.45;
    const p = paths[st.url], phase = t0 % 2;
    let u = phase < 1 ? phase : 2 - phase;
    if (reduceMotion) u = 1;
    packet.position.copy(p.c.getPoint(Math.min(1, u)));
    const back = phase >= 1;
    const bad = st.url === 'default';
    packet.material.color.set(back ? (bad ? COL.bad : COL.ok) : COL.token);
    packet.material.emissive.set(back ? (bad ? COL.bad : COL.ok) : COL.token);
    if (models[st.url]) {
      const m = models[st.url][st.model], hot = phase > 0.85 && phase < 1.3;
      m.material.emissiveIntensity = hot ? 1.1 : 0.15;
    }
    reply.visible = back;
    if (back) {
      reply.position.copy(packet.position).add(new V3(0, 0.55, 0));
      reply.element.textContent = bad ? '404: model not found' : '200 OK: answer';
      reply.element.className = 'l3 ' + (bad ? 'miss' : 'sc');
    }
  });
  seg(fig, 'url', v => { st.url = v; update(); });
  seg(fig, 'nm', v => { st.model = v; update(); });
  update();
}

// ---------- 5. serving levers on 80 GB H100s ----------
export function mountLevers(fig) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3');
  const S = stage(host, { cam: [1, 7.5, 15], target: [0.8, 2.3, 0] });
  if (!S) return;
  const { scene } = S;
  const st = { paged: false, inflight: false, fp8: false, tp: false };
  const H = 4.4, GW = 1.8, GD = 1.8, CAP = 80, k = H / CAP, movers = [];
  const cards = [0, 1].map(i => {
    const g = new THREE.Group(); scene.add(g);
    const glass = box(GW, H, GD, COL.glass, { opacity: 0.22, rough: 0.1, cast: false }); glass.position.y = H / 2;
    const rim = box(GW + 0.1, 0.07, GD + 0.1, 0x1c2530, { cast: false }); rim.position.y = H;
    const weights = box(GW * 0.88, 1, GD * 0.88, COL.weights, { r: 0.03, glow: 0.1 });
    const reserve = box(GW * 0.88, 1, GD * 0.88, COL.kv, { r: 0.03, opacity: 0.18 });
    const blocks = [];
    for (let b = 0; b < 24; b++) { const m = box(GW * 0.88 / 4 - 0.04, 0.16, GD * 0.88 / 3 - 0.04, COL.kv, { r: 0.02, glow: 0.15 }); m.userData.goal = { op: 1, y: 0 }; g.add(m); blocks.push(m); movers.push(m); }
    const over = box(GW * 0.88, 0.25, GD * 0.88, COL.over, { r: 0.03 });
    const spill = box(GW * 0.92, 1, GD * 0.92, COL.bad, { r: 0.03, glow: 0.4, opacity: 0.85 });
    [weights, reserve, over, spill].forEach(m => { m.userData.goal = { y: 0.3, sy: 0.01 }; m.scale.y = 0.01; movers.push(m); g.add(m); });
    g.add(glass, rim);
    g.userData.goal = { x: i === 0 ? 0 : 2.8, y: i === 0 ? 0 : -6 }; g.position.y = g.userData.goal.y; movers.push(g);
    const gb = label(g, '', '', new V3(0, H + 0.7, 0));
    label(g, 'H100 · 80 GB', 'cap', new V3(0, -0.05, GD / 2 + 0.3));
    return { g, glass, weights, reserve, blocks, over, spill, gb };
  });
  // batch slots above the first card: lamps that stay lit only while doing work
  const lamps = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), material(COL.token, { glow: 1 })); m.position.set(-0.75 + i * 0.5, H + 1.6, 0); scene.add(m); return m; });
  const lampLabel = label(scene, 'batch slots', 'cap', new V3(0, H + 2.15, 0));
  const gauge = box(0.9, 1, 0.9, COL.ingest, { glow: 0.25 });
  gauge.position.set(-3, 0.5, 0); gauge.userData.goal = { sy: 1, y: 0.5 }; scene.add(gauge); movers.push(gauge);
  const gaugeLabel = label(scene, '', 'sc', new V3(-3, 1.4, 0));
  label(scene, 'throughput per GPU', 'cap', new V3(-3, -0.05, 0.8));
  function update() {
    const gpus = st.tp ? 2 : 1;
    const w = 140 * (st.fp8 ? 0.5 : 1) / gpus, kvUsed = 6 * (st.fp8 ? 0.5 : 1) / gpus, kvReserved = (st.paged ? 6 : 24) * (st.fp8 ? 0.5 : 1) / gpus, ov = 3;
    const total = w + kvReserved + ov, fits = total <= CAP;
    const thr = (st.paged ? 1.6 : 1) * (st.inflight ? 2 : 1) * (st.fp8 ? 1.5 : 1);
    cards.forEach((c, i) => {
      const on = i < gpus;
      c.g.userData.goal = { x: i === 0 ? 0 : 2.8, y: on ? 0 : -6 };
      c.g.visible = on;
      const wH = Math.min(w * k, H), rH = kvReserved * k, oH = ov * k;
      let y = 0.02;
      c.weights.userData.goal = { sy: Math.max(0.01, wH), y: y + wH / 2 }; y += wH;
      const kvBase = y;
      const rShow = Math.max(0, Math.min(rH, H - y));
      c.reserve.userData.goal = { sy: Math.max(0.01, st.paged ? 0.01 : rShow), y: y + rShow / 2 };
      // used KV as small blocks: packed tight when paged, scattered through the reserved space when not
      const nBlocks = Math.max(2, Math.round(kvUsed * 1.6));
      c.blocks.forEach((b, j) => {
        const col = j % 4, row = Math.floor(j / 4) % 3, layer = Math.floor(j / 12);
        const visible = j < nBlocks && on;
        const ly = st.paged ? kvBase + 0.1 + Math.floor(j / 12) * 0.18 : kvBase + 0.1 + (j * 0.37 % Math.max(0.2, rShow - 0.2));
        b.position.x = -GW * 0.88 / 2 + (col + 0.5) * GW * 0.88 / 4;
        b.position.z = -GD * 0.88 / 2 + (row + 0.5) * GD * 0.88 / 3;
        b.userData.goal = { y: visible ? ly : -2, op: visible ? 1 : 0 };
        b.visible = visible;
      });
      y += st.paged ? Math.max(0.2, Math.ceil(nBlocks / 12) * 0.18 + 0.05) : rShow;
      const oShow = Math.max(0, Math.min(oH, H - y));
      c.over.userData.goal = { sy: Math.max(0.01, oShow), y: y + oShow / 2 };
      const spill = Math.min(2.2, Math.max(0, total * k - H));
      c.spill.userData.goal = { sy: Math.max(0.01, spill), y: H + spill / 2 + 0.05, op: spill > 0 ? 0.85 : 0 };
      c.over_ = spill > 0;
      c.gb.position.y = H + (spill > 0 ? spill + 0.9 : 0.75);
      c.gb.visible = on && i === 0;
      c.gb.element.textContent = '~' + total.toFixed(0) + ' of 80 GB' + (gpus > 1 ? ' on each card' : '');
      c.gb.element.className = 'l3 ' + (fits ? 'sc' : 'miss');
    });
    gauge.userData.goal = { sy: thr, y: thr / 2 };
    gaugeLabel.position.y = thr + 0.6;
    gaugeLabel.element.textContent = thr.toFixed(1) + '×';
    S.frame([st.tp ? 1.2 : 0, 2.6, 0], 15, 7.5);
    const tips = [];
    tips.push(fits ? 'Fits: about ' + total.toFixed(0) + ' GB' + (gpus > 1 ? ' on each of 2 cards.' : ' on one card.') : 'Overflows one 80 GB card (red). Turn on FP8 to halve the weights, or tensor parallel to shard them across 2 cards.');
    if (!st.paged) tips.push('Without paging, the KV cache reserves a big pale block for the longest possible answers, and the real blocks rattle around inside it.');
    else tips.push('Paged: the KV blocks pack tight, freeing memory for more conversations.');
    if (!st.inflight) tips.push('Without in-flight batching, slot lamps go dark while finished requests wait for the batch to drain.');
    if (st.fp8 && st.tp) tips.push('FP8 alone already fits on one card, so the second card mostly buys headroom and lower latency.');
    out.textContent = tips.join(' ');
  }
  S.tick((dt, t) => {
    ease(movers, dt);
    lamps.forEach((l, i) => {
      const lit = st.inflight ? true : ((t * 0.7 + i * 0.27) % 1) < (0.35 + i * 0.15);
      l.material.emissiveIntensity = lit ? 1.2 : 0.02;
      l.material.color.set(lit ? COL.token : 0x9aa5b1);
    });
    cards.forEach(c => { c.glass.material.emissive.set(c.over_ ? COL.bad : 0xffffff); c.glass.material.emissiveIntensity = c.over_ ? 0.3 + 0.3 * Math.sin(t * 7) ** 2 : 0.05; });
  });
  ['paged', 'inflight', 'fp8', 'tp'].forEach(key => {
    const b = fig.querySelector('[data-lever=' + key + ']');
    if (b) b.addEventListener('click', () => { st[key] = !st[key]; b.setAttribute('aria-pressed', st[key]); update(); });
  });
  update();
}

// ---------- 6. durable agent state: restart a pod mid-conversation ----------
export function mountRestart(fig) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3');
  const S = stage(host, { cam: [1.8, 8, 16], target: [1.8, 1.5, 0] });
  if (!S) return;
  const { scene } = S;
  const st = { cp: 'memory', dep: 'one', thread: true };
  const pods = [-3.5, 0, 3.5].map((x, i) => {
    const p = box(2.2, 1.6, 1.8, COL.chassis, { r: 0.12 });
    p.position.set(x, 0.8, 0); p.userData.goal = { sy: 1, y: 0.8 }; scene.add(p);
    const disk = box(0.8, 0.3, 0.8, COL.serve, { r: 0.05 }); disk.position.set(x, 1.75, 0.5); scene.add(disk);
    const tag = label(p, 'pod ' + (i + 1), 'cap', new V3(0, -0.85, 1.0));
    return { p, disk, tag, x };
  });
  const db = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.4, 40), material(COL.kv, { glow: 0.1 }));
  db.position.set(7.2, 0.7, 0); db.castShadow = true; scene.add(db);
  const dbLabel = label(db, 'shared store<br><small>Postgres or Redis</small>', 'cap', new V3(0, 1.1, 0));
  const steps = [0, 1, 2, 3, 4].map(i => { const m = box(0.7, 0.42, 0.7, LAYER_COLS[i + 1], { r: 0.06, glow: 0.15 }); scene.add(m); return m; });
  const verdict = label(scene, '', '', new V3(0, 5.6, 0));
  const NAMES = ['user asks', 'model plans', 'tool: lookup', 'model drafts', 'reply sent'];
  let t0 = 0;
  function outcome() {
    if (!st.thread) return { ok: false, to: st.dep === 'fleet' ? 1 : 0, why: 'No thread_id, so there’s nothing to look the saved state up by. The next request starts a new conversation.' };
    if (st.cp === 'memory') return { ok: false, to: st.dep === 'fleet' ? 1 : 0, why: 'In-memory state died with the pod. The user starts over at step 1.' };
    if (st.cp === 'sqlite' && st.dep === 'fleet') return { ok: false, to: 1, why: 'The SQLite file lived on pod 1. The load balancer sends step 4 to pod 2, which has no copy, so it starts over. A fleet needs a shared store.' };
    if (st.cp === 'sqlite') return { ok: true, to: 0, why: 'Pod 1 comes back, reads its local SQLite file and resumes at step 4.' };
    return { ok: true, to: st.dep === 'fleet' ? 1 : 0, why: 'Pod ' + (st.dep === 'fleet' ? 2 : 1) + ' loads thread user-4471 from the shared store and resumes at step 4. Nothing is lost or repeated.' };
  }
  function update() {
    pods.forEach((p, i) => { const on = st.dep === 'fleet' || i === 0; p.p.visible = on; p.tag.visible = on; p.disk.visible = on && st.cp === 'sqlite'; });
    db.visible = st.cp === 'postgres'; dbLabel.visible = db.visible;
    out.textContent = outcome().why;
    t0 = 0;
  }
  S.tick((dt, t) => {
    t0 += dt;
    const loop = 9, now = reduceMotion ? 8 : t0 % loop, o = outcome();
    ease(pods.map(p => p.p), dt);
    const crashed = now > 3.2 && now < 4.4;
    pods[0].p.userData.goal = { sy: crashed ? 0.05 : 1, y: crashed ? 0.05 : 0.8 };
    pods[0].p.material.emissive.set(crashed ? COL.bad : COL.chassis); pods[0].p.material.emissiveIntensity = crashed ? 0.6 : 0;
    const serving = now < 3.2 ? pods[0] : pods[o.to];
    steps.forEach((m, i) => {
      const appear = i < 3 ? 0.4 + i * 0.9 : 5 + (i - 3) * 1.1;
      let target;
      if (now < appear) { m.visible = false; return; }
      m.visible = true;
      if (i < 3 && now >= 3.2) {
        if (o.ok) target = new V3(serving.x, 1.9 + i * 0.48, 0);           // carried over from the checkpoint
        else { m.visible = now < 4.0; target = new V3(pods[0].x, -1, 0); }  // lost with the pod
        if (st.cp === 'postgres' && now < 4.6) target = new V3(7.2, 1.7 + i * 0.48, 0);
      } else target = new V3((i < 3 ? pods[0] : serving).x, 1.9 + (o.ok || i < 3 ? i : i - 3) * 0.48, 0);
      m.position.lerp(target, dt === 0 ? 1 : 1 - Math.exp(-dt * 6));
      m.material.color.set(i >= 3 && !o.ok ? COL.bad : LAYER_COLS[i + 1]);
      m.material.emissive.set(i >= 3 && !o.ok ? COL.bad : LAYER_COLS[i + 1]);
      m.material.emissiveIntensity = i >= 3 && !o.ok ? 0.5 : 0.15;
    });
    verdict.element.textContent = now < 3.2 ? 'steps 1–3 run on pod 1' : now < 4.4 ? 'pod 1 restarts' : o.ok ? 'resumed at step 4' : 'conversation lost: starts again at step 1';
    verdict.element.className = 'l3 ' + (now >= 4.4 && !o.ok ? 'miss' : now >= 3.2 && now < 4.4 ? 'q' : 'sc');
  });
  seg(fig, 'cp', v => { st.cp = v; update(); });
  seg(fig, 'dep', v => { st.dep = v; update(); });
  const th = fig.querySelector('[data-thread]');
  if (th) th.addEventListener('click', () => { st.thread = !st.thread; th.setAttribute('aria-pressed', st.thread); th.textContent = st.thread ? 'thread_id: on' : 'thread_id: off'; update(); });
  update();
}

// ---------- 7. one request's journey through a NIM container ----------
const STAGES = [
  ['Request', 'Your agent sends POST /v1/chat/completions with the OpenAI SDK. base_url points at the NIM, so nothing else in the code changes.'],
  ['API server', 'The NIM’s OpenAI-compatible front end checks the request and applies the model’s chat template, turning the message list into one prompt string.'],
  ['Tokenizer', 'The prompt becomes token ids, about 4 characters each. "Classify this support ticket" is 6 tokens. The model only ever sees these numbers.'],
  ['Queue and scheduler', 'The request waits in the server’s queue. The in-flight scheduler admits it at the next generation step, into a slot that a finished request just freed. (In NIM 1.x this scheduling runs in Triton with TensorRT-LLM; NIM 2.x uses vLLM or SGLang, which do the same.)'],
  ['Prefill', 'The whole prompt runs through the model in one pass. Every layer stores its keys and values for every prompt token in the KV cache, in small paged blocks on the GPUs. This step sets the time to first token.'],
  ['Tensor parallel', 'Each layer’s weights are split across 4 GPUs. All 4 compute their slice at once, then swap partial results over NVLink (the purple pulse) before the next layer. This repeats for every layer, for every token.'],
  ['Decode', 'Now one new token per step. Each step reads all the weights once, appends one KV block per layer, and serves every request in the batch together. Other requests join and leave around yours.'],
  ['Detokenize and stream', 'Each new token id becomes text and streams back to your agent as a server-sent event, so the user sees words as they are generated.'],
  ['Finish', 'At the end-of-sequence token, the request leaves the batch, its KV blocks are freed, and the scheduler hands its slot to the next request in the queue.'],
];
export function mountLifecycle(fig) {
  const host = fig.querySelector('.stage3d'), out = fig.querySelector('.out3'), list = fig.querySelector('.steps3');
  const S = stage(host, { cam: [-0.5, 10.5, 20], target: [-0.3, 1.6, 0] });
  if (!S) return;
  const { scene } = S;
  const st = { i: 0, playing: !reduceMotion, t: 0 };
  // stations along x
  const X = { agent: -8.2, api: -4.4, tok: -1.8, queue: 1.2, eng: 6.2 };
  const agent = box(2, 1.2, 1.6, COL.chassis, { r: 0.12 }); agent.position.set(X.agent, 0.6, 0); scene.add(agent);
  label(agent, 'your agent', 'cap', new V3(0, 1.3, 0));
  const shell = box(15.2, 4.6, 5.2, COL.glass, { opacity: 0.12, rough: 0.1, cast: false }); shell.position.set(1.4, 2.3, 0); scene.add(shell);
  label(shell, 'NIM container', 'q', new V3(-6.6, 2.6, 2.6));
  const api = box(1.8, 1.1, 1.6, 0x76b900, { r: 0.1 }); api.position.set(X.api, 0.55, 0); scene.add(api);
  label(api, 'API server<br><small>OpenAI-compatible</small>', 'cap', new V3(0, 1.2, 0));
  const tok = box(1.6, 1.1, 1.6, COL.serve, { r: 0.1 }); tok.position.set(X.tok, 0.55, 0); scene.add(tok);
  label(tok, 'tokenizer', 'cap', new V3(0, 1.2, 0));
  const queue = box(2.6, 0.25, 1.4, 0x9aa5b1, { r: 0.05 }); queue.position.set(X.queue, 0.13, 0); scene.add(queue);
  label(queue, 'queue and scheduler', 'cap', new V3(0, 1.6, 0));
  const waiting = [0, 1, 2].map(i => { const m = box(0.45, 0.45, 0.45, LAYER_COLS[i + 4], { r: 0.06 }); m.position.set(X.queue - 0.8 + i * 0.6, 0.5, 0); scene.add(m); return m; });
  // engine: 4 GPUs holding layer slices
  const engBase = box(5.6, 0.3, 3.2, COL.chassis, { r: 0.08 }); engBase.position.set(X.eng, 0.15, 0); scene.add(engBase);
  label(engBase, 'inference engine on 4 GPUs', 'cap', new V3(0, 3.95, 0));
  const gpus = [0, 1, 2, 3].map(i => {
    const g = box(1.05, 3.2, 2.2, COL.glass, { opacity: 0.28, rough: 0.1, cast: false });
    g.position.set(X.eng - 2.0 + i * 1.33, 1.9, 0); scene.add(g);
    const layers = LAYER_COLS.map((c, k) => { const m = box(0.9, 0.12, 0.9, c, { r: 0.01, glow: 0.1 }); m.position.set(g.position.x, 0.5 + k * 0.17, -0.45); scene.add(m); return m; });
    label(g, 'GPU ' + (i + 1), 'cap', new V3(0, -1.85, 1.15));
    return { g, layers, kv: [] };
  });
  const beam = box(5.4, 0.14, 0.3, COL.nvlink, { glow: 2.4, opacity: 0.95, cast: false }); beam.position.set(X.eng, 0.5, 1.2); scene.add(beam);
  const req = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), material(COL.token, { glow: 1.2 })); scene.add(req);
  const tokens = [], outTokens = [];
  for (let i = 0; i < 6; i++) { const m = box(0.28, 0.28, 0.28, COL.serve, { r: 0.04, glow: 0.4 }); m.visible = false; scene.add(m); tokens.push(m); }
  for (let i = 0; i < 8; i++) { const m = box(0.26, 0.26, 0.26, COL.ok, { r: 0.04, glow: 0.5 }); m.visible = false; scene.add(m); outTokens.push(m); }
  const kvPool = [];
  for (let i = 0; i < 48; i++) { const m = box(0.2, 0.16, 0.2, COL.kv, { r: 0.02, glow: 0.3 }); m.visible = false; scene.add(m); kvPool.push(m); }
  const caption = label(scene, '', 'q', new V3(0, 5.6, 0));
  // list of stages as buttons
  if (list) {
    list.innerHTML = STAGES.map((s, i) => '<button data-stage="' + i + '" aria-pressed="' + (i === 0) + '">' + (i + 1) + '. ' + s[0] + '</button>').join('');
    list.querySelectorAll('[data-stage]').forEach(b => b.addEventListener('click', () => go(+b.dataset.stage, false)));
  }
  const playBtn = fig.querySelector('[data-play]');
  function go(i, keepPlaying) {
    st.i = (i + STAGES.length) % STAGES.length; st.t = 0;
    if (!keepPlaying) { st.playing = false; if (playBtn) { playBtn.textContent = 'Play'; playBtn.setAttribute('aria-pressed', 'false'); } }
    if (list) list.querySelectorAll('[data-stage]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.stage === st.i));
    out.innerHTML = '<strong>' + (st.i + 1) + '. ' + STAGES[st.i][0] + ':</strong> ' + STAGES[st.i][1];
  }
  fig.querySelector('[data-prev]')?.addEventListener('click', () => go(st.i - 1, false));
  fig.querySelector('[data-next]')?.addEventListener('click', () => go(st.i + 1, false));
  playBtn?.addEventListener('click', () => { st.playing = !st.playing; playBtn.textContent = st.playing ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', st.playing); });
  const P = (x, y, z = 0) => new V3(x, y, z);
  const glow = (m, on) => { m.material.emissiveIntensity = on ? 0.55 : 0.05; };
  S.tick((dt, t) => {
    st.t += dt;
    if (st.playing && st.t > 4.2) go(st.i + 1, true);
    const u = Math.min(1, st.t / 1.6), e = u * u * (3 - 2 * u), i = st.i;
    [api, tok, queue, engBase].forEach(m => glow(m, false));
    req.visible = i <= 3;
    tokens.forEach(m => { m.visible = false; });
    outTokens.forEach(m => { m.visible = false; });
    beam.visible = false;
    const kvCount = i < 4 ? 0 : i === 4 ? Math.floor(e * 24) : i === 5 ? 24 : i === 6 ? 24 + Math.floor((st.t % 4.2) / 4.2 * 24) : i === 7 ? 48 : 0;
    kvPool.forEach((m, k) => {
      m.visible = k < kvCount;
      if (!m.visible) return;
      const g = k % 4, row = Math.floor(k / 4);
      m.position.set(gpus[g].g.position.x + (row % 2 ? 0.22 : -0.22), 0.45 + Math.floor(row / 2) * 0.19, 0.55);
    });
    if (i === 0) { req.position.lerpVectors(P(X.agent + 1, 0.8), P(X.api - 0.9, 0.8), e); caption.element.textContent = 'POST /v1/chat/completions'; }
    if (i === 1) { req.position.copy(P(X.api, 1.4 + Math.sin(t * 4) * 0.08)); glow(api, true); caption.element.textContent = 'messages → prompt (chat template)'; }
    if (i === 2) {
      glow(tok, true); req.visible = u < 0.4; req.position.copy(P(X.tok, 1.4));
      tokens.forEach((m, k) => { m.visible = true; m.position.lerpVectors(P(X.tok, 1.3), P(X.tok + 0.9 + k * 0.34, 1.6 + Math.sin(k) * 0.1), e); });
      caption.element.textContent = '"Classify this support ticket" → 6 token ids';
    }
    if (i === 3) {
      glow(queue, true); req.visible = false;
      tokens.forEach((m, k) => { m.visible = true; m.position.lerpVectors(P(X.tok + 0.9 + k * 0.34, 1.6), P(X.queue + 0.9 + k * 0.08, 0.55 + k * 0.29), e); });
      waiting.forEach((m, k) => { m.position.x = X.queue - 0.8 + k * 0.6 - e * 0.3; });
      caption.element.textContent = 'waits for a free batch slot';
    }
    if (i === 4) {
      glow(engBase, true);
      tokens.forEach((m, k) => { m.visible = u < 1; m.position.lerpVectors(P(X.queue + 1, 0.6 + k * 0.29), P(gpus[k % 4].g.position.x, 3.2), e); });
      caption.element.textContent = 'prefill: the whole prompt in one pass, KV cache filling';
    }
    if (i === 5 || i === 6) {
      glow(engBase, true); beam.visible = true;
      beam.position.y = 0.5 + ((t * 1.4) % 1) * 1.3;
      beam.material.opacity = 0.5 + 0.4 * Math.sin(t * 9) ** 2;
      if (i === 6) {
        const n = Math.floor((st.t % 4.2) / 4.2 * 8);
        outTokens.forEach((m, k) => { m.visible = k <= n; m.position.set(X.eng + 3.4 + (k % 4) * 0.34, 0.5 + Math.floor(k / 4) * 0.34, 0); });
      }
      caption.element.textContent = i === 5 ? 'every layer: compute slices, swap over NVLink' : 'decode: one token per step, batch shared';
    }
    if (i === 7) {
      outTokens.forEach((m, k) => {
        m.visible = true;
        const v = Math.max(0, Math.min(1, (st.t - k * 0.25) / 1.6));
        m.position.lerpVectors(P(X.eng + 3.4 + (k % 4) * 0.34, 0.5 + Math.floor(k / 4) * 0.34), P(X.agent + 0.4 + k * 0.05, 1.4 + k * 0.3, 1.4), v);
        m.position.y += Math.sin(v * Math.PI) * 2.6;
      });
      caption.element.textContent = 'token ids → text, streamed back word by word';
    }
    if (i === 8) {
      waiting.forEach((m, k) => { m.position.lerpVectors(P(X.queue - 1.1 + k * 0.6, 0.5), k === 0 ? P(gpus[0].g.position.x, 3.4) : P(X.queue - 0.5 + k * 0.6, 0.5), e); });
      caption.element.textContent = 'KV blocks freed, the next request takes the slot';
    } else if (i !== 3) waiting.forEach((m, k) => { m.position.set(X.queue - 0.8 + k * 0.6, 0.5, 0); });
    caption.position.set(i <= 0 ? X.api - 2 : i === 1 ? X.api : i === 2 ? X.tok : i === 3 ? X.queue : i === 7 ? 0 : X.eng, 5.1, 0);
  });
  go(0, true);
}
