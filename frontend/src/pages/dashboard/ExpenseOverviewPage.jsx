import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBudget } from '../../utils/storage';

const chipColors = ['#e8a88c', '#6b9e78', '#7a9eb8', '#c96a5a', '#d4b85c', '#5c6d8a', '#b8a0c8', '#8a7268'];

function ExpenseOverviewPage() {
  const budget = getBudget() || { expenses: [], categories: [] };
  const [catFilter, setCatFilter] = useState('all');

  const total = budget.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const getCatName = (id) => budget.categories.find((c) => c.id === id)?.name || 'Uncategorized';

  const filtered = useMemo(() => {
    if (catFilter === 'all') return budget.expenses;
    if (catFilter === 'uncategorized') return budget.expenses.filter((e) => !e.categoryId);
    return budget.expenses.filter((e) => e.categoryId === catFilter);
  }, [budget.expenses, catFilter]);

  return (
    <div className="dash-page">
      <header className="dash-page__header dash-page__header--split">
        <Link to="/dashboard/budget" className="dash-back">← Back to budget</Link>
        <h1>Your expense overview</h1>
        <Link to="/dashboard/budget" className="dash-btn dash-btn--primary">+ Add new expense</Link>
      </header>

      <div className="expense-color-bar">
        {chipColors.map((c) => <span key={c} style={{ background: c }} />)}
      </div>

      <div className="expense-filters">
        <button type="button" className={`expense-filter-btn${catFilter === 'all' ? ' is-on' : ''}`} onClick={() => setCatFilter('all')}>All</button>
        <button type="button" className={`expense-filter-btn${catFilter === 'uncategorized' ? ' is-on' : ''}`} onClick={() => setCatFilter('uncategorized')}>Uncategorized</button>
        {budget.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`expense-filter-btn${catFilter === c.id ? ' is-on' : ''}`}
            onClick={() => setCatFilter(c.id)}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 4 }} />
            {c.name}
          </button>
        ))}
        <span className="expense-filter-hint">Select a category to filter expenses</span>
      </div>

      <div className="dash-card">
        {filtered.length === 0 ? (
          <div className="dash-empty"><p>No expenses found</p></div>
        ) : (
          <table className="guest-table">
            <thead><tr><th>Name</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="guest-name-cell">
                      <span className="dash-list-avatar">{String(e.name || 'E').charAt(0).toUpperCase()}</span>
                      <strong>{e.name}</strong>
                    </div>
                  </td>
                  <td><span className="guest-group-badge">{getCatName(e.categoryId)}</span></td>
                  <td>{e.date}</td>
                  <td><strong>Rs. {Number(e.amount).toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <footer className="expense-footer">
        <span>Total expenses to date</span>
        <strong>Rs. {total.toLocaleString()}</strong>
      </footer>
    </div>
  );
}

export default ExpenseOverviewPage;
