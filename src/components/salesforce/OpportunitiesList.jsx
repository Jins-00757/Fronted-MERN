import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import api from '../../services/api';
import { ActivityFeed } from './ActivityFeed';
import { OpportunitiesBoard } from './OpportunitiesBoard';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { markSelfAction } from '../../utils/recentSelfActions';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  XIcon,
  EmptyBoxIllustration,
} from '../ui/DashboardIcons';
import './OpportunitiesList.css';

const STAGE_OPTIONS = [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Value Proposition',
  'Id. Decision Makers',
  'Perception Analysis',
  'Proposal/Price Quote',
  'Negotiation/Review',
  'Closed Won',
  'Closed Lost',
];

const STAGE_COLORS = {
  Prospecting: '#3b82f6',
  Qualification: '#06b6d4',
  'Needs Analysis': '#6366f1',
  'Value Proposition': '#8b5cf6',
  'Id. Decision Makers': '#a855f7',
  'Perception Analysis': '#ec4899',
  'Proposal/Price Quote': '#f97316',
  'Negotiation/Review': '#eab308',
  'Closed Won': '#10b981',
  'Closed Lost': '#ef4444',
};

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  Name: '',
  StageName: 'Prospecting',
  CloseDate: '',
  Amount: '',
  AccountId: '',
  Description: '',
};

const formatCurrency = (amount) => `$${(amount || 0).toLocaleString()}`;

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const normalizeAmount = (value) =>
  value === '' || value === null || value === undefined ? null : parseFloat(value);

/**
 * OpportunitiesList - the routed Opportunities page. Full CRUD against
 * /api/salesforce/opportunities (paginated, filterable, cached server-side)
 * rather than the earlier read-only view against /api/data/opportunities -
 * every create/update/close/delete here also drives the Deal Activity Feed,
 * stage-change emails, and analytics/search cache invalidation on the
 * backend (see opportunitiesController.js).
 */
