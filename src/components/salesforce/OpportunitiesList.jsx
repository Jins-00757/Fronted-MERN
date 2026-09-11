import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';

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

const formatCurrency = (amount) => `$${(amount || 0).toLocaleString()}`;

export const OpportunitiesList = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Nothing to fetch when disconnected - the component returns the empty
    // state below before ever rendering the loading UI in that case.
    if (!user?.isSalesforceConnected) {
      return undefined;
    }

    let cancelled = false;

    const fetchOpportunities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get('/data/opportunities');
        if (!cancelled && response.data.success) {
          setOpportunities(response.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || 'Failed to fetch opportunities');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchOpportunities();
    return () => {
      cancelled = true;
    };
  }, [user?.isSalesforceConnected, refreshKey]);

  if (!user?.isSalesforceConnected) {
    return (
      <div className="container">
        <EmptyState message="Connect your Salesforce account from the Dashboard to view opportunities." />
      </div>
    );
  }

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Open Opportunities</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#666' }}>
            {opportunities.length} open {opportunities.length === 1 ? 'deal' : 'deals'} · Total pipeline value:{' '}
            <strong>{formatCurrency(totalValue)}</strong>
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={isLoading}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: 'white',
            cursor: isLoading ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isLoading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {!error && isLoading && <EmptyState message="Loading opportunities..." />}

      {!error && !isLoading && opportunities.length === 0 && (
        <EmptyState message="No open opportunities found in your connected Salesforce org." />
      )}

      {!error && !isLoading && opportunities.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <Th>Opportunity</Th>
                <Th align="right">Amount</Th>
                <Th>Stage</Th>
                <Th>Close Date</Th>
                <Th>Owner</Th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <Td style={{ fontWeight: 600 }}>{opp.name}</Td>
                  <Td align="right">{formatCurrency(opp.amount)}</Td>
                  <Td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'white',
                        background: STAGE_COLORS[opp.stage] || '#6b7280',
                      }}
                    >
                      {opp.stage}
                    </span>
                  </Td>
                  <Td>{opp.closeDate ? new Date(opp.closeDate).toLocaleDateString() : 'N/A'}</Td>
                  <Td>{opp.owner}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Th = ({ children, align = 'left' }) => (
  <th style={{ padding: '0.75rem 1rem', textAlign: align, color: '#374151' }}>{children}</th>
);

const Td = ({ children, align = 'left', style }) => (
  <td style={{ padding: '0.75rem 1rem', textAlign: align, ...style }}>{children}</td>
);

const EmptyState = ({ message }) => (
  <div
    style={{
      padding: '3rem 1.5rem',
      textAlign: 'center',
      color: '#6b7280',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}
  >
    {message}
  </div>
);

export default OpportunitiesList;
