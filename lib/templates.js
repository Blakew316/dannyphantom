// HTML templates for the Phantom Dynamics storefront.
// Every function returns a string. `ctx` carries pre-computed catalog data (see build.js).
import { esc, money, pct, imgSize, srcset, stripTags, truncate, jsonAttr } from './util.js';

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  star: '<path fill="currentColor" stroke="none" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"/>',
  truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="m9 12 2 2 4-4"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19a3 3 0 0 1-3 2h-3"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  play: '<path fill="currentColor" stroke="none" d="M8 5v14l11-7z"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M19 14v5H5V5h5"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>',
  tag: '<path d="M3 12V4h8l9 9-8 8-9-9z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  box: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3zM3 7.5 12 12l9-4.5M12 12v9"/>',
  returns: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

export const icon = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

const LOGO_MARK = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8cff"/><stop offset=".55" stop-color="#a855f7"/><stop offset="1" stop-color="#ff4d8d"/></linearGradient></defs><rect x="2" y="2" width="36" height="36" rx="11" fill="url(#lg)"/><path d="M20 30V10l10 12M20 10 10 22" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="20" cy="10" r="2.6" fill="#fff"/></svg>`;

const NAV_SHORT = { 'Video Panels': 'Video', 'Fog | Haze | SFX': 'Fog & SFX', 'DMX | Drivers | PSU': 'DMX & Control', 'Sound | Audio': 'Audio', 'Truss | Stands': 'Truss & Stands', 'Road Cases': 'Cases', 'Facades | Backdrops': 'Facades' };

