import axios from 'axios';

const BASE_URL = process.env.REACT_APP_SEARCH_SERVICE || '/api/search';

/**
 * Search for available flights.
 * @param {{ origin: string, destination: string, date: string, passengers: number }} params
 * @returns {Promise<object[]>}
 */
export const searchFlights = async (params) => {
  const response = await axios.get(`${BASE_URL}/flights`, {
    params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

/**
 * Search for available hotels.
 * @param {{ city: string, checkIn: string, checkOut: string, guests: number }} params
 * @returns {Promise<object[]>}
 */
export const searchHotels = async (params) => {
  const response = await axios.get(`${BASE_URL}/hotels`, {
    params,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

/**
 * Get a single flight by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getFlightById = async (id) => {
  const response = await axios.get(`${BASE_URL}/flights/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

/**
 * Get a single hotel by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getHotelById = async (id) => {
  const response = await axios.get(`${BASE_URL}/hotels/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

const searchService = { searchFlights, searchHotels, getFlightById, getHotelById };
export default searchService;
