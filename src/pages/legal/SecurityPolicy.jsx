import { LegalLayout } from './LegalLayout';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'authentication', label: 'Authentication & Access Control' },
  { id: 'encryption', label: 'Encryption' },
  { id: 'salesforce-security', label: 'Salesforce Integration Security' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'monitoring', label: 'Monitoring & Audit Logging' },
  { id: 'secure-development', label: 'Secure Development Practices' },
  { id: 'incident-response', label: 'Incident Response' },
  { id: 'disclosure', label: 'Responsible Disclosure' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'contact', label: 'Contact Us' },
];

export const SecurityPolicy = () => (
  <LegalLayout
    title="Security"
    description="A technical overview of how we protect your account, your session, and the Salesforce data you connect."
    lastUpdated="September 16, 2026"
    toc={TOC}
  >
    <section id="overview">
      <h2>1. Overview</h2>
      <p>
        Security is a core design constraint of Sales Pipeline Intelligence, not an afterthought — the
        Service exists specifically to move data between your browser and your Salesforce org, so we've
        built the platform around minimizing what we store, encrypting what we must store, and enforcing
        the same access boundaries Salesforce itself enforces. This page describes the concrete measures
        in place today.
      </p>
    </section>

    <section id="authentication">
      <h2>2. Authentication &amp; Access Control</h2>
      <ul>
        <li>
          <strong>Session cookies, not client-readable tokens.</strong> Your session is a JSON Web Token
          stored in an <code>httpOnly</code>, <code>SameSite</code>, and (in production) <code>Secure</code>{' '}
          cookie. It is never exposed to page JavaScript, which rules out a whole class of token-theft via
          cross-site scripting.
        </li>
        <li>
          <strong>Optional two-factor authentication.</strong> Users can enable TOTP-based 2FA (compatible
          with standard authenticator apps) from Profile settings for an additional login factor.
        </li>
        <li>
          <strong>Role-based access control (RBAC), enforced server-side.</strong> Destructive and bulk
          Salesforce operations require an appropriate role (manager/admin). Permission checks run on the
          backend for every request — the frontend's own permission checks are for user experience only
          and are never trusted as the actual gate.
        </li>
        <li>
          <strong>Rate limiting.</strong> Authenticated API calls, Salesforce CRUD operations, and — with
          a tighter limit given their larger blast radius — bulk-job creation and export-link generation
          are all rate limited per user.
        </li>
      </ul>
    </section>

    <section id="encryption">
      <h2>3. Encryption</h2>
      <ul>
        <li><strong>In transit:</strong> all traffic between your browser, our servers, and Salesforce is encrypted with TLS.</li>
        <li>
          <strong>At rest:</strong> Salesforce OAuth access and refresh tokens are encrypted with
          AES-256-GCM using a per-record derived key before being written to the database, so a database
          compromise alone does not expose usable Salesforce credentials. Every decryption of a stored
          token is written to our audit log.
        </li>
        <li><strong>Passwords</strong> are never stored in plain text — they are hashed with a strong, salted hashing algorithm.</li>
      </ul>
    </section>

    <section id="salesforce-security">
      <h2>4. Salesforce Integration Security</h2>
      <ul>
        <li>
          <strong>Per-user OAuth, no shared privileged account.</strong> Every user authorizes their own
          Salesforce connection; every API call the Service makes runs under that specific user's
          Salesforce permissions. We never centralize access through a single "integration user" that
          would bypass Salesforce's own field-level security and sharing rules.
        </li>
        <li>
          <strong>Injection-safe query construction.</strong> User-supplied filter values are either
          escaped before being placed in a SOQL query or validated against a strict allow-list (e.g. a
          plain <code>YYYY-MM-DD</code> date format for date filters, or a fixed set of sortable field
          names) — never concatenated into a query unchecked.
        </li>
        <li>
          <strong>Hardened file handling.</strong> CSV imports are validated by file extension and MIME
          type, capped in size, written to a randomized per-request temporary location, hashed for
          integrity, and always cleaned up after processing — files are parsed, never stored or served
          back.
        </li>
        <li>
          <strong>Formula-injection–safe exports.</strong> Values exported to CSV that could be
          interpreted as a spreadsheet formula (starting with <code>=</code>, <code>+</code>,{' '}
          <code>-</code>, or <code>@</code>) are neutralized before the file is generated, both on the
          server and in the browser.
        </li>
        <li>
          <strong>Secure, single-use downloads.</strong> Exported files are served through short-lived,
          single-use download tokens (atomically invalidated on first use) rather than persistent public
          URLs.
        </li>
      </ul>
    </section>

    <section id="infrastructure">
      <h2>5. Infrastructure</h2>
      <ul>
        <li>Application data is stored in a managed MongoDB database.</li>
        <li>Caching and rate-limit counters use Redis, with short, purpose-specific expirations.</li>
        <li>CORS is restricted to our own application's origin — the API does not accept cross-origin requests from arbitrary sites.</li>
        <li>Environment secrets (database credentials, encryption keys, OAuth client secrets) are kept out of source control and injected via server-side environment configuration.</li>
      </ul>
    </section>

    <section id="monitoring">
      <h2>6. Monitoring &amp; Audit Logging</h2>
      <p>
        Sensitive actions — sign-ins, exports, imports, bulk operations, token decryption, and changes to
        account security settings — are written to an internal audit log with the acting user, IP
        address, user-agent, and outcome (success or failure). Users can review their own export/download
        history from within the Service.
      </p>
    </section>

    <section id="secure-development">
      <h2>7. Secure Development Practices</h2>
      <ul>
        <li>Server-side validation on every state-changing request, independent of any client-side checks</li>
        <li>Dependencies are kept current to incorporate upstream security fixes</li>
        <li>Security-relevant changes go through code review before release</li>
        <li>We periodically re-examine data import/export paths specifically, given their sensitivity in a CRM-integration product</li>
      </ul>
    </section>

    <section id="incident-response">
      <h2>8. Incident Response</h2>
      <p>
        In the event of a security incident affecting your data, we will investigate promptly, take steps
        to contain and remediate it, and notify affected users and/or organizations without undue delay
        and in line with applicable legal requirements.
      </p>
    </section>

    <section id="disclosure">
      <h2>9. Responsible Disclosure</h2>
      <p>
        If you believe you've found a security vulnerability in Sales Pipeline Intelligence, please report
        it privately to <a href="mailto:security@yourcompany.com">security@yourcompany.com</a> before any
        public disclosure. Include enough detail to reproduce the issue. We ask that you avoid accessing,
        modifying, or destroying data beyond what's necessary to demonstrate the issue, and give us a
        reasonable window to remediate before disclosing publicly. We do not pursue legal action against
        good-faith, non-destructive security research reported this way.
      </p>
    </section>

    <section id="compliance">
      <h2>10. Compliance</h2>
      <p>
        We design our data handling to align with common data-protection principles (data minimization,
        purpose limitation, encryption of sensitive fields, audit trails, and user rights over their own
        data) as described in our <a href="/privacy-policy">Privacy Policy</a>. Because the Service acts
        as a pass-through to Salesforce rather than a permanent data store, most of your CRM data's
        compliance posture is governed by your own Salesforce org's configuration and your organization's
        agreement with Salesforce.
      </p>
      <div className="legal-callout">
        <p>
          <strong>Note:</strong> specific certifications (e.g. SOC 2, ISO 27001) are not claimed here —
          add this section only once such an audit has actually been completed and a report is available
          to reference.
        </p>
      </div>
    </section>

    <section id="contact">
      <h2>11. Contact Us</h2>
      <p>
        Security questions or vulnerability reports:{' '}
        <a href="mailto:security@yourcompany.com">security@yourcompany.com</a>
      </p>
    </section>
  </LegalLayout>
);

export default SecurityPolicy;
