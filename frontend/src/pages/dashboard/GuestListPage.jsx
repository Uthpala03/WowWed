import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { guestGroups, normalizeGuestGroup, rsvpStatuses } from '../../data/dashboardData';
import { getGuests, getSeating, saveGuests, saveSeating } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

const emptyGuest = { name: '', email: '', phone: '', group: 'No Group', rsvp: 'Pending', age: '', notes: '', avoid: '' };
const PAGE_SIZES = [25, 50, 100, 250];
const CSV_HEADER = 'name,email,phone,group,rsvp,age,notes,avoid';

const RSVP_LABELS = {
  Pending: { label: 'Waiting', icon: '⏳', hint: 'Has not replied yet' },
  Accepted: { label: 'Coming', icon: '✓', hint: 'Confirmed attendance' },
  Rejected: { label: 'Not coming', icon: '✗', hint: 'Declined invitation' },
  Declined: { label: 'Not coming', icon: '✗', hint: 'Declined invitation' },
};

function normalizeRsvp(value) {
  const v = (value || '').trim().toLowerCase();
  if (['accepted', 'coming', 'yes', 'y'].includes(v)) return 'Accepted';
  if (['rejected', 'declined', 'not coming', 'no', 'n'].includes(v)) return 'Rejected';
  return 'Pending';
}

