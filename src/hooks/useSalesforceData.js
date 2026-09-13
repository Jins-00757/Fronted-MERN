// Frontend-MERN/src/hooks/useSalesforceData.js

import { useEffect, useCallback, useState, useRef } from 'react';
import api from '../services/api';

/**
 * useSalesforceData - Fetch and cache Salesforce data with automatic refresh
 */
export const useSalesforceData = (
  endpoint,
  //dependencies = [],
  options = {}
) => {
  const {
    cacheTime = 300000, // 5 minutes
    retryCount = 3,
    retryDelay = 1000,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    let retries = 0;
    
    const attemptFetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(endpoint);

        if (response.data.success) {
          setData(response.data.data);
          setLastFetched(new Date());
          setIsCached(response.data.source === 'cache');
          setLoading(false);
          retryCountRef.current = 0;
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to fetch data');
        }
      } catch (err) {
        if (retries < retryCount) {
          retries++;
          const delay = retryDelay * Math.pow(2, retries - 1);
          console.warn(
            `Retry ${retries}/${retryCount} after ${delay}ms`
          );
          
          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );
          
          return attemptFetch();
        }

        setError(err.message);
        setLoading(false);
        console.error(`Failed to fetch ${endpoint}:`, err);
        throw err;
      }
    };

    return attemptFetch();
  }, [endpoint, retryCount, retryDelay]);

  useEffect(() => {
    fetchData().catch((err) => {
      console.error('Final fetch error:', err);
    });

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData().catch((err) => {
          console.error('Auto-refresh error:', err);
        });
      }, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [endpoint, autoRefresh, refreshInterval, fetchData]);

  const refetch = useCallback(() => {
    setIsCached(false);
    return fetchData();
  }, [fetchData]);

  const getIsStale = useCallback(() => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched.getTime() > cacheTime;
  }, [lastFetched, cacheTime]);

  return {
    data,
    loading,
    error,
    lastFetched,
    isCached,
    isStale: getIsStale(),
    refetch,
    isReady: !loading && data !== null,
  };
};

export default useSalesforceData;