export function createTemplates(ctx) {
  const { B, nav, cats, products, brands, blog, pages, home, assetVer, siteUrl } = ctx;
  const u = (p) => (p.startsWith('http') ? p : B + p);
  const stars = (n, count) => n ? `<span class="stars" aria-label="${n} out of 5 stars">${('<i>' + icon('star') + '</i>').repeat(5)}<b style="width:${(n / 5) * 100}%">${('<i>' + icon('star') + '</i>').repeat(5)}</b></span>${count ? `<span class="stars-count">(${count})</span>` : ''}` : '';

  const badge = (p) => {
    const out = [];
    if (!p.price) out.push('<span class="badge badge-muted">Discontinued</span>');
    else if (pct(p.price, p.was)) out.push(`<span class="badge badge-sale">Save ${pct(p.price, p.was)}%</span>`);
    if (p.price && /free/i.test(p.availability || '')) out.push('<span class="badge badge-ship">Free shipping</span>');
    return out.length ? `<div class="badges">${out.join('')}</div>` : '';
  };

  const cartPayload = (p) => ({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, image: imgSize(p.images[0], '320x320'), url: u(`/${p.slug}/`) });

  const card = (p, i = 0, opts = {}) => {
    if (!p) return '';
    const img = p.images[0]; const alt = p.images[1];
    const link = u(`/${p.slug}/`);
    const quick = !p.price ? '' : p.options.length
      ? `<a class="card-quick" href="${link}">Choose options</a>`
      : `<button class="card-quick" type="button" data-add="${jsonAttr(cartPayload(p))}">Add to bag</button>`;
    return `<article class="card ${opts.reveal === false ? '' : 'reveal'}" style="--i:${i % 12}">
  <div class="card-figure"><a class="card-media" href="${link}" tabindex="-1" aria-hidden="true">
    <img src="${esc(imgSize(img, '640x640'))}" srcset="${esc(srcset(img))}" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px" alt="" loading="lazy" decoding="async" width="640" height="640">
    ${alt ? `<img class="card-alt" src="${esc(imgSize(alt, '640x640'))}" alt="" loading="lazy" decoding="async" width="640" height="640">` : ''}
    ${badge(p)}
  </a>
  ${quick}</div>
  <div class="card-body">
    ${p.brand ? `<div class="card-brand">${esc(p.brand)}</div>` : ''}
    <h3 class="card-title"><a href="${link}">${esc(p.name)}</a></h3>
    ${p.rating ? `<div class="card-rating">${stars(p.rating, p.review_count)}</div>` : ''}
    <div class="card-price">${p.price ? `<span class="price">${money(p.price)}</span>${p.was && p.was > p.price ? `<s>${money(p.was)}</s>` : ''}` : '<span class="price price-muted">No longer available</span>'}</div>
  </div>
</article>`;
  };

  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${[{ name: 'Home', url: '/' }, ...items].map((c, i, a) => `<li>${i < a.length - 1 ? `<a href="${u(c.url)}">${esc(c.name)}</a>${icon('chevron-right')}` : `<span aria-current="page">${esc(c.name)}</span>`}</li>`).join('')}</ol></nav>`;

  // ------------------------------------------------------------ header / nav
  const megaFor = (item) => {
    if (!item.children || !item.children.length) return '';
    const cols = []; const loose = [];
    for (const ch of item.children) {
      if (ch.children && ch.children.length) cols.push(ch); else loose.push(ch);
    }
    const colHtml = cols.slice(0, 5).map((c) => `<div class="mega-col"><a class="mega-head" href="${u(c.url)}">${esc(c.name)}</a><ul>${c.children.slice(0, 8).map((s) => `<li><a href="${u(s.url)}">${esc(s.name)}</a></li>`).join('')}${c.children.length > 8 ? `<li><a class="mega-more" href="${u(c.url)}">View all ${esc(c.name)} ${icon('arrow-right')}</a></li>` : ''}</ul></div>`).join('');
    const looseHtml = loose.length ? `<div class="mega-col"><a class="mega-head" href="${u(item.url)}">${cols.length ? 'More ' + esc(item.name.split('|')[0].trim()) : 'Explore'}</a><ul>${loose.slice(0, 14).map((s) => `<li><a href="${u(s.url)}">${esc(s.name)}</a></li>`).join('')}</ul></div>` : '';
    const cat = cats[item.url];
    const feat = cat && cat.products.map((s) => products[s]).find((p) => p && p.images[0]);
    const featHtml = feat ? `<a class="mega-feature" href="${u(item.url)}"><img src="${esc(imgSize(feat.images[0], '640x640'))}" alt="" loading="lazy" decoding="async"><span><small>Shop all</small><strong>${esc(item.name)}</strong><em>${cat.products.length} products ${icon('arrow-right')}</em></span></a>` : '';
    return `<div class="mega" role="region" aria-label="${esc(item.name)} menu"><div class="container mega-inner"><div class="mega-cols">${colHtml}${looseHtml}</div>${featHtml}</div></div>`;
  };

  const header = () => `
<div class="announce" aria-label="Store announcements"><div class="container"><ul class="announce-track">
  <li>${icon('truck')} Free shipping on most U.S. orders over $299.99</li>
  <li>${icon('shield')} Every product factory-new and backed by manufacturer warranties</li>
  <li>${icon('headset')} 20+ years outfitting clubs, DJs, stages and venues</li>
</ul></div></div>
<header class="header" id="header">
  <div class="container header-inner">
    <button class="icon-btn nav-toggle" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false">${icon('menu')}</button>
    <a class="logo" href="${u('/')}" aria-label="Phantom Dynamics home">${LOGO_MARK}<span class="logo-text">Phantom<b>Dynamics</b></span></a>
    <nav class="nav" aria-label="Primary">
      <ul>${nav.map((n) => `<li class="nav-item${n.children ? ' has-mega' : ''}"><a href="${u(n.url)}">${esc(NAV_SHORT[n.name] || n.name.replace(/\s*\|\s*/g, ' & '))}</a>${megaFor(n)}</li>`).join('')}</ul>
    </nav>
    <div class="header-actions">
      <button class="icon-btn search-btn" type="button" aria-label="Search" data-open-search>${icon('search')}<span class="search-hint">Search<kbd>/</kbd></span></button>
      <a class="icon-btn" href="https://phantomdynamics.com/login.php" aria-label="Account">${icon('user')}</a>
      <button class="icon-btn cart-btn" type="button" aria-label="Open bag" data-open-cart>${icon('bag')}<span class="cart-count" data-cart-count hidden>0</span></button>
    </div>
  </div>
</header>`;

  // The mobile menu tree is built client-side from the desktop mega menu (see site.js) to keep pages light.
  const mobileNav = () => `<div class="mnav" id="mobile-nav" hidden><div class="mnav-backdrop" data-close-mnav></div><div class="mnav-panel" role="dialog" aria-label="Menu"><div class="mnav-head"><a class="logo" href="${u('/')}">${LOGO_MARK}<span class="logo-text">Phantom<b>Dynamics</b></span></a><button class="icon-btn" type="button" aria-label="Close menu" data-close-mnav>${icon('close')}</button></div><div class="mnav-body" data-mnav-body><div class="mnav-foot"><a href="${u('/brands/')}">Brands</a><a href="${u('/blog/')}">Articles</a><a href="${u('/about-us/')}">About</a><a href="${u('/contact/')}">Contact</a><a href="https://phantomdynamics.com/login.php">Account</a></div></div></div></div>`;

  const searchOverlay = () => `<div class="search" id="search" hidden><div class="search-backdrop" data-close-search></div><div class="search-panel" role="dialog" aria-label="Search the store"><form class="search-form" action="${u('/search/')}" method="get" role="search">${icon('search')}<input type="search" name="q" placeholder="Search lasers, moving heads, fog machines…" autocomplete="off" aria-label="Search" data-search-input><button class="icon-btn" type="button" aria-label="Close search" data-close-search>${icon('close')}</button></form><div class="search-results" data-search-results><div class="search-empty"><p class="eyebrow">Popular right now</p><div class="chips">${['Moving head', 'Laser', 'Fog machine', 'Mirror ball', 'UV black light', 'DMX controller', 'Truss', 'Speakers'].map((t) => `<button type="button" class="chip" data-search-suggest="${esc(t)}">${esc(t)}</button>`).join('')}</div></div></div></div></div>`;

  const cartDrawer = () => `<div class="drawer" id="cart-drawer" hidden><div class="drawer-backdrop" data-close-cart></div><aside class="drawer-panel" role="dialog" aria-label="Your bag"><div class="drawer-head"><h2>Your bag <span data-cart-count-inline></span></h2><button class="icon-btn" type="button" aria-label="Close bag" data-close-cart>${icon('close')}</button></div><div class="ship-progress" data-ship-progress><p data-ship-text>Add $299.99 for free shipping</p><div class="bar"><span></span></div></div><div class="drawer-body" data-cart-items></div><div class="drawer-foot"><div class="row"><span>Subtotal</span><strong data-cart-subtotal>$0.00</strong></div><p class="muted small">Shipping and taxes calculated at checkout.</p><button class="btn btn-primary btn-block" type="button" data-checkout>Checkout ${icon('arrow-right')}</button><a class="btn btn-ghost btn-block" href="${u('/cart/')}">View bag</a></div></aside></div>`;

  const footer = () => `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${u('/')}">${LOGO_MARK}<span class="logo-text">Phantom<b>Dynamics</b></span></a>
        <p>The internet's leading source for professional nightclub lighting, lasers, DJ equipment and audio for clubs, DJs, stages and special events.</p>
        <address>${icon('pin')} 1212 E US-2, Kalispell, MT 59901, USA</address>
      </div>
      <div class="footer-col"><h4>Shop</h4><ul>${nav.map((n) => `<li><a href="${u(n.url)}">${esc(n.name.replace(/\s*\|\s*/g, ' & '))}</a></li>`).join('')}<li><a href="${u('/brands/')}">All brands</a></li></ul></div>
      <div class="footer-col"><h4>Company</h4><ul><li><a href="${u('/about-us/')}">About us</a></li><li><a href="${u('/contact/')}">Contact</a></li><li><a href="${u('/blog/')}">Articles</a></li><li><a href="https://phantomdynamics.com/login.php">Account</a></li><li><a href="https://phantomdynamics.com/giftcertificates.php">Gift certificates</a></li></ul></div>
      <div class="footer-col"><h4>Help</h4><ul><li><a href="${u('/shipping-returns/')}">Shipping &amp; returns</a></li><li><a href="${u('/terms-conditions/')}">Terms &amp; conditions</a></li><li><a href="${u('/privacy-policy/')}">Privacy policy</a></li><li><a href="${u('/sitemap.xml')}">Sitemap</a></li></ul></div>
      <div class="footer-news"><h4>Stay in the loop</h4><p>New gear, deals and lighting know-how. No spam.</p><form class="news-form" action="https://phantomdynamics.com/subscribe.php" method="post"><input type="hidden" name="action" value="subscribe"><input type="hidden" name="check" value="1"><label class="sr-only" for="news-email">Email address</label><input id="news-email" name="nl_email" type="email" placeholder="you@example.com" required><button class="btn btn-primary" type="submit">Subscribe</button></form></div>
    </div>
    <div class="footer-bottom"><p>© ${new Date().getFullYear()} Phantom Dynamics · Nightclub Lighting · Lasers &amp; Sound</p><ul class="pay"><li>Visa</li><li>Mastercard</li><li>Amex</li><li>Discover</li><li>PayPal</li><li>Apple Pay</li></ul></div>
  </div>
</footer>`;

  // ------------------------------------------------------------ layout
  const layout = ({ title, description, body, path = '/', bodyClass = '', image, jsonld, noindex }) => `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(truncate(description || '', 160))}">
