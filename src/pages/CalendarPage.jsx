import React, { useRef, useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { apiGetEvents, apiCreateEvent, apiUpdateEvent, apiDeleteEvent } from '../api/calendar.js'
import EventModal from '../components/EventModal.jsx'
import clsx from 'clsx'

const defaultCalendars = [
  { id: 'cal-personal', name: 'Personal', color: '#2563eb' },
  { id: 'cal-work', name: 'Work', color: '#10b981' }
]

export default function CalendarPage(){
  const calendarRef = useRef(null)
  const [calendars, setCalendars] = useState(()=> {
    try{ const raw = localStorage.getItem('calendars'); return raw ? JSON.parse(raw) : defaultCalendars } catch(e){ return defaultCalendars }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(()=>{ localStorage.setItem('calendars', JSON.stringify(calendars)) }, [calendars])

  async function fetchEvents(fetchInfo, successCallback){
    try{
      const res = await apiGetEvents()
      const items = res.data.map(e => {
        const cal = calendars.find(c=>c.id===e.calendarId) || calendars[0]
        return {
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: cal.color,
          borderColor: cal.color,
          extendedProps: { raw: e }
        }
      })
      successCallback(items)
    }catch(err){ console.error(err); successCallback([]) }
  }

  function openNew(dateStr){
    setSelected({ title:'', start: dateStr, end: dateStr, calendarId: calendars[0].id, completed:false })
    setModalOpen(true)
  }

  function handleDateClick(info){ openNew(info.dateStr) }
  function handleEventClick(clickInfo){ const raw = clickInfo.event.extendedProps.raw || {}; setSelected(raw); setModalOpen(true) }

  async function handleSave(payload){
    try{
      if (selected && selected.id){ await apiUpdateEvent(selected.id, payload) } else { await apiCreateEvent(payload) }
      setModalOpen(false)
      calendarRef.current.getApi().refetchEvents()
    }catch(e){ console.error(e); alert('Save failed') }
  }

  async function handleDelete(id){ if(!confirm('Delete this event?')) return; try{ await apiDeleteEvent(id); setModalOpen(false); calendarRef.current.getApi().refetchEvents() }catch(e){ console.error(e) } }

  function addCalendar(){ const name = prompt('Calendar name:'); if(!name) return; const color = prompt('Hex color (e.g. #2563eb):', '#2563eb'); const id = 'cal-' + Math.random().toString(36).slice(2,9); const newCal = { id, name, color: color || '#2563eb' }; setCalendars([...calendars, newCal]) }
  function removeCalendar(id){ if(!confirm('Remove calendar?')) return; setCalendars(calendars.filter(c=>c.id!==id)) }

  return (
    <div className="md:flex gap-6">
      <aside className="w-full md:w-72 mb-4 md:mb-0">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Calendars</h3>
            <button onClick={addCalendar} className="text-sm text-sky-600">+ New</button>
          </div>
          <ul className="space-y-2">
            {calendars.map(c=>(
              <li key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{background:c.color}} className="w-4 h-4 rounded-full" />
                  <div>{c.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>{ const newColor = prompt('New color hex', c.color); if(newColor) setCalendars(calendars.map(x=>x.id===c.id?{...x,color:newColor}:x)) }} className="text-xs text-gray-500">color</button>
                  <button onClick={()=>removeCalendar(c.id)} className="text-xs text-red-500">remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="flex-1">
        <div className="mb-3 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Calendar</h2>
          <div className="flex gap-2">
            <button onClick={()=>{ setSelected(null); setModalOpen(true) }} className="px-3 py-1 bg-sky-600 text-white rounded">New Event</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <FullCalendar
            ref={calendarRef}
            plugins={[ dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin ]}
            initialView="dayGridMonth"
            headerToolbar={{ left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
            events={fetchEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={true}
            eventContent={(arg) => {
              const raw = arg.event.extendedProps.raw || {}
              return (
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <input type="checkbox" checked={raw.completed} onChange={async (e)=>{
                    try{
                      const updated = { ...raw, completed: e.target.checked }
                      await apiUpdateEvent(raw.id, updated)
                      calendarRef.current.getApi().refetchEvents()
                    }catch(err){ console.error(err) }
                  }} />
                  <div style={{ color: arg.backgroundColor, textDecoration: raw.completed ? 'line-through' : 'none' }}>{arg.event.title}</div>
                </div>
              )
            }}
          />
        </div>
      </section>

      <EventModal open={modalOpen} onClose={()=>setModalOpen(false)} initial={selected} onSave={handleSave} onDelete={handleDelete} calendars={calendars} />
    </div>
  )
}
