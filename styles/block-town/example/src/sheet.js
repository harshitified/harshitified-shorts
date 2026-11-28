// The Block Town 3D style sheet: every picture is drawn by the style's own engine (3D sets + blocky 3D people).
import * as THREE from 'three';
import { ctx } from './core/lib.js';
import { startBoard, panel, frame, small, rules } from './core/board.js';
import { makeEngine, camera } from './core/engine.js';
import { sunlight } from './core/world.js';
import * as ST from './core/sets.js';
import { Blocky, CAST, drawFace, Lanky, Brute, SKINS } from './core/blocky.js';
import { captionText } from './core/captions.js';

try {
await document.fonts.load('900 40px Inter'); await document.fonts.load('800 40px Inter');
const GL = document.getElementById('gl'), GL2 = document.getElementById('gl2');
GL.width = 648; GL.height = 1152; GL2.width = 1280; GL2.height = 860;
const E = makeEngine(GL, { w: 648, h: 1152, samples: 0 }), E2 = makeEngine(GL2, { w: 1280, h: 860, samples: 0 });
const cam = camera(36), V = (x, y, z) => new THREE.Vector3(x, y, z);
const B = startBoard(document.getElementById('cv'), { title: 'BLOCK TOWN 3D: VIDEO STYLE SHEET', author: 'HARSHITIFIED · 2026', bg: '#14151C', line: '#3A3D4C', head: '#F4F4F8', accent: '#FFE53B' });
const shot = (x, y, w, renderFn, over) => frame(x, y, w, () => { renderFn(); ctx.drawImage(GL, 0, 0, 1080, 1920); if (over) over(); });
const wide = (box, renderFn) => { renderFn(); const sh = 1280 * box.h / box.w, sy = (860 - sh) / 2; B.save(); B.beginPath(); B.roundRect(box.x, box.y, box.w, box.h, 10); B.clip(); B.drawImage(GL2, 0, sy, 1280, sh, box.x, box.y, box.w, box.h); B.restore(); };
const look = (c, from, to) => { c.position.copy(from); c.lookAt(to); };
const NIGHT = { bloom: 0.55, bloomThreshold: 0.78, aperture: 0.0006, maxblur: 0.006, sat: 1.15 }, DAY = { bloom: 0.35, bloomThreshold: 0.8, aperture: 0.0008, maxblur: 0.006, sat: 1.18 };

// sets
const TS = ST.townSquare(E), TN = ST.townSquare(E, { time: 'sunset' }), SB = ST.suburbNight(E), LB = ST.lab(E), DF = ST.darkForest(E), NC = ST.nightCity(E);
[TS, TN, SB, LB, DF, NC].forEach((s) => s.update(1.2));

// 1 · hero frame: two kids in the town square, a lanky creature looming behind
let b = panel(20, 80, 520, 520, 1, 'HERO FRAME');
{
  const kid = new Blocky(CAST.kid), fr = new Blocky(CAST.friend), lk = new Lanky({ height: 9, col: '#C99A2E', eye: '#FFF6D0' });
  TN.scene.add(kid.group, fr.group, lk.group);
  kid.at(-0.5, 0, -2).turn(-10).set({ mood: 'scared', look: [0.5, -0.6], armL: [60, 20], armR: [70, 30], headYaw: 15, sweat: 1 });
  fr.at(0.9, 0, -2.6).turn(-25).set({ mood: 'shock', look: [-0.3, -1], armL: [160, 20], armR: [150, 10] });
  lk.at(1.5, 0, -11).turn(-15).set({ reach: 0.5, grin: 1, walk: 0.6, phase: 1 });
  shot(b.x + 4, b.y, 246, () => { look(cam, V(-0.6, 1.0, 3.6), V(0.4, 3.2, -6)); E.render(TN.scene, cam, { ...DAY, focus: 5.5, aperture: 0.0006 }); }, () => captionText('in this / *{y}town,', 540, 1330));
  [['BLOCKY 3D PEOPLE', 'drawn, acting faces'], ['REAL 3D WORLDS', 'towns, streets, labs'], ['GIANT CREATURES', 'spooky, never gory'], ['FILM LIGHT', 'bloom on every lamp'], ['BOLD CAPTIONS', 'one word in colour']]
    .forEach(([a, c], i) => { small(a, b.x + 270, b.y + 34 + i * 86, 'left', 16, '#F4F4F8'); small(c.toUpperCase(), b.x + 270, b.y + 58 + i * 86, 'left', 12, '#9EA2B8'); });
}

// 2 · the cast (real 3D, one studio render)
b = panel(550, 80, 780, 520, 2, 'THE CAST');
{
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#6FA8DC');
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#BFC8D8' })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: '#7FB4E4' })); back.position.set(0, 10, -6); scene.add(back);
  sunlight(scene, E2, { pos: [4, 9, 8], box: 8, i: 2.6 });
  const roles = [['hero', 'happy', { armR: [150, 20] }], ['friend', 'grin', {}], ['ranger', 'smug', { armL: [80, 10] }], ['boss', 'angry', { armR: [90, 0] }], ['kid', 'shock', { armL: [170, 15], armR: [170, 15] }], ['scientist', 'worried', {}], ['neighbor', 'laugh', {}], ['nervous', 'scared', { armL: [40, 30] }]];
  roles.forEach(([k, mood, st], i) => { const p = new Blocky(CAST[k]); p.at(-4.73 + i * 1.35, 0, 0).turn(-8 + i * 2).set({ mood, ...st }); scene.add(p.group); });
  wide({ x: b.x, y: b.y, w: b.w, h: b.h - 40 }, () => { const c = new THREE.PerspectiveCamera(30, 1280 / 860, 0.1, 200); c.position.set(0, 1.5, 15.5); c.lookAt(0, 1.25, 0); E2.render(scene, c, { bloom: 0.1, aperture: 0, sat: 1.15 }); });
  roles.forEach(([k], i) => small(k.toUpperCase(), b.x + b.w * (0.08 + i * 0.12), b.y + b.h - 22, 'center', 12, '#F4F4F8'));
  small('RECIPE: ROUNDED BLOCK HEAD · DRAWN FACE · BOX BODY · ONE HAIR OR HAT · ONE OUTFIT', b.x + b.w / 2, b.y + b.h + 8, 'center', 12, '#9EA2B8');
}

// 3 · faces
b = panel(1340, 80, 560, 520, 3, 'FACES DO THE ACTING');
{
  const moods = ['neutral', 'happy', 'grin', 'laugh', 'shock', 'scared', 'worried', 'angry', 'sad', 'smug', 'sly', 'tired'];
  moods.forEach((m, i) => {
    const cx = b.x + 46 + (i % 6) * 88, cy = b.y + 14 + Math.floor(i / 6) * 205, sk = SKINS[i % 5];
    B.save(); B.fillStyle = sk; B.beginPath(); B.roundRect(cx - 40, cy, 80, 80, 18); B.fill(); B.translate(cx - 36, cy + 4); B.scale(72 / 256, 72 / 256); drawFace(B, { mood: m, look: m === 'sly' ? [1, 0] : [0, 0] }, { skin: sk }); B.restore();
    small(m.toUpperCase(), cx, cy + 108, 'center', 12, '#F4F4F8');
  });
  small('BROWS + EYES + MOUTH CHANGE ON THE BEAT', b.x + b.w / 2, b.y + b.h - 6, 'center', 12, '#9EA2B8');
}

// 4 · worlds
b = panel(20, 610, 800, 456, 4, 'WORLDS');
const n2 = new Blocky(CAST.nervous);
{
  const sw = 138, sx = (i) => b.x + 4 + i * (sw + 16), h3 = new Blocky(CAST.hero), r2 = new Blocky(CAST.ranger), sc = new Blocky(CAST.scientist);
  TS.scene.add(h3.group); SB.scene.add(r2.group); LB.scene.add(sc.group); DF.scene.add(n2.group);
  shot(sx(0), b.y, sw, () => { h3.at(0, 0, -4).turn(20).set({ mood: 'happy', legs: 'walk', phase: 0.8 }); look(cam, V(-2, 2.4, 6), V(0, 2.4, -10)); E.render(TS.scene, cam, { ...DAY, focus: 10 }); });
  shot(sx(1), b.y, sw, () => { r2.at(4.6, 0.12, -5).turn(30).set({ mood: 'smug', armR: [60, 10] }); look(cam, V(9, 2.2, 3), V(3, 1.8, -8)); E.render(SB.scene, cam, { ...NIGHT, focus: 6 }); });
  shot(sx(2), b.y, sw, () => { sc.at(-1.7, 0, -1.2).turn(35).set({ mood: 'shock', look: [0.8, 0], armL: [90, 0], headYaw: 30 }); look(cam, V(2.4, 1.8, 4.2), V(-0.9, 1.7, -3.2)); E.render(LB.scene, cam, { ...NIGHT, focus: 5 }); });
  shot(sx(3), b.y, sw, () => { n2.at(0.2, 0, -3).turn(10).set({ mood: 'scared', look: [-0.6, 0], armL: [40, 30], armR: [40, 30] }); look(cam, V(0.4, 1.6, 1.2), V(0, 1.6, -6)); E.render(DF.scene, cam, { ...NIGHT, focus: 4.3 }); });
  shot(sx(4), b.y, sw, () => { look(cam, V(14, 14, 16), V(0, 1, -4)); E.render(NC.scene, cam, { ...NIGHT, focus: 22, aperture: 0.0002 }); });
  ['TOWN SQUARE', 'NIGHT STREET', 'THE LAB', 'DARK FOREST', 'NIGHT CITY'].forEach((t, i) => small(t, sx(i) + sw / 2, b.y + sw * 16 / 9 + 22, 'center', 12));
  small('DAY · SUNSET · NIGHT, ALL LIT FOR THE MOOD', b.x + b.w / 2, b.y + b.h - 4, 'center', 12, '#9EA2B8');
}

// 5 · creatures
b = panel(830, 610, 420, 456, 5, 'CREATURES');
{
  const sw = 180, br = new Brute({ height: 6 }); NC.scene.add(br.group); br.at(0, 0, -4).turn(-10).set({ jaw: 0.8, arms: 0.4, walk: 0.5, phase: 1.2 });
  const lk2 = new Lanky({ height: 8, col: '#2B2733', eye: '#FFF3B0', grin: false }); DF.scene.add(lk2.group); lk2.at(0.6, 0, -9).set({ reach: 0.8, walk: 0.3 });
  shot(b.x + 6, b.y, sw, () => { look(cam, V(4, 2.0, 8), V(0, 4.2, -4)); E.render(NC.scene, cam, { ...NIGHT, focus: 9 }); });
  shot(b.x + 18 + sw, b.y, sw, () => { n2.group.visible = false; look(cam, V(0, 1.6, 2.5), V(0.4, 4.5, -9)); E.render(DF.scene, cam, { ...NIGHT, focus: 11 }); });
  small('THE BRUTE', b.x + 6 + sw / 2, b.y + sw * 16 / 9 + 22, 'center', 12); small('THE LANKY', b.x + 18 + sw * 1.5, b.y + sw * 16 / 9 + 22, 'center', 12);
  small('SCARY SHAPES, GLOWING EYES · NO BLOOD, NO GORE', b.x + b.w / 2, b.y + b.h - 4, 'center', 12, '#9EA2B8');
}

// 6 · captions + rules
b = panel(1260, 610, 640, 456, 6, 'CAPTIONS + RULES');
{
  const c = (t, x, y, s) => { B.save(); B.translate(x, y); B.scale(s, s); captionText(t, 0, 0); B.restore(); };
  B.fillStyle = '#2A2D3A'; B.beginPath(); B.roundRect(b.x, b.y, 290, 214, 10); B.fill();
  c('*rosie was', b.x + 145, b.y + 32, 0.34); c('stepped out of the / *{p}darkness', b.x + 145, b.y + 96, 0.3); c('into the dark / *{g}forest', b.x + 145, b.y + 172, 0.3);
  small('YELLOW = KEY WORD', b.x + 310, b.y + 30, 'left', 12, '#FFE53B'); small('PURPLE = MYSTERY', b.x + 310, b.y + 54, 'left', 12, '#A98BFF'); small('GREEN = PLACE / NATURE', b.x + 310, b.y + 78, 'left', 12, '#2FD96A'); small('RED = DANGER', b.x + 310, b.y + 102, 'left', 12, '#FF4A4A');
  small('1-3 WORDS · WHITE, BLACK EDGE', b.x + 310, b.y + 136, 'left', 12, '#F4F4F8'); small('BIG WORD ON ITS OWN LINE', b.x + 310, b.y + 160, 'left', 12, '#F4F4F8');
  rules({ x: b.x, y: b.y + 236, w: b.w, h: 150 }, ['OPEN ON THE STRANGEST TRUE FACT, SHOWN AT ONCE.', 'NEW SHOT EVERY 0.8-2 S; THE CAMERA ALWAYS MOVES.', 'FACES REACT ON EVERY BEAT; BODIES ACT IT OUT.', 'NIGHT SCENES GLOW: LAMPS, WINDOWS, RINGS.', 'CREATURES LOOM BIG AND SLOW, NEVER GORY.'], b.y + 246, 13, 31);
}
window.SHEET_READY = true;
} catch (e) { window.SHEET_ERR = String(e && e.stack || e); console.error(e); }
