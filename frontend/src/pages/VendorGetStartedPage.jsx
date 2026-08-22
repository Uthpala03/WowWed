import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import OnboardingIcon from '../components/ui/OnboardingIcon';
import OnboardingOption from '../components/ui/OnboardingOption';
import { districts, vendorCategoryOptions, vendorStages } from '../data/formOptions';
import { saveOnboarding } from '../utils/storage';
import { toggleListItem } from '../utils/vendorMeta';

function SelectionChip({ label, onRemove }) {
  return (
    <span className="onboarding__chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>×</button>
    </span>
  );
}

function VendorGetStartedPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [form, setForm] = useState({
    role: 'vendor',
    vendorStage: '',
    vendorCategories: [],
    vendorDistricts: [],
  });

  const filteredDistricts = useMemo(() => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return districts;
    return districts.filter((d) => d.toLowerCase().includes(q));
  }, [districtSearch]);

  const toggleCategory = (label) => {
    setError('');
    setForm((f) => ({
      ...f,
      vendorCategories: toggleListItem(f.vendorCategories, label),
    }));
  };

  const toggleDistrict = (district) => {
    setError('');
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

  const canComplete = form.vendorCategories.length > 0 && form.vendorDistricts.length > 0;

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
    <OnboardingLayout step={2} variant="vendor" wide>
      <h1 className="onboarding__title">Almost there!</h1>
      <p className="onboarding__subtitle">Tell couples what you offer and where you work.</p>

      {(form.vendorCategories.length > 0 || form.vendorDistricts.length > 0) && (
        <div className="onboarding__selection-summary">
          <p className="onboarding__selection-summary-title">Your selections</p>
          <div className="onboarding__chips">
            {form.vendorCategories.map((cat) => (
              <SelectionChip key={cat} label={cat} onRemove={() => toggleCategory(cat)} />
            ))}
            {form.vendorDistricts.map((d) => (
              <SelectionChip key={d} label={d} onRemove={() => toggleDistrict(d)} />
            ))}
          </div>
        </div>
      )}

      <section className="onboarding__section-card">
        <div className="onboarding__section-head">
          <span className="onboarding__section-num">1</span>
          <div>
            <h2>Service categories</h2>
            <p>Tap every service you provide. You can pick more than one.</p>
          </div>
        </div>

        <div className="onboarding__options onboarding__options--grid">
          {vendorCategoryOptions.map((opt) => (
            <OnboardingOption
              key={opt.label}
              option={opt}
              tile
              multi
              selected={form.vendorCategories.includes(opt.label)}
              onSelect={() => toggleCategory(opt.label)}
            />
          ))}
        </div>

        <p className="onboarding__section-foot">
          {form.vendorCategories.length
            ? `${form.vendorCategories.length} categor${form.vendorCategories.length === 1 ? 'y' : 'ies'} selected`
            : 'No categories selected yet'}
        </p>
      </section>

      <section className="onboarding__section-card">
        <div className="onboarding__section-head">
          <span className="onboarding__section-num">2</span>
          <div>
            <h2>Business districts</h2>
            <p>Select every district where couples can book you.</p>
          </div>
        </div>

        <label className="onboarding__search">
          <OnboardingIcon name="pin" size={16} />
          <input
            type="search"
            value={districtSearch}
            onChange={(e) => setDistrictSearch(e.target.value)}
            placeholder="Search districts…"
            aria-label="Search districts"
          />
        </label>

        <div className="onboarding__options onboarding__options--districts">
          {filteredDistricts.map((district) => {
            const selected = form.vendorDistricts.includes(district);
            return (
              <button
                key={district}
                type="button"
                className={`onboarding__district${selected ? ' is-on' : ''}`}
                onClick={() => toggleDistrict(district)}
                aria-pressed={selected}
              >
                {selected && <span className="onboarding__district-check">✓</span>}
                {district}
              </button>
            );
          })}
        </div>

        {filteredDistricts.length === 0 && (
          <p className="onboarding__empty-search">No districts match your search.</p>
        )}

        <p className="onboarding__section-foot">
          {form.vendorDistricts.length
            ? `${form.vendorDistricts.length} district${form.vendorDistricts.length === 1 ? '' : 's'} selected`
            : 'No districts selected yet'}
        </p>
      </section>

      {error && <p className="onboarding__error">{error}</p>}
      <div className="onboarding__actions">
        <button type="button" className="onboarding__btn onboarding__btn--outline" onClick={() => setStep(1)}>Back</button>
        <button
          type="button"
          className="onboarding__btn onboarding__btn--primary"
          onClick={complete}
          disabled={!canComplete}
        >
          Complete Setup
        </button>
      </div>
    </OnboardingLayout>
  );
}

export default VendorGetStartedPage;
