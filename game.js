/* ============================================================
   Gift Tower — ギフトを積み上げて

   黒いリボンに吊られたギフトが左右に揺れながら降りてくる。
   タップで落とす。下のギフトにきちんと重なれば一段積める。
   ぴったり真ん中に重なると Perfect。
   重なりが足りないと滑り落ちて「こぼれた」＝おしまい。
   塔の重心が台から外れすぎても倒れる。
   30秒で何個積めたかが記録。景品はどなたにも。
   ============================================================ */
(() => {
'use strict';

/* ---------------- 設定（商品・景品・難度はここだけ変える） ---------------- */
const CONFIG = {
  brand: 'SCENT PAIRING SALON',
  duration: 30,          // 秒
  hangY: 72,             // 吊り位置の上限（画面上からの px）
  fallMax: 250,          // 落下距離の目安（塔の天辺からこの px 上に吊る）
  // 精度の段階（下のギフトの中心からのずれ px）
  tiers: { perfect: 4, great: 12 },
  // 安定の判定は物理で行う: 各段より上の重心（面積加重）が、下の段の上面の範囲に入っていれば立つ。
  // 外れた段から上が倒れる。新しく置いたギフト自身の重心が外れていれば、その1個だけがこぼれる。
  swayBelow: 0.3,        // 余裕がこの比率を切ると塔が揺れて警告
  guide: true,           // 着地の影と点線ガイド
  swing: { base: 2.4, perItem: 0.16, max: 5.4 },  // 揺れの速さ（rad/s）。速いほど差がつく
  fall: { min: 220, max: 420, perPx: 0.35 },       // 落下時間 ms
  ranks: { S: 14, A: 8 },
  prizes: { S: 'コロン 9mL', A: 'コロン 1.5mL ×2', C: 'コロン 1.5mL' },
  // 落ちてくるギフト（2026年の新作。名称は日本公式発表に基づく。w/h は px、tint は液色）
  items: [
    { key: 'ssb100', name: 'シー ソルト & ベルガモット コロン 100mL', w: 68, h: 68, weight: 3, html: '<div class="g box"><span class="lbl">SEA SALT</span><i class="tint" style="background:#a9dccf"></i></div>' },
    { key: 'ssb50',  name: 'シー ソルト & ベルガモット コロン 50mL',  w: 58, h: 60, weight: 2, html: '<div class="g box"><span class="lbl">50mL</span><i class="tint" style="background:#a9dccf"></i></div>' },
    { key: 'ssb30',  name: 'シー ソルト & ベルガモット コロン 30mL',  w: 50, h: 52, weight: 2, html: '<div class="g box"><span class="lbl">30mL</span><i class="tint" style="background:#a9dccf"></i></div>' },
    { key: 'marm',   name: 'オレンジ マーマレード コロン 100mL',        w: 68, h: 68, weight: 2, html: '<div class="g box"><span class="lbl">MARMALADE</span><i class="tint" style="background:#f4b563"></i></div>' },
    { key: 'beet',   name: 'スカーレット ビートルート コロン 30mL',     w: 50, h: 52, weight: 2, html: '<div class="g box"><span class="lbl">BEETROOT</span><i class="tint" style="background:#c9566f"></i></div>' },
    { key: 'butter', name: 'ベルベッティ バターナット コロン 30mL',     w: 50, h: 52, weight: 2, html: '<div class="g box"><span class="lbl">BUTTERNUT</span><i class="tint" style="background:#e9a24a"></i></div>' },
    { key: 'carrot', name: 'キャロット ブロッサム コロン 30mL',         w: 50, h: 52, weight: 2, html: '<div class="g box"><span class="lbl">CARROT</span><i class="tint" style="background:#f2c08c"></i></div>' },
    { key: 'amber',  name: 'アンバー ラブダナム コロン インテンス 100mL', w: 68, h: 68, weight: 1, html: '<div class="g box intense"><span class="lbl">INTENSE</span><i class="tint" style="background:#b98a4a"></i></div>' },
    { key: 'candle', name: 'グリーン トマト バイン キャンドル',          w: 72, h: 60, weight: 2, html: '<div class="g candle"><span class="lbl">GREEN TOMATO VINE</span></div>' },
    { key: 'diff',   name: 'グリーン トマト バイン ディフューザー',      w: 54, h: 84, weight: 1, html: '<div class="g box"><span class="lbl">DIFFUSER</span><i class="tint" style="background:#b7cf9a"></i></div>' },
    { key: 'wash',   name: 'トマト リーフ ハンド ウォッシュ',            w: 46, h: 78, weight: 2, html: '<div class="g pump"><span class="lbl">HAND WASH</span><span class="liq" style="background:#c8dba8"></span></div>' },
    { key: 'mist',   name: 'イングリッシュ ペアー & スイート ピー ヘア ミスト', w: 40, h: 72, weight: 2, html: '<div class="g bottle"><span class="lbl">HAIR MIST</span><span class="liq" style="background:#f0d58a"></span></div>' },
    { key: 'hand',   name: 'イングリッシュ ペアー & スイート ピー ハンド クリーム', w: 74, h: 30, weight: 2, html: '<div class="g tube"><span class="lbl">HAND CREAM</span></div>' },
    { key: 'disc',   name: 'ディスカバリー コレクション',               w: 100, h: 44, weight: 2, html: '<div class="g box wide"><span class="lbl">DISCOVERY</span></div>' },
    { key: 'balm',   name: 'エンリッチ ボディ バーム',                  w: 76, h: 46, weight: 1, html: '<div class="g jar"><span class="lbl">BODY BALM</span></div>' },
    { key: 'gift',   name: 'ギフト ボックス',                           w: 118, h: 58, weight: 2, html: '<div class="g gift"><span class="bow"><i></i></span></div>' },
  ],
  milestones: { 5: 'Five', 10: 'Ten', 15: 'Fifteen', 20: 'Twenty', 25: 'Twenty-five' },
  resultIdleMs: 40000,
  ambient: true,
  // オープニング。brand は文字のみ（ロゴ・公式素材は使わない）。素材が支給されたら差し替える
  ad: {
    enabled: true,
    brand: 'JO MALONE LONDON',
    eyebrow: 'LONDON',
    scents: [
      { en: 'Sea Salt & Bergamot',  ja: '海の塩と ベルガモット', c: '#a9dccf', c2: '#1f8a78', icon: 'berg' },
      { en: 'Orange Marmalade',     ja: 'オレンジ マーマレード', c: '#f4b563', c2: '#c06a2a', icon: 'orange' },
      { en: 'Scarlet Beetroot',     ja: 'スカーレット ビートルート', c: '#e39aa8', c2: '#a8203c', icon: 'beet' },
    ],
    attractMs: 45000,   // タイトルで待機中、この間隔で自動再生
    // 公式素材を支給されたら assets/ に置いてパスを書く（空なら上のコード描画を使う）
    // logo: ロゴ画像 / scent: 各香りの写真（3枚） / pairing: 重ねづけの写真 / gift: ギフトの写真
    media: { logo: '', scent: ['', '', ''], pairing: '', gift: '' },
  },
};

/* 水彩のボタニカル（オープニング用） */
const ICONS = {
  berg: (c, c2) => `<circle cx="34" cy="42" r="19" fill="${c}" stroke="${c2}" stroke-width="2.6"/><circle cx="34" cy="42" r="13" fill="#fff" opacity="0.5"/><path d="M34 26 v32 M18 42 h32" stroke="${c2}" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/><path d="M48 62 q6 -7 12 0 t10 0" fill="none" stroke="${c2}" stroke-width="3" stroke-linecap="round"/><path d="M48 18 c8 -8 16 -4 18 4 c-8 2 -14 0 -18 -4z" fill="#8fb35a" stroke="#5f8a1f" stroke-width="1.4"/><circle cx="60" cy="34" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/>`,
  orange: (c, c2) => `<circle cx="40" cy="44" r="24" fill="${c}" stroke="${c2}" stroke-width="2.6"/><circle cx="40" cy="44" r="17" fill="#fff" opacity="0.5"/><path d="M40 27 v34 M23 44 h34 M28 32 l24 24 M52 32 l-24 24" stroke="${c2}" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/><path d="M42 16 c6 -8 16 -6 18 2 c-8 3 -14 2 -18 -2z" fill="#8fb35a" stroke="#5f8a1f" stroke-width="1.4"/>`,
  beet: (c, c2) => `<path d="M40 30 c-14 0 -22 8 -20 20 c2 10 10 20 20 26 c10 -6 18 -16 20 -26 c2 -12 -6 -20 -20 -20z" fill="${c}" stroke="${c2}" stroke-width="2.6" stroke-linejoin="round"/><path d="M30 44 q10 4 20 0 M32 54 q8 3 16 0" fill="none" stroke="${c2}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/><path d="M40 30 c-2 -10 -8 -16 -16 -18 c2 8 8 14 16 18z M40 30 c2 -10 8 -16 16 -18 c-2 8 -8 14 -16 18z M40 30 c0 -10 2 -18 6 -24 c-6 6 -8 14 -6 24z" fill="#6f9a3a" stroke="#4d7326" stroke-width="1.4" stroke-linejoin="round"/>`,
  pear: (c, c2) => `<path d="M40 14 c-2 8 -8 12 -8 22 c0 6 -9 9 -9 19 c0 9 8 15 17 15 s17 -6 17 -15 c0 -10 -9 -13 -9 -19 c0 -10 -6 -14 -8 -22z" fill="${c}" stroke="${c2}" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 14 c3 -5 8 -6 13 -4" fill="none" stroke="${c2}" stroke-width="2.6" stroke-linecap="round"/><path d="M44 10 c4 -6 11 -6 14 -1 c-5 3 -10 3 -14 1z" fill="#9fbf6a" stroke="#5f8a1f" stroke-width="1.6"/><ellipse cx="33" cy="48" rx="4" ry="7" fill="#fff" opacity="0.45"/>`,
  sea: (c, c2) => `<path d="M10 34 q8 -9 16 0 t16 0 t16 0 t12 0" fill="none" stroke="${c2}" stroke-width="3.2" stroke-linecap="round"/><path d="M10 48 q8 -9 16 0 t16 0 t16 0 t12 0" fill="none" stroke="${c2}" stroke-width="3.2" stroke-linecap="round" opacity="0.75"/><path d="M14 40 q10 -10 20 0 t20 0 t14 0 v14 h-54z" fill="${c}" opacity="0.5"/><circle cx="24" cy="62" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/><circle cx="40" cy="64" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/><circle cx="56" cy="62" r="2.4" fill="#fff" stroke="${c2}" stroke-width="1"/><path d="M44 16 c6 -6 10 -2 8 4 c-2 5 -8 4 -8 -4z" fill="#c8d4c3" stroke="#6e8a66" stroke-width="1.4"/>`,
  lime: (c, c2) => `<circle cx="40" cy="42" r="24" fill="${c}" stroke="${c2}" stroke-width="2.6"/><circle cx="40" cy="42" r="18" fill="#fff" opacity="0.55"/><path d="M40 24 v36 M22 42 h36 M27.3 29.3 l25.4 25.4 M52.7 29.3 l-25.4 25.4" stroke="${c2}" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/><path d="M50 12 c8 -6 16 -2 14 6 c-8 2 -12 0 -14 -6z" fill="#8fb35a" stroke="#5f8a1f" stroke-width="1.4"/>`,
};

/* ---------------- ユーティリティ ---------------- */
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
let SPEED = 1;
const wait = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));

