import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import OnboardingIcon from '../components/ui/OnboardingIcon';
import OnboardingOption from '../components/ui/OnboardingOption';
import { districts, optionStyle, vendorCategoryOptions, vendorStages } from '../data/formOptions';
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
              <OnboardingOption
                key={opt.id}
                option={opt}
                selected={form.vendorStage === opt.id}
                onSelect={() => setForm((f) => ({ ...f, vendorStage: opt.id }))}
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
    <OnboardingLayout step={2} variant="vendor">
      <h1 className="onboarding__title">Almost there!</h1>
      <p className="onboarding__subtitle">A few details to set up your vendor listing.</p>

      <fieldset className="onboarding__group">
        <legend>Service category *</legend>
        <div className="onboarding__options onboarding__options--grid">
          {vendorCategoryOptions.map((opt) => (
            <OnboardingOption
              key={opt.label}
              option={opt}
              tile
              selected={form.vendorCategory === opt.label}
              onSelect={() => setForm((f) => ({ ...f, vendorCategory: opt.label }))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding__group">
        <legend>Business district *</legend>
        <label className="onboarding__field">
          <div className="onboarding__input-wrap" style={optionStyle({ bg: '#eef0ff', color: '#3949ab' })}>
            <span className="onboarding__option-icon onboarding__option-icon--input"><OnboardingIcon name="pin" size={18} /></span>
            <select
              className="onboarding__select onboarding__select--with-icon"
              value={form.vendorDistrict}
              onChange={(e) => setForm((f) => ({ ...f, vendorDistrict: e.target.value }))}
            >
              <option value="">Select district</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
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
