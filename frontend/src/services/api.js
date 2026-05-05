import axios from "axios";
import { getStoredToken } from "../utils/storage.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function loginRequest(credentials) {
  const { data } = await api.post("/auth/login", credentials);
  return data;
}

export const getStudents = () => api.get("/students").then((res) => res.data);
export const getMyProfile = () => api.get("/students/me").then((res) => res.data);
export const getMyRoom = () => api.get("/students/me/room").then((res) => res.data);
export const createStudent = (payload) => api.post("/students", payload).then((res) => res.data);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload).then((res) => res.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then((res) => res.data);

export const getRooms = () => api.get("/rooms").then((res) => res.data);
export const createRoom = (payload) => api.post("/rooms", payload).then((res) => res.data);
export const allocateRoom = (payload) => api.post("/allocate-room", payload).then((res) => res.data);

export const getComplaints = () => api.get("/complaints").then((res) => res.data);
export const createComplaint = (payload) => api.post("/complaints", payload).then((res) => res.data);
export const updateComplaint = (id, payload) => api.put(`/complaints/${id}`, payload).then((res) => res.data);

export const getPayments = () => api.get("/payments").then((res) => res.data);
export const createPayment = (payload) => api.post("/payments", payload).then((res) => res.data);

export const getMenu = () => api.get("/menu").then((res) => res.data);

export const requestOutpass = (payload) => api.post("/outpass/request", payload).then((res) => res.data);
export const approveOutpass = (id, payload) => api.put(`/outpass/approve/${id}`, payload).then((res) => res.data);
export const checkoutOutpass = (id) => api.put(`/outpass/checkout/${id}`).then((res) => res.data);
export const checkinOutpass = (id) => api.put(`/outpass/checkin/${id}`).then((res) => res.data);
export const getCurrentlyOutside = () => api.get("/outpass/currently-outside").then((res) => res.data);

export const getAnnouncements = () => api.get("/announcements").then((res) => res.data);
export const createAnnouncement = (payload) => api.post("/announcements", payload).then((res) => res.data);
export const markAnnouncementRead = (id) => api.put(`/announcements/${id}/read`).then((res) => res.data);
