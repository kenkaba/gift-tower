/* ============================================================
   Scented Letters — 香りの手紙
   言葉は曖昧。香りは正直。

   手紙が三通届く。手紙の言葉は「名前 → 素材 → 情景」と曖昧になり、
   代わりに「香りのしるし」がふわりと浮かんで消える（見えている時間が短くなる）。
   しるしと同じ素材のコロンを選ぶと、ギフトボックスへコロンが1本入る。
   間違えると花びらが1枚散る。3枚で今日はおしまい。
   三通のあとは「重ねる一本」を自由に選び（重ねづけにルールはない）、
   「余韻」を五つ追いかけ（外しても花びらは散らない）、
   最後にリボンを自分の手で引いて結ぶ。
   届くのは、今日のあなたに寄り添う重ねづけのカード。

   勝敗を決めるのは judge() ただ一箇所。
   ============================================================ */
(() => {
'use strict';

/* ---------------- 設定（コロン・景品・文言はここだけ変える） ---------------- */
const CONFIG = {
  brand: 'SCENT PAIRING SALON',
  pool: [
    { key: 'pear', name: 'イングリッシュ ペアー & フリージア', short: 'ペアー &\nフリージア', note: '洋梨', motif: '果樹園', mood: 'やさしさ',
      c: '#f0d58a', c2: '#a8862a', icon: 'pear',
      lines: { name: 'イングリッシュ ペアー & フリージアを、一本。', ingr: 'みずみずしい洋梨に、白いフリージアを添えて。', story: '秋のはじまり。果樹園に朝もやが残る、あの記憶。' } },
    { key: 'sea', name: 'ウッド セージ & シー ソルト', short: 'セージ &\nシー ソルト', note: '海の塩', motif: '潮風', mood: '自由',
      c: '#b9d3da', c2: '#4a7f90', icon: 'sea',
      lines: { name: 'ウッド セージ & シー ソルトを、お願いします。', ingr: '潮風の塩気に、セージの葉をひとつまみ。', story: '裸足で歩いた、風の強い海岸。' } },
    { key: 'lime', name: 'ライム バジル & マンダリン', short: 'ライム バジル &\nマンダリン', note: 'ライム', motif: 'ロンドンの午後', mood: 'はつらつ',
      c: '#cfe08a', c2: '#5f8a1f', icon: 'lime',
      lines: { name: 'ライム バジル & マンダリンが、いいわ。', ingr: 'ライムの皮に、バジルとマンダリン。', story: 'はじけるように始まる、ロンドンの午後。' } },
    { key: 'nect', name: 'ネクタリン ブロッサム & ハニー', short: 'ネクタリン &\nハニー', note: 'ネクタリン', motif: '朝市', mood: '甘やかし',
      c: '#f7c89a', c2: '#c06a2a', icon: 'nect',
      lines: { name: 'ネクタリン ブロッサム & ハニーを。', ingr: 'ネクタリンの花に、とろりとした蜂蜜。', story: '朝市で買った、熟れた果実のかご。' } },
    { key: 'rose', name: 'レッド ローズ', short: 'レッド\nローズ', note: 'バラ', motif: '花束', mood: '情熱',
      c: '#e9a3b1', c2: '#a8203c', icon: 'rose',
      lines: { name: 'レッド ローズが、恋しくて。', ingr: '七種のバラに、スミレの葉。', story: '摘みたての花束を抱えて、帰る道。' } },
    { key: 'peony', name: 'ピオニー & ブラッシュ スエード', short: 'ピオニー &\nスエード', note: 'ピオニー', motif: '窓辺の一輪', mood: 'やわらかさ',
      c: '#f4c3ce', c2: '#b8506c', icon: 'peony',
      lines: { name: 'ピオニー & ブラッシュ スエードを、一本。', ingr: '咲きたてのピオニーに、やわらかなスエード。', story: '春の午後、窓辺に置いた一輪。' } },
    { key: 'berg', name: 'シー ソルト & ベルガモット', short: 'シー ソルト &\nベルガモット', note: 'ベルガモット', motif: '波しぶき', mood: '冒険',
      c: '#a9dccf', c2: '#1f8a78', icon: 'berg',
      lines: { name: 'シー ソルト & ベルガモットは、ありますか。', ingr: 'ベルガモットの光に、海の塩。', story: '荒々しい波しぶきを浴びた、朝。' } },
  ],
  prizes: { S: 'コロン 9mL', A: 'コロン 1.5mL ×2', C: 'コロン 1.5mL' },
  // 手紙ごとの難度。説明は増やさず、しるしが見えている時間だけを短くする
  letters: [
    { from: '一通目の手紙', limit: 6000, delay: 0,   visible: Infinity, words: 'name'  },
    { from: '二通目の手紙', limit: 5200, delay: 500, visible: 2600,     words: 'ingr'  },
    { from: '三通目の手紙', limit: 4600, delay: 900, visible: 1600,     words: 'story' },
  ],
  echo: { rounds: 3, limit: 2200, delay: 150, visible: 1300 },
  petals: 3,
  resultIdleMs: 40000,
  ambient: true,
};

/* 重ねづけの言葉（motif と mood から組み立てる） */
const FORTUNE = {
  advice: {
    'やさしさ': 'ゆっくり深呼吸をして、誰かに一言だけやさしい言葉を。',
    '自由': '予定を一つだけ空けて、行き先を決めずに歩いてみて。',
    'はつらつ': '思いついたことは、今日のうちに一つ形にして。',
    '甘やかし': '自分のためだけに、少しいいものを選んでいい日。',
    '情熱': '好きなものを好きと言う。それだけで、道が開ける。',
    'やわらかさ': '急がなくていい。手触りのいいものに触れて過ごして。',
    '冒険': '知らない道を一本だけ選んで。景色が変わる。',
  },
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

/* ---------------- 音（オルゴールとハープ。残響つき。矩形波・ノコギリ波は使わない） ---------------- */
const Snd = {
  ctx: null, master: null, wet: null, ok: false, pad: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.gain.value = 0.7;
      // 残響: フィードバックディレイ2本を薄く重ねる
      const dry = c.createGain(); dry.gain.value = 1;
      this.wet = c.createGain(); this.wet.gain.value = 0.32;
      const mk = (time, fb, lp) => { const d = c.createDelay(1); d.delayTime.value = time; const g = c.createGain(); g.gain.value = fb; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; d.connect(f); f.connect(g); g.connect(d); return { d, out: f }; };
      const r1 = mk(0.23, 0.42, 3200), r2 = mk(0.37, 0.35, 2400);
      this.master.connect(dry); dry.connect(c.destination);
      this.master.connect(r1.d); this.master.connect(r2.d);
      r1.out.connect(this.wet); r2.out.connect(this.wet); this.wet.connect(c.destination);
      this.ok = true;
      if (c.state === 'suspended') c.resume().catch(() => {});
    } catch (e) { this.ok = false; }
  },
  now() { return this.ctx.currentTime; },
  /** オルゴールの一音: 基音＋倍音を短いアタックで */
  bell(f, t = 0, d = 1.6, v = 0.16) {
    if (!this.ok) return;
    const c = this.ctx, T = this.now() + t;
    [[1, 1], [2, 0.32], [3, 0.12], [4.2, 0.05]].forEach(([m, g0]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f * m, T);
      g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(v * g0, T + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, T + d / (1 + m * 0.35));
      o.connect(g); g.connect(this.master); o.start(T); o.stop(T + d + 0.05);
    });
  },
  /** 息のような音: ノイズを細い帯域で */
  breath({ t = 0, d = 0.3, v = 0.06, f = 2000, q = 1.2 }) {
    if (!this.ok) return;
    const c = this.ctx, len = Math.max(1, Math.floor(c.sampleRate * d));
    const b = c.createBuffer(1, len, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    const s = c.createBufferSource(); s.buffer = b;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = c.createGain(), T = this.now() + t; g.gain.value = v;
    s.connect(bp); bp.connect(g); g.connect(this.master); s.start(T);
  },
  /** 会場の空気: 低く薄いパッド */
  padOn() {
    if (!this.ok || !CONFIG.ambient || this.pad) return;
    const c = this.ctx, T = this.now();
    const g = c.createGain(); g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.022, T + 4);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    const os = [130.81, 196.0, 261.63 * 1.003].map((fr) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = fr; o.connect(f); o.start(T); return o; });
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 0.006; lfo.connect(lg); lg.connect(g.gain); lfo.start(T);
    f.connect(g); g.connect(this.master);
    this.pad = { os, g, lfo };
  },
  padOff() {
    if (!this.pad) return;
    const T = this.now(); const p = this.pad; this.pad = null;
    p.g.gain.cancelScheduledValues(T); p.g.gain.setValueAtTime(p.g.gain.value, T); p.g.gain.linearRampToValueAtTime(0, T + 2.5);
    p.os.forEach((o) => o.stop(T + 2.7)); p.lfo.stop(T + 2.7);
  },
  // 旋律（ペンタトニック）。正解のたびに一音ずつ進む
  melody: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51],
  step: 0,
  next(v = 0.16) { const f = this.melody[this.step % this.melody.length]; this.step++; this.bell(f, 0, 1.8, v); this.bell(f * 2, 0.02, 0.9, v * 0.25); },
  reset() { this.step = 0; },
  ui() { this.bell(1567.98, 0, 0.6, 0.06); },
  letter() { this.breath({ d: 0.35, v: 0.05, f: 1800, q: 0.8 }); this.bell(2093, 0.05, 0.7, 0.03); },
  bloom() { this.bell(2637, 0, 0.9, 0.05); this.bell(3136, 0.06, 0.8, 0.03); },
  hit() { this.breath({ d: 0.18, v: 0.05, f: 4200, q: 1.5 }); this.next(); },
  miss() { this.bell(220, 0, 1.2, 0.07); this.bell(207.65, 0.08, 1.2, 0.05); this.breath({ d: 0.5, v: 0.03, f: 900, q: 0.6 }); },
  pair() { this.bell(783.99, 0, 1.6, 0.1); this.bell(987.77, 0.1, 1.6, 0.09); this.bell(1174.66, 0.2, 1.8, 0.08); },
  echoStart() { [783.99, 880, 1046.5, 1174.66, 1318.51].forEach((f, i) => this.bell(f, i * 0.07, 0.9, 0.06)); },
  echoHit() { this.bell(1318.51 + Math.random() * 400, 0, 0.7, 0.08); },
  fade() { this.breath({ d: 1.2, v: 0.05, f: 1200, q: 0.5 }); this.bell(392, 0, 2.2, 0.05); },
  ribbon() { this.breath({ d: 0.6, v: 0.06, f: 1500, q: 0.9 }); },
  wrapped() {
    const seq = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093];
    seq.forEach((f, i) => this.bell(f, i * 0.11, 2.2, 0.11));
    this.bell(261.63, 0.5, 3.5, 0.06); this.bell(392, 0.6, 3.5, 0.05);
    this.breath({ t: 0.6, d: 1.4, v: 0.04, f: 5000, q: 0.5 });
  },
  lose() { [659.25, 587.33, 523.25].forEach((f, i) => this.bell(f, i * 0.3, 2, 0.08)); },
};

