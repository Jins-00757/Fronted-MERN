import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'salesforce-data', label: 'Your Salesforce Data' },
  { id: 'how-we-use', label: 'How We Use Information' },
  { id: 'legal-basis', label: 'Legal Basis for Processing' },
  { id: 'sharing', label: 'Sharing & Subprocessors' },
  { id: 'security', label: 'How We Protect Data' },
  { id: 'retention', label: 'Retention & Deletion' },
  { id: 'your-rights', label: 'Your Rights & Choices' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'transfers', label: 'International Transfers' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
];

export const PrivacyPolicy = () => (
  <LegalLayout
    title="Privacy Policy"
    description="How Sales Pipeline Intelligence collects, uses, and protects your information and the Salesforce data you connect to it."
    lastUpdated="September 16, 2026"
    toc={TOC}
  >
    <section id="overview">
      <h2>1. Overview</h2>
      <p>
        Sales Pipeline Intelligence ("the Service", "we", "us") is a sales operations platform that
        connects to your organization's Salesforce org to surface pipeline analytics, lead scoring,
        quoting, and bulk data tools. This Privacy Policy explains what information we collect when you
        use the Service, why we collect it, how it is stored and protected, and the choices available to
        you as a user or administrator.
      </p>
      <p>
        This policy applies to the web application, its API, and any Salesforce data you choose to
        access through it. It does not apply to Salesforce itself — your use of Salesforce is governed by
        Salesforce's own privacy notices and your organization's agreement with Salesforce.
      </p>
    </section>

    <section id="information-we-collect">
      <h2>2. Information We Collect</h2>
      <p>We collect information in three categories:</p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account information</td>
              <td>Name, work email, hashed password, role, team assignment, profile preferences</td>
              <td>Provided by you at signup / in Profile settings</td>
            </tr>
            <tr>
              <td>Authentication &amp; security data</td>
              <td>Session cookie (httpOnly JWT), two-factor authentication status, login IP address and user-agent, audit log entries</td>
              <td>Generated automatically when you sign in, enable 2FA, or take an action we log</td>
            </tr>
            <tr>
              <td>Salesforce connection data</td>
              <td>Encrypted OAuth access/refresh tokens, connected org ID and org name</td>
              <td>Created when you authorize the Service via Salesforce OAuth</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We do <strong>not</strong> ask for or store your Salesforce username/password directly — connection
        happens exclusively through Salesforce's own OAuth login screen (see{' '}
        <a href="#salesforce-data">Section 3</a>).
      </p>
    </section>

    <section id="salesforce-data">
      <h2>3. Your Salesforce Data</h2>
      <p>
        This is the part of our practices we want to be most precise about, since it's the core of the
        Service:
      </p>
      <ul>
        <li>
          <strong>Per-user, per-org authorization.</strong> Each user connects their own Salesforce
          account via OAuth. We never use a single shared "integration user" — every request to
          Salesforce runs under your own credentials, so Salesforce's field-level security, object
          permissions, and sharing rules apply exactly as they would if you were using Salesforce
          directly.
        </li>
        <li>
          <strong>Live, on-demand access — not a permanent copy.</strong> When you view Accounts,
          Contacts, Leads, Opportunities, Contracts, or Quotes in the Service, we query Salesforce in
          real time. We do not maintain a standing local database of your CRM records. Query results
          are held briefly in a server-side cache (typically 30 seconds to 5 minutes) purely to keep the
          UI responsive, then expire automatically.
        </li>
        <li>
          <strong>Writes you initiate.</strong> When you create, update, or bulk-import records through
          the Service, we send that data to Salesforce via its REST and Bulk APIs on your behalf. We do
          not modify your Salesforce data independently of an action you take.
        </li>
        <li>
          <strong>Encrypted OAuth tokens.</strong> The access and refresh tokens that let us call the
          Salesforce API for you are encrypted at rest (AES-256-GCM, per-record keys) before being
          stored, and every decryption of a token is written to our internal audit log.
        </li>
        <li>
          <strong>Exports you request.</strong> When you export records to CSV or PDF, that file is
          generated on demand and made available through a single-use, time-limited download link. We
          retain a record that an export happened (for your own audit history) but do not keep a
          separate copy of the exported file after the link is used or expires.
        </li>
      </ul>
    </section>

    <section id="how-we-use">
      <h2>4. How We Use Information</h2>
      <ul>
        <li>Authenticate you and maintain your session securely</li>
        <li>Retrieve, display, and let you act on your Salesforce pipeline data</li>
        <li>Generate analytics, lead scores, and forecasts from data you have access to</li>
        <li>Send transactional email (password reset, email verification, daily pipeline summaries you opt into)</li>
        <li>Detect, investigate, and prevent fraud, abuse, and security incidents</li>
        <li>Maintain audit trails for exports, imports, and sensitive account actions</li>
        <li>Improve the reliability and performance of the Service</li>
      </ul>
      <p>We do not sell your personal information or your Salesforce data, and we do not use it to train third-party AI models.</p>
    </section>

    <section id="legal-basis">
      <h2>5. Legal Basis for Processing</h2>
      <p>Where applicable data protection law (such as the EU/UK GDPR) requires a legal basis, we rely on:</p>
      <ul>
        <li><strong>Contract:</strong> processing needed to provide the Service you've signed up for</li>
        <li><strong>Legitimate interests:</strong> securing the Service, preventing fraud, and improving reliability</li>
        <li><strong>Consent:</strong> optional communications and non-essential cookies, where used</li>
        <li><strong>Legal obligation:</strong> where we are required to retain or disclose information by law</li>
      </ul>
    </section>

    <section id="sharing">
      <h2>6. Sharing &amp; Subprocessors</h2>
      <p>
        We do not sell personal information. We share data only with the service providers
        ("subprocessors") needed to operate the Service, each bound by contractual confidentiality and
        security obligations:
      </p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Data involved</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Salesforce, Inc.</td>
              <td>The CRM you connect and authorize us to read/write on your behalf</td>
              <td>CRM records, OAuth tokens</td>
            </tr>
            <tr>
              <td>Database hosting (MongoDB)</td>
              <td>Stores account, audit log, and bulk-job records</td>
              <td>Account data, encrypted tokens, audit logs</td>
            </tr>
            <tr>
              <td>Redis (cache/rate-limit provider)</td>
              <td>Short-lived caching of query results and rate-limit counters</td>
              <td>Cached Salesforce query results (auto-expiring), request counts</td>
            </tr>
            <tr>
              <td>Transactional email provider (SMTP)</td>
              <td>Delivers verification, password reset, and summary emails</td>
              <td>Name, email address, email content</td>
            </tr>
            <tr>
              <td>Application hosting provider</td>
              <td>Runs the web application and API</td>
              <td>All data in transit/at rest on our servers</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We may also disclose information if required by law, to enforce our{' '}
        <Link to="/terms-of-service">Terms of Service</Link>, or to protect the rights, property, or
        safety of our users or the public.
      </p>
    </section>

    <section id="security">
      <h2>7. How We Protect Data</h2>
      <p>
        Security measures are described in detail in our <Link to="/security">Security page</Link>.
        In summary: encryption in transit (TLS) and at rest for sensitive fields, per-user Salesforce
        authorization, role-based access control, rate limiting, audit logging of sensitive actions, and
        secure, single-use download links for exported files.
      </p>
    </section>

    <section id="retention">
      <h2>8. Retention &amp; Deletion</h2>
      <ul>
        <li>
          <strong>Account data</strong> is retained for as long as your account is active, plus a limited
          period afterward for legal, security, and dispute-resolution purposes.
        </li>
        <li>
          <strong>Salesforce records</strong> are not retained by us beyond the short-lived cache window
          described in <a href="#salesforce-data">Section 3</a> — deleting your account or disconnecting
          Salesforce does not delete anything in your Salesforce org, since we never held a persistent
          copy of it.
        </li>
        <li>
          <strong>Account deletion</strong> requested through Profile settings deactivates your account
          immediately (you're signed out and can no longer authenticate) and revokes stored Salesforce
          tokens. For audit and fraud-prevention purposes, the underlying record is retained in a
          deactivated state rather than being purged immediately; if you need full erasure, contact us
          using the details in <a href="#contact">Section 14</a>.
        </li>
        <li>
          <strong>Audit logs</strong> are retained for a limited period to support security
          investigations and compliance obligations.
        </li>
      </ul>
    </section>

    <section id="your-rights">
      <h2>9. Your Rights &amp; Choices</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Correct inaccurate information (via Profile settings, or by contacting us)</li>
        <li>Request deletion/deactivation of your account</li>
        <li>Export your account data in a portable format</li>
        <li>Withdraw consent for optional communications at any time</li>
        <li>Disconnect your Salesforce account at any time from within the Service</li>
        <li>Object to or restrict certain processing, where applicable law provides for it</li>
      </ul>
      <p>To exercise any of these rights, contact us using the details in <a href="#contact">Section 14</a>.</p>
    </section>

    <section id="cookies">
      <h2>10. Cookies</h2>
      <p>
        We use a small number of strictly-necessary cookies and local storage entries to keep you signed
        in and remember your display preferences. See our{' '}
        <Link to="/cookie-policy">Cookie Policy</Link> for the full list and how to control them.
      </p>
    </section>

    <section id="transfers">
      <h2>11. International Data Transfers</h2>
      <p>
        Our infrastructure and subprocessors may be located in different countries than yours. Where we
        transfer personal information internationally, we rely on appropriate safeguards required by
        applicable law, such as standard contractual clauses, and we require subprocessors to maintain
        comparable protections.
      </p>
    </section>

    <section id="children">
      <h2>12. Children's Privacy</h2>
      <p>
        The Service is a business tool intended for use by employees of our business customers and is
        not directed at children. We do not knowingly collect personal information from anyone under 16.
      </p>
    </section>

    <section id="changes">
      <h2>13. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will notify
        you by email or through an in-app notice before the change takes effect. The "Last updated" date
        at the top of this page always reflects the current version.
      </p>
    </section>

    <section id="contact">
      <h2>14. Contact Us</h2>
      <p>
        Questions, requests, or concerns about this policy or your data can be sent to{' '}
        <a href="mailto:privacy@yourcompany.com">privacy@yourcompany.com</a>.
      </p>
      <div className="legal-callout">
        <p>
          <strong>Note:</strong> this document is provided as a template reflecting how the Service
          actually handles data today. Before relying on it for a live product, replace the bracketed
          contact/company placeholders throughout the legal pages with your registered business
          details, and have it reviewed by qualified legal counsel for your jurisdiction.
        </p>
      </div>
    </section>
  </LegalLayout>
);

export default PrivacyPolicy;
