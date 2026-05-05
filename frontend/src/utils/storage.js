const TOKEN_KEY = "hms_token";
const USER_KEY = "hms_user";
const ANNOUNCEMENTS_KEY = "hms_announcements";
const READ_KEY = "hms_read_notifications";

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  const value = localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
};

export const setStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const clearStoredUser = () => localStorage.removeItem(USER_KEY);

export const getAnnouncements = () => JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || "[]");
export const saveAnnouncement = (announcement) => {
  const announcements = [announcement, ...getAnnouncements()];
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  return announcements;
};

export const getReadNotifications = () => JSON.parse(localStorage.getItem(READ_KEY) || "[]");
export const markNotificationsRead = (ids) => localStorage.setItem(READ_KEY, JSON.stringify(ids));
