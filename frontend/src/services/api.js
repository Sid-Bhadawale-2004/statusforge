import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let currentAccessToken = null;
let onTokenRefreshed = null;

export function setAccessToken(token) {
  currentAccessToken = token;
}

export function registerTokenRefreshHandler(handler) {
  onTokenRefreshed = handler;
}

api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

let isRefreshing = false;
let waitingRequests = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await api.post("/api/auth/refresh");
          const newToken = res.data.accessToken;
          setAccessToken(newToken);
          if (onTokenRefreshed) onTokenRefreshed(newToken);
          waitingRequests.forEach((resolve) => resolve(newToken));
          waitingRequests = [];
        } catch (refreshError) {
          waitingRequests = [];
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
        isRefreshing = false;
      }

      return new Promise((resolve) => {
        waitingRequests.push((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;