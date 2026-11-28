// Block Town people: chunky blocky 3D toy people (rounded-cube head, box torso, box limbs) with a drawn, acting face.
// They are REAL 3D (not cut-outs): they turn, walk, wave, sit and dance in the set, cast shadows and catch the light.
//   const p = new Blocky(look, { scale })   ·  scene.add(p.group)  ·  p.at(x, y, z)  ·  p.turn(deg) / p.faceTo(x, z)
//   p.set(state)  (call every frame; cheap — the face redraws only when the expression changes)
// look  = { skin, shirt, outfit: tee│hoodie│shirt│jacket│uniform│coat│dress, accent, pattern: none│stripes│plaid│star│number,
//           pants, shoes, sleeves: long│short, hair: none│buzz│spiky│swoop│bob│long│curly│bun, hairCol,
//           hat: none│cap│beanie│ranger│top│helmet│hood, hatCol, face: [glasses, mustache, beard, freckles, blush, bandage] }
// state = { mood: neutral│happy│grin│laugh│shock│scared│worried│angry│sad│smug│sly│tired│dizzy, look: [dx, dy], blink, talk,
//           armL / armR: [raise°, out°] (0 = hanging, 90 = forward, 180 = straight up; out = sideways),
//           legs: stand│walk│run│sit, phase, lean°, turn° (adds to .turn), headYaw°, headTilt°, bob (m), jump (m) }
import * as THREE from 'three';

const R = Math.PI / 180;
export const INK = '#15131C';
export const SKINS = ['#F3CFA6', '#E7B58A', '#C98C5E', '#9A6440', '#6E4630', '#F6DCC2'];

/** a box with rounded edges (r = corner radius) */
export function roundedBox(w, h, d, r = 0.08, seg = 5) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3(), inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = new THREE.Vector3(THREE.MathUtils.clamp(v.x, -inner.x, inner.x), THREE.MathUtils.clamp(v.y, -inner.y, inner.y), THREE.MathUtils.clamp(v.z, -inner.z, inner.z));
    const n = v.clone().sub(c); if (n.lengthSq() > 1e-9) n.normalize().multiplyScalar(r); v.copy(c).add(n); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
const plastic = (o) => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0, ...o });
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function mesh(geo, m, x = 0, y = 0, z = 0, parent) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; if (parent) parent.add(o); return o; }

