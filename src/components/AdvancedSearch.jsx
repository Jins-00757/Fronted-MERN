
import  { useState, useEffect } from 'react';
import api from '../services/api';
import { DownloadIcon } from './ui/DashboardIcons';
import './AdvancedSearch.css';

export const AdvancedSearch = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    stage: '',
    startDate: '',
    endDate: '',
    sortBy: 'relevance',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.get('/search/opportunities', {
        params: {
          q: query,
          ...filters,
        },
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