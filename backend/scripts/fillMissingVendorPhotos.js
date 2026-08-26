const fs = require('fs');
const path = require('path');
const https = require('https');
const extra = require('../data/sriLankaVendorsExtra').listings;

const UPLOAD_DIR = path.join(__dirname, '../uploads/vendors');
const UA = 'WowWed/1.0 (educational wedding-planner project)';

const URLS = [
  ['vw-105', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Uga_Bay_Hotel_Entrance_at_Night.jpg/1280px-Uga_Bay_Hotel_Entrance_at_Night.jpg'],
  ['vw-100', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Angurukaramulla_Temple_negombo_2017-10-14_(5).jpg/1280px-Angurukaramulla_Temple_negombo_2017-10-14_(5).jpg'],
  ['vw-107', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pasikudah_beach%2C_Sri_Lanka.jpg/1280px-Pasikudah_beach%2C_Sri_Lanka.jpg'],
  ['vw-109', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Pasikudah_beach.JPG/1280px-Pasikudah_beach.JPG'],
  ['vw-112', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/20160130_Sri_Lanka_4290_Galle_sRGB_(25650030142).jpg/1280px-20160130_Sri_Lanka_4290_Galle_sRGB_(25650030142).jpg'],
  ['vw-113', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Maalu_Maalu_Beach_Resort%2C_Pasikuda%2C_Sri_Lanka.jpg/1280px-Maalu_Maalu_Beach_Resort%2C_Pasikuda%2C_Sri_Lanka.jpg'],
  ['vw-152', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/At_the_Seattle_Bridal_Show2.jpg/1280px-At_the_Seattle_Bridal_Show2.jpg'],
  ['vw-165', 'https://upload.wikimedia.org/wikipedia/en/d/d1/Royal_Wedding_Cake.jpg'],
  ['vw-167', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Bolobonecos.jpg/1280px-Bolobonecos.jpg'],
  ['vw-169', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Interior_View_of_Amangalla_Hotel.jpg/1280px-Interior_View_of_Amangalla_Hotel.jpg'],
  ['vw-171', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Interior_views_of_Amangalla%2C_Fort_Galle%2C_Sri_Lanka.jpg/1280px-Interior_views_of_Amangalla%2C_Fort_Galle%2C_Sri_Lanka.jpg'],
  ['vw-172', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Akersloot_Bastion%2C_Galle_Fort_2.jpg/1280px-Akersloot_Bastion%2C_Galle_Fort_2.jpg'],
  ['vw-174', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/AMH-6966-KB_View_of_Gale.jpg/1280px-AMH-6966-KB_View_of_Gale.jpg'],
  ['vw-175', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/AMH-7074-KB_View_of_the_courtyard_of_the_castle_of_Punto_Gale.jpg/1280px-AMH-7074-KB_View_of_the_courtyard_of_the_castle_of_Punto_Gale.jpg'],
  ['vw-179', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Amangalla%2C_Fort_Galle%2C_Sri_Lanka%2C_formerly_the_New_Oriental_Hotel.jpg/1280px-Amangalla%2C_Fort_Galle%2C_Sri_Lanka%2C_formerly_the_New_Oriental_Hotel.jpg'],
  ['vw-186', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/AMH-6153-NA_Bird%27s_eye_view_of_Negombo.jpg/1280px-AMH-6153-NA_Bird%27s_eye_view_of_Negombo.jpg'],
  ['vw-191', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/CLASS_M4_LOCO_OF_SRI_LANKAN_RAILWAYS_AT_NEGOMBO_STATION_SRI_LANKA.jpg/1280px-CLASS_M4_LOCO_OF_SRI_LANKAN_RAILWAYS_AT_NEGOMBO_STATION_SRI_LANKA.jpg'],
  ['vw-193', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Angurukaramulla_Temple_negombo_2017-10-14_(5).jpg/960px-Angurukaramulla_Temple_negombo_2017-10-14_(5).jpg'],
  ['vw-194', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Flag_of_Sri_Lanka.svg/1280px-Flag_of_Sri_Lanka.svg.png'],
  ['vw-197', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Bolobonecos.jpg/960px-Bolobonecos.jpg'],
  ['vw-199', 'https://upload.wikimedia.org/wikipedia/en/d/d1/Royal_Wedding_Cake.jpg'],
  ['vw-200', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/At_the_Seattle_Bridal_Show2.jpg/960px-At_the_Seattle_Bridal_Show2.jpg'],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': UA, Accept: 'image/*' },
      timeout: 20000,
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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

  for (const [id, url] of URLS) {
    const dest = path.join(UPLOAD_DIR, id, 'cover.jpg');
    if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) {
      console.log(id, 'already has photo');
      continue;
    }
    let ok = false;
    for (let i = 0; i < 4 && !ok; i += 1) {
      try {
        await download(url, dest);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) ok = true;
      } catch (err) {
        console.log(id, 'try', i + 1, err.message);
        await sleep(1500);
      }
    }
    if (!ok) {
      console.log(id, 'FAILED');
      continue;
    }
    const listing = extra.find((item) => item.id === id);
    const imageUrl = `/uploads/vendors/${id}/cover.jpg`;
    const [rows] = await connection.query('SELECT portfolio_json FROM vendor_listings WHERE id = ?', [id]);
    const portfolio = rows[0]?.portfolio_json
      ? (typeof rows[0].portfolio_json === 'string' ? JSON.parse(rows[0].portfolio_json) : rows[0].portfolio_json)
      : {};
    portfolio.images = [imageUrl];
    await connection.query('UPDATE vendor_listings SET portfolio_json = ? WHERE id = ?', [JSON.stringify(portfolio), id]);
    console.log(id, listing?.name, 'saved');
    await sleep(400);
  }
  await connection.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
