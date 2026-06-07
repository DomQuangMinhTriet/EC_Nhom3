// src/api/testApi.js

/**
 * Mocks a fetch call to a test API endpoint.
 * In a real application, this would use fetch() or a library like axios
 * to make a network request to the backend.
 * @param {string} endpoint - The API endpoint to call.
 * @returns {Promise<object>} A promise that resolves with the mock data.
 */
export const fetchTestData = async (endpoint) => {
  console.log(`Fetching from ${endpoint}...`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock response data
  const mockData = {
    success: true,
    message: "Data fetched successfully!",
    data: {
      id: 1,
      name: "Test Item",
      timestamp: new Date().toISOString(),
    },
  };

  return mockData;
};
