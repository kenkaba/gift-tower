/* ============================================================
   THE PAIRING GAME — 香りは一瞬。ノートを逃すな。
   言葉は曖昧。香りは正直。

   お客さまの手紙（言葉）は段階的に曖昧になる。
   一方で箱の右上に一瞬だけ香る「ノート」は絶対に正しい。
   ノートと同じ素材のコロンを選ぶと、ギフトボックスにコロンが1本入る。
   間違えるとスプレーを1回ムダにする。3回で今日は打ち止め。
   2本入ると「トップノートが飛ぶ」（ノートが遅く出て、すぐ消える。手紙は物語だけ）
   → ペアリングタイム×2（どれを重ねても正解＝重ねづけにルールはない）
   → DISCOVERY RUSH（1秒5連戦、失敗してもスプレーは減らない）
   → RIBBONゲージ満タンで、自分の手でリボンを引いて結ぶ → 完成。

   勝敗を決めるのは judge() ただ一箇所。
   ============================================================ */
(() => {
'use strict';

/* ---------------- 設定（コロン・景品・文言はここだけ変える） ---------------- */
const CONFIG = {
  brand: 'SCENT PAIRING ARCADE',   // タイトル上の小さな見出し。会場名やイベント名に差し替える
  boxBrand: 'PAIRING',             // 箱に印字する文字
  // 出題プール。毎プレイ、この中から3本を選んで出題する（一対一：ノート＝コロン）
  pool: [
    { key: 'pear',   name: 'イングリッシュ ペアー & フリージア', short: 'ペアー & フリージア', note: '洋梨',        c: '#e9c86a', c2: '#a8862a', icon: 'pear',
      lines: { name: 'イングリッシュ ペアー & フリージアが 欲しいの', ingr: 'みずみずしい洋梨に、白いフリージアを 添えて', story: '秋のはじまり。果樹園の 朝もやの記憶' } },
    { key: 'sea',    name: 'ウッド セージ & シー ソルト',         short: 'セージ & シー ソルト',  note: '海の塩',      c: '#9fc3cf', c2: '#4a7f90', icon: 'sea',
      lines: { name: 'ウッド セージ & シー ソルトを お願い', ingr: '潮風の 塩気と、セージの葉', story: '裸足で歩いた、風の強い 海岸' } },
    { key: 'lime',   name: 'ライム バジル & マンダリン',          short: 'ライム バジル',        note: 'ライム',      c: '#b9d66e', c2: '#5f8a1f', icon: 'lime',
      lines: { name: 'ライム バジル & マンダリンが いいな', ingr: 'ライムの皮に、バジルと マンダリン', story: 'はじけるように 始まる、ロンドンの 午後' } },
    { key: 'nect',   name: 'ネクタリン ブロッサム & ハニー',      short: 'ネクタリン & ハニー',   note: 'ネクタリン',  c: '#f4b27a', c2: '#c06a2a', icon: 'nect',
      lines: { name: 'ネクタリン ブロッサム & ハニーを', ingr: 'ネクタリンの花と、とろりとした 蜂蜜', story: '朝市で買った、熟れた果実の かご' } },
    { key: 'rose',   name: 'レッド ローズ',                      short: 'レッド ローズ',         note: 'バラ',        c: '#e07a8c', c2: '#a8203c', icon: 'rose',
      lines: { name: 'レッド ローズが 恋しいわ', ingr: '七種のバラと、スミレの葉', story: '摘みたての花束を 抱えて帰る道' } },
    { key: 'peony',  name: 'ピオニー & ブラッシュ スエード',       short: 'ピオニー & スエード',   note: 'ピオニー',    c: '#f2b8c6', c2: '#b8506c', icon: 'peony',
      lines: { name: 'ピオニー & ブラッシュ スエードを 一本', ingr: '咲きたてのピオニーに、やわらかな スエード', story: '春の午後、窓辺に 置いた一輪' } },
    { key: 'berg',   name: 'シー ソルト & ベルガモット',           short: 'ソルト & ベルガモット', note: 'ベルガモット', c: '#8fd1c4', c2: '#1f8a78', icon: 'berg',
      lines: { name: 'シー ソルト & ベルガモットは ある？', ingr: 'ベルガモットの光と、海の塩', story: '荒々しい 波しぶきを浴びた朝' } },
  ],
  prizes: { S: 'コロン 9mL', A: 'コロン 1.5mL ×2', C: 'コロン 1.5mL' },
  // ギフトに入ったコロンの数ごとの難度。説明は増やさず、ノートが見える時間だけを削る
  layers: {
    0: { limit: 3200, signDelay: 0,   signVisible: Infinity, words: 'name'  },
    1: { limit: 2600, signDelay: 300, signVisible: 1400,     words: 'ingr'  },
    2: { limit: 2200, signDelay: 700, signVisible: 750,      words: 'story' },
  },
  rush: { rounds: 5, limit: 1000, signDelay: 100, signVisible: 500 },
  ribbon: { perFill: 30, perRush: 8, perPost: 20 },
  pairPerTurn: 50,
  resultIdleMs: 30000,
};

/* ---------------- ユーティリティ ---------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
let SPEED = 1;
const wait = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick3 = () => Math.floor(Math.random() * 3);
function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/* 勝敗を決める唯一の場所 */
function judge(pickIdx, truthIdx) {
  if (pickIdx === null || pickIdx === undefined) return 'late';
  return pickIdx === truthIdx ? 'hit' : 'miss';
}

/* ---------------- 音（WebAudio 完全合成。紙・ガラス・鈴の系統） ---------------- */
const Snd = {
  ctx: null, master: null, ok: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination); this.ok = true;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch (e) { this.ok = false; }
  },
  now() { return this.ctx.currentTime; },
  tone({ f = 440, t = 0, d = 0.18, type = 'sine', v = 0.3, f2 = null }) {
    if (!this.ok) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), T = this.now() + t;
    o.type = type; o.frequency.setValueAtTime(f, T);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), T + d);
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(v, T + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, T + d);
    o.connect(g); g.connect(this.master); o.start(T); o.stop(T + d + 0.03);
  },
  noise({ t = 0, d = 0.2, v = 0.3, hp = 200, lp = 6000 }) {
    if (!this.ok) return;
    const c = this.ctx, len = Math.max(1, Math.floor(c.sampleRate * d));
    const b = c.createBuffer(1, len, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = b;
    const hpf = c.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = hp;
    const lpf = c.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = lp;
    const g = c.createGain(), T = this.now() + t;
    g.gain.setValueAtTime(v, T); g.gain.exponentialRampToValueAtTime(0.0001, T + d);
    s.connect(hpf); hpf.connect(lpf); lpf.connect(g); g.connect(this.master); s.start(T);
  },
  ui() { this.tone({ f: 1046, d: 0.06, type: 'sine', v: 0.08 }); },
  letter() { this.noise({ d: 0.14, v: 0.08, hp: 1500, lp: 6000 }); },       // 紙をめくる
  signOn() { this.tone({ f: 1568, f2: 2093, d: 0.1, type: 'sine', v: 0.08 }); },
  /** スプレーの「シュッ」＋ガラスの鈴 */
  hit() {
    this.noise({ d: 0.16, v: 0.3, hp: 3000, lp: 11000 });
    this.tone({ f: 1046, d: 0.35, type: 'sine', v: 0.14 });
    this.tone({ f: 1568, t: 0.08, d: 0.45, type: 'sine', v: 0.1 });
    this.tone({ f: 2093, t: 0.16, d: 0.5, type: 'sine', v: 0.06 });
  },
  /** ミスマッチ。木のこつん */
  miss() { this.tone({ f: 220, f2: 130, d: 0.22, type: 'triangle', v: 0.16 }); this.noise({ d: 0.12, v: 0.08, hp: 200, lp: 900 }); },
  /** 重ねづけ。ハープの二音 */
  pair() { this.tone({ f: 784, d: 0.5, type: 'sine', v: 0.1 }); this.tone({ f: 1175, t: 0.12, d: 0.6, type: 'sine', v: 0.09 }); this.noise({ d: 0.3, v: 0.06, hp: 2500, lp: 9000 }); },
  tick(p) { this.tone({ f: 1200 + p * 300, d: 0.035, type: 'triangle', v: 0.06 }); },
  rushHit() { this.noise({ d: 0.07, v: 0.16, hp: 3500, lp: 12000 }); this.tone({ f: 1400 + Math.random() * 500, d: 0.12, type: 'sine', v: 0.1 }); },
  rushStart() { [784, 988, 1175].forEach((f, i) => this.tone({ f, t: i * 0.08, d: 0.25, type: 'sine', v: 0.09 })); },
  /** トップノートが飛ぶ。息のような下降 */
  fade() { this.noise({ d: 0.9, v: 0.14, hp: 600, lp: 4000 }); this.tone({ f: 440, f2: 220, d: 0.9, type: 'sine', v: 0.1 }); },
  ribbon() { this.noise({ d: 0.5, v: 0.14, hp: 800, lp: 5000 }); this.tone({ f: 330, f2: 660, d: 0.5, type: 'sine', v: 0.06 }); },
  wrapped() {
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone({ f, t: i * 0.09, d: 0.9, type: 'sine', v: 0.11 }));
    this.noise({ t: 0.4, d: 0.9, v: 0.12, hp: 4000, lp: 14000 });
    this.tone({ f: 262, t: 0.5, d: 1.6, type: 'triangle', v: 0.07 });
  },
  lose() { [523, 440, 349].forEach((f, i) => this.tone({ f, t: i * 0.22, d: 0.5, type: 'sine', v: 0.1 })); },
};

