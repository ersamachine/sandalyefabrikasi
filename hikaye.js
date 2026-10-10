/* SF Sandalye — giriş animasyonu (modern sürüm)
   1974 boş arsa → atölye → 2010 fabrika → bugün 2 tesis (Higgsfield maket aşamaları; binalar tuğla sıraları hâlinde örülür)
   → kamera ana binaya yaklaşır, gerçek fotoğrafa geçer (canlandırılmış fabrika fotoğrafları) → m² → noktalı dünya, 90 ülke.
   Metinler window.SF_T (app.js) ile çevrilir. Test: ?hk=saniye */
(() => {
  const root = document.getElementById('story');
  if (!root) return;
  const cv = root.querySelector('canvas'), cx = cv.getContext('2d');
  const $ = s => root.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = k => (window.SF_T ? window.SF_T(k) : k);
  const fmtN = n => (window.SF_FMT ? window.SF_FMT(n) : String(n));
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const out = t => 1 - Math.pow(1 - t, 3);
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  /* ---------- zaman çizelgesi (saniye) ---------- */
  const TL = { push: [8.9, 10.4], m2: [10.4, 12.9], zoom: [12.9, 14.1], globe: [14.1, 21.6] };
  // maket aşamaları: [başlangıç, bitiş, eski, yeni, tuğla haritası] — 1974 atölye örülür → çatı; fabrika iskeleti → tamamlanır; 2. tesis iskeleti → tamamlanır
  const ST = [[1.0, 2.0, 's1', 's1b', 'r1'], [2.0, 2.9, 's1b', 's2', 'r2'], [3.3, 4.9, 's2', 's2b', 'r3'], [4.9, 6.4, 's2b', 's3', 'r4'], [6.6, 7.6, 's3', 's3b', 'r5'], [7.6, 8.6, 's3b', 's4', 'r6']];
  const Y1 = [3.3, 6.4], Y2 = [6.6, 8.6];   // yıl sayacı: 1974→2010, 2010→2026
  const END = 24.5;

  /* ---------- boyut ---------- */
  let W = 0, H = 0, dpr = 1;
  function size() {
    const r = root.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- görseller ve maket geçişleri ---------- */
  const IMG = {};
  const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => { IMG[k] = i; r(); }; i.onerror = r; i.src = src; });
  const WW = 1280, WH = 720;                       // maket çalışma çözünürlüğü
  const work = document.createElement('canvas'); work.width = WW; work.height = WH;
  const wx = work.getContext('2d', { willReadFrequently: true });
  const PX = {}, RM = {};
  function prep() {
    ['s1', 's1b', 's2', 's2b', 's3', 's3b', 's4'].forEach(k => { wx.drawImage(IMG[k], 0, 0, WW, WH); PX[k] = wx.getImageData(0, 0, WW, WH).data.slice(); });
    ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].forEach(k => {
      wx.imageSmoothingEnabled = false; wx.drawImage(IMG[k], 0, 0, WW, WH); wx.imageSmoothingEnabled = true;
      const d = wx.getImageData(0, 0, WW, WH).data, idx = [], val = [];
      for (let i = 0, p = 0; i < d.length; i += 4, p++) if (d[i] < 255) { idx.push(p); val.push(d[i] / 254); }
      RM[k] = { idx: Int32Array.from(idx), val: Float32Array.from(val) };
    });
    const c = PX.s4; root.style.background = `rgb(${c[0]},${c[1]},${c[2]})`;   // sahne zemini = maketin köşe tonu
  }
  let lastKey = '';
  // A → B: değişmeyen yerde yumuşak geçiş; binalarda tuğla sıraları alttan üste örülür, örülen sıranın üstünde sıcak ışık
  function composeStage(a, b, rk, p) {
    const key = a + b + p.toFixed(3);
    if (key === lastKey) return; lastKey = key;
    if (!rk || p <= 0) { wx.putImageData(new ImageData(PX[a].slice(), WW, WH), 0, 0); return; }
    if (p >= 1) { wx.putImageData(new ImageData(PX[b].slice(), WW, WH), 0, 0); return; }
    const A = PX[a], B = PX[b], o = new Uint8ClampedArray(A.length), q = ease(p);
    for (let i = 0; i < A.length; i++) o[i] = A[i] + (B[i] - A[i]) * q;
    const { idx, val } = RM[rk], soft = .018;
    for (let n = 0; n < idx.length; n++) {
      const i = idx[n] * 4, f = p - val[n], k = clamp(f / soft);
      const glow = f > 0 && f < .05 ? (1 - f / .05) * 95 : 0;               // örülme cephesi parıltısı
      o[i] = A[i] + (B[i] - A[i]) * k + glow;
      o[i + 1] = A[i + 1] + (B[i + 1] - A[i + 1]) * k + glow * .62;
      o[i + 2] = A[i + 2] + (B[i + 2] - A[i + 2]) * k + glow * .25;
    }
    wx.putImageData(new ImageData(o, WW, WH), 0, 0);
  }
  function drawStage(t) {
    if (t < ST[0][0]) return composeStage('s1', 's1', null, 0);
    let st = ST[0];
    for (const x of ST) if (t >= x[0]) st = x;
    composeStage(st[2], st[3], st[4], seg(t, st[0], st[1]));
  }
  // kaplama + odaklı yakınlaşma: (zx, zy) görsel noktası ekranda sabit kalır
  function cover(img, iw, ih, x, y, w, h, zoom = 1, zx = .5, zy = .5) {
    const s0 = Math.max(w / iw, h / ih), s = s0 * zoom;
    const bx = x + (w - iw * s0) / 2, by = y + (h - ih * s0) / 2;
    const px = bx + zx * iw * s0, py = by + zy * ih * s0;
    const ox = px - zx * iw * s, oy = py - zy * ih * s;
    cx.drawImage(img, ox, oy, iw * s, ih * s);
    return (u, v) => [ox + u * iw * s, oy + v * ih * s];
  }
  function rrect(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function pin(x, y, label, value, a, dir, now) {
    if (a <= 0) return;
    cx.save(); cx.globalAlpha = a;
    const fs = Math.max(11, Math.min(14, W / 80));
    cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = 1.2;
    const pr = (now / 1400) % 1; cx.beginPath(); cx.arc(x, y, 6 + pr * 14, 0, 7); cx.globalAlpha = a * (1 - pr); cx.stroke(); cx.globalAlpha = a;
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x, y, 4.5, 0, 7); cx.fill();
    const lx = x + dir * 36, ly = y - 36;
    cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(lx, ly); cx.stroke();
    cx.font = `600 ${fs * 1.9}px "Cormorant Garamond", serif`; const vw = cx.measureText(value).width;
    cx.font = `600 ${fs * .86}px Manrope, sans-serif`; const lw = cx.measureText(label).width;
    const bw = Math.max(vw, lw) + 28, bh = fs * 3.5;
    const bx = clamp(dir > 0 ? lx : lx - bw, 8, W - bw - 8), by = clamp(ly - bh + 6, 8, H - bh - 8);
    cx.fillStyle = 'rgba(14,12,11,.6)'; rrect(bx, by, bw, bh, 12); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,.2)'; cx.lineWidth = 1; rrect(bx, by, bw, bh, 12); cx.stroke();
    cx.textBaseline = 'top'; cx.fillStyle = '#D9B26A'; cx.font = `600 ${fs * .86}px Manrope, sans-serif`; cx.fillText(label, bx + 14, by + 10);
    cx.fillStyle = '#fff'; cx.font = `600 ${fs * 1.9}px "Cormorant Garamond", serif`; cx.fillText(value, bx + 14, by + 10 + fs * 1.05);
    cx.restore();
  }

  /* ---------- noktalı dünya ---------- */
  const ORG = [32.08, 41.43]; // Çaycuma
  const DEST = [['DE', 13.4, 52.5], ['GB', -0.1, 51.5], ['FR', 2.35, 48.86], ['IT', 12.5, 41.9], ['ES', -3.7, 40.4], ['NL', 4.9, 52.37], ['BE', 4.35, 50.85], ['GR', 23.7, 37.98], ['PL', 21.0, 52.23], ['RO', 26.1, 44.43], ['BG', 23.3, 42.7], ['SE', 18.07, 59.33],
    ['RU', 37.6, 55.75], ['AZ', 49.87, 40.4], ['GE', 44.8, 41.7], ['KZ', 71.4, 51.16], ['UZ', 69.3, 41.3], ['IQ', 44.4, 33.3], ['SA', 46.7, 24.7], ['AE', 55.3, 25.2], ['QA', 51.5, 25.3], ['KW', 47.98, 29.37], ['JO', 35.9, 31.95], ['LB', 35.5, 33.9],
    ['EG', 31.2, 30.04], ['LY', 13.2, 32.9], ['DZ', 3.05, 36.75], ['MA', -6.8, 34.0], ['TN', 10.2, 36.8], ['NG', 7.5, 9.06], ['ZA', 28.0, -26.2], ['KE', 36.8, -1.3],
    ['IN', 77.2, 28.6], ['PK', 73.0, 33.7], ['CN', 116.4, 39.9], ['KR', 127.0, 37.5], ['JP', 139.7, 35.7], ['AU', 149.1, -35.3],
    ['US', -77.0, 38.9], ['CA', -75.7, 45.4], ['MX', -99.1, 19.4], ['BR', -47.9, -15.8], ['AR', -58.4, -34.6]];
  const rad = Math.PI / 180;
  const vec = (lon, lat) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)];
  let LAM = 60, PHI = 24, GR = 100, GX = 0, GY = 0, cl = 1, sl = 0, cp = 1, sp = 0;
  function setRot() { cl = Math.cos(-LAM * rad); sl = Math.sin(-LAM * rad); cp = Math.cos(PHI * rad); sp = Math.sin(PHI * rad); }
  function proj(v, lift = 1) {
    const x0 = v[0] * cl - v[1] * sl, y0 = v[0] * sl + v[1] * cl, z0 = v[2];
    const X = x0 * cp + z0 * sp, Z = -x0 * sp + z0 * cp;
    return [GX + y0 * GR * lift, GY - Z * GR * lift, X];
  }
  const DOTS = (() => { const a = window.SF_NOKTA || [], r = new Float32Array(a.length / 2 * 3); for (let i = 0, j = 0; i < a.length; i += 2, j += 3) { const v = vec(a[i], a[i + 1]); r[j] = v[0]; r[j + 1] = v[1]; r[j + 2] = v[2]; } return r; })();
  function drawGlobe(alpha, scale) {
    cx.save(); cx.globalAlpha = alpha;
    const R = GR * scale, keep = GR; GR = R; setRot();
    const halo = cx.createRadialGradient(GX, GY, R * .92, GX, GY, R * 1.4);
    halo.addColorStop(0, 'rgba(217,178,106,.22)'); halo.addColorStop(1, 'rgba(217,178,106,0)');
    cx.fillStyle = halo; cx.beginPath(); cx.arc(GX, GY, R * 1.4, 0, 7); cx.fill();
    const g = cx.createRadialGradient(GX - R * .35, GY - R * .45, R * .05, GX, GY, R);
    g.addColorStop(0, '#2d2621'); g.addColorStop(.65, '#14110f'); g.addColorStop(1, '#0a0807');
    cx.fillStyle = g; cx.beginPath(); cx.arc(GX, GY, R, 0, 7); cx.fill();
    const rim = cx.createRadialGradient(GX, GY, R * .8, GX, GY, R);
    rim.addColorStop(0, 'rgba(255,214,150,0)'); rim.addColorStop(1, 'rgba(255,214,150,.24)');
    cx.fillStyle = rim; cx.beginPath(); cx.arc(GX, GY, R, 0, 7); cx.fill();
    const ds = Math.max(1.15, R / 200), bk = [[], [], [], []];
    for (let j = 0; j < DOTS.length; j += 3) {
      const x0 = DOTS[j] * cl - DOTS[j + 1] * sl, y0 = DOTS[j] * sl + DOTS[j + 1] * cl, z0 = DOTS[j + 2];
      const X = x0 * cp + z0 * sp; if (X <= .03) continue;
      bk[Math.min(3, (X * 4) | 0)].push(GX + y0 * R, GY - (-x0 * sp + z0 * cp) * R);
    }
    const al = [.2, .4, .62, .88];
    bk.forEach((b, k) => { cx.fillStyle = `rgba(244,226,196,${al[k]})`; const s = ds * (.7 + k * .13); for (let i = 0; i < b.length; i += 2) cx.fillRect(b[i] - s / 2, b[i + 1] - s / 2, s, s); });
    GR = keep;
    cx.restore();
  }
  function slerp(a, b, t) {
    const d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d), so = Math.sin(om) || 1;
    const k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }
  let regionNames = null, regionLang = '';
  const cname = c => { const l = document.documentElement.lang || 'tr'; if (regionLang !== l) { try { regionNames = new Intl.DisplayNames([l], { type: 'region' }); } catch { regionNames = null; } regionLang = l; } return regionNames ? regionNames.of(c) : c; };
  const O = vec(...ORG);
  const ARC = DEST.map(d => { const v = vec(d[1], d[2]), dist = Math.acos(clamp(O[0] * v[0] + O[1] * v[1] + O[2] * v[2], -1, 1)), pts = []; for (let s = 0; s <= 48; s++) { const u = s / 48; pts.push([slerp(O, v, u), 1 + (.06 + dist * .16) * Math.sin(Math.PI * u)]); } return { d, v, pts }; });
  function drawArcs(tg, alpha, now) {
    setRot();
    cx.save(); cx.globalAlpha = alpha;
    const fs = Math.max(10, Math.min(12.5, W / 100)), boxes = [];
    const free = (x, y, w, h) => { if (boxes.some(b => x < b[2] && x + w > b[0] && y < b[3] && y + h > b[1])) return false; boxes.push([x - 3, y - 3, x + w + 3, y + h + 3]); return true; };
    const po = proj(O);
    if (po[2] > 0) boxes.push([po[0] - 44, po[1] + 4, po[0] + 44, po[1] + 28]);
    ARC.forEach(a => {
      const k = clamp((tg - a.d.t0) / 1.0);
      if (k <= 0) return;
      const n = Math.floor(48 * out(k));
      let prev = null;
      for (let s = 0; s <= n; s++) {
        const [w, lift] = a.pts[s], p = proj(w, lift), vis = proj(w)[2] > -.08;
        if (prev && vis && prev[2]) {
          const u = s / 48;
          cx.strokeStyle = `rgba(${Math.round(lerp(224, 242, u))},${Math.round(lerp(49, 196, u))},${Math.round(lerp(58, 107, u))},${k < 1 ? .95 : .5})`;
          cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(prev[0], prev[1]); cx.lineTo(p[0], p[1]); cx.stroke();
        }
        prev = [p[0], p[1], vis];
      }
      // ilerleyen ışık başı; varıştan sonra yay boyunca akan ışık
      const flow = k < 1 ? out(k) : ((now / 1000 * .32 + a.d.t0 * .17) % 1);
      const [fw, fl] = a.pts[Math.min(48, Math.round(flow * 48))], fp = proj(fw, fl);
      if (proj(fw)[2] > -.08) { cx.save(); cx.shadowColor = 'rgba(255,214,150,.95)'; cx.shadowBlur = 10; cx.fillStyle = '#FFE2B0'; cx.beginPath(); cx.arc(fp[0], fp[1], k < 1 ? 2.6 : 1.7, 0, 7); cx.fill(); cx.restore(); }
      const pd = proj(a.v);
      if (k >= 1 && pd[2] > 0) {
        const age = tg - a.d.t0 - 1, ring = (age % 2.2) / 2.2;
        cx.strokeStyle = `rgba(242,196,107,${(1 - ring) * .8})`; cx.lineWidth = 1; cx.beginPath(); cx.arc(pd[0], pd[1], 2.5 + ring * 11, 0, 7); cx.stroke();
        cx.save(); cx.shadowColor = 'rgba(242,196,107,.9)'; cx.shadowBlur = 8; cx.fillStyle = '#F2C46B'; cx.beginPath(); cx.arc(pd[0], pd[1], 2.4, 0, 7); cx.fill(); cx.restore();
        const la = clamp(age / .4) * clamp(pd[2] * 3);
        cx.font = `600 ${fs}px Manrope, sans-serif`;
        const name = cname(a.d[0]), bw = cx.measureText(name).width + 14, bh = fs + 9, bx = pd[0] + 7, by = pd[1] - bh / 2;
        if (la > 0 && free(bx, by, bw, bh)) {
          cx.globalAlpha = alpha * la;
          cx.fillStyle = 'rgba(16,13,12,.74)'; rrect(bx, by, bw, bh, bh / 2); cx.fill();
          cx.strokeStyle = 'rgba(255,255,255,.14)'; cx.lineWidth = 1; rrect(bx, by, bw, bh, bh / 2); cx.stroke();
          cx.fillStyle = '#F4EFE7'; cx.textBaseline = 'middle'; cx.fillText(name, bx + 7, by + bh / 2 + .5);
          cx.globalAlpha = alpha;
        }
      }
    });
    if (po[2] > 0) {
      const pulse = (now / 1000 * .9) % 1;
      cx.strokeStyle = `rgba(224,49,58,${1 - pulse})`; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(po[0], po[1], 5 + pulse * 18, 0, 7); cx.stroke();
      cx.save(); cx.shadowColor = 'rgba(224,49,58,1)'; cx.shadowBlur = 14; cx.fillStyle = '#E0313A'; cx.beginPath(); cx.arc(po[0], po[1], 4.5, 0, 7); cx.fill(); cx.restore();
      cx.font = `700 ${fs}px Manrope, sans-serif`; cx.textBaseline = 'middle'; cx.textAlign = 'center';
      cx.lineWidth = 3; cx.strokeStyle = 'rgba(10,8,7,.85)'; cx.strokeText('Çaycuma', po[0], po[1] + 17); cx.fillStyle = '#fff'; cx.fillText('Çaycuma', po[0], po[1] + 17);
      cx.textAlign = 'start';
    }
    cx.restore();
  }

  /* ---------- HTML katmanları ---------- */
  const yearEl = $('#stYear'), capEl = $('#stCap'), cntEl = $('#stCnt'), cntN = $('#stCntN');
  let capKey = '';
  function setCap(k) { if (k === capKey) return; capKey = k; capEl.classList.remove('in'); void capEl.offsetWidth; capEl.textContent = k ? T(k) : ''; if (k) capEl.classList.add('in'); }

  /* ---------- kare ---------- */
  const FOCUS = [.40, .47];   // maket görselinde ana binanın merkezi (kamera buraya yaklaşır)
  function frame(t, now) {
    cx.clearRect(0, 0, W, H);
    const mob = W < 640, push = seg(t, ...TL.push), zoom = seg(t, ...TL.zoom);
    // 1) maket
    if (t < TL.push[1] + .1) {
      drawStage(t);
      cx.save(); cx.globalAlpha = 1 - seg(push, .85, 1);
      cover(work, WW, WH, 0, 0, W, H, lerp(1, 2.6, ease(push)) * (mob ? 1.5 : 1), FOCUS[0], FOCUS[1] - (mob ? .02 : 0));
      cx.restore();
    }
    // 2) gerçek fotoğraf: maketten fotoğrafa geçiş, ardından m²
    if (push > .35 && zoom < 1 && IMG.f1) {
      const pa = seg(push, .35, 1), zz = ease(zoom), iris = ease(seg(push, .35, .95));
      cx.save();
      if (iris < 1) { cx.beginPath(); cx.arc(W / 2, H / 2, Math.hypot(W, H) * .55 * iris, 0, 7); cx.clip(); }
      cx.globalAlpha = (1 - zz);
      const map = cover(IMG.f1, IMG.f1.width, IMG.f1.height, 0, 0, W, H, lerp(1.22, 1, out(pa)) * lerp(1, .88, zz), .56, .46);
      if (iris > 0 && iris < 1) { cx.save(); cx.globalAlpha = 1 - iris; cx.strokeStyle = 'rgba(255,226,176,.9)'; cx.lineWidth = 2; cx.shadowColor = 'rgba(255,214,150,1)'; cx.shadowBlur = 18; cx.beginPath(); cx.arc(W / 2, H / 2, Math.hypot(W, H) * .55 * iris, 0, 7); cx.stroke(); cx.restore(); }
      const g1 = cx.createLinearGradient(0, 0, 0, H); g1.addColorStop(0, 'rgba(10,8,7,.58)'); g1.addColorStop(.3, 'rgba(10,8,7,0)'); g1.addColorStop(.72, 'rgba(10,8,7,0)'); g1.addColorStop(1, 'rgba(10,8,7,.5)');
      cx.fillStyle = g1; cx.fillRect(0, 0, W, H);
      if (IMG.f2) {
        const ci = out(seg(t, TL.push[1] - .1, TL.push[1] + .7));
        const cw = mob ? W * .5 : W * .29, ch = cw * 9 / 16, cxx = W - cw - (mob ? 12 : 26), cyy = H - ch - (mob ? 74 : 26) + (1 - ci) * 26;
        cx.globalAlpha = pa * (1 - zz) * ci;
        cx.save(); cx.shadowColor = 'rgba(0,0,0,.55)'; cx.shadowBlur = 26; cx.fillStyle = '#000'; rrect(cxx, cyy, cw, ch, 14); cx.fill(); cx.restore();
        cx.save(); rrect(cxx, cyy, cw, ch, 14); cx.clip(); cover(IMG.f2, IMG.f2.width, IMG.f2.height, cxx, cyy, cw, ch); cx.restore();
        cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1.5; rrect(cxx, cyy, cw, ch, 14); cx.stroke();
        const lb = T('hk.f2'), fs = Math.max(11, W / 95); cx.font = `600 ${fs}px Manrope, sans-serif`;
        const lw = cx.measureText(lb).width + 20; cx.fillStyle = 'rgba(14,12,11,.72)'; rrect(cxx + 10, cyy + 10, lw, fs + 12, (fs + 12) / 2); cx.fill();
        cx.fillStyle = '#F4EFE7'; cx.textBaseline = 'middle'; cx.fillText(lb, cxx + 20, cyy + 16 + fs / 2);
      }
      const m = seg(t, ...TL.m2);
      if (m > 0) {
        const [bx, by] = map(.59, .47), [yx, yy] = map(.40, .74), fa = 1 - seg(zoom, 0, .4);
        pin(bx, by, T('hk.m1'), fmtN(Math.round(21350 * out(seg(m, 0, .45)))) + ' m²', out(seg(m, 0, .25)) * fa, 1, now);
        pin(yx, yy, T('hk.m2'), fmtN(Math.round(42500 * out(seg(m, .25, .7)))) + ' m²', out(seg(m, .25, .45)) * fa, -1, now);
      }
      cx.restore();
    }
    // 3) dünya
    if (t >= TL.zoom[0] + .2) {
      const gIn = out(seg(t, TL.zoom[0] + .2, TL.globe[0] + .5));
      GR = Math.min(W * (mob ? .44 : .36), H * (mob ? .40 : .43)); GX = W * (mob ? .5 : .56); GY = H * .54;
      const tg = t - TL.globe[0], gd = TL.globe[1] - TL.globe[0];
      LAM = lerp(100, -60, ease(clamp(tg / gd)));
      if (t > TL.globe[1]) LAM = lerp(-60, 22, ease(clamp((t - TL.globe[1]) / 2.6))) + (t > TL.globe[1] + 2.6 ? Math.sin((t - TL.globe[1] - 2.6) * .22) * 9 : 0);
      drawGlobe(gIn, lerp(.55, 1, gIn));
      if (tg > 0) drawArcs(tg, gIn, now);
    }
    // döngü geçişi: sonda karar, başta açıl
    const fade = Math.max(seg(t, END - .9, END), 1 - seg(t, 0, .6));
    if (fade > 0) { cx.save(); cx.globalAlpha = fade; cx.fillStyle = root.style.background || '#0f0d0c'; cx.fillRect(0, 0, W, H); cx.restore(); }
    root.classList.toggle('st-fade', t > END - .9);
    // HTML katmanları
    yearEl.textContent = t < Y1[0] ? 1974 : t < Y1[1] ? Math.round(lerp(1974, 2010, ease(seg(t, ...Y1)))) : t < Y2[1] ? Math.round(lerp(2010, 2026, ease(seg(t, ...Y2)))) : 2026;
    root.classList.toggle('st-y-off', t > TL.zoom[0]);
    // yazı, sayaç o yıla gelince çıkar: 1974 → (sayım) → 2010 → (sayım) → bugün
    setCap(t < .3 ? '' : t < Y1[0] ? 'hk.c1' : t < Y1[1] - .9 ? '' : t < Y2[0] + .2 ? 'hk.c2' : t < Y2[1] - .5 ? '' : t < TL.zoom[0] ? 'hk.c3' : 'hk.c4');
    cntEl.classList.toggle('in', t > TL.globe[0]);
    cntN.textContent = fmtN(t < TL.globe[0] ? 0 : Math.round(90 * ease(seg(t, TL.globe[0] + .5, TL.globe[1]))));
    $('#stTotN').textContent = fmtN(Math.round(62500 * out(seg(t, TL.m2[0] + 1.1, TL.m2[1]))));
    root.classList.toggle('st-tot-on', t > TL.m2[0] + 1.1 && t < TL.zoom[0] + .3);
  }

  /* ---------- oynatma ---------- */
  let t0 = 0, raf = 0, visible = false, ready = false;
  [...DEST].sort((a, b) => b[1] - a[1]).forEach((d, i, arr) => d.t0 = .4 + i * (5.6 / arr.length));   // dünya doğudan batıya dönerken sırayla
  const DBG = +new URLSearchParams(location.search).get('hk') || 0;   // geliştirme: ?hk=saniye
  function loop(now) {
    const t = (now - t0) / 1000;
    frame(t, now);
    if (t > END) t0 = now;                                                // sürekli döngü: bitince baştan
    raf = visible ? requestAnimationFrame(loop) : 0;                    // bitişte küre görünürken yavaşça salınır
  }
  function play(skip = 0) { t0 = performance.now() - skip * 1000; if (!raf) raf = requestAnimationFrame(loop); }
  const FREEZE = new URLSearchParams(location.search).get('hkp');   // geliştirme: ?hkp=saniye o karede durdurur
  function start() {
    if (FREEZE !== null) { t0 = -1; setTimeout(() => frame(+FREEZE, performance.now()), 50); return; }
    if (reduce) { t0 = performance.now() - (END + 1) * 1000; frame(END + 1, performance.now()); return; }
    play(DBG);
  }
  const io = new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (t0 === -1) return;   // durdurulmuş test karesi
    if (visible && ready && !t0) start(); else if (visible && !raf && t0) raf = requestAnimationFrame(loop);
  }, { threshold: .3 });
  addEventListener('resize', () => { size(); lastKey = ''; if (t0 === -1) return frame(+FREEZE, performance.now()); if (!raf && t0) frame((performance.now() - t0) / 1000, performance.now()); });
  document.addEventListener('sf-locale', () => { capKey = ''; if (t0 === -1) return frame(+FREEZE, performance.now()); if (!raf && t0) frame((performance.now() - t0) / 1000, performance.now()); });
  size();
  const P = 'assets/hikaye/';
  Promise.all([...['s1', 's1b', 's2', 's2b', 's3', 's3b', 's4'].map(k => [k, k + '.webp']), ...['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].map(k => [k, k + '.png']), ['f1', 'f1.webp'], ['f2', 'f2.webp']]
    .map(([k, f]) => load(k, P + f)).concat(document.fonts ? [document.fonts.ready] : []))
    .then(() => { prep(); ready = true; size(); if (visible || root.getBoundingClientRect().top < innerHeight) { visible = true; start(); } });
  io.observe(root);
})();