/* ---------------- 背景（紙の光、舞う花びら、金の粉） ---------------- */
const BG = (() => {
  const c = $('#bg'); const x = c.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const blobs = [], petals = [], dust = [], parts = [];
  const PAL = ['#f3dfe3', '#f4e4c8', '#dfe8dc', '#f6e6d8', '#e9e3f0'];
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!blobs.length) {
      for (let i = 0; i < 5; i++) blobs.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(180, 320), vx: rnd(-0.06, 0.06), vy: rnd(-0.05, 0.05), col: PAL[i % PAL.length] });
      for (let i = 0; i < 9; i++) petals.push(newPetal(true));
      for (let i = 0; i < 30; i++) dust.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.7, 1.8), p: rnd(0, 6.28), s: rnd(0.005, 0.014), vy: rnd(-0.04, -0.12) });
    }
  }
  function newPetal(anywhere) {
    return { x: rnd(0, W), y: anywhere ? rnd(0, H) : -20, vx: rnd(-0.15, 0.25), vy: rnd(0.18, 0.4), rot: rnd(0, 6.28), vr: rnd(-0.012, 0.012), s: rnd(5, 9), sway: rnd(0, 6.28), col: Math.random() < 0.7 ? '#efc9d1' : '#f3dcc0' };
  }
  function burst(px, py, col, n = 22, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(0.8, 3.6) * power;
      parts.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, life: 1, decay: rnd(0.008, 0.018), size: rnd(2, 5), col, petal: Math.random() < 0.6, rot: rnd(0, 6.28), vr: rnd(-0.08, 0.08) });
    }
  }
  function drawPetal(px, py, s, rot, col, alpha) {
    x.save(); x.translate(px, py); x.rotate(rot); x.globalAlpha = alpha; x.fillStyle = col;
    x.beginPath(); x.ellipse(0, 0, s * 1.5, s * 0.85, 0, 0, Math.PI * 2); x.fill(); x.restore();
  }
  function frame() {
    x.clearRect(0, 0, W, H);
    for (const b of blobs) {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;
      const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.col + '80'); g.addColorStop(1, b.col + '00');
      x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill();
    }
    for (const d of dust) {
      d.p += d.s; d.y += d.vy; if (d.y < -4) { d.y = H + 4; d.x = rnd(0, W); }
      x.fillStyle = `rgba(201,169,97,${0.12 + 0.5 * (0.5 + 0.5 * Math.sin(d.p))})`;
      x.beginPath(); x.arc(d.x, d.y, d.r, 0, Math.PI * 2); x.fill();
    }
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.sway += 0.01; p.x += p.vx + Math.sin(p.sway) * 0.25; p.y += p.vy; p.rot += p.vr;
      if (p.y > H + 20 || p.x < -30 || p.x > W + 30) petals[i] = newPetal(false);
      drawPetal(p.x, p.y, p.s, p.rot, p.col, 0.55);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.985; p.life -= p.decay; p.rot += p.vr;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.petal) drawPetal(p.x, p.y, p.size, p.rot, p.col, clamp(p.life, 0, 1));
      else { x.globalAlpha = clamp(p.life, 0, 1); x.fillStyle = p.col; x.beginPath(); x.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1; }
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  resize(); frame();
  return { burst, residue: () => parts.length };
})();

