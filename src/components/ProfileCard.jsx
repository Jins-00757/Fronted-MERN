import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  BriefcaseIcon,
  ShieldIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  MapPinIcon,
  EditIcon,
} from './ui/DashboardIcons';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { roleLabel as getRoleLabel } from '../utils/permissions';
import { DangerZone } from './DangerZone';
import { EditProfileModal } from './EditProfileModal';
import { ChangePasswordForm } from './ChangePasswordForm';
import './ProfileCard.css';

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * InfoRow - one labeled field in the profile grid. Renders nothing when the
 * value is empty so the grid never shows a row of blank/undefined text for
 * optional profile fields (company, job title, department, phone).
 */
const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="profile-info-row">
      <span className="profile-info-icon" aria-hidden="true">
        <Icon width={16} height={16} />
      </span>
      <div className="profile-info-text">
        <span className="profile-info-label">{label}</span>
        <span className="profile-info-value">{value}</span>
      </div>
    </div>
  );
};

/**
 * ProfileCard - professional summary of the signed-in user's account:
 * identity, role, org/contact details, and Salesforce connection status.
 * Purely presentational - all data comes from the `user` object already
 * held by AuthProvider (see auth.controller.js's toPublicProfile), so it
 * never triggers its own network request and never renders a password or
 * OAuth token (those are stripped server-side before the user object ever
 * reaches the client).
 */
export const ProfileCard = ({ user, onConnectSalesforce }) => {
  const { resendVerificationEmail } = useAuth();
  const toast = useToast();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleResendVerification = useCallback(async () => {
    if (isSendingVerification) return;
    setIsSendingVerification(true);
    const result = await resendVerificationEmail();
    setIsSendingVerification(false);
    if (result.success) {
      toast.success(result.message || 'Verification email sent');
    } else {
      toast.error(result.error || 'Failed to send verification email');
    }
  }, [isSendingVerification, resendVerificationEmail, toast]);

  if (!user) return null;

  const initial = user.name?.trim()?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  const roleKey = (user.role || 'user').toLowerCase();
  const roleLabel = getRoleLabel(user.role);
  const memberSince = formatDate(user.createdAt);
  const lastLogin = formatDate(user.lastLogin);
  const sfConnectedDate = formatDate(user.salesforceConnectedAt);

  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
    >
      <div className="profile-card-header">
        <div className="profile-avatar" aria-hidden="true">
          {user.profilePicture ? (
            <img
              className="profile-avatar-img"
              src={user.profilePicture}
              alt=""
              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(initial)); }}
            />
          ) : (
            initial
          )}
        </div>
        <div className="profile-identity">
          <div className="profile-name-row">
            <h3 className="profile-name">{user.name || 'Unnamed User'}</h3>
            <span className={`role-badge role-${roleKey}`}>
              <ShieldIcon width={13} height={13} />
              {roleLabel}
            </span>
          </div>
          <div className="profile-email-row">
            <MailIcon width={14} height={14} />
            <span>{user.email}</span>
            {user.isEmailVerified ? (
              <span className="verified-pill" title="Email verified">
                <CheckCircleIcon width={12} height={12} />
                Verified
              </span>
            ) : (
              <span className="unverified-pill" title="Email not verified">
                <AlertTriangleIcon width={12} height={12} />
                Unverified
                <button
                  type="button"
                  className="unverified-resend-btn"
                  onClick={handleResendVerification}
                  disabled={isSendingVerification}
                >
                  {isSendingVerification ? 'Sending...' : 'Resend'}
                </button>
              </span>
            )}
          </div>
        </div>
        <button type="button" className="profile-edit-btn" onClick={() => setIsEditOpen(true)}>
          <EditIcon width={14} height={14} /> Edit Profile
        </button>
      </div>

      <div className="profile-info-grid">
        <InfoRow icon={BuildingIcon} label="Company" value={user.company} />
        <InfoRow icon={BriefcaseIcon} label="Job Title" value={user.jobTitle} />
        <InfoRow icon={BriefcaseIcon} label="Department" value={user.department} />
        <InfoRow icon={MapPinIcon} label="Territory" value={user.territory} />
        <InfoRow icon={PhoneIcon} label="Phone" value={user.phoneNumber} />
        <InfoRow icon={CalendarIcon} label="Member Since" value={memberSince} />
        <InfoRow icon={CalendarIcon} label="Last Login" value={lastLogin} />
      </div>

      {user.bio && <p className="profile-bio">{user.bio}</p>}

      <div className="profile-divider" />

      <div className="profile-sf-section">
        <div className="profile-sf-status">
          <span className={`sf-dot ${user.isSalesforceConnected ? 'connected' : ''}`} aria-hidden="true" />
          <div>
            <p className="profile-sf-title">Salesforce Integration</p>
            <p className="profile-sf-subtitle">
              {user.isSalesforceConnected
                ? `Connected to ${user.salesforceOrgName || 'your Salesforce org'}${sfConnectedDate ? ` · since ${sfConnectedDate}` : ''}`
                : 'Not connected - link your org to sync live pipeline data'}
            </p>
          </div>
        </div>
        {!user.isSalesforceConnected && onConnectSalesforce && (
          <button type="button" className="profile-sf-connect-btn" onClick={onConnectSalesforce}>
            Connect Salesforce
          </button>
        )}
      </div>

      <div className="profile-divider" />

      <div className="profile-security-section">
        <h4 className="profile-section-heading">Security</h4>
        <ChangePasswordForm />
      </div>

      <DangerZone />

      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </motion.div>
  );
};

export default ProfileCard;
