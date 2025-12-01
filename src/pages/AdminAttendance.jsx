import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function AdminAttendance() {
  const { theme } = useTheme()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({ date: '', userId: '' })
  const [users, setUsers] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState('time') // 'time' or 'holiday'
  const [settings, setSettings] = useState({
    checkInTime: '08:00',
    checkOutTime: '17:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    checkInTolerance: 15, // minutes
    breakDuration: 60 // minutes
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [exporting, setExporting] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [processingRequest, setProcessingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState('absen') // 'absen', 'log', or 'requests'
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState({}) // Map userId -> attendance status for today
  const [loadingTodayStatus, setLoadingTodayStatus] = useState(false)
  const [holidaySettings, setHolidaySettings] = useState([]) // List of all user holiday settings
  const [editingHolidayUserId, setEditingHolidayUserId] = useState(null)
  const [holidayForm, setHolidayForm] = useState({ day1: '', day2: '', isActive: true })
  const [savingHoliday, setSavingHoliday] = useState(false)
  const [selectedUsersForTime, setSelectedUsersForTime] = useState([]) // Selected user IDs for time settings
  const [selectedUsersForHoliday, setSelectedUsersForHoliday] = useState([]) // Selected user IDs for holiday settings
  const [bulkAssigningTime, setBulkAssigningTime] = useState(false)
  const [bulkAssigningHoliday, setBulkAssigningHoliday] = useState(false)

  useEffect(() => {
    load()
    loadUsers()
    loadSettings()
    loadPendingRequests()
    loadHolidaySettings()
    loadTodayAttendanceStatus()
  }, [])

  // Auto-refresh today's attendance status
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'absen') {
        loadTodayAttendanceStatus()
      }
    }, 30000) // Refresh every 30 seconds

    // Listen for attendance status changes
    const handleRefresh = () => {
      if (activeTab === 'absen') {
        loadTodayAttendanceStatus()
      }
    }
    window.addEventListener('refreshAttendanceStatus', handleRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshAttendanceStatus', handleRefresh)
    }
  }, [activeTab])

  async function loadTodayAttendanceStatus() {
    setLoadingTodayStatus(true)
    try {
      const token = localStorage.getItem('token')
      const today = new Date().toISOString().slice(0, 10)
      
      // Get all attendances for today
      const res = await axios.get('http://localhost:4000/api/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Filter for today's attendance and create a map
      const todayAttendances = res.data.filter(a => a.date === today)
      const statusMap = {}
      
      todayAttendances.forEach(att => {
        statusMap[att.userId] = {
          status: att.status,
          checkInStatus: att.checkInStatus,
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          breakTaken: att.breakTaken,
          breakLate: att.breakLate,
          earlyLeave: att.earlyLeave
        }
      })
      
      setTodayAttendanceStatus(statusMap)
    } catch (err) {
      console.error('Error loading today attendance status:', err)
    }
    setLoadingTodayStatus(false)
  }

  async function loadHolidaySettings() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/user-holiday-settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHolidaySettings(res.data || [])
    } catch (err) {
      console.error('Error loading holiday settings:', err)
    }
  }

  function getDayName(dayNum) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[dayNum] || ''
  }

  async function saveHolidaySetting(userId) {
    if (!holidayForm.day1) {
      alert('Hari libur pertama wajib diisi')
      return
    }
    
    setSavingHoliday(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://localhost:4000/api/user-holiday-settings/user/${userId}`, {
        day1: parseInt(holidayForm.day1),
        day2: holidayForm.day2 ? parseInt(holidayForm.day2) : null,
        isActive: holidayForm.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert('Pengaturan hari libur berhasil disimpan')
      setEditingHolidayUserId(null)
      setHolidayForm({ day1: '', day2: '', isActive: true })
      await loadHolidaySettings()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan hari libur')
      console.error(err)
    }
    setSavingHoliday(false)
  }

  async function deleteHolidaySetting(userId) {
    if (!confirm('Apakah Anda yakin ingin menghapus pengaturan hari libur untuk user ini?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:4000/api/user-holiday-settings/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Pengaturan hari libur berhasil dihapus')
      await loadHolidaySettings()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pengaturan hari libur')
      console.error(err)
    }
  }

  function startEditHoliday(setting) {
    setEditingHolidayUserId(setting.userId)
    setHolidayForm({
      day1: setting.day1?.toString() || '',
      day2: setting.day2 !== null ? setting.day2?.toString() : '',
      isActive: setting.isActive !== false
    })
  }

  function startAddHoliday(userId) {
    setEditingHolidayUserId(userId)
    setHolidayForm({ day1: '', day2: '', isActive: true })
  }

  async function bulkAssignTimeSettings() {
    if (selectedUsersForTime.length === 0) {
      alert('Pilih minimal 1 user untuk di-assign pengaturan waktu')
      return
    }

    setBulkAssigningTime(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('http://localhost:4000/api/user-time-settings/bulk-assign', {
        userIds: selectedUsersForTime,
        checkInTime: settings.checkInTime,
        checkOutTime: settings.checkOutTime,
        breakStartTime: settings.breakStartTime,
        breakEndTime: settings.breakEndTime,
        checkInTolerance: settings.checkInTolerance,
        breakDuration: settings.breakDuration,
        isActive: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert(`Pengaturan waktu berhasil di-assign ke ${res.data.success.length} user`)
      setSelectedUsersForTime([])
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal assign pengaturan waktu')
      console.error(err)
    }
    setBulkAssigningTime(false)
  }

  async function bulkAssignHolidaySettings() {
    if (selectedUsersForHoliday.length === 0) {
      alert('Pilih minimal 1 user untuk di-assign pengaturan hari libur')
      return
    }

    if (!holidayForm.day1) {
      alert('Hari libur pertama wajib diisi')
      return
    }

    setBulkAssigningHoliday(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('http://localhost:4000/api/user-holiday-settings/bulk-assign', {
        userIds: selectedUsersForHoliday,
        day1: parseInt(holidayForm.day1),
        day2: holidayForm.day2 ? parseInt(holidayForm.day2) : null,
        isActive: holidayForm.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert(`Pengaturan hari libur berhasil di-assign ke ${res.data.success.length} user`)
      setSelectedUsersForHoliday([])
      setHolidayForm({ day1: '', day2: '', isActive: true })
      await loadHolidaySettings()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal assign pengaturan hari libur')
      console.error(err)
    }
    setBulkAssigningHoliday(false)
  }

  function toggleUserSelectionForTime(userId) {
    setSelectedUsersForTime(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  function toggleUserSelectionForHoliday(userId) {
    setSelectedUsersForHoliday(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  async function loadSettings() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const settingsData = {}
      res.data.forEach(s => {
        settingsData[s.key] = s.value
      })
      setSettings({
        checkInTime: settingsData.checkInTime || '08:00',
        checkOutTime: settingsData.checkOutTime || '17:00',
        breakStartTime: settingsData.breakStartTime || '12:00',
        breakEndTime: settingsData.breakEndTime || '13:00',
        checkInTolerance: parseInt(settingsData.checkInTolerance) || 15,
        breakDuration: parseInt(settingsData.breakDuration) || 60
      })
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const settingsToSave = [
        { key: 'checkInTime', value: settings.checkInTime },
        { key: 'checkOutTime', value: settings.checkOutTime },
        { key: 'breakStartTime', value: settings.breakStartTime },
        { key: 'breakEndTime', value: settings.breakEndTime },
        { key: 'checkInTolerance', value: String(settings.checkInTolerance) },
        { key: 'breakDuration', value: String(settings.breakDuration) }
      ]
      
      for (const setting of settingsToSave) {
        await axios.post('http://localhost:4000/api/settings', setting, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      
      alert('Pengaturan berhasil disimpan')
      setShowSettings(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan')
      console.error(err)
    }
    setSavingSettings(false)
  }

  async function loadUsers() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      let data = res.data.reverse()
      
      // Apply filters
      if (filter.date) {
        data = data.filter(a => a.date === filter.date)
      }
      if (filter.userId) {
        data = data.filter(a => a.userId === parseInt(filter.userId))
      }
      
      setList(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filter])

  async function loadPendingRequests() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendance-status-requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filter hanya yang status Pending
      const pending = (res.data || []).filter(r => r.status === 'Pending')
      setPendingRequests(pending)
    } catch (err) {
      console.error('Error loading pending requests:', err)
    }
  }

  function openRequestModal(request) {
    setSelectedRequest(request)
    setAdminNote('')
    setShowRequestModal(true)
  }

  async function processRequest(status, requestToProcess = null) {
    const request = requestToProcess || selectedRequest
    if (!request) return
    
    setProcessingRequest(true)
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `http://localhost:4000/api/attendance-status-requests/${request.id}`,
        {
          status: status,
          adminNote: adminNote || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      alert(`Request berhasil ${status === 'Approved' ? 'disetujui' : 'ditolak'}`)
      setShowRequestModal(false)
      setSelectedRequest(null)
      setAdminNote('')
      // Reload pending requests (akan otomatis filter yang pending saja)
      await loadPendingRequests()
      // Reload attendance list untuk update status
      await load()
      // Trigger notification refresh in Layout component
      window.dispatchEvent(new Event('refreshNotifications'))
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal memproses request')
    } finally {
      setProcessingRequest(false)
    }
  }

  function getStatusLabel(status) {
    const map = {
      'late': '✗ Late',
      'almostLate': '⚠ Almost Late',
      'early': '⏰ Come Early',
      'onTime': '✓ On Time',
      'breakLate': '⏰ Break Late',
      'earlyLeave': '🏃 Early Leave',
      'general': 'Hadir'
    }
    return map[status] || status
  }

  function getRequestedStatusLabel(status) {
    const map = {
      'onTime': '✓ On Time',
      'almostLate': '⚠ Almost Late',
      'early': '⏰ Come Early',
      'normal': 'Normal',
      'onTimeCheckout': 'On Time Checkout'
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Master <span className="gradient-text">Absensi</span> 📋
          </h1>
          <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lihat dan kelola data absensi semua user</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </button>
          <button
            onClick={() => {
              setShowSettings(!showSettings)
              if (!showSettings) {
                setSettingsTab('time')
              }
            }}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pengaturan Waktu
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`card-strong mb-6 border transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pengaturan Waktu Absensi</h2>
          
          {/* Settings Tabs */}
          <div className={`flex border-b mb-6 transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setSettingsTab('time')}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                settingsTab === 'time'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-indigo-600'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pengaturan Waktu
              {settingsTab === 'time' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              )}
            </button>
            <button
              onClick={() => {
                setSettingsTab('holiday')
                loadHolidaySettings()
              }}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                settingsTab === 'holiday'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-indigo-600'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pengaturan Hari Libur
              {settingsTab === 'holiday' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              )}
            </button>
          </div>

          {/* Time Settings Tab */}
          {settingsTab === 'time' && (
          <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Check In *</label>
              <input
                type="time"
                value={settings.checkInTime}
                onChange={e => setSettings({ ...settings, checkInTime: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Check Out *</label>
              <input
                type="time"
                value={settings.checkOutTime}
                onChange={e => setSettings({ ...settings, checkOutTime: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Mulai Istirahat *</label>
              <input
                type="time"
                value={settings.breakStartTime}
                onChange={e => setSettings({ ...settings, breakStartTime: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Waktu Selesai Istirahat *</label>
              <input
                type="time"
                value={settings.breakEndTime}
                onChange={e => setSettings({ ...settings, breakEndTime: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Toleransi Check In (menit) *</label>
              <input
                type="number"
                min="0"
                value={settings.checkInTolerance}
                onChange={e => setSettings({ ...settings, checkInTolerance: parseInt(e.target.value) || 0 })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="15"
              />
              <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Jika check in tepat waktu = On Time<br/>
                Jika melewati waktu tapi belum melebihi toleransi = Almost Late<br/>
                Jika melewati toleransi = Late
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Durasi Istirahat (menit) *</label>
              <input
                type="number"
                min="0"
                value={settings.breakDuration}
                onChange={e => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 0 })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="60"
              />
              <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Jika selesai istirahat melewati durasi yang ditentukan = Break Late
              </p>
            </div>
          </div>

          {/* User Selection for Time Settings */}
          <div className={`mt-6 p-4 rounded-lg border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Pilih Karyawan untuk Assign Pengaturan Waktu
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedUsersForTime(users.map(u => u.id))}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pilih Semua
                </button>
                <button
                  onClick={() => setSelectedUsersForTime([])}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Batal Pilih
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {users.map(user => (
                <label key={user.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-opacity-50 transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-600' 
                    : 'hover:bg-gray-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedUsersForTime.includes(user.id)}
                    onChange={() => toggleUserSelectionForTime(user.id)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </div>
                    <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{user.username} • {user.department || 'Tidak ada departemen'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {selectedUsersForTime.length > 0 && (
              <div className={`mt-4 pt-4 border-t transition-colors ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <p className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedUsersForTime.length} user terpilih
                </p>
              </div>
            )}
          </div>

          {settingsTab === 'time' && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setShowSettings(false)
                  setSelectedUsersForTime([])
                  loadSettings() // Reset to saved values
                }}
                className={`px-6 py-3 rounded-lg hover:opacity-80 transition-colors font-medium ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Batal
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={bulkAssignTimeSettings}
                  disabled={bulkAssigningTime || selectedUsersForTime.length === 0}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkAssigningTime ? 'Mengassign...' : `Assign ke ${selectedUsersForTime.length} User`}
                </button>
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Global'}
                </button>
              </div>
            </div>
          )}
          </div>
          )}

          {/* Holiday Settings Tab */}
          {settingsTab === 'holiday' && (
          <div>
            <p className={`text-sm mb-4 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola hari libur untuk setiap user. Setiap user dapat memiliki 1 atau 2 hari libur per minggu.
            </p>

            {/* Bulk Assign Form for Holiday */}
            <div className={`mb-6 p-4 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Bulk Assign Hari Libur
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hari Libur Pertama <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={holidayForm.day1}
                    onChange={e => setHolidayForm({ ...holidayForm, day1: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Pilih hari...</option>
                    <option value="0">Minggu</option>
                    <option value="1">Senin</option>
                    <option value="2">Selasa</option>
                    <option value="3">Rabu</option>
                    <option value="4">Kamis</option>
                    <option value="5">Jumat</option>
                    <option value="6">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hari Libur Kedua <span className="text-xs text-gray-500">(Opsional)</span>
                  </label>
                  <select
                    value={holidayForm.day2}
                    onChange={e => setHolidayForm({ ...holidayForm, day2: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Tidak ada (hanya 1 hari libur)</option>
                    <option value="0">Minggu</option>
                    <option value="1">Senin</option>
                    <option value="2">Selasa</option>
                    <option value="3">Rabu</option>
                    <option value="4">Kamis</option>
                    <option value="5">Jumat</option>
                    <option value="6">Sabtu</option>
                  </select>
                </div>
              </div>

              {/* User Selection for Holiday Settings */}
              <div className={`mb-4 p-3 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-600 border-gray-500' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Pilih Karyawan
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUsersForHoliday(users.map(u => u.id))}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-500' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setSelectedUsersForHoliday([])}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-500' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {users.map(user => (
                    <label key={user.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-opacity-50 transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-500' 
                        : 'hover:bg-gray-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedUsersForHoliday.includes(user.id)}
                        onChange={() => toggleUserSelectionForHoliday(user.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {user.name} (@{user.username})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={bulkAssignHolidaySettings}
                  disabled={bulkAssigningHoliday || selectedUsersForHoliday.length === 0 || !holidayForm.day1}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkAssigningHoliday ? 'Mengassign...' : `Assign ke ${selectedUsersForHoliday.length} User`}
                </button>
              </div>
            </div>
          
          <div className="space-y-4">
            {users.map(user => {
              const existingSetting = holidaySettings.find(s => s.userId === user.id)
              const isEditing = editingHolidayUserId === user.id
              
              return (
                <div 
                  key={user.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {user.name}
                      </h3>
                      <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        @{user.username} • {user.department || 'Tidak ada departemen'}
                      </p>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        {existingSetting ? (
                          <>
                            <span className={`text-sm px-3 py-1 rounded-full ${
                              existingSetting.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {existingSetting.isActive ? '✓ Aktif' : '✗ Nonaktif'}
                            </span>
                            <button
                              onClick={() => startEditHoliday(existingSetting)}
                              className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteHolidaySetting(user.id)}
                              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startAddHoliday(user.id)}
                            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && existingSetting && (
                    <div className={`text-sm p-3 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-200' 
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Hari Libur:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {getDayName(existingSetting.day1)}
                        </span>
                        {existingSetting.day2 !== null && existingSetting.day2 !== undefined && (
                          <>
                            <span className="text-gray-400">,</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {getDayName(existingSetting.day2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-4 space-y-4 p-4 border rounded-lg" style={{ borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}>
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Hari Libur Pertama <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={holidayForm.day1}
                          onChange={e => setHolidayForm({ ...holidayForm, day1: e.target.value })}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            theme === 'dark' 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Pilih hari...</option>
                          <option value="0">Minggu</option>
                          <option value="1">Senin</option>
                          <option value="2">Selasa</option>
                          <option value="3">Rabu</option>
                          <option value="4">Kamis</option>
                          <option value="5">Jumat</option>
                          <option value="6">Sabtu</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Hari Libur Kedua <span className="text-xs text-gray-500">(Opsional)</span>
                        </label>
                        <select
                          value={holidayForm.day2}
                          onChange={e => setHolidayForm({ ...holidayForm, day2: e.target.value })}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            theme === 'dark' 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Tidak ada (hanya 1 hari libur)</option>
                          <option value="0">Minggu</option>
                          <option value="1">Senin</option>
                          <option value="2">Selasa</option>
                          <option value="3">Rabu</option>
                          <option value="4">Kamis</option>
                          <option value="5">Jumat</option>
                          <option value="6">Sabtu</option>
                        </select>
                        <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Kosongkan jika user hanya memiliki 1 hari libur per minggu
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`isActive-${user.id}`}
                          checked={holidayForm.isActive}
                          onChange={e => setHolidayForm({ ...holidayForm, isActive: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label 
                          htmlFor={`isActive-${user.id}`}
                          className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Aktifkan pengaturan hari libur ini
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingHolidayUserId(null)
                            setHolidayForm({ day1: '', day2: '', isActive: true })
                          }}
                          className={`px-4 py-2 text-sm rounded-lg hover:opacity-80 transition-colors font-medium ${
                            theme === 'dark' 
                              ? 'text-gray-300 bg-gray-600 hover:bg-gray-500' 
                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => saveHolidaySetting(user.id)}
                          disabled={savingHoliday || !holidayForm.day1}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingHoliday ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {settingsTab === 'holiday' && (
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => {
                  setShowSettings(false)
                  setEditingHolidayUserId(null)
                  setSelectedUsersForHoliday([])
                  setHolidayForm({ day1: '', day2: '', isActive: true })
                }}
                className={`px-6 py-3 rounded-lg hover:opacity-80 transition-colors font-medium ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Tutup
              </button>
            </div>
          )}
          </div>
          )}
        </div>
      )}

      {/* Filter - hanya muncul di tab LOG */}
      {activeTab === 'log' && (
      <div className={`card-strong mb-6 transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Filter Tanggal</label>
            <input
              type="date"
              value={filter.date}
              onChange={e => setFilter({ ...filter, date: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Filter User</label>
            <select
              value={filter.userId}
              onChange={e => setFilter({ ...filter, userId: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Semua User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setFilter({ date: '', userId: '' })}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Reset Filter
          </button>
        </div>
      </div>
      )}

      {/* Tabs */}
      <div className={`card-strong mb-6 transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`flex border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => {
              setActiveTab('absen')
              loadTodayAttendanceStatus()
            }}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'absen'
                ? theme === 'dark'
                  ? 'text-white'
                  : 'text-indigo-600'
                : theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Absen
            {activeTab === 'absen' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'log'
                ? theme === 'dark'
                  ? 'text-white'
                  : 'text-indigo-600'
                : theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            LOG
            {activeTab === 'log' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'requests'
                ? theme === 'dark'
                  ? 'text-white'
                  : 'text-indigo-600'
                : theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Request Perubahan
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {pendingRequests.length}
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content: Absen (Today's Attendance) */}
      {activeTab === 'absen' && (
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Status Kehadiran Hari Ini
              </h2>
              <p className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={loadTodayAttendanceStatus}
              disabled={loadingTodayStatus}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className={`w-5 h-5 ${loadingTodayStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loadingTodayStatus ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => {
                const attendance = todayAttendanceStatus[user.id]
                const hasCheckedIn = attendance?.checkIn
                const status = attendance?.status || 'Belum Absen'
                const checkInStatus = attendance?.checkInStatus
                const checkInTime = attendance?.checkIn
                const checkOutTime = attendance?.checkOut

                return (
                  <div
                    key={user.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Picture */}
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture.startsWith('data:') 
                            ? user.profilePicture 
                            : `http://localhost:4000${user.profilePicture}`}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={`font-semibold truncate transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {user.name}
                            </h3>
                            <p className={`text-xs truncate transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              @{user.username}
                            </p>
                            {user.department && (
                              <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                {user.department}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {hasCheckedIn ? (
                            <>
                              {checkInStatus === 'early' && (
                                <span className="status-chip bg-blue-100 text-blue-800 border-2 border-blue-400">
                                  ⏰ Come Early
                                </span>
                              )}
                              {checkInStatus === 'onTime' && (
                                <span className="status-chip bg-green-100 text-green-800 border-2 border-green-400">
                                  ✓ On Time
                                </span>
                              )}
                              {checkInStatus === 'almostLate' && (
                                <span className="status-chip bg-yellow-100 text-yellow-800 border-2 border-yellow-400">
                                  ⚠ Almost Late
                                </span>
                              )}
                              {checkInStatus === 'late' && (
                                <span className="status-chip bg-red-100 text-red-800 border-2 border-red-400">
                                  ✗ Late
                                </span>
                              )}
                              {attendance?.breakLate && (
                                <span className="status-chip bg-orange-100 text-orange-800 border border-orange-300">
                                  ⏰ Break Late
                                </span>
                              )}
                              {attendance?.earlyLeave && (
                                <span className="status-chip bg-blue-100 text-blue-800 border border-blue-300">
                                  🏃 Early Leave
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {status === 'Izin' && (
                                <span className="status-chip status-warning">Izin</span>
                              )}
                              {status === 'Sakit' && (
                                <span className="status-chip status-danger">Sakit</span>
                              )}
                              {status === 'Alfa' && (
                                <span className="status-chip status-default">Alfa</span>
                              )}
                              {(status === 'Hadir' || status === 'Belum Absen' || !status) && (
                                <span className="status-chip status-default">Belum Absen</span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Time Info */}
                        {hasCheckedIn && (
                          <div className={`mt-3 text-xs space-y-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Check In: {checkInTime || '-'}</span>
                            </div>
                            {checkOutTime && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Check Out: {checkOutTime}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Request Perubahan */}
      {activeTab === 'requests' && (
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Request Perubahan Status Absensi
            </h2>
            <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {pendingRequests.length} request pending
            </div>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Tidak ada request perubahan status absensi yang pending
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div 
                  key={request.id} 
                  className={`card transition-colors cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 hover:border-purple-500' 
                      : 'bg-white border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => openRequestModal(request)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {request.User?.name || `User ID: ${request.userId}`}
                        </div>
                        <span className="status-chip bg-yellow-100 text-yellow-800 border-2 border-yellow-400">Pending</span>
                      </div>
                      <div className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Tanggal Absensi: {request.Attendance?.date ? new Date(request.Attendance.date).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : '-'}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200">
                          {getStatusLabel(request.currentStatus)}
                        </span>
                        <span className={`text-gray-400 transition-colors ${theme === 'dark' ? 'text-gray-500' : ''}`}>→</span>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
                          {getRequestedStatusLabel(request.requestedStatus)}
                        </span>
                      </div>
                      <div className={`text-sm rounded-lg p-2 border transition-colors mb-3 ${
                        theme === 'dark' 
                          ? 'text-gray-300 bg-gray-600 border-gray-500' 
                          : 'text-gray-600 bg-gray-50 border-gray-200'
                      }`}>
                        <span className="font-medium">Alasan:</span> {request.description}
                      </div>
                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openRequestModal(request)
                          }}
                          className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm"
                        >
                          Lihat Detail
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm('Apakah Anda yakin ingin menyetujui request ini?')) {
                              setAdminNote('')
                              await processRequest('Approved', request)
                            }
                          }}
                          disabled={processingRequest}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequest ? '...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm('Apakah Anda yakin ingin menolak request ini?')) {
                              setAdminNote('')
                              await processRequest('Rejected', request)
                            }
                          }}
                          disabled={processingRequest}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequest ? '...' : '✗ Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: LOG */}
      {activeTab === 'log' && (
      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Data Absensi</h2>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{list.length} catatan</div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.length === 0 && (
              <div className="text-center py-12">
                <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada data absensi</p>
              </div>
            )}
            {list.map((a) => (
              <div 
                key={a.id} 
                className={`card transition-colors cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 hover:border-purple-500' 
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => {
                  setSelectedAttendance(a)
                  setShowDetailModal(true)
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{a.date}</div>
                      {/* Status Izin/Sakit/Alfa - tampilkan jika bukan Hadir */}
                      {a.status === 'Izin' && (
                        <span className="status-chip status-warning">
                          Izin
                        </span>
                      )}
                      {a.status === 'Sakit' && (
                        <span className="status-chip status-danger">
                          Sakit
                        </span>
                      )}
                      {a.status === 'Alfa' && (
                        <span className="status-chip status-default">
                          Alfa
                        </span>
                      )}
                      {/* Status Check In - tampilkan sebagai status utama jika Hadir */}
                      {a.status === 'Hadir' && a.checkIn && a.checkInStatus && (
                        <span
                          className={`status-chip font-semibold ${
                            a.checkInStatus === 'early'
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                              : a.checkInStatus === 'onTime'
                              ? 'bg-green-100 text-green-800 border-2 border-green-400'
                              : a.checkInStatus === 'almostLate'
                              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                              : 'bg-red-100 text-red-800 border-2 border-red-400'
                          }`}
                        >
                          {a.checkInStatus === 'early' ? '⏰ Come Early' : a.checkInStatus === 'onTime' ? '✓ On Time' : a.checkInStatus === 'almostLate' ? '⚠ Almost Late' : '✗ Late'}
                        </span>
                      )}
                      {/* Jika Hadir tapi belum ada checkInStatus, tampilkan Hadir */}
                      {a.status === 'Hadir' && a.checkIn && !a.checkInStatus && (
                        <span className="status-chip status-success">
                          Hadir
                        </span>
                      )}
                      {/* Status Break Late */}
                      {a.breakLate && (
                        <span className="status-chip bg-orange-100 text-orange-800 border border-orange-300 font-medium">
                          ⏰ Break Late
                        </span>
                      )}
                      {/* Status Early Leave */}
                      {a.earlyLeave && (
                        <span className="status-chip bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                          🏃 Early Leave
                        </span>
                      )}
                      {/* Jika tidak ada status apapun */}
                      {!a.checkIn && a.status !== 'Izin' && a.status !== 'Sakit' && a.status !== 'Alfa' && (
                        <span className="status-chip status-default">
                          Belum Absen
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className={`font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {a.User ? a.User.name : `User ID: ${a.userId}`}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          CheckIn: {a.checkIn || '-'}
                        </span>
                        {(a.breakStart || a.breakEnd) && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Break: {a.breakStart || '-'} - {a.breakEnd || '-'}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          CheckOut: {a.checkOut || '-'}
                        </span>
                      </div>
                    </div>
                    {a.note && (
                      <div className={`text-sm rounded-lg p-2 border transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-300 bg-gray-700 border-gray-600' 
                          : 'text-gray-600 bg-gray-50 border-gray-200'
                      }`}>
                        {a.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAttendance && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`} onClick={() => setShowDetailModal(false)}>
          <div className={`rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Detail Absensi</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* User Info */}
              <div className={`flex items-center gap-4 mb-6 pb-6 border-b transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                {selectedAttendance.User?.profilePicture ? (
                  <img
                    src={selectedAttendance.User.profilePicture.startsWith('data:') 
                      ? selectedAttendance.User.profilePicture 
                      : `http://localhost:4000${selectedAttendance.User.profilePicture}`}
                    alt={selectedAttendance.User.name}
                    className={`w-16 h-16 rounded-full object-cover border-2 transition-colors ${
                      theme === 'dark' ? 'border-purple-500' : 'border-indigo-200'
                    }`}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {selectedAttendance.User?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedAttendance.User?.name || `User ID: ${selectedAttendance.userId}`}</h3>
                  <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>@{selectedAttendance.User?.username || 'N/A'}</p>
                  <p className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Tanggal: {selectedAttendance.date}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedAttendance.status === 'Izin' && (
                  <span className="status-chip status-warning">Izin</span>
                )}
                {selectedAttendance.status === 'Sakit' && (
                  <span className="status-chip status-danger">Sakit</span>
                )}
                {selectedAttendance.status === 'Alfa' && (
                  <span className="status-chip status-default">Alfa</span>
                )}
                {selectedAttendance.status === 'Hadir' && selectedAttendance.checkIn && selectedAttendance.checkInStatus && (
                  <span
                    className={`status-chip font-semibold ${
                      selectedAttendance.checkInStatus === 'early'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                        : selectedAttendance.checkInStatus === 'onTime'
                        ? 'bg-green-100 text-green-800 border-2 border-green-400'
                        : selectedAttendance.checkInStatus === 'almostLate'
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                        : 'bg-red-100 text-red-800 border-2 border-red-400'
                    }`}
                  >
                    {selectedAttendance.checkInStatus === 'early' ? '⏰ Come Early' : selectedAttendance.checkInStatus === 'onTime' ? '✓ On Time' : selectedAttendance.checkInStatus === 'almostLate' ? '⚠ Almost Late' : '✗ Late'}
                  </span>
                )}
                {selectedAttendance.status === 'Hadir' && selectedAttendance.checkIn && !selectedAttendance.checkInStatus && (
                  <span className="status-chip status-success">Hadir</span>
                )}
                {selectedAttendance.breakLate && (
                  <span className="status-chip bg-orange-100 text-orange-800 border border-orange-300 font-medium">
                    ⏰ Break Late
                  </span>
                )}
                {selectedAttendance.earlyLeave && (
                  <span className="status-chip bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                    🏃 Early Leave
                  </span>
                )}
                {!selectedAttendance.checkIn && selectedAttendance.status !== 'Izin' && selectedAttendance.status !== 'Sakit' && selectedAttendance.status !== 'Alfa' && (
                  <span className="status-chip status-default">Belum Absen</span>
                )}
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`rounded-lg p-4 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Check In</div>
                  <div className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAttendance.checkIn || '-'}
                  </div>
                </div>
                {(selectedAttendance.breakStart || selectedAttendance.breakEnd) && (
                  <div className={`rounded-lg p-4 border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Break</div>
                    <div className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedAttendance.breakStart || '-'} - {selectedAttendance.breakEnd || '-'}
                    </div>
                  </div>
                )}
                <div className={`rounded-lg p-4 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Check Out</div>
                  <div className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAttendance.checkOut || '-'}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedAttendance.checkInPhotoPath ? (
                  <div>
                    <div className={`text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto Check In</div>
                    <div className="relative">
                      <img
                        src={`http://localhost:4000${selectedAttendance.checkInPhotoPath}`}
                        alt="Check In Photo"
                        className={`w-full rounded-lg border shadow-sm object-cover transition-colors ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        }`}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const errorDiv = e.target.parentElement.querySelector('.error-message')
                          if (errorDiv) errorDiv.style.display = 'block'
                        }}
                      />
                      <div className={`error-message hidden text-sm text-center py-4 rounded-lg border transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-400 bg-gray-700 border-gray-600' 
                          : 'text-gray-500 bg-gray-50 border-gray-200'
                      }`}>
                        Foto tidak tersedia
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={`text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto Check In</div>
                    <div className={`text-sm text-center py-8 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-400 bg-gray-700 border-gray-600' 
                        : 'text-gray-500 bg-gray-50 border-gray-200'
                    }`}>
                      Tidak ada foto
                    </div>
                  </div>
                )}
                {selectedAttendance.checkOutPhotoPath ? (
                  <div>
                    <div className={`text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto Check Out</div>
                    <div className="relative">
                      <img
                        src={`http://localhost:4000${selectedAttendance.checkOutPhotoPath}`}
                        alt="Check Out Photo"
                        className={`w-full rounded-lg border shadow-sm object-cover transition-colors ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        }`}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const errorDiv = e.target.parentElement.querySelector('.error-message')
                          if (errorDiv) errorDiv.style.display = 'block'
                        }}
                      />
                      <div className={`error-message hidden text-sm text-center py-4 rounded-lg border transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-400 bg-gray-700 border-gray-600' 
                          : 'text-gray-500 bg-gray-50 border-gray-200'
                      }`}>
                        Foto tidak tersedia
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={`text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto Check Out</div>
                    <div className={`text-sm text-center py-8 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-400 bg-gray-700 border-gray-600' 
                        : 'text-gray-500 bg-gray-50 border-gray-200'
                    }`}>
                      Tidak ada foto
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Requests for this attendance */}
              {pendingRequests.filter(r => r.attendanceId === selectedAttendance.id && r.status === 'Pending').length > 0 && (
                <div className={`rounded-lg p-4 border transition-colors mb-6 ${
                  theme === 'dark' 
                    ? 'bg-yellow-900/20 border-yellow-700' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className={`text-sm font-medium mb-3 transition-colors ${
                    theme === 'dark' ? 'text-yellow-300' : 'text-yellow-900'
                  }`}>Request Perubahan Status</div>
                  {pendingRequests
                    .filter(r => r.attendanceId === selectedAttendance.id && r.status === 'Pending')
                    .map(request => (
                      <div key={request.id} className={`mb-3 p-3 rounded-lg border transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            theme === 'dark' 
                              ? 'bg-red-900/50 text-red-300' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {getStatusLabel(request.currentStatus)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            theme === 'dark' 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {getRequestedStatusLabel(request.requestedStatus)}
                          </span>
                        </div>
                        <div className={`text-sm mb-3 transition-colors ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {request.description}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openRequestModal(request)}
                            className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRequestModal(request)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Note */}
              {selectedAttendance.note && (
                <div className={`rounded-lg p-4 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-900/30 border-blue-700' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-sm font-medium mb-1 transition-colors ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                  }`}>Catatan</div>
                  <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>{selectedAttendance.note}</div>
                </div>
              )}
            </div>

            <div className={`sticky bottom-0 border-t px-6 py-4 flex justify-end transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Action Modal */}
      {showRequestModal && selectedRequest && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`} onClick={() => {
          setShowRequestModal(false)
          setSelectedRequest(null)
          setAdminNote('')
        }}>
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div>
                <h2 className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedRequest.status === 'Pending' ? 'Proses Request Perubahan Status' : 'Detail Request'}
                </h2>
                <p className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedRequest.status === 'Pending' ? 'Tinjau dan proses request perubahan status absensi' : 'Detail request yang sudah diproses'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setSelectedRequest(null)
                  setAdminNote('')
                }}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* User Info Card */}
              <div className={`rounded-lg p-4 mb-6 border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
              }`}>
                <div className="flex items-center gap-4">
                  {selectedRequest.User?.profilePicture ? (
                    <img
                      src={selectedRequest.User.profilePicture.startsWith('data:') 
                        ? selectedRequest.User.profilePicture 
                        : `http://localhost:4000${selectedRequest.User.profilePicture}`}
                      alt={selectedRequest.User.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                      {selectedRequest.User?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedRequest.User?.name || `User ID: ${selectedRequest.userId}`}
                    </h3>
                    <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{selectedRequest.User?.username || 'N/A'}
                    </p>
                    {selectedRequest.User?.department && (
                      <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {selectedRequest.User.department}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Change Display */}
              <div className={`rounded-lg p-6 mb-6 border-2 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700/30 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Perubahan Status
                </h3>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {/* Current Status */}
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Status Saat Ini
                    </span>
                    <div className={`px-4 py-3 rounded-lg border-2 font-semibold ${
                      selectedRequest.currentStatus === 'late' || selectedRequest.currentStatus === 'breakLate' || selectedRequest.currentStatus === 'earlyLeave'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : selectedRequest.currentStatus === 'almostLate'
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                        : 'bg-gray-50 text-gray-800 border-gray-300'
                    }`}>
                      {getStatusLabel(selectedRequest.currentStatus)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>

                  {/* Requested Status */}
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Status yang Diminta
                    </span>
                    <div className="px-4 py-3 rounded-lg border-2 font-semibold bg-green-50 text-green-800 border-green-300">
                      {getRequestedStatusLabel(selectedRequest.requestedStatus)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`rounded-lg p-4 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className={`block text-xs font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tanggal Absensi
                  </label>
                  <div className={`text-base font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedRequest.Attendance?.date ? new Date(selectedRequest.Attendance.date).toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : '-'}
                  </div>
                </div>

                <div className={`rounded-lg p-4 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className={`block text-xs font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status Request
                  </label>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedRequest.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                        : selectedRequest.status === 'Approved'
                        ? 'bg-green-100 text-green-800 border-2 border-green-400'
                        : 'bg-red-100 text-red-800 border-2 border-red-400'
                    }`}>
                      {selectedRequest.status === 'Pending' ? '⏳ Pending' : selectedRequest.status === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={`rounded-lg p-4 mb-6 border transition-colors ${
                theme === 'dark' 
                  ? 'bg-blue-900/20 border-blue-700' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <label className={`block text-sm font-semibold mb-2 transition-colors ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  Alasan / Deskripsi
                </label>
                <p className={`text-sm leading-relaxed transition-colors ${
                  theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                }`}>
                  {selectedRequest.description || 'Tidak ada deskripsi'}
                </p>
              </div>

              {/* Admin Note (if exists) */}
              {selectedRequest.adminNote && (
                <div className={`rounded-lg p-4 mb-6 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-purple-900/20 border-purple-700' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <label className={`block text-sm font-semibold mb-2 transition-colors ${
                    theme === 'dark' ? 'text-purple-300' : 'text-purple-900'
                  }`}>
                    Catatan Admin
                  </label>
                  <p className={`text-sm leading-relaxed transition-colors ${
                    theme === 'dark' ? 'text-purple-200' : 'text-purple-800'
                  }`}>
                    {selectedRequest.adminNote}
                  </p>
                </div>
              )}

              {/* Admin Note Input (for pending requests) */}
              {selectedRequest.status === 'Pending' && (
                <div className={`rounded-lg p-4 mb-6 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className={`block text-sm font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catatan Admin <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={4}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="Tambahkan catatan untuk user (opsional)..."
                  />
                  <p className={`text-xs mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Catatan ini akan dikirim ke user setelah request diproses
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedRequest.status === 'Pending' && (
              <div className={`sticky bottom-0 border-t px-6 py-4 flex items-center justify-end gap-3 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false)
                    setSelectedRequest(null)
                    setAdminNote('')
                  }}
                  className={`px-6 py-2.5 rounded-lg hover:opacity-80 transition-colors font-medium ${
                    theme === 'dark' 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={() => processRequest('Rejected')}
                  disabled={processingRequest}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {processingRequest ? 'Memproses...' : 'Tolak Request'}
                </button>
                <button
                  onClick={() => processRequest('Approved')}
                  disabled={processingRequest}
                  className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {processingRequest ? 'Memproses...' : 'Setujui Request'}
                </button>
              </div>
            )}

            {/* Close button for non-pending requests */}
            {selectedRequest.status !== 'Pending' && (
              <div className={`sticky bottom-0 border-t px-6 py-4 flex items-center justify-end transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setShowRequestModal(false)
                    setSelectedRequest(null)
                    setAdminNote('')
                  }}
                  className="px-6 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Export Excel</h2>
              <button 
                onClick={() => setShowExportModal(false)} 
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={exportDateRange.startDate}
                  onChange={e => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Akhir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={exportDateRange.endDate}
                  onChange={e => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className={`border rounded-lg p-3 transition-colors ${
                theme === 'dark' 
                  ? 'bg-blue-900/30 border-blue-700' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                  <strong>Catatan:</strong> File Excel akan berisi 2 sheet:
                  <br />• Sheet 1: Data Absensi (check in, check out, break, status, dll)
                  <br />• Sheet 2: Data Laporan Harian (konten laporan, file, dll)
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowExportModal(false)} 
                className={`px-6 py-3 rounded-lg hover:opacity-80 transition-colors font-medium ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  if (!exportDateRange.startDate || !exportDateRange.endDate) {
                    alert('Tanggal mulai dan tanggal akhir wajib diisi')
                    return
                  }

                  if (new Date(exportDateRange.startDate) > new Date(exportDateRange.endDate)) {
                    alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir')
                    return
                  }

                  setExporting(true)
                  try {
                    const token = localStorage.getItem('token')
                    const response = await axios.get('http://localhost:4000/api/reports/export-excel', {
                      params: {
                        startDate: exportDateRange.startDate,
                        endDate: exportDateRange.endDate
                      },
                      headers: { Authorization: `Bearer ${token}` },
                      responseType: 'blob'
                    })

                    // Create download link
                    const url = window.URL.createObjectURL(new Blob([response.data]))
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', `export_absensi_laporan_${exportDateRange.startDate}_${exportDateRange.endDate}.xlsx`)
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    window.URL.revokeObjectURL(url)

                    setShowExportModal(false)
                    alert('Export berhasil! File sedang didownload.')
                  } catch (err) {
                    console.error('Export error:', err)
                    alert(err.response?.data?.message || 'Gagal export Excel')
                  } finally {
                    setExporting(false)
                  }
                }}
                disabled={exporting}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export & Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

