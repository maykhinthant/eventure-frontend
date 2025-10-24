import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiLogin } from '../api/auth.js'
import { useAuth } from '../contexts/useAuth.jsx'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const oauthBase = apiBase.replace(/\/(api)\/?$/, '')
  const googleAuthUrl = `${oauthBase}/oauth2/authorization/google`
  const githubAuthUrl = `${oauthBase}/oauth2/authorization/github`

  const handleSubmit = async (e) => {
    e.preventDefault()
    try{
      const res = await apiLogin({ username, password })
      const token = res.data.token
      if (token){ login(token); navigate('/calendar') }
    }catch(err){ console.error(err); alert('Login failed') }
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border p-2" placeholder="Username" autoComplete="username" required />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border p-2" placeholder="Password" required />
        <button className="w-full bg-sky-600 text-white p-2 rounded">Login</button>
      </form>
      <div className="mt-4 space-y-2">
        <a href={googleAuthUrl} className="flex items-center justify-center gap-2 w-full border border-gray-300 p-2 rounded hover:bg-gray-50">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2.1H12z" />
            <path fill="#34A853" d="M6.5 14.3l-.9.7-2.4 1.8C4.9 19.8 8.2 22 12 22c2.4 0 4.4-.8 5.9-2.3l-3-2.3c-.8.6-1.8 1-2.9 1-2.2 0-4-1.5-4.6-3.6z" />
            <path fill="#4A90E2" d="M3.2 7.6C2.4 9.1 2 10.8 2 12.5s.4 3.4 1.2 4.9l3.3-2.6c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9z" />
            <path fill="#FBBC05" d="M12 5.5c1.3 0 2.4.4 3.3 1.2l2.5-2.5C16.4 2.4 14.4 1.5 12 1.5 8.2 1.5 4.9 3.7 3.2 7.6l3.3 2.6c.6-2.1 2.4-3.7 4.5-3.7z" />
          </svg>
          <span>Login with Google</span>
        </a>
        <a href={githubAuthUrl} className="flex items-center justify-center gap-2 w-full border border-gray-300 p-2 rounded hover:bg-gray-50">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#181717" d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 .1.9 1.1 2.5 1.8.3-.8.6-1.1 1-1.4-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.2 1.8-.3 2.7-.3.9 0 1.8.1 2.7.3 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.1 1.8 1.1 3.1 0 4.5-2.7 5.5-5.3 5.8.5.4 1 1.2 1 2.5v3.6c0 .4.2.8.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
          </svg>
          <span>Login with GitHub</span>
        </a>
      </div>
    </div>
  )
}
