import { api } from '../services/api';

/** Client-side fallback if the Random Forest API is offline */
const districtMultiplier = {
  Colombo: 1.25, Gampaha: 1.1, Kalutara: 1.08, Kandy: 1.05, Galle: 1.04,
  'Nuwara Eliya': 1.08, Matara: 0.95, Jaffna: 0.94, Kurunegala: 0.9,
};
const ceremonyMultiplier = {
  Poruwa: 1.1,
  'Poruwa Ceremony': 1.1,
  Christian: 1.0,
  'Church Wedding': 1.0,
  Muslim: 1.05,
  'Muslim Nikah Ceremony': 1.05,
  'Hindu Tamil Wedding': 1.08,
  Civil: 0.85,
  Reception: 0.85,
};
const scaleMultiplier = { budget: 0.72, standard: 1.0, premium: 1.45, luxury: 1.85 };

export function localPredictWeddingCost({ guestCount, district, ceremonyType, scale, weddingMonth }) {
  const guests = Number(guestCount) || 150;
  const basePerGuest = 26000;
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
    source: 'local',
    factors: { guests, district, ceremonyType, scale, seasonal: seasonal > 1 ? 'Peak season' : 'Standard season' },
  };
}

export async function predictWeddingCost(profile) {
  const payload = {
    guestCount: Number(profile?.guestCount) || 150,
    district: profile?.district || 'Colombo',
    ceremonyType: profile?.ceremonyType || 'Poruwa Ceremony',
    scale: profile?.scale || 'standard',
    weddingDate: profile?.weddingDate || profile?.weddingMonth || '',
    weddingMonth: profile?.weddingMonth,
  };

  try {
    const result = await api.predictCost(payload);
    if (result?.estimate) return { ...result, source: result.source || 'RandomForestRegression.pkl' };
  } catch {
    /* fall through to local estimate */
  }

  try {
    const res = await fetch('http://127.0.0.1:8001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const result = await res.json();
      if (result?.estimate) return { ...result, source: result.source || 'RandomForestRegression.pkl' };
    }
  } catch {
    /* fall through */
  }

  return localPredictWeddingCost({ ...profile, weddingMonth: profile?.weddingDate || profile?.weddingMonth });
}
