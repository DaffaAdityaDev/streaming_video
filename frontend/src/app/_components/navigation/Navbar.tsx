/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useEffect, useCallback, useContext } from 'react'
import Link from 'next/link'
import { AppContext } from '../context/AppContext'
import { useRouter } from 'next/navigation'
export default function Navbar() {
  const router = useRouter()
  const { search, setSearch, sidebar, setSidebar } = useContext(AppContext)
  const [isVisible, setIsVisible] = useState(true);
  const [prevScrollpos, setPrevScrollpos] = useState(0);
  const [token, setToken] = useState('')

  // Function to handle scroll events
  const handleScroll = useCallback(() => {
    const currentScrollPos = window.pageYOffset;

    if (currentScrollPos > prevScrollpos) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setPrevScrollpos(currentScrollPos);
    if (sidebar) {
      const labelElement = document.querySelector('.btn.btn-circle') as HTMLElement;
      if (labelElement) {
        labelElement.click();
      }
    }
  }, [prevScrollpos,]); // Only re-create the function when prevScrollpos changes

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    setToken(localStorage.getItem('token') || '')

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]); // Now handleScroll is stable and won't cause the effect to re-run

  // Class to apply based on the visibility state
  const navbarClass = isVisible ? 'translate-y-0' : '-translate-y-full';

  function toggleSidebar() {
    setSidebar(!sidebar)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  function handleLogin() {
    router.push('/login')
  }

  return (
    <div className={`navbar sticky top-0 z-30 col-span-12 row-span-1 bg-primary-content transition-transform duration-200 ease-in-out ${navbarClass}`}>
      <label className="btn btn-circle swap swap-rotate z-20">
        {/* this hidden checkbox controls the state */}
        <input type="checkbox" onClick={toggleSidebar} />

        {/* hamburger icon */}
        <svg
          className="swap-off fill-current"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 512 512"
        >
          <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
        </svg>

        {/* close icon */}
        <svg
          className="swap-on fill-current"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 512 512"
        >
          <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
        </svg>
      </label>
      <div className="flex-1">
        <Link href={`/`} className="btn btn-ghost text-xl">
          daisyUI
        </Link>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control">
          <input
            type="text"
            placeholder="Search"
            className="input input-bordered w-24 md:w-auto"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
            <div className="w-10 rounded-full">
              {/* <img
                alt="Tailwind CSS Navbar component"
                src="/images/stock/photo-1534528741775-53994a69daeb.jpg"
                className="h-full w-full rounded-full object-cover"
              /> */}
            </div>
          </label>
          <ul
            tabIndex={0}
            className="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
          >
           
            <li>
              <a>Settings</a>
            </li>
            {
              token === '' ?
              <li>
                <a onClick={handleLogin}>Login</a>
              </li> :
              <div>
                <li>
                  <a className="justify-between">
                    Profile
                    <span className="badge">New</span>
                  </a>
                </li>
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </div> 
            }
            
          </ul>
        </div>
      </div>
    </div>
  )
}
