import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { QuoteBuilder } from './QuoteBuilder';
import { PlusIcon, SearchIcon, EmptyBoxIllustration, FileTextIcon } from '../ui/DashboardIcons';
import { formatCurrency } from '../../utils/quoteCalculations';
import './QuotesView.css';

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
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {quotes.map((quote) => (
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
                  </motion.tr>
                ))}
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
    </div>
  );
};

export default QuotesView;
