import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:2810/zoom/api/v1",
    baseURL: "https://zoom-app-vxyc.onrender.com/zoom/api/v1",
  withCredentials: true,
});

// Optional: attach token automatically on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No refresh, just reject
    if (error.response?.status === 401 || error.response?.status === 403) {
      // optional global handling
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
