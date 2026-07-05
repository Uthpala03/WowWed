/** Smooth scroll to a page section by id — safe, no crash if missing */
export function scrollToSection(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}
