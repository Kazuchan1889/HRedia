import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

// Icon Components
const IconHome = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const IconCalendar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const IconPerformance = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const IconMoney = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconLeave = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const IconClose = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const IconBell = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const IconReport = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const IconInbox = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
)

const IconChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const IconChevronUp = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
)

const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconAnalytics = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const IconSun = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const IconMoon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

function NavLink({ to, icon: Icon, children, onClick, badge, theme }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${
        theme === 'dark' 
          ? (isActive
              ? 'text-white bg-purple-500/20'
              : 'text-white/90 hover:text-white hover:bg-white/10')
          : (isActive
              ? 'text-indigo-900 bg-indigo-100'
              : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50')
      }`}
      style={theme === 'dark' && isActive ? { background: 'rgba(175, 71, 210, 0.2)' } : {}}
    >
      <div className="flex items-center gap-3">
        <Icon className={
          theme === 'dark' 
            ? (isActive ? 'text-white' : 'text-white/90')
            : (isActive ? 'text-indigo-900' : 'text-indigo-700')
        } />
        <span className="font-medium text-sm">{children}</span>
      </div>
      {badge && badge > 0 && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full text-white" style={{ background: '#AF47D2' }}>
          {badge}
        </span>
      )}
    </Link>
  )
}

function MobileMenu({ open, onClose, user, pendingCount, theme, toggleTheme, userViewMode }) {
  const navigate = useNavigate()
  const [iconError, setIconError] = useState(false)
  
  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }
  
  return (
    <div className={`${open ? 'fixed' : 'hidden'} inset-0 z-50 lg:hidden`}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>
      <div className={`absolute left-0 top-0 bottom-0 w-80 shadow-2xl transform transition-transform duration-300 flex flex-col ${
        theme === 'dark' 
          ? 'bg-[#26355D]' 
          : 'bg-gradient-to-br from-indigo-50 to-purple-50'
      }`}>
        <div className={`p-6 border-b transition-colors ${
          theme === 'dark' 
            ? 'border-white/10' 
            : 'border-indigo-200/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                {iconError ? (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg" style={{ background: 'linear-gradient(135deg, #AF47D2 0%, #8B3DB8 100%)' }}>
                    A
                  </div>
                ) : (
                  <img 
                    src="/IconP.png" 
                    alt="HexaSuite" 
                    className="w-full h-full object-cover" 
                    onError={() => setIconError(true)}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-base font-bold leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-indigo-900'}`}>
                  HexaSuite HR
                </div>
                <div className={`text-[10px] font-normal leading-tight mt-0.5 transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-indigo-500/70'}`}>
                  Management System
                </div>
                <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-white/70' : 'text-indigo-600/70'}`}>{user?.name || 'Guest'}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-white/10 text-white' 
                  : 'hover:bg-indigo-100 text-indigo-700'
              }`}
            >
              <IconClose />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto sidebar-scroll">
          <NavLink to="/" icon={IconHome} onClick={onClose} theme={theme}>
            Dashboard
          </NavLink>
          {(user?.role === 'admin' && !userViewMode) ? (
            <>
              <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                theme === 'dark' ? 'text-white/60' : 'text-indigo-600/70'
              }`}>Master Menu</div>
              <NavLink to="/admin/attendance" icon={IconCalendar} onClick={onClose} badge={pendingCount} theme={theme}>
                Master Absensi
              </NavLink>
              <NavLink to="/admin/leave" icon={IconLeave} onClick={onClose} badge={pendingCount} theme={theme}>
                Master Izin/Cuti
              </NavLink>
              <NavLink to="/admin/daily-report" icon={IconReport} onClick={onClose} theme={theme}>
                Master Laporan
              </NavLink>
              <NavLink to="/admin/users" icon={IconUsers} onClick={onClose} theme={theme}>
                Master User
              </NavLink>
              <NavLink to="/admin/payroll" icon={IconMoney} onClick={onClose} theme={theme}>
                Master Payroll
              </NavLink>
              <NavLink to="/admin/performance" icon={IconPerformance} onClick={onClose} theme={theme}>
                Performance
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/attendance" icon={IconCalendar} onClick={onClose} theme={theme}>
                Absensi Saya
              </NavLink>
              <NavLink to="/leave" icon={IconLeave} onClick={onClose} theme={theme}>
                Izin/Cuti Saya
              </NavLink>
              <NavLink to="/daily-report" icon={IconReport} onClick={onClose} theme={theme}>
                Laporan
              </NavLink>
              <NavLink to="/payroll" icon={IconMoney} onClick={onClose} theme={theme}>
                Payroll Saya
              </NavLink>
              <NavLink to="/performance" icon={IconPerformance} onClick={onClose} theme={theme}>
                Performance
              </NavLink>
            </>
          )}
        </nav>
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t space-y-2 transition-colors ${
          theme === 'dark' 
            ? 'border-white/10' 
            : 'border-indigo-200/50'
        }`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
              theme === 'dark' 
                ? 'text-white/90 hover:text-white hover:bg-white/10 border border-white/20' 
                : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
              <span className="font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium border ${
              theme === 'dark' 
                ? 'text-white/90 hover:text-white hover:bg-red-500/20 border-red-500/30' 
                : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
            }`}
          >
            <IconLogout />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([])
  const [pendingAttendanceRequests, setPendingAttendanceRequests] = useState([])
  const [pendingDailyReportEditRequests, setPendingDailyReportEditRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [iconError, setIconError] = useState(false)
  const [userViewMode, setUserViewMode] = useState(() => {
    const saved = localStorage.getItem('adminUserViewMode')
    return saved === 'true'
  })
  const [isChangingView, setIsChangingView] = useState(false)
  const [targetViewMode, setTargetViewMode] = useState(null)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const totalPendingCount = pendingLeaveRequests.length + pendingAttendanceRequests.length + pendingDailyReportEditRequests.length

  // Refresh user data on mount to get latest profilePicture
  useEffect(() => {
    async function refreshUserData() {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        const res = await axios.get('http://localhost:4000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const userData = res.data
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
        }
      } catch (err) {
        console.error('Error refreshing user data:', err)
      }
    }
    
    refreshUserData()
  }, [])

  // Load pending requests for notifications (admin only)
  useEffect(() => {
    async function loadPendingRequests() {
      const token = localStorage.getItem('token')
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
      if (!token || !currentUser || currentUser.role !== 'admin') return

      try {
        const [leaveRes, attendanceRes, dailyReportEditRes] = await Promise.all([
          axios.get('http://localhost:4000/api/leaverequests/pending', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/attendance-status-requests/pending', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/daily-report-edit-requests/pending', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        // Filter hanya yang status Pending untuk memastikan
        setPendingLeaveRequests((leaveRes.data || []).filter(r => r.status === 'Pending'))
        setPendingAttendanceRequests((attendanceRes.data || []).filter(r => r.status === 'Pending'))
        setPendingDailyReportEditRequests((dailyReportEditRes.data || []).filter(r => r.status === 'Pending'))
      } catch (err) {
        console.error('Error loading pending requests:', err)
      }
    }

    loadPendingRequests()
    // Refresh every 15 seconds (reduced from 30 for faster updates)
    const interval = setInterval(loadPendingRequests, 15000)
    
    // Listen for custom event to refresh notifications immediately
    const handleRefreshNotifications = () => {
      loadPendingRequests()
    }
    window.addEventListener('refreshNotifications', handleRefreshNotifications)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshNotifications', handleRefreshNotifications)
    }
  }, [])

  // Load notifications
  useEffect(() => {
    async function loadNotifications() {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const res = await axios.get('http://localhost:4000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotifications(res.data || [])
      } catch (err) {
        console.error('Error loading notifications:', err)
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close user menu and notification popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
      if (notificationOpen && !event.target.closest('.notification-container')) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, notificationOpen])

  // Redirect when userViewMode changes or when accessing admin routes in user view mode
  useEffect(() => {
    if (!user || user.role !== 'admin') return
    
    if (userViewMode) {
      // If in user view mode and accessing admin route, redirect to user route
      if (location.pathname.startsWith('/admin/')) {
        const userRoute = location.pathname.replace('/admin/', '/')
        if (userRoute !== location.pathname) {
          navigate(userRoute || '/', { replace: true })
        }
      }
    } else {
      // If in admin view mode and accessing user route that has admin equivalent, redirect to admin route
      const userRoutes = ['/attendance', '/leave', '/daily-report', '/payroll', '/performance']
      if (userRoutes.includes(location.pathname)) {
        const adminRoute = '/admin' + location.pathname
        if (adminRoute !== location.pathname) {
          navigate(adminRoute, { replace: true })
        }
      }
    }
  }, [userViewMode, location.pathname, user?.role, navigate, user])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Loading Overlay */}
      {isChangingView && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-colors ${
          theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } border`}>
            <div className="flex flex-col items-center gap-4">
              <div className={`h-12 w-12 border-4 rounded-full animate-spin ${
                theme === 'dark' 
                  ? 'border-purple-500 border-t-transparent' 
                  : 'border-purple-600 border-t-transparent'
              }`}></div>
              <p className={`text-sm font-medium transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {targetViewMode !== null 
                  ? (targetViewMode ? 'Switching to User View...' : 'Switching to Admin View...')
                  : 'Switching view...'}
              </p>
            </div>
          </div>
        </div>
      )}
      <MobileMenu open={open} onClose={() => setOpen(false)} user={user} pendingCount={totalPendingCount} theme={theme} toggleTheme={toggleTheme} userViewMode={userViewMode} />

      <div className="lg:flex">
        {/* Desktop sidebar - Fixed */}
        <aside className={`hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r shadow-2xl transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-[#26355D] border-[#AF47D2]/20' 
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
        }`}>
          {/* Header */}
          <div className={`p-6 border-b transition-colors duration-300 ${
            theme === 'dark' 
              ? 'border-white/10' 
              : 'border-indigo-200/50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                {iconError ? (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #AF47D2 0%, #8B3DB8 100%)' }}>
                    A
                  </div>
                ) : (
                  <img 
                    src="/IconP.png" 
                    alt="HexaSuite" 
                    className="w-full h-full object-cover" 
                    onError={() => setIconError(true)}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-base font-bold leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-indigo-900'}`}>
                  HexaSuite HR
                </div>
                <div className={`text-[10px] font-normal leading-tight mt-0.5 transition-colors ${theme === 'dark' ? 'text-white/50' : 'text-indigo-500/70'}`}>
                  Management System
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto sidebar-scroll">
            <NavLink to="/" icon={IconHome} theme={theme}>
              Dashboard
            </NavLink>
            
            {(user?.role === 'admin' && !userViewMode) ? (
              <>
                <div className="px-4 py-2 mt-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    theme === 'dark' ? 'text-white/60' : 'text-indigo-600/70'
                  }`}>Master Menu</span>
                </div>
                <NavLink to="/admin/attendance" icon={IconCalendar} theme={theme}>
                  Master Absensi
                </NavLink>
                <NavLink to="/admin/leave" icon={IconLeave} theme={theme}>
                  Master Izin/Cuti
                </NavLink>
                <NavLink to="/admin/daily-report" icon={IconReport} theme={theme}>
                  Master Laporan
                </NavLink>
                <NavLink to="/admin/users" icon={IconUsers} theme={theme}>
                  Master User
                </NavLink>
                <NavLink to="/admin/payroll" icon={IconMoney} theme={theme}>
                  Master Payroll
                </NavLink>
                <NavLink to="/admin/performance" icon={IconPerformance} theme={theme}>
                  Performance
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/attendance" icon={IconCalendar} theme={theme}>
                  Absensi Saya
                </NavLink>
                <NavLink to="/leave" icon={IconLeave} theme={theme}>
                  Izin/Cuti Saya
                </NavLink>
                <NavLink to="/daily-report" icon={IconReport} theme={theme}>
                  Laporan
                </NavLink>
                <NavLink to="/payroll" icon={IconMoney} theme={theme}>
                  Payroll Saya
                </NavLink>
                <NavLink to="/performance" icon={IconPerformance} theme={theme}>
                  Performance
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className={`p-4 border-t transition-colors duration-300 ${
            theme === 'dark' 
              ? 'border-white/10' 
              : 'border-indigo-200/50'
          } space-y-2`}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                theme === 'dark' 
                  ? 'text-white/90 hover:text-white hover:bg-white/10 border border-white/20' 
                  : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
                <span className="font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium border ${
                theme === 'dark' 
                  ? 'text-white/90 hover:text-white hover:bg-red-500/20 border-red-500/30' 
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
              }`}
            >
              <IconLogout />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 min-h-screen flex flex-col lg:ml-72">
          {/* Header */}
          <header className={`sticky top-0 z-40 border-b shadow-lg backdrop-blur-xl transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          }`}>
            <div className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => setOpen(true)}
                  className={`lg:hidden p-2 rounded-xl transition-colors flex-shrink-0 ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <IconMenu />
                </button>
                <div className="min-w-0">
                  <h1 className={`text-lg sm:text-xl font-bold transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Absensi</h1>
                  <p className={`text-xs hidden sm:block transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-purple-600'}`}>Sistem Manajemen Absensi</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* View Mode Toggle (Admin only) */}
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className={`text-xs font-medium transition-colors hidden sm:inline ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {userViewMode ? 'User' : 'Admin'}
                    </span>
                    <button
                      onClick={() => {
                        if (isChangingView) return
                        const newMode = !userViewMode
                        setTargetViewMode(newMode)
                        setIsChangingView(true)
                        
                        // Simulate loading delay
                        setTimeout(() => {
                          setUserViewMode(newMode)
                          localStorage.setItem('adminUserViewMode', newMode.toString())
                          // Dispatch custom event to notify Dashboard component
                          window.dispatchEvent(new Event('viewModeChanged'))
                          // Navigate to dashboard to trigger view change
                          navigate('/')
                          setIsChangingView(false)
                          setTargetViewMode(null)
                        }, 800) // 800ms loading delay
                      }}
                      disabled={isChangingView}
                      className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isChangingView
                          ? 'cursor-wait'
                          : 'cursor-pointer'
                      } ${
                        userViewMode
                          ? theme === 'dark'
                            ? 'bg-purple-600 focus:ring-purple-500'
                            : 'bg-purple-500 focus:ring-purple-400'
                          : theme === 'dark'
                            ? 'bg-gray-700 focus:ring-gray-500'
                            : 'bg-gray-300 focus:ring-gray-400'
                      }`}
                      title={userViewMode ? 'Switch to Admin View' : 'Switch to User View'}
                    >
                      {isChangingView ? (
                        <span className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full transition-transform duration-300 ${
                          userViewMode ? 'translate-x-6 sm:translate-x-8' : 'translate-x-1'
                        }`}>
                          <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                          }`}>
                            <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 rounded-full animate-spin ${
                              theme === 'dark' ? 'border-purple-400 border-t-transparent' : 'border-purple-500 border-t-transparent'
                            }`}></div>
                          </div>
                        </span>
                      ) : (
                        <span className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full transition-transform duration-300 ${
                          userViewMode ? 'translate-x-6 sm:translate-x-8' : 'translate-x-1'
                        } ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        } shadow-lg`}></span>
                      )}
                    </button>
                  </div>
                )}
                {/* Notifications */}
                {user?.role === 'admin' && !userViewMode && (
                  <div className="relative notification-container">
                    <button
                      onClick={() => setNotificationOpen(!notificationOpen)}
                      className={`relative p-1.5 sm:p-2 rounded-xl transition-colors ${
                        theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <IconBell className="w-5 h-5" />
                      {totalPendingCount > 0 ? (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 min-w-[1.25rem] h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
                          {totalPendingCount > 99 ? '99+' : totalPendingCount}
                        </span>
                      ) : null}
                    </button>

                    {/* Notification Popup */}
                    {notificationOpen && (
                      <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-xl border z-50 animate-fade-in max-h-96 overflow-hidden flex flex-col transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <div className={`p-4 border-b transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'border-gray-700 bg-gray-700/50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <h3 className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifikasi</h3>
                          <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {totalPendingCount > 0
                              ? `${totalPendingCount} pengajuan menunggu`
                              : 'Tidak ada pengajuan baru'}
                          </p>
                        </div>
                        <div className="overflow-y-auto">
                          {(pendingLeaveRequests.length === 0 && pendingAttendanceRequests.length === 0 && pendingDailyReportEditRequests.length === 0) ? (
                            <div className={`p-6 text-center transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <IconBell className={`w-12 h-12 mx-auto mb-2 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
                              <p className="text-sm">Tidak ada pengajuan baru</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {pendingLeaveRequests.map((request) => (
                                <button
                                  key={`leave-${request.id}`}
                                  onClick={() => {
                                    setNotificationOpen(false)
                                    navigate('/admin/leave')
                                  }}
                                  className={`w-full p-4 text-left transition-colors ${
                                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                      request.reason?.toLowerCase().includes('cuti')
                                        ? 'bg-blue-500'
                                        : 'bg-yellow-500'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                          {request.reason?.toLowerCase().includes('cuti') ? 'Cuti' : 'Izin'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                          theme === 'dark' 
                                            ? 'bg-yellow-900/50 text-yellow-300' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          Pending
                                        </span>
                                      </div>
                                      <p className={`text-sm font-medium truncate transition-colors ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                        {request.User?.name || `User ID: ${request.userId}`}
                                      </p>
                                      <p className={`text-xs mt-1 line-clamp-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {request.reason || 'Tidak ada deskripsi'}
                                      </p>
                                      <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {new Date(request.startDate).toLocaleDateString('id-ID')} - {new Date(request.endDate).toLocaleDateString('id-ID')}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {pendingAttendanceRequests.map((request) => (
                                <button
                                  key={`attendance-${request.id}`}
                                  onClick={() => {
                                    setNotificationOpen(false)
                                    navigate('/admin/attendance')
                                  }}
                                  className={`w-full p-4 text-left transition-colors ${
                                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-purple-500"></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                          Request Status Absensi
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                          theme === 'dark' 
                                            ? 'bg-yellow-900/50 text-yellow-300' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          Pending
                                        </span>
                                      </div>
                                      <p className={`text-sm font-medium truncate transition-colors ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                        {request.User?.name || `User ID: ${request.userId}`}
                                      </p>
                                      <p className={`text-xs mt-1 line-clamp-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {request.description || 'Tidak ada deskripsi'}
                                      </p>
                                      <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {request.Attendance?.date ? new Date(request.Attendance.date).toLocaleDateString('id-ID') : '-'}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {pendingDailyReportEditRequests.map((request) => (
                                <button
                                  key={`daily-report-edit-${request.id}`}
                                  onClick={() => {
                                    setNotificationOpen(false)
                                    navigate('/admin/daily-report')
                                  }}
                                  className={`w-full p-4 text-left transition-colors ${
                                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-orange-500"></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                          Request Edit Laporan
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                          theme === 'dark' 
                                            ? 'bg-yellow-900/50 text-yellow-300' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          Pending
                                        </span>
                                      </div>
                                      <p className={`text-sm font-medium truncate transition-colors ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                        {request.User?.name || `User ID: ${request.userId}`}
                                      </p>
                                      <p className={`text-xs mt-1 line-clamp-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {request.reason || 'Tidak ada alasan'}
                                      </p>
                                      <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {request.DailyReport?.date ? new Date(request.DailyReport.date).toLocaleDateString('id-ID') : '-'}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {totalPendingCount > 0 && (
                          <div className={`p-3 border-t transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                            <button
                              onClick={() => {
                                setNotificationOpen(false)
                                navigate('/admin/leave')
                              }}
                              className={`w-full text-sm font-medium transition-colors ${
                                theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                              }`}
                            >
                              Lihat Semua →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* User Profile with Dropdown */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {user?.profilePicture ? (
                      <img
                        src={`http://localhost:4000${user.profilePicture}`}
                        alt={user?.name || 'User'}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #AF47D2 0%, #8B3DB8 100%)' }}>
                        {(user?.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:block text-left min-w-0">
                      <div className={`text-xs sm:text-sm font-semibold truncate transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Guest'}</div>
                      <div className={`text-xs truncate transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || user?.role || 'User'}</div>
                    </div>
                    <IconChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 hidden sm:block" />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 sm:w-48 rounded-xl shadow-2xl border py-2 z-50" style={{ background: '#1a2440', borderColor: 'rgba(175, 71, 210, 0.3)' }}>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                      >
                        <IconUser />
                        <span className="text-sm">View profile</span>
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/performance"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                        >
                          <IconAnalytics />
                          <span className="text-sm">Analytics</span>
                        </Link>
                      )}
                      <div className="border-t border-white/10 my-1"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                        }}
                        className="w-full text-left px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                      >
                        <IconLogout />
                        <span className="text-sm">Log out</span>
                      </button>
                      <div className="px-4 py-2 text-xs text-white/60 text-center border-t border-white/10 mt-1">
                        v1.0
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 p-4 lg:p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <Outlet />
          </main>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        /* Hide scrollbar for sidebar */
        .sidebar-scroll::-webkit-scrollbar {
          display: none;
        }
        .sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
