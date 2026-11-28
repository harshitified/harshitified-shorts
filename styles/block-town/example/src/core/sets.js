// Block Town sets: low-poly 3D places in a chunky toy-game look, lit like a film (bloom on every light).
// Each returns { scene, sun, update(t) } — call update(t) every frame for anything that moves or blinks.
//   townSquare(E, { time: day│sunset│night, stage })   cobbled square, timber houses, autumn trees, string lights
//   suburbNight(E)                                     road, sidewalks, porch houses with lit windows, picket fences, lamps
//   lab(E)                                             dark lab, diamond-plate floor, glowing teleporter rings, console
//   darkForest(E, { glow })                            dense dark pines, ferns, fog, moonlight (optional red sky glow)
//   nightCity(E)                                       towers of lit windows, floodlight towers, police cars with flashing bars
// Layouts (so shots can place people): see each function's comment. People stand at y 0 unless noted.
import * as THREE from 'three';
import { sky, clouds, sunlight, tree, mat, canvasTex, wire, car, fence, signBoard } from './world.js';
import { house } from './props.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const box = (w, h, d, m, x = 0, y = 0, z = 0, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (parent) parent.add(b); return b; };
const cyl = (r1, r2, h, m, x, y, z, parent, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; if (parent) parent.add(c); return c; };
const glow = (col, k = 2) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: k });

