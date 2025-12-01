import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './UserDashboard'

export default function Dashboard(){
  const location = useLocation()
  const [userViewMode, setUserViewMode] = useState(() => {
    return localStorage.getItem('adminUserViewMode') === 'true'
  })
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || 'null')
  })

  // Update state when location changes (when navigating to dashboard)
  useEffect(() => {
    const newUserViewMode = localStorage.getItem('adminUserViewMode') === 'true'
    const newUser = JSON.parse(localStorage.getItem('user') || 'null')
    setUserViewMode(newUserViewMode)
    setUser(newUser)
  }, [location.pathname])

  // Also listen for custom event when view mode changes
  useEffect(() => {
    const handleViewModeChange = () => {
      const newUserViewMode = localStorage.getItem('adminUserViewMode') === 'true'
      setUserViewMode(newUserViewMode)
    }

    window.addEventListener('viewModeChanged', handleViewModeChange)
    return () => {
      window.removeEventListener('viewModeChanged', handleViewModeChange)
    }
  }, [])
  
  if (!user) return <div className="text-gray-500">Loading...</div>
  if (user.role === 'admin' && !userViewMode) return <AdminDashboard />
  return <UserDashboard />
}