export const OpportunitiesList = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ stage: '', amountMin: '', amountMax: '' });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'board'

  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [formState, setFormState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', opportunity }
  const [confirmState, setConfirmState] = useState(null); // null | { type, opportunity }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // The board view fetches its own larger, unpaginated batch (see
    // OpportunitiesBoard.jsx) - skip the table's paginated fetch entirely
    // while it's active, both to avoid a wasted request and to leave more
    // of the per-user rate limit budget for the board's own calls.
    if (!user?.isSalesforceConnected || viewMode !== 'table') {
      return undefined;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter/page-change loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
    if (filters.stage) params.stage = filters.stage;
    if (filters.amountMin) params.amountMin = filters.amountMin;
    if (filters.amountMax) params.amountMax = filters.amountMax;

    api
      .get('/salesforce/opportunities', { params })
      .then((response) => {
        if (!cancelled && response.data.success) {
          setOpportunities(response.data.data?.records || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to fetch opportunities');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.isSalesforceConnected, viewMode, page, filters.stage, filters.amountMin, filters.amountMax, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleFilterChange = (field, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const closeForm = () => setFormState(null);

  const handleCreate = async (values) => {
    setIsSubmitting(true);
    // Marked by name, not id - the id doesn't exist client-side until the
    // response below resolves, but the WebSocket echo (which carries the
    // real id) can arrive at this same tab before or shortly after that -
    // see recentSelfActions.js.
    markSelfAction(values.Name);
    try {
      await api.post('/salesforce/opportunities', values);
      toast.success(`"${values.Name}" was created`);
      closeForm();
      setPage(1);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to create opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id, changedFields, dealName) => {
    if (Object.keys(changedFields).length === 0) {
      closeForm();
      return;
    }
    setIsSubmitting(true);
    markSelfAction(id, dealName);
    try {
      await api.patch(`/salesforce/opportunities/${id}`, changedFields);
      toast.success(`"${dealName}" was updated`);
      closeForm();
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (opportunity, won) => {
    setIsSubmitting(true);
    markSelfAction(opportunity.Id, opportunity.Name);
    try {
      const response = await api.post(`/salesforce/opportunities/${opportunity.Id}/close`, { won });
      toast.success(response.data.message || `Closed as ${won ? 'Won' : 'Lost'}`);
      setConfirmState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to close opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (opportunity) => {
    setIsSubmitting(true);
    markSelfAction(opportunity.Id, opportunity.Name);
    try {
      await api.delete(`/salesforce/opportunities/${opportunity.Id}`);
      toast.success(`"${opportunity.Name}" was deleted`);
      setConfirmState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to delete opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.isSalesforceConnected) {
    return (
      <div className="container">
        <EmptyState message="Connect your Salesforce account from the Dashboard to view opportunities." />
      </div>
    );
  }

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.Amount || 0), 0);
  const hasNextPage = opportunities.length === PAGE_SIZE;

  return (
    <div className="container opp-page">
      <div className="opp-page-header">
        <div>
          <h1 style={{ margin: 0 }}>Opportunities</h1>
          <p className="opp-page-subtitle">
            {viewMode === 'table' ? (
              <>
                {opportunities.length} {opportunities.length === 1 ? 'deal' : 'deals'} on this page · Page total:{' '}
                <strong>{formatCurrency(totalValue)}</strong>
              </>
            ) : (
              'Drag a card to a new column to change its stage'
            )}
          </p>
        </div>
        <div className="opp-page-actions">
          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              ☰ Table
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              ▤ Board
            </button>
          </div>
          <button type="button" className="btn-outline" onClick={() => setIsActivityOpen(true)}>
            🕘 Activity
          </button>
          <button type="button" className="btn-outline" onClick={refetch} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <motion.button
            type="button"
            className="btn-primary-solid"
            onClick={() => setFormState({ mode: 'create' })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <PlusIcon width={16} height={16} /> New Opportunity
          </motion.button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <>
          <FiltersBar filters={filters} onChange={handleFilterChange} />

          {error && <div className="opp-error-banner">{error}</div>}

          {!error && isLoading && <EmptyState message="Loading opportunities..." />}

          {!error && !isLoading && opportunities.length === 0 && (
            <EmptyState message="No opportunities match these filters." />
          )}

          {!error && !isLoading && opportunities.length > 0 && (
            <>
              <div className="opp-table-wrap">
                <table className="opp-table">
                  <thead>
                    <tr>
                      <th>Opportunity</th>
                      <th className="align-right">Amount</th>
                      <th>Stage</th>
                      <th>Close Date</th>
                      <th>Owner</th>
                      <th className="align-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {opportunities.map((opp) => (
                        <motion.tr
                          key={opp.Id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <td className="opp-name-cell">{opp.Name}</td>
                          <td className="align-right">{formatCurrency(opp.Amount)}</td>
                          <td>
                            <span
                              className="stage-pill"
                              style={{ background: STAGE_COLORS[opp.StageName] || '#6b7280' }}
                            >
                              {opp.StageName}
                            </span>
                          </td>
                          <td>{opp.CloseDate ? new Date(opp.CloseDate).toLocaleDateString() : 'N/A'}</td>
                          <td>{opp.Owner?.Name || 'N/A'}</td>
                          <td>
                            <div className="opp-row-actions">
                              <button
                                type="button"
                                className="icon-action"
                                title="Edit"
                                onClick={() => setFormState({ mode: 'edit', opportunity: opp })}
                              >
                                <EditIcon width={15} height={15} />
                              </button>
                              {!opp.StageName?.startsWith('Closed') && (
                                <>
                                  <button
                                    type="button"
                                    className="icon-action success"
                                    title="Close as Won"
                                    onClick={() => setConfirmState({ type: 'close-won', opportunity: opp })}
                                  >
                                    <CheckCircleIcon width={15} height={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-action warning"
                                    title="Close as Lost"
                                    onClick={() => setConfirmState({ type: 'close-lost', opportunity: opp })}
                                  >
                                    <XIcon width={15} height={15} />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="icon-action danger"
                                title="Delete"
                                onClick={() => setConfirmState({ type: 'delete', opportunity: opp })}
                              >
                                <TrashIcon width={15} height={15} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              <div className="opp-pagination">
                <button type="button" className="btn-outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  ← Previous
                </button>
                <span>Page {page}</span>
                <button type="button" className="btn-outline" disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <OpportunitiesBoard
          refreshKey={refreshKey}
          onEdit={(opp) => setFormState({ mode: 'edit', opportunity: opp })}
          onDelete={(opp) => setConfirmState({ type: 'delete', opportunity: opp })}
          onCloseWon={(opp) => setConfirmState({ type: 'close-won', opportunity: opp })}
          onCloseLost={(opp) => setConfirmState({ type: 'close-lost', opportunity: opp })}
          onMutated={refetch}
        />
      )}

      <ActivityFeed isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />

      <OpportunityFormModal
        state={formState}
        onClose={closeForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={() => {
          if (!confirmState) return;
          if (confirmState.type === 'delete') handleDelete(confirmState.opportunity);
          else handleClose(confirmState.opportunity, confirmState.type === 'close-won');
        }}
        title={confirmTitle(confirmState)}
        message={confirmMessage(confirmState)}
        confirmLabel={confirmState?.type === 'delete' ? 'Delete' : 'Confirm'}
        danger={confirmState?.type === 'delete' || confirmState?.type === 'close-lost'}
        isLoading={isSubmitting}
      />
    </div>
  );
};

const confirmTitle = (state) => {
  if (!state) return '';
  if (state.type === 'delete') return 'Delete opportunity?';
  if (state.type === 'close-won') return 'Close as Won?';
  return 'Close as Lost?';
};

const confirmMessage = (state) => {
  if (!state) return '';
  const name = state.opportunity?.Name || 'this opportunity';
  if (state.type === 'delete') {
    return `This will permanently delete "${name}" from Salesforce. This cannot be undone.`;
  }
  if (state.type === 'close-won') {
    return `Mark "${name}" as Closed Won? This cannot be undone.`;
  }
  return `Mark "${name}" as Closed Lost? This cannot be undone.`;
};

const FiltersBar = ({ filters, onChange }) => (
  <div className="opp-filters-bar">
    <div className="form-group">
      <label>Stage</label>
      <select value={filters.stage} onChange={(e) => onChange('stage', e.target.value)}>
        <option value="">All Stages</option>
        {STAGE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
    <div className="form-group">
      <label>Min Amount</label>
      <input
        type="number"
        min="0"
        value={filters.amountMin}
        onChange={(e) => onChange('amountMin', e.target.value)}
        placeholder="$0"
      />
    </div>
    <div className="form-group">
      <label>Max Amount</label>
      <input
        type="number"
        min="0"
        value={filters.amountMax}
        onChange={(e) => onChange('amountMax', e.target.value)}
        placeholder="No limit"
      />
    </div>
  </div>
);

const OpportunityFormModal = ({ state, onClose, onCreate, onUpdate, isSubmitting }) => {
  const isOpen = Boolean(state);
  const mode = state?.mode;
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (!state) return;

    if (state.mode === 'edit') {
      const opp = state.opportunity;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the form to whichever record was opened for editing, not derivable from props/state
      setFormData({
        Name: opp.Name || '',
        StageName: opp.StageName || 'Prospecting',
        CloseDate: opp.CloseDate ? opp.CloseDate.slice(0, 10) : '',
        Amount: opp.Amount ?? '',
        AccountId: opp.AccountId || '',
        Description: opp.Description || '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setValidationError(null);
  }, [state]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.Name || !formData.StageName || !formData.CloseDate || !formData.AccountId) {
      setValidationError('Name, Stage, Close Date, and Account ID are required.');
      return;
    }

    if (mode === 'create') {
      if (new Date(formData.CloseDate) < new Date(new Date().toDateString())) {
        setValidationError('Close date must be in the future.');
        return;
      }
      onCreate({ ...formData, Amount: normalizeAmount(formData.Amount) });
      return;
    }

    // Edit mode: diff against the original record and only submit changed
    // fields. This matters for more than payload size - the backend only
    // re-validates "close date must be in the future" when CloseDate is
    // present in the payload, so an untouched CloseDate on an
    // already-overdue open deal must never be resent, or an unrelated edit
    // (e.g. just the Amount) would be wrongly rejected.
    const original = state.opportunity;
    const changed = {};

    if (formData.Name !== (original.Name || '')) changed.Name = formData.Name;
    if (formData.StageName !== (original.StageName || '')) changed.StageName = formData.StageName;

    const originalCloseDate = original.CloseDate ? original.CloseDate.slice(0, 10) : '';
    if (formData.CloseDate !== originalCloseDate) {
      if (new Date(formData.CloseDate) < new Date(new Date().toDateString())) {
        setValidationError('Close date must be in the future.');
        return;
      }
      changed.CloseDate = formData.CloseDate;
    }

    if (normalizeAmount(formData.Amount) !== normalizeAmount(original.Amount)) {
      changed.Amount = normalizeAmount(formData.Amount);
    }
    if (formData.AccountId !== (original.AccountId || '')) changed.AccountId = formData.AccountId;
    if (formData.Description !== (original.Description || '')) changed.Description = formData.Description;

    onUpdate(original.Id, changed, formData.Name);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Opportunity' : 'New Opportunity'}
      maxWidth={560}
    >
      <form className="opp-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Opportunity Name *</label>
          <input
            type="text"
            value={formData.Name}
            onChange={(e) => handleChange('Name', e.target.value)}
            placeholder="e.g., Acme Corp - Enterprise License"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Stage *</label>
            <select value={formData.StageName} onChange={(e) => handleChange('StageName', e.target.value)}>
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Close Date *</label>
            <input
              type="date"
              value={formData.CloseDate}
              onChange={(e) => handleChange('CloseDate', e.target.value)}
              min={mode === 'create' ? tomorrowISO() : undefined}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.Amount}
              onChange={(e) => handleChange('Amount', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label>Account ID *</label>
            <input
              type="text"
              value={formData.AccountId}
              onChange={(e) => handleChange('AccountId', e.target.value)}
              placeholder="Salesforce Account ID"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            rows={3}
            value={formData.Description}
            onChange={(e) => handleChange('Description', e.target.value)}
            placeholder="Add any relevant notes..."
          />
        </div>

        {validationError && <div className="opp-form-error">{validationError}</div>}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-modal-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Opportunity'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EmptyState = ({ message }) => (
  <div className="opp-empty-state">
    <EmptyBoxIllustration />
    <p>{message}</p>
  </div>
);

export default OpportunitiesList;
