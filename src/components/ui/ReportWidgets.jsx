import { motion } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';
import { cardVariants, timeAgo } from './reportWidgetUtils';
import {
  RefreshIcon,
  DownloadIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EmptyBoxIllustration,
} from './DashboardIcons';
// .report-metrics/.metric-card and friends are defined here, not in a
// dedicated ReportWidgets.css - this component needs them immediately
// wherever it's used (including App.jsx's home Dashboard, which is never
// lazy-loaded), so it owns importing them itself rather than relying on a
// consumer to import AnalyticsDashboard.css first. AnalyticsDashboard.jsx/
// SaaSMetricsDashboard.jsx also import the same file directly - harmless,
// CSS imports are idempotent.
import '../AnalyticsDashboard.css';

/**
 * ReportWidgets - animated report building blocks (metric cards, skeleton
 * loaders, insight banners, section headers) originally built for
 * SaaSMetricsDashboard.jsx and extracted here so AnalyticsDashboard.jsx
 * reuses the exact same polish instead of a second, drifting copy. Styling
 * lives in AnalyticsDashboard.css (.metric-card, .report-metrics, ...) and
 * SaaSMetricsDashboard.css (.metric-icon-chip, .insight-banner, .skeleton,
 * .icon-btn, ...) - neither of those class names are scoped to
 * .saas-metrics-dashboard, so any page importing both stylesheets gets the
 * same look for free.
 */

export const CountUpValue = ({ value, format = (n) => n }) => {
  const current = useCountUp(value, { duration: 800 });
  return format(current);
};

export const MetricCard = ({
  label,
  numericValue,
  format = (n) => n,
  trend,
  icon: Icon,
  tone = 'purple',
  footer,
}) => (
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
    {footer && <div className="metric-card-footer">{footer}</div>}
  </motion.div>
);

/**
 * @param {() => void} [onExport] - if provided, renders a "Export CSV" button
 * @param {() => void} [onExportPdf] - if provided, renders a "Export PDF" button
 */
export const ReportSectionHeader = ({ onRefresh, loading, onExport, onExportPdf, exportLabel, lastFetched }) => (
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
      {onExport && (
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
      )}
      {onExportPdf && (
        <motion.button
          type="button"
          className="icon-btn"
          onClick={onExportPdf}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`Export ${exportLabel} as PDF`}
        >
          <DownloadIcon />
          Export PDF
        </motion.button>
      )}
    </div>
  </div>
);

export const InsightBanner = ({ icon: Icon, tone = 'info', children }) => (
  <div className={`insight-banner insight-banner--${tone}`}>
    <Icon width={18} height={18} />
    <span>{children}</span>
  </div>
);

export const EmptyState = ({ text }) => (
  <div className="empty-state">
    <EmptyBoxIllustration />
    <p>{text}</p>
  </div>
);

export const SkeletonMetrics = ({ count = 3 }) => (
  <div className="report-metrics">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="metric-card">
        <div className="skeleton" style={{ width: '55%', height: 12, marginBottom: '0.75rem' }} />
        <div className="skeleton" style={{ width: '75%', height: 26 }} />
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ count = 4 }) => (
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

export const SkeletonReport = ({ variant = 'list', metricsCount = 3, listCount = 4 }) => (
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