<meta name="theme-color" content="#0b0b10">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${esc(siteUrl + path)}">
<link rel="icon" href="${u('/assets/img/favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://cdn11.bigcommerce.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="${u('/assets/css/site.css')}?v=${assetVer}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Phantom Dynamics">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(truncate(description || '', 200))}">
<meta property="og:url" content="${esc(siteUrl + path)}">
${image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image">` : ''}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
<script>window.__PD={base:${JSON.stringify(B)},store:"https://phantomdynamics.com",freeShip:299.99,ver:${JSON.stringify(assetVer)}};</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
${header()}
<main id="main">
${body}
</main>
${footer()}
${mobileNav()}
${searchOverlay()}
${cartDrawer()}
<div class="toast-host" aria-live="polite"></div>
<script src="${u('/assets/js/site.js')}?v=${assetVer}" defer></script>
</body>
</html>`;

  // ------------------------------------------------------------ pages
  const sectionHead = (eyebrow, title, link, linkText = 'View all') => `<div class="section-head reveal"><div>${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h2>${title}</h2></div>${link ? `<a class="link-arrow" href="${u(link)}">${esc(linkText)} ${icon('arrow-right')}</a>` : ''}</div>`;

  const carousel = (items, id) => `<div class="carousel" data-carousel><button class="carousel-btn prev" type="button" aria-label="Scroll left">${icon('chevron-left')}</button><div class="carousel-track" id="${id}">${items.map((p, i) => card(p, i)).join('')}</div><button class="carousel-btn next" type="button" aria-label="Scroll right">${icon('chevron-right')}</button></div>`;

  const homePage = () => {
    const heroes = home.hero;
    const featured = home.featured.map((s) => products[s]).filter(Boolean);
    const popular = home.popular.map((s) => products[s]).filter(Boolean);
    const tiles = home.tiles;
    const posts = blog.slice(0, 3);
    const brandLogos = Object.values(brands).filter((b) => b.image && b.products.length).sort((a, b) => b.products.length - a.products.length).slice(0, 24);
    const totalProducts = Object.keys(products).length;
    const editorial = heroes.slice(1, 5);
    return layout({
      title: 'Phantom Dynamics | Nightclub Lighting, Lasers, DJ Equipment & Pro Audio',
      description: 'Industry leader in professional nightclub lighting, lasers, DJ sound, special effects and more. Free shipping on most U.S. orders over $299.99.',
      path: '/', bodyClass: 'is-home',
      image: heroes[0] && heroes[0].image,
      jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Phantom Dynamics', url: siteUrl, address: { '@type': 'PostalAddress', streetAddress: '1212 E US-2', addressLocality: 'Kalispell', addressRegion: 'MT', postalCode: '59901', addressCountry: 'US' } },
      body: `
<section class="hero">
  <div class="hero-bg" aria-hidden="true"><i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i><i class="beam"></i><i class="beam"></i><i class="beam"></i><i class="grain"></i></div>
  <div class="container hero-inner">
    <div class="hero-copy">
      <p class="eyebrow hero-eyebrow"><span class="dot"></span> ${totalProducts.toLocaleString()}+ products · ${Object.values(brands).filter((b) => b.products.length).length}+ brands · Ships next business day</p>
      <h1>Light up<br>the <span class="grad">night.</span></h1>
      <p class="lede">Professional lighting, lasers, fog and sound for clubs, DJs, stages and special events. Curated by people who've been doing this for 20+ years.</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="${u('/lighting/')}">Shop lighting ${icon('arrow-right')}</a>
        <a class="btn btn-glass btn-lg" href="${u('/lasers/')}">Explore lasers</a>
      </div>
      <ul class="hero-trust"><li>${icon('truck')} Free shipping over $299.99</li><li>${icon('shield')} Factory warranties</li><li>${icon('headset')} Real humans, 24h replies</li></ul>
    </div>
    <div class="hero-visual" data-parallax>
      ${heroes.slice(0, 3).map((h, i) => `<a class="hero-tile t${i + 1}" href="${u(h.url)}" style="--d:${i * 0.12}s"><img src="${esc(h.image)}" alt="${esc(h.title)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"><span>${esc(i === 0 ? 'Stage & club lighting' : h.title)} ${icon('arrow-up-right')}</span></a>`).join('')}
      <div class="hero-float f1">${icon('bolt')} <span>In stock &amp; ready to ship</span></div>
      <div class="hero-float f2">${icon('sparkles')} <span>New arrivals weekly</span></div>
    </div>
  </div>
  <div class="hero-scroll" aria-hidden="true"><span></span></div>
</section>

<section class="section section-tiles">
  <div class="container">
    ${sectionHead('Shop by category', 'Everything for the show.', '/lighting/', 'All categories')}
    <div class="bento">
      ${tiles.map((t, i) => `<a class="tile reveal${i === 0 ? ' tile-lg' : ''}" href="${u(t.url)}" style="--i:${i}"><div class="tile-media"><img src="${esc(t.image)}" alt="" loading="lazy" decoding="async"></div><div class="tile-body"><h3>${esc(t.title)}</h3><ul>${t.links.slice(0, 4).map((l) => `<li>${esc(l.name)}</li>`).join('')}</ul><span class="tile-cta">Shop now ${icon('arrow-right')}</span></div></a>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sectionHead('Featured', 'Hand-picked this week.', '/lighting/', 'Shop all')}
    ${carousel(featured, 'featured')}
  </div>
</section>

<section class="section section-editorial">
  ${editorial.map((h, i) => `<div class="container editorial reveal${i % 2 ? ' flip' : ''}"><div class="editorial-media"><img src="${esc(h.image)}" alt="${esc(h.title)}" loading="lazy" decoding="async"></div><div class="editorial-copy"><p class="eyebrow">${esc(['Stage & club', 'Glow', 'Lasers', 'DJ gear'][i] || 'Featured')}</p><h2>${esc(h.title)}</h2><p>${esc(h.text)}</p><a class="btn btn-primary" href="${u(h.url)}">${esc(h.cta.replace(/!$/, ''))} ${icon('arrow-right')}</a></div></div>`).join('')}
</section>

<section class="section stats dark">
  <div class="container">
    <ul class="stats-grid">
      <li class="reveal" style="--i:0"><strong data-count="20">0</strong><span>years serving pros</span></li>
      <li class="reveal" style="--i:1"><strong data-count="${totalProducts}">0</strong><span>products in the catalog</span></li>
      <li class="reveal" style="--i:2"><strong data-count="${Object.values(brands).filter((b) => b.products.length).length}">0</strong><span>brands we carry</span></li>
      <li class="reveal" style="--i:3"><strong data-count="24" data-suffix="h">0</strong><span>typical response time</span></li>
    </ul>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sectionHead('Most popular', 'What the pros keep buying.', '/lighting/', 'Shop all')}
    ${carousel(popular, 'popular')}
  </div>
</section>

<section class="section section-brands">
  <div class="container">${sectionHead('Brands', 'The names behind the shows.', '/brands/', 'All brands')}</div>
  <div class="marquee" data-marquee><div class="marquee-track">${[...brandLogos, ...brandLogos].map((b) => `<a class="marquee-item" href="${u(b.href)}" aria-label="${esc(b.name)}"><img src="${esc(b.image)}" alt="${esc(b.name)}" loading="lazy" decoding="async"></a>`).join('')}</div></div>
</section>

<section class="section">
  <div class="container">
    ${sectionHead('From the blog', 'Lighting know-how.', '/blog/', 'All articles')}
    <div class="posts">${posts.map((p, i) => postCard(p, i)).join('')}</div>
  </div>
</section>

<section class="section cta dark">
  <div class="container cta-inner reveal">
    <div><p class="eyebrow">Need help speccing a venue?</p><h2>Talk to a lighting expert.</h2><p>Tell us about your room, your budget and your vibe. We'll design a rig that hits.</p></div>
    <a class="btn btn-light btn-lg" href="${u('/contact/')}">Get in touch ${icon('arrow-right')}</a>
  </div>
</section>` });
  };

  const postCard = (p, i = 0) => `<article class="post reveal" style="--i:${i}"><a class="post-media" href="${u(`/blog/${p.slug}/`)}">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy" decoding="async">` : '<div class="post-ph"></div>'}</a><div class="post-body"><time datetime="${esc(p.iso_date)}">${esc(p.date)}</time><h3><a href="${u(`/blog/${p.slug}/`)}">${esc(p.title)}</a></h3><p>${esc(p.excerpt)}</p><a class="link-arrow" href="${u(`/blog/${p.slug}/`)}">Read article ${icon('arrow-right')}</a></div></article>`;

  // ------------------------------------------------------------ category
  const facetData = (list) => {
    const brandCount = {};
    let min = Infinity, max = 0;
    for (const p of list) { if (p.brand) brandCount[p.brand] = (brandCount[p.brand] || 0) + 1; if (p.price) { min = Math.min(min, p.price); max = Math.max(max, p.price); } }
    return { brands: Object.entries(brandCount).sort((a, b) => b[1] - a[1]), min: min === Infinity ? 0 : min, max };
  };

  const listing = ({ list, dataUrl, empty }) => {
    const f = facetData(list);
    const first = list.slice(0, 24);
    return `<div class="listing" data-listing data-src="${esc(dataUrl)}" data-total="${list.length}">
  <aside class="filters" id="filters">
    <div class="filters-head"><h2>Filters</h2><button class="icon-btn" type="button" aria-label="Close filters" data-close-filters>${icon('close')}</button></div>
    <div class="filter-group"><h3>Availability</h3><label class="check"><input type="checkbox" data-filter="instock"><span>In stock only</span></label><label class="check"><input type="checkbox" data-filter="sale"><span>On sale</span></label><label class="check"><input type="checkbox" data-filter="freeship"><span>Free shipping</span></label></div>
    <div class="filter-group"><h3>Price</h3><div class="price-range"><label><span>Min</span><input type="number" min="0" placeholder="${Math.floor(f.min)}" data-filter="min"></label><span class="dash">–</span><label><span>Max</span><input type="number" min="0" placeholder="${Math.ceil(f.max)}" data-filter="max"></label></div></div>
    ${f.brands.length > 1 ? `<div class="filter-group"><h3>Brand</h3><div class="filter-scroll">${f.brands.map(([b, n]) => `<label class="check"><input type="checkbox" data-filter="brand" value="${esc(b)}"><span>${esc(b)}</span><small>${n}</small></label>`).join('')}</div></div>` : ''}
    <button class="btn btn-ghost btn-block" type="button" data-clear-filters>Clear all</button>
  </aside>
  <div class="listing-main">
    <div class="toolbar">
      <p class="count"><span data-count>${list.length}</span> products</p>
      <div class="toolbar-right">
        <button class="btn btn-ghost btn-sm filters-toggle" type="button" data-open-filters>${icon('filter')} Filters</button>
        <label class="sort"><span>Sort</span><select data-sort><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name-asc">Name: A–Z</option><option value="rating">Top rated</option></select></label>
      </div>
    </div>
    <div class="active-filters" data-active-filters hidden></div>
    <div class="grid" data-grid>${first.map((p, i) => card(p, i)).join('')}</div>
    ${list.length ? '' : `<div class="empty"><p>${esc(empty || 'No products here yet.')}</p></div>`}
    <div class="load-more" data-load-more ${list.length > 24 ? '' : 'hidden'}><button class="btn btn-ghost" type="button">Load more</button><p class="muted small">Showing <span data-shown>${first.length}</span> of <span data-total-shown>${list.length}</span></p></div>
  </div>
