import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token when available
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // TODO: Add auth token from Keycloak when auth is implemented
        // const token = getAccessToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          
          switch (status) {
            case 401:
              // Unauthorized - redirect to login
              console.warn('Unauthorized access - redirect to login');
              // TODO: Handle auth redirect
              break;
            case 403:
              console.warn('Forbidden - insufficient permissions');
              break;
            case 404:
              console.warn('Resource not found');
              break;
            case 500:
              console.error('Server error');
              break;
          }
        } else if (error.request) {
          // Network error
          console.error('Network error - unable to reach server');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async getHealth(): Promise<any> {
    const response = await this.client.get('/actuator/health');
    return response.data;
  }

  // Generic methods for future use
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Expose the underlying axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;