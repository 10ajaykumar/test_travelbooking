import axios from 'axios';
import { getAuthHeader } from '../utils/helpers';

const BASE_URL = process.env.REACT_APP_PAYMENT_SERVICE || '/api/payments';

const authHeaders = () => ({
  ...getAuthHeader(),
  'Content-Type': 'application/json',
});

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || '';
  } catch { return ''; }
};

/**
 * Process a payment for a booking.
 * @param {object} data - { bookingId, amount, currency, cardNumber, expiryMonth, expiryYear, cvv }
 */
export const processPayment = async (data) => {
  const { bookingId, amount, currency, cardNumber, expiryMonth, expiryYear, cvv } = data;
  const payload = {
    bookingId,
    userId: getStoredUserId(),
    amount,
    currency: currency || 'USD',
    cardNumber: (cardNumber || '').replace(/\s/g, ''),
    expiryMonth: String(expiryMonth),
    expiryYear: String(expiryYear),
    cvv: String(cvv),
  };
  const response = await axios.post(`${BASE_URL}/process`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Get payment details by payment ID.
 * @param {string} paymentId
 * @returns {Promise<object>}
 */
export const getPayment = async (paymentId) => {
  const response = await axios.get(`${BASE_URL}/${paymentId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Request a refund for a payment.
 * @param {string} paymentId
 * @param {object} data - { reason }
 * @returns {Promise<object>}
 */
export const refund = async (paymentId, data = {}) => {
  const response = await axios.post(`${BASE_URL}/${paymentId}/refund`, data, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Get payment details by booking ID.
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
export const getPaymentByBooking = async (bookingId) => {
  const response = await axios.get(`${BASE_URL}/booking/${bookingId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

const paymentService = { processPayment, getPayment, refund, getPaymentByBooking };
export default paymentService;