function RsvpToggle({ value, onChange, disabled, compact }) {
  const options = [
    { key: 'Accepted', label: 'Coming', cls: 'coming' },
    { key: 'Pending', label: 'Waiting', cls: 'waiting' },
    { key: 'Rejected', label: 'Not coming', cls: 'notcoming' },
  ];
  return (
    <div className={`rsvp-toggle${compact ? ' rsvp-toggle--compact' : ''}`} role="group">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled={disabled}
          className={`rsvp-toggle__btn rsvp-toggle__btn--${opt.cls}${value === opt.key ? ' is-on' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function guestMeta(guest) {
  const age = String(guest.age || '').trim();
  return [guest.group || 'No Group', age ? `Age ${age}` : '', guest.phone || guest.email].filter(Boolean).join(' · ');
}

function GuestRow({ guest, selected, onToggle, onRsvp, onEdit, onDelete }) {
  return (
    <li className={`guest-row${selected ? ' is-selected' : ''}${guest.rsvp === 'Accepted' ? ' guest-row--coming' : ''}${guest.rsvp === 'Rejected' || guest.rsvp === 'Declined' ? ' guest-row--notcoming' : ''}`}>
      <label className="guest-row__check">
        <input type="checkbox" checked={selected} onChange={() => onToggle(guest.id)} aria-label={`Select ${guest.name}`} />
      </label>
      <span className="guest-row__avatar">{guest.name.charAt(0).toUpperCase()}</span>
      <div className="guest-row__info">
        <strong>{guest.name}</strong>
        <small>{guestMeta(guest)}</small>
      </div>
      <RsvpToggle compact value={normalizeRsvp(guest.rsvp)} onChange={(rsvp) => onRsvp(guest.id, rsvp)} />
      <div className="guest-row__actions">
        <button type="button" className="guest-icon-btn" onClick={() => onEdit(guest)} aria-label={`Edit ${guest.name}`}>✏️</button>
        <button type="button" className="guest-icon-btn guest-icon-btn--danger" onClick={() => onDelete(guest.id)} aria-label={`Delete ${guest.name}`}>🗑️</button>
      </div>
    </li>
  );
}

function guestMatchKey(g) {
  const phone = (g.phone || '').replace(/\D/g, '');
  const email = (g.email || '').trim().toLowerCase();
  const name = (g.name || '').trim().toLowerCase();
  if (phone) return `phone:${phone}`;
  if (email) return `email:${email}`;
  return `name:${name}`;
}

function parseCsvLine(line, headers) {
  const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
  const get = (name, fallbackIndex) => {
    const i = headers.indexOf(name);
    if (i >= 0) return parts[i] || '';
    if (fallbackIndex < 0) return '';
    return parts[fallbackIndex] || '';
  };
  return {
    name: get('name', 0),
    email: get('email', 1),
    phone: get('phone', 2),
    group: normalizeGuestGroup(get('group', 3)),
    rsvp: normalizeRsvp(get('rsvp', 4)),
    age: get('age', -1),
    notes: get('notes', 5),
    avoid: get('avoid', 6),
  };
}

function guestsToCsv(guestList) {
  const rows = guestList.map((g) => [
    g.name,
    g.email || '',
    g.phone || '',
    g.group || 'No Group',
    g.rsvp || 'Pending',
    g.age || '',
    (g.notes || '').replace(/,/g, ';'),
    (g.avoid || '').replace(/,/g, ';'),
  ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  return [CSV_HEADER, ...rows].join('\n');
}

function GuestListPage() {
  const coupleData = useOutletContext();
  const [guests, setGuests] = useState(() => getGuests() || coupleData?.guests || []);

  useEffect(() => {
    const incoming = getGuests() || coupleData?.guests || [];
    let changed = false;
    const next = incoming.map((guest) => {
      const group = normalizeGuestGroup(guest.group);
      if (group !== (guest.group || 'No Group')) changed = true;
      return group === guest.group ? guest : { ...guest, group };
    });
    setGuests(next);
    if (changed) saveGuests(next);
  }, [coupleData]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [rsvpFilter, setRsvpFilter] = useState('All Statuses');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [csvDeleteConfirm, setCsvDeleteConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [groupRsvpNote, setGroupRsvpNote] = useState('');
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

  const activeGroupMembers = useMemo(() => {
    if (groupFilter === 'All Groups') return guests;
    return guests.filter((guest) => (guest.group || 'No Group') === groupFilter);
  }, [guests, groupFilter]);

  const activeGroupStatus = useMemo(() => {
    if (!activeGroupMembers.length) return '';
    const first = normalizeRsvp(activeGroupMembers[0].rsvp);
    return activeGroupMembers.every((guest) => normalizeRsvp(guest.rsvp) === first) ? first : '';
  }, [activeGroupMembers]);

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
    const markAll = group === 'All Groups';
    const members = markAll
      ? guests
      : guests.filter((g) => (g.group || 'No Group') === group);
    if (!members.length) return;
    persist(guests.map((g) => (
      markAll || (g.group || 'No Group') === group ? { ...g, rsvp } : g
    )));
    const label = RSVP_LABELS[rsvp]?.label || rsvp;
    setGroupRsvpNote(`${members.length} ${members.length === 1 ? 'guest' : 'guests'} in ${group} marked ${label}.`);
    window.setTimeout(() => setGroupRsvpNote(''), 3500);
  };

  const setGuestRsvp = (id, rsvp) => {
    persist(guests.map((guest) => (guest.id === id ? { ...guest, rsvp } : guest)));
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
            age: incoming.age || merged[idx].age || '',
            notes: incoming.notes || merged[idx].notes,
            avoid: incoming.avoid || merged[idx].avoid || '',
            fromCsv: true,
          };
          updated += 1;
        }
      } else {
        merged.push({ ...incoming, fromCsv: true });
        lookup.set(key, incoming);
        added += 1;
      }
    });

    persist(merged);
    setImportResult({ added, updated, total: added + updated });
    setTimeout(() => setImportResult(null), 5000);
  };

  const csvGuests = guests.filter((g) => g.fromCsv);
  const csvDeleteCount = csvGuests.length || guests.length;

  const clearImportedCsv = () => {
    const removeIds = new Set((csvGuests.length ? csvGuests : guests).map((g) => g.id));
    persist(guests.filter((g) => !removeIds.has(g.id)));
    const seating = getSeating();
    if (seating?.assignments) {
      const assignments = { ...seating.assignments };
      Object.keys(assignments).forEach((key) => {
        if (removeIds.has(assignments[key])) delete assignments[key];
      });
      saveSeating({ ...seating, assignments });
    }
    clearSelection();
    setCsvDeleteConfirm(false);
    setImportResult(null);
  };

  const importCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      const header = lines[0].split(',').map((s) => s.trim().replace(/^"|"$/g, '').toLowerCase());
      const rows = lines.slice(1).map((line) => parseCsvLine(line, header)).filter((r) => r.name);
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
          {guests.length > 0 && (
            <button type="button" className="dash-btn dash-btn--outline guest-delete-btn" onClick={() => setCsvDeleteConfirm(true)}>
              Delete imported CSV
            </button>
          )}
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
            <strong> 3.</strong> Choose a group above, then mark Coming, Waiting, or Not coming. Or use the RSVP buttons on each guest.
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

      <div className="guest-toolbar">
        <div className="guest-search">
          <span aria-hidden="true">🔍</span>
          <input type="search" placeholder="Search by name, email, or phone..." value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <select className="guest-filter-select" value={groupFilter} onChange={(e) => handleGroupFilterChange(e.target.value)} aria-label="Filter by group">
          <option>All Groups</option>
          {guestGroups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={rsvpFilter} onChange={(e) => handleRsvpFilterChange(e.target.value)} aria-label="Filter by RSVP">
          <option>All Statuses</option>
          {rsvpStatuses.map((s) => <option key={s}>{RSVP_LABELS[s]?.label || s}</option>)}
        </select>
        {hasActiveFilters && <button type="button" className="guest-clear-filters" onClick={clearFilters}>Clear</button>}
      </div>

      <div className={`guest-selected-group${activeGroupMembers.length === 0 ? ' is-empty' : ''}`}>
        <div className="guest-selected-group__meta">
          <strong>{groupFilter}</strong>
          <span>
            {activeGroupMembers.length
              ? `${activeGroupMembers.length} ${activeGroupMembers.length === 1 ? 'guest' : 'guests'} — mark this group`
              : 'No guests yet'}
          </span>
        </div>
        <RsvpToggle
          value={activeGroupStatus}
          disabled={!activeGroupMembers.length}
          onChange={(rsvp) => applyGroupRsvp(groupFilter, rsvp)}
        />
        {groupRsvpNote && <p className="guest-selected-group__note" role="status">{groupRsvpNote}</p>}
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
        ) : (
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
            <ul className="guest-rows">
              {paginated.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  selected={selectedIds.has(guest.id)}
                  onToggle={toggleSelect}
                  onRsvp={setGuestRsvp}
                  onEdit={openEdit}
                  onDelete={setDeleteConfirm}
                />
              ))}
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
            <label className="dash-field">
              <span>Age</span>
              <input type="number" min="1" max="120" value={form.age || ''} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 8 or 72" />
            </label>
            <label className="dash-field"><span>Notes</span><textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <label className="dash-field">
              <span>Do not sit with (names, comma separated)</span>
              <input value={form.avoid || ''} onChange={(e) => setForm({ ...form, avoid: e.target.value })} placeholder="Full name, other name" />
            </label>
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

      {csvDeleteConfirm && (
        <div className="dash-overlay" onClick={() => setCsvDeleteConfirm(false)}>
          <div className="dash-panel guest-delete-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Delete imported CSV?</h2>
            <p>This will remove <strong>{csvDeleteCount}</strong> {csvDeleteCount === 1 ? 'guest' : 'guests'} from the list. You can import a CSV again after.</p>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setCsvDeleteConfirm(false)}>Cancel</button>
              <button type="button" className="dash-btn dash-btn--primary guest-delete-btn" onClick={clearImportedCsv}>Yes, delete imported list</button>
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
