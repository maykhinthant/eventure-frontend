import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const http = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export default http
