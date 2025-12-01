import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

function StatusChip({ status, theme }) {
  const map = {
    Pending: theme === 'dark' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-800',
    Approved: theme === 'dark' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-800',
    Rejected: theme === 'dark' ? 'bg-rose-900/50 text-rose-300 border border-rose-700' : 'bg-rose-100 text-rose-800'
  }
  const cls = map[status] || (theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-800')
  return <span className={`${cls} px-3 py-1 rounded-full text-sm font-medium`}>{status}</span>
}

export default function AdminLeave() {
  const { theme } = useTheme()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({ status: '', userId: '' })
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('Izin') // 'Izin' or 'Cuti'

  useEffect(() => {
    load()
    loadUsers()
  }, [])

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
      const res = await axios.get('http://localhost:4000/api/leaverequests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      let data = res.data || []
      
      // Filter by type (Izin or Cuti)
      data = data.filter(r => (r.type || 'Izin') === activeTab)
      
      // Apply filters
      if (filter.status) {
        data = data.filter(r => r.status === filter.status)
      }
      if (filter.userId) {
        data = data.filter(r => r.userId === parseInt(filter.userId))
      }
      
      setRequests(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filter, activeTab])

  async function action(id, status) {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:4000/api/leaverequests/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await load()
      // Refresh page setelah approve/reject
      window.location.reload()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Master <span className="gradient-text">Izin/Cuti</span> 📅
        </h1>
        <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lihat dan kelola semua pengajuan izin dan cuti</p>
      </div>

      {/* Tabs */}
      <div className={`card-strong mb-6 transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`flex border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('Izin')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'Izin'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Izin
          </button>
          <button
            onClick={() => setActiveTab('Cuti')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'Cuti'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Cuti
          </button>
        </div>
      </div>

      <div className={`card-strong mb-6 transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Filter Status</label>
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
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
            onClick={() => setFilter({ status: '', userId: '' })}
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

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium transition-colors ${theme === 'dark' ? 'text-white' : ''}`}>Pengajuan {activeTab}</h3>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total: {requests.length}</div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada pengajuan</p>
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} className={`border rounded-lg p-4 shadow-sm flex items-start gap-4 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <div className={`font-medium flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {r.User ? r.User.name : (r.userId ? `User ${r.userId}` : 'Unknown')}
                        <span className={`text-xs font-normal transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({r.type || 'Izin'})
                        </span>
                      </div>
                      <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{r.startDate} → {r.endDate}</div>
                    </div>
                    <StatusChip status={r.status} theme={theme} />
                  </div>
                  <div className={`mt-2 text-sm rounded-lg p-2 border transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 bg-gray-800 border-gray-600' 
                      : 'text-gray-700 bg-gray-50 border-gray-200'
                  }`}>
                    {r.reason || 'Tidak ada alasan'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {r.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => action(r.id, 'Approved')}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70 border border-green-700' 
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => action(r.id, 'Rejected')}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-rose-900/50 text-rose-300 hover:bg-rose-900/70 border border-rose-700' 
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

