/** Single about-page highlight card */
export class AboutHighlight {
  constructor({ icon, title, text }) {
    this.icon = icon;
    this.title = title;
    this.text = text;
  }
}

/** About section content */
export class AboutContent {
  constructor({ eyebrow, title, intro, stats, highlights }) {
    this.eyebrow = eyebrow;
    this.title = title;
    this.intro = intro;
    this.stats = stats;
    this.highlights = highlights;
  }
}

export const aboutContent = new AboutContent({
  eyebrow: 'About WowWed',
  title: 'Built for Sri Lankan couples',
  intro: 'WowWed is a free wedding planning platform with 17 modules — checklist, guests, seating, budget, vendors, invitations, analytics, and more. Designed for Poruwa, Christian, Muslim, and Civil ceremonies across all 25 districts.',
  stats: [
    { value: '17', label: 'Planning modules' },
    { value: '25', label: 'Sri Lankan districts' },
    { value: 'Free', label: 'For couples' },
  ],
  highlights: [
    new AboutHighlight({
      icon: 'checklist',
      title: 'Plan in one place',
      text: 'Checklist, guest RSVPs, seating, and budget — no more scattered spreadsheets.',
    }),
    new AboutHighlight({
      icon: 'vendors',
      title: 'Book local vendors',
      text: 'Search by category and district, send booking requests, and track confirmations.',
    }),
    new AboutHighlight({
      icon: 'assistant',
      title: 'Keyword assistant',
      text: 'Answers from a WowWed knowledge base — not a chat AI.',
    }),
    new AboutHighlight({
      icon: 'reports',
      title: 'Export PDF reports',
      text: 'Guest lists, budget summaries, seating plans, and full wedding reports in one click.',
    }),
  ],
});

export class VendorPitch {
  constructor({ eyebrow, title, intro, perks, ctaLabel, ctaTo }) {
    this.eyebrow = eyebrow;
    this.title = title;
    this.intro = intro;
    this.perks = perks;
    this.ctaLabel = ctaLabel;
    this.ctaTo = ctaTo;
  }
}

export const vendorPitch = new VendorPitch({
  eyebrow: 'Vendors',
  title: 'Become a vendor on WowWed',
  intro: 'List your wedding business and go live instantly — no approval wait. Receive booking requests from couples, accept or negotiate, and grow across Sri Lanka.',
  perks: [
    { icon: 'vendors', text: 'Instant listing on registration' },
    { icon: 'calendar', text: 'Manage booking requests' },
    { icon: 'budget', text: 'Reach couples by district' },
  ],
  ctaLabel: 'Join as a vendor',
  ctaTo: '/get-started/vendor',
});
