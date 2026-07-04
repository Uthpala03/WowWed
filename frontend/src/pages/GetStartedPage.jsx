import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import {
  onboardingCeremonyTypes,
  planningStages,
  venueTypes,
  weddingRoles,
} from '../data/formOptions';
import { saveOnboarding } from '../utils/storage';

function GetStartedPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    planningStage: '',
    role: '',
    location: '',
    weddingDate: '',
    venueType: '',
    ceremonyType: '',
  });

  const goNext = () => {
    setError('');
    if (!form.planningStage) {
      setError('Please select where you are in planning.');
      return;
    }
    if (!form.role) {
      setError('Please select your role in the wedding.');
      return;
    }
    setStep(2);
  };

  const complete = () => {
    setError('');
    if (!form.venueType) {
      setError('Please select a venue type.');
      return;
    }
    if (!form.ceremonyType) {
      setError('Please select a ceremony type.');
      return;
    }
    saveOnboarding({ ...form, completedAt: new Date().toISOString() });
    navigate('/create-account');
  };

  if (step === 1) {
    return (
      <OnboardingLayout step={1}>
        <h1 className="onboarding__title">Let&apos;s get started</h1>
        <p className="onboarding__subtitle">Tell us where you are in your planning journey.</p>

        <fieldset className="onboarding__group">
          <legend>Where are you in planning?</legend>
          <div className="onboarding__options onboarding__options--stack">
            {planningStages.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`onboarding__option${form.planningStage === opt.id ? ' is-on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, planningStage: opt.id }))}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="onboarding__group">
          <legend>What&apos;s your role in the wedding?</legend>
          <div className="onboarding__options onboarding__options--pair">
            {weddingRoles.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`onboarding__option onboarding__option--tile${form.role === opt.id ? ' is-on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, role: opt.id }))}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="onboarding__error">{error}</p>}
        <button type="button" className="onboarding__btn onboarding__btn--primary" onClick={goNext}>Next</button>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={2}>
      <h1 className="onboarding__title">Almost there!</h1>
      <p className="onboarding__subtitle">Just a few more details to personalize your experience.</p>

      <label className="onboarding__field">
        <span>Wedding Location (Optional)</span>
        <div className="onboarding__input-wrap">
          <span>📍</span>
          <input
            placeholder="Enter city name"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
        </div>
      </label>

      <label className="onboarding__field">
        <span>Wedding Date (Optional)</span>
        <div className="onboarding__input-wrap">
          <span>📅</span>
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
            <button
              key={opt.id}
              type="button"
              className={`onboarding__option onboarding__option--tile${form.venueType === opt.id ? ' is-on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, venueType: opt.id }))}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding__group">
        <legend>Ceremony Type *</legend>
        <div className="onboarding__options onboarding__options--grid">
          {onboardingCeremonyTypes.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`onboarding__option onboarding__option--tile${form.ceremonyType === opt.id ? ' is-on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, ceremonyType: opt.id }))}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p className="onboarding__error">{error}</p>}
      <div className="onboarding__actions">
        <button type="button" className="onboarding__btn onboarding__btn--outline" onClick={() => setStep(1)}>Back</button>
        <button type="button" className="onboarding__btn onboarding__btn--primary" onClick={complete}>Complete Setup</button>
      </div>
    </OnboardingLayout>
  );
}

export default GetStartedPage;
