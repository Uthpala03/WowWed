import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  crewRoles,
  getCategoryMeta,
  getPhaseDateHint,
  getTaskPhaseGroups,
  groupTasksByWeddingPhase,
  resolveTaskPhase,
  taskCategories,
} from '../../data/dashboardData';
import { getTasks, saveTasks } from '../../utils/storage';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import ListPagination from '../../components/ui/ListPagination';
import { COMPACT_PAGE_SIZES, usePagination } from '../../hooks/usePagination';

const TASK_ICONS = {
  guests: 'guests',
  suite: 'bridal',
  vendors: 'vendors',
  ceremony: 'ring',
  catering: 'catering',
  decorations: 'floral',
  entertainment: 'sparkle',
  logistics: 'pin',
  budget: 'budget',
  venue: 'venue',
  other: 'vendors',
};

function TaskRows({ tasks, onToggle, onEdit }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const cat = getCategoryMeta(task.category);
        const dueLabel = new Date(task.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        return (
          <li key={task.id} className={`task-row task-row--compact${task.done ? ' is-done' : ''}`}>
            <button
              type="button"
              className={`task-check${task.done ? ' is-checked' : ''}`}
              onClick={() => onToggle(task.id)}
              aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.done ? '✓' : ''}
            </button>
            <button type="button" className="task-row__main" onClick={() => onEdit(task)}>
              <span className="task-title">{task.title}</span>
              <span className="task-row__meta">
                <span className="task-tag" data-category={task.category}>
                  {cat.icon} {cat.label}
                </span>
                <span className="task-date">📅 {dueLabel}</span>
                {task.assigned && task.assigned !== 'Unassigned' && (
                  <span className="task-assigned">👤 {task.assigned}</span>
                )}
              </span>
            </button>
            <button type="button" className="task-edit" onClick={() => onEdit(task)} aria-label="Edit task">
              ✏️
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChecklistPage() {
  const coupleData = useOutletContext();
  const weddingDate = coupleData?.profile?.weddingDate || coupleData?.onboarding?.weddingDate || '';
  const [tasks, setTasks] = useState(() => coupleData?.tasks || getTasks() || []);

  useEffect(() => {
    setTasks(coupleData?.tasks || getTasks() || []);
  }, [coupleData]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const doneCount = tasks.filter((t) => t.done).length;
  const todoCount = tasks.length - doneCount;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const unassignedCount = tasks.filter((t) => t.assigned === 'Unassigned').length;

  const hasActiveFilters = statusFilter !== 'all'
    || categoryFilter !== 'all'
    || phaseFilter !== 'all'
    || assignedFilter !== 'all'
    || search.trim();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter === 'done' && !task.done) return false;
      if (statusFilter === 'todo' && task.done) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (assignedFilter === 'unassigned' && task.assigned !== 'Unassigned') return false;
      if (phaseFilter !== 'all') {
        if (resolveTaskPhase(task.dueDate, weddingDate, task.phase) !== phaseFilter) return false;
      }
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [tasks, statusFilter, categoryFilter, phaseFilter, assignedFilter, search, weddingDate]);

  const groupedByPhase = useMemo(
    () => groupTasksByWeddingPhase(filtered, weddingDate),
    [filtered, weddingDate],
  );
  const viewingAllPhases = phaseFilter === 'all';

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    pageItems: pagedTasks,
    pageStart,
    pageEnd,
    resetPage,
  } = usePagination(viewingAllPhases ? [] : filtered, { initialPageSize: 12, pageSizes: COMPACT_PAGE_SIZES });

  useEffect(() => {
    resetPage();
  }, [statusFilter, categoryFilter, phaseFilter, assignedFilter, search, resetPage]);

  const grouped = viewingAllPhases
    ? groupedByPhase
    : Object.fromEntries(
      Object.entries(groupTasksByWeddingPhase(pagedTasks, weddingDate)).map(([label, value]) => [label, value]),
    );

  const phaseGroups = getTaskPhaseGroups(tasks, weddingDate);

  const selectPhase = (id) => {
    setPhaseFilter((current) => (current === id ? 'all' : id));
  };

  const persist = (next) => {
    setTasks(next);
    saveTasks(next);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setPhaseFilter('all');
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
      dueDate: weddingDate || new Date().toISOString().slice(0, 10),
      done: false,
      assigned: 'Unassigned',
      notes: '',
    };
    persist([...tasks, task]);
    setEditing(task);
  };

  const sectionProgress = (sectionTasks) => {
    const done = sectionTasks.filter((t) => t.done).length;
    return { done, total: sectionTasks.length };
  };

  const weddingDateLabel = weddingDate
    ? new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="dash-page dash-page--checklist">
      <PageHeader moduleId="checklist">
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={addTask}>+ Add task</button>
        </div>
      </PageHeader>

      <section className="dash-summary-bar" aria-label="Checklist progress">
        <div className="dash-summary-bar__row">
          <span><strong>{doneCount}</strong> done</span>
          <span className="dash-summary-bar__sep">·</span>
          <span><strong>{todoCount}</strong> to do</span>
          <span className="dash-summary-bar__sep">·</span>
          <span><strong>{progressPct}%</strong> complete</span>
          {weddingDate && (
            <>
              <span className="dash-summary-bar__sep">·</span>
              <span>Wedding {weddingDateLabel}</span>
            </>
          )}
          {unassignedCount > 0 && (
            <>
              <span className="dash-summary-bar__sep">·</span>
              <span><strong>{unassignedCount}</strong> unassigned</span>
            </>
          )}
        </div>
        <div className="dash-summary-bar__progress" aria-hidden="true">
          <span style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #6b9e78, #8bc49a)' }} />
        </div>
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
        <div className="checklist-sidebar">
          <aside className="checklist-month-sidebar dash-card" aria-label="Wedding timeline">
            <h4>Your timeline</h4>
            {!weddingDate ? (
              <p className="checklist-phase-note">
                Add your wedding date to personalise each stage.
                <Link to="/wedding-profile"> Set wedding date</Link>
              </p>
            ) : (
              <p className="checklist-phase-note">Stages are based on your wedding on {weddingDateLabel}.</p>
            )}
            <div className="dash-date-timeline">
              <button
                type="button"
                className={phaseFilter === 'all' ? 'is-on' : ''}
                onClick={() => setPhaseFilter('all')}
              >
                <span className="dash-date-timeline__label">
                  <span>All stages</span>
                </span>
                <span>{tasks.length}</span>
              </button>
              {phaseGroups.map(({ id, label, hint, count }) => (
                <button
                  key={id}
                  type="button"
                  className={phaseFilter === id ? 'is-on' : ''}
                  onClick={() => selectPhase(id)}
                >
                  <span className="dash-date-timeline__label">
                    <span>{label}</span>
                    {hint && <small>{hint}</small>}
                  </span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          </aside>

          <aside className={`dash-filters checklist-filters${filtersOpen ? ' is-open' : ''}`}>
            <div className="checklist-filters__head">
              <h3>More filters</h3>
              <p>Status, category, and assignment</p>
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
        </div>

        <div className="checklist-tasks">
          {Object.keys(grouped).length === 0 ? (
            <div className="checklist-empty dash-card">
              <span className="checklist-empty__icon">📋</span>
              <h2>No tasks found</h2>
              <p>
                {hasActiveFilters
                  ? 'Try changing your filters or search term.'
                  : weddingDate
                    ? 'Add your first task to start planning.'
                    : 'Add your wedding date to get a personalised timeline.'}
              </p>
              {hasActiveFilters ? (
                <button type="button" className="dash-btn dash-btn--outline" onClick={clearFilters}>Clear filters</button>
              ) : weddingDate ? (
                <button type="button" className="dash-btn dash-btn--primary" onClick={addTask}>+ Add task</button>
              ) : (
                <Link to="/wedding-profile" className="dash-btn dash-btn--primary">Add wedding date</Link>
              )}
            </div>
          ) : (
            Object.entries(grouped).map(([phaseLabel, section]) => {
              const sectionTasks = section.tasks || section;
              const phaseId = section.phaseId || resolveTaskPhase(sectionTasks[0]?.dueDate, weddingDate, sectionTasks[0]?.phase);
              const sectionHint = section.hint || getPhaseDateHint(phaseId, weddingDate);
              const { done, total } = sectionProgress(sectionTasks);
              const phasePct = total ? Math.round((done / total) * 100) : 0;

              if (!viewingAllPhases) {
                return (
                  <section
                    key={phaseLabel}
                    id={`checklist-phase-${phaseId}`}
                    className="checklist-phase-section dash-card"
                  >
                    <header className="checklist-phase-section__head">
                      <h2>{phaseLabel}</h2>
                      <p>
                        {sectionHint && `${sectionHint} · `}
                        {total} task{total !== 1 ? 's' : ''} · {done} done ({phasePct}%)
                      </p>
                    </header>
                    <TaskRows tasks={sectionTasks} onToggle={toggleTask} onEdit={setEditing} />
                  </section>
                );
              }

              return (
                <details key={phaseLabel} id={`checklist-phase-${phaseId}`} className="checklist-month-details dash-card">
                  <summary>
                    <div className="checklist-month-details__title">
                      <h2>{phaseLabel}</h2>
                      <p>
                        {sectionHint && `${sectionHint} · `}
                        {total} task{total !== 1 ? 's' : ''} · {done} done ({phasePct}%)
                      </p>
                    </div>
                    <span className="checklist-month-details__chevron" aria-hidden="true">▼</span>
                  </summary>
                  <TaskRows tasks={sectionTasks} onToggle={toggleTask} onEdit={setEditing} />
                </details>
              );
            })
          )}
          {!viewingAllPhases && filtered.length > 0 && (
            <ListPagination
              page={page}
              totalPages={totalPages}
              pageStart={pageStart}
              pageEnd={pageEnd}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              icon="checklist"
            />
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
            <div className="dash-field">
              <PrettySelect
                label="Status"
                icon="checklist"
                value={editing.done ? 'done' : 'todo'}
                options={[
                  { value: 'todo', label: 'To do', icon: 'checklist' },
                  { value: 'done', label: 'Completed', icon: 'check' },
                ]}
                onChange={(value) => setEditing({ ...editing, done: value === 'done' })}
              />
            </div>
            <label className="dash-field">
              <span>Due date</span>
              <input type="date" value={editing.dueDate} onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })} />
            </label>
            <div className="dash-field">
              <PrettySelect
                label="Category"
                icon="vendors"
                value={editing.category}
                options={taskCategories.map((c) => ({ value: c.id, label: c.label, icon: TASK_ICONS[c.id] || 'vendors' }))}
                onChange={(category) => setEditing({ ...editing, category })}
              />
            </div>
            <div className="dash-field">
              <PrettySelect
                label="Assign to"
                icon="crew"
                value={editing.assigned}
                options={[
                  { value: 'Unassigned', label: 'Unassigned', icon: 'crew' },
                  ...crewRoles.map((r) => ({ value: r, label: r, icon: 'crew' })),
                ]}
                onChange={(assigned) => setEditing({ ...editing, assigned: assigned === 'Unassign' ? 'Unassigned' : assigned })}
              />
            </div>
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
