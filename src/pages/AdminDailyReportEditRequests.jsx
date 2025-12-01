import React, { useEffect, useState } from 'react'
import axios from 'axios'

function StatusChip({ status }) {
  const map = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-rose-100 text-rose-800'
  }
  const cls = map[status] || 'bg-gray-100 text-gray-800'
  return <span className={`${cls} px-3 py-1 rounded-full text-sm font-medium`}>{status}</span>
}

export default function AdminDailyReportEditRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({ status: '', userId: '' })
  const [users, setUsers] = useState([])

  useEffect(() => {
    load()
    loadUsers()
  }, [])

  useEffect(() => {
    load()
  }, [filter])

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
      const res = await axios.get('http://localhost:4000/api/daily-report-edit-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      let data = res.data || []
      
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

  async function action(id, status, adminNote = '') {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:4000/api/daily-report-edit-requests/${id}`, { 
        status,
        adminNote 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await load()
      window.location.reload()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Master <span className="gradient-text">Request Edit Laporan</span> 📝
        </h1>
        <p className="text-gray-600">Kelola semua request edit laporan dari user</p>
      </div>

      <div className="card-strong mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter User</label>
            <select
              value={filter.userId}
              onChange={e => setFilter({ ...filter, userId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      <div className="card-strong">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Semua Request</h3>
          <div className="text-sm text-gray-500">Total: {requests.length}</div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Tidak ada request</p>
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {r.User?.name || `User ${r.userId}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      Laporan tanggal: {formatDate(r.DailyReport?.date || r.createdAt)}
                    </div>
                  </div>
                  <StatusChip status={r.status} />
                </div>
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Alasan Edit:</div>
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-200">
                    {r.reason || 'Tidak ada alasan'}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Konten Baru:</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">
                    {r.newContent}
                  </div>
                </div>
                {r.newFilePath && (
                  <div className="mb-3">
                    {r.newFileType === 'image' ? (
                      <img 
                        src={`http://localhost:4000${r.newFilePath}`} 
                        alt="File baru" 
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    ) : (
                      <a 
                        href={`http://localhost:4000${r.newFilePath}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Lihat PDF: {r.newFileName}</span>
                      </a>
                    )}
                  </div>
                )}
                {r.status === 'Pending' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => action(r.id, 'Approved')}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt('Masukkan catatan penolakan (opsional):')
                        if (note !== null) {
                          action(r.id, 'Rejected', note)
                        }
                      }}
                      className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {r.adminNote && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Catatan admin: {r.adminNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

