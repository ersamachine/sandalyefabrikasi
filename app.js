/* SF Sandalye Fabrikası — taslak site (çok ülkeli / çok dilli) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.SF_LANG = window.SF_LANG || {};
  const WA = '905456386070', MAIL = 'satis@sandalyefabrikasi.com';

  /* ---------- diller ve ülkeler ---------- */
  const LANGS = {
    tr: { name: 'Türkçe', locale: 'tr-TR' },
    en: { name: 'English', locale: 'en-GB' },
    ar: { name: 'العربية', locale: 'ar-u-nu-latn', dir: 'rtl', script: 'arab' },
    ru: { name: 'Русский', locale: 'ru-RU' },
    de: { name: 'Deutsch', locale: 'de-DE' },
    fr: { name: 'Français', locale: 'fr-FR' },
    es: { name: 'Español', locale: 'es-ES' }
  };
  // ilk dil = ülkenin varsayılanı
  const COUNTRIES = [
    ['TR', 'tr en'], ['AZ', 'tr ru en'], ['DE', 'de en tr'], ['NL', 'en de'], ['BE', 'fr en'], ['FR', 'fr en'], ['GB', 'en'],
    ['ES', 'es en'], ['IT', 'en'], ['GR', 'en'], ['SA', 'ar en'], ['AE', 'en ar'], ['QA', 'ar en'], ['KW', 'ar en'],
    ['IQ', 'ar en tr'], ['JO', 'ar en'], ['LB', 'ar fr en'], ['EG', 'ar en'], ['LY', 'ar en'], ['DZ', 'fr ar'],
    ['MA', 'fr ar'], ['TN', 'fr ar'], ['RU', 'ru en'], ['KZ', 'ru en'], ['UZ', 'ru en'], ['GE', 'en ru'],
    ['US', 'en es'], ['MX', 'es en'], ['INTL', 'en tr']
  ].map(([c, l]) => ({ c, langs: l.split(' ') }));
  const byCode = Object.fromEntries(COUNTRIES.map(x => [x.c, x]));
  // ülkeye özel metinler (yalnız Türkiye)
  const OVERRIDES = { TR: { tr: {
    'how.4p': 'Türkiye içinde TIR ile, yurt dışına konteyner ya da TIR ile gönderilir; yükleme kapasiteleri her ürünün sayfasında yazılıdır.'
  } } };

  let lang = 'tr', country = byCode.TR, dict = {};
  const TR0 = {};
  $$('[data-t]').forEach(el => TR0[el.dataset.t] = el.innerHTML);
  const t = (k, v) => {
    let s = dict[k] ?? (window.SF_LANG.tr || {})[k] ?? TR0[k] ?? k;
    if (v) s = s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
    return s;
  };
  const loc = () => LANGS[lang].locale;
  const nf = (n, o) => new Intl.NumberFormat(loc(), o).format(n);
  const fmt = n => nf(n, { maximumFractionDigits: 2 });
  const pct = p => nf(p, { style: 'percent', maximumFractionDigits: 0 });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let regionNames = null;
  const countryName = code => {
    if (code === 'INTL') return t('loc.intl');
    try { regionNames = regionNames || new Intl.DisplayNames([loc().split('-u-')[0]], { type: 'region' }); return regionNames.of(code); } catch { return code; }
  };

  /* ---------- veri ---------- */
  const P = window.SF_URUNLER || [];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const COLS = [
    { k: 'plastik-dugun', img: 's003' }, { k: 'pc-seffaf-dugun', img: 's041' }, { k: 'plastik-luks', img: 's049' },
    { k: 'pc-seffaf-luks', img: 's042' }, { k: 'ahsap', img: 's068' }, { k: 'ahsap-gasa', img: 's140' },
    { k: 'maya-thonet', img: 's107' }, { k: 'bar', img: 's099' }, { k: 'masa', img: 's151' }, { k: 'gelin', img: 's199' }
  ];
  const KONFIG = ['queen', 'utopya', 'rose', 'azer', 'riva', 'sua', 'hattat', 'elika', 'asel', 'style']; // siparis.html yapılandırıcısındaki modeller
  const DUGUN = new Set((window.SF_KONFIG_DUGUN || []).map(m => m.urun)); // düğün grupları: minderli/mindersiz, Gökkuşağı kumaş
  const cfgTxt = x => !x.g ? '' : x.n ? t('u.cfgN', { g: t('renk.' + x.g) }) : t('u.cfg', { g: t('renk.' + x.g), k: (x.f === 'gokkusagi' ? 'Gökkuşağı ' : 'Nirvana ') + x.k });
  const pname = p => t('pn.' + p.id) !== 'pn.' + p.id ? t('pn.' + p.id) : p.name;
  const cname = k => t('c.' + k);
  // Higgsfield stüdyo görselleri (sipariş ekranıyla aynı): plastik lüks 10 model + düğün grubu 37 model; c → gövde rengi sırası
  const AICOL = ['altin', 'beyaz', 'sedef', 'gumus', 'siyah'];
  const AIR = Object.fromEntries([...KONFIG.map(k => [k + '-plastik-luks', AICOL]), ...(window.SF_KONFIG_DUGUN || []).map(m => [m.urun, m.renkler])]);
  const isAI = p => !!AIR[p.id];
  const img = (p, c) => isAI(p) ? `assets/p/ai/${p.col === 'plastik-luks' ? p.id.replace('-plastik-luks', '') : p.id}-${AIR[p.id][c || 0]}.webp` : `assets/p/${p.id}${c ? '-c' + c : ''}.webp`;
  const dimTxt = p => {
    if (p.dim) return [p.dim[0] && `${t('u.hA')} ${fmt(p.dim[0])}`, p.dim[1] && `${t('u.dA')} ${fmt(p.dim[1])}`, p.dim[2] && `${t('u.wA')} ${fmt(p.dim[2])}`].filter(Boolean).join(' · ') + ' cm';
    if (p.sizes) return p.sizes.length > 1 ? t('u.nSizes', { n: p.sizes.length }) : sizeTxt(p.sizes[0][0]);
    if (p.heights) return t('u.nHeights', { n: p.heights.split('-').length });
    if (p.parts) return t('u.nParts', { n: p.parts.length });
    return '';
  };
  // katalog renkleri: rk = [[renk, görsel no | null, numune | null], ...] (tools/renkler.py)
  const nCol = p => isAI(p) ? AIR[p.id].length : p.rk ? p.rk.length : 0;
  const RHEX = window.SF_RENK || {};
  const chipCss = ([k, , c]) => c ? `background-image:url(assets/renk/${c}.webp)` : `background:${RHEX[k] || '#ccc'}`;
  const sizeTxt = s => s.endsWith('Ø') ? `Ø ${s.slice(0, -1)} cm` : `${s.replace('×', ' × ')} cm`;

  /* ---------- teklif listesi ---------- */
  let quote = [];
  try { quote = JSON.parse(store.get('sf-teklif') || '[]').filter(x => byId[x.id] && x.q > 0); } catch { quote = []; }
  const saveQ = () => { store.set('sf-teklif', JSON.stringify(quote)); renderQuote(); };
  const sameR = (x, r) => (x.r || '') === (r || '');
  function addQ(id, q, r) {
    const it = quote.find(x => x.id === id && !x.g && sameR(x, r));
    if (it) it.q += q; else quote.push(r ? { id, q, r } : { id, q });
    saveQ(); olc('liste', id.slice(0, 20));
    const b = $('#qBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 350);
  }

  /* ---------- koleksiyonlar ---------- */
  function renderCols() {
    $('#cols').innerHTML = COLS.map(c => {
      const n = P.filter(p => p.col === c.k).length;
      return `<button class="colc" type="button" data-col="${c.k}"><img src="assets/a/${c.img}.webp" alt="" loading="lazy"><span class="cn">${esc(t('u.models', { n }))}</span><span class="ct"><h3>${cname(c.k)}</h3><p>${t('cd.' + c.k)}</p></span></button>`;
    }).join('');
  }
  $('#cols').addEventListener('click', e => {
    const b = e.target.closest('[data-col]'); if (!b) return;
    filt.col = b.dataset.col; $('#q').value = ''; filt.q = ''; limit = PAGE; renderChips(); renderGrid();
    $('#katalog').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- katalog ---------- */
  const filt = { col: 'all', q: '' };
  const PAGE = 20; let limit = PAGE;
  const norm = s => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  let shown = [];
  function renderChips() {
    const all = [{ k: 'all', n: P.length }, ...COLS.map(c => ({ k: c.k, n: P.filter(p => p.col === c.k).length }))];
    $('#chips').innerHTML = all.map(c => `<button class="chip" type="button" data-k="${c.k}" aria-pressed="${filt.col === c.k}">${c.k === 'all' ? t('cat.all') : cname(c.k)}<small>${fmt(c.n)}</small></button>`).join('');
  }
  $('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; filt.col = b.dataset.k; limit = PAGE; renderChips(); renderGrid(); });
  $('#q').addEventListener('input', e => { filt.q = e.target.value; limit = PAGE; renderGrid(); });
  function renderGrid() {
    const q = norm(filt.q.trim());
    shown = P.filter(p => (filt.col === 'all' || p.col === filt.col) && (!q || norm(pname(p) + ' ' + p.name + ' ' + cname(p.col)).includes(q)));
    const inQ = new Set(quote.filter(x => !x.g).map(x => x.id));
    $('#grid').innerHTML = shown.slice(0, limit).map(p => `<li class="card">
      <button class="open" type="button" data-id="${p.id}"><span class="ph${isAI(p) ? ' dark' : ''}"><img src="${img(p)}" alt="" loading="lazy" decoding="async"></span>
      <span class="nm">${esc(pname(p))}</span>
      <span class="meta"><span>${esc(cname(p.col))}</span>${nCol(p) > 1 ? `<span>${esc(t('u.nColors', { n: nCol(p) }))}</span>` : ''}</span>
      <span class="meta">${esc(dimTxt(p))}</span></button>
      <button class="add${inQ.has(p.id) ? ' on' : ''}" type="button" data-add="${p.id}" aria-label="${esc(t('u.addA', { p: pname(p) }))}">${inQ.has(p.id) ? '✓' : '+'}</button></li>`).join('');
    $('#found').textContent = t('u.found', { n: fmt(shown.length) });
    $('#empty').hidden = shown.length > 0;
    const rest = shown.length - limit;
    $('#moreW').hidden = rest <= 0;
    $('#more').textContent = t('cat.more', { n: fmt(Math.min(rest, PAGE)), m: fmt(rest) });
  }
  $('#more').addEventListener('click', () => { const first = limit; limit += PAGE; renderGrid(); $$('#grid .open')[first]?.focus({ preventScroll: true }); });
  $('#grid').addEventListener('click', e => {
    const a = e.target.closest('[data-add]');
    if (a) { const p = byId[a.dataset.add]; addQ(p.id, defQty(p)); return; }
    const o = e.target.closest('.open'); if (o) openP(o.dataset.id);
  });
  const defQty = p => p.col === 'masa' || p.col === 'gelin' ? 10 : 100;

  /* ---------- ürün penceresi ---------- */
  const pd = $('#pd');
  let cur = null, selR = '';
  function openP(id) {
    const p = byId[id]; if (!p) return;
    olc('urun', id.slice(0, 20));
    cur = p;
    $('#pdImg').src = img(p); $('#pdImg').alt = pname(p);
    $('#pdName').textContent = pname(p);
    $('#pdCol').textContent = cname(p.col);
    const sw = $('#pdSw');
    $('.pd-media').classList.toggle('dark', isAI(p));
    selR = '';
    if (isAI(p)) {
      selR = AIR[p.id][0];
      sw.innerHTML = AIR[p.id].map((g, i) => `<button type="button" data-c="${i}" data-r="${g}" aria-pressed="${i === 0}" aria-label="${esc(t('renk.' + g))}" title="${esc(t('renk.' + g))}"><img src="${img(p, i)}" alt="" loading="lazy"></button>`).join('') + `<p>${t('u.colors')} · <b>${esc(t('renk.' + selR))}</b></p>`;
    } else if (p.rk) {
      selR = p.rk[0][0];
      const foto = p.rk.some(r => r[1]);
      sw.innerHTML = p.rk.map((r, i) => {
        const lab = esc(t('renk.' + r[0])), on = i === 0;
        return r[1] != null && (r[1] || foto)
          ? `<button type="button" data-c="${r[1]}" data-r="${r[0]}" aria-pressed="${on}" aria-label="${lab}" title="${lab}"><img src="${img(p, r[1])}" alt="" loading="lazy"></button>`
          : `<button type="button" class="chip-r" data-r="${r[0]}" aria-pressed="${on}" aria-label="${lab}" title="${lab}"><i style="${chipCss(r)}"></i></button>`;
      }).join('') + `<p>${t('u.colors')} · <b>${esc(t('renk.' + selR))}</b></p>`;
    } else if (p.colors) {
      const list = [0, ...Array.from({ length: p.colors }, (_, i) => i + 1)];
      sw.innerHTML = list.map(c => `<button type="button" data-c="${c}" aria-pressed="${c === 0}" aria-label="${esc(c ? t(p.colors > 1 ? 'u.colorN' : 'u.view', { n: c }) : t('u.main'))}"><img src="${img(p, c)}" alt="" loading="lazy"></button>`).join('') + `<p>${t(p.colors > 1 ? 'u.colors' : 'u.views')}</p>`;
    } else sw.innerHTML = '';
    let h = '';
    if (p.dim || p.kg) {
      h += '<dl class="spec">';
      if (p.dim) {
        if (p.dim[0]) h += `<div><dt>${t('u.h')}</dt><dd><bdi dir="ltr">${fmt(p.dim[0])} cm</bdi></dd></div>`;
        if (p.dim[1]) h += `<div><dt>${t('u.d')}</dt><dd><bdi dir="ltr">${fmt(p.dim[1])} cm</bdi></dd></div>`;
        if (p.dim[2]) h += `<div><dt>${t('u.w')}</dt><dd><bdi dir="ltr">${fmt(p.dim[2])} cm</bdi></dd></div>`;
      }
      if (p.kg) h += `<div><dt>${t('u.kg')}</dt><dd><bdi dir="ltr">${fmt(p.kg)} kg</bdi></dd></div>`;
      h += '</dl>';
    }
    if (p.sizes) {
      h += `<p class="sp-h">${t('u.sizes')}</p><div class="sizes">` + p.sizes.map(([s, n]) => `<span><bdi dir="ltr">${esc(sizeTxt(s))}</bdi>${n ? `<small>${esc(t('u.seats', { n }))}</small>` : ''}</span>`).join('') + '</div>';
      if (p.h) h += `<p class="note">${t('u.hNote', { n: fmt(p.h) })}</p>`;
    } else if (p.h && !p.dim) h += `<p class="note">${t('u.hNote', { n: fmt(p.h) })}</p>`;
    if (p.parts) h += `<p class="sp-h">${t('u.parts')}</p><div class="sizes">` + p.parts.map(([k, s]) => `<span>${t(k)}<small><bdi dir="ltr">${esc(s.replace(/\d+/g, m => fmt(+m)))} cm</bdi></small></span>`).join('') + '</div>';
    if (p.noteK) h += `<p class="note">${t(p.noteK)}</p>`;
    if (p.heights) h += `<p class="sp-h">${t('u.heights')}</p><div class="sizes">` + p.heights.split('-').map(x => `<span><bdi dir="ltr">${fmt(+x)} cm</bdi></span>`).join('') + '</div>';
    if (p.load) {
      h += `<p class="sp-h">${t('u.load')}</p><div class="load">` + ['dc20', 'hc40', 'tir'].filter(v => p.load[v]).map(v => `<div><span>${t('u.' + v)}</span><b>${fmt(p.load[v])}</b> <small>${t('u.pcs')}</small></div>`).join('') + '</div>';
    }
    const notes = [];
    if (p.load && p.calc) notes.push(t(p.calc === 'noCushion' ? 'u.calcNo' : 'u.calcWith'));
    if (p.needCushion) notes.push(t('u.needC'));
    if (p.cushionColors) notes.push(t('u.cushC'));
    h += notes.map(n => `<p class="note">${n}</p>`).join('');
    $('#pdSpecs').innerHTML = h;
    $('#pdQty').value = defQty(p);
    syncAdd();
    $('#pdWa').href = waLink(t('msg.ask', { p: pname(p), c: cname(p.col) }));
    const cfg = KONFIG.includes(p.id.replace('-plastik-luks', '')) && p.col === 'plastik-luks';
    $('#pdDesign').hidden = !cfg && !DUGUN.has(p.id);
    $('#pdDesign').href = 'siparis.html?m=' + (cfg ? p.id.replace('-plastik-luks', '') : p.id);
    const sc = $('#pdScene');
    if (p.scene) { sc.hidden = false; $('img', sc).src = `assets/s/${p.id}.webp`; } else sc.hidden = true;
    if (!pd.open) pd.showModal();
    $('.pd-in', pd).scrollTop = 0;
  }
  function syncAdd() {
    const it = cur && quote.find(x => x.id === cur.id && !x.g && sameR(x, selR));
    $('#pdAdd').textContent = it ? t('u.inQ', { n: fmt(it.q) }) : t('u.addQ');
  }
  $('#pdSw').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#pdSw button').forEach(x => x.setAttribute('aria-pressed', x === b));
    if (b.dataset.c != null) $('#pdImg').src = img(cur, +b.dataset.c);
    if (b.dataset.r) { selR = b.dataset.r; const n = $('#pdSw p b'); if (n) n.textContent = t('renk.' + selR); syncAdd(); }
  });
  $('#pdX').addEventListener('click', () => pd.close());
  pd.addEventListener('click', e => { if (e.target === pd) pd.close(); });
  $$('.pd-act .qty button').forEach(b => b.addEventListener('click', () => { const i = $('#pdQty'); i.value = Math.max(1, (+i.value || 0) + (+b.dataset.d) * (cur && defQty(cur) === 10 ? 1 : 10)); }));
  $('#pdAdd').addEventListener('click', () => { const q = Math.max(1, Math.round(+$('#pdQty').value || 0)); addQ(cur.id, q, selR); syncAdd(); });
  const step = d => { const list = shown.length && shown.includes(cur) ? shown : P; const i = list.indexOf(cur); openP(list[(i + d + list.length) % list.length].id); };
  $('#pdPrev').addEventListener('click', () => step(html.dir === 'rtl' ? 1 : -1));
  $('#pdNext').addEventListener('click', () => step(html.dir === 'rtl' ? -1 : 1));
  pd.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight') $('#pdNext').click(); if (e.key === 'ArrowLeft') $('#pdPrev').click(); });

  /* ---------- sevkiyat hesabı ---------- */
  function calc() {
    const r = {};
    for (const v of ['dc20', 'hc40', 'tir']) {
      let f = 0, miss = 0;
      for (const x of quote) { const cap = byId[x.id].load?.[v]; if (cap) f += x.q / cap; else miss++; }
      r[v] = { f, n: f > 0 ? Math.ceil(f - 1e-9) : 0, miss };
    }
    return r;
  }
  function renderQuote() {
    const total = quote.reduce((s, x) => s + x.q, 0);
    $('#qCount').textContent = fmt(quote.length);
    $('#qempty').hidden = quote.length > 0;
    $('#qact').hidden = $('#vehicles').hidden = quote.length === 0;
    $('#qlist').innerHTML = quote.map((x, i) => { const p = byId[x.id]; return `<li class="qi" data-i="${i}">
      <span class="th"><img src="${img(p)}" alt=""></span>
      <span><span class="qn">${esc(pname(p))}</span><br><span class="qc">${esc(cname(p.col))}${x.g ? ' · ' + esc(cfgTxt(x)) : x.r ? ' · ' + esc(t('renk.' + x.r)) : ''}${p.load ? '' : ' · ' + esc(t('u.noLoad'))}</span></span>
      <span class="qty"><button type="button" data-d="-1" aria-label="−">−</button><input type="number" min="1" value="${x.q}" inputmode="numeric" aria-label="${esc(t('u.qtyOf', { p: pname(p) }))}"><button type="button" data-d="1" aria-label="+">+</button></span>
      <button class="rm" type="button" aria-label="${esc(t('u.rm', { p: pname(p) }))}">×</button></li>`; }).join('');
    if (quote.length) {
      const r = calc();
      for (const v of ['dc20', 'hc40', 'tir']) {
        const el = $(`.veh[data-v="${v}"]`), { f, n } = r[v];
        const last = n ? f - (n - 1) : 0;
        $('.veh-n', el).textContent = n ? `× ${fmt(n)}` : '—';
        const bar = $('.box i', el); bar.style.width = (n > 1 ? 100 : Math.min(1, f) * 100) + '%'; bar.classList.toggle('over', n > 1);
        $('.veh-p', el).textContent = !n ? t('ship.none') : n === 1 ? t('ship.one', { p: pct(f) }) : t('ship.many', { n: fmt(n), p: pct(last) });
      }
      const miss = quote.filter(x => !byId[x.id].load).length;
      $('#nodata').hidden = !miss; $('#nodata').textContent = t('ship.noData', { n: fmt(miss) });
      $('#qWa').href = waLink(quoteMsg());
      $('#qMail').href = `mailto:${MAIL}?subject=${encodeURIComponent(t('msg.subj'))}&body=${encodeURIComponent(quoteMsg())}`;
    }
    $('#fQuote').hidden = !quote.length;
    $('#fQuote').textContent = t('f.withQ', { n: fmt(quote.length), m: fmt(total) });
    $$('.add').forEach(b => { const on = quote.some(x => x.id === b.dataset.add && !x.g); b.classList.toggle('on', on); b.textContent = on ? '✓' : '+'; });
    if (pd.open) syncAdd();
  }
  $('#qlist').addEventListener('click', e => {
    const li = e.target.closest('.qi'); if (!li) return;
    const it = quote[+li.dataset.i];
    if (e.target.closest('.rm')) { quote = quote.filter(x => x !== it); saveQ(); return; }
    const b = e.target.closest('[data-d]');
    if (b) { const st = defQty(byId[it.id]) === 10 ? 1 : 10; it.q = Math.max(1, it.q + (+b.dataset.d) * st); saveQ(); }
  });
  $('#qlist').addEventListener('change', e => {
    const li = e.target.closest('.qi'); if (!li || e.target.tagName !== 'INPUT') return;
    const it = quote[+li.dataset.i]; it.q = Math.max(1, Math.round(+e.target.value || 1)); saveQ();
  });
  $('#qClear').addEventListener('click', () => { quote = []; saveQ(); });
  function quoteMsg(extra) {
    const r = calc();
    const lines = [t('msg.hello'), ''];
    if (extra) lines.push(...extra, '');
    quote.forEach(x => { const p = byId[x.id]; lines.push(`• ${pname(p)} (${cname(p.col)}) — ${fmt(x.q)} ${t('u.pcs')}`); if (x.g) lines.push(`  ${cfgTxt(x)}`); else if (x.r) lines.push(`  ${t('u.renk')}: ${t('renk.' + x.r)}`); });
    const veh = ['dc20', 'hc40', 'tir'].filter(v => r[v].n).map(v => `${t('u.' + v)} × ${fmt(r[v].n)}`);
    if (veh.length) lines.push('', `${t('msg.veh')}: ${veh.join(' / ')}`);
    lines.push('', `${t('msg.country')}: ${countryName(country.c)}`);
    return lines.join('\n');
  }
  const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  /* ---------- platform: teklif talebi + anonim ziyaret ölçümü (config.js → SF_API; boşsa form WhatsApp'a aktarır) ---------- */
  const API = (window.SF_API || '').trim();
  const post = (islem, govde) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ islem, ...govde }), keepalive: true }).then(r => r.json());
  const olcTek = new Set();
  function olc(tur, ayrinti, tek) {   // çerez yok; ülke/kaynak/dil/cihaz ve eylem türü kaydedilir (bkz. panel → Trafik)
    if (!API || (tek && olcTek.has(tur))) return; olcTek.add(tur);
    try {
      const q = new URLSearchParams(location.search); let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; if (ref === location.hostname) ref = ''; } catch {}
      post('ziyaret', { tur, ayrinti: ayrinti || '', dil: lang, hedef: country.c, ref, utm: { s: q.get('utm_source') || '', m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '', k: q.get('utm_content') || '' } }).catch(() => {});
    } catch {}
  }
  const trT = k => (window.SF_LANG.tr || {})[k] || k;   // panele giden metinler hep Türkçe
  $$('[data-wa]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.open(waLink(quote.length ? quoteMsg() : t('msg.hi')), '_blank', 'noopener'); }));

  /* ---------- form ---------- */
  function renderCountrySelect(sel, value) {
    const list = COUNTRIES.filter(x => x.c !== 'INTL').map(x => [x.c, countryName(x.c)]).sort((a, b) => a[1].localeCompare(b[1], loc()));
    sel.innerHTML = list.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('') + `<option value="INTL">${esc(t('loc.other'))}</option>`;
    sel.value = value;
  }
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, err = $('#fErr');
    $$('[aria-invalid]', f).forEach(x => x.removeAttribute('aria-invalid'));
    let bad = null;
    if (!f.ad.value.trim()) bad = [f.ad, 'e.name'];
    else if (f.tel.value.replace(/\D/g, '').length < 7) bad = [f.tel, 'e.phone'];
    else if (f.eposta.value && !/^\S+@\S+\.\S+$/.test(f.eposta.value)) bad = [f.eposta, 'e.mail'];
    else if (!f.onay.checked) bad = [f.onay, 'e.ok'];
    if (bad) { bad[0].setAttribute('aria-invalid', 'true'); err.textContent = t(bad[1]); err.hidden = false; bad[0].focus(); return; }
    err.hidden = true;
    const info = [`${t('f.name')}: ${f.ad.value.trim()}`, f.firma.value.trim() && `${t('f.firm')}: ${f.firma.value.trim()}`, `${t('f.phone')}: ${f.tel.value.trim()}`, f.eposta.value.trim() && `${t('f.mail')}: ${f.eposta.value.trim()}`, `${t('f.country')}: ${f.ulke.selectedOptions[0]?.textContent || ''}`, f.mesaj.value.trim()].filter(Boolean);
    const text = quote.length ? quoteMsg(info) : [t('msg.hi'), '', ...info].join('\n');
    const ok = $('#fOk'); ok.hidden = true;
    if (!API) { window.open(waLink(text), '_blank', 'noopener'); return; }
    const btn = $('button[type=submit]', f), eski = btn.textContent; btn.disabled = true; btn.textContent = t('f.sending');
    const urunler = quote.map(x => { const p = byId[x.id]; return { id: x.id, ad: p.name, kol: trT('c.' + p.col), adet: x.q,
      ayrinti: x.g ? (x.n ? `${trT('renk.' + x.g)} · Mindersiz` : `${trT('renk.' + x.g)} · ${x.f === 'gokkusagi' ? 'Gökkuşağı' : 'Nirvana'} ${x.k}`) : x.r ? trT('renk.' + x.r) : '' }; });
    let kaynak = 'Doğrudan'; try { const q = new URLSearchParams(location.search); const rh = document.referrer ? new URL(document.referrer).hostname : ''; kaynak = q.get('utm_source') || (rh && rh !== location.hostname ? rh : '') || 'Doğrudan'; } catch {}
    post('talep', { veri: { ad: f.ad.value.trim(), firma: f.firma.value.trim(), tel: f.tel.value.trim(), mail: f.eposta.value.trim(), ulke: f.ulke.value, dil: lang, mesaj: f.mesaj.value.trim(), web: f.web.value,
      kaynak, sayfa: location.pathname + location.search, ua: navigator.userAgent, urunler, kvkk: f.onay.checked, kvkk_surum: 'sf-1', kvkk_metin: t('f.ok') } })
      .then(j => { if (!j.ok) throw new Error(j.hata || ''); ok.textContent = t('f.sent', { id: j.id || '' }); ok.hidden = false; f.reset(); renderCountrySelect($('#fCountry'), country.c); olc('form'); if (quote.length) { quote = []; saveQ(); } })
      .catch(() => { err.textContent = t('f.fail'); err.hidden = false; window.open(waLink(text), '_blank', 'noopener'); })
      .finally(() => { btn.disabled = false; btn.textContent = eski; });
  });
  $('#form').addEventListener('input', () => olc('form_ac', '', true));

  /* ---------- ülke / dil ---------- */
  function loadLang(code) {
    if (window.SF_LANG[code]) return Promise.resolve(window.SF_LANG[code]);
    return new Promise(res => {
      const s = document.createElement('script'); s.src = `lang/${code}.js`;
      s.onload = () => res(window.SF_LANG[code] || null); s.onerror = () => res(null);
      document.head.appendChild(s);
    });
  }
  let arabFont = false;
  async function setLocale(cCode, lCode, { save = true } = {}) {
    const ctry = byCode[cCode] || byCode.INTL;
    if (!LANGS[lCode]) lCode = ctry.langs[0];
    await loadLang('tr');
    const pack = await loadLang(lCode);
    if (!pack) { if (lCode !== 'en') return setLocale(cCode, 'en', { save }); return; }
    lang = lCode; country = ctry; regionNames = null;
    dict = Object.assign({}, pack, (OVERRIDES[ctry.c] || {})[lCode] || {});
    const L = LANGS[lang];
    html.lang = lang; html.dir = L.dir || 'ltr';
    if (L.script) { html.dataset.script = L.script; if (!arabFont) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'fonts/arab.css'; document.head.appendChild(l); arabFont = true; } } else delete html.dataset.script;
    $$('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t); });
    $$('[data-t-alt]').forEach(el => { el.alt = t(el.dataset.tAlt); });
    $$('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
    $$('[data-t-ph]').forEach(el => { el.placeholder = t(el.dataset.tPh); });
    $$('[data-t-content]').forEach(el => { el.content = t(el.dataset.tContent); });
    $$('[data-num]').forEach(el => { el.textContent = el.hasAttribute('data-plain') ? el.dataset.num : fmt(+el.dataset.num); });
    document.title = t('meta.title');
    const code = ctry.c === 'INTL' ? 'INT' : ctry.c;
    $('#locCode').textContent = $('#locCode2').textContent = code;
    $('#locLang').textContent = $('#locLang2').textContent = L.name;
    renderCountrySelect($('#fCountry'), ctry.c);
    renderCols(); renderChips(); renderGrid(); renderQuote();
    if (pd.open && cur) openP(cur.id);
    window.SF_T = t; window.SF_FMT = fmt; document.dispatchEvent(new CustomEvent('sf-locale'));
    if (save) {
      store.set('sf-c', ctry.c); store.set('sf-l', lang);
      const u = new URL(location.href); u.searchParams.set('c', ctry.c.toLowerCase()); u.searchParams.set('l', lang);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  }

  /* ---------- ülke / dil penceresi (Purix yapısı) ---------- */
  const REG = { TR: 'tr', AZ: 'tr', GE: 'tr', RU: 'tr', KZ: 'tr', UZ: 'tr', DE: 'eu', NL: 'eu', BE: 'eu', FR: 'eu', GB: 'eu', ES: 'eu', IT: 'eu', GR: 'eu', US: 'am', MX: 'am', INTL: 'intl' };
  const REGIONS = ['tr', 'eu', 'me', 'am', 'intl'];
  const locD = $('#locD');
  function renderLocDlg() {
    const coll = new Intl.Collator(loc().split('-u-')[0]);
    $('#locList').innerHTML = REGIONS.map(r => {
      const items = COUNTRIES.filter(x => (REG[x.c] || 'me') === r).map(x => ({ x, n: countryName(x.c) }))
        .sort((a, b) => r === 'tr' && (a.x.c === 'TR' || b.x.c === 'TR') ? (a.x.c === 'TR' ? -1 : 1) : coll.compare(a.n, b.n));
      return `<section class="loc-reg"><h3>${t('loc.r.' + r)}</h3><div class="loc-grid">${items.map(({ x, n }) =>
        `<button type="button" class="loc-item" data-c="${x.c}"${x.c === country.c ? ' aria-current="true"' : ''}><span class="lc-code">${x.c === 'INTL' ? 'INT' : x.c}</span><span class="lc-txt"><b>${esc(n)}</b><small>${x.langs.map(l => LANGS[l].name).join(' · ')}</small></span></button>`).join('')}</div></section>`;
    }).join('');
    $('#locLangBtns').innerHTML = country.langs.map(l => `<button type="button" data-l="${l}" aria-pressed="${l === lang}" lang="${l}">${LANGS[l].name}</button>`).join('');
  }
  let locOpener = null;
  function openLoc(e) { locOpener = e && e.currentTarget; renderLocDlg(); locD.showModal(); locD.scrollTop = 0; ($('.loc-item[aria-current]', locD) || $('.loc-item', locD)).focus({ preventScroll: true }); }
  $('#locBtn').addEventListener('click', openLoc); $('#locBtn2').addEventListener('click', openLoc);
  $('#locX').addEventListener('click', () => locD.close());
  locD.addEventListener('click', e => {
    if (e.target === locD) return locD.close();
    const c = e.target.closest('[data-c]'), l = e.target.closest('[data-l]');
    if (c) { const x = byCode[c.dataset.c]; setLocale(x.c, x.langs[0]).then(() => locD.close()); }
    if (l) setLocale(country.c, l.dataset.l).then(renderLocDlg);
  });
  locD.addEventListener('close', () => locOpener && locOpener.focus());

  /* ---------- menü ve kaydırma ---------- */
  const burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); menu.classList.toggle('open', o); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); } });
  const top = $('#top');
  addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 10), { passive: true });

  /* ---------- tasarla bandı: sandalyeler sahneden geçer, ortada minderleri üstlerine konar (tools/bant.py → SF_BANT) ---------- */
  (() => {
    const band = $('#tzBand'), track = $('#tzTrack'), B = window.SF_BANT || [];
    if (!band || !B.length) return;
    const HIZ = 52, ORAN = 970 / 1300, ARALIK = 0.7;   // px/sn · kare en/boy · kareler arası adım (genişliğe oran)
    const its = B.map((x, n) => {
      const a = document.createElement('a'); a.className = 'tz-it'; a.tabIndex = -1;
      a.innerHTML = `<img src="assets/bant/${x.id}-${x.g}.webp" alt="" loading="lazy" decoding="async"><img class="tz-m" alt="" decoding="async" style="left:${x.kutu[0]}%;top:${x.kutu[1]}%;width:${x.kutu[2]}%"><span class="tz-lbl"><b></b></span>`;
      track.appendChild(a);
      const it = { x, a, m: a.children[1], lbl: a.querySelector('b'), tur: n % 2, son: -1e9, on: false };
      renkle(it); return it;
    });
    function renkle(it) {
      const kod = it.x.k[it.tur % it.x.k.length];
      it.m.src = `assets/bant/${it.x.id}-${it.x.g}-${kod}.webp`; it.lbl.textContent = 'Gökkuşağı ' + kod;
      it.a.href = `siparis.html?m=${it.x.id}&g=${it.x.g}&k=${kod}`;
    }
    let w = 0, adim = 0, top = 0, bw = 0, ofs = 0, son = 0, gorunur = false, yon = 1;
    function olc() { const h = band.clientHeight; bw = band.clientWidth; w = h * ORAN; adim = w * ARALIK; top = adim * its.length; yon = html.dir === 'rtl' ? -1 : 1; }
    function ciz() {
      const durak = bw * 0.36;   // minderin konduğu yer (kare merkezi bu çizgiyi geçince)
      its.forEach((it, n) => {
        let p = ((n * adim + ofs) % top + top) % top - w;        // karenin başlangıç kenarı; akış yönünde artar
        if (p < it.son - adim) { it.tur++; it.on = false; it.a.classList.remove('on'); renkle(it); }   // başa sardı: minder kalkar, sıradaki renk
        it.son = p;
        if (!it.on && p + w / 2 > durak && p < bw) { it.on = true; it.a.classList.add('on'); }
        it.a.style.transform = `translate3d(${yon * p}px,0,0)`;
      });
    }
    function kare(t) {
      if (!gorunur || document.hidden) { son = 0; return; }
      if (son) ofs += Math.min(64, t - son) / 1000 * HIZ;
      son = t; ciz(); requestAnimationFrame(kare);
    }
    olc(); ofs = bw * 0.5;
    if (reduce) { ofs = bw * 0.9; ciz(); its.forEach(it => { if (it.son > -w && it.son < bw) it.a.classList.add('on'); }); return; }
    ciz();
    addEventListener('resize', () => { olc(); ciz(); });
    new MutationObserver(() => { olc(); ciz(); }).observe(html, { attributes: true, attributeFilter: ['dir'] });
    new IntersectionObserver(e => { const g = e[0].isIntersecting; if (g && !gorunur) { gorunur = true; son = 0; requestAnimationFrame(kare); } gorunur = g; }, { rootMargin: '120px' }).observe(band);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && gorunur) { son = 0; requestAnimationFrame(kare); } });
  })();

  /* ---------- referans logo bandı: sıranın kopyası eklenir, hız genişliğe göre sabit ---------- */
  document.querySelectorAll('.mq-track').forEach(tr => {
    const ul = tr.firstElementChild, cp = ul.cloneNode(true);
    cp.setAttribute('aria-hidden', 'true');
    cp.querySelectorAll('img').forEach(i => i.alt = '');
    tr.append(cp);
    const speed = () => tr.style.setProperty('--mqd', (ul.getBoundingClientRect().width / 42).toFixed(1) + 's');   // ~42 px/sn
    speed(); addEventListener('resize', speed, { passive: true });
  });

  /* ---------- başlangıç ---------- */
  const qs = new URLSearchParams(location.search);
  let c0 = (qs.get('c') || store.get('sf-c') || '').toUpperCase();
  let l0 = qs.get('l') || store.get('sf-l');
  if (!byCode[c0]) {
    const nav = (navigator.language || 'tr').toLowerCase();
    const nl = nav.slice(0, 2);
    const reg = (nav.split('-')[1] || '').toUpperCase();
    c0 = byCode[reg] ? reg : nl === 'tr' ? 'TR' : 'INTL';
    if (!l0 && LANGS[nl]) l0 = nl;
  }
  setLocale(c0, l0, { save: !!qs.get('c') }).then(() => olc('g'));
})();
