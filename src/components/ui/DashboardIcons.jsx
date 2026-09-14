/* Small inline icon set for the SaaS Metrics dashboard - zero external
   dependencies, same convention as AuthIcons.jsx. */

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const ArrIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 17l5-5 4 4 8-9" />
    <path d="M14 7h6v6" />
  </svg>
);

export const ChurnIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" />
    <path d="M16 4l4 4M20 4l-4 4" />
  </svg>
);

export const HealthIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 12h4l2-6 3 12 2-8 2 4h5" />
  </svg>
);

export const ExpansionIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M8 3H3v5" />
    <path d="M16 21h5v-5" />
    <path d="M21 3l-8 8" />
    <path d="M3 21l8-8" />
  </svg>
);

export const RefreshIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const DownloadIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </svg>
);

export const InfoIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v5.5" />
    <path d="M12 7.6h.01" />
  </svg>
);

export const ClockIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </svg>
);

export const AlertTriangleIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M10.6 4.2 2.9 18a1.8 1.8 0 0 0 1.6 2.7h15a1.8 1.8 0 0 0 1.6-2.7L13.4 4.2a1.8 1.8 0 0 0-2.8 0Z" />
    <path d="M12 9.5V13" />
    <path d="M12 16.2h.01" />
  </svg>
);

export const CheckCircleIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M8 12.3l2.6 2.6L16 9.3" />
  </svg>
);

export const TrendingUpIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 16l6-6 4 4 8-9" />
    <path d="M15 5h6v6" />
  </svg>
);

export const TrendingDownIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 8l6 6 4-4 8 9" />
    <path d="M15 19h6v-6" />
  </svg>
);

export const EmptyBoxIllustration = (props) => (
  <svg
    width={120}
    height={100}
    viewBox="0 0 120 100"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <ellipse cx="60" cy="86" rx="38" ry="6" fill="#f3f4f6" />
    <path
      d="M20 40 60 24l40 16v34a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V40Z"
      fill="#f9fafb"
      stroke="#d1d5db"
      strokeWidth="1.8"
    />
    <path d="M20 40l40 16 40-16" stroke="#d1d5db" strokeWidth="1.8" fill="none" />
    <path d="M60 56V96" stroke="#d1d5db" strokeWidth="1.8" />
    <path d="M60 24 20 40l8 4 40-16-8-4Z" fill="#e5e7eb" />
    <path
      d="M45 12h30"
      stroke="#c7cbe8"
      strokeWidth="1.8"
      strokeDasharray="2 5"
      strokeLinecap="round"
    />
  </svg>
);
