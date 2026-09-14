import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSalesforceData from '../hooks/useSalesforceData';
import { useCountUp } from '../hooks/useCountUp';
import { toCsv, downloadCsv, todayStamp } from '../utils/csvExport';
import { InfoTooltip } from './ui/InfoTooltip';
import {
  ArrIcon,
  ChurnIcon,
  HealthIcon,
  ExpansionIcon,
  RefreshIcon,
  DownloadIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EmptyBoxIllustration,
} from './ui/DashboardIcons';
import './AnalyticsDashboard.css';
import './SaaSMetricsDashboard.css';

const TABS = [
  { id: 'arr', label: 'ARR Forecast', icon: ArrIcon },
  { id: 'churn', label: 'Churn Risk', icon: ChurnIcon },
  { id: 'health', label: 'Customer Health', icon: HealthIcon },
  { id: 'expansion', label: 'Expansion Opportunities', icon: ExpansionIcon },
];

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * SaaSMetricsDashboard - Day 7/8: SaaS/Technology industry vertical
 * analytics with Day 8's animated, icon-led, enterprise-polish pass (tab
 * transitions, count-up KPIs, skeleton loading, per-tab refresh/export,
 * insight banners, tooltips). Reuses AnalyticsDashboard.css's global
 * classes; SaaSMetricsDashboard.css adds only the genuinely new pieces.
 */
