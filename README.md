# Phantom Dynamics — redesigned storefront

A ground-up redesign of [phantomdynamics.com](https://phantomdynamics.com) as a fast, modern, Shopify-style storefront:
Apple-style typography, a cinematic animated hero, mega-menu navigation, instant search, a slide-out bag, faceted category
browsing and rich product pages — generated for the store's entire catalog (3,047 products, 191 categories, 45 brands,
60 articles) from the captured BigCommerce source.

No frameworks, no runtime dependencies. One Node script renders the whole site to static HTML in ~3 seconds.

## Quick start

```bash
npm run build     # renders ./dist (needs Node 18+)
npm run serve     # preview at http://localhost:4173
```

`npm run dev` does both.

## What's in the box

| Path | Purpose |
| --- | --- |
| `build.js` | Static site generator. Reads `data/*.json`, writes `dist/`. |
| `lib/templates.js` | All page templates (layout, home, category, product, brands, blog, info pages, cart, search, 404). |
| `lib/util.js` | Escaping, money formatting, image-size helpers. |
| `src/css/site.css` | The design system: tokens, components, animations, light + dark scheme. |
| `src/js/site.js` | Client runtime: bag, search, mega menu, filters/sort, gallery, tabs, reveal animations. |
| `data/` | Clean catalog JSON extracted from the captured site (products, categories, brands, blog, pages, home content). |
| `scripts/extract.py` | Re-creates `data/` from a `phantomdynamics-site-source/` capture (`npm run extract`). |
| `scripts/serve.js` | Zero-dependency preview server. |
| `.github/workflows/pages.yml` | Builds and deploys to GitHub Pages on push to `main`. |

## Design

- **Type**: Apple's system stack (`-apple-system, SF Pro, Helvetica Neue`) with Inter as the cross-platform fallback,
  tight tracking on headings, generous whitespace, pill buttons.
- **Look**: themed on the Phantom Dynamics neon-blue wordmark (`src/img/logo.webp`, dominant #3898f8). White ground,
  blue-tinted surfaces and blue accents only; no solid colour blocks, gradients bands or status pills. Respects
  `prefers-color-scheme: dark` and `prefers-reduced-motion`.
- **Motion**: staggered scroll-reveal, hover image swap and quick-add on product cards, parallax hero tiles, count-up stats,
  brand marquee, cross-document view transitions, drawer/overlay spring easing, toast confirmations.
- **Commerce UX**: sticky glass header, hover mega menus with featured tiles, ⌘K / `/` instant search with keyboard
  navigation, bag drawer with a free-shipping progress bar, sticky mobile buy bar, client-side filters (brand, price,
  availability, sale, free shipping), sort, load-more, product gallery with zoom + swipe, spec table, YouTube videos, reviews.

## Conversion and SEO features

- **Internal links**: "Explore more" blocks on every category, brand, product, article and utility page; mega menu, footer and breadcrumbs everywhere.
- **Breadcrumbs** with `BreadcrumbList` structured data on every page below the home page.
- **FAQ**: five questions answered from the published policies at `/faq/` (with `FAQPage` structured data) and on the home page.
- **Response-time promise** ("a real person replies within 24 hours") on the home page, contact, FAQ, thank-you, product perks and footer.
- **Thank-you page** at `/contact/thank-you/`: the contact form posts to the store's endpoint in the background, then lands here.
- **Sticky mobile call to action** (Ask an expert / Shop lighting) on every page; product pages use the sticky buy bar instead.
- **Real customer reviews**: 70 written reviews pulled from the product pages, shown on the home page and at `/reviews/`, and on each product.
- **Unique titles and meta descriptions** for all 3,300+ pages, generated from category, brand and product data and de-duplicated.
- **Alt text** on every image (product name, category, brand, article).
- **Google Analytics 4**: set `GA_MEASUREMENT_ID=G-XXXXXXXXXX` when building (or edit the default in `build.js`).
  Events sent: `view_item`, `add_to_cart`, `begin_checkout`, `search`, `generate_lead`.
- **Custom 404** with search and popular categories; `robots.txt` and `sitemap.xml` generated; privacy policy includes an analytics section.

## URL structure

Paths match the current site so it can be a drop-in: `/<product-slug>/`, `/lighting/blacklights/`, `/blog/<slug>/`,
`/about-us/`, `/contact/`, `/shipping-returns/`, `/terms-conditions/`, `/privacy-policy/`. Brand pages live at
`/brands/<slug>/`. `sitemap.xml`, `robots.txt` and `404.html` are generated.

## Deploying

- **GitHub Pages**: enable Pages (Settings → Pages → Source: *GitHub Actions*) and push to `main`. The workflow sets
  `BASE_PATH=/<repo>` so links work under the project sub-path.
- **Any static host / own domain**: `node build.js` and upload `dist/`. Set `SITE_URL` for canonical URLs:
  `SITE_URL=https://phantomdynamics.com node build.js`.

## What is wired to the live store

Product images and brand logos are served from the store's existing BigCommerce CDN, so nothing needs re-uploading.
The following hand off to the live store today and are the integration points if you move platforms:

- **Checkout**: the bag lives in the browser (`localStorage`); *Checkout* / *Buy now* add the item to the secure
  BigCommerce cart (`cart.php?action=add&product_id=…`). For a multi-item handoff, connect the bag to the
  BigCommerce Storefront Cart API (same-origin) or the Shopify Storefront API.
- **Account**, **write a review**, **gift certificates**: link to the existing BigCommerce pages.
- **Contact form** and **newsletter**: post to the store's existing endpoints (`pages.php?action=sendContactForm`,
  `subscribe.php`).

## Refreshing the catalog

Drop a fresh capture in `./phantomdynamics-site-source/` (the folder produced by the capture tools) and run
`npm run extract && npm run build`. The extractor needs Python 3 with `beautifulsoup4` and `lxml`.
