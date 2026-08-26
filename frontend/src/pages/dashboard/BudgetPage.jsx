import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getBudget, getBookings, getWeddingProfile, saveBudget, saveWeddingProfile } from '../../utils/storage';
import {
  COST_CEREMONIES,
  COST_DISTRICTS,
  COST_SCALES,
  predictWeddingCost,
  predictionFormFromProfile,
} from '../../utils/costPrediction';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import AppIcon from '../../components/ui/AppIcon';
import { isPaid } from '../../utils/bookingStatus';

const CEREMONY_ICONS = {
  Poruwa: 'poruwa',
  Buddhist: 'poruwa',
  Hindu: 'hindu',
  Christian: 'church',
  Islamic: 'nikah',
};

const categoryColors = ['#e8a88c', '#7a9eb8', '#b8a0c8', '#d4b85c', '#c96a5a', '#6b9e78', '#5c6d8a', '#8a7268'];
const sortOptions = ['Default', 'Name', 'Remaining budget', 'Budget allocated'];
const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Venue', icon: 'venue' },
  { name: 'Catering', icon: 'catering' },
  { name: 'Photography', icon: 'camera' },
  { name: 'Videography', icon: 'camera' },
  { name: 'Attire', icon: 'bridal' },
  { name: 'Decorations', icon: 'floral' },
  { name: 'Entertainment', icon: 'reception' },
  { name: 'Transport', icon: 'pin' },
  { name: 'Beauty', icon: 'ring' },
  { name: 'Ceremony', icon: 'poruwa' },
  { name: 'Invitations', icon: 'invitations' },
  { name: 'Vendors', icon: 'vendors' },
];
const ADD_CATEGORY_VALUE = '__add_category__';

function categoryIconFor(name) {
  const raw = String(name || '').toLowerCase();
  const match = DEFAULT_BUDGET_CATEGORIES.find((item) => (
    raw === item.name.toLowerCase() || raw.includes(item.name.toLowerCase())
  ));
  return match?.icon || 'budget';
}

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function costFit(estimate, total) {
  const est = Number(estimate);
  const tot = Number(total);
  if (!tot) return null;
  if (est > tot) return { kind: 'over', word: 'Over', detail: money(est - tot) };
  if (est / tot >= 0.85) return { kind: 'tight', word: 'Tight', detail: `${money(tot - est)} left` };
  return { kind: 'ok', word: 'Good', detail: `${money(tot - est)} under` };
}

