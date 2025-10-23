import React, {useState} from 'react'
import axios from 'axios'

export default function Login() {
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('userId', res.data.id)
      if (res.data.role === 'admin') {
        window.location.href = '/admin/dashboard'
      } else {
        window.location.href = '/parent/children'
      }
    } catch (err) {
      setError('Login failed: ' + (err.response?.data?.error || err.message))
    }
  }

  const fillAdmin = () => { setEmail('admin@moiforcesacademy.ac.ke'); setPassword('Admin@123') }
  const fillParent = () => { setEmail('parent@moiforcesacademy.ac.ke'); setPassword('Parent@123') }

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f1f5f9'}}>
      <div style={{width:420,background:'#fff',padding:24,borderRadius:12,boxShadow:'0 8px 20px rgba(0,0,0,0.08)'}}>
        <h2>Moi Forces Academy — Login</h2>
        <form onSubmit={submit} style={{marginTop:12}}>
          <label style={{fontSize:13}}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:8,borderRadius:8,marginTop:6,border:'1px solid #e5e7eb'}} />
          <label style={{fontSize:13, marginTop:8}}>Password</label>
          <input type='password' value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:8,borderRadius:8,marginTop:6,border:'1px solid #e5e7eb'}} />
          <div style={{marginTop:12,display:'flex',gap:8}}>
            <button type='submit' style={{padding:'8px 12px',background:'#0ea5a5',color:'#fff',borderRadius:8}}>Sign in</button>
            <button type='button' onClick={fillAdmin} style={{padding:'8px 12px',borderRadius:8}}>Fill Admin</button>
            <button type='button' onClick={fillParent} style={{padding:'8px 12px',borderRadius:8}}>Fill Parent</button>
          </div>
          {error && <div style={{marginTop:8,color:'red'}}>{error}</div>}
        </form>
      </div>
    </div>
  )
}
