import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-2">Eventure — Your calendar, simplified</h1>
      <p className="text-gray-600 mb-4">Quickly create events, manage multiple calendars and mark tasks complete.</p>
      <div className="space-x-3">
        <Link to="/register" className="px-4 py-2 bg-emerald-600 text-white rounded">Get started</Link>
        <Link to="/login" className="px-4 py-2 border rounded">Login</Link>
      </div>
    </div>
  )
}
