import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true,
});
