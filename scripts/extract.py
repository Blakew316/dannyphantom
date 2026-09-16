#!/usr/bin/env python3
"""Extract structured store data from the captured BigCommerce HTML source.

Usage: python3 scripts/extract.py <path-to-phantomdynamics-site-source> <out-dir>
Produces JSON files consumed by build.js.
"""
import csv, json, os, re, sys, html
from multiprocessing import Pool
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup, Comment

SRC = sys.argv[1]
OUT = sys.argv[2]
SITE = os.path.join(SRC, 'site')
BASE = 'https://phantomdynamics.com'

def soup(path):
    with open(path, encoding='utf-8', errors='ignore') as f:
        return BeautifulSoup(f.read(), 'lxml')

def text(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)) if el else ''

def rel(url):
    """https://phantomdynamics.com/foo/bar/ -> /foo/bar/"""
    if not url: return url
    if url.startswith('http'):
        p = urlparse(url)
        if 'phantomdynamics.com' not in p.netloc: return url
        url = p.path + (('?' + p.query) if p.query else '')
    return url

def money(s):
    m = re.search(r'\$?([\d,]+\.\d{2})', s or '')
    return float(m.group(1).replace(',', '')) if m else None

def img_big(src):
    # normalise stencil image url to a large, consistent size
    if not src: return src
    src = re.sub(r'/images/stencil/[^/]+/', '/images/stencil/1280x1280/', src)
    return src

def clean_html(el):
    """Return sanitised inner HTML of a description block."""
    if el is None: return ''
    for bad in el.select('script, style, iframe, form, input, button, [data-content-region]'):
        bad.decompose()
    for c in el.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()
    for t in el.find_all(True):
        for a in list(t.attrs):
            if a in ('style', 'class', 'id', 'width', 'height', 'align', 'border', 'cellpadding', 'cellspacing', 'valign', 'bgcolor', 'data-mce-style', 'data-mce-src', 'face', 'size', 'color') or a.startswith('on'):
                del t.attrs[a]
        if t.name == 'a' and t.get('href'):
            t['href'] = rel(t['href'])
        if t.name == 'img':
            t['loading'] = 'lazy'
            if t.get('data-src'): t['src'] = t['data-src']; del t['data-src']
        if t.name == 'font': t.unwrap()
    out = ''.join(str(c) for c in el.contents)
    out = re.sub(r'<p>\s*(&nbsp;|\s)*</p>', '', out)
    out = re.sub(r'\n{3,}', '\n\n', out)
    return out.strip()

