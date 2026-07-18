export function vendorCategories(vendor) {
  if (vendor?.categories?.length) return vendor.categories;
  if (vendor?.category) return [vendor.category];
  return [];
}

export function vendorDistricts(vendor) {
  if (vendor?.districts?.length) return vendor.districts;
  const single = vendor?.district || vendor?.city;
  return single ? [single] : [];
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
  return vendorDistricts(vendor).some((d) => d.toLowerCase().includes(needle));
}

export function vendorMatchesLocation(vendor, profileDistrict) {
  if (!profileDistrict) return false;
  return vendorDistricts(vendor).includes(profileDistrict);
}

export function normalizeStringList(values, fallback = []) {
  if (Array.isArray(values)) return values.filter(Boolean);
  if (typeof values === 'string' && values.trim()) return [values.trim()];
  return fallback;
}

export function toggleListItem(list, item) {
  return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
}