/* ---------------- 背景（クリームの紙・淡い光・金の粉） ---------------- */
const BG = (() => {
  const c = $('#bg'); const x = c.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const blobs = [], dust = [], parts = [];
  const PAL = ['#f3d9a4', '#f2cfd0', '#d5e3d4', '#e8d9b8', '#dfe4ec'];
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!blobs.length) {
      for (let i = 0; i < 5; i++) blobs.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(160, 300), vx: rnd(-0.08, 0.08), vy: rnd(-0.06, 0.06), col: PAL[i % PAL.length] });
      for (let i = 0; i < 40; i++) dust.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2), p: rnd(0, Math.PI * 2), s: rnd(0.006, 0.016), vy: rnd(-0.05, -0.15) });
    }
  }
  function burst(px, py, col, n = 26, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(1.2, 5) * power;
      parts.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 1, decay: rnd(0.01, 0.025), size: rnd(2, 5), col, petal: Math.random() < 0.5, rot: rnd(0, 6.28), vr: rnd(-0.1, 0.1) });
    }
  }
  function drawPetal(p) {
    x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
    x.beginPath(); x.ellipse(0, 0, p.size * 1.6, p.size * 0.9, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  function frame() {
    x.clearRect(0, 0, W, H);
    for (const b of blobs) {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;
      const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.col + '66'); g.addColorStop(1, b.col + '00');
      x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill();
    }
    for (const d of dust) {
      d.p += d.s; d.y += d.vy; if (d.y < -4) { d.y = H + 4; d.x = rnd(0, W); }
      const a = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(d.p));
      x.fillStyle = `rgba(201,169,97,${a})`;
      x.beginPath(); x.arc(d.x, d.y, d.r, 0, Math.PI * 2); x.fill();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.vx *= 0.985; p.life -= p.decay; p.rot += p.vr;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      x.globalAlpha = clamp(p.life, 0, 1); x.fillStyle = p.col;
      if (p.petal) drawPetal(p); else { x.beginPath(); x.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2); x.fill(); }
      x.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  resize(); frame();
  return { burst, residue: () => parts.length };
})();