// ---------------------------------------------------------------- the face (drawn, 256 x 256, transparent)
/** draw a Block Town face. Also used flat on the style sheet. */
export function drawFace(g, st = {}, look = {}) {
  const m = st.mood || 'neutral', [lx, ly] = st.look || [0, 0], blink = st.blink || 0, talk = st.talk || 0, F = look.face || [];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.fillStyle = INK;
  const ex = [84, 172], ey = 100;
  // brows (thick, they carry most of the emotion)
  const brow = { neutral: [0, 0], happy: [-6, -6], grin: [-4, -4], laugh: [-10, -10], shock: [-20, -20], scared: [-16, -16], worried: [12, -12], angry: [-14, 14], sad: [14, -14], smug: [-10, 4], sly: [6, -8], tired: [8, 8], dizzy: [0, 0] }[m] || [0, 0];
  g.lineWidth = 11;
  [[0, brow[0]], [1, brow[1]]].forEach(([i, tilt]) => {
    const x = ex[i], s = i ? 1 : -1, y = ey - 46 + (m === 'shock' || m === 'scared' ? -10 : 0);
    g.beginPath(); g.moveTo(x - 26, y + (s < 0 ? -tilt : tilt) * 0.5 * s); g.lineTo(x + 26, y - (s < 0 ? -tilt : tilt) * 0.5 * s); g.stroke();
  });
  // eyes: white with a black pupil (closed arcs for happy / laugh, a line when blinking)
  ex.forEach((x, i) => {
    if (m === 'dizzy') { g.lineWidth = 6; g.beginPath(); for (let a = 0; a < 14; a += 0.35) g.lineTo(x + Math.cos(a) * a * 1.6, ey + Math.sin(a) * a * 1.6); g.stroke(); return; }
    if (m === 'laugh' || (m === 'happy' && blink < 0.5)) { g.lineWidth = 10; g.beginPath(); g.arc(x, ey + 10, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; }
    if (blink > 0.5 || m === 'tired') { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 20, ey + 4); g.quadraticCurveTo(x, ey + (m === 'tired' ? 12 : 10), x + 20, ey + 4); g.stroke(); return; }
    const big = m === 'shock' || m === 'scared' ? 1.28 : 1;
    g.fillStyle = '#FFFFFF'; g.lineWidth = 7; g.beginPath(); g.ellipse(x, ey, 22 * big, 26 * big, 0, 0, 7); g.fill(); g.stroke();
    const pr = m === 'scared' ? 6 : m === 'shock' ? 8 : 11;
    g.fillStyle = INK; g.beginPath(); g.arc(x + lx * 9, ey + 3 + ly * 9, pr, 0, 7); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + lx * 9 + 4, ey - 2 + ly * 9, 3.5, 0, 7); g.fill();
    if (m === 'smug' || m === 'sly') { g.fillStyle = look.skin || SKINS[0]; g.fillRect(x - 28, ey - 34, 56, 30); g.lineWidth = 8; g.beginPath(); g.moveTo(x - 23, ey - 4); g.lineTo(x + 23, ey - 4); g.stroke(); }
  });
  // mouth
  const mx = 128, my = 182; g.lineWidth = 9; g.fillStyle = INK;
  const open = Math.max(talk, m === 'shock' ? 1 : m === 'laugh' ? 0.9 : 0);
  if (m === 'grin' || m === 'laugh') {
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(mx - 46, my - 10); g.quadraticCurveTo(mx, my - 2, mx + 46, my - 10); g.quadraticCurveTo(mx + 40, my + 30 + open * 10, mx, my + 34 + open * 10); g.quadraticCurveTo(mx - 40, my + 30 + open * 10, mx - 46, my - 10); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(mx - 40, my + 6); g.quadraticCurveTo(mx, my + 14, mx + 40, my + 6); g.stroke();
  } else if (open > 0.05) {
    g.fillStyle = '#4A1F2A'; g.beginPath(); g.ellipse(mx, my + 8, 16 + open * 8, 6 + open * 20, 0, 0, 7); g.fill(); g.stroke();
  } else if (m === 'happy' || m === 'smug' || m === 'sly') {
    g.beginPath(); if (m === 'happy') { g.moveTo(mx - 30, my); g.quadraticCurveTo(mx, my + 26, mx + 30, my); } else { g.moveTo(mx - 24, my + 8); g.quadraticCurveTo(mx + 6, my + 16, mx + 30, my - 6); } g.stroke();
  } else if (m === 'sad' || m === 'worried' || m === 'scared') {
    g.beginPath(); if (m === 'sad') { g.moveTo(mx - 24, my + 14); g.quadraticCurveTo(mx, my - 6, mx + 24, my + 14); } else { g.moveTo(mx - 26, my + 6); for (let k = 0; k <= 6; k++) g.lineTo(mx - 26 + k * 8.7, my + 6 + (k % 2 ? -7 : 7)); } g.stroke();
  } else if (m === 'angry') {
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(mx - 30, my - 4, 60, 22, 6); g.fill(); g.stroke(); g.lineWidth = 3; [-15, 0, 15].forEach((d) => { g.beginPath(); g.moveTo(mx + d, my - 4); g.lineTo(mx + d, my + 18); g.stroke(); });
  } else { g.beginPath(); g.moveTo(mx - 18, my + 6); g.lineTo(mx + 18, my + 6); g.stroke(); }
  // extras drawn on the face
  if (F.includes('freckles')) { g.fillStyle = shade(look.skin || SKINS[0], 0.62); [[-60, 140], [-48, 150], [-66, 156], [48, 140], [60, 150], [42, 156]].forEach(([x, y]) => { g.beginPath(); g.arc(128 + x, y, 4, 0, 7); g.fill(); }); }
  if (F.includes('blush') || m === 'laugh') { g.fillStyle = 'rgba(230,90,110,0.45)'; [-70, 70].forEach((x) => { g.beginPath(); g.ellipse(128 + x, 146, 20, 11, 0, 0, 7); g.fill(); }); }
  if (F.includes('mustache')) { g.fillStyle = look.hairCol || '#3B2A20'; g.beginPath(); g.moveTo(mx - 44, my - 6); g.quadraticCurveTo(mx - 20, my - 34, mx, my - 18); g.quadraticCurveTo(mx + 20, my - 34, mx + 44, my - 6); g.quadraticCurveTo(mx + 20, my - 16, mx, my - 10); g.quadraticCurveTo(mx - 20, my - 16, mx - 44, my - 6); g.fill(); }
  if (F.includes('beard')) { g.fillStyle = look.hairCol || '#3B2A20'; g.globalAlpha = 0.92; g.beginPath(); g.moveTo(30, 150); g.quadraticCurveTo(40, 250, 128, 256); g.quadraticCurveTo(216, 250, 226, 150); g.quadraticCurveTo(200, 236, 128, 230); g.quadraticCurveTo(56, 236, 30, 150); g.fill(); g.globalAlpha = 1; }
  if (F.includes('glasses')) { g.strokeStyle = INK; g.lineWidth = 7; ex.forEach((x) => { g.beginPath(); g.roundRect(x - 34, ey - 30, 68, 58, 12); g.stroke(); }); g.beginPath(); g.moveTo(118, ey - 4); g.lineTo(138, ey - 4); g.stroke(); }
  if (F.includes('bandage')) { g.save(); g.translate(196, 150); g.rotate(-0.5); g.fillStyle = '#F2E6CF'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(-30, -10, 60, 20, 8); g.fill(); g.stroke(); g.restore(); }
  if (st.sweat) { g.fillStyle = '#7FD3F5'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(226, 36); g.quadraticCurveTo(240, 60, 232, 70); g.quadraticCurveTo(218, 76, 216, 62); g.quadraticCurveTo(218, 50, 226, 36); g.fill(); g.stroke(); }
  if (st.tears) { g.fillStyle = '#7FD3F5'; [ex[0], ex[1]].forEach((x) => { g.beginPath(); g.ellipse(x, ey + 44, 7, 14, 0, 0, 7); g.fill(); }); }
  g.restore();
}

