import { useState, useEffect, useCallback } from 'react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import api from '../services/api';
import './BulkOperations.css';

const OPERATIONS = ['insert', 'update', 'upsert', 'delete'];
const OBJECT_TYPES = ['Opportunity', 'Account', 'Contact', 'Task'];

const SAMPLE_RECORDS = `[
  { "Name": "New Deal", "StageName": "Prospecting", "CloseDate": "2026-12-31", "AccountId": "001XXXXXXXXXXXXXXX" }
]`;

export default function BulkOperations() {
  const { createBulkJob, loading, error, progress, results, reset } = useBulkOperations();

  const [operation, setOperation] = useState('insert');
  const [objectType, setObjectType] = useState('Opportunity');
  const [recordsText, setRecordsText] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

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
    setFormError('');
  };

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
