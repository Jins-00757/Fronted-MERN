import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { BuildingIcon, BriefcaseIcon, GridIcon } from '../ui/DashboardIcons';
import './RecordPickers.css';

/**
 * Shared "search Salesforce records, pick one" widgets used by the Quotes,
 * Contacts and Accounts pages (ContractsView.jsx has its own near-identical
 * AccountPicker predating this file - left as-is there to avoid touching
 * working code; every *new* picker need goes through here instead of being
 * copy-pasted a third/fourth time).
 */
// `resetKey` is an extra value (besides the query text itself) that should
// also trigger a re-fetch when it changes - e.g. ProductPicker's catalog
// depends on which Opportunity is selected, not just what's typed, so
// choosing a different Opportunity needs a fresh fetch even though the
// search box's text didn't change.
const useDebouncedSearch = (query, minLength, fetcher, resetKey) => {
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < minLength) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results the instant the query is too short to search, not derived from other state
      setResults([]);
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetcher(query).then(setResults).catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher is re-created per render by design (it closes over accountId/opportunityId filters); including it would re-run on every keystroke's render, not just query/resetKey changes
  }, [query, minLength, resetKey]);

  return results;
};

export const AccountPicker = ({ value, label, onChange, required = true }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useDebouncedSearch(query, 2, (q) =>
    api.get(`/salesforce/accounts?search=${encodeURIComponent(q)}&limit=8`).then((res) => res.data.data?.records || [])
  );

  return (
    <div className="record-picker">
      <label>Account {required ? '*' : ''}</label>
      {value ? (
        <div className="record-picker-selected">
          <BuildingIcon width={14} height={14} />
          {label}
          <button type="button" onClick={() => onChange(null, '')}>Change</button>
        </div>
      ) : (
        <div className="record-picker-input-wrap">
          <input
            type="text"
            placeholder="Search accounts by name..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
          />
          {isOpen && results.length > 0 && (
            <div className="record-picker-results">
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

export const OpportunityPicker = ({ value, label, onChange, accountId = null, required = true }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useDebouncedSearch(query, 2, (q) => {
    const params = new URLSearchParams({ search: q, limit: '8' });
    if (accountId) params.set('accountId', accountId);
    return api.get(`/salesforce/opportunities?${params.toString()}`).then((res) => res.data.data?.records || []);
  });

  return (
    <div className="record-picker">
      <label>Opportunity {required ? '*' : ''}</label>
      {value ? (
        <div className="record-picker-selected">
          <BriefcaseIcon width={14} height={14} />
          {label}
          <button type="button" onClick={() => onChange(null, '', null)}>Change</button>
        </div>
      ) : (
        <div className="record-picker-input-wrap">
          <input
            type="text"
            placeholder="Search opportunities by name..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
          />
          {isOpen && results.length > 0 && (
            <div className="record-picker-results">
              {results.map((opp) => (
                <button
                  type="button"
                  key={opp.Id}
                  onClick={() => { onChange(opp.Id, opp.Name, opp.AccountId); setIsOpen(false); setQuery(''); }}
                >
                  {opp.Name}
                  <span className="record-picker-result-sub">{opp.Account?.Name || 'No account'} · {opp.StageName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Product/service picker for the quote line item engine - searches the
 * price book resolved for the quote's opportunity (see
 * quotesController.getProductCatalog) and hands back the full catalog entry
 * (pricebookEntryId, listPrice, ...) so the caller can prefill a new line's
 * unit price.
 */
export const ProductPicker = ({ opportunityId, onSelect, disabled = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // minLength 0 (rather than the Account/Opportunity pickers' 2) - with a
  // catalog this small, requiring the user to type before seeing anything
  // just reads as "the product list is empty/broken". opportunityId as the
  // reset key means picking a different Opportunity re-fetches its price
  // book's catalog immediately, not just on the next keystroke.
  const results = useDebouncedSearch(query, 0, (q) => {
    if (!opportunityId) return Promise.resolve([]);
    const params = new URLSearchParams({ opportunityId, search: q, limit: '20' });
    return api.get(`/salesforce/quotes/products?${params.toString()}`).then((res) => res.data.data || []);
  }, opportunityId);

  return (
    <div className="record-picker product-picker">
      <div className="record-picker-input-wrap">
        <GridIcon width={14} height={14} className="product-picker-icon" />
        <input
          type="text"
          placeholder={disabled ? 'Choose an opportunity first' : 'Search products to add...'}
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && results.length > 0 && (
          <div className="record-picker-results">
            {results.map((product) => (
              <button
                type="button"
                key={product.pricebookEntryId}
                onClick={() => { onSelect(product); setIsOpen(false); setQuery(''); }}
              >
                {product.name}
                <span className="record-picker-result-sub">
                  {product.productCode ? `${product.productCode} · ` : ''}${Number(product.listPrice || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
