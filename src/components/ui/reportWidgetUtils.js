// Non-component helpers used by ReportWidgets.jsx and its consumers
// (AnalyticsDashboard.jsx, SaaSMetricsDashboard.jsx). Kept out of
// ReportWidgets.jsx itself because react-refresh/only-export-components
// requires a file to export only components for Fast Refresh to work.

export const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const timeAgo = (date) => {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};