/* ---------------- 素材の線画アイコン（白線、40×40） ---------------- */
const ICONS = {
  pear: '<path d="M20 8 c-1 4 -4 6 -4 11 c0 3 -5 5 -5 10 c0 5 4 8 9 8 s9 -3 9 -8 c0 -5 -5 -7 -5 -10 c0 -5 -3 -7 -4 -11z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 8 c2 -3 5 -3 7 -2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  sea:  '<path d="M6 16 q4 -5 8 0 t8 0 t8 0 t4 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 24 q4 -5 8 0 t8 0 t8 0 t4 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="32" r="1.6" fill="currentColor"/><circle cx="20" cy="33" r="1.6" fill="currentColor"/><circle cx="28" cy="32" r="1.6" fill="currentColor"/>',
  lime: '<circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 8 v24 M8 20 h24 M11.5 11.5 l17 17 M28.5 11.5 l-17 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  nect: '<circle cx="20" cy="18" r="4" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2.4"><ellipse cx="20" cy="8" rx="4" ry="5"/><ellipse cx="29" cy="15" rx="5" ry="4" transform="rotate(35 29 15)"/><ellipse cx="26" cy="26" rx="5" ry="4" transform="rotate(-40 26 26)"/><ellipse cx="14" cy="26" rx="5" ry="4" transform="rotate(40 14 26)"/><ellipse cx="11" cy="15" rx="5" ry="4" transform="rotate(-35 11 15)"/></g><path d="M20 30 c0 4 2 6 2 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  rose: '<path d="M20 20 m-1 0 a1 1 0 1 0 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 0 10 0 a7 7 0 1 1 -14 0 a9 9 0 1 0 18 0 a11 11 0 1 1 -22 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M14 33 q6 -2 12 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  peony: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M20 30 c-8 0 -12 -6 -10 -12 c2 -5 8 -6 10 -2 c2 -4 8 -3 10 2 c2 6 -2 12 -10 12z"/><path d="M20 16 c-3 3 -3 8 0 12"/><path d="M20 16 c3 3 3 8 0 12"/><path d="M12 14 c-2 -4 1 -8 5 -7"/><path d="M28 14 c2 -4 -1 -8 -5 -7"/></g>',
  berg: '<circle cx="17" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M17 11 v18 M8 20 h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M24 30 q4 -4 8 0 t6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M25 10 c4 -4 8 -2 9 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
};

