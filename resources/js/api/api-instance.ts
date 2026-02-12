import type { AxiosRequestConfig } from 'axios';
import Axios from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: '/webapi',
  withCredentials: true,
  withXSRFToken: true,
}); // use your own URL here or environment variable
AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Axios error will always have error.response
    const statusCode = error.response?.status;
    const code = error.response?.data?.code || 'network-error';
    const message = error.response?.data?.message || 'Network error';
    const details = error.response?.data?.error;

    throw new ApiError(message, code, statusCode, details);
  },
);

// add a second `options` argument here if you want to pass extra options to each generated query
export const apiInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);

  return promise;
};

export class ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: any,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
