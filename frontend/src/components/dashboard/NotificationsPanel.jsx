import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { buildNotifications, dismissAllNotifications, dismissNotification } from '../../utils/notifications';
import AppIcon from '../ui/AppIcon';

const TYPE_META = {
  danger: { label: 'Urgent', icon: 'budget' },
  warning: { label: 'Attention', icon: 'sparkle' },
  info: { label: 'Update', icon: 'assistant' },
  booking: { label: 'Booking', icon: 'vendors' },
  guest: { label: 'Guests', icon: 'guests' },
  checklist: { label: 'Checklist', icon: 'checklist' },
  budget: { label: 'Budget', icon: 'budget' },
};

function inferMeta(item) {
  const text = `${item.title || ''} ${item.message || item.text || ''}`.toLowerCase();
  if (item.type && TYPE_META[item.type]) {
    return { type: item.type, ...TYPE_META[item.type], icon: item.icon || TYPE_META[item.type].icon };
  }
  if (/price|budget|overspend|spent/.test(text)) return { type: 'budget', ...TYPE_META.budget, icon: 'budget' };
  if (/guest|rsvp|invite/.test(text)) return { type: 'guest', ...TYPE_META.guest, icon: 'guests' };
  if (/checklist|task/.test(text)) return { type: 'checklist', ...TYPE_META.checklist, icon: 'checklist' };
  if (/vendor|booking|confirmed|request|hire/.test(text)) return { type: 'booking', ...TYPE_META.booking, icon: 'vendors' };
  if (/danger|alert|overspend/.test(text)) return { type: 'danger', ...TYPE_META.danger, icon: 'budget' };
  return { type: 'info', ...TYPE_META.info, icon: item.icon || 'assistant' };
}

function normalizeItem(item, fromInbox) {
  const meta = inferMeta(item);
  const rawTitle = (item.title || '').trim();
  const rawMessage = (item.message || item.text || '').trim();
  const title = rawTitle || meta.label;
  let text = rawMessage;
  if (!text || text === title) {
    text = fromInbox ? '' : (item.text || '').trim();
  }
  if (rawTitle && rawMessage && rawMessage !== rawTitle && !rawMessage.toLowerCase().startsWith(rawTitle.toLowerCase())) {
    text = rawMessage;
  } else if (rawTitle && rawMessage && rawMessage !== rawTitle) {
    text = rawMessage;
  }
  return {
    id: fromInbox ? `inbox-${item.id}` : item.id,
    type: meta.type,
    icon: meta.icon,
    title,
    text: text && text !== title ? text : (fromInbox ? '' : text),
    link: item.link || '/dashboard',
    read: Boolean(item.read),
    signature: item.signature,
    fromLocal: !fromInbox,
    raw: fromInbox ? item : null,
  };
}

function NotificationsPanel({
  open,
  onClose,
  anchorRef,
  inbox = [],
  unread = 0,
  includeLocal = true,
  onMarkRead,
  onMarkAllRead,
}) {
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState(null);
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => {
    const bump = () => setLocalVersion((value) => value + 1);
    window.addEventListener('wowwed-notifications-changed', bump);
    return () => window.removeEventListener('wowwed-notifications-changed', bump);
  }, []);

  const items = useMemo(() => {
    const local = includeLocal ? buildNotifications() : [];
    const merged = [
      ...inbox.map((row) => normalizeItem(row, true)),
      ...local.map((row) => normalizeItem(row, false)),
    ];
    return merged.sort((a, b) => Number(a.read) - Number(b.read));
  }, [inbox, includeLocal, localVersion]);

  useEffect(() => {
    if (!open || !anchorRef?.current) return undefined;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 24);
      let left = rect.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      const top = rect.bottom + 8;
      const maxHeight = Math.min(420, window.innerHeight - top - 16);
      setPanelStyle({ top, left, width, maxHeight: Math.max(200, maxHeight) });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (e.target.closest('.dash-notif-btn')) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !panelStyle) return null;

  const unreadItems = items.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    onMarkAllRead?.();
    if (includeLocal) {
      dismissAllNotifications();
    }
  };

  return createPortal(
    <>
      <button type="button" className="notif-backdrop" onClick={onClose} aria-label="Close notifications" tabIndex={-1} />
      <div
        className="notif-panel"
        ref={panelRef}
        style={panelStyle}
        role="dialog"
        aria-label="Notifications"
      >
        <header className="notif-panel__head">
          <div>
            <h3>Notifications</h3>
            {unreadItems > 0 && (
              <p className="notif-panel__sub">{unreadItems} new</p>
            )}
          </div>
          <div className="notif-panel__head-actions">
            {unreadItems > 0 && (
              <button type="button" className="notif-panel__mark" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
            <button type="button" className="notif-panel__close" onClick={onClose} aria-label="Close notifications">
              ✕
            </button>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="notif-panel__empty">
            <span className="notif-panel__empty-icon" aria-hidden="true">✨</span>
            <strong>All caught up!</strong>
            <p>No new updates right now.</p>
          </div>
        ) : (
          <ul className="notif-panel__list">
            {items.map((n) => (
              <li
                key={n.id}
                className={`notif-panel__item notif-panel__item--${n.type}${n.read ? ' is-read' : ''}`}
              >
                <Link
                  to={n.link}
                  className="notif-panel__link"
                  onClick={() => {
                    if (n.raw) {
                      onMarkRead?.(n.raw);
                    } else if (n.fromLocal) {
                      dismissNotification(n.id, n.signature);
                    }
                    onClose();
                  }}
                >
                  <span className={`notif-panel__icon notif-panel__icon--${n.type}`} aria-hidden="true">
                    <AppIcon name={n.icon} size={18} />
                  </span>
                  <span className="notif-panel__body">
                    <strong>{n.title}</strong>
                    {n.text ? <span>{n.text}</span> : null}
                  </span>
                  <span className="notif-panel__go" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>,
    document.body,
  );
}

export default NotificationsPanel;
