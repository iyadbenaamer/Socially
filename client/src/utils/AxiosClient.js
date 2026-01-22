import axios from "axios";

const API_URL = `${import.meta.env.VITE_APP_URL}/api`;

const axiosClient = axios.create({ baseURL: API_URL });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
