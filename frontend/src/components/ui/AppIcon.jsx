const paths = {
  checklist: 'M6 4h12v3H6V4zm0 6h12v2H6v-2zm0 5h8v2H6v-2z',
  guests: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0H5z',
  seating: 'M4 10h16v2H4v-2zm2 4h3v4H6v-4zm5 0h3v4h-3v-4zm5 0h3v4h-3v-4zM7 6h10v2H7V6z',
  invitations: 'M4 6l8 5 8-5v12H4V6zm16-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
  budget: 'M12 3a5 5 0 0 0-5 5v1H5v12h14V9h-2V8a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v1H9V8a3 3 0 0 1 3-3z',
  vendors: 'M4 8h16v10H4V8zm2 2v6h12v-6H6zm-1-4h14v2H5V6z',
  home: 'M12 4 4 11h2v8h5v-5h2v5h5v-8h2L12 4z',
  analytics: 'M5 19V9h3v10H5zm5 0V5h3v14h-3zm5 0v-7h3v7h-3z',
  reports: 'M8 4h8v2H8V4zm-2 4h12v12H6V8zm2 2v8h8v-8H8z',
  assistant: 'M6 8a6 6 0 1 1 12 0v1h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v3l-3-2H8a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h1V8z',
  crew: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 18a5 5 0 0 1 8 0H4zm8 0a5 5 0 0 1 8 0h-8z',
  ai: 'M12 2l2 5 5 1-4 4 1 5-4-2-4 2 1-5-4-4 5-1 2-5z',
  sparkle: 'M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z',
  readiness: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z',
  calendar: 'M7 4V2h2v2h6V2h2v2h3v16H4V4h3zm-1 4v10h12V8H6z',
  edit: 'M4 18h2l10-10-2-2L4 16v2zm13-11 2 2 1-1a1 1 0 0 0 0-1.4l-.6-.6a1 1 0 0 0-1.4 0l-1 1z',
};

function AppIcon({ name, size = 20, className = '' }) {
  const d = paths[name] || paths.home;
  return (
    <svg
      className={`app-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default AppIcon;
