/** Landing card tones */
export const FEATURE_TONES = {
  terracotta: { bg: '#c9785a', text: '#ffffff' },
  peach: { bg: '#f0c4ad', text: '#5c3d2e' },
  cream: { bg: '#f5ebe0', text: '#5c3d2e' },
  sage: { bg: '#e8f0ea', text: '#3d5c45' },
};

/** Single WowWed module (M01–M17 from project specification) */
export class AppModule {
  constructor({
    id,
    code,
    name,
    tagline,
    description,
    icon,
    route = null,
    accent = '#fff0e8',
    ring = '#e8a88c',
    tone = 'cream',
    stripLabel = null,
    showInNav = false,
    showOnLanding = false,
    showInStrip = false,
    navEnd = false,
    hint = '',
    audience = 'couple',
    smartHighlight = false,
  }) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.tagline = tagline;
    this.description = description;
    this.icon = icon;
    this.route = route;
    this.accent = accent;
    this.ring = ring;
    this.tone = tone;
    this.stripLabel = stripLabel || name;
    this.showInNav = showInNav;
    this.showOnLanding = showOnLanding;
    this.showInStrip = showInStrip;
    this.navEnd = navEnd;
    this.hint = hint;
    this.audience = audience;
    this.smartHighlight = smartHighlight;
  }

  getToneStyle() {
    return FEATURE_TONES[this.tone] || FEATURE_TONES.cream;
  }

  toNavItem() {
    return {
      to: this.route,
      label: this.name,
      icon: this.icon,
      accent: this.accent,
      ring: this.ring,
      end: this.navEnd,
    };
  }
}

/** Central registry for all WowWed modules */
export class ModuleRegistry {
  constructor(modules = []) {
    this.modules = modules;
  }

  get(id) {
    return this.modules.find((m) => m.id === id);
  }

  getStripItems() {
    return this.modules.filter((m) => m.showInStrip);
  }

  getShowcaseCards() {
    return this.modules.filter((m) => m.showOnLanding);
  }

  getSmartHighlights() {
    return this.modules.filter((m) => m.smartHighlight);
  }

  getDashboardNav() {
    return this.modules.filter((m) => m.showInNav && m.audience !== 'vendor');
  }

  getVendorNav() {
    return this.modules.filter((m) => m.showInNav && m.audience === 'vendor');
  }

  getQuickLinkHints() {
    return Object.fromEntries(
      this.modules.filter((m) => m.route && m.hint).map((m) => [m.route, m.hint]),
    );
  }
}

