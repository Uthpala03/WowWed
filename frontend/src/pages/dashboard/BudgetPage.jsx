import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import {
  COST_CATEGORIES,
  COST_DISTRICTS,
  COST_TIERS,
  MODEL_ACCURACY,
  MODEL_NAME,
  comparePredictionToBudget,
  formatLkr,
  predictWeddingCost,
  predictionFormFromProfile,
} from '../../utils/costPrediction';
import { getBudget, getWeddingProfile, saveBudget } from '../../utils/storage';

const SUGGESTED_CATEGORIES = [
  'Venue & Catering',
  'Photography & Videography',
  'Attire & Jewellery',
  'Floral & Decor',
  'Entertainment',
  'Miscellaneous',
];

function emptyBudget(profile) {
  const total = Number(profile?.budget) || 0;
  return { total, categories: [], expenses: [] };
}

function normalizeBudget(raw, profile) {
  const base = emptyBudget(profile);
  if (!raw || typeof raw !== 'object') return base;
  return {
    total: Number(raw.total ?? base.total) || 0,
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
  };
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function BudgetPage() {
  const coupleData = useOutletContext() || {};
  const profile = coupleData.profile || getWeddingProfile() || {};

  const [budget, setBudget] = useState(() => normalizeBudget(coupleData.budget || getBudget(), profile));
  const [totalDraft, setTotalDraft] = useState(String(budget.total || ''));
  const [showTotalEdit, setShowTotalEdit] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [expenseForm, setExpenseForm] = useState({ label: '', amount: '', categoryId: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [sort, setSort] = useState('spent-desc');

  const [costForm, setCostForm] = useState(() => predictionFormFromProfile(profile));
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    setBudget(normalizeBudget(coupleData.budget || getBudget(), coupleData.profile || getWeddingProfile() || {}));
  }, [coupleData.budget, coupleData.profile]);

  useEffect(() => {
    setCostForm(predictionFormFromProfile(coupleData.profile || getWeddingProfile() || {}));
  }, [coupleData.profile]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const persist = (next) => {
    setBudget(next);
    saveBudget(next);
  };

  const spentTotal = useMemo(
    () => budget.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [budget.expenses],
  );

  const allocatedTotal = useMemo(
    () => budget.categories.reduce((sum, item) => sum + (Number(item.allocated) || 0), 0),
    [budget.categories],
  );

  const remaining = Math.max(0, (Number(budget.total) || 0) - spentTotal);

  const categoriesWithStats = useMemo(() => {
    return budget.categories.map((cat) => {
      const spent = budget.expenses
        .filter((exp) => exp.categoryId === cat.id)
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      const allocated = Number(cat.allocated) || 0;
      const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
      return { ...cat, spent, pct, over: allocated > 0 && spent > allocated };
    }).sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'allocated-desc') return b.allocated - a.allocated;
      return b.spent - a.spent;
    });
  }, [budget.categories, budget.expenses, sort]);

  const saveTotal = () => {
    const total = Math.max(0, Number(totalDraft) || 0);
    persist({ ...budget, total });
    setShowTotalEdit(false);
    showToast('Total budget updated');
  };

  const addCategory = (name) => {
    const label = (name || newCategory).trim();
    if (!label) return;
    if (budget.categories.some((cat) => cat.name.toLowerCase() === label.toLowerCase())) {
      showToast('Category already exists');
      return;
    }
    persist({
      ...budget,
      categories: [...budget.categories, { id: uid('cat'), name: label, allocated: 0 }],
    });
    setNewCategory('');
    showToast(`Added ${label}`);
  };

  const updateAllocated = (id, value) => {
    persist({
      ...budget,
      categories: budget.categories.map((cat) => (
        cat.id === id ? { ...cat, allocated: Math.max(0, Number(value) || 0) } : cat
      )),
    });
  };

  const removeCategory = (id) => {
    persist({
      ...budget,
      categories: budget.categories.filter((cat) => cat.id !== id),
      expenses: budget.expenses.filter((exp) => exp.categoryId !== id),
    });
  };

  const submitExpense = (e) => {
    e.preventDefault();
    const amount = Number(expenseForm.amount);
    if (!expenseForm.label.trim() || !amount) return;
    persist({
      ...budget,
      expenses: [
        {
          id: uid('exp'),
          label: expenseForm.label.trim(),
          amount,
          categoryId: expenseForm.categoryId || '',
          date: new Date().toISOString().slice(0, 10),
        },
        ...budget.expenses,
      ],
    });
    setExpenseForm({ label: '', amount: '', categoryId: '' });
    setShowExpenseForm(false);
    showToast('Expense logged');
  };

  const removeExpense = (id) => {
    persist({ ...budget, expenses: budget.expenses.filter((exp) => exp.id !== id) });
  };

  const runPrediction = async () => {
    setPredicting(true);
    setPredictError('');
    try {
      const result = await predictWeddingCost(costForm);
      setPrediction(result);
    } catch (err) {
      setPrediction(null);
      setPredictError(err.message || 'Cost model unavailable. Start the backend to load the ML API.');
    } finally {
      setPredicting(false);
    }
  };

  const applyEstimateToBudget = () => {
    if (!prediction?.estimated_total_lkr) return;
    persist({ ...budget, total: prediction.estimated_total_lkr });
    setTotalDraft(String(prediction.estimated_total_lkr));
    showToast('Total budget set from ML estimate');
  };

  const budgetCompare = prediction
    ? comparePredictionToBudget(prediction.estimated_total_lkr, budget.total)
    : null;

  const spentPct = budget.total > 0 ? Math.min(100, Math.round((spentTotal / budget.total) * 100)) : 0;
  const allocPct = budget.total > 0 ? Math.min(100, Math.round((allocatedTotal / budget.total) * 100)) : 0;

  return (
    <div className="dash-page dash-page--budget">
      <PageHeader moduleId="budget">
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={() => setShowExpenseForm(true)}>
            + Log expense
          </button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => setShowTotalEdit(true)}>
            Edit total
          </button>
        </div>
      </PageHeader>

      {toast && <div className="guest-import-toast">{toast}</div>}

      <section className="dash-card ai-prediction">
        <div className="ai-prediction__head">
          <div>
            <p className="ai-prediction__kicker">ML cost prediction</p>
            <h3>Predict vendor cost tier</h3>
            <p>Enter a quote to see if it fits budget, mid-range, premium, or luxury.</p>
          </div>
          <span className="ai-prediction__status">
            {MODEL_NAME} · {MODEL_ACCURACY} accuracy
          </span>
        </div>

        <div className="ai-prediction__form">
          <label className="dash-field">
            <span>Guest count</span>
            <input
              type="number"
              min="50"
              max="800"
              value={costForm.guest_count}
              onChange={(e) => setCostForm({ ...costForm, guest_count: e.target.value })}
            />
          </label>

          <PrettySelect
            label="Vendor category"
            icon="vendors"
            value={costForm.category}
            options={COST_CATEGORIES.map((label) => ({ value: label, label, icon: 'vendors' }))}
            onChange={(value) => setCostForm({ ...costForm, category: value })}
          />

          <PrettySelect
            label="District"
            icon="vendors"
            value={costForm.district}
            options={COST_DISTRICTS.map((label) => ({ value: label, label, icon: 'vendors' }))}
            onChange={(value) => setCostForm({ ...costForm, district: value })}
          />

          <PrettySelect
            label="Pricing type"
            icon="budget"
            value={String(costForm.per_person_pricing)}
            options={[
              { value: '1', label: 'Per person (pp)', icon: 'budget' },
              { value: '0', label: 'Flat package', icon: 'budget' },
            ]}
            onChange={(value) => setCostForm({ ...costForm, per_person_pricing: Number(value) })}
          />

          <label className="dash-field">
            <span>{costForm.per_person_pricing ? 'Price per guest (LKR)' : 'Package price (LKR)'}</span>
            <input
              type="number"
              min="0"
              value={costForm.base_unit_price}
              onChange={(e) => setCostForm({ ...costForm, base_unit_price: e.target.value })}
            />
          </label>

          <label className="dash-field">
            <span>Vendor rating</span>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={costForm.vendor_rating}
              onChange={(e) => setCostForm({ ...costForm, vendor_rating: e.target.value })}
            />
          </label>

          <PrettySelect
            label="Package detail"
            icon="analytics"
            value={String(costForm.package_complexity)}
            options={[1, 2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: n === 1 ? 'Simple quote' : n === 5 ? 'Very detailed' : `Level ${n}`,
              icon: 'analytics',
            }))}
            onChange={(value) => setCostForm({ ...costForm, package_complexity: Number(value) })}
          />

          <PrettySelect
            label="Spotlight vendor"
            icon="sparkle"
            value={String(costForm.is_spotlight)}
            options={[
              { value: '0', label: 'No', icon: 'sparkle' },
              { value: '1', label: 'Yes', icon: 'sparkle' },
            ]}
            onChange={(value) => setCostForm({ ...costForm, is_spotlight: Number(value) })}
          />
        </div>

        <div className="ai-prediction__scales">
          {COST_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`ai-prediction__scale${prediction?.cost_tier === tier.id ? ' is-active' : ''}`}
            >
              <strong>{tier.label}</strong>
              <small>{tier.hint}</small>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="dash-btn dash-btn--primary" onClick={runPrediction} disabled={predicting}>
            {predicting ? 'Predicting…' : 'Run prediction'}
          </button>
          {prediction && (
            <button type="button" className="dash-btn dash-btn--outline" onClick={applyEstimateToBudget}>
              Use estimate as total budget
            </button>
          )}
        </div>

        {predictError && <p className="ai-prediction__error">{predictError}</p>}

        {prediction && (
          <div className="ai-prediction__result">
            <p className="ai-prediction__total">
              {prediction.cost_tier_label || prediction.cost_tier}
              {' · '}
              {formatLkr(prediction.estimated_total_lkr)}
            </p>
            <p className="ai-prediction__range-copy">
              Typical range for this tier: {formatLkr(prediction.min_total_lkr)} – {formatLkr(prediction.max_total_lkr)}
              {prediction.confidence ? ` · ${Math.round(prediction.confidence * 100)}% confidence` : ''}
            </p>
            {budgetCompare && budgetCompare !== 'unknown' && (
              <div className={`ai-prediction__compare is-${budgetCompare}`}>
                <strong>
                  {budgetCompare === 'ok' && 'Within your budget'}
                  {budgetCompare === 'tight' && 'Close to your budget limit'}
                  {budgetCompare === 'over' && 'Above your set budget'}
                </strong>
                <span>
                  Your budget: {formatLkr(budget.total)} · Estimate: {formatLkr(prediction.estimated_total_lkr)}
                </span>
              </div>
            )}
            <p className="ai-prediction__note">
              Powered by {MODEL_NAME} ({MODEL_ACCURACY}). Trained on Sri Lankan wedding vendor quotes.
            </p>
          </div>
        )}
      </section>

      <div className="budget-top">
        <section className="dash-card">
          <div className="budget-summary__row">
            <strong>Budget overview</strong>
            <button type="button" className="budget-edit-btn" onClick={() => setShowTotalEdit(true)} title="Edit total">✏️</button>
          </div>
          <div className="budget-summary__stats budget-summary__stats--three">
            <div>
              <small>Total budget</small>
              <strong>{formatLkr(budget.total)}</strong>
            </div>
            <div>
              <small>Spent</small>
              <strong>{formatLkr(spentTotal)}</strong>
            </div>
            <div>
              <small>Remaining</small>
              <strong>{formatLkr(remaining)}</strong>
            </div>
          </div>
          <div
            className="budget-bar"
            style={{ '--alloc': `${allocPct}%`, '--spent': `${spentPct}%` }}
            aria-hidden
          />
          <p className="dash-panel__hint">
            {allocatedTotal > 0
              ? `${formatLkr(allocatedTotal)} allocated across ${budget.categories.length} categories`
              : 'Add categories below to plan your spending.'}
          </p>
        </section>

        <section className="dash-card budget-actions-card">
          <strong>Quick add category</strong>
          <div className="budget-cat-suggest">
            {SUGGESTED_CATEGORIES.map((name) => (
              <button
                key={name}
                type="button"
                className={`budget-cat-suggest__chip${budget.categories.some((c) => c.name === name) ? ' is-on' : ''}`}
                onClick={() => addCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input
              placeholder="Custom category…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.65rem', borderRadius: 10, border: '1px solid var(--color-border)' }}
            />
            <button type="button" className="dash-btn dash-btn--outline" onClick={() => addCategory()}>Add</button>
          </div>
        </section>
      </div>

      <div className="budget-toolbar">
        <strong>Categories ({budget.categories.length})</strong>
        <div className="budget-sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="spent-desc">Most spent</option>
            <option value="allocated-desc">Highest allocation</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="budget-categories">
        {categoriesWithStats.length === 0 ? (
          <div className="dash-empty dash-card">
            <p>No categories yet. Tap a suggestion above or add your own.</p>
          </div>
        ) : categoriesWithStats.map((cat) => (
          <article key={cat.id} className="dash-card budget-cat-card">
            <div className="budget-cat-card__head">
              <h4>{cat.name}</h4>
              <button type="button" className="budget-cat-card__btn budget-cat-card__btn--danger" onClick={() => removeCategory(cat.id)}>Remove</button>
            </div>
            <label className="budget-cat-card__amount">
              Allocated (LKR)
              <input
                type="number"
                min="0"
                value={cat.allocated || ''}
                onChange={(e) => updateAllocated(cat.id, e.target.value)}
              />
            </label>
            <div className="budget-cat-card__bar" style={{ width: `${cat.pct}%` }} />
            <div className="budget-cat-card__meta">
              <span>Spent {formatLkr(cat.spent)}</span>
              <span className={cat.over ? 'is-over' : ''}>
                {cat.allocated > 0 ? `${cat.pct}% of allocation` : 'No allocation set'}
              </span>
            </div>
            <button
              type="button"
              className="budget-cat-card__spend"
              onClick={() => {
                setExpenseForm({ label: '', amount: '', categoryId: cat.id });
                setShowExpenseForm(true);
              }}
            >
              + Log expense in {cat.name}
            </button>
          </article>
        ))}
      </div>

      <section className="dash-card" style={{ marginTop: '0.75rem' }}>
        <div className="budget-summary__row">
          <strong>Recent expenses ({budget.expenses.length})</strong>
        </div>
        {budget.expenses.length === 0 ? (
          <p className="dash-panel__hint">No expenses logged yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {budget.expenses.slice(0, 12).map((exp) => {
              const cat = budget.categories.find((c) => c.id === exp.categoryId);
              return (
                <li
                  key={exp.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.55rem 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <strong>{exp.label}</strong>
                    <small style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                      {cat?.name || 'Uncategorised'} · {exp.date}
                    </small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{formatLkr(exp.amount)}</strong>
                    <button type="button" className="budget-cat-card__btn budget-cat-card__btn--danger" onClick={() => removeExpense(exp.id)}>✕</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {showTotalEdit && (
        <div className="dash-overlay" onClick={() => setShowTotalEdit(false)}>
          <form className="dash-panel dash-panel--center" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); saveTotal(); }}>
            <h3>Total wedding budget (LKR)</h3>
            <label className="dash-field">
              <span>Amount</span>
              <input type="number" min="0" value={totalDraft} onChange={(e) => setTotalDraft(e.target.value)} autoFocus />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="dash-btn dash-btn--outline" onClick={() => setShowTotalEdit(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Save</button>
            </div>
          </form>
        </div>
      )}

      {showExpenseForm && (
        <div className="dash-overlay" onClick={() => setShowExpenseForm(false)}>
          <form className="dash-panel dash-panel--center dash-panel--expense" onClick={(e) => e.stopPropagation()} onSubmit={submitExpense}>
            <h3>Log expense</h3>
            <label className="dash-field">
              <span>Description</span>
              <input value={expenseForm.label} onChange={(e) => setExpenseForm({ ...expenseForm, label: e.target.value })} required />
            </label>
            <label className="dash-field">
              <span>Amount (LKR)</span>
              <input type="number" min="1" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
            </label>
            <PrettySelect
              label="Category"
              icon="budget"
              value={expenseForm.categoryId}
              options={[
                { value: '', label: 'Uncategorised', icon: 'budget' },
                ...budget.categories.map((cat) => ({ value: cat.id, label: cat.name, icon: 'budget' })),
              ]}
              onChange={(value) => setExpenseForm({ ...expenseForm, categoryId: value })}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="dash-btn dash-btn--outline" onClick={() => setShowExpenseForm(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Save expense</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BudgetPage;
