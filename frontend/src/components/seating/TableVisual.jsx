function TableVisual({
  table,
  assignments = {},
  getGuestName = () => '',
  selectedGuest = null,
  onSeatClick,
  compact = false,
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

        return (
          <button
            key={`${table.id}-seat-${i}`}
            type="button"
            className={`table-visual__seat${guestId ? ' is-filled' : ''}${isTarget ? ' is-target' : ''}`}
            style={{ left: pos.left, top: pos.top, width: seatSize, height: seatSize }}
            onClick={() => handleSeatClick(i, guestId)}
            title={guestId ? name : `Seat ${i + 1} — click to assign`}
            aria-label={guestId ? `${name}, seat ${i + 1}` : `Empty seat ${i + 1}`}
          >
            {guestId ? name.charAt(0).toUpperCase() : i + 1}
          </button>
        );
      })}
    </div>
  );
}

export default TableVisual;
