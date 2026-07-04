/** M06 — client-side cost estimate (mirrors Random Forest inputs until Django API is wired) */
const districtMultiplier = {
  Colombo: 1.25, Gampaha: 1.1, Kandy: 1.05, Galle: 1.0, Matara: 0.95,
};
const ceremonyMultiplier = { Poruwa: 1.1, Christian: 1.0, Muslim: 1.05, Civil: 0.85 };
const scaleMultiplier = { standard: 1.0, premium: 1.35, luxury: 1.75 };

export function predictWeddingCost({ guestCount, district, ceremonyType, scale, weddingMonth }) {
  const guests = Number(guestCount) || 150;
  const basePerGuest = 45000;
  const dm = districtMultiplier[district] || 1.0;
  const cm = ceremonyMultiplier[ceremonyType] || 1.0;
  const sm = scaleMultiplier[scale] || 1.0;
  const month = weddingMonth ? new Date(weddingMonth).getMonth() : 6;
  const seasonal = [11, 0, 1, 6, 7].includes(month) ? 1.12 : 1.0;

  const estimate = Math.round(guests * basePerGuest * dm * cm * sm * seasonal);
  const margin = Math.round(estimate * 0.12);
  return {
    estimate,
    low: estimate - margin,
    high: estimate + margin,
    confidence: '±12%',
    factors: { guests, district, ceremonyType, scale, seasonal: seasonal > 1 ? 'Peak season' : 'Standard season' },
  };
}
