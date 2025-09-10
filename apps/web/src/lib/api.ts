// Simple API client without external dependencies
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get(endpoint: string, options?: { params?: Record<string, any> }) {
    const url = new URL(endpoint, this.baseURL);
    
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const api = new APIClient(API_BASE_URL);