/* ---------------- DOM ---------------- */
const UI = {
  app: $('#app'), flash: $('#flash'), box: $('#box'), boxWrap: $('#boxWrap'),
  letter: $('#letter'), letterText: $('#letterText'), sign: $('#sign'), signIcon: $('#signIcon'), signLabel: $('#signLabel'),
  coach: $('#coach'), timeFill: $('#timeFill'), center: $('#center'), big: $('#bigText'), sub: $('#subText'),
  pairFill: $('#pairFill'), ribbonFill: $('#ribbonFill'), ribbonGauge: $('.gauge.ribbon'),
  giftPips: $$('#giftPips i'), sprayPips: $$('#sprayPips i'),
  btns: $$('.pbtn'), swipe: $('#swipeLayer'), ribbonEnd: $('#ribbonEnd'), swipeHint: $('#swipeHint'),
  slots: $$('.slot'), lid: $('#lid'), bow: $('#bow'), sparkles: $('#sparkles'),
};

function boxCenter() { const r = UI.box.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }; }
function slotCenter(i) { const r = UI.slots[i].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
function flash() { UI.flash.classList.remove('on'); void UI.flash.offsetWidth; UI.flash.classList.add('on'); }
function shake() { UI.app.classList.remove('shake'); void UI.app.offsetWidth; UI.app.classList.add('shake'); }
function boxHit() { UI.box.classList.remove('hit'); void UI.box.offsetWidth; UI.box.classList.add('hit'); }

function setLetter(text, story = false) {
  UI.letterText.textContent = text;
  UI.letter.classList.toggle('story', story);
  UI.letter.classList.remove('pop'); void UI.letter.offsetWidth; UI.letter.classList.add('pop');
}
function setCoach(t) { UI.coach.textContent = t || ''; }

function trioItem(i) { return CONFIG.pool[S.trio[i]]; }
function showSign(i) {
  const t = trioItem(i);
  UI.sign.style.setProperty('--c', t.c); UI.sign.style.setProperty('--c2', t.c2);
  UI.signIcon.innerHTML = ICONS[t.icon]; UI.signIcon.style.color = '#ffffff';
  UI.signLabel.textContent = t.note;
  UI.sign.classList.add('on');
  Snd.signOn();
}
function hideSign() { UI.sign.classList.remove('on'); }

let centerTimer = null;
function bigText(main, sub = '', tone = '', hold = false) {
  UI.big.textContent = main; UI.sub.textContent = sub;
  UI.center.className = ''; void UI.center.offsetWidth;
  UI.center.classList.add('on');
  if (tone) UI.center.classList.add('tone-' + tone);
  if (hold) UI.center.classList.add('hold');
  clearTimeout(centerTimer);
  if (!hold) centerTimer = setTimeout(() => UI.center.classList.remove('on'), 1200 * SPEED);
}

function runTimeBar(ms) {
  UI.timeFill.style.transition = 'none'; UI.timeFill.style.width = '100%'; void UI.timeFill.offsetWidth;
  UI.timeFill.style.transition = `width ${ms * SPEED}ms linear`; UI.timeFill.style.width = '0%';
}
function stopTimeBar() { const w = getComputedStyle(UI.timeFill).width; UI.timeFill.style.transition = 'none'; UI.timeFill.style.width = w; }

function setButtons(on) { UI.btns.forEach((b) => { b.disabled = !on; b.classList.remove('correct', 'down'); }); }
function markCorrect(i) { UI.btns[i].classList.add('correct'); }

function updatePips() {
  UI.giftPips.forEach((p, i) => p.classList.toggle('on', i < S.filled));
  UI.sprayPips.forEach((p, i) => p.classList.toggle('off', i >= S.spray));
}
function updateGauges() {
  UI.pairFill.style.width = clamp(S.pair, 0, 100) + '%';
  UI.ribbonFill.style.width = clamp(S.ribbon, 0, 100) + '%';
  UI.ribbonGauge.classList.toggle('full', S.ribbon >= 100);
}

const Box = {
  reset() {
    UI.box.setAttribute('class', 'idle');
    UI.slots.forEach((s) => s.classList.remove('on'));
    UI.bow.classList.remove('on'); UI.sparkles.classList.remove('on');
    hideSign();
  },
  fill(i, item) {
    const s = UI.slots[i];
    s.querySelector('.liquid').setAttribute('fill', item.c);
    s.querySelector('.chip').setAttribute('fill', item.c2);
    s.classList.add('on');
    const p = slotCenter(i);
    BG.burst(p.x, p.y, item.c, 18, 1); BG.burst(p.x, p.y, '#c9a961', 10, 0.8);
  },
  fading(on) { UI.box.classList.toggle('fading', on); },
  close() { UI.box.classList.add('closed'); },
  tie() { UI.bow.classList.add('on'); UI.sparkles.classList.add('on'); },
};

/* ---------------- ゲーム状態 ---------------- */
const S = {
  phase: 'title', // title | fight | pairing | rush | post | swipe | lose | result
  trio: [0, 1, 2], filled: 0, spray: 3, pair: 0, ribbon: 0,
  faded: false, pairDone: 0, pairPicks: [], rush: null, turn: null,
  turns: 0, hits: 0, misses: 0, startAt: 0, endAt: 0, cleared: false,
};
function resetState() {
  Object.assign(S, { phase: 'fight', filled: 0, spray: 3, pair: 0, ribbon: 0, faded: false, pairDone: 0, pairPicks: [], rush: null, turn: null, turns: 0, hits: 0, misses: 0, startAt: 0, endAt: 0, cleared: false });
  S.trio = shuffle(CONFIG.pool.map((_, i) => i)).slice(0, 3);
}
const PLAYING = () => !['title', 'result', 'lose'].includes(S.phase);
function layerCfg() { return CONFIG.layers[Math.min(S.filled, 2)]; }

/* ---------------- ボタンへコロンを割り当て ---------------- */
function renderButtons() {
  UI.btns.forEach((b, i) => {
    const t = trioItem(i);
    b.style.setProperty('--c', t.c); b.style.setProperty('--c2', t.c2);
    b.querySelector('.tag svg').innerHTML = ICONS[t.icon];
    b.querySelector('.lab').textContent = t.short;
    b.querySelector('.nm').textContent = t.note;
    b.setAttribute('aria-label', t.name);
  });
}

/* ---------------- 1ターン ---------------- */
function after(ms, fn) { const id = setTimeout(fn, ms * SPEED); S.turn.timers.push(id); return id; }

function startTurn(kind = 'normal') {
  if (!PLAYING()) return;
  const cfg = kind === 'rush' ? CONFIG.rush : layerCfg();
  const truth = pick3();
  S.turn = { kind, truth, resolved: false, timers: [], cfg };
  S.turns++;
  const T = trioItem(truth);

  if (kind === 'pairing') {
    setLetter('もう一本、重ねて。どれを 重ねても 素敵');
    setCoach('重ねづけに ルールはない。スプレーは減らない');
  } else if (kind === 'rush') {
    setLetter(`DISCOVERY RUSH  ${S.rush.i + 1} / ${CONFIG.rush.rounds}`);
    setCoach('失敗しても スプレーは減らない');
  } else {
    const words = S.faded ? 'story' : cfg.words;
    setLetter(T.lines[words], words === 'story');
    setCoach(S.faded ? 'トップノートが飛んだ。言葉は物語だけ。ノートを逃すな' : (S.turns === 1 ? '一瞬だけ香るノートと 同じ素材のコロンを選ぶ' : ''));
    Snd.letter();
  }

  hideSign();
  if (kind !== 'pairing') {
    after(cfg.signDelay, () => showSign(truth));
    if (isFinite(cfg.signVisible)) after(cfg.signDelay + cfg.signVisible, hideSign);
  }
  setButtons(true);
  runTimeBar(cfg.limit);
  if (cfg.limit > 1500) { after(cfg.limit - 1000, () => Snd.tick(0)); after(cfg.limit - 500, () => Snd.tick(1)); }
  after(cfg.limit, () => resolve(null));
}

function resolve(pickIdx) {
  const T = S.turn;
  if (!T || T.resolved) return;
  T.resolved = true; T.timers.forEach(clearTimeout);
  setButtons(false); stopTimeBar(); hideSign();
  if (T.kind === 'pairing') return onPair(pickIdx);
  const r = judge(pickIdx, T.truth);
  if (T.kind === 'rush') return onRush(r === 'hit', pickIdx);
  if (r === 'hit') return onHit(pickIdx);
  return onMiss(pickIdx, r === 'late');
}

async function onHit(pickIdx) {
  const item = trioItem(pickIdx);
  S.hits++;
  markCorrect(pickIdx); Snd.hit(); flash(); boxHit();
  const c = boxCenter(); BG.burst(c.x, c.y, item.c, 24, 1.2); BG.burst(c.x, c.y, '#c9a961', 12, 1);

  if (S.phase === 'fight') {
    Box.fill(S.filled, item);
    S.filled++;
    S.ribbon = clamp(S.ribbon + CONFIG.ribbon.perFill, 0, 100);
    updatePips(); updateGauges();
    bigText('ぴったり', `${item.note} → ${item.short}`, 'hit');
    if (S.filled === 2) {
      await wait(950);
      await fadeTopNotes();
      S.phase = 'pairing';
      await wait(200);
      return startTurn('pairing');
    }
    await wait(1000);
    return startTurn('normal');
  }
  // post: トップノートが飛んだ後の通常ターン。最後の1本はリボンで仕上げる
  S.ribbon = clamp(S.ribbon + CONFIG.ribbon.perPost, 0, 100);
  updateGauges();
  bigText('ぴったり', `RIBBON ${S.ribbon}%`, 'hit');
  await wait(1000);
  if (S.ribbon >= 100) return startSwipe();
  return startTurn('normal');
}

async function onMiss(pickIdx, late) {
  const T = S.turn, truth = trioItem(T.truth);
  S.misses++; S.spray--; updatePips();
  Snd.miss(); shake();
  showSign(T.truth); markCorrect(T.truth);
  bigText(late ? '香りが 消えた' : 'ミスマッチ', `${truth.note}には ${truth.short}`, 'miss');
  if (S.spray <= 0) return lose();
  await wait(1150);
  hideSign();
  return startTurn('normal');
}

async function onPair(pickIdx) {
  const idx = pickIdx === null ? pick3() : pickIdx;
  const item = trioItem(idx);
  S.pairPicks.push(idx);
  S.pairDone++;
  S.pair = clamp(S.pair + CONFIG.pairPerTurn, 0, 100); updateGauges();
  Snd.pair(); markCorrect(idx);
  const c = boxCenter(); BG.burst(c.x, c.y, item.c, 16, 0.7); BG.burst(c.x, c.y, '#ffffff', 10, 0.5);
  bigText('重ねづけ', `${item.short} を 重ねた`, '');
  await wait(1000);
  if (S.pairDone >= 2) return startRush();
  return startTurn('pairing');
}

async function fadeTopNotes() {
  S.faded = true;
  Box.fading(true);
  Snd.fade();
  setLetter('…あら、香りが 飛んでしまったわ', true);
  bigText('トップノートが 飛んだ', 'ノートは 遅く出て、すぐ消える', 'miss');
  await wait(1400);
}

/* ---------------- DISCOVERY RUSH ---------------- */
async function startRush() {
  if (!PLAYING()) return;
  S.phase = 'rush'; S.rush = { i: 0, hits: 0 };
  S.pair = 100; updateGauges();
  Snd.rushStart(); flash();
  bigText('DISCOVERY RUSH', `${CONFIG.rush.rounds}本 連続。失敗しても スプレーは減らない`, 'gold');
  await wait(1400);
  startTurn('rush');
}
async function onRush(ok, pickIdx) {
  if (ok) {
    S.rush.hits++;
    S.ribbon = clamp(S.ribbon + CONFIG.ribbon.perRush, 0, 100); updateGauges();
    Snd.rushHit(); boxHit(); markCorrect(pickIdx);
    const c = boxCenter(); BG.burst(c.x, c.y, trioItem(S.turn.truth).c, 10, 0.8);
  } else { Snd.tick(0); }
  S.rush.i++;
  await wait(220);
  if (S.rush.i < CONFIG.rush.rounds) return startTurn('rush');
  return endRush();
}
async function endRush() {
  S.pair = 0; updateGauges();
  // 3本目は「発見」の証として箱へ
  const last = trioItem(S.turn.truth);
  Box.fill(2, last); S.filled = 3; updatePips();
  bigText(`${S.rush.hits} / ${CONFIG.rush.rounds}`, '見つけた', S.rush.hits >= 4 ? 'gold' : '');
  await wait(1150);
  if (S.ribbon >= 100) return startSwipe();
  S.phase = 'post';
  setCoach('トップノートが飛んでいる。ノートを逃すな');
  startTurn('normal');
}

/* ---------------- 最後のリボン（自分の手で結ぶ） ---------------- */
const Swipe = { active: false, y0: 0, dy: 0, fired: false };
function startSwipe() {
  if (!PLAYING()) return;
  S.phase = 'swipe';
  document.body.classList.add('is-swipe');
  setCoach('リボンを 自分の手で 引く');
  Box.close();
  Swipe.active = true; Swipe.fired = false; Swipe.dy = 0;
  UI.ribbonEnd.className = ''; UI.ribbonEnd.style.transform = 'translate(-50%, 0)';
  UI.swipeHint.style.display = '';
  UI.swipe.classList.add('on');
  bigText('リボンを 結べ', '▼ 下へ 引く', 'gold');
  Snd.rushStart();
}
function swipeMove(dy) {
  if (!Swipe.active || Swipe.fired) return;
  Swipe.dy = clamp(dy, 0, 150);
  UI.ribbonEnd.style.transform = `translate(-50%, ${Swipe.dy}px)`;
}
function swipeEnd() {
  if (!Swipe.active || Swipe.fired) return;
  if (Swipe.dy >= 70) return pullRibbon();
  UI.ribbonEnd.style.transition = 'transform 0.25s'; UI.ribbonEnd.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { UI.ribbonEnd.style.transition = ''; }, 260);
}
async function pullRibbon() {
  Swipe.fired = true; Swipe.active = false;
  UI.swipeHint.style.display = 'none';
  Snd.ribbon();
  const c = boxCenter();
  const r = UI.ribbonEnd.getBoundingClientRect();
  const dy = c.y - (r.top + r.height * 0.45) + Swipe.dy;
  UI.ribbonEnd.classList.add('pull');
  UI.ribbonEnd.style.transform = `translate(-50%, ${dy}px) scaleY(0.6)`;
  await wait(520);
  UI.ribbonEnd.classList.add('gone');
  flash();
  Snd.wrapped();
  Box.tie();
  BG.burst(c.x, c.y - 40, '#c9a961', 44, 1.8); BG.burst(c.x, c.y - 40, '#ffffff', 26, 1.4);
  S.trio.forEach((pi) => BG.burst(c.x, c.y - 40, CONFIG.pool[pi].c, 10, 1.2));
  document.body.classList.remove('is-swipe');
  await wait(250);
  setLetter('…完璧。ありがとう');
  setCoach('');
  bigText('PERFECTLY WRAPPED', 'ギフト 完成', 'gold', true);
  S.cleared = true; S.endAt = performance.now();
  await wait(2300);
  UI.swipe.classList.remove('on');
  showResult();
}

