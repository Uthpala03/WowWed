/** Landing page navigation item */
export class NavItem {
  constructor({ id, label, icon }) {
    this.id = id;
    this.label = label;
    this.icon = icon;
  }
}

export class NavCatalog {
  constructor(items = []) {
    this.items = items;
  }

  getMainLinks() {
    return this.items;
  }
}

export const mainNav = new NavCatalog([
  new NavItem({ id: 'about', label: 'About', icon: 'home' }),
  new NavItem({ id: 'features', label: 'Features', icon: 'sparkle' }),
  new NavItem({ id: 'vendors', label: 'Vendors', icon: 'vendors' }),
]);
