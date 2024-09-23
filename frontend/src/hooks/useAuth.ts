import { useState, useEffect } from 'react';
import { postData, getCurrentUser, refreshTokenRequest } from '@/utils/api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
interface AuthError extends Error {
  status?: number;
  info?: any;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        return true;
      }
      return false;
    } catch (error) {
      return true;
    }
  };

  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }
    try {
      const response = await refreshTokenRequest(storedRefreshToken);
      if (response.status === 'success') {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        setUser(response.user);
        setError(null);
      }
      return response.token;
    } catch (err) {
      logout();
      throw err;
    }
  };
  
  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } else {
          logout();
        }
      } catch (err: unknown) {
        const authError: AuthError = new Error('Failed to load user');
        if (err instanceof Error) {
          authError.message = err.message;
        }
        if (typeof err === 'object' && err !== null && 'response' in err) {
          authError.status = (err as any).response?.status;
          authError.info = (err as any).response?.data;
        }
        setError(authError);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await postData('/api/v1/user/login', { email, password });
      if (response.status === 'success') {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('username', response.username);
        localStorage.setItem('email', response.email);
        localStorage.setItem('imageUrl', response.image_url);
        setUser(response);
        setError(null);
      }
      return response;
    } catch (err: unknown) {
      const authError: AuthError = new Error('Login failed');
      if (err instanceof Error) {
        authError.message = err.message;
      }
      if (axios.isAxiosError(err) && err.response) {
        authError.status = err.response.status;
        authError.info = err.response.data;
        authError.message = err.response.data.message || 'Login failed';
      }
      setError(authError);
      throw authError;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await postData('/api/v1/user/register', { username, email, password });
      setError(null);
      return response;
    } catch (err: unknown) {
      const authError: AuthError = new Error('Registration failed');
      if (err instanceof Error) {
        authError.message = err.message;
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        authError.status = (err as any).response?.status;
        authError.info = (err as any).response?.data;
      }
      setError(authError);
      throw authError;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('imageUrl');
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };
}
