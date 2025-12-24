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

    // 🚫 Do not intercept refresh endpoint
    if (originalRequest.url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.get(
          "http://localhost:2810/zoom/api/v1/auth/refresh",
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (err) {
        // ⛔ Refresh failed → logout
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);


export default api;