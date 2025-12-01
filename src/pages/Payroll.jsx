import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function Payroll() {
  const { theme } = useTheme()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [payroll, setPayroll] = useState(null)

  useEffect(() => {
    if (month) {
      load()
    }
  }, [month])

  async function load() {
    if (!month) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`http://localhost:4000/api/payroll/me?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPayroll(res.data)
    } catch (err) {
      console.error(err)
      setPayroll(null)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Payroll <span className="gradient-text">Saya</span> 💰
        </h1>
        <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Lihat detail gaji dan payroll Anda</p>
      </div>

      <div className={`card-strong mb-6 transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Pilih Bulan</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className={`w-full md:w-64 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
          </div>
        </div>
      ) : payroll ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500' 
              : 'bg-gradient-to-br from-indigo-400 to-purple-400 border-indigo-300'
          }`}>
            <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-white/90' : 'text-white/90'}`}>Bulan</div>
            <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-white'}`}>
              {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-500' 
              : 'bg-gradient-to-br from-green-400 to-emerald-400 border-green-300'
          }`}>
            <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-white/90' : 'text-white/90'}`}>Hari Kerja</div>
            <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-white'}`}>{payroll.presentDays || 0} hari</div>
          </div>
          <div className={`card-strong transition-colors ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-amber-600 to-orange-600 border-amber-500' 
              : 'bg-gradient-to-br from-amber-400 to-orange-400 border-amber-300'
          }`}>
            <div className={`text-sm mb-1 transition-colors ${theme === 'dark' ? 'text-white/90' : 'text-white/90'}`}>Total Gaji</div>
            <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-white'}`}>
              Rp {payroll.salary?.toLocaleString('id-ID') || '0'}
            </div>
          </div>
        </div>
      ) : (
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center py-12">
            <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada data payroll untuk bulan ini</p>
          </div>
        </div>
      )}

      {payroll && (
        <div className={`card-strong mt-6 transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Detail Perhitungan</h2>
          <div className="space-y-3">
            <div className={`flex items-center justify-between py-2 border-b transition-colors ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <span className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Daily Rate</span>
              <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rp {payroll.dailyRate?.toLocaleString('id-ID') || '0'}</span>
            </div>
            <div className={`flex items-center justify-between py-2 border-b transition-colors ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <span className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Hari Kerja</span>
              <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{payroll.presentDays || 0} hari</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className={`text-lg font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total Gaji</span>
              <span className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Rp {payroll.salary?.toLocaleString('id-ID') || '0'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
