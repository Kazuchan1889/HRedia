import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

// Icon Components
const IconUsers = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const IconCalendar = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const IconClipboard = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const IconDocument = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const IconMoney = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const IconChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

// Metric Card Component
function MetricCard({ icon: Icon, title, value, iconBg, onClick, theme }) {
  return (
    <div 
      className={`rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''} ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm mb-1 transition-colors truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-lg sm:text-xl lg:text-2xl font-bold transition-colors truncate ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [summary, setSummary] = useState({ hadir: 0, izin: 0, sakit: 0, alfa: 0 })
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalAttendance, setTotalAttendance] = useState(0)
  const [totalDailyReports, setTotalDailyReports] = useState(0)
  const [totalPayrolls, setTotalPayrolls] = useState(0)
  const [pendingRequests, setPendingRequests] = useState([])
  const [recentReports, setRecentReports] = useState([])
  const [latest, setLatest] = useState([])
  const [today, setToday] = useState(null)
  const [averageKPI, setAverageKPI] = useState(0)
  const [topPerformers, setTopPerformers] = useState([])
  const [kpiHistory, setKpiHistory] = useState([])
  const [kpiMode, setKpiMode] = useState('monthly') // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(true)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraAction, setCameraAction] = useState(null)
  const videoRef = React.useRef(null)
  const [stream, setStream] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    // Reload KPI when mode changes (only after initial load)
    if (!loading) {
      loadKPI()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiMode])

  // Set video stream when it's available
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject) {
        const oldTracks = videoRef.current.srcObject.getTracks()
        oldTracks.forEach(track => track.stop())
      }
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err)
      })
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [stream, cameraOpen])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([
        load(),
        loadUsers(),
        loadDailyReports(),
        loadPayrolls(),
        loadPendingRequests(),
        loadMyAttendance(),
        loadKPI()
      ])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const list = res.data
      setSummary({
        hadir: list.filter(x => x.status === 'Hadir').length,
        izin: list.filter(x => x.status === 'Izin').length,
        sakit: list.filter(x => x.status === 'Sakit').length,
        alfa: list.filter(x => x.status === 'Alfa').length,
      })
      setTotalAttendance(list.length)
      setLatest(list.slice(-6).reverse())
    } catch (err) {
      console.error('Error loading attendance:', err)
    }
  }

  async function loadUsers() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userList = res.data.filter(u => u.role === 'user')
      setAllUsers(userList)
      setUsers(userList.slice(0, 4))
      setTotalUsers(userList.length)
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  async function loadDailyReports() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/daily-reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTotalDailyReports(res.data.length)
      setRecentReports(res.data.slice(0, 5).reverse())
    } catch (err) {
      console.error('Error loading daily reports:', err)
    }
  }

  async function loadPayrolls() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/payroll', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTotalPayrolls(res.data.length || 0)
    } catch (err) {
      console.error('Error loading payrolls:', err)
      // Payroll might not have data yet
      setTotalPayrolls(0)
    }
  }

  async function loadPendingRequests() {
    try {
      const token = localStorage.getItem('token')
      const [leaveRes, attendanceRes, dailyReportEditRes] = await Promise.all([
        axios.get('http://localhost:4000/api/leaverequests/pending', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get('http://localhost:4000/api/attendance-status-requests/pending', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get('http://localhost:4000/api/daily-report-edit-requests/pending', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ])
      const allRequests = [
        ...(leaveRes.data || []).map(r => ({ ...r, type: 'Leave', title: r.type === 'Cuti' ? 'Cuti Request' : 'Izin Request' })),
        ...(attendanceRes.data || []).map(r => ({ ...r, type: 'Attendance', title: 'Attendance Status Request' })),
        ...(dailyReportEditRes.data || []).map(r => ({ ...r, type: 'DailyReport', title: 'Daily Report Edit Request' }))
      ]
      setPendingRequests(allRequests.slice(0, 3))
    } catch (err) {
      console.error('Error loading pending requests:', err)
    }
  }

  async function loadKPI() {
    try {
      const token = localStorage.getItem('token')
      const now = new Date()
      
      let historyData = []
      
      if (kpiMode === 'monthly') {
        // Load current month KPI
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const res = await axios.get(`http://localhost:4000/api/performance?mode=monthly&month=${month}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.data && res.data.users) {
          setAverageKPI(res.data.averageKPI || 0)
          const top = res.data.users.slice(0, 4).map(u => ({
            name: u.name,
            tasks: Math.round(u.kpiScore),
            userId: u.userId
          }))
          setTopPerformers(top)
        }

        // Load KPI history for chart (last 6 months)
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          try {
            const histRes = await axios.get(`http://localhost:4000/api/performance?mode=monthly&month=${monthStr}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            historyData.push({
              label: date.toLocaleDateString('en-US', { month: 'short' }),
              value: histRes.data?.averageKPI || 0
            })
          } catch (err) {
            historyData.push({
              label: date.toLocaleDateString('en-US', { month: 'short' }),
              value: 0
            })
          }
        }
      } else {
        // Yearly mode - load current year and last 5 years
        const currentYear = now.getFullYear()
        const res = await axios.get(`http://localhost:4000/api/performance?mode=yearly&year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.data && res.data.users) {
          setAverageKPI(res.data.averageKPI || 0)
          const top = res.data.users.slice(0, 4).map(u => ({
            name: u.name,
            tasks: Math.round(u.kpiScore),
            userId: u.userId
          }))
          setTopPerformers(top)
        }

        // Load KPI history for chart (last 6 years)
        for (let i = 5; i >= 0; i--) {
          const year = currentYear - i
          try {
            const histRes = await axios.get(`http://localhost:4000/api/performance?mode=yearly&year=${year}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            historyData.push({
              label: year.toString(),
              value: histRes.data?.averageKPI || 0
            })
          } catch (err) {
            historyData.push({
              label: year.toString(),
              value: 0
            })
          }
        }
      }
      
      setKpiHistory(historyData)
    } catch (err) {
      console.error('Error loading KPI:', err)
    }
  }

  async function loadMyAttendance() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendances/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const list = res.data || []
      const todayDate = new Date().toISOString().slice(0, 10)
      const todays = list.find(x => x.date === todayDate)
      setToday(todays || null)
    } catch (err) {
      console.error('Error loading my attendance:', err)
  }
  }

  async function openCameraFor(action) {
    setCameraAction(action)
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      })
      setStream(s)
      setCameraOpen(true)
    } catch (err) {
      alert('Camera access denied or not available')
      console.error(err)
      setCameraAction(null)
    }
  }

  async function performAction(action, photo) {
    try {
      const token = localStorage.getItem('token')
      const body = { action }
      if (photo) body.photo = photo
      await axios.post('http://localhost:4000/api/attendances/action', body, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await loadMyAttendance()
      setCameraOpen(false)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
        setStream(null)
      }
      setCameraAction(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
      console.error(err)
    }
  }

  async function captureAndSend(videoEl) {
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth || 640
    canvas.height = videoEl.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const photo = (cameraAction === 'checkin' || cameraAction === 'checkout') ? dataUrl : null
    await performAction(cameraAction, photo)
  }

  // Calculate attendance rate
  const totalStatus = summary.hadir + summary.izin + summary.sakit + summary.alfa
  const attendanceRate = totalStatus > 0 ? ((summary.hadir / totalStatus) * 100).toFixed(2) : 0

  // Calculate working format percentages
  const total = summary.hadir + summary.izin + summary.sakit + summary.alfa
  const onSite = summary.hadir
  const hybrid = summary.izin
  const remote = summary.sakit + summary.alfa

  // Get user performance for table
  const getUserPerformance = (userId) => {
    const performer = topPerformers.find(p => p.userId === userId)
    return performer ? performer.tasks : 0
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#AF47D2' }}></div>
          <p className={`transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Dashboard</h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          icon={IconUsers}
          title="Total Users"
          value={totalUsers}
          iconBg="bg-gray-200"
          onClick={() => navigate('/admin/users')}
          theme={theme}
        />
        <MetricCard
          icon={IconCalendar}
          title="Total Attendance"
          value={totalAttendance}
          iconBg="bg-gray-200"
          onClick={() => navigate('/admin/attendance')}
          theme={theme}
        />
        <MetricCard
          icon={IconClipboard}
          title="Pending Requests"
          value={pendingRequests.length}
          iconBg="bg-gray-200"
          onClick={() => navigate('/admin/leave')}
          theme={theme}
        />
        <MetricCard
          icon={IconDocument}
          title="Daily Reports"
          value={totalDailyReports}
          iconBg="bg-gray-200"
          onClick={() => navigate('/admin/daily-report')}
          theme={theme}
        />
        <MetricCard
          icon={IconMoney}
          title="Payroll Records"
          value={totalPayrolls}
          iconBg="bg-gray-200"
          onClick={() => navigate('/admin/payroll')}
          theme={theme}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Average KPI Score Card */}
          <div className={`rounded-xl p-4 sm:p-6 shadow-sm border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Average KPI Score</h2>
                <div className="mt-2">
                  <span className={`text-2xl sm:text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>{averageKPI.toFixed(2)}</span>
                  <span className={`text-xs sm:text-sm ml-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/ 100</span>
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={kpiMode}
                  onChange={(e) => setKpiMode(e.target.value)}
                  className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200'
                  }`}
                  style={theme === 'light' ? { color: '#26355D' } : {}}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <IconChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 sm:h-48 mt-4 sm:mt-6 overflow-x-auto pb-2">
              {kpiHistory.length > 0 ? (
                kpiHistory.map((item, index) => {
                  // Calculate height as percentage of max value (100) or relative to max in dataset
                  const maxValue = Math.max(...kpiHistory.map(h => h.value), 100)
                  const height = maxValue > 0 ? Math.max(10, (item.value / maxValue) * 100) : 10
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center min-w-[40px] sm:min-w-0">
                      <div className="w-full flex items-end justify-center" style={{ height: '100%', minHeight: '100px' }}>
                        <div
                          className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{
                            height: `${height}%`,
                            background: 'linear-gradient(180deg, #AF47D2 0%, #8B3DB8 100%)',
                            minHeight: '20px'
                          }}
                          title={`${item.label}: ${item.value.toFixed(2)}`}
                        />
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-2 transition-colors text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                    </div>
                  )
                })
              ) : (
                <div className={`w-full text-center py-8 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No KPI data available</div>
              )}
            </div>

            {/* Top Performance Section */}
            <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Top Performance</h3>
              <div className="space-y-2 sm:space-y-3">
                {topPerformers.length > 0 ? (
                  topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0" style={{ background: '#AF47D2' }}>
                        {performer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm sm:text-base truncate transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>{performer.name}</p>
                        <p className={`text-xs sm:text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>KPI Score: {performer.tasks}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs sm:text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No performance data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className={`rounded-xl p-4 sm:p-6 shadow-sm border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Employees</h2>
              <button 
                className="text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity" 
                style={{ color: '#AF47D2' }}
                onClick={() => navigate('/admin/users')}
              >
                See all
              </button>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full">
                  <thead>
                    <tr className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                      <th className={`text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>ID</th>
                      <th className={`text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Name</th>
                      <th className={`text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors hidden sm:table-cell ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Role</th>
                      <th className={`text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => {
                        const performance = getUserPerformance(user.id) || 0
                        return (
                          <tr key={user.id} className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                            <td className={`py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>
                              <span className="truncate block">{user.employeeId || `EMP${String(user.id).padStart(6, '0')}`}</span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className={`font-medium text-xs sm:text-sm transition-colors truncate ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>{user.name}</div>
                              <div className={`text-xs sm:hidden transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user.position || 'Employee'}</div>
                            </td>
                            <td className={`py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm transition-colors hidden sm:table-cell ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user.position || 'Employee'}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className={`flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(performance, 100)}%`,
                                      background: '#AF47D2'
                                    }}
                                  />
                                </div>
                                <span className={`text-[10px] sm:text-xs w-8 sm:w-10 text-right transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{performance}%</span>
                                <IconMenu className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors hidden sm:block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className={`py-8 text-center transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No employees found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-4 sm:space-y-6">
          {/* Pending Requests */}
          <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ background: '#26355D' }}>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Pending Requests</h2>
            <div className="space-y-3 sm:space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {
                    if (request.type === 'Leave') navigate('/admin/leave')
                    else if (request.type === 'Attendance') navigate('/admin/attendance-requests')
                    else if (request.type === 'DailyReport') navigate('/admin/daily-report-edit-requests')
                  }}>
                    <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-xs sm:text-sm truncate">{request.title || request.type}</p>
                      <p className="text-xs sm:text-sm text-white/70 mt-1 truncate">
                        {request.User?.name || `User ID: ${request.userId}`}
                      </p>
                      <p className="text-[10px] sm:text-xs text-white/50 mt-1">
                        {request.startDate ? new Date(request.startDate).toLocaleDateString('id-ID') : 
                         request.Attendance?.date ? new Date(request.Attendance.date).toLocaleDateString('id-ID') :
                         request.DailyReport?.date ? new Date(request.DailyReport.date).toLocaleDateString('id-ID') :
                         'Today'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/70 text-xs sm:text-sm">No pending requests</p>
              )}
            </div>
            {pendingRequests.length > 0 && (
                <button 
                className="mt-4 w-full text-xs sm:text-sm text-white/80 hover:text-white transition-colors text-center"
                onClick={() => navigate('/admin/leave')}
                >
                See all →
                </button>
            )}
          </div>

          {/* Attendance Status */}
          <div className={`rounded-xl p-4 sm:p-6 shadow-sm border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <h2 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Attendance Status</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold text-sm sm:text-base transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Hadir</span>
                  <span className={`text-xs sm:text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {total > 0 ? ((onSite / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? (onSite / total) * 100 : 0}%`,
                      background: '#AF47D2'
                    }}
                  />
                </div>
                <p className={`text-xs sm:text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{onSite.toLocaleString()} records</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold text-sm sm:text-base transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Izin</span>
                  <span className={`text-xs sm:text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {total > 0 ? ((hybrid / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? (hybrid / total) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #AF47D2 0%, #8B3DB8 100%)'
                    }}
                  />
                </div>
                <p className={`text-xs sm:text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{hybrid.toLocaleString()} records</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold text-sm sm:text-base transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Sakit & Alfa</span>
                  <span className={`text-xs sm:text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {total > 0 ? ((remote / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? (remote / total) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #26355D 0%, #1a2440 100%)'
                    }}
                  />
                </div>
                <p className={`text-xs sm:text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{remote.toLocaleString()} records</p>
              </div>
            </div>
          </div>

          {/* Recent Daily Reports */}
          {recentReports.length > 0 && (
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}>
              <h2 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>Recent Reports</h2>
              <div className="space-y-2 sm:space-y-3">
                {recentReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: '#AF47D2' }}>
                      {report.User?.name?.slice(0, 1).toUpperCase() || 'R'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-medium truncate transition-colors ${theme === 'dark' ? 'text-white' : ''}`} style={theme === 'light' ? { color: '#26355D' } : {}}>
                        {report.User?.name || 'User'}
                      </p>
                      <p className={`text-[10px] sm:text-xs truncate transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{report.content?.substring(0, 50)}...</p>
                      <p className={`text-[10px] sm:text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(report.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="mt-4 w-full text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity text-center"
                style={{ color: '#AF47D2' }}
                onClick={() => navigate('/admin/daily-report')}
              >
                See all →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-3 sm:p-4" style={{ background: 'linear-gradient(135deg, #26355D 0%, #AF47D2 100%)' }}>
              <div className="flex justify-between items-center">
                <div className="text-white font-bold text-base sm:text-lg">
                  {cameraAction === 'checkin' ? '📷 Check In' : cameraAction === 'checkout' ? '📷 Check Out' : '☕ Istirahat'}
                </div>
                <button 
                  onClick={() => { 
                    setCameraOpen(false)
                    if (stream) {
                      stream.getTracks().forEach(t => t.stop())
                      setStream(null)
                    } 
                    setCameraAction(null) 
                  }} 
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`p-3 sm:p-4 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`mb-3 sm:mb-4 rounded-xl overflow-hidden bg-black border-2 sm:border-4 shadow-inner aspect-video transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-800'
              }`}>
                {stream ? (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Memuat kamera...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={async () => {
                    const video = videoRef.current || document.querySelector('video')
                    await captureAndSend(video) 
                  }} 
                  className="flex-1 btn btn-primary text-white rounded-xl py-2.5 sm:py-3 text-sm sm:text-base"
                  style={{ background: '#AF47D2' }}
                >
                  {cameraAction === 'checkin' ? 'Check In' : cameraAction === 'checkout' ? 'Check Out' : 'Istirahat'}
                </button>
                <button 
                  onClick={() => { 
                    if (stream) {
                      stream.getTracks().forEach(t => t.stop())
                      setStream(null)
                    } 
                    setCameraOpen(false)
                    setCameraAction(null) 
                  }} 
                  className="btn btn-ghost text-sm sm:text-base px-3 sm:px-4"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
