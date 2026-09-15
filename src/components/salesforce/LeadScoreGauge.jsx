const TIER_COLORS = {
  Hot: { ring: '#ef4444', glow: 'rgba(239, 68, 68, 0.18)', text: '#ef4444' },
  Warm: { ring: '#f59e0b', glow: 'rgba(245, 158, 11, 0.18)', text: '#d97706' },
  Cold: { ring: '#3b82f6', glow: 'rgba(59, 130, 246, 0.16)', text: '#2563eb' },
};

/**
 * LeadScoreGauge - circular progress ring showing a lead's 0-100 score,
 * color-coded by tier (Hot/Warm/Cold, matching Salesforce's own Rating
 * picklist values - see LeadScoringService.js). This is the app's
 * signature visual for lead scoring: every other list view in this app
 * (Opportunities, Accounts) is a plain table/kanban card, so leads get
 * their own distinct identity built around "the number that matters."
 *
 * Pure presentational - `size` controls the rendered diameter, `strokeWidth`
 * the ring thickness. The stroke-dasharray trick draws a full circle and
 * then masks off the un-filled portion, animated via a CSS transition on
 * stroke-dashoffset (see LeadsBoard.css's .score-gauge-ring-fill).
 */
export const LeadScoreGauge = ({ score = 0, tier = 'Cold', size = 64, strokeWidth = 6 }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const colors = TIER_COLORS[tier] || TIER_COLORS.Cold;

  return (
    <div
      className="score-gauge"
      style={{ width: size, height: size, '--gauge-glow': colors.glow }}
      role="img"
      aria-label={`Lead score ${clamped} out of 100, ${tier}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="score-gauge-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="score-gauge-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={colors.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-gauge-label">
        <span className="score-gauge-number" style={{ color: colors.text }}>{clamped}</span>
      </div>
    </div>
  );
};

export default LeadScoreGauge;
