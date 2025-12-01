import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function Profile() {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  })
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    nationality: 'Indonesia'
  })
  
  // Store read-only data for display
  const [readOnlyData, setReadOnlyData] = useState({
    employeeId: '',
    position: '',
    department: '',
    division: '',
    supervisor: '',
    employmentStatus: '',
    education: '',
    institution: '',
    degree: ''
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Token tidak ditemukan. Silakan login kembali.')
        return
      }
      
      const res = await axios.get('http://localhost:4000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const user = res.data
      
      if (!user) {
        alert('Data user tidak ditemukan')
        return
      }
      
      // Set editable personal data
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate || '',
        gender: user.gender || '',
        maritalStatus: user.maritalStatus || '',
        nationality: user.nationality || 'Indonesia',
        password: '',
        confirmPassword: ''
      })
      
      // Set read-only work and education data
      setReadOnlyData({
        employeeId: user.employeeId || '',
        position: user.position || '',
        department: user.department || '',
        division: user.division || '',
        supervisor: user.supervisor || '',
        employmentStatus: user.employmentStatus || '',
        education: user.education || '',
        institution: user.institution || '',
        degree: user.degree || ''
      })
      
      // Set profile picture
      if (user.profilePicture) {
        setProfilePicturePreview(`http://localhost:4000${user.profilePicture}`)
        setProfilePicture(null) // Reset upload state
      } else {
        setProfilePicturePreview(null)
        setProfilePicture(null)
      }
      
      // Update localStorage user data
      const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...user }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (err) {
      console.error('Error loading profile:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memuat data profile'
      alert(`Error: ${errorMessage}`)
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  function handleProfilePictureChange(e) {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result)
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeProfilePicture() {
    setProfilePicture('')
    setProfilePicturePreview(null)
  }

  async function submit(e) {
    e.preventDefault()

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Token tidak ditemukan. Silakan login kembali.')
        window.location.href = '/login'
        setSaving(false)
        return
      }
      
      const payload = { ...form }
      
      // Add profile picture if uploaded
      if (profilePicture) {
        payload.profilePicture = profilePicture
      } else if (profilePicture === '' && !profilePicturePreview) {
        // User wants to remove profile picture
        payload.profilePicture = null
      }

      console.log('Sending PUT request to /api/users/me')
      const res = await axios.put('http://localhost:4000/api/users/me', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Update profile picture preview if updated
      if (res.data.profilePicture) {
        setProfilePicturePreview(`http://localhost:4000${res.data.profilePicture}`)
      } else {
        setProfilePicturePreview(null)
      }
      setProfilePicture(null) // Reset upload state
      
      // Update localStorage
      const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...res.data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      alert('Profile berhasil diperbarui')
      // Refresh page setelah save
      window.location.reload()
    } catch (err) {
      console.error('Error updating profile:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui profile'
      
      // Check if token is missing or invalid
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Token tidak ditemukan. Silakan login kembali.')
        window.location.href = '/login'
        return
      }
      
      alert(`Error: ${errorMessage}`)
      
      // If unauthorized or forbidden, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Token invalid or expired, redirecting to login')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className={`ml-3 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Memuat data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <span className="gradient-text">Profile</span> Saya 👤
        </h1>
        <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Kelola informasi pribadi dan data diri Anda</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Profile Picture */}
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Foto Profile</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profilePicturePreview ? (
                <img 
                  src={profilePicturePreview} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-indigo-200 shadow-lg">
                  {(form.name || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <label className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer font-medium">
                  {profilePicturePreview ? 'Ganti Foto' : 'Upload Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
                {profilePicturePreview && (
                  <button
                    type="button"
                    onClick={removeProfilePicture}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
              <p className={`text-sm mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Format: JPG, PNG, GIF (Maks. 5MB)</p>
            </div>
          </div>
        </div>

        {/* Data Pribadi */}
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Data Pribadi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nama Lengkap *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>No. Telepon</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal Lahir</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={e => setForm({ ...form, birthDate: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Jenis Kelamin</label>
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Pernikahan</label>
              <select
                value={form.maritalStatus}
                onChange={e => setForm({ ...form, maritalStatus: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Pilih...</option>
                <option value="Belum Menikah">Belum Menikah</option>
                <option value="Menikah">Menikah</option>
                <option value="Cerai">Cerai</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Alamat</label>
              <textarea
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kewarganegaraan</label>
              <input
                type="text"
                value={form.nationality}
                onChange={e => setForm({ ...form, nationality: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Data Pekerjaan (Read-Only) */}
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Data Pekerjaan</h2>
            <span className={`text-xs px-3 py-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'text-yellow-200 bg-yellow-900/30' 
                : 'text-gray-500 bg-yellow-100'
            }`}>Hanya Admin yang dapat mengubah</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Employee ID</label>
              <input
                type="text"
                value={readOnlyData.employeeId}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Posisi</label>
              <input
                type="text"
                value={readOnlyData.position}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
              <input
                type="text"
                value={readOnlyData.department || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Divisi</label>
              <input
                type="text"
                value={readOnlyData.division || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Supervisor</label>
              <input
                type="text"
                value={readOnlyData.supervisor || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Karyawan</label>
              <input
                type="text"
                value={readOnlyData.employmentStatus || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Pendidikan (Read-Only) */}
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Data Pendidikan</h2>
            <span className={`text-xs px-3 py-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'text-yellow-200 bg-yellow-900/30' 
                : 'text-gray-500 bg-yellow-100'
            }`}>Hanya Admin yang dapat mengubah</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Pendidikan Terakhir</label>
              <input
                type="text"
                value={readOnlyData.education || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Institusi</label>
              <input
                type="text"
                value={readOnlyData.institution || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Gelar</label>
              <input
                type="text"
                value={readOnlyData.degree || '-'}
                disabled
                className={`w-full p-3 border rounded-lg cursor-not-allowed transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Ubah Password Button */}
        <div className={`card-strong transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ubah Password</h2>
              <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ganti password akun Anda</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium"
            >
              Ubah Password
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={load}
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-xl shadow-2xl p-6 max-w-md w-full transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ubah Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordForm({ password: '', confirmPassword: '' })
                }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (passwordForm.password !== passwordForm.confirmPassword) {
                alert('Password dan konfirmasi password tidak cocok')
                return
              }
              if (!passwordForm.password || passwordForm.password.length < 6) {
                alert('Password minimal 6 karakter')
                return
              }
              
              setSaving(true)
              try {
                const token = localStorage.getItem('token')
                if (!token) {
                  alert('Token tidak ditemukan. Silakan login kembali.')
                  window.location.href = '/login'
                  return
                }
                
                const res = await axios.put('http://localhost:4000/api/users/me', {
                  password: passwordForm.password
                }, {
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                
                alert('Password berhasil diubah')
                setShowPasswordModal(false)
                setPasswordForm({ password: '', confirmPassword: '' })
                // Refresh page setelah ubah password
                window.location.reload()
              } catch (err) {
                console.error('Error updating password:', err)
                const errorMessage = err.response?.data?.message || err.message || 'Gagal mengubah password'
                alert(`Error: ${errorMessage}`)
                
                if (err.response?.status === 401 || err.response?.status === 403) {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  window.location.href = '/login'
                }
              } finally {
                setSaving(false)
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Password Baru</label>
                  <input
                    required
                    type="password"
                    value={passwordForm.password}
                    onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Konfirmasi Password</label>
                  <input
                    required
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="Konfirmasi password baru"
                  />
                </div>
                <p className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Password minimal 6 karakter</p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ password: '', confirmPassword: '' })
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
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