/* ---------------- 音（オルゴールとハープ、残響つき） ---------------- */
const Snd = {
  ctx: null, master: null, ok: false, pad: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.gain.value = 0.7;
      const dry = c.createGain(); const wet = c.createGain(); wet.gain.value = 0.3;
      const mk = (time, fb, lp) => { const d = c.createDelay(1); d.delayTime.value = time; const g = c.createGain(); g.gain.value = fb; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; d.connect(f); f.connect(g); g.connect(d); return { d, out: f }; };
      const r1 = mk(0.23, 0.42, 3200), r2 = mk(0.37, 0.35, 2400);
      this.master.connect(dry); dry.connect(c.destination);
      this.master.connect(r1.d); this.master.connect(r2.d); r1.out.connect(wet); r2.out.connect(wet); wet.connect(c.destination);
      this.ok = true; if (c.state === 'suspended') c.resume().catch(() => {});
    } catch (e) { this.ok = false; }
  },
  now() { return this.ctx.currentTime; },
  bell(f, t = 0, d = 1.6, v = 0.16) {
    if (!this.ok) return;
    const c = this.ctx, T = this.now() + t;
    [[1, 1], [2, 0.32], [3, 0.12], [4.2, 0.05]].forEach(([m, g0]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f * m, T);
      g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(v * g0, T + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, T + d / (1 + m * 0.35));
      o.connect(g); g.connect(this.master); o.start(T); o.stop(T + d + 0.05);
    });
  },
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
  /** 木の台にことんと置く音 */
  knock(v = 0.12) {
    if (!this.ok) return;
    const c = this.ctx, T = this.now();
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(320, T); o.frequency.exponentialRampToValueAtTime(140, T + 0.09);
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(v, T + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, T + 0.16);
    o.connect(g); g.connect(this.master); o.start(T); o.stop(T + 0.2);
    this.breath({ d: 0.08, v: 0.04, f: 1200, q: 0.8 });
  },
  padOn() {
    if (!this.ok || !CONFIG.ambient || this.pad) return;
    const c = this.ctx, T = this.now();
    const g = c.createGain(); g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.02, T + 4);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    const os = [130.81, 196.0, 261.63 * 1.003].map((fr) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = fr; o.connect(f); o.start(T); return o; });
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 0.006; lfo.connect(lg); lg.connect(g.gain); lfo.start(T);
    f.connect(g); g.connect(this.master); this.pad = { os, g, lfo };
  },
  padOff() {
    if (!this.pad) return;
    const T = this.now(); const p = this.pad; this.pad = null;
    p.g.gain.cancelScheduledValues(T); p.g.gain.setValueAtTime(p.g.gain.value, T); p.g.gain.linearRampToValueAtTime(0, T + 2.5);
    p.os.forEach((o) => o.stop(T + 2.7)); p.lfo.stop(T + 2.7);
  },
  melody: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0],
  step: 0,
  next(v = 0.13) { const f = this.melody[this.step % this.melody.length]; this.step++; this.bell(f, 0, 1.6, v); },
  reset() { this.step = 0; },
  ui() { this.bell(1567.98, 0, 0.6, 0.06); },
  drop() { this.breath({ d: 0.22, v: 0.05, f: 2600, q: 0.9 }); },
  land() { this.knock(0.11); this.next(); },
  perfect() { this.knock(0.08); this.next(0.12); [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => this.bell(f, 0.05 + i * 0.06, 1.4, 0.07)); this.breath({ d: 0.5, v: 0.04, f: 5000, q: 0.5 }); },
  great() { this.knock(0.1); this.next(0.12); this.bell(1567.98, 0.06, 1.0, 0.05); },
  tick() { this.bell(1567.98, 0, 0.25, 0.05); },
  spill() { this.breath({ d: 0.6, v: 0.06, f: 900, q: 0.6 }); [523.25, 415.3, 349.23].forEach((f, i) => this.bell(f, i * 0.22, 1.8, 0.09)); },
  finish() {
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => this.bell(f, i * 0.11, 2.2, 0.11));
    this.bell(261.63, 0.5, 3.5, 0.06); this.bell(392, 0.6, 3.5, 0.05); this.breath({ t: 0.6, d: 1.4, v: 0.04, f: 5000, q: 0.5 });
  },
  milestone() { [783.99, 1046.5, 1318.51].forEach((f, i) => this.bell(f, i * 0.09, 1.2, 0.08)); },
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
      for (let i = 0; i < 8; i++) petals.push(newPetal(true));
      for (let i = 0; i < 26; i++) dust.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.7, 1.8), p: rnd(0, 6.28), s: rnd(0.005, 0.014), vy: rnd(-0.04, -0.12) });
    }
  }
  function newPetal(anywhere) { return { x: rnd(0, W), y: anywhere ? rnd(0, H) : -20, vx: rnd(-0.15, 0.25), vy: rnd(0.15, 0.35), rot: rnd(0, 6.28), vr: rnd(-0.012, 0.012), s: rnd(5, 9), sway: rnd(0, 6.28), col: Math.random() < 0.7 ? '#efc9d1' : '#f3dcc0' }; }
  function burst(px, py, col, n = 22, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(0.8, 3.6) * power;
      parts.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, life: 1, decay: rnd(0.008, 0.018), size: rnd(2, 5), col, petal: Math.random() < 0.6, rot: rnd(0, 6.28), vr: rnd(-0.08, 0.08) });
    }
  }
  function drawPetal(px, py, s, rot, col, alpha) { x.save(); x.translate(px, py); x.rotate(rot); x.globalAlpha = alpha; x.fillStyle = col; x.beginPath(); x.ellipse(0, 0, s * 1.5, s * 0.85, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
  function frame() {
    x.clearRect(0, 0, W, H);
    for (const b of blobs) {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r; if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;
      const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); g.addColorStop(0, b.col + '80'); g.addColorStop(1, b.col + '00');
      x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill();
    }
    for (const d of dust) { d.p += d.s; d.y += d.vy; if (d.y < -4) { d.y = H + 4; d.x = rnd(0, W); } x.fillStyle = `rgba(201,169,97,${0.12 + 0.5 * (0.5 + 0.5 * Math.sin(d.p))})`; x.beginPath(); x.arc(d.x, d.y, d.r, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < petals.length; i++) { const p = petals[i]; p.sway += 0.01; p.x += p.vx + Math.sin(p.sway) * 0.25; p.y += p.vy; p.rot += p.vr; if (p.y > H + 20 || p.x < -30 || p.x > W + 30) petals[i] = newPetal(false); drawPetal(p.x, p.y, p.s, p.rot, p.col, 0.5); }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.985; p.life -= p.decay; p.rot += p.vr;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.petal) drawPetal(p.x, p.y, p.size, p.rot, p.col, clamp(p.life, 0, 1));
      else { x.globalAlpha = clamp(p.life, 0, 1); x.fillStyle = p.col; x.beginPath(); x.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1; }
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize); resize(); frame();
  return { burst, residue: () => parts.length };
})();

