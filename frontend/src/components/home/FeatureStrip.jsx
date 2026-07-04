function FeatureStrip({ onNavigate }) {
  const items = [
    { icon: '📋', label: 'Wedding Checklist' },
    { icon: '🎟️', label: 'Guest-list' },
    { icon: '🪑', label: 'Seating Chart' },
    { icon: '💌', label: 'Invitations' },
    { icon: '💰', label: 'Budget Management' },
    { icon: '🏪', label: 'Find Vendors' },
  ];

  return (
    <div className="feature-strip">
      <div className="container feature-strip__inner">
        {items.map((item, i) => (
          <button key={item.label} type="button" className="feature-strip__item" onClick={() => onNavigate('features')}>
            <span className="feature-strip__icon">{item.icon}</span>
            <span>{item.label}</span>
            {i < items.length - 1 && <span className="feature-strip__divider" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FeatureStrip;
