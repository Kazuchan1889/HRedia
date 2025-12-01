import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

export default function AdminPayroll() {
  const { theme } = useTheme()
  const [users, setUsers] = useState([])
  const [payrollSettings, setPayrollSettings] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([]) // Array of user IDs
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showCalculateModal, setShowCalculateModal] = useState(false)
  const [calculationResult, setCalculationResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [form, setForm] = useState({
    alphaDeduction: 0,
    izinDeduction: 0,
    lateDeduction: 0,
    breakLateDeduction: 0,
    earlyLeaveDeduction: 0,
    noReportDeduction: 0,
    maxLateAllowed: 0,
    maxBreakLateAllowed: 0,
    maxEarlyLeaveAllowed: 0,
    deductionType: 'percentage',
    perfectAttendanceBonus: 0,
    allReportsBonus: 0,
    isActive: true
  })
  const [calculateForm, setCalculateForm] = useState({
    userId: '',
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  })

  useEffect(() => {
    loadUsers()
    loadPayrollSettings()
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
      alert('Gagal memuat data user')
    }
  }

  async function loadPayrollSettings() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/payroll-settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPayrollSettings(res.data)
    } catch (err) {
      console.error(err)
      alert('Gagal memuat data payroll settings')
    }
    setLoading(false)
  }

  function handleEdit(user) {
    const setting = payrollSettings.find(s => s.userId === user.id)
    if (setting) {
      setForm({
        alphaDeduction: setting.alphaDeduction || 0,
        izinDeduction: setting.izinDeduction || 0,
        lateDeduction: setting.lateDeduction || 0,
        breakLateDeduction: setting.breakLateDeduction || 0,
        earlyLeaveDeduction: setting.earlyLeaveDeduction || 0,
        noReportDeduction: setting.noReportDeduction || 0,
        maxLateAllowed: setting.maxLateAllowed || 0,
        maxBreakLateAllowed: setting.maxBreakLateAllowed || 0,
        maxEarlyLeaveAllowed: setting.maxEarlyLeaveAllowed || 0,
        deductionType: setting.deductionType || 'percentage',
        perfectAttendanceBonus: setting.perfectAttendanceBonus || 0,
        allReportsBonus: setting.allReportsBonus || 0,
        isActive: setting.isActive !== undefined ? setting.isActive : true
      })
    } else {
      setForm({
        alphaDeduction: 0,
        izinDeduction: 0,
        lateDeduction: 0,
        breakLateDeduction: 0,
        earlyLeaveDeduction: 0,
        noReportDeduction: 0,
        maxLateAllowed: 0,
        maxBreakLateAllowed: 0,
        maxEarlyLeaveAllowed: 0,
        deductionType: 'percentage',
        perfectAttendanceBonus: 0,
        allReportsBonus: 0,
        isActive: true
      })
    }
    setSelectedUser(user)
    setShowEditModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `http://localhost:4000/api/payroll-settings/user/${selectedUser.id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Pengaturan payroll berhasil disimpan')
      setShowEditModal(false)
      setSelectedUser(null)
      loadPayrollSettings()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan payroll')
    }
    setSaving(false)
  }

  async function handleCalculate(e) {
    e.preventDefault()
    if (!calculateForm.userId || !calculateForm.month) {
      alert('Pilih user dan bulan terlebih dahulu')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/payroll-settings/calculate', {
        params: {
          userId: calculateForm.userId,
          month: calculateForm.month
        },
        headers: { Authorization: `Bearer ${token}` }
      })
      setCalculationResult(res.data)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal menghitung payroll')
    }
  }

  function getSettingForUser(userId) {
    return payrollSettings.find(s => s.userId === userId)
  }

  function handleSelectUser(userId) {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  function handleSelectAll() {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  function handleBulkEdit() {
    if (selectedUsers.length === 0) {
      alert('Pilih minimal satu user terlebih dahulu')
      return
    }
    // Set default form values
    setForm({
      alphaDeduction: 0,
      izinDeduction: 0,
      lateDeduction: 0,
      breakLateDeduction: 0,
      earlyLeaveDeduction: 0,
      noReportDeduction: 0,
      maxLateAllowed: 0,
      maxBreakLateAllowed: 0,
      maxEarlyLeaveAllowed: 0,
      deductionType: 'percentage',
      perfectAttendanceBonus: 0,
      allReportsBonus: 0,
      isActive: true
    })
    setShowBulkEditModal(true)
  }

  async function handleBulkSave(e) {
    e.preventDefault()
    if (selectedUsers.length === 0) {
      alert('Pilih minimal satu user terlebih dahulu')
      return
    }
    
    setBulkSaving(true)
    try {
      const token = localStorage.getItem('token')
      let successCount = 0
      let errorCount = 0

      for (const userId of selectedUsers) {
        try {
          await axios.post(
            `http://localhost:4000/api/payroll-settings/user/${userId}`,
            form,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          successCount++
        } catch (err) {
          console.error(`Error saving for user ${userId}:`, err)
          errorCount++
        }
      }

      if (successCount > 0) {
        alert(`Pengaturan payroll berhasil disimpan untuk ${successCount} user${successCount > 1 ? '' : ''}${errorCount > 0 ? ` (${errorCount} gagal)` : ''}`)
      } else {
        alert('Gagal menyimpan pengaturan payroll untuk semua user')
      }

      setShowBulkEditModal(false)
      setSelectedUsers([])
      loadPayrollSettings()
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan pengaturan payroll')
    }
    setBulkSaving(false)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Master <span className="gradient-text">Payroll</span> 💰
            </h1>
            <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Kelola pengaturan perhitungan payroll untuk setiap user</p>
          </div>
          <button
            onClick={() => {
              setCalculateForm({ userId: '', month: new Date().toISOString().slice(0, 7) })
              setCalculationResult(null)
              setShowCalculateModal(true)
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-medium"
          >
            Hitung Payroll
          </button>
        </div>
      </div>

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pengaturan Payroll per User</h2>
            {selectedUsers.length > 0 && (
              <p className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedUsers.length} user dipilih
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBulkEdit}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Atur untuk {selectedUsers.length} User
              </button>
            )}
            <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} user</div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left p-4 text-sm font-semibold w-12 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </th>
                  <th className={`text-left p-4 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Nama</th>
                  <th className={`text-left p-4 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Employee ID</th>
                  <th className={`text-left p-4 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Posisi</th>
                  <th className={`text-left p-4 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Gaji Pokok</th>
                  <th className={`text-left p-4 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Status</th>
                  <th className={`text-left p-4 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const setting = getSettingForUser(user.id)
                  const isSelected = selectedUsers.includes(user.id)
                  return (
                    <tr key={user.id} className={`border-b transition-colors ${
                      theme === 'dark' 
                        ? `border-gray-700 hover:bg-gray-700/50 ${isSelected ? 'bg-indigo-900/30' : ''}` 
                        : `border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`
                    }`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(user.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>@{user.username}</div>
                      </td>
                      <td className={`p-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.employeeId || '-'}</td>
                      <td className={`p-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.position || '-'}</td>
                      <td className="p-4">
                        <span className={`font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {user.basicSalary ? `${user.currency || 'IDR'} ${parseFloat(user.basicSalary).toLocaleString('id-ID')}` : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        {setting ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            setting.isActive 
                              ? theme === 'dark' ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800'
                              : theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {setting.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            theme === 'dark' ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Belum Diatur
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <IconEdit />
                          {setting ? 'Edit' : 'Atur'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Pengaturan Payroll: {selectedUser.name}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tipe Deduction *
                  </label>
                  <select
                    required
                    value={form.deductionType}
                    onChange={e => setForm({ ...form, deductionType: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Jumlah Tetap</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className={`border-t pt-4 transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Deduction untuk Pelanggaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Alpha {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.alphaDeduction}
                      onChange={e => setForm({ ...form, alphaDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Izin {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.izinDeduction}
                      onChange={e => setForm({ ...form, izinDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Telat {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.lateDeduction}
                      onChange={e => setForm({ ...form, lateDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Maks Telat Diizinkan
                    </label>
                    <input
                      type="number"
                      value={form.maxLateAllowed}
                      onChange={e => setForm({ ...form, maxLateAllowed: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="0 = semua telat kena deduction"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Istirahat Terlambat {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.breakLateDeduction}
                      onChange={e => setForm({ ...form, breakLateDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Maks Istirahat Terlambat Diizinkan
                    </label>
                    <input
                      type="number"
                      value={form.maxBreakLateAllowed}
                      onChange={e => setForm({ ...form, maxBreakLateAllowed: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="0 = semua kena deduction"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Pulang Cepat {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.earlyLeaveDeduction}
                      onChange={e => setForm({ ...form, earlyLeaveDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Maks Pulang Cepat Diizinkan
                    </label>
                    <input
                      type="number"
                      value={form.maxEarlyLeaveAllowed}
                      onChange={e => setForm({ ...form, maxEarlyLeaveAllowed: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="0 = semua kena deduction"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Tidak Ada Laporan {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.noReportDeduction}
                      onChange={e => setForm({ ...form, noReportDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`border-t pt-4 transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bonus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bonus Absensi Sempurna {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.perfectAttendanceBonus}
                      onChange={e => setForm({ ...form, perfectAttendanceBonus: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Diberikan jika tidak ada alpha, izin, telat, istirahat terlambat, atau pulang cepat
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bonus Semua Laporan {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.allReportsBonus}
                      onChange={e => setForm({ ...form, allReportsBonus: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Diberikan jika semua laporan harian sudah disubmit
                    </p>
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  className={`px-6 py-3 rounded-lg hover:opacity-80 transition-colors font-medium ${
                    theme === 'dark' 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Pengaturan Payroll untuk {selectedUsers.length} User
                </h2>
                <p className={`text-sm mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pengaturan ini akan diterapkan ke semua user yang dipilih
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkEditModal(false)
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleBulkSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tipe Deduction *
                  </label>
                  <select
                    required
                    value={form.deductionType}
                    onChange={e => setForm({ ...form, deductionType: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Jumlah Tetap</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className={`border-t pt-4 transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Deduction untuk Pelanggaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Alpha {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.alphaDeduction}
                      onChange={e => setForm({ ...form, alphaDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Izin {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.izinDeduction}
                      onChange={e => setForm({ ...form, izinDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Telat {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.lateDeduction}
                      onChange={e => setForm({ ...form, lateDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Maks Telat Diizinkan
                    </label>
                    <input
                      type="number"
                      value={form.maxLateAllowed}
                      onChange={e => setForm({ ...form, maxLateAllowed: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="0 = semua telat kena deduction"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Istirahat Terlambat {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.breakLateDeduction}
                      onChange={e => setForm({ ...form, breakLateDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Maks Istirahat Terlambat Diizinkan
                    </label>
                    <input
                      type="number"
                      value={form.maxBreakLateAllowed}
                      onChange={e => setForm({ ...form, maxBreakLateAllowed: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="0 = semua kena deduction"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Pulang Cepat {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.earlyLeaveDeduction}
                      onChange={e => setForm({ ...form, earlyLeaveDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Maks Pulang Cepat Diizinkan
                    </label>
                    <input
                      type="number"
                      value={form.maxEarlyLeaveAllowed}
                      onChange={e => setForm({ ...form, maxEarlyLeaveAllowed: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="0 = semua kena deduction"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deduction Tidak Ada Laporan {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.noReportDeduction}
                      onChange={e => setForm({ ...form, noReportDeduction: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`border-t pt-4 transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bonus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bonus Absensi Sempurna {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.perfectAttendanceBonus}
                      onChange={e => setForm({ ...form, perfectAttendanceBonus: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Diberikan jika tidak ada alpha, izin, telat, istirahat terlambat, atau pulang cepat
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bonus Semua Laporan {form.deductionType === 'percentage' ? '(%)' : '(Jumlah)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.allReportsBonus}
                      onChange={e => setForm({ ...form, allReportsBonus: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Diberikan jika semua laporan harian sudah disubmit
                    </p>
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-4 transition-colors ${
                theme === 'dark' 
                  ? 'bg-blue-900/30 border-blue-700' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                }`}>
                  <strong>Info:</strong> Pengaturan ini akan diterapkan ke {selectedUsers.length} user yang dipilih. 
                  Jika user sudah memiliki pengaturan, pengaturan lama akan diganti dengan pengaturan baru ini.
                </p>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkEditModal(false)
                  }}
                  className={`px-6 py-3 rounded-lg hover:opacity-80 transition-colors font-medium ${
                    theme === 'dark' 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkSaving}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkSaving ? `Menyimpan untuk ${selectedUsers.length} user...` : `Simpan untuk ${selectedUsers.length} User`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculate Modal */}
      {showCalculateModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hitung Payroll</h2>
              <button
                onClick={() => {
                  setShowCalculateModal(false)
                  setCalculationResult(null)
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCalculate} className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Pilih User *</label>
                <select
                  required
                  value={calculateForm.userId}
                  onChange={e => setCalculateForm({ ...calculateForm, userId: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Pilih User...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Bulan *</label>
                <input
                  type="month"
                  required
                  value={calculateForm.month}
                  onChange={e => setCalculateForm({ ...calculateForm, month: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-medium"
              >
                Hitung Payroll
              </button>
            </form>

            {calculationResult && (
              <div className={`border-t pt-4 transition-colors ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hasil Perhitungan</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Gaji Pokok</div>
                      <div className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {calculationResult.currency} {parseFloat(calculationResult.baseSalary).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
                    }`}>
                      <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>Total Deduction</div>
                      <div className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-red-200' : 'text-red-700'}`}>
                        {calculationResult.currency} {parseFloat(calculationResult.deductions).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'
                    }`}>
                      <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>Total Bonus</div>
                      <div className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>
                        {calculationResult.currency} {parseFloat(calculationResult.bonuses).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-50'
                    }`}>
                      <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>Gaji Final</div>
                      <div className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                        {calculationResult.currency} {parseFloat(calculationResult.finalSalary).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h4 className={`font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Detail:</h4>
                    <div className={`text-sm space-y-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div>Hari Kerja: {calculationResult.details.workingDays} hari</div>
                      <div>Alpha: {calculationResult.details.alphaCount} kali</div>
                      <div>Izin: {calculationResult.details.izinCount} kali</div>
                      <div>Telat: {calculationResult.details.lateCount} kali</div>
                      <div>Istirahat Terlambat: {calculationResult.details.breakLateCount} kali</div>
                      <div>Pulang Cepat: {calculationResult.details.earlyLeaveCount} kali</div>
                      <div>Laporan Diharapkan: {calculationResult.details.expectedReports}</div>
                      <div>Laporan Tersubmit: {calculationResult.details.submittedReports}</div>
                      <div>Laporan Hilang: {calculationResult.details.missingReports}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