</div>`;
  };

  const categoryPage = (cat) => {
    const list = cat.products.map((s) => products[s]).filter(Boolean);
    const subs = (cat.children || []).map((c) => cats[c.url] ? { ...c, count: cats[c.url].products.length } : c);
    const trail = cat.trail || [];
    return layout({
      title: `${cat.name} | Phantom Dynamics`, description: cat.blurb || cat.meta_description || `${cat.name} from Phantom Dynamics.`, path: cat.path, bodyClass: 'is-category',
      image: list[0] && list[0].images[0],
      jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: cat.name, url: siteUrl + cat.path },
      body: `
<section class="page-hero">
  <div class="container">
    ${crumbs([...trail, { name: cat.name, url: cat.path }])}
    <div class="page-hero-inner">
      <div><h1>${esc(cat.name)}</h1>${cat.blurb ? `<div class="page-hero-blurb prose">${cat.description}</div>` : ''}</div>
      ${list[0] ? `<div class="page-hero-art" aria-hidden="true">${list.slice(0, 3).map((p, i) => `<img src="${esc(imgSize(p.images[0], '320x320'))}" alt="" loading="lazy" style="--i:${i}">`).join('')}</div>` : ''}
    </div>
    ${subs.length ? `<div class="chips chips-scroll">${subs.map((s) => `<a class="chip" href="${u(s.url)}">${esc(s.name)}${s.count ? `<small>${s.count}</small>` : ''}</a>`).join('')}</div>` : ''}
  </div>
