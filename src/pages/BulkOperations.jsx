import { useState, useEffect, useCallback } from 'react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { useAuth } from '../context/useAuth';
import { canManageSalesforceRecords } from '../utils/permissions';
import api from '../services/api';
import './BulkOperations.css';

const OPERATIONS = ['insert', 'update', 'upsert', 'delete'];
const OBJECT_TYPES = ['Opportunity', 'Account', 'Contact', 'Task'];

const SAMPLE_RECORDS = `[
  { "Name": "New Deal", "StageName": "Prospecting", "CloseDate": "2026-12-31", "AccountId": "001XXXXXXXXXXXXXXX" }
]`;

// Mirrors the backend's own limits (see middleware/csvUpload.js) so a bad
// file is rejected instantly instead of only after a round trip.
const MAX_CSV_BYTES = 50 * 1024 * 1024;

export default function BulkOperations() {
  const { user } = useAuth();
  const { createBulkJob, createBulkJobFromFile, loading, error, progress, results, reset } = useBulkOperations();

  const [operation, setOperation] = useState('insert');
  const [objectType, setObjectType] = useState('Opportunity');
  const [inputMode, setInputMode] = useState('json'); // 'json' | 'csv'
  const [recordsText, setRecordsText] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [formError, setFormError] = useState('');

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    const attemptFetch = async () => {
      setJobsLoading(true);
      try {
        const response = await api.get('/salesforce/bulk');
        setJobs(response.data.data || []);
      } catch (err) {
        console.error('Error fetching bulk jobs:', err);
      } finally {
        setJobsLoading(false);
      }
    };

    return attemptFetch();
  }, []);

  useEffect(() => {
    fetchJobs().catch(() => {});
  }, [fetchJobs]);

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
        <h1>Bulk Operations</h1>
        <div className="bulk-permission-notice">
          <p>
            Bulk operations can create, update, or permanently delete many Salesforce records at once, so
            they&apos;re limited to manager and admin accounts.
          </p>
          <p>Contact your workspace admin if you need access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-operations container">
      <h1>Bulk Operations</h1>
      <p className="bulk-subtitle">
        Insert, update, upsert, or delete Salesforce records in bulk via the Bulk API.
      </p>

      {!results ? (
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
                CloseDate, AccountId). Max 50MB. Rows missing required fields are rejected individually and
                reported after upload - the rest of the file still goes through.
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
      )}

      <div className="bulk-jobs-history">
        <h2>Recent Jobs</h2>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
