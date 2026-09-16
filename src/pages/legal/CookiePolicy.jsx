import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

const TOC = [
  { id: 'what-are-cookies', label: 'What Are Cookies' },
  { id: 'cookies-we-use', label: 'Cookies & Storage We Use' },
  { id: 'no-tracking', label: 'What We Don’t Use' },
  { id: 'managing', label: 'Managing Cookies' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
];

export const CookiePolicy = () => (
  <LegalLayout
    title="Cookie Policy"
    description="What we store in your browser, why, and how to control it."
    lastUpdated="September 16, 2026"
    toc={TOC}
  >
    <section id="what-are-cookies">
      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small pieces of data a website asks your browser to store, then sends back on later
        requests. We also use <code>localStorage</code>, a similar browser storage mechanism that (unlike
        a cookie) is never automatically sent to our servers — it stays on your device until the page
        reads it or you clear it.
      </p>
    </section>

    <section id="cookies-we-use">
      <h2>2. Cookies &amp; Storage We Use</h2>
      <p>We keep this list intentionally short — we use storage only where the Service genuinely needs it:</p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Name / purpose</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Why it's necessary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Session authentication cookie</td>
              <td>Strictly necessary — <code>httpOnly</code> cookie</td>
              <td>Matches your session length (until you sign out or it expires)</td>
              <td>Keeps you signed in. It cannot be read by page JavaScript, which protects it from theft via a scripting vulnerability.</td>
            </tr>
            <tr>
              <td>Theme preference</td>
              <td>Local storage (not a cookie — never sent to our servers)</td>
              <td>Until you clear your browser data</td>
              <td>Remembers whether you last chose light or dark mode.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="no-tracking">
      <h2>3. What We Don't Use</h2>
      <p>
        We do not currently use third-party advertising cookies, cross-site tracking pixels, or
        third-party web analytics cookies. If that changes, this page will be updated first, and — where
        legally required — we will ask for your consent before setting any non-essential cookie.
      </p>
    </section>

    <section id="managing">
      <h2>4. Managing Cookies</h2>
      <p>
        The session cookie described above is strictly necessary for the Service to function — blocking
        it will sign you out or prevent sign-in. You can still clear it at any time through your browser's
        settings, or by using the "Sign Out" action in the Service, which invalidates the session
        server-side as well. The theme preference in local storage can be cleared from your browser's site
        data settings without affecting your ability to sign in.
      </p>
    </section>

    <section id="changes">
      <h2>5. Changes to This Policy</h2>
      <p>
        If we introduce new categories of cookies or storage — for example, analytics — we will update
        this page and, where required by law, request your consent first. See our{' '}
        <Link to="/privacy-policy">Privacy Policy</Link> for how we handle the underlying data more
        broadly.
      </p>
    </section>

    <section id="contact">
      <h2>6. Contact Us</h2>
      <p>
        Questions about this Cookie Policy can be sent to{' '}
        <a href="mailto:privacy@yourcompany.com">privacy@yourcompany.com</a>.
      </p>
    </section>
  </LegalLayout>
);

export default CookiePolicy;
