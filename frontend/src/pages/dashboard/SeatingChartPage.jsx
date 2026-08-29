import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TableVisual from '../../components/seating/TableVisual';
import { guestGroups, tableShapes, normalizeGuestGroup } from '../../data/dashboardData';
import { SeatingChart, Table, tableSuites } from '../../models/Seating';
import { getGuests, getSeating, saveSeating } from '../../utils/storage';
import { api } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import ListPagination from '../../components/ui/ListPagination';
import { COMPACT_PAGE_SIZES, TABLE_PAGE_SIZES, usePagination } from '../../hooks/usePagination';

const emptyTableForm = {
  name: '',
  seats: 6,
  shape: 'round',
  suite: 'general',
  priority: 5,
  guestGroup: '',
};

function getTableGuests(chart, tableId) {
  const table = chart.tables.find((t) => t.id === tableId);
  if (!table) return [];
  const rows = [];
  for (let i = 0; i < table.seats; i += 1) {
    const guestId = chart.assignments[`${tableId}-${i}`];
    if (!guestId) continue;
    const guest = chart.getGuest(guestId);
    if (guest) rows.push({ seat: i + 1, guest });
  }
  return rows.sort((a, b) => a.seat - b.seat);
}

function tableMatchesGroupFilter(chart, table, groupFilter) {
  if (groupFilter === 'All') return true;
  const want = normalizeGuestGroup(groupFilter);
  let hasSeated = false;
  for (let i = 0; i < table.seats; i += 1) {
    const guestId = chart.assignments[`${table.id}-${i}`];
    const guest = guestId ? chart.getGuest(guestId) : null;
    if (!guest) continue;
    hasSeated = true;
    if (normalizeGuestGroup(guest.group) === want) return true;
  }
  if (!hasSeated && table.guestGroups?.some((g) => normalizeGuestGroup(g) === want)) return true;
  return false;
}

function guestMatchesGroup(guest, groupFilter) {
  if (groupFilter === 'All') return true;
  return normalizeGuestGroup(guest?.group) === normalizeGuestGroup(groupFilter);
}

function tableSortNumber(table) {
  const match = (table.name || String(table.id || '')).match(/(\d+)/);
  return match ? Number(match[1]) : 9999;
}

