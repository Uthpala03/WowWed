import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormLayout from '../components/layout/FormLayout';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import Button from '../components/ui/Button';
import { locationSelectOptions, normalizeCeremonyType, onboardingCeremonyTypes, weddingScales } from '../data/formOptions';
import PrettySelect from '../components/ui/PrettySelect';
import { useAuth } from '../context/AuthContext';
import { coupleOnboarding } from '../models/OnboardingPath';
import {
  getCoupleBasics,
  getOnboarding,
  getUser,
  getWeddingProfile,
  hydrateUserData,
  ensureCoupleChecklist,
  saveWeddingProfile,
} from '../utils/storage';

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function emptyProfileFromSaved(saved, onboarding) {
  const basics = getCoupleBasics();
  return {
    partnerOne: saved?.partnerOne || '',
    partnerTwo: saved?.partnerTwo || '',
    weddingDate: toDateInput(saved?.weddingDate || onboarding?.weddingDate || basics.weddingDate),
    district: saved?.district || onboarding?.location || basics.district || '',
    ceremonyType: normalizeCeremonyType(saved?.ceremonyType || onboarding?.ceremonyType),
    guestCount: String(saved?.guestCount || '150'),
    budget: saved?.budget ? String(saved.budget) : '',
    scale: saved?.scale === 'luxury' ? 'premium' : (saved?.scale || 'standard'),
    venueType: saved?.venueType || onboarding?.venueType || '',
    planningStage: saved?.planningStage || onboarding?.planningStage || '',
  };
}

function WeddingProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const fromSignup = Boolean(location.state?.fromSignup);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return undefined;

    let active = true;
    (async () => {
      if (getUser()) {
        try {
          await hydrateUserData();
        } catch {
          /* keep cached values */
        }
      }
      if (active) setForm(emptyProfileFromSaved(getWeddingProfile(), getOnboarding()));
    })();

    return () => {
      active = false;
    };
  }, [loading, user?.id]);

  const update = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.partnerOne.trim() || !form.partnerTwo.trim()) {
      setError('Please complete both partner names.');
      return;
    }

    if (!form.budget || Number(form.budget) <= 0) {
      setError('Please enter a valid budget in LKR.');
      return;
    }

    if (!form.weddingDate) {
      setError('Please add your wedding date.');
      return;
    }

    if (!form.district) {
      setError('Please select your wedding location.');
      return;
    }

    setSubmitting(true);
    try {
      await saveWeddingProfile({
        partnerOne: form.partnerOne.trim(),
        partnerTwo: form.partnerTwo.trim(),
        guestCount: Number(form.guestCount),
        budget: Number(form.budget),
        scale: form.scale,
        weddingDate: form.weddingDate,
        district: form.district,
        ceremonyType: form.ceremonyType,
        venueType: form.venueType,
        planningStage: form.planningStage,
      });
      await ensureCoupleChecklist();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = fromSignup ? 'Create your wedding profile' : 'Edit your wedding profile';
  const subtitle = fromSignup
    ? 'Tell us about your celebration. Then you’ll enter your planning dashboard.'
    : 'Update your celebration details anytime. All other WowWed modules use this information.';

  const fields = form && (
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
        <div className="form__field">
          <PrettySelect
            label="Wedding location"
            icon="pin"
            value={form.district}
            placeholder="Select district"
            options={locationSelectOptions({ emptyLabel: 'Select district', extra: form.district })}
            onChange={update('district')}
          />
        </div>
        <label className="form__field">
          <span>Wedding date</span>
          <input type="date" value={form.weddingDate} onChange={update('weddingDate')} />
        </label>
      </div>

      <div className="form__field">
        <PrettySelect
          label="Ceremony type"
          icon="poruwa"
          value={form.ceremonyType}
          options={onboardingCeremonyTypes.map((type) => ({ value: type.label, label: type.label, icon: type.icon }))}
          onChange={update('ceremonyType')}
        />
      </div>

      <div className="form__row">
        <label className="form__field">
          <span>Expected guests</span>
          <input type="number" min="1" value={form.guestCount} onChange={update('guestCount')} />
        </label>
        <div className="form__field">
          <PrettySelect
            label="Wedding scale"
            icon="budget"
            value={form.scale}
            options={weddingScales.map((scale) => ({ value: scale.value, label: scale.label, icon: 'budget' }))}
            onChange={update('scale')}
          />
        </div>
      </div>

      <label className="form__field">
        <span>Total budget (LKR)</span>
        <input type="number" min="1" step="1" value={form.budget} onChange={update('budget')} placeholder="2500000" />
      </label>

      {error && <p className={fromSignup ? 'onboarding__error' : 'form__error'}>{error}</p>}

      {fromSignup ? (
        <button type="submit" className="onboarding__btn onboarding__btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save and go to dashboard'}
        </button>
      ) : (
        <Button type="submit" variant="primary" className="form__submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save wedding profile'}
        </Button>
      )}
    </form>
  );

  if (loading || !form) {
    if (fromSignup) {
      return (
        <OnboardingLayout step={3} totalSteps={3} variant="couple" wide>
          <h1 className="onboarding__title">{title}</h1>
          <p className="onboarding__subtitle">Loading your details…</p>
        </OnboardingLayout>
      );
    }
    return <FormLayout title={title} subtitle="Loading…"><p>Loading your profile…</p></FormLayout>;
  }

  if (fromSignup) {
    return (
      <OnboardingLayout
        step={3}
        totalSteps={3}
        variant="couple"
        wide
        backTo={user ? '/dashboard' : coupleOnboarding.route}
        backLabel={user ? '← Skip to dashboard' : '← Back'}
      >
        <h1 className="onboarding__title">{title}</h1>
        <p className="onboarding__subtitle">{subtitle}</p>
        {fields}
      </OnboardingLayout>
    );
  }

  return (
    <FormLayout
      title={title}
      subtitle={subtitle}
      backTo={user ? '/dashboard' : coupleOnboarding.route}
    >
      {fields}
    </FormLayout>
  );
}

export default WeddingProfilePage;
