const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SOURCE_DIR = process.env.WOWWED_VENDORS_DIR || 'C:\\Users\\ASUS\\Desktop\\Vendors';
const DATA_FILE = path.join(SOURCE_DIR, 'wowwed-dataset', 'vendors.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads/vendors');
const EXTRACT_SCRIPT = path.join(__dirname, 'extract_pdf_previews.py');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const PDF_PAGES = 6;

const PLACE_DISTRICT = {
  Avissawella: 'Colombo',
  Battaramulla: 'Colombo',
  Bolgoda: 'Kalutara',
  Colombo: 'Colombo',
  'Colombo 02': 'Colombo',
  Dambokka: 'Kurunegala',
  Dehiwala: 'Colombo',
  Ganemulla: 'Gampaha',
  Galle: 'Galle',
  Homagama: 'Colombo',
  Hungama: 'Hambantota',
  JaEla: 'Gampaha',
  'Ja-Ela': 'Gampaha',
  Kadawatha: 'Gampaha',
  Kalutara: 'Kalutara',
  Kandy: 'Kandy',
  Katana: 'Gampaha',
  Katunayake: 'Gampaha',
  Kelaniya: 'Gampaha',
  Kiribathgoda: 'Gampaha',
  Kiriberiya: 'Kalutara',
  Kotte: 'Colombo',
  Kurunegala: 'Kurunegala',
  Mahara: 'Gampaha',
  Malabe: 'Colombo',
  Matara: 'Matara',
  Meegoda: 'Colombo',
  Moratuwa: 'Colombo',
  Negombo: 'Gampaha',
  Nugegoda: 'Colombo',
  Panadura: 'Kalutara',
  Panagoda: 'Colombo',
  Pannipitiya: 'Colombo',
  Pitakotte: 'Colombo',
  Ragama: 'Gampaha',
  Rawathawatta: 'Colombo',
  Seethawaka: 'Colombo',
  Wadduwa: 'Kalutara',
  Waskaduwa: 'Kalutara',
  Wattala: 'Gampaha',
  Welisara: 'Gampaha',
  Yakkala: 'Gampaha',
};

const EXTRA_LOCATIONS = {
  'vw-12': [
    loc('Prince Hall', 'Colombo', 'Colombo', 'hall'),
    loc('Anjelo Hall', 'Colombo', 'Colombo', 'hall'),
  ],
  'vw-30': [
    loc('Pannipitiya studio', 'Pannipitiya', 'Colombo', 'branch'),
    loc('Meegoda studio', 'Meegoda', 'Colombo', 'branch'),
  ],
  'vw-34': [
    loc('Emerald Banquet', 'Kelaniya', 'Gampaha', 'hall'),
    loc('Gold Banquet', 'Kelaniya', 'Gampaha', 'hall'),
    loc('Crystal Banquet', 'Kelaniya', 'Gampaha', 'hall'),
  ],
  'vw-36': [
    loc('Grand Ballroom (400 pax)', 'Avissawella', 'Colombo', 'hall'),
    loc('Diamond Ballroom (250 pax)', 'Avissawella', 'Colombo', 'hall'),
    loc('Golden Court (50 pax)', 'Avissawella', 'Colombo', 'hall'),
    loc('Kings Pool Side (75 pax)', 'Avissawella', 'Colombo', 'hall'),
    loc('Outdoor garden / pool (200 pax)', 'Avissawella', 'Colombo', 'hall'),
  ],
  'vw-39': [
    loc('Indoor reception', 'Kalutara', 'Kalutara', 'hall'),
    loc('Lagoon-side ceremony', 'Kalutara', 'Kalutara', 'hall'),
    loc('Beach / river mouth', 'Kalutara', 'Kalutara', 'hall'),
  ],
  'vw-40': [
    loc('Beach wedding', 'Waskaduwa', 'Kalutara', 'hall'),
    loc('Garden wedding', 'Waskaduwa', 'Kalutara', 'hall'),
    loc('Grand ballroom', 'Waskaduwa', 'Kalutara', 'hall'),
  ],
  'vw-53': [
    loc('Pitakotte branch', 'Pitakotte', 'Colombo', 'branch'),
    loc('Kiribathgoda branch', 'Kiribathgoda', 'Gampaha', 'branch'),
  ],
  'vw-58': [
    loc('Kiribathgoda showroom', 'Kiribathgoda', 'Gampaha', 'branch'),
    loc('Mahara, Kadawatha', 'Kadawatha', 'Gampaha', 'branch'),
  ],
  'vw-59': [
    loc('Island-wide showrooms', 'Sri Lanka', 'Colombo', 'branch'),
    loc('Colombo', 'Colombo', 'Colombo', 'branch'),
    loc('Kandy', 'Kandy', 'Kandy', 'branch'),
    loc('Galle', 'Galle', 'Galle', 'branch'),
    loc('Negombo', 'Negombo', 'Gampaha', 'branch'),
    loc('Kurunegala', 'Kurunegala', 'Kurunegala', 'branch'),
    loc('Matara', 'Matara', 'Matara', 'branch'),
  ],
  'vw-62': [
    loc('Grand Ballroom (300 pax)', 'Bolgoda', 'Kalutara', 'hall'),
    loc('Crystal Ballroom (150–350 pax)', 'Bolgoda', 'Kalutara', 'hall'),
    loc('Rizta Banquet (100–150 pax)', 'Bolgoda', 'Kalutara', 'hall'),
    loc('Garden / lake wedding', 'Bolgoda', 'Kalutara', 'hall'),
  ],
};

