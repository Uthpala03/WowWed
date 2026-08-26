import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import OnboardingIcon from '../components/ui/OnboardingIcon';
import OnboardingOption from '../components/ui/OnboardingOption';
import PrettySelect from '../components/ui/PrettySelect';
import {
  locationSelectOptions,
  onboardingCeremonyTypes,
  optionStyle,
  planningStages,
  venueTypes,
} from '../data/formOptions';
import { useAuth } from '../context/AuthContext';
import {
  beginGuestOnboarding,
  getOnboarding,
  getWeddingProfile,
  hydrateUserData,
  persistOnboarding,
} from '../utils/storage';

function emptyCoupleForm() {
  return {
    role: 'couple',
    planningStage: '',
    location: '',
    weddingDate: '',
    venueType: '',
    ceremonyType: '',
  };
}

function formFromOwnData() {
  const saved = getOnboarding();
  const profile = getWeddingProfile();
  if (!saved && !profile) return emptyCoupleForm();
  return {
    role: 'couple',
    planningStage: saved?.planningStage || profile?.planningStage || '',
    location: saved?.location || profile?.district || '',
    weddingDate: String(saved?.weddingDate || profile?.weddingDate || '').slice(0, 10),
    venueType: saved?.venueType || profile?.venueType || '',
    ceremonyType: saved?.ceremonyType || '',
  };
}

function CoupleGetStartedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const isNewStart = searchParams.get('new') === '1';
  const [step, setStep] = useState(2);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyCoupleForm);

  useEffect(() => {
    if (loading) return undefined;

    let active = true;

    if (!user && isNewStart) {
      beginGuestOnboarding();
      setForm(emptyCoupleForm());
      setStep(2);
      navigate('/get-started/couple', { replace: true });
      return undefined;
    }

    (async () => {
      if (user) {
        try {
          await hydrateUserData();
        } catch {
          /* keep this couple's cached values only */
        }
      }
      if (!active) return;
      setForm(formFromOwnData());
      setStep(2);
    })();

    return () => {
      active = false;
    };
  }, [loading, user?.id, isNewStart, navigate, user]);

  const goNext = () => {
    setError('');
    if (!form.planningStage) {
      setError('Please select where you are in planning.');
      return;
    }
    setStep(2);
  };

  const complete = async () => {
    setError('');
    if (!form.venueType) {
      setError('Please select a venue type.');
      return;
    }
    if (!form.ceremonyType) {
      setError('Please select a ceremony type.');
      return;
    }
    setSaving(true);
    try {
      await persistOnboarding({
        ...form,
        location: form.location.trim(),
        weddingDate: form.weddingDate,
        completedAt: new Date().toISOString(),
      });
      navigate(user ? '/wedding-profile' : '/create-account', {
        state: user ? { fromSignup: true } : undefined,
      });
    } catch (err) {
      setError(err.message || 'Could not save your wedding details.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 1) {
    return (
      <OnboardingLayout step={1} totalSteps={3} variant="couple">
        <h1 className="onboarding__title">Let&apos;s plan your wedding</h1>
        <p className="onboarding__subtitle">Tell us where you are in your planning journey.</p>

        <fieldset className="onboarding__group">
          <legend>Where are you in planning?</legend>
          <div className="onboarding__options onboarding__options--stack">
            {planningStages.map((opt) => (
              <OnboardingOption
                key={opt.id}
                option={opt}
                selected={form.planningStage === opt.id}
                onSelect={() => setForm((f) => ({ ...f, planningStage: opt.id }))}
              />
            ))}
          </div>
        </fieldset>

        {error && <p className="onboarding__error">{error}</p>}
        <button type="button" className="onboarding__btn onboarding__btn--primary" onClick={goNext}>Next</button>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={1} totalSteps={3} variant="couple">
      <h1 className="onboarding__title">Almost there!</h1>
      <p className="onboarding__subtitle">Just a few more details to personalize your dashboard.</p>

      <div className="onboarding__field">
        <PrettySelect
          label="Wedding location (Optional)"
          icon="pin"
          value={form.location}
          placeholder="Select district"
          options={locationSelectOptions({ emptyLabel: 'Select district', extra: form.location })}
          onChange={(location) => setForm((f) => ({ ...f, location }))}
        />
      </div>

      <label className="onboarding__field">
        <span>Wedding Date (Optional)</span>
        <div className="onboarding__input-wrap" style={optionStyle({ bg: '#e8f2ff', color: '#1565c0' })}>
          <span className="onboarding__option-icon onboarding__option-icon--input"><OnboardingIcon name="calendar" size={18} /></span>
          <input
            type="date"
            value={form.weddingDate}
            onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
          />
        </div>
      </label>

      <fieldset className="onboarding__group">
        <legend>Venue Type *</legend>
        <div className="onboarding__options onboarding__options--row">
          {venueTypes.map((opt) => (
            <OnboardingOption
              key={opt.id}
              option={opt}
              tile
              selected={form.venueType === opt.id}
              onSelect={() => setForm((f) => ({ ...f, venueType: opt.id }))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding__group">
        <legend>Ceremony Type *</legend>
        <div className="onboarding__options onboarding__options--grid">
          {onboardingCeremonyTypes.map((opt) => (
            <OnboardingOption
              key={opt.id}
              option={opt}
              tile
              selected={form.ceremonyType === opt.id}
              onSelect={() => setForm((f) => ({ ...f, ceremonyType: opt.id }))}
            />
          ))}
        </div>
      </fieldset>

      {error && <p className="onboarding__error">{error}</p>}
      <div className="onboarding__actions">
        <button type="button" className="onboarding__btn onboarding__btn--outline" onClick={() => setStep(1)}>Back</button>
        <button type="button" className="onboarding__btn onboarding__btn--primary" onClick={complete} disabled={saving}>
          {saving ? 'Saving…' : 'Complete Setup'}
        </button>
      </div>
    </OnboardingLayout>
  );
}

export default CoupleGetStartedPage;
