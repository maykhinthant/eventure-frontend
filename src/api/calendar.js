import http from './http'

// Events endpoints -> backend uses /events
export function apiGetEvents(){ return http.get('/events') }
export function apiCreateEvent(payload){ return http.post('/events', payload) }
export function apiUpdateEvent(id, payload){ return http.put(`/events/${id}`, payload) }
export function apiDeleteEvent(id){ return http.delete(`/events/${id}`) }

// Calendars endpoints (backend)
export function apiGetCalendars(){ return http.get('/calendars') }
export function apiCreateCalendar(payload){ return http.post('/calendars', payload) }
export function apiUpdateCalendar(id, payload){ return http.put(`/calendars/${id}`, payload) }
export function apiDeleteCalendar(id){ return http.delete(`/calendars/${id}`) }