function SeatingChartPage() {
  const coupleData = useOutletContext();
  const guests = coupleData?.guests || getGuests() || [];
  const [chart, setChart] = useState(() => new SeatingChart(coupleData?.seating || getSeating(), guests));

  useEffect(() => {
    setChart(new SeatingChart(coupleData?.seating || getSeating(), coupleData?.guests || getGuests() || []));
  }, [coupleData]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [toast, setToast] = useState('');
  const [reviewFlags, setReviewFlags] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const [sidebarTab, setSidebarTab] = useState('seated');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const persist = (nextChart, quality) => {
    setChart(nextChart);
    const prev = coupleData?.seating || getSeating() || {};
    saveSeating({
      ...nextChart.toJSON(),
      mlQuality: quality || prev.mlQuality || null,
    });
  };

  const stats = useMemo(() => chart.stats, [chart]);
  const suiteGroups = useMemo(() => chart.tablesBySuite, [chart]);
  const groupStats = useMemo(() => chart.getGroupStats(), [chart]);
  const seatGroups = guestGroups.filter((g) => g !== 'No Group');

  const filteredSuiteGroups = useMemo(() => {
    if (groupFilter === 'All') return suiteGroups;
    return suiteGroups
      .map(({ suite, tables }) => ({
        suite,
        tables: tables.filter((table) => tableMatchesGroupFilter(chart, table, groupFilter)),
      }))
      .filter(({ tables }) => tables.length > 0);
  }, [suiteGroups, chart, groupFilter]);

  const visibleTableCount = useMemo(
    () => filteredSuiteGroups.reduce((sum, { tables }) => sum + tables.length, 0),
    [filteredSuiteGroups],
  );

  const visibleTablesFlat = useMemo(() => {
    const rows = [];
    filteredSuiteGroups.forEach(({ suite, tables }) => {
      tables.forEach((table) => rows.push({ suite, table }));
    });
    return rows.sort((a, b) => tableSortNumber(a.table) - tableSortNumber(b.table));
  }, [filteredSuiteGroups]);

  const canvasRef = useRef(null);
  const prevTablesPage = useRef(1);

  const {
    page: tablesPage,
    setPage: setTablesPage,
    pageSize: tablesPageSize,
    setPageSize: setTablesPageSize,
    totalPages: tablesTotalPages,
    pageItems: pagedTablesFlat,
    pageStart: tablesPageStart,
    pageEnd: tablesPageEnd,
    resetPage: resetTablesPage,
  } = usePagination(visibleTablesFlat, { initialPageSize: 12, pageSizes: TABLE_PAGE_SIZES });

  const pagedSuiteGroups = useMemo(() => {
    const map = new Map();
    pagedTablesFlat.forEach(({ suite, table }) => {
      if (!map.has(suite.id)) map.set(suite.id, { suite, tables: [] });
      map.get(suite.id).tables.push(table);
    });
    return Array.from(map.values());
  }, [pagedTablesFlat]);

  const filteredUnassigned = useMemo(() => chart.waitingToSeat.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q);
    return matchSearch && guestMatchesGroup(g, groupFilter);
  }), [chart, search, groupFilter]);

  const filteredSeated = useMemo(() => chart.assignedGuests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q);
    return matchSearch && guestMatchesGroup(g, groupFilter);
  }), [chart, search, groupFilter]);

  const {
    page: unassignedPage,
    setPage: setUnassignedPage,
    pageSize: unassignedPageSize,
    setPageSize: setUnassignedPageSize,
    totalPages: unassignedTotalPages,
    pageItems: pagedUnassigned,
    pageStart: unassignedPageStart,
    pageEnd: unassignedPageEnd,
    resetPage: resetUnassignedPage,
  } = usePagination(filteredUnassigned, { initialPageSize: 25, pageSizes: COMPACT_PAGE_SIZES });

  const {
    page: seatedPage,
    setPage: setSeatedPage,
    pageSize: seatedPageSize,
    setPageSize: setSeatedPageSize,
    totalPages: seatedTotalPages,
    pageItems: pagedSeated,
    pageStart: seatedPageStart,
    pageEnd: seatedPageEnd,
    resetPage: resetSeatedPage,
  } = usePagination(filteredSeated, { initialPageSize: 25, pageSizes: COMPACT_PAGE_SIZES });

  useEffect(() => {
    resetUnassignedPage();
    resetSeatedPage();
    resetTablesPage();
  }, [search, groupFilter, resetUnassignedPage, resetSeatedPage, resetTablesPage]);

  useEffect(() => {
    if (prevTablesPage.current === tablesPage) return;
    prevTablesPage.current = tablesPage;
    canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tablesPage]);

  useEffect(() => {
    if (groupFilter === 'All' || !selectedTableId) return;
    const table = chart.tables.find((t) => t.id === selectedTableId);
    if (!table || !tableMatchesGroupFilter(chart, table, groupFilter)) {
      setSelectedTableId(null);
    }
  }, [groupFilter, chart, selectedTableId]);

  const previewTable = useMemo(
    () => new Table({
      id: 'preview',
      name: 'Preview',
      seats: tableForm.seats,
      shape: tableForm.shape,
      suite: tableForm.suite,
      priority: tableForm.priority,
      guestGroups: tableForm.guestGroup ? [tableForm.guestGroup] : [],
    }),
    [tableForm],
  );

  const openAddTable = () => {
    setEditingTableId(null);
    setTableForm({ ...emptyTableForm, name: String(chart.tables.length + 1) });
    setShowTableModal(true);
  };

  const openEditTable = (table) => {
    setEditingTableId(table.id);
    setTableForm({
      name: table.name.replace(/^Table\s/, ''),
      seats: table.seats,
      shape: table.shape,
      suite: table.suite,
      priority: table.priority,
      guestGroup: table.guestGroups?.[0] || '',
    });
    setShowTableModal(true);
  };

  const closeTableModal = () => {
    setShowTableModal(false);
    setEditingTableId(null);
    setTableForm(emptyTableForm);
  };

  const submitTable = (e) => {
    e.preventDefault();
    const next = new SeatingChart(chart.toJSON(), guests);
    const tableName = tableForm.name.startsWith('Table') ? tableForm.name : `Table ${tableForm.name}`;
    const data = {
      name: tableName,
      seats: tableForm.seats,
      shape: tableForm.shape,
      suite: tableForm.suite,
      priority: tableForm.priority,
      guestGroups: tableForm.guestGroup ? [tableForm.guestGroup] : [],
    };

    if (editingTableId) {
      next.updateTable(editingTableId, data);
    } else {
      next.addTable(new Table({ id: `table-${Date.now()}`, ...data }));
    }
    persist(next);
    closeTableModal();
  };

  const handleSeatClick = (tableId, seatIndex, currentGuestId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    if (currentGuestId) {
      next.unassignSeat(tableId, seatIndex);
      persist(next);
      return;
    }
    if (selectedGuest) {
      next.assignGuest(tableId, seatIndex, selectedGuest);
      persist(next);
      setSelectedGuest(null);
    }
  };

  const seatTableWithGroup = (tableId, group) => {
    if (!group) return;
    const next = new SeatingChart(chart.toJSON(), guests);
    const result = next.replaceTableWithGroup(tableId, group);
    persist(next);
    showToast(result.message);
  };

  const clearTable = (tableId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.clearTable(tableId);
    const table = next.tables.find((t) => t.id === tableId);
    if (table) table.guestGroups = [];
    persist(next);
  };

  const updateAllTables = (updates) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.tables.forEach((table) => next.updateTable(table.id, updates));
    persist(next);
  };

  const sharedShape = chart.tables.length && chart.tables.every((t) => t.shape === chart.tables[0].shape)
    ? chart.tables[0].shape
    : '';
  const sharedSeats = chart.tables.length && chart.tables.every((t) => t.seats === chart.tables[0].seats)
    ? chart.tables[0].seats
    : null;

  const comingCount = guests.filter((g) => {
    const v = (g.rsvp || '').trim().toLowerCase();
    return ['accepted', 'coming', 'yes', 'y'].includes(v);
  }).length;

  const tablesForComing = () => {
    const workTables = chart.tables.map((t) => t.toJSON());
    const defaultSeats = sharedSeats || workTables[0]?.seats || 10;
    let seatCount = workTables.reduce((sum, t) => sum + Number(t.seats || 0), 0);
    let nextNum = workTables.length + 1;
    while (seatCount < comingCount) {
      workTables.push({
        id: `table-auto-${nextNum}`,
        name: `Table ${nextNum}`,
        seats: defaultSeats,
        shape: 'round',
        suite: 'general',
        priority: 5,
        guestGroups: [],
      });
      seatCount += defaultSeats;
      nextNum += 1;
    }
    return workTables;
  };

  const runAutoSeat = async () => {
    showToast('Smart seating running...');
    const workTables = tablesForComing();
    try {
      const data = await api.optimizeSeating({
        guests: guests.map((g) => ({
          id: g.id,
          name: g.name,
          email: g.email || '',
          phone: g.phone || '',
          group: g.group || '',
          notes: g.notes || '',
          rsvp: g.rsvp || '',
          avoid: g.avoid || '',
          age: g.age || '',
        })),
        tables: workTables.map((t) => ({
          id: t.id,
          name: t.name,
          seats: t.seats,
          shape: t.shape,
          suite: t.suite,
          priority: t.priority,
        })),
      });

      const used = new Set();
      const matchGuest = (row) => {
        if (row.id) {
          const hit = guests.find((g) => String(g.id) === String(row.id) && !used.has(g.id));
          if (hit) return hit.id;
        }
        const email = (row.email || '').trim().toLowerCase();
        const phone = String(row.phone || '').replace(/\D/g, '');
        const name = (row.name || '').trim().toLowerCase();
        const found = guests.find((g) => {
          if (used.has(g.id)) return false;
          const gEmail = (g.email || '').trim().toLowerCase();
          const gPhone = String(g.phone || '').replace(/\D/g, '');
          if (email && gEmail && gEmail === email) return true;
          if (phone && gPhone && gPhone === phone) return true;
          return name && (g.name || '').trim().toLowerCase() === name;
        });
        return found?.id || null;
      };

      const next = new SeatingChart({ tables: workTables, assignments: {} }, guests);
      const occupiedSeats = new Set();

      const findFreeSeat = (table) => {
        for (let i = 0; i < table.seats; i += 1) {
          const key = `${table.id}-${i}`;
          if (!occupiedSeats.has(key)) return i;
        }
        return -1;
      };

      let seated = 0;
      (data.assignments || []).forEach((row) => {
        const id = matchGuest(row);
        if (!id) return;
        used.add(id);
        const table = next.tables.find((t) => t.id === row.table_id)
          || next.tables.find((t) => t.name === row.table);
        if (!table) return;
        let seatIndex = Number(row.seat) - 1;
        const key = `${table.id}-${seatIndex}`;
        if (seatIndex < 0 || seatIndex >= table.seats || occupiedSeats.has(key)) {
          seatIndex = findFreeSeat(table);
        }
        if (seatIndex < 0) return;
        occupiedSeats.add(`${table.id}-${seatIndex}`);
        next.assignGuest(table.id, seatIndex, id);
        seated += 1;
      });

      const removedEmpty = next.pruneEmptyTables();
      const quality = {
        silhouette: data.silhouette,
        k: data.k,
        capacityViolations: data.capacity_violations,
        violationRate: data.violation_rate,
        assigned: seated,
        coming: data.coming,
        seatingAccuracy: data.seating_accuracy,
        labelAccuracy: data.label_accuracy,
      };
      persist(next, quality);
      const leftover = Math.max(0, comingCount - seated);
      const flags = (data.flags || []).filter((flag) => flag.type !== 'unseated' || leftover > 0);
      if (leftover > 0 && !flags.some((flag) => flag.type === 'unseated')) {
        flags.unshift({
          type: 'unseated',
          message: `${leftover} Coming guest(s) have no chair. Add tables or chairs, then Auto-seat again.`,
        });
      }
      setReviewFlags(flags);
      const pruneNote = removedEmpty > 0 ? ` Removed ${removedEmpty} unused empty table${removedEmpty === 1 ? '' : 's'}.` : '';
      showToast(
        leftover > 0
          ? `${seated} of ${comingCount} Coming guests seated. ${leftover} still need a chair.${pruneNote}`
          : `${seated} Coming guests seated.${pruneNote}`,
      );
    } catch (err) {
      const next = new SeatingChart({ tables: workTables, assignments: {} }, guests);
      const { filled, conflicts } = next.autoSeatAll();
      const removedEmpty = next.pruneEmptyTables();
      persist(next);
      const pruneNote = removedEmpty > 0 ? ` Removed ${removedEmpty} unused empty table${removedEmpty === 1 ? '' : 's'}.` : '';
      showToast((conflicts[0] || `${filled} guests seated.`) + pruneNote);
    }
  };

  const seatProgress = stats.totalSeats
    ? Math.round((stats.assigned / stats.totalSeats) * 100)
    : 0;

  const jumpToTable = () => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return;
    const idx = visibleTablesFlat.findIndex(({ table }) => (
      (table.name || '').toLowerCase().includes(q)
      || String(table.id || '').toLowerCase().includes(q)
    ));
    if (idx < 0) {
      showToast(`No table matching "${tableSearch.trim()}"`);
      return;
    }
    setTablesPage(Math.floor(idx / tablesPageSize) + 1);
    setSelectedTableId(visibleTablesFlat[idx].table.id);
    showToast(`Showing ${visibleTablesFlat[idx].table.name}`);
  };

  const renderTableCard = (table) => {
    const fill = chart.getTableFill(table.id);
    const currentGroup = table.guestGroups?.[0] || '';
    const selected = selectedTableId === table.id;
    const tableGuests = selected ? getTableGuests(chart, table.id) : [];
    const fillPct = fill.total ? Math.round((fill.filled / fill.total) * 100) : 0;
    const fillState = fillPct >= 100 ? 'full' : fillPct > 0 ? 'partial' : 'empty';

    return (
      <div
        key={table.id}
        className={`seating-table-card seating-table-card--simple seating-table-card--${fillState}${selected ? ' is-selected' : ''}`}
        onClick={() => setSelectedTableId(selected ? null : table.id)}
      >
        <div className="seating-table-card__head">
          <div>
            <div className="seating-table-card__title-row">
              <strong>{table.name}</strong>
              <span className={`seating-table-card__badge seating-table-card__badge--${fillState}`}>
                {fill.filled}/{fill.total}
              </span>
            </div>
            <small className="seating-table-card__sub">
              {selected
                ? `${tableShapes.find((s) => s.id === table.shape)?.label || 'Round'} · ${table.seats} chairs`
                : 'Tap to view guests'}
            </small>
            {selected && (
              <div className="seating-table-card__fillbar" aria-hidden="true">
                <span style={{ width: `${fillPct}%` }} />
              </div>
            )}
          </div>
          <div className="seating-table-card__actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="guest-action-btn" onClick={() => openEditTable(table)} title="Edit">✏️</button>
            <button type="button" className="seating-table-card__remove" onClick={() => removeTable(table.id)} title="Delete">🗑️</button>
          </div>
        </div>

        <TableVisual
          table={table}
          assignments={chart.assignments}
          getGuestName={(id) => chart.getGuestName(id)}
          getGuestGroup={(id) => chart.getGuest(id)?.group || ''}
          selectedGuest={selectedGuest}
          expanded={selected || groupFilter !== 'All'}
          highlightGroup={groupFilter !== 'All' ? groupFilter : null}
          onSeatClick={handleSeatClick}
        />

        {selected && (
          <>
            <ul className="seating-table-card__roster">
              {tableGuests.length === 0 ? (
                <li className="seating-table-card__roster-empty">
                  <small>No guests yet — use Auto-seat or pick a guest from the sidebar.</small>
                </li>
              ) : tableGuests.map(({ seat, guest }) => (
                <li key={guest.id}>
                  <span className="seating-table-card__roster-seat">{seat}</span>
                  <div>
                    <strong>{guest.name}</strong>
                    <small>{guest.group || 'No Group'}</small>
                  </div>
                </li>
              ))}
            </ul>

            <div className="seating-simple-select" onClick={(e) => e.stopPropagation()}>
              <PrettySelect
                label="Seat with group"
                icon="guests"
                value={currentGroup}
                placeholder="Choose…"
                options={[
                  { value: '', label: 'Choose…', icon: 'guests' },
                  ...seatGroups.map((g) => ({
                    value: g,
                    label: `${g} (${groupStats[g]?.waiting || 0} waiting)`,
                    icon: 'guests',
                  })),
                ]}
                onChange={(value) => seatTableWithGroup(table.id, value)}
              />
            </div>

            {fill.filled > 0 && (
              <button type="button" className="seating-clear-link" onClick={(e) => { e.stopPropagation(); clearTable(table.id); }}>
                Clear this table
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const removeTable = (tableId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.removeTable(tableId);
    persist(next);
    if (selectedTableId === tableId) setSelectedTableId(null);
  };

  return (
    <div className="dash-page dash-page--seating">
      <PageHeader moduleId="seating">
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={runAutoSeat}>Auto-seat all</button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>+ Add table</button>
        </div>
      </PageHeader>

      {toast && <div className="guest-import-toast">{toast}</div>}

      {reviewFlags.length > 0 && (
        <section className="seating-review">
          <div className="seating-review__head">
            <strong>Review after Auto-seat</strong>
            <button type="button" className="seating-review__close" onClick={() => setReviewFlags([])}>Dismiss</button>
          </div>
          <p>These are not errors. Move people by tapping a guest, then an empty chair.</p>
          <ul>
            {reviewFlags.map((flag, i) => (
              <li key={`${flag.type}-${i}`}>{flag.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="seating-summary-bar">
        <div className="seating-summary-bar__stats">
          <span><strong>{stats.tables}</strong> tables</span>
          <span><strong>{stats.assigned}</strong> / {stats.totalSeats} seated</span>
          {stats.unassigned > 0 ? (
            <span className="seating-summary-bar__warn"><strong>{stats.unassigned}</strong> need a chair</span>
          ) : (
            <span className="seating-summary-bar__ok">All guests seated</span>
          )}
        </div>
        <div className="seating-summary-bar__progress" aria-label={`${seatProgress}% venue capacity`}>
          <span style={{ width: `${seatProgress}%` }} />
        </div>
      </section>

      {chart.tables.length > 0 && (
        <details className="seating-settings">
          <summary>Table settings (shape &amp; chairs for all tables)</summary>
          <div className="seating-settings__body">
            <div className="seating-controls__shapes">
              {tableShapes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`table-shape-option${sharedShape === s.id ? ' is-on' : ''}`}
                  onClick={() => updateAllTables({ shape: s.id })}
                >
                  <em>{s.icon}</em>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="seating-controls__chairs">
              <span>Chairs per table</span>
              <div className="seat-counter">
                <button
                  type="button"
                  aria-label="Fewer chairs on all tables"
                  onClick={() => updateAllTables({ seats: Math.max(1, (sharedSeats || 10) - 1) })}
                >
                  −
                </button>
                <strong>{sharedSeats != null ? sharedSeats : '—'}</strong>
                <button
                  type="button"
                  aria-label="More chairs on all tables"
                  onClick={() => updateAllTables({ seats: Math.min(20, (sharedSeats || 10) + 1) })}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </details>
      )}

      <div className="seating-layout">
        <div className="seating-canvas-wrap dash-card" ref={canvasRef}>
          {visibleTableCount > 0 && (
            <div className="seating-page-nav">
              <div className="seating-page-nav__pages">
                <button type="button" disabled={tablesPage <= 1} onClick={() => setTablesPage(tablesPage - 1)} aria-label="Previous page">←</button>
                <span>Page <strong>{tablesPage}</strong> of {tablesTotalPages}</span>
                <button type="button" disabled={tablesPage >= tablesTotalPages} onClick={() => setTablesPage(tablesPage + 1)} aria-label="Next page">→</button>
              </div>
              <span className="seating-page-nav__count">Tables {tablesPageStart}–{tablesPageEnd} of {visibleTableCount}</span>
              <form className="seating-table-search" onSubmit={(e) => { e.preventDefault(); jumpToTable(); }}>
                <input
                  type="search"
                  placeholder="Find table…"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  aria-label="Find table"
                />
                <button type="submit" className="dash-btn dash-btn--outline">Go</button>
              </form>
              <label className="seating-page-nav__size">
                <span>Show</span>
                <select value={tablesPageSize} onChange={(e) => setTablesPageSize(Number(e.target.value))}>
                  {TABLE_PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="seating-canvas">
            {chart.tables.length === 0 ? (
              <div className="seating-empty">
                <span>🪑</span>
                <h3>No tables yet</h3>
                <p>Add tables, then choose Bride's Family, Relatives, or another group for each</p>
                <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>+ Add table</button>
              </div>
            ) : visibleTableCount === 0 ? (
              <div className="seating-empty">
                <span>🔍</span>
                <h3>No tables for {groupFilter}</h3>
                <p>No one from this group is seated yet. Use Auto-seat all or pick a group under Seat with group.</p>
                <button type="button" className="dash-btn dash-btn--outline" onClick={() => setGroupFilter('All')}>Show all tables</button>
              </div>
            ) : (
              <>
                {groupFilter !== 'All' && (
                  <div className="seating-filter-banner">
                    <strong>{groupFilter}</strong>
                    <span>{filteredSeated.length} seated · {filteredUnassigned.length} waiting</span>
                    <button type="button" className="seating-filter-banner__clear" onClick={() => setGroupFilter('All')}>
                      Show all
                    </button>
                  </div>
                )}
                {pagedSuiteGroups.map(({ suite, tables }) => (
                <section key={suite.id} className={`seating-suite-zone seating-suite-zone--${suite.id}`}>
                  <header className="seating-suite-zone__head">
                    {suite.icon} {suite.label}
                  </header>
                  <div className="seating-suite-zone__tables">
                    {tables.map((table) => renderTableCard(table))}
                  </div>
                </section>
              ))}
              </>
            )}
          </div>
        </div>

        <aside className="seating-sidebar dash-card">
          <div className="seating-sidebar__head">
            <h3>Guests</h3>
            {selectedGuest && (
              <div className="seating-sidebar__pick">
                <span>Placing:</span>
                <strong>{chart.getGuestName(selectedGuest)}</strong>
                <button type="button" onClick={() => setSelectedGuest(null)} aria-label="Cancel">✕</button>
              </div>
            )}
          </div>

          <input
            className="seating-sidebar__search"
            placeholder="Search guests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <PrettySelect
            label="Guest group"
            icon="guests"
            value={groupFilter}
            options={[
              { value: 'All', label: 'All groups', icon: 'guests' },
              ...seatGroups.map((g) => {
                const stat = groupStats[g] || { seated: 0, waiting: 0, total: 0 };
                const countLabel = stat.total === 0
                  ? '0 guests'
                  : `${stat.seated} seated${stat.waiting ? ` · ${stat.waiting} waiting` : ''}`;
                return { value: g, label: `${g} (${countLabel})`, icon: 'guests' };
              }),
            ]}
            onChange={(value) => { setGroupFilter(value); }}
          />

          <div className="seating-sidebar__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'waiting'}
              className={sidebarTab === 'waiting' ? 'is-active' : ''}
              onClick={() => setSidebarTab('waiting')}
            >
              Need a chair
              <span className={filteredUnassigned.length ? 'has-count' : ''}>{filteredUnassigned.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'seated'}
              className={sidebarTab === 'seated' ? 'is-active' : ''}
              onClick={() => setSidebarTab('seated')}
            >
              Seated
              <span>{filteredSeated.length}</span>
            </button>
          </div>

          <p className="seating-sidebar__tip">
            {selectedGuest
              ? `Tap an empty chair to seat ${chart.getGuestName(selectedGuest)}.`
              : 'Tap a table to see guests · Tap a name in the list, then tap a chair.'}
          </p>

          {sidebarTab === 'waiting' && (
            <div className="seating-sidebar__panel">
              <ul className="seating-guest-list">
                {filteredUnassigned.length === 0 ? (
                  <li className="seating-guest-list__empty"><small>All seated 🎉</small></li>
                ) : pagedUnassigned.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className={selectedGuest === g.id ? 'is-selected' : ''}
                      onClick={() => setSelectedGuest(selectedGuest === g.id ? null : g.id)}
                    >
                      <strong>{g.name}</strong>
                      <small>{g.group}</small>
                    </button>
                  </li>
                ))}
              </ul>
              {filteredUnassigned.length > 0 && (
                <ListPagination
                  variant="compact"
                  page={unassignedPage}
                  totalPages={unassignedTotalPages}
                  pageStart={unassignedPageStart}
                  pageEnd={unassignedPageEnd}
                  totalItems={filteredUnassigned.length}
                  pageSize={unassignedPageSize}
                  pageSizes={COMPACT_PAGE_SIZES}
                  onPageChange={setUnassignedPage}
                  onPageSizeChange={setUnassignedPageSize}
                  icon="guests"
                />
              )}
            </div>
          )}

          {sidebarTab === 'seated' && (
            <div className="seating-sidebar__panel">
              <ul className="seating-guest-list seating-guest-list--tall">
                {filteredSeated.length === 0 ? (
                  <li className="seating-guest-list__empty"><small>None yet</small></li>
                ) : pagedSeated.map((g) => {
                  const table = chart.getTableForGuest(g.id);
                  return (
                    <li key={g.id} className="seating-guest-list__assigned">
                      <div>
                        <strong>{g.name}</strong>
                        <small>{table?.name || 'Unassigned'}</small>
                      </div>
                      <button type="button" onClick={() => {
                        const next = new SeatingChart(chart.toJSON(), guests);
                        next.unassignGuest(g.id);
                        persist(next);
                      }} aria-label={`Remove ${g.name} from seat`}>✕</button>
                    </li>
                  );
                })}
              </ul>
              {filteredSeated.length > 0 && (
                <ListPagination
                  variant="compact"
                  page={seatedPage}
                  totalPages={seatedTotalPages}
                  pageStart={seatedPageStart}
                  pageEnd={seatedPageEnd}
                  totalItems={filteredSeated.length}
                  pageSize={seatedPageSize}
                  pageSizes={COMPACT_PAGE_SIZES}
                  onPageChange={setSeatedPage}
                  onPageSizeChange={setSeatedPageSize}
                  icon="guests"
                />
              )}
            </div>
          )}
        </aside>
      </div>

      {showTableModal && (
        <div className="dash-overlay" onClick={closeTableModal}>
          <form className="dash-panel dash-panel--center seating-table-modal" onSubmit={submitTable} onClick={(e) => e.stopPropagation()}>
            <h2>{editingTableId ? 'Edit table' : 'Add table'}</h2>

            <div className="seating-modal-preview">
              <TableVisual table={previewTable} compact />
            </div>

            <label className="dash-field">
              <span>Table number</span>
              <input value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} placeholder="1" />
            </label>

            <div className="dash-field">
              <PrettySelect
                label="Area (suite)"
                icon="venue"
                value={tableForm.suite}
                options={tableSuites.map((s) => ({ value: s.id, label: s.label, icon: 'venue' }))}
                onChange={(suite) => setTableForm({ ...tableForm, suite })}
              />
            </div>

            <div className="dash-field">
              <PrettySelect
                label="Priority"
                icon="sparkle"
                value={tableForm.priority}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
                  value: n,
                  label: `${n}${n === 1 ? ' — highest' : n === 10 ? ' — lowest' : ''}`,
                  icon: 'sparkle',
                }))}
                onChange={(priority) => setTableForm({ ...tableForm, priority: Number(priority) })}
              />
            </div>

            <label className="dash-field">
              <span>Chairs</span>
              <div className="seat-counter">
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.max(1, tableForm.seats - 1) })}>−</button>
                <strong>{tableForm.seats}</strong>
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.min(20, tableForm.seats + 1) })}>+</button>
              </div>
            </label>

            <div className="dash-field">
              <PrettySelect
                label="Default group (optional)"
                icon="guests"
                value={tableForm.guestGroup}
                options={[
                  { value: '', label: 'None', icon: 'guests' },
                  ...seatGroups.map((g) => ({ value: g, label: g, icon: 'guests' })),
                ]}
                onChange={(guestGroup) => setTableForm({ ...tableForm, guestGroup })}
              />
            </div>

            <span className="dash-field"><span>Shape</span></span>
            <div className="table-shape-grid">
              {tableShapes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`table-shape-option${tableForm.shape === s.id ? ' is-on' : ''}`}
                  onClick={() => setTableForm({ ...tableForm, shape: s.id })}
                >
                  <em>{s.icon}</em>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--outline" onClick={closeTableModal}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">{editingTableId ? 'Save' : 'Add table'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SeatingChartPage;
