#!/usr/bin/env node

/**
 * Get current timestamp utility
 * Ensures consistent timestamp format across the project
 */

const formatDate = (date = new Date()) => {
  // Format: YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const formatDateTime = (date = new Date()) => {
  // Format: YYYY-MM-DD HH:MM:SS
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
};

const getTimezone = () => {
  // Get timezone abbreviation
  const date = new Date();
  const timezoneName = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
  return timezoneName;
};

const getFullTimestamp = () => {
  const date = new Date();
  return `${formatDateTime(date)} ${getTimezone()}`;
};

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const format = args[0] || 'date';
  
  switch (format) {
    case 'full':
      console.log(getFullTimestamp());
      break;
    case 'datetime':
      console.log(formatDateTime());
      break;
    case 'date':
    default:
      console.log(formatDate());
      break;
  }
}

module.exports = {
  formatDate,
  formatDateTime,
  getTimezone,
  getFullTimestamp
};