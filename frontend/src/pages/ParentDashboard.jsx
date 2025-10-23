import React, {useEffect, useState} from 'react'
import axios from 'axios'

export default function ParentDashboard() {
  const [children,setChildren] = useState([])
  const [error,setError] = useState('')
  useEffect(()=>{ fetchChildren() },[])
  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/parents/me/children', { headers: { Authorization: 'Bearer ' + token } })
      setChildren(res.data.children || [])
    } catch (err) {
      setError('Failed to load children')
    }
  }
  return (
    <div style={{padding:24}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>Moi Forces Academy — Parent Portal</h1>
        <div>
          <button onClick={()=>{ localStorage.clear(); window.location.href='/' }} style={{padding:8}}>Logout</button>
        </div>
      </header>
      <main style={{marginTop:16}}>
        {error && <div style={{color:'red'}}>{error}</div>}
        {children.map(c=> (
          <div key={c.id} style={{background:'#fff',padding:12,borderRadius:8,marginBottom:12}}>
            <h3>{c.first_name} {c.last_name} • {c.reg_no}</h3>
            <div style={{marginTop:8}}>
              <h4>Recent events</h4>
              <ul>
                {c.events.map(ev => <li key={ev.id}>{new Date(ev.timestamp).toLocaleString()} — {ev.event_type} — {ev.reason_code || '-'}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
