import http from './http'
export function apiGetEvents(){ return http.get('/calendar') }
export function apiCreateEvent(payload){ return http.post('/calendar', payload) }
export function apiUpdateEvent(id, payload){ return http.put(`/calendar/${id}`, payload) }
export function apiDeleteEvent(id){ return http.delete(`/calendar/${id}`) }
