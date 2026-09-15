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

export const BriefcaseIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </svg>
);

export const DollarIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3v18" />
    <path d="M16.5 7.5c0-1.7-1.6-2.8-4.5-2.8s-4.5 1.2-4.5 2.8c0 3.6 9 1.7 9 5.4 0 1.7-2 2.9-4.5 2.9s-4.9-1.1-4.9-2.9" />
  </svg>
);

export const ListIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.8-4.8" />
  </svg>
);

export const LayersIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3l9 5-9 5-9-5 9-5Z" />
    <path d="M3 13l9 5 9-5" />
    <path d="M3 8l9 5 9-5" />
  </svg>
);

export const MapPinIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const GridIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

export const LogoutIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 8l-4 4 4 4" />
    <path d="M6 12h12" />
  </svg>
);

export const UsersIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1" />
    <path d="M15 14.6c2.3.3 4 1.8 4.6 4.4" />
  </svg>
);

export const PlusIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const EditIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

export const TrashIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const XIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const MailIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6 8.5-6" />
  </svg>
);

export const PhoneIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M5.5 4h3l1.5 4.5-2 1.5a11 11 0 0 0 5 5l1.5-2L19 14.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 4 4.6 1.5 1.5 0 0 1 5.5 4Z" />
  </svg>
);

export const BuildingIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="4" y="3" width="12" height="18" rx="1" />
    <path d="M8 7h.01M12 7h.01M8 11h.01M12 11h.01M8 15h.01M12 15h.01" />
    <path d="M16 10h4v11h-4" />
  </svg>
);

export const ShieldIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3.5l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9v-5Z" />
    <path d="M9 12l2 2 4-4.2" />
  </svg>
);

export const CalendarIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v4M16 3v4" />
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
