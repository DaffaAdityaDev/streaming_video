'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { AuthProps, FormInput } from '@/app/types'

export default function Auth({
  path,
  message,
  formMaker,
  handleBtnSubmit,
  email,
  setEmail,
  password,
  setPassword,
  alertMessage,
  setAlertMessage,
  gotoAltPath,
  haveAccount,
}: AuthProps) {
  const router = useRouter()

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target
    if (target.name === 'email') {
      setEmail(target.value)
      if (!checkEmailIsValid(target.value)) {
        setAlertMessage({ text: 'Invalid email', type: 'error' })
      } else {
        setAlertMessage({ text: '', type: 'success' })
      }
    }
    if (target.name === 'password') {
      setPassword(target.value)
    }
  }

  function checkEmailIsValid(email: string) {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
  }

  function handleSkipLogin() {
    localStorage.setItem('token', '')
    router.push('/')
  }

  // console.log(alertMessage)

  return (
    <div className="-mt-20 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white">{path}</h1>
      <p className="text-white">{message}</p>
      <div className="relative pt-4">
        <form onSubmit={handleBtnSubmit} className="flex flex-col gap-2">
          {formMaker &&
            formMaker.map((input: FormInput, index: number) => {
              if (input.type === 'email') {
                return (
                  <div key={index}>
                    <p>{input.placeholder}</p>
                    <label
                      className={`input input-bordered flex items-center gap-2 bg-neutral ${
                        alertMessage.type === 'error' && 'input-error'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 opacity-70"
                      >
                        <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                      </svg>
                      <input
                        type="email"
                        className="grow bg-neutral"
                        name="email"
                        onChange={handleInputChange}
                        value={email}
                      />
                    </label>
                  </div>
                )
              }
              if (input.type === 'password') {
                return (
                  <div key={index}>
                    <label>{input.placeholder}</label>
                    <label
                      className={`input input-bordered flex items-center gap-2 bg-neutral ${
                        alertMessage.type === 'error' && 'input-error'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 opacity-70"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <input
                        type="password"
                        className="grow bg-neutral"
                        name="password"
                        onChange={handleInputChange}
                        value={password}
                      />
                    </label>
                  </div>
                )
              }
              if (input.type === 'text') {
                return (
                  <div key={index}>
                    <label>{input.placeholder}</label>
                    <label
                      className={`input input-bordered flex items-center gap-2 bg-neutral ${
                        alertMessage.type === 'error' && 'input-error'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-person-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                      </svg>
                      <input
                        type="text"
                        className="grow bg-neutral"
                        name={input.name}
                        onChange={input.onChange}
                        value={input.value}
                      />
                    </label>
                  </div>
                )
              }
            })}
          <button className="btn btn-primary mt-4 w-full text-white" type="submit">
            {path}
          </button>
        </form>
        <button className="btn btn-outline btn-accent mt-4 w-full" onClick={handleSkipLogin}>
          Go To Main Page
        </button>
        {alertMessage.text && (
          <div
            role="alert"
            className={`alert ${
              alertMessage.type === 'success' ? 'alert-success' : 'alert-error'
            } absolute mt-20 flex w-full items-center justify-center `}
          >
            <svg
              xmlns="http://www.w3.org/20000/svg"
              className={`h-6 w-6 shrink-0 stroke-current ${
                alertMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{alertMessage.text}</span>
          </div>
        )}
        {gotoAltPath && (
          <div className="mt-2 flex w-full justify-center">
            <p>
              {haveAccount ? 'Already have an account? ' : "don't have an account? "}
              <a className="link" onClick={() => router.push(`/${gotoAltPath}`)}>
                {haveAccount ? 'Login' : 'Register'}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