/* ---------------- 素材の水彩アイコン（80×80、塗りあり） ---------------- */
const ICONS = {
  pear: (c, c2) => `<path d="M40 14 c-2 8 -8 12 -8 22 c0 6 -9 9 -9 19 c0 9 8 15 17 15 s17 -6 17 -15 c0 -10 -9 -13 -9 -19 c0 -10 -6 -14 -8 -22z" fill="${c}" stroke="${c2}" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 14 c3 -5 8 -6 13 -4" fill="none" stroke="${c2}" stroke-width="2.6" stroke-linecap="round"/><path d="M44 10 c4 -6 11 -6 14 -1 c-5 3 -10 3 -14 1z" fill="#9fbf6a" stroke="#5f8a1f" stroke-width="1.6"/><ellipse cx="33" cy="48" rx="4" ry="7" fill="#fff" opacity="0.45"/>`,
  sea: (c, c2) => `<path d="M10 34 q8 -9 16 0 t16 0 t16 0 t12 0" fill="none" stroke="${c2}" stroke-width="3.2" stroke-linecap="round"/><path d="M10 48 q8 -9 16 0 t16 0 t16 0 t12 0" fill="none" stroke="${c2}" stroke-width="3.2" stroke-linecap="round" opacity="0.75"/><path d="M14 40 q10 -10 20 0 t20 0 t14 0 v14 h-54z" fill="${c}" opacity="0.5"/><circle cx="24" cy="62" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/><circle cx="40" cy="64" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/><circle cx="56" cy="62" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/><path d="M44 16 c6 -6 10 -2 8 4 c-2 5 -8 4 -8 -4z" fill="#c8d4c3" stroke="#6e8a66" stroke-width="1.4"/>`,
  lime: (c, c2) => `<circle cx="40" cy="42" r="24" fill="${c}" stroke="${c2}" stroke-width="2.6"/><circle cx="40" cy="42" r="18" fill="#fff" opacity="0.55"/><path d="M40 24 v36 M22 42 h36 M27.3 29.3 l25.4 25.4 M52.7 29.3 l-25.4 25.4" stroke="${c2}" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/><path d="M50 12 c8 -6 16 -2 14 6 c-8 2 -12 0 -14 -6z" fill="#8fb35a" stroke="#5f8a1f" stroke-width="1.4"/>`,
  nect: (c, c2) => `<g fill="${c}" stroke="${c2}" stroke-width="2"><ellipse cx="40" cy="20" rx="8" ry="11"/><ellipse cx="58" cy="33" rx="11" ry="8" transform="rotate(36 58 33)"/><ellipse cx="52" cy="54" rx="11" ry="8" transform="rotate(-38 52 54)"/><ellipse cx="28" cy="54" rx="11" ry="8" transform="rotate(38 28 54)"/><ellipse cx="22" cy="33" rx="11" ry="8" transform="rotate(-36 22 33)"/></g><circle cx="40" cy="38" r="8" fill="#f6b25a" stroke="${c2}" stroke-width="2"/><path d="M40 60 c0 8 4 12 5 14" fill="none" stroke="#c98a2a" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="74" r="3" fill="#f2c14e"/>`,
  rose: (c, c2) => `<circle cx="40" cy="40" r="24" fill="${c}"/><path d="M40 40 m-2 0 a2 2 0 1 0 4 0 a6 6 0 1 1 -12 0 a10 10 0 1 0 20 0 a14 14 0 1 1 -28 0 a18 18 0 1 0 36 0 a22 22 0 1 1 -44 0" fill="none" stroke="${c2}" stroke-width="2.4" stroke-linecap="round"/><path d="M16 60 c8 -4 16 -4 24 0" fill="none" stroke="#6e8a66" stroke-width="2.6" stroke-linecap="round"/><path d="M58 62 c-6 -8 -2 -14 4 -12 c2 6 0 10 -4 12z" fill="#9fbf6a" stroke="#5f8a1f" stroke-width="1.4"/>`,
  peony: (c, c2) => `<g fill="${c}" stroke="${c2}" stroke-width="2" stroke-linecap="round"><path d="M40 62 c-16 0 -24 -12 -20 -24 c4 -10 16 -12 20 -4 c4 -8 16 -6 20 4 c4 12 -4 24 -20 24z"/><path d="M40 34 c-6 6 -6 16 0 24"/><path d="M40 34 c6 6 6 16 0 24"/><path d="M24 30 c-4 -8 2 -16 10 -14"/><path d="M56 30 c4 -8 -2 -16 -10 -14"/><path d="M32 16 c2 -6 14 -6 16 0"/></g><circle cx="40" cy="34" r="3.5" fill="#f2c14e"/><path d="M40 62 v10" stroke="#6e8a66" stroke-width="2.6" stroke-linecap="round"/>`,
  berg: (c, c2) => `<circle cx="34" cy="42" r="19" fill="${c}" stroke="${c2}" stroke-width="2.6"/><circle cx="34" cy="42" r="13" fill="#fff" opacity="0.5"/><path d="M34 26 v32 M18 42 h32" stroke="${c2}" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/><path d="M48 62 q6 -7 12 0 t10 0" fill="none" stroke="${c2}" stroke-width="3" stroke-linecap="round"/><path d="M48 18 c8 -8 16 -4 18 4 c-8 2 -14 0 -18 -4z" fill="#8fb35a" stroke="#5f8a1f" stroke-width="1.4"/><circle cx="60" cy="34" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/>`,
};

