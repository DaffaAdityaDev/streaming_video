"use client"
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import axios from 'axios'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const emailInput = target.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = target.elements.namedItem('password') as HTMLInputElement;
    if (!emailInput || !passwordInput) {
      setError('Please fill in all fields');
      return;
    };
    
    axios.post('http://localhost:8000/login', {
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

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    if (target.name === 'email') {
      
      setEmail(target.value)
      if (!checkEmailIsValid(target.value)) {
        setError('Please enter a valid email address');
      } else {
        setError('')
      }
    }
    if (target.name === 'password') {
      setPassword(target.value)
    }
  }

  function checkEmailIsValid(email: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  function handleSkipLogin() {
    localStorage.setItem('token', '')
    router.push('/')
  }

  return (
    <div className='w-full h-screen flex flex-col justify-center items-center'>
      <h1 className='text-4xl font-bold'>Login</h1>
      <p>
        Welcome back! Please login to your account
      </p>
      <div className='relative pt-4'>
        <form onSubmit={handleLogin} className='flex flex-col gap-2'>
          <div>
            <label>Email</label>
            <label className={`input input-bordered flex items-center gap-2 bg-neutral ${error && "input-error" }`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" /><path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" /></svg>
              <input type="email" className="grow bg-neutral" name="email" onChange={handleInputChange} value={email} />
            </label>
          </div>
          <div>
            <label>Password</label>
            <label className={`input input-bordered flex items-center gap-2 bg-neutral ${error && "input-error" }`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" /></svg>
              <input type="password" className="grow bg-neutral" name="password" onChange={handleInputChange} value={password} />
            </label>
            <button className="btn btn-primary mt-4 w-full" type="submit">Login</button>
          </div>
        </form>
        <button className="btn btn-outline btn-accent mt-4 w-full" onClick={handleSkipLogin}>Go To Main Page</button>
        {
          error &&
          <div role="alert" className="absolute alert alert-error w-full mt-20 flex justify-center items-center ">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        }
      </div>
     
    </div>
  )
}

