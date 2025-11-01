import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { format, isSameDay, parseISO } from 'date-fns'
import { apiGetEvents, apiCreateEvent, apiUpdateEvent, apiDeleteEvent, apiGetCalendars, apiCreateCalendar, apiUpdateCalendar, apiDeleteCalendar } from '../api/calendar.js'
import EventModal from '../components/EventModal.jsx'
import { useAuth } from '../contexts/useAuth.jsx'

const defaultCalendars = [
  { id: 'cal-personal', name: 'Personal', color: '#2563eb' },
  { id: 'cal-work', name: 'Work', color: '#10b981' }
]

function stringifyDate(value){
  if(!value) return null
  if(value instanceof Date) return value.toISOString()
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  if(Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function normalizeHex(hex){
  if(!hex) return null
  let value = hex.trim()
  if(value.startsWith('#')) value = value.slice(1)
  if(value.length === 3){
    value = value.split('').map(char => char + char).join('')
  }
  if(value.length !== 6) return null
  return value.toLowerCase()
}

function lightenHex(hex, amount){
  const normalized = normalizeHex(hex)
  if(!normalized) return '#f3f4f6'
  const num = parseInt(normalized, 16)
  let r = (num >> 16) & 255
  let g = (num >> 8) & 255
  let b = num & 255
  r = Math.round(r + (255 - r) * amount)
  g = Math.round(g + (255 - g) * amount)
  b = Math.round(b + (255 - b) * amount)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function buildEventGradient(base){
  const light = lightenHex(base, 0.65)
  const mid = lightenHex(base, 0.45)
  return `linear-gradient(135deg, ${light}, ${mid})`
}

function toLocalInput(date){
  if(!date) return null
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

function normalizeLocalDateTime(value){
  if(!value) return null
  if(value instanceof Date) return toLocalInput(value)
  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value)
  if(Number.isNaN(parsed.getTime())) return null
  return toLocalInput(parsed)
}

function resolveDateValue(rawValue, date){
  if(rawValue) return rawValue
  return toLocalInput(date)
}

function formatEventTimeRange(startDate, endDate){
  if(!startDate) return ''
  const startText = format(startDate, 'p')
  if(!endDate) return startText
  const endText = format(endDate, 'p')
  return startText === endText ? startText : `${startText} – ${endText}`
}

function extractEventsPayload(payload){
  if(!payload) return []
  if(Array.isArray(payload)) return payload

  const normalized = []
  const candidateCollections = [
    { key: 'events' },
    { key: 'originalEvents', cloneFlag: false },
    { key: 'originalEventList', cloneFlag: false },
    { key: 'original', cloneFlag: false },
    { key: 'clonedEvents', cloneFlag: true },
    { key: 'cloneEvents', cloneFlag: true },
    { key: 'clones', cloneFlag: true },
    { key: 'expandedEvents' }
  ]

  candidateCollections.forEach(({ key, cloneFlag }) => {
    const value = payload?.[key]
    if(Array.isArray(value)){
      if(typeof cloneFlag === 'boolean'){
        normalized.push(...value.map(evt => ({ ...evt, __isClone: cloneFlag })))
      } else {
        normalized.push(...value)
      }
    }
  })

  if(!normalized.length && typeof payload === 'object'){
    Object.values(payload).forEach(value => {
      if(Array.isArray(value)){
        normalized.push(...value)
      }
    })
  }

  if(!normalized.length && typeof payload === 'object'){
    normalized.push(payload)
  }

  return normalized
}

export default function CalendarPage(){
  const { token } = useAuth()
  const calendarRef = useRef(null)
  const [calendars, setCalendars] = useState(defaultCalendars)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [calendarForm, setCalendarForm] = useState({ name:'', color:'#2563eb' })
  const [editingCalendarId, setEditingCalendarId] = useState(null)
  const [calendarBusy, setCalendarBusy] = useState(false)
  const [eventsForList, setEventsForList] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeView, setActiveView] = useState('dayGridMonth')
  const [updatingEventId, setUpdatingEventId] = useState(null)

  const refreshCalendars = useCallback(async () => {
    if (!token){
      setCalendars(defaultCalendars)
      return defaultCalendars
    }

    try{
      const res = await apiGetCalendars()
      const mapped = (res.data || []).map(c => ({ id: String(c.id), name: c.name, color: c.color || '#2563eb' }))
      setCalendars(mapped)
      return mapped
    }catch(err){
      console.error(err)
      setCalendars([])
      return []
    }
  }, [token])

  useEffect(()=>{ refreshCalendars() }, [refreshCalendars])

  const fetchEvents = useCallback(async (fetchInfo, successCallback) => {
    console.log('fetchEvents called')
    try{
      const res = await apiGetEvents()
      console.log('API response:', res)
      const payload = extractEventsPayload(res.data)
      const items = (payload || []).map((e, index) => {
        const resolvedId = e?.id ?? `event-${index}`
        const potentialNumericId = Number(resolvedId)
        const startValue = stringifyDate(e?.startTime || e?.start || e?.start_time)
        const endValue = stringifyDate(e?.endTime || e?.end || e?.end_time)
        const calendarIdFromEntity = e?.calendar ? String(e.calendar.id) : undefined
        const fallbackCalendarId = e?.calendarId || e?.calendar_id
        const calendarIdValue = calendarIdFromEntity ?? (fallbackCalendarId != null ? String(fallbackCalendarId) : (calendars[0] && calendars[0].id))
        const cloneFlagFromPayload = Object.prototype.hasOwnProperty.call(e || {}, '__isClone') ? !!e.__isClone : undefined
        const isSyntheticId = Number.isFinite(potentialNumericId) ? potentialNumericId < 0 : String(resolvedId).startsWith('clone-')
        // normalize server event into the shape the UI expects
        const raw = {
          id: resolvedId,
          title: e?.title,
          start: startValue,
          end: endValue,
          completed: !!e?.completed,
          // store calendarId as string for the modal select
          calendarId: calendarIdValue,
          recurrenceRule: e?.recurrenceRule || '',
          isRecurring: !!e?.isRecurring,
          isClone: cloneFlagFromPayload ?? isSyntheticId,
          sourceEvent: e
        }

        // find matching calendar by id (numeric/string tolerant)
        const cal = calendars.find(c => c.id == raw.calendarId) || calendars[0]

        return {
          id: resolvedId,
          title: e?.title,
          start: raw.start,
          end: raw.end,
          backgroundColor: cal?.color,
          borderColor: cal?.color,
          extendedProps: { raw }
        }
      })
      console.log('Mapped items:', items)
      successCallback(items)
      const listData = items.map(item => {
        const raw = item.extendedProps.raw || {}
        return {
          id: item.id,
          title: item.title,
          start: raw.start || item.start,
          end: raw.end || item.end,
          calendarId: raw.calendarId,
          completed: raw.completed,
          color: item.backgroundColor,
          isClone: raw.isClone
        }
      })
      setEventsForList(listData)
    }catch(err){ console.error('fetchEvents error:', err); successCallback([]) }
  }, [calendars])

  function openNew(dateStr){
    setSelected({
      title:'',
      start: dateStr,
      end: dateStr,
      calendarId: calendars[0]?.id || '',
      completed:false,
      isRecurring:false,
      recurrenceRule:''
    })
    setModalOpen(true)
  }

  function handleDateClick(info){ openNew(info.dateStr) }
  function handleEventClick(clickInfo){ const raw = clickInfo.event.extendedProps.raw || {}; setSelected(raw); setModalOpen(true) }

  async function handleSave(form){
    try{
      // map form -> backend payload
      const calendarIdValue = form.calendarId
      const numericCalendarId = calendarIdValue && !Number.isNaN(Number(calendarIdValue)) ? Number(calendarIdValue) : null
      const startTime = normalizeLocalDateTime(form.start) || form.start || null
      const endTime = normalizeLocalDateTime(form.end) || form.end || startTime
      const repeatEnabled = !!form.repeatEnabled
      const recurrenceRule = repeatEnabled ? form.recurrenceRule || null : null

      const payload = {
        title: form.title,
        // pass LocalDateTime-like strings; backend Jackson will parse them
        startTime,
        endTime,
        completed: !!form.completed,
        isRecurring: repeatEnabled,
        recurrenceRule,
        // set calendar object or null
        calendar: numericCalendarId ? { id: numericCalendarId } : null
      }

      if (form.id){ // edit
        await apiUpdateEvent(form.id, payload)
      } else {
        await apiCreateEvent(payload)
      }

      setModalOpen(false)
      calendarRef.current?.getApi()?.refetchEvents()
    }catch(e){ console.error(e); alert('Save failed') }
  }

  async function handleDelete(id){ if(!confirm('Delete this event?')) return; try{ await apiDeleteEvent(id); setModalOpen(false); calendarRef.current?.getApi()?.refetchEvents() }catch(e){ console.error(e) } }

  function resetCalendarForm(){
    setCalendarForm({ name:'', color:'#2563eb' })
    setEditingCalendarId(null)
  }

  async function handleCalendarSubmit(e){
    e.preventDefault()
    const trimmed = calendarForm.name.trim()
    if(!trimmed){ return }
    if(!token){ alert('Login to manage calendars.'); return }

    setCalendarBusy(true)
    try{
      if (editingCalendarId){
        await apiUpdateCalendar(Number(editingCalendarId), { id: Number(editingCalendarId), name: trimmed, color: calendarForm.color })
      } else {
        await apiCreateCalendar({ name: trimmed, color: calendarForm.color })
      }
      await refreshCalendars()
      calendarRef.current?.getApi()?.refetchEvents()
      resetCalendarForm()
    }catch(err){
      console.error(err)
      alert('Could not save calendar')
    }finally{
      setCalendarBusy(false)
    }
  }

  function startEditCalendar(cal){
    setEditingCalendarId(cal.id)
    setCalendarForm({ name: cal.name, color: cal.color || '#2563eb' })
  }

  async function handleCalendarDelete(id){
    if(!token){ alert('Login to manage calendars.'); return }
    if(!confirm('Remove calendar?')) return

    try{
      await apiDeleteCalendar(Number(id))
      await refreshCalendars()
      if(editingCalendarId === id){ resetCalendarForm() }
      calendarRef.current?.getApi()?.refetchEvents()
    }catch(err){ console.error(err); alert('Failed to delete calendar') }
  }

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return eventsForList
      .map(item => {
        if (!item.start) return null
        const parsed = new Date(item.start)
        if (Number.isNaN(parsed.getTime())) return null
        return { ...item, startDate: parsed }
      })
      .filter(Boolean)
      .sort((a, b) => a.startDate - b.startDate)
      .filter(evt => evt.startDate >= now && !evt.completed)
      .slice(0, 5)
  }, [eventsForList])

  function getCalendarColor(id){
    const found = calendars.find(c => c.id === id || String(c.id) === String(id))
    return found?.color || '#1f2937'
  }

  const persistEventCompletion = useCallback(async (details, completed) => {
    if(!details || !details.id) return
    const startTime = normalizeLocalDateTime(details.start) || details.start || null
    const endTime = normalizeLocalDateTime(details.end) || details.end || startTime
    setUpdatingEventId(details.id)
    try{
      await apiUpdateEvent(details.id, {
        title: details.title,
        startTime,
        endTime,
        completed,
        calendar: details.calendarId ? { id: Number(details.calendarId) } : null
      })
      setEventsForList(prev => prev.map(evt => evt.id === details.id ? { ...evt, completed } : evt))
      calendarRef.current?.getApi()?.refetchEvents()
    }catch(err){
      console.error(err)
      alert('Failed to update event')
    }finally{
      setUpdatingEventId(null)
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  function handlePrev(){ calendarRef.current?.getApi()?.prev() }
  function handleNext(){ calendarRef.current?.getApi()?.next() }
  function handleToday(){ calendarRef.current?.getApi()?.today() }

  const viewOptions = [
    { label: 'Month', value: 'dayGridMonth' },
    { label: 'Week', value: 'timeGridWeek' },
    { label: 'Day', value: 'timeGridDay' },
    { label: 'List', value: 'listWeek' }
  ]

  const displayTitle = format(currentDate, 'MMMM yyyy')

  return (
    <div className="relative w-full bg-[#f5f6f9] pt-3 pb-6 pr-4 md:pt-4 md:pr-8">
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute left-0 top-4 z-20 flex h-11 w-11 -translate-x-1/2 transform items-center justify-center rounded-full bg-white text-gray-500 shadow transition hover:text-gray-900 md:-translate-x-[60%]"
          aria-label="Show sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M9.75 4.5L17.25 12 9.75 19.5" />
          </svg>
        </button>
      )}
      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} flex-col lg:w-64 xl:w-60`}>
          <div className="space-y-5 px-6 pt-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Schedule</p>
                <h2 className="text-3xl font-semibold text-gray-900">{displayTitle}</h2>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
                aria-label="Hide sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M14.25 19.5L6.75 12l7.5-7.5" />
                </svg>
              </button>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.35em] text-gray-400">Calendars</h3>
              <ul className="space-y-3">
                {calendars.map(c => (
                  <li key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color || '#2563eb' }} />
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    </div>
                    {token && (
                      <button onClick={()=>startEditCalendar(c)} className="text-xs font-medium text-gray-400 transition hover:text-gray-900">Edit</button>
                    )}
                  </li>
                ))}
              </ul>
              {!calendars.length && (
                <p className="text-sm text-gray-400">No calendars yet.</p>
              )}
            </div>

            {token ? (
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{editingCalendarId ? 'Edit calendar' : 'New calendar'}</p>
                  {editingCalendarId && (
                    <button type="button" onClick={resetCalendarForm} className="text-xs text-gray-400 hover:text-gray-700">Reset</button>
                  )}
                </div>
                <form onSubmit={handleCalendarSubmit} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-gray-800 focus:outline-none"
                        value={calendarForm.name}
                        onChange={e=>setCalendarForm({...calendarForm, name:e.target.value})}
                        placeholder="Calendar name"
                        disabled={calendarBusy}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <input
                        type="color"
                        className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                        value={calendarForm.color}
                        onChange={e=>setCalendarForm({...calendarForm, color:e.target.value})}
                        disabled={calendarBusy}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded-lg bg-gray-900 py-1.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50" disabled={calendarBusy}>
                      {calendarBusy ? 'Saving…' : 'Save'}
                    </button>
                    {editingCalendarId && (
                      <button type="button" onClick={()=>handleCalendarDelete(editingCalendarId)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-red-400 hover:text-red-500" disabled={calendarBusy}>
                        Delete
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Log in to manage your calendars.</p>
            )}

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.35em] text-gray-400">Upcoming</h3>
              {upcomingEvents.length ? (
                <ul className="space-y-1.5">
                  {upcomingEvents.map(event => (
                    <li
                      key={event.id}
                      className="border border-transparent px-2 py-1.5 shadow-sm"
                      style={{ background: buildEventGradient(event.color || getCalendarColor(event.calendarId)) }}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={event.completed}
                          disabled={updatingEventId === event.id}
                          onClick={(e)=>e.stopPropagation()}
                          onChange={(e)=>{
                            e.stopPropagation()
                            const details = {
                              id: event.id,
                              title: event.title,
                              start: event.start,
                              end: event.end,
                              calendarId: event.calendarId
                            }
                            persistEventCompletion(details, e.target.checked)
                          }}
                        />
                        <button
                          type="button"
                          className="flex flex-1 flex-col text-left"
                          onClick={(e)=>{
                            e.stopPropagation()
                            openUpcomingEvent(event)
                          }}
                        >
                          <span className={`text-sm font-semibold text-gray-800 ${event.completed ? 'line-through opacity-60' : ''}`}>{event.title}</span>
                          <span className="mt-1 text-[10px] uppercase tracking-normal text-gray-500">{format(event.startDate, 'EEE d MMM · hh:mm a')}</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No upcoming events.</p>
              )}
            </div>
          </div>
        </aside>

        <section className={`flex-1 px-2 lg:px-0 ${sidebarOpen ? 'lg:pl-8' : 'lg:pl-12'}`}>
          <div className="mt-2 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-900 hover:text-white" aria-label="Previous month">‹</button>
                <button onClick={handleToday} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-900 hover:text-white">Today</button>
                <button onClick={handleNext} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-900 hover:text-white" aria-label="Next month">›</button>
              </div>
              <div className="text-xl font-semibold text-gray-900">{displayTitle}</div>
              <div className="flex items-center gap-2">
                {viewOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={()=>{ 
                      setActiveView(option.value); 
                      calendarRef.current?.getApi()?.changeView(option.value);
                      // Auto-navigate to today when switching to week, day, or list views
                      if (option.value !== 'dayGridMonth') {
                        calendarRef.current?.getApi()?.today();
                      }
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeView === option.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white'}`}
                  >
                    {option.label}
                  </button>
                ))}
                <button onClick={()=>{ setSelected(null); setModalOpen(true) }} className="ml-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black">New Event</button>
               </div>
            </div>

            <div className="pt-4">
              <FullCalendar
                ref={calendarRef}
                plugins={[ dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin ]}
                initialView="dayGridMonth"
                headerToolbar={false}
                firstDay={1}
                events={fetchEvents}
                datesSet={(arg) => {
                  // Use the view's current date instead of the start of the date range
                  setCurrentDate(arg.view.calendar.getDate())
                  setActiveView(arg.view.type)
                }}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                editable={true}
                height="auto"
                dayMaxEvents={4}
                displayEventTime={false}
                eventBorderColor="transparent"
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                views={{
                  dayGridMonth: {
                    dayHeaderFormat: { weekday: 'short' }
                  }
                }}
                dayCellContent={({ date, dayNumberText, view }) => {
                  const isToday = isSameDay(date, new Date())
                  const numberEl = (
                    <span className={`text-sm font-medium ${isToday ? 'rounded-full bg-gray-900 px-2 py-1 text-white' : 'text-gray-500'}`}>
                      {dayNumberText.replace('日', '')}
                    </span>
                  )

                  if (view.type === 'dayGridMonth'){
                    return (
                      <div className="flex justify-end p-1">
                        {numberEl}
                      </div>
                    )
                  }

                  return (
                    <div className="flex justify-end">
                      {numberEl}
                    </div>
                  )
                }}
                eventClassNames={(arg) => {
                  const raw = arg.event.extendedProps.raw || {}
                  return raw.completed ? ['custom-calendar-event', 'completed'] : ['custom-calendar-event']
                }}
                eventContent={(arg) => {
                  const raw = arg.event.extendedProps.raw || {}
                  const baseColor = getCalendarColor(raw.calendarId)
                  const gradient = buildEventGradient(baseColor)
                  const id = raw.id || arg.event.id
                  const completed = !!raw.completed
                  const isUpdating = updatingEventId === id
                  const details = {
                    id,
                    title: raw.title || arg.event.title,
                    start: resolveDateValue(raw.start, arg.event.start),
                    end: resolveDateValue(raw.end, arg.event.end),
                    calendarId: raw.calendarId
                  }
                  const timeLabel = formatEventTimeRange(arg.event.start, arg.event.end)

                  return (
                    <div
                      className={`w-full overflow-hidden shadow-sm ${completed ? 'opacity-60' : ''}`}
                      style={{ background: gradient }}
                    >
                      <div className="flex w-full items-center gap-1.5 px-1.5 py-1">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={completed}
                          disabled={isUpdating}
                          onClick={(e)=>e.stopPropagation()}
                          onChange={(e)=>{
                            e.stopPropagation()
                            persistEventCompletion(details, e.target.checked)
                          }}
                        />
                        <div className="flex flex-col leading-tight">
                          <span className={`truncate text-xs font-semibold text-gray-800 ${completed ? 'line-through' : ''}`}>{arg.event.title}</span>
                          {timeLabel ? <span className="text-[10px] uppercase tracking-normal text-gray-600">{timeLabel}</span> : null}
                        </div>
                      </div>
                    </div>
                  )
                }}
                eventDidMount={(info) => {
                  info.el.style.background = 'transparent'
                  info.el.style.border = 'none'
                  info.el.style.padding = '0'
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <EventModal open={modalOpen} onClose={()=>setModalOpen(false)} initial={selected} onSave={handleSave} onDelete={handleDelete} calendars={calendars} />
    </div>
  )
}
