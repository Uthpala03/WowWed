function InvitationCoupleArt({ culture, accent = '#b8860b' }) {
  const skin = '#f0c9a8';
  const skinShadow = '#d4a574';

  const defs = (
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8c547" />
        <stop offset="50%" stopColor={accent} />
        <stop offset="100%" stopColor="#a67c00" />
      </linearGradient>
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f5d5b8" />
        <stop offset="100%" stopColor={skinShadow} />
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
      </filter>
    </defs>
  );

  if (culture === 'sinhala') {
    return (
      <svg className="invite-couple" viewBox="0 0 160 220" aria-hidden="true" filter="url(#softShadow)">
        {defs}
        <ellipse cx="80" cy="210" rx="55" ry="8" fill="#000" opacity="0.1" />
        {/* Groom — Kandyan Nilame */}
        <g transform="translate(8, 0)">
          <path d="M48 195 L48 130 L42 130 L42 195 Z" fill="#fff" />
          <path d="M42 130 L54 130 L54 118 L42 118 Z" fill="#f5f0e8" />
          <rect x="38" y="95" width="20" height="38" rx="3" fill="#1a2744" />
          <path d="M40 95 L48 108 L56 95" fill="#1a2744" />
          <rect x="40" y="100" width="16" height="14" rx="1" fill="url(#goldGrad)" opacity="0.85" />
          <path d="M38 118 L58 118 L58 130 L38 130 Z" fill="#fff" stroke="#e8e0d0" />
          <circle cx="48" cy="78" r="16" fill="url(#skinGrad)" />
          <path d="M32 72 Q48 58 64 72 L60 68 Q48 55 36 68 Z" fill="#1a2744" />
          <path d="M38 64 L48 52 L58 64 L54 68 L42 68 Z" fill="#1a2744" />
          <rect x="42" y="58" width="12" height="8" rx="2" fill="url(#goldGrad)" />
          <circle cx="44" cy="76" r="1.5" fill="#333" />
          <circle cx="52" cy="76" r="1.5" fill="#333" />
          <path d="M46 82 Q48 85 50 82" fill="none" stroke="#c48860" strokeWidth="1" />
          <circle cx="48" cy="88" r="2" fill="url(#goldGrad)" />
        </g>
        {/* Bride — Osariya */}
        <g transform="translate(12, 0)">
          <path d="M88 195 Q108 200 128 195 L132 125 Q108 135 84 125 Z" fill="#fff" stroke="#ebe4d8" strokeWidth="1" />
          <path d="M84 125 Q108 118 132 125" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
          <path d="M96 135 L108 175 L120 135" fill="url(#goldGrad)" opacity="0.35" />
          <path d="M88 140 Q108 145 128 140" fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.5" />
          <circle cx="108" cy="72" r="16" fill="url(#skinGrad)" />
          <path d="M92 66 Q108 58 124 66" fill="none" stroke="#333" strokeWidth="2" />
          <circle cx="108" cy="62" r="6" fill="url(#goldGrad)" opacity="0.7" />
          <path d="M100 58 L108 48 L116 58" fill="url(#goldGrad)" opacity="0.5" />
          <circle cx="104" cy="70" r="1.5" fill="#333" />
          <circle cx="112" cy="70" r="1.5" fill="#333" />
          <path d="M106 76 Q108 79 110 76" fill="none" stroke="#c48860" strokeWidth="1" />
          <ellipse cx="108" cy="118" rx="8" ry="4" fill="url(#goldGrad)" opacity="0.4" />
        </g>
        {/* Hands joined */}
        <ellipse cx="78" cy="148" rx="10" ry="6" fill="url(#skinGrad)" />
        <ellipse cx="88" cy="148" rx="10" ry="6" fill="url(#skinGrad)" />
      </svg>
    );
  }

  if (culture === 'church') {
    return (
      <svg className="invite-couple" viewBox="0 0 160 220" aria-hidden="true" filter="url(#softShadow)">
        {defs}
        <ellipse cx="80" cy="210" rx="55" ry="8" fill="#000" opacity="0.1" />
        <g transform="translate(10, 0)">
          <path d="M42 195 L42 128 L38 128 L38 195 Z" fill="#1a1a2e" />
          <path d="M38 128 L46 128 L46 118 L38 118 Z" fill="#fff" />
          <rect x="36" y="96" width="18" height="36" rx="2" fill="#1a1a2e" />
          <path d="M38 96 L45 112 L52 96" fill="#fff" />
          <rect x="40" y="112" width="10" height="3" fill="#c0392b" />
          <circle cx="45" cy="76" r="15" fill="url(#skinGrad)" />
          <path d="M30 70 Q45 58 60 70" fill="#2c2c2c" />
          <circle cx="41" cy="74" r="1.5" fill="#333" />
          <circle cx="49" cy="74" r="1.5" fill="#333" />
        </g>
        <g transform="translate(8, 0)">
          <path d="M88 195 Q108 205 128 195 L132 122 Q108 132 84 122 Z" fill="#fff" stroke="#eee" />
          <path d="M96 122 L108 155 L120 122" fill="none" stroke="#fff" strokeWidth="4" opacity="0.6" />
          <circle cx="108" cy="68" r="15" fill="url(#skinGrad)" />
          <ellipse cx="108" cy="58" rx="18" ry="10" fill="#fff" stroke="#eee" />
          <path d="M96 62 Q108 52 120 62" fill="none" stroke="#8b6914" strokeWidth="1.5" />
          <circle cx="104" cy="66" r="1.5" fill="#333" />
          <circle cx="112" cy="66" r="1.5" fill="#333" />
        </g>
        <ellipse cx="76" cy="145" rx="8" ry="5" fill="url(#skinGrad)" />
        <ellipse cx="86" cy="145" rx="8" ry="5" fill="url(#skinGrad)" />
      </svg>
    );
  }

  if (culture === 'tamil') {
    return (
      <svg className="invite-couple" viewBox="0 0 160 220" aria-hidden="true" filter="url(#softShadow)">
        {defs}
        <ellipse cx="80" cy="210" rx="55" ry="8" fill="#000" opacity="0.1" />
        <g transform="translate(10, 0)">
          <rect x="36" y="94" width="18" height="40" rx="2" fill="#fff" stroke="url(#goldGrad)" strokeWidth="1.5" />
          <rect x="36" y="94" width="18" height="14" fill="#c0392b" />
          <path d="M38 118 L52 118 L52 134 L38 134 Z" fill="#fff" />
          <circle cx="45" cy="76" r="15" fill="url(#skinGrad)" />
          <circle cx="45" cy="70" r="3" fill="#c0392b" />
          <path d="M30 68 Q45 58 60 68" fill="#2c2c2c" />
        </g>
        <g transform="translate(8, 0)">
          <path d="M88 195 Q108 205 128 195 L132 122 Q108 132 84 122 Z" fill="#c0392b" />
          <path d="M84 122 Q108 115 132 122" fill="none" stroke="url(#goldGrad)" strokeWidth="3" />
          <path d="M96 132 L108 172 L120 132" fill="url(#goldGrad)" opacity="0.45" />
          <circle cx="108" cy="68" r="15" fill="url(#skinGrad)" />
          <path d="M100 58 L108 48 L116 58" fill="#c0392b" />
          <circle cx="108" cy="62" r="5" fill="url(#goldGrad)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={108 + Math.cos(a * Math.PI / 180) * 14} cy={62 + Math.sin(a * Math.PI / 180) * 14} r="2" fill="#fff" opacity="0.7" />
          ))}
        </g>
        <ellipse cx="76" cy="145" rx="8" ry="5" fill="url(#skinGrad)" />
        <ellipse cx="86" cy="145" rx="8" ry="5" fill="url(#skinGrad)" />
      </svg>
    );
  }

  if (culture === 'muslim') {
    return (
      <svg className="invite-couple" viewBox="0 0 160 220" aria-hidden="true" filter="url(#softShadow)">
        {defs}
        <ellipse cx="80" cy="210" rx="55" ry="8" fill="#000" opacity="0.1" />
        <g transform="translate(10, 0)">
          <rect x="36" y="96" width="18" height="38" rx="3" fill="#faf6f0" stroke={accent} strokeWidth="1" />
          <rect x="39" y="102" width="12" height="18" rx="2" fill={accent} opacity="0.2" />
          <circle cx="45" cy="76" r="15" fill="url(#skinGrad)" />
          <ellipse cx="45" cy="68" rx="17" ry="7" fill="#333" opacity="0.75" />
        </g>
        <g transform="translate(8, 0)">
          <path d="M88 195 Q108 205 128 195 L130 125 Q108 135 86 125 Z" fill="#faf6f0" stroke={accent} strokeWidth="1" />
          <ellipse cx="108" cy="66" rx="20" ry="10" fill="#333" opacity="0.78" />
          <circle cx="108" cy="72" r="14" fill="url(#skinGrad)" />
          <path d="M100 72 Q108 78 116 72" fill="none" stroke={accent} opacity="0.4" />
        </g>
        <ellipse cx="76" cy="145" rx="8" ry="5" fill="url(#skinGrad)" />
        <ellipse cx="86" cy="145" rx="8" ry="5" fill="url(#skinGrad)" />
      </svg>
    );
  }

  return null;
}

export default InvitationCoupleArt;