function loc(name, city, district, type) {
  return { name, city, district, type: type || 'branch' };
}

function inferDistrict(text, fallback) {
  const hay = String(text || '');
  const hit = Object.keys(PLACE_DISTRICT).find((place) => new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay));
  return hit ? PLACE_DISTRICT[hit] : fallback || '';
}

function locationsFromListing(listing) {
  if (EXTRA_LOCATIONS[listing.id]) return EXTRA_LOCATIONS[listing.id];

  const raw = listing.address || listing.city || '';
  const parts = String(raw)
    .split(/\s*\|\s*|\s+and\s+|\s+\/\s+/i)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s && s.length < 90 && !/^sri lanka/i.test(s) && !/^\d+[A-Za-z]?$/.test(s));

  if (parts.length >= 2) {
    return parts.map((name) => loc(name, name.split(',')[0].trim(), inferDistrict(name, listing.district), 'branch'));
  }

  const city = listing.city || parts[0] || '';
  if (!city && !listing.address) return [];
  return [loc(listing.address || city, city || listing.district, listing.district, 'branch')];
}

function districtsFrom(listing, locations) {
  const set = new Set();
  (listing.districts || []).forEach((d) => d && set.add(d));
  if (listing.district) set.add(listing.district);
  locations.forEach((item) => item.district && set.add(item.district));
  return [...set];
}

function safeName(name) {
  return String(name || 'file')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 90);
}

function copyIfNeeded(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size === fs.statSync(src).size) return true;
  fs.copyFileSync(src, dest);
  return true;
}

let pythonCmd = null;
function resolvePython() {
  if (pythonCmd) return pythonCmd;
  for (const cmd of ['python', 'py', 'python3']) {
    const probe = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
    if (!probe.error && probe.status === 0) {
      pythonCmd = cmd;
      return cmd;
    }
  }
  return null;
}

function ensurePymupdf(log) {
  const cmd = resolvePython();
  if (!cmd) throw new Error('Python is required to turn vendor PDFs into gallery images.');
  const check = spawnSync(cmd, ['-c', 'import pymupdf'], { encoding: 'utf8' });
  if (check.status === 0) return;
  log('Installing PyMuPDF so PDF pages can be used as vendor photos…');
  const install = spawnSync(cmd, ['-m', 'pip', 'install', 'pymupdf'], { encoding: 'utf8' });
  if (install.status !== 0) {
    throw new Error(install.stderr || install.stdout || 'Could not install pymupdf');
  }
}

