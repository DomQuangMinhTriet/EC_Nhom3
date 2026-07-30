// src/services/dataService.js
import { fetchTestData } from '../api/testApi';
import { formatTimestamp } from '../utils/formatters';

/**
 * Processes the data from the test API.
 * This is where business logic would reside.
 * @returns {Promise<object>} A promise that resolves with processed data.
 */
export const getProcessedData = async () => {
  try {
    const rawData = await fetchTestData('/api/test');

    // Example of a service adding/modifying data
    const processedData = {
      ...rawData.data,
      formattedTimestamp: formatTimestamp(rawData.data.timestamp),
      clientProcessed: true,
    };

    return {
      ...rawData,
      data: processedData,
    };
  } catch (error) {
    console.error("Error in data service:", error);
    throw error;
  }
};