const moduleData = [
  new AppModule({
    id: 'home',
    code: 'M03',
    name: 'Home',
    tagline: 'Countdown, readiness score, 6-month timeline, and quick access to all tools',
    description: 'Your planning dashboard with Wedding Readiness Score — tasks 40%, RSVPs 35%, budget 25%.',
    icon: 'home',
    route: '/dashboard',
    accent: '#fff0e8',
    ring: '#e8a88c',
    showInNav: true,
    navEnd: true,
    hint: 'Overview with countdown and readiness',
  }),
  new AppModule({
    id: 'checklist',
    code: 'M03',
    name: 'Wedding Checklist',
    tagline: 'Month-by-month tasks with filters, categories, and progress tracking',
    description: '70+ built-in Sri Lankan wedding tasks — filter by month, category, assignee, and due date.',
    icon: 'checklist',
    route: '/dashboard/checklist',
    accent: '#eef6f0',
    ring: '#6b9e78',
    tone: 'terracotta',
    showInNav: true,
    showOnLanding: true,
    showInStrip: true,
    hint: 'Track tasks by month with completion progress',
  }),
  new AppModule({
    id: 'guests',
    code: 'M04',
    name: 'Guest List',
    tagline: 'Add, edit, and organise guests with RSVP tracking and CSV import',
    description: "Bride's and groom's family, friends, colleagues, relatives, VIP, neighbours, and other groups — bulk RSVP updates, search, filter, and export.",
    icon: 'guests',
    route: '/dashboard/guests',
    accent: '#fff5ef',
    ring: '#e8a88c',
    tone: 'peach',
    showInNav: true,
    showOnLanding: true,
    showInStrip: true,
    hint: 'RSVPs, groups, and CSV import for large lists',
  }),
  new AppModule({
    id: 'seating',
    code: 'M10',
    name: 'Seating Chart',
    tagline: 'Define tables, assign guests, and view your full reception layout',
    description: 'Suite zones, auto-seat by group, table shapes, and manual drag-and-drop overrides.',
    icon: 'seating',
    route: '/dashboard/seating',
    accent: '#f0f4f8',
    ring: '#7a9eb8',
    tone: 'cream',
    showInNav: true,
    showOnLanding: true,
    showInStrip: true,
    hint: 'Visual layout with smart group seating',
  }),
  new AppModule({
    id: 'invitations',
    code: 'M12',
    name: 'Invitations',
    tagline: 'Choose a template, customise details, and export as PDF',
    description: 'Classic, Floral, Modern, and Poruwa templates — live preview with names, date, venue, and message.',
    icon: 'invitations',
    route: '/dashboard/invitations',
    accent: '#f8f0f8',
    ring: '#b8a0c8',
    tone: 'cream',
    showInNav: true,
    showOnLanding: true,
    showInStrip: true,
    hint: 'Design invitations and download PDF',
  }),
  new AppModule({
    id: 'budget',
    code: 'M05',
    name: 'Budget',
    tagline: 'Set your total budget, log expenses, and get overspend alerts in LKR',
    description: 'Category breakdown, real-time budget vs. actual comparison, and AI cost prediction.',
    icon: 'budget',
    route: '/dashboard/budget',
    accent: '#fdf8ee',
    ring: '#d4a84b',
    tone: 'peach',
    showInNav: true,
    showOnLanding: true,
    showInStrip: true,
    hint: 'Track spending with category alerts',
  }),
  new AppModule({
    id: 'vendors',
    code: 'M07',
    name: 'Vendors',
    tagline: 'Search, compare, and book Sri Lankan wedding professionals',
    description: 'Filter by category, district, and price — send booking requests with Accept, Reject, or Negotiate.',
    icon: 'vendors',
    route: '/dashboard/vendors',
    accent: '#fdf0ee',
    ring: '#c96a5a',
    tone: 'terracotta',
    showInNav: true,
    showOnLanding: true,
    showInStrip: true,
    hint: 'Find vendors matched to your district and budget',
  }),
  new AppModule({
    id: 'analytics',
    code: 'M13',
    name: 'Analytics',
    tagline: 'Budget charts, RSVP summary, vendor spend, and task completion at a glance',
    description: 'Personal couple-scoped insights — pie and bar charts with your readiness score.',
    icon: 'analytics',
    route: '/dashboard/analytics',
    accent: '#eef6f0',
    ring: '#6b9e78',
    showInNav: true,
    hint: 'Charts for budget, guests, and tasks',
  }),
  new AppModule({
    id: 'reports',
    code: 'M17',
    name: 'Reports',
    tagline: 'One-click PDF exports for guests, budget, vendors, seating, and full summary',
    description: 'Download printable wedding documents ready to share with family or vendors.',
    icon: 'reports',
    route: '/dashboard/reports',
    accent: '#f0f4f8',
    ring: '#7a9eb8',
    showInNav: true,
    hint: 'Export 5 PDF report types instantly',
  }),
  new AppModule({
    id: 'assistant',
    code: 'M16',
    name: 'Assistant',
    tagline: 'Assistant inside WOWWED decision support',
    description: 'Chat helper inside WOWWED — Intelligent Web-Based Wedding Planning and Decision Support System.',
    icon: 'assistant',
    route: '/dashboard/assistant',
    accent: '#fff0e8',
    ring: '#e8a88c',
    showInNav: true,
    hint: 'Ask about your wedding',
  }),
  new AppModule({
    id: 'crew',
    code: null,
    name: 'Wedding Crew',
    tagline: 'Organise bridesmaids, groomsmen, and day-of helpers by role',
    description: 'Assign responsibilities and keep your bridal party aligned before the big day.',
    icon: 'crew',
    route: '/dashboard/crew',
    accent: '#f8f0f8',
    ring: '#b8a0c8',
    showInNav: true,
    hint: 'Manage bridal party and helpers',
  }),
  new AppModule({
    id: 'cost-ai',
    code: 'M06',
    name: 'AI Cost Prediction',
    tagline: 'Random Forest estimate in LKR — 90.66% accuracy (R² = 0.9066)',
    description: 'Predicts wedding cost with a 95% confidence interval from guests, district, ceremony, scale, and season.',
    icon: 'ai',
    tone: 'sage',
    smartHighlight: true,
  }),
  new AppModule({
    id: 'vendor-ai',
    code: 'M09',
    name: 'Smart Vendor Match',
    tagline: 'Ranked recommendations by your budget, district, and ceremony type',
    description: 'Rule-based filtering surfaces vendors that fit all three criteria on the search screen.',
    icon: 'sparkle',
    tone: 'sage',
    smartHighlight: true,
  }),
  new AppModule({
    id: 'seating-ai',
    code: 'M11',
    name: 'Smart Seating',
    tagline: 'Auto-group guests by category with capacity and relationship constraints',
    description: 'Constrained clustering suggests table assignments — override any seat manually.',
    icon: 'seating',
    tone: 'sage',
    smartHighlight: true,
  }),
  new AppModule({
    id: 'readiness',
    code: 'M15',
    name: 'Readiness Score',
    tagline: 'Tasks 40% · RSVPs 35% · Budget 25% — Green, Yellow, or Red status',
    description: 'Composite score on your dashboard shows how on-track your wedding planning is.',
    icon: 'readiness',
    tone: 'sage',
    smartHighlight: true,
  }),
  new AppModule({
    id: 'vendor-overview',
    code: 'M07',
    name: 'Overview',
    tagline: 'Your live listing, booking stats, and earnings at a glance',
    description: 'Vendor profile auto-publishes on registration — no approval wait.',
    icon: 'vendors',
    route: '/vendor',
    accent: '#fdf0ee',
    ring: '#c96a5a',
    showInNav: true,
    audience: 'vendor',
    navEnd: true,
  }),
  new AppModule({
    id: 'vendor-bookings',
    code: 'M08',
    name: 'Bookings',
    tagline: 'Accept, reject, or negotiate booking requests from couples',
    description: 'Booking flow: Pending → Confirmed → Paid with calendar availability.',
    icon: 'calendar',
    route: '/vendor/bookings',
    accent: '#f0f4f8',
    ring: '#7a9eb8',
    showInNav: true,
    audience: 'vendor',
  }),
  new AppModule({
    id: 'vendor-profile',
    code: 'M07',
    name: 'My Listing',
    tagline: 'Update your portfolio, pricing, district, and contact details',
    description: 'Category, district, price range, and portfolio — instantly visible to couples.',
    icon: 'edit',
    route: '/vendor/profile',
    accent: '#fff0e8',
    ring: '#e8a88c',
    showInNav: true,
    audience: 'vendor',
  }),
];

export const wowWedModules = new ModuleRegistry(moduleData);