// ---------------------------------------------------------------- clothes textures
function torsoTex(look) {
  const c = canvas(256, 256), g = c.getContext('2d'), sh = look.shirt, ac = look.accent || shade(sh, 0.7), o = look.outfit || 'tee';
  g.fillStyle = sh; g.fillRect(0, 0, 256, 256);
  const pat = look.pattern || 'none';
  if (pat === 'stripes') { g.fillStyle = ac; for (let y = 10; y < 256; y += 44) g.fillRect(0, y, 256, 18); }
  if (pat === 'plaid') { g.globalAlpha = 0.45; g.fillStyle = ac; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 24, 256); for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 24); g.globalAlpha = 1; g.strokeStyle = shade(ac, 0.6); g.lineWidth = 3; for (let x = 12; x < 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } }
  if (o === 'hoodie') { g.fillStyle = shade(sh, 0.82); g.beginPath(); g.roundRect(54, 150, 148, 70, 14); g.fill(); g.strokeStyle = shade(sh, 0.6); g.lineWidth = 4; g.stroke(); g.strokeStyle = '#F2EEE6'; g.lineWidth = 5; [110, 146].forEach((x) => { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 70); g.stroke(); }); }
  if (o === 'shirt' || o === 'jacket' || o === 'coat') {
    const inner = o === 'shirt' ? sh : (look.under || '#F2EEE6');
    if (o !== 'shirt') { g.fillStyle = inner; g.beginPath(); g.moveTo(90, 0); g.lineTo(166, 0); g.lineTo(150, 170); g.lineTo(106, 170); g.closePath(); g.fill(); }
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(92, 0); g.lineTo(128, 34); g.lineTo(108, 52); g.closePath(); g.fill(); g.beginPath(); g.moveTo(164, 0); g.lineTo(128, 34); g.lineTo(148, 52); g.closePath(); g.fill();
    if (look.tie !== false && o !== 'coat') { g.fillStyle = look.tieCol || '#B8283A'; g.beginPath(); g.moveTo(120, 34); g.lineTo(136, 34); g.lineTo(142, 150); g.lineTo(128, 168); g.lineTo(114, 150); g.closePath(); g.fill(); }
    if (o !== 'shirt') { g.strokeStyle = shade(sh, 0.6); g.lineWidth = 5; g.beginPath(); g.moveTo(90, 0); g.lineTo(108, 120); g.moveTo(166, 0); g.lineTo(148, 120); g.stroke(); }
    if (o === 'coat') { g.fillStyle = shade(sh, 0.86); g.fillRect(30, 170, 50, 40); g.fillRect(176, 170, 50, 40); }
  }
  if (o === 'uniform') { g.fillStyle = shade(sh, 0.84); [[34, 60], [158, 60]].forEach(([x, y]) => { g.fillRect(x, y, 64, 52); g.strokeStyle = shade(sh, 0.6); g.lineWidth = 4; g.strokeRect(x, y, 64, 52); }); g.fillStyle = '#E8C060'; g.beginPath(); g.moveTo(60, 30); g.lineTo(72, 44); g.lineTo(60, 58); g.lineTo(48, 44); g.closePath(); g.fill(); g.fillStyle = '#3A2A20'; g.fillRect(0, 226, 256, 30); g.fillStyle = '#C9A24A'; g.fillRect(112, 226, 32, 30); }
  if (o === 'dress') { g.fillStyle = ac; g.fillRect(0, 200, 256, 56); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(128, 0, 40, 0, Math.PI); g.fill(); }
  if (pat === 'star') { g.save(); g.translate(128, 110); g.fillStyle = ac; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 42, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
  if (pat === 'number') { g.fillStyle = ac; g.font = '900 120px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(look.number ?? 7), 128, 124); }
  if (o === 'tee' || o === 'dress') { g.fillStyle = shade(sh, 0.7); g.beginPath(); g.arc(128, 0, 34, 0, Math.PI); g.fill(); }
  return tex(c);
}
function legTex(look) {
  const c = canvas(64, 128), g = c.getContext('2d');
  g.fillStyle = look.pants || '#2E3A55'; g.fillRect(0, 0, 64, 128);
  if (look.outfit === 'dress') { g.fillStyle = look.skin || SKINS[0]; g.fillRect(0, 0, 64, 128); }
  g.fillStyle = shade(look.pants || '#2E3A55', 0.8); g.fillRect(0, 0, 64, 8);
  g.fillStyle = look.shoes || '#1E1E24'; g.fillRect(0, 106, 64, 22); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 106, 64, 4);
  return tex(c);
}

