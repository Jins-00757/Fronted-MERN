# Sales Pipeline Intelligence — Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-6-CA4245?logo=reactrouter&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-13-0055FF?logo=framer&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-client-010101?logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

The React + Vite single-page application for **Sales Pipeline Intelligence**: live Salesforce CRM views, an AI assistant capable of executing multi-step CRM workflows, a quote builder with PDF export, bulk data operations, analytics dashboards, a sales territory map, and real-time team collaboration.

This app talks **only** to its own backend API ([`Backend-MERN`](../Backend-MERN/README.md)) — it never calls Salesforce directly, and never stores an access token in the browser. All authentication is via an httpOnly session cookie set by the backend.

---

## Table of Contents

- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Complete Dependency Reference](#complete-dependency-reference)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started-local-development)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)
- [Project Structure](#project-structure)
- [Routing](#routing)
- [Real-Time Features](#real-time-features)
- [Theming](#theming)
- [Security Notes](#security-notes)
- [Deploying](#deploying)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Feature Highlights

### Salesforce CRM Views
- **Accounts, Contacts, Leads, Opportunities, Contracts, and Quotes** — full browse/search/create/edit views, all reading and writing live Salesforce data through the backend.
- **Kanban-style Opportunities and Leads boards** with drag-and-drop stage changes, live presence avatars, and a conflict-resolution modal that appears when two people edit the same record concurrently.
- **Quote Builder** — a line-item editor with live running totals, PDF generation, one-click emailing to a contact, and AI-assisted discount-justification drafting.
- **Shared record pickers** (Account / Opportunity / Product) — debounced, type-ahead search-and-select widgets used consistently across every form that needs to reference a Salesforce record, instead of requiring a raw Salesforce ID.
- **Sales territory map** — an interactive Leaflet map of every Account, geocoded and annotated with opportunity count/value.

### AI Assistant & AI-Powered Search
- A floating **chat widget** for general CRM help.
- An **"Actions" mode** toggle that upgrades the same widget into a full **CRM Actions Assistant**: it can look up real Salesforce records and propose multi-step workflows (e.g. *"create an Account, add an Opportunity, and generate a Quote"*), presented as a single confirm/cancel card — nothing is written to Salesforce until you explicitly confirm.
- **AI-powered natural-language search** ("show me won deals over $50k in Q3, newest first") that gets parsed into real filter criteria you can review before running.
- Row-level AI actions surfaced directly on records: quote email drafting, quote risk badges, discount-justification drafting, account activity summaries, and opportunity executive summaries.

### Bulk Data Operations
- **Bulk Insert / Update / Upsert / Delete** against Salesforce, from pasted JSON or an uploaded CSV, with live job-status polling and downloadable success/failure results.
- **CSV export** of any object type with search and date-range filters.
- A built-in **"Limits & Best Practices" guide** — a reference modal covering Salesforce's official Bulk API governor limits, recommended steps, and security considerations, sourced directly from Salesforce's own documentation.

### Analytics & Reporting
- **Analytics dashboard** — pipeline health, forecast, deal-risk, and team-performance reports.
- **SaaS Metrics dashboard** — ARR forecast, churn risk, customer health, and expansion opportunities, each with its own CSV export.
- Custom animated metric cards, count-up numbers, and a circular lead-score gauge — built without a charting library dependency.

### Real-Time Collaboration
- **Live presence** — see who else is online and who's currently viewing the record you have open.
- **Live notifications** — a bell/dropdown feed of record changes, deals closing, and other events pushed the instant they happen.
- **Global activity toaster** and a **"deal won" celebration** animation triggered by real-time events from teammates.
- A slide-over **activity feed** of recent CRUD history.

### Account, Security & Access
- **Two-Factor Authentication** — enable/disable TOTP 2FA from the Profile page, with QR-code setup and backup-code management; the Login page adds a 2FA code-entry step automatically when it's enabled.
- **Salesforce connection management** — connect/disconnect the org from the app, entirely via a server-side OAuth redirect.
- Profile editing, password change, and account deactivation ("danger zone").

### Everything Else
- **Command Palette** (`Ctrl`/`Cmd` + `K`) for instant navigation and quick actions (theme toggle, logout) — entirely client-side, no backend calls.
- **Light/dark theme**, respecting your OS preference on first visit and persisted thereafter.
- A **multi-step signup wizard** (Account → Role → Territory → Review).
- Static **legal/compliance pages** — Privacy Policy, Terms of Service, Security Policy, Cookie Policy — reachable without logging in.

---

## Tech Stack

| Concern | Technology |
|---|---|
| UI framework | React 19 |
| Build tool / dev server | Vite 8 |
| Routing | React Router 6 (`BrowserRouter`) |
| Animation | Framer Motion 13 |
| HTTP client | Axios (`withCredentials: true` for cookie-based auth) |
| Real-time | `socket.io-client` (presence) + the browser's native `WebSocket` API (live notifications) |
| Maps | Leaflet + React-Leaflet (sales territory map) |
| Validation | Zod |
| Styling | Plain CSS with light/dark theme tokens (`src/styles/global.css`) — no CSS framework |
| Linting | ESLint 10 (flat config) + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` |

---

## Complete Dependency Reference

Every package in `package.json`, with no omissions:

<details>
<summary><strong>Production dependencies (9)</strong></summary>

| Package | Version | Purpose |
|---|---|---|
| `axios` | `^1.20.0` | HTTP client for every call to the backend API |
| `framer-motion` | `^13.2.0` | Animation for page transitions, modals, toasts, kanban boards, and dashboards |
| `leaflet` | `^1.9.4` | The underlying mapping library for the Accounts map |
| `react` | `^19.2.8` | UI framework |
| `react-dom` | `^19.2.8` | React's DOM renderer |
| `react-leaflet` | `^5.0.0` | React bindings for Leaflet |
| `react-router-dom` | `^6.20.0` | Client-side routing |
| `socket.io-client` | `^4.8.3` | Real-time presence (online roster, per-record viewers) |
| `zod` | `^4.6.1` | Schema validation |

</details>

<details>
<summary><strong>Development dependencies (9)</strong></summary>

| Package | Version | Purpose |
|---|---|---|
| `@eslint/js` | `^10.0.1` | ESLint's recommended JS rule set |
| `@types/react` | `^19.2.18` | TypeScript type definitions for React (editor tooling, no build-time type checking) |
| `@types/react-dom` | `^19.2.4` | TypeScript type definitions for React DOM |
| `@vitejs/plugin-react` | `^6.1.0` | Vite's official React plugin (Fast Refresh, JSX transform) |
| `eslint` | `^10.9.0` | Linting |
| `eslint-plugin-react-hooks` | `^7.1.1` | Enforces the Rules of Hooks |
| `eslint-plugin-react-refresh` | `^0.5.4` | Validates components are compatible with Fast Refresh |
| `globals` | `^17.11.0` | Predefined global variable sets for ESLint's flat config |
| `vite` | `^8.2.2` | Build tool and dev server |

</details>

---

## Prerequisites

- **Node.js 18+** (Node 20 LTS recommended) and npm
- The backend ([`Backend-MERN`](../Backend-MERN/README.md)) running and reachable

---

## Getting Started (local development)

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev              # starts Vite on http://localhost:5173
```

By default `VITE_API_URL` is `http://localhost:5005/api`, matching the backend's default port.

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes (functionally) | Base URL the app makes every API call against, e.g. `https://your-backend.onrender.com/api`. Falls back to `http://localhost:5005/api` if unset. |
| `VITE_APP_NAME` | no | Reserved/decorative — not currently read anywhere in the app. |
| `VITE_ENVIRONMENT` | no | Reserved/decorative — not currently read anywhere in the app. |

Vite only exposes variables prefixed `VITE_` to client code, and they're baked into the build at **build time** — changing `VITE_API_URL` requires a rebuild, not just a redeploy of the same artifact.

---

## NPM Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with Hot Module Replacement |
| `npm run build` | Production build to `dist/` (code-split into `vendor-react`, `vendor-motion`, `vendor-leaflet`, and `vendor-realtime` chunks) |
| `npm run preview` | Serve the built `dist/` locally, to sanity-check a production build |
| `npm run lint` | ESLint (flat config, React Hooks + React Refresh rules) |

> There is currently no `test`/`vitest`/`jest` script — see [Known Limitations](#known-limitations).

---

## Project Structure

```
Fronted-MERN/
├── vite.config.js               React plugin, LAN-exposed dev server, manual vendor chunk splitting
├── src/
│   ├── main.jsx                   Entry point: StrictMode + BrowserRouter + Theme/Toast/Auth providers
│   ├── App.jsx                    Full route table + Dashboard
│   │
│   ├── pages/
│   │   ├── Login.jsx, Signup.jsx, ForgotPassword.jsx, ResetPassword.jsx, VerifyEmail.jsx
│   │   ├── Profile.jsx                    Account details, Salesforce connection, security (2FA)
│   │   ├── BulkOperations.jsx             Bulk import/export UI + governor-limits guide
│   │   └── legal/                          Privacy Policy, Terms of Service, Security Policy, Cookie Policy
│   │
│   ├── components/
│   │   ├── salesforce/                     One view per Salesforce object, plus shared widgets
│   │   │   ├── AccountsView.jsx, ContactsView.jsx, ContractsView.jsx
│   │   │   ├── LeadsBoard.jsx, LeadScoreGauge.jsx
│   │   │   ├── OpportunitiesBoard.jsx, OpportunitiesList.jsx
│   │   │   ├── QuoteBuilder.jsx, QuotesView.jsx
│   │   │   ├── AccountsMap.jsx             Leaflet sales territory map
│   │   │   ├── RecordPickers.jsx           Shared Account/Opportunity/Product search-and-select widgets
│   │   │   ├── BulkOperationsGuide.jsx     Bulk API governor-limits/best-practices modal
│   │   │   └── SalesforceConnect.jsx       OAuth connect/disconnect modal
│   │   │
│   │   ├── ui/                             Reusable primitives
│   │   │   ├── Modal.jsx, ConfirmDialog.jsx, ConflictResolutionModal.jsx
│   │   │   ├── Toast.jsx, PresenceAvatars.jsx, InfoTooltip.jsx, Logo.jsx
│   │   │   ├── CommandPalette.jsx          Ctrl/Cmd+K navigation palette
│   │   │   ├── ReportWidgets.jsx           MetricCard, CountUpValue, EmptyState, SkeletonReport, etc.
│   │   │   └── AuthIcons.jsx, DashboardIcons.jsx, ThemeIcons.jsx
│   │   │
│   │   ├── layout/                         Sidebar, Footer
│   │   ├── auth/ProtectedRoute.jsx         Route guard for authenticated pages
│   │   │
│   │   ├── ChatbotWidget.jsx               Floating AI assistant (general chat + "Actions" mode)
│   │   ├── AdvancedSearch.jsx               Filterable search + natural-language "Ask AI" query box
│   │   ├── AnalyticsDashboard.jsx, SaaSMetricsDashboard.jsx
│   │   ├── ActivityFeed.jsx, GlobalActivityToaster.jsx, DealWonCelebration.jsx
│   │   ├── Navbar.jsx, NotificationCenter.jsx
│   │   ├── ProfileCard.jsx, EditProfileModal.jsx, ChangePasswordForm.jsx, TwoFactorSettings.jsx, DangerZone.jsx
│   │
│   ├── context/                    AuthProvider, ThemeProvider, ToastProvider (+ matching `use*` hooks)
│   ├── hooks/
│   │   ├── useSalesforceData.js            Generic fetch/cache/retry/auto-refresh for Salesforce-backed endpoints
│   │   ├── useBulkOperations.js            Bulk job create → upload → poll → results orchestration
│   │   ├── useChatbot.js                   Chat state, history persistence, Actions-mode propose/confirm flow
│   │   ├── useNotifications.js             WebSocket client for live notifications
│   │   ├── usePresence.js                  Socket.IO client for online roster + per-record presence
│   │   └── useCountUp.js                   Animated number counter
│   │
│   ├── services/
│   │   ├── api.js                          Shared Axios instance (cookie-based auth, error normalization)
│   │   └── aiActionsApi.js                 Wrappers for every AI endpoint (row-level actions + the Assistant)
│   │
│   ├── utils/
│   │   ├── permissions.js                  Client-side RBAC mirror (UX only, not a security boundary)
│   │   ├── csvExport.js                    Client-side CSV generation with formula-injection escaping
│   │   ├── secureDownload.js               Redeems single-use backend download tokens as authenticated blobs
│   │   ├── quoteCalculations.js            Line-item/quote total math, mirrored with the backend
│   │   ├── dealEvents.js                   Pub/sub for "deal closed" events across components
│   │   ├── recentSelfActions.js            Dedupes a tab's own WebSocket echo from its toast feed
│   │   └── profileOptions.js               Shared job-function/territory picklists
│   │
│   └── styles/global.css           CSS custom properties driving the light/dark theme
```

---

## Routing

| Path | Access | Renders |
|---|---|---|
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Public (redirects to `/` if already authenticated) | Auth pages |
| `/verify-email` | Always reachable | Email verification |
| `/privacy-policy`, `/terms-of-service`, `/security`, `/cookie-policy` | Public | Legal/compliance pages |
| `/` | Protected | Dashboard |
| `/profile` | Protected | Profile, security, Salesforce connection |
| `/opportunities`, `/leads`, `/contracts`, `/accounts`, `/contacts`, `/quotes` | Protected | Salesforce CRM views |
| `/analytics`, `/saas-metrics` | Protected | Reporting dashboards |
| `/search` | Protected | Advanced/AI-powered search |
| `/bulk-operations` | Protected | Bulk import/export |
| `/map` | Protected | Sales territory map |
| `*` | — | Redirects to `/` (authenticated) or `/login` |

Protected routes are wrapped in `ProtectedRoute` (auth check + loading state) and are `React.lazy()`-loaded for a smaller initial bundle. Role-based restrictions within a page (e.g. who can run bulk operations) are enforced by the backend and mirrored client-side for UX only.

---

## Real-Time Features

| Feature | Mechanism | Hook |
|---|---|---|
| Live notifications (record changes, deal closed, email failures) | Native `WebSocket` to the backend's `/ws` | `useNotifications` |
| Global online presence | `socket.io-client` to the backend's `/socket.io` | `usePresence` |
| Per-record "N people viewing" | Same Socket.IO connection, joined to a record-specific room | `useRecordPresence` |

Both channels authenticate with the same httpOnly session cookie used by every REST call — no separate token exchange on the client.

---

## Theming

Light/dark mode is handled entirely client-side and is **independent of any backend-stored preference**:

- `ThemeProvider` sets a `data-theme` attribute on `<html>` and persists the choice to `localStorage`.
- On first visit (no stored preference), it defaults to the OS's `prefers-color-scheme`.
- Toggled from the Navbar or the Command Palette.

---

## Security Notes

- **No tokens are ever stored in the browser.** Authentication is a backend-issued httpOnly cookie; the frontend never sees or handles a raw JWT or Salesforce OAuth token.
- **Salesforce OAuth is a full server-side redirect chain** — this app to backend to Salesforce to backend to this app — there is no OAuth code-handling logic on the client at all.
- **File downloads are never a plain link.** Dashboard exports, bulk-job results, and quote PDFs go through `utils/secureDownload.js`, which redeems a single-use backend-issued token as an authenticated blob request (a raw `<a href>` wouldn't carry the session cookie correctly for this).
- **Client-side CSV exports are formula-injection-safe** — `utils/csvExport.js` escapes any cell starting with `=`, `+`, `-`, or `@` before writing it, mirroring the same protection the backend applies to its own exports.
- **Client-side role checks (`utils/permissions.js`) are a UX convenience only** — every permission is re-enforced by the backend regardless of what the UI shows or hides.

---

## Deploying

This is a static single-page app — any static host works (Render Static Site, Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, ...).

1. Set `VITE_API_URL` to your deployed backend's `/api` URL **before building** — it's compiled into the bundle, not read at runtime.
2. Build: `npm run build` → deploy the `dist/` folder.
3. **An SPA rewrite rule is required.** The app uses `BrowserRouter` (real paths like `/quotes`, `/accounts`), so the host must serve `index.html` for any unmatched path, or a deep link/page refresh on any route other than `/` will 404.
4. Make sure the backend's `CLIENT_URL` environment variable matches this app's deployed origin exactly — the backend's CORS configuration only allows that one origin.

### Quick local check of a production build

```bash
npm run build
npm run preview
```

---

## Known Limitations

- **No automated test suite.** There is no test script, no testing framework (Vitest/Jest/etc.) installed, and no `*.test.*`/`*.spec.*` files anywhere in `src/`. Changes are currently validated manually and via `npm run lint`.

---

## License

No license file is currently included in this repository. Absent an explicit license, all rights are reserved by the project owner — add a `LICENSE` file if you intend to open-source or otherwise formally license this project.
