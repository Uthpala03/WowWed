import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useInboxNotifications(pollMs = 8000) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setItems(data.notifications || []);
      setUnread(Number(data.unread) || 0);
    } catch {
      /* keep last inbox if the server is briefly unreachable */
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return undefined;
    const timer = setInterval(refresh, pollMs);
    return () => clearInterval(timer);
  }, [refresh, pollMs]);

  const markRead = async (item) => {
    if (!item?.dbId || item.read) return;
    try {
      await api.markNotificationRead(item.dbId);
      setItems((current) => current.map((row) => (
        row.dbId === item.dbId ? { ...row, read: true } : row
      )));
      setUnread((count) => Math.max(0, count - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setItems((current) => current.map((row) => ({ ...row, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return { items, unread, refresh, markRead, markAllRead };
}