# ---------------------------------------------------------------- products
def parse_product(args):
    url, path = args
    try:
        s = soup(os.path.join(SITE, path))
    except Exception as e:
        return None
    pv = s.select_one('.productView')
    if not pv: return None
    ld = {}
    for sc in s.find_all('script', type='application/ld+json'):
        try:
            d = json.loads(sc.string or '')
            if d.get('@type') == 'Product': ld = d
        except Exception:
            pass
    slug = urlparse(url).path.strip('/')
    pid = None
    inp = pv.select_one('input[name=product_id]')
    if inp: pid = inp.get('value')
    name = text(pv.select_one('.productView-title')) or ld.get('name', '')
    brand_el = pv.select_one('.productView-brand a, .productView-brand')
    brand = text(brand_el) or (ld.get('brand') or {}).get('name', '')
    brand_url = rel(brand_el.get('href')) if brand_el and brand_el.name == 'a' else rel((ld.get('brand') or {}).get('url', ''))
    # prices
    price = None; was = None; rrp = None
    pe = pv.select_one('.productView-price')
    if pe:
        price = money(text(pe.select_one('[data-product-price-without-tax], .price--withoutTax')))
        was = money(text(pe.select_one('[data-product-non-sale-price-without-tax]')))
        rrp = money(text(pe.select_one('[data-product-rrp-price-without-tax]')))
    if price is None and ld.get('offers'):
        try: price = float(ld['offers'].get('price'))
        except Exception: pass
    # images
    images = []
    for a in pv.select('.productView-thumbnail-link'):
        u = a.get('data-image-gallery-new-image-url') or a.get('data-image-gallery-zoom-image-url') or a.get('href')
        if u and u.startswith('http') and u not in images: images.append(img_big(u))
    if not images:
        im = pv.select_one('.productView-image img')
        if im:
            u = im.get('data-src') or im.get('src')
            if u and 'loading.svg' not in u: images.append(img_big(u))
    if not images and ld.get('image'):
        images.append(img_big(ld['image'] if isinstance(ld['image'], str) else ld['image'][0]))
    # videos
    videos = []
    for a in s.select('.videoGallery-item a[data-video-id]'):
        vid = a.get('data-video-id')
        if vid and vid not in [v['id'] for v in videos]:
            videos.append({'id': vid, 'title': text(a.select_one('.video-title, .video-body')) or text(a)})
    # description
    desc_el = None
    for cand in s.select('.productView-description .productView-description, article.productView-description > div > .productView-description'):
        desc_el = cand; break
    if desc_el is None:
        art = s.select_one('article.productView-description')
        if art:
            # drop headings / additional details
            desc_el = art
            for h in art.select('h2.productView-title, .productView-info'): h.decompose()
    description = clean_html(desc_el)
    # custom fields / details
    details = []
    for dt, dd in zip(pv.select('.productView-info dt'), pv.select('.productView-info dd')):
        k = text(dt).rstrip(':'); v = text(dd)
        if v: details.append([k, v])
    # options
    options = []
    for f in pv.select('.productView-options .form-field'):
        label = text(f.select_one('.form-label'))
        if not label or label.lower().startswith('quantity'): continue
        label = re.sub(r'\s*Required$', '', label).rstrip(':').strip()
        choices = [text(o) for o in f.select('option') if o.get('value') not in (None, '')]
        if not choices:
            choices = [text(l) for l in f.select('.form-option, label.form-option') ]
        choices = [c for c in choices if c and not c.lower().startswith('choose')]
        if choices: options.append({'label': label, 'choices': choices})
    avail = text(pv.select_one('.productView-availability')).replace('Availability:', '').strip()
    # rating
    rating = None; review_count = 0
    r = pv.select_one('.productView-rating')
    if r:
        rating = len(r.select('.icon--ratingFull'))
        m = re.search(r'\((\d+) review', text(r))
        if m: review_count = int(m.group(1))
    if not review_count: rating = None
    reviews = []
    for li in s.select('.productReview')[:6]:
        reviews.append({
            'rating': len(li.select('.productReview-rating .icon--ratingFull')),
            'title': text(li.select_one('.productReview-title')),
            'author': text(li.select_one('.productReview-author')).replace('Posted by', '').strip(),
            'body': text(li.select_one('.productReview-body'))[:600],
        })
    # breadcrumbs -> category path
    crumbs = []
    for sc in s.find_all('script', type='application/ld+json'):
        try:
            d = json.loads(sc.string or '')
            if d.get('@type') == 'BreadcrumbList':
                for it in d['itemListElement']:
                    crumbs.append({'name': it['item']['name'], 'url': rel(it['item']['@id'])})
        except Exception: pass
    crumbs = [c for c in crumbs if c['url'] not in ('/', '/' + slug + '/')]
    related = []
    for a in s.select('.productCarousel .card-title a, .productGrid .card-title a'):
        h = rel(a.get('href')); sl = h.strip('/') if h else None
        if sl and sl != slug and sl not in related: related.append(sl)
    sku = ''; upc = ''; condition = ''; weight = ''
    for k, v in details:
        kl = k.lower()
        if kl == 'sku': sku = v
        elif kl == 'upc': upc = v
        elif kl == 'condition': condition = v
        elif kl == 'weight': weight = v
    if not sku: sku = ld.get('sku', '')
    free_ship = 'free shipping' in avail.lower() or 'free shipping' in s.get_text(' ').lower()[:0]
    return {
        'id': pid, 'slug': slug, 'name': name, 'brand': brand, 'brand_url': brand_url,
        'price': price, 'was': was, 'rrp': rrp,
        'images': images, 'videos': videos,
        'description': description, 'details': details, 'options': options,
        'availability': avail, 'in_stock': 'OutOfStock' not in json.dumps(ld.get('offers', {})),
        'rating': rating, 'review_count': review_count, 'reviews': reviews,
        'crumbs': crumbs, 'related': related[:8], 'sku': sku, 'upc': upc, 'condition': condition,
        'meta_description': (s.find('meta', attrs={'name': 'description'}) or {}).get('content', ''),
        'title': text(s.title),
    }

