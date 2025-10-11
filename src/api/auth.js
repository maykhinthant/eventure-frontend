import http from './http'
export function apiRegister(payload){ return http.post('/users/register', payload) }
export function apiLogin(payload){ return http.post('/users/login', payload) }
export function apiProfile(){ return http.get('/users/profile') }
