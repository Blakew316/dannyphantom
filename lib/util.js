// Shared helpers for the static build.
export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const attr = esc;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n) => (n == null ? '' : usd.format(n));

export const pct = (price, was) => (was && price && was > price) ? Math.round((1 - price / was) * 100) : 0;

/** Rewrite a BigCommerce stencil image URL to a given size, e.g. size('...','640x640'). */
export const imgSize = (u, size) => (u ? u.replace(/\/images\/stencil\/[^/]+\//, `/images/stencil/${size}/`) : u);

/** srcset for a product image (square stencil sizes). */
export const srcset = (u) => u ? [320, 640, 960, 1280].map((w) => `${imgSize(u, `${w}x${w}`)} ${w}w`).join(', ') : '';

export const slugify = (s = '') => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const stripTags = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export const truncate = (s = '', n = 160) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const uniq = (arr) => [...new Set(arr)];

/** Simple stable hash for cache-busting. */
export const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };

export const jsonAttr = (o) => esc(JSON.stringify(o));
