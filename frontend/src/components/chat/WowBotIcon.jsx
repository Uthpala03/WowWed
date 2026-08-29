const WOWBOT_ICON = `${process.env.PUBLIC_URL || ''}/wowbot-icon.png`;

function WowBotIcon({ size = 40, className = '' }) {
  return (
    <img
      src={WOWBOT_ICON}
      alt=""
      aria-hidden="true"
      className={`wowbot-icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      draggable={false}
    />
  );
}

export default WowBotIcon;
