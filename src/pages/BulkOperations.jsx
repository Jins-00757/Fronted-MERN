import { useState, useEffect, useCallback, useRef } from 'react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { canManageSalesforceRecords } from '../utils/permissions';
import api from '../services/api';
import { downloadFile, downloadFileFromLink } from '../utils/secureDownload';
import { Modal } from '../components/ui/Modal';
import { DownloadIcon, InfoIcon } from '../components/ui/DashboardIcons';
import { BulkOperationsGuide } from '../components/salesforce/BulkOperationsGuide';
import './BulkOperations.css';

const OPERATIONS = ['insert', 'update', 'upsert', 'delete'];
const OBJECT_TYPES = ['Opportunity', 'Account', 'Contact', 'Task'];

// Mirrors the backend's EXPORT_OBJECT_CONFIG keys (salesforceService.js) -
// a superset of OBJECT_TYPES above since export also covers Lead/Contract/
// Quote, which this app manages but doesn't support as bulk *import*
// targets (no REQUIRED_FIELDS_BY_OBJECT validation rule exists for them).
const EXPORT_OBJECT_TYPES = ['Account', 'Contact', 'Lead', 'Opportunity', 'Contract', 'Quote', 'Task'];

const SAMPLE_RECORDS = `[
  { "Name": "New Deal", "StageName": "Prospecting", "CloseDate": "2026-12-31", "AccountId": "001XXXXXXXXXXXXXXX" }
]`;

// Mirrors the backend's own limits (see middleware/csvUpload.js) so a bad
// file is rejected instantly instead of only after a round trip.
const MAX_CSV_BYTES = 50 * 1024 * 1024;

// Jobs in one of these states are still moving - the history table polls
// while any job is in one of them, so a running job's status/record counts
// update without the user manually refreshing.
const ACTIVE_STATUSES = new Set(['queued', 'in_progress']);
const POLL_INTERVAL_MS = 8000;