/* ---------------- DOM ---------------- */
const UI = {
  stage: $('#stage'), world: $('#world'), items: $('#items'), base: $('#base'), topBow: $('#topBow'),
  crane: $('#crane'), hanging: $('#hanging'), ribbonLine: $('#ribbonLine'), tapHint: $('#tapHint'),
  glow: $('#glow'), whisper: $('#whisper'), wMain: $('#whisperMain'), wSub: $('#whisperSub'),
  countNum: $('#countNum'), timeNum: $('#timeNum'), itemName: $('#itemName'), timeFill: $('#timeFill'), footNote: $('#footNote'),
  guide: $('#guide'), guideShadow: $('#guideShadow'), balance: $('#balance'), balanceDot: $('#balanceDot'), balanceText: $('#balanceText'),
};
function glow() { UI.glow.classList.remove('on'); void UI.glow.offsetWidth; UI.glow.classList.add('on'); }
let whisperTimer = null;
function whisper(main, sub = '', tone = '', hold = false, ja = false) {
  UI.wMain.textContent = main; UI.wSub.textContent = sub;
  UI.wMain.classList.toggle('ja', ja);
  UI.whisper.className = ''; void UI.whisper.offsetWidth;
  UI.whisper.classList.add('on'); if (tone) UI.whisper.classList.add(tone); if (hold) UI.whisper.classList.add('hold');
  clearTimeout(whisperTimer);
  if (!hold) whisperTimer = setTimeout(() => UI.whisper.classList.remove('on'), 1450 * SPEED);
}
function stageToScreen() { return UI.stage.getBoundingClientRect(); }

