import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { vendorCategories } from '../data/dashboardData';
import {
  districts,
  onboardingCeremonyTypes,
  planningStages,
  vendorStages,
  venueTypes,
  weddingRoles,
} from '../data/formOptions';
import { saveOnboarding } from '../utils/storage';

function GetStartedPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    role: '',
    planningStage: '',
    vendorStage: '',
    location: '',
    weddingDate: '',
    venueType: '',
    ceremonyType: '',
    vendorCategory: '',
    vendorDistrict: '',
  });

  const isVendor = form.role === 'vendor';

  const selectRole = (roleId) => {
    setForm((f) => ({
      ...f,
      role: roleId,
      planningStage: '',
      vendorStage: '',
    }));
    setError('');
  };

  const goNext = () => {
    setError('');
    if (!form.role) {
      setError('Please select your role.');
      return;
    }
    if (isVendor) {
      if (!form.vendorStage) {
        setError('Please select where you are as a vendor.');
        return;
      }
    } else if (!form.planningStage) {
      setError('Please select where you are in planning.');
      return;
    }
    setStep(2);
  };

  const complete = () => {
    setError('');
    if (isVendor) {
      if (!form.vendorCategory) {
        setError('Please select your service category.');
        return;
      }
      if (!form.vendorDistrict) {
        setError('Please select your business district.');
        return;
      }
    } else {
      if (!form.venueType) {
        setError('Please select a venue type.');
        return;
      }
      if (!form.ceremonyType) {
        setError('Please select a ceremony type.');
        return;
      }
    }
    saveOnboarding({ ...form, completedAt: new Date().toISOString() });
    navigate('/create-account');
  };

  if (step === 1) {
    return (
      <OnboardingLayout step={1}>
        <h1 className="onboarding__title">Let&apos;s get started</h1>
        <p className="onboarding__subtitle">
          {isVendor
            ? 'Tell us about your wedding business.'
            : 'Tell us where you are in your planning journey.'}
        </p>

        <fieldset className="onboarding__group">
          <legend>What&apos;s your role?</legend>
          <div className="onboarding__options onboarding__options--pair">
            {weddingRoles.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`onboarding__option onboarding__option--tile${form.role === opt.id ? ' is-on' : ''}`}
                onClick={() => selectRole(opt.id)}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {form.role && (
          <fieldset className="onboarding__group">
            <legend>{isVendor ? 'Where are you as a vendor?' : 'Where are you in planning?'}</legend>
            <div className="onboarding__options onboarding__options--stack">
              {(isVendor ? vendorStages : planningStages).map((opt) => {
                const field = isVendor ? 'vendorStage' : 'planningStage';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`onboarding__option${form[field] === opt.id ? ' is-on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, [field]: opt.id }))}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {error && <p className="onboarding__error">{error}</p>}
        <button type="button" className="onboarding__btn onboarding__btn--primary" onClick={goNext}>Next</button>
      </OnboardingLayout>
    );
  }

  if (isVendor) {
    return (
      <OnboardingLayout step={2}>
        <h1 className="onboarding__title">Almost there!</h1>
        <p className="onboarding__subtitle">A few details to set up your vendor profile.</p>

        <fieldset className="onboarding__group">
          <legend>Service category *</legend>
          <div className="onboarding__options onboarding__options--grid">
            {vendorCategories.filter((c) => c !== 'All Categories').map((category) => (
              <button
                key={category}
                type="button"
                className={`onboarding__option onboarding__option--tile${form.vendorCategory === category ? ' is-on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, vendorCategory: category }))}
              >
                {category}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="onboarding__group">
          <legend>Business district *</legend>
          <label className="onboarding__field">
            <select
              className="onboarding__select"
              value={form.vendorDistrict}
              onChange={(e) => setForm((f) => ({ ...f, vendorDistrict: e.target.value }))}
            >
              <option value="">Select district</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </label>
        </fieldset>

        {error && <p className="onboarding__error">{error}</p>}
        <div className="onboarding__actions">
          <button type="button" className="onboarding__btn onboarding__btn--outline" onClick={() => setStep(1)}>Back</button>
          <button type="button" className="onboarding__btn onboarding__btn--primary" onClick={complete}>Complete Setup</button>
        </div>
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
