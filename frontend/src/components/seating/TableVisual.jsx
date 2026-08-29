import { normalizeGuestGroup } from '../../data/dashboardData';

function TableVisual({
  table,
  assignments = {},
  getGuestName = () => '',
  getGuestGroup = () => '',
  selectedGuest = null,
  onSeatClick,
  compact = false,
  expanded = false,
  highlightGroup = null,
}) {
  const layout = table.getLayout();
  const seatSize = 24;

  const handleSeatClick = (seatIndex, guestId) => {
    if (!onSeatClick) return;
    onSeatClick(table.id, seatIndex, guestId);
  };

  return (
    <div
      className={`table-visual${compact ? ' table-visual--compact' : ''}`}
      style={{ width: layout.width, height: layout.height }}
    >
      <div
        className={`table-visual__surface table-visual__surface--${layout.shape}`}
        style={
          layout.shape === 'round'
            ? {
                width: layout.tableRadius * 2,
                height: layout.tableRadius * 2,
                left: (layout.width - layout.tableRadius * 2) / 2,
                top: (layout.height - layout.tableRadius * 2) / 2,
              }
            : {
                width: layout.tableWidth,
                height: layout.tableHeight,
                left: (layout.width - layout.tableWidth) / 2,
                top: (layout.height - layout.tableHeight) / 2,
              }
        }
      />

      {layout.positions.map((pos, i) => {
        const guestId = assignments[`${table.id}-${i}`];
        const isTarget = selectedGuest && !guestId;
        const name = guestId ? getGuestName(guestId) : '';
        const group = guestId ? getGuestGroup(guestId) : '';
        const highlight = highlightGroup ? normalizeGuestGroup(highlightGroup) : null;
        const inHighlight = !highlight || !guestId || normalizeGuestGroup(group) === highlight;
        const seatLabel = guestId
          ? (expanded ? name.split(' ')[0] : name.charAt(0).toUpperCase())
          : i + 1;

        return (
          <button
            key={`${table.id}-seat-${i}`}
            type="button"
            className={`table-visual__seat${guestId ? ' is-filled' : ''}${isTarget ? ' is-target' : ''}${expanded && guestId ? ' is-expanded' : ''}${guestId && !inHighlight ? ' is-dimmed' : ''}${guestId && inHighlight && highlight ? ' is-highlighted' : ''}`}
            style={{ left: pos.left, top: pos.top, width: seatSize, height: seatSize }}
            onClick={() => handleSeatClick(i, guestId)}
            title={guestId ? `${name}${group ? ` · ${group}` : ''} — seat ${i + 1}` : `Seat ${i + 1} — click to assign`}
            aria-label={guestId ? `${name}, ${group || 'No Group'}, seat ${i + 1}` : `Empty seat ${i + 1}`}
          >
            {seatLabel}
          </button>
        );
      })}
    </div>
  );
}

export default TableVisual;
