import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { crewRoles, getCategoryMeta, getTaskDateGroups, groupTasksByMonth, groupTasksByPhase, taskCategories } from '../../data/dashboardData';
import { getTasks, saveTasks } from '../../utils/storage';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';

function ChecklistPage() {
  const coupleData = useOutletContext();
  const [tasks, setTasks] = useState(() => coupleData?.tasks || getTasks() || []);

  useEffect(() => {
    setTasks(coupleData?.tasks || getTasks() || []);
  }, [coupleData]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAllDates, setShowAllDates] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [editing, setEditing] = useState(null);

  const doneCount = tasks.filter((t) => t.done).length;
  const todoCount = tasks.length - doneCount;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const unassignedCount = tasks.filter((t) => t.assigned === 'Unassigned').length;

  const hasActiveFilters = statusFilter !== 'all'
    || categoryFilter !== 'all'
    || monthFilter !== 'all'
    || assignedFilter !== 'all'
    || search.trim();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter === 'done' && !task.done) return false;
      if (statusFilter === 'todo' && task.done) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (assignedFilter === 'unassigned' && task.assigned !== 'Unassigned') return false;
      if (monthFilter !== 'all') {
        const key = new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (key !== monthFilter) return false;
      }
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [tasks, statusFilter, categoryFilter, monthFilter, assignedFilter, search]);

  const grouped = filtered.some((task) => task.phase)
    ? groupTasksByPhase(filtered)
    : groupTasksByMonth(filtered);
  const dateGroups = getTaskDateGroups(tasks);
  const visibleDates = showAllDates ? dateGroups : dateGroups.slice(0, 6);

  const persist = (next) => {
    setTasks(next);
    saveTasks(next);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setMonthFilter('all');
    setAssignedFilter('all');
    setSearch('');
  };

  const toggleTask = (id) => {
    persist(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const saveEdit = () => {
    if (!editing?.title?.trim()) return;
    persist(tasks.map((t) => (t.id === editing.id ? editing : t)));
    setEditing(null);
  };

  const addTask = () => {
    const task = {
      id: `t${Date.now()}`,
      title: 'New task',
      category: 'other',
      dueDate: new Date().toISOString().slice(0, 10),
      done: false,
      assigned: 'Unassigned',
      notes: '',
    };
    persist([...tasks, task]);
    setEditing(task);
  };

  const monthProgress = (monthTasks) => {
    const done = monthTasks.filter((t) => t.done).length;
    return { done, total: monthTasks.length };
  };

  return (
    <div className="dash-page dash-page--checklist">
      <PageHeader
        moduleId="checklist"
        tagline={coupleData?.profile?.ceremonyType
          ? `${coupleData.profile.ceremonyType} tasks, month by month, with filters and progress tracking.`
          : undefined}
      >
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={addTask}>+ Add task</button>
        </div>
      </PageHeader>

      <section className="checklist-summary" aria-label="Checklist progress">
        <article className="checklist-summary__card checklist-summary__card--done">
          <span className="checklist-summary__icon">✓</span>
          <div>
            <strong>{doneCount}</strong>
            <span>Completed</span>
          </div>
        </article>
        <article className="checklist-summary__card checklist-summary__card--todo">
          <span className="checklist-summary__icon">○</span>
          <div>
            <strong>{todoCount}</strong>
            <span>Still to do</span>
          </div>
        </article>
        <article className="checklist-summary__card checklist-summary__card--progress">
          <div className="checklist-summary__progress-wrap">
            <div className="checklist-summary__progress-bar">
              <div className="checklist-summary__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <strong>{progressPct}%</strong>
          </div>
          <span>Overall progress</span>
        </article>
      </section>

      <div className="checklist-toolbar">
        <div className="checklist-search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search tasks by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`checklist-filter-toggle${filtersOpen ? ' is-open' : ''}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filters {hasActiveFilters && <span className="checklist-filter-badge" />}
        </button>
        {hasActiveFilters && (
          <button type="button" className="checklist-clear-filters" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      <div className="checklist-layout">
        <aside className={`dash-filters checklist-filters${filtersOpen ? ' is-open' : ''}`}>
          <div className="checklist-filters__head">
            <h3>Filter tasks</h3>
            <p>Show only what you need right now</p>
          </div>

          <div className="dash-filter-group">
            <h4>Status</h4>
            <div className="checklist-status-tabs">
              <button
                type="button"
                className={`checklist-status-tab${statusFilter === 'all' ? ' is-on' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All <span>{tasks.length}</span>
              </button>
              <button
                type="button"
                className={`checklist-status-tab${statusFilter === 'todo' ? ' is-on' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}
              >
                To do <span>{todoCount}</span>
              </button>
              <button
                type="button"
                className={`checklist-status-tab checklist-status-tab--done${statusFilter === 'done' ? ' is-on' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'done' ? 'all' : 'done')}
              >
                Done <span>{doneCount}</span>
              </button>
            </div>
          </div>

          <div className="dash-filter-group">
            <h4>Month</h4>
            <div className="dash-date-timeline">
              <button
                type="button"
                className={monthFilter === 'all' ? 'is-on' : ''}
                onClick={() => setMonthFilter('all')}
              >
                All months <span>{tasks.length}</span>
              </button>
              {visibleDates.map(({ label, count }) => (
                <button
                  key={label}
                  type="button"
                  className={monthFilter === label ? 'is-on' : ''}
                  onClick={() => setMonthFilter(monthFilter === label ? 'all' : label)}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>
            {dateGroups.length > 6 && (
              <button type="button" className="dash-see-more" onClick={() => setShowAllDates(!showAllDates)}>
                {showAllDates ? 'Show fewer months' : `Show all ${dateGroups.length} months`}
              </button>
            )}
          </div>

          <div className="dash-filter-group">
            <h4>Category</h4>
            <div className="checklist-category-grid">
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`checklist-category-chip${categoryFilter === cat.id ? ' is-on' : ''}`}
                  data-category={cat.id}
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-filter-group">
            <h4>Assigned to</h4>
            <button
              type="button"
              className={`dash-filter-pill${assignedFilter === 'unassigned' ? ' is-on' : ''}`}
              onClick={() => setAssignedFilter(assignedFilter === 'unassigned' ? 'all' : 'unassigned')}
            >
              Unassigned <span>{unassignedCount}</span>
            </button>
          </div>
        </aside>

        <div className="checklist-tasks">
          {Object.keys(grouped).length === 0 ? (
            <div className="checklist-empty dash-card">
              <span className="checklist-empty__icon">📋</span>
              <h2>No tasks found</h2>
              <p>
                {hasActiveFilters
                  ? 'Try changing your filters or search term.'
                  : coupleData?.profile?.weddingDate || coupleData?.onboarding?.weddingDate
                    ? 'Add your first task to start planning.'
                    : 'Add your wedding date to get a Sri Lankan timeline for your couple.'}
              </p>
              {hasActiveFilters ? (
                <button type="button" className="dash-btn dash-btn--outline" onClick={clearFilters}>Clear filters</button>
              ) : coupleData?.profile?.weddingDate || coupleData?.onboarding?.weddingDate ? (
                <button type="button" className="dash-btn dash-btn--primary" onClick={addTask}>+ Add task</button>
              ) : (
                <Link to="/wedding-profile" className="dash-btn dash-btn--primary">Add wedding date</Link>
              )}
            </div>
          ) : (
            Object.entries(grouped).map(([month, monthTasks]) => {
              const { done, total } = monthProgress(monthTasks);
              return (
                <section key={month} className="checklist-month dash-card">
                  <header className="checklist-month__head">
                    <div>
                      <h2>{month}</h2>
                      <p>{total} task{total !== 1 ? 's' : ''} · {done} completed</p>
                    </div>
                    <div className="checklist-month__progress">
                      <div className="checklist-month__progress-bar">
                        <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                      </div>
                      <span>{done}/{total}</span>
                    </div>
                  </header>

                  <ul className="task-list">
                    {monthTasks.map((task) => {
                      const cat = getCategoryMeta(task.category);
                      const dueLabel = new Date(task.dueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      });
                      return (
                        <li key={task.id} className={`task-row${task.done ? ' is-done' : ''}`}>
                          <button
                            type="button"
                            className={`task-check${task.done ? ' is-checked' : ''}`}
                            onClick={() => toggleTask(task.id)}
                            aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {task.done ? '✓' : ''}
                          </button>

                          <button
                            type="button"
                            className="task-row__main"
                            onClick={() => setEditing({ ...task })}
                          >
                            <span className="task-title">{task.title}</span>
                            <span className="task-row__meta">
                              <span className="task-tag" data-category={task.category}>
                                {cat.icon} {cat.label}
                              </span>
                              {task.phaseLabel && <span className="task-date">{task.phaseLabel}</span>}
                              <span className="task-date">📅 {dueLabel}</span>
                              {task.assigned && task.assigned !== 'Unassigned' && (
                                <span className="task-assigned">👤 {task.assigned}</span>
                              )}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="task-edit"
                            onClick={() => setEditing({ ...task })}
                            aria-label="Edit task"
                          >
                            ✏️
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </div>

      {editing && (
        <div className="dash-overlay" onClick={() => setEditing(null)}>
          <div className="dash-panel dash-panel--side" onClick={(e) => e.stopPropagation()}>
            <h2>Edit task</h2>
            <label className="dash-field">
              <span>Task name</span>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="What needs to be done?"
              />
            </label>
            <label className="dash-field">
              <span>Status</span>
              <select value={editing.done ? 'done' : 'todo'} onChange={(e) => setEditing({ ...editing, done: e.target.value === 'done' })}>
                <option value="todo">To do</option>
                <option value="done">Completed</option>
              </select>
            </label>
            <label className="dash-field">
              <span>Due date</span>
              <input type="date" value={editing.dueDate} onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Category</span>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {taskCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </label>
            <label className="dash-field">
              <span>Assign to</span>
              <select
                value={editing.assigned}
                onChange={(e) => setEditing({ ...editing, assigned: e.target.value === 'Unassign' ? 'Unassigned' : e.target.value })}
              >
                <option value="Unassigned">Unassigned</option>
                {crewRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="dash-field">
              <span>Notes</span>
              <textarea rows={3} placeholder="Add reminders or details..." value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="dash-btn dash-btn--primary" onClick={saveEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChecklistPage;
