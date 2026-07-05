import { useMemo, useState } from 'react';
import { guestGroups, rsvpStatuses } from '../../data/dashboardData';
import { getGuests, saveGuests } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

const emptyGuest = { name: '', email: '', phone: '', group: 'No Group', rsvp: 'Pending', notes: '' };
const PAGE_SIZES = [25, 50, 100, 250];
const CSV_HEADER = 'name,email,phone,group,rsvp,notes';

const RSVP_LABELS = {
  Pending: { label: 'Waiting', icon: '⏳', hint: 'Has not replied yet' },
  Accepted: { label: 'Coming', icon: '✓', hint: 'Confirmed attendance' },
  Rejected: { label: 'Not coming', icon: '✗', hint: 'Declined invitation' },
  Declined: { label: 'Not coming', icon: '✗', hint: 'Declined invitation' },
};

function rsvpKey(status) {
  return (status || 'Pending').toLowerCase();
}

function normalizeRsvp(value) {
  const v = (value || '').trim().toLowerCase();
  if (['accepted', 'coming', 'yes', 'y'].includes(v)) return 'Accepted';
  if (['rejected', 'declined', 'not coming', 'no', 'n'].includes(v)) return 'Rejected';
  return 'Pending';
}

function guestMatchKey(g) {
  const phone = (g.phone || '').replace(/\D/g, '');
  const email = (g.email || '').trim().toLowerCase();
  const name = (g.name || '').trim().toLowerCase();
  if (phone) return `phone:${phone}`;
  if (email) return `email:${email}`;
  return `name:${name}`;
}

function parseCsvLine(line) {
  const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
  const [name, email, phone, group, rsvp, notes] = parts;
  return {
    name: name || '',
    email: email || '',
    phone: phone || '',
    group: group || 'No Group',
    rsvp: normalizeRsvp(rsvp),
    notes: notes || '',
  };
}

