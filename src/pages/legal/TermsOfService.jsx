import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

const TOC = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'accounts', label: 'Accounts & Eligibility' },
  { id: 'salesforce-authorization', label: 'Salesforce Authorization' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'your-content', label: 'Your Data & Content' },
  { id: 'fees', label: 'Fees & Subscription' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'availability', label: 'Availability & Support' },
  { id: 'termination', label: 'Termination' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'changes', label: 'Changes to These Terms' },
  { id: 'contact', label: 'Contact Us' },
];

export const TermsOfService = () => (
  <LegalLayout
    title="Terms of Service"
    description="The agreement between you and Sales Pipeline Intelligence governing your use of the platform."
    lastUpdated="September 16, 2026"
    toc={TOC}
  >
    <section id="acceptance">
      <h2>1. Acceptance of Terms</h2>
      <p>
        These Terms of Service ("Terms") govern your access to and use of Sales Pipeline Intelligence
        (the "Service"), including its web application, API, and integrations. By creating an account or
        using the Service, you agree to be bound by these Terms. If you are using the Service on behalf
        of an organization, you represent that you have authority to bind that organization, and "you"
        refers to that organization as well as the individual user.
      </p>
    </section>

    <section id="accounts">
      <h2>2. Accounts &amp; Eligibility</h2>
      <ul>
        <li>You must provide accurate registration information and keep it up to date.</li>
        <li>You are responsible for safeguarding your login credentials and for all activity under your account.</li>
        <li>
          We support optional two-factor authentication (TOTP-based) — we strongly recommend enabling
          it, especially for accounts with elevated (manager/admin) permissions.
        </li>
        <li>Notify us immediately of any unauthorized use of your account.</li>
        <li>You must be legally able to enter into a binding contract to use the Service.</li>
      </ul>
    </section>

    <section id="salesforce-authorization">
      <h2>3. Salesforce Authorization</h2>
      <p>
        The Service integrates with Salesforce through Salesforce's official OAuth authorization flow.
        By connecting your Salesforce account, you:
      </p>
      <ul>
        <li>
          Confirm you have the right and any necessary permission from your organization to authorize
          third-party access to that Salesforce org.
        </li>
        <li>
          Authorize the Service to read and write Salesforce data on your behalf, strictly within the
          permissions your Salesforce profile and permission sets already grant you — we cannot and do
          not bypass Salesforce's own access controls.
        </li>
        <li>
          Understand that actions you take in the Service (creating, updating, deleting, or bulk-importing
          records) are executed directly against your live Salesforce org and are subject to Salesforce's
          own data model, validation rules, and limits.
        </li>
        <li>
          Can disconnect this authorization at any time, both from within the Service and from your
          Salesforce Connected App settings.
        </li>
      </ul>
      <p>
        You remain solely responsible for the accuracy and consequences of any data you create, modify,
        import, or delete in Salesforce via the Service.
      </p>
    </section>

    <section id="acceptable-use">
      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service to access data or Salesforce orgs you are not authorized to access</li>
        <li>Attempt to probe, scan, or test the vulnerability of the Service, or bypass its rate limits or access controls, outside of an authorized security research engagement</li>
        <li>Upload malicious files, or use the bulk import/export tools to exfiltrate data you are not entitled to</li>
        <li>Reverse engineer, decompile, or resell the Service without our written consent</li>
        <li>Use the Service in a way that violates applicable law or infringes on the rights of others</li>
        <li>Share your account credentials with unauthorized users</li>
      </ul>
      <p>We may suspend or terminate accounts that violate this section.</p>
    </section>

    <section id="your-content">
      <h2>5. Your Data &amp; Content</h2>
      <p>
        You retain all ownership rights to your Salesforce data and any content you upload (such as CSV
        import files). You grant us a limited license to process that data solely to provide the Service
        to you, as described in our <Link to="/privacy-policy">Privacy Policy</Link>. We do not claim
        ownership over your business data.
      </p>
    </section>

    <section id="fees">
      <h2>6. Fees &amp; Subscription</h2>
      <p>
        Where the Service is offered under a paid plan, applicable fees, billing frequency, and renewal
        terms will be presented to you at signup or upgrade and are incorporated into these Terms by
        reference. Unless stated otherwise at the time of purchase, fees are non-refundable except as
        required by law. We will provide reasonable advance notice before any price change takes effect
        for existing subscriptions.
      </p>
    </section>

    <section id="ip">
      <h2>7. Intellectual Property</h2>
      <p>
        The Service, including its software, design, and branding, is owned by us or our licensors and
        is protected by intellectual property laws. These Terms do not grant you any rights to our
        trademarks or branding outside of what's necessary to use the Service as intended.
      </p>
    </section>

    <section id="availability">
      <h2>8. Availability &amp; Support</h2>
      <p>
        We aim to keep the Service available and reliable, but it depends in part on third-party systems
        (including Salesforce's own API availability) that are outside our control. We do not guarantee
        uninterrupted or error-free operation and may perform scheduled maintenance with reasonable
        notice where practical.
      </p>
    </section>

    <section id="termination">
      <h2>9. Termination</h2>
      <ul>
        <li>You may stop using the Service and request account deactivation at any time from Profile settings.</li>
        <li>
          We may suspend or terminate your access if you violate these Terms, create security or legal
          risk for the Service or other users, or upon extended account inactivity.
        </li>
        <li>Sections that by their nature should survive termination (e.g. intellectual property, disclaimers, limitation of liability) will continue to apply.</li>
      </ul>
    </section>

    <section id="disclaimers">
      <h2>10. Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available," without warranties of any kind, express or
        implied, including merchantability, fitness for a particular purpose, and non-infringement. We do
        not warrant that analytics, lead scores, or forecasts generated by the Service are accurate or
        complete, or that they should be relied upon as the sole basis for a business decision.
      </p>
    </section>

    <section id="liability">
      <h2>11. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, we will not be liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss of profits, revenue, data, or business
        opportunity, arising from your use of the Service. Our total liability for any claim relating to
        the Service will not exceed the amount you paid us in the twelve (12) months preceding the claim.
      </p>
    </section>

    <section id="indemnification">
      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from claims, damages, and expenses (including
        reasonable legal fees) arising from your misuse of the Service, your violation of these Terms, or
        your violation of any third party's rights — including unauthorized use of a Salesforce org you
        connect.
      </p>
    </section>

    <section id="governing-law">
      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of <strong>[Your Governing Jurisdiction]</strong>, without
        regard to its conflict-of-law provisions. Any disputes will be resolved in the courts located in
        that jurisdiction, unless otherwise required by applicable law.
      </p>
    </section>

    <section id="changes">
      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated by email or
        in-app notice before taking effect. Continued use of the Service after changes take effect
        constitutes acceptance of the updated Terms.
      </p>
    </section>

    <section id="contact">
      <h2>15. Contact Us</h2>
      <p>
        Questions about these Terms can be sent to{' '}
        <a href="mailto:legal@yourcompany.com">legal@yourcompany.com</a>.
      </p>
      <div className="legal-callout">
        <p>
          <strong>Note:</strong> this document is a professional template tailored to this product's
          actual features (Salesforce OAuth, bulk import/export, 2FA). Replace the bracketed jurisdiction
          and contact placeholders with your real business details, and confirm the Fees &amp; Subscription
          section matches your actual billing model before publishing this for real customers.
        </p>
      </div>
    </section>
  </LegalLayout>
);

export default TermsOfService;
