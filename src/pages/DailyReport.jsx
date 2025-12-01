import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function DailyReport() {
  const { theme } = useTheme()
  const [reports, setReports] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [content, setContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editReason, setEditReason] = useState('')
  const [file, setFile] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [editFilePreview, setEditFilePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/daily-reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReports(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file type
      const fileType = selectedFile.type
      const isImage = fileType.startsWith('image/')
      const isPDF = fileType === 'application/pdf'
      
      if (!isImage && !isPDF) {
        alert('File harus berupa gambar atau PDF')
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }

      setFile(selectedFile)
      
      // Create preview for images
      if (isImage) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setFilePreview(null)
      }
    }
  }

  function removeFile() {
    setFile(null)
    setFilePreview(null)
  }

  function handleEditFileChange(e) {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const fileType = selectedFile.type
      const isImage = fileType.startsWith('image/')
      const isPDF = fileType === 'application/pdf'
      
      if (!isImage && !isPDF) {
        alert('File harus berupa gambar atau PDF')
        return
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }

      setEditFile(selectedFile)
      
      if (isImage) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setEditFilePreview(reader.result)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setEditFilePreview(null)
      }
    }
  }

  function removeEditFile() {
    setEditFile(null)
    setEditFilePreview(null)
  }

  function openEditModal(report) {
    setSelectedReport(report)
    setEditContent(report.content)
    setEditReason('')
    setEditFile(null)
    setEditFilePreview(null)
    setShowEditModal(true)
  }

  async function submitEditRequest() {
    if (!editContent.trim()) {
      alert('Isi laporan tidak boleh kosong')
      return
    }

    if (!editReason.trim()) {
      alert('Alasan edit wajib diisi')
      return
    }

    setEditLoading(true)
    try {
      const token = localStorage.getItem('token')
      const payload = {
        dailyReportId: selectedReport.id,
        newContent: editContent.trim(),
        reason: editReason.trim()
      }

      if (editFile) {
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result
          payload.file = base64

          try {
            await axios.post('http://localhost:4000/api/daily-report-edit-requests', payload, {
              headers: { Authorization: `Bearer ${token}` }
            })
            setShowEditModal(false)
            setSelectedReport(null)
            setEditContent('')
            setEditReason('')
            setEditFile(null)
            setEditFilePreview(null)
            await load()
            alert('Request edit berhasil dikirim')
          } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengirim request edit')
          } finally {
            setEditLoading(false)
          }
        }
        reader.readAsDataURL(editFile)
      } else {
        try {
          await axios.post('http://localhost:4000/api/daily-report-edit-requests', payload, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setShowEditModal(false)
          setSelectedReport(null)
          setEditContent('')
          setEditReason('')
          setEditFile(null)
          setEditFilePreview(null)
          await load()
          alert('Request edit berhasil dikirim')
        } catch (err) {
          alert(err.response?.data?.message || 'Gagal mengirim request edit')
        } finally {
          setEditLoading(false)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim request edit')
      setEditLoading(false)
    }
  }

  async function submit() {
    if (!content.trim()) {
      alert('Isi laporan tidak boleh kosong')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const payload = {
        content: content.trim(),
        date
      }

      // Convert file to base64 if provided
      if (file) {
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result
          payload.file = base64

          try {
            await axios.post('http://localhost:4000/api/daily-reports', payload, {
              headers: { Authorization: `Bearer ${token}` }
            })
            setContent('')
            setFile(null)
            setFilePreview(null)
            setShowModal(false)
            await load()
            alert('Laporan berhasil dikirim')
          } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengirim laporan')
          } finally {
            setLoading(false)
          }
        }
        reader.readAsDataURL(file)
      } else {
        try {
          await axios.post('http://localhost:4000/api/daily-reports', payload, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setContent('')
          setFile(null)
          setFilePreview(null)
          setShowModal(false)
          await load()
          alert('Laporan berhasil dikirim')
        } catch (err) {
          alert(err.response?.data?.message || 'Gagal mengirim laporan')
        } finally {
          setLoading(false)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim laporan')
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Laporan <span className="gradient-text">Harian</span> 📝
          </h1>
          <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tulis laporan harian tentang pekerjaan yang telah Anda lakukan</p>
        </div>
        <div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Tulis Laporan
          </button>
        </div>
      </div>

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Riwayat Laporan</h3>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total: {reports.length}</div>
        </div>

        <div className="space-y-4">
          {reports.length === 0 && (
            <div className="text-center py-12">
              <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada laporan</p>
            </div>
          )}
          {reports.map(report => (
            <div key={report.id} className={`border rounded-lg p-4 shadow-sm transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className={`font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(report.date)}
                  </div>
                  <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Dikirim pada {formatTime(report.submittedAt)}
                    {report.isLate && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        theme === 'dark' 
                          ? 'bg-red-900/30 text-red-200' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Terlambat
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-sm rounded-lg p-3 border whitespace-pre-wrap mb-3 transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-300 bg-gray-600 border-gray-500' 
                  : 'text-gray-700 bg-gray-50 border-gray-200'
              }`}>
                {report.content}
              </div>
              {report.filePath && (
                <div className="mt-3">
                  {report.fileType === 'image' ? (
                    <img 
                      src={`http://localhost:4000${report.filePath}`} 
                      alt="Lampiran" 
                      className={`max-w-full h-auto rounded-lg border transition-colors ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    />
                  ) : (
                    <a 
                      href={`http://localhost:4000${report.filePath}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' 
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Lihat PDF: {report.fileName}</span>
                    </a>
                  )}
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => openEditModal(report)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    theme === 'dark' 
                      ? 'bg-yellow-900/30 text-yellow-200 hover:bg-yellow-900/50' 
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Request Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tulis Laporan Harian</h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setContent('')
                  setFile(null)
                  setFilePreview(null)
                }} 
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Laporan
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Isi Laporan <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Tuliskan hal-hal yang telah Anda kerjakan hari ini..."
                  rows={8}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lampiran (Gambar atau PDF) <span className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>(Opsional)</span>
                </label>
                {filePreview ? (
                  <div className="relative">
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className={`max-w-full h-auto rounded-lg border mb-2 transition-colors ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    />
                    <button
                      onClick={removeFile}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Hapus File
                    </button>
                  </div>
                ) : file ? (
                  <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <svg className={`w-5 h-5 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className={`flex-1 text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{file.name}</span>
                    <button
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <div className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      theme === 'dark' 
                        ? 'border-gray-600 hover:border-indigo-500' 
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}>
                      <div className="text-center">
                        <svg className={`w-8 h-8 mx-auto mb-2 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Klik untuk upload file</p>
                        <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Gambar atau PDF (Maks. 5MB)</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowModal(false)
                  setContent('')
                  setFile(null)
                  setFilePreview(null)
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
                onClick={submit} 
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedReport && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Request Edit Laporan</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedReport(null)
                  setEditContent('')
                  setEditReason('')
                  setEditFile(null)
                  setEditFilePreview(null)
                }} 
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Alasan Edit <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={editReason} 
                  onChange={e => setEditReason(e.target.value)} 
                  placeholder="Jelaskan alasan mengapa Anda ingin mengedit laporan ini..."
                  rows={3}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Konten Baru <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={editContent} 
                  onChange={e => setEditContent(e.target.value)} 
                  placeholder="Tuliskan konten laporan yang baru..."
                  rows={8}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  File Baru (Gambar atau PDF) <span className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>(Opsional)</span>
                </label>
                {editFilePreview ? (
                  <div className="relative">
                    <img 
                      src={editFilePreview} 
                      alt="Preview" 
                      className={`max-w-full h-auto rounded-lg border mb-2 transition-colors ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    />
                    <button
                      onClick={removeEditFile}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Hapus File
                    </button>
                  </div>
                ) : editFile ? (
                  <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <svg className={`w-5 h-5 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className={`flex-1 text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{editFile.name}</span>
                    <button
                      onClick={removeEditFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <div className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      theme === 'dark' 
                        ? 'border-gray-600 hover:border-indigo-500' 
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}>
                      <div className="text-center">
                        <svg className={`w-8 h-8 mx-auto mb-2 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Klik untuk upload file baru</p>
                        <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Gambar atau PDF (Maks. 5MB)</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={handleEditFileChange} 
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedReport(null)
                  setEditContent('')
                  setEditReason('')
                  setEditFile(null)
                  setEditFilePreview(null)
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
                onClick={submitEditRequest} 
                disabled={editLoading}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? 'Mengirim...' : 'Kirim Request Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

