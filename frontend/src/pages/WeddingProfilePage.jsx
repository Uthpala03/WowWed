import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormLayout from '../components/layout/FormLayout';
import Button from '../components/ui/Button';
import { ceremonyTypes, districts, weddingScales } from '../data/formOptions';
import { getUser, getWeddingProfile, saveWeddingProfile } from '../utils/storage';

function emptyProfileFromSaved(saved) {
  if (!saved) {
    return {
      partnerOne: '',
      partnerTwo: '',
      weddingDate: '',
      venue: '',
      district: 'Colombo',
      ceremonyType: 'Poruwa',
      guestCount: '150',
      budget: '',
      scale: 'standard',
    };
  }

  return {
    partnerOne: saved.partnerOne || '',
    partnerTwo: saved.partnerTwo || '',
    weddingDate: saved.weddingDate || '',
    venue: saved.venue || '',
    district: saved.district || 'Colombo',
    ceremonyType: saved.ceremonyType || 'Poruwa',
    guestCount: String(saved.guestCount || '150'),
    budget: saved.budget ? String(saved.budget) : '',
    scale: saved.scale || 'standard',
  };
}

function WeddingProfilePage() {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState(() => emptyProfileFromSaved(getWeddingProfile()));
  const [error, setError] = useState('');

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!form.partnerOne.trim() || !form.partnerTwo.trim() || !form.weddingDate || !form.venue.trim()) {
      setError('Please complete the couple names, date, and venue.');
      return;
    }

    if (!form.budget || Number(form.budget) <= 0) {
      setError('Please enter a valid budget in LKR.');
      return;
    }

    const profile = {
      ...form,
      partnerOne: form.partnerOne.trim(),
      partnerTwo: form.partnerTwo.trim(),
      venue: form.venue.trim(),
      guestCount: Number(form.guestCount),
      budget: Number(form.budget),
      updatedAt: new Date().toISOString(),
      ownerEmail: user?.email || null,
    };

    saveWeddingProfile(profile);
    navigate('/dashboard');
  };

  return (
    <FormLayout
      title="Create your wedding profile"
      subtitle="Tell us about your celebration. All other WowWed modules use this information."
      backTo={user ? '/dashboard' : '/get-started'}
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__row">
          <label className="form__field">
            <span>Partner 1 name</span>
            <input type="text" value={form.partnerOne} onChange={update('partnerOne')} placeholder="Priya" />
          </label>
          <label className="form__field">
            <span>Partner 2 name</span>
            <input type="text" value={form.partnerTwo} onChange={update('partnerTwo')} placeholder="Nimal" />
          </label>
        </div>

        <div className="form__row">
          <label className="form__field">
            <span>Wedding date</span>
            <input type="date" value={form.weddingDate} onChange={update('weddingDate')} />
          </label>
          <label className="form__field">
            <span>Expected guests</span>
            <input type="number" min="1" value={form.guestCount} onChange={update('guestCount')} />
          </label>
        </div>

        <label className="form__field">
          <span>Venue</span>
          <input type="text" value={form.venue} onChange={update('venue')} placeholder="Grand ballroom, hotel, or garden" />
        </label>

        <div className="form__row">
          <label className="form__field">
            <span>District</span>
            <select value={form.district} onChange={update('district')}>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span>Ceremony type</span>
            <select value={form.ceremonyType} onChange={update('ceremonyType')}>
              {ceremonyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form__row">
          <label className="form__field">
            <span>Total budget (LKR)</span>
            <input type="number" min="1" step="1000" value={form.budget} onChange={update('budget')} placeholder="2500000" />
          </label>
          <label className="form__field">
            <span>Wedding scale</span>
            <select value={form.scale} onChange={update('scale')}>
              {weddingScales.map((scale) => (
                <option key={scale.value} value={scale.value}>
                  {scale.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="form__error">{error}</p>}

        <Button type="submit" variant="primary" className="form__submit">
          Save wedding profile
        </Button>
      </form>
    </FormLayout>
  );
}

export default WeddingProfilePage;
