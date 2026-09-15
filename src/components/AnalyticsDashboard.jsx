import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSalesforceData from '../hooks/useSalesforceData';
import api from '../services/api';
import {
  HealthIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UsersIcon,
} from './ui/DashboardIcons';
import {
  MetricCard,
  ReportSectionHeader,
  InsightBanner,
  EmptyState,
  SkeletonReport,
  CountUpValue,
} from './ui/ReportWidgets';
import { gridVariants } from './ui/reportWidgetUtils';
import './AnalyticsDashboard.css';
import './SaaSMetricsDashboard.css';

const TABS = [
  { id: 'health', label: 'Pipeline Health', icon: HealthIcon },
  { id: 'forecast', label: 'Revenue Forecast', icon: TrendingUpIcon },
  { id: 'risks', label: 'Deal Risks', icon: AlertTriangleIcon },
  { id: 'team', label: 'Team Performance', icon: UsersIcon },
];

const formatPercent1 = (n) => `${n.toFixed(1)}%`;
const formatMillions = (n) => `$${(n / 1000000).toFixed(2)}M`;
const formatThousands = (n) => `$${(n / 1000).toFixed(0)}K`;
const formatInt = (n) => Math.round(n);

/**
 * AnalyticsDashboard - reuses the same animated report widgets
 * (MetricCard/ReportSectionHeader/InsightBanner/SkeletonReport) built for
 * SaaSMetricsDashboard.jsx (see ui/ReportWidgets.jsx), so both analytics
 * surfaces in the app share one visual language instead of drifting apart.
 */
