import React, { createContext, useState, useContext, useEffect } from 'react'
import { apiProfile } from '../api/auth.js'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (token){
      setLoading(true)
      apiProfile().then(res=>setUser(res.data)).catch(()=>setUser(null)).finally(()=>setLoading(false))
    }
  }, [token])

  function login(tokenValue){
    localStorage.setItem('token', tokenValue)
    setToken(tokenValue)
  }
  function logout(){
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){ return useContext(AuthContext) }
export default AuthContext
