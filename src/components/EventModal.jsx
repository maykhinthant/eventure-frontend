import React, { useEffect, useState } from 'react'

function toDateTimeLocal(value){
  if(!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if(Number.isNaN(date.getTime())) return ''
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return shifted.toISOString().slice(0, 16)
}

export default function EventModal({ open, onClose, initial, onSave, onDelete, calendars=[] }){
  const [form, setForm] = useState({ title:'', description:'', start:'', end:'', calendarId: '', completed:false })
  useEffect(()=>{
    if(initial){
      const start = toDateTimeLocal(initial.start)
      const end = toDateTimeLocal(initial.end) || start
      setForm({ title: initial.title || '', description: initial.description || '', start, end, calendarId: initial.calendarId || (calendars[0] && calendars[0].id) || '', completed: !!initial.completed })
    } else {
      setForm({ title:'', description:'', start:'', end:'', calendarId: (calendars[0] && calendars[0].id) || '', completed:false })
    }
  },[initial, open, calendars])

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow w-full max-w-lg p-4">
        <h3 className="text-lg font-semibold mb-2">{initial ? 'Edit Event' : 'New Event'}</h3>
        <form onSubmit={(e)=>{ e.preventDefault(); onSave(form); }} className="space-y-3">
          <input className="w-full border p-2" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
          <textarea className="w-full border p-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" className="border p-2" value={form.start} onChange={e=>setForm({...form, start:e.target.value})} required />
            <input type="datetime-local" className="border p-2" value={form.end} onChange={e=>setForm({...form, end:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Calendar</label>
            <select value={form.calendarId} onChange={e=>setForm({...form, calendarId:e.target.value})} className="w-full border p-2">
              {calendars.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.completed} onChange={e=>setForm({...form, completed:e.target.checked})} /> <span>Completed</span></div>
            <div className="flex gap-2">
              {initial && <button type="button" onClick={()=>onDelete(initial.id)} className="text-red-600">Delete</button>}
              <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-sky-600 text-white rounded">{initial ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
