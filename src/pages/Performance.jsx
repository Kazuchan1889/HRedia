import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function Performance() {
  const { theme } = useTheme()
  const [kpiData, setKpiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('monthly') // 'monthly' or 'yearly'
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [year, setYear] = useState(new Date().getFullYear().toString()) // YYYY
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadKPI()
  }, [mode, month, year])

  async function loadKPI() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `http://localhost:4000/api/performance?mode=${mode}`
      if (mode === 'yearly') {
        url += `&year=${year}`
      } else {
        url += `&month=${month}`
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setKpiData(res.data)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal memuat data KPI')
    }
    setLoading(false)
  }

  function getKPIColor(score) {
    if (theme === 'dark') {
      if (score >= 80) return 'text-green-300 bg-green-900/30 border-green-700'
      if (score >= 60) return 'text-yellow-300 bg-yellow-900/30 border-yellow-700'
      return 'text-red-300 bg-red-900/30 border-red-700'
    } else {
      if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
      if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  function getKPIBadge(score) {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  async function viewUserDetail(userId) {
    try {
      const token = localStorage.getItem('token')
      let url = `http://localhost:4000/api/performance/user/${userId}?mode=${mode}`
      if (mode === 'yearly') {
        url += `&year=${year}`
      } else {
        url += `&month=${month}`
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedUser(res.data)
      setShowDetailModal(true)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal memuat detail KPI user')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Performance KPI
          </h1>
          <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Monitor kinerja dan KPI semua user</p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Mode</label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className={`p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          {mode === 'monthly' ? (
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Bulan</label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className={`p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          ) : (
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tahun</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                min="2020"
                max="2099"
                className={`p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="YYYY"
              />
            </div>
          )}
          <button
            onClick={loadKPI}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Average KPI Card */}
      {kpiData && (
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-base font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rata-rata KPI</h3>
              <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {mode === 'yearly' 
                  ? `Tahun ${kpiData.period}`
                  : `Bulan ${new Date(kpiData.period + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                }
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-semibold transition-colors ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{kpiData.averageKPI.toFixed(2)}</div>
              <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>dari 100</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Table */}
      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Daftar User & KPI</h3>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Total: {kpiData?.users?.length || 0} user
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data KPI...</p>
          </div>
        ) : kpiData?.users?.length === 0 ? (
          <div className="text-center py-12">
            <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada data KPI</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Rank</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Nama</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Posisi</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>KPI Score</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Total Jam Kerja</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Izin</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Cuti</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Laporan</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Status</th>
                  <th className={`text-left py-3 px-4 font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kpiData?.users?.map((user, index) => (
                  <tr
                    key={user.userId}
                    className={`border-b transition-colors ${
                      theme === 'dark' 
                        ? `border-gray-700 hover:bg-gray-700/50 ${user.isBelowAverage ? 'bg-red-900/20' : ''}` 
                        : `border-gray-100 hover:bg-gray-50 ${user.isBelowAverage ? 'bg-red-50/50' : ''}`
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className={`font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>#{index + 1}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.username}</div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.position || '-'}</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getKPIColor(user.kpiScore)}`}>
                        {user.kpiScore.toFixed(2)}
                      </div>
                    </td>
                    <td className={`py-3 px-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user.metrics.totalWorkHours.toFixed(1)} jam
                    </td>
                    <td className={`py-3 px-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.metrics.izinCount} hari</td>
                    <td className={`py-3 px-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.metrics.cutiCount} hari</td>
                    <td className={`py-3 px-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user.metrics.reportCount} {mode === 'yearly' ? '/thn' : '/bln'}
                    </td>
                    <td className="py-3 px-4">
                      {user.isBelowAverage ? (
                        <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Di Bawah Rata-rata</span>
                      ) : (
                        <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Normal</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => viewUserDetail(user.userId)}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-2xl rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Detail KPI - {selectedUser.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* KPI Score */}
              <div className={`rounded-lg p-4 border transition-colors ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>KPI Score</h3>
                    <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedUser.mode === 'yearly' || mode === 'yearly'
                        ? `Tahun ${selectedUser.period || selectedUser.month || year}`
                        : `Bulan ${new Date((selectedUser.period || selectedUser.month || month) + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-semibold ${getKPIColor(selectedUser.kpiScore).split(' ')[0]}`}>
                      {selectedUser.kpiScore.toFixed(2)}
                    </div>
                    <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{getKPIBadge(selectedUser.kpiScore)}</div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-lg p-4 transition-colors ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Jam Kerja</div>
                  <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.metrics.totalWorkHours.toFixed(1)}</div>
                  <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>jam</div>
                </div>
                <div className={`border rounded-lg p-4 transition-colors ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Hari Hadir</div>
                  <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.metrics.presentDays}</div>
                  <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>hari</div>
                </div>
                <div className={`border rounded-lg p-4 transition-colors ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Izin</div>
                  <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.metrics.izinCount}</div>
                  <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>hari</div>
                </div>
                <div className={`border rounded-lg p-4 transition-colors ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cuti</div>
                  <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.metrics.cutiCount}</div>
                  <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>hari</div>
                </div>
                <div className={`border rounded-lg p-4 col-span-2 transition-colors ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Laporan</div>
                  <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedUser.metrics.reportCount} {mode === 'yearly' || selectedUser.mode === 'yearly' ? '/thn' : '/bln'}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              {selectedUser.breakdown && (
                <div className={`rounded-lg p-4 transition-colors ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Breakdown KPI</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Jam Kerja (40%)</span>
                      <span className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.breakdown.workHoursScore.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Laporan (30%)</span>
                      <span className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.breakdown.reportsScore.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Izin Penalty (15%)</span>
                      <span className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.breakdown.izinPenalty.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cuti Penalty (15%)</span>
                      <span className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedUser.breakdown.cutiPenalty.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if below average */}
              {kpiData && selectedUser.kpiScore < kpiData.averageKPI && (
                <div className={`border rounded-lg p-4 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-red-900/30 border-red-700' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div>
                    <h4 className={`font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-red-200' : 'text-red-900'}`}>Perhatian</h4>
                    <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                      KPI user ini ({selectedUser.kpiScore.toFixed(2)}) berada di bawah rata-rata ({kpiData.averageKPI.toFixed(2)}).
                      Disarankan untuk melakukan monitoring lebih lanjut atau memberikan teguran langsung kepada user.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg hover:opacity-80 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
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

