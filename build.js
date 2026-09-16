#!/usr/bin/env node
// Static site build for the redesigned Phantom Dynamics storefront.
// Reads ./data/*.json (produced by scripts/extract.py) and writes a complete site to ./dist.
//   BASE_PATH=/dannyphantom node build.js   -> prefixes every internal URL (for GitHub Pages project sites)
//   SITE_URL=https://phantomdynamics.com    -> canonical / sitemap origin
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTemplates } from './lib/templates.js';
import { imgSize, hash, slugify } from './lib/util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const B = (process.env.BASE_PATH || '').replace(/\/$/, '');
const siteUrl = (process.env.SITE_URL || 'https://phantomdynamics.com').replace(/\/$/, '');
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

const assetVer = hash(fs.readFileSync(path.join(__dirname, 'src/css/site.css'), 'utf8') + fs.readFileSync(path.join(__dirname, 'src/js/site.js'), 'utf8')).slice(0, 8);
const T = createTemplates({ B, nav: site.nav, cats, products, brands, blog, pages, home: site.home, assetVer, siteUrl });

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
page('/blog/', T.blogIndex()); page('/articles/', T.blogIndex()); add('/blog/', 0.6);
blog.forEach((p, i) => { page(`/blog/${p.slug}/`, T.postPage(p, i)); add(`/blog/${p.slug}/`, 0.5); });
for (const [slug, pg] of Object.entries(pages)) { if (slug === 'contact') page('/contact/', T.contactPage(pg)); else page(`/${slug}/`, T.infoPage(slug, pg)); add(`/${slug}/`, 0.4); }
page('/cart/', T.cartPage());
page('/search/', T.searchPage());
write('404.html', T.notFound());

// search index
write('assets/data/search.json', JSON.stringify(productsArr.map(lite)));
write('assets/data/categories.json', JSON.stringify(Object.values(cats).map((c) => [c.name, c.path, c.products.length])));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((s) => `<url><loc>${s.loc}</loc><priority>${s.prio}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /cart/\nDisallow: /search/\nSitemap: ${siteUrl}/sitemap.xml\n`);
write('.nojekyll', '');

copyDir(path.join(__dirname, 'src/css'), path.join(OUT, 'assets/css'));
copyDir(path.join(__dirname, 'src/js'), path.join(OUT, 'assets/js'));
copyDir(path.join(__dirname, 'src/img'), path.join(OUT, 'assets/img'));

console.log(`Built ${written} files (${productsArr.length} products, ${Object.keys(cats).length} categories, ${Object.keys(brands).length} brands, ${blog.length} posts) in ${((Date.now() - t0) / 1000).toFixed(1)}s -> dist/`);