# ---------------------------------------------------------------- cards (category / brand listings)
def parse_cards(s):
    out = []
    for c in s.select('.productGrid .card, .productList .card'):
        a = c.select_one('.card-title a')
        if not a: continue
        h = rel(a.get('href'))
        imgs = c.select('.card-img-container img')
        img = None
        if imgs:
            u = imgs[0].get('data-src') or imgs[0].get('src')
            if u and u.startswith('http') and 'loading.svg' not in u: img = img_big(u)
        out.append({
            'slug': h.strip('/'), 'name': text(a), 'brand': text(c.select_one('.card-text--brand, [data-test-info-type=brandName]')),
            'price': money(text(c.select_one('.price--withoutTax, [data-product-price-without-tax]'))),
            'was': money(text(c.select_one('.price--non-sale'))), 'image': img,
        })
    return out

def parse_listing(args):
    """Category or brand page (any pagination page). Returns dict."""
    kind, url, path = args
    try: s = soup(os.path.join(SITE, path))
    except Exception: return None
    u = urlparse(url)
    key = u.path
    page = 1
    m = re.search(r'page=(\d+)', u.query)
    if m: page = int(m.group(1))
    d = {'kind': kind, 'path': key, 'page': page, 'cards': parse_cards(s)}
    if page == 1:
        d['name'] = text(s.select_one('h1.page-heading, h1'))
        d['title'] = text(s.title)
        d['meta_description'] = (s.find('meta', attrs={'name': 'description'}) or {}).get('content', '')
        short = s.select_one('.category-description')
        d['description'] = clean_html(short) if short else ''
        d['blurb'] = text(short)[:400] if short else ''
        d['subcategories'] = []
        seen = set()
        for a in s.select('.page-sidebar .navList a'):
            h = rel(a.get('href'))
            if h and h.startswith('/') and h != key and h not in seen:
                seen.add(h); d['subcategories'].append({'name': text(a), 'url': h})
        # brand logo
        im = s.select_one('.brand-image-container img, .page-heading img')
        if im:
            d['image'] = re.sub(r'/images/stencil/[^/]+/', '/images/stencil/320x320/', im.get('data-src') or im.get('src') or '')
        # sidebar nav for categories (children list)
        d['sidebar'] = []
        for a in s.select('.page-sidebar .navList a'):
            h = rel(a.get('href'))
            if h and h.startswith('/') and h != key:
                d['sidebar'].append({'name': text(a), 'url': h})
    return d

# ---------------------------------------------------------------- blog
def parse_post(args):
    url, path = args
    try: s = soup(os.path.join(SITE, path))
    except Exception: return None
    art = s.select_one('.blog')
    if not art: return None
    cover = art.select_one('.blog-cover-image img')
    cu = None
    if cover: cu = cover.get('data-src') or cover.get('src')
    body = art.select_one('.blog-post-body .blog-post') or art.select_one('.blog-post-body')
    related = []
    for a in art.select('.relatedProducts .card-title a'):
        h = rel(a.get('href')); sl = h.strip('/') if h else None
        if sl and sl not in related: related.append(sl)
    return {
        'related': related,
        'slug': urlparse(url).path.strip('/').split('/')[-1],
        'title': text(art.select_one('h1')),
        'date': text(art.select_one('.blog-date')),
        'cover': cu if cu and 'loading.svg' not in cu else None,
        'body': clean_html(body),
        'excerpt': text(body)[:220] + '…' if body else '',
        'meta_description': (s.find('meta', attrs={'name': 'description'}) or {}).get('content', ''),
        'tags': [text(a) for a in art.select('.tags a, .blog-post-tags a')],
    }

