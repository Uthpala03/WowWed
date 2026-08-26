import { Link } from 'react-router-dom';
import { buildNotifications } from '../../utils/notifications';

function NotificationsPanel({
  open,
  onClose,
  inbox = [],
  unread = 0,
  includeLocal = true,
  onMarkRead,
  onMarkAllRead,
}) {
  if (!open) return null;
  const local = includeLocal ? buildNotifications() : [];
  const items = [
    ...inbox.map((item) => ({
      id: item.id,
      type: item.type || 'info',
      text: item.message || item.title,
      link: item.link,
      read: item.read,
      raw: item,
    })),
    ...local,
  ];

  return (
    <div className="notif-panel">
      <div className="notif-panel__head">
        <h3>Notifications{unread > 0 ? ` (${unread})` : ''}</h3>
        <div className="notif-panel__head-actions">
          {unread > 0 && (
            <button type="button" className="notif-panel__mark" onClick={onMarkAllRead}>Mark all read</button>
          )}
          <button type="button" onClick={onClose}>✕</button>
        </div>
      </div>
      {items.length === 0 ? <p className="notif-panel__empty">All caught up!</p> : (
        <ul className="notif-panel__list">
          {items.map((n) => (
            <li key={n.id} className={`notif-panel__item notif-panel__item--${n.type}${n.read ? ' is-read' : ''}`}>
              <Link
                to={n.link || '/dashboard'}
                onClick={() => {
                  if (n.raw) onMarkRead?.(n.raw);
                  onClose();
                }}
              >
                {n.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPanel;
