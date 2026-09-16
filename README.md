# Sales Pipeline Intelligence — Frontend

React + Vite single-page app for **Sales Pipeline Intelligence**: dashboards, Salesforce Accounts/Contacts/Leads/Opportunities/Contracts, a quotation & proposal generator with live PDF export, analytics, bulk import/export, and account management (2FA, profile).

This app talks only to its own backend API (`Backend-MERN`) — it never calls Salesforce directly. All auth is via an httpOnly session cookie set by the backend (no tokens stored in the browser).

## Tech stack

- React 19 + Vite 8
- React Router 6 (client-side `BrowserRouter`)
- Framer Motion (animation)
- Axios (API client, `withCredentials: true`)
- Leaflet / React-Leaflet (Accounts map)
- Zod (validation)
- Plain CSS with light/dark theme tokens (`src/styles/global.css`), no CSS framework

## Prerequisites

- Node.js 18+ and npm
- The backend (`Backend-MERN`) running and reachable — see its README

## Getting started (local development)

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev              # starts Vite on http://localhost:5173
```

By default `VITE_API_URL` is `http://localhost:5005/api`, matching the backend's default port.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes (functionally) | Base URL the app makes every API call against, e.g. `https://your-backend.onrender.com/api`. Falls back to `http://localhost:5005/api` if unset. |
| `VITE_APP_NAME` | no | Reserved/decorative — not currently read anywhere in the app. |
| `VITE_ENVIRONMENT` | no | Reserved/decorative — not currently read anywhere in the app. |

Vite only exposes variables prefixed `VITE_` to client code, and they're baked into the build at build time — changing `VITE_API_URL` requires a rebuild, not just a redeploy of the same artifact.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally, to sanity-check a production build |
| `npm run lint` | ESLint (flat config, React Hooks + React Refresh rules) |

## Project structure

```
src/
  App.jsx                Route table + Dashboard
  main.jsx                Entry point: providers (Auth, Theme, Toast) + BrowserRouter
  pages/                  Full pages: auth screens, Profile, Bulk Operations
  components/
    salesforce/           Accounts, Contacts, Leads, Opportunities, Contracts, Quotes,
                          Quote Builder, Accounts Map, shared record pickers
    ui/                    Reusable primitives: Modal, ConfirmDialog, Toast, icons,
                          command palette, report widgets
    layout/                Footer
  context/                 AuthProvider, ThemeProvider, ToastProvider (+ matching hooks)
  hooks/                   useSalesforceData, useBulkOperations, useNotifications, useCountUp
  services/                api.js - the shared Axios instance
  utils/                   permissions, CSV export, secure file download, quote math,
                          shared option lists (job function / territory)
  styles/                  global.css - CSS custom properties driving light/dark theme
```

## Notable frontend behavior

- **Theme** is independent of the backend-stored `preferences.theme` field — it's purely `localStorage` + `prefers-color-scheme`, toggled from the navbar.
- **Salesforce OAuth** is a full-page redirect to the backend, which redirects to Salesforce, which redirects back to the backend, which finally redirects here with `?sf=connected` or `?sfError=...` — there is no OAuth code handling in this app at all.
- **File downloads** (dashboard exports, bulk job results, quote PDFs) go through `utils/secureDownload.js`, which redeems a single-use backend-issued token/URL as an authenticated blob request rather than a plain `<a href>` (the API requires the session cookie, and a raw link wouldn't send it).
- **Command palette** (`Ctrl`/`Cmd` + `K`) is entirely client-side navigation — it never calls the backend.

## Deploying

This is a static single-page app — any static host works (Render Static Site, Vercel, Netlify, Cloudflare Pages, S3+CloudFront, ...).

1. Set `VITE_API_URL` to your deployed backend's `/api` URL **before building** (it's compiled into the bundle, not read at runtime).
2. Build: `npm run build` → deploy the `dist/` folder.
3. **SPA rewrite rule is required.** The app uses `BrowserRouter` (real paths like `/quotes`, `/accounts`), so the host must serve `index.html` for any unmatched path, or a deep link/page refresh on any route other than `/` will 404. On Render Static Site this is the default for React app "rewrite" rules; on Vercel/Netlify add a catch-all rewrite to `/index.html`.
4. Make sure the backend's `CLIENT_URL` env var matches this app's deployed origin exactly — the backend's CORS config only allows that one origin.

### Quick local check of a production build

```bash
npm run build
npm run preview
```
