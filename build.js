#!/usr/bin/env node
// Static site build for the redesigned Phantom Dynamics storefront.
// Reads ./data/*.json (produced by scripts/extract.py) and writes a complete site to ./dist.
//   BASE_PATH=/dannyphantom node build.js   -> prefixes every internal URL (for GitHub Pages project sites)
//   SITE_URL=https://phantomdynamics.com    -> canonical / sitemap origin
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTemplates } from './lib/templates.js';
import { imgSize, hash, slugify, stripTags, truncate } from './lib/util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const B = (process.env.BASE_PATH || '').replace(/\/$/, '');
const siteUrl = (process.env.SITE_URL || 'https://phantomdynamics.com').replace(/\/$/, '');
// Google Analytics 4 measurement ID. Replace the placeholder or set GA_MEASUREMENT_ID=G-XXXXXXX at build time.
const GA_ID = process.env.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
const OUT = path.join(__dirname, 'dist');
const t0 = Date.now();

const read = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8'));
const productsArr = read('products.json');
const cats = read('categories.json');
const brandsRaw = read('brands.json');
const blog = read('blog.json');
const pages = read('pages.json');
const site = read('site.json');

// ----------------------------------------------------------------- catalog prep
const products = {};
for (const p of productsArr) { p.options = p.options || []; p.details = p.details || []; p.reviews = p.reviews || []; p.videos = p.videos || []; products[p.slug] = p; }