/* ---------------- 状態 ---------------- */
const S = {
  phase: 'title',   // title | intro | play | ending | result
  W: 0, H: 0,
  stack: [],        // { x, y, w, h, el, key }  world 座標（y は上端）
  topY: 0, baseX: 0, baseW: 200,
  offset: 0,        // カメラ（world を下へずらす px）
  hanging: null,    // { def, el, w, h }
  swing: { phase: 0, speed: 1.6, amp: 100, x: 0 },
  hangY: 72,
  mode: 'idle',     // idle | swing | falling
  count: 0, perfects: 0, greats: 0, goods: 0, streak: 0, bestStreak: 0, lastKey: '',
  timeLeft: CONFIG.duration, startAt: 0, endAt: 0, endReason: '',
  lastTick: -1,
};

function measure() {
  const r = stageToScreen(); S.W = r.width; S.H = r.height;
  S.baseW = 200; S.baseX = S.W / 2 - S.baseW / 2;
  S.topY = S.H - 18 - 34; // 台の上端
}

/* ---------------- ギフトを作る ---------------- */
function pickDef(first) {
  const pool = CONFIG.items.filter((d) => (!first || d.w >= 70) && d.key !== S.lastKey);
  // 8個を超えたら細いギフトが出やすくなる
  const wt = (d) => d.weight * (S.count >= 8 && d.w < 60 ? 1.6 : 1);
  const total = pool.reduce((a, d) => a + wt(d), 0);
  let r = Math.random() * total;
  for (const d of pool) { r -= wt(d); if (r <= 0) return d; }
  return pool[0];
}
function makeItemEl(def) {
  const el = document.createElement('div');
  el.className = 'item'; el.style.width = def.w + 'px'; el.style.height = def.h + 'px';
  el.innerHTML = def.html;
  return el;
}
function placeEl(el, x, y) { el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); el.style.transform = `translate(${x}px, ${y}px)`; }

