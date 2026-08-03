import axios from 'axios';
import { getAuthHeader } from '../utils/helpers';

const BASE_URL = process.env.REACT_APP_BOOKING_SERVICE || '/api/bookings';

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
 * Book a flight.
 */
export const bookFlight = async (data) => {
  const { flightId, passengers, passengerDetails, totalAmount, travelDate } = data;
  const payload = {
    userId: getStoredUserId(),
    referenceId: flightId,
    totalAmount: totalAmount || 0,
    travelDate: travelDate || new Date().toISOString().split('T')[0],
    passengerDetails: {
      name: `${passengerDetails.firstName || ''} ${passengerDetails.lastName || ''}`.trim(),
      email: passengerDetails.email || '',
      phone: passengerDetails.phone || '',
      passengers: passengers || 1,
    },
  };
  const response = await axios.post(`${BASE_URL}/flight`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Book a hotel.
 */
export const bookHotel = async (data) => {
  const { hotelId, checkIn, checkOut, guests, guestDetails, totalAmount } = data;
  const payload = {
    userId: getStoredUserId(),
    referenceId: hotelId,
    totalAmount: totalAmount || 0,
    travelDate: checkIn || new Date().toISOString().split('T')[0],
    passengerDetails: {
      name: `${guestDetails.firstName || ''} ${guestDetails.lastName || ''}`.trim(),
      email: guestDetails.email || '',
      phone: guestDetails.phone || '',
      passengers: guests || 1,
    },
  };
  const response = await axios.post(`${BASE_URL}/hotel`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Get all bookings for the authenticated user.
 */
export const getUserBookings = async () => {
  const userId = getStoredUserId();
  const response = await axios.get(`${BASE_URL}/user/${userId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Get a single booking by ID.
 */
export const getBooking = async (bookingId) => {
  const response = await axios.get(`${BASE_URL}/${bookingId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Cancel a booking by ID.
 */
export const cancelBooking = async (bookingId) => {
  const response = await axios.put(
    `${BASE_URL}/${bookingId}/cancel`,
    {},
    { headers: authHeaders() }
  );
  return response.data;
};

const bookingService = {
  bookFlight,
  bookHotel,
  getUserBookings,
  getBooking,
  cancelBooking,
};

export default bookingService;
