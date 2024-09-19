import { useState, useEffect } from 'react';
import { postData, getCurrentUser } from '@/utils/api';

interface AuthError extends Error {
  status?: number;
  info?: any;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
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
        localStorage.setItem('username', response.username);
        localStorage.setItem('email', email);
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
      if (typeof err === 'object' && err !== null && 'response' in err) {
        authError.status = (err as any).response?.status;
        authError.info = (err as any).response?.data;
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
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('imageUrl');
      setUser(null);
      setError(null);
    } catch (err) {
      const authError: AuthError = new Error('Logout failed');
      setError(authError);
    }
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
