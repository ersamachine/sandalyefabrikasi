/* SF Sandalye — sipariş yapılandırıcısı: model, gövde rengi, minder kumaşı, adet */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const html = document.documentElement;
  const WA = '905456386070';
  window.SF_LANG = window.SF_LANG || {};

  const LANGS = { tr: ['Türkçe', 'tr-TR'], en: ['English', 'en-GB'], ar: ['العربية', 'ar-u-nu-latn', 'rtl'], ru: ['Русский', 'ru-RU'], de: ['Deutsch', 'de-DE'], fr: ['Français', 'fr-FR'], es: ['Español', 'es-ES'] };
  const CLANG = { TR: 'tr en', AZ: 'tr ru en', DE: 'de en tr', NL: 'en de', BE: 'fr en', FR: 'fr en', GB: 'en', ES: 'es en', IT: 'en', GR: 'en', SA: 'ar en', AE: 'en ar', QA: 'ar en', KW: 'ar en', IQ: 'ar en tr', JO: 'ar en', LB: 'ar fr en', EG: 'ar en', LY: 'ar en', DZ: 'fr ar', MA: 'fr ar', TN: 'fr ar', RU: 'ru en', KZ: 'ru en', UZ: 'ru en', GE: 'en ru', US: 'en es', MX: 'es en', INTL: 'en tr' };
  let lang = 'tr', country = 'TR', dict = {};
  const TR0 = {}; $$('[data-t]').forEach(el => TR0[el.dataset.t] = el.innerHTML);
  const t = (k, v) => { let s = dict[k] ?? (window.SF_LANG.tr || {})[k] ?? TR0[k] ?? k; if (v) s = s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? ''); return s; };
  const loc = () => LANGS[lang][1];
  const fmt = n => new Intl.NumberFormat(loc(), { maximumFractionDigits: 2 }).format(n);
  const pct = p => new Intl.NumberFormat(loc(), { style: 'percent', maximumFractionDigits: 0 }).format(p);
  const cName = c => { if (c === 'INTL') return t('loc.intl'); try { return new Intl.DisplayNames([loc().split('-u-')[0]], { type: 'region' }).of(c); } catch { return c; } };

  /* ---------- veri ---------- */
  const K = window.SF_KONFIG, P = Object.fromEntries((window.SF_URUNLER || []).map(p => [p.id, p]));
  // lüks grup: Nirvana kumaş, hep minderli · düğün grupları: Gökkuşağı kumaş, minderli/mindersiz
  const MODELS = [
    ...K.modeller.map(m => ({ ...m, col: 'plastik-luks', fab: 'nirvana' })),
    ...(window.SF_KONFIG_DUGUN || []).map(m => ({ ...m, col: (P[m.urun] || {}).col || m.grup, fab: 'gokkusagi' }))
  ];
  const COLS = ['plastik-luks', 'plastik-dugun', 'pc-seffaf-dugun', 'ahsap'].filter(c => MODELS.some(m => m.col === c));
  const FN = { nirvana: 'Nirvana', gokkusagi: 'Gökkuşağı' };
  const K0 = { nirvana: '107', gokkusagi: '05' };
  const fabs = () => K.kumas[st.m.fab];
  const qs = new URLSearchParams(location.search);
  const st = {
    m: MODELS.find(x => x.id === qs.get('m') || x.urun === qs.get('m')) || MODELS[0],
    g: qs.get('g') || null,
    k: null,
    n: qs.get('mn') !== '0',
    q: Math.max(1, +qs.get('q') || 200),
    view: 'studio'
  };
  const lastK = {}; // koleksiyon değişince her kumaş ailesinde son seçilen renk geri gelir
  const fixK = kod => { const F = fabs(); st.k = F.find(f => f.kod === kod) || F.find(f => f.kod === lastK[st.m.fab]) || F.find(f => f.kod === K0[st.m.fab]) || F[0]; };
  fixK(qs.get('k'));
  if (!st.m.renkler.includes(st.g)) st.g = st.m.renkler.includes('altin') ? 'altin' : st.m.renkler[0];
  const cush = () => st.m.fab === 'nirvana' || st.n;
  const kName = () => cush() ? `${FN[st.m.fab]} ${st.k.kod}` : t('sp.noCush');
  const prod = () => P[st.m.urun] || {};
  const mName = m => (P[m.urun] || {}).name || m.id;
  const setModel = m => { const kod = st.k.kod; st.m = m; if (!m.renkler.includes(st.g)) st.g = m.renkler[0]; fixK(kod); };

  /* ---------- görüntü: fotoğraf + minder maskesi → tuval ---------- */
  const cache = {};
  const loadImg = src => cache[src] || (cache[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  let front = $('#cvA'), back = $('#cvB'), job = 0;
  back.classList.add('off');
  async function render() {
    const my = ++job, base = `assets/konfig/${st.m.id}-${st.g}`, bare = !cush();
    // mindersiz: ayrı üretilmiş çıplak gövde görseli, boyama yok
    const [im, mk] = await Promise.all(bare ? [loadImg(base + '-s.webp'), null] : [loadImg(base + '.webp'), loadImg(base + '-m.png')]);
    if (my !== job) return;
    const w = im.naturalWidth, h = im.naturalHeight;
    const cv = back; cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0);
    if (!bare) paint(cx, mk, w, h);
    // sahne zemini = görselin kenar tonu (masaüstünde görsel sığdırılır, boşluk aynı tonla dolar)
    const e = cx.getImageData(2, 2, 1, 1).data;
    $('.stage2').style.backgroundColor = `rgb(${e[0]},${e[1]},${e[2]})`;
    cv.classList.remove('off'); front.classList.add('off');
    [front, back] = [cv, front];
  }
  function paint(cx, mk, w, h) {
    const px = cx.getImageData(0, 0, w, h);
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tx = tmp.getContext('2d', { willReadFrequently: true }); tx.drawImage(mk, 0, 0);
    const mp = tx.getImageData(0, 0, w, h).data, d = px.data;
    const [R, G, B] = hex(st.k.hex);
    const lum = 0.299 * R + 0.587 * G + 0.114 * B;
    // açık kumaşlarda doku kontrastını yumuşat; parlak noktalar beyaza değil kumaşın açık tonuna gider
    const kc = lum > 150 ? 0.55 : lum > 90 ? 0.8 : 1;
    const HR = R + (255 - R) * 0.5, HG = G + (255 - G) * 0.5, HB = B + (255 - B) * 0.5;
    // düğün maskeleri (tools/minder_doku.py): G = biçim gölgesi, B = doku (std 0.25) → kumaşın kendi doku oranına ölçeklenir
    const split = mp[2] > 100, kt = Math.min(2, (st.k.d ?? 0.25) / 0.25);
    for (let i = 0; i < d.length; i += 4) {
      const m = mp[i] / 255; if (m < 0.004) continue;
      const s = split ? mp[i + 1] / 128 + (mp[i + 2] / 128 - 1) * kt : 1 + (mp[i + 1] / 128 - 1) * kc;
      let r, g, b;
      if (s <= 1) { r = R * s; g = G * s; b = B * s; }
      else { const k = Math.min(1, (s - 1) * 1.5); r = R + (HR - R) * k; g = G + (HG - G) * k; b = B + (HB - B) * k; }
      d[i] = d[i] * (1 - m) + r * m; d[i + 1] = d[i + 1] * (1 - m) + g * m; d[i + 2] = d[i + 2] * (1 - m) + b * m;
    }
    cx.putImageData(px, 0, 0);
  }

  /* ---------- seçenekler ---------- */
  function renderOptions() {
    $('#colls').innerHTML = COLS.map(c => `<button type="button" role="radio" aria-checked="${c === st.m.col}" data-c="${c}">${t('c.' + c)}</button>`).join('');
    $('#models').innerHTML = MODELS.filter(m => m.col === st.m.col).map(m => `<button type="button" role="radio" aria-checked="${m === st.m}" data-m="${m.id}"><img src="assets/konfig/${m.id}-kucuk.webp" alt="" loading="lazy"><span>${mName(m)}</span></button>`).join('');
    $('#bodies').innerHTML = st.m.renkler.map(g => `<button type="button" class="sw ${g}" role="radio" aria-checked="${g === st.g}" data-g="${g}" aria-label="${t('renk.' + g)}" title="${t('renk.' + g)}"></button>`).join('');
    const fn = FN[st.m.fab];
    $('#fabrics').innerHTML = fabs().map(f => `<button type="button" class="fab" role="radio" aria-checked="${f === st.k}" data-k="${f.kod}" style="background-image:url(assets/konfig/kumas-${st.m.fab}-${f.kod}.webp)" aria-label="${fn} ${f.kod}" title="${fn} ${f.kod}"></button>`).join('');
    $('#optMin').hidden = st.m.fab === 'nirvana';
    $$('#mins [data-n]').forEach(b => b.setAttribute('aria-checked', (b.dataset.n === '1') === st.n));
    $('#optCush').hidden = !cush();
    $('#stNote').hidden = !cush();
    $('#cushSub').textContent = t(st.m.fab === 'nirvana' ? 'sp.cushSub' : 'sp.cushSubG');
  }
  function renderInfo() {
    const p = prod(), n = mName(st.m);
    $('#stCol').textContent = t('c.' + st.m.col);
    $('#stName').textContent = $('#pnName').textContent = $('#barName').textContent = n;
    $('#pnSpec').textContent = p.dim ? `${t('u.hA')} ${fmt(p.dim[0])} · ${t('u.dA')} ${fmt(p.dim[1])} · ${t('u.wA')} ${fmt(p.dim[2])} cm${p.kg ? ' · ' + fmt(p.kg) + ' kg' : ''}` : '';
    $('#bodyName').textContent = t('renk.' + st.g);
    $('#cushName').textContent = kName();
    $('#barSub').textContent = `${t('renk.' + st.g)} · ${kName()} · ${fmt(st.q)} ${t('u.pcs')}`;
    $('#qty').value = st.q;
    // konteyner doluluğu (katalog kapasitesi, minderli)
    const L = p.load || {};
    $('#fill').innerHTML = ['dc20', 'hc40', 'tir'].filter(v => L[v]).map(v => {
      const f = st.q / L[v], n = Math.ceil(f - 1e-9), last = f - (n - 1);
      return `<div class="fl"><div class="fl-h"><span>${t('u.' + v)}</span><b>× ${fmt(n)}</b></div><div class="fl-bar"><i class="${n > 1 ? 'over' : ''}" style="width:${n > 1 ? 100 : Math.min(1, f) * 100}%"></i></div><p>${n === 1 ? t('ship.one', { p: pct(f) }) : t('ship.many', { n: fmt(n), p: pct(last) })}</p></div>`;
    }).join('');
    const cl = cush() ? t('sp.cush') : t('sp.minder');
    const rows = [[t('sp.model'), n], [t('sp.body'), t('renk.' + st.g)], [cl, kName()], [t('sp.qty'), `${fmt(st.q)} ${t('u.pcs')}`], [t('msg.country'), cName(country)]];
    $('#sum').innerHTML = rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    $('#order').href = `https://wa.me/${WA}?text=${encodeURIComponent([t('msg.hello'), '', `• ${n} (${t('c.' + st.m.col)}) — ${fmt(st.q)} ${t('u.pcs')}`, `  ${t('sp.body')}: ${t('renk.' + st.g)}`, `  ${cl}: ${kName()}`, '', `${t('msg.country')}: ${cName(country)}`].join('\n'))}`;
    // mekân fotoğrafı
    const sc = p.scene ? `assets/s/${st.m.urun}.webp` : null;
    $('[data-v="scene"]').disabled = !sc;
    if (!sc && st.view === 'scene') setView('studio');
    if (sc) $('#stScene').src = sc;
    const u = new URL(location.href);
    u.searchParams.set('m', st.m.id); u.searchParams.set('g', st.g); u.searchParams.set('k', st.k.kod); u.searchParams.set('q', st.q);
    if (cush()) u.searchParams.delete('mn'); else u.searchParams.set('mn', '0');
    history.replaceState(null, '', u.pathname + u.search);
    $('#addList').textContent = t('sp.add'); $('#addList').classList.remove('added');
  }
  function update(full) { lastK[st.m.fab] = st.k.kod; if (full) renderOptions(); renderInfo(); render(); }

  $('#colls').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b || b.dataset.c === st.m.col) return;
    setModel(MODELS.find(m => m.col === b.dataset.c)); update(true);
  });
  $('#models').addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    setModel(MODELS.find(x => x.id === b.dataset.m)); update(true);
  });
  $('#bodies').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; st.g = b.dataset.g; update(true); });
  $('#mins').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; st.n = b.dataset.n === '1'; update(true); });
  $('#fabrics').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; st.k = fabs().find(f => f.kod === b.dataset.k); update(true); });
  const setQ = q => { st.q = Math.max(1, Math.round(q) || 1); renderInfo(); };
  $$('.qty.big button').forEach(b => b.addEventListener('click', () => setQ(st.q + (+b.dataset.d) * 10)));
  $('#qty').addEventListener('change', e => setQ(+e.target.value));
  $('#presets').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) setQ(+b.dataset.q); });
  function setView(v) {
    st.view = v;
    $$('.st-tabs [data-v]').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v));
    $('#stScene').hidden = v !== 'scene'; $('#stChair').hidden = v === 'scene';
    $('.stage2').classList.toggle('scene', v === 'scene');
  }
  $('.st-tabs').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b && !b.disabled) setView(b.dataset.v); });

  // teklif listesine ekle (ana sitenin listesiyle ortak)
  const readQ = () => { try { return JSON.parse(store.get('sf-teklif') || '[]'); } catch { return []; } };
  const syncCount = () => { $('#qCount').textContent = fmt(readQ().length); };
  $('#addList').addEventListener('click', () => {
    // lüks: {g,k} · düğün minderli: {g,f,k} · düğün mindersiz: {g,n:1}
    const x = cush() ? { g: st.g, k: st.k.kod, ...(st.m.fab === 'nirvana' ? {} : { f: st.m.fab }) } : { g: st.g, n: 1 };
    const list = readQ(), it = list.find(y => y.id === st.m.urun && y.g === x.g && y.k === x.k && y.f === x.f && y.n === x.n);
    if (it) it.q += st.q; else list.push({ id: st.m.urun, q: st.q, ...x });
    store.set('sf-teklif', JSON.stringify(list)); syncCount(); olc('liste');
    const b = $('#addList'); b.textContent = t('sp.added'); b.classList.add('added');
  });

  /* ---------- dil ---------- */
  function loadLang(code) {
    if (window.SF_LANG[code]) return Promise.resolve(window.SF_LANG[code]);
    return new Promise(res => { const s = document.createElement('script'); s.src = `lang/${code}.js`; s.onload = () => res(window.SF_LANG[code] || null); s.onerror = () => res(null); document.head.appendChild(s); });
  }
  let arabFont = false;
  async function setLocale(c, l, save) {
    if (!CLANG[c]) c = 'INTL';
    if (!LANGS[l]) l = CLANG[c].split(' ')[0];
    await loadLang('tr');
    const pack = await loadLang(l);
    if (!pack) return;
    lang = l; country = c; dict = pack;
    html.lang = l; html.dir = LANGS[l][2] || 'ltr';
    if (l === 'ar') { html.dataset.script = 'arab'; if (!arabFont) { const k = document.createElement('link'); k.rel = 'stylesheet'; k.href = 'fonts/arab.css'; document.head.appendChild(k); arabFont = true; } } else delete html.dataset.script;
    $$('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t); });
    $$('[data-t-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tAria)));
    document.title = t('sp.title');
    $('#locCode').textContent = c === 'INTL' ? 'INT' : c; $('#locLang').textContent = LANGS[l][0];
    if (save) { store.set('sf-c', c); store.set('sf-l', l); const u = new URL(location.href); u.searchParams.set('c', c.toLowerCase()); u.searchParams.set('l', l); history.replaceState(null, '', u.pathname + u.search); }
    syncCount(); update(true);
  }
  const REG = { TR: 'tr', AZ: 'tr', GE: 'tr', RU: 'tr', KZ: 'tr', UZ: 'tr', DE: 'eu', NL: 'eu', BE: 'eu', FR: 'eu', GB: 'eu', ES: 'eu', IT: 'eu', GR: 'eu', US: 'am', MX: 'am', INTL: 'intl' };
  const locD = $('#locD');
  const esc = v => String(v).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  function renderLocDlg() {
    const coll = new Intl.Collator(loc().split('-u-')[0]);
    $('#locList').innerHTML = ['tr', 'eu', 'me', 'am', 'intl'].map(r => {
      const items = Object.keys(CLANG).filter(c => (REG[c] || 'me') === r).map(c => ({ c, n: cName(c) }))
        .sort((a, b) => r === 'tr' && (a.c === 'TR' || b.c === 'TR') ? (a.c === 'TR' ? -1 : 1) : coll.compare(a.n, b.n));
      return `<section class="loc-reg"><h3>${t('loc.r.' + r)}</h3><div class="loc-grid">${items.map(({ c, n }) =>
        `<button type="button" class="loc-item" data-c="${c}"${c === country ? ' aria-current="true"' : ''}><span class="lc-code">${c === 'INTL' ? 'INT' : c}</span><span class="lc-txt"><b>${esc(n)}</b><small>${CLANG[c].split(' ').map(l => LANGS[l][0]).join(' · ')}</small></span></button>`).join('')}</div></section>`;
    }).join('');
    $('#locLangBtns').innerHTML = CLANG[country].split(' ').map(l => `<button type="button" data-l="${l}" aria-pressed="${l === lang}" lang="${l}">${LANGS[l][0]}</button>`).join('');
  }
  $('#locBtn').addEventListener('click', () => { renderLocDlg(); locD.showModal(); locD.scrollTop = 0; ($('.loc-item[aria-current]', locD) || $('.loc-item', locD)).focus({ preventScroll: true }); });
  $('#locX').addEventListener('click', () => locD.close());
  locD.addEventListener('click', e => {
    if (e.target === locD) return locD.close();
    const c = e.target.closest('[data-c]'), l = e.target.closest('[data-l]');
    if (c) setLocale(c.dataset.c, CLANG[c.dataset.c].split(' ')[0], true).then(() => locD.close());
    if (l) setLocale(country, l.dataset.l, true).then(renderLocDlg);
  });

  // anonim ölçüm: tasarım ekranı açıldı / listeye eklendi (panel → Trafik)
  const API = (window.SF_API || '').trim();
  const olc = (tur) => { if (!API) return; try { let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, keepalive: true, body: JSON.stringify({ islem: 'ziyaret', tur, ayrinti: String(st.m.urun).slice(0, 20), dil: lang, hedef: country, ref, utm: { s: qs.get('utm_source') || '', m: qs.get('utm_medium') || '', c: qs.get('utm_campaign') || '', k: qs.get('utm_content') || '' } }) }).catch(() => {}); } catch {} };
  const c0 = (qs.get('c') || store.get('sf-c') || ((navigator.language || '').toLowerCase().startsWith('tr') ? 'TR' : 'INTL')).toUpperCase();
  const l0 = qs.get('l') || store.get('sf-l') || (navigator.language || 'tr').slice(0, 2);
  setLocale(c0, l0, false).then(() => olc('tasarla'));
})();