/* ---------------- DOM ---------------- */
const UI = {
  app: $('#app'), glow: $('#glow'), box: $('#box'), letter: $('#letter'), letterText: $('#letterText'), letterFrom: $('#letterFrom'), reply: $('#reply'),
  bloom: $('#bloom'), bloomIcon: $('#bloomIcon'), bloomLabel: $('#bloomLabel'),
  timeFill: $('#timeFill'), whisper: $('#whisper'), wMain: $('#whisperMain'), wSub: $('#whisperSub'),
  seals: $$('#seals i'), petals: $$('.petal'),
  btns: $$('.pbtn'), ribbon: $('#ribbonLayer'), ribbonEnd: $('#ribbonEnd'), ribbonHint: $('#ribbonHint'),
  slots: $$('.slot'), bow: $('#bow'), sparkles: $('#sparkles'),
};

function boxCenter() { const r = UI.box.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }; }
function slotCenter(i) { const r = UI.slots[i].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
function bloomCenter() { const r = UI.bloom.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
function glow() { UI.glow.classList.remove('on'); void UI.glow.offsetWidth; UI.glow.classList.add('on'); }
function boxHit() { UI.box.classList.remove('hit'); void UI.box.offsetWidth; UI.box.classList.add('hit'); }

function setLetter(from, text, story = false) {
  UI.letterFrom.textContent = from;
  UI.letterText.textContent = text;
  UI.letter.classList.toggle('story', story);
  UI.letter.classList.remove('turn'); void UI.letter.offsetWidth; UI.letter.classList.add('turn');
  setReply('');
}
let replyTimer = null;
function setReply(t, ms = 1600) {
  clearTimeout(replyTimer);
  UI.reply.textContent = t; UI.reply.classList.toggle('on', !!t);
  if (t) replyTimer = setTimeout(() => UI.reply.classList.remove('on'), ms * SPEED);
}

function trioItem(i) { return CONFIG.pool[S.trio[i]]; }
function showBloom(i) {
  const t = trioItem(i);
  UI.bloom.style.setProperty('--c', t.c); UI.bloom.style.setProperty('--c2', t.c2);
  UI.bloomIcon.innerHTML = ICONS[t.icon](t.c, t.c2);
  UI.bloomLabel.textContent = t.note;
  UI.bloom.classList.remove('fade'); void UI.bloom.offsetWidth; UI.bloom.classList.add('on');
  Snd.bloom();
}
function hideBloom(soft = true) {
  if (!UI.bloom.classList.contains('on')) return;
  UI.bloom.classList.remove('on');
  if (soft) UI.bloom.classList.add('fade');
}

let whisperTimer = null;
function whisper(main, sub = '', tone = '', hold = false) {
  UI.wMain.textContent = main; UI.wSub.textContent = sub;
  UI.whisper.className = ''; void UI.whisper.offsetWidth;
  UI.whisper.classList.add('on'); if (tone) UI.whisper.classList.add(tone); if (hold) UI.whisper.classList.add('hold');
  clearTimeout(whisperTimer);
  if (!hold) whisperTimer = setTimeout(() => UI.whisper.classList.remove('on'), 1950 * SPEED);
}

function runTimeBar(ms) {
  UI.timeFill.style.transition = 'none'; UI.timeFill.style.width = '100%'; void UI.timeFill.offsetWidth;
  UI.timeFill.style.transition = `width ${ms * SPEED}ms linear`; UI.timeFill.style.width = '0%';
}
function stopTimeBar() { const w = getComputedStyle(UI.timeFill).width; UI.timeFill.style.transition = 'none'; UI.timeFill.style.width = w; }
function setButtons(on) { UI.btns.forEach((b) => { b.disabled = !on; b.classList.remove('correct', 'down'); }); }
function markCorrect(i) { UI.btns[i].classList.add('correct'); }
function updateTop() {
  UI.seals.forEach((s, i) => s.classList.toggle('on', i < S.filled));
  UI.petals.forEach((p, i) => p.classList.toggle('gone', i >= S.petals));
}

const Box = {
  reset() { UI.box.setAttribute('class', 'idle'); UI.slots.forEach((s) => s.classList.remove('on')); UI.bow.classList.remove('on'); UI.sparkles.classList.remove('on'); UI.bloom.className = ''; },
  fill(i, item) {
    const s = UI.slots[i];
    s.querySelector('.liquid').setAttribute('fill', item.c);
    s.querySelector('.chip').setAttribute('fill', item.c2);
    s.classList.add('on');
    const p = slotCenter(i); BG.burst(p.x, p.y, item.c, 14, 0.8); BG.burst(p.x, p.y, '#c9a961', 8, 0.7);
  },
  close() { UI.box.classList.add('closed'); },
  tie() { UI.bow.classList.add('on'); UI.sparkles.classList.add('on'); },
};

/* ---------------- 状態 ---------------- */
const S = {
  phase: 'title', // title | letters | pairing | echo | ribbon | lose | result
  trio: [0, 1, 2], filled: 0, petals: 3, pairPick: null, echo: null, turn: null,
  turns: 0, hits: 0, misses: 0, startAt: 0, endAt: 0, cleared: false,
  collection: [],   // 今の来場者が集めた素材（pool の key）
  plays: 0,
};
function resetState() {
  Object.assign(S, { phase: 'letters', filled: 0, petals: CONFIG.petals, pairPick: null, echo: null, turn: null, turns: 0, hits: 0, misses: 0, startAt: 0, endAt: 0, cleared: false });
  // まだ集めていない素材を優先して出題する（コレクションが進む）
  const notYet = CONFIG.pool.map((p, i) => i).filter((i) => !S.collection.includes(CONFIG.pool[i].key));
  const rest = CONFIG.pool.map((p, i) => i).filter((i) => !notYet.includes(i));
  S.trio = shuffle(notYet).concat(shuffle(rest)).slice(0, 3);
  S.trio = shuffle(S.trio);
}
const PLAYING = () => !['title', 'result', 'lose'].includes(S.phase);

function renderButtons() {
  UI.btns.forEach((b, i) => {
    const t = trioItem(i);
    b.style.setProperty('--c', t.c); b.style.setProperty('--c2', t.c2);
    b.querySelector('.tag svg').innerHTML = ICONS[t.icon](t.c, t.c2);
    b.querySelector('.lab').innerHTML = t.short.replace('\n', '<br>');
    b.setAttribute('aria-label', t.name);
  });
}

/* ---------------- 1ターン ---------------- */
function after(ms, fn) { const id = setTimeout(fn, ms * SPEED); S.turn.timers.push(id); return id; }

function startTurn(kind = 'letter') {
  if (!PLAYING()) return;
  const L = CONFIG.letters[Math.min(S.filled, 2)];
  const cfg = kind === 'echo' ? CONFIG.echo : L;
  const truth = pick3();
  S.turn = { kind, truth, resolved: false, timers: [], cfg };
  S.turns++;
  const T = trioItem(truth);
  if (kind === 'letter' && !S.firstItem) S.firstItem = T; // 一通目の香りをカードに残す

  if (kind === 'pairing') {
    setLetter('追伸', 'もう一本、重ねていただける？ どれを重ねても、きっと素敵。');
  } else if (kind === 'echo') {
    setLetter('余韻', `香りの余韻を、あと ${CONFIG.echo.rounds - S.echo.i} つ。外しても 花びらは 散らない。`);
  } else {
    setLetter(L.from, T.lines[L.words], L.words === 'story');
    Snd.letter();
    if (S.turns === 1) setReply('しるしと 同じ絵の コロンを、トレイから', 6000);
  }

  hideBloom(false);
  if (kind !== 'pairing') {
    after(cfg.delay, () => showBloom(truth));
    if (isFinite(cfg.visible)) after(cfg.delay + cfg.visible, () => hideBloom(true));
  }
  setButtons(true);
  runTimeBar(cfg.limit);
  after(cfg.limit, () => resolve(null));
}

function resolve(pickIdx) {
  const T = S.turn;
  if (!T || T.resolved) return;
  T.resolved = true; T.timers.forEach(clearTimeout);
  setButtons(false); stopTimeBar(); hideBloom(true);
  if (T.kind === 'pairing') return onPair(pickIdx);
  const r = judge(pickIdx, T.truth);
  if (T.kind === 'echo') return onEcho(r === 'hit', pickIdx);
  if (r === 'hit') return onHit(pickIdx);
  return onMiss(pickIdx, r === 'late');
}

async function onHit(pickIdx) {
  const item = trioItem(pickIdx);
  S.hits++;
  if (!S.collection.includes(item.key)) S.collection.push(item.key);
  markCorrect(pickIdx); Snd.hit(); glow(); boxHit();
  Box.fill(S.filled, item);
  S.filled++; updateTop();
  const c = boxCenter(); BG.burst(c.x, c.y - 30, item.c, 18, 1); BG.burst(c.x, c.y - 30, '#c9a961', 8, 0.8);
  setReply('ぴったり。ありがとう');
  whisper('ぴったり', `${item.note} は ${item.name}`, 'gold');
  if (S.filled === 2) { await wait(2000); await fadeNotes(); }
  else await wait(1900);
  if (S.filled >= 3) { S.phase = 'pairing'; return startTurn('pairing'); }
  return startTurn('letter');
}

async function onMiss(pickIdx, late) {
  const T = S.turn, truth = trioItem(T.truth);
  S.misses++; S.petals--; updateTop();
  Snd.miss();
  const f = $('#flower').getBoundingClientRect(); BG.burst(f.left + 20, f.top + 20, '#d69aa8', 6, 0.5);
  showBloom(T.truth); markCorrect(T.truth);
  setReply(late ? '…香りが 消えてしまったわ' : '…それは 違う香りね');
  whisper(late ? '香りが 消えた' : 'ちがう 香り', `${truth.note} は ${truth.short.replace('\n', ' ')}`, 'rose');
  if (S.petals <= 0) return lose();
  await wait(2300);
  hideBloom(true);
  return startTurn('letter');
}

async function onPair(pickIdx) {
  const idx = pickIdx === null ? pick3() : pickIdx;
  const item = trioItem(idx);
  S.pairPick = idx;
  if (!S.collection.includes(item.key)) S.collection.push(item.key);
  Snd.pair(); markCorrect(idx); glow();
  const c = boxCenter(); BG.burst(c.x, c.y - 30, item.c, 14, 0.7); BG.burst(c.x, c.y - 30, '#fff', 8, 0.5);
  setReply('素敵な 重ねづけ');
  whisper('重ねづけ', `${item.short.replace('\n', ' ')} を ひとさじ`, 'gold');
  await wait(1900);
  return startEcho();
}

async function fadeNotes() {
  Snd.fade();
  setLetter('…', 'あら。香りが 飛んでしまったみたい。', true);
  whisper('トップノートが 飛んだ', 'しるしは 遅れて、すぐ 消える', 'rose');
  await wait(2300);
}

/* ---------------- 余韻 ---------------- */
async function startEcho() {
  if (!PLAYING()) return;
  S.phase = 'echo'; S.echo = { i: 0, hits: 0 };
  Snd.echoStart(); glow();
  whisper('余韻', `香りの余韻を ${CONFIG.echo.rounds}つ。外しても 花びらは 散らない`, 'gold');
  await wait(2000);
  startTurn('echo');
}
async function onEcho(ok, pickIdx) {
  if (ok) { S.echo.hits++; Snd.echoHit(); markCorrect(pickIdx); boxHit(); const c = bloomCenter(); BG.burst(c.x, c.y, trioItem(S.turn.truth).c, 10, 0.7); }
  S.echo.i++;
  await wait(600);
  if (S.echo.i < CONFIG.echo.rounds) return startTurn('echo');
  return endEcho();
}
async function endEcho() {
  whisper(`余韻 ${S.echo.hits} / ${CONFIG.echo.rounds}`, S.echo.hits === CONFIG.echo.rounds ? 'すべて 追いかけた' : '', S.echo.hits >= CONFIG.echo.rounds - 1 ? 'gold' : '');
  await wait(1800);
  return startRibbon();
}

/* ---------------- リボン ---------------- */
const Swipe = { active: false, y0: 0, dy: 0, fired: false };
function startRibbon() {
  if (!PLAYING()) return;
  S.phase = 'ribbon';
  document.body.classList.add('is-ribbon');
  Box.close();
  Swipe.active = true; Swipe.fired = false; Swipe.dy = 0;
  UI.ribbonEnd.className = ''; UI.ribbonEnd.style.transform = 'translate(-50%, 0)';
  UI.ribbonHint.style.display = '';
  UI.ribbon.classList.add('on');
  whisper('あとは リボンだけ', 'そっと 下へ 引いて', 'gold');
  Snd.echoStart();
}
function swipeMove(dy) { if (!Swipe.active || Swipe.fired) return; Swipe.dy = clamp(dy, 0, 150); UI.ribbonEnd.style.transform = `translate(-50%, ${Swipe.dy}px)`; }
function swipeEnd() {
  if (!Swipe.active || Swipe.fired) return;
  if (Swipe.dy >= 60) return pullRibbon();
  UI.ribbonEnd.style.transition = 'transform 0.25s'; UI.ribbonEnd.style.transform = 'translate(-50%, 0)';
  setTimeout(() => { UI.ribbonEnd.style.transition = ''; }, 260);
}
async function pullRibbon() {
  Swipe.fired = true; Swipe.active = false;
  UI.ribbonHint.style.display = 'none';
  Snd.ribbon();
  const c = boxCenter();
  const r = UI.ribbonEnd.getBoundingClientRect();
  const dy = c.y - (r.top + r.height * 0.45) + Swipe.dy;
  UI.ribbonEnd.classList.add('pull');
  UI.ribbonEnd.style.transform = `translate(-50%, ${dy}px) scaleY(0.6)`;
  await wait(560);
  UI.ribbonEnd.classList.add('gone');
  glow(); Snd.wrapped(); Box.tie();
  BG.burst(c.x, c.y - 40, '#c9a961', 36, 1.4); BG.burst(c.x, c.y - 40, '#efc9d1', 30, 1.2); BG.burst(c.x, c.y - 40, '#fff', 16, 1);
  document.body.classList.remove('is-ribbon');
  await wait(250);
  setLetter('', '…完璧。ありがとう。');
  whisper('Perfectly wrapped', 'ギフトが できました', 'gold', true);
  S.cleared = true; S.endAt = performance.now();
  await wait(2600);
  UI.ribbon.classList.remove('on');
  showResult();
}

/* ---------------- おしまい ---------------- */
async function lose() {
  S.phase = 'lose';
  Snd.lose();
  setLetter('', '今日は ここまでに しましょうか。');
  whisper('花びらが 散った', 'それでも 景品は あります', 'rose', true);
  S.endAt = performance.now();
  await wait(2200);
  showResult();
}

/* ---------------- ペアリングカード ---------------- */
function pairing() {
  // 一通目の香り × 重ねた一本（打ち止め時は集めた中から）
  const first = S.firstItem || trioItem(0);
  const second = S.pairPick !== null ? trioItem(S.pairPick) : null;
  return { a: first, b: second };
}
function stampsHTML(newKeys) {
  return CONFIG.pool.map((p) => {
    const got = S.collection.includes(p.key);
    return `<i class="${got ? 'got' : ''}${newKeys.includes(p.key) ? ' new' : ''}" style="--c:${p.c}" title="${p.name}"><svg viewBox="0 0 80 80">${ICONS[p.icon](got ? p.c : '#e6dfd2', got ? p.c2 : '#b9b0a0')}</svg></i>`;
  }).join('');
}

let idleTimer = null;
function showResult() {
  S.phase = 'result'; S.plays++;
  Snd.padOff();
  const cleared = S.cleared;
  const rank = cleared ? (S.petals === CONFIG.petals ? 'S' : 'A') : 'C';
  const sec = (S.endAt - S.startAt) / 1000;
  const badge = $('#rBadge'); badge.textContent = rank; badge.className = 'stampRank ' + rank;

  const { a, b } = pairing();
  if (b) {
    $('#pairName').textContent = a === b ? `${a.motif}を、もう一度` : `${a.motif}と${b.motif}`;
    $('#pairRow').innerHTML = `<i style="background:${a.c2}"></i>${a.name}<span class="x">×</span><br><i style="background:${b.c2}"></i>${b.name}`;
    $('#fortune').textContent = a === b
      ? `${a.mood}を、今日は二度重ねて。${FORTUNE.advice[a.mood]}`
      : `${a.mood}に、${b.mood}をひとさじ。${FORTUNE.advice[b.mood]}`;
  } else {
    $('#pairName').textContent = `${a.motif}の 手紙`;
    $('#pairRow').innerHTML = `<i style="background:${a.c2}"></i>${a.name}`;
    $('#fortune').textContent = `${a.mood}の香りから、今日を始めて。${FORTUNE.advice[a.mood]}`;
  }
  $('#rStats').innerHTML = cleared
    ? `<div><b>${sec.toFixed(1)}</b> 秒</div><div>花びら <b>${S.petals}</b>/${CONFIG.petals}</div><div>余韻 <b>${S.echo ? S.echo.hits : 0}</b>/${CONFIG.echo.rounds}</div>`
    : `<div>手紙 <b>${S.filled}</b>/3</div><div>正解 <b>${S.hits}</b></div>`;
  $('#rPrize').textContent = CONFIG.prizes[rank];

  const newKeys = S.collection.slice(S.collectionBefore || 0);
  $('#stamps').innerHTML = stampsHTML(newKeys);
  const left = CONFIG.pool.length - S.collection.length;
  $('#collectionMsg').textContent = left === 0 ? '七つの香り、すべて集まりました。' : `あと ${left} つで、七つの香りが揃います。`;
  document.body.classList.remove('is-title'); document.body.classList.add('is-result');
  UI.whisper.classList.remove('on', 'hold');
  clearTimeout(idleTimer); idleTimer = setTimeout(nextGuest, CONFIG.resultIdleMs);
}

function goTitle() {
  clearTimeout(idleTimer);
  S.phase = 'title';
  if (S.turn) { S.turn.timers.forEach(clearTimeout); S.turn.resolved = true; }
  UI.ribbon.classList.remove('on'); UI.whisper.classList.remove('on', 'hold');
  document.body.classList.remove('is-ribbon');
  Snd.padOff();
  Box.reset();
  const left = CONFIG.pool.length - S.collection.length;
  $('#titleCollection').textContent = S.collection.length ? `集めた香り ${S.collection.length} / ${CONFIG.pool.length}${left ? `。あと ${left} つ` : '。すべて揃いました'}` : '';
  document.body.classList.remove('is-result'); document.body.classList.add('is-title');
}
function nextGuest() { S.collection = []; S.plays = 0; goTitle(); }

/* ---------------- 開始 ---------------- */
async function start() {
  clearTimeout(idleTimer);
  S.collectionBefore = S.collection.length;
  resetState(); renderButtons(); Box.reset(); Snd.reset();
  S.firstItem = null;
  updateTop();
  setLetter('', '…');
  UI.timeFill.style.transition = 'none'; UI.timeFill.style.width = '100%';
  setButtons(false);
  document.body.classList.remove('is-title', 'is-result');
  Snd.ui(); Snd.padOn();
  whisper('手紙が 届きました', 'ふわりと 浮かぶ しるしと 同じ 素材の コロンを', '');
  await wait(2400);
  S.startAt = performance.now();
  startTurn('letter');
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
  if (e.key === 'ArrowDown' && S.phase === 'ribbon') pullRibbon();
  if (e.key === 'Escape') goTitle();
});
$('#startBtn').addEventListener('click', () => { Snd.init(); start(); });
$('#againBtn').addEventListener('click', () => { Snd.init(); start(); });
$('#nextBtn').addEventListener('click', () => { Snd.init(); nextGuest(); });
UI.ribbon.addEventListener('pointerdown', (e) => { Snd.init(); Swipe.y0 = e.clientY; swipeMove(0); if (UI.ribbon.setPointerCapture) { try { UI.ribbon.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } } });
UI.ribbon.addEventListener('pointermove', (e) => { if (e.buttons === 0 && e.pointerType === 'mouse') return; swipeMove(e.clientY - Swipe.y0); });
UI.ribbon.addEventListener('pointerup', swipeEnd);
UI.ribbon.addEventListener('pointercancel', swipeEnd);
document.addEventListener('visibilitychange', () => { if (!document.hidden) Snd.init(); });
window.addEventListener('pageshow', () => Snd.init());

/* ---------------- 初期化 ---------------- */
$('#titleBrand').textContent = CONFIG.brand;
resetState(); renderButtons(); Box.reset(); updateTop();
S.phase = 'title';

/* ---------------- デバッグAPI ---------------- */
window.PG = {
  build: '0.2.0',
  state: () => ({ ...S, turn: S.turn ? { kind: S.turn.kind, truth: S.turn.truth, resolved: S.turn.resolved } : null }),
  truth: () => (S.turn && !S.turn.resolved ? S.turn.truth : null),
  pick: (i) => resolve(i),
  swipe: () => { if (S.phase === 'ribbon') pullRibbon(); },
  start, goTitle, nextGuest,
  setSpeed: (x) => { SPEED = x; },
  residue: () => ({ particles: BG.residue(), whisperOn: UI.whisper.classList.contains('on'), ribbonOn: UI.ribbon.classList.contains('on') }),
};
})();
