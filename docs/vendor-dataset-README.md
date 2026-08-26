# WowWed vendor dataset

**200 Sri Lankan wedding vendors** with photos.

## Files

| File | Use |
|---|---|
| `vendor-dataset.json` | Full 200 listings in WowWed API shape |
| `vendor_listings_seed.sql` | MySQL import for flyer vendors `vw-01`–`vw-65` |
| `sri_lanka_vendors_extra.sql` | MySQL upsert for public vendors `vw-66`–`vw-200` |
| `source_index.csv` | Maps each source PDF/JPEG to `vw-01`–`vw-65` |

Copies also live in `C:\Users\ASUS\Desktop\Vendors\wowwed-dataset\`.

## Two sources

- **vw-01 – vw-65** — every PDF and WhatsApp image in `C:\Users\ASUS\Desktop\Vendors` (2026–2027 guides)
- **vw-66 – vw-200** — extra Sri Lankan hotels, photographers, jewellers, salons, florists, caterers and cake studios from public hotel sites, Wikipedia photos, [MyWed](https://mywed.com/en/Sri-Lanka-wedding-photographers/) and official brand pages

```bash
npm run vendors:media --prefix backend
npm run vendors:sri-lanka --prefix backend
```

Photos are stored in `backend/uploads/vendors/vw-XX/`. Backend start also runs both seeders.

## What is in the set

- **200 vendors** (plus any couple/vendor accounts created in the app)
- Venues: 72
- Photography: 57
- Bridal: 16
- Groom: 10
- Floral and deco: 17
- Jewellery: 13
- Caterers: 8
- Cakes: 7

Prices are in LKR. Flyer vendors use printed package prices. Extra vendors use public starting rates (photographers converted from published USD listings) or “confirm with vendor” ranges.

## Coverage

Every named PDF, Scanned Document 34–68, and WhatsApp image in the Vendors folder is assigned in `source_index.csv`. Extra vendors use Wikipedia / MyWed / category photos — not Google Image scrape.
