import { useMemo, useState } from 'react';
import { crewRoles, defaultTasks, getCategoryMeta, getTaskDateGroups, groupTasksByMonth, taskCategories } from '../../data/dashboardData';
import { getTasks, saveTasks } from '../../utils/storage';

function ChecklistPage() {
  const [tasks, setTasks] = useState(() => getTasks() || defaultTasks);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [showAllDates, setShowAllDates] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter === 'done' && !task.done) return false;
      if (statusFilter === 'todo' && task.done) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (monthFilter !== 'all') {
        const key = new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (key !== monthFilter) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, categoryFilter, monthFilter]);

  const grouped = groupTasksByMonth(filtered);
  const dateGroups = getTaskDateGroups(tasks);
  const visibleDates = showAllDates ? dateGroups : dateGroups.slice(0, 5);
  const doneCount = tasks.filter((t) => t.done).length;
  const todoCount = tasks.length - doneCount;
  const unassignedCount = tasks.filter((t) => t.assigned === 'Unassigned').length;

  const persist = (next) => {
    setTasks(next);
    saveTasks(next);
  };

  const toggleTask = (id) => {
    persist(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const saveEdit = () => {
    if (!editing) return;
    persist(tasks.map((t) => (t.id === editing.id ? editing : t)));
    setEditing(null);
  };

  const addTask = () => {
    const task = {
      id: `t${Date.now()}`,
      title: 'New task',
      category: 'other',
      dueDate: '2027-07-07',
      done: false,
      assigned: 'Unassigned',
      notes: '',
    };
    persist([...tasks, task]);
    setEditing(task);
  };

  return (
    <div className="dash-page dash-page--checklist">
      <header className="dash-page__header">
        <div>
          <h1>Wedding Checklist</h1>
          <p>Organize and track your wedding tasks</p>
        </div>
      </header>

      <div className="checklist-layout">
        <aside className="dash-filters">
          <h3>FILTERS</h3>
          <div className="dash-filter-group">
            <h4>BY STATUS</h4>
            <button type="button" className={`dash-filter-pill${statusFilter === 'done' ? ' is-on' : ''}`} onClick={() => setStatusFilter(statusFilter === 'done' ? 'all' : 'done')}>
              ✓ Done <span>{doneCount}</span>
            </button>
            <button type="button" className={`dash-filter-pill${statusFilter === 'todo' ? ' is-on' : ''}`} onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}>
              ○ To Do <span>{todoCount}</span>
            </button>
          </div>
          <div className="dash-filter-group">
            <h4>BY DATE</h4>
            <div className="dash-date-timeline">
              {visibleDates.map(({ label, count }) => (
                <button
                  key={label}
                  type="button"
                  className={monthFilter === label ? 'is-on' : ''}
                  onClick={() => setMonthFilter(monthFilter === label ? 'all' : label)}
                >
                  {label} <span>{String(count).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
            {dateGroups.length > 5 && (
              <button type="button" className="dash-see-more" onClick={() => setShowAllDates(!showAllDates)}>
                {showAllDates ? 'Show less' : 'See more'}
              </button>
            )}
          </div>
          <div className="dash-filter-group">
            <h4>BY CATEGORY</h4>
            <div className="dash-filter-tags">
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`dash-tag${categoryFilter === cat.id ? ' is-on' : ''}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="dash-filter-group">
            <h4>BY ASSIGNED</h4>
            <button type="button" className="dash-filter-pill">
              Unassigned <span>{unassignedCount}</span>
            </button>
          </div>
        </aside>

        <div className="checklist-tasks">
          {Object.entries(grouped).map(([month, monthTasks]) => (
            <section key={month} className="dash-card">
              <h2>{month}</h2>
              <ul className="task-list">
                {monthTasks.map((task) => {
                  const cat = getCategoryMeta(task.category);
                  return (
                    <li key={task.id} className={task.done ? 'is-done' : ''}>
                      <button type="button" className="task-check" onClick={() => toggleTask(task.id)}>
                        {task.done ? '✓' : ''}
                      </button>
                      <span className="task-title">{task.title}</span>
                      <span className="task-tag">{cat.icon} {cat.label}</span>
                      <span className="task-date">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <button type="button" className="task-edit" onClick={() => setEditing({ ...task })}>✏️</button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="dash-add-dashed" onClick={addTask}>+ Add a new task</button>
            </section>
          ))}
        </div>
      </div>

      {editing && (
        <div className="dash-overlay" onClick={() => setEditing(null)}>
          <div className="dash-panel dash-panel--side" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Task</h2>
            <p className="dash-panel__title">{editing.title}</p>
            <label className="dash-field">
              <span>Status</span>
              <select value={editing.done ? 'done' : 'todo'} onChange={(e) => setEditing({ ...editing, done: e.target.value === 'done' })}>
                <option value="todo">Incomplete</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="dash-field">
              <span>Due Date</span>
              <input type="date" value={editing.dueDate} onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Notes</span>
              <textarea rows={3} placeholder="Add your notes" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
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
              <span>Assign To</span>
              <select value={editing.assigned} onChange={(e) => setEditing({ ...editing, assigned: e.target.value })}>
                <option>Unassign</option>
                {crewRoles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="dash-btn dash-btn--primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChecklistPage;
