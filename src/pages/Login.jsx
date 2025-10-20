import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiLogin } from '../api/auth.js'
import { useAuth } from '../contexts/useAuth.jsx'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

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
    </div>
  )
}
