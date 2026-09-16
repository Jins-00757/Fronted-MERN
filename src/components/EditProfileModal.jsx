import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { Modal } from './ui/Modal';
import { JOB_FUNCTIONS, TERRITORIES } from '../utils/profileOptions';
import './EditProfileModal.css';

const BIO_MAX = 500;

const fieldsFromUser = (user) => ({
  name: user?.name || '',
  company: user?.company || '',
  jobTitle: user?.jobTitle || '',
  department: user?.department || '',
  territory: user?.territory || '',
  phoneNumber: user?.phoneNumber || '',
  bio: user?.bio || '',
  profilePicture: user?.profilePicture || '',
});

/**
 * EditProfileModal - the Profile page's "modification option": a single
 * form for every editable, non-security profile field. Sends only through
 * AuthProvider.updateProfile (PUT /api/auth/profile), which merges into the
 * signed-in user's existing document and refreshes `user` in context on
 * success, so ProfileCard re-renders with the new values immediately.
 */
export const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [fields, setFields] = useState(() => fieldsFromUser(user));
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Reset to the current user's values every time the modal opens, so a
  // cancelled edit never leaves stale draft text behind for next time.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form's transient state each time the modal opens, not derivable from props/state
      setFields(fieldsFromUser(user));
      setValidationError('');
    }
  }, [isOpen, user]);

  const update = (field, value) => setFields((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!fields.name.trim() || fields.name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters.');
      return;
    }
    if (fields.bio.length > BIO_MAX) {
      setValidationError(`Bio must not exceed ${BIO_MAX} characters.`);
      return;
    }
    if (fields.profilePicture && !/^https?:\/\/\S+$/i.test(fields.profilePicture)) {
      setValidationError('Profile picture must be a valid http(s) URL (or leave it blank).');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile(fields);
    setIsSaving(false);

    if (result.success) {
      toast.success('Profile updated successfully');
      onClose();
    } else {
      setValidationError(result.error || 'Failed to update profile');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth={560}>
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="edit-profile-avatar-row">
          <div className="edit-profile-avatar-preview">
            {fields.profilePicture ? (
              <img src={fields.profilePicture} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            ) : (
              <span>{(fields.name || user?.email || 'U').trim()[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="filter-group edit-profile-avatar-field">
            <label>Profile Picture URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={fields.profilePicture}
              onChange={(e) => update('profilePicture', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Full Name *</label>
          <input type="text" value={fields.name} onChange={(e) => update('name', e.target.value)} required minLength={2} maxLength={100} />
        </div>

        <div className="edit-profile-row">
          <div className="filter-group">
            <label>Company</label>
            <input type="text" value={fields.company} onChange={(e) => update('company', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Department</label>
            <input type="text" value={fields.department} onChange={(e) => update('department', e.target.value)} />
          </div>
        </div>

        <div className="edit-profile-row">
          <div className="filter-group">
            <label>Job Function</label>
            <select value={fields.jobTitle} onChange={(e) => update('jobTitle', e.target.value)}>
              <option value="">Not set</option>
              {JOB_FUNCTIONS.map((jf) => (
                <option key={jf.value} value={jf.value}>{jf.value}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Territory</label>
            <select value={fields.territory} onChange={(e) => update('territory', e.target.value)}>
              <option value="">Not set</option>
              {TERRITORIES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-group">
          <label>Phone Number</label>
          <input type="tel" value={fields.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Bio</label>
          <textarea
            rows={3}
            maxLength={BIO_MAX}
            value={fields.bio}
            onChange={(e) => update('bio', e.target.value)}
          />
          <span className="edit-profile-char-count">{fields.bio.length}/{BIO_MAX}</span>
        </div>

        {validationError && <div className="edit-profile-error">{validationError}</div>}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn-modal-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
