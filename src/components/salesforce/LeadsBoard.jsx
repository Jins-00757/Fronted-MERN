import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { canManageSalesforceRecords } from '../../utils/permissions';
import { useAuth } from '../../context/useAuth';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LeadScoreGauge } from './LeadScoreGauge';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  BriefcaseIcon,
  MailIcon,
  PhoneIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  EmptyBoxIllustration,
} from '../ui/DashboardIcons';
import './LeadsBoard.css';

const TIER_ORDER = ['Hot', 'Warm', 'Cold'];

const EMPTY_FORM = {
  FirstName: '',
  LastName: '',
  Company: '',
  Title: '',
  Email: '',
  Phone: '',
  LeadSource: '',
  Industry: '',
  AnnualRevenue: '',
  NumberOfEmployees: '',
};

export const LeadsBoard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canDelete = canManageSalesforceRecords(user);

  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [search, setSearch] = useState('');

  const [formState, setFormState] = useState(null); // null | {mode:'create'} | {mode:'edit', lead}
  const [detailLead, setDetailLead] = useState(null); // lead currently shown in the score-breakdown/convert modal
  const [confirmState, setConfirmState] = useState(null); // null | { type:'delete', lead }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isBulkConvertOpen, setIsBulkConvertOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);
    if (tierFilter) params.set('rating', tierFilter);
    if (search) params.set('search', search);

    api.get(`/salesforce/leads?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setLeads(res.data.data?.records || []);
        // Any fresh fetch (filter change, search, or an explicit refetch()
        // after a mutation) can only invalidate a selection, never make it
        // more valid - a previously-selected lead may have been converted/
        // deleted, or simply scrolled out of the new filtered set - so
        // start clean rather than carry over IDs that might not exist in
        // the new list.
        setSelectedIds(new Set());
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load leads');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [statusFilter, tierFilter, search, refreshKey]);

  useEffect(() => {
    api.get('/salesforce/leads/meta/statuses')
      .then((res) => setStatuses(res.data.data || []))
      .catch(() => {});
  }, []);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const tierCounts = useMemo(() => {
    const counts = { Hot: 0, Warm: 0, Cold: 0 };
    leads.forEach((l) => { counts[l.scoreData?.tier] = (counts[l.scoreData?.tier] || 0) + 1; });
    return counts;
  }, [leads]);

  const openStatuses = useMemo(() => statuses.filter((s) => !s.isConverted), [statuses]);

  const handleCreate = async (values) => {
    setIsSubmitting(true);
    markSelfAction(`${values.FirstName} ${values.LastName}`.trim(), values.Company);
    try {
      await api.post('/salesforce/leads', values);
      toast.success(`${values.Company} was added as a lead`);
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id, values) => {
    setIsSubmitting(true);
    markSelfAction(id);
    try {
      await api.patch(`/salesforce/leads/${id}`, values);
      toast.success('Lead updated');
      setFormState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (lead) => {
    setIsSubmitting(true);
    markSelfAction(lead.Id);
    try {
      await api.delete(`/salesforce/leads/${lead.Id}`);
      toast.success(`"${lead.Company}" lead was deleted`);
      setConfirmState(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async (lead, { convertedStatus, createOpportunity, opportunityName }) => {
    setIsSubmitting(true);
    markSelfAction(lead.Id);
    try {
      const res = await api.post(`/salesforce/leads/${lead.Id}/convert`, {
        convertedStatus,
        createOpportunity,
        opportunityName,
      });
      toast.success(`${lead.Company} converted successfully`);
      setDetailLead(null);
      refetch();
      return res.data.data;
    } catch (err) {
      toast.error(err.message || 'Failed to convert lead');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncScore = async (lead) => {
    try {
      const res = await api.post(`/salesforce/leads/${lead.Id}/sync-score`);
      toast.success(res.data.message || 'Rating synced');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to sync score');
    }
  };

  const toggleSelected = useCallback((leadId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkConvert = async ({ convertedStatus, createOpportunity }) => {
    setIsSubmitting(true);
    const leadIds = Array.from(selectedIds);
    leadIds.forEach((id) => markSelfAction(id));
    try {
      const res = await api.post('/salesforce/leads/bulk-convert', {
        leadIds,
        convertedStatus,
        createOpportunity,
      });
      const { succeeded, failed } = res.data.data;
      if (failed > 0) {
        toast.warning(`${succeeded} converted, ${failed} failed - see details`);
      } else {
        toast.success(`${succeeded} lead${succeeded === 1 ? '' : 's'} converted successfully`);
      }
      refetch();
      return res.data.data;
    } catch (err) {
      toast.error(err.message || 'Bulk conversion failed');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="leads-page container">
      <div className="leads-header">
        <div>
          <h1 style={{ margin: 0 }}>Leads</h1>
          <p className="leads-subtitle">Prospects ranked by fit, seniority, and engagement.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormState({ mode: 'create' })}>
          <PlusIcon width={16} height={16} /> New Lead
        </button>
      </div>

      <div className="tier-summary">
        {TIER_ORDER.map((tier) => (
          <button
            key={tier}
            type="button"
            className={`tier-chip tier-${tier.toLowerCase()} ${tierFilter === tier ? 'active' : ''}`}
            onClick={() => setTierFilter((prev) => (prev === tier ? '' : tier))}
          >
            <span className="tier-chip-dot" />
            {tier}
            <strong>{tierCounts[tier] || 0}</strong>
          </button>
        ))}
      </div>

      <div className="leads-filters">
        <div className="leads-search">
          <SearchIcon width={16} height={16} />
          <input
            type="text"
            placeholder="Search company, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {openStatuses.map((s) => (
            <option key={s.label} value={s.label}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="leads-error">{error}</div>}

      {!error && isLoading && <div className="leads-loading">Loading leads...</div>}

      {!error && !isLoading && leads.length === 0 && (
        <div className="leads-empty">
          <EmptyBoxIllustration />
          <p>No leads match these filters.</p>
        </div>
      )}

      {!error && !isLoading && leads.length > 0 && (
        <motion.div className="leads-grid" layout>
          <AnimatePresence initial={false}>
            {leads.map((lead) => (
              <motion.div
                key={lead.Id}
                className={`lead-card ${selectedIds.has(lead.Id) ? 'selected' : ''}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDetailLead(lead)}
              >
                <label className="lead-card-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.Id)}
                    onChange={() => toggleSelected(lead.Id)}
                    aria-label={`Select ${lead.Company} for bulk actions`}
                  />
                </label>
                <LeadScoreGauge score={lead.scoreData.score} tier={lead.scoreData.tier} />
                <div className="lead-card-body">
                  <div className="lead-card-name">{lead.FirstName} {lead.LastName}</div>
                  <div className="lead-card-title">{lead.Title || '—'}</div>
                  <div className="lead-card-company">
                    <BriefcaseIcon width={13} height={13} /> {lead.Company}
                  </div>
                  <span className="lead-status-pill">{lead.Status}</span>
                </div>
                <div className="lead-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="icon-action" title="Edit" onClick={() => setFormState({ mode: 'edit', lead })}>
                    <EditIcon width={14} height={14} />
                  </button>
                  {canDelete && (
                    <button type="button" className="icon-action danger" title="Delete" onClick={() => setConfirmState({ type: 'delete', lead })}>
                      <TrashIcon width={14} height={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            className="bulk-select-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <span className="bulk-select-count">{selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'} selected</span>
            <div className="bulk-select-actions">
              <button type="button" className="btn-modal-secondary" onClick={clearSelection}>
                Clear
              </button>
              <button type="button" className="btn-modal-primary" onClick={() => setIsBulkConvertOpen(true)}>
                Convert Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadFormModal
        state={formState}
        statuses={openStatuses}
        onClose={() => setFormState(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <BulkConvertModal
        isOpen={isBulkConvertOpen}
        leads={leads.filter((l) => selectedIds.has(l.Id))}
        statuses={statuses}
        onClose={() => setIsBulkConvertOpen(false)}
        onSubmit={handleBulkConvert}
        isSubmitting={isSubmitting}
      />

      <LeadDetailModal
        lead={detailLead}
        statuses={statuses}
        onClose={() => setDetailLead(null)}
        onConvert={handleConvert}
        onSyncScore={handleSyncScore}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={confirmState?.type === 'delete'}
        onClose={() => setConfirmState(null)}
        onConfirm={() => handleDelete(confirmState.lead)}
        title="Delete lead?"
        message={confirmState ? `This will permanently delete "${confirmState.lead.Company}" from Salesforce. This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        isLoading={isSubmitting}
      />
    </div>
  );
};

const LeadFormModal = ({ state, statuses, onClose, onCreate, onUpdate, isSubmitting }) => {
  const [values, setValues] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState(null);
  const mode = state?.mode;

  useEffect(() => {
    if (mode === 'edit' && state.lead) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the form to whichever lead was opened for editing, not derivable from props/state
      setValues({
        FirstName: state.lead.FirstName || '',
        LastName: state.lead.LastName || '',
        Company: state.lead.Company || '',
        Title: state.lead.Title || '',
        Email: state.lead.Email || '',
        Phone: state.lead.Phone || '',
        LeadSource: state.lead.LeadSource || '',
        Industry: state.lead.Industry || '',
        AnnualRevenue: state.lead.AnnualRevenue ?? '',
        NumberOfEmployees: state.lead.NumberOfEmployees ?? '',
        Status: state.lead.Status || '',
      });
    } else if (mode === 'create') {
      setValues(EMPTY_FORM);
    }
    setValidationError(null);
  }, [mode, state]);

  const handleChange = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!values.LastName.trim() || !values.Company.trim()) {
      setValidationError('Last name and company are required.');
      return;
    }

    if (mode === 'create') {
      await onCreate(values);
    } else {
      await onUpdate(state.lead.Id, values);
    }
  };

  return (
    <Modal isOpen={Boolean(state)} onClose={onClose} title={mode === 'edit' ? 'Edit Lead' : 'New Lead'} maxWidth={560}>
      <form className="lead-form" onSubmit={handleSubmit}>
        <div className="lead-form-row">
          <div className="filter-group">
            <label>First Name</label>
            <input value={values.FirstName} onChange={handleChange('FirstName')} />
          </div>
          <div className="filter-group">
            <label>Last Name *</label>
            <input value={values.LastName} onChange={handleChange('LastName')} required />
          </div>
        </div>

        <div className="filter-group">
          <label>Company *</label>
          <input value={values.Company} onChange={handleChange('Company')} required />
        </div>

        <div className="lead-form-row">
          <div className="filter-group">
            <label>Title</label>
            <input value={values.Title} onChange={handleChange('Title')} placeholder="e.g. VP of Sales" />
          </div>
          <div className="filter-group">
            <label>Lead Source</label>
            <input value={values.LeadSource} onChange={handleChange('LeadSource')} placeholder="e.g. Referral, Web" />
          </div>
        </div>

        <div className="lead-form-row">
          <div className="filter-group">
            <label>Email</label>
            <input type="email" value={values.Email} onChange={handleChange('Email')} />
          </div>
          <div className="filter-group">
            <label>Phone</label>
            <input value={values.Phone} onChange={handleChange('Phone')} />
          </div>
        </div>

        <div className="lead-form-row">
          <div className="filter-group">
            <label>Annual Revenue</label>
            <input type="number" min="0" value={values.AnnualRevenue} onChange={handleChange('AnnualRevenue')} />
          </div>
          <div className="filter-group">
            <label># Employees</label>
            <input type="number" min="0" value={values.NumberOfEmployees} onChange={handleChange('NumberOfEmployees')} />
          </div>
        </div>

        <div className="filter-group">
          <label>Industry</label>
          <input value={values.Industry} onChange={handleChange('Industry')} />
        </div>

        {mode === 'edit' && (
          <div className="filter-group">
            <label>Status</label>
            <select value={values.Status} onChange={handleChange('Status')}>
              {statuses.map((s) => (
                <option key={s.label} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {validationError && <div className="lead-form-error">{validationError}</div>}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn-modal-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CONVERTIBLE_DEFAULT = (statuses) => statuses.find((s) => s.isConverted)?.label || '';

const LeadDetailModal = ({ lead, statuses, onClose, onConvert, onSyncScore, isSubmitting }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedStatus, setConvertedStatus] = useState('');
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState('');
  const [convertResult, setConvertResult] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the convert sub-form's transient state whenever a different lead is opened, not derivable from props/state
    setIsConverting(false);
    setConvertResult(null);
    setConvertedStatus(CONVERTIBLE_DEFAULT(statuses));
    if (lead) setOpportunityName(`${lead.Company} - Opportunity`);
  }, [lead, statuses]);

  if (!lead) return null;

  const { score, tier, breakdown } = lead.scoreData;

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await onConvert(lead, { convertedStatus, createOpportunity, opportunityName });
      setConvertResult(result);
    } catch {
      // toast already shown by parent
    }
  };

  return (
    <Modal isOpen={Boolean(lead)} onClose={onClose} title={`${lead.FirstName} ${lead.LastName}`} maxWidth={620}>
      <div className="lead-detail">
        <div className="lead-detail-summary">
          <LeadScoreGauge score={score} tier={tier} size={88} strokeWidth={8} />
          <div>
            <div className="lead-detail-company">{lead.Company}</div>
            <div className="lead-detail-meta">
              {lead.Title && <span>{lead.Title}</span>}
              {lead.Email && <span><MailIcon width={13} height={13} /> {lead.Email}</span>}
              {lead.Phone && <span><PhoneIcon width={13} height={13} /> {lead.Phone}</span>}
            </div>
            <span className="lead-status-pill">{lead.Status}</span>
          </div>
        </div>

        <h4 className="lead-detail-heading">
          <TrendingUpIcon width={15} height={15} /> Score Breakdown ({score}/100)
        </h4>
        <div className="score-breakdown">
          {breakdown.map((f) => (
            <div key={f.factor} className="score-breakdown-row">
              <div className="score-breakdown-label">
                <span>{f.factor}</span>
                <span className="score-breakdown-points">{f.points}/{f.max}</span>
              </div>
              <div className="score-breakdown-bar">
                <div className="score-breakdown-bar-fill" style={{ width: `${(f.points / f.max) * 100}%` }} />
              </div>
              <div className="score-breakdown-reason">{f.reason}</div>
            </div>
          ))}
        </div>

        <div className="lead-detail-actions">
          <button type="button" className="btn-modal-secondary" onClick={() => onSyncScore(lead)}>
            Sync Rating to Salesforce ({tier})
          </button>
          {!lead.IsConverted && !isConverting && !convertResult && (
            <button type="button" className="btn-modal-primary" onClick={() => setIsConverting(true)}>
              Convert Lead
            </button>
          )}
        </div>

        {isConverting && !convertResult && (
          <form className="lead-convert-form" onSubmit={handleConvertSubmit}>
            <div className="filter-group">
              <label>Converted Status</label>
              <select value={convertedStatus} onChange={(e) => setConvertedStatus(e.target.value)} required>
                <option value="" disabled>Select a converted status</option>
                {statuses.filter((s) => s.isConverted).map((s) => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
            <label className="lead-convert-checkbox">
              <input type="checkbox" checked={createOpportunity} onChange={(e) => setCreateOpportunity(e.target.checked)} />
              Create an Opportunity
            </label>
            {createOpportunity && (
              <div className="filter-group">
                <label>Opportunity Name</label>
                <input value={opportunityName} onChange={(e) => setOpportunityName(e.target.value)} />
              </div>
            )}
            <div className="confirm-actions">
              <button type="button" className="btn-modal-secondary" onClick={() => setIsConverting(false)} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-modal-primary" disabled={isSubmitting || !convertedStatus}>
                {isSubmitting ? 'Converting...' : 'Confirm Conversion'}
              </button>
            </div>
          </form>
        )}

        {convertResult && (
          <div className="lead-convert-result">
            <p>✓ Converted successfully.</p>
            <ul>
              <li>Account created</li>
              <li>Contact created</li>
              {convertResult.opportunityId && <li>Opportunity created</li>}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

const BulkConvertModal = ({ isOpen, leads, statuses, onClose, onSubmit, isSubmitting }) => {
  const [convertedStatus, setConvertedStatus] = useState('');
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [results, setResults] = useState(null);
  // Snapshot of exactly which leads were submitted, captured at submit time
  // - `leads` itself is derived from the parent's live list, and onSubmit
  // triggers a refetch (+ clears the selection) that changes both out from
  // under us while results are still on screen. Rendering off a snapshot
  // instead of the live `leads` prop means the results list keeps showing
  // company names instead of degrading to raw IDs the instant the
  // background refetch resolves.
  const [submittedLeads, setSubmittedLeads] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the bulk-convert form's transient state each time it opens for a (possibly different) selection, not derivable from props/state
      setConvertedStatus(CONVERTIBLE_DEFAULT(statuses));
      setResults(null);
    }
  }, [isOpen, statuses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const snapshot = leads;
    setSubmittedLeads(snapshot);
    try {
      const data = await onSubmit({ convertedStatus, createOpportunity });
      setResults(data.results);
    } catch {
      // error toast already shown by parent
    }
  };

  const handleClose = () => {
    onClose();
    // Results belong to the selection that was just converted - once the
    // modal is dismissed there's no "reopen and see them again" case, so
    // clearing here (rather than leaving it for the next isOpen effect)
    // avoids a one-frame flash of stale results if it's reopened for a
    // fresh selection before that effect runs.
    setResults(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Convert Leads" maxWidth={520}>
      {!results ? (
        <form className="lead-convert-form" onSubmit={handleSubmit}>
          <p className="bulk-convert-intro">
            This will convert <strong>{leads.length}</strong> lead{leads.length === 1 ? '' : 's'} into Accounts and Contacts:
          </p>
          <ul className="bulk-convert-list">
            {leads.map((l) => <li key={l.Id}>{l.Company} <span>({l.scoreData.tier}, {l.scoreData.score})</span></li>)}
          </ul>

          <div className="filter-group">
            <label>Converted Status</label>
            <select value={convertedStatus} onChange={(e) => setConvertedStatus(e.target.value)} required>
              <option value="" disabled>Select a converted status</option>
              {statuses.filter((s) => s.isConverted).map((s) => (
                <option key={s.label} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>

          <label className="lead-convert-checkbox">
            <input type="checkbox" checked={createOpportunity} onChange={(e) => setCreateOpportunity(e.target.checked)} />
            Create an Opportunity for each lead
          </label>

          <div className="confirm-actions">
            <button type="button" className="btn-modal-secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-primary" disabled={isSubmitting || !convertedStatus}>
              {isSubmitting ? 'Converting...' : `Convert ${leads.length} Lead${leads.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>
      ) : (
        <div className="bulk-convert-results">
          <ul className="bulk-convert-result-list">
            {results.map((r) => {
              const lead = submittedLeads.find((l) => l.Id === r.leadId);
              return (
                <li key={r.leadId} className={r.isSuccess ? 'success' : 'failure'}>
                  {r.isSuccess ? <CheckCircleIcon width={15} height={15} /> : <AlertTriangleIcon width={15} height={15} />}
                  <span>{lead?.Company || r.leadId}</span>
                  {!r.isSuccess && <span className="bulk-convert-error">{r.error}</span>}
                </li>
              );
            })}
          </ul>
          <div className="confirm-actions">
            <button type="button" className="btn-modal-primary" onClick={handleClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LeadsBoard;
