function FloralBorder({ color, variant = 'blossom' }) {
  const petals = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30) * (Math.PI / 180);
    const x = 100 + Math.cos(angle) * 88;
    const y = 100 + Math.sin(angle) * 88;
    return { x, y, key: i };
  });

  if (variant === 'blossom') {
    return (
      <>
        {petals.map(({ x, y, key }) => (
          <g key={key} transform={`translate(${x},${y})`}>
            <circle r="8" fill={color} opacity="0.35" />
            <circle r="4" fill={color} opacity="0.55" />
          </g>
        ))}
        <rect x="8" y="8" width="184" height="184" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" rx="2" />
      </>
    );
  }

  return null;
}

function EucalyptusTop({ color }) {
  return (
    <>
      <path d="M0 0 Q30 40 60 25 T120 30 T180 20 T200 35 L200 0Z" fill={color} opacity="0.12" />
      <path d="M10 15 Q40 35 70 22 T130 28 T190 18" fill="none" stroke={color} strokeWidth="1.2" opacity="0.35" />
      {[20, 50, 80, 110, 140, 170].map((x) => (
        <ellipse key={x} cx={x} cy={18 + (x % 3) * 8} rx="6" ry="10" fill={color} opacity="0.2" transform={`rotate(${x % 2 ? 20 : -15} ${x} 20)`} />
      ))}
      <path d="M0 200 Q50 175 100 185 T200 170 L200 200Z" fill={color} opacity="0.1" />
      <path d="M0 190 Q60 168 120 180 T200 165" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
    </>
  );
}

function MandalaDecor({ color }) {
  return (
    <>
      <path d="M100 0 Q130 30 100 60 Q70 30 100 0" fill={color} opacity="0.15" />
      <path d="M100 0 Q115 20 100 40 Q85 20 100 0" fill={color} opacity="0.25" />
      <circle cx="100" cy="30" r="20" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      {[[20, 180], [180, 180]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`} transform={`translate(${cx},${cy})`}>
          <circle r="18" fill="none" stroke={color} strokeWidth="1" opacity="0.35" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1="0" y1="-18" x2="0" y2="-28" stroke={color} strokeWidth="1" opacity="0.3" transform={`rotate(${a})`} />
          ))}
        </g>
      ))}
    </>
  );
}

function IslamicPattern({ color }) {
  return (
    <>
      <path d="M100 20 L110 40 L100 35 L90 40Z" fill={color} opacity="0.3" />
      <path d="M30 30 Q100 10 170 30" fill="none" stroke={color} strokeWidth="1" opacity="0.25" />
      <path d="M0 170 Q50 150 100 165 T200 155 L200 200 L0 200Z" fill={color} opacity="0.08" />
      {[30, 60, 90, 120, 150, 170].map((x) => (
        <path key={x} d={`M${x} 175 Q${x + 8} 160 ${x + 16} 175`} fill="none" stroke={color} strokeWidth="1" opacity="0.25" />
      ))}
    </>
  );
}

function DriedFloralBottom({ color }) {
  return (
    <>
      <path d="M0 155 Q40 140 80 150 T160 145 T200 150 L200 200 L0 200Z" fill={color} opacity="0.1" />
      {[25, 55, 85, 115, 145, 175].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="200" x2={x + (i % 2 ? 5 : -5)} y2={165 - i * 3} stroke={color} strokeWidth="1.2" opacity="0.4" />
          <ellipse cx={x + (i % 2 ? 5 : -5)} cy={160 - i * 3} rx="4" ry="6" fill={color} opacity="0.25" />
        </g>
      ))}
    </>
  );
}

function GoldCornerFlourish({ color }) {
  return (
    <>
      <path d="M8 8 Q30 8 30 30 Q8 30 8 8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M192 8 Q170 8 170 30 Q192 30 192 8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M8 192 Q30 192 30 170 Q8 170 8 192" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M192 192 Q170 192 170 170 Q192 170 192 192" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <rect x="14" y="14" width="172" height="172" fill="none" stroke={color} strokeWidth="0.8" opacity="0.25" />
    </>
  );
}

function InvitationThemeArt({ templateId, accent, border }) {
  const color = accent || 'currentColor';

  if (border === 'blossom' || templateId === 'church-floral') {
    return (
      <svg className="invite-art invite-art--floral-frame" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">
        <FloralBorder color={color} variant="blossom" />
      </svg>
    );
  }

  if (border === 'eucalyptus' || templateId === 'sinhala-watercolor') {
    return (
      <svg className="invite-art invite-art--eucalyptus" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">
        <EucalyptusTop color={color} />
      </svg>
    );
  }

  if (border === 'mandala' || templateId === 'sinhala-gold-mandala' || templateId === 'tamil-temple-gold') {
    return (
      <svg className="invite-art invite-art--mandala" viewBox="0 0 200 200" aria-hidden="true">
        <MandalaDecor color={color} />
      </svg>
    );
  }

  if (border === 'dried-floral' || templateId === 'muslim-nikkah') {
    return (
      <svg className="invite-art invite-art--dried" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">
        <DriedFloralBottom color={color} />
      </svg>
    );
  }

  if (border === 'islamic' || templateId === 'muslim-classic') {
    return (
      <svg className="invite-art invite-art--islamic" viewBox="0 0 200 200" aria-hidden="true">
        <IslamicPattern color={color} />
      </svg>
    );
  }

  if (border === 'jasmine' || templateId === 'tamil-jasmine') {
    return (
      <svg className="invite-art invite-art--jasmine" viewBox="0 0 200 200" aria-hidden="true">
        {[0, 72, 144, 216, 288].map((rot) => (
          <g key={rot} transform={`rotate(${rot} 100 100)`}>
            <circle cx="100" cy="22" r="6" fill={color} opacity="0.3" />
            <circle cx="100" cy="22" r="3" fill="#fff" opacity="0.6" />
          </g>
        ))}
        <circle cx="100" cy="100" r="70" fill="none" stroke={color} strokeWidth="1" opacity="0.2" strokeDasharray="4 3" />
      </svg>
    );
  }

  if (border === 'gold-frame' || templateId === 'sinhala-kandyan') {
    return (
      <svg className="invite-art invite-art--gold-frame" viewBox="0 0 200 200" aria-hidden="true">
        <GoldCornerFlourish color={color} />
      </svg>
    );
  }

  if (border === 'church' || templateId === 'church-elegant') {
    return (
      <svg className="invite-art invite-art--church" viewBox="0 0 200 200" aria-hidden="true">
        <path d="M100 18v12M94 30h12" stroke={color} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
        <path d="M55 175V105l45-28 45 28v70H55z" fill={color} fillOpacity="0.06" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
        <GoldCornerFlourish color={color} />
      </svg>
    );
  }

  return null;
}

export default InvitationThemeArt;
