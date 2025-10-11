import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.jsx'

export default function Navbar(){
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-2xl font-bold text-sky-600">Eventure</Link>
          <span className="text-gray-500 hidden sm:inline">Calendar</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/calendar" className="text-sm">Calendar</Link>
          {token ? (
            <>
              <Link to="/profile" className="text-sm">{user?.username || 'Profile'}</Link>
              <button onClick={()=>{ logout(); navigate('/') }} className="text-sm text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-sky-600">Login</Link>
              <Link to="/register" className="text-sm text-emerald-600">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
