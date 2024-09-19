'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Auth from '@/components/auth';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';

const Lamp = dynamic(() => import('@/components/animation/lamp'), {
  loading: () => <p>Loading...</p>,
});

export default function Login() {
  const router = useRouter();
  const { login, user, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState({ text: '', type: 'none' });

  useEffect(() => {
    if (error) {
      setAlertMessage({ text: error.message || 'An error occurred', type: 'error' });
    }
  }, [error]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password) {
      setAlertMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      const response = await login(email, password);
      if (response.status === 'success') {
        setAlertMessage({ text: 'Login successful', type: 'success' });
        router.push('/');
      } else {
        setAlertMessage({ text: response.message || 'Login failed', type: 'error' });
      }
    } catch (error) {
      if (error instanceof Error) {
        setAlertMessage({ text: error.message || 'Internal server error', type: 'error' });
      } else {
        setAlertMessage({ text: 'An unexpected error occurred', type: 'error' });
      }
    }
  }

  const formMaker = [
    {
      type: 'email',
      name: 'email',
      placeholder: 'Email',
      value: email,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value),
      icon: 'envelope',
    },
    {
      type: 'password',
      name: 'password',
      placeholder: 'Password',
      value: password,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
      icon: 'key',
    },
  ];

  return (
    <>
      <Lamp>
        <Auth
          path="Login"
          message="Please enter your email and password to login"
          formMaker={formMaker}
          handleBtnSubmit={handleLogin}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          gotoAltPath="register"
        />
      </Lamp>
    </>
  );
}
