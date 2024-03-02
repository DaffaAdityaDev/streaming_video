'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Auth from '@/app/_components/auth'
import Lamp from '@/app/_components/animation/lamp'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [alertMessage, setAlertMessage] = useState({ text: '', type: 'none' })

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
  ]

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = event.target as HTMLFormElement
    const emailInput = target.elements.namedItem('email') as HTMLInputElement
    const passwordInput = target.elements.namedItem('password') as HTMLInputElement
    if (!emailInput || !passwordInput) {
      setAlertMessage({ text: 'Please fill in all fields', type: 'error' })
      return
    }

    axios
      .post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/login`,
        {
          email: email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        // console.log(response.data)
        // setAlertMessage(response.data.message)
        if (response.data.status === 'success') {
          setAlertMessage({ text: 'Login successful', type: 'success' })
          // console.log('Login successful')
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('username', response.data.username)
          localStorage.setItem('email', email)
          // console.log('Token saved', localStorage.getItem('token'))
          router.push('/')
        }
        if (response.data.status === 'error') {
          // console.log(response.data.message)
          setAlertMessage({ text: response.data.message, type: 'error' })
        }
      })
      .catch((error) => {
        // console.log(error)
        setAlertMessage({ text: 'Internal server error', type: 'error' })
      })
  }

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
  )
}
