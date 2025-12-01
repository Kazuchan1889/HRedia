import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function AdminDailyReport() {
  const { theme } = useTheme()
  const [reports, setReports] = useState([])
  const [editRequests, setEditRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    reportStartTime: '08:00',
    reportEndTime: '18:00',
    reportFrequency: 'daily' // 'daily' or 'weekly'
  })
  const [filter, setFilter] = useState({ userId: '', date: '' })
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userReports, setUserReports] = useState([])
  const [userReportStatus, setUserReportStatus] = useState({}) // { userId: { hasReport: boolean, reportCount: number } }

  useEffect(() => {
    load()
    loadUsers()
    loadSettings()
    loadEditRequests()
  }, [])

  useEffect(() => {
    load()
  }, [filter])

  useEffect(() => {
    if (reports.length >= 0 && users.length > 0) {
      updateUserReportStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, users])

  useEffect(() => {
    if (selectedUser) {
      loadUserReports(selectedUser.id)
    } else {
      setUserReports([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser])

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

  async function loadSettings() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/daily-reports/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSettings(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadEditRequests() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/daily-report-edit-requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEditRequests(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleEditRequestAction(requestId, status) {
    try {
      const token = localStorage.getItem('token')
      const adminNote = status === 'Rejected' ? prompt('Masukkan catatan penolakan (opsional):') || '' : ''
      
      await axios.put(`http://localhost:4000/api/daily-report-edit-requests/${requestId}`, {
        status,
        adminNote: adminNote || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      await loadEditRequests()
      await load()
      window.location.reload()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses request')
    }
  }

  function getEditRequestForReport(reportId) {
    return editRequests.find(r => r.dailyReportId === reportId)
  }

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/daily-reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      let data = res.data || []
      
      // Apply filters
      if (filter.userId) {
        data = data.filter(r => r.userId === parseInt(filter.userId))
      }
      if (filter.date) {
        data = data.filter(r => r.date === filter.date)
      }
      
      setReports(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function loadUserReports(userId) {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/daily-reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data || []
      const userReportsData = data.filter(r => r.userId === userId)
      setUserReports(userReportsData)
    } catch (err) {
      console.error(err)
      setUserReports([])
    }
  }

  function updateUserReportStatus() {
    const status = {}
    const userList = users.filter(u => u.role === 'user')
    userList.forEach(user => {
      const userReportsList = reports.filter(r => r.userId === user.id)
      const today = new Date().toISOString().split('T')[0]
      const hasReportToday = userReportsList.some(r => r.date === today)
      status[user.id] = {
        hasReport: hasReportToday,
        reportCount: userReportsList.length
      }
    })
    setUserReportStatus(status)
  }

  async function saveSettings() {
    try {
      const token = localStorage.getItem('token')
      await axios.put('http://localhost:4000/api/daily-reports/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Pengaturan berhasil disimpan')
      setShowSettings(false)
      await loadSettings()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan')
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Master <span className="gradient-text">Laporan</span> 📋
          </h1>
          <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lihat dan kelola semua laporan harian dari semua user</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
        >
          Pengaturan Waktu
        </button>
      </div>

      {!selectedUser ? (
        <>
          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Daftar User</h3>
              <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total: {users.filter(u => u.role === 'user').length} user</div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.filter(u => u.role === 'user').map(user => {
                  const status = userReportStatus[user.id] || { hasReport: false, reportCount: 0 }
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 hover:border-purple-500' 
                          : 'bg-white border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {user.profilePicture ? (
                          <img 
                            src={`http://localhost:4000${user.profilePicture}`} 
                            alt={user.name}
                            className={`w-12 h-12 rounded-full object-cover border-2 transition-colors ${
                              theme === 'dark' ? 'border-purple-500' : 'border-indigo-200'
                            }`}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold border-2 transition-colors ${
                            theme === 'dark' ? 'border-purple-500' : 'border-indigo-200'
                          }`}>
                            {(user.name || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </div>
                          <div className={`text-xs truncate transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          status.hasReport
                            ? theme === 'dark'
                              ? 'bg-green-900/50 text-green-300 border border-green-700'
                              : 'bg-green-100 text-green-800 border border-green-300'
                            : theme === 'dark'
                              ? 'bg-red-900/50 text-red-300 border border-red-700'
                              : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {status.hasReport ? '✓ Sudah Laporan' : '✗ Belum Laporan'}
                        </div>
                        <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {status.reportCount} laporan
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedUser(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              {selectedUser.profilePicture ? (
                <img 
                  src={`http://localhost:4000${selectedUser.profilePicture}`} 
                  alt={selectedUser.name}
                  className={`w-10 h-10 rounded-full object-cover border-2 transition-colors ${
                    theme === 'dark' ? 'border-purple-500' : 'border-indigo-200'
                  }`}
                />
              ) : (
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold border-2 transition-colors ${
                  theme === 'dark' ? 'border-purple-500' : 'border-indigo-200'
                }`}>
                  {(selectedUser.name || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedUser.name}
                </h2>
                <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedUser.username}
                </p>
              </div>
            </div>
          </div>

          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Laporan User</h3>
              <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total: {userReports.length} laporan</div>
            </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userReports.length === 0 && (
              <div className="text-center py-12">
                <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada laporan</p>
              </div>
            )}
            {userReports.map(report => (
              <div key={report.id} className={`border rounded-lg p-4 shadow-sm transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="mb-3">
                  <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(report.date)} • Dikirim pada {formatTime(report.submittedAt)}
                    {report.isLate && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        Terlambat
                      </span>
                    )}
                  </div>
                </div>
                <div className={`text-sm rounded-lg p-3 border whitespace-pre-wrap mb-3 transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-800 border-gray-600' 
                    : 'text-gray-700 bg-gray-50 border-gray-200'
                }`}>
                  {report.content}
                </div>
                {report.filePath && (
                  <div className="mt-3">
                    {report.fileType === 'image' ? (
                      <img 
                        src={`http://localhost:4000${report.filePath}`} 
                        alt="Lampiran" 
                        className={`max-w-full h-auto rounded-lg border transition-colors ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        }`}
                      />
                    ) : (
                      <a 
                        href={`http://localhost:4000${report.filePath}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          theme === 'dark' 
                            ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/70' 
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Lihat PDF: {report.fileName}</span>
                      </a>
                    )}
                  </div>
                )}
                {/* Edit Request Section */}
                {(() => {
                  const editRequest = getEditRequestForReport(report.id)
                  if (!editRequest) return null
                  
                  return (
                    <div className={`mt-4 p-4 border rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-yellow-900/30 border-yellow-700' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg className={`w-5 h-5 transition-colors ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'}`}>Request Edit Pending</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className={`text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Alasan:</div>
                        <div className={`text-sm rounded p-2 border transition-colors ${
                          theme === 'dark' 
                            ? 'text-gray-300 bg-gray-800 border-gray-600' 
                            : 'text-gray-600 bg-white border-yellow-200'
                        }`}>
                          {editRequest.reason || 'Tidak ada alasan'}
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className={`text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Konten Baru:</div>
                        <div className={`text-sm rounded p-2 border whitespace-pre-wrap transition-colors ${
                          theme === 'dark' 
                            ? 'text-gray-300 bg-gray-800 border-gray-600' 
                            : 'text-gray-700 bg-white border-yellow-200'
                        }`}>
                          {editRequest.newContent}
                        </div>
                      </div>
                      {editRequest.newFilePath && (
                        <div className="mb-3">
                          {editRequest.newFileType === 'image' ? (
                            <img 
                              src={`http://localhost:4000${editRequest.newFilePath}`} 
                              alt="File baru" 
                              className={`max-w-full h-auto rounded-lg border transition-colors ${
                                theme === 'dark' ? 'border-gray-600' : 'border-yellow-200'
                              }`}
                            />
                          ) : (
                            <a 
                              href={`http://localhost:4000${editRequest.newFilePath}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm border ${
                                theme === 'dark' 
                                  ? 'bg-gray-800 text-indigo-300 hover:bg-gray-700 border-gray-600' 
                                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border-yellow-200'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span>File Baru: {editRequest.newFileName}</span>
                            </a>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRequestAction(editRequest.id, 'Approved')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleEditRequestAction(editRequest.id, 'Rejected')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
          </div>
        </>
      )}

      {showSettings && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pengaturan Waktu Submit Laporan</h2>
              <button 
                onClick={() => setShowSettings(false)} 
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
                  Waktu Mulai Submit
                </label>
                <input
                  type="time"
                  value={settings.reportStartTime}
                  onChange={e => setSettings({ ...settings, reportStartTime: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
                <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>User dapat mulai submit laporan dari jam ini</p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Waktu Akhir Submit
                </label>
                <input
                  type="time"
                  value={settings.reportEndTime}
                  onChange={e => setSettings({ ...settings, reportEndTime: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
                <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Jika submit melewati jam ini, laporan akan dianggap terlambat (tetap masuk)
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Frekuensi Laporan
                </label>
                <select
                  value={settings.reportFrequency || 'daily'}
                  onChange={e => setSettings({ ...settings, reportFrequency: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="daily">Setiap Hari (Wajib)</option>
                  <option value="weekly">Seminggu Sekali</option>
                </select>
                <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {settings.reportFrequency === 'daily' 
                    ? 'User wajib membuat laporan setiap hari kerja'
                    : 'User wajib membuat laporan minimal 1 kali dalam seminggu'
                  }
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)} 
                className={`px-6 py-3 rounded-lg hover:opacity-80 transition-colors font-medium ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Batal
              </button>
              <button 
                onClick={saveSettings} 
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

