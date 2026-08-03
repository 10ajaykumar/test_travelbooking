import axios from 'axios';
import { getAuthHeader } from '../utils/helpers';

const BASE_URL = process.env.REACT_APP_USER_SERVICE || '/api/users';

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
export const register = async (data) => {
  const response = await axios.post(`${BASE_URL}/register`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

/**
 * Login an existing user.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = async (data) => {
  const response = await axios.post(`${BASE_URL}/login`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

/**
 * Fetch the authenticated user's profile.
 * @returns {Promise<object>}
 */
export const getProfile = async () => {
  const response = await axios.get(`${BASE_URL}/profile`, {
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
  });
  return response.data;
};

/**
 * Update the authenticated user's profile.
 * @param {object} data - Fields to update (name, email, password, etc.)
 * @returns {Promise<object>}
 */
export const updateProfile = async (data) => {
  const response = await axios.put(`${BASE_URL}/profile`, data, {
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
  });
  return response.data;
};

const authService = { register, login, getProfile, updateProfile };
export default authService;
