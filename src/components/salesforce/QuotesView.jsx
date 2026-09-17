import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { draftQuoteEmail, getQuoteRisk } from '../../services/aiActionsApi';
import { QuoteBuilder } from './QuoteBuilder';
import { Modal } from '../ui/Modal';
import { PlusIcon, SearchIcon, EmptyBoxIllustration, FileTextIcon, MailIcon, AlertTriangleIcon } from '../ui/DashboardIcons';
import { formatCurrency } from '../../utils/quoteCalculations';
import './QuotesView.css';

const RISK_TONE = { green: 'ai-risk-green', amber: 'ai-risk-amber', red: 'ai-risk-red' };
const RISK_LABEL = { green: 'Low Risk', amber: 'Moderate Risk', red: 'High Risk' };

const STATUS_TONE = {
  Draft: 'quote-status-draft',
  'Needs Review': 'quote-status-pending',
  'In Review': 'quote-status-pending',
  Approved: 'quote-status-approved',
  Presented: 'quote-status-approved',
  Accepted: 'quote-status-won',
  Denied: 'quote-status-lost',
  Rejected: 'quote-status-lost',
};

/**
 * Quotes - list/search Salesforce Quotes and launch the QuoteBuilder to
 * create or edit one. Supports being deep-linked from an Opportunity or
 * Account (?opportunityId=...) so "Quotes →" links elsewhere in the app
 * land pre-filtered - see AccountsView's account detail modal.
 */
