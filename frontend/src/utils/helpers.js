/**
 * Format a date string or Date object into a human-readable format.
 * @param {string|Date} date
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  try {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
  } catch {
    return String(date);
  }
};

/**
 * Format a date and time.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

/**
 * Format a time string from ISO date or time string.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

/**
 * Format a price number to a currency string.
 * @param {number} amount
 * @param {string} currency - ISO 4217 currency code
 * @returns {string}
 */
export const formatPrice = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return 'N/A';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
};

/**
 * Format flight duration from minutes to "Xh Ym" string.
 * @param {number} minutes
 * @returns {string}
 */
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return 'N/A';
  const hrs = Math.floor(Number(minutes) / 60);
  const mins = Number(minutes) % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

/**
 * Build the Authorization header object with the stored JWT token.
 * @returns {{ Authorization: string } | {}}
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

/**
 * Truncate a string to a given max length.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (str, maxLength = 80) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};

/**
 * Generate a random booking reference string.
 * @returns {string}
 */
export const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'TB';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

/**
 * Calculate tax amount (10%) on a base price.
 * @param {number} basePrice
 * @returns {number}
 */
export const calculateTax = (basePrice) => {
  return Number((Number(basePrice) * 0.1).toFixed(2));
};

/**
 * Calculate total price including 10% tax.
 * @param {number} basePrice
 * @returns {number}
 */
export const calculateTotal = (basePrice) => {
  const base = Number(basePrice);
  return Number((base + base * 0.1).toFixed(2));
};

/**
 * Render star rating as array of boolean values.
 * @param {number} rating - 0 to 5
 * @returns {boolean[]}
 */
export const getStarArray = (rating) => {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(Number(rating)));
};

/**
 * Determine booking status badge color class.
 * @param {string} status
 * @returns {string}
 */
export const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
