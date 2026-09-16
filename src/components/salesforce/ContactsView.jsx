import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { Modal } from '../ui/Modal';
import { AccountPicker } from './RecordPickers';
import { PlusIcon, MailIcon, PhoneIcon, EmptyBoxIllustration } from '../ui/DashboardIcons';
import './ContactsView.css';

/**
 * Contacts - browse Salesforce Contacts (optionally scoped to one account)
 * and create/edit them. Mirrors ContractsView/AccountsView's list + modal
 * pattern for consistency.
 */
export const ContactsView = () => {
  const toast = useToast();

  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accountFilterId, setAccountFilterId] = useState(null);
  const [accountFilterLabel, setAccountFilterLabel] = useState('');

  const [formState, setFormState] = useState(null); // null | {mode:'create'} | {mode:'edit', contact}
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100' });
    if (accountFilterId) params.set('accountId', accountFilterId);

    api.get(`/salesforce/contacts?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setContacts(res.data.data?.records || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load contacts');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [accountFilterId, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleCreate = async (values) => {
    setIsSubmitting(true);
    markSelfAction(values.AccountId);
    try {
      await api.post('/salesforce/contacts', values);
      toast.success('Contact created successfully');
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id, values) => {
    setIsSubmitting(true);
    markSelfAction(id);
    try {
      await api.patch(`/salesforce/contacts/${id}`, values);
      toast.success('Contact updated successfully');
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contacts-page container">
      <div className="contacts-header">
        <div>
          <h1 style={{ margin: 0 }}>Contacts</h1>
          <p className="contacts-subtitle">People at your accounts.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormState({ mode: 'create' })}>
          <PlusIcon width={16} height={16} /> New Contact
        </button>
      </div>

      <div className="contacts-filters">
        {accountFilterId ? (
          <div className="contacts-active-filter">
            Filtered by <strong>{accountFilterLabel}</strong>
            <button type="button" onClick={() => { setAccountFilterId(null); setAccountFilterLabel(''); }}>Clear</button>
          </div>
        ) : (
          <div className="contacts-account-filter">
            <AccountPicker
              value={accountFilterId}
              label={accountFilterLabel}
              required={false}
              onChange={(id, name) => { setAccountFilterId(id); setAccountFilterLabel(name); }}
            />
          </div>
        )}
      </div>

      {error && <div className="contacts-error">{error}</div>}
      {!error && isLoading && <div className="contacts-loading">Loading contacts...</div>}

      {!error && !isLoading && contacts.length === 0 && (
        <div className="contacts-empty">
          <EmptyBoxIllustration />
          <p>No contacts found.</p>
        </div>
      )}

      {!error && !isLoading && contacts.length > 0 && (
        <div className="contacts-table-wrap">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {contacts.map((contact) => (
                  <motion.tr
                    key={contact.Id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setFormState({ mode: 'edit', contact })}
                  >
                    <td className="contacts-name-cell">{contact.FirstName} {contact.LastName}</td>
                    <td>{contact.Title || '—'}</td>
                    <td>{contact.Email ? <span className="contacts-icon-cell"><MailIcon width={13} height={13} />{contact.Email}</span> : '—'}</td>
                    <td>{contact.Phone ? <span className="contacts-icon-cell"><PhoneIcon width={13} height={13} />{contact.Phone}</span> : '—'}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <ContactFormModal
        state={formState}
        onClose={() => setFormState(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

const ContactFormModal = ({ state, onClose, onCreate, onUpdate, isSubmitting }) => {
  const isEdit = state?.mode === 'edit';
  const [accountId, setAccountId] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (!state) return;
    const c = isEdit ? state.contact : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form's transient state each time the modal opens for a (possibly different) record, not derivable from props/state
    setAccountId(c?.AccountId || null);
    setAccountName(c?.Account?.Name || '');
    setFirstName(c?.FirstName || '');
    setLastName(c?.LastName || '');
    setEmail(c?.Email || '');
    setPhone(c?.Phone || '');
    setTitle(c?.Title || '');
    setValidationError(null);
  }, [state, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!lastName.trim()) {
      setValidationError('Last name is required.');
      return;
    }
    if (!isEdit && !accountId) {
      setValidationError('Choose an account for this contact.');
      return;
    }

    const values = {
      FirstName: firstName || null,
      LastName: lastName.trim(),
      Email: email || null,
      Phone: phone || null,
      Title: title || null,
      ...(isEdit ? {} : { AccountId: accountId }),
    };

    if (isEdit) {
      await onUpdate(state.contact.Id, values);
    } else {
      await onCreate(values);
    }
  };

  return (
    <Modal isOpen={Boolean(state)} onClose={onClose} title={isEdit ? 'Edit Contact' : 'New Contact'} maxWidth={520}>
      <form className="contact-form" onSubmit={handleSubmit}>
        {!isEdit && (
          <AccountPicker value={accountId} label={accountName} onChange={(id, name) => { setAccountId(id); setAccountName(name); }} />
        )}

        <div className="contact-form-row">
          <div className="filter-group">
            <label>First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </div>
          <div className="filter-group">
            <label>Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="filter-group">
          <label>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="contact-form-row">
          <div className="filter-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        {validationError && <div className="contact-form-error">{validationError}</div>}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn-modal-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactsView;