// ---------------------------------------------------------------- hair + hats (3D)
function buildHair(head, look, hw, hh) {
  const col = look.hairCol || '#4A2E1E', m = plastic({ color: col, roughness: 0.7 }), top = hh / 2, k = look.hair || 'none', g = new THREE.Group(); head.add(g);
  if (k === 'none') return g;
  const cap = (th = 0.1, back = true) => { mesh(roundedBox(hw + 0.04, th, hw + 0.04, 0.04, 3), m, 0, top + th / 2 - 0.02, -0.01, g); if (back) mesh(roundedBox(hw + 0.04, hh * 0.7, 0.08, 0.03, 3), m, 0, top - hh * 0.3, -hw / 2 - 0.02, g); };
  if (k === 'buzz') cap(0.05, false);
  if (k === 'spiky') { cap(0.08); for (let i = 0; i < 7; i++) { const s = mesh(new THREE.ConeGeometry(0.07, 0.2, 4), m, -0.22 + i * 0.075, top + 0.12, -0.02 + (i % 2) * 0.06, g); s.rotation.z = (i - 3) * 0.18; s.rotation.x = -0.3; } }
  if (k === 'swoop') { cap(0.1); const f = mesh(roundedBox(hw * 0.95, 0.12, 0.2, 0.05, 3), m, 0.04, top - 0.02, hw / 2 - 0.02, g); f.rotation.z = -0.18; f.rotation.x = 0.35; [-1, 1].forEach((s) => mesh(roundedBox(0.06, hh * 0.45, hw * 0.8, 0.03, 3), m, s * (hw / 2 + 0.02), top - hh * 0.2, -0.02, g)); }
  if (k === 'bob' || k === 'long') { cap(0.11); const len = k === 'long' ? hh * 1.35 : hh * 0.75; [-1, 1].forEach((s) => mesh(roundedBox(0.08, len, hw * 0.9, 0.035, 3), m, s * (hw / 2 + 0.03), top - len / 2 + 0.02, -0.03, g)); mesh(roundedBox(hw + 0.06, len, 0.1, 0.04, 3), m, 0, top - len / 2 + 0.02, -hw / 2 - 0.03, g); const fr = mesh(roundedBox(hw * 0.9, 0.1, 0.08, 0.04, 3), m, 0, top - 0.04, hw / 2 + 0.01, g); }
  if (k === 'curly') { for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = 0.2 + (i % 3) * 0.06; mesh(new THREE.IcosahedronGeometry(0.11 + (i % 2) * 0.03, 1), m, Math.cos(a) * r, top + 0.06 + (i % 4) * 0.03, Math.sin(a) * r * 0.9 - 0.04, g); } [-1, 1].forEach((s) => mesh(new THREE.IcosahedronGeometry(0.13, 1), m, s * (hw / 2 + 0.06), top - 0.12, -0.02, g)); }
  if (k === 'bun') { cap(0.1); mesh(new THREE.SphereGeometry(0.13, 14, 10), m, 0, top + 0.12, -hw / 2 + 0.02, g); }
  return g;
}
function buildHat(head, look, hw, hh) {
  const k = look.hat || 'none', col = look.hatCol || '#3A4A38', m = plastic({ color: col, roughness: 0.6 }), top = hh / 2, g = new THREE.Group(); head.add(g);
  if (k === 'cap') { mesh(roundedBox(hw + 0.06, 0.16, hw + 0.06, 0.06, 3), m, 0, top + 0.05, 0, g); mesh(roundedBox(hw * 0.9, 0.04, 0.24, 0.02, 2), m, 0, top - 0.01, hw / 2 + 0.12, g); }
  if (k === 'beanie') { mesh(roundedBox(hw + 0.07, 0.24, hw + 0.07, 0.09, 4), m, 0, top + 0.06, 0, g); mesh(roundedBox(hw + 0.09, 0.08, hw + 0.09, 0.03, 2), plastic({ color: shade(col, 0.8) }), 0, top - 0.04, 0, g); }
  if (k === 'ranger') { const b = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 24), m, 0, top + 0.02, 0, g); const cr = mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.24, 4), m, 0, top + 0.15, 0, g); cr.rotation.y = Math.PI / 4; mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.05, 24), plastic({ color: '#2A2218' }), 0, top + 0.06, 0, g); }
  if (k === 'top') { mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 24), m, 0, top + 0.02, 0, g); mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 24), m, 0, top + 0.24, 0, g); mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.06, 24), plastic({ color: '#B8283A' }), 0, top + 0.08, 0, g); }
  if (k === 'helmet') { const h = mesh(new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, top - 0.06, 0, g); h.scale.set(1, 0.8, 1); mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 24), m, 0, top - 0.05, 0.02, g); }
  if (k === 'hood') { mesh(roundedBox(hw + 0.12, hh + 0.12, 0.2, 0.08, 3), m, 0, 0.02, -hw / 2 - 0.06, g); mesh(roundedBox(hw + 0.12, 0.12, hw + 0.08, 0.05, 3), m, 0, top + 0.03, -0.04, g); [-1, 1].forEach((s) => mesh(roundedBox(0.07, hh + 0.06, hw * 0.8, 0.03, 3), m, s * (hw / 2 + 0.06), 0, -0.02, g)); }
  return g;
}

