function WowWedLogo({ className = '', height = 44 }) {
  return (
    <img
      src={`${process.env.PUBLIC_URL}/logo.png`}
      alt="WowWed"
      className={`wowwed-logo ${className}`.trim()}
      style={{ height }}
      draggable="false"
    />
  );
}

export default WowWedLogo;
