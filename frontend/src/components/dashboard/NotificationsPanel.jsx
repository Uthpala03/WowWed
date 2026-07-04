import { Link } from 'react-router-dom';
import { buildNotifications } from '../../utils/notifications';

function NotificationsPanel({ open, onClose }) {
  if (!open) return null;
  const items = buildNotifications();

  return (
    <div className="notif-panel">
      <div className="notif-panel__head">
        <h3>Notifications</h3>
        <button type="button" onClick={onClose}>✕</button>
      </div>
      {items.length === 0 ? <p className="notif-panel__empty">All caught up!</p> : (
        <ul className="notif-panel__list">
          {items.map((n) => (
            <li key={n.id} className={`notif-panel__item notif-panel__item--${n.type}`}>
              <Link to={n.link} onClick={onClose}>{n.text}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPanel;
