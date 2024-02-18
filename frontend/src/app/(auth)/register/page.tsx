"use client"
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import axios from 'axios'
import Auth from '@/app/_components/auth'

export default function Register() {
  const router = useRouter()
  const [username, setUsername] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  const formMaker = [
    {
      type: "text",
      name: "username",
      placeholder: "Username",
      value: username,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setUsername(event.target.value),
      icon: "user",
    },
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
    const usernameInput = target.elements.namedItem('username') as HTMLInputElement;
    const emailInput = target.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = target.elements.namedItem('password') as HTMLInputElement;

    if (!emailInput || !passwordInput || !usernameInput) {
      setError('Please fill in all fields');
      return;
    };
    
    axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/register`, {
      username: username,
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
        router.push('/login')
      } 
      if (response.data.status === 'error') {
        // console.log("error", response.data.message)
        setError(response.data.message)
      }
    }).catch((error) => {
      console.log("catch", error)
      setError(error.toString())
    })
  }

  return (
    <>
      <Auth
        path='Register'
        message='Please enter your email and password to register'
        formMaker={formMaker}
        handleBtnSubmit={handleLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        setError={setError}
        gotoAltPath='login'
        haveAccount={true}
      />
    </>
  )
}

