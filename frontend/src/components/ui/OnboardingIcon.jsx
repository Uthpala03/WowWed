const icons = {
  hearts: (
    <>
      <path d="M12 21s-7-4.5-9.5-8.5C1 9.5 2.5 6 6 5.5c2-.3 3.5 1 4 2 0.5-1 2-2.3 4-2 3.5 0.5 5 4 1.5 7 2.5 4 9.5 8.5 9.5 8.5z" fill="currentColor" opacity="0.15" />
      <path d="M12 20.5s-6.5-4-8.5-7.5C2 10 3.5 7 6.5 6.5c1.8-.3 3.2.8 3.8 1.8.6-1 2-2.1 3.7-1.8 3 0.5 4.5 3.5 1 6.5-2 3.5-8.5 7.5-8.5 7.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  couple: (
    <>
      <circle cx="8.5" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.5" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 19c0-3 2.5-5 4.5-5M20 19c0-3-2.5-5-4.5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 11.5c.8 1.2 2.2 1.2 3 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="14" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" fill="currentColor" opacity="0.12" />
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.12" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  indoor: (
    <>
      <path d="M4 11 12 5l8 6v9H4v-9z" fill="currentColor" opacity="0.12" />
      <path d="M4 11 12 5l8 6v9H4v-9z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="6" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  outdoor: (
    <>
      <circle cx="17" cy="7" r="3" fill="currentColor" opacity="0.2" />
      <path d="M12 20v-6M8 20v-4M16 20v-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 20c2-4 4-6 6-6s4 2 6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 20h16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  mixed: (
    <>
      <path d="M3 12h8V20H3v-8z" fill="currentColor" opacity="0.12" />
      <path d="M3 12h8V20H3v-8zM5 12V8l3-3 3 3v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 20v-5M17 20v-3M20 20v-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 20c1.5-3 3-4.5 4.5-4.5S18.5 17 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  poruwa: (
    <>
      <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 19V12l5-3.5 5 3.5v7" fill="currentColor" opacity="0.16" />
      <path d="M7 19V12l5-3.5 5 3.5v7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 12h5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 19V14M17.5 19V14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 9.5l4-2.5 4 2.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10 7.5h4l-1 1.8h-2L10 7.5z" fill="currentColor" opacity="0.35" />
      <path d="M10 7.5h4l-1 1.8h-2L10 7.5z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M11.2 10.2c0.5 0.4 1.1 0.4 1.6 0" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="12" cy="10.8" rx="0.7" ry="0.4" fill="currentColor" opacity="0.5" />
    </>
  ),
  church: (
    <>
      <path d="M12 3v2.2M10.5 5.2h3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 19V11l6.5-4.5L18.5 11v8H5.5z" fill="currentColor" opacity="0.14" />
      <path d="M5.5 19V11l6.5-4.5L18.5 11v8H5.5z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 19v-5c0-1 0.9-1.8 2-1.8s2 0.8 2 1.8v5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9.5 13.5h5" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="12" cy="11.8" r="0.8" fill="currentColor" opacity="0.4" />
      <path d="M8 14.5h8M8.5 16h7" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.45" strokeLinecap="round" />
    </>
  ),
  dualCeremony: (
    <>
      <path d="M3.5 19V13l3.5-2.5 3.5 2.5v6H3.5z" fill="currentColor" opacity="0.14" />
      <path d="M3.5 19V13l3.5-2.5 3.5 2.5v6H3.5z" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M5.5 13h2.5M6.8 11.2l0.7-1h1l0.7 1" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M13.5 19V12.5l4-2.8 4 2.8V19h-8z" fill="currentColor" opacity="0.12" />
      <path d="M13.5 19V12.5l4-2.8 4 2.8V19h-8z" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M16.5 12v1.2M15.5 13.2h2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M15.5 16v3h5v-3" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M11.8 10.5h0.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </>
  ),
  hindu: (
    <>
      <path d="M12 20V9.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 20h7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.2 17.2h5.6" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M10 14.6h4" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <ellipse cx="12" cy="9.2" rx="2.2" ry="1.1" fill="currentColor" opacity="0.22" />
      <ellipse cx="12" cy="9.2" rx="2.2" ry="1.1" fill="none" stroke="currentColor" strokeWidth="1.15" />
      <path d="M12 8.2V5.6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 5.2c.7-.8 1.8-.6 1.8.4 0 1.1-1.2 1.6-1.8 2.1-.6-.5-1.8-1-1.8-2.1 0-1 1.1-1.2 1.8-.4z" fill="currentColor" opacity="0.45" />
      <circle cx="7.2" cy="12.2" r="1.1" fill="currentColor" opacity="0.28" />
      <circle cx="16.8" cy="12.2" r="1.1" fill="currentColor" opacity="0.28" />
    </>
  ),
  nikah: (
    <>
      <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.5 19V12.5c0-3.2 2.4-5.8 5.5-5.8s5.5 2.6 5.5 5.8V19" fill="currentColor" opacity="0.12" />
      <path d="M6.5 19V12.5c0-3.2 2.4-5.8 5.5-5.8s5.5 2.6 5.5 5.8V19" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M12 4.2V6.7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M15.8 5.4c1.4.4 2.3 1.6 2.1 3-.2 1.2-1.3 2-2.5 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 19v-4.2c0-.9.8-1.6 2-1.6s2 .7 2 1.6V19" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.2 13.6h2.2M13.6 13.6h2.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </>
  ),
  reception: (
    <>
      <path d="M8.5 18v2.5M15.5 18v2.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8.5 18h-1.5M15.5 18h1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 18h3M14 18h3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 10.5c0 2.8-1.2 5.2-1.2 5.2s-1.2-2.4-1.2-5.2c0-1.8 1.1-3 2.4-3s2.4 1.2 2.4 3z" fill="currentColor" opacity="0.2" />
      <path d="M8.5 10.5c0 2.8-1.2 5.2-1.2 5.2s-1.2-2.4-1.2-5.2c0-1.8 1.1-3 2.4-3s2.4 1.2 2.4 3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M15.5 10.5c0 2.8 1.2 5.2 1.2 5.2s1.2-2.4 1.2-5.2c0-1.8-1.1-3-2.4-3s-2.4 1.2-2.4 3z" fill="currentColor" opacity="0.2" />
      <path d="M15.5 10.5c0 2.8 1.2 5.2 1.2 5.2s1.2-2.4 1.2-5.2c0-1.8-1.1-3-2.4-3s-2.4 1.2-2.4 3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10.5 8.5l3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" opacity="0.45" />
      <path d="M17.5 5.5l0.8 0.8M19 4.5v1.5M20.5 5.5h-1.5" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20V10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 10c-3-2-5-1-5 2s2 4 5 2M12 10c3-2 5-1 5 2s-2 4-5 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 20h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  newBadge: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" opacity="0.12" />
      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12h2v4H8v-4zM14 12h2v4h-2v-4zM11 10v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  megaphone: (
    <>
      <path d="M5 10h4l5-3v10l-5-3H5V10z" fill="currentColor" opacity="0.12" />
      <path d="M5 10h4l5-3v10l-5-3H5V10z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  verified: (
    <>
      <path d="M12 3l2.2 1.1 2.5-.3 1.1 2.2 2.2 1.1-.3 2.5 1.1 2.2-2.2 1.1.3 2.5-2.5-.3-2.2 1.1L12 21l-2.2-1.1-2.5.3-1.1-2.2-2.2-1.1.3-2.5-1.1-2.2 2.2-1.1-.3-2.5 2.5.3 2.2-1.1L12 3z" fill="currentColor" opacity="0.1" />
      <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  venue: (
    <>
      <path d="M2 20h20M4 20V11l8-5 8 5v9" fill="currentColor" opacity="0.14" />
      <path d="M2 20h20M4 20V11l8-5 8 5v9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 20v-5h8v5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 15h4M12 6v2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="8.5" r="1.2" fill="currentColor" opacity="0.5" />
      <path d="M6.5 13h2M15.5 13h2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  bridal: (
    <>
      <path d="M12 2.5v1.8M10 4.3h4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 4.3h6l-1.2 2.2h-3.6L9 4.3z" fill="currentColor" opacity="0.2" />
      <path d="M9 4.3h6l-1.2 2.2h-3.6L9 4.3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10.5 6.5c0 0.8 0.7 1.5 1.5 1.5s1.5-0.7 1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 8.5l-2 11h11l-2-11" fill="currentColor" opacity="0.18" />
      <path d="M8.5 8.5l-2 11h11l-2-11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 8.5h4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 14c1.5 1 4.5 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
    </>
  ),
  groom: (
    <>
      <path d="M6 9.5c0-2 2.7-3.5 6-3.5s6 1.5 6 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 9.5h14l-1.2 10.5H6.2L5 9.5z" fill="currentColor" opacity="0.16" />
      <path d="M5 9.5h14l-1.2 10.5H6.2L5 9.5z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8.5 9.5h7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.2 11.5c0.8 0.6 2.8 0.6 3.6 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 11.8h3c0 0.8-0.7 1.4-1.5 1.4s-1.5-0.6-1.5-1.4z" fill="currentColor" opacity="0.35" />
      <path d="M10.5 11.8h3c0 0.8-0.7 1.4-1.5 1.4s-1.5-0.6-1.5-1.4z" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12 9.5v2.3" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8 12l-1.5 1.5M16 12l1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8h4l1.5-2h7L17 8h4v11H3V8z" fill="currentColor" opacity="0.14" />
      <path d="M3 8h4l1.5-2h7L17 8h4v11H3V8z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="13.5" r="1.8" fill="currentColor" opacity="0.25" />
      <circle cx="17.5" cy="10.5" r="0.9" fill="currentColor" opacity="0.6" />
      <path d="M7 8V6.5h3V8" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  ring: (
    <>
      <ellipse cx="12" cy="16" rx="5.5" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 11.5V8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 8.5h5l-1 2.5h-3l-1-2.5z" fill="currentColor" opacity="0.35" />
      <path d="M9.5 8.5h5l-1 2.5h-3l-1-2.5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10.5 7.5l1.5-1.5 1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="0.7" fill="currentColor" />
    </>
  ),
  floral: (
    <>
      <circle cx="12" cy="8.5" r="2.8" fill="currentColor" opacity="0.22" />
      <circle cx="8.8" cy="10.2" r="2.2" fill="currentColor" opacity="0.18" />
      <circle cx="15.2" cy="10.2" r="2.2" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="8.5" r="1.3" fill="currentColor" />
      <circle cx="8.8" cy="10.2" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="15.2" cy="10.2" r="1" fill="currentColor" opacity="0.7" />
      <path d="M10.5 12.5L12 14l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11 14v3.5M13 14v3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.5 17.5c0.8 0.6 2.2 0.6 3 0M11.5 17.5c0.8 0.6 2.2 0.6 3 0" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 19.5h6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 19.5c0.5 0.8 1.5 1.2 2.5 1.2s2-0.4 2.5-1.2" fill="currentColor" opacity="0.25" />
    </>
  ),
  catering: (
    <>
      <ellipse cx="12" cy="11" rx="8" ry="2.5" fill="currentColor" opacity="0.14" />
      <path d="M4 11c0 4 3.6 7 8 7s8-3 8-7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 11h16" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 18v-3M12 18v-3M16 18v-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 8c0-1.5 1-2.5 2-2.5s2 1 2 2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="12" cy="8" rx="2" ry="0.8" fill="currentColor" opacity="0.35" />
    </>
  ),
  cake: (
    <>
      <rect x="6" y="16" width="12" height="3" rx="0.8" fill="currentColor" opacity="0.2" />
      <rect x="7" y="12" width="10" height="4" rx="0.6" fill="currentColor" opacity="0.28" />
      <rect x="8.5" y="8.5" width="7" height="3.5" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="6" y="16" width="12" height="3" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="7" y="12" width="10" height="4" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8.5" y="8.5" width="7" height="3.5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 6.5v2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="5.8" r="0.9" fill="currentColor" />
      <path d="M9 14.5h6M10 10.5h4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </>
  ),
};

function OnboardingIcon({ name, size = 22, className = '', detailed = false }) {
  const content = icons[name] || icons.hearts;
  const vendorIcons = ['venue', 'bridal', 'groom', 'camera', 'ring', 'floral', 'catering', 'cake'];
  const ceremonyIcons = ['poruwa', 'church', 'hindu', 'nikah', 'dualCeremony', 'reception'];
  const iconSize = detailed || vendorIcons.includes(name) || ceremonyIcons.includes(name)
    ? Math.round(size * 1.08)
    : size;
  return (
    <svg
      className={`onboarding-icon ${className}`.trim()}
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}

export default OnboardingIcon;
