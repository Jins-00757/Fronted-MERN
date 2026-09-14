
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/useAuth';
import './NotificationCenter.css';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const { notifications, isConnected, clearNotifications } = useNotifications(
    user?.token
  );

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications {notifications.length > 0 && `(${notifications.length})`}</h3>
        <div className="header-actions">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </div>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="btn-small">
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">No notifications</div>
        ) : (
          notifications.map((notif, i) => (
            <NotificationItem key={i} notification={notif} />
          ))
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({ notification }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'opportunity.created':
        return '✨';
      case 'opportunity.updated':
        return '📝';
      case 'opportunity.closed':
        return '🎉';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="notification-item">
      <div className="notification-icon">{getIcon(notification.type)}</div>
      <div className="notification-content">
        <div className="notification-title">{notification.data?.title}</div>
        <div className="notification-message">{notification.data?.message}</div>
        <div className="notification-time">
          {new Date(notification.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};