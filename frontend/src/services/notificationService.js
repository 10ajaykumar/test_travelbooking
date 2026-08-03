import axios from 'axios';
import { getAuthHeader } from '../utils/helpers';

const BASE_URL =
  process.env.REACT_APP_NOTIFICATION_SERVICE || '/api/notifications';

const authHeaders = () => ({
  ...getAuthHeader(),
  'Content-Type': 'application/json',
});

/**
 * Fetch all notifications for the authenticated user.
 * @returns {Promise<object[]>}
 */
export const getUserNotifications = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const response = await axios.get(`${BASE_URL}/user/${user.id}`, {
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Mark a notification as read by its ID.
 * @param {string} notificationId
 * @returns {Promise<object>}
 */
export const markAsRead = async (notificationId) => {
  const response = await axios.put(
    `${BASE_URL}/${notificationId}/read`,
    {},
    { headers: authHeaders() }
  );
  return response.data;
};

/**
 * Mark all notifications as read.
 * @returns {Promise<object>}
 */
export const markAllAsRead = async () => {
  const data = await getUserNotifications();
  const notifications = Array.isArray(data) ? data : data.notifications || [];
  await Promise.all(
    notifications
      .filter((notification) => !(notification.isRead || notification.read))
      .map((notification) => markAsRead(notification._id || notification.id))
  );
  return { message: 'Notifications marked as read' };
};

const notificationService = { getUserNotifications, markAsRead, markAllAsRead };
export default notificationService;
