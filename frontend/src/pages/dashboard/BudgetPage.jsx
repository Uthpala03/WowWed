import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBudget, getWeddingProfile, saveBudget } from '../../utils/storage';
import { predictWeddingCost } from '../../utils/costPrediction';

const categoryColors = ['#e8a88c', '#7a9eb8', '#b8a0c8', '#d4b85c', '#c96a5a', '#6b9e78', '#5c6d8a', '#8a7268'];
const sortOptions = ['Default', 'Name', 'Remaining budget', 'Budget allocated'];

function BudgetPage() {
  const [budget, setBudget] = useState(() => getBudget() || { total: 10000000, categories: [], expenses: [] });
  const [showCategory, setShowCategory] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [sortBy, setSortBy] = useState('Default');
  const [catForm, setCatForm] = useState({ name: '', allocated: 0 });
  const [expForm, setExpForm] = useState({ name: '', amount: 0, categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [editTotal, setEditTotal] = useState(budget.total);
  const [prediction, setPrediction] = useState(null);
  const profile = getWeddingProfile();

  const spent = useMemo(() => budget.expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [budget]);
  const overspent = spent > budget.total;
  const left = budget.total - spent;
  const pct = budget.total ? Math.round((spent / budget.total) * 100) : 0;

  const sortedCategories = useMemo(() => {
    const cats = [...budget.categories];
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

  const persist = (next) => {
    setBudget(next);
    saveBudget(next);
  };

  const addCategory = (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    persist({
      ...budget,
      categories: [...budget.categories, {
        id: `c${Date.now()}`,
        name: catForm.name,
        allocated: Number(catForm.allocated),
        color: categoryColors[budget.categories.length % categoryColors.length],
      }],
    });
    setCatForm({ name: '', allocated: 0 });
    setShowCategory(false);
  };

  const addExpense = (e) => {
    e.preventDefault();
    if (!expForm.name.trim() || !expForm.amount) return;
    persist({
      ...budget,
      expenses: [...budget.expenses, { id: `e${Date.now()}`, ...expForm, amount: Number(expForm.amount) }],
    });
    setExpForm({ name: '', amount: 0, categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    setShowExpense(false);
  };

  const saveBudgetTotal = (e) => {
    e.preventDefault();
    persist({ ...budget, total: Number(editTotal) });
    setShowEditBudget(false);
  };

  return (
    <div className="dash-page">
      <header className="dash-page__header">
        <div><h1>Budget</h1><p>Track spending for your wedding</p></div>
      </header>

      {overspent && (
        <div className="dash-alert dash-alert--danger">
          <strong>Budget overspend alert</strong>
          <p>You have exceeded your total budget by Rs. {(spent - budget.total).toLocaleString()}. Review expenses or adjust your budget.</p>
        </div>
      )}

      <div className="dash-card ai-prediction">
        <div className="ai-prediction__head">
          <div>
            <h3>AI cost prediction</h3>
            <p>Estimate based on guest count, location, and ceremony type</p>
          </div>
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => setPrediction(predictWeddingCost({ ...profile, weddingMonth: profile?.weddingDate }))}>
            Run prediction
          </button>
        </div>
        {prediction && (
          <div className="ai-prediction__result">
            <p><strong>Estimated total:</strong> Rs. {prediction.estimate.toLocaleString()}</p>
            <p><strong>Range:</strong> Rs. {prediction.low.toLocaleString()} – Rs. {prediction.high.toLocaleString()} ({prediction.confidence})</p>
            <p className="ai-prediction__note">Based on {prediction.factors.guests} guests · {prediction.factors.district} · {prediction.factors.ceremonyType || 'Standard'} · {prediction.factors.seasonal}</p>
          </div>
        )}
      </div>

      <div className="budget-top">
        <div className="dash-card budget-summary">
          <div className="budget-summary__row">
            <div><small>Left to Spend</small><strong>Rs. {left.toLocaleString()}</strong></div>
            <div>
              <small>Total Budget</small>
              <strong>Rs. {budget.total.toLocaleString()}</strong>
              <button type="button" className="budget-edit-btn" onClick={() => { setEditTotal(budget.total); setShowEditBudget(true); }}>✏️</button>
            </div>
          </div>
          <div className="budget-bar"><div style={{ width: `${pct}%` }} /></div>
          <small>{pct}% of the total budget has been spent.</small>
        </div>
        <div className="dash-card budget-actions-card">
          <h3>Track your expenses</h3>
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => setShowExpense(true)}>+ Add new expense</button>
          <Link to="/dashboard/budget/expenses" className="dash-btn dash-btn--white">View all expenses »</Link>
          <p>{budget.expenses.length ? `${budget.expenses.length} expenses recorded` : 'No expenses yet'}</p>
        </div>
      </div>

      <div className="budget-toolbar">
        <div className="budget-sort">
          <button type="button" className="dash-btn dash-btn--white">⇅</button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {sortOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button type="button" className="dash-btn dash-btn--primary" onClick={() => setShowCategory(true)}>+ Add a budget category</button>
      </div>

      <div className="dash-card">
        {budget.categories.length === 0 ? (
          <div className="dash-empty">
            <p>No categories yet</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={() => setShowCategory(true)}>Create Your First Category</button>
          </div>
        ) : (
          <div className="budget-categories">
            {sortedCategories.map((cat) => (
              <article key={cat.id} className="budget-cat-card" style={{ borderTopColor: cat.color }}>
                <h4>{cat.name}</h4>
                <p>Allocated: Rs. {Number(cat.allocated).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {showEditBudget && (
        <div className="dash-overlay" onClick={() => setShowEditBudget(false)}>
          <form className="dash-panel dash-panel--center" onSubmit={saveBudgetTotal} onClick={(e) => e.stopPropagation()}>
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
        <div className="dash-overlay" onClick={() => setShowCategory(false)}>
          <form className="dash-panel dash-panel--center" onSubmit={addCategory} onClick={(e) => e.stopPropagation()}>
            <h2>Create Category</h2>
            <label className="dash-field"><span>Category Name *</span><input required placeholder="e.g., Venue, Catering" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></label>
            <label className="dash-field"><span>Allocated Amount</span><input type="number" value={catForm.allocated} onChange={(e) => setCatForm({ ...catForm, allocated: e.target.value })} /></label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setShowCategory(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {showExpense && (
        <div className="dash-overlay">
          <form className="dash-panel dash-panel--side" onSubmit={addExpense}>
            <h2>Add Expense</h2>
            <label className="dash-field"><span>Expense Name *</span><input required placeholder="e.g., Venue Deposit, Catering Payment" value={expForm.name} onChange={(e) => setExpForm({ ...expForm, name: e.target.value })} /></label>
            <label className="dash-field"><span>Amount *</span><input type="number" required placeholder="Rs." value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} /></label>
            <label className="dash-field"><span>Category</span>
              <select value={expForm.categoryId} onChange={(e) => setExpForm({ ...expForm, categoryId: e.target.value })}>
                <option value="">No Category</option>
                {budget.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="dash-field"><span>Expense Date</span><input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></label>
            <label className="dash-field"><span>Notes</span><textarea rows={3} placeholder="Additional notes about this expense" value={expForm.notes} onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })} /></label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setShowExpense(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BudgetPage;
