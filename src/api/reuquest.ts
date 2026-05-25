import { message } from "ant-design-vue";
import axios, { type AxiosRequestConfig } from "axios";

export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASIC_URL,
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
  },
});

service.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    message.error(error.response?.data?.message || error);
    return Promise.reject(error);
  },
);

type ApiRequest = {
  <T = unknown>(
    config: AxiosRequestConfig & { responseType?: "json" },
  ): Promise<ApiResponse<T>>;
  (config: AxiosRequestConfig & { responseType: "blob" }): Promise<Blob>;
};

export default service as ApiRequest;