/* ---------------- 打ち止め ---------------- */
async function lose() {
  S.phase = 'lose';
  Snd.lose();
  setLetter('今日は ここまでに しましょう');
  setCoach('');
  bigText('スプレーが 空に', 'それでも 景品は あります', 'miss', true);
  S.endAt = performance.now();
  await wait(2000);
  showResult();
}

/* ---------------- 結果・ランキング ---------------- */
const RANK_KEY = 'pairinggame.ranking.v1';
function today() { return new Date().toISOString().slice(0, 10); }
function loadRank() {
  try { const d = JSON.parse(localStorage.getItem(RANK_KEY) || 'null'); if (d && d.date === today() && Array.isArray(d.list)) return d.list; } catch (e) { /* 壊れていたら無視 */ }
  return [];
}
function saveRank(list) { try { localStorage.setItem(RANK_KEY, JSON.stringify({ date: today(), list })); } catch (e) { /* private mode */ } }
function renderRank(el, meTime) {
  const list = loadRank();
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="rh">TODAY'S BEST（完成タイム）</div>` + list.map((r, i) =>
    `<div class="row${r.t === meTime ? ' me' : ''}"><span>${i + 1}</span><span>${r.rank} ・ ${r.t.toFixed(1)}秒</span></div>`).join('');
}
function renderPair() {
  const el = $('#rPair');
  if (S.pairPicks.length < 2) { el.innerHTML = ''; return; }
  const a = trioItem(S.pairPicks[0]), b = trioItem(S.pairPicks[1]);
  const dot = (t) => `<i style="background:${t.c2}"></i>`;
  el.innerHTML = `<div class="ph">YOUR PAIRING</div><div class="pair">${dot(a)}${a.name}<br><span style="color:var(--gold2)">×</span><br>${dot(b)}${b.name}</div>` +
    (a === b ? `<div style="color:var(--muted);font-size:12px;margin-top:4px">同じ香りを 重ねて 深く</div>` : `<div style="color:var(--muted);font-size:12px;margin-top:4px">今日の あなたの 重ねづけ</div>`);
}

