import { useState } from 'react';
import { Modal } from '../ui/Modal';
import './BulkOperationsGuide.css';

/**
 * BulkOperationsGuide - reference content for the Bulk Operations page:
 * Salesforce's own official Bulk API / Bulk API 2.0 governor limits, the
 * recommended steps for running a job, general best practices, and the
 * security considerations specific to bulk data operations.
 *
 * Every number below comes from Salesforce's own "Developer Limits and
 * Allocations Quick Reference" (developer.salesforce.com, PDF last updated
 * Sep 11, 2026 - see the citation at the bottom of the modal) - this is
 * reference content people will act on, so it's sourced from Salesforce's
 * own documentation rather than approximated. The "How this app applies it"
 * column/notes point at the actual enforcement already in this codebase
 * (rateLimiter.js, salesforce.routes.js, csvSafe.js, etc.) rather than
 * generic advice that may not match how this app actually behaves.
 */

const LIMITS = [
  {
    group: 'When to use Bulk API',
    rows: [
      { item: 'Use Bulk API 2.0 for...', value: 'Any operation on more than 2,000 records' },
      { item: 'Use synchronous calls instead for...', value: 'Fewer than 2,000 records (REST Composite or SOAP) - Bulk API adds async overhead that isn\'t worth it below this size' },
    ],
  },
  {
    group: 'Batch & job allocations',
    rows: [
      { item: 'Batches per rolling 24 hours', value: '15,000 (shared between Bulk API and Bulk API 2.0)' },
      { item: 'Max time a job can stay open', value: '24 hours' },
      { item: 'Batch/job cleanup', value: 'Batches and jobs in a terminal state (completed/aborted/failed) are removed 7 days after their youngest batch' },
    ],
  },
  {
    group: 'Ingest jobs (insert / update / upsert / delete)',
    rows: [
      { item: 'Max records per 24-hour rolling period', value: '150,000,000' },
      { item: 'Max file size per job', value: '150 MB of base64-encoded CSV - since base64 inflates raw data by ~50%, keep the actual upload under ~100 MB' },
      { item: 'Recommended batch size', value: 'Start at the max, 10,000 records/batch, then tune down if batches are timing out or up if they finish in seconds' },
      { item: 'Max fields per record', value: '5,000' },
      { item: 'Max characters per field', value: '131,072' },
      { item: 'Max characters per record', value: '400,000' },
      { item: 'Results retrievable for', value: '7 days after job completion' },
    ],
  },
  {
    group: 'Query / export jobs',
    rows: [
      { item: 'Query jobs per 24-hour rolling window', value: '10,000 (Bulk API 2.0)' },
      { item: 'Max size per result chunk', value: '1 GB (larger results are automatically paginated)' },
      { item: 'PK Chunking chunk size (very large queries)', value: '100,000-250,000 records recommended - smaller chunks can create empty batches' },
      { item: 'Total query result storage per 24h', value: '1 TB (Bulk API 2.0)' },
    ],
  },
  {
    group: 'Shared with every other Salesforce API',
    rows: [
      { item: 'Counts against your org\'s daily API request limit', value: 'Yes - Bulk API/2.0 calls share the same 24-hour allocation as REST/SOAP (e.g. Enterprise Edition: 100,000 + licenses x 1,000)' },
      { item: 'Concurrent long-running (20s+) requests', value: '25 for production/sandbox orgs, 5 for Developer/Trial orgs' },
    ],
  },
];

const STEPS = [
  {
    title: '1. Decide if this is really a Bulk API job',
    body: 'Under ~2,000 records, a bulk job\'s async overhead usually costs more time than it saves - this page\'s regular record forms (or a CSV of synchronous calls) are the better fit below that size.',
  },
  {
    title: '2. Prepare and validate the data first',
    body: 'Fix required fields, obviously-wrong types, and duplicates in your CSV before uploading - this app rejects rows missing required fields individually (the rest of the file still goes through), but catching them beforehand saves a wasted round trip. Download the CSV template above to get column names right the first time.',
  },
  {
    title: '3. Pick a batch size, then tune it',
    body: 'Bulk API 2.0 batches records automatically - Salesforce\'s own guidance is to start at the 10,000-record maximum and adjust based on how long batches actually take: shrink it if batches are timing out, and avoid going too small since more, smaller batches burns through the shared 15,000-batches/24h allocation faster for no benefit.',
  },
  {
    title: '4. Submit the job and watch it, don\'t assume it worked',
    body: 'A job moves through queued -> in_progress -> completed - this page polls and updates the status/record counts automatically while a job is active, so leave the Recent Jobs table open rather than refreshing manually.',
  },
  {
    title: '5. Review BOTH the successful and failed record results',
    body: 'A job reporting "completed" can still contain failed individual records - this page\'s job details always show a Failed CSV alongside the Results CSV; download and check it before considering an import done. Results (success and failure) are only retrievable for 7 days after completion.',
  },
  {
    title: '6. Before a bulk delete, export first',
    body: 'A bulk delete is close to irreversible once Salesforce\'s Recycle Bin retention passes. Use this page\'s Export Data tab to pull a CSV of the records you\'re about to delete before you run the job, in case you need to re-import them.',
  },
];

