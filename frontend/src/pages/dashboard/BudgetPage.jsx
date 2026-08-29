import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getBudget, getBookings, getProfileBudget, getWeddingProfile, hydrateUserData, saveBudget, saveWeddingProfile } from '../../utils/storage';
import {
  buildCostBreakdown,
  predictWeddingCost,
  predictionFormFromProfile,
  defaultServicesForScale,
} from '../../utils/costPrediction';
import {
  BUDGET_FORM_FIELDS,
  CUSTOM_VALUE,
  buildFormDetailsList,
  optionsWithCustom,
} from '../../data/budgetFormConfig';
import { calculateDetailedBudget } from '../../data/weddingBudgetEngine';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import AppIcon from '../../components/ui/AppIcon';
import { isPaid } from '../../utils/bookingStatus';
import { rsvpGuestSummary } from '../../utils/guestRsvp';

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

function BudgetFormField({ field, form, rsvpSummary, onFieldChange, onCustomLabel, onCustomAmount, onPlatePrice }) {
  if (field.type === 'rsvp-count') {
    const hint = rsvpSummary.source === 'rsvp'
      ? `${rsvpSummary.accepted} confirmed coming`
      : rsvpSummary.source === 'planned'
        ? `${rsvpSummary.accepted} RSVP · using planned ${rsvpSummary.count}`
        : `${rsvpSummary.listed} on guest list`;
    return (
      <div className="budget-form-field budget-form-field--rsvp" title="Updates automatically when guest RSVPs change">
        <span className="pretty-select__icon" aria-hidden="true"><AppIcon name={field.icon} size={16} /></span>
        <span className="pretty-select__copy">
          <small>{field.label}</small>
          <strong>{form.guestCount}</strong>
          <span className="budget-form-field__rsvp-hint">{hint}</span>
        </span>
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <label className="budget-form-field budget-form-field--number">
        <span className="pretty-select__icon" aria-hidden="true"><AppIcon name={field.icon} size={16} /></span>
        <span className="pretty-select__copy">
          <small>{field.label}</small>
          <input
            type="number"
            min="50"
            max="800"
            value={form.guestCount}
            onChange={(e) => onFieldChange(field.key, e.target.value)}
          />
        </span>
      </label>
    );
  }

  const rawValue = form[field.key];
  const value = rawValue ?? (
    field.key === 'platePriceRange' ? 'auto'
      : field.key === 'drinksPackage' ? 'soft'
        : field.key === 'receptionTime' ? 'lunch'
          : field.key === 'flowerType' ? 'fresh'
            : field.key === 'lightingPackage' ? 'ambient'
              : field.key === 'invitationStyle' ? 'standard'
                : field.key === 'bridalPackage' ? 'boutique'
                  : field.key === 'groomPackage' ? 'standard'
                    : field.key === 'beautyPackage' ? 'full'
                      : rawValue
  );
  const isCustom = String(value) === CUSTOM_VALUE;

  return (
    <div className={`budget-form-field${isCustom ? ' has-custom' : ''}`}>
      <PrettySelect
        label={field.label}
        icon={field.icon}
        value={value}
        options={optionsWithCustom(field.options)}
        onChange={(next) => onFieldChange(field.key, field.key === 'seasonal' ? Number(next) : next)}
      />
      {isCustom && (
        <div className="budget-form-field__custom">
          {field.customInput === 'plate' ? (
            <input
              type="number"
              min="1000"
              step="100"
              placeholder="Rs. per plate"
              value={form.customPlatePrice || ''}
              onChange={(e) => onPlatePrice(e.target.value)}
            />
          ) : field.amountHint ? (
            <input
              type="number"
              min="1"
              placeholder={field.amountHint}
              value={form.customAmounts?.[field.key] || ''}
              onChange={(e) => onCustomAmount(field.key, e.target.value)}
            />
          ) : (
            <input
              type="text"
              placeholder="Your choice…"
              value={form.customLabels?.[field.key] || ''}
              onChange={(e) => onCustomLabel(field.key, e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function budgetVerdict(estimate, yourBudget) {
  const est = Number(estimate);
  const tot = Number(yourBudget);
  if (!tot) return null;
  const diff = tot - est;
  if (diff < 0) {
    return {
      kind: 'over',
      title: 'Typical cost is higher than your budget',
      detail: `Vendors often quote about ${money(Math.abs(diff))} more than your ${money(tot)} plan.`,
    };
  }
  if (est / tot >= 0.85) {
    return {
      kind: 'tight',
      title: 'Close to your budget',
      detail: `About ${money(diff)} left after typical vendor quotes on your ${money(tot)} plan.`,
    };
  }
  return {
    kind: 'ok',
    title: 'Within your budget',
    detail: `Typical cost is about ${money(diff)} below your ${money(tot)} plan.`,
  };
}

function suggestScenarioName(form) {
  const scale = BUDGET_FORM_FIELDS.find((f) => f.key === 'scale')?.options
    ?.find((s) => s.value === form.scale)?.label?.split(' (')[0] || 'Standard';
  return `${scale} · ${form.guestCount} guests`;
}

const CUSTOM_LINE_FIELDS = {
  catering: ['mealStyle', 'platePriceRange'],
  drinks: ['drinksPackage'],
  photography: ['photoPackage'],
  videography: ['videoPackage'],
  bridal_attire: ['bridalPackage'],
  groom_attire: ['groomPackage'],
  beauty: ['beautyPackage'],
  decor: ['decorLevel', 'flowerType'],
  lighting: ['lightingPackage'],
  entertainment: ['entertainment'],
  cake: ['cakeStyle'],
  jewellery: ['jewellery'],
  invitations: ['invitationStyle'],
  transport: ['transport'],
};

/** Map engine line items → same labels as the budget form (clear for couples). */
const BREAKDOWN_CATEGORY_BY_LINE = {
  venue: 'Venue',
  catering: 'Meals & catering',
  drinks: 'Drinks',
  photography: 'Photography',
  videography: 'Videography',
  bridal_attire: 'Bridal outfit',
  groom_attire: 'Groom outfit',
  beauty: 'Hair & makeup',
  decor: 'Décor & flowers',
  lighting: 'Lighting',
  entertainment: 'Entertainment',
  poruwa: 'Ceremony',
  church: 'Ceremony',
  kovil: 'Ceremony',
  mehendi: 'Ceremony',
  nikah: 'Ceremony',
  cake: 'Wedding cake',
  jewellery: 'Jewellery',
  invitations: 'Invitations',
  transport: 'Transport',
  buffer: 'Tips & extras',
};

function isCustomLineItem(form, lineId) {
  const keys = CUSTOM_LINE_FIELDS[lineId] || [];
  return keys.some((key) => String(form[key]) === CUSTOM_VALUE);
}

function breakdownCategoryLabel(row) {
  if (String(row?.id || '').startsWith('custom_')) return row.name || 'Your extra';
  return BREAKDOWN_CATEGORY_BY_LINE[row?.id] || row?.name || 'Other';
}

/** One simple list for couples — merge ceremony rows, keep form-style names. */
function buildCoupleCostBreakdown(lineItems = [], form = {}) {
  const merged = new Map();

  lineItems.forEach((row) => {
    const label = breakdownCategoryLabel(row);
    const key = label;
    const existing = merged.get(key);
    const custom = isCustomLineItem(form, row.id) || String(row.id || '').startsWith('custom_');
    if (existing) {
      existing.amount += Number(row.amount) || 0;
      existing.isCustom = existing.isCustom || custom;
    } else {
      merged.set(key, {
        id: row.id,
        name: label,
        amount: Number(row.amount) || 0,
        isCustom: custom,
      });
    }
  });

  return [...merged.values()].filter((row) => row.amount > 0);
}

function BudgetPage() {
  const coupleData = useOutletContext();
  const profile = coupleData?.profile || getWeddingProfile();
  const onboarding = coupleData?.onboarding;
  const profileBudget = getProfileBudget() || Number(profile?.budget) || 0;
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
  const emptyBudget = { total: profileBudget, categories: [], expenses: [], savedScenarios: [], confirmedScenarioId: null };

  const budgetFromCouple = () => {
    const stored = coupleData?.budget || getBudget() || emptyBudget;
    return {
      ...stored,
      total: profileBudget,
      categories: stored.categories || [],
      expenses: stored.expenses || [],
      savedScenarios: stored.savedScenarios || [],
      confirmedScenarioId: stored.confirmedScenarioId || null,
    };
  };

  const [budget, setBudget] = useState(budgetFromCouple);
  const [showCategory, setShowCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showExpense, setShowExpense] = useState(false);
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
  const [mlPrediction, setMlPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');
  const predictionRequestRef = useRef(0);
  const [showSaveScenario, setShowSaveScenario] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [viewingScenario, setViewingScenario] = useState(null);
  const [costForm, setCostForm] = useState(() => predictionFormFromProfile(profile, {
    ceremonyType: onboarding?.ceremonyType,
    district: onboarding?.location,
    weddingDate: profile?.weddingDate || onboarding?.weddingDate,
    guestListCount: (coupleData?.guests || []).length,
    rsvpGuestCount: rsvpGuestSummary(coupleData?.guests || [], profile?.guestCount).count,
    budgetTotal: profileBudget,
  }));
  const userPickedScale = useRef(false);
  const weddingDate = profile?.weddingDate || onboarding?.weddingDate || '';

  const rsvpSummary = useMemo(
    () => rsvpGuestSummary(coupleData?.guests || [], profile?.guestCount),
    [coupleData?.guests, profile?.guestCount],
  );

  const livePrediction = useMemo(() => {
    const enrichedForm = { ...costForm, weddingDate };
    const detail = calculateDetailedBudget(enrichedForm);
    const breakdown = buildCostBreakdown(enrichedForm, { estimate: detail.total });
    return {
      estimate: detail.total,
      low: mlPrediction?.low ?? detail.low,
      high: mlPrediction?.high ?? detail.high,
      confidence: mlPrediction?.confidence || '90%',
      source: mlPrediction?.source || 'weddingBudgetEngine',
      breakdown: {
        ...breakdown,
        coupleCategories: buildCoupleCostBreakdown(breakdown.lineItems || [], enrichedForm),
      },
    };
  }, [costForm, weddingDate, mlPrediction]);

  const prediction = livePrediction;

  const loadPrediction = async (form) => {
    const requestId = predictionRequestRef.current + 1;
    predictionRequestRef.current = requestId;
    const enrichedForm = { ...form, weddingDate };
    setPredicting(true);
    setPredictError('');

    try {
      const result = await predictWeddingCost(enrichedForm);
      if (requestId !== predictionRequestRef.current) return;
      setMlPrediction(result);
    } catch (err) {
      if (requestId !== predictionRequestRef.current) return;
      setPredictError(err.message || 'Could not reach ML service — showing local estimate.');
    } finally {
      if (requestId === predictionRequestRef.current) setPredicting(false);
    }
  };

  useEffect(() => {
    if (!coupleData?.userId) return undefined;
    let active = true;
    hydrateUserData()
      .then(() => {
        if (!active) return;
        setBudget(budgetFromCouple());
      })
      .catch(() => {});
    return () => { active = false; };
  }, [coupleData?.userId]);

  useEffect(() => {
    const next = budgetFromCouple();
    setBudget((current) => {
      const incoming = next.expenses?.length || 0;
      const local = current.expenses?.length || 0;
      if (local > incoming) return { ...current, total: profileBudget };
      return next;
    });
  }, [coupleData, profileBudget]);

  useEffect(() => {
    if (!coupleData?.userId) return;
    setCostForm(predictionFormFromProfile(getWeddingProfile() || profile, {
      ceremonyType: onboarding?.ceremonyType,
      district: onboarding?.location,
      weddingDate: profile?.weddingDate || onboarding?.weddingDate,
      guestListCount: (coupleData?.guests || []).length,
      rsvpGuestCount: rsvpSummary.count,
      budgetTotal: profileBudget,
    }));
  }, [coupleData?.userId]);

  useEffect(() => {
    setCostForm((prev) => (
      Number(prev.guestCount) === rsvpSummary.count
        ? prev
        : { ...prev, guestCount: rsvpSummary.count }
    ));
  }, [rsvpSummary.count]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPrediction(costForm);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [costForm]);

  const patchCostForm = (patch) => setCostForm((prev) => ({ ...prev, ...patch }));

  const setFormField = (key, value) => {
    if (key === 'scale') {
      userPickedScale.current = true;
      setCostForm((prev) => ({
        ...prev,
        scale: value,
        ...defaultServicesForScale(value, prev.ceremonyType),
      }));
      const current = coupleData?.profile || getWeddingProfile() || {};
      saveWeddingProfile({ ...current, scale: value }).catch(() => {});
      return;
    }
    patchCostForm({ [key]: value });
  };

  const setCustomLabel = (key, text) => {
    setCostForm((prev) => ({
      ...prev,
      customLabels: { ...(prev.customLabels || {}), [key]: text },
    }));
  };

  const setCustomAmount = (key, amount) => {
    setCostForm((prev) => ({
      ...prev,
      customAmounts: { ...(prev.customAmounts || {}), [key]: amount },
    }));
  };

  const savedScenarios = budget.savedScenarios || [];
  const confirmedScenarioId = budget.confirmedScenarioId || null;

  const persistScenarios = (scenarios) => {
    setBudget((current) => {
      const next = { ...current, savedScenarios: scenarios };
      saveBudget(next);
      return next;
    });
  };

  const openSaveScenario = () => {
    setScenarioName(suggestScenarioName(costForm));
    setShowSaveScenario(true);
  };

  const saveScenario = (event) => {
    event.preventDefault();
    if (!scenarioName.trim()) return;
    const scenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName.trim(),
      savedAt: new Date().toISOString(),
      costForm: JSON.parse(JSON.stringify(costForm)),
      estimate: prediction.estimate,
      low: prediction.low,
      high: prediction.high,
      perGuest: prediction.breakdown?.perGuest || 0,
      verdictKind: verdict?.kind || null,
      formDetails: buildFormDetailsList(costForm),
      lineItems: (prediction.breakdown?.coupleCategories || []).map((row) => ({
        id: row.id,
        name: row.name,
        amount: row.amount,
      })),
      categories: (prediction.breakdown?.coupleCategories || []).map((row) => ({
        id: row.id,
        name: row.name,
        amount: row.amount,
      })),
    };
    persistScenarios([...savedScenarios, scenario]);
    setShowSaveScenario(false);
    setScenarioName('');
  };

  const loadScenario = (scenario) => {
    setCostForm(scenario.costForm);
    userPickedScale.current = true;
  };

  const deleteScenario = (id) => {
    const remaining = savedScenarios.filter((row) => row.id !== id);
    setBudget((current) => {
      const next = {
        ...current,
        savedScenarios: remaining,
        confirmedScenarioId: current.confirmedScenarioId === id ? null : current.confirmedScenarioId,
      };
      saveBudget(next);
      return next;
    });
  };

  const confirmScenario = (id) => {
    setBudget((current) => {
      const next = { ...current, confirmedScenarioId: id };
      saveBudget(next);
      return next;
    });
  };

  const yourBudget = profileBudget;

  const bestScenarioId = useMemo(() => {
    if (!savedScenarios.length) return null;
    const within = yourBudget
      ? savedScenarios.filter((row) => row.estimate <= yourBudget)
      : savedScenarios;
    const pool = within.length ? within : savedScenarios;
    return pool.reduce((best, row) => (
      !best || row.estimate < best.estimate ? row : best
    ), null)?.id || null;
  }, [savedScenarios, yourBudget]);

  const verdict = prediction && yourBudget ? budgetVerdict(prediction.estimate, yourBudget) : null;

  const runPrediction = () => loadPrediction(costForm);

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

  return (
    <div className="dash-page">
      <PageHeader moduleId="budget" />

      {overspent && (
        <div className="dash-alert dash-alert--danger">
          <strong>Budget overspend alert</strong>
          <p>You have exceeded your total budget by Rs. {(spent - budget.total).toLocaleString()}. Review expenses or adjust your budget.</p>
        </div>
      )}

      <div className="dash-card ai-prediction ai-prediction--form">
        <div className="ai-prediction__head">
          <div>
            <h3>Plan your wedding budget</h3>
            <p>Fill in one form, get a cost estimate, save plans, and pick your favourite. Your profile budget never changes.</p>
          </div>
          {predicting && <span className="ai-prediction__status">Updating…</span>}
        </div>

        <div className="ai-prediction__profile-chips">
          <span><AppIcon name="budget" size={14} /> Your budget {yourBudget ? money(yourBudget) : 'not set'}</span>
          <Link to="/wedding-profile" className="ai-prediction__edit-profile">Edit profile</Link>
        </div>

        <div className="budget-form-list">
          {BUDGET_FORM_FIELDS.map((field) => (
            <BudgetFormField
              key={field.key}
              field={field}
              form={costForm}
              rsvpSummary={rsvpSummary}
              onFieldChange={setFormField}
              onCustomLabel={setCustomLabel}
              onCustomAmount={setCustomAmount}
              onPlatePrice={(customPlatePrice) => patchCostForm({ customPlatePrice })}
            />
          ))}
        </div>

        <div className="budget-form-actions">
          <button
            type="button"
            className="ai-prediction__reset-form"
            onClick={() => setCostForm(predictionFormFromProfile(getWeddingProfile() || profile, {
              ceremonyType: onboarding?.ceremonyType,
              district: onboarding?.location,
              weddingDate: profile?.weddingDate || onboarding?.weddingDate,
              guestListCount: (coupleData?.guests || []).length,
              rsvpGuestCount: rsvpSummary.count,
              budgetTotal: profileBudget,
            }))}
          >
            Reset to wedding profile
          </button>
        </div>

        {predictError && (
          <p className="ai-prediction__error">
            {predictError}
            {' '}
            <button type="button" className="ai-prediction__retry" onClick={runPrediction}>Try again</button>
          </p>
        )}

        {prediction && (
          <div className="budget-result">
            <div className="ai-prediction__hero">
              <div className="ai-prediction__hero-main">
                <small>Estimated vendor cost</small>
                <strong>{money(prediction.estimate)}</strong>
                <span>{money(prediction.low)} – {money(prediction.high)} · ≈ {money(prediction.breakdown?.perGuest)}/guest</span>
              </div>
              <div className="ai-prediction__hero-side">
                <small>Your budget</small>
                <strong>{yourBudget ? money(yourBudget) : '—'}</strong>
                {verdict && <span className={`ai-prediction__hero-verdict is-${verdict.kind}`}>{verdict.title}</span>}
              </div>
            </div>

            {prediction.breakdown?.coupleCategories?.length > 0 && (
              <div className="ai-prediction__breakdown ai-prediction__breakdown--compact">
                <h4>Cost breakdown</h4>
                <ul className="ai-prediction__breakdown-list">
                  {prediction.breakdown.coupleCategories.map((row) => (
                    <li
                      key={row.name}
                      className={row.isCustom ? 'is-custom' : undefined}
                    >
                      <span>
                        {row.name}
                        {row.isCustom && (
                          <em className="ai-prediction__custom-tag">Your amount</em>
                        )}
                      </span>
                      <strong>{money(row.amount)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ai-prediction__save-row">
              <button type="button" className="dash-btn dash-btn--primary" onClick={openSaveScenario}>
                Save this plan
              </button>
              <span className="ai-prediction__save-hint">Change options above, save again, then compare your saved plans below.</span>
            </div>
          </div>
        )}

        {savedScenarios.length > 0 && (
          <div className="budget-scenarios">
            <div className="budget-scenarios__head">
              <h4>Your saved plans</h4>
              <p>Compare estimates, view details, and confirm the plan you want.</p>
            </div>
            <ul className="budget-scenarios__list">
              {savedScenarios.map((row) => {
                const rowVerdict = yourBudget ? budgetVerdict(row.estimate, yourBudget) : null;
                const isBest = row.id === bestScenarioId;
                const isConfirmed = row.id === confirmedScenarioId;
                return (
                  <li key={row.id} className={`budget-scenario-card${isBest ? ' is-best' : ''}${isConfirmed ? ' is-confirmed' : ''}`}>
                    <div className="budget-scenario-card__main">
                      <strong>{row.name}</strong>
                      <span>{money(row.estimate)}</span>
                      {rowVerdict && (
                        <em className={`budget-scenario-card__verdict is-${rowVerdict.kind}`}>{rowVerdict.title}</em>
                      )}
                      {isConfirmed && <span className="budget-scenario-card__badge is-confirmed">Confirmed</span>}
                      {!isConfirmed && isBest && <span className="budget-scenario-card__badge">Best fit</span>}
                    </div>
                    <div className="budget-scenario-card__meta">
                      {row.perGuest > 0 && <small>≈ {money(row.perGuest)}/guest</small>}
                      <small>{new Date(row.savedAt).toLocaleDateString()}</small>
                    </div>
                    <div className="budget-scenario-card__actions">
                      <button type="button" className="dash-btn dash-btn--outline" onClick={() => setViewingScenario(row)}>Details</button>
                      <button type="button" className="dash-btn dash-btn--outline" onClick={() => loadScenario(row)}>Load</button>
                      <button type="button" className="dash-btn dash-btn--primary" onClick={() => confirmScenario(row.id)}>Confirm</button>
                      <button type="button" className="budget-scenario-card__delete" onClick={() => deleteScenario(row.id)} aria-label="Delete">✕</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {showSaveScenario && (
        <div className="dash-overlay" onMouseDown={closeIfBackdrop(() => setShowSaveScenario(false))}>
          <form className="dash-panel dash-panel--center" onSubmit={saveScenario} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <h2>Save this plan</h2>
            <p className="dash-panel__hint">Name this version so you can compare it with other options.</p>
            <label className="dash-field">
              <span>Plan name</span>
              <input
                required
                placeholder="e.g. Standard 500 guests"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
            </label>
            {prediction && (
              <p className="budget-scenario-preview">
                Estimated cost: <strong>{money(prediction.estimate)}</strong>
                {verdict && <> · <span className={`is-${verdict.kind}`}>{verdict.title}</span></>}
              </p>
            )}
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setShowSaveScenario(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Save plan</button>
            </div>
          </form>
        </div>
      )}

      {viewingScenario && (
        <div className="dash-overlay" onMouseDown={closeIfBackdrop(() => setViewingScenario(null))}>
          <div className="dash-panel dash-panel--center budget-scenario-detail" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <h2>{viewingScenario.name}</h2>
            <p className="budget-scenario-detail__estimate">{money(viewingScenario.estimate)}</p>
            <h3>Your choices</h3>
            <ul className="budget-scenario-detail__choices">
              {(viewingScenario.formDetails || buildFormDetailsList(viewingScenario.costForm)).map((row) => (
                <li key={row.key}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </li>
              ))}
            </ul>
            {(viewingScenario.lineItems || viewingScenario.categories)?.length > 0 && (
              <>
                <h3>Cost breakdown</h3>
                <ul className="budget-scenario-detail__choices">
                  {(viewingScenario.lineItems || viewingScenario.categories).map((row) => (
                    <li key={row.id || row.name}>
                      <span>{row.name}</span>
                      <strong>{money(row.amount)}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setViewingScenario(null)}>Close</button>
              <button type="button" className="dash-btn dash-btn--outline" onClick={() => { loadScenario(viewingScenario); setViewingScenario(null); }}>Load plan</button>
              <button type="button" className="dash-btn dash-btn--primary" onClick={() => { confirmScenario(viewingScenario.id); setViewingScenario(null); }}>Confirm this plan</button>
            </div>
          </div>
        </div>
      )}

      <details className="dash-card budget-tracker">
        <summary>Track spending & categories</summary>
        <div className="budget-tracker__body">
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
              {profileBudget > 0 ? (
                <>
                  <strong>{money(profileBudget)}</strong>
                  <Link to="/wedding-profile" className="budget-edit-btn" title="Change budget in wedding profile">
                    <AppIcon name="edit" size={14} />
                  </Link>
                </>
              ) : (
                <>
                  <strong>Not set</strong>
                  <Link to="/wedding-profile" className="budget-edit-btn" title="Set budget in wedding profile">
                    <AppIcon name="edit" size={14} />
                  </Link>
                </>
              )}
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
        </div>
      </details>

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
