// src/utils/formatters.js

/**
 * Formats an ISO date string into a more readable format.
 * @param {string} isoString - The ISO date string.
 * @returns {string} A formatted date string (e.g., "7/6/2026, 12:00:00 PM").
 */
export const formatTimestamp = (isoString) => {
  if (!isoString) return 'Invalid Date';
  return new Date(isoString).toLocaleString();
};
