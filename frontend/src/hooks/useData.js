// src/hooks/useData.js
import { useState, useEffect } from 'react';
import { getProcessedData } from '../services/dataService';

/**
 * A custom hook to fetch and process data.
 * @param {string} url - The URL to fetch data from (currently unused but good practice).
 * @returns {{data: object, loading: boolean, error: string|null}}
 */
const useData = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProcessedData(url);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]); // Effect runs when the URL prop changes

  return { data, loading, error };
};

export default useData;
