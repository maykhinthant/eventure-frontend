import React, { useEffect, useState } from 'react'
import { apiProfile } from '../api/auth.js'

export default function Profile(){
  const [user, setUser] = useState(null)
  useEffect(()=>{ apiProfile().then(r=>setUser(r.data)).catch(()=>{}) }, [])
  if(!user) return <div>Loading...</div>
  return (
    <div className="max-w-md mx-auto mt-6 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Profile</h2>
      <div><strong>Username:</strong> {user.username}</div>
    </div>
  )
}