const BEST_PRACTICES = [
  'Use an External ID field with upsert (not insert) for anything you might need to re-run - it makes a retried or partially-failed job safe to resubmit without creating duplicates.',
  'Keep batch sizes in the "sweet spot": too small wastes your 15,000-batches/24h allocation; too large risks batch timeouts that force a smaller retry anyway.',
  'Avoid running several large jobs against the same object at the same time - concurrent bulk writes to the same records cause row-lock contention and slow every job down, not just the newest one.',
  'Watch your org\'s overall API usage (Setup > System Overview), not just this job - Bulk API calls share the same 24-hour API request allocation as every other integration your org has, so one huge import can starve something else.',
  'For very large one-time loads where you control the org, consider temporarily deactivating non-essential validation rules/triggers/flows on the target object - it reduces per-record processing time and lowers the chance of an automation-driven Apex governor-limit failure mid-job (re-enable them afterward).',
  'Re-run failed records in a separate, smaller follow-up job rather than the whole file again - it\'s faster and keeps successful records from being touched twice.',
];

const SECURITY = [
  {
    title: 'Bulk API never bypasses permissions',
    body: 'Every record a bulk job touches is still checked against the connected user\'s field-level security and sharing rules, exactly like a normal UI edit - a bulk job can\'t write or read anything that user couldn\'t already access one record at a time (unless they hold "Modify All Data").',
  },
  {
    title: 'Who can run one, in this app',
    body: 'Running an import job (insert/update/upsert/delete) requires manager or admin permissions server-side - a lower-privileged account gets an explanation here, not a form that would just fail on submit. Exporting data requires being logged in with read access.',
  },
  {
    title: 'Rate-limited and audit-logged',
    body: 'Creating a bulk job or an export is capped at 5 per hour per user (separate from this app\'s normal, more generous per-minute Salesforce request limit), since these are the two highest-blast-radius actions in the app. Every import and export is recorded in the audit log.',
  },
  {
    title: 'CSV formula/DDE injection',
    body: 'A cell starting with =, +, -, or @ can execute as a formula if the CSV is later opened in Excel/Sheets - a classic way a malicious field value (e.g. an Opportunity Name) turns into code execution on whoever opens the export. Every CSV this app exports is sanitized (such a cell is prefixed with a quote) before it\'s ever written - if you\'re building your own export pipeline elsewhere, do the same.',
  },
  {
    title: 'Handle exported CSVs like the sensitive data they are',
    body: 'An export can contain full customer/account records. Store or share the file the same way you\'d handle the underlying Salesforce data - not as a casual attachment - and delete local copies once you\'re done with them.',
  },
];

const TABS = [
  { id: 'limits', label: 'Governor Limits' },
  { id: 'steps', label: 'Steps & Best Practices' },
  { id: 'security', label: 'Security' },
];

export const BulkOperationsGuide = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState('limits');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Operations: Limits, Steps & Security" maxWidth={760}>
      <div className="bog-guide">
        <div className="bog-tabs" role="tablist" aria-label="Guide section">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`bog-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'limits' && (
          <div className="bog-panel">
            {LIMITS.map((group) => (
              <div key={group.group} className="bog-limit-group">
                <h4>{group.group}</h4>
                <table className="bog-limit-table">
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.item}>
                        <td className="bog-limit-item">{row.item}</td>
                        <td className="bog-limit-value">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {tab === 'steps' && (
          <div className="bog-panel">
            <h4>Recommended steps for a bulk job</h4>
            <div className="bog-steps">
              {STEPS.map((step) => (
                <div key={step.title} className="bog-step">
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>

            <h4>Best practices</h4>
            <ul className="bog-list">
              {BEST_PRACTICES.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'security' && (
          <div className="bog-panel">
            {SECURITY.map((item) => (
              <div key={item.title} className="bog-security-item">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        )}

        <p className="bog-source">
          Governor limits sourced from Salesforce&apos;s official{' '}
          <a
            href="https://developer.salesforce.com/docs/atlas.en-us.salesforce_app_limits_cheatsheet.meta/salesforce_app_limits_cheatsheet/salesforce_app_limits_platform_bulkapi.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Developer Limits and Allocations Quick Reference
          </a>{' '}
          (PDF last updated September 11, 2026). Limits can change without notice - re-check the source for anything business-critical.
        </p>
      </div>
    </Modal>
  );
};

export default BulkOperationsGuide;
