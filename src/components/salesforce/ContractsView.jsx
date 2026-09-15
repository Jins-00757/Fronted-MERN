import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { Modal } from '../ui/Modal';
import { PlusIcon, CalendarIcon, BuildingIcon, AlertTriangleIcon, CheckCircleIcon, EmptyBoxIllustration } from '../ui/DashboardIcons';
import './ContractsView.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 30;

const STATUS_COLORS = {
  Draft: 'status-draft',
  'In Approval Process': 'status-approval',
  Activated: 'status-activated',
};

/**
 * Percent of the contract's term elapsed, clamped to [0,100]. Returns null
 * when there isn't enough data (no StartDate, or a contract still in Draft
 * with no computed EndDate yet) so the caller can render "—" instead of a
 * meaningless 0% bar.
 */
const termProgress = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (end <= start) return null;

  const pct = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, pct));
};

const daysUntil = (date) => {
  if (!date) return null;
  return Math.round((new Date(date).getTime() - Date.now()) / DAY_MS);
};

export const ContractsView = () => {
  const toast = useToast();

  const [contracts, setContracts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [formState, setFormState] = useState(null); // null | {mode:'create'}
  const [detailContract, setDetailContract] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);

    api.get(`/salesforce/contracts?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setContracts(res.data.data?.records || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load contracts');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]);

  useEffect(() => {
    api.get('/salesforce/contracts/meta/statuses')
      .then((res) => setStatuses(res.data.data || []))
      .catch(() => {});
  }, []);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const expiringSoonCount = contracts.filter((c) => {
    const d = daysUntil(c.EndDate);
    return c.Status === 'Activated' && d !== null && d >= 0 && d <= EXPIRING_SOON_DAYS;
  }).length;

  const handleCreate = async (values) => {
    setIsSubmitting(true);
    markSelfAction(values.AccountId);
    try {
      await api.post('/salesforce/contracts', values);
      toast.success('Contract drafted successfully');
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to create contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (contract) => {
    setIsSubmitting(true);
    markSelfAction(contract.Id);
    try {
      await api.patch(`/salesforce/contracts/${contract.Id}`, { Status: 'Activated' });
      toast.success(`Contract ${contract.ContractNumber} activated`);
      setDetailContract(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to activate contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contracts-page container">
      <div className="contracts-header">
        <div>
          <h1 style={{ margin: 0 }}>Contracts</h1>
          <p className="contracts-subtitle">Track terms, activation, and upcoming renewals.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormState({ mode: 'create' })}>
          <PlusIcon width={16} height={16} /> New Contract
        </button>
      </div>

      {expiringSoonCount > 0 && (
        <div className="contracts-alert">
          <AlertTriangleIcon width={16} height={16} />
          {expiringSoonCount} contract{expiringSoonCount === 1 ? '' : 's'} expiring within {EXPIRING_SOON_DAYS} days
        </div>
      )}

      <div className="contracts-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="contracts-error">{error}</div>}
      {!error && isLoading && <div className="contracts-loading">Loading contracts...</div>}

      {!error && !isLoading && contracts.length === 0 && (
        <div className="contracts-empty">
          <EmptyBoxIllustration />
          <p>No contracts yet.</p>
        </div>
      )}

      {!error && !isLoading && contracts.length > 0 && (
        <div className="contracts-timeline">
          <AnimatePresence initial={false}>
            {contracts.map((contract) => {
              const progress = termProgress(contract.StartDate, contract.EndDate);
              const remaining = daysUntil(contract.EndDate);
              const expiringSoon = contract.Status === 'Activated' && remaining !== null && remaining >= 0 && remaining <= EXPIRING_SOON_DAYS;
              const expired = contract.Status === 'Activated' && remaining !== null && remaining < 0;

              return (
                <motion.div
                  key={contract.Id}
                  className={`contract-row ${expiringSoon ? 'expiring-soon' : ''} ${expired ? 'expired' : ''}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setDetailContract(contract)}
                >
                  <div className="contract-row-main">
                    <div className="contract-row-title">
                      <BuildingIcon width={14} height={14} />
                      {contract.Account?.Name || 'Unknown Account'}
                    </div>
                    <div className="contract-row-number">{contract.ContractNumber}</div>
                  </div>

                  <span className={`contract-status-pill ${STATUS_COLORS[contract.Status] || ''}`}>
                    {contract.Status}
                  </span>

                  <div className="contract-row-term">
                    <div className="contract-term-dates">
                      <span><CalendarIcon width={12} height={12} /> {contract.StartDate || 'No start date'}</span>
                      <span>{contract.EndDate || '—'}</span>
                    </div>
                    <div className="contract-term-bar">
                      <div
                        className="contract-term-bar-fill"
                        style={{ width: progress !== null ? `${progress}%` : '0%' }}
                      />
                    </div>
                    {expiringSoon && <span className="contract-expiry-note">Expires in {remaining} day{remaining === 1 ? '' : 's'}</span>}
                    {expired && <span className="contract-expiry-note expired-note">Expired {Math.abs(remaining)} day{Math.abs(remaining) === 1 ? '' : 's'} ago</span>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ContractFormModal
        state={formState}
        onClose={() => setFormState(null)}
        onCreate={handleCreate}
        isSubmitting={isSubmitting}
      />

      <ContractDetailModal
        contract={detailContract}
        onClose={() => setDetailContract(null)}
        onActivate={handleActivate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

const AccountPicker = ({ value, label, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results the instant the query is too short to search, not derived from other state
      setResults([]);
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.get(`/salesforce/accounts?search=${encodeURIComponent(query)}&limit=8`)
        .then((res) => setResults(res.data.data?.records || []))
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="account-picker">
      <label>Account *</label>
      {value ? (
        <div className="account-picker-selected">
          <BuildingIcon width={14} height={14} />
          {label}
          <button type="button" onClick={() => onChange(null, '')}>Change</button>
        </div>
      ) : (
        <div className="account-picker-input-wrap">
          <input
            type="text"
            placeholder="Search accounts by name..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
          />
          {isOpen && results.length > 0 && (
            <div className="account-picker-results">
              {results.map((acc) => (
                <button
                  type="button"
                  key={acc.Id}
                  onClick={() => { onChange(acc.Id, acc.Name); setIsOpen(false); setQuery(''); }}
                >
                  {acc.Name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ContractFormModal = ({ state, onClose, onCreate, isSubmitting }) => {
  const [accountId, setAccountId] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [contractTerm, setContractTerm] = useState('12');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (state?.mode === 'create') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form's transient state each time the create modal opens, not derivable from props/state
      setAccountId(null);
      setAccountName('');
      setStartDate('');
      setContractTerm('12');
      setDescription('');
      setValidationError(null);
    }
  }, [state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!accountId) {
      setValidationError('Choose an account for this contract.');
      return;
    }

    await onCreate({ AccountId: accountId, StartDate: startDate || null, ContractTerm: contractTerm, Description: description });
  };

  return (
    <Modal isOpen={Boolean(state)} onClose={onClose} title="New Contract" maxWidth={520}>
      <form className="contract-form" onSubmit={handleSubmit}>
        <AccountPicker value={accountId} label={accountName} onChange={(id, name) => { setAccountId(id); setAccountName(name); }} />

        <div className="contract-form-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Term (months)</label>
            <input type="number" min="1" value={contractTerm} onChange={(e) => setContractTerm(e.target.value)} />
          </div>
        </div>

        <div className="filter-group">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {validationError && <div className="contract-form-error">{validationError}</div>}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn-modal-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Draft Contract'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ContractDetailModal = ({ contract, onClose, onActivate, isSubmitting }) => {
  if (!contract) return null;

  return (
    <Modal isOpen={Boolean(contract)} onClose={onClose} title={contract.ContractNumber} maxWidth={480}>
      <div className="contract-detail">
        <div className="contract-detail-row"><span>Account</span><strong>{contract.Account?.Name}</strong></div>
        <div className="contract-detail-row"><span>Status</span><span className={`contract-status-pill ${STATUS_COLORS[contract.Status] || ''}`}>{contract.Status}</span></div>
        <div className="contract-detail-row"><span>Start Date</span><strong>{contract.StartDate || '—'}</strong></div>
        <div className="contract-detail-row"><span>End Date</span><strong>{contract.EndDate || '—'}</strong></div>
        <div className="contract-detail-row"><span>Term</span><strong>{contract.ContractTerm ? `${contract.ContractTerm} months` : '—'}</strong></div>
        {contract.Description && (
          <div className="contract-detail-description">{contract.Description}</div>
        )}

        {contract.Status === 'Draft' && (
          <button type="button" className="btn-modal-primary" onClick={() => onActivate(contract)} disabled={isSubmitting}>
            <CheckCircleIcon width={15} height={15} /> {isSubmitting ? 'Activating...' : 'Activate Contract'}
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ContractsView;