/* ---------------- クレーン ---------------- */
function loadNext() {
  const def = pickDef(S.count < 2);
  const el = makeItemEl(def);
  UI.hanging.innerHTML = ''; UI.hanging.appendChild(el);
  S.hanging = { def, el, w: def.w, h: def.h }; S.lastKey = def.key;
  UI.itemName.textContent = def.name || '';
  S.swing.amp = Math.max(30, S.W / 2 - def.w / 2 - 16);
  S.swing.speed = Math.min(CONFIG.swing.max, CONFIG.swing.base + S.count * CONFIG.swing.perItem);
  S.swing.phase = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;   // 左右どちらかの端からスタート
  S.hangY = Math.max(CONFIG.hangY, S.topY + S.offset - CONFIG.fallMax - def.h);
  UI.crane.classList.remove('hidden', 'dropped');
  S.mode = 'swing';
}
function craneUpdate(dt) {
  if (S.mode !== 'swing') return;
  S.swing.phase += S.swing.speed * dt;
  S.swing.x = S.W / 2 + Math.sin(S.swing.phase) * S.swing.amp;
  UI.crane.style.transform = `translate(${S.swing.x}px, ${S.hangY}px)`;
  if (CONFIG.guide && S.hanging) {
    const top = S.hangY + S.hanging.h;                 // 吊られたギフトの底
    const landY = S.topY + S.offset;                   // 塔の天辺（画面）
    UI.guide.classList.remove('off');
    UI.guide.style.setProperty('--len', Math.max(0, landY - top) + 'px');
    UI.guide.style.setProperty('--w', S.hanging.w + 'px');
    UI.guide.style.transform = `translate(${S.swing.x}px, ${top}px)`;
    const prev = S.stack.length ? S.stack[S.stack.length - 1] : { x: S.baseX, w: S.baseW };
    UI.guideShadow.classList.toggle('tight', Math.abs(S.swing.x - (prev.x + prev.w / 2)) <= CONFIG.tiers.great);
  }
}

/* ---------------- 落とす ---------------- */
function drop() {
  if (S.phase !== 'play' || S.mode !== 'swing' || !S.hanging) return;
  Snd.init();
  S.mode = 'falling';
  UI.tapHint.classList.add('off');
  const { def, w, h } = S.hanging;
  const x = S.swing.x - w / 2;
  const startY = S.hangY - S.offset;               // 画面 → world
  const targetY = S.topY - h;
  const el = makeItemEl(def);
  UI.items.appendChild(el);
  placeEl(el, x, startY);
  UI.hanging.innerHTML = ''; S.hanging = null;
  UI.guide.classList.add('off');
  UI.crane.classList.add('dropped');
  Snd.drop();
  const dist = Math.max(40, targetY - startY);
  const dur = clamp(CONFIG.fall.min + dist * CONFIG.fall.perPx, CONFIG.fall.min, CONFIG.fall.max) * SPEED;
  const t0 = performance.now();
  (function fall() {
    const t = clamp((performance.now() - t0) / dur, 0, 1);
    const e = t * t;
    placeEl(el, x, startY + (targetY - startY) * e);
    if (t < 1) return setTimeout(fall, 16); // rAF が止まる環境でも落ちきる
    land({ x, y: targetY, w, h, el, key: def.key });
  })();
}

/* 物理の安定判定。各段より上の重心（面積加重）が、その段を支える面の範囲に入っているか */
function stability() {
  const n = S.stack.length;
  let mass = 0, moment = 0;
  let worst = { margin: 1, ratio: 0, k: -1 };
  for (let k = n - 1; k >= 0; k--) {
    const it = S.stack[k], m = it.w * it.h;
    mass += m; moment += m * (it.x + it.w / 2);
    const com = moment / mass;
    const sup = k === 0 ? { x: S.baseX, w: S.baseW } : S.stack[k - 1];
    const half = sup.w / 2, center = sup.x + half;
    const ratio = (com - center) / half;   // -1〜1 が支持範囲の内側
    const margin = 1 - Math.abs(ratio);
    if (Math.abs(ratio) > 1) return { ok: false, k, dir: Math.sign(ratio), margin: 0, ratio };
    if (margin < worst.margin) worst = { margin, ratio, k };
  }
  return { ok: true, ...worst };
}

function updateBalance(st) {
  const r = clamp(st.ratio, -1.15, 1.15);
  UI.balanceDot.style.left = (50 + r * 42) + '%';
  const hot = st.margin < CONFIG.swayBelow;
  UI.balanceDot.classList.toggle('warn', hot);
  UI.balance.classList.toggle('hot', hot);
  UI.balanceText.textContent = st.margin > 0.6 ? '安定' : st.margin > CONFIG.swayBelow ? '注意' : '危うい';
  UI.world.classList.toggle('sway', hot && S.phase === 'play');
}

