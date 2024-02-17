"use client"
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import axios from 'axios'
import Auth from '@/app/_components/auth'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  const formMaker = [
    {
      type: 'email',
      name: 'email',
      placeholder: 'Email',
      value: email,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value),
      icon: 'envelope'
    },
    {
      type: 'password',
      name: 'password',
      placeholder: 'Password',
      value: password,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
      icon: 'key'
    }
  ]

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const emailInput = target.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = target.elements.namedItem('password') as HTMLInputElement;
    if (!emailInput || !passwordInput) {
      setError('Please fill in all fields');
      return;
    };
    
    axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/login`, {
      email: email,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      // console.log(response.data)
      if (response.data.status === 'success') {
        console.log('Login successful')
        localStorage.setItem('token', response.data.token)
        // console.log('Token saved', localStorage.getItem('token'))
        router.push('/')
      } 
      if (response.data.status === 'error') {
        console.log(response.data.message)
        setError(response.data.message)
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  return (
    <>
      <Auth
        path='Login'
        message='Please enter your email and password to login'
        formMaker={formMaker}
        handleBtnSubmit={handleLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        setError={setError}
        gotoAltPath='register'
      />
    </>
  )
}