// ---------------------------------------------------------------- the person
export class Blocky {
  constructor(look = {}, { scale = 1 } = {}) {
    this.look = { skin: SKINS[0], shirt: '#3A7BD5', pants: '#2E3A55', shoes: '#1E1E24', outfit: 'tee', sleeves: 'long', hair: 'swoop', hairCol: '#4A2E1E', hat: 'none', face: [], ...look };
    const L = this.look;
    this.group = new THREE.Group(); this.root = new THREE.Group(); this.group.add(this.root); this.group.scale.setScalar(scale);
    this.baseTurn = 0;
    const skin = plastic({ color: L.skin });
    // legs (pivot at the hips, y 0.82)
    const legM = plastic({ map: legTex(L), roughness: 0.6 }), legEnd = plastic({ color: L.pants });
    this.legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.165, 0.82, 0); this.root.add(p); mesh(roundedBox(0.31, 0.82, 0.32, 0.04, 2), [legM, legM, legEnd, plastic({ color: L.shoes }), legM, legM], 0, -0.41, 0, p); return p; });
    // torso (y 0.82 .. 1.58)
    const tT = torsoTex(L), side = plastic({ color: L.shirt }), back = plastic({ color: L.shirt });
    this.torso = mesh(roundedBox(0.66, 0.76, 0.34, 0.05, 3), [side, side, side, side, plastic({ map: tT }), back], 0, 1.2, 0, this.root);
    if (L.outfit === 'dress') { const sk = mesh(new THREE.CylinderGeometry(0.36, 0.5, 0.42, 4, 1), plastic({ color: L.accent || shade(L.shirt, 0.8) }), 0, 0.72, 0, this.root); sk.rotation.y = Math.PI / 4; }
    if (L.outfit === 'coat') mesh(roundedBox(0.68, 0.38, 0.36, 0.04, 2), plastic({ color: L.shirt }), 0, 0.66, 0, this.root);
    // arms (pivot at the shoulders)
    const slv = plastic({ color: L.sleeves === 'short' ? L.skin : (L.outfit === 'coat' || L.outfit === 'jacket' || L.outfit === 'uniform' ? L.shirt : L.shirt) });
    this.arms = [-1, 1].map((s) => {
      const p = new THREE.Group(); p.position.set(s * 0.47, 1.5, 0); this.root.add(p);
      if (L.sleeves === 'short') { mesh(roundedBox(0.27, 0.26, 0.29, 0.04, 2), plastic({ color: L.shirt }), 0, -0.1, 0, p); mesh(roundedBox(0.25, 0.5, 0.27, 0.04, 2), skin, 0, -0.45, 0, p); }
      else { mesh(roundedBox(0.26, 0.6, 0.28, 0.04, 2), slv, 0, -0.27, 0, p); mesh(roundedBox(0.24, 0.17, 0.26, 0.05, 2), skin, 0, -0.66, 0, p); }
      return p;
    });
    // head (pivot at the neck)
    this.neck = new THREE.Group(); this.neck.position.set(0, 1.6, 0); this.root.add(this.neck);
    const hw = 0.56, hh = 0.52; this.head = new THREE.Group(); this.head.position.y = hh / 2 + 0.02; this.neck.add(this.head);
    mesh(roundedBox(hw, hh, hw, 0.12, 5), skin, 0, 0, 0, this.head);
    this.faceCanvas = canvas(256, 256); this.faceCtx = this.faceCanvas.getContext('2d'); this.faceTex = tex(this.faceCanvas);
    const fm = new THREE.MeshStandardMaterial({ map: this.faceTex, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 0.86, hh * 0.86), fm); face.position.z = hw / 2 + 0.002; this.head.add(face);
    this.hair = buildHair(this.head, L, hw, hh); this.hat = buildHat(this.head, L, hw, hh);
    if (L.hat === 'helmet' || L.hat === 'top' || L.hat === 'ranger' || L.hat === 'beanie' || L.hat === 'cap' || L.hat === 'hood') { this.hair.children.forEach((c) => { if (c.position.y > hh / 2 - 0.05) c.visible = false; }); }
    this.faceKey = ''; this.set({});
  }
  at(x, y = 0, z = 0) { this.group.position.set(x, y, z); return this; }
  turn(deg) { this.baseTurn = deg; this.group.rotation.y = deg * R; return this; }
  /** turn to face a point (x, z) on the ground */
  faceTo(x, z) { const p = this.group.position; return this.turn(Math.atan2(x - p.x, z - p.z) / R); }
  set(st = {}) {
    const S = { mood: 'neutral', look: [0, 0], blink: 0, talk: 0, armL: [4, 4], armR: [4, 4], legs: 'stand', phase: 0, lean: 0, turn: 0, headYaw: 0, headTilt: 0, bob: 0, jump: 0, ...st };
    const key = [S.mood, S.look.map((v) => v.toFixed(1)).join(','), S.blink > 0.5 ? 1 : 0, (S.talk || 0).toFixed(1), S.sweat ? 1 : 0, S.tears ? 1 : 0].join('|');
    if (key !== this.faceKey) { this.faceKey = key; const g = this.faceCtx; g.clearRect(0, 0, 256, 256); drawFace(g, S, this.look); this.faceTex.needsUpdate = true; }
    const walk = S.legs === 'walk', run = S.legs === 'run', sit = S.legs === 'sit', amp = run ? 55 : walk ? 30 : 0, sw = Math.sin(S.phase);
    this.legs[0].rotation.x = sit ? -90 * R : sw * amp * R; this.legs[1].rotation.x = sit ? -90 * R : -sw * amp * R;
    const armSwing = (walk || run) ? sw * amp * 0.8 : 0;
    [[this.arms[0], S.armL, -1, armSwing], [this.arms[1], S.armR, 1, -armSwing]].forEach(([a, [raise, out], s, swing]) => { a.rotation.order = 'ZXY'; a.rotation.x = -(raise + swing) * R; a.rotation.z = s * out * R; });
    this.root.position.y = (sit ? -0.38 : 0) + S.bob + S.jump + ((walk || run) ? Math.abs(Math.cos(S.phase)) * (run ? 0.08 : 0.03) : 0);
    this.root.rotation.x = (S.lean + (run ? 12 : 0)) * R;
    this.group.rotation.y = (this.baseTurn + S.turn) * R;
    this.neck.rotation.y = S.headYaw * R; this.neck.rotation.z = -S.headTilt * R;
    return this;
  }
  /** recolour the face texture plane (e.g. under a coloured light) is not needed: the face is lit like the rest */
}

