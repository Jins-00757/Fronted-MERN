import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { GithubIcon } from '../ui/DashboardIcons';
import './Footer.css';

/**
 * Footer Component - Professional Footer with Company Info and Links
 *
 * Features:
 * - Responsive grid layout
 * - Company information section
 * - Quick navigation links
 * - Legal/compliance links
 * - Social media links
 * - Copyright information
 * - Accessibility compliant
 */
export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleNavigation = useCallback((path) => {
    navigate(path);
    window.scrollTo(0, 0);
  }, [navigate]);

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        {/* Top Section - Main Content */}
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section">
            <h3 className="footer-title">About</h3>
            <div className="footer-logo">
              <Logo size={28} onDark />
            </div>
            <p className="footer-description">
              Empower your sales team with advanced pipeline analytics and Salesforce integration.
            </p>
            <div className="social-links">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Twitter"
                title="Follow us on Twitter"
              >
                𝕏
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="LinkedIn"
                title="Follow us on LinkedIn"
              >
                in
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="GitHub"
                title="Visit us on GitHub"
              >
                <GithubIcon width={16} height={16} />
              </a>
            </div>
          </div>

          {/* Product Section */}
          <div className="footer-section">
            <h3 className="footer-title">Product</h3>
            <nav className="footer-links" role="navigation" aria-label="Product navigation">
              <button
                className="footer-link"
                onClick={() => handleNavigation('/')}
              >
                Dashboard
              </button>
              <button
                className="footer-link"
                onClick={() => handleNavigation('/opportunities')}
              >
                Opportunities
              </button>
              <a href="#features" className="footer-link">
                Features
              </a>
              <a href="#pricing" className="footer-link">
                Pricing
              </a>
            </nav>
          </div>

          {/* Company Section */}
          <div className="footer-section">
            <h3 className="footer-title">Company</h3>
            <nav className="footer-links" role="navigation" aria-label="Company navigation">
              <a href="#about" className="footer-link">
                About Us
              </a>
              <a href="#blog" className="footer-link">
                Blog
              </a>
              <a href="#careers" className="footer-link">
                Careers
              </a>
              <a href="#contact" className="footer-link">
                Contact
              </a>
              <a href="#press" className="footer-link">
                Press
              </a>
            </nav>
          </div>

          {/* Resources Section */}
          <div className="footer-section">
            <h3 className="footer-title">Resources</h3>
            <nav className="footer-links" role="navigation" aria-label="Resources navigation">
              <a href="#docs" className="footer-link">
                Documentation
              </a>
              <a href="#api" className="footer-link">
                API Reference
              </a>
              <a href="#support" className="footer-link">
                Support
              </a>
              <a href="#status" className="footer-link">
                Status Page
              </a>
              <a href="#community" className="footer-link">
                Community
              </a>
            </nav>
          </div>

          {/* Legal Section */}
          <div className="footer-section">
            <h3 className="footer-title">Legal</h3>
            <nav className="footer-links" role="navigation" aria-label="Legal navigation">
              <button
                className="footer-link"
                onClick={() => handleNavigation('/privacy-policy')}
              >
                Privacy Policy
              </button>
              <button
                className="footer-link"
                onClick={() => handleNavigation('/terms-of-service')}
              >
                Terms of Service
              </button>
              <button
                className="footer-link"
                onClick={() => handleNavigation('/security')}
              >
                Security
              </button>
              <button
                className="footer-link"
                onClick={() => handleNavigation('/security#compliance')}
              >
                Compliance
              </button>
              <button
                className="footer-link"
                onClick={() => handleNavigation('/cookie-policy')}
              >
                Cookie Policy
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              &copy; {currentYear} Sales Pipeline Intelligence. All rights reserved.
            </p>
          </div>

          <div className="footer-legal-links">
            <button
              className="footer-legal-link"
              onClick={() => handleNavigation('/privacy-policy')}
            >
              Privacy
            </button>
            <span className="footer-separator">•</span>
            <button
              className="footer-legal-link"
              onClick={() => handleNavigation('/terms-of-service')}
            >
              Terms
            </button>
            <span className="footer-separator">•</span>
            <button
              className="footer-legal-link"
              onClick={() => handleNavigation('/cookie-policy')}
            >
              Cookies
            </button>
          </div>

          <div className="footer-status">
            <span className="status-badge">
              <span className="status-indicator"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};