// Brands: keep those with products; give each a clean /brands/<slug>/ URL.
const brands = {};
for (const [pathKey, b] of Object.entries(brandsRaw)) {
  if (!b.products || !b.products.length || pathKey === '/brands/') continue;
  const slug = slugify(pathKey.replace(/\//g, '')) || slugify(b.name);
  b.slug = slug; b.href = `/brands/${slug}/`; b.dataUrl = `/assets/data/b/${slug}.json`;
  b.products = b.products.filter((s) => products[s]);
  brands[pathKey] = b;
}
for (const p of productsArr) {
  const b = brands[p.brand_url];
  if (b) p.brandHref = b.href;
}

// Categories: hierarchy from the mega-menu tree, falling back to each page's sidebar list.
const parentOf = {}; const childrenOf = {};
const walk = (items, parent) => {
  for (const n of items) {
    n.url = n.url.replace(/\/?$/, '/');
    if (parent) { parentOf[n.url] = parentOf[n.url] || parent; (childrenOf[parent] = childrenOf[parent] || []).push({ name: n.name, url: n.url }); }
    if (n.children) walk(n.children, n.url);
  }
};
walk(site.nav, null);
for (const [p, c] of Object.entries(cats)) {
  const kids = childrenOf[p] || [];
  const seen = new Set(kids.map((k) => k.url));
  for (const s of c.subcategories || []) if (cats[s.url] && !seen.has(s.url) && s.url !== p) { kids.push(s); seen.add(s.url); parentOf[s.url] = parentOf[s.url] || p; }
  childrenOf[p] = kids;
}
for (const [p, c] of Object.entries(cats)) {
  c.path = p; c.children = childrenOf[p] || [];
  const trail = []; let cur = parentOf[p]; let guard = 0;
  while (cur && cats[cur] && guard++ < 6) { trail.unshift({ name: cats[cur].name, url: cur }); cur = parentOf[cur]; }
  c.trail = trail;
  c.dataUrl = `/assets/data/c/${slugify(p) || 'root'}.json`;
  c.products = (c.products || []).filter((s) => products[s]);
}
// Product -> primary category (deepest breadcrumb, else first listing that contains it)
const listingOf = {};
for (const [p, c] of Object.entries(cats)) for (const s of c.products) (listingOf[s] = listingOf[s] || []).push(p);
for (const p of productsArr) {
  const crumbCats = (p.crumbs || []).filter((c) => cats[c.url]);
  p.crumbs = crumbCats;
  if (crumbCats.length) p.category = crumbCats[crumbCats.length - 1];
  else if (listingOf[p.slug]) { const deepest = listingOf[p.slug].sort((a, b) => (cats[b].trail.length - cats[a].trail.length))[0]; p.category = { name: cats[deepest].name, url: deepest }; p.crumbs = [...cats[deepest].trail, p.category]; }
  const rel = (p.related || []).map((s) => products[s]).filter((x) => x && x.slug !== p.slug);
  if (rel.length < 4 && p.category && cats[p.category.url]) {
    for (const s of cats[p.category.url].products) { if (rel.length >= 8) break; const x = products[s]; if (x && x.slug !== p.slug && !rel.includes(x) && x.price) rel.push(x); }
  }
  p.relatedProducts = rel.slice(0, 8);
}

// Unique titles and meta descriptions for every page.
const SHIP_LINE = 'Free shipping on most U.S. orders over $299.99 and in-stock gear ships the next business day.';
const clean = (s) => stripTags(s || '').replace(/\s+/g, ' ').trim();
for (const c of Object.values(cats)) {
  const parent = c.trail[c.trail.length - 1];
  c.seoTitle = `${c.name}${parent ? ' – ' + parent.name.replace(/\s*\|\s*/g, ' & ') : ''} | Phantom Dynamics`;
  const topBrands = Object.entries(c.products.reduce((m, s) => { const bnm = products[s].brand; if (bnm) m[bnm] = (m[bnm] || 0) + 1; return m; }, {})).sort((a, d) => d[1] - a[1]).slice(0, 3).map((x) => x[0]);
  const blurb = clean(c.blurb).replace(/\s*-\s*Read More!?$/i, '');
  const lead = `Shop ${c.products.length} ${c.name.toLowerCase()} products${topBrands.length ? ' from ' + topBrands.join(', ') : ''} at Phantom Dynamics.`;
  c.seoDescription = truncate(blurb ? `${lead} ${blurb}` : `${lead} ${SHIP_LINE}`, 158);
}
for (const p of productsArr) {
  p.seoTitle = `${p.name}${p.brand && !p.name.toLowerCase().includes(p.brand.toLowerCase()) ? ' by ' + p.brand : ''}${p.sku ? ' (' + p.sku + ')' : ''} | Phantom Dynamics`;
  const body = clean(p.description);
  p.seoDescription = truncate(p.meta_description && p.meta_description.length > 40 ? p.meta_description : (body.length > 40 ? body : `${p.name} from ${p.brand || 'Phantom Dynamics'}. ${SHIP_LINE}`), 158);
}
// De-duplicate titles and descriptions across products that share a name or manufacturer copy.
const seenTitle = new Map(); const seenDesc = new Map();
for (const p of productsArr) {
  if (seenTitle.has(p.seoTitle)) { const n = seenTitle.get(p.seoTitle) + 1; seenTitle.set(p.seoTitle, n); p.seoTitle = `${p.name}${p.category ? ' – ' + p.category.name : ''} #${n} | Phantom Dynamics`; } else seenTitle.set(p.seoTitle, 1);
  if (seenDesc.has(p.seoDescription)) p.seoDescription = truncate(`${p.name}: ${p.seoDescription}`, 158);
  if (seenDesc.has(p.seoDescription)) p.seoDescription = truncate(`${p.name} (${p.sku || p.slug}): ${p.seoDescription}`, 158);
  seenDesc.set(p.seoDescription, 1);
}
// Real customer reviews pulled from the product pages (only reviews with a written body).
const reviews = [];
for (const p of productsArr) for (const r of p.reviews) {
  if (!r.body || r.body.length < 30) continue;
  const m = /Published by\s+(.+?)\s+on\s+(.+)$/i.exec(r.author || '');
  let author = m ? m[1] : (r.author || '').replace(/^Published by\s+/i, '');
  let date = m ? m[2].replace(/,\s*\d{1,2}:\d{2}\s*[ap]m$/i, '') : '';
  if (!author || /^unknown$/i.test(author)) author = 'Verified customer';
  reviews.push({ slug: p.slug, product: p.name, brand: p.brand, image: p.images[0], rating: r.rating, title: r.title || 'Review', author, date, body: r.body });
}
reviews.sort((a, b) => (b.rating - a.rating) || (b.body.length - a.body.length));

const assetVer = hash(fs.readFileSync(path.join(__dirname, 'src/css/site.css'), 'utf8') + fs.readFileSync(path.join(__dirname, 'src/js/site.js'), 'utf8')).slice(0, 8);
const T = createTemplates({ B, nav: site.nav, cats, products, brands, blog, pages, home: site.home, assetVer, siteUrl, reviews, gaId: GA_ID });

// ----------------------------------------------------------------- output helpers
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let written = 0;
const write = (rel, content) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); written++; };
const page = (urlPath, html) => write(path.join(urlPath.replace(/^\//, ''), 'index.html'), html);
const copyDir = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name); e.isDirectory() ? copyDir(a, b) : (fs.copyFileSync(a, b), written++); } };

