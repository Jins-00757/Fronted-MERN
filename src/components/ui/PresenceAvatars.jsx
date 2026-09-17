import './PresenceAvatars.css';

const initials = (name) => (name || '?').trim().charAt(0).toUpperCase();

/**
 * PresenceAvatars - a small overlapping stack of initials avatars for a list
 * of {userId, name} entries (see hooks/usePresence.js). `excludeUserId` lets
 * a caller hide itself from the list - e.g. a per-record viewer list should
 * show "who ELSE is here", not the current user.
 */
export const PresenceAvatars = ({ users = [], excludeUserId, max = 5, size = 26 }) => {
  const visible = excludeUserId ? users.filter((u) => u.userId !== excludeUserId) : users;
  if (visible.length === 0) return null;

  const shown = visible.slice(0, max);
  const overflow = visible.length - shown.length;

  return (
    <div className="presence-avatars" style={{ '--presence-avatar-size': `${size}px` }}>
      {shown.map((u) => (
        <span key={u.userId} className="presence-avatar" title={u.name}>
          {initials(u.name)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="presence-avatar presence-avatar-overflow" title={`${overflow} more`}>
          +{overflow}
        </span>
      )}
    </div>
  );
};

export default PresenceAvatars;