# ---------------------------------------------------------------- nav
def parse_nav(s):
    nav = s.select_one('.navPages').find('ul')
    def walk(ul):
        items = []
        for li in ul.find_all('li', recursive=False):
            a = li.find('a')
            if not a: continue
            name = text(a)
            if name.startswith('All '): continue
            node = {'name': name, 'url': rel(a.get('href')).rstrip('/') + '/'}
            sub = li.find('ul')
            if sub: node['children'] = walk(sub)
            items.append(node)
        return items
    return walk(nav)

def parse_home(s):
    home = {'hero': [], 'featured': [], 'popular': [], 'tiles': []}
    for sec in s.select('.heroStoryboard'):
        for a in sec.select('a'):
            img = a.select_one('img'); h = a.select_one('h1, h2')
            if img and h:
                home['hero'].append({'title': text(h), 'text': text(a.select_one('p')), 'cta': text(a.select_one('.button, .heroCarousel-action')) or 'Shop now',
                                     'url': rel(a.get('href')), 'image': (img.get('src') or img.get('data-src')).replace('/1280w/', '/original/')})
    for sec in s.select('.alternativeProducts'):
        heading = text(sec.select_one('.page-heading')).lower()
        slugs = []
        for a in sec.select('.card-title a'):
            sl = rel(a.get('href')).strip('/')
            if sl not in slugs: slugs.append(sl)
        if 'featured' in heading: home['featured'] = slugs
        elif 'popular' in heading: home['popular'] = slugs
    for tile in s.select('.pd-category-section .pd-category-card, .pd-category-section article, .pd-category-section li'):
        img = tile.select_one('img'); h = tile.select_one('h3')
        if not (img and h): continue
        links = [{'name': text(a), 'url': rel(a.get('href'))} for a in tile.select('a') if text(a) and not text(a).startswith('Shop')]
        cta = [a for a in tile.select('a') if text(a).startswith('Shop')]
        home['tiles'].append({'title': text(h), 'image': img.get('src') or img.get('data-src'), 'links': links[1:] if links and links[0]['name'] == text(h) else links,
                              'url': rel(cta[0].get('href')) if cta else (links[0]['url'] if links else '/')})
    return home

