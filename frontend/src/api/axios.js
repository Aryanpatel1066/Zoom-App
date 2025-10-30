  import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:2810/zoom/api/v1",  
  withCredentials: true, // send cookies automatically
});

// Intercept responses to handle expired access tokens auto renews access token silently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.get("http://localhost:2810/zoom/api/v1/auth/refresh", {
          withCredentials: true,
        });
        const newAccessToken = res.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Retry the original request with the new token
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("Refresh token failed", err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;