function land(it) {
  const prev = S.stack.length ? S.stack[S.stack.length - 1] : { x: S.baseX, w: S.baseW };
  const center = it.x + it.w / 2, prevCenter = prev.x + prev.w / 2;
  const dx = center - prevCenter;

  S.stack.push(it);
  const st = stability();
  if (!st.ok) return topple(st.k, st.dir);

  // 積めた
  S.topY = it.y; S.count++;
  it.el.classList.add('land');
  const scr = stageToScreen();
  const px = scr.left + center, py = scr.top + it.y + S.offset + it.h / 2;
  const off = Math.abs(dx);
  let tier = 'good';
  if (off <= CONFIG.tiers.perfect) tier = 'perfect'; else if (off <= CONFIG.tiers.great) tier = 'great';
  if (tier === 'perfect') {
    S.perfects++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak);
    it.el.classList.add('perfectRing'); Snd.perfect(); glow();
    BG.burst(px, py, '#c9a961', 22, 1.1); BG.burst(px, py, '#efc9d1', 12, 0.9);
    whisper('Perfect', S.streak >= 2 ? `${S.streak} 連続` : '');
  } else if (tier === 'great') {
    S.greats++; S.streak = 0;
    it.el.classList.add('greatRing'); Snd.great();
    BG.burst(px, py, '#c9a961', 8, 0.7);
    whisper('', 'Great');
  } else {
    S.goods++; S.streak = 0; Snd.land();
    BG.burst(px, py, '#efc9d1', 6, 0.5);
  }
  UI.countNum.textContent = S.count;
  UI.countNum.classList.remove('pop'); void UI.countNum.offsetWidth; UI.countNum.classList.add('pop');
  UI.footNote.textContent = `Perfect ${S.perfects} ・ Great ${S.greats} ・ Good ${S.goods}`;
  if (CONFIG.milestones[S.count] && tier !== 'perfect') { whisper(CONFIG.milestones[S.count], `${S.count} 個`); Snd.milestone(); }

  updateBalance(st);
  updateCamera(st.ratio * (prev.w / 2));
  if (S.timeLeft <= 0) return finish();
  loadNext();
}

function updateCamera(com = 0) {
  const target = S.H * 0.56;
  const need = target - S.topY;          // topY が画面の 56% より上へ来たら world を下げる
  S.offset = Math.max(0, need);
  const lean = clamp(com * 0.05, -3.2, 3.2);
  UI.world.style.transform = `translateY(${S.offset}px) rotate(${lean}deg)`;
}

/* ---------------- こぼれる・倒れる ---------------- */
// k 段目から上が dir 方向へ落ちる。k 段目より下は残り、その数が記録になる
async function topple(k, dir) {
  S.phase = 'ending'; S.endAt = performance.now();
  const falling = S.stack.slice(k); S.stack = S.stack.slice(0, k);
  S.count = S.stack.length; UI.countNum.textContent = S.count;
  S.endReason = falling.length === 1 ? 'spill' : 'topple';
  UI.crane.classList.add('hidden'); UI.guide.classList.add('off');
  UI.world.classList.remove('sway');
  Snd.spill();
  const scr = stageToScreen();
  falling.forEach((it, i) => {
    setTimeout(() => {
      it.el.classList.add('slide');
      it.el.style.transform = `translate(${it.x + dir * (170 + i * 12)}px, ${it.y + 300 + i * 10}px) rotate(${dir * (55 + i * 6)}deg)`;
    }, i * 50);
    BG.burst(scr.left + it.x + it.w / 2, scr.top + it.y + S.offset, '#efc9d1', 8, 0.7);
  });
  if (falling.length > 1) { UI.world.classList.add('topple'); UI.world.style.transform = `translateY(${S.offset}px) rotate(${dir * 3}deg)`; }
  whisper(S.endReason === 'spill' ? 'こぼれた…' : '傾いた…', `${S.count} 個 積み上げた`, 'rose', true, true);
  await wait(2400);
  showResult();
}

/* ---------------- 時間切れ（塔は立ったまま完成） ---------------- */
async function finish() {
  S.phase = 'ending'; S.endReason = 'time'; S.endAt = performance.now();
  UI.crane.classList.add('hidden'); UI.guide.classList.add('off'); UI.world.classList.remove('sway');
  Snd.finish(); glow();
  const top = S.stack[S.stack.length - 1];
  if (top) {
    UI.topBow.style.left = (top.x + top.w / 2) + 'px'; UI.topBow.style.top = (top.y - 2) + 'px';
    UI.topBow.classList.add('on');
    const scr = stageToScreen();
    BG.burst(scr.left + top.x + top.w / 2, scr.top + top.y + S.offset, '#c9a961', 34, 1.3);
    BG.burst(scr.left + top.x + top.w / 2, scr.top + top.y + S.offset, '#efc9d1', 26, 1.1);
  }
  whisper('Time', `${S.count} 個、積み上がりました`, '', true);
  await wait(2600);
  showResult();
}

/* ---------------- タイマー・ループ ---------------- */
let last = 0, lastRaf = 0;
function step(now) {
  const dt = Math.min(0.05, (now - last) / 1000) / SPEED; last = now;
  if (S.phase !== 'play') return;
  craneUpdate(dt);
  S.timeLeft = Math.max(0, CONFIG.duration - (now - S.startAt) / 1000 / SPEED);
  const sec = Math.ceil(S.timeLeft);
  if (sec !== S.lastTick) {
    S.lastTick = sec;
    UI.timeNum.classList.toggle('hurry', sec <= 5);
    if (sec <= 5 && sec > 0) Snd.tick();
  }
  UI.timeNum.textContent = S.timeLeft <= 5 ? S.timeLeft.toFixed(1) : sec;
  UI.timeFill.style.transform = `scaleX(${S.timeLeft / CONFIG.duration})`;
  if (S.timeLeft <= 0 && S.mode === 'swing') finish();
}
// rAF が止まる環境（非表示タブ・省電力）でも進むよう、setInterval で補う
function loop(now) { lastRaf = now; step(now); requestAnimationFrame(loop); }
setInterval(() => { const now = performance.now(); if (now - lastRaf > 120) step(now); }, 33);

