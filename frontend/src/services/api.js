const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    // If downloading a binary PDF directly
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      if (!response.ok) {
        throw new Error(`Failed to download report: HTTP ${response.status}`);
      }
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || `HTTP ${response.status}: Request failed`);
    }

    return data.data !== undefined ? data.data : data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return apiRequest(url, { method: 'GET' });
  },
  post: (endpoint, body = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
};