let idleTimer = null;
function showResult() {
  S.phase = 'result';
  const cleared = S.cleared;
  const rank = cleared ? (S.spray === 3 ? 'S' : 'A') : 'C';
  const sec = (S.endAt - S.startAt) / 1000;
  const badge = $('#rBadge'); badge.textContent = rank; badge.className = 'rBadge ' + rank;
  $('#rKicker').textContent = cleared ? 'PERFECTLY WRAPPED' : 'RESULT';
  $('#rTitle').textContent = cleared ? (rank === 'S' ? 'ひと吹きも 無駄にせず' : 'ギフト 完成') : 'また 香りに 会いに来て';
  $('#rPrize').innerHTML = `<small>PRIZE</small>${CONFIG.prizes[rank]}`;
  $('#rStats').innerHTML = cleared
    ? `<div><b>${sec.toFixed(1)}</b> 秒</div><div>SPRAY <b>${S.spray}</b>/3</div><div>RUSH <b>${S.rush ? S.rush.hits : 0}</b>/5</div>`
    : `<div>箱に <b>${S.filled}</b>/3 本</div><div>正解 <b>${S.hits}</b></div>`;
  renderPair();
  let meTime = null;
  if (cleared && SPEED === 1) {
    const list = loadRank(); meTime = Math.round(sec * 10) / 10;
    list.push({ t: meTime, rank }); list.sort((a, b) => a.t - b.t); saveRank(list.slice(0, 5));
  }
  renderRank($('#resultRank'), meTime);
  document.body.classList.remove('is-title'); document.body.classList.add('is-result');
  UI.center.classList.remove('on', 'hold');
  clearTimeout(idleTimer); idleTimer = setTimeout(goTitle, CONFIG.resultIdleMs);
}

