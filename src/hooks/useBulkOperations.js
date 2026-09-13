
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

  const createBulkJob = useCallback(
    async (operation, objectType, records) => {
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

        // Upload data
        const uploadResponse = await api.post(
          `/salesforce/bulk/${jobId}/upload`,
          records
        );

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
          totalRecords: records.length,
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
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setProgress(0);
    setResults(null);
  }, []);

  return {
    createBulkJob,
    loading,
    error,
    progress,
    results,
    reset,
  };
};

export default useBulkOperations;