function BudgetPage() {
  const coupleData = useOutletContext();
  const profile = coupleData?.profile || getWeddingProfile();
  const onboarding = coupleData?.onboarding;
  const profileBudget = Number(profile?.budget) || 0;
  const bookings = useMemo(() => {
    const merged = new Map();
    [...(getBookings() || []), ...(coupleData?.bookings || [])].forEach((booking) => {
      if (booking?.id) merged.set(booking.id, booking);
    });
    return [...merged.values()];
  }, [coupleData]);
  const hiredBookings = useMemo(
    () => bookings.filter((booking) => isPaid(booking.status)),
    [bookings],
  );
  const emptyBudget = { total: profileBudget, categories: [], expenses: [] };

  const budgetFromCouple = () => {
    const stored = coupleData?.budget || getBudget() || emptyBudget;
    return {
      ...stored,
      total: profileBudget || Number(stored.total) || 0,
      categories: stored.categories || [],
      expenses: stored.expenses || [],
    };
  };

  const [budget, setBudget] = useState(budgetFromCouple);
  const [showCategory, setShowCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showExpense, setShowExpense] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem('wowwed_budget_sort') || 'Default';
    } catch {
      return 'Default';
    }
  });
  const [catForm, setCatForm] = useState({ name: '', allocated: 0 });
  const [expForm, setExpForm] = useState({ name: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [expenseError, setExpenseError] = useState('');
  const [editTotal, setEditTotal] = useState(budget.total);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');
  const [costForm, setCostForm] = useState(() => predictionFormFromProfile(profile, {
    ceremonyType: onboarding?.ceremonyType,
    district: onboarding?.location,
    weddingDate: profile?.weddingDate || onboarding?.weddingDate,
    guestListCount: (coupleData?.guests || []).length,
    budgetTotal: profileBudget,
  }));
  const userPickedScale = useRef(false);

  const loadPrediction = async (form) => {
    setPredicting(true);
    setPredictError('');
    try {
      const result = await predictWeddingCost({
        ...form,
        weddingDate: profile?.weddingDate || onboarding?.weddingDate,
      });
      setPrediction(result);
    } catch (err) {
      setPredictError(err.message || 'Could not run cost prediction.');
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    const next = budgetFromCouple();
    setBudget((current) => {
      const incoming = next.expenses?.length || 0;
      const local = current.expenses?.length || 0;
      if (local > incoming) return current;
      return next;
    });
    setEditTotal(next.total);
  }, [coupleData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPrediction(costForm);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [costForm.guestCount, costForm.district, costForm.ceremonyType, costForm.scale, costForm.seasonal]);

  const runPrediction = () => loadPrediction(costForm);

  const chooseScale = (scale) => {
    userPickedScale.current = true;
    setCostForm((prev) => ({ ...prev, scale }));
    const current = coupleData?.profile || getWeddingProfile() || {};
    saveWeddingProfile({ ...current, scale }).catch(() => {});
  };

  const spent = useMemo(() => {
    const expenseTotal = (budget.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    const missingHires = hiredBookings.filter((b) => !(budget.expenses || []).some(
      (e) => e.bookingId === b.id || e.id === `hire-${b.id}`,
    ));
    return expenseTotal + missingHires.reduce((s, b) => s + Number(b.amount || 0), 0);
  }, [budget, hiredBookings]);
  const spentInCategory = (categoryId) => {
    const fromExpenses = (budget.expenses || [])
      .filter((item) => item.categoryId === categoryId)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const fromHires = hiredBookings
      .filter((booking) => {
        const already = (budget.expenses || []).some(
          (item) => item.bookingId === booking.id || item.id === `hire-${booking.id}`,
        );
        if (already) return false;
        const cat = (budget.categories || []).find((item) => item.id === categoryId);
        return cat && String(booking.category || 'Vendors').toLowerCase() === String(cat.name).toLowerCase();
      })
      .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
    return fromExpenses + fromHires;
  };
  const categoryName = (id) => (budget.categories || []).find((item) => item.id === id)?.name || '';
  const payments = useMemo(() => {
    const rows = (budget.expenses || []).map((item) => ({
      id: item.id,
      name: item.name,
      amount: Number(item.amount || 0),
      detail: item.hired || item.bookingId
        ? 'Hired in WowWed'
        : (categoryName(item.categoryId) || 'Paid yourself'),
    }));
    hiredBookings.forEach((booking) => {
      const exists = (budget.expenses || []).some(
        (item) => item.bookingId === booking.id || item.id === `hire-${booking.id}`,
      );
      if (exists) return;
      rows.push({
        id: booking.id,
        name: booking.vendorName,
        amount: Number(booking.amount || 0),
        detail: 'Hired in WowWed',
      });
    });
    return rows;
  }, [budget.expenses, budget.categories, hiredBookings]);
  const overspent = spent > budget.total;
  const left = budget.total - spent;
  const pct = budget.total ? Math.min(100, Math.round((spent / budget.total) * 100)) : 0;

  const sortedCategories = useMemo(() => {
    const cats = [...(budget.categories || [])];
    if (sortBy === 'Name') cats.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'Budget allocated') cats.sort((a, b) => Number(b.allocated) - Number(a.allocated));
    if (sortBy === 'Remaining budget') {
      cats.sort((a, b) => {
        const spentA = budget.expenses.filter((e) => e.categoryId === a.id).reduce((s, e) => s + Number(e.amount), 0);
        const spentB = budget.expenses.filter((e) => e.categoryId === b.id).reduce((s, e) => s + Number(e.amount), 0);
        return (Number(b.allocated) - spentB) - (Number(a.allocated) - spentA);
      });
    }
    return cats;
  }, [budget, sortBy]);

  const changeSort = (value) => {
    setSortBy(value);
    try {
      localStorage.setItem('wowwed_budget_sort', value);
    } catch {
      /* ignore */
    }
  };

  const closeIfBackdrop = (close) => (event) => {
    if (event.target === event.currentTarget) close();
  };

  const persist = (next) => {
    setBudget(next);
    saveBudget(next);
  };

  const createCategory = (name, allocated = 0) => {
    const label = String(name || '').trim();
    if (!label) return null;
    const existing = (budget.categories || []).find(
      (item) => String(item.name).toLowerCase() === label.toLowerCase(),
    );
    if (existing) return existing;
    const category = {
      id: `c${Date.now()}`,
      name: label,
      allocated: Number(allocated) || 0,
      color: categoryColors[budget.categories.length % categoryColors.length],
    };
    persist({
      ...budget,
      categories: [...budget.categories, category],
    });
    return category;
  };

  const addCategory = (e) => {
    e.preventDefault();
    const label = String(catForm.name || '').trim();
    if (!label) return;
    if (editingCategoryId) {
      persist({
        ...budget,
        categories: budget.categories.map((item) => (
          item.id === editingCategoryId
            ? { ...item, name: label, allocated: Number(catForm.allocated) || 0 }
            : item
        )),
      });
    } else {
      const category = createCategory(label, catForm.allocated);
      if (!category) return;
      setExpForm((form) => ({ ...form, categoryId: category.id }));
    }
    setCatForm({ name: '', allocated: 0 });
    setEditingCategoryId(null);
    setShowCategory(false);
  };

  const openAddExpense = (categoryId = '') => {
    setExpenseError('');
    setExpForm({
      name: '',
      amount: '',
      categoryId: categoryId || '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setShowExpense(true);
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCatForm({ name: '', allocated: 0 });
    setShowCategory(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setCatForm({ name: cat.name, allocated: Number(cat.allocated) || 0 });
    setShowCategory(true);
  };

  const deleteCategory = (cat) => {
    const ok = window.confirm(`Delete “${cat.name}”? Expenses in this category stay, but become uncategorized.`);
    if (!ok) return;
    persist({
      ...budget,
      categories: budget.categories.filter((item) => item.id !== cat.id),
      expenses: (budget.expenses || []).map((item) => (
        item.categoryId === cat.id ? { ...item, categoryId: '' } : item
      )),
    });
  };

  const chooseExpenseCategory = (categoryId) => {
    if (categoryId === ADD_CATEGORY_VALUE) {
      openCreateCategory();
      return;
    }
    if (String(categoryId).startsWith('__new__:')) {
      const category = createCategory(String(categoryId).slice(8));
      setExpForm((form) => ({ ...form, categoryId: category?.id || '' }));
      return;
    }
    setExpForm((form) => ({ ...form, categoryId }));
  };

  const expenseCategoryOptions = useMemo(() => {
    const existing = budget.categories || [];
    const existingNames = new Set(existing.map((item) => String(item.name).toLowerCase()));
    const suggestions = DEFAULT_BUDGET_CATEGORIES
      .filter((item) => !existingNames.has(item.name.toLowerCase()))
      .map((item) => ({
        value: `__new__:${item.name}`,
        label: item.name,
        icon: item.icon,
      }));
    return [
      { value: '', label: 'No category', icon: 'budget' },
      ...existing.map((item) => ({
        value: item.id,
        label: item.name,
        icon: categoryIconFor(item.name),
      })),
      ...suggestions,
      { value: ADD_CATEGORY_VALUE, label: '+ Add category', icon: 'sparkle' },
    ];
  }, [budget.categories]);

  const addExpense = (e) => {
    e.preventDefault();
    const amount = Number(expForm.amount);
    if (!expForm.name.trim() || !(amount > 0)) {
      setExpenseError('Enter a name and an amount you already paid.');
      return;
    }
    setBudget((current) => {
      const expense = {
        id: `e${Date.now()}`,
        name: expForm.name.trim(),
        amount,
        categoryId: expForm.categoryId || '',
        date: expForm.date,
        notes: expForm.notes,
        hired: false,
      };
      const expenses = [...(current.expenses || []), expense];
      const categories = (current.categories || []).map((item) => {
        if (item.id !== expense.categoryId) return item;
        const catSpent = expenses
          .filter((row) => row.categoryId === item.id)
          .reduce((sum, row) => sum + Number(row.amount || 0), 0);
        return { ...item, allocated: Math.max(Number(item.allocated) || 0, catSpent) };
      });
      const next = { ...current, expenses, categories };
      saveBudget(next);
      return next;
    });
    setExpForm({ name: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    setExpenseError('');
    setShowExpense(false);
  };

  const saveBudgetTotal = (e) => {
    e.preventDefault();
    persist({ ...budget, total: Number(editTotal) });
    setShowEditBudget(false);
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="budget" />

      {overspent && (
        <div className="dash-alert dash-alert--danger">
          <strong>Budget overspend alert</strong>
          <p>You have exceeded your total budget by Rs. {(spent - budget.total).toLocaleString()}. Review expenses or adjust your budget.</p>
        </div>
      )}

      <div className="dash-card ai-prediction">
        <div className="ai-prediction__head">
          <div>
            <h3>Likely cost</h3>
            <p>Cost prediction</p>
          </div>
          {predicting && <span className="ai-prediction__status">Updating…</span>}
        </div>

        <div className="ai-prediction__form">
          <label className="cost-guest-field">
            <span className="pretty-select__icon" aria-hidden="true"><AppIcon name="guests" size={16} /></span>
            <span className="pretty-select__copy">
              <small>Guests</small>
              <input
                type="number"
                min="50"
                max="800"
                value={costForm.guestCount}
                onChange={(e) => setCostForm({ ...costForm, guestCount: e.target.value })}
              />
            </span>
          </label>
          <div className="dash-field">
            <PrettySelect
              label="District"
              icon="pin"
              value={costForm.district}
              options={COST_DISTRICTS.map((d) => ({ value: d, label: d, icon: 'pin' }))}
              onChange={(district) => setCostForm({ ...costForm, district })}
            />
          </div>
          <div className="dash-field">
            <PrettySelect
              label="Ceremony"
              icon="poruwa"
              value={costForm.ceremonyType}
              options={COST_CEREMONIES.map((c) => ({ value: c.value, label: c.label, icon: CEREMONY_ICONS[c.value] || 'poruwa' }))}
              onChange={(ceremonyType) => setCostForm({ ...costForm, ceremonyType })}
            />
          </div>
          <div className="dash-field">
            <PrettySelect
              label="Season"
              icon="calendar"
              value={costForm.seasonal}
              options={[
                { value: 0, label: 'Regular', icon: 'calendar' },
                { value: 1, label: 'Peak', icon: 'hearts' },
              ]}
              onChange={(seasonal) => setCostForm({ ...costForm, seasonal: Number(seasonal) })}
            />
          </div>
        </div>

        <div className="ai-prediction__scales">
          {COST_SCALES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`ai-prediction__scale${costForm.scale === s.value ? ' is-active' : ''}`}
              onClick={() => chooseScale(s.value)}
            >
              <strong>{s.label}</strong>
              <small>{s.hint}</small>
            </button>
          ))}
        </div>

        {predictError && (
          <p className="ai-prediction__error">
            {predictError}
            {' '}
            <button type="button" className="ai-prediction__retry" onClick={runPrediction}>Try again</button>
          </p>
        )}

        <div className="ai-prediction__result">
          {prediction ? (
            <>
              <p className="ai-prediction__kicker">Likely total</p>
              <p className="ai-prediction__total">{money(prediction.estimate)}</p>
              <p className="ai-prediction__range-copy">
                Usually {money(prediction.low)} – {money(prediction.high)}
              </p>
              {budget.total > 0 && (() => {
                const fit = costFit(prediction.estimate, budget.total);
                return (
                  <p className={`ai-prediction__compare is-${fit.kind}`}>
                    <strong>{fit.word}</strong>
                    <span>{fit.detail}</span>
                  </p>
                );
              })()}
            </>
          ) : (
            <p className="ai-prediction__note">{predicting ? 'Updating…' : 'Pick your details to see a total.'}</p>
          )}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="dash-card hired-vendors">
          <h3>Paid so far</h3>
          <ul className="hired-vendors__list">
            {payments.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.detail}</small>
                </span>
                <em>{money(item.amount)}</em>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="budget-top">
        <div className="dash-card budget-summary">
          <div className="budget-summary__stats budget-summary__stats--three">
            <div>
              <small>Spent</small>
              <strong>{money(spent)}</strong>
            </div>
            <div>
              <small>Left</small>
              <strong>{money(left)}</strong>
            </div>
            <div>
              <small>Your budget</small>
              <strong>{money(budget.total)}</strong>
              <button type="button" className="budget-edit-btn" onClick={() => { setEditTotal(budget.total); setShowEditBudget(true); }} title="Edit total budget">
                <AppIcon name="edit" size={14} />
              </button>
            </div>
          </div>
          <div className="budget-bar" style={{ '--spent': `${pct}%`, '--alloc': `${pct}%` }} />
          <small>{pct}% of your budget is already spent</small>
        </div>
        <div className="dash-card budget-actions-card">
          <h3>Paid a salon or shop?</h3>
          <p>Add it here. It comes out of your budget, same as a hired vendor.</p>
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => openAddExpense()}>+ Add a payment</button>
          <Link to="/dashboard/budget/expenses" className="dash-btn dash-btn--white">See all payments »</Link>
        </div>
      </div>

      <div className="budget-toolbar">
        <div className="budget-sort">
          <PrettySelect
            label="Sort"
            icon="budget"
            value={sortBy}
            options={sortOptions.map((o) => ({ value: o, label: o, icon: 'budget' }))}
            onChange={changeSort}
          />
        </div>
        <button type="button" className="dash-btn dash-btn--primary" onClick={openCreateCategory}>+ Add a budget category</button>
      </div>

      <div className="dash-card budget-cat-wrap">
        {budget.categories.length === 0 ? (
          <div className="dash-empty">
            <p>No categories yet</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={openCreateCategory}>Create Your First Category</button>
          </div>
        ) : (
          <div className="budget-categories">
            {sortedCategories.map((cat) => {
              const catSpent = spentInCategory(cat.id);
              const catAlloc = Number(cat.allocated) || 0;
              const catLeft = catAlloc - catSpent;
              const catPct = catAlloc ? Math.min(100, Math.round((catSpent / catAlloc) * 100)) : (catSpent ? 100 : 0);
              return (
                <article key={cat.id} className="budget-cat-card" style={{ '--cat-color': cat.color, borderTopColor: cat.color }}>
                  <div className="budget-cat-card__head">
                    <h4>{cat.name}</h4>
                    <div className="budget-cat-card__actions">
                      <button type="button" className="budget-cat-card__btn" title="Edit category" onClick={() => openEditCategory(cat)}>
                        <AppIcon name="edit" size={15} />
                      </button>
                      <button type="button" className="budget-cat-card__btn budget-cat-card__btn--danger" title="Delete category" onClick={() => deleteCategory(cat)}>
                        <AppIcon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="budget-cat-card__amount">{money(catSpent)} spent</p>
                  <div className="budget-cat-card__bar" style={{ '--cat-pct': `${catPct}%` }} />
                  <div className="budget-cat-card__meta">
                    <span>Set aside {money(catAlloc)}</span>
                    <span className={catLeft < 0 ? 'is-over' : ''}>
                      {catLeft < 0 ? `${money(Math.abs(catLeft))} over` : `${money(catLeft)} left`}
                    </span>
                  </div>
                  <button type="button" className="budget-cat-card__spend" onClick={() => openAddExpense(cat.id)}>
                    + Add a payment
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showEditBudget && (
        <div className="dash-overlay" onMouseDown={closeIfBackdrop(() => setShowEditBudget(false))}>
          <form className="dash-panel dash-panel--center" onSubmit={saveBudgetTotal} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <h2>Edit Budget</h2>
            <label className="dash-field">
              <span>Total Budget (Rs.)</span>
              <input type="number" required value={editTotal} onChange={(e) => setEditTotal(e.target.value)} />
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setShowEditBudget(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Save</button>
            </div>
          </form>
        </div>
      )}

      {showCategory && (
        <div className="dash-overlay" onMouseDown={closeIfBackdrop(() => setShowCategory(false))}>
          <form className="dash-panel dash-panel--center" onSubmit={addCategory} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <h2>{editingCategoryId ? 'Edit category' : 'Create Category'}</h2>
            <div className="budget-cat-suggest">
              {DEFAULT_BUDGET_CATEGORIES.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={`budget-cat-suggest__chip${catForm.name === item.name ? ' is-on' : ''}`}
                  onClick={() => setCatForm((form) => ({ ...form, name: item.name }))}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <label className="dash-field"><span>Category Name *</span><input required placeholder="e.g., Venue, Catering" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></label>
            <label className="dash-field"><span>Allocated Amount</span><input type="number" value={catForm.allocated} onChange={(e) => setCatForm({ ...catForm, allocated: e.target.value })} /></label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => { setShowCategory(false); setEditingCategoryId(null); }}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">{editingCategoryId ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {showExpense && (
        <div className="dash-overlay" onMouseDown={closeIfBackdrop(() => setShowExpense(false))}>
          <form className="dash-panel dash-panel--side dash-panel--expense" onSubmit={addExpense} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <h2>Add a payment</h2>
            <p className="dash-panel__hint">Salon, shop, or anyone you paid yourself — it comes out of your budget.</p>
            <label className="dash-field">
              <span>What did you pay for? *</span>
              <input required placeholder="e.g., Bridal salon" value={expForm.name} onChange={(e) => setExpForm({ ...expForm, name: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Amount you paid *</span>
              <input type="number" min="1" required placeholder="Rs." value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} />
            </label>
            <div className="dash-field">
              <PrettySelect
                label="Category"
                icon="budget"
                value={expForm.categoryId}
                options={expenseCategoryOptions}
                onChange={chooseExpenseCategory}
              />
            </div>
            <label className="dash-field">
              <span>Date</span>
              <input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Notes</span>
              <textarea rows={2} placeholder="Optional notes" value={expForm.notes} onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })} />
            </label>
            {expenseError ? <p className="form__error">{expenseError}</p> : null}
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setShowExpense(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Save payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BudgetPage;
