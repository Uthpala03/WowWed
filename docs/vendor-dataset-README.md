# WowWed vendor dataset

Complete one-to-one extract of every PDF and image in `C:\Users\ASUS\Desktop\Vendors` (2026-2027 guides, menus, scanned flyers and WhatsApp images).

## Files

| File | Use |
|---|---|
| `vendor-dataset.json` | Full listings in WowWed API shape |
| `vendor_listings_seed.sql` | MySQL import (replaces placeholder `v1`-`v8` and all `vw-*`) |
| `source_index.csv` | Maps each source PDF/JPEG to its vendor |
| `vendor_listings_seed.sql` | Loads listings into MySQL (`wowwed.vendor_listings`) |

Copies also live in `WowWed\WowWed\docs\` so the backend can seed them.

## How to load into WowWed

**New database:** restart the backend. `docs/mysql-setup.sql` inserts these vendors with `INSERT IGNORE`.

**Existing database:**

```bash
mysql -u root -p wowwed < "C:\Users\ASUS\Desktop\WowWed\WowWed\docs\vendor_listings_seed.sql"
```

That removes placeholder ids `v1`-`v8` and inserts `vw-01`-`vw-65`.

## What is in the set

- **65 vendors** and **213 packages**
- Venues: 22
- Photography: 27
- Bridal: 4
- Groom: 2
- Floral and deco / planning: 7
- Jewellery: 1
- Cakes: 2

Prices are in LKR as printed. Per-person menus are stored as package `price` (per person). Listing `priceRange` is `min-max` in rupees so WowWed filters work.

## Coverage

Every named PDF, Scanned Document 34-68, and WhatsApp image in the Vendors folder is assigned to a listing in `source_index.csv`.
