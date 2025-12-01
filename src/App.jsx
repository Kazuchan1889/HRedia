import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Users from './pages/Users'
import Layout from './components/Layout'
import Leave from './pages/Leave'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import Payroll from './pages/Payroll'
import CalendarPage from './pages/Calendar'
import NotificationsPage from './pages/Notifications'
import AdminAttendance from './pages/AdminAttendance'
import AdminLeave from './pages/AdminLeave'
import AdminAttendanceStatusRequests from './pages/AdminAttendanceStatusRequests'
import AdminDailyReport from './pages/AdminDailyReport'
import AdminDailyReportEditRequests from './pages/AdminDailyReportEditRequests'
import AdminPayroll from './pages/AdminPayroll'
import Performance from './pages/Performance'
import MyPerformance from './pages/MyPerformance'
import DailyReport from './pages/DailyReport'
import Profile from './pages/Profile'

function RequireAuth({ children }){
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function validateToken() {
  const token = localStorage.getItem('token')
      
      // If no token, redirect to login
      if (!token) {
        localStorage.removeItem('user')
        setIsAuthenticated(false)
        setIsValidating(false)
        return
      }

      // Validate token by calling API
      try {
        const res = await axios.get('http://localhost:4000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        // Token is valid, update user data
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data))
          setIsAuthenticated(true)
        } else {
          // No user data, token invalid
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } catch (err) {
        // Token is invalid or expired
        console.error('Token validation failed:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [])

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Memvalidasi sesi...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated, render children
  return children
}

export default function App(){
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leave" element={<Leave />} />
          <Route path="daily-report" element={<DailyReport />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="performance" element={<MyPerformance />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<Profile />} />
          {/* Admin routes */}
          <Route path="admin/attendance" element={<AdminAttendance />} />
          <Route path="admin/leave" element={<AdminLeave />} />
          <Route path="admin/attendance-requests" element={<AdminAttendanceStatusRequests />} />
          <Route path="admin/daily-report" element={<AdminDailyReport />} />
          <Route path="admin/daily-report-edit-requests" element={<AdminDailyReportEditRequests />} />
          <Route path="admin/users" element={<Users />} />
          <Route path="admin/payroll" element={<AdminPayroll />} />
          <Route path="admin/performance" element={<Performance />} />
        </Route>
        {/* Default redirect to login if route not found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