</section>
<section class="section section-tight"><div class="container">${listing({ list, dataUrl: u(cat.dataUrl) })}</div></section>` });
  };

  // ------------------------------------------------------------ brands
  const brandsPage = () => {
    const list = Object.values(brands).filter((b) => b.products.length).sort((a, b) => a.name.localeCompare(b.name));
    const groups = {};
    for (const b of list) { const k = /^[0-9]/.test(b.name) ? '0-9' : b.name[0].toUpperCase(); (groups[k] = groups[k] || []).push(b); }
    return layout({
      title: 'Brands | Phantom Dynamics', description: `Shop ${list.length} professional lighting, laser, audio and staging brands at Phantom Dynamics.`, path: '/brands/',
      body: `<section class="page-hero"><div class="container">${crumbs([{ name: 'Brands', url: '/brands/' }])}<h1>Brands</h1><p class="lede">${list.length} manufacturers we trust to light the room.</p><div class="chips chips-scroll">${Object.keys(groups).sort().map((k) => `<a class="chip" href="#brands-${esc(k)}">${esc(k)}</a>`).join('')}</div></div></section>
<section class="section section-tight"><div class="container">${Object.keys(groups).sort().map((k) => `<div class="brand-group" id="brands-${esc(k)}"><h2 class="brand-letter">${esc(k)}</h2><div class="brand-grid">${groups[k].map((b, i) => `<a class="brand-card reveal" href="${u(b.href)}" style="--i:${i % 8}"><div class="brand-logo">${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.name)}" loading="lazy" decoding="async">` : `<span>${esc(b.name)}</span>`}</div><div class="brand-meta"><strong>${esc(b.name)}</strong><small>${b.products.length} products</small></div></a>`).join('')}</div></div>`).join('')}</div></section>` });
  };

  const brandPage = (b) => {
    const list = b.products.map((s) => products[s]).filter(Boolean);
    return layout({
      title: `${b.name} | Phantom Dynamics`, description: b.meta_description || `Shop ${list.length} ${b.name} products at Phantom Dynamics.`, path: b.href, bodyClass: 'is-category',
      image: list[0] && list[0].images[0],
      body: `<section class="page-hero"><div class="container">${crumbs([{ name: 'Brands', url: '/brands/' }, { name: b.name, url: b.href }])}<div class="brand-hero">${b.image ? `<div class="brand-hero-logo"><img src="${esc(b.image)}" alt="${esc(b.name)}"></div>` : ''}<div><h1>${esc(b.name)}</h1><p class="lede">${list.length} products</p></div></div></div></section>
<section class="section section-tight"><div class="container">${listing({ list, dataUrl: u(b.dataUrl) })}</div></section>` });
  };

  // ------------------------------------------------------------ product
  const productPage = (p) => {
    const related = p.relatedProducts || [];
    const trail = p.crumbs && p.crumbs.length ? p.crumbs : (p.category ? [p.category] : []);
    const specs = p.details.filter(([k, v]) => v && !/^(upc)$/i.test(k) || (k === 'UPC' && v));
    const save = pct(p.price, p.was);
    const desc = p.description || `<p>${esc(p.meta_description || '')}</p>`;
    const payload = cartPayload(p);
    const discontinued = !p.price;
    const jsonld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, image: p.images, description: stripTags(desc).slice(0, 500), brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined, url: siteUrl + `/${p.slug}/` };
    if (p.price) jsonld.offers = { '@type': 'Offer', priceCurrency: 'USD', price: p.price, availability: p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: siteUrl + `/${p.slug}/` };
    if (p.rating) jsonld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.review_count };
    const shipLine = p.availability ? esc(p.availability) : 'Usually ships next business day';
    return layout({
      title: `${p.name}${p.brand ? ' | ' + p.brand : ''} | Phantom Dynamics`, description: p.meta_description || stripTags(desc), path: `/${p.slug}/`, bodyClass: 'is-product', image: p.images[0], jsonld,
      body: `
<section class="product">
  <div class="container">
    ${crumbs([...trail, { name: p.name, url: `/${p.slug}/` }])}
    <div class="product-grid">
      <div class="gallery" data-gallery>
        <div class="gallery-main"><div class="gallery-stage">${p.images.slice(0, 12).map((im, i) => `<img src="${esc(imgSize(im, '1280x1280'))}" srcset="${esc(srcset(im))}" sizes="(max-width: 900px) 100vw, 640px" alt="${esc(p.name)}${i ? ' – image ' + (i + 1) : ''}" class="${i ? '' : 'is-active'}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" data-index="${i}">`).join('')}</div>${badge(p)}<button class="gallery-zoom icon-btn" type="button" aria-label="Zoom image" data-zoom>${icon('zoom')}</button>${p.images.length > 1 ? `<button class="gallery-nav prev icon-btn" type="button" aria-label="Previous image" data-gallery-prev>${icon('chevron-left')}</button><button class="gallery-nav next icon-btn" type="button" aria-label="Next image" data-gallery-next>${icon('chevron-right')}</button>` : ''}</div>
        ${p.images.length > 1 ? `<div class="gallery-thumbs" role="tablist">${p.images.slice(0, 12).map((im, i) => `<button type="button" role="tab" aria-selected="${i ? 'false' : 'true'}" class="${i ? '' : 'is-active'}" data-thumb="${i}"><img src="${esc(imgSize(im, '320x320'))}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
      </div>
      <div class="buy" data-product="${jsonAttr(payload)}">
        ${p.brand ? `<a class="buy-brand" href="${u(p.brandHref || '/brands/')}">${esc(p.brand)}</a>` : ''}
        <h1>${esc(p.name)}</h1>
        <div class="buy-meta">${p.rating ? `<a href="#reviews">${stars(p.rating, p.review_count)}</a>` : `<a class="muted" href="#reviews">Be the first to review</a>`}${p.sku ? `<span class="muted">SKU ${esc(p.sku)}</span>` : ''}</div>
        <div class="buy-price">${discontinued ? '<span class="price price-muted">No longer available</span>' : `<span class="price">${money(p.price)}</span>${p.was && p.was > p.price ? `<s>${money(p.was)}</s><span class="badge badge-sale">Save ${save}%</span>` : ''}`}</div>
        ${!discontinued ? `<p class="buy-ship">${icon('truck')} <span>${shipLine}</span></p>` : '<p class="buy-ship muted">' + icon('info') + ' <span>This item has been discontinued by the manufacturer. Explore similar products below.</span></p>'}
        ${p.options.length ? `<div class="options">${p.options.map((o, oi) => `<div class="option"><label for="opt-${oi}">${esc(o.label)}</label>${o.choices.length <= 6 ? `<div class="swatches" role="radiogroup" id="opt-${oi}" data-option="${esc(o.label)}">${o.choices.map((c, ci) => `<button type="button" role="radio" aria-checked="${ci ? 'false' : 'true'}" class="swatch${ci ? '' : ' is-active'}" data-value="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : `<select id="opt-${oi}" data-option="${esc(o.label)}">${o.choices.map((c) => `<option>${esc(c)}</option>`).join('')}</select>`}</div>`).join('')}</div>` : ''}
        ${!discontinued ? `<div class="buy-row"><div class="qty" data-qty><button type="button" aria-label="Decrease quantity" data-qty-dec>${icon('minus')}</button><input type="number" value="1" min="1" max="99" aria-label="Quantity"><button type="button" aria-label="Increase quantity" data-qty-inc>${icon('plus')}</button></div><button class="btn btn-primary btn-lg btn-add" type="button" data-add-product>${icon('bag')} Add to bag</button></div>
        <a class="btn btn-ghost btn-block" href="https://phantomdynamics.com/cart.php?action=add&product_id=${esc(p.id)}" rel="noopener">Buy now on the secure store ${icon('external')}</a>` : ''}
        <ul class="buy-perks"><li>${icon('shield')} Factory-new, full manufacturer warranty</li><li>${icon('returns')} Easy returns · <a href="${u('/shipping-returns/')}">see policy</a></li><li>${icon('headset')} Questions? <a href="${u('/contact/')}">Ask a lighting expert</a></li></ul>
      </div>
    </div>
  </div>
</section>

<section class="section section-tight product-details">
  <div class="container">
    <div class="tabs" data-tabs><button type="button" class="is-active" data-tab="overview">Overview</button>${specs.length ? '<button type="button" data-tab="specs">Specs</button>' : ''}${p.videos.length ? `<button type="button" data-tab="videos">Videos <small>${p.videos.length}</small></button>` : ''}<button type="button" data-tab="reviews" id="reviews">Reviews${p.review_count ? ` <small>${p.review_count}</small>` : ''}</button></div>
    <div class="tab-panels">
      <div class="tab-panel is-active" data-panel="overview"><div class="prose prose-lg">${desc}</div></div>
      ${specs.length ? `<div class="tab-panel" data-panel="specs"><table class="specs">${specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}${p.brand ? `<tr><th>Brand</th><td>${esc(p.brand)}</td></tr>` : ''}</table></div>` : ''}
      ${p.videos.length ? `<div class="tab-panel" data-panel="videos"><div class="videos">${p.videos.slice(0, 6).map((v) => `<button type="button" class="video" data-video="${esc(v.id)}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span class="video-play">${icon('play')}</span><span class="video-title">${esc(v.title || 'Watch video')}</span></button>`).join('')}</div></div>` : ''}
      <div class="tab-panel" data-panel="reviews">${p.reviews.length ? `<div class="reviews">${p.reviews.map((r) => `<article class="review"><div class="review-head">${stars(r.rating)}<strong>${esc(r.title)}</strong></div><p>${esc(r.body)}</p><small>${esc(r.author)}</small></article>`).join('')}</div>` : '<div class="empty"><p>No reviews yet.</p></div>'}<a class="btn btn-ghost" href="https://phantomdynamics.com/${esc(p.slug)}/#write_review" rel="noopener">Write a review ${icon('external')}</a></div>
    </div>
  </div>
</section>

${related.length ? `<section class="section"><div class="container">${sectionHead('You may also like', 'Pairs well with this.', p.category ? p.category.url : null, p.category ? 'More ' + p.category.name : '')}${carousel(related, 'related')}</div></section>` : ''}
<div class="sticky-buy" data-sticky-buy hidden><div class="container"><div class="sticky-buy-inner"><img src="${esc(imgSize(p.images[0], '320x320'))}" alt=""><div><strong>${esc(truncate(p.name, 60))}</strong><span>${discontinued ? 'Discontinued' : money(p.price)}</span></div>${discontinued ? '' : `<button class="btn btn-primary" type="button" data-add-product>Add to bag</button>`}</div></div></div>` });
  };

  // ------------------------------------------------------------ blog
  const blogIndex = () => layout({
    title: 'Articles | Phantom Dynamics', description: 'Guides, comparisons and how-tos on nightclub lighting, lasers, fog and pro audio from Phantom Dynamics.', path: '/blog/',
    body: `<section class="page-hero"><div class="container">${crumbs([{ name: 'Articles', url: '/blog/' }])}<h1>Articles</h1><p class="lede">Lighting know-how from the people who install it.</p></div></section>
<section class="section section-tight"><div class="container"><div class="posts posts-grid">${blog.map((p, i) => postCard(p, i % 9)).join('')}</div></div></section>` });

  const postPage = (p, i) => {
    const more = blog.filter((x) => x.slug !== p.slug).slice(0, 3);
    const related = (p.related || []).map((sl) => products[sl]).filter(Boolean);
    return layout({
      title: `${p.title} | Phantom Dynamics`, description: p.meta_description || p.excerpt, path: `/blog/${p.slug}/`, image: p.cover, bodyClass: 'is-post',
      jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, datePublished: p.iso_date, image: p.cover, publisher: { '@type': 'Organization', name: 'Phantom Dynamics' } },
      body: `<article class="article"><header class="article-head"><div class="container container-narrow">${crumbs([{ name: 'Articles', url: '/blog/' }, { name: p.title, url: `/blog/${p.slug}/` }])}<time datetime="${esc(p.iso_date)}">${esc(p.date)}</time><h1>${esc(p.title)}</h1></div></header>${p.cover ? `<div class="container container-narrow"><figure class="article-cover reveal"><img src="${esc(p.cover)}" alt="" decoding="async"></figure></div>` : ''}<div class="container container-narrow"><div class="prose prose-lg article-body">${p.body}</div></div></article>
${related.length ? `<section class="section section-tight"><div class="container">${sectionHead('Products in this article', 'Gear mentioned above.', null)}${carousel(related, 'article-products')}</div></section>` : ''}
<section class="section"><div class="container">${sectionHead('Keep reading', 'More articles', '/blog/')}<div class="posts">${more.map((x, i) => postCard(x, i)).join('')}</div></div></section>` });
  };

  // ------------------------------------------------------------ static / utility pages
  const infoPage = (slug, pg) => layout({
    title: `${pg.title} | Phantom Dynamics`, description: pg.meta_description || stripTags(pg.html), path: `/${slug}/`,
    body: `<section class="page-hero"><div class="container container-narrow">${crumbs([{ name: pg.title, url: `/${slug}/` }])}<h1>${esc(pg.title)}</h1></div></section><section class="section section-tight"><div class="container container-narrow"><div class="prose prose-lg">${pg.html}</div></div></section>` });

  const contactPage = (pg) => layout({
    title: 'Contact | Phantom Dynamics', description: 'Questions about lighting, lasers or an order? Contact Phantom Dynamics. We reply within 24 hours.', path: '/contact/',
    body: `<section class="page-hero"><div class="container">${crumbs([{ name: 'Contact', url: '/contact/' }])}<h1>Let's talk lighting.</h1><p class="lede">We're happy to help with product questions, venue design or an existing order. We reply within 24 hours, usually much sooner.</p></div></section>
<section class="section section-tight"><div class="container contact-grid">
  <form class="contact-form card-panel reveal" action="https://phantomdynamics.com/pages.php?action=sendContactForm" method="post">
    <input type="hidden" name="page_id" value="4">
    <div class="field-row"><label class="field"><span>Full name</span><input name="contact_fullname" type="text" autocomplete="name" required></label><label class="field"><span>Phone</span><input name="contact_phone" type="tel" autocomplete="tel"></label></div>
    <div class="field-row"><label class="field"><span>Email</span><input name="contact_email" type="email" autocomplete="email" required></label><label class="field"><span>Order number <em>optional</em></span><input name="contact_orderno" type="text"></label></div>
    <label class="field"><span>How can we help?</span><textarea name="contact_question" rows="6" required></textarea></label>
    <button class="btn btn-primary btn-lg" type="submit">Send message ${icon('arrow-right')}</button>
    <p class="muted small">Submitting sends your message through our secure store. ${icon('shield', 'ic-inline')} We never share your details.</p>
  </form>
  <aside class="contact-aside reveal" style="--i:2">
    <div class="card-panel"><h3>${icon('pin')} Visit or ship</h3><p>Phantom Dynamics<br>1212 E US-2<br>Kalispell, MT 59901<br>USA</p></div>
    <div class="card-panel"><h3>${icon('headset')} Expert help</h3><p>Designing a rig for a club, bar, stage or event? Tell us about the room and we'll spec fixtures, control and power.</p></div>
    <div class="card-panel"><h3>${icon('truck')} Shipping</h3><p>Free shipping on most U.S. orders over $299.99. Most in-stock items ship the next business day.</p><a class="link-arrow" href="${u('/shipping-returns/')}">Shipping &amp; returns ${icon('arrow-right')}</a></div>
  </aside>
</div></section>` });

  const cartPage = () => layout({
    title: 'Your bag | Phantom Dynamics', description: 'Review the items in your bag.', path: '/cart/', noindex: true, bodyClass: 'is-cart',
    body: `<section class="page-hero"><div class="container">${crumbs([{ name: 'Your bag', url: '/cart/' }])}<h1>Your bag</h1></div></section><section class="section section-tight"><div class="container cart-page" data-cart-page><div class="cart-list" data-cart-items></div><aside class="cart-summary card-panel"><h2>Summary</h2><div class="ship-progress" data-ship-progress><p data-ship-text></p><div class="bar"><span></span></div></div><div class="row"><span>Subtotal</span><strong data-cart-subtotal>$0.00</strong></div><p class="muted small">Shipping and taxes calculated at checkout.</p><button class="btn btn-primary btn-lg btn-block" type="button" data-checkout>Checkout ${icon('arrow-right')}</button><a class="link-arrow" href="${u('/lighting/')}">Continue shopping ${icon('arrow-right')}</a></aside></div></section>` });

  const searchPage = () => layout({
    title: 'Search | Phantom Dynamics', description: 'Search the Phantom Dynamics catalog.', path: '/search/', noindex: true, bodyClass: 'is-search',
    body: `<section class="page-hero"><div class="container">${crumbs([{ name: 'Search', url: '/search/' }])}<h1>Search results<span class="muted" data-search-term></span></h1><form class="search-inline" action="${u('/search/')}" method="get" role="search">${icon('search')}<input type="search" name="q" placeholder="Search the catalog" aria-label="Search" data-search-page-input><button class="btn btn-primary" type="submit">Search</button></form></div></section><section class="section section-tight"><div class="container"><div class="toolbar"><p class="count"><span data-count>0</span> results</p></div><div class="grid" data-search-grid></div><div class="empty" data-search-empty hidden><p>No matches. Try a different spelling or browse the categories above.</p></div></div></section>` });

  const notFound = () => layout({
    title: 'Page not found | Phantom Dynamics', description: 'That page has moved or never existed.', path: '/404.html', noindex: true,
    body: `<section class="section notfound"><div class="container"><p class="eyebrow">404</p><h1>Lost in the fog.</h1><p class="lede">That page has moved or never existed. Let's get you back to the show.</p><div class="hero-cta"><a class="btn btn-primary btn-lg" href="${u('/')}">Back home</a><button class="btn btn-ghost btn-lg" type="button" data-open-search>Search the store</button></div></div></section>` });

  return { layout, card, homePage, categoryPage, brandsPage, brandPage, productPage, blogIndex, postPage, infoPage, contactPage, cartPage, searchPage, notFound };
}
