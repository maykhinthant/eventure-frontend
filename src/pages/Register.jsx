import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRegister } from '../api/auth.js'

export default function Register(){
  const [form, setForm] = useState({ username:'', password:'' })
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{ await apiRegister(form); navigate('/login') } catch(err){ console.error(err); alert('Register failed') }
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Sign up</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Username" autoComplete="username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
        <input className="w-full border p-2" placeholder="Password" type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <button className="w-full bg-emerald-600 text-white p-2 rounded">Create account</button>
      </form>
    </div>
  )
}
