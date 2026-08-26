const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { listings: extraListings } = require('../data/sriLankaVendorsExtra');

const UA = 'WowWed/1.0 (educational wedding-planner project; sri-lanka vendor catalogue)';
const UPLOAD_DIR = path.join(__dirname, '../uploads/vendors');
const DOCS_DATASET = path.join(__dirname, '../../docs/vendor-dataset.json');
const DOCS_SQL = path.join(__dirname, '../../docs/sri_lanka_vendors_extra.sql');
const DESKTOP_DATASET = 'C:\\Users\\ASUS\\Desktop\\Vendors\\wowwed-dataset\\vendors.json';

function sqlEscape(value) {
  if (value == null) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('no url'));
    const getter = url.startsWith('http://') ? http.get : https.get;
    const req = getter(url, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
        timeout: 8000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
      file.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, timeout: 8000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        fetchJson(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, timeout: 8000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        fetchText(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

const usedImageKeys = new Set();

const CATEGORY_SEARCH = {
  'Venue & Res. Halls': ['Sri Lanka hotel exterior', 'Sri Lanka beach resort', 'Kandy hotel', 'Galle Fort hotel', 'Colombo hotel', 'Nuwara Eliya hotel', 'Sigiriya resort', 'Bentota beach hotel'],
  'Photography & Videography': ['Sri Lanka wedding photography', 'Kandyan wedding', 'bride Sri Lanka', 'wedding couple Sri Lanka', 'poruwa ceremony'],
  Jewellary: ['Sri Lankan jewellery', 'Kandyan jewellery', 'gold necklace Sri Lanka', 'sapphire jewellery Sri Lanka', 'bridal jewellery'],
  'Bridal Service': ['Kandyan bride', 'Sri Lankan bride', 'osariya', 'bridal makeup', 'wedding saree Sri Lanka'],
  'Groom service': ['Sri Lankan groom', 'nilame costume', 'wedding suit', 'Kandyan groom', 'groom sherwani'],
  'Floral & Deco': ['wedding flowers Sri Lanka', 'tropical bouquet', 'poruwa flowers', 'orchid wedding', 'frangipani wedding'],
  Caters: ['Sri Lankan buffet', 'rice and curry banquet', 'wedding catering', 'hotel buffet Sri Lanka'],
  Cakes: ['wedding cake', 'tiered wedding cake', 'white wedding cake', 'floral wedding cake', 'buttercream wedding cake'],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function commonsSearch(query, limit = 10) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url&iiurlwidth=1280`;
  const data = await fetchJson(url);
  const pages = data.query?.pages || {};
  return Object.values(pages)
    .map((page) => page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url)
    .filter((url) => url && !/\.svg(\?|#|$)/i.test(url));
}

async function commonsImage(listing) {
  const queries = [
    `${listing.name} Sri Lanka`,
    `${listing.name} ${listing.city || ''}`,
    `${listing.city || ''} ${listing.category} Sri Lanka`,
    ...(CATEGORY_SEARCH[listing.category] || ['Sri Lanka wedding']),
  ].filter((q) => q.trim().length > 6);

  for (const query of queries) {
    try {
      const urls = await commonsSearch(query, 12);
      await sleep(120);
      const unused = urls.find((url) => !usedImageKeys.has(url));
      if (unused) {
        usedImageKeys.add(unused);
        return unused;
      }
    } catch {
      /* try next query */
    }
  }
  return null;
}

const FILE_BY_ID = {
  'vw-90': 'Amangalla, Fort Galle, Sri Lanka, formerly the New Oriental Hotel.jpg',
  'vw-91': 'Akersloot Bastion, Galle Fort 2.jpg',
  'vw-93': 'Weligama Bay.jpg',
  'vw-94': 'Hambantota.jpg',
  'vw-100': 'Negombo beach.jpg',
  'vw-105': 'Uga Bay Hotel Entrance at Night.jpg',
  'vw-106': 'Amaya Beach Pasikudah.jpg',
  'vw-107': 'Habarana.jpg',
  'vw-113': 'Weligama.jpg',
  'vw-114': 'Kalutara.jpg',
};

function commonsFileUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1280`;
}

function isUsefulImage(url, title = '') {
  const text = `${url} ${title}`.toLowerCase();
  if (!url) return false;
  if (/\.svg(\?|#|$)/i.test(url)) return false;
  if (/flag of|logo|icon|red pog|commons-logo|question book|symbol category|coat of arms|map of the/.test(text)) return false;
  return true;
}

async function wikiPageImages(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=images&gimlimit=20&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=1280`;
  const data = await fetchJson(url);
  return Object.values(data.query?.pages || {})
    .map((page) => ({ url: page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url, title: page.title || '' }))
    .filter((item) => isUsefulImage(item.url, item.title))
    .map((item) => item.url);
}

let photoPool = [];

async function buildPhotoPool(log) {
  const pages = [
    'Pasikudah', 'Galle Fort', 'Weligama', 'Hambantota', 'Tangalle', 'Bentota',
    'Beruwala', 'Negombo', 'Kalutara', 'Habarana', 'Nuwara Eliya', 'Kandy',
    'Colombo', 'Mount Lavinia Hotel', 'Amangalla', 'Wedding photography',
    'Wedding cake', 'Jewellery', 'Floral design', 'Wedding dress',
    'Suit (clothing)', 'Bride', 'Buffet', 'Orchid', 'Plumeria', 'Gold',
    'Sapphire', 'Sri Lankan cuisine', 'Sigiriya',
  ];
  const collected = [];
  for (const page of pages) {
    try {
      collected.push(...await wikiPageImages(page));
      await sleep(80);
    } catch {
      /* skip page */
    }
  }
  photoPool = [...new Set(collected)].filter((url) => !usedImageKeys.has(url));
  log(`Photo pool ready: ${photoPool.length} unique Wikimedia images`);
}

function nextPoolImage() {
  while (photoPool.length) {
    const url = photoPool.shift();
    if (!usedImageKeys.has(url)) {
      usedImageKeys.add(url);
      return url;
    }
  }
  return null;
}

async function wikiThumb(title) {
  if (!title) return null;
  const clean = decodeURIComponent(String(title).replace(/%27/g, "'"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
  const data = await fetchJson(url);
  return data.originalimage?.source || data.thumbnail?.source || null;
}

async function ogImage(website) {
  if (!website) return null;
  const href = website.startsWith('http') ? website : `https://${website}`;
  const html = await fetchText(href);
  const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return match ? match[1] : null;
}

function hashFile(file) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

const usedHashes = new Set();

function clearDuplicateCovers(log) {
  const byHash = {};
  extraListings.forEach((listing) => {
    const file = path.join(UPLOAD_DIR, listing.id, 'cover.jpg');
    if (!fs.existsSync(file) || fs.statSync(file).size < 4000) return;
    const hash = hashFile(file);
    (byHash[hash] = byHash[hash] || []).push({ file, id: listing.id });
  });
  let removed = 0;
  Object.values(byHash).forEach((group) => {
    if (group.length < 2) {
      usedHashes.add(hashFile(group[0].file));
      return;
    }
    usedHashes.add(hashFile(group[0].file));
    group.slice(1).forEach((item) => {
      fs.unlinkSync(item.file);
      removed += 1;
    });
  });
  if (removed) log(`Removed ${removed} copied duplicate covers so each vendor can get its own photo`);
}

async function attachImage(listing, log) {
  const folder = path.join(UPLOAD_DIR, listing.id);
  fs.mkdirSync(folder, { recursive: true });
  const dest = path.join(folder, 'cover.jpg');
  if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) {
    usedHashes.add(hashFile(dest));
    return `/uploads/vendors/${listing.id}/cover.jpg`;
  }

  const tries = [];
  if (FILE_BY_ID[listing.id]) {
    tries.push(() => download(commonsFileUrl(FILE_BY_ID[listing.id]), dest));
  }
  if (listing.photoUrl) tries.push(() => download(listing.photoUrl, dest));
  if (listing.wiki) {
    tries.push(async () => {
      const url = await wikiThumb(listing.wiki);
      if (!url || usedImageKeys.has(url)) throw new Error('wiki image already used');
      usedImageKeys.add(url);
      return download(url, dest);
    });
  }
  tries.push(async () => {
    const url = nextPoolImage();
    if (!url) throw new Error('photo pool empty');
    return download(url, dest);
  });
  tries.push(async () => {
    const url = await commonsImage(listing);
    if (!url) throw new Error('no commons image');
    return download(url, dest);
  });

  for (const run of tries) {
    try {
      await run();
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 4000) continue;
      const hash = hashFile(dest);
      if (usedHashes.has(hash)) {
        fs.unlinkSync(dest);
        log(`    skipped reused photo for ${listing.id}`);
        continue;
      }
      usedHashes.add(hash);
      return `/uploads/vendors/${listing.id}/cover.jpg`;
    } catch (err) {
      log(`    image skip (${listing.id}): ${err.message}`);
    }
  }
  return null;
}

function portfolioFrom(listing, imageUrl) {
  return {
    images: imageUrl ? [imageUrl] : [],
    quotations: listing.quotations || [],
    quotationPdf: null,
    categories: listing.categories,
    districts: listing.districts,
    locations: listing.locations || [],
    phone: listing.phone || '',
    email: listing.email || '',
    website: listing.website || '',
    address: listing.address || '',
  };
}

function listingForDataset(listing, imageUrl) {
  const portfolio = portfolioFrom(listing, imageUrl);
  return {
    ...listing,
    portfolio: {
      images: portfolio.images,
      quotations: portfolio.quotations,
      quotationPdf: null,
      categories: portfolio.categories,
      districts: portfolio.districts,
    },
  };
}

function writeSql(listings) {
  const lines = [
    '-- Extra Sri Lankan vendors vw-66 to vw-200 (public web / Wikipedia / MyWed)',
    'USE wowwed;',
    '',
  ];
  listings.forEach((listing) => {
    const portfolio = listing.portfolio || portfolioFrom(listing, listing.portfolioImages?.[0]);
    lines.push(
      `INSERT INTO vendor_listings (id, name, category, city, district, price_range, description, portfolio_json, rating, spotlight, owner_email) VALUES (${sqlEscape(listing.id)}, ${sqlEscape(listing.name)}, ${sqlEscape(listing.category)}, ${sqlEscape(listing.city)}, ${sqlEscape(listing.district)}, ${sqlEscape(listing.priceRange)}, ${sqlEscape(listing.description)}, ${sqlEscape(JSON.stringify(portfolio))}, ${Number(listing.rating) || 4.5}, ${listing.spotlight ? 1 : 0}, ${sqlEscape(listing.email)}) ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), city=VALUES(city), district=VALUES(district), price_range=VALUES(price_range), description=VALUES(description), portfolio_json=VALUES(portfolio_json), rating=VALUES(rating), spotlight=VALUES(spotlight), owner_email=VALUES(owner_email);`,
    );
  });
  fs.writeFileSync(DOCS_SQL, `${lines.join('\n')}\n`);
}

function mergeDataset(extraForDataset, log) {
  const targets = [DOCS_DATASET];
  if (fs.existsSync(path.dirname(DESKTOP_DATASET))) targets.push(DESKTOP_DATASET);

  targets.forEach((file) => {
    if (!fs.existsSync(file)) return;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const kept = (data.listings || []).filter((item) => {
      const n = Number(String(item.id || '').replace('vw-', ''));
      return !(n >= 66 && n <= 200);
    });
    data.listings = [...kept, ...extraForDataset];
    data.count = data.listings.length;
    data.extraSource = 'Public Sri Lankan hotel sites, Wikipedia, MyWed photographers, jeweller/florist pages (2026)';
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    log(`  Dataset updated: ${file} (${data.count} listings)`);
  });
}

async function seedSriLankaVendors(connection, log = console.log) {
  log(`Seeding ${extraListings.length} extra Sri Lankan vendors (vw-66 onwards)…`);
  clearDuplicateCovers(log);
  await buildPhotoPool(log);
  const extraForDataset = [];
  let withImages = 0;

  for (const listing of extraListings) {
    const imageUrl = await attachImage(listing, log);
    if (imageUrl) withImages += 1;
    const portfolio = portfolioFrom(listing, imageUrl);
    extraForDataset.push(listingForDataset(listing, imageUrl));

    if (connection) {
      await connection.query(
        `INSERT INTO vendor_listings
          (id, name, category, city, district, price_range, description, portfolio_json, rating, spotlight, owner_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), category=VALUES(category), city=VALUES(city), district=VALUES(district),
           price_range=VALUES(price_range), description=VALUES(description), portfolio_json=VALUES(portfolio_json),
           rating=VALUES(rating), spotlight=VALUES(spotlight), owner_email=VALUES(owner_email)`,
        [
          listing.id,
          listing.name,
          listing.category,
          listing.city,
          listing.district,
          listing.priceRange,
          listing.description,
          JSON.stringify(portfolio),
          listing.rating || 4.5,
          listing.spotlight ? 1 : 0,
          listing.email || null,
        ],
      );
    }
    log(`  ${listing.id} ${listing.name}${imageUrl ? ' ✓ photo' : ''}`);
  }

  writeSql(extraForDataset);
  mergeDataset(extraForDataset, log);
  log(`Extra vendors ready: ${extraListings.length} listings, ${withImages} with photos`);
  return { ok: true, count: extraListings.length, withImages };
}

module.exports = { seedSriLankaVendors, extraListings };

if (require.main === module) {
  (async () => {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wowwed',
    });
    try {
      await seedSriLankaVendors(connection);
    } finally {
      await connection.end();
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