/** a ready-made cast (original looks). Pick by name or build your own. */
export const CAST = {
  hero: { skin: SKINS[1], shirt: '#E8603C', outfit: 'hoodie', pants: '#2E3A55', hair: 'swoop', hairCol: '#5A3420' },
  friend: { skin: SKINS[3], shirt: '#3FA7D6', outfit: 'tee', pattern: 'star', accent: '#F2C230', pants: '#22314A', hair: 'curly', hairCol: '#1E1712' },
  ranger: { skin: SKINS[0], shirt: '#6E7A44', outfit: 'uniform', pants: '#2F3A2A', shoes: '#3A2A20', hat: 'ranger', hatCol: '#4E5236', hair: 'buzz', hairCol: '#3B2A20', face: ['mustache'] },
  boss: { skin: SKINS[2], shirt: '#2A2F3E', outfit: 'jacket', pants: '#1E222C', hair: 'buzz', hairCol: '#1E1712', tieCol: '#C8283A', face: ['glasses'] },
  kid: { skin: SKINS[5], shirt: '#F2C230', outfit: 'tee', pattern: 'number', number: 3, accent: '#C8283A', pants: '#3A7BD5', hair: 'spiky', hairCol: '#C8642E', face: ['freckles'] },
  scientist: { skin: SKINS[4], shirt: '#F2F2EE', outfit: 'coat', under: '#4FB3A9', pants: '#3A3F4A', hair: 'bun', hairCol: '#2A1E16', face: ['glasses'] },
  neighbor: { skin: SKINS[0], shirt: '#B98ACF', outfit: 'dress', accent: '#8C5FB0', hair: 'long', hairCol: '#E0B060', face: ['blush'] },
  nervous: { skin: SKINS[5], shirt: '#F2EEE6', outfit: 'shirt', tieCol: '#9A2A3A', pattern: 'none', pants: '#9C9C9C', hair: 'curly', hairCol: '#E2662A' },
};

// ---------------------------------------------------------------- creatures (original designs, giant scale)
/** a tall thin creature: long jointed limbs, small head, glowing eyes, optional wide grin. height in metres.
 *  .set({ phase, walk (0..1), reach (0..1 arm reach forward), grin (0..1), sway }) */
