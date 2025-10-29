/**
 * Tavus API Client
 * Low-level HTTP client for Tavus API interactions
 */

import { TavusApiConfig, TavusApiResponse } from './types';

export class TavusClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: Partial<TavusApiConfig>) {
    this.apiKey = config?.apiKey || process.env.TAVUS_API_KEY || '';
    this.baseUrl = config?.baseUrl || 'https://tavusapi.com/v2';

    if (!this.apiKey) {
      throw new Error('TAVUS_API_KEY is required');
    }
  }

  /**
   * Make authenticated request to Tavus API
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TavusApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    const data = response.ok ? await response.json() : null;
    const error = !response.ok ? await response.text() : undefined;

    return {
      data,
      error,
      status: response.status,
    };
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<TavusApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any): Promise<TavusApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any): Promise<TavusApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any): Promise<TavusApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<TavusApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Create a new Tavus client instance
 */
export function createTavusClient(config?: Partial<TavusApiConfig>): TavusClient {
  return new TavusClient(config);
}