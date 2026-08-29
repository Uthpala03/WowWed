import { useEffect, useMemo, useRef, useState } from 'react';
import { buildNotifications } from '../../utils/notifications';
import { useInboxNotifications } from '../../hooks/useInboxNotifications';
import NotificationBell from './NotificationBell';
import NotificationsPanel from './NotificationsPanel';

function DashNotificationButton({ className = '' }) {
  const notifBtnRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [localTick, setLocalTick] = useState(0);
  const inbox = useInboxNotifications(8000);

  useEffect(() => {
    const bump = () => setLocalTick((value) => value + 1);
    window.addEventListener('wowwed-notifications-changed', bump);
    window.addEventListener('wowwed-data-changed', bump);
    return () => {
      window.removeEventListener('wowwed-notifications-changed', bump);
      window.removeEventListener('wowwed-data-changed', bump);
    };
  }, []);

  const localNotifications = useMemo(() => buildNotifications(), [localTick, inbox.items.length]);
  const notifCount = inbox.unread + localNotifications.length;

  return (
    <div className={`dash-notif-wrap${className ? ` ${className}` : ''}`}>
      <button
        ref={notifBtnRef}
        type="button"
        className={`dash-notif-btn${notifOpen ? ' is-open' : ''}`}
        onClick={() => setNotifOpen(!notifOpen)}
        aria-label="Notifications"
        aria-expanded={notifOpen}
      >
        <NotificationBell active={notifOpen} />
        {notifCount > 0 && (
          <span className="dash-notif-btn__badge">{notifCount > 9 ? '9+' : notifCount}</span>
        )}
      </button>
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        anchorRef={notifBtnRef}
        inbox={inbox.items}
        unread={inbox.unread}
        includeLocal
        onMarkRead={inbox.markRead}
        onMarkAllRead={inbox.markAllRead}
      />
    </div>
  );
}

export default DashNotificationButton;