export class Lanky {
  constructor({ height = 7, col = '#2B2733', eye = '#FFF3B0', grin = true } = {}) {
    this.group = new THREE.Group(); const s = height / 7, m = plastic({ color: col, roughness: 0.75 });
    this.s = s; this.root = new THREE.Group(); this.group.add(this.root);
    const limb = (len, r) => { const p = new THREE.Group(); mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 8), m, 0, -len / 2, 0, p); return p; };
    // legs: thigh + shin
    this.legs = [-1, 1].map((k) => { const hip = new THREE.Group(); hip.position.set(k * 0.35 * s, 3.6 * s, 0); this.root.add(hip); const th = limb(1.9 * s, 0.13 * s); hip.add(th); const kn = new THREE.Group(); kn.position.y = -1.9 * s; th.add(kn); kn.add(limb(1.8 * s, 0.1 * s)); return { hip, th, kn }; });
    // body: a thin ribbed torso
    const torso = new THREE.Group(); torso.position.y = 3.6 * s; this.root.add(torso); this.torso = torso;
    mesh(new THREE.CylinderGeometry(0.32 * s, 0.22 * s, 2.1 * s, 8), m, 0, 1.05 * s, 0, torso);
    for (let i = 0; i < 5; i++) mesh(new THREE.TorusGeometry(0.3 * s, 0.025 * s, 6, 16), plastic({ color: shade(col, 1.25), roughness: 0.8 }), 0, (1.2 + i * 0.16) * s, 0, torso).rotation.x = Math.PI / 2;
    // arms: very long
    this.arms = [-1, 1].map((k) => { const sh = new THREE.Group(); sh.position.set(k * 0.42 * s, 2.0 * s, 0); torso.add(sh); const up = limb(1.8 * s, 0.09 * s); sh.add(up); const el = new THREE.Group(); el.position.y = -1.8 * s; up.add(el); el.add(limb(1.9 * s, 0.07 * s)); return { sh, el }; });
    // head on a thin neck
    this.neck = new THREE.Group(); this.neck.position.y = 2.2 * s; torso.add(this.neck);
    mesh(new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.5 * s, 8), m, 0, 0.2 * s, 0, this.neck);
    const head = mesh(new THREE.SphereGeometry(0.42 * s, 20, 16), m, 0, 0.75 * s, 0.05 * s, this.neck); head.scale.set(0.85, 1.15, 0.9); this.head = head;
    const em = new THREE.MeshStandardMaterial({ color: eye, emissive: eye, emissiveIntensity: 2.2 });
    this.eyes = [-1, 1].map((k) => mesh(new THREE.SphereGeometry(0.07 * s, 12, 8), em, k * 0.15 * s, 0.82 * s, 0.4 * s, this.neck));
    if (grin) { const c = canvas(256, 128), g = c.getContext('2d'); g.fillStyle = '#F4EEDC'; g.strokeStyle = '#140F14'; g.lineWidth = 8; g.beginPath(); g.moveTo(14, 30); g.quadraticCurveTo(128, 70, 242, 30); g.quadraticCurveTo(200, 120, 128, 118); g.quadraticCurveTo(56, 120, 14, 30); g.fill(); g.stroke(); g.lineWidth = 5; for (let x = 40; x < 230; x += 22) { g.beginPath(); g.moveTo(x, 40 + Math.abs(x - 128) * -0.12 + 10); g.lineTo(x, 112 - Math.abs(x - 128) * 0.3); g.stroke(); } g.beginPath(); g.moveTo(20, 74); g.quadraticCurveTo(128, 104, 236, 74); g.stroke();
      this.grinMat = new THREE.MeshStandardMaterial({ map: tex(c), transparent: true, roughness: 0.5 }); this.mouth = mesh(new THREE.PlaneGeometry(0.62 * s, 0.31 * s), this.grinMat, 0, 0.6 * s, 0.4 * s, this.neck); this.mouth.castShadow = false; }
    this.set({});
  }
  at(x, y = 0, z = 0) { this.group.position.set(x, y, z); return this; }
  turn(deg) { this.group.rotation.y = deg * R; return this; }
  set({ phase = 0, walk = 0, reach = 0, grin = 1, sway = 0, headTilt = 0 } = {}) {
    const sw = Math.sin(phase) * walk;
    this.legs[0].hip.rotation.x = sw * 0.5; this.legs[1].hip.rotation.x = -sw * 0.5;
    this.legs[0].kn.rotation.x = Math.max(0, -Math.cos(phase)) * walk * 0.9; this.legs[1].kn.rotation.x = Math.max(0, Math.cos(phase)) * walk * 0.9;
    this.root.position.y = -Math.abs(sw) * 0.25 * this.s;
    this.torso.rotation.z = Math.sin(phase * 0.5) * 0.06 * (walk + sway); this.torso.rotation.x = 0.18 + reach * 0.25;
    this.arms.forEach(({ sh, el }, i) => { const k = i ? -1 : 1; sh.rotation.x = -(reach * 1.4) + (i ? sw : -sw) * 0.4; sh.rotation.z = k * (0.25 - reach * 0.1); el.rotation.x = -0.5 - reach * 0.3; });
    this.neck.rotation.z = headTilt * R; this.neck.rotation.x = -0.2 - reach * 0.2;
    if (this.mouth) this.mouth.scale.set(1, 0.2 + grin * 0.8, 1);
    return this;
  }
}