def main():
    os.makedirs(OUT, exist_ok=True)
    rows = list(csv.DictReader(open(os.path.join(SRC, 'manifest.csv'), encoding='utf-8')))
    rows = [r for r in rows if r['status'] == '200' and os.path.exists(os.path.join(SITE, r['file']))]
    prod_rows = [(r['url'], r['file']) for r in rows if r['kind'] == 'products']
    list_rows = [(r['kind'], r['url'], r['file']) for r in rows if r['kind'] in ('categories', 'brands', 'pagination')]
    post_rows = [(r['url'], r['file']) for r in rows if r['kind'] == 'news']
    with Pool(8) as pool:
        products = [p for p in pool.map(parse_product, prod_rows, chunksize=16) if p]
        listings = [l for l in pool.map(parse_listing, list_rows, chunksize=16) if l]
        posts = [p for p in pool.map(parse_post, post_rows, chunksize=8) if p]
    print('products', len(products), 'listings', len(listings), 'posts', len(posts))
    # merge pagination pages into their parent listing
    by_path = {}
    for l in sorted(listings, key=lambda x: (x['path'], x['page'])):
        if l['page'] == 1:
            by_path[l['path']] = l; l['products'] = [c['slug'] for c in l['cards']]; l['card_index'] = {c['slug']: c for c in l['cards']}
        elif l['path'] in by_path:
            p = by_path[l['path']]
            for c in l['cards']:
                if c['slug'] not in p['card_index']:
                    p['products'].append(c['slug']); p['card_index'][c['slug']] = c
    categories = {}; brands = {}
    prod_index = {p['slug']: p for p in products}
    for path, l in by_path.items():
        for c in l['cards']:
            # fill missing product data from cards
            pr = prod_index.get(c['slug'])
            if pr and not pr['images'] and c['image']: pr['images'] = [c['image']]
        entry = {k: l.get(k) for k in ('name', 'title', 'meta_description', 'description', 'blurb', 'subcategories', 'image', 'products', 'sidebar')}
        entry['path'] = path
        if l['kind'] == 'brands' or path.startswith('/brands/'):
            brands[path] = entry
        else:
            categories[path] = entry
    # brand pages: BigCommerce brand URLs are /<brand-slug>/ ; manifest kind 'brands' marks them.
    # Attach brand slug from product data
    for p in products:
        p['category_paths'] = [c['url'] for c in p['crumbs']]
    # home + nav
    s = soup(os.path.join(SITE, 'index.html'))
    nav = parse_nav(s); home = parse_home(s)
    # info pages
    pages = {}
    for pg in ('about-us', 'contact', 'shipping-returns', 'terms-conditions', 'privacy-policy'):
        f = os.path.join(SITE, pg, 'index.html')
        if os.path.exists(f):
            ps = soup(f)
            title = text(ps.select_one('h1')).title().replace('&Amp;', '&')
            el = ps.select_one('.page-content, .page')
            if el:
                for h in el.select('h1, form, .contact-form, .form'): h.decompose()
            pages[pg] = {'title': title, 'html': clean_html(el), 'meta_description': (ps.find('meta', attrs={'name': 'description'}) or {}).get('content', '')}
    # brand index (logos)
    bs = soup(os.path.join(SITE, 'brands', 'index.html'))
    brand_list = []
    for li in bs.select('li.brand'):
        a = li.select_one('.card-title a'); im = li.select_one('img')
        u = im.get('data-src') or im.get('src') if im else None
        if u and 'BrandDefault' in u: u = None
        if u: u = re.sub(r'/images/stencil/[^/]+/', '/images/stencil/320x320/', u)
        brand_list.append({'name': text(a), 'url': rel(a.get('href')), 'logo': u})
    for b in brand_list:
        e = brands.get(b['url'])
        if e:
            if not e.get('image') and b['logo']: e['image'] = b['logo']
        else:
            brands[b['url']] = {'name': b['name'], 'path': b['url'], 'image': b['logo'], 'products': [], 'description': ''}
    # count products per brand from product data
    for p in products:
        if p['brand_url'] and p['brand_url'] in brands and p['slug'] not in brands[p['brand_url']]['products']:
            brands[p['brand_url']]['products'].append(p['slug'])
    for c in categories.values(): c.pop('sidebar', None)
    for b in brands.values(): b.pop('sidebar', None); b.pop('subcategories', None)
    json.dump(products, open(os.path.join(OUT, 'products.json'), 'w'), ensure_ascii=False)
    json.dump(categories, open(os.path.join(OUT, 'categories.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(brands, open(os.path.join(OUT, 'brands.json'), 'w'), ensure_ascii=False, indent=1)
    from datetime import datetime
    def pdate(p):
        raw = re.sub(r'\s+', ' ', p['date']).strip()
        for fmt in ('%B %d, %Y, %I:%M %p', '%B %d, %Y, %I:%M%p', '%B %d, %Y'):
            try: return datetime.strptime(raw.replace(' pm', ' PM').replace(' am', ' AM'), fmt)
            except Exception: pass
        m = re.search(r'([A-Z][a-z]+) (\d{1,2}), (\d{4})', raw)
        if m:
            try: return datetime.strptime(' '.join(m.groups()), '%B %d %Y')
            except Exception: pass
        return datetime(1970, 1, 1)
    for p in posts:
        p['iso_date'] = pdate(p).strftime('%Y-%m-%d'); p['date'] = pdate(p).strftime('%B %-d, %Y')
    json.dump(sorted(posts, key=lambda p: p['iso_date'], reverse=True), open(os.path.join(OUT, 'blog.json'), 'w'), ensure_ascii=False)
    json.dump(pages, open(os.path.join(OUT, 'pages.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump({'nav': nav, 'home': home}, open(os.path.join(OUT, 'site.json'), 'w'), ensure_ascii=False, indent=1)
    print('categories', len(categories), 'brands', len(brands), 'pages', len(pages))

if __name__ == '__main__':
    main()
