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

export default function AdminAttendanceStatusRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({ status: '' })
  const [adminNote, setAdminNote] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null) // 'approve' or 'reject'

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendance-status-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      let data = res.data || []
      
      // Apply filters
      if (filter.status) {
        data = data.filter(r => r.status === filter.status)
      }
      
      setRequests(data)
    } catch (err) {
      console.error(err)
      alert('Gagal memuat data request')
    }
    setLoading(false)
  }

  function openActionModal(request, type) {
    setSelectedRequest(request)
    setActionType(type)
    setAdminNote('')
    setShowActionModal(true)
  }

  async function submitAction() {
    if (!selectedRequest) return

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `http://localhost:4000/api/attendance-status-requests/${selectedRequest.id}`,
        {
          status: actionType === 'approve' ? 'Approved' : 'Rejected',
          adminNote: adminNote || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      alert(`Request berhasil ${actionType === 'approve' ? 'disetujui' : 'ditolak'}`)
      setShowActionModal(false)
      setSelectedRequest(null)
      setAdminNote('')
      load()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal memproses request')
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Request <span className="gradient-text">Perubahan Status Absensi</span> 📋
        </h1>
        <p className="text-gray-600">Tinjau dan kelola request perubahan status absensi dari user</p>
      </div>

      {/* Filter */}
      <div className="card-strong mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
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
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card-strong">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">Tidak ada request</p>
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold text-gray-900">
                        {r.User?.name || `User ID: ${r.userId}`}
                      </div>
                      <StatusChip status={r.status} />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="font-medium text-gray-900 mb-1">
                        Tanggal Absensi: {r.Attendance?.date ? new Date(r.Attendance.date).toLocaleDateString('id-ID') : '-'}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                          {getStatusLabel(r.currentStatus)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          {getRequestedStatusLabel(r.requestedStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="font-medium text-gray-900 mb-1">Deskripsi/Alasan:</div>
                      <div className="text-gray-700 whitespace-pre-wrap">{r.description || 'Tidak ada deskripsi'}</div>
                    </div>
                    {r.adminNote && (
                      <div className="mt-2 text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="font-medium text-gray-900 mb-1">Catatan Admin:</div>
                        <div className="text-gray-700">{r.adminNote}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {r.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => openActionModal(r, 'approve')}
                        className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openActionModal(r, 'reject')}
                        className="px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h2>
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setSelectedRequest(null)
                  setAdminNote('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User: {selectedRequest.User?.name || `User ID: ${selectedRequest.userId}`}
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal: {selectedRequest.Attendance?.date ? new Date(selectedRequest.Attendance.date).toLocaleDateString('id-ID') : '-'}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Admin {actionType === 'reject' ? '(Opsional)' : ''}
                </label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={actionType === 'approve' ? 'Catatan (opsional)...' : 'Alasan penolakan (opsional)...'}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowActionModal(false)
                  setSelectedRequest(null)
                  setAdminNote('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={submitAction}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  actionType === 'approve'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

