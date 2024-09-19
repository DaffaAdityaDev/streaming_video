import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const postData = async (url: string, data: any, token?: string) => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await api.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error('API post request failed:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  try {
    const response = await axios.get(`${baseURL}/api/v1/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
};

export default api;