function renderPdfPages(pdfPath, folder, prefix, log) {
  const cmd = resolvePython();
  const result = spawnSync(cmd, [EXTRACT_SCRIPT, pdfPath, folder, prefix, String(PDF_PAGES)], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    log(`  PDF preview failed for ${path.basename(pdfPath)}: ${(result.stderr || result.stdout || '').trim()}`);
    return 0;
  }
  return Number(String(result.stdout || '').trim()) || 0;
}

function collectImages(listingId) {
  const folder = path.join(UPLOAD_DIR, listingId);
  if (!fs.existsSync(folder)) return [];
  const photos = [];
  const pages = [];
  fs.readdirSync(folder).forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) return;
    const url = `/uploads/vendors/${listingId}/${file}`;
    if (/-p\d+\.(jpe?g|png|webp)$/i.test(file)) pages.push(url);
    else photos.push(url);
  });
  const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  return [...photos.sort(byName), ...pages.sort(byName)];
}

function buildPortfolio(listing, log) {
  const folder = path.join(UPLOAD_DIR, listing.id);
  fs.mkdirSync(folder, { recursive: true });

  const pdfs = [];
  (listing.sourceFiles || []).forEach((file, index) => {
    const src = path.join(SOURCE_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const destName = `${String(index + 1).padStart(2, '0')}-${safeName(file)}`;
    const dest = path.join(folder, destName);
    if (!copyIfNeeded(src, dest)) return;
    const url = `/uploads/vendors/${listing.id}/${destName}`;
    if (ext === '.pdf') {
      pdfs.push({ name: path.basename(file), url });
      const prefix = destName.replace(/\.pdf$/i, '');
      renderPdfPages(dest, folder, prefix, log);
    }
  });

  const images = collectImages(listing.id);
  const locations = locationsFromListing(listing);
  const quotations = (listing.quotations || []).map((q) => ({ ...q }));
  pdfs.slice(1).forEach((pdf, i) => {
    if (quotations[i]) {
      quotations[i].pdfName = quotations[i].pdfName || pdf.name;
      quotations[i].pdfUrl = quotations[i].pdfUrl || pdf.url;
    } else {
      quotations.push({
        id: `src-pdf-${i + 1}`,
        title: pdf.name.replace(/\.pdf$/i, ''),
        price: '',
        details: 'Original vendor flyer / price guide',
        pdfName: pdf.name,
        pdfUrl: pdf.url,
      });
    }
  });

  return {
    images,
    quotations,
    quotationPdf: pdfs[0] ? { name: pdfs[0].name, url: pdfs[0].url } : null,
    categories: listing.categories || (listing.category ? [listing.category] : []),
    districts: districtsFrom(listing, locations),
    locations,
    phone: listing.phone || '',
    email: listing.email || '',
    website: listing.website || '',
    address: listing.address || '',
  };
}

async function attachVendorMedia(connection, log = console.log) {
  if (!fs.existsSync(DATA_FILE)) {
    log(`Vendor media skipped — dataset not found at ${DATA_FILE}`);
    return { ok: false, copied: 0 };
  }

  ensurePymupdf(log);

  const dataset = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const listings = dataset.listings || [];
  let updated = 0;
  let withImages = 0;

  for (const listing of listings) {
    if (!(listing.sourceFiles || []).length) continue;
    const portfolio = buildPortfolio(listing, log);
    const [rows] = await connection.query(
      'SELECT portfolio_json FROM vendor_listings WHERE id = ?',
      [listing.id],
    );
    if (!rows.length) continue;

    await connection.query(
      `UPDATE vendor_listings
       SET portfolio_json = ?, owner_email = COALESCE(NULLIF(?, ''), owner_email)
       WHERE id = ?`,
      [JSON.stringify(portfolio), listing.email || null, listing.id],
    );
    updated += 1;
    if (portfolio.images.length) withImages += 1;
    log(`  ${listing.id} ${listing.name}: ${portfolio.images.length} photo(s), ${portfolio.locations.length} location(s)`);
  }

  log(`Vendor media attached for ${updated} listing(s); ${withImages} now have photos (PDFs + images) from ${SOURCE_DIR}`);
  return { ok: true, copied: updated };
}

module.exports = { attachVendorMedia, SOURCE_DIR, DATA_FILE };

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
      await attachVendorMedia(connection);
    } finally {
      await connection.end();
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
