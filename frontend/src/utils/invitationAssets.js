/** Public URL prefix for static invitation assets (CRA public folder). */
export function invitationAssetUrl(file) {
  const base = process.env.PUBLIC_URL || '';
  return `${base}/invitations/${file}`;
}
