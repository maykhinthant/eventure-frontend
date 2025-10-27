import React, { useEffect, useState } from 'react'

function toDateTimeLocal(value){
  if(!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if(Number.isNaN(date.getTime())) return ''
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return shifted.toISOString().slice(0, 16)
}

function parseRecurrenceRule(rule){
  if(!rule) return { frequency: 'DAILY', interval: 1 }

  return rule.split(';').reduce((acc, part) => {
    const [keyRaw, valueRaw] = part.split('=')
    const key = keyRaw?.toUpperCase()?.trim()
    const value = valueRaw?.toUpperCase()?.trim()

    if(key === 'FREQ' && value){
      acc.frequency = value
    }

    if(key === 'INTERVAL'){
      const parsed = Number(valueRaw)
      acc.interval = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    }

    return acc
  }, { frequency: 'DAILY', interval: 1 })
}

function buildRecurrenceRule(frequency, interval, until) {
  const normalizedInterval = Math.max(1, Number(interval) || 1);
  const normalizedFrequency = frequency || 'DAILY';
  let rule = `FREQ=${normalizedFrequency};INTERVAL=${normalizedInterval}`;
  
  if (until) {
    // Format the date in YYYYMMDDTHHmmssZ format (UTC)
    const date = new Date(until);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    rule += `;UNTIL=${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }
  
  return rule;
}

const repeatFrequencyOptions = [
  { value: 'DAILY', label: 'day(s)' },
  { value: 'WEEKLY', label: 'week(s)' },
  { value: 'MONTHLY', label: 'month(s)' },
  { value: 'YEARLY', label: 'year(s)' }
]

export default function EventModal({ open, onClose, initial, onSave, onDelete, calendars=[] }){
  const [form, setForm] = useState({
    id: null,
    title: '',
    start: '',
    end: '',
    calendarId: '',
    completed: false,
    repeatEnabled: false,
    repeatFrequency: 'DAILY',
    repeatInterval: 1,
    recurrenceRule: '',
    recurrenceEndDate: ''
  })
  useEffect(()=>{
    if(initial){
      const start = toDateTimeLocal(initial.start)
      const end = toDateTimeLocal(initial.end) || start
      const derived = parseRecurrenceRule(initial.recurrenceRule);
      const repeatEnabled = initial.repeatEnabled ?? initial.isRecurring ?? !!initial.recurrenceRule;
      const repeatFrequency = initial.repeatFrequency || derived.frequency;
      const repeatInterval = initial.repeatInterval || derived.interval;
      const recurrenceEndDate = initial.recurrenceEndDate ? toDateTimeLocal(initial.recurrenceEndDate) : '';

      setForm({
        id: initial.id ?? null,
        title: initial.title || '',
        start,
        end,
        calendarId: initial.calendarId || (calendars[0] && calendars[0].id) || '',
        completed: !!initial.completed,
        repeatEnabled: !!repeatEnabled,
        repeatFrequency,
        repeatInterval,
        recurrenceRule: initial.recurrenceRule || '',
        recurrenceEndDate: recurrenceEndDate || ''
      })
    } else {
      setForm({
        id: null,
        title: '',
        start: '',
        end: '',
        calendarId: (calendars[0] && calendars[0].id) || '',
        completed: false,
        repeatEnabled: false,
        repeatFrequency: 'DAILY',
        repeatInterval: 1,
        recurrenceRule: '',
        recurrenceEndDate: ''
      })
    }
  },[initial, open, calendars])

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow w-full max-w-lg p-4">
        <h3 className="text-lg font-semibold mb-2">{initial ? 'Edit Event' : 'New Event'}</h3>
        <form
          onSubmit={(e)=>{
            e.preventDefault()
            const interval = Math.max(1, Number(form.repeatInterval) || 1);
            const frequency = form.repeatFrequency || 'DAILY';
            const repeatEnabled = !!form.repeatEnabled;
            const recurrenceRule = repeatEnabled ? buildRecurrenceRule(frequency, interval, form.recurrenceEndDate) : '';

            onSave({
              ...form,
              repeatInterval: interval,
              repeatFrequency: frequency,
              repeatEnabled,
              recurrenceRule
            })
          }}
          className="space-y-3"
        >
          <input className="w-full border p-2" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Repeat</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="repeat-toggle"
                  checked={!form.repeatEnabled}
                  onChange={()=>setForm({...form, repeatEnabled:false})}
                />
                Does not repeat
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="repeat-toggle"
                  checked={!!form.repeatEnabled}
                  onChange={()=>setForm({...form, repeatEnabled:true})}
                />
                Repeats
              </label>
            </div>
            {form.repeatEnabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Every</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border p-2"
                      value={form.repeatInterval}
                      onChange={e=>setForm({...form, repeatInterval: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Frequency</label>
                    <select
                      className="w-full border p-2"
                      value={form.repeatFrequency}
                      onChange={e=>setForm({...form, repeatFrequency: e.target.value})}
                    >
                      {repeatFrequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">End Date (optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full border p-2"
                    value={form.recurrenceEndDate}
                    min={form.start || ''}
                    onChange={e => setForm({...form, recurrenceEndDate: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no end date (6 months default)</p>
                </div>
              </div>
            )}
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
