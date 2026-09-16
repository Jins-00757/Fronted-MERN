import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './LegalLayout.css';

const RELATED_POLICIES = [
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/terms-of-service', label: 'Terms of Service' },
  { path: '/security', label: 'Security' },
  { path: '/cookie-policy', label: 'Cookie Policy' },
];

/**
 * Shared chrome for the legal/compliance pages (Privacy, Terms, Security,
 * Cookies): sticky in-page table of contents + cross-links to the other
 * policies, consistent header, and a contact footnote. Each page owns its
 * own content and passes the section list it wants in the TOC - the layout
 * itself renders no policy-specific copy.
 */
export const LegalLayout = ({ title, description, lastUpdated, toc = [], children }) => {
  const location = useLocation();

  // React Router's client-side navigation doesn't get the browser's native
  // "scroll to the element matching the URL hash" behavior a full page load
  // would - e.g. the Footer's Compliance link (/security#compliance) needs
  // this to actually land on that section instead of just the page top.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({ block: 'start' });
  }, [location.pathname, location.hash]);

  return (
    <div className="legal-page">
      <div className="legal-container">
        <aside className="legal-sidebar" aria-label="Policy navigation">
          <div className="legal-sidebar-sticky">
            <Link to="/" className="legal-back-link">
              ← Back to Sales Pipeline Intelligence
            </Link>

            {toc.length > 0 && (
              <nav aria-label="On this page">
                <p className="legal-sidebar-title">On this page</p>
                <ol className="legal-toc">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`}>{item.label}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <nav aria-label="Related policies">
              <p className="legal-sidebar-title">Related policies</p>
              <ul className="legal-related-list">
                {RELATED_POLICIES.map((policy) => (
                  <li key={policy.path}>
                    <Link
                      to={policy.path}
                      className={policy.path === location.pathname ? 'is-active' : ''}
                    >
                      {policy.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <main className="legal-content">
          <header className="legal-header">
            <h1>{title}</h1>
            {description && <p className="legal-description">{description}</p>}
            <p className="legal-updated">
              Last updated: <strong>{lastUpdated}</strong>
            </p>
          </header>

          <div className="legal-body">{children}</div>

          <footer className="legal-contact-footer">
            <p>
              Questions about this policy? Reach out to{' '}
              <a href="mailto:privacy@yourcompany.com">privacy@yourcompany.com</a> and we'll get back
              to you.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default LegalLayout;
