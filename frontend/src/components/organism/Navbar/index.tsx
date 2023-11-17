import React from 'react'

export default function NavbarOrganism() {
  return (
    <div className="navbar bg-base-100 col-span-12 row-span-1 ">
      <label className="btn btn-circle swap swap-rotate">
  
        {/* this hidden checkbox controls the state */}
        <input type="checkbox" />
        
        {/* hamburger icon */}
        <svg className="swap-off fill-current" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z"/></svg>
        
        {/* close icon */}
        <svg className="swap-on fill-current" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49"/></svg>
        
      </label>
      <div className="flex-1">
          <a className="btn btn-ghost text-xl">daisyUI</a>
      </div>
      <div className="flex-none gap-2">
          <div className="form-control">
          <input type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto" />
          </div>
          <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
              <img alt="Tailwind CSS Navbar component" src="/images/stock/photo-1534528741775-53994a69daeb.jpg" />
              </div>
          </label>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
              <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
              </a>
              </li>
              <li><a>Settings</a></li>
              <li><a>Logout</a></li>
          </ul>
          </div>
      </div>
    </div>
  )
}
