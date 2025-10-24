import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.jsx'

export default function OAuthRedirect(){
  const { search } = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(()=>{
    const params = new URLSearchParams(search)
    const token = params.get('token')
    const error = params.get('error')

    if (token){
      login(token)
      navigate('/calendar', { replace: true })
    } else {
      const loginPath = error ? `/login?error=${encodeURIComponent(error)}` : '/login'
      navigate(loginPath, { replace: true })
    }
  }, [search, login, navigate])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Completing sign-in...</p>
        <p className="text-sm text-gray-600">Please wait while we finalize authentication.</p>
      </div>
    </div>
  )
}
