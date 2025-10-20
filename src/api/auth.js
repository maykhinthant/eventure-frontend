import http from './http'

export function apiRegister(payload){ return http.post('/users/register', payload) }

// backend returns a plain token string. Normalize to { data: { token } }
export async function apiLogin(payload){
  const res = await http.post('/users/login', payload)
  const token = typeof res.data === 'string' ? res.data : (res.data && res.data.token) || null
  return { data: { token } }
}

// client-side profile: decode token and return a minimal profile object
export function apiProfile(){
  const token = localStorage.getItem('token')
  if (!token) return Promise.reject(new Error('no token'))

  try {
    const payload = token.split('.')[1]
    // base64 decode (URL-safe)
    const json = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g,'+').replace(/_/g,'/')))))
    const username = json.sub || json.user || json.username || json.name
    return Promise.resolve({ data: { username } })
  } catch (e) {
    return Promise.reject(e)
  }
}
