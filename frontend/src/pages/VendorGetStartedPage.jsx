import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import OnboardingOption from '../components/ui/OnboardingOption';
import { districts, vendorCategoryOptions, vendorStages } from '../data/formOptions';
import { saveOnboarding } from '../utils/storage';
import { toggleListItem } from '../utils/vendorMeta';

function VendorGetStartedPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    role: 'vendor',
    vendorStage: '',
    vendorCategories: [],
    vendorDistricts: [],
  });

  const toggleCategory = (label) => {
    setForm((f) => ({
      ...f,
      vendorCategories: toggleListItem(f.vendorCategories, label),
    }));
  };

  const toggleDistrict = (district) => {
    setForm((f) => ({
      ...f,
      vendorDistricts: toggleListItem(f.vendorDistricts, district),
    }));
  };

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
    if (!form.vendorCategories.length) {
      setError('Please select at least one service category.');
      return;
    }
    if (!form.vendorDistricts.length) {
      setError('Please select at least one business district.');
      return;
    }
    saveOnboarding({
      ...form,
      vendorCategory: form.vendorCategories[0],
      vendorDistrict: form.vendorDistricts[0],
      completedAt: new Date().toISOString(),
    });
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
        <legend>Service categories *</legend>
        <p className="onboarding__hint">Select all services you offer — you can choose more than one.</p>
        <div className="onboarding__options onboarding__options--grid">
          {vendorCategoryOptions.map((opt) => (
            <OnboardingOption
              key={opt.label}
              option={opt}
              tile
              selected={form.vendorCategories.includes(opt.label)}
              onSelect={() => toggleCategory(opt.label)}
            />
          ))}
        </div>
        {form.vendorCategories.length > 0 && (
          <p className="onboarding__selected-count">{form.vendorCategories.length} selected</p>
        )}
      </fieldset>

      <fieldset className="onboarding__group">
        <legend>Business districts *</legend>
        <p className="onboarding__hint">Select every district where you provide services.</p>
        <div className="onboarding__options onboarding__options--districts">
          {districts.map((district) => (
            <button
              key={district}
              type="button"
              className={`onboarding__district${form.vendorDistricts.includes(district) ? ' is-on' : ''}`}
              onClick={() => toggleDistrict(district)}
            >
              {district}
            </button>
          ))}
        </div>
        {form.vendorDistricts.length > 0 && (
          <p className="onboarding__selected-count">{form.vendorDistricts.length} selected</p>
        )}
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