function goTitle() {
  clearTimeout(idleTimer);
  S.phase = 'title';
  if (S.turn) { S.turn.timers.forEach(clearTimeout); S.turn.resolved = true; }
  UI.swipe.classList.remove('on'); UI.center.classList.remove('on', 'hold');
  document.body.classList.remove('is-swipe');
  Box.reset();
  renderRank($('#titleRank'), null);
  document.body.classList.remove('is-result'); document.body.classList.add('is-title');
}

/* ---------------- 開始 ---------------- */
async function start() {
  clearTimeout(idleTimer);
  resetState(); renderButtons(); Box.reset();
  updatePips(); updateGauges();
  setLetter('…'); setCoach('');
  UI.timeFill.style.transition = 'none'; UI.timeFill.style.width = '100%';
  setButtons(false);
  document.body.classList.remove('is-title', 'is-result');
  Snd.ui();
  bigText('お客さまが 来た', '一瞬だけ香るノートと 同じ素材のコロンを', 'miss');
  await wait(1500);
  S.startAt = performance.now();
  startTurn('normal');
}

/* ---------------- 入力 ---------------- */
function pressButton(i) {
  Snd.init();
  const b = UI.btns[i]; if (!b || b.disabled) return;
  b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 140);
  resolve(i);
}
UI.btns.forEach((b, i) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); pressButton(i); }));
document.addEventListener('keydown', (e) => {
  if (e.key === '1' || e.key === '2' || e.key === '3') pressButton(Number(e.key) - 1);
  if (e.key === 'Enter' && S.phase === 'title') start();
  if (e.key === 'ArrowDown' && S.phase === 'swipe') pullRibbon();
  if (e.key === 'Escape') goTitle();
});
$('#startBtn').addEventListener('click', () => { Snd.init(); start(); });
$('#againBtn').addEventListener('click', () => { Snd.init(); start(); });
$('#titleBtn').addEventListener('click', () => { Snd.init(); goTitle(); });
UI.swipe.addEventListener('pointerdown', (e) => { Snd.init(); Swipe.y0 = e.clientY; swipeMove(0); if (UI.swipe.setPointerCapture) { try { UI.swipe.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } } });
UI.swipe.addEventListener('pointermove', (e) => { if (e.buttons === 0 && e.pointerType === 'mouse') return; swipeMove(e.clientY - Swipe.y0); });
UI.swipe.addEventListener('pointerup', swipeEnd);
UI.swipe.addEventListener('pointercancel', swipeEnd);
document.addEventListener('visibilitychange', () => { if (!document.hidden) Snd.init(); });
window.addEventListener('pageshow', () => Snd.init());

/* ---------------- 初期化 ---------------- */
$('#titleBrand').textContent = CONFIG.brand;
$('#boxBrand').textContent = CONFIG.boxBrand;
resetState(); renderButtons(); Box.reset(); updatePips(); updateGauges();
renderRank($('#titleRank'), null);
S.phase = 'title';

/* ---------------- デバッグAPI ---------------- */
window.PG = {
  build: '0.1.0',
  state: () => ({ ...S, turn: S.turn ? { kind: S.turn.kind, truth: S.turn.truth, resolved: S.turn.resolved } : null }),
  truth: () => (S.turn && !S.turn.resolved ? S.turn.truth : null),
  pick: (i) => resolve(i),
  swipe: () => { if (S.phase === 'swipe') pullRibbon(); },
  start, goTitle,
  setSpeed: (x) => { SPEED = x; },
  residue: () => ({ particles: BG.residue(), centerOn: UI.center.classList.contains('on'), swipeOn: UI.swipe.classList.contains('on') }),
};
})();