// Compact product record used by client-side listing, filtering and search.
const lite = (p) => [p.slug, p.name, p.brand || '', p.price || 0, p.was || 0, p.images[0] ? imgSize(p.images[0], '640x640') : '', p.images[1] ? imgSize(p.images[1], '640x640') : '', p.rating || 0, p.review_count || 0, /free/i.test(p.availability || '') ? 1 : 0, p.options.length ? 1 : 0, p.id, p.in_stock ? 1 : 0, p.category ? p.category.name : ''];

// ----------------------------------------------------------------- render
const sitemap = [];
const add = (p, prio = 0.6) => sitemap.push({ loc: siteUrl + p, prio });

page('/', T.homePage()); add('/', 1.0);
for (const c of Object.values(cats)) { page(c.path, T.categoryPage(c)); write(c.dataUrl.replace(/^\//, ''), JSON.stringify(c.products.map((s) => lite(products[s])))); add(c.path, 0.8); }
for (const p of productsArr) { page(`/${p.slug}/`, T.productPage(p)); add(`/${p.slug}/`, 0.7); }
page('/brands/', T.brandsPage()); add('/brands/', 0.7);
for (const b of Object.values(brands)) { page(b.href, T.brandPage(b)); write(b.dataUrl.replace(/^\//, ''), JSON.stringify(b.products.map((s) => lite(products[s])))); add(b.href, 0.6); }
page('/blog/', T.blogIndex());
// Legacy /articles/ URL redirects to the blog index.
page('/articles/', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Articles | Phantom Dynamics</title><link rel="canonical" href="${siteUrl}/blog/"><meta http-equiv="refresh" content="0; url=${B}/blog/"><meta name="robots" content="noindex"></head><body><p>The articles moved to <a href="${B}/blog/">${siteUrl}/blog/</a>.</p></body></html>`); add('/blog/', 0.6);
blog.forEach((p, i) => { page(`/blog/${p.slug}/`, T.postPage(p, i)); add(`/blog/${p.slug}/`, 0.5); });
for (const [slug, pg] of Object.entries(pages)) { if (slug === 'contact') page('/contact/', T.contactPage(pg)); else page(`/${slug}/`, T.infoPage(slug, pg)); add(`/${slug}/`, 0.4); }
page('/contact/thank-you/', T.thankYouPage());
page('/faq/', T.faqPage()); add('/faq/', 0.6);
page('/reviews/', T.reviewsPage()); add('/reviews/', 0.6);
page('/cart/', T.cartPage());
page('/search/', T.searchPage());
write('404.html', T.notFound());

// search index
write('assets/data/search.json', JSON.stringify(productsArr.map(lite)));
write('assets/data/categories.json', JSON.stringify(Object.values(cats).map((c) => [c.name, c.path, c.products.length])));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((s) => `<url><loc>${s.loc}</loc><priority>${s.prio}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /cart/\nDisallow: /search/\nDisallow: /contact/thank-you/\nSitemap: ${siteUrl}/sitemap.xml\n`);
write('.nojekyll', '');

copyDir(path.join(__dirname, 'src/css'), path.join(OUT, 'assets/css'));
copyDir(path.join(__dirname, 'src/js'), path.join(OUT, 'assets/js'));
copyDir(path.join(__dirname, 'src/img'), path.join(OUT, 'assets/img'));

console.log(`Built ${written} files (${reviews.length} customer reviews) (${productsArr.length} products, ${Object.keys(cats).length} categories, ${Object.keys(brands).length} brands, ${blog.length} posts) in ${((Date.now() - t0) / 1000).toFixed(1)}s -> dist/`);
