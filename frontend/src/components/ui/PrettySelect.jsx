import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AppIcon from './AppIcon';
import OnboardingIcon from './OnboardingIcon';

const ONBOARDING_ICONS = [
  'venue', 'bridal', 'groom', 'camera', 'ring', 'floral', 'catering', 'cake', 'pin',
  'poruwa', 'church', 'hindu', 'nikah', 'reception', 'calendar', 'hearts', 'couple',
  'indoor', 'outdoor', 'mixed', 'check',
];

function FilterIcon({ name, size = 16 }) {
  if (ONBOARDING_ICONS.includes(name)) return <OnboardingIcon name={name} size={size} />;
  return <AppIcon name={name || 'vendors'} size={size} />;
}

function PrettySelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  className = '',
  icon = 'vendors',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const list = options || [];
  const selected = list.find((opt) => String(opt.value) === String(value)) || list[0];
  const selectedIcon = selected?.icon || icon;

  const placeMenu = () => {
    const trigger = wrapRef.current?.querySelector('.pretty-select__trigger');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 200);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const estimated = Math.min(260, list.length * 38 + 10);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < Math.min(estimated, 180) && rect.top > spaceBelow;
    setMenuStyle({
      left,
      width,
      top: openUp ? 'auto' : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : 'auto',
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    placeMenu();
    const onPointer = (event) => {
      if (wrapRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open, list.length]);

  const menu = open && menuStyle ? createPortal(
    <ul
      ref={menuRef}
      className="pretty-select__menu"
      role="listbox"
      aria-label={label || placeholder}
      style={menuStyle}
    >
      {list.map((opt) => {
        const active = String(opt.value) === String(value);
        return (
          <li key={`${opt.value}-${opt.label}`}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              className={`pretty-select__option${active ? ' is-active' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className="pretty-select__option-icon" aria-hidden="true">
                <FilterIcon name={opt.icon || icon} size={14} />
              </span>
              <span>{opt.label}</span>
            </button>
          </li>
        );
      })}
    </ul>,
    document.body,
  ) : null;

  return (
    <div className={`pretty-select${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="pretty-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || placeholder}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          placeMenu();
          setOpen(true);
        }}
      >
        <span className="pretty-select__icon" aria-hidden="true">
          <FilterIcon name={selectedIcon} />
        </span>
        <span className="pretty-select__copy">
          {label ? <small>{label}</small> : null}
          <strong>{selected?.label || placeholder}</strong>
        </span>
        <span className="pretty-select__caret" aria-hidden="true">▾</span>
      </button>
      {menu}
    </div>
  );
}

export default PrettySelect;