/* ---------------- 結果 ---------------- */
const RANK_KEY = 'gifttower.ranking.v1';
function today() { return new Date().toISOString().slice(0, 10); }
function loadRank() { try { const d = JSON.parse(localStorage.getItem(RANK_KEY) || 'null'); if (d && d.date === today() && Array.isArray(d.list)) return d.list; } catch (e) { /* ignore */ } return []; }
function saveRank(list) { try { localStorage.setItem(RANK_KEY, JSON.stringify({ date: today(), list })); } catch (e) { /* private mode */ } }
function renderRank(el, meId) {
  const list = loadRank();
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="rh">TODAY'S BEST</div>` + list.map((r, i) => `<div class="row${r.id === meId ? ' me' : ''}"><span>${i + 1}</span><span>${r.n} 個 ・ Perfect ${r.p}</span></div>`).join('');
}
let idleTimer = null;
function showResult() {
  S.phase = 'result';
  Snd.padOff();
  const n = S.count;
  const rank = n >= CONFIG.ranks.S ? 'S' : n >= CONFIG.ranks.A ? 'A' : 'C';
  const badge = $('#rBadge'); badge.textContent = rank; badge.className = 'stampRank ' + rank;
  $('#rKicker').textContent = S.endReason === 'time' ? 'PERFECTLY STACKED' : 'RESULT';
  $('#rCount').textContent = n;
  $('#rTitle').textContent = S.endReason === 'time' ? '崩れずに 積み上げました' : (S.endReason === 'topple' ? '塔が 傾いてしまいました' : 'こぼれて しまいました');
  $('#rStats').innerHTML = `<div>Perfect <b>${S.perfects}</b></div><div>連続 <b>${S.bestStreak}</b></div><div><b>${Math.round(((S.endAt - S.startAt) / 1000) / SPEED)}</b> 秒</div>`;
  $('#rTiers').innerHTML = `<span>Perfect <b>${S.perfects}</b></span><span>Great <b>${S.greats}</b></span><span>Good <b>${S.goods}</b></span>`;
  $('#rPrize').textContent = CONFIG.prizes[rank];
  let meId = null;
  if (SPEED === 1) {
    const list = loadRank(); meId = Date.now();
    list.push({ id: meId, n, p: S.perfects }); list.sort((a, b) => b.n - a.n || b.p - a.p); saveRank(list.slice(0, 5));
  }
  renderRank($('#resultRank'), meId);
  document.body.classList.remove('is-title'); document.body.classList.add('is-result');
  UI.whisper.classList.remove('on', 'hold');
  clearTimeout(idleTimer); idleTimer = setTimeout(goTitle, CONFIG.resultIdleMs);
}

function resetWorld() {
  UI.items.innerHTML = ''; UI.hanging.innerHTML = '';
  UI.world.classList.remove('topple'); UI.world.style.transform = 'translateY(0) rotate(0)';
  UI.topBow.classList.remove('on');
  UI.crane.classList.add('hidden'); UI.crane.classList.remove('dropped');
  UI.tapHint.classList.remove('off');
  S.stack = []; S.offset = 0; S.hanging = null; S.mode = 'idle';
  S.count = 0; S.perfects = 0; S.greats = 0; S.goods = 0; S.streak = 0; S.bestStreak = 0; S.lastKey = ''; S.timeLeft = CONFIG.duration; S.lastTick = -1; S.endReason = '';
  UI.guide.classList.add('off'); UI.world.classList.remove('sway');
  updateBalance({ ok: true, margin: 1, ratio: 0, k: -1 });
  UI.countNum.textContent = '0'; UI.timeNum.textContent = CONFIG.duration; UI.timeNum.classList.remove('hurry'); UI.itemName.textContent = '';
  UI.timeFill.style.transform = 'scaleX(1)';
  UI.footNote.textContent = 'ぴったり重ねると Perfect。重心が外れると こぼれる。';
  measure();
}
let attractTimer = null;
function armAttract() {
  clearTimeout(attractTimer);
  if (!CONFIG.ad.enabled) return;
  attractTimer = setTimeout(async () => { if (S.phase === 'title') { await Ad.play(); armAttract(); } }, CONFIG.ad.attractMs);
}
function goTitle() {
  clearTimeout(idleTimer);
  S.phase = 'title'; Snd.padOff();
  resetWorld();
  renderRank($('#titleRank'), null);
  document.body.classList.remove('is-result'); document.body.classList.add('is-title');
  armAttract();
}
// 次の方へ: オープニングを流してからタイトル
async function nextGuest() {
  clearTimeout(idleTimer); clearTimeout(attractTimer);
  S.phase = 'title'; Snd.padOff(); resetWorld();
  document.body.classList.remove('is-result'); document.body.classList.add('is-title');
  await Ad.play();
  goTitle();
}
async function start() {
  clearTimeout(idleTimer); clearTimeout(attractTimer);
  if (Ad.playing) Ad.skip();
  document.body.classList.remove('is-title', 'is-result');
  resetWorld(); Snd.reset(); Snd.ui(); Snd.padOn();
  S.phase = 'intro';
  whisper('Ready', '揺れる ギフトを、タップで 落とす');
  await wait(1500);
  S.phase = 'play'; S.startAt = performance.now(); S.lastTick = -1;
  loadNext();
}