export default function BulkOperations() {
  const { user } = useAuth();
  const toast = useToast();
  const { createBulkJob, createBulkJobFromFile, loading, error, progress, results, reset } = useBulkOperations();

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'

  const [operation, setOperation] = useState('insert');
  const [objectType, setObjectType] = useState('Opportunity');
  const [inputMode, setInputMode] = useState('json'); // 'json' | 'csv'
  const [recordsText, setRecordsText] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [detailJobId, setDetailJobId] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const fetchJobs = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setJobsLoading(true);
    try {
      const response = await api.get('/salesforce/bulk');
      setJobs(response.data.data || []);
    } catch (err) {
      console.error('Error fetching bulk jobs:', err);
    } finally {
      if (!silent) setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    fetchJobs().catch(() => {});
  }, [fetchJobs]);

  // Quietly re-fetch the job list while anything in it is still queued/
  // running, so a job's status/record counts move on their own instead of
  // requiring a manual refresh. Stops the instant nothing is active.
  useEffect(() => {
    const hasActiveJob = jobs.some((job) => ACTIVE_STATUSES.has(job.status));
    if (!hasActiveJob) return undefined;

    const interval = setInterval(() => fetchJobs({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormError('');

    if (!file) {
      setCsvFile(null);
      return;
    }

    if (!/\.csv$/i.test(file.name)) {
      setFormError('Only .csv files are accepted.');
      e.target.value = '';
      setCsvFile(null);
      return;
    }

    if (file.size > MAX_CSV_BYTES) {
      setFormError('CSV file exceeds the 50MB limit.');
      e.target.value = '';
      setCsvFile(null);
      return;
    }

    setCsvFile(file);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadFile(
        `/salesforce/bulk/template?objectType=${objectType}&operation=${operation}`,
        `${objectType.toLowerCase()}-${operation}-template.csv`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (inputMode === 'csv') {
      if (!csvFile) {
        setFormError('Choose a CSV file to upload.');
        return;
      }

      try {
        await createBulkJobFromFile(operation, objectType, csvFile);
        fetchJobs();
      } catch {
        // error is already surfaced via the hook's `error` state
      }
      return;
    }

    let records;
    try {
      records = JSON.parse(recordsText || '[]');
    } catch {
      setFormError('Records must be valid JSON (an array of objects).');
      return;
    }

    if (!Array.isArray(records) || records.length === 0) {
      setFormError('Records must be a non-empty array.');
      return;
    }

    try {
      await createBulkJob(operation, objectType, records);
      fetchJobs();
    } catch {
      // error is already surfaced via the hook's `error` state
    }
  };

  const handleReset = () => {
    reset();
    setRecordsText('');
    setCsvFile(null);
    setFormError('');
  };

  // Bulk insert/update/upsert/delete against Salesforce is restricted to
  // manager/admin on the backend (see salesforce.routes.js) - a plain user
  // who reaches this route directly gets an explanation instead of a form
  // that will 403 on submit.
  if (!canManageSalesforceRecords(user)) {
    return (
      <div className="bulk-operations container">
        <div className="bulk-header-row">
          <h1>Bulk Operations</h1>
          <button type="button" className="bulk-guide-btn" onClick={() => setIsGuideOpen(true)}>
            <InfoIcon width={14} height={14} /> Limits & Best Practices
          </button>
        </div>
        <div className="bulk-permission-notice">
          <p>
            Bulk operations can create, update, or permanently delete many Salesforce records at once, so
            they&apos;re limited to manager and admin accounts.
          </p>
          <p>Contact your workspace admin if you need access.</p>
        </div>
        <BulkOperationsGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>
    );
  }

  return (
    <div className="bulk-operations container">
      <div className="bulk-header-row">
        <h1>Bulk Operations</h1>
        <button type="button" className="bulk-guide-btn" onClick={() => setIsGuideOpen(true)}>
          <InfoIcon width={14} height={14} /> Limits & Best Practices
        </button>
      </div>
      <p className="bulk-subtitle">
        Insert, update, upsert, or delete Salesforce records in bulk via the Bulk API - or export existing
        records to CSV.
      </p>

      <div className="bulk-tabs" role="tablist" aria-label="Bulk operation mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'import'}
          className={`bulk-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Import Data
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'export'}
          className={`bulk-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export Data
        </button>
      </div>

      {activeTab === 'import' ? (
        !results ? (
          <form onSubmit={handleSubmit} className="bulk-form">
            <div className="bulk-form-row">
              <div className="filter-group">
                <label>Operation</label>
                <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                  {OPERATIONS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Object Type</label>
                <select value={objectType} onChange={(e) => setObjectType(e.target.value)}>
                  {OBJECT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="bulk-template-btn"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
            >
              <DownloadIcon width={14} height={14} />
              {isDownloadingTemplate ? 'Preparing...' : `Download ${objectType} ${operation} CSV template`}
            </button>

            <div className="bulk-input-mode-toggle" role="tablist" aria-label="Record input method">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'json'}
                className={`bulk-mode-tab ${inputMode === 'json' ? 'active' : ''}`}
                onClick={() => { setInputMode('json'); setFormError(''); }}
              >
                Paste JSON
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'csv'}
                className={`bulk-mode-tab ${inputMode === 'csv' ? 'active' : ''}`}
                onClick={() => { setInputMode('csv'); setFormError(''); }}
              >
                Upload CSV File
              </button>
            </div>

            {inputMode === 'json' ? (
              <div className="filter-group">
                <label>Records (JSON array)</label>
                <textarea
                  className="bulk-records-input"
                  value={recordsText}
                  onChange={(e) => setRecordsText(e.target.value)}
                  placeholder={SAMPLE_RECORDS}
                  rows={10}
                />
              </div>
            ) : (
              <div className="filter-group">
                <label htmlFor="bulk-csv-input">CSV File</label>
                <input
                  id="bulk-csv-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="bulk-file-input"
                />
                <p className="bulk-file-hint">
                  First row must be column headers matching Salesforce field names (e.g. Name, StageName,
                  CloseDate, AccountId) - download the template above to get them right first try. Max 50MB.
                  Rows missing required fields are rejected individually and reported after upload - the rest
                  of the file still goes through.
                </p>
                {csvFile && (
                  <p className="bulk-file-selected">
                    Selected: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            )}

            {(formError || error) && (
              <div className="bulk-error">{formError || error}</div>
            )}

            {loading && (
              <div className="bulk-progress">
                <div className="bulk-progress-bar">
                  <div className="bulk-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="bulk-progress-label">{progress}%</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Running job...' : 'Run Bulk Job'}
            </button>
          </form>
        ) : (
          <div className="bulk-results">
            <h3>Job Complete</h3>
            <dl>
              <dt>Job ID</dt>
              <dd>{results.jobId}</dd>
              <dt>Status</dt>
              <dd>{results.status}</dd>
              <dt>Total Records</dt>
              <dd>{results.totalRecords}</dd>
              <dt>Successful</dt>
              <dd>{results.successfulRecords}</dd>
              <dt>Failed</dt>
              <dd>{results.failedRecords}</dd>
            </dl>

            {results.recordsRejected > 0 && (
              <div className="bulk-validation-warning">
                <p>
                  <strong>{results.recordsRejected}</strong> row(s) were rejected by validation before ever
                  reaching Salesforce and were not submitted:
                </p>
                <ul className="bulk-invalid-rows">
                  {results.invalidRecords.slice(0, 10).map((invalid) => (
                    <li key={invalid.recordIndex}>
                      Row {invalid.recordIndex + 1}: {invalid.error}
                    </li>
                  ))}
                </ul>
                {results.invalidRecords.length > 10 && (
                  <p>...and {results.invalidRecords.length - 10} more.</p>
                )}
              </div>
            )}

            <button className="btn-secondary" onClick={handleReset}>Run Another Job</button>
          </div>
        )
      ) : (
        <ExportDataForm />
      )}

      <div className="bulk-jobs-history">
        <div className="bulk-jobs-history-header">
          <h2>Recent Jobs</h2>
          <button type="button" className="bulk-refresh-btn" onClick={() => fetchJobs()} disabled={jobsLoading}>
            {jobsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {jobsLoading ? (
          <div className="loading">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">No bulk jobs yet</div>
        ) : (
          <table className="bulk-jobs-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Object</th>
                <th>Status</th>
                <th>Records</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.jobId}>
                  <td>{job.operation}</td>
                  <td>{job.objectType}</td>
                  <td>
                    <span className={`bulk-status-badge status-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.totalRecords ?? '-'}</td>
                  <td>{new Date(job.createdAt).toLocaleString()}</td>
                  <td>
                    <button type="button" className="bulk-details-btn" onClick={() => setDetailJobId(job.jobId)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailJobId && <JobDetailModal jobId={detailJobId} onClose={() => setDetailJobId(null)} />}
      <BulkOperationsGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

/**
 * ExportDataForm - the "Export Data" tab: pick an object type and optional
 * filters, then request a secure download link for the matching records
 * (see bulkOperationsController.exportRecords) and redeem it immediately.
 */
const ExportDataForm = () => {
  const toast = useToast();
  const [objectType, setObjectType] = useState('Opportunity');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async (e) => {
    e.preventDefault();
    setIsExporting(true);
    setLastExport(null);

    try {
      const params = new URLSearchParams({ objectType });
      if (search.trim()) params.set('search', search.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await api.get(`/salesforce/bulk/export?${params.toString()}`);
      const { downloadUrl, filename, recordCount } = response.data.data;

      if (!downloadUrl) {
        toast.error(response.data.message || 'No records matched your export filters');
        setLastExport({ recordCount: 0 });
        return;
      }

      await downloadFileFromLink({ downloadUrl, filename });
      toast.success(`Exported ${recordCount} record${recordCount === 1 ? '' : 's'}`);
      setLastExport({ recordCount, filename });
    } catch (err) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <form onSubmit={handleExport} className="bulk-form">
      <div className="bulk-form-row">
        <div className="filter-group">
          <label>Object Type</label>
          <select value={objectType} onChange={(e) => setObjectType(e.target.value)}>
            {EXPORT_OBJECT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Search (optional)</label>
          <input type="text" placeholder="Name contains..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bulk-form-row">
        <div className="filter-group">
          <label>Created After</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Created Before</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <p className="bulk-file-hint">
        Downloads every matching {objectType} record (not capped to one page) as a CSV file, ready to re-import
        elsewhere or archive.
      </p>

      {lastExport && lastExport.recordCount === 0 && (
        <div className="bulk-error">No records matched your export filters.</div>
      )}

      <button type="submit" className="btn-primary" disabled={isExporting}>
        <DownloadIcon width={14} height={14} /> {isExporting ? 'Exporting...' : `Export ${objectType} to CSV`}
      </button>
    </form>
  );
};

/**
 * JobDetailModal - drills into one bulk job's live status and (once
 * complete) its successful/failed record counts and download links. Every
 * endpoint here already existed on the backend (getBulkJobStatus/Results/
 * FailedRecords, createResultsDownloadLink/createFailedDownloadLink) but
 * had no UI consumer until now - the jobs table only ever showed the
 * summary row.
 */
const JobDetailModal = ({ jobId, onClose }) => {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [failed, setFailed] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get(`/salesforce/bulk/${jobId}/status`);
      setStatus(res.data.data);
      return res.data.data;
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to load job status');
      return null;
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [jobId, toast]);

  const fetchOutcome = useCallback(async () => {
    try {
      const [resultsRes, failedRes] = await Promise.all([
        api.get(`/salesforce/bulk/${jobId}/results`),
        api.get(`/salesforce/bulk/${jobId}/failed`),
      ]);
      setResults(resultsRes.data.data);
      setFailed(failedRes.data.data);
    } catch (err) {
      console.error('Error fetching job outcome:', err);
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    fetchStatus().then((data) => {
      if (!cancelled && data?.status === 'completed') fetchOutcome();
    });

    return () => { cancelled = true; };
  }, [fetchStatus, fetchOutcome]);

  // Poll status while the job is still queued/running so this modal doesn't
  // need a manual refresh either - stops itself the moment the job settles.
  useEffect(() => {
    if (!status || !ACTIVE_STATUSES.has(status.status)) return undefined;

    pollRef.current = setInterval(async () => {
      const data = await fetchStatus({ silent: true });
      if (data?.status === 'completed') fetchOutcome();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [status, fetchStatus, fetchOutcome]);

  const handleDownload = async (kind) => {
    setIsDownloading(true);
    try {
      const res = await api.post(`/salesforce/bulk/${jobId}/${kind}/download-link`);
      await downloadFileFromLink(res.data.data);
    } catch (err) {
      toast.error(err.message || `Failed to download ${kind} records`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Job ${jobId}`} maxWidth={560}>
      {isLoading ? (
        <div className="loading">Loading job details...</div>
      ) : !status ? (
        <div className="bulk-error">Could not load this job.</div>
      ) : (
        <div className="job-detail">
          <div className="job-detail-row">
            <span>Status</span>
            <span className={`bulk-status-badge status-${status.status}`}>{status.status}</span>
          </div>
          <div className="job-detail-row"><span>Salesforce State</span><strong>{status.state}</strong></div>
          <div className="job-detail-row"><span>Total Records</span><strong>{status.totalRecords}</strong></div>
          <div className="job-detail-row"><span>Processed</span><strong>{status.recordsProcessed}</strong></div>
          <div className="job-detail-row"><span>Failed (Salesforce)</span><strong>{status.recordsFailed}</strong></div>
          <div className="job-detail-row"><span>Started</span><strong>{status.startedAt ? new Date(status.startedAt).toLocaleString() : '—'}</strong></div>

          {ACTIVE_STATUSES.has(status.status) && (
            <div className="job-detail-progress">
              <div className="bulk-progress-bar">
                <div className="bulk-progress-fill" style={{ width: `${status.progress || 0}%` }} />
              </div>
              <span className="bulk-progress-label">{status.progress || 0}%</span>
            </div>
          )}

          {status.status === 'completed' && (
            <div className="job-detail-outcome">
              <div className="job-detail-row"><span>Successful</span><strong>{results?.successfulRecords ?? '—'}</strong></div>
              <div className="job-detail-row"><span>Failed</span><strong>{failed?.failedCount ?? '—'}</strong></div>
              <div className="job-detail-actions">
                <button type="button" className="bulk-details-btn" onClick={() => handleDownload('results')} disabled={isDownloading}>
                  <DownloadIcon width={13} height={13} /> Results CSV
                </button>
                <button type="button" className="bulk-details-btn" onClick={() => handleDownload('failed')} disabled={isDownloading}>
                  <DownloadIcon width={13} height={13} /> Failed CSV
                </button>
              </div>
            </div>
          )}

          {status.status === 'failed' && (
            <p className="bulk-file-hint">This job did not complete successfully - check the Salesforce Bulk API job for details.</p>
          )}
        </div>
      )}
    </Modal>
  );
};
