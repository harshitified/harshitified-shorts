// THE CITY THAT COULDN'T STOP DANCING (Strasbourg, 1518): the Block Town 3D example.
// A shot: { id, at, note, draw(lt, d, t, blit) }. cut(i) = just before line i, Wd('word', i) = when that word is said.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob, rnd } from './core/lib.js';
import { L, Le, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import * as ST from './core/sets.js';
import { Blocky, CAST, SKINS } from './core/blocky.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const blink = (t, off = 0) => (((t + off) % 3.1) < 0.12 ? 1 : 0);

// the cast (original looks)
const TROFFEA = { skin: SKINS[0], shirt: '#C8642E', outfit: 'dress', accent: '#7A3A20', hair: 'long', hairCol: '#6A3A1E', face: ['blush'] };
const LEADER = { skin: SKINS[1], shirt: '#2A2F3E', outfit: 'jacket', pants: '#1E222C', hat: 'top', hatCol: '#1A1A22', hair: 'buzz', hairCol: '#5A4A3A', tieCol: '#C8283A', face: ['mustache'] };
const LEADER2 = { skin: SKINS[3], shirt: '#5A2A3A', outfit: 'coat', under: '#E8D8B0', pants: '#2A2228', hair: 'none', face: ['glasses', 'beard'], hairCol: '#2A1E16' };
const TOWN = [
  { shirt: '#3FA7D6', outfit: 'tee', hair: 'swoop', hairCol: '#4A2E1E' }, { shirt: '#E8C040', outfit: 'tee', pattern: 'stripes', accent: '#C8642E', hair: 'bob', hairCol: '#2A1E16' },
  { shirt: '#6FBF5A', outfit: 'shirt', tieCol: '#2E5A3A', hair: 'spiky', hairCol: '#C8642E' }, { shirt: '#B98ACF', outfit: 'dress', accent: '#7A4A9A', hair: 'bun', hairCol: '#3B2A20' },
  { shirt: '#E8603C', outfit: 'hoodie', hair: 'curly', hairCol: '#1E1712' }, { shirt: '#F2EEE6', outfit: 'shirt', tieCol: '#2A4A8A', hair: 'swoop', hairCol: '#E0B060' },
  { shirt: '#4E6A9A', outfit: 'jacket', hair: 'buzz', hairCol: '#3B2A20', hat: 'cap', hatCol: '#C8283A' }, { shirt: '#D86A8A', outfit: 'tee', pattern: 'star', accent: '#FFE07A', hair: 'long', hairCol: '#8A4A2A' },
];
const townLook = (i) => ({ skin: SKINS[i % 6], pants: ['#2E3A55', '#3A2E28', '#22314A', '#4A4A52'][i % 4], ...TOWN[i % TOWN.length] });

/** dancing: arms swing up and down, hips bob, body sways. k = energy 0..1 */
function dance(p, t, seed = 0, k = 1, extra = {}) {
  const s = t * 7 + seed * 2.3;
  return p.set({ mood: 'grin', armL: [90 + 70 * Math.sin(s) * k, 25 + 20 * Math.sin(s * 0.5)], armR: [90 - 70 * Math.sin(s) * k, 25 + 20 * Math.cos(s * 0.5)],
    legs: 'walk', phase: s * 1.1, bob: Math.abs(Math.sin(s)) * 0.1 * k, turn: Math.sin(s * 0.35) * 40 * k, headTilt: Math.sin(s) * 10 * k, blink: blink(t, seed), ...extra });
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(36);
  const DAY = { bloom: 0.3, bloomThreshold: 0.82, aperture: 0.0008, maxblur: 0.006, sat: 1.18 };
  const DUSK = { bloom: 0.45, bloomThreshold: 0.75, aperture: 0.0008, maxblur: 0.006, sat: 1.2, warm: 0.04 };
  const NIGHT = { bloom: 0.6, bloomThreshold: 0.72, aperture: 0.0008, maxblur: 0.007, sat: 1.15 };
  const shoot = (set, from, to, at, at2, k, look, t, focus) => {
    if (cam.fov !== (look.fov || 36)) { cam.fov = look.fov || 36; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); const tgt = at2 ? mix(at, at2, k) : at; cam.lookAt(tgt);
    set.update(t); E.render(set.scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(tgt) });
  };
  const show = (list, on) => list.forEach((p) => (p.group.visible = on));

  // ── sets ──────────────────────────────────────────────────────────────
  const TD = ST.townSquare(E), TS = ST.townSquare(E, { time: 'sunset', stage: true }), TN = ST.townSquare(E, { time: 'night' });
  // day cast
  const tro = new Blocky(TROFFEA), dWatch = [0, 1, 2, 3, 4].map((i) => new Blocky(townLook(i)));
  const lead = new Blocky(LEADER), lead2 = new Blocky(LEADER2);
  TD.scene.add(tro.group, lead.group, lead2.group, ...dWatch.map((p) => p.group));
  // sunset crowd (30 dancers) + band on stage
  const crowd = Array.from({ length: 30 }, (_, i) => new Blocky(townLook(i + 3)));
  crowd.forEach((p, i) => { const a = rnd(i * 3.1) * Math.PI * 2, r = 1.2 + rnd(i * 7.7) * 5.2; p.home = [Math.cos(a) * r, -3.5 + Math.sin(a) * r * 0.8]; p.at(p.home[0], 0, p.home[1]); TS.scene.add(p.group); });
  const band = [0, 1, 2].map((i) => new Blocky(townLook(i + 5))); band.forEach((p, i) => { p.at(-1.5 + i * 1.5, 0.98, -9.4); TS.scene.add(p.group); });
  const drums = band.map((p, i) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 20), new THREE.MeshStandardMaterial({ color: ['#C8283A', '#2A6CC8', '#E8B040'][i], roughness: 0.4 })); d.position.set(-1.5 + i * 1.5, 1.6, -8.75); d.castShadow = true; TS.scene.add(d); return d; });
  const troS = new Blocky(TROFFEA); TS.scene.add(troS.group); troS.at(0.2, 0, -2.2);
  // night: she dances alone
  const troN = new Blocky(TROFFEA); TN.scene.add(troN.group); troN.at(0, 0, -4);

  // ════════ 0 · "A whole city once couldn't stop dancing." ════════
  { const st = cut(0), wStop = Wd('stop', 0) - 0.05;
    add({ id: 'S01', at: st, note: 'sunset: the whole square is dancing, camera sweeps down into the crowd', draw(lt, d, t, blit) {
      const k = clamp(lt / d); crowd.forEach((p, i) => dance(p, t, i)); dance(troS, t, 99); band.forEach((p, i) => p.set({ mood: 'happy', armL: [70 + 30 * Math.sin(t * 9 + i), 10], armR: [70 - 30 * Math.sin(t * 9 + i), 10] }));
      shoot(TS, V3(3, 7, 10), V3(1.2, 3.2, 6.5), V3(0, 1, -4), V3(0, 1.4, -4), eio(k), { ...DUSK, fov: 44 }, t); blit();
    } });
    add({ id: 'S02', at: wStop, note: 'close on a grinning dancer, punch-in on "dancing"', draw(lt, d, t, blit) {
      const k = clamp(lt / d); crowd.forEach((p, i) => dance(p, t, i)); dance(troS, t, 99);
      const wD = Wd('dancing', 0), p = eo(clamp((t - wD + 0.05) / 0.25));
      shoot(TS, mix(V3(0.6, 2.0, 1.6), V3(0.35, 2.05, 0.35), p), mix(V3(0.5, 2.0, 1.2), V3(0.3, 2.05, 0.2), p), V3(0.2, 1.9, -2.2), null, eio(k), DUSK, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('dancing', 0), 'boing', { gain: 0.7 }); }

  // ════════ 1 · "In July 1518, in Strasbourg," ════════
  { const st = cut(1), wS = Wd('Strasbourg', 1) - 0.08;
    add({ id: 'S03', at: st, note: 'day: crane down over the town square (the year)', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, true); tro.group.visible = false; show([lead, lead2], false);
      dWatch.forEach((p, i) => { const z = -10 + i * 3 + ((t * 0.8 + i) % 6); p.at(-4 + i * 2, 0, z).turn(i % 2 ? 0 : 180).set({ legs: 'walk', phase: t * 6 + i, mood: 'neutral', blink: blink(t, i) }); });
      shoot(TD, V3(0, 16, 14), V3(0, 7, 9), V3(0, 2, -10), V3(0, 1.5, -8), eio(k), { ...DAY, fov: 46, aperture: 0.0002 }, t); blit();
    } });
    add({ id: 'S04', at: wS, note: 'street level: townsfolk going about their day', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, true); tro.group.visible = false; show([lead, lead2], false);
      dWatch.forEach((p, i) => { const x = -6 + ((t * 1.3 + i * 2.6) % 12); p.at(x, 0, -5 - i * 1.4).turn(90).set({ legs: 'walk', phase: t * 7 + i, mood: i % 2 ? 'happy' : 'neutral', blink: blink(t, i) }); });
      shoot(TD, V3(-2.2, 1.5, 3), V3(-0.8, 1.6, 2.4), V3(0, 1.6, -6), null, eio(k), DAY, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('1518', 1), 'ding', { gain: 0.6 }); }

  // ════════ 2 · "a woman called Frau Troffea stepped into the street" ════════
  { const st = cut(2), wSt = Wd('stepped', 2) - 0.05;
    add({ id: 'S05', at: st, note: 'Frau Troffea at her front door (house at x -11)', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, false); show([lead, lead2], false); tro.group.visible = true;
      tro.at(-8.0, 0, -4.6).turn(90).set({ mood: 'neutral', look: [0.6, 0], blink: blink(t), headYaw: -20 });
      shoot(TD, V3(-4.4, 1.8, -0.6), V3(-5.0, 1.8, -1.3), V3(-8.0, 1.5, -4.6), null, eio(k), DAY, t); blit();
    } });
    add({ id: 'S06', at: wSt, note: 'she steps out into the street', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, false); tro.group.visible = true;
      tro.at(lerp(-8.0, -5.4, eo(k)), 0, lerp(-4.6, -3.4, eo(k))).turn(70).set({ legs: 'walk', phase: t * 7, mood: 'neutral', look: [0.4, 0], blink: blink(t) });
      shoot(TD, V3(-2.6, 1.4, 0.4), V3(-3.0, 1.45, -0.2), V3(-6.4, 1.4, -4), V3(-5.4, 1.4, -3.4), eio(k), DAY, t); blit();
    } });
    cue(st, 'whoosh'); [0, 0.3, 0.6, 0.9].forEach((o) => cue(wSt + o, 'tock', { gain: 0.25 })); }

  // ════════ 3 · "and started dancing." ════════
  { const st = cut(3);
    add({ id: 'S07', at: st, note: 'she bursts into dancing; townsfolk stop and stare', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, true); tro.group.visible = true; show([lead, lead2], false);
      tro.at(-3, 0, -4).turn(0); dance(tro, t, 0, eo(clamp(lt / 0.3)), { mood: 'happy' });
      dWatch.forEach((p, i) => p.at(-6 + i * 1.6, 0, -8 - (i % 2)).turn(20 - i * 12).set({ mood: lt > 0.4 ? 'shock' : 'neutral', look: [i < 2 ? 0.8 : -0.8, 0], blink: blink(t, i) }));
      shoot(TD, V3(-0.4, 1.6, 1.4), V3(-1.0, 1.5, 0.4), V3(-3.2, 1.5, -5), null, eio(k), { ...DAY, fov: 40 }, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('dancing', 3), 'boing', { gain: 0.6 }); }

  // ════════ 4 · "No music. No reason." ════════
  { const st = cut(4), wR = (cut(4) + Le(4)) / 2 - 0.1;
    add({ id: 'S08', at: st, note: 'two townsfolk look at each other, confused', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, true); tro.group.visible = true; tro.at(-3, 0, -4).turn(0); dance(tro, t, 0);
      dWatch[0].at(-5.2, 0, -7).turn(30).set({ mood: 'worried', look: [0.8, 0], armR: [150, 20], headTilt: 12, blink: blink(t) });
      dWatch[1].at(-4.2, 0, -7.4).turn(-30).set({ mood: 'worried', look: [-0.8, 0], armL: [60, 30], armR: [60, 30], headTilt: -10 });
      shoot(TD, V3(-4.0, 1.9, -4.2), V3(-4.4, 1.9, -4.8), V3(-4.7, 1.8, -7.2), null, eio(k), DAY, t); blit();
    } });
    add({ id: 'S09', at: wR, note: 'punch-in on her face: dizzy, still dancing', draw(lt, d, t, blit) {
      const k = clamp(lt / d); tro.at(-3, 0, -4).turn(0); dance(tro, t, 0, 0.5, { mood: 'dizzy', turn: 0, armL: [150, 40], armR: [150, 40] });
      shoot(TD, V3(-2.7, 2.1, -1.3), V3(-2.85, 2.05, -1.8), V3(-3, 1.9, -4), null, eio(k), DAY, t); blit();
    } });
    cue(st, 'whoosh'); cue(wR + 0.05, 'zip', { gain: 0.5 }); }

  // ════════ 5 · "She danced for days," (night, under the string lights) ════════
  { const st = cut(5);
    add({ id: 'S10', at: st, note: 'night: still dancing alone under the string lights, exhausted', draw(lt, d, t, blit) {
      const k = clamp(lt / d); dance(troN, t, 3, 0.7, { mood: 'tired', sweat: 1 });
      shoot(TN, V3(3.5, 2.6, 3), V3(1.6, 2.2, 1.8), V3(0, 1.6, -4), null, eio(k), NIGHT, t); blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'chirp', { gain: 0.4 }); }

  // ════════ 6 · "and then her neighbours joined in." ════════
  { const st = cut(6), e6 = Le(6);
    add({ id: 'S11', at: st, note: 'day: neighbours pop in one by one and start dancing too', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, true); tro.group.visible = true; tro.at(-3, 0, -4).turn(0); dance(tro, t, 0);
      const spots = [[-4.6, -3.2], [-1.4, -3.4], [-4.2, -5.4], [-1.8, -5.6], [-3, -6.4]];
      dWatch.forEach((p, i) => { const t0 = st + 0.15 + i * (e6 - st - 0.3) / 5; p.group.visible = t > t0; p.at(spots[i][0], 0, spots[i][1]); dance(p, t, i + 1, eob(clamp((t - t0) / 0.3))); });
      shoot(TD, V3(-3, 2.4, 3.4), V3(-3, 2.2, 2.2), V3(-3, 1.4, -4.6), null, eio(k), { ...DAY, fov: 42 }, t); blit();
    } });
    cue(st, 'whoosh'); for (let i = 0; i < 5; i++) cue(cut(6) + 0.15 + i * (Le(6) - cut(6) - 0.3) / 5, 'pop', { gain: 0.6 }); }

  // ════════ 7 · "By August, as many as four hundred people were dancing," ════════
  { const st = cut(7), wP = Wd('people', 7) - 0.05;
    add({ id: 'S12', at: st, note: 'sunset: crane up to reveal the whole crowd dancing', draw(lt, d, t, blit) {
      const k = clamp(lt / d); crowd.forEach((p, i) => dance(p, t, i)); dance(troS, t, 99); band.forEach((p) => p.group.visible = false); drums.forEach((dr) => (dr.visible = false));
      shoot(TS, V3(0.5, 1.8, 4), V3(0, 11, 12), V3(0, 1.5, -3), V3(0, 0, -4), eio(k), { ...DUSK, fov: 46, aperture: 0.0003 }, t); blit();
    } });
    add({ id: 'S13', at: wP, note: 'low inside the crowd: arms and grins everywhere', draw(lt, d, t, blit) {
      const k = clamp(lt / d); crowd.forEach((p, i) => dance(p, t, i));
      shoot(TS, V3(-2.2, 1.0, 1.2), V3(-1.0, 1.1, 0.8), V3(0, 2.2, -4), null, eio(k), { ...DUSK, fov: 50 }, t); blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: 1.6, gain: 0.4 }); cue(wP + 0.1, 'boing', { gain: 0.5 }); }

  // ════════ 8 · "so the city's leaders had a brilliant idea:" ════════
  { const st = cut(8), wB = Wd('brilliant', 8) - 0.05;
    add({ id: 'S14', at: st, note: 'two city leaders watch, worried, chins in hand', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show(dWatch, false); tro.group.visible = false; show([lead, lead2], true);
      lead.at(4.6, 0, -2).turn(-35).set({ mood: 'worried', armR: [120, -10], look: [-0.6, 0], blink: blink(t) }); lead2.at(5.8, 0, -2.8).turn(-45).set({ mood: 'worried', armL: [110, 10], look: [-0.8, 0] });
      shoot(TD, V3(3.2, 1.9, 2.2), V3(3.6, 1.9, 1.4), V3(5.2, 1.8, -2.4), null, eio(k), DAY, t); blit();
    } });
    add({ id: 'S15', at: wB, note: 'the leader gets the idea: finger up, sly grin (punch-in)', draw(lt, d, t, blit) {
      const k = clamp(lt / d), p = eo(clamp(lt / 0.25)); show([lead, lead2], true);
      lead.at(4.6, 0, -2).turn(-35).set({ mood: lt > 0.15 ? 'sly' : 'shock', armR: [lerp(120, 170, p), 10], look: [-0.4, -0.4] }); lead2.at(5.8, 0, -2.8).turn(-45).set({ mood: 'shock', look: [-1, 0] });
      shoot(TD, mix(V3(3.6, 2.0, 0.8), V3(4.1, 2.05, -0.3), p), V3(4.15, 2.05, -0.5), V3(4.7, 2.0, -2), null, k, DAY, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('brilliant', 8), 'ding', { gain: 0.8 }); }

  // ════════ 9 · "more dancing." ════════
  { const st = cut(9);
    add({ id: 'S16', at: st, note: 'the leaders start dancing too', draw(lt, d, t, blit) {
      const k = clamp(lt / d); show([lead, lead2], true); lead.at(4.6, 0, -2); lead2.at(5.8, 0, -2.8); dance(lead, t, 1); dance(lead2, t, 2);
      shoot(TD, V3(3.4, 1.6, 2.4), V3(3.8, 1.7, 1.2), V3(5.2, 1.6, -2.4), null, eio(k), { ...DAY, fov: 40 }, t); blit();
    } });
    cue(st, 'boing', { gain: 0.7 }); }

  // ════════ 10 · "They built a stage and hired a band," ════════
  { const st = cut(10), wBand = Wd('hired', 10) - 0.05;
    add({ id: 'S17', at: st, note: 'sunset: the new stage with its banner', draw(lt, d, t, blit) {
      const k = clamp(lt / d); crowd.forEach((p, i) => dance(p, t, i, 0.6)); band.forEach((p) => (p.group.visible = false)); drums.forEach((dr) => (dr.visible = false));
      shoot(TS, V3(-7.2, 2.4, -5.2), V3(-6.4, 2.5, -6.2), V3(0, 2.0, -9.5), null, eio(k), DUSK, t); blit();
    } });
    add({ id: 'S18', at: wBand, note: 'the band pounds the drums', draw(lt, d, t, blit) {
      const k = clamp(lt / d); band.forEach((p, i) => { p.group.visible = true; p.turn(0).set({ mood: 'grin', armL: [70 + 40 * Math.max(0, Math.sin(t * 12 + i)), 10], armR: [70 + 40 * Math.max(0, Math.sin(t * 12 + i + Math.PI)), 10], bob: Math.abs(Math.sin(t * 6 + i)) * 0.05, blink: blink(t, i) }); });
      drums.forEach((dr) => (dr.visible = true)); crowd.forEach((p, i) => dance(p, t, i));
      shoot(TS, V3(0.6, 2.4, -4.2), V3(0.2, 2.3, -5.2), V3(0, 2.1, -9.2), null, eio(k), DUSK, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('stage', 10), 'thud', { gain: 0.6 }); for (let i = 0; i < 6; i++) cue(Wd('band', 10) + i * 0.17, 'thud', { gain: 0.35 }); }

  // ════════ 11 · "and it only made things worse." ════════
  { const st = cut(11), wW = Wd('made', 11) - 0.05;
    add({ id: 'S19', at: st, note: 'faster, sweatier dancing everywhere', draw(lt, d, t, blit) {
      const k = clamp(lt / d); band.forEach((p) => (p.group.visible = true)); drums.forEach((dr) => (dr.visible = true));
      crowd.forEach((p, i) => dance(p, t * 1.4, i, 1, { mood: i % 3 ? 'worried' : 'tired', sweat: 1 }));
      shoot(TS, V3(2.4, 2.0, 2.8), V3(1.4, 1.8, 1.6), V3(0, 1.4, -3.5), null, eio(k), { ...DUSK, fov: 44 }, t); blit();
    } });
    add({ id: 'S20', at: wW, note: 'dancers flop down exhausted (punch on "worse")', draw(lt, d, t, blit) {
      const k = clamp(lt / d);
      crowd.forEach((p, i) => { if (i % 2) p.set({ legs: 'sit', mood: 'tired', sweat: 1, armL: [10, 30], armR: [10, 30], headTilt: 15, turn: (rnd(i) - 0.5) * 60 }); else dance(p, t * 1.4, i, 0.6, { mood: 'dizzy', sweat: 1 }); });
      const p = eo(clamp(lt / 0.2));
      shoot(TS, mix(V3(2.4, 5.2, 5.0), V3(1.6, 4.4, 3.6), p), V3(1.5, 4.3, 3.4), V3(0, 0.6, -3), null, k, { ...DUSK, fov: 44 }, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('worse', 11), 'thud', { gain: 0.8 }); }

  // ════════ 12 · "To this day, nobody knows why it started." ════════
  { const st = cut(12);
    add({ id: 'S21', at: st, note: 'night: the empty square, one woman still dancing; slow push in (loops to the start)', draw(lt, d, t, blit) {
      const k = clamp(lt / d); dance(troN, t, 5, 0.8, { mood: 'happy' });
      shoot(TN, V3(0, 5, 9), V3(0, 2.6, 2.6), V3(0, 1.2, -4), V3(0, 1.6, -4), eio(k), { ...NIGHT, fov: 40 }, t); blit();
    } });
    add({ id: 'S22', at: Wd('nobody', 12) - 0.05, note: 'close on her happy face, still dancing', draw(lt, d, t, blit) {
      const k = clamp(lt / d); dance(troN, t, 5, 0.8, { mood: 'happy' });
      dance(troN, t, 5, 0.5, { mood: 'happy', turn: 0 }); shoot(TN, V3(1.0, 2.1, -0.9), V3(0.6, 2.05, -1.5), V3(0, 1.9, -4), null, eio(k), NIGHT, t); blit();
    } });
    cue(st, 'whoosh'); cue(Wd('knows', 12), 'chirp', { gain: 0.5 }); }

  return { shots: S, cues: CUES };
}
