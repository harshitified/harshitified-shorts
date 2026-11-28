// Block Town captions: 1-3 words at a time, white heavy sans with a thick black edge and a drop shadow, ONE key word
// coloured (yellow by default). A chunk can break onto a second line for the big word, which is then set in CAPITALS.
// script.json "caps" syntax:  "stepped out of the / *{p}darkness" → line 1 "stepped out of the", line 2 "DARKNESS" in purple.
//   *word      highlight in yellow        *{g}word green    *{p}word purple    *{r}word red    *{c}word cyan
//   /          break to a second line (the words after it are set in CAPITALS, slightly bigger)
// Without "caps", chunks are made automatically (2-3 words, broken at punctuation, the longest word highlighted).
import { ctx, lerp, seg, eob } from './lib.js';
import { T, lineWords } from './timing.js';

export const CAP = { y: 1330, size: 86, big: 104, maxW: 980 };
export const HUE = { y: '#FFE53B', g: '#2FD96A', p: '#A98BFF', r: '#FF4A4A', c: '#4FE0F0' };
let caps = [];

function autoChunks(words) {
  const out = []; let cur = [];
  words.forEach((w, i) => { cur.push(i); const end = /[,.!?;:]$/.test(w) || cur.length === 3 || (cur.length === 2 && w.length > 8); if (end) { out.push(cur); cur = []; } });
  if (cur.length) out.push(cur);
  return out;
}
const nm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');

export function buildCaptions(script) {
  caps = [];
  script.lines.forEach((ln, i) => {
    const ws = lineWords(i); if (!ws.length) return;
    const textWords = ln.text.split(/\s+/).filter(Boolean);
    const spoken = ws.length === textWords.length ? textWords : ws.map((w) => w.w);
    if (ln.caps) {
      let from = 0;
      ln.caps.split('|').map((c) => c.trim()).filter(Boolean).forEach((c, j) => {
        const first = nm(c.replace(/\*(\{\w\})?/g, '').replace('/', ' ').trim().split(/\s+/)[0]);
        let idx = j === 0 ? 0 : ws.findIndex((w, k) => k > from && nm(w.w) === first);
        if (idx < 0) idx = Math.min(ws.length - 1, from + 1);
        from = idx; caps.push({ line: i, s: ws[idx].s - 0.03, text: c });
      });
    } else autoChunks(spoken).forEach((ix) => {
      const words = ix.map((k) => spoken[k]); let best = -1, bl = 4;
      words.forEach((w, k) => { const l = w.replace(/[^A-Za-z]/g, '').length; if (l > bl) { bl = l; best = k; } });
      caps.push({ line: i, s: ws[ix[0]].s - 0.03, text: words.map((w, k) => (k === best ? '*' + w : w)).join(' ') });
    });
  });
  caps.forEach((c, k) => { const next = caps[k + 1], lineEnd = T.lines[c.line].end; c.e = next ? (next.s - lineEnd > 0.6 && next.line !== c.line ? lineEnd + 0.25 : next.s) : T.dur; });
  return caps;
}
export const captionList = () => caps.map((c) => ({ ...c, words: [{ txt: c.text }] }));

/** parse "a b *{p}c / *d" → [[{t, col}], [{t, col}]] */
function parse(text) {
  return text.split('/').map((part, li) => part.trim().split(/\s+/).filter(Boolean).map((w) => {
    const m = w.match(/^\*(?:\{(\w)\})?(.*)$/); const t = m ? m[2] : w;
    return { t: li > 0 ? t.toUpperCase() : t, col: m ? HUE[m[1] || 'y'] : '#FFFFFF' };
  }));
}
/** draw a caption chunk centred at x, y (also used by the style sheet) */
export function captionText(text, x = 540, y = CAP.y, sc = 1) {
  const lines = parse(text);
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.letterSpacing = '0px';
  const lh = lines.length > 1 ? 96 : 0, y0 = -lh * (lines.length - 1) / 2;
  lines.forEach((ws, li) => {
    const size = li > 0 ? CAP.big : CAP.size; ctx.font = `900 ${size}px Inter`;
    const sp = size * 0.26, widths = ws.map((w) => ctx.measureText(w.t).width), tot = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    const fit = Math.min(1, CAP.maxW / tot);
    ctx.save(); ctx.translate(0, y0 + li * lh); ctx.scale(fit, fit);
    let cx = -tot / 2;
    ws.forEach((w, k) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(w.t, cx + 4, 10);
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#0A0A0E'; ctx.strokeText(w.t, cx, 0);
      ctx.fillStyle = w.col; ctx.fillText(w.t, cx, 0);
      cx += widths[k] + sp;
    });
    ctx.restore();
  });
  ctx.restore();
}
export function drawCaption(t) {
  const c = caps.find((c) => t >= c.s && t < c.e); if (!c) return;
  const lt = t - c.s; captionText(c.text, 540, CAP.y, lt < 0.12 ? lerp(0.8, 1, eob(seg(lt, 0, 0.12))) : 1);
}