/* ---------------- オープニング（約6.5秒、タップでスキップ） ---------------- */
const Ad = {
  timers: [], playing: false, resolve: null,
  el: null,
  init() {
    this.el = $('#ad'); $('#adBrand').textContent = CONFIG.ad.brand; $('#adBrandTop').textContent = CONFIG.ad.eyebrow;
    this.el.addEventListener('pointerdown', () => this.skip());
    const m = CONFIG.ad.media || {};
    const photo = (scene, src) => { if (!src) return; const img = document.createElement('img'); img.className = 'adPhoto'; img.src = src; img.alt = ''; scene.prepend(img); scene.classList.add('hasPhoto'); };
    if (m.scent && m.scent[0]) photo($('#adScent'), m.scent[0]);
    if (m.pairing) photo($('#adPair'), m.pairing);
    if (m.gift) photo($('#adGift'), m.gift);
    if (m.logo) { $('#adBrand').innerHTML = `<img src="${m.logo}" alt="${CONFIG.ad.brand}">`; }
  },
  at(ms, fn) { this.timers.push(setTimeout(fn, ms * SPEED)); },
  setScent(i) {
    const sc = CONFIG.ad.scents[i]; if (!sc) return;
    const name = $('#adScentName'), ja = $('#adScentJa'), icon = $('#adBloomIcon'), bloom = $('#adScent .adBloom');
    name.classList.add('swap'); icon.classList.add('swap');
    setTimeout(() => {
      name.textContent = sc.en; ja.textContent = sc.ja;
      icon.innerHTML = ICONS[sc.icon](sc.c, sc.c2);
      bloom.style.setProperty('--c', sc.c); $('#adLiq').style.background = sc.c;
      name.classList.remove('swap'); icon.classList.remove('swap');
      const ph = $('#adScent .adPhoto'); const src = (CONFIG.ad.media.scent || [])[i]; if (ph && src) ph.src = src;
    }, 320 * SPEED);
    if (Snd.ok) Snd.bell([1046.5, 1318.51, 1567.98][i % 3], 0, 1.6, 0.06);
  },
  play() {
    if (!CONFIG.ad.enabled || this.playing) return Promise.resolve();
    this.playing = true;
    const el = this.el;
    el.className = ''; ['adScent', 'adPair', 'adGift'].forEach((id) => { $('#' + id).className = $('#' + id).className.replace(/ ?(on|off)/g, ''); });
    document.body.classList.add('is-ad');
    // 初期の香りを無音でセット
    const sc = CONFIG.ad.scents[0];
    $('#adScentName').textContent = sc.en; $('#adScentJa').textContent = sc.ja; $('#adBloomIcon').innerHTML = ICONS[sc.icon](sc.c, sc.c2);
    $('#adScent .adBloom').style.setProperty('--c', sc.c); $('#adLiq').style.background = sc.c;
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.at(80, () => el.classList.add('s1'));
      this.at(1100, () => { el.classList.add('s2'); $('#adScent').classList.add('on'); if (Snd.ok) Snd.bell(783.99, 0, 2, 0.06); });
      this.at(2100, () => this.setScent(1));
      this.at(3000, () => this.setScent(2));
      this.at(3800, () => { $('#adScent').classList.add('off'); });
      this.at(4100, () => { $('#adPair').classList.add('on'); if (Snd.ok) [783.99, 987.77, 1174.66].forEach((f, i) => Snd.bell(f, i * 0.12, 1.8, 0.06)); });
      this.at(5300, () => { $('#adPair').classList.add('off'); });
      this.at(5600, () => { $('#adGift').classList.add('on'); if (Snd.ok) [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => Snd.bell(f, i * 0.1, 2.2, 0.07)); const r = $('.adGiftBox').getBoundingClientRect(); setTimeout(() => BG.burst(r.left + r.width / 2, r.top, '#c9a961', 26, 1.1), 700 * SPEED); });
      this.at(7300, () => this.finish());
    });
  },
  finish() {
    this.timers.forEach(clearTimeout); this.timers = [];
    const el = this.el; el.classList.add('out');
    setTimeout(() => { document.body.classList.remove('is-ad'); el.className = ''; this.playing = false; const r = this.resolve; this.resolve = null; if (r) r(); }, 600 * SPEED);
  },
  skip() { if (this.playing) this.finish(); },
};

/* ---------------- 入力 ---------------- */
UI.stage.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === 'ArrowDown') { if (S.phase === 'play') drop(); e.preventDefault(); }
  if (e.key === 'Enter' && S.phase === 'title') start();
  if (e.key === 'Escape') { if (Ad.playing) Ad.skip(); else goTitle(); }
});
$('#startBtn').addEventListener('click', () => { Snd.init(); start(); });
$('#againBtn').addEventListener('click', () => { Snd.init(); start(); });
$('#nextBtn').addEventListener('click', () => { Snd.init(); nextGuest(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) Snd.init(); });
window.addEventListener('pageshow', () => Snd.init());
window.addEventListener('resize', () => { if (S.phase === 'title') measure(); });

/* ---------------- 初期化 ---------------- */
$('#titleBrand').textContent = CONFIG.brand;
measure(); resetWorld(); renderRank($('#titleRank'), null);
S.phase = 'title';
Ad.init();
Ad.play().then(armAttract);
requestAnimationFrame((t) => { last = t; lastRaf = t; loop(t); });

/* ---------------- デバッグAPI ---------------- */
window.PG = {
  build: '0.3.0',
  _S: S,
  state: () => ({ phase: S.phase, mode: S.mode, hangY: S.hangY, H: S.H, count: S.count, perfects: S.perfects, timeLeft: S.timeLeft, offset: S.offset, topY: S.topY, stack: S.stack.map((s) => ({ x: s.x, w: s.w, key: s.key })) }),
  crane: () => ({ x: S.swing.x, w: S.hanging ? S.hanging.w : 0, prevCenter: S.stack.length ? S.stack[S.stack.length - 1].x + S.stack[S.stack.length - 1].w / 2 : S.W / 2 }),
  drop, start, goTitle, ad: () => Ad.play(), skipAd: () => Ad.skip(),
  dropAt: (x) => { if (S.mode === 'swing') { S.swing.x = x; drop(); } },
  stability,
  setSpeed: (x) => { SPEED = x; },
  residue: () => ({ particles: BG.residue(), items: UI.items.children.length }),
};
})();
