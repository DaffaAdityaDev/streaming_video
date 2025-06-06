import axios from 'axios';

const APIVERSION = process.env.NEXT_PUBLIC_BACKEND_API_VERSION;
const BACKENDURL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BASE_API_URL = `${BACKENDURL}/api/${APIVERSION}`;

const api = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await refreshTokenRequest(storedRefreshToken);
        localStorage.setItem('token', response.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, logout the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

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

export const postData = async (endpoint: string, data: any, token?: string | null) => {
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  // const url = `${BASE_URL}${endpoint}`;
  // console.log(url);

  try {
    const response = await axios.post(endpoint, data, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error) {
    console.error('API post request failed:', error);
    throw error;
  }
};

export const refreshTokenRequest = async (refreshToken: string) => {
  try {
    const response = await api.post('/user/refresh-token', { refreshToken });
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  if (!token) {
    return null;
  }
  try {
    const response = await axios.get(`${BASE_API_URL}/user/user-profile`, {
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

export const getCurrentUserProfile = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found in localStorage');
    return null;
  }
  try {
    const userEmail = await getCurrentUser();
    const response = await api.get(`${BASE_API_URL}/user/user-profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error('Unauthorized: Token may be invalid or expired');
        // Optionally, you can trigger a logout or token refresh here
      } else {
        console.error(
          `Failed to fetch user profile: ${error.response?.data?.message || error.message}`,
        );
      }
    } else {
      console.error('An unexpected error occurred while fetching user profile');
    }
    return null;
  }
};

export default api;
