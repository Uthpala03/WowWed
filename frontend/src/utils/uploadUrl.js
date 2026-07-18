const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002';

/** Resolve vendor PDF/image upload paths from the API server. */
export function resolveUploadUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

export function quoteHasPdf(q) {
  return Boolean(q?.pdfName && (q.pdfUrl || q.pdfData));
}

export function quotePdfHref(q) {
  return resolveUploadUrl(q.pdfUrl) || q.pdfData || '';
}
