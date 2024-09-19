'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Auth from '@/components/auth';
import Lamp from '@/components/animation/lamp';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [alertMessage, setAlertMessage] = useState({ text: '', type: 'none' });

  const formMaker = [
    {
      type: 'text',
      name: 'username',
      placeholder: 'Username',
      value: username,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setUsername(event.target.value),
      icon: 'user',
    },
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

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username || !email || !password) {
      setAlertMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      const response = await register(username, email, password);
      if (response.status === 'success') {
        setAlertMessage({ text: response.message, type: 'success' });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setAlertMessage({ text: response.message || 'Registration failed', type: 'error' });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setAlertMessage({ text: error.message || 'An error occurred', type: 'error' });
      } else {
        setAlertMessage({ text: 'An unknown error occurred', type: 'error' });
      }
    }
  }

  return (
    <>
      <Lamp>
        <Auth
          path="Register"
          message="Please enter your email and password to register"
          formMaker={formMaker}
          handleBtnSubmit={handleRegister}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          gotoAltPath="login"
          haveAccount={true}
        />
      </Lamp>
    </>
  );
}
