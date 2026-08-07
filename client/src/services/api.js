import axios from "axios";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicPath =
      typeof window !== "undefined" &&
      PUBLIC_PATHS.some((path) => window.location.pathname.includes(path));

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isPublicPath
    ) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;