export const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState(30);
  const [selectedReport, setSelectedReport] = useState('health');

  const health = useSalesforceData(`/analytics/pipeline-health?range=${dateRange}`, {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });

  const forecast = useSalesforceData('/analytics/forecast', {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });

  const risks = useSalesforceData('/analytics/risks', {
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000,
  });

  const team = useSalesforceData('/analytics/team-performance', {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });

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
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
        </div>
      </motion.div>

      <div className="report-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${selectedReport === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedReport(tab.id)}
          >
            <tab.icon className="tab-icon" width={15} height={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedReport}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {selectedReport === 'health' && (
            <PipelineHealthReport {...health} onExport={() => handleExport('csv')} onExportPdf={() => handleExport('pdf')} />
          )}
          {selectedReport === 'forecast' && (
            <ForecastReport {...forecast} onExport={() => handleExport('csv')} onExportPdf={() => handleExport('pdf')} />
          )}
          {selectedReport === 'risks' && (
            <RisksReport {...risks} onExport={() => handleExport('csv')} onExportPdf={() => handleExport('pdf')} />
          )}
          {selectedReport === 'team' && (
            <TeamPerformanceReport {...team} onExport={() => handleExport('csv')} onExportPdf={() => handleExport('pdf')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const PipelineHealthReport = ({ data, loading, refetch, lastFetched, onExport, onExportPdf }) => {
  if (loading && !data) return <SkeletonReport variant="chart" />;
  if (!data) return <EmptyState text="No pipeline health data available" />;

  const trend = data.winRate > 30 ? 'up' : 'down';

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={onExport}
        onExportPdf={onExportPdf}
        exportLabel="pipeline health"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={trend === 'up' ? CheckCircleIcon : AlertTriangleIcon} tone={trend === 'up' ? 'positive' : 'warning'}>
        Win rate is {data.winRate}% with {data.closedWonCount} of {data.totalOpportunities} deals closed won, trending{' '}
        {trend}.
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard label="Win Rate" icon={HealthIcon} numericValue={data.winRate} format={formatPercent1} trend={trend} />
        <MetricCard
          label="Total Pipeline Value"
          icon={HealthIcon}
          numericValue={data.totalPipelineValue}
          format={formatMillions}
        />
        <MetricCard label="Average Deal Size" icon={HealthIcon} numericValue={data.avgDealSize} format={formatThousands} />
        <MetricCard label="Closed Won" icon={HealthIcon} numericValue={data.closedWonCount} format={formatInt} />
      </motion.div>

      <div className="stage-distribution">
        <h3>Pipeline Distribution by Stage</h3>
        <div className="stage-bars">
          {Object.entries(data.stageDistribution).map(([stage, count]) => (
            <div key={stage} className="stage-bar">
              <div className="stage-label">{stage}</div>
              <div className="bar-container">
                <motion.div
                  className="bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / data.totalOpportunities) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
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

const ForecastReport = ({ data, loading, refetch, lastFetched, onExport, onExportPdf }) => {
  if (loading && !data) return <SkeletonReport variant="chart" metricsCount={1} />;
  if (!data) return <EmptyState text="No forecast data available" />;

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={onExport}
        onExportPdf={onExportPdf}
        exportLabel="revenue forecast"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={TrendingUpIcon} tone="info">
        Weighted forecast across {Object.keys(data.byStage).length} open stages totals{' '}
        {formatMillions(data.totalForecast)}.
      </InsightBanner>

      <div className="forecast-summary">
        <div className="forecast-card">
          <h3>Total Forecast</h3>
          <div className="forecast-value">
            <CountUpValue value={data.totalForecast} format={formatMillions} />
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
              <td>{formatThousands(stats.totalValue)}</td>
              <td>{formatThousands(stats.weightedForecast)}</td>
              <td>{formatThousands(stats.avgDealSize)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RisksReport = ({ data, loading, refetch, lastFetched, onExport, onExportPdf }) => {
  if (loading && !data) return <SkeletonReport variant="list" />;

  if (!data || data.length === 0) {
    return (
      <div className="report-section">
        <ReportSectionHeader
          onRefresh={refetch}
          loading={loading}
          onExport={onExport}
          onExportPdf={onExportPdf}
          exportLabel="deal risks"
          lastFetched={lastFetched}
        />
        <EmptyState text="No open deals to assess" />
      </div>
    );
  }

  const highCount = data.filter((r) => r.riskLevel === 'High').length;

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={onExport}
        onExportPdf={onExportPdf}
        exportLabel="deal risks"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={highCount > 0 ? AlertTriangleIcon : CheckCircleIcon} tone={highCount > 0 ? 'warning' : 'positive'}>
        {highCount > 0
          ? `${highCount} deal${highCount !== 1 ? 's are' : ' is'} at high risk out of ${data.length} open opportunities.`
          : `No deals are currently at high risk, out of ${data.length} open opportunities.`}
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard label="Deals Assessed" icon={AlertTriangleIcon} numericValue={data.length} format={formatInt} />
        <MetricCard label="High Risk" icon={AlertTriangleIcon} tone="red" numericValue={highCount} format={formatInt} />
      </motion.div>

      <div className="risks-list">
        {data.map((risk) => (
          <div key={risk.opportunityId} className={`risk-card risk-${risk.riskLevel.toLowerCase()}`}>
            <div className="risk-header">
              <h4>{risk.opportunityName}</h4>
              <div className="risk-score">{risk.riskScore}/100</div>
            </div>
            <div className="risk-details">
              <span className={`risk-badge ${risk.riskLevel.toLowerCase()}`}>{risk.riskLevel} Risk</span>
              <span className="days-to-close">
                {risk.daysToClose > 0 ? `${risk.daysToClose} days to close` : 'Overdue'}
              </span>
            </div>
            <div className="risk-factors">
              {risk.risks.map((factor, i) => (
                <div key={i} className="risk-factor">
                  <AlertTriangleIcon width={13} height={13} /> {factor}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeamPerformanceReport = ({ data, loading, error, refetch, lastFetched, onExport, onExportPdf }) => {
  if (loading && !data) return <SkeletonReport variant="list" metricsCount={2} />;

  if (error) {
    return <EmptyState text="Team performance is only available to managers and admins." />;
  }
  if (!data || Object.keys(data).length === 0) {
    return <EmptyState text="No team data available" />;
  }

  const reps = Object.values(data);
  const topRep = [...reps].sort((a, b) => b.totalValue - a.totalValue)[0];

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={onExport}
        onExportPdf={onExportPdf}
        exportLabel="team performance"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={UsersIcon} tone="info">
        {reps.length} rep{reps.length !== 1 ? 's' : ''} tracked
        {topRep ? ` - top performer is ${topRep.ownerName} with ${formatThousands(topRep.totalValue)} in pipeline.` : '.'}
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard label="Reps Tracked" icon={UsersIcon} numericValue={reps.length} format={formatInt} tone="indigo" />
        <MetricCard
          label="Combined Pipeline"
          icon={UsersIcon}
          tone="indigo"
          numericValue={reps.reduce((sum, r) => sum + (r.totalValue || 0), 0)}
          format={formatMillions}
        />
      </motion.div>

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
              <td>{formatThousands(stats.totalValue)}</td>
              <td>{stats.winRate}%</td>
              <td>{formatThousands(stats.avgDealSize)}</td>
              <td>{stats.closedWon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalyticsDashboard;
