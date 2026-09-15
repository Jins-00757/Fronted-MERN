
import  { useState } from 'react';
import useSalesforceData from '../hooks/useSalesforceData';
import api from '../services/api';
import './AnalyticsDashboard.css';

export const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState(30);
  const [selectedReport, setSelectedReport] = useState('health');

  const { data: healthReport, loading: healthLoading } = useSalesforceData(
    `/analytics/pipeline-health?range=${dateRange}`,
    { autoRefresh: true, refreshInterval: 10 * 60 * 1000 }
  );

  const { data: forecast, loading: forecastLoading } = useSalesforceData(
    '/analytics/forecast',
    { autoRefresh: true, refreshInterval: 10 * 60 * 1000 }
  );

  const { data: risks, loading: risksLoading } = useSalesforceData(
    '/analytics/risks',
    { autoRefresh: true, refreshInterval: 5 * 60 * 1000 }
  );

  const { data: teamPerformance, loading: teamLoading, error: teamError } = useSalesforceData(
    '/analytics/team-performance',
    { autoRefresh: true, refreshInterval: 10 * 60 * 1000 }
  );

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/analytics/export/${format}`, {
        params: { report: selectedReport, range: dateRange },
        responseType: format === 'pdf' ? 'blob' : 'text',
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${selectedReport}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics & Reporting</h1>
        <div className="header-controls">
          <label>Date Range (days):</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="select-input"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button className="btn-export" onClick={() => handleExport('csv')}>
            📥 Export CSV
          </button>
          <button className="btn-export" onClick={() => handleExport('pdf')}>
            📥 Export PDF
          </button>
        </div>
      </div>

      <div className="report-tabs">
        <button
          className={`tab ${selectedReport === 'health' ? 'active' : ''}`}
          onClick={() => setSelectedReport('health')}
        >
          Pipeline Health
        </button>
        <button
          className={`tab ${selectedReport === 'forecast' ? 'active' : ''}`}
          onClick={() => setSelectedReport('forecast')}
        >
          Revenue Forecast
        </button>
        <button
          className={`tab ${selectedReport === 'risks' ? 'active' : ''}`}
          onClick={() => setSelectedReport('risks')}
        >
          Deal Risks
        </button>
        <button
          className={`tab ${selectedReport === 'team' ? 'active' : ''}`}
          onClick={() => setSelectedReport('team')}
        >
          Team Performance
        </button>
      </div>

      {selectedReport === 'health' && (
        <PipelineHealthReport data={healthReport} loading={healthLoading} />
      )}
      {selectedReport === 'forecast' && (
        <ForecastReport data={forecast} loading={forecastLoading} />
      )}
      {selectedReport === 'risks' && (
        <RisksReport data={risks} loading={risksLoading} />
      )}
      {selectedReport === 'team' && (
        <TeamPerformanceReport data={teamPerformance} loading={teamLoading} error={teamError} />
      )}
    </div>
  );
};

const PipelineHealthReport = ({ data, loading }) => {
  if (loading) return <div className="loading">Loading pipeline health...</div>;
  if (!data) return <div className="empty-state">No data available</div>;

  return (
    <div className="report-section">
      <div className="report-metrics">
        <MetricCard
          label="Win Rate"
          value={`${data.winRate}%`}
          trend={data.winRate > 30 ? 'up' : 'down'}
        />
        <MetricCard
          label="Total Pipeline Value"
          value={`$${(data.totalPipelineValue / 1000000).toFixed(2)}M`}
        />
        <MetricCard
          label="Average Deal Size"
          value={`$${(data.avgDealSize / 1000).toFixed(0)}K`}
        />
        <MetricCard
          label="Closed Won"
          value={data.closedWonCount}
        />
      </div>

      <div className="stage-distribution">
        <h3>Pipeline Distribution by Stage</h3>
        <div className="stage-bars">
          {Object.entries(data.stageDistribution).map(([stage, count]) => (
            <div key={stage} className="stage-bar">
              <div className="stage-label">{stage}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / data.totalOpportunities) * 100}%`,
                  }}
                />
              </div>
              <div className="stage-count">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ForecastReport = ({ data, loading }) => {
  if (loading) return <div className="loading">Loading forecast...</div>;
  if (!data) return <div className="empty-state">No forecast data</div>;

  return (
    <div className="report-section">
      <div className="forecast-summary">
        <div className="forecast-card">
          <h3>Total Forecast</h3>
          <div className="forecast-value">
            ${(data.totalForecast / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>

      <table className="forecast-table">
        <thead>
          <tr>
            <th>Stage</th>
            <th>Deals</th>
            <th>Total Value</th>
            <th>Weighted Forecast</th>
            <th>Avg Deal Size</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.byStage).map(([stage, stats]) => (
            <tr key={stage}>
              <td>{stage}</td>
              <td>{stats.count}</td>
              <td>${(stats.totalValue / 1000).toFixed(0)}K</td>
              <td>${(stats.weightedForecast / 1000).toFixed(0)}K</td>
              <td>${(stats.avgDealSize / 1000).toFixed(0)}K</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RisksReport = ({ data, loading }) => {
  if (loading) return <div className="loading">Loading risks...</div>;
  if (!data || data.length === 0) {
    return <div className="empty-state">No high-risk deals</div>;
  }

  return (
    <div className="report-section">
      <div className="risks-list">
        {data.map((risk) => (
          <div
            key={risk.opportunityId}
            className={`risk-card risk-${risk.riskLevel.toLowerCase()}`}
          >
            <div className="risk-header">
              <h4>{risk.opportunityName}</h4>
              <div className="risk-score">{risk.riskScore}/100</div>
            </div>
            <div className="risk-details">
              <span className={`risk-badge ${risk.riskLevel.toLowerCase()}`}>
                {risk.riskLevel} Risk
              </span>
              <span className="days-to-close">
                {risk.daysToClose > 0
                  ? `${risk.daysToClose} days to close`
                  : 'Overdue'}
              </span>
            </div>
            <div className="risk-factors">
              {risk.risks.map((factor, i) => (
                <div key={i} className="risk-factor">
                  ⚠️ {factor}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeamPerformanceReport = ({ data, loading, error }) => {
  if (loading) return <div className="loading">Loading team data...</div>;
  if (error) {
    return (
      <div className="empty-state">
        Team performance is only available to managers and admins.
      </div>
    );
  }
  if (!data || Object.keys(data).length === 0) {
    return <div className="empty-state">No team data</div>;
  }

  return (
    <div className="report-section">
      <table className="team-performance-table">
        <thead>
          <tr>
            <th>Rep</th>
            <th>Deals</th>
            <th>Total Value</th>
            <th>Win Rate</th>
            <th>Avg Deal Size</th>
            <th>Closed Won</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([repId, stats]) => (
            <tr key={repId}>
              <td>{stats.ownerName || `Rep ${repId.substring(0, 8)}`}</td>
              <td>{stats.totalDeals}</td>
              <td>${(stats.totalValue / 1000).toFixed(0)}K</td>
              <td>{stats.winRate}%</td>
              <td>${(stats.avgDealSize / 1000).toFixed(0)}K</td>
              <td>{stats.closedWon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MetricCard = ({ label, value, trend }) => (
  <div className="metric-card">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    {trend && (
      <div className={`metric-trend ${trend}`}>
        {trend === 'up' ? '↑' : '↓'} Trending {trend}
      </div>
    )}
  </div>
);