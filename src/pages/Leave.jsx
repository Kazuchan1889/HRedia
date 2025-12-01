import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

function StatusChip({ status, theme }){
  const map = {
    Pending: theme === 'dark' ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800',
    Approved: theme === 'dark' ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800',
    Rejected: theme === 'dark' ? 'bg-rose-700 text-rose-100' : 'bg-rose-100 text-rose-800'
  }
  const cls = map[status] || (theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800')
  return <span className={`${cls} px-3 py-1 rounded-full text-sm font-medium`}>{status}</span>
}

export default function Leave(){
  const { theme } = useTheme()
  const [requests, setRequests] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState('Izin') // 'Izin' or 'Cuti'
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isAdmin = user?.role === 'admin'

  useEffect(()=>{ 
    load()
    loadUserData()
    
    // Refresh user data periodically (every 30 seconds) to update leave quota
    const interval = setInterval(() => {
      loadUserData()
    }, 30000) // 30 seconds
    
    // Refresh user data when window gains focus (user comes back to tab)
    const handleFocus = () => {
      loadUserData()
      load() // Also refresh requests
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  },[])

  async function loadUserData(){
    try{
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      setUserData(res.data)
      // Update localStorage user data
      localStorage.setItem('user', JSON.stringify(res.data))
    }catch(err){ 
      console.error(err) 
    }
  }

  async function load(){
    try{
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/leaverequests', { headers: { Authorization: `Bearer ${token}` } })
      // Backend already filters by user role, so we just use the response
      setRequests(res.data || [])
      // Also refresh user data when loading requests (in case quota changed)
      await loadUserData()
    }catch(err){ console.error(err) }
  }

  // Calculate remaining leave quota
  function getRemainingLeaveQuota() {
    if (!userData) return 0
    const totalQuota = userData.leaveQuotaOther ? userData.leaveQuotaOther : (userData.leaveQuota || 12)
    const used = userData.usedLeaveQuota || 0
    return Math.max(0, totalQuota - used)
  }

  const remainingQuota = getRemainingLeaveQuota()
  const canRequestCuti = remainingQuota > 0

  function validRange(){
    if (!startDate || !endDate) return false
    return new Date(startDate) <= new Date(endDate)
  }

  async function submit(){
    if (!validRange()){ alert('Tanggal tidak valid'); return }
    
    // Validate cuti request if quota is exhausted
    if (type === 'Cuti' && !canRequestCuti) {
      alert('Jatah cuti Anda sudah habis. Anda tidak dapat mengajukan cuti lagi, tapi masih bisa mengajukan izin.')
      return
    }
    
    setLoading(true)
    try{
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:4000/api/leaverequests', { startDate, endDate, reason, type }, { headers: { Authorization: `Bearer ${token}` } })
      setStartDate(''); setEndDate(''); setReason(''); setType('Izin')
      setShowModal(false)
      await load()
      await loadUserData() // Reload user data to update quota
    }catch(err){ alert(err.response?.data?.message || 'Submit failed') }
    setLoading(false)
  }

  async function action(id, status){
    try{
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:4000/api/leaverequests/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      await load()
    }catch(err){ alert(err.response?.data?.message || 'Action failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Izin/Cuti <span className="gradient-text">Saya</span> 📅
          </h1>
          <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lihat riwayat dan ajukan cuti atau izin kerja</p>
        </div>
        {!isAdmin && (
          <div>
            <button 
              onClick={() => {
                // Always set default type to Izin when opening modal
                setType('Izin')
                setShowModal(true)
              }} 
              className="btn btn-primary"
            >
              Ajukan Cuti / Izin
            </button>
          </div>
        )}
      </div>

      {/* Leave Quota Indicator */}
      {!isAdmin && userData && (
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-[#26355D] to-[#1a2440] border-[#AF47D2]/30' 
            : 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Jatah Cuti Saya</h3>
              <div className="flex items-center gap-6">
                <div>
                  <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Total Jatah:</span>
                  <span className={`ml-2 font-bold text-base transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {userData.leaveQuotaOther ? userData.leaveQuotaOther : (userData.leaveQuota || 12)} hari
                  </span>
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Terpakai:</span>
                  <span className={`ml-2 font-bold text-base transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {userData.usedLeaveQuota || 0} hari
                  </span>
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Sisa:</span>
                  <span className={`ml-2 font-bold text-xl ${
                    remainingQuota > 0 
                      ? theme === 'dark' 
                        ? 'text-green-300' 
                        : 'text-green-600' 
                      : theme === 'dark' 
                        ? 'text-red-300' 
                        : 'text-red-600'
                  }`}>
                    {remainingQuota} hari
                  </span>
                </div>
              </div>
            </div>
            <div className={`px-5 py-4 rounded-xl transition-colors ${
              remainingQuota > 0 
                ? theme === 'dark' 
                  ? 'bg-green-600/20 text-green-200 border-2 border-green-500' 
                  : 'bg-green-500 text-white border-2 border-green-600'
                : theme === 'dark' 
                  ? 'bg-red-600/20 text-red-200 border-2 border-red-500' 
                  : 'bg-red-500 text-white border-2 border-red-600'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{remainingQuota > 0 ? '✅' : '❌'}</span>
                <span className="text-sm font-semibold">
                  {remainingQuota > 0 ? 'Masih Bisa Cuti' : 'Jatah Cuti Habis'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Riwayat Pengajuan</h3>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total: {requests.length}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.length===0 && <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada pengajuan</div>}
          {requests.map(r => (
            <div key={r.id} className={`border rounded-lg p-4 shadow-sm flex items-start gap-4 transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={`font-medium flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {r.type === 'Cuti' ? '📅 Cuti' : '📝 Izin'}
                      <span className={`text-sm font-normal transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>({r.type})</span>
                    </div>
                    <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{r.startDate} → {r.endDate}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={r.status} theme={theme} />
                  </div>
                </div>
                <div className={`mt-2 text-sm rounded-lg p-2 border transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-300 bg-gray-600 border-gray-500' 
                    : 'text-gray-700 bg-gray-50 border-gray-200'
                }`}>
                  {r.reason || 'Tidak ada alasan'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-lg rounded-xl shadow-xl p-6 transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Form Pengajuan</h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setType('Izin') // Reset to Izin when closing
                }} 
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tutup
              </button>
            </div>

            <div className="mb-3">
              <label className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Jenis *</label>
              <select 
                value={type} 
                onChange={e => {
                  const newType = e.target.value
                  if (newType === 'Cuti' && !canRequestCuti) {
                    alert('Jatah cuti Anda sudah habis. Anda tidak dapat mengajukan cuti lagi, tapi masih bisa mengajukan izin.')
                    return
                  }
                  setType(newType)
                }} 
                className={`mt-1 p-2 border rounded w-full transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="Izin">Izin</option>
                <option value="Cuti" disabled={!canRequestCuti}>
                  Cuti {!canRequestCuti ? '(Jatah Habis)' : ''}
                </option>
              </select>
              {!canRequestCuti && (
                <p className={`mt-1 text-xs flex items-center gap-1 transition-colors ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Jatah cuti Anda sudah habis. Anda masih bisa mengajukan izin.
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Mulai</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={`mt-1 p-2 border rounded w-full transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`} />
              </div>
              <div>
                <label className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Selesai</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={`mt-1 p-2 border rounded w-full transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`} />
              </div>
            </div>

            <div className="mt-3">
              <label className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Alasan</label>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} className={`mt-1 p-2 border rounded w-full h-24 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`} />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={()=>setShowModal(false)} className={`btn btn-ghost transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : ''
              }`}>Batal</button>
              <button onClick={submit} className="btn btn-primary" disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
