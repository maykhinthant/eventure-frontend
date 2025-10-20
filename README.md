# eventure-frontend
# Calendar Frontend (React + Vite + Tailwind) — Final

This frontend is built to connect with your Spring Boot backend. It implements the following features (Google Calendar-style simplified):

- Sign up and login (JWT) — endpoints expected:
  - POST /api/users/register
  - POST /api/users/login
  - GET  /api/users/profile
- Calendar endpoints (for events):
  - GET /api/calendar
  - POST /api/calendar
  - PUT /api/calendar/{id}
  - DELETE /api/calendar/{id}

Features implemented:
- Multiple calendars (stored locally in `localStorage`) with a chosen color
- Create/Edit/Delete events (title, description, start, end, calendarId)
- Events use the color of their calendar
- Checkbox on events to mark as completed; completed events show line-through
- Views: Month, Day, Agenda/List (FullCalendar)
- Responsive layout with sidebar & navbar
- Event modal form for create/edit
- Axios interceptor automatically adds Authorization header from localStorage token

## Quick start

1. Unzip the project.
2. `npm install`
3. Create a `.env` file in project root with:
```
VITE_API_BASE_URL=http://localhost:8080/api
```
4. `npm run dev`
5. Open http://localhost:5173

## Backend expectations

- Login should return `{ "token": "..." }`.
- `GET /api/calendar` should return an array of events with shape:
  ```json
  [{ "id": "1", "title": "Event", "start": "2025-10-10T10:00", "end": "2025-10-10T11:00", "calendarId": "cal-personal", "completed": false }]
  ```
- Create/Update endpoints accept and return similar JSON shapes.

## Notes

- The calendars list is local by default (so you can add calendars and colors in the UI). If you want calendars persisted server-side, I can add endpoints and sync logic.
- If your backend uses different field names, tell me and I'll adapt the API wrappers (`src/api/calendar.js` and `src/api/auth.js`).
