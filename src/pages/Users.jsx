import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const IconMore = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

export default function Users(){
  const { theme } = useTheme()
  const [users,setUsers]=useState([])
  const [loading, setLoading] = useState(false)
  const [form,setForm]=useState({ 
    name:'', 
    username:'', 
    password:'', 
    email:'',
    employeeId:'',
    position:'',
    department:'',
    division:'',
    supervisor:'',
    startDate:'',
    employmentStatus:'',
    education:'',
    educationOther:'', // For custom education input when "other" is selected
    institution:'',
    degree:'',
    basicSalary:'',
    currency:'IDR',
    leaveQuota:'12', // Default 12 hari
    leaveQuotaOther:'', // Custom value when leaveQuota is "other"
    role:'user' 
  })
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [userAttendanceStatus, setUserAttendanceStatus] = useState({}) // { userId: { status, checkInStatus, checkIn } }

  useEffect(()=>{ 
    load()
    loadUserAttendanceStatus()
    
    // Refresh attendance status every 30 seconds
    const interval = setInterval(loadUserAttendanceStatus, 30000)
    
    // Listen for custom event to refresh attendance status immediately
    const handleRefreshAttendance = () => {
      loadUserAttendanceStatus()
    }
    window.addEventListener('refreshAttendanceStatus', handleRefreshAttendance)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshAttendanceStatus', handleRefreshAttendance)
    }
  },[])

  async function load(){
    setLoading(true)
    try{ 
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/api/users', { headers: { Authorization: `Bearer ${token}` } })
      setUsers(res.data)
    }catch(err){ 
      console.error(err)
      alert('Gagal memuat data user')
    }
    setLoading(false)
  }

  async function loadUserAttendanceStatus() {
    try {
      const token = localStorage.getItem('token')
      const today = new Date().toISOString().slice(0, 10)
      
      // Get all attendances for today
      const res = await axios.get('http://localhost:4000/api/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Filter for today's attendance and create a map
      const todayAttendances = res.data.filter(a => a.date === today)
      const statusMap = {}
      
      todayAttendances.forEach(att => {
        statusMap[att.userId] = {
          status: att.status,
          checkInStatus: att.checkInStatus,
          checkIn: att.checkIn
        }
      })
      
      setUserAttendanceStatus(statusMap)
    } catch (err) {
      console.error('Error loading user attendance status:', err)
    }
  }

  async function submit(e){
    e.preventDefault();
    setSaving(true)
    try{
      const token = localStorage.getItem('token')
      if (editingUser) {
        // Update existing user - remove password from payload
        const updatePayload = { ...form }
        delete updatePayload.password // Don't send password when editing
        
        // Handle leave quota
        if (updatePayload.leaveQuota === 'other') {
          const customQuota = parseInt(updatePayload.leaveQuotaOther) || 12
          updatePayload.leaveQuota = null // Set to null when using custom
          updatePayload.leaveQuotaOther = customQuota
        } else {
          updatePayload.leaveQuota = parseInt(updatePayload.leaveQuota) || 12
          updatePayload.leaveQuotaOther = null
        }
        
        await axios.put(`http://localhost:4000/api/users/${editingUser.id}`, updatePayload, { headers: { Authorization: `Bearer ${token}` } })
        alert('User berhasil diperbarui')
        setShowEditModal(false)
        setEditingUser(null)
      } else {
        // Create new user - employeeId and startDate will be auto-generated by backend
        const createPayload = { ...form }
        // Remove employeeId and startDate from payload, backend will generate them
        delete createPayload.employeeId
        delete createPayload.startDate
        // If education is "Other", use educationOther value
        if (createPayload.education === 'Other' && createPayload.educationOther) {
          createPayload.education = createPayload.educationOther
        }
        delete createPayload.educationOther // Remove helper field
        
        // Handle leave quota
        if (createPayload.leaveQuota === 'other') {
          const customQuota = parseInt(createPayload.leaveQuotaOther) || 12
          createPayload.leaveQuota = null // Set to null when using custom
          createPayload.leaveQuotaOther = customQuota
        } else {
          createPayload.leaveQuota = parseInt(createPayload.leaveQuota) || 12
          createPayload.leaveQuotaOther = null
        }
        
        await axios.post('http://localhost:4000/api/users', createPayload, { headers: { Authorization: `Bearer ${token}` } })
        alert('User berhasil ditambahkan')
        setShowForm(false)
        load() // Reload users list to show the new user
      }
      setForm({ 
        name:'', 
        username:'', 
        password:'', 
        email:'',
        employeeId:'',
        position:'',
        department:'',
        division:'',
        supervisor:'',
        startDate:'',
        employmentStatus:'',
        education:'',
        educationOther:'',
        institution:'',
        degree:'',
        basicSalary:'',
        currency:'IDR',
        leaveQuota:'12',
        leaveQuotaOther:'',
        role:'user' 
      })
      load()
    }catch(err){ 
      console.error(err)
      alert(err.response?.data?.message || 'Gagal menyimpan user')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(user) {
    setEditingUser(user)
    // Check if education is in the predefined list
    const predefinedEducation = ['Kuliah', 'SMA', 'SMK']
    const education = user.education || ''
    const isOtherEducation = education && !predefinedEducation.includes(education)
    
    setForm({
      name: user.name || '',
      username: user.username || '',
      password: '',
      email: user.email || '',
      employeeId: user.employeeId || '',
      position: user.position || '',
      department: user.department || '',
      division: user.division || '',
      supervisor: user.supervisor || '',
      startDate: user.startDate || '',
      employmentStatus: user.employmentStatus || '',
      education: isOtherEducation ? 'Other' : (education || ''),
      educationOther: isOtherEducation ? education : '',
      institution: user.institution || '',
      degree: user.degree || '',
      basicSalary: user.basicSalary || '',
      currency: user.currency || 'IDR',
      leaveQuota: user.leaveQuotaOther ? 'other' : (user.leaveQuota ? String(user.leaveQuota) : '12'),
      leaveQuotaOther: user.leaveQuotaOther ? String(user.leaveQuotaOther) : '',
      role: user.role || 'user'
    })
    setShowEditModal(true)
  }

  function handleDeleteClick(user) {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:4000/api/users/${userToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } })
      alert('User berhasil dihapus')
      setShowDeleteModal(false)
      setUserToDelete(null)
      load()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Gagal menghapus user')
    }
  }

  return (
    <div>
      <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Master <span className="gradient-text">User</span> 👥
            </h1>
            <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Kelola data diri semua user</p>
          </div>
          <button
            onClick={() => {
              if (!showForm) {
                // Set default values when opening form
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                setForm({
                  name:'', 
                  username:'', 
                  password:'', 
                  email:'',
                  employeeId:'', // Will be auto-generated by backend
                  position:'',
                  department:'',
                  division:'',
                  supervisor:'',
                  startDate: today, // Set to today
                  employmentStatus:'',
                  education:'',
                  educationOther:'',
                  institution:'',
                  degree:'',
                  basicSalary:'',
                  currency:'IDR',
                  role:'user' 
                })
              }
              setShowForm(!showForm)
            }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium"
          >
            {showForm ? 'Tutup Form' : 'Tambah User'}
          </button>
        </div>
      </div>

      {showForm && !showEditModal && (
        <div className={`card-strong mb-6 transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tambah User Baru</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Lengkap *</label>
              <input 
                required 
                type="text"
                placeholder="Nama Lengkap" 
                value={form.name} 
                onChange={e=>setForm({...form,name:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Username *</label>
              <input 
                required 
                type="text"
                placeholder="Username" 
                value={form.username} 
                onChange={e=>setForm({...form,username:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email *</label>
              <input 
                required 
                type="email"
                placeholder="Email" 
                value={form.email} 
                onChange={e=>setForm({...form,email:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  form.email && form.email.includes('@example.com')
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                }`}
              />
              {form.email && form.email.includes('@example.com') && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  ⚠ Email tidak boleh menggunakan domain example.com. Silakan gunakan email yang valid.
                </p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Password *</label>
              <input 
                required 
                type="password"
                placeholder="Password" 
                value={form.password} 
                onChange={e=>setForm({...form,password:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Employee ID 
                <span className={`text-xs ml-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>(Otomatis di-generate)</span>
              </label>
              <input 
                type="text"
                placeholder="Akan di-generate otomatis" 
                value="Akan di-generate otomatis" 
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Posisi *</label>
              <select 
                required
                value={form.position} 
                onChange={e=>setForm({...form,position:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Pilih Posisi...</option>
                <option value="Head">Head</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
              <input 
                type="text"
                placeholder="Department" 
                value={form.department} 
                onChange={e=>setForm({...form,department:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Tanggal Mulai 
                <span className={`text-xs ml-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>(Otomatis: hari ini)</span>
              </label>
              <input 
                type="date"
                value={form.startDate} 
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Karyawan *</label>
              <select 
                required
                value={form.employmentStatus} 
                onChange={e=>setForm({...form,employmentStatus:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Pilih...</option>
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Magang">Magang</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Pendidikan Terakhir *</label>
              <select 
                required
                value={form.education} 
                onChange={e=>setForm({...form,education:e.target.value,educationOther:''})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Pilih Pendidikan...</option>
                <option value="Kuliah">Kuliah</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
                <option value="Other">Other</option>
              </select>
              {form.education === 'Other' && (
                <input 
                  required
                  type="text"
                  placeholder="Masukkan pendidikan lainnya" 
                  value={form.educationOther} 
                  onChange={e=>setForm({...form,educationOther:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mt-2 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Institusi *</label>
              <input 
                required
                type="text"
                placeholder="Institusi" 
                value={form.institution} 
                onChange={e=>setForm({...form,institution:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Gelar *</label>
              <select 
                required
                value={form.degree} 
                onChange={e=>setForm({...form,degree:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Pilih Gelar...</option>
                <option value="D1">D1</option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
              </select>
            </div>
            
            {/* Salary Section */}
            <div className={`md:col-span-2 border-t pt-4 mt-2 transition-colors ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Informasi Gaji</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Mata Uang *</label>
                  <select 
                    required
                    value={form.currency} 
                    onChange={e=>setForm({...form,currency:e.target.value})} 
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="IDR">IDR (Rupiah)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Gaji Pokok</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Masukkan gaji pokok"
                    value={form.basicSalary} 
                    onChange={e=>setForm({...form,basicSalary:e.target.value})} 
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jatah Cuti *</label>
                  <select
                    value={form.leaveQuota}
                    onChange={e => setForm({ ...form, leaveQuota: e.target.value, leaveQuotaOther: e.target.value === 'other' ? form.leaveQuotaOther : '' })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="12">12 Hari</option>
                    <option value="24">24 Hari</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                </div>
                {form.leaveQuota === 'other' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jatah Cuti Custom (Hari) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Masukkan jumlah hari"
                      value={form.leaveQuotaOther}
                      onChange={e => setForm({ ...form, leaveQuotaOther: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                      required={form.leaveQuota === 'other'}
                    />
                  </div>
                )}
              </div>
      </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role *</label>
              <select 
                value={form.role} 
                onChange={e=>setForm({...form,role:e.target.value})} 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => {
                  setShowForm(false)
      setForm({ 
        name:'', 
        username:'', 
        password:'', 
        email:'',
        employeeId:'',
        position:'',
        department:'',
        division:'',
        supervisor:'',
        startDate:'',
        employmentStatus:'',
        education:'',
        educationOther:'',
        institution:'',
        degree:'',
        basicSalary:'',
        currency:'IDR',
        leaveQuota:'12',
        leaveQuotaOther:'',
        role:'user' 
      })
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
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium"
              >
                Tambah User
              </button>
          </div>
        </form>
      </div>
      )}

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Data Semua User</h2>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} user</div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada user</p>
              </div>
            )}
        {users.map(u=> (
              <div key={u.id} className={`card transition-colors relative group ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 hover:border-purple-500' 
                  : 'bg-white border-gray-200 hover:border-indigo-300'
              }`}>
                {/* Action Menu Button */}
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button
                      onClick={() => {
                        const menu = document.getElementById(`menu-${u.id}`)
                        if (menu) {
                          menu.classList.toggle('hidden')
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-600 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <IconMore />
                    </button>
                    <div
                      id={`menu-${u.id}`}
                      className={`hidden absolute right-0 mt-2 w-40 rounded-lg shadow-lg border py-1 z-10 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          document.getElementById(`menu-${u.id}`)?.classList.add('hidden')
                          handleEdit(u)
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                          theme === 'dark' 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IconEdit />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          document.getElementById(`menu-${u.id}`)?.classList.add('hidden')
                          handleDeleteClick(u)
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                          theme === 'dark' 
                            ? 'text-red-400 hover:bg-gray-700' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <IconTrash />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-semibold text-lg transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.name}</div>
                      {/* Attendance Status Indicator - Top Right */}
                      {userAttendanceStatus[u.id] && (() => {
                        const attStatus = userAttendanceStatus[u.id]
                        if (attStatus.status === 'Hadir' && attStatus.checkIn) {
                          // Show check-in status
                          if (attStatus.checkInStatus === 'early') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                                ⏰ Early
                              </span>
                            )
                          } else if (attStatus.checkInStatus === 'onTime') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                                ✓ On Time
                              </span>
                            )
                          } else if (attStatus.checkInStatus === 'almostLate') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                ⚠ Almost Late
                              </span>
                            )
                          } else if (attStatus.checkInStatus === 'late') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                                ✗ Late
                              </span>
                            )
                          } else {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                                ✓ Hadir
                              </span>
                            )
                          }
                        } else if (attStatus.status === 'Izin') {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                              📝 Izin
                            </span>
                          )
                        } else if (attStatus.status === 'Sakit') {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                              🏥 Sakit
                            </span>
                          )
                        } else if (attStatus.status === 'Alfa') {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                              ❌ Alfa
                            </span>
                          )
                        } else {
                          // Belum absen (status Hadir tapi belum check in)
                          return (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                              ⏳ Belum Absen
                            </span>
                          )
                        }
                      })()}
                    </div>
                    <div className={`text-sm mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div>@{u.username}</div>
                      <div className={`font-medium ${u.email && u.email.includes('@example.com') ? 'text-red-500' : ''}`}>
                        {u.email || 'Email tidak tersedia'}
                        {u.email && u.email.includes('@example.com') && (
                          <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">⚠ Perlu diupdate</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                      {u.employmentStatus && (
                        <span className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-300' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.employmentStatus}
                        </span>
                      )}
                    </div>
                  </div>
              </div>
                <div className={`space-y-1 text-sm border-t pt-3 transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 border-gray-600' 
                    : 'text-gray-600 border-gray-200'
                }`}>
                  {u.employeeId && <div><span className="font-medium">Employee ID:</span> {u.employeeId}</div>}
                  {u.position && <div><span className="font-medium">Posisi:</span> {u.position}</div>}
                  {u.department && <div><span className="font-medium">Department:</span> {u.department}</div>}
                  {u.phone && <div><span className="font-medium">Phone:</span> {u.phone}</div>}
                  {u.startDate && <div><span className="font-medium">Mulai:</span> {new Date(u.startDate).toLocaleDateString('id-ID')}</div>}
            </div>
          </div>
        ))}
      </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Edit User: {editingUser?.name}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                  setForm({ 
                    name:'', 
                    username:'', 
                    password:'', 
                    email:'',
                    employeeId:'',
                    position:'',
                    department:'',
                    division:'',
                    supervisor:'',
                    startDate:'',
                    employmentStatus:'',
                    education:'',
                    educationOther:'',
                    institution:'',
                    degree:'',
                    basicSalary:'',
                    currency:'IDR',
                    role:'user' 
                  })
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Lengkap *</label>
                <input 
                  required 
                  type="text"
                  placeholder="Nama Lengkap" 
                  value={form.name} 
                  onChange={e=>setForm({...form,name:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Username *</label>
                <input 
                  required 
                  type="text"
                  placeholder="Username" 
                  value={form.username} 
                  onChange={e=>setForm({...form,username:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email *</label>
                <input 
                  required 
                  type="email"
                  placeholder="Email" 
                  value={form.email} 
                  onChange={e=>setForm({...form,email:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    form.email && form.email.includes('@example.com')
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                  }`}
                />
                {form.email && form.email.includes('@example.com') && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    ⚠ Email tidak boleh menggunakan domain example.com. Silakan gunakan email yang valid.
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Employee ID *</label>
                <input 
                  required 
                  type="text"
                  placeholder="Employee ID" 
                  value={form.employeeId} 
                  onChange={e=>setForm({...form,employeeId:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Posisi *</label>
                <select 
                  required
                  value={form.position} 
                  onChange={e=>setForm({...form,position:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Pilih Posisi...</option>
                  <option value="Head">Head</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
                <input 
                  type="text"
                  placeholder="Department" 
                  value={form.department} 
                  onChange={e=>setForm({...form,department:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Divisi</label>
                <input 
                  type="text"
                  placeholder="Divisi" 
                  value={form.division} 
                  onChange={e=>setForm({...form,division:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Supervisor</label>
                <input 
                  type="text"
                  placeholder="Supervisor" 
                  value={form.supervisor} 
                  onChange={e=>setForm({...form,supervisor:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal Mulai *</label>
                <input 
                  required 
                  type="date"
                  value={form.startDate} 
                  onChange={e=>setForm({...form,startDate:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Karyawan *</label>
                <select 
                  required
                  value={form.employmentStatus} 
                  onChange={e=>setForm({...form,employmentStatus:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Pilih...</option>
                  <option value="Tetap">Tetap</option>
                  <option value="Kontrak">Kontrak</option>
                  <option value="Magang">Magang</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Pendidikan Terakhir *</label>
                <select 
                  required
                  value={form.education} 
                  onChange={e=>setForm({...form,education:e.target.value,educationOther:''})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Pilih Pendidikan...</option>
                  <option value="Kuliah">Kuliah</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                  <option value="Other">Other</option>
                </select>
                {form.education === 'Other' && (
                  <input 
                    required
                    type="text"
                    placeholder="Masukkan pendidikan lainnya" 
                    value={form.educationOther} 
                    onChange={e=>setForm({...form,educationOther:e.target.value})} 
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mt-2 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Institusi *</label>
                <input 
                  required
                  type="text"
                  placeholder="Institusi" 
                  value={form.institution} 
                  onChange={e=>setForm({...form,institution:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Gelar *</label>
                <select 
                  required
                  value={form.degree} 
                  onChange={e=>setForm({...form,degree:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Pilih Gelar...</option>
                  <option value="D1">D1</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
              </div>
              
              {/* Salary Section */}
              <div className={`md:col-span-2 border-t pt-4 mt-2 transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Informasi Gaji</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Mata Uang *</label>
                    <select 
                      required
                      value={form.currency} 
                      onChange={e=>setForm({...form,currency:e.target.value})} 
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="IDR">IDR (Rupiah)</option>
                      <option value="USD">USD (Dollar)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Gaji Pokok</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Masukkan gaji pokok"
                      value={form.basicSalary} 
                      onChange={e=>setForm({...form,basicSalary:e.target.value})} 
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jatah Cuti *</label>
                    <select
                      value={form.leaveQuota}
                      onChange={e => setForm({ ...form, leaveQuota: e.target.value, leaveQuotaOther: e.target.value === 'other' ? form.leaveQuotaOther : '' })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="12">12 Hari</option>
                      <option value="24">24 Hari</option>
                      <option value="other">Other (Custom)</option>
                    </select>
                  </div>
                  {form.leaveQuota === 'other' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jatah Cuti Custom (Hari) *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Masukkan jumlah hari"
                        value={form.leaveQuotaOther}
                        onChange={e => setForm({ ...form, leaveQuotaOther: e.target.value })}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300'
                        }`}
                        required={form.leaveQuota === 'other'}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role *</label>
                <select 
                  value={form.role} 
                  onChange={e=>setForm({...form,role:e.target.value})} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                    setForm({ 
                      name:'', 
                      username:'', 
                      password:'', 
                      email:'',
                      employeeId:'',
                      position:'',
                      department:'',
                      division:'',
                      supervisor:'',
                      startDate:'',
                      employmentStatus:'',
                      education:'',
                      educationOther:'',
                      institution:'',
                      degree:'',
                      basicSalary:'',
                      currency:'IDR',
                      role:'user' 
                    })
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
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-md w-full transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hapus User</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className={`mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Apakah Anda yakin ingin menghapus user <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userToDelete?.name}</span>?
              </p>
              <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
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
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
      </div>
      )}
    </div>
  )
}