export const QuotesView = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const opportunityId = searchParams.get('opportunityId');

  const [quotes, setQuotes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const [builderState, setBuilderState] = useState(null); // null | {quoteId} | {quoteId: null}

  // Per-row AI action state, keyed by quote.Id - a plain map rather than one
  // shared loading flag, since several rows' "Check Risk"/"Draft Email"
  // buttons can be in flight independently.
  const [aiState, setAiState] = useState({});
  const [emailDraftFor, setEmailDraftFor] = useState(null); // null | quote.Id

  const patchAiState = (quoteId, patch) =>
    setAiState((prev) => ({ ...prev, [quoteId]: { ...prev[quoteId], ...patch } }));

  const handleCheckRisk = async (e, quoteId) => {
    e.stopPropagation();
    patchAiState(quoteId, { riskLoading: true, riskError: null });
    try {
      const data = await getQuoteRisk(quoteId);
      patchAiState(quoteId, { riskLoading: false, risk: data });
    } catch (err) {
      patchAiState(quoteId, { riskLoading: false, riskError: err.message || 'Failed to check risk' });
    }
  };

  const handleDraftEmail = async (e, quoteId) => {
    e.stopPropagation();
    setEmailDraftFor(quoteId);
    patchAiState(quoteId, { emailLoading: true, emailError: null, email: null });
    try {
      const data = await draftQuoteEmail(quoteId);
      patchAiState(quoteId, { emailLoading: false, email: data });
    } catch (err) {
      patchAiState(quoteId, { emailLoading: false, emailError: err.message || 'Failed to draft email' });
    }
  };

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    if (opportunityId) params.set('opportunityId', opportunityId);

    api.get(`/salesforce/quotes?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setQuotes(res.data.data?.records || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load quotes');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [statusFilter, search, opportunityId, refreshKey]);

  useEffect(() => {
    api.get('/salesforce/quotes/meta/statuses').then((res) => setStatuses(res.data.data || [])).catch(() => {});
  }, []);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSearchChange = (value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  };

  const clearOpportunityFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('opportunityId');
    setSearchParams(next);
  };

  return (
    <div className="quotes-page container">
      <div className="quotes-header">
        <div>
          <h1 style={{ margin: 0 }}>Quotes</h1>
          <p className="quotes-subtitle">Build, price, and send quotations linked to your opportunities.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setBuilderState({ quoteId: null })}>
          <PlusIcon width={16} height={16} /> New Quote
        </button>
      </div>

      <div className="quotes-filters">
        <div className="quotes-search-wrap">
          <SearchIcon width={15} height={15} />
          <input type="text" placeholder="Search quotes by name..." onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {opportunityId && (
          <div className="quotes-active-filter">
            Filtered by opportunity
            <button type="button" onClick={clearOpportunityFilter}>Clear</button>
          </div>
        )}
      </div>

      {error && <div className="quotes-error">{error}</div>}
      {!error && isLoading && <div className="quotes-loading">Loading quotes...</div>}

      {!error && !isLoading && quotes.length === 0 && (
        <div className="quotes-empty">
          <EmptyBoxIllustration />
          <p>No quotes yet.</p>
        </div>
      )}

      {!error && !isLoading && quotes.length > 0 && (
        <div className="quotes-table-wrap">
          <table className="quotes-table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Account</th>
                <th>Opportunity</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Grand Total</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {quotes.map((quote) => {
                  const rowAi = aiState[quote.Id] || {};
                  return (
                    <motion.tr
                      key={quote.Id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setBuilderState({ quoteId: quote.Id })}
                    >
                      <td>
                        <div className="quotes-name-cell">
                          <FileTextIcon width={14} height={14} /> {quote.Name}
                        </div>
                        {quote.QuoteNumber && <div className="quotes-number-cell">#{quote.QuoteNumber}</div>}
                      </td>
                      <td>{quote.Opportunity?.Account?.Name || '—'}</td>
                      <td>{quote.Opportunity?.Name || '—'}</td>
                      <td><span className={`quote-status-pill ${STATUS_TONE[quote.Status] || ''}`}>{quote.Status || '—'}</span></td>
                      <td>{quote.ExpirationDate || '—'}</td>
                      <td className="quotes-total-cell">{formatCurrency(quote.GrandTotal)}</td>
                      <td className="quotes-ai-cell">
                        <button
                          type="button"
                          className="ai-action-btn"
                          onClick={(e) => handleDraftEmail(e, quote.Id)}
                          disabled={rowAi.emailLoading}
                          title="Draft a follow-up email with AI"
                        >
                          <MailIcon width={13} height={13} /> {rowAi.emailLoading ? '...' : 'Draft Email'}
                        </button>

                        {rowAi.risk ? (
                          <span
                            className={`ai-risk-badge ${RISK_TONE[rowAi.risk.riskLevel] || ''}`}
                            title={rowAi.risk.reasons?.join(' · ') || RISK_LABEL[rowAi.risk.riskLevel]}
                          >
                            <AlertTriangleIcon width={11} height={11} /> {RISK_LABEL[rowAi.risk.riskLevel] || rowAi.risk.riskLevel}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ai-action-btn"
                            onClick={(e) => handleCheckRisk(e, quote.Id)}
                            disabled={rowAi.riskLoading}
                            title="Check risk with AI"
                          >
                            <AlertTriangleIcon width={13} height={13} /> {rowAi.riskLoading ? '...' : 'Check Risk'}
                          </button>
                        )}
                        {rowAi.riskError && <div className="quotes-ai-error">{rowAi.riskError}</div>}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {builderState && (
        <QuoteBuilder
          quoteId={builderState.quoteId}
          initialOpportunityId={opportunityId}
          onClose={() => setBuilderState(null)}
          onSaved={refetch}
          onDeleted={refetch}
        />
      )}

      <QuoteEmailDraftModal
        quote={quotes.find((q) => q.Id === emailDraftFor) || null}
        state={emailDraftFor ? aiState[emailDraftFor] : null}
        onClose={() => setEmailDraftFor(null)}
        toast={toast}
      />
    </div>
  );
};

/**
 * QuoteEmailDraftModal - shows the AI-drafted follow-up email for a quote.
 * Draft-only: this never sends anything itself - "Copy" is the only action,
 * so actually emailing a customer still goes through QuoteBuilder's existing
 * "Email PDF" flow with its own Salesforce-Contact recipient allowlist.
 */
const QuoteEmailDraftModal = ({ quote, state, onClose, toast }) => {
  const handleCopy = async () => {
    if (!state?.email) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${state.email.subject}\n\n${state.email.body}`);
      toast.success('Email draft copied to clipboard');
    } catch {
      toast.error('Failed to copy - your browser may be blocking clipboard access');
    }
  };

  return (
    <Modal isOpen={Boolean(quote)} onClose={onClose} title={quote ? `AI Draft: ${quote.Name}` : 'AI Draft'} maxWidth={560}>
      {state?.emailLoading && <div className="quotes-loading">Drafting email...</div>}
      {state?.emailError && <div className="quotes-error">{state.emailError}</div>}
      {state?.email && (
        <div className="ai-email-draft">
          <div className="filter-group">
            <label>Subject</label>
            <input type="text" value={state.email.subject} readOnly />
          </div>
          <div className="filter-group">
            <label>Body</label>
            <textarea rows={10} value={state.email.body} readOnly />
          </div>
          <p className="ai-email-draft-hint">
            This is a draft only - nothing has been sent. Copy it to send yourself, or use "Email PDF" on the quote
            for the app's tracked send flow.
          </p>
          <div className="confirm-actions">
            <button type="button" className="btn-modal-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn-modal-primary" onClick={handleCopy}>Copy to Clipboard</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuotesView;
