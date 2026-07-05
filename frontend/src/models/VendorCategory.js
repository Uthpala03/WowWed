/** Single vendor business category */
export class VendorCategory {
  constructor({ id, label, icon = 'vendors' }) {
    this.id = id;
    this.label = label;
    this.icon = icon;
  }
}

/** WowWed vendor category catalog */
export class VendorCategoryCatalog {
  constructor(categories = []) {
    this.categories = categories;
  }

  getAll() {
    return this.categories;
  }

  getLabels() {
    return this.categories.map((c) => c.label);
  }

  getFilterOptions() {
    return ['All Categories', ...this.getLabels()];
  }

  getDefault() {
    return this.categories[0];
  }

  findByLabel(label) {
    return this.categories.find((c) => c.label === label);
  }
}

const categoryData = [
  new VendorCategory({ id: 'venue', label: 'Venue & Res. Halls', icon: 'vendors' }),
  new VendorCategory({ id: 'bridal', label: 'Bridal Service', icon: 'crew' }),
  new VendorCategory({ id: 'groom', label: 'Groom service', icon: 'crew' }),
  new VendorCategory({ id: 'photo', label: 'Photography & Videography', icon: 'analytics' }),
  new VendorCategory({ id: 'jewellery', label: 'Jewellary', icon: 'sparkle' }),
  new VendorCategory({ id: 'floral', label: 'Floral & Deco', icon: 'sparkle' }),
  new VendorCategory({ id: 'caters', label: 'Caters', icon: 'budget' }),
  new VendorCategory({ id: 'cakes', label: 'Cakes', icon: 'budget' }),
];

export const vendorCatalog = new VendorCategoryCatalog(categoryData);

/** For dropdowns and filters — includes "All Categories" */
export const vendorCategories = vendorCatalog.getFilterOptions();

/** Vendor categories only (no "All Categories") */
export const vendorCategoryLabels = vendorCatalog.getLabels();
