export function vendorCategories(vendor) {
  if (vendor?.categories?.length) return vendor.categories;
  if (vendor?.category) return [vendor.category];
  return [];
}

export function vendorLocations(vendor) {
  if (vendor?.locations?.length) return vendor.locations;
  return [];
}

export function vendorDistricts(vendor) {
  const fromLocations = vendorLocations(vendor)
    .map((loc) => loc.district)
    .filter(Boolean);
  if (vendor?.districts?.length) {
    return [...new Set([...vendor.districts, ...fromLocations])];
  }
  const single = vendor?.district || vendor?.city;
  const list = [single, ...fromLocations].filter(Boolean);
  return [...new Set(list)];
}

export function locationSearchText(vendor) {
  const bits = [
    vendor?.city,
    vendor?.address,
    ...(vendorDistricts(vendor) || []),
    ...vendorLocations(vendor).flatMap((loc) => [loc.name, loc.city, loc.district]),
  ];
  return bits.filter(Boolean).join(' ').toLowerCase();
}

export function formatVendorCategories(vendor) {
  const list = vendorCategories(vendor);
  return list.length ? list.join(' · ') : 'Category';
}

export function formatVendorDistricts(vendor) {
  const list = vendorDistricts(vendor);
  return list.length ? list.join(' · ') : 'Sri Lanka';
}

export function vendorMatchesCategory(vendor, category) {
  if (!category || category === 'All Categories') return true;
  return vendorCategories(vendor).includes(category);
}

export function vendorMatchesDistrict(vendor, city) {
  if (!city) return true;
  const needle = city.toLowerCase();
  return locationSearchText(vendor).includes(needle);
}

export function formatPriceRange(range) {
  if (!range) return 'Price on request';
  const [min, max] = String(range).split('-').map((n) => Number(String(n).replace(/,/g, '').trim()));
  if (!min && !max) return 'Price on request';
  const fmt = (n) => (n ? `Rs. ${n.toLocaleString()}` : '');
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

export function vendorMatchesLocation(vendor, profileDistrict) {
  if (!profileDistrict) return false;
  const needle = String(profileDistrict).toLowerCase();
  return locationSearchText(vendor).includes(needle);
}

export function normalizeStringList(values, fallback = []) {
  if (Array.isArray(values)) return values.filter(Boolean);
  if (typeof values === 'string' && values.trim()) return [values.trim()];
  return fallback;
}

export function toggleListItem(list, item) {
  return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
}
