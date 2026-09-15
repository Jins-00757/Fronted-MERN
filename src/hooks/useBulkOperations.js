
import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * useBulkOperations - Handle bulk create/update/delete operations
 */
export const useBulkOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  /**
   * Shared create-job -> upload -> close -> poll -> results orchestration.
   * `upload(jobId)` is the only step that differs between the JSON-array
   * flow (createBulkJob) and the CSV-file flow (createBulkJobFromFile) - it
   * must resolve to the upload endpoint's `response.data` (which carries
   * `recordsUploaded`/`recordsRejected`/`invalidRecords` either way, see
   * bulkOperationsController.js's uploadBulkData/uploadBulkDataFile).
   */
  const runBulkJob = useCallback(async (operation, objectType, upload) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Create job
      const jobResponse = await api.post('/salesforce/bulk/create-job', {
        operation,
        objectType,
      });

      if (!jobResponse.data.success) {
        throw new Error(jobResponse.data.message);
      }

      const jobId = jobResponse.data.data.id;
      setProgress(25);

      // Upload data (JSON array or CSV file, depending on the caller)
      const uploadResponse = await upload(jobId);

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message);
      }

      setProgress(50);

      // Close job (start processing)
      const closeResponse = await api.post(
        `/salesforce/bulk/${jobId}/close`
      );

      if (!closeResponse.data.success) {
        throw new Error(closeResponse.data.message);
      }

      setProgress(75);

      // Poll for completion
      let jobStatus = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const statusResponse = await api.get(
          `/salesforce/bulk/${jobId}/status`
        );

        jobStatus = statusResponse.data.data;

        if (['JobComplete', 'Failed', 'Aborted'].includes(jobStatus.state)) {
          break;
        }

        attempts++;
      }

      setProgress(90);

      // Get results
      const resultsResponse = await api.get(
        `/salesforce/bulk/${jobId}/results`
      );

      const finalResults = {
        jobId,
        status: jobStatus.state,
        totalRecords: uploadResponse.data.data.recordsUploaded,
        recordsRejected: uploadResponse.data.data.recordsRejected || 0,
        invalidRecords: uploadResponse.data.data.invalidRecords || [],
        successfulRecords: resultsResponse.data.data?.successfulRecords || 0,
        failedRecords: resultsResponse.data.data?.failedRecords || 0,
      };

      setResults(finalResults);
      setProgress(100);
      setLoading(false);

      return finalResults;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const createBulkJob = useCallback(
    (operation, objectType, records) =>
      runBulkJob(operation, objectType, (jobId) =>
        api.post(`/salesforce/bulk/${jobId}/upload`, records)
      ),
    [runBulkJob]
  );

  /**
   * Same job lifecycle as createBulkJob, but the records come from an
   * actual CSV File (e.g. an <input type="file">) instead of a parsed JSON
   * array - see middleware/csvUpload.js on the backend for the file-type/
   * size validation and SHA-256 hashing applied before this ever reaches
   * Salesforce.
   */
  const createBulkJobFromFile = useCallback(
    (operation, objectType, file) =>
      runBulkJob(operation, objectType, (jobId) => {
        const formData = new FormData();
        formData.append('file', file);
        // Do NOT set Content-Type here - the default axios instance
        // (services/api.js) sets 'application/json' on every request, and
        // multipart/form-data needs a `boundary=...` parameter that only
        // the browser can generate when it serializes the FormData body
        // itself. Explicitly overriding to undefined removes the JSON
        // default so axios's FormData detection can set the correct
        // multipart header (with boundary) instead - setting the literal
        // string 'multipart/form-data' here would silently produce a
        // boundary-less header the backend's multer parser can't read.
        return api.post(`/salesforce/bulk/${jobId}/upload-file`, formData, {
          headers: { 'Content-Type': undefined },
        });
      }),
    [runBulkJob]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setProgress(0);
    setResults(null);
  }, []);

  return {
    createBulkJob,
    createBulkJobFromFile,
    loading,
    error,
    progress,
    results,
    reset,
  };
};

export default useBulkOperations;
