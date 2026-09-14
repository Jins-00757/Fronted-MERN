import { InfoIcon } from './DashboardIcons';
import './InfoTooltip.css';

/**
 * InfoTooltip - CSS-only hover/focus tooltip (no JS state), used to explain
 * methodology next to a heading (e.g. "Churn Score", "Health Score").
 */
export const InfoTooltip = ({ text }) => (
  <span className="info-tooltip" tabIndex={0}>
    <InfoIcon width={14} height={14} />
    <span className="info-tooltip-bubble" role="tooltip">
      {text}
    </span>
  </span>
);

export default InfoTooltip;
