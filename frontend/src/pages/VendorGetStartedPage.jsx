import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { vendorCategoryLabels } from '../data/dashboardData';
import { districts, vendorStages } from '../data/formOptions';
import { saveOnboarding } from '../utils/storage';

function VendorGetStartedPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    role: 'vendor',
    vendorStage: '',
    vendorCategory: '',
    vendorDistrict: '',
  });

  const goNext = () => {
    setError('');
    if (!form.vendorStage) {
      setError('Please select where you are as a vendor.');
      return;
    }
    setStep(2);
  };

  const complete = () => {
    setError('');
    if (!form.vendorCategory) {
      setError('Please select your service category.');
      return;
    }
    if (!form.vendorDistrict) {
      setError('Please select your business district.');
      return;
    }
    saveOnboarding({ ...form, completedAt: new Date().toISOString() });
    navigate('/create-account');
  };

  if (step === 1) {
    return (
      <OnboardingLayout step={1} variant="vendor">
        <h1 className="onboarding__title">Join WowWed as a vendor</h1>
        <p className="onboarding__subtitle">Tell us about your wedding business.</p>

        <fieldset className="onboarding__group">
          <legend>Where are you as a vendor?</legend>
          <div className="onboarding__options onboarding__options--stack">
            {vendorStages.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`onboarding__option${form.vendorStage === opt.id ? ' is-on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, vendorStage: opt.id }))}
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
    <OnboardingLayout step={2} variant="vendor">
      <h1 className="onboarding__title">Almost there!</h1>
      <p className="onboarding__subtitle">A few details to set up your vendor listing.</p>

      <fieldset className="onboarding__group">
        <legend>Service category *</legend>
        <div className="onboarding__options onboarding__options--grid">
          {vendorCategoryLabels.map((category) => (
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

export default VendorGetStartedPage;
