/* Phantom Dynamics storefront — client runtime (no dependencies) */
(() => {
  'use strict';
  const CFG = window.__PD || { base: '', store: 'https://phantomdynamics.com', freeShip: 299.99 };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const money = (n) => usd.format(n || 0);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON = (n) => ({
    bag: '<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', check: '<path d="m5 12 5 5L20 7"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>', arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', chev: '<path d="m9 6 6 6-6 6"/>',
    star: '<path fill="currentColor" stroke="none" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"/>',
  }[n] || '');
  const svg = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON(n)}</svg>`;
  const lock = (on) => document.body.classList.toggle('no-scroll', on);
  const imgSize = (u, s) => (u ? u.replace(/\/images\/stencil\/[^/]+\//, `/images/stencil/${s}/`) : u);
  const track = (name, params) => { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch {} };

  /* ---------------- toast ---------------- */
  const toast = (html, ms = 2800) => {
    const host = $('.toast-host'); if (!host) return;
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = html; host.appendChild(el);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 400); }, ms);
  };

  /* ---------------- header ---------------- */
  const header = $('#header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mega menu: hover intent on pointer devices, tap-to-open on touch.
  let megaTimer;
  $$('.nav-item.has-mega').forEach((li) => {
    const a = $(':scope > a', li);
    li.addEventListener('mouseenter', () => { clearTimeout(megaTimer); megaTimer = setTimeout(() => { $$('.nav-item.is-open').forEach((x) => x !== li && x.classList.remove('is-open')); li.classList.add('is-open'); }, 80); });
    li.addEventListener('mouseleave', () => { clearTimeout(megaTimer); megaTimer = setTimeout(() => li.classList.remove('is-open'), 120); });
    a.addEventListener('click', (e) => { if (matchMedia('(hover: none)').matches && !li.classList.contains('is-open')) { e.preventDefault(); $$('.nav-item.is-open').forEach((x) => x.classList.remove('is-open')); li.classList.add('is-open'); } });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-item')) $$('.nav-item.is-open').forEach((x) => x.classList.remove('is-open')); });

  /* ---------------- mobile nav ---------------- */
  const mnav = $('#mobile-nav');
  let mnavBuilt = false;
  const buildMnav = () => {
    if (mnavBuilt) return; mnavBuilt = true;
    const chev = '<svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    const html = $$('.nav > ul > .nav-item').map((li) => {
      const top = $(':scope > a', li); const cols = $$('.mega-col', li);
      if (!cols.length) return `<li><a href="${esc(top.href)}">${esc(top.textContent)}</a></li>`;
      const inner = cols.map((col) => {
        const head = $(':scope > .mega-head', col); const links = $$(':scope > ul > li > a:not(.mega-more)', col);
        const isLoose = /^(More |Explore)/.test(head.textContent);
        if (isLoose) return links.map((a) => `<li><a href="${esc(a.href)}">${esc(a.textContent)}</a></li>`).join('');
        return `<li><details><summary><span>${esc(head.textContent)}</span>${chev}</summary><a class="mnav-all" href="${esc(head.href)}">All ${esc(head.textContent)}</a><ul class="mnav-list depth-2">${links.map((a) => `<li><a href="${esc(a.href)}">${esc(a.textContent)}</a></li>`).join('')}</ul></details></li>`;
      }).join('');
      return `<li><details><summary><span>${esc(top.textContent)}</span>${chev}</summary><a class="mnav-all" href="${esc(top.href)}">All ${esc(top.textContent)}</a><ul class="mnav-list depth-1">${inner}</ul></details></li>`;
    }).join('');
    $('[data-mnav-body]').insertAdjacentHTML('afterbegin', `<ul class="mnav-list depth-0">${html}</ul>`);
  };
  const openM = () => { buildMnav(); mnav.hidden = false; requestAnimationFrame(() => mnav.classList.add('is-open')); lock(true); $('.nav-toggle').setAttribute('aria-expanded', 'true'); };
  const closeM = () => { mnav.classList.remove('is-open'); lock(false); $('.nav-toggle').setAttribute('aria-expanded', 'false'); setTimeout(() => { mnav.hidden = true; }, 500); };
  $('.nav-toggle') && $('.nav-toggle').addEventListener('click', openM);
  $$('[data-close-mnav]').forEach((b) => b.addEventListener('click', closeM));

  /* ---------------- cart ---------------- */
  const KEY = 'pd_cart_v1';
  const cart = {
    items: [],
    load() { try { this.items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { this.items = []; } },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.items)); } catch {} this.render(); },
    key(i) { return i.slug + '|' + (i.option || ''); },
    add(p, qty = 1, option = '') {
      const k = p.slug + '|' + option; const ex = this.items.find((i) => this.key(i) === k);
      if (ex) ex.qty = Math.min(99, ex.qty + qty); else this.items.push({ ...p, option, qty });
      this.save();
      track('add_to_cart', { currency: 'USD', value: (p.price || 0) * qty, items: [{ item_id: p.id, item_name: p.name, item_brand: p.brand, price: p.price, quantity: qty }] });
      const badge = $('[data-cart-count]'); if (badge) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
      toast(`<img src="${esc(p.image)}" alt="">${svg('check')}<span>Added <b>${esc(p.name.length > 34 ? p.name.slice(0, 33) + '…' : p.name)}</b> to your bag</span>`);
    },
    setQty(k, q) { const it = this.items.find((i) => this.key(i) === k); if (!it) return; it.qty = Math.max(0, Math.min(99, q)); if (!it.qty) this.items = this.items.filter((i) => i !== it); this.save(); },
    remove(k) { this.items = this.items.filter((i) => this.key(i) !== k); this.save(); },
    count() { return this.items.reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.items.reduce((n, i) => n + i.qty * (i.price || 0), 0); },
    itemHTML(i) {
      return `<div class="cart-item" data-key="${esc(this.key(i))}"><a href="${esc(i.url)}"><img src="${esc(i.image)}" alt="${esc(i.name)}"></a><div class="cart-item-body">${i.brand ? `<span class="cart-item-brand">${esc(i.brand)}</span>` : ''}<a class="cart-item-name" href="${esc(i.url)}">${esc(i.name)}</a>${i.option ? `<span class="cart-item-opt">${esc(i.option)}</span>` : ''}<div class="cart-item-row"><div class="qty"><button type="button" aria-label="Decrease" data-cart-dec>${svg('minus')}</button><input type="number" value="${i.qty}" min="0" max="99" aria-label="Quantity" data-cart-qty><button type="button" aria-label="Increase" data-cart-inc>${svg('plus')}</button></div><span class="cart-item-price">${money(i.price * i.qty)}</span></div><button class="cart-item-remove" type="button" data-cart-remove>${svg('trash')} Remove</button></div></div>`;
    },
    render() {
      const n = this.count(); const sub = this.subtotal();
      $$('[data-cart-count]').forEach((b) => { b.textContent = n; b.hidden = !n; });
      $$('[data-cart-count-inline]').forEach((b) => { b.textContent = n ? `(${n})` : ''; });
      $$('[data-cart-subtotal]').forEach((b) => { b.textContent = money(sub); });
      $$('[data-cart-items]').forEach((host) => {
        host.innerHTML = this.items.length ? this.items.map((i) => this.itemHTML(i)).join('') : `<div class="cart-empty">${svg('bag')}<h3>Your bag is empty</h3><p>Fill it with something that lights up the room.</p><a class="btn btn-primary" href="${CFG.base}/lighting/">Start shopping</a></div>`;
      });
      $$('[data-ship-progress]').forEach((el) => {
        const left = Math.max(0, CFG.freeShip - sub); const pctv = Math.min(100, (sub / CFG.freeShip) * 100);
        el.classList.toggle('is-free', !left);
        $('[data-ship-text]', el).innerHTML = left ? `Add <b>${money(left)}</b> more for free U.S. shipping` : `${svg('check', 'ic-inline')} You've unlocked free U.S. shipping`;
        $('.bar span', el).style.width = pctv + '%';
      });
      $$('[data-checkout]').forEach((b) => { b.disabled = !n; });
    },
  };
  cart.load(); cart.render();
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); try { const p = JSON.parse(add.dataset.add); cart.add(p); add.classList.add('is-added'); const t = add.innerHTML; add.innerHTML = `${svg('check')} Added`; setTimeout(() => { add.classList.remove('is-added'); add.innerHTML = t; }, 1600); } catch {} return; }
    const row = e.target.closest('.cart-item'); if (!row) return; const k = row.dataset.key; const inp = $('[data-cart-qty]', row);
    if (e.target.closest('[data-cart-inc]')) cart.setQty(k, +inp.value + 1);
    else if (e.target.closest('[data-cart-dec]')) cart.setQty(k, +inp.value - 1);
    else if (e.target.closest('[data-cart-remove]')) { row.classList.add('is-removing'); setTimeout(() => cart.remove(k), 250); }
  });
  document.addEventListener('change', (e) => { if (e.target.matches('[data-cart-qty]')) cart.setQty(e.target.closest('.cart-item').dataset.key, +e.target.value || 0); });
  $$('[data-checkout]').forEach((b) => b.addEventListener('click', () => {
    if (!cart.items.length) return;
    // Hand off to the secure BigCommerce cart. Each line is added to the live cart in turn; the last one lands on the cart page.
    const lines = cart.items.filter((i) => i.id);
    if (!lines.length) return;
    const first = lines[0];
    track('begin_checkout', { currency: 'USD', value: cart.subtotal(), items: lines.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })) });
    const url = `${CFG.store}/cart.php?action=add&product_id=${encodeURIComponent(first.id)}&qty=${first.qty}`;
    if (lines.length > 1) toast(`${svg('bag')}<span>Taking you to secure checkout — add remaining items from your bag.</span>`, 3500);
    setTimeout(() => { location.href = url; }, lines.length > 1 ? 900 : 0);
  }));

  // Drawer
  const drawer = $('#cart-drawer');
  const openCart = () => { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-open')); lock(true); };
  const closeCart = () => { drawer.classList.remove('is-open'); lock(false); setTimeout(() => { drawer.hidden = true; }, 550); };
  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openCart));
  $$('[data-close-cart]').forEach((b) => b.addEventListener('click', closeCart));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-add]') && !document.body.classList.contains('is-cart')) setTimeout(openCart, 350); });

  /* ---------------- search ---------------- */
  const search = $('#search'); const sInput = $('[data-search-input]'); const sResults = $('[data-search-results]');
  let index = null, catIndex = null, loading = null, active = -1;
  const loadIndex = () => loading || (loading = Promise.all([
    fetch(`${CFG.base}/assets/data/search.json?v=${CFG.ver || ''}`).then((r) => r.json()),
    fetch(`${CFG.base}/assets/data/categories.json?v=${CFG.ver || ''}`).then((r) => r.json()),
  ]).then(([i, c]) => { index = i.map((r) => ({ slug: r[0], name: r[1], brand: r[2], price: r[3], was: r[4], img: r[5], alt: r[6], rating: r[7], reviews: r[8], free: r[9], opts: r[10], id: r[11], stock: r[12], cat: r[13], hay: (r[1] + ' ' + r[2] + ' ' + r[13]).toLowerCase() })); catIndex = c; }));
  const tokens = (q) => q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const scoreOf = (it, toks, q) => {
    let s = 0; const name = it.name.toLowerCase();
    for (const t of toks) { if (!it.hay.includes(t)) return 0; s += name.includes(t) ? 3 : 1; if (name.startsWith(t)) s += 2; if (it.brand.toLowerCase() === t) s += 2; }
    if (name.includes(q)) s += 4; if (it.price) s += .5; if (it.rating) s += .3;
    return s;
  };
  const runSearch = (q, limit = 60) => { const toks = tokens(q); if (!toks.length || !index) return []; const ql = q.toLowerCase().trim(); return index.map((it) => [scoreOf(it, toks, ql), it]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1]); };
  const hl = (s, toks) => { let out = esc(s); toks.forEach((t) => { out = out.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>'); }); return out; };
  const renderResults = (q) => {
    if (!sResults) return; active = -1; const toks = tokens(q);
    if (!toks.length) { sResults.innerHTML = sResults.dataset.empty; return; }
    const prods = runSearch(q, 8); const cats = (catIndex || []).filter((c) => toks.every((t) => c[0].toLowerCase().includes(t))).slice(0, 4);
    if (!prods.length && !cats.length) { sResults.innerHTML = `<div class="search-none">No results for “${esc(q)}”. Try a brand, a category or a model name.</div>`; return; }
    sResults.innerHTML = `${cats.length ? `<div class="search-group">Categories</div>${cats.map((c) => `<a class="search-item search-item-cat" href="${CFG.base}${esc(c[1])}"><div class="search-item-body"><strong>${hl(c[0], toks)}</strong><span>${c[2]} products</span></div>${svg('chev')}</a>`).join('')}` : ''}${prods.length ? `<div class="search-group">Products</div>${prods.map((p) => `<a class="search-item" href="${CFG.base}/${esc(p.slug)}/"><img src="${esc(imgSize(p.img, '160x160'))}" alt="${esc(p.name)}" loading="lazy"><div class="search-item-body"><strong>${hl(p.name, toks)}</strong><span>${esc(p.brand || p.cat || '')}</span></div><span class="search-item-price">${p.price ? money(p.price) : '—'}</span></a>`).join('')}<div class="search-more"><a class="btn btn-ghost btn-sm" href="${CFG.base}/search/?q=${encodeURIComponent(q)}">See all results ${svg('arrow')}</a></div>` : ''}`;
  };
  const openSearch = () => { if (!search) return; search.hidden = false; requestAnimationFrame(() => search.classList.add('is-open')); lock(true); setTimeout(() => sInput.focus(), 50); loadIndex().then(() => sInput.value && renderResults(sInput.value)); };
  const closeSearch = () => { if (!search) return; search.classList.remove('is-open'); lock(false); setTimeout(() => { search.hidden = true; }, 300); };
  if (sResults) sResults.dataset.empty = sResults.innerHTML;
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch));
  $$('[data-close-search]').forEach((b) => b.addEventListener('click', closeSearch));
  let sTimer; sInput && sInput.addEventListener('input', () => { clearTimeout(sTimer); sTimer = setTimeout(() => loadIndex().then(() => renderResults(sInput.value)), 80); });
  sInput && sInput.addEventListener('keydown', (e) => {
    const items = $$('.search-item', sResults); if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((it, i) => it.classList.toggle('is-active', i === active)); items[active].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); location.href = items[active].href; }
  });
  document.addEventListener('click', (e) => { const s = e.target.closest('[data-search-suggest]'); if (s) { sInput.value = s.dataset.searchSuggest; sInput.focus(); loadIndex().then(() => renderResults(sInput.value)); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSearch(); closeCart(); closeM(); $('.modal') && $('.modal').remove(); $('.filters.is-open') && closeFilters(); }
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ---------------- card renderer (client) ---------------- */
  const stars = (n, c) => n ? `<div class="card-rating"><span class="stars">${('<i>' + svg('star') + '</i>').repeat(5)}<b style="width:${(n / 5) * 100}%">${('<i>' + svg('star') + '</i>').repeat(5)}</b></span>${c ? `<span class="stars-count">(${c})</span>` : ''}</div>` : '';
  const cardHTML = (p, i = 0) => {
    const link = `${CFG.base}/${p.slug}/`; const save = p.was && p.price && p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;
    const badges = [!p.price ? '<span class="badge badge-muted">Discontinued</span>' : save ? `<span class="badge badge-sale">Save ${save}%</span>` : '', p.price && p.free ? '<span class="badge badge-ship">Free shipping</span>' : ''].filter(Boolean).join('');
    const payload = { id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, image: imgSize(p.img, '320x320'), url: link };
    const quick = !p.price ? '' : p.opts ? `<a class="card-quick" href="${link}">Choose options</a>` : `<button class="card-quick" type="button" data-add="${esc(JSON.stringify(payload))}">Add to bag</button>`;
    return `<article class="card is-new" style="--i:${i % 12}"><div class="card-figure"><a class="card-media" href="${link}" tabindex="-1" aria-hidden="true"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="640" height="640">${p.alt ? `<img class="card-alt" src="${esc(p.alt)}" alt="${esc(p.name)}, alternate view" loading="lazy" decoding="async">` : ''}${badges ? `<div class="badges">${badges}</div>` : ''}</a>${quick}</div><div class="card-body">${p.brand ? `<div class="card-brand">${esc(p.brand)}</div>` : ''}<h3 class="card-title"><a href="${link}">${esc(p.name)}</a></h3>${stars(p.rating, p.reviews)}<div class="card-price">${p.price ? `<span class="price">${money(p.price)}</span>${save ? `<s>${money(p.was)}</s>` : ''}` : '<span class="price price-muted">No longer available</span>'}</div></div></article>`;
  };
  const fromLite = (r) => ({ slug: r[0], name: r[1], brand: r[2], price: r[3], was: r[4], img: r[5], alt: r[6], rating: r[7], reviews: r[8], free: r[9], opts: r[10], id: r[11], stock: r[12], cat: r[13] });

  /* ---------------- listing (category / brand) ---------------- */
  const listing = $('[data-listing]');
  const filters = $('#filters');
  const openFilters = () => { filters.classList.add('is-open'); lock(true); };
  const closeFilters = () => { filters.classList.remove('is-open'); lock(false); };
  if (listing) {
    const grid = $('[data-grid]', listing); const PAGE = 24; let all = []; let view = []; let shown = 0;
    const state = { sort: 'featured', brand: new Set(), min: null, max: null, instock: false, sale: false, freeship: false };
    const params = new URLSearchParams(location.search);
    if (params.get('sort')) state.sort = params.get('sort');
    const apply = () => {
      view = all.filter((p) => (!state.brand.size || state.brand.has(p.brand)) && (state.min == null || (p.price || 0) >= state.min) && (state.max == null || (p.price || 0) <= state.max) && (!state.instock || (p.stock && p.price)) && (!state.sale || (p.was && p.was > p.price)) && (!state.freeship || p.free));
      const s = state.sort;
      if (s === 'price-asc') view.sort((a, b) => (a.price || 1e9) - (b.price || 1e9));
      else if (s === 'price-desc') view.sort((a, b) => (b.price || 0) - (a.price || 0));
      else if (s === 'name-asc') view.sort((a, b) => a.name.localeCompare(b.name));
      else if (s === 'rating') view.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
      else if (s === 'newest') view.sort((a, b) => (+b.id || 0) - (+a.id || 0));
      shown = 0; grid.innerHTML = ''; more();
      $('[data-count]', listing).textContent = view.length; $('[data-total-shown]', listing).textContent = view.length;
      const empty = $('.empty', listing); if (empty) empty.hidden = !!view.length; else if (!view.length) grid.insertAdjacentHTML('afterend', '<div class="empty"><p>No products match those filters.</p></div>');
      chips();
    };
    const more = () => { const next = view.slice(shown, shown + PAGE); grid.insertAdjacentHTML('beforeend', next.map((p, i) => cardHTML(p, i)).join('')); shown += next.length; $('[data-shown]', listing).textContent = shown; $('[data-load-more]', listing).hidden = shown >= view.length; };
    const chips = () => {
      const host = $('[data-active-filters]', listing); const out = [];
      state.brand.forEach((b) => out.push(['brand', b, b])); if (state.min != null) out.push(['min', '', `Min ${money(state.min)}`]); if (state.max != null) out.push(['max', '', `Max ${money(state.max)}`]);
      if (state.instock) out.push(['instock', '', 'In stock']); if (state.sale) out.push(['sale', '', 'On sale']); if (state.freeship) out.push(['freeship', '', 'Free shipping']);
      host.hidden = !out.length; host.innerHTML = out.map(([k, v, label]) => `<button type="button" class="chip is-active" data-remove-filter="${esc(k)}" data-value="${esc(v)}">${esc(label)} ${svg('close')}</button>`).join('');
    };
    const readFilters = () => {
      state.brand = new Set($$('[data-filter="brand"]:checked', filters).map((i) => i.value));
      const mn = $('[data-filter="min"]', filters).value, mx = $('[data-filter="max"]', filters).value;
      state.min = mn === '' ? null : +mn; state.max = mx === '' ? null : +mx;
      state.instock = $('[data-filter="instock"]', filters).checked; state.sale = $('[data-filter="sale"]', filters).checked; state.freeship = $('[data-filter="freeship"]', filters).checked;
      apply();
    };
    fetch(listing.dataset.src + `?v=${CFG.ver || ''}`).then((r) => r.json()).then((rows) => { all = rows.map(fromLite); const sortSel = $('[data-sort]', listing); sortSel.value = state.sort; if (state.sort !== 'featured') apply(); else { view = all; shown = Math.min(PAGE, all.length); } });
    $('[data-sort]', listing).addEventListener('change', (e) => { state.sort = e.target.value; const p = new URLSearchParams(location.search); p.set('sort', state.sort); history.replaceState(null, '', '?' + p); apply(); });
    let fTimer; filters.addEventListener('input', () => { clearTimeout(fTimer); fTimer = setTimeout(readFilters, 250); });
    $('[data-clear-filters]').addEventListener('click', () => { $$('input', filters).forEach((i) => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; }); readFilters(); });
    $('[data-active-filters]', listing).addEventListener('click', (e) => { const b = e.target.closest('[data-remove-filter]'); if (!b) return; const k = b.dataset.removeFilter; if (k === 'brand') { const i = $$('[data-filter="brand"]', filters).find((x) => x.value === b.dataset.value); if (i) i.checked = false; } else { const i = $(`[data-filter="${k}"]`, filters); if (i.type === 'checkbox') i.checked = false; else i.value = ''; } readFilters(); });
    $('[data-load-more] button', listing).addEventListener('click', () => { if (!view.length) view = all; more(); });
    $$('[data-open-filters]').forEach((b) => b.addEventListener('click', openFilters));
    $$('[data-close-filters]').forEach((b) => b.addEventListener('click', closeFilters));
  }

  /* ---------------- search results page ---------------- */
  const sGrid = $('[data-search-grid]');
  if (sGrid) {
    const q = new URLSearchParams(location.search).get('q') || ''; const inp = $('[data-search-page-input]'); inp.value = q; $('[data-search-term]').textContent = q ? ` for “${q}”` : '';
    document.title = (q ? `“${q}” – ` : '') + 'Search | Phantom Dynamics';
    if (q) track('search', { search_term: q });
    if (q) loadIndex().then(() => { const res = runSearch(q, 200); $('[data-count]').textContent = res.length; sGrid.innerHTML = res.map((p, i) => cardHTML(p, i)).join(''); $('[data-search-empty]').hidden = !!res.length; });
    else inp.focus();
  }

  /* ---------------- product page ---------------- */
  const gallery = $('[data-gallery]');
  if (gallery) {
    const imgs = $$('.gallery-stage img', gallery); const thumbs = $$('[data-thumb]', gallery); let cur = 0;
    const go = (i) => { cur = (i + imgs.length) % imgs.length; imgs.forEach((im, k) => im.classList.toggle('is-active', k === cur)); thumbs.forEach((t, k) => { t.classList.toggle('is-active', k === cur); t.setAttribute('aria-selected', k === cur); }); thumbs[cur] && thumbs[cur].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); };
    thumbs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.thumb)));
    $('[data-gallery-prev]', gallery) && $('[data-gallery-prev]', gallery).addEventListener('click', () => go(cur - 1));
    $('[data-gallery-next]', gallery) && $('[data-gallery-next]', gallery).addEventListener('click', () => go(cur + 1));
    let sx = 0; const stage = $('.gallery-main', gallery);
    stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); });
    const zoom = () => { const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<button class="icon-btn modal-close" type="button" aria-label="Close">${svg('close')}</button><img src="${esc(imgs[cur].currentSrc || imgs[cur].src)}" alt="">`; m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.modal-close')) m.remove(); }); document.body.appendChild(m); };
    $('[data-zoom]', gallery).addEventListener('click', zoom); imgs.forEach((im) => im.addEventListener('click', zoom));
    document.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
  }
  const buy = $('[data-product]');
  if (buy) {
    const base = JSON.parse(buy.dataset.product); const qtyInp = $('[data-qty] input', buy);
    track('view_item', { currency: 'USD', value: base.price || 0, items: [{ item_id: base.id, item_name: base.name, item_brand: base.brand, price: base.price }] });
    $('[data-qty-inc]', buy) && $('[data-qty-inc]', buy).addEventListener('click', () => { qtyInp.value = Math.min(99, +qtyInp.value + 1); });
    $('[data-qty-dec]', buy) && $('[data-qty-dec]', buy).addEventListener('click', () => { qtyInp.value = Math.max(1, +qtyInp.value - 1); });
    $$('.swatches', buy).forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (!b) return; $$('.swatch', g).forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); }); }));
    const option = () => $$('[data-option]', buy).map((g) => `${g.dataset.option}: ${g.tagName === 'SELECT' ? g.value : ($('.swatch.is-active', g) || {}).dataset?.value || ''}`).join(' · ');
    $$('[data-add-product]').forEach((b) => b.addEventListener('click', () => { cart.add(base, qtyInp ? +qtyInp.value || 1 : 1, option()); b.classList.add('is-added'); const t = b.innerHTML; b.innerHTML = `${svg('check')} Added to bag`; setTimeout(() => { b.classList.remove('is-added'); b.innerHTML = t; }, 1600); setTimeout(openCart, 350); }));
    // sticky mobile buy bar
    const sticky = $('[data-sticky-buy]'); const mainBtn = $('.btn-add', buy);
    if (sticky && mainBtn && 'IntersectionObserver' in window) { sticky.hidden = false; new IntersectionObserver(([en]) => sticky.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe(mainBtn); }
  }
  const tabs = $('[data-tabs]');
  if (tabs) {
    const show = (name) => { $$('button', tabs).forEach((b) => b.classList.toggle('is-active', b.dataset.tab === name)); $$('.tab-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name)); };
    tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
    if (location.hash === '#reviews') show('reviews');
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href="#reviews"]'); if (a) { show('reviews'); } });
  }
  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-video]'); if (!v) return;
    const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<button class="icon-btn modal-close" type="button" aria-label="Close">${svg('close')}</button><iframe src="https://www.youtube-nocookie.com/embed/${esc(v.dataset.video)}?autoplay=1&rel=0" title="Product video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    m.addEventListener('click', (ev) => { if (ev.target === m || ev.target.closest('.modal-close')) m.remove(); }); document.body.appendChild(m);
  });

  /* ---------------- carousels ---------------- */
  $$('[data-carousel]').forEach((c) => {
    const track = $('.carousel-track', c); const prev = $('.prev', c); const next = $('.next', c);
    const update = () => { prev.disabled = track.scrollLeft <= 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
    prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * .8, behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * .8, behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  });

  /* ---------------- reveal / count-up / parallax ---------------- */
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    const watch = () => $$('.reveal:not(.in)').forEach((el) => io.observe(el));
    watch(); new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
    const co = new IntersectionObserver((entries) => entries.forEach((en) => { if (!en.isIntersecting) return; co.unobserve(en.target); const el = en.target; const end = +el.dataset.count; const suf = el.dataset.suffix || (end >= 100 ? '+' : '+'); const t0 = performance.now(); const dur = 1600; const tick = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(end * e).toLocaleString() + (p === 1 ? suf : ''); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }), { threshold: .5 });
    $$('[data-count]').forEach((el) => { if (el.closest('.stats')) co.observe(el); });
  } else { $$('.reveal').forEach((el) => el.classList.add('in')); $$('.stats [data-count]').forEach((el) => { el.textContent = (+el.dataset.count).toLocaleString() + (el.dataset.suffix || '+'); }); }
  const par = $('[data-parallax]');
  if (par && !reduced && matchMedia('(hover: hover)').matches) {
    const tiles = $$('.hero-tile', par); let raf;
    par.closest('.hero').addEventListener('mousemove', (e) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = par.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5; const y = (e.clientY - r.top) / r.height - .5; tiles.forEach((t, i) => { t.style.transform = `translate3d(${x * (10 + i * 6)}px, ${y * (10 + i * 6)}px, 0) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`; }); }); });
    par.closest('.hero').addEventListener('mouseleave', () => tiles.forEach((t) => { t.style.transform = ''; }));
  }

  /* ---------------- contact form -> thank-you page ---------------- */
  const contactForm = $('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      if (!contactForm.checkValidity()) return;
      e.preventDefault();
      const btn = $('button[type="submit"]', contactForm); btn.disabled = true; btn.textContent = 'Sending…';
      track('generate_lead', { method: 'contact_form' });
      const done = () => { location.href = contactForm.dataset.success; };
      // Deliver to the store's contact endpoint, then show our own confirmation page.
      fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm), mode: 'no-cors', credentials: 'omit' }).then(done, done);
      setTimeout(done, 4000);
    });
  }
  // Site-wide mobile call to action hides once the footer is on screen.
  const mcta = $('[data-mobile-cta]');
  if (mcta && 'IntersectionObserver' in window) { const f = $('.footer'); if (f) new IntersectionObserver(([en]) => mcta.classList.toggle('is-hidden', en.isIntersecting)).observe(f); }

  /* ---------------- misc ---------------- */
  document.documentElement.classList.remove('no-js');
  // Broken hot-linked image fallback: show a soft placeholder instead of a broken icon.
  document.addEventListener('error', (e) => { const im = e.target; if (im.tagName === 'IMG' && !im.dataset.failed) { im.dataset.failed = '1'; im.style.opacity = '0'; } }, true);
})();