/** a hulking block giant made of boxes, with glowing eyes and a jaw that opens. .set({ phase, walk, jaw 0..1, arms 0..1 raised }) */
export class Brute {
  constructor({ height = 5, col = '#5A5E66', eye = '#FF4A3A' } = {}) {
    this.group = new THREE.Group(); const s = height / 5, m = plastic({ color: col, roughness: 0.8 }), dk = plastic({ color: shade(col, 0.6), roughness: 0.8 }); this.s = s;
    this.root = new THREE.Group(); this.group.add(this.root);
    this.legs = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 0.6 * s, 1.6 * s, 0); this.root.add(p); mesh(roundedBox(0.8 * s, 1.6 * s, 0.9 * s, 0.1 * s), dk, 0, -0.8 * s, 0, p); return p; });
    this.body = new THREE.Group(); this.body.position.y = 1.6 * s; this.root.add(this.body);
    mesh(roundedBox(2.2 * s, 1.9 * s, 1.4 * s, 0.18 * s), m, 0, 1.0 * s, 0, this.body);
    for (let i = 0; i < 4; i++) mesh(roundedBox(0.18 * s, 0.5 * s, 0.18 * s, 0.05 * s), dk, (-0.75 + i * 0.5) * s, 2.1 * s, -0.4 * s, this.body).rotation.x = -0.4;
    this.arms = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 1.3 * s, 1.7 * s, 0); this.body.add(p); mesh(roundedBox(0.6 * s, 2.2 * s, 0.6 * s, 0.1 * s), m, 0, -1.0 * s, 0, p); mesh(roundedBox(0.75 * s, 0.6 * s, 0.75 * s, 0.12 * s), dk, 0, -2.2 * s, 0, p); return p; });
    this.headG = new THREE.Group(); this.headG.position.set(0, 2.0 * s, 0.35 * s); this.body.add(this.headG);
    mesh(roundedBox(1.1 * s, 0.6 * s, 0.9 * s, 0.12 * s), m, 0, 0.3 * s, 0, this.headG);
    this.jaw = new THREE.Group(); this.jaw.position.set(0, 0.02 * s, -0.4 * s); this.headG.add(this.jaw);
    mesh(roundedBox(1.0 * s, 0.32 * s, 0.85 * s, 0.1 * s), dk, 0, -0.16 * s, 0.42 * s, this.jaw);
    const tm = plastic({ color: '#EDE6D2' }); for (let i = 0; i < 6; i++) { mesh(new THREE.ConeGeometry(0.05 * s, 0.14 * s, 4), tm, (-0.36 + i * 0.145) * s, 0.04 * s, 0.82 * s, this.jaw); const u = mesh(new THREE.ConeGeometry(0.05 * s, 0.14 * s, 4), tm, (-0.36 + i * 0.145) * s, 0.0, 0.78 * s, this.headG); u.rotation.z = Math.PI; }
    const em = new THREE.MeshStandardMaterial({ color: eye, emissive: eye, emissiveIntensity: 2.5 });
    [-1, 1].forEach((k) => mesh(roundedBox(0.2 * s, 0.1 * s, 0.05 * s, 0.03 * s), em, k * 0.28 * s, 0.4 * s, 0.46 * s, this.headG));
    this.set({});
  }
  at(x, y = 0, z = 0) { this.group.position.set(x, y, z); return this; }
  turn(deg) { this.group.rotation.y = deg * R; return this; }
  set({ phase = 0, walk = 0, jaw = 0, arms = 0 } = {}) {
    const sw = Math.sin(phase) * walk; this.legs[0].rotation.x = sw * 0.45; this.legs[1].rotation.x = -sw * 0.45;
    this.root.position.y = -Math.abs(Math.cos(phase)) * walk * 0.1 * this.s; this.body.rotation.z = Math.sin(phase) * walk * 0.05; this.body.rotation.x = 0.12;
    this.arms.forEach((a, i) => { a.rotation.x = -arms * 2.4 + (i ? sw : -sw) * 0.35; a.rotation.z = (i ? -1 : 1) * (0.12 + arms * 0.3); });
    this.jaw.rotation.x = jaw * 0.6;
    return this;
  }
}
