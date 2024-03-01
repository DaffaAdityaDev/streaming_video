'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Auth from '@/app/_components/auth'
import Lamp from '@/app/_components/animation/lamp'

export default function Register() {
  const router = useRouter()
  const [username, setUsername] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [alertMessage, setAlertMessage] =  useState({ text: '', type: 'none' });

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
  ]

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = event.target as HTMLFormElement
    const usernameInput = target.elements.namedItem('username') as HTMLInputElement
    const emailInput = target.elements.namedItem('email') as HTMLInputElement
    const passwordInput = target.elements.namedItem('password') as HTMLInputElement

    if (!emailInput || !passwordInput || !usernameInput) {
      setAlertMessage({ text: 'Please fill in all fields', type: 'error' })
      return
    }

    axios
      .post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/register`,
        {
          username: username,
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
        if (response.data.status === 'success') {
          setAlertMessage({ text: response.data.message, type: 'success' })
          setTimeout(() => {
            router.push('/login'); // Redirect to the home page or any other page
          }, 2000);
        }
        if (response.data.status === 'error') {
          // console.log("error", response.data.message)
          setAlertMessage({ text: response.data.message, type: 'error' })
        }
      })
      .catch((error) => {
        console.log('catch', error)
        setAlertMessage({ text: 'An error occurred', type: 'error' })
      })
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
  )
}