export const SaaSMetricsDashboard = () => {
  const [selectedReport, setSelectedReport] = useState('arr');

  const arr = useSalesforceData('/saas-metrics/arr-forecast', {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });
  const churn = useSalesforceData('/saas-metrics/churn-risk', {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });
  const health = useSalesforceData('/saas-metrics/customer-health', {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });
  const expansion = useSalesforceData('/saas-metrics/expansion-opportunities', {
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });

  return (
    <div className="analytics-dashboard saas-metrics-dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>SaaS Metrics</h1>
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
          {selectedReport === 'arr' && <ArrForecastReport {...arr} />}
          {selectedReport === 'churn' && <ChurnRiskReport {...churn} />}
          {selectedReport === 'health' && <CustomerHealthReport {...health} />}
          {selectedReport === 'expansion' && <ExpansionReport {...expansion} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// SHARED HELPERS
// ============================================================================

const formatCurrency = (value) => {
  const amount = value || 0;
  if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const formatPercent = (value) => `${value >= 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
const formatInt = (value) => Math.round(value || 0);

const timeAgo = (date) => {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const CountUpValue = ({ value, format = (n) => n }) => {
  const current = useCountUp(value, { duration: 800 });
  return format(current);
};

const MetricCard = ({ label, numericValue, format = (n) => n, trend, icon: Icon, tone = 'purple' }) => (
  <motion.div className="metric-card" variants={cardVariants}>
    <div className="metric-card-top">
      {Icon && (
        <span className={`metric-icon-chip metric-icon-chip--${tone}`}>
          <Icon width={16} height={16} />
        </span>
      )}
      <div className="metric-label">{label}</div>
    </div>
    <div className="metric-value">
      <CountUpValue value={numericValue} format={format} />
    </div>
    {trend && (
      <div className={`metric-trend ${trend}`}>
        {trend === 'up' ? <TrendingUpIcon width={14} height={14} /> : <TrendingDownIcon width={14} height={14} />}
        Trending {trend}
      </div>
    )}
  </motion.div>
);

const ReportSectionHeader = ({ onRefresh, loading, onExport, exportLabel, lastFetched }) => (
  <div className="report-section-header">
    {lastFetched && (
      <span className="last-updated">
        <ClockIcon width={14} height={14} />
        Updated {timeAgo(lastFetched)}
      </span>
    )}
    <div className="report-section-actions">
      <motion.button
        type="button"
        className="icon-btn"
        onClick={onRefresh}
        disabled={loading}
        whileHover={!loading ? { scale: 1.03 } : undefined}
        whileTap={!loading ? { scale: 0.97 } : undefined}
        aria-label={`Refresh ${exportLabel} data`}
      >
        <RefreshIcon className={loading ? 'icon-spin' : ''} />
        Refresh
      </motion.button>
      <motion.button
        type="button"
        className="icon-btn"
        onClick={onExport}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={`Export ${exportLabel} as CSV`}
      >
        <DownloadIcon />
        Export CSV
      </motion.button>
    </div>
  </div>
);

const InsightBanner = ({ icon: Icon, tone = 'info', children }) => (
  <div className={`insight-banner insight-banner--${tone}`}>
    <Icon width={18} height={18} />
    <span>{children}</span>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="empty-state">
    <EmptyBoxIllustration />
    <p>{text}</p>
  </div>
);

const SkeletonMetrics = ({ count = 3 }) => (
  <div className="report-metrics">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="metric-card">
        <div className="skeleton" style={{ width: '55%', height: 12, marginBottom: '0.75rem' }} />
        <div className="skeleton" style={{ width: '75%', height: 26 }} />
      </div>
    ))}
  </div>
);

const SkeletonList = ({ count = 4 }) => (
  <div className="risks-list">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="risk-card">
        <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: '0.85rem' }} />
        <div className="skeleton" style={{ width: '65%', height: 10, marginBottom: '0.6rem' }} />
        <div className="skeleton" style={{ width: '50%', height: 10 }} />
      </div>
    ))}
  </div>
);

const SkeletonReport = ({ variant = 'list', metricsCount = 3, listCount = 4 }) => (
  <div className="report-section">
    <SkeletonMetrics count={metricsCount} />
    {variant === 'list' && <SkeletonList count={listCount} />}
    {variant === 'chart' && (
      <div className="stage-distribution">
        <div className="skeleton" style={{ width: '28%', height: 16, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: '8px' }} />
      </div>
    )}
  </div>
);

// ============================================================================
// ARR FORECAST
// ============================================================================

const ArrForecastReport = ({ data, loading, refetch, lastFetched }) => {
  if (loading && !data) return <SkeletonReport variant="chart" />;
  if (!data) return <EmptyState text="No ARR data available" />;

  const lastForecast = data.forecast?.[data.forecast.length - 1];
  const trend = data.growthRate >= 0 ? 'up' : 'down';

  const handleExport = () => {
    const rows = [
      ...(data.monthlyTrend || []).map((m) => ({ ...m, isForecast: 'No' })),
      ...(data.forecast || []).map((f) => ({
        month: f.month,
        revenue: f.projectedNewBookings,
        cumulativeArr: f.projectedArr,
        isForecast: 'Yes',
      })),
    ];
    const csv = toCsv(rows, [
      { key: 'month', label: 'Month' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cumulativeArr', label: 'CumulativeARR' },
      { key: 'isForecast', label: 'IsForecast' },
    ]);
    downloadCsv(`saas-arr-forecast-${todayStamp()}.csv`, csv);
  };

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={handleExport}
        exportLabel="ARR forecast"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={trend === 'up' ? TrendingUpIcon : TrendingDownIcon} tone={trend === 'up' ? 'positive' : 'warning'}>
        ARR {trend === 'up' ? 'grew' : 'declined'} {Math.abs(data.growthRate)}% recently, projected to reach{' '}
        {formatCurrency(lastForecast?.projectedArr)} by {lastForecast?.month}.
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard
          label="Current ARR (Estimate)"
          icon={ArrIcon}
          numericValue={data.currentArrEstimate}
          format={formatCurrency}
        />
        <MetricCard
          label="Recent Growth Rate"
          icon={ArrIcon}
          numericValue={data.growthRate}
          format={formatPercent}
          trend={trend}
        />
        <MetricCard
          label={`Projected ARR (${lastForecast?.month || 'N/A'})`}
          icon={ArrIcon}
          numericValue={lastForecast?.projectedArr}
          format={formatCurrency}
        />
      </motion.div>

      <p className="methodology-note">
        <strong>Estimated metric:</strong> {data.methodology}
      </p>

      <motion.div
        className="stage-distribution"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <h3>ARR Trend & Forecast</h3>
        <ArrTrendChart monthlyTrend={data.monthlyTrend} forecast={data.forecast} />
      </motion.div>

      <table className="forecast-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>New Bookings</th>
            <th>Cumulative ARR</th>
          </tr>
        </thead>
        <tbody>
          {data.monthlyTrend?.slice(-6).map((m) => (
            <tr key={m.month}>
              <td>{m.month}</td>
              <td>{formatCurrency(m.revenue)}</td>
              <td>{formatCurrency(m.cumulativeArr)}</td>
            </tr>
          ))}
          {data.forecast?.map((f) => (
            <tr key={f.month} className="forecast-row">
              <td>{f.month} (forecast)</td>
              <td>{formatCurrency(f.projectedNewBookings)}</td>
              <td>{formatCurrency(f.projectedArr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ArrTrendChart = ({ monthlyTrend, forecast }) => {
  if (!monthlyTrend?.length) return null;

  const width = 600;
  const height = 200;
  const padding = 24;

  const historicalPoints = monthlyTrend.map((m) => ({ month: m.month, value: m.cumulativeArr }));
  const forecastPoints = (forecast || []).map((f) => ({ month: f.month, value: f.projectedArr }));
  const allValues = [...historicalPoints, ...forecastPoints].map((p) => p.value);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(0, ...allValues);

  const totalPoints = historicalPoints.length + forecastPoints.length;
  const xStep = totalPoints > 1 ? (width - padding * 2) / (totalPoints - 1) : 0;

  const toXY = (value, index) => {
    const x = padding + index * xStep;
    const y =
      height - padding - ((value - minValue) / (maxValue - minValue || 1)) * (height - padding * 2);
    return [x, y];
  };

  const historicalCoords = historicalPoints.map((p, i) => toXY(p.value, i));
  const forecastCoords = forecastPoints.map((p, i) =>
    toXY(p.value, historicalPoints.length - 1 + i + 1)
  );

  // The forecast line continues seamlessly from the last historical point.
  const bridgedForecastCoords = historicalCoords.length
    ? [historicalCoords[historicalCoords.length - 1], ...forecastCoords]
    : forecastCoords;

  const toPolylinePoints = (coords) => coords.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <svg
      className="arr-trend-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="ARR trend and forecast chart"
    >
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        className="arr-chart-axis"
      />

      {historicalCoords.length > 0 && (
        <polyline points={toPolylinePoints(historicalCoords)} className="arr-chart-line-actual" />
      )}
      {bridgedForecastCoords.length > 1 && (
        <polyline points={toPolylinePoints(bridgedForecastCoords)} className="arr-chart-line-forecast" />
      )}

      {historicalCoords.map(([x, y], i) => (
        <circle key={`h-${i}`} cx={x} cy={y} r={2.5} className="arr-chart-dot-actual" />
      ))}
      {forecastCoords.map(([x, y], i) => (
        <circle key={`f-${i}`} cx={x} cy={y} r={2.5} className="arr-chart-dot-forecast" />
      ))}

      <text x={padding} y={height - 6} className="arr-chart-label">
        {historicalPoints[0]?.month}
      </text>
      <text x={width - padding} y={height - 6} textAnchor="end" className="arr-chart-label">
        {forecastPoints[forecastPoints.length - 1]?.month || historicalPoints[historicalPoints.length - 1]?.month}
      </text>
    </svg>
  );
};

// ============================================================================
// CHURN RISK
// ============================================================================

const ChurnRiskReport = ({ data, loading, refetch, lastFetched }) => {
  if (loading && !data) return <SkeletonReport variant="list" />;

  const handleExport = () => {
    const rows = (data || []).map((r) => ({ ...r, reasons: r.reasons.join('; ') }));
    const csv = toCsv(rows, [
      { key: 'accountName', label: 'AccountName' },
      { key: 'churnScore', label: 'ChurnScore' },
      { key: 'riskLevel', label: 'RiskLevel' },
      { key: 'daysSinceLastWin', label: 'DaysSinceLastWin' },
      { key: 'openPipelineValue', label: 'OpenPipelineValue' },
      { key: 'reasons', label: 'Reasons' },
    ]);
    downloadCsv(`saas-churn-risk-${todayStamp()}.csv`, csv);
  };

  if (!data || data.length === 0) {
    return (
      <div className="report-section">
        <ReportSectionHeader
          onRefresh={refetch}
          loading={loading}
          onExport={handleExport}
          exportLabel="churn risk"
          lastFetched={lastFetched}
        />
        <EmptyState text="No accounts with enough activity to score" />
      </div>
    );
  }

  const highCount = data.filter((r) => r.riskLevel === 'High').length;
  const mediumCount = data.filter((r) => r.riskLevel === 'Medium').length;
  const lowCount = data.filter((r) => r.riskLevel === 'Low').length;
  const highRiskPipeline = data
    .filter((r) => r.riskLevel === 'High')
    .reduce((sum, r) => sum + (r.openPipelineValue || 0), 0);

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={handleExport}
        exportLabel="churn risk"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={highCount > 0 ? AlertTriangleIcon : CheckCircleIcon} tone={highCount > 0 ? 'warning' : 'positive'}>
        {highCount > 0
          ? `${highCount} account${highCount !== 1 ? 's' : ''} at high churn risk - review open pipeline of ${formatCurrency(highRiskPipeline)}.`
          : 'No accounts are currently at high churn risk.'}
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard label="High Risk Accounts" icon={AlertTriangleIcon} tone="red" numericValue={highCount} format={formatInt} />
        <MetricCard label="Medium Risk Accounts" icon={AlertTriangleIcon} tone="red" numericValue={mediumCount} format={formatInt} />
        <MetricCard label="Low Risk Accounts" icon={AlertTriangleIcon} tone="red" numericValue={lowCount} format={formatInt} />
      </motion.div>

      <div className="section-heading-row">
        <h3>Accounts by Churn Score</h3>
        <InfoTooltip text="Combines recency of last win, account activity, open pipeline presence, loss ratio, and deal-value trend. Higher score = more risk." />
      </div>

      <div className="risks-list">
        {data.map((risk) => (
          <div key={risk.accountId} className={`risk-card risk-${risk.riskLevel.toLowerCase()}`}>
            <div className="risk-header">
              <h4>{risk.accountName}</h4>
              <div className="risk-score">{risk.churnScore}/100</div>
            </div>
            <div className="risk-details">
              <span className={`risk-badge ${risk.riskLevel.toLowerCase()}`}>{risk.riskLevel} Risk</span>
              <span>
                {risk.daysSinceLastWin !== null
                  ? `${risk.daysSinceLastWin}d since last win`
                  : 'Never won a deal'}
              </span>
              <span>Open pipeline: {formatCurrency(risk.openPipelineValue)}</span>
            </div>
            <div className="risk-factors">
              {risk.reasons.map((reason, i) => (
                <div key={i} className="risk-factor">
                  <AlertTriangleIcon width={13} height={13} /> {reason}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CUSTOMER HEALTH
// ============================================================================

const categoryClass = (category) =>
  category === 'Healthy' ? 'healthy' : category === 'Neutral' ? 'neutral' : 'at-risk';

const CustomerHealthReport = ({ data, loading, refetch, lastFetched }) => {
  if (loading && !data) return <SkeletonReport variant="list" />;

  const handleExport = () => {
    const rows = (data || []).map((h) => ({
      accountName: h.accountName,
      healthScore: h.healthScore,
      category: h.healthCategory,
      engagement: h.breakdown.engagement,
      financial: h.breakdown.financial,
      growth: h.breakdown.growth,
      winRate: h.breakdown.winRate,
    }));
    const csv = toCsv(rows, [
      { key: 'accountName', label: 'AccountName' },
      { key: 'healthScore', label: 'HealthScore' },
      { key: 'category', label: 'Category' },
      { key: 'engagement', label: 'Engagement' },
      { key: 'financial', label: 'Financial' },
      { key: 'growth', label: 'Growth' },
      { key: 'winRate', label: 'WinRate' },
    ]);
    downloadCsv(`saas-customer-health-${todayStamp()}.csv`, csv);
  };

  if (!data || data.length === 0) {
    return (
      <div className="report-section">
        <ReportSectionHeader
          onRefresh={refetch}
          loading={loading}
          onExport={handleExport}
          exportLabel="customer health"
          lastFetched={lastFetched}
        />
        <EmptyState text="No accounts with enough activity to score" />
      </div>
    );
  }

  const avgScore = Math.round(data.reduce((sum, h) => sum + h.healthScore, 0) / data.length);
  const healthyCount = data.filter((h) => h.healthCategory === 'Healthy').length;
  const atRiskCount = data.filter((h) => h.healthCategory === 'At Risk').length;

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={handleExport}
        exportLabel="customer health"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={atRiskCount > 0 ? AlertTriangleIcon : CheckCircleIcon} tone={atRiskCount > 0 ? 'warning' : 'positive'}>
        Average health score is {avgScore}/100; {atRiskCount} account{atRiskCount !== 1 ? 's' : ''} need attention.
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard label="Average Health Score" icon={HealthIcon} tone="green" numericValue={avgScore} format={(n) => `${formatInt(n)}/100`} />
        <MetricCard label="Healthy Accounts" icon={HealthIcon} tone="green" numericValue={healthyCount} format={formatInt} />
        <MetricCard label="At-Risk Accounts" icon={HealthIcon} tone="green" numericValue={atRiskCount} format={formatInt} />
      </motion.div>

      <div className="section-heading-row">
        <h3>Accounts by Health Score</h3>
        <InfoTooltip text="Composite of Engagement (0-30), Financial value (0-25), Growth trend (0-25) and Win Rate (0-20)." />
      </div>

      <div className="health-score-list">
        {data.map((account) => (
          <div key={account.accountId} className="health-score-card">
            <HealthScoreRing score={account.healthScore} category={categoryClass(account.healthCategory)} />

            <div className="health-score-body">
              <div className="health-score-header">
                <h4>{account.accountName}</h4>
                <span className={`health-badge ${categoryClass(account.healthCategory)}`}>
                  {account.healthCategory}
                </span>
              </div>

              <div className="health-breakdown">
                <HealthBreakdownBar label="Engagement" value={account.breakdown.engagement} max={30} />
                <HealthBreakdownBar label="Financial" value={account.breakdown.financial} max={25} />
                <HealthBreakdownBar label="Growth" value={account.breakdown.growth} max={25} />
                <HealthBreakdownBar label="Win Rate" value={account.breakdown.winRate} max={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HealthScoreRing = ({ score, category }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg className={`health-score-ring health-score-ring--${category}`} viewBox="0 0 64 64" width="64" height="64">
      <circle cx="32" cy="32" r={radius} className="health-score-ring-track" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        className="health-score-ring-value"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" className="health-score-ring-text">
        {score}
      </text>
    </svg>
  );
};

const HealthBreakdownBar = ({ label, value, max }) => (
  <div className="health-breakdown-row">
    <span className="health-breakdown-label">{label}</span>
    <div className="bar-container">
      <div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="health-breakdown-value">
      {value}/{max}
    </span>
  </div>
);

// ============================================================================
// EXPANSION OPPORTUNITIES
// ============================================================================

const ExpansionReport = ({ data, loading, refetch, lastFetched }) => {
  if (loading && !data) return <SkeletonReport variant="list" metricsCount={2} listCount={3} />;

  const handleExport = () => {
    const rows = (data || []).map((c) => ({ ...c, reasons: c.reasons.join('; ') }));
    const csv = toCsv(rows, [
      { key: 'accountName', label: 'AccountName' },
      { key: 'currentValue', label: 'CurrentValue' },
      { key: 'healthScore', label: 'HealthScore' },
      { key: 'expansionScore', label: 'ExpansionScore' },
      { key: 'suggestedAction', label: 'SuggestedAction' },
      { key: 'reasons', label: 'Reasons' },
    ]);
    downloadCsv(`saas-expansion-opportunities-${todayStamp()}.csv`, csv);
  };

  if (!data || data.length === 0) {
    return (
      <div className="report-section">
        <ReportSectionHeader
          onRefresh={refetch}
          loading={loading}
          onExport={handleExport}
          exportLabel="expansion opportunities"
          lastFetched={lastFetched}
        />
        <EmptyState text="No expansion opportunities identified right now" />
      </div>
    );
  }

  const totalValue = data.reduce((sum, c) => sum + (c.currentValue || 0), 0);

  return (
    <div className="report-section">
      <ReportSectionHeader
        onRefresh={refetch}
        loading={loading}
        onExport={handleExport}
        exportLabel="expansion opportunities"
        lastFetched={lastFetched}
      />

      <InsightBanner icon={TrendingUpIcon} tone="positive">
        {data.length} account{data.length !== 1 ? 's' : ''} show expansion signals worth {formatCurrency(totalValue)} in
        current value.
      </InsightBanner>

      <motion.div className="report-metrics" variants={gridVariants} initial="hidden" animate="show">
        <MetricCard label="Expansion Candidates" icon={ExpansionIcon} tone="indigo" numericValue={data.length} format={formatInt} />
        <MetricCard label="Total Current Value" icon={ExpansionIcon} tone="indigo" numericValue={totalValue} format={formatCurrency} />
      </motion.div>

      <div className="expansion-list">
        {data.map((candidate) => (
          <div key={candidate.accountId} className="expansion-card">
            <div className="risk-header">
              <h4>{candidate.accountName}</h4>
              <div className="risk-score">{formatCurrency(candidate.currentValue)}</div>
            </div>
            <div className="risk-details">
              <span className="risk-badge low">Health {candidate.healthScore}/100</span>
              <span>{candidate.expansionScore} expansion signal(s)</span>
            </div>
            <div className="risk-factors">
              {candidate.reasons.map((reason, i) => (
                <div key={i} className="risk-factor">
                  <CheckCircleIcon width={13} height={13} /> {reason}
                </div>
              ))}
            </div>
            {candidate.suggestedAction && (
              <div className="expansion-action">Suggested action: {candidate.suggestedAction}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaaSMetricsDashboard;
