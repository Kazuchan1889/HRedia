import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function Attendance() {
  const { theme } = useTheme()
  const [list, setList] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [requestForm, setRequestForm] = useState({
    currentStatus: '',
    requestedStatus: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailAttendance, setDetailAttendance] = useState(null)
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' or 'desc'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'early', 'onTime', 'almostLate', 'late', 'izin', 'sakit', 'alfa', 'breakLate', 'earlyLeave', 'belumAbsen'
  const [userRequests, setUserRequests] = useState([]) // Store user's requests to check daily limit

  useEffect(() => {
    load()
    loadUserRequests()
  }, [])

  async function loadUserRequests() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendance-status-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUserRequests(res.data || [])
    } catch (err) {
      console.error('Error loading user requests:', err)
    }
  }

  // Check if user has pending request for a specific date
  function hasPendingRequestForDate(date) {
    return userRequests.some(req => {
      if (req.status !== 'Pending') return false
      const requestDate = req.Attendance?.date || req.attendance?.date
      return requestDate === date
    })
  }

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendances/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setList(res.data.reverse())
    } catch (err) {
      console.error(err)
    }
  }

  function openRequestModal(attendance) {
    // Check if user has already made a request for today
    const today = new Date().toISOString().slice(0, 10)
    if (attendance.date === today && hasPendingRequestForDate(today)) {
      alert('Anda sudah membuat request perubahan status absensi untuk hari ini. Setiap user hanya dapat membuat 1 request per hari. Silakan tunggu admin memproses request Anda.')
      return
    }
    
    // Determine current status and requested status options
    let currentStatus = ''
    let requestedStatusOptions = []
    
    // Check what status can be changed
    if (attendance.checkInStatus === 'late') {
      currentStatus = 'late'
      requestedStatusOptions = [
        { value: 'onTime', label: 'On Time' },
        { value: 'almostLate', label: 'Almost Late' }
      ]
    } else if (attendance.checkInStatus === 'almostLate') {
      currentStatus = 'almostLate'
      requestedStatusOptions = [
        { value: 'onTime', label: 'On Time' }
      ]
    } else if (attendance.checkInStatus === 'early') {
      currentStatus = 'early'
      requestedStatusOptions = [
        { value: 'onTime', label: 'On Time' }
      ]
    } else if (attendance.checkInStatus === 'onTime') {
      // User can request to change onTime to something else if needed
      currentStatus = 'onTime'
      requestedStatusOptions = [
        { value: 'early', label: 'Come Early' }
      ]
    } else if (attendance.breakLate) {
      currentStatus = 'breakLate'
      requestedStatusOptions = [
        { value: 'normal', label: 'Normal (Hapus Break Late)' }
      ]
    } else if (attendance.earlyLeave) {
      currentStatus = 'earlyLeave'
      requestedStatusOptions = [
        { value: 'onTimeCheckout', label: 'On Time Checkout (Hapus Early Leave)' }
      ]
    } else if (attendance.checkIn && attendance.status === 'Hadir') {
      // If has check in but no specific status, allow general request
      currentStatus = 'general'
      requestedStatusOptions = [
        { value: 'onTime', label: 'On Time' },
        { value: 'early', label: 'Come Early' }
      ]
    }
    
    // If no specific status to change, allow general request
    if (!currentStatus && attendance.checkIn) {
      currentStatus = 'general'
      requestedStatusOptions = [
        { value: 'onTime', label: 'On Time' },
        { value: 'early', label: 'Come Early' }
      ]
    }
    
    if (!currentStatus) {
      alert('Tidak dapat membuat request untuk absensi ini. Pastikan Anda sudah check in.')
      return
    }
    
    setSelectedAttendance(attendance)
    setRequestForm({
      currentStatus,
      requestedStatus: requestedStatusOptions[0]?.value || '',
      description: ''
    })
    setShowRequestModal(true)
  }

  async function submitRequest() {
    if (!requestForm.description.trim()) {
      alert('Deskripsi wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:4000/api/attendance-status-requests', {
        attendanceId: selectedAttendance.id,
        currentStatus: requestForm.currentStatus,
        requestedStatus: requestForm.requestedStatus,
        description: requestForm.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert('Request berhasil dikirim. Admin akan meninjau request Anda.')
      setShowRequestModal(false)
      setRequestForm({ currentStatus: '', requestedStatus: '', description: '' })
      setSelectedAttendance(null)
      await load() // Reload attendance list
      await loadUserRequests() // Reload user requests to update daily limit check
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal mengirim request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Absensi <span className="gradient-text">Saya</span> 📋
        </h1>
        <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Riwayat catatan absensi Anda</p>
      </div>

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Riwayat Absensi</h2>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {(() => {
              // Calculate filtered count
              let filteredCount = list.filter(a => {
                if (statusFilter === 'all') return true
                if (statusFilter === 'early') return a.checkInStatus === 'early'
                if (statusFilter === 'onTime') return a.checkInStatus === 'onTime'
                if (statusFilter === 'almostLate') return a.checkInStatus === 'almostLate'
                if (statusFilter === 'late') return a.checkInStatus === 'late'
                if (statusFilter === 'hadir') return a.status === 'Hadir' && a.checkIn && !a.checkInStatus
                if (statusFilter === 'izin') return a.status === 'Izin'
                if (statusFilter === 'sakit') return a.status === 'Sakit'
                if (statusFilter === 'alfa') return a.status === 'Alfa'
                if (statusFilter === 'breakLate') return a.breakLate === true
                if (statusFilter === 'earlyLeave') return a.earlyLeave === true
                if (statusFilter === 'belumAbsen') return !a.checkIn && a.status !== 'Izin' && a.status !== 'Sakit' && a.status !== 'Alfa'
                return true
              }).length
              return statusFilter !== 'all' ? `${filteredCount} dari ${list.length} catatan` : `${list.length} catatan`
            })()}
          </div>
        </div>

        {/* Filter Section */}
        <div className={`mb-6 p-4 rounded-lg border transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-700/50 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort Order Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Urutkan Berdasarkan Tanggal
              </label>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="desc">Terbaru → Terlama (Descending)</option>
                <option value="asc">Terlama → Terbaru (Ascending)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter Berdasarkan Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">Semua Status</option>
                <option value="early">⏰ Come Early</option>
                <option value="onTime">✓ On Time</option>
                <option value="almostLate">⚠ Almost Late</option>
                <option value="late">✗ Late</option>
                <option value="hadir">✓ Hadir (Umum)</option>
                <option value="izin">📝 Izin</option>
                <option value="sakit">🏥 Sakit</option>
                <option value="alfa">❌ Alfa</option>
                <option value="breakLate">⏰ Break Late</option>
                <option value="earlyLeave">🏃 Early Leave</option>
                <option value="belumAbsen">⏳ Belum Absen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filtered and Sorted List */}
        {(() => {
          // Filter by status
          let filteredList = list.filter(a => {
            if (statusFilter === 'all') return true
            
            if (statusFilter === 'early') {
              return a.checkInStatus === 'early'
            } else if (statusFilter === 'onTime') {
              return a.checkInStatus === 'onTime'
            } else if (statusFilter === 'almostLate') {
              return a.checkInStatus === 'almostLate'
            } else if (statusFilter === 'late') {
              return a.checkInStatus === 'late'
            } else if (statusFilter === 'hadir') {
              return a.status === 'Hadir' && a.checkIn && !a.checkInStatus
            } else if (statusFilter === 'izin') {
              return a.status === 'Izin'
            } else if (statusFilter === 'sakit') {
              return a.status === 'Sakit'
            } else if (statusFilter === 'alfa') {
              return a.status === 'Alfa'
            } else if (statusFilter === 'breakLate') {
              return a.breakLate === true
            } else if (statusFilter === 'earlyLeave') {
              return a.earlyLeave === true
            } else if (statusFilter === 'belumAbsen') {
              return !a.checkIn && a.status !== 'Izin' && a.status !== 'Sakit' && a.status !== 'Alfa'
            }
            return true
          })

          // Sort by date
          filteredList = [...filteredList].sort((a, b) => {
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            if (sortOrder === 'asc') {
              return dateA - dateB
            } else {
              return dateB - dateA
            }
          })

          return (
            <div className="space-y-3">
              {filteredList.length === 0 ? (
                <div className="text-center py-12">
                  <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {statusFilter !== 'all' ? 'Tidak ada data dengan status yang dipilih' : 'Belum ada catatan absensi'}
                  </p>
                </div>
              ) : (
                <>
                  <div className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Menampilkan {filteredList.length} dari {list.length} catatan
                  </div>
                  {filteredList.map((a) => (
                    <div 
                      key={a.id} 
                      className={`card transition-colors cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 hover:border-indigo-500' 
                          : 'bg-white border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => {
                        setDetailAttendance(a)
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
                            {/* Button to request status change - available for all attendances with check in */}
                            {a.checkIn && (() => {
                              const today = new Date().toISOString().slice(0, 10)
                              const hasRequestToday = a.date === today && hasPendingRequestForDate(today)
                              
                              if (hasRequestToday) {
                                return (
                                  <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
                                    Request Pending
                                  </span>
                                )
                              }
                              
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openRequestModal(a)
                                  }}
                                  className="px-3 py-1 text-xs font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                >
                                  Request Perubahan
                                </button>
                              )
                            })()}
                          </div>
                          <div className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
                                ? 'text-gray-300 bg-gray-600 border-gray-500' 
                                : 'text-gray-600 bg-gray-50 border-gray-200'
                            }`}>
                              {a.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })()}
      </div>

      {/* Request Status Change Modal */}
      {showRequestModal && selectedAttendance && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-md w-full transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Request Perubahan Status</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestForm({ currentStatus: '', requestedStatus: '', description: '' })
                  setSelectedAttendance(null)
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal Absensi</label>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {selectedAttendance.date}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Saat Ini</label>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {requestForm.currentStatus === 'late' ? '✗ Late' :
                   requestForm.currentStatus === 'almostLate' ? '⚠ Almost Late' :
                   requestForm.currentStatus === 'early' ? '⏰ Come Early' :
                   requestForm.currentStatus === 'onTime' ? '✓ On Time' :
                   requestForm.currentStatus === 'breakLate' ? '⏰ Break Late' :
                   requestForm.currentStatus === 'earlyLeave' ? '🏃 Early Leave' :
                   requestForm.currentStatus === 'general' ? 'Hadir' : '-'}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Request Status Baru</label>
                <select
                  value={requestForm.requestedStatus}
                  onChange={e => setRequestForm({ ...requestForm, requestedStatus: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {requestForm.currentStatus === 'late' && (
                    <>
                      <option value="onTime">On Time</option>
                      <option value="almostLate">Almost Late</option>
                    </>
                  )}
                  {requestForm.currentStatus === 'almostLate' && (
                    <option value="onTime">On Time</option>
                  )}
                  {requestForm.currentStatus === 'early' && (
                    <option value="onTime">On Time</option>
                  )}
                  {requestForm.currentStatus === 'onTime' && (
                    <option value="early">Come Early</option>
                  )}
                  {requestForm.currentStatus === 'breakLate' && (
                    <option value="normal">Normal (Hapus Break Late)</option>
                  )}
                  {requestForm.currentStatus === 'earlyLeave' && (
                    <option value="onTimeCheckout">On Time Checkout (Hapus Early Leave)</option>
                  )}
                  {requestForm.currentStatus === 'general' && (
                    <>
                      <option value="onTime">On Time</option>
                      <option value="early">Come Early</option>
                    </>
                  )}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Deskripsi/Alasan *</label>
                <textarea
                  required
                  value={requestForm.description}
                  onChange={e => setRequestForm({ ...requestForm, description: e.target.value })}
                  rows={4}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="Jelaskan alasan mengapa status perlu diubah..."
                />
                <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Deskripsi ini akan dibaca oleh admin untuk meninjau request Anda</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestForm({ currentStatus: '', requestedStatus: '', description: '' })
                  setSelectedAttendance(null)
                }}
                className={`px-4 py-2 rounded-lg hover:opacity-80 transition-colors font-medium ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Batal
              </button>
              <button
                onClick={submitRequest}
                disabled={submitting || !requestForm.description.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Mengirim...' : 'Kirim Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailAttendance && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black bg-opacity-50'
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
              {/* Date and Status */}
              <div className={`mb-6 pb-6 border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tanggal: {detailAttendance.date}</h3>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {detailAttendance.status === 'Izin' && (
                    <span className="status-chip status-warning">Izin</span>
                  )}
                  {detailAttendance.status === 'Sakit' && (
                    <span className="status-chip status-danger">Sakit</span>
                  )}
                  {detailAttendance.status === 'Alfa' && (
                    <span className="status-chip status-default">Alfa</span>
                  )}
                  {detailAttendance.status === 'Hadir' && detailAttendance.checkIn && detailAttendance.checkInStatus && (
                    <span
                      className={`status-chip font-semibold ${
                        detailAttendance.checkInStatus === 'early'
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                          : detailAttendance.checkInStatus === 'onTime'
                          ? 'bg-green-100 text-green-800 border-2 border-green-400'
                          : detailAttendance.checkInStatus === 'almostLate'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                          : 'bg-red-100 text-red-800 border-2 border-red-400'
                      }`}
                    >
                      {detailAttendance.checkInStatus === 'early' ? '⏰ Come Early' : detailAttendance.checkInStatus === 'onTime' ? '✓ On Time' : detailAttendance.checkInStatus === 'almostLate' ? '⚠ Almost Late' : '✗ Late'}
                    </span>
                  )}
                  {detailAttendance.status === 'Hadir' && detailAttendance.checkIn && !detailAttendance.checkInStatus && (
                    <span className="status-chip status-success">Hadir</span>
                  )}
                  {detailAttendance.breakLate && (
                    <span className="status-chip bg-orange-100 text-orange-800 border border-orange-300 font-medium">
                      ⏰ Break Late
                    </span>
                  )}
                  {detailAttendance.earlyLeave && (
                    <span className="status-chip bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                      🏃 Early Leave
                    </span>
                  )}
                  {!detailAttendance.checkIn && detailAttendance.status !== 'Izin' && detailAttendance.status !== 'Sakit' && detailAttendance.status !== 'Alfa' && (
                    <span className="status-chip status-default">Belum Absen</span>
                  )}
                </div>
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
                    {detailAttendance.checkIn || '-'}
                  </div>
                </div>
                {(detailAttendance.breakStart || detailAttendance.breakEnd) && (
                  <div className={`rounded-lg p-4 border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Break</div>
                    <div className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {detailAttendance.breakStart || '-'} - {detailAttendance.breakEnd || '-'}
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
                    {detailAttendance.checkOut || '-'}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {detailAttendance.checkInPhotoPath ? (
                  <div>
                    <div className={`text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto Check In</div>
                    <div className="relative">
                      <img
                        src={`http://localhost:4000${detailAttendance.checkInPhotoPath}`}
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
                {detailAttendance.checkOutPhotoPath ? (
                  <div>
                    <div className={`text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto Check Out</div>
                    <div className="relative">
                      <img
                        src={`http://localhost:4000${detailAttendance.checkOutPhotoPath}`}
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

              {/* Note */}
              {detailAttendance.note && (
                <div className={`rounded-lg p-4 border transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-900/30 border-blue-700' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-blue-200' : 'text-blue-900'}`}>Catatan</div>
                  <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>{detailAttendance.note}</div>
                </div>
              )}

              {/* Request Button if applicable */}
              {(detailAttendance.checkInStatus === 'late' || detailAttendance.checkInStatus === 'almostLate' || detailAttendance.breakLate || detailAttendance.earlyLeave || (detailAttendance.checkIn && detailAttendance.status === 'Hadir')) && (
                <div className={`mt-6 pt-6 border-t transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  {(() => {
                    const today = new Date().toISOString().slice(0, 10)
                    const hasRequestToday = detailAttendance.date === today && hasPendingRequestForDate(today)
                    
                    if (hasRequestToday) {
                      return (
                        <div className={`p-4 rounded-lg border transition-colors ${
                          theme === 'dark' 
                            ? 'bg-yellow-900/30 border-yellow-700' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className={`text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-900'}`}>
                            ⚠ Request Pending
                          </div>
                          <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                            Anda sudah membuat request perubahan status absensi untuk hari ini. Setiap user hanya dapat membuat 1 request per hari.
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          openRequestModal(detailAttendance)
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium"
                      >
                        Request Perubahan Status
                      </button>
                    )
                  })()}
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
    </div>
  )
}
