import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ParentDashboard from './pages/ParentDashboard.jsx'
import './styles.css'

function App() {
  const isLogged = () => !!localStorage.getItem('token')
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>} />
        <Route path='/admin/dashboard' element={isLogged() ? <AdminDashboard/> : <Navigate to='/' />} />
        <Route path='/parent/children' element={isLogged() ? <ParentDashboard/> : <Navigate to='/' />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
