/* Small inline icon set used by the auth forms - zero external dependencies */

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

export const MailIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const LockIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
    <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" />
  </svg>
);

export const UserIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4" />
  </svg>
);

export const EyeIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const EyeOffIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.7A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.4 4.2M7.4 7.2C4.6 8.8 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.35 3.86-.92" />
    <path d="M9.9 10a2.8 2.8 0 0 0 4 4" />
  </svg>
);

export const AlertIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
);
