import './Logo.css';

/**
 * Logo - Shared brand mark for Sales Pipeline Intelligence.
 * Icon: ascending pipeline stage bars with an upward trend line, rendered
 * on the brand gradient. Reused across the Navbar, Footer, and auth pages
 * so the brand reads consistently everywhere it appears.
 */
export const Logo = ({
  size = 32,
  showText = true,
  stacked = false,
  onDark = false,
  className = '',
}) => {
  const classes = [
    'brand-logo',
    stacked ? 'brand-logo--stacked' : 'brand-logo--inline',
    onDark ? 'brand-logo--on-dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      <svg
        className="brand-logo-icon"
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="spiLogoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#667eea" />
            <stop offset="1" stopColor="#764ba2" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#spiLogoGradient)" />
        <path
          d="M11 27V18.5M20 27V12M29 27V21.5"
          stroke="#ffffff"
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          d="M10.5 16.5L15 12.5L19.5 15.5L26 8.5"
          stroke="#4ade80"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="27.5" cy="7" r="2.1" fill="#4ade80" />
      </svg>

      {showText && (
        <span className="brand-logo-text">
          <span className="brand-logo-text-main">Sales Pipeline</span>
          <span className="brand-logo-text-accent">Intelligence</span>
        </span>
      )}
    </span>
  );
};

export default Logo;
