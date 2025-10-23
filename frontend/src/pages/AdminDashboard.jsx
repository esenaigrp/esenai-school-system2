import React, {useEffect, useState} from 'react'
import axios from 'axios'

export default function AdminDashboard() {
  const [events,setEvents] = useState([])
  const [error,setError] = useState('')
  useEffect(()=>{ fetchEvents() },[])
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/events', { headers: { Authorization: 'Bearer ' + token } })
      setEvents(res.data.events || [])
    } catch (err) {
      setError('Failed to load events')
    }
  }
  return (
    <div style={{padding:24}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>Moi Forces Academy — Admin Dashboard</h1>
        <div>
          <button onClick={()=>{ localStorage.clear(); window.location.href='/' }} style={{padding:8}}>Logout</button>
        </div>
      </header>
      <main style={{marginTop:16}}>
        <h3>Recent Events</h3>
        {error && <div style={{color:'red'}}>{error}</div>}
        <table style={{width:'100%',background:'#fff',borderRadius:8,padding:12}}>
          <thead style={{textAlign:'left',color:'#6b7280'}}>
            <tr><th style={{padding:8}}>Time</th><th>Student</th><th>Reg#</th><th>Event</th><th>Reason</th></tr>
          </thead>
          <tbody>
            {events.map(ev=> (
              <tr key={ev.id}><td style={{padding:8}}>{new Date(ev.timestamp).toLocaleString()}</td><td>{ev.first_name} {ev.last_name}</td><td>{ev.reg_no}</td><td>{ev.event_type}</td><td>{ev.reason_code || '-'}</td></tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}
