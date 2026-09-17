
import  { useState, useEffect } from 'react';
import api from '../services/api';
import { parseSearchQuery } from '../services/aiActionsApi';
import { DownloadIcon } from './ui/DashboardIcons';
import './AdvancedSearch.css';

const EMPTY_FILTERS = {
  minAmount: '',
  maxAmount: '',
  stage: '',
  startDate: '',
  endDate: '',
  sortBy: 'relevance',
};

export const AdvancedSearch = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [nlQuery, setNlQuery] = useState('');
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [nlError, setNlError] = useState(null);
  const [nlInterpretation, setNlInterpretation] = useState(null);

  // Get suggestions as user types. An AbortController guards against a race
  // where an earlier keystroke's request resolves after a later one (slow
  // network, backend jitter) and overwrites fresher suggestions with stale
  // ones - the debounce alone only spaces out requests, it doesn't order
  // their responses.
  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale suggestions the instant the query is too short to search, not derived from other state
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/search/suggestions', {
          params: { q: query },
          signal: controller.signal,
        });
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') {
          console.error('Error fetching suggestions:', error);
        }
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Shared by the manual "Search" button and the AI query bar below, so both
  // paths run the exact same request - the AI bar never has its own way of
  // reaching Salesforce, it only ever pre-fills these same params.
  const runSearch = async (q, activeFilters) => {
    setLoading(true);
    try {
      const response = await api.get('/search/opportunities', {
        params: { q, ...activeFilters },
      });

      setResults(response.data.results || []);
      if (onResults) {
        onResults(response.data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(query, filters);
  };

  const handleNlSearch = async (e) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    setIsParsingNl(true);
    setNlError(null);
    setNlInterpretation(null);

    try {
      // The backend only ever returns a validated filter object matching
      // this form's own fields (see aiActionsController.parseSearchQuery) -
      // it never runs a search itself, so what happens next is exactly what
      // typing these values in by hand and clicking Search would do.
      const { filters: parsed } = await parseSearchQuery(nlQuery);

      const nextFilters = {
        stage: parsed.stage ?? '',
        minAmount: parsed.minAmount !== undefined ? String(parsed.minAmount) : '',
        maxAmount: parsed.maxAmount !== undefined ? String(parsed.maxAmount) : '',
        startDate: parsed.startDate ?? '',
        endDate: parsed.endDate ?? '',
        sortBy: parsed.sortBy || 'relevance',
      };
      const nextQuery = parsed.keyword || '';

      setQuery(nextQuery);
      setFilters(nextFilters);
      setNlInterpretation({ query: nextQuery, ...nextFilters });

      await runSearch(nextQuery, nextFilters);
    } catch (error) {
      setNlError(error.message || 'Failed to understand that search - try rephrasing it or use the filters below.');
    } finally {
      setIsParsingNl(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.value);
    setSuggestions([]);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/search/export/${format}`, {
        params: {
          q: query,
          ...filters,
        },
        responseType: format === 'pdf' ? 'blob' : 'text',
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `opportunities.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="advanced-search">
      <form onSubmit={handleNlSearch} className="ai-search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder='Try "show me won deals over $50k in Q3, newest first"'
            className="search-input ai-search-input"
          />
          <button type="submit" className="ai-ask-btn" disabled={isParsingNl || !nlQuery.trim()}>
            {isParsingNl ? 'Thinking...' : '✨ Ask AI'}
          </button>
        </div>
        {nlError && <div className="ai-search-error">{nlError}</div>}
        {nlInterpretation && !nlError && (
          <div className="ai-search-interpretation">
            AI interpreted this as: {[
              nlInterpretation.query && `keyword "${nlInterpretation.query}"`,
              nlInterpretation.stage && `stage ${nlInterpretation.stage}`,
              nlInterpretation.minAmount && `min $${Number(nlInterpretation.minAmount).toLocaleString()}`,
              nlInterpretation.maxAmount && `max $${Number(nlInterpretation.maxAmount).toLocaleString()}`,
              nlInterpretation.startDate && `from ${nlInterpretation.startDate}`,
              nlInterpretation.endDate && `to ${nlInterpretation.endDate}`,
            ].filter(Boolean).join(', ') || 'no specific filters recognized - showing all results'}. Adjust the filters below and search again if needed.
          </div>
        )}
      </form>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities, stages, or accounts..."
            className="search-input"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-type">{suggestion.type}</span>
                <span className="suggestion-value">{suggestion.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="filters-grid">
          <div className="filter-group">
            <label>Min Amount</label>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="$0"
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>Max Amount</label>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="Unlimited"
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>Stage</label>
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
            >
              <option value="">All Stages</option>
              <option value="Prospecting">Prospecting</option>
              <option value="Qualification">Qualification</option>
              <option value="Proposal/Price Quote">Proposal/Price Quote</option>
              <option value="Closed Won">Closed Won</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="amount">Amount (High to Low)</option>
              <option value="date">Close Date</option>
              <option value="name">Name (A to Z)</option>
            </select>
          </div>
        </div>
      </form>

      {results.length > 0 && (
        <div className="export-options">
          <button
            className="btn-secondary btn-icon-label"
            onClick={() => handleExport('csv')}
          >
            <DownloadIcon width={15} height={15} /> Export as CSV
          </button>
          <button
            className="btn-secondary btn-icon-label"
            onClick={() => handleExport('pdf')}
          >
            <DownloadIcon width={15} height={15} /> Export as PDF
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <div className="results-count">{results.length} results found</div>
          <div className="results-list">
            {results.map((result) => (
              <div key={result.Id} className="result-item">
                <h4>{result.Name}</h4>
                <div className="result-details">
                  <span>${(result.Amount || 0).toLocaleString()}</span>
                  <span>{result.StageName}</span>
                  <span>{result.CloseDate ? new Date(result.CloseDate).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;