function guestsToCsv(guestList) {
  const rows = guestList.map((g) => [
    g.name,
    g.email || '',
    g.phone || '',
    g.group || 'No Group',
    g.rsvp || 'Pending',
    (g.notes || '').replace(/,/g, ';'),
  ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  return [CSV_HEADER, ...rows].join('\n');
}

function GuestListPage() {
  const [guests, setGuests] = useState(() => getGuests());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [rsvpFilter, setRsvpFilter] = useState('All Statuses');
  const [view, setView] = useState('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [form, setForm] = useState(emptyGuest);
  const [bulkForm, setBulkForm] = useState({ names: '', group: 'No Group', rsvp: 'Pending' });

  const stats = useMemo(() => ({
    total: guests.length,
    pending: guests.filter((g) => g.rsvp === 'Pending').length,
    accepted: guests.filter((g) => g.rsvp === 'Accepted').length,
    declined: guests.filter((g) => g.rsvp === 'Rejected' || g.rsvp === 'Declined').length,
  }), [guests]);

  const responsePct = stats.total
    ? Math.round(((stats.accepted + stats.declined) / stats.total) * 100)
    : 0;

  const filtered = useMemo(() => guests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.includes(q);
    const matchGroup = groupFilter === 'All Groups' || g.group === groupFilter;
    const matchRsvp = rsvpFilter === 'All Statuses' || g.rsvp === rsvpFilter;
    return matchSearch && matchGroup && matchRsvp;
  }), [guests, search, groupFilter, rsvpFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageStart = filtered.length ? (safePage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);

  const selectedCount = selectedIds.size;
  const allPageSelected = paginated.length > 0 && paginated.every((g) => selectedIds.has(g.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((g) => selectedIds.has(g.id));

  const persist = (next) => {
    setGuests(next);
    saveGuests(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginated.forEach((g) => next.add(g.id));
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((g) => g.id)));
  };

  const deselectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginated.forEach((g) => next.delete(g.id));
      return next;
    });
  };

  const bulkUpdateRsvp = (ids, rsvp) => {
    const idSet = new Set(ids);
    persist(guests.map((g) => (idSet.has(g.id) ? { ...g, rsvp } : g)));
    clearSelection();
  };

  const bulkUpdateGroup = (ids, group) => {
    const idSet = new Set(ids);
    persist(guests.map((g) => (idSet.has(g.id) ? { ...g, group } : g)));
    clearSelection();
  };

  const bulkRemove = (ids) => {
    const idSet = new Set(ids);
    persist(guests.filter((g) => !idSet.has(g.id)));
    clearSelection();
    setBulkDeleteConfirm(false);
    if (editingId && idSet.has(editingId)) closePanel();
  };

  const applyGroupRsvp = (group, rsvp) => {
    persist(guests.map((g) => (g.group === group ? { ...g, rsvp } : g)));
  };

  const openAdd = () => {
    setForm(emptyGuest);
    setEditingId(null);
    setPanelOpen(true);
  };

  const openEdit = (guest) => {
    setForm({ ...guest });
    setEditingId(guest.id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(emptyGuest);
  };

  const submitGuest = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      persist(guests.map((g) => (g.id === editingId ? { ...form, id: editingId } : g)));
    } else {
      persist([...guests, { ...form, id: `g${Date.now()}` }]);
    }
    closePanel();
  };

  const submitBulkAdd = (e) => {
    e.preventDefault();
    const names = bulkForm.names.split(/\r?\n/).map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    const newGuests = names.map((name, i) => ({
      id: `g${Date.now()}${i}`,
      name,
      email: '',
      phone: '',
      group: bulkForm.group,
      rsvp: bulkForm.rsvp,
      notes: '',
    }));
    persist([...guests, ...newGuests]);
    setBulkAddOpen(false);
    setBulkForm({ names: '', group: 'No Group', rsvp: 'Pending' });
  };

  const removeGuest = (id) => {
    persist(guests.filter((g) => g.id !== id));
    setDeleteConfirm(null);
    if (editingId === id) closePanel();
  };

  const mergeImport = (rows) => {
    const lookup = new Map();
    guests.forEach((g) => lookup.set(guestMatchKey(g), g));

    let added = 0;
    let updated = 0;
    const merged = [...guests];

    rows.forEach((row, i) => {
      if (!row.name.trim()) return;
      const incoming = { ...row, id: `g${Date.now()}${i}` };
      const key = guestMatchKey(incoming);
      const existing = lookup.get(key);

      if (existing) {
        const idx = merged.findIndex((g) => g.id === existing.id);
        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            name: incoming.name || merged[idx].name,
            email: incoming.email || merged[idx].email,
            phone: incoming.phone || merged[idx].phone,
            group: incoming.group !== 'No Group' ? incoming.group : merged[idx].group,
            rsvp: incoming.rsvp !== 'Pending' ? incoming.rsvp : merged[idx].rsvp,
            notes: incoming.notes || merged[idx].notes,
          };
          updated += 1;
        }
      } else {
        merged.push(incoming);
        lookup.set(key, incoming);
        added += 1;
      }
    });

    persist(merged);
    setImportResult({ added, updated, total: added + updated });
    setTimeout(() => setImportResult(null), 5000);
  };

  const importCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      const rows = lines.slice(1).map(parseCsvLine).filter((r) => r.name);
      if (rows.length) mergeImport(rows);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportCsv = () => {
    const blob = new Blob([guestsToCsv(guests)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wowwed-guests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filterByRsvp = (status) => {
    setRsvpFilter(rsvpFilter === status ? 'All Statuses' : status);
    setPage(1);
  };

  const hasActiveFilters = search.trim() || groupFilter !== 'All Groups' || rsvpFilter !== 'All Statuses';

  const clearFilters = () => {
    setSearch('');
    setGroupFilter('All Groups');
    setRsvpFilter('All Statuses');
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleGroupFilterChange = (value) => {
    setGroupFilter(value);
    setPage(1);
  };

  const handleRsvpFilterChange = (value) => {
    setRsvpFilter(value);
    setPage(1);
  };

  const selectedIdList = [...selectedIds];

  return (
    <div className="dash-page dash-page--guests">
      <PageHeader moduleId="guests">
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={exportCsv}>Export CSV</button>
          <label className="dash-btn dash-btn--outline csv-upload">
            Import / Update CSV
            <input type="file" accept=".csv" hidden onChange={importCsv} />
          </label>
          <button type="button" className="dash-btn dash-btn--outline" onClick={() => setBulkAddOpen(true)}>Add many</button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={openAdd}>+ Add guest</button>
        </div>
      </PageHeader>

      {importResult && (
        <div className="guest-import-toast">
          CSV imported: <strong>{importResult.added} added</strong>, <strong>{importResult.updated} updated</strong>
        </div>
      )}

      <section className="guest-help-banner" aria-label="How RSVPs work">
        <span className="guest-help-banner__icon">💡</span>
        <div>
          <strong>Best for large weddings (100+ guests)</strong>
          <p>
            <strong>1.</strong> Export CSV → update RSVPs in Excel/Google Sheets (Accepted / Rejected / Pending) → re-import to update all at once.
            <strong> 2.</strong> Select multiple guests and bulk-mark Coming or Not coming.
            <strong> 3.</strong> Mark an entire group (Family, Friends…) with one click below.
          </p>
        </div>
      </section>

      <div className="guest-stats">
        <button type="button" className={`guest-stat guest-stat--clickable${rsvpFilter === 'All Statuses' && !hasActiveFilters ? ' is-on' : ''}`} onClick={clearFilters}>
          <strong>{stats.total}</strong><span>Total guests</span>
        </button>
        <button type="button" className={`guest-stat guest-stat--gold guest-stat--clickable${rsvpFilter === 'Pending' ? ' is-on' : ''}`} onClick={() => filterByRsvp('Pending')}>
          <strong>{stats.pending}</strong><span>Waiting for reply</span>
        </button>
        <button type="button" className={`guest-stat guest-stat--green guest-stat--clickable${rsvpFilter === 'Accepted' ? ' is-on' : ''}`} onClick={() => filterByRsvp('Accepted')}>
          <strong>{stats.accepted}</strong><span>Coming</span>
        </button>
        <button type="button" className={`guest-stat guest-stat--red guest-stat--clickable${rsvpFilter === 'Rejected' ? ' is-on' : ''}`} onClick={() => filterByRsvp('Rejected')}>
          <strong>{stats.declined}</strong><span>Not coming</span>
        </button>
      </div>

      {stats.total > 0 && (
        <div className="guest-rsvp-progress">
          <div className="guest-rsvp-progress__bar">
            <div className="guest-rsvp-progress__fill guest-rsvp-progress__fill--accepted" style={{ width: `${(stats.accepted / stats.total) * 100}%` }} />
            <div className="guest-rsvp-progress__fill guest-rsvp-progress__fill--declined" style={{ width: `${(stats.declined / stats.total) * 100}%` }} />
          </div>
          <span>{responsePct}% have replied · {stats.pending} still waiting</span>
        </div>
      )}

      <div className="guest-quick-group dash-card">
        <span className="guest-quick-group__label">Quick group RSVP:</span>
        {guestGroups.filter((g) => g !== 'No Group').map((group) => (
          <div key={group} className="guest-quick-group__item">
            <span>{group}</span>
            <button type="button" className="guest-rsvp-btn guest-rsvp-btn--accepted" onClick={() => applyGroupRsvp(group, 'Accepted')}>All coming</button>
            <button type="button" className="guest-rsvp-btn guest-rsvp-btn--rejected" onClick={() => applyGroupRsvp(group, 'Rejected')}>All not coming</button>
          </div>
        ))}
      </div>

      <div className="guest-toolbar">
        <div className="guest-search">
          <span aria-hidden="true">🔍</span>
          <input type="search" placeholder="Search by name, email, or phone..." value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <select value={groupFilter} onChange={(e) => handleGroupFilterChange(e.target.value)} aria-label="Filter by group">
          <option>All Groups</option>
          {guestGroups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={rsvpFilter} onChange={(e) => handleRsvpFilterChange(e.target.value)} aria-label="Filter by RSVP">
          <option>All Statuses</option>
          {rsvpStatuses.map((s) => <option key={s}>{RSVP_LABELS[s]?.label || s}</option>)}
        </select>
        {hasActiveFilters && <button type="button" className="guest-clear-filters" onClick={clearFilters}>Clear</button>}
        <div className="view-toggle">
          <button type="button" className={view === 'table' ? 'is-on' : ''} onClick={() => setView('table')}>Table</button>
          <button type="button" className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')}>Cards</button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="guest-bulk-bar">
          <span><strong>{selectedCount}</strong> selected</span>
          <button type="button" className="guest-rsvp-btn guest-rsvp-btn--accepted" onClick={() => bulkUpdateRsvp(selectedIdList, 'Accepted')}>Mark coming</button>
          <button type="button" className="guest-rsvp-btn guest-rsvp-btn--rejected" onClick={() => bulkUpdateRsvp(selectedIdList, 'Rejected')}>Mark not coming</button>
          <button type="button" className="guest-rsvp-btn guest-rsvp-btn--pending" onClick={() => bulkUpdateRsvp(selectedIdList, 'Pending')}>Mark waiting</button>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                bulkUpdateGroup(selectedIdList, e.target.value);
                e.target.value = '';
              }
            }}
            aria-label="Move selected to group"
          >
            <option value="">Move to group…</option>
            {guestGroups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button type="button" className="guest-action-btn guest-action-btn--danger" onClick={() => setBulkDeleteConfirm(true)}>Delete selected</button>
          <button type="button" className="guest-clear-filters" onClick={clearSelection}>Clear selection</button>
        </div>
      )}

      <div className="dash-card guest-list-body">
        {filtered.length === 0 ? (
          <div className="guest-empty">
            <span className="guest-empty__icon">🎟️</span>
            <h3>{guests.length === 0 ? 'No guests yet' : 'No guests match your filters'}</h3>
            <p>{guests.length === 0 ? 'Import a CSV or use Add many to paste hundreds of names at once.' : 'Try changing your search or filters.'}</p>
            {guests.length === 0 ? (
              <div className="guest-empty__actions">
                <button type="button" className="dash-btn dash-btn--outline" onClick={() => setBulkAddOpen(true)}>Add many guests</button>
                <label className="dash-btn dash-btn--primary csv-upload">
                  Import CSV
                  <input type="file" accept=".csv" hidden onChange={importCsv} />
                </label>
              </div>
            ) : (
              <button type="button" className="dash-btn dash-btn--outline" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : view === 'table' ? (
          <>
            <div className="guest-table-toolbar">
              <div className="guest-select-actions">
                <label className="guest-select-all">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={() => (allPageSelected ? deselectPage() : selectPage())}
                  />
                  Select page ({paginated.length})
                </label>
                {!allFilteredSelected && (
                  <button type="button" className="guest-clear-filters" onClick={selectAllFiltered}>
                    Select all {filtered.length} matching
                  </button>
                )}
              </div>
              <span className="guest-page-info">Showing {pageStart}–{pageEnd} of {filtered.length}</span>
            </div>
            <div className="guest-table-wrap">
              <table className="guest-table">
                <thead>
                  <tr>
                    <th aria-label="Select" />
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Group</th>
                    <th>RSVP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((g) => (
                    <tr key={g.id} className={selectedIds.has(g.id) ? 'is-selected' : ''}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelect(g.id)} aria-label={`Select ${g.name}`} />
                      </td>
                      <td><strong>{g.name}</strong></td>
                      <td>
                        {g.phone && <div>{g.phone}</div>}
                        {g.email && <small>{g.email}</small>}
                        {!g.phone && !g.email && <span className="guest-no-contact">—</span>}
                      </td>
                      <td><span className="guest-group-badge">{g.group}</span></td>
                      <td>
                        <span className={`rsvp-badge rsvp-badge--${rsvpKey(g.rsvp)}`}>
                          {RSVP_LABELS[g.rsvp]?.icon} {RSVP_LABELS[g.rsvp]?.label || g.rsvp}
                        </span>
                      </td>
                      <td>
                        <div className="guest-row-actions">
                          <button type="button" className="guest-action-btn" onClick={() => openEdit(g)} aria-label={`Edit ${g.name}`}>✏️</button>
                          <button type="button" className="guest-action-btn guest-action-btn--danger" onClick={() => setDeleteConfirm(g.id)} aria-label={`Delete ${g.name}`}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="guest-pagination">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} per page</option>)}
              </select>
              <div className="guest-pagination__nav">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
                <span>Page {safePage} of {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next →</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <ul className="guest-cards">
              {paginated.map((g) => {
                const rsvpInfo = RSVP_LABELS[g.rsvp] || RSVP_LABELS.Pending;
                return (
                  <li key={g.id} className={`guest-card${selectedIds.has(g.id) ? ' is-selected' : ''}${g.rsvp === 'Accepted' ? ' guest-card--accepted' : ''}${g.rsvp === 'Rejected' || g.rsvp === 'Declined' ? ' guest-card--declined' : ''}`}>
                    <label className="guest-card__check">
                      <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelect(g.id)} />
                    </label>
                    <div className="guest-card__avatar">{g.name.charAt(0).toUpperCase()}</div>
                    <div className="guest-card__info">
                      <div className="guest-card__top">
                        <strong>{g.name}</strong>
                        <span className={`rsvp-badge rsvp-badge--${rsvpKey(g.rsvp)}`}>{rsvpInfo.icon} {rsvpInfo.label}</span>
                      </div>
                      <div className="guest-card__contact">
                        {g.phone && <span>📱 {g.phone}</span>}
                        {g.email && <span>✉️ {g.email}</span>}
                      </div>
                      <span className="guest-group-badge">{g.group}</span>
                    </div>
                    <div className="guest-card__actions">
                      <button type="button" className="guest-action-btn" onClick={() => openEdit(g)}>✏️ Edit</button>
                      <button type="button" className="guest-action-btn guest-action-btn--danger" onClick={() => setDeleteConfirm(g.id)}>🗑️</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="guest-pagination">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} per page</option>)}
              </select>
              <div className="guest-pagination__nav">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
                <span>Page {safePage} of {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {bulkAddOpen && (
        <div className="dash-overlay" onClick={() => setBulkAddOpen(false)}>
          <form className="dash-panel dash-panel--side" onSubmit={submitBulkAdd} onClick={(e) => e.stopPropagation()}>
            <h2>Add many guests</h2>
            <p className="guest-panel-hint">Paste one name per line — perfect for 100+ guests at once.</p>
            <label className="dash-field">
              <span>Guest names (one per line) *</span>
              <textarea
                rows={12}
                required
                value={bulkForm.names}
                onChange={(e) => setBulkForm({ ...bulkForm, names: e.target.value })}
                placeholder={'Romesh Perera\nUthpala Silva\nBruno Fernando\n...'}
              />
            </label>
            <label className="dash-field">
              <span>Default group</span>
              <select value={bulkForm.group} onChange={(e) => setBulkForm({ ...bulkForm, group: e.target.value })}>
                {guestGroups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
            <label className="dash-field">
              <span>Default RSVP</span>
              <select value={bulkForm.rsvp} onChange={(e) => setBulkForm({ ...bulkForm, rsvp: e.target.value })}>
                {rsvpStatuses.map((s) => <option key={s} value={s}>{RSVP_LABELS[s]?.label || s}</option>)}
              </select>
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setBulkAddOpen(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Add all guests</button>
            </div>
          </form>
        </div>
      )}

      {panelOpen && (
        <div className="dash-overlay" onClick={closePanel}>
          <form className="dash-panel dash-panel--side" onSubmit={submitGuest} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit guest' : 'Add guest'}</h2>
            <label className="dash-field"><span>Full name *</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="dash-field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="dash-field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="dash-field"><span>Group</span>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                {guestGroups.map((grp) => <option key={grp}>{grp}</option>)}
              </select>
            </label>
            <label className="dash-field"><span>RSVP status</span>
              <select value={form.rsvp} onChange={(e) => setForm({ ...form, rsvp: e.target.value })}>
                {rsvpStatuses.map((s) => <option key={s} value={s}>{RSVP_LABELS[s]?.label || s}</option>)}
              </select>
            </label>
            <label className="dash-field"><span>Notes</span><textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="dash-panel__actions">
              {editingId && <button type="button" className="dash-btn dash-btn--ghost guest-delete-btn" onClick={() => setDeleteConfirm(editingId)}>Delete guest</button>}
              <button type="button" className="dash-btn dash-btn--ghost" onClick={closePanel}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">{editingId ? 'Save changes' : 'Add guest'}</button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="dash-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dash-panel guest-delete-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Remove guest?</h2>
            <p><strong>{guests.find((g) => g.id === deleteConfirm)?.name}</strong> will be removed.</p>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="dash-btn dash-btn--primary guest-delete-btn" onClick={() => removeGuest(deleteConfirm)}>Yes, remove</button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="dash-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="dash-panel guest-delete-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Delete {selectedCount} guests?</h2>
            <p>This will permanently remove all selected guests from your list.</p>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setBulkDeleteConfirm(false)}>Cancel</button>
              <button type="button" className="dash-btn dash-btn--primary guest-delete-btn" onClick={() => bulkRemove(selectedIdList)}>Yes, delete all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestListPage;
