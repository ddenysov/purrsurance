// API Client configuration
interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// Default configuration (same-origin relative paths work with Laravel + Vite dev proxy)
const defaultConfig: ApiConfig = {
    baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api',
    timeout: parseInt((import.meta.env.VITE_API_TIMEOUT as string | undefined) || '10000', 10),
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
};

// API Response wrapper
interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
  success: boolean
  error?: string
}

// API Error class
class ApiError extends Error {
  public status: number
  public statusText: string
  public response?: Response

  constructor(message: string, status: number, statusText: string, response?: Response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.response = response
  }
}

// Request options interface
interface RequestOptions extends RequestInit {
  timeout?: number
  baseURL?: string
}

// Main API Client class
class ApiClient {
  private config: ApiConfig

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // Set authorization token
  setAuthToken(token: string): void {
    this.config.headers.Authorization = `Bearer ${token}`
  }

  // Remove authorization token
  removeAuthToken(): void {
    delete this.config.headers.Authorization
  }

  // Set custom header
  setHeader(key: string, value: string): void {
    this.config.headers[key] = value
  }

  // Remove custom header
  removeHeader(key: string): void {
    delete this.config.headers[key]
  }

  // Update base URL
  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL
  }

  // Generic request method
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.config.timeout,
      baseURL = this.config.baseURL,
      headers = {},
      ...fetchOptions
    } = options

    const isFullUrl = /^https?:\/\//i.test(endpoint);
    const isRootPath = endpoint.startsWith('/');
    const url = isFullUrl || isRootPath ? endpoint : `${baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    
    const requestHeaders: Record<string, string> = {
      ...this.config.headers,
      ...headers,
    } as Record<string, string>;

    if (fetchOptions.body instanceof FormData) {
      delete requestHeaders['Content-Type'];
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Parse response
      let data: T
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = (await response.text()) as T
      }

      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        success: response.ok
      }

      if (!response.ok) {
        const errBody = data as { message?: string };

        throw new ApiError(
            errBody?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            response,
        );
      }

      return apiResponse
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Час очікування запиту вичерпано', 408, 'Request Timeout')
      }

      const message = error instanceof Error ? error.message : 'Помилка мережі'

      throw new ApiError(
        message || 'Помилка мережі',
        0,
        'Network Error'
      )
    }
  }

  // GET request
  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    })
  }

  // POST request
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // PUT request
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // PATCH request
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // DELETE request
  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    })
  }

  // Upload file
  async upload<T = any>(
    endpoint: string,
    file: File,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    })
  }
}

// Create default instance
const apiClient = new ApiClient()

// Export both the class and instance
export { ApiClient, ApiError, apiClient }
export type { ApiResponse, RequestOptions, ApiConfig }
