import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { Modal } from '../ui/Modal';
import { PlusIcon, BuildingIcon, SearchIcon, DollarIcon, EmptyBoxIllustration, BriefcaseIcon } from '../ui/DashboardIcons';
import './AccountsView.css';

/**
 * Accounts - browse/search Salesforce Accounts, create/edit them, and drill
 * into an account's opportunities. Mirrors ContractsView's list + modal
 * pattern (see components/salesforce/ContractsView.jsx) for consistency.
 */
export const AccountsView = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const [formState, setFormState] = useState(null); // null | {mode:'create'} | {mode:'edit', account}
  const [detailAccountId, setDetailAccountId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100' });
    if (search.trim()) params.set('search', search.trim());

    api.get(`/salesforce/accounts?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setAccounts(res.data.data?.records || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load accounts');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [search, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSearchChange = (value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  };

  const handleCreate = async (values) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/salesforce/accounts', values);
      markSelfAction(res.data.data?.id);
      toast.success('Account created successfully');
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id, values) => {
    setIsSubmitting(true);
    markSelfAction(id);
    try {
      await api.patch(`/salesforce/accounts/${id}`, values);
      toast.success('Account updated successfully');
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="accounts-page container">
      <div className="accounts-header">
        <div>
          <h1 style={{ margin: 0 }}>Accounts</h1>
          <p className="accounts-subtitle">Companies and organizations in your Salesforce org.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormState({ mode: 'create' })}>
          <PlusIcon width={16} height={16} /> New Account
        </button>
      </div>

      <div className="accounts-filters">
        <div className="accounts-search-wrap">
          <SearchIcon width={15} height={15} />
          <input
            type="text"
            placeholder="Search accounts by name..."
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="accounts-error">{error}</div>}
      {!error && isLoading && <div className="accounts-loading">Loading accounts...</div>}

      {!error && !isLoading && accounts.length === 0 && (
        <div className="accounts-empty">
          <EmptyBoxIllustration />
          <p>No accounts found.</p>
        </div>
      )}

      {!error && !isLoading && accounts.length > 0 && (
        <div className="accounts-grid">
          <AnimatePresence initial={false}>
            {accounts.map((account) => (
              <motion.div
                key={account.Id}
                className="account-card"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setDetailAccountId(account.Id)}
              >
                <div className="account-card-icon"><BuildingIcon width={18} height={18} /></div>
                <div className="account-card-body">
                  <div className="account-card-name">{account.Name}</div>
                  <div className="account-card-meta">
                    {account.Industry && <span>{account.Industry}</span>}
                    {account.BillingCity && <span>{account.BillingCity}{account.BillingState ? `, ${account.BillingState}` : ''}</span>}
                  </div>
                  {account.AnnualRevenue ? (
                    <div className="account-card-revenue">
                      <DollarIcon width={13} height={13} /> ${Number(account.AnnualRevenue).toLocaleString()} annual revenue
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AccountFormModal
        state={formState}
        onClose={() => setFormState(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <AccountDetailModal
        accountId={detailAccountId}
        onClose={() => setDetailAccountId(null)}
        onEdit={(account) => { setDetailAccountId(null); setFormState({ mode: 'edit', account }); }}
        onViewQuotes={(opportunityId) => navigate(`/quotes?opportunityId=${opportunityId}`)}
      />
    </div>
  );
};

const AccountFormModal = ({ state, onClose, onCreate, onUpdate, isSubmitting }) => {
  const isEdit = state?.mode === 'edit';
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [industry, setIndustry] = useState('');
  const [revenue, setRevenue] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (!state) return;
    const acc = isEdit ? state.account : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form's transient state each time the modal opens for a (possibly different) record, not derivable from props/state
    setName(acc?.Name || '');
    setCity(acc?.BillingCity || '');
    setStateVal(acc?.BillingState || '');
    setIndustry(acc?.Industry || '');
    setRevenue(acc?.AnnualRevenue ?? '');
    setPhone(acc?.Phone || '');
    setWebsite(acc?.Website || '');
    setValidationError(null);
  }, [state, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Account name is required.');
      return;
    }

    const values = {
      Name: name.trim(),
      BillingCity: city || null,
      BillingState: stateVal || null,
      Industry: industry || null,
      AnnualRevenue: revenue !== '' ? revenue : null,
      Phone: phone || null,
      Website: website || null,
    };

    if (isEdit) {
      await onUpdate(state.account.Id, values);
    } else {
      await onCreate(values);
    }
  };

  return (
    <Modal isOpen={Boolean(state)} onClose={onClose} title={isEdit ? 'Edit Account' : 'New Account'} maxWidth={520}>
      <form className="account-form" onSubmit={handleSubmit}>
        <div className="filter-group">
          <label>Account Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="account-form-row">
          <div className="filter-group">
            <label>City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>State</label>
            <input type="text" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
          </div>
        </div>

        <div className="account-form-row">
          <div className="filter-group">
            <label>Industry</label>
            <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Annual Revenue</label>
            <input type="number" min="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
        </div>

        <div className="account-form-row">
          <div className="filter-group">
            <label>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Website</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>

        {validationError && <div className="account-form-error">{validationError}</div>}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn-modal-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AccountDetailModal = ({ accountId, onClose, onEdit, onViewQuotes }) => {
  const [data, setData] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!accountId) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-open loading flag, not derivable from props/state
    setIsLoading(true);
    setData(null);
    setContacts([]);

    Promise.all([
      api.get(`/salesforce/accounts/${accountId}/opportunities`),
      api.get(`/salesforce/contacts?accountId=${accountId}&limit=25`),
    ])
      .then(([oppsRes, contactsRes]) => {
        if (cancelled) return;
        setData(oppsRes.data.data);
        setContacts(contactsRes.data.data?.records || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [accountId]);

  return (
    <Modal isOpen={Boolean(accountId)} onClose={onClose} title={data?.account?.Name || 'Account'} maxWidth={620}>
      {isLoading && <div className="accounts-loading">Loading...</div>}
      {!isLoading && data && (
        <div className="account-detail">
          <div className="account-detail-row"><span>Industry</span><strong>{data.account.Industry || '—'}</strong></div>
          <div className="account-detail-row"><span>City</span><strong>{data.account.BillingCity || '—'}</strong></div>
          <div className="account-detail-row"><span>Annual Revenue</span><strong>{data.account.AnnualRevenue ? `$${Number(data.account.AnnualRevenue).toLocaleString()}` : '—'}</strong></div>

          <button type="button" className="btn-modal-secondary account-edit-btn" onClick={() => onEdit(data.account)}>Edit Account</button>

          <h3 className="account-detail-section-title">Contacts ({contacts.length})</h3>
          {contacts.length === 0 && <p className="account-detail-empty">No contacts yet.</p>}
          <ul className="account-detail-list">
            {contacts.map((c) => (
              <li key={c.Id}>
                <span>{c.FirstName} {c.LastName}</span>
                {c.Email && <span className="account-detail-list-sub">{c.Email}</span>}
              </li>
            ))}
          </ul>

          <h3 className="account-detail-section-title">
            <BriefcaseIcon width={14} height={14} /> Opportunities ({data.opportunities.length})
          </h3>
          {data.opportunities.length === 0 && <p className="account-detail-empty">No opportunities yet.</p>}
          <ul className="account-detail-list">
            {data.opportunities.map((opp) => (
              <li key={opp.Id}>
                <span>{opp.Name}</span>
                <span className="account-detail-list-sub">
                  {opp.StageName} · ${Number(opp.Amount || 0).toLocaleString()}
                </span>
                <button type="button" className="account-quote-link" onClick={() => onViewQuotes(opp.Id)}>
                  Quotes →
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};

export default AccountsView;
