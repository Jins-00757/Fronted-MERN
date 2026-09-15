import { useAuth } from '../context/useAuth';
import { ProfileCard } from '../components/ProfileCard';
import './Profile.css';

/**
 * Profile - dedicated page for account details, Salesforce connection
 * status, and two-factor auth settings (all rendered via the existing
 * ProfileCard, previously only reachable by scrolling to the bottom of the
 * Dashboard). Follows the same page-header + container pattern every other
 * routed page (OpportunitiesList, AccountsMap, ...) already uses, so
 * Profile is a normal one-click destination from the account dropdown
 * instead of being buried under Dashboard's stats.
 */
export const Profile = ({ onConnectSalesforce }) => {
  const { user } = useAuth();

  return (
    <div className="container profile-page">
      <div className="profile-page-header">
        <h1 style={{ margin: 0 }}>Profile</h1>
        <p className="profile-page-subtitle">Your account details, Salesforce connection, and security settings.</p>
      </div>

      <ProfileCard
        user={user}
        onConnectSalesforce={!user?.isSalesforceConnected ? onConnectSalesforce : undefined}
      />
    </div>
  );
};

export default Profile;
