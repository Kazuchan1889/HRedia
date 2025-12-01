import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function MyPerformance() {
  const { theme } = useTheme()
  const [kpiData, setKpiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('monthly') // 'monthly' or 'yearly'
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [year, setYear] = useState(new Date().getFullYear().toString()) // YYYY

  useEffect(() => {
    loadKPI()
  }, [mode, month, year])

  async function loadKPI() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      if (!user.id) {
        alert('User data tidak ditemukan')
        return
      }
      
      let url = `http://localhost:4000/api/performance/me?mode=${mode}`
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
    if (score >= 80) return '🟢 Excellent'
    if (score >= 60) return '🟡 Good'
    return '🔴 Needs Improvement'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Performance <span className="gradient-text">KPI Saya</span> 📊
          </h1>
          <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lihat kinerja dan KPI Anda</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Mode Dropdown */}
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
          
          {/* Period Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {mode === 'yearly' ? 'Tahun' : 'Bulan'}
            </label>
            {mode === 'yearly' ? (
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
            ) : (
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
            )}
          </div>
          
          <button
            onClick={loadKPI}
            className="btn btn-primary mt-6"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data KPI...</p>
        </div>
      ) : kpiData ? (
        <>
          {/* KPI Score Card */}
          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-[#26355D] to-[#1a2440] border-[#AF47D2]/30' 
              : 'bg-gradient-to-br from-[#26355D] to-[#1a2440] border-[#AF47D2]/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>KPI Score Anda</h3>
                <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {mode === 'yearly' 
                    ? `Tahun ${kpiData.period}`
                    : `Bulan ${new Date(kpiData.period + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getKPIColor(kpiData.kpiScore).split(' ')[0]}`}>
                  {kpiData.kpiScore.toFixed(2)}
                </div>
                <div className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{getKPIBadge(kpiData.kpiScore)}</div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Jam Kerja</div>
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{kpiData.metrics.totalWorkHours.toFixed(1)}</div>
              <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>jam</div>
            </div>
            
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Hari Hadir</div>
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{kpiData.metrics.presentDays}</div>
              <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>hari</div>
            </div>
            
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Izin</div>
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{kpiData.metrics.izinCount}</div>
              <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>hari</div>
            </div>
            
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cuti</div>
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{kpiData.metrics.cutiCount}</div>
              <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>hari</div>
            </div>
            
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Laporan</div>
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {kpiData.metrics.reportCount}
              </div>
              <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                {kpiData.metrics.reportFrequency === 'weekly' ? 'Mingguan' : 'Harian'} • laporan dibuat
              </div>
            </div>
            
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Rata-rata Jam/Hari</div>
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {kpiData.metrics.presentDays > 0 
                  ? (kpiData.metrics.totalWorkHours / kpiData.metrics.presentDays).toFixed(1)
                  : '0'
                }
              </div>
              <div className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>jam per hari</div>
            </div>
          </div>

          {/* Breakdown KPI */}
          {kpiData.breakdown && (
            <div className={`card-strong transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Breakdown KPI</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jam Kerja (40%)</span>
                    <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {kpiData.breakdown.workHoursScore.toFixed(2)} / 100
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2 transition-colors ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${kpiData.breakdown.workHoursScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Laporan (30%)</span>
                    <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {kpiData.breakdown.reportsScore.toFixed(2)} / 100
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2 transition-colors ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${kpiData.breakdown.reportsScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Izin Penalty (15%)</span>
                    <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {kpiData.breakdown.izinPenalty.toFixed(2)} / 100
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2 transition-colors ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all"
                      style={{ width: `${kpiData.breakdown.izinPenalty}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Cuti Penalty (15%)</span>
                    <span className={`text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {kpiData.breakdown.cutiPenalty.toFixed(2)} / 100
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2 transition-colors ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${kpiData.breakdown.cutiPenalty}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips & Info */}
          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-blue-900/30 border-blue-700' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>💡 Tips Meningkatkan KPI</h3>
            <ul className={`space-y-2 text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Pastikan check-in dan check-out tepat waktu untuk menghitung jam kerja dengan akurat</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Buat laporan harian setiap hari kerja untuk meningkatkan score laporan</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Minimalkan penggunaan izin dan cuti untuk mengurangi penalty</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Target KPI di atas 80 untuk mendapatkan rating Excellent</span>
              </li>
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada data KPI</p>
        </div>
      )}
    </div>
  )
}