// ---------------------------------------------------------------- textures
export const TX = {
  cobbles: (col = '#8E7A68', rep = [1, 1]) => canvasTex('cob' + col, 512, 512, (g, w, h) => {
    g.fillStyle = shade(col, 0.55); g.fillRect(0, 0, w, h);
    for (let r = 0; r < 16; r++) for (let c = 0; c < 12; c++) { const x = c * 44 + (r % 2) * 22 + rnd(r * 9 + c) * 6, y = r * 32 + rnd(r + c * 5) * 4; g.fillStyle = shade(col, 0.8 + rnd(r * 31 + c) * 0.4); g.beginPath(); g.roundRect(x + 2, y + 2, 38 + rnd(c) * 4, 26, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 6, y + 5, 22, 5); }
  }, rep),
  timber: (plaster = '#EFE4CF', beam = '#4A3426') => canvasTex('tim' + plaster + beam, 512, 512, (g, w, h) => {
    g.fillStyle = plaster; g.fillRect(0, 0, w, h); g.fillStyle = beam;
    [0, 250, 500].forEach((y) => g.fillRect(0, y, w, 18)); [0, 170, 340, 494].forEach((x) => g.fillRect(x, 0, 18, h));
    g.lineWidth = 16; g.strokeStyle = beam; [[18, 18, 170, 250], [340, 250, 494, 18], [18, 268, 170, 500], [494, 268, 340, 500]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  }),
  roof: (col = '#A0482E') => canvasTex('roof' + col, 256, 256, (g, w, h) => { g.fillStyle = shade(col, 0.7); g.fillRect(0, 0, w, h); for (let r = 0; r < 12; r++) for (let c = 0; c < 9; c++) { g.fillStyle = shade(col, 0.85 + rnd(r * 7 + c) * 0.3); g.beginPath(); g.arc(c * 32 + (r % 2) * 16, r * 22 + 22, 15, 0, Math.PI); g.fill(); } }),
  road: () => canvasTex('road', 512, 512, (g, w, h) => { g.fillStyle = '#2C2F3A'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i) * 0.05})`; g.fillRect(rnd(i * 3) * w, rnd(i * 7) * h, 2, 2); } g.fillStyle = '#E8E4D8'; for (let x = 0; x < w; x += 128) g.fillRect(x + 20, h / 2 - 5, 70, 10); }),
  pavement: () => canvasTex('pave', 256, 256, (g, w, h) => { g.fillStyle = '#9AA0AE'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7C8290'; g.lineWidth = 3; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }),
  plate: () => canvasTex('plate', 256, 256, (g, w, h) => { g.fillStyle = '#3A4050'; g.fillRect(0, 0, w, h); g.fillStyle = '#4E5668'; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { g.save(); g.translate(c * 32 + 16 + (r % 2) * 8, r * 32 + 16); g.rotate(((r + c) % 2 ? 1 : -1) * 0.7); g.fillRect(-11, -3, 22, 6); g.restore(); } }),
  panels: (col = '#2A3142') => canvasTex('pan' + col, 256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.strokeStyle = shade(col, 0.7); g.lineWidth = 4; for (let x = 0; x <= w; x += 128) for (let y = 0; y <= h; y += 128) g.strokeRect(x + 4, y + 4, 120, 120); g.fillStyle = shade(col, 1.3); for (let i = 0; i < 16; i++) g.fillRect(12 + (i % 4) * 64, 12 + Math.floor(i / 4) * 64, 4, 4); }),
  litter: (col = '#3A2A1E') => canvasTex('lit' + col, 512, 512, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = shade(['#5A3A22', '#4A4A26', '#6A4A2A', '#2E2418'][i % 4], 0.7 + rnd(i) * 0.6); g.save(); g.translate(rnd(i * 2) * w, rnd(i * 5) * h); g.rotate(rnd(i * 3) * 6); g.fillRect(-4, -1.5, 8 + rnd(i) * 6, 3); g.restore(); } }),
  tiles: () => canvasTex('tiles', 256, 256, (g, w, h) => { g.fillStyle = '#8E95A3'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = shade('#B4BAC6', 0.9 + rnd(r * 4 + c) * 0.15); g.fillRect(c * 64 + 2, r * 64 + 2, 60, 60); } }),
  windows: (lit = 0.7, seed = 1) => { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#B9C3D3'; g.fillRect(0, 0, 256, 512); for (let r = 0; r < 24; r++) for (let k = 0; k < 10; k++) { g.fillStyle = rnd(seed * 97 + r * 13 + k) < lit ? '#FFF8E0' : '#3A4458'; g.fillRect(6 + k * 25, 6 + r * 21, 16, 14); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; },
};

// ---------------------------------------------------------------- pieces
/** a timber-frame house facing +z: w wide, d deep, with a pitched tile roof and lit windows at night */
export function timberHouse({ w = 5, d = 5, h = 4.2, roof = '#A0482E', plaster = '#EFE4CF', beam = '#4A3426', lit = false, seed = 1 } = {}) {
  const g = new THREE.Group(), wall = mat({ map: TX.timber(plaster, beam) }); wall.map.repeat.set(w / 4, h / 4);
  box(w, h, d, wall, 0, h / 2, 0, g);
  const rh = w * 0.5, shape = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.4, 0), new THREE.Vector2(w / 2 + 0.4, 0), new THREE.Vector2(0, rh)]);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: d + 0.8, bevelEnabled: false }); rg.translate(0, 0, -(d + 0.8) / 2);
  const r = new THREE.Mesh(rg, [mat({ map: TX.roof(roof) }), mat({ color: shade(roof, 0.8) })]); r.position.y = h; r.castShadow = r.receiveShadow = true; g.add(r);
  const winM = lit ? glow('#FFC85A', 1.6) : mat({ color: '#3F5A78', roughness: 0.2 });
  [[-w * 0.28, h * 0.68], [w * 0.28, h * 0.68], [w * 0.28, h * 0.26]].forEach(([x, y]) => { box(0.9, 1.0, 0.06, winM, x, y, d / 2 + 0.02, g); box(1.06, 0.1, 0.12, mat({ color: beam }), x, y - 0.55, d / 2 + 0.04, g); });
  box(1.0, 1.9, 0.08, mat({ color: shade(roof, 0.6) }), -w * 0.26, 0.95, d / 2 + 0.03, g);
  if (rnd(seed) > 0.4) box(0.5, 1.4, 0.5, mat({ color: '#7A6A5E' }), w * 0.25, h + rh * 0.6, -d * 0.2, g);
  return g;
}
/** a low-poly autumn tree (orange / red / gold) */
export function autumnTree(s = 1, seed = 1) { const cols = ['#E2742E', '#C9442C', '#E8A23A', '#B8362A']; return tree(s, cols[seed % cols.length]); }
/** a pine (stacked cones) for forests */
export function pine(s = 1, col = '#1F3A2A') { const g = new THREE.Group(); cyl(0.12 * s, 0.18 * s, 1.4 * s, mat({ color: '#3A2618' }), 0, 0.7 * s, 0, g, 6); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.5 - i * 0.3) * s, 1.6 * s, 7), mat({ color: shade(col, 0.85 + i * 0.08), flatShading: true })); c.position.y = (1.4 + i * 0.9) * s; c.castShadow = true; c.receiveShadow = true; g.add(c); } return g; }
/** a string of glowing bulbs from a to b */
export function stringLights(a, b, col = '#FFE7A8', sag = 0.6) {
  const g = new THREE.Group(); g.add(wire(a, b, sag, '#1E1A18')); const n = Math.round(a.distanceTo(b) / 0.7), m = glow(col, 3);
  for (let i = 1; i < n; i++) { const t = i / n, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * sag + 0.08; const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), m); s.position.copy(p); g.add(s); }
  return g;
}
/** a street lamp (black post, glowing head). light: add a real point light (costly: use 2-4 per set at most) */
export function streetLamp(light = false, col = '#FFF1C8') { const g = new THREE.Group(), m = mat({ color: '#1C1E24', roughness: 0.5 }); cyl(0.06, 0.08, 3.6, m, 0, 1.8, 0, g, 8); box(0.34, 0.06, 0.34, m, 0, 3.66, 0, g); box(0.26, 0.4, 0.26, glow(col, 1.5), 0, 3.42, 0, g); box(0.3, 0.06, 0.3, m, 0, 3.2, 0, g); if (light) { const l = new THREE.PointLight(col, 8, 12, 1.6); l.position.y = 3.0; g.add(l); } return g; }
/** a police car (blocky) with a flashing light bar: g.update(t) */
export function policeCar() { const g = car('#1E222C'); box(1.52, 0.12, 1.4, mat({ color: '#F2F2EE' }), 0, 1.02, 0.35, g); const red = glow('#FF2A3A', 0), blue = glow('#2A6CFF', 0); box(0.5, 0.14, 0.26, red, -0.3, 1.87, -0.3, g); box(0.5, 0.14, 0.26, blue, 0.3, 1.87, -0.3, g); g.update = (t) => { const k = Math.sin(t * 14) > 0; red.emissiveIntensity = k ? 4 : 0.3; blue.emissiveIntensity = k ? 0.3 : 4; }; return g; }
/** a floodlight tower (steel lattice + a blazing lamp head) */
export function floodTower(h = 12) { const g = new THREE.Group(), m = mat({ color: '#2A2C32', metalness: 0.4, roughness: 0.5 }); [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].forEach(([x, z]) => box(0.12, h, 0.12, m, x, h / 2, z, g)); for (let y = 1; y < h; y += 1.4) { const a = box(1.4, 0.06, 0.06, m, 0, y, -0.5, g); a.rotation.z = (y % 2.8 < 1.4 ? 1 : -1) * 0.75; const b2 = box(1.4, 0.06, 0.06, m, 0, y, 0.5, g); b2.rotation.z = -a.rotation.z; } box(1.6, 1.0, 0.5, m, 0, h + 0.4, 0, g); box(1.4, 0.8, 0.06, glow('#FFF6E0', 2.2), 0, h + 0.4, 0.27, g); const hz = box(1.4, 0.3, 0.3, mat({ color: '#E8C040' }), 0, 0.15, 0, g); return g; }
/** a glowing sci-fi teleporter tube: stacked rings of light. g.update(t) makes them drift */
export function teleporter(col = '#5FD8FF') {
  const g = new THREE.Group(), m = glow(col, 1.3), rings = [];
  box(2.6, 0.2, 2.6, mat({ color: '#2A303C', metalness: 0.4, roughness: 0.4 }), 0, 0.1, 0, g);
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.08, 40), m); r.position.y = 0.3 + i * 0.6; g.add(r); rings.push(r); }
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.8, 40, 1, true), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.08, emissive: col, emissiveIntensity: 0.15, side: THREE.DoubleSide, depthWrite: false })); glass.position.y = 2.0; g.add(glass);
  const l = new THREE.PointLight(col, 7, 10, 1.6); l.position.y = 1.6; g.add(l);
  g.update = (t, on = 1) => rings.forEach((r, i) => { r.position.y = 0.3 + ((i * 0.6 + t * 0.8) % 3.6); r.scale.setScalar(0.9 + 0.1 * Math.sin(t * 3 + i)); r.material.emissiveIntensity = 1.3 * on; });
  return g;
}
/** a control console with blinking buttons. g.update(t) */
export function console3D() { const g = new THREE.Group(); box(1.6, 1.0, 0.8, mat({ color: '#D9DCE2' }), 0, 0.5, 0, g); const top = box(1.6, 0.08, 0.9, mat({ color: '#B9BEC8' }), 0, 1.06, 0.08, g); top.rotation.x = 0.35; const bs = []; for (let i = 0; i < 18; i++) { const b = box(0.14, 0.04, 0.12, glow(['#FF4A4A', '#4AFF8A', '#FFD43B', '#4A9CFF'][i % 4], 1), -0.62 + (i % 9) * 0.155, 1.12 + Math.floor(i / 9) * 0.08, 0.02 + Math.floor(i / 9) * -0.2, g); b.rotation.x = 0.35; bs.push(b); } box(1.0, 0.7, 0.06, glow('#4FD1E8', 0.8), 0, 1.65, -0.3, g); g.update = (t) => bs.forEach((b, i) => (b.material.emissiveIntensity = Math.sin(t * 3 + i * 1.7) > 0 ? 1.6 : 0.2)); return g; }
/** stars in the sky */
function stars(scene, n = 400) { const geo = new THREE.BufferGeometry(), p = []; for (let i = 0; i < n; i++) { const a = rnd(i) * Math.PI * 2, e = 0.15 + rnd(i * 3) * 1.2; p.push(Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300); } geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); const s = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFFFFF', size: 1.6, sizeAttenuation: false, fog: false })); scene.add(s); return s; }

// ---------------------------------------------------------------- SETS
/** Town square. Cobbles everywhere; the open square is x -7..7, z -14..6. Houses line x ±10 and the back at z -20.
 *  opts.stage = a wooden stage at (0, 0, -9) (top at y 0.9, 5 x 3) with bunting. Returns { scene, sun, update, stage } */
export function townSquare(E, { time = 'day', stage = false } = {}) {
  const scene = new THREE.Scene(), night = time === 'night', sunset = time === 'sunset';
  sky(scene, night ? { top: '#0A1030', horizon: '#26305A' } : sunset ? { top: '#3B5BA8', horizon: '#FFA060' } : { top: '#2E7FE0', horizon: '#CFEAFA' });
  if (night) stars(scene); else clouds(scene, [[-40, 34, -120, 16], [30, 40, -130, 20], [80, 28, -110, 13], [-90, 30, -100, 14]], sunset ? '#FFC2A0' : '#FFFFFF');
  const sun = sunlight(scene, E, night ? { col: '#8FA8FF', i: 0.6, pos: [-6, 12, 4], sky: '#30406A', ground: '#1A1A24', hemi: 0.5, env: 0.05, box: 16 } : sunset ? { col: '#FFB070', i: 2.6, pos: [-14, 6, -10], sky: '#C9A6E0', ground: '#6A4A3A', hemi: 1.0, box: 16 } : { col: '#FFF0D6', i: 2.8, pos: [8, 12, 7], box: 16 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat({ map: TX.cobbles('#8E7A68', [40, 40]) })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const pal = [['#A0482E', '#EFE4CF'], ['#4A5A78', '#F2E0C8'], ['#7A3A2A', '#E8D6BC'], ['#5A6A3A', '#F0E8D8'], ['#8A2E3A', '#EADFCB']];
  let n = 0;
  [-1, 1].forEach((side) => { for (let z = -16; z <= 8; z += 6) { const [r, p] = pal[n % 5]; const hs = timberHouse({ w: 5.2, d: 5, h: 3.8 + rnd(n) * 1.4, roof: r, plaster: p, lit: night || sunset, seed: n++ }); hs.position.set(side * 11, 0, z); hs.rotation.y = -side * Math.PI / 2; scene.add(hs); } });
  for (let x = -9; x <= 9; x += 6) { const [r, p] = pal[n % 5]; const hs = timberHouse({ w: 5.6, d: 5, h: 4.4 + rnd(n) * 1.2, roof: r, plaster: p, lit: night || sunset, seed: n++ }); hs.position.set(x, 0, -22); scene.add(hs); }
  [[-7.5, -15], [7.6, -14], [-7.8, 2], [7.4, 4], [-3, -18.5], [4, -18.8]].forEach(([x, z], i) => { const t = autumnTree(1.1 + rnd(i) * 0.4, i); t.position.set(x, 0, z); scene.add(t); });
  // string lights criss-cross the square
  const poles = [[-8, -12], [8, -12], [-8, 0], [8, 0]];
  poles.forEach(([x, z]) => cyl(0.06, 0.08, 4.4, mat({ color: '#2A2420' }), x, 2.2, z, scene, 8));
  [[0, 1], [2, 3], [0, 3], [1, 2]].forEach(([a, b]) => scene.add(stringLights(new THREE.Vector3(poles[a][0], 4.3, poles[a][1]), new THREE.Vector3(poles[b][0], 4.3, poles[b][1]))));
  [[-7, 6], [7, 6]].forEach(([x, z]) => { const f = fence(5); f.position.set(x - 2.5, 0, z); scene.add(f); });
  const lamps = [[-6.5, -6], [6.5, -6], [-6.5, 4], [6.5, 4]].map(([x, z], i) => { const l = streetLamp(night && i < 2); l.position.set(x, 0, z); scene.add(l); return l; });
  // mountains far away
  [[-60, -160, 40, 34], [10, -170, 55, 44], [80, -150, 38, 30]].forEach(([x, z, r, h], i) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat({ color: night ? '#1A2238' : sunset ? '#7A6A8E' : '#7FA0B8', flatShading: true })); m.position.set(x, h / 2 - 2, z); scene.add(m); });
  let stg = null;
  if (stage) {
    stg = new THREE.Group(); box(5, 0.9, 3, mat({ map: TX.roof('#9A6A40') }), 0, 0.45, 0, stg); box(5.2, 0.12, 3.2, mat({ color: '#B8865A' }), 0, 0.92, 0, stg);
    [[-2.4, -1.4], [2.4, -1.4]].forEach(([x, z]) => cyl(0.08, 0.08, 3, mat({ color: '#6A4A30' }), x, 2.4, z, stg, 8));
    const banner = signBoard('DANCE HERE!', { w: 3.4, h: 0.6, bg: '#B8283A', fg: '#FFE7A8' }); banner.position.set(0, 3.4, -1.4); stg.add(banner);
    stg.position.set(0, 0, -9); scene.add(stg);
  }
  if (night) [[-2, 2.5, -6], [2, 2.5, -3]].forEach(([x, y, z]) => { const l = new THREE.PointLight('#FFC870', 14, 12, 1.6); l.position.set(x, y + 1.5, z); scene.add(l); });
  return { scene, sun, stage: stg, update: () => {} };
}

/** Night suburb. Road along x at z 0 (width 8), sidewalks z ±4..6, porch houses at z -12 facing +z, picket fences z -6.6.
 *  People on the sidewalk stand at y 0.12, z ~ -5. */
export function suburbNight(E) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#06081A', horizon: '#1E2448' }); stars(scene, 600);
  const sun = sunlight(scene, E, { col: '#8FA8FF', i: 0.7, pos: [-6, 14, 8], sky: '#2A3A6A', ground: '#141420', hemi: 0.55, env: 0.06, box: 18 });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat({ color: '#2E5A34' })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 8), mat({ map: TX.road() })); road.material.map.repeat.set(30, 1); road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; scene.add(road);
  [-5, 5].forEach((z) => { const s = box(240, 0.12, 2, mat({ map: TX.pavement() }), 0, 0.06, z, scene); s.material.map.repeat.set(60, 1); });
  const cols = [['#F2F2EE', '#2A2F3E', '#B8283A'], ['#C9D6E8', '#3A3046', '#2E5A8A'], ['#E8E0C8', '#2E3440', '#2F6E4A'], ['#F0E4E8', '#3A2A3A', '#8A4A2A']];
  for (let i = -3; i <= 3; i++) {
    const [w, r, d] = cols[(i + 4) % 4], h = house({ wall: w, roof: r, door: d }); h.position.set(i * 11, 0, -12); scene.add(h);
    [[-1.6, 1.6], [1.6, 1.6]].forEach(([x, y]) => box(1.0, 0.9, 0.05, glow(rnd(i * 5 + x) > 0.35 ? '#FFC870' : '#2A3448', 1.4), i * 11 + x, y, -9.72, scene));
    const f = fence(8.5); f.position.set(i * 11 - 5.2, 0, -6.6); scene.add(f);
    const mb = new THREE.Group(); box(0.08, 1.0, 0.08, mat({ color: '#1C1E24' }), 0, 0.5, 0, mb); box(0.3, 0.26, 0.46, mat({ color: '#1C1E24' }), 0, 1.1, 0, mb); mb.position.set(i * 11 + 3.2, 0, -6.2); scene.add(mb);
    const t = tree(1.1, '#3E7A3A'); t.position.set(i * 11 + 4.4, 0, -8.8); scene.add(t);
    const l = streetLamp(Math.abs(i) < 1, '#FFF1C8'); l.position.set(i * 11 + 5.5, 0.12, -4.2); scene.add(l);
  }
  return { scene, sun, update: () => {} };
}

/** Lab. Floor x -7..7, z -8..4. Teleporter at (0, 0, -4) (pad top y 0.2), console at (-4, 0, -6), posters on the back wall z -8. */
export function lab(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#05070C');
  const sun = sunlight(scene, E, { col: '#9ABCE8', i: 0.5, pos: [3, 8, 6], sky: '#1A2438', ground: '#0A0C12', hemi: 0.5, env: 0.1, box: 9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), mat({ map: TX.plate(), roughness: 0.45, metalness: 0.3 })); floor.material.map.repeat.set(7, 6); floor.rotation.x = -Math.PI / 2; floor.position.z = -2; floor.receiveShadow = true; scene.add(floor);
  const wm = mat({ map: TX.panels('#232A38') }); wm.map.repeat.set(5, 2);
  box(14, 6, 0.3, wm, 0, 3, -8, scene); box(0.3, 6, 12, wm, -7, 3, -2, scene); box(0.3, 6, 12, wm, 7, 3, -2, scene); box(14, 0.3, 12, mat({ color: '#12161E' }), 0, 6, -2, scene);
  [-4, 0, 4].forEach((x) => box(2.4, 0.08, 0.4, glow('#DDE8FF', 1.2), x, 5.82, -2, scene));
  const tp = teleporter(); tp.position.set(0, 0, -4); scene.add(tp);
  const cs = console3D(); cs.position.set(-4, 0, -6); cs.rotation.y = 0.5; scene.add(cs);
  ['#B8283A', '#C8642E', '#B8283A'].forEach((c, i) => { const p = box(1.3, 1.6, 0.04, mat({ color: c }), -6.0 + i * 1.6, 3.2, -7.82, scene); const ic = box(0.5, 0.5, 0.02, mat({ color: '#F2EEE6' }), -6.0 + i * 1.6, 3.4, -7.79, scene); });
  const corner = new THREE.PointLight('#FFB070', 6, 8, 1.6); corner.position.set(-6, 3, 2); scene.add(corner);
  return { scene, sun, teleporter: tp, console: cs, update: (t, on = 1) => { tp.update(t, on); cs.update(t); } };
}

/** Dark forest. A path along -z from z 4 to z -30, trees on both sides; a small clearing at (0, 0, -8). glow = red sky glow colour (or null). */
export function darkForest(E, { glow: skyGlow = '#4A1410', fog = 0.06 } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#06080A'); scene.fog = new THREE.FogExp2('#0A0E10', fog);
  if (skyGlow) sky(scene, { top: '#05060A', horizon: skyGlow });
  const sun = sunlight(scene, E, { col: '#7A96C8', i: 0.9, pos: [-5, 12, -6], sky: '#1E2A3A', ground: '#0C0A08', hemi: 0.45, env: 0.04, box: 12 });
  const g0 = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat({ map: TX.litter('#2E2218', [1, 1]) })); g0.material.map.repeat.set(24, 24); g0.rotation.x = -Math.PI / 2; g0.receiveShadow = true; scene.add(g0);
  for (let i = 0; i < 90; i++) { const x = (rnd(i) - 0.5) * 50, z = 6 - rnd(i * 3) * 44; if (Math.abs(x) < 2.2 + (Math.abs(z + 8) < 4 ? 2.5 : 0)) continue; const p = pine(0.9 + rnd(i * 7) * 1.1, ['#1F3A2A', '#22402C', '#1A3324'][i % 3]); p.position.set(x, 0, z); p.rotation.y = rnd(i) * 6; scene.add(p); }
  for (let i = 0; i < 70; i++) { const x = (rnd(i * 11) - 0.5) * 16, z = 4 - rnd(i * 13) * 34; if (Math.abs(x) < 1.2) continue; const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + rnd(i) * 0.4, 0), mat({ color: shade('#3A5A2A', 0.7 + rnd(i * 2) * 0.6), flatShading: true })); f.scale.y = 0.45; f.position.set(x, 0.18, z); f.castShadow = true; scene.add(f); }
  const moon = new THREE.PointLight('#8AA8E0', 10, 18, 1.4); moon.position.set(1, 5, -5); scene.add(moon);
  return { scene, sun, update: () => {} };
}

/** Night city plaza. Tiled plaza x -14..14, z -14..10, a ringed fence (r 5) around (0, 0, -4), floodlight towers at the corners,
 *  police cars parked in a ring (flashing). Towers of lit windows behind. */
export function nightCity(E) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#141C3A', horizon: '#46507A' });
  const sun = sunlight(scene, E, { col: '#B8C8F0', i: 0.6, pos: [5, 16, 10], sky: '#3A4A7A', ground: '#1A1C26', hemi: 0.45, env: 0.05, box: 20 });
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat({ map: TX.tiles(), roughness: 0.5, color: '#8E95A8' })); plaza.material.map.repeat.set(60, 60); plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true; scene.add(plaza);
  for (let i = 0; i < 26; i++) { const a = -Math.PI * 0.95 + (i / 25) * Math.PI * 0.9, r = 34 + rnd(i) * 20, h = 14 + rnd(i * 3) * 34, w = 6 + rnd(i * 5) * 6; const t = TX.windows(0.55 + rnd(i) * 0.3, i); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 10, h / 20); const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#FFFFFF', emissiveIntensity: 0.32, roughness: 0.6 }); const b = box(w, h, w, m, Math.cos(a) * r, h / 2, Math.sin(a) * r - 8, scene); b.castShadow = false; const tip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), glow('#FF3A3A', 3)); tip.position.set(b.position.x, h + 0.6, b.position.z); scene.add(tip); }
  const ring = new THREE.Group(); for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; box(0.08, 1.2, 0.08, mat({ color: '#C9CED8', metalness: 0.5 }), Math.cos(a) * 5, 0.6, Math.sin(a) * 5, ring); } const rail = new THREE.Mesh(new THREE.TorusGeometry(5, 0.05, 6, 64), mat({ color: '#C9CED8', metalness: 0.5 })); rail.rotation.x = Math.PI / 2; rail.position.y = 1.2; ring.add(rail); ring.position.set(0, 0, -4); scene.add(ring);
  const cars = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3, c = policeCar(); c.position.set(Math.cos(a) * 9, 0, -4 + Math.sin(a) * 9); c.rotation.y = -a + Math.PI; scene.add(c); cars.push(c); }
  [[-12, -14], [12, -14], [-12, 6], [12, 6]].forEach(([x, z]) => { const f = floodTower(); f.position.set(x, 0, z); f.lookAt(0, 0, -4); scene.add(f); });
  [[-6, 10, 2], [6, 10, 2]].forEach(([x, y, z]) => { const s = new THREE.SpotLight('#FFF4E0', 45, 40, 0.45, 0.6, 1.4); s.position.set(x, y, z); s.target.position.set(0, 0, -4); scene.add(s, s.target); });
  return { scene, sun, cars, update: (t) => cars.forEach((c, i) => c.update(t + i * 0.13)) };
}
