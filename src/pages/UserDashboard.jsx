import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'

export default function UserDashboard(){
  const { theme } = useTheme()
  const [attendance, setAttendance] = useState([])
  const [summary, setSummary] = useState({ hadir:0, izin:0, sakit:0, alfa:0 })
  const [today, setToday] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraAction, setCameraAction] = useState(null)
  const videoRef = React.useRef(null)
  const [stream, setStream] = useState(null)

  useEffect(()=>{ load() },[])

  async function load(){
    try{
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/attendances/me', { headers: { Authorization: `Bearer ${token}` } })
      const list = res.data
      setAttendance(list.reverse())
      setSummary({
        hadir: list.filter(x=>x.status==='Hadir').length,
        izin: list.filter(x=>x.status==='Izin').length,
        sakit: list.filter(x=>x.status==='Sakit').length,
        alfa: list.filter(x=>x.status==='Alfa').length,
      })
      // determine today's record
      const todayDate = new Date().toISOString().slice(0,10)
      const todays = list.find(x=> x.date === todayDate)
      setToday(todays || null)
    }catch(err){ console.error(err) }
  }

  function displayStatus(record){
    if (!record) return 'Belum';
    if (record.breakEnd){
      try{
        const be = new Date(record.breakEnd)
        if (be > new Date()) return 'Istirahat'
      }catch(e){}
    }
    return record.status || 'Hadir'
  }

  // open camera when starting attendance flow
  async function openCameraFor(action){
    setCameraAction(action)
    try{
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setStream(s)
      setCameraOpen(true)
    }catch(err){
      alert('Camera access denied or not available')
      console.error(err)
    }
  }

  async function performAction(action, photo){
    try{
      const token = localStorage.getItem('token')
      const body = { action }
      if (photo) body.photo = photo
      const res = await axios.post('http://localhost:4000/api/attendances/action', body, { headers: { Authorization: `Bearer ${token}` } })
      await load()
      setCameraOpen(false)
      if (stream){
        stream.getTracks().forEach(t=>t.stop())
        setStream(null)
      }
      setCameraAction(null)
      // Trigger refresh attendance status in other pages
      window.dispatchEvent(new Event('refreshAttendanceStatus'))
      return res.data
    }catch(err){
      alert(err.response?.data?.message || 'Action failed')
      console.error(err)
    }
  }

  // capture photo from video element
  async function captureAndSend(videoEl){
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth || 640
    canvas.height = videoEl.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    // Only check-in and check-out require photos, break does not
    const photo = (cameraAction === 'checkin' || cameraAction === 'checkout') ? dataUrl : null
    await performAction(cameraAction, photo)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : ''}`}>
          Hi, <span style={{ background: 'linear-gradient(135deg, #26355D 0%, #AF47D2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{JSON.parse(localStorage.getItem('user')||'{}').name || 'User'}</span> 👋
        </h1>
        <p className="transition-colors" style={{ color: '#AF47D2' }}>Ringkasan absensi pribadi Anda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`card-strong group cursor-pointer hover:scale-105 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{summary.hadir}</div>
              <div className="text-sm font-semibold text-green-600">Hadir</div>
            </div>
          </div>
          <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total kehadiran bulan ini</div>
        </div>
        
        <div className={`card-strong group cursor-pointer hover:scale-105 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{summary.izin}</div>
              <div className="text-sm font-semibold text-yellow-600">Izin</div>
            </div>
          </div>
          <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total izin bulan ini</div>
        </div>
        
        <div className={`card-strong group cursor-pointer hover:scale-105 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{summary.sakit}</div>
              <div className="text-sm font-semibold text-rose-600">Sakit</div>
            </div>
          </div>
          <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total sakit bulan ini</div>
        </div>
        
        <div className={`card-strong group cursor-pointer hover:scale-105 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{summary.alfa}</div>
              <div className="text-sm font-semibold text-slate-600">Alfa</div>
            </div>
          </div>
          <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total alfa bulan ini</div>
        </div>
      </div>

      <div className={`card-strong mb-6 border-2 shadow-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : ''
      }`} style={theme === 'light' ? { background: 'linear-gradient(135deg, rgba(38, 53, 93, 0.1) 0%, rgba(175, 71, 210, 0.1) 100%)', borderColor: 'rgba(175, 71, 210, 0.3)' } : { borderColor: 'rgba(175, 71, 210, 0.3)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className={`text-xl font-bold mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Absensi Hari Ini</h2>
            <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {today ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>CheckIn: {today.checkIn || '-'}</span>
                    {today.breakStart && <span>•</span>}
                    <span>Break: {today.breakStart || '-'} - {today.breakEnd || '-'}</span>
                    {today.checkOut && <span>•</span>}
                    <span>CheckOut: {today.checkOut || '-'}</span>
                  </div>
                  {/* Show status badges */}
                  {!today.checkIn && today.status !== 'Izin' && today.status !== 'Sakit' && today.status !== 'Alfa' && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                        Belum Absen
                      </span>
                    </div>
                  )}
                  {today.status === 'Izin' && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-400">
                        Izin
                      </span>
                    </div>
                  )}
                  {today.status === 'Sakit' && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-400">
                        Sakit
                      </span>
                    </div>
                  )}
                  {today.status === 'Alfa' && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-400">
                        Alfa
                      </span>
                    </div>
                  )}
                  {today.status === 'Hadir' && today.checkIn && today.checkInStatus && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          today.checkInStatus === 'early'
                            ? 'bg-blue-100 text-blue-800 border border-blue-400'
                            : today.checkInStatus === 'onTime'
                            ? 'bg-green-100 text-green-800 border border-green-400'
                            : today.checkInStatus === 'almostLate'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-400'
                            : 'bg-red-100 text-red-800 border border-red-400'
                        }`}
                      >
                        {today.checkInStatus === 'early' ? '⏰ Come Early' : today.checkInStatus === 'onTime' ? '✓ On Time' : today.checkInStatus === 'almostLate' ? '⚠ Almost Late' : '✗ Late'}
                      </span>
                      {today.breakLate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                          ⏰ Break Late
                        </span>
                      )}
                      {today.earlyLeave && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                          🏃 Early Leave
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <span>Belum melakukan absensi hari ini</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-end lg:flex-shrink-0">
            {/* Single take attendance button with dynamic label */}
            {(() => {
              // determine next action
              // Show check in button if no today record OR if today record exists but no check in yet
              if (!today || (today && !today.checkIn)) return (
                <button 
                  onClick={() => openCameraFor('checkin')} 
                  className="text-lg font-bold px-8 py-4 lg:text-base lg:px-6 lg:py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 animate-pulse text-white rounded-xl w-full lg:w-auto"
                  style={{ background: 'linear-gradient(135deg, #26355D 0%, #AF47D2 100%)' }}
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Check In
                </button>
              )
              if (today && today.checkIn && !today.breakStart) return (
                <button 
                  onClick={async () => { await performAction('break'); }} 
                  className="btn btn-primary text-lg font-semibold px-7 py-3 lg:text-base lg:px-5 lg:py-2.5 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full lg:w-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mulai Istirahat
                </button>
              )
              if (today && today.checkIn && today.breakStart && !today.breakEnd) return (
                <>
                  <button 
                    onClick={async () => { await performAction('break'); }} 
                    className="btn btn-primary text-lg font-semibold px-7 py-3 lg:text-base lg:px-5 lg:py-2.5 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full lg:w-auto"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selesai Istirahat
                  </button>
                  {!today.checkOut && (
                    <button 
                      onClick={() => openCameraFor('checkout')} 
                      className="btn btn-primary text-lg font-semibold px-7 py-3 lg:text-base lg:px-5 lg:py-2.5 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 opacity-50 cursor-not-allowed w-full lg:w-auto" 
                      disabled
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Check Out (Selesaikan Istirahat Dulu)
                    </button>
                  )}
                </>
              )
              if (today && today.checkIn && today.breakStart && today.breakEnd && !today.checkOut) return (
                <button 
                  onClick={() => openCameraFor('checkout')} 
                  className="text-lg font-bold px-8 py-4 lg:text-base lg:px-6 lg:py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white rounded-xl w-full lg:w-auto"
                  style={{ background: 'linear-gradient(135deg, #AF47D2 0%, #8B3DB8 100%)' }}
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Check Out
                </button>
              )
              return (
                <button 
                  disabled 
                  className="btn btn-ghost opacity-50 cursor-not-allowed text-lg font-semibold px-7 py-3 lg:text-base lg:px-5 lg:py-2.5 w-full lg:w-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selesai
                </button>
              )
            })()}
          </div>
        </div>
      </div>

      {cameraOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${
          theme === 'dark' ? 'bg-black/90' : 'bg-black/80'
        }`}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-4" style={{ background: 'linear-gradient(135deg, #26355D 0%, #AF47D2 100%)' }}>
              <div className="flex justify-between items-center">
                <div className="text-white font-bold text-lg">
                  {cameraAction === 'checkin' ? '📷 Check In' : cameraAction === 'checkout' ? '📷 Check Out' : '☕ Istirahat'}
                </div>
                <button 
                  onClick={() => { 
                    setCameraOpen(false); 
                    if (stream){ 
                      stream.getTracks().forEach(t=>t.stop()); 
                      setStream(null)
                    } 
                    setCameraAction(null) 
                  }} 
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`p-4 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`mb-4 rounded-xl overflow-hidden bg-black border-4 shadow-inner transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-800'
              }`}>
                <video 
                  autoPlay 
                  playsInline 
                  muted 
                  ref={(el)=>{ 
                    videoRef.current = el; 
                    if(el && stream){ 
                      el.srcObject = stream 
                    } 
                  }} 
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={async ()=>{ 
                    const video = videoRef.current || document.querySelector('video'); 
                    await captureAndSend(video) 
                  }} 
                  className="flex-1 btn btn-primary"
                >
                  {cameraAction === 'checkin' ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check In
                    </>
                  ) : cameraAction === 'checkout' ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check Out
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Istirahat
                    </>
                  )}
                </button>
                <button 
                  onClick={() => { 
                    if (stream){ 
                      stream.getTracks().forEach(t=>t.stop()); 
                      setStream(null)
                    } 
                    setCameraOpen(false); 
                    setCameraAction(null) 
                  }} 
                  className="btn btn-ghost"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`card-strong transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Riwayat Absensi</h2>
          <div className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{attendance.length} catatan</div>
        </div>
        <div className="space-y-3">
          {attendance.length===0 && (
            <div className="text-center py-12">
              <svg className={`w-16 h-16 mx-auto mb-4 transition-colors ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada catatan absensi</p>
            </div>
          )}
          {attendance.map(a=> (
            <div key={a.id} className={`card transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                : 'bg-white border-gray-200 hover:border-indigo-300'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className={`font-semibold transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{a.date}</div>
                    {/* Status Izin/Sakit/Alfa - tampilkan jika bukan Hadir */}
                    {a.status === 'Izin' && (
                      <span className="status-chip status-warning">
                        Izin
                      </span>
                    )}
                    {a.status === 'Sakit' && (
                      <span className="status-chip status-danger">
                        Sakit
                      </span>
                    )}
                    {a.status === 'Alfa' && (
                      <span className="status-chip status-default">
                        Alfa
                      </span>
                    )}
                    {/* Status Check In - tampilkan sebagai status utama jika Hadir */}
                    {a.status === 'Hadir' && a.checkIn && a.checkInStatus && (
                      <span
                        className={`status-chip font-semibold ${
                          a.checkInStatus === 'onTime'
                            ? 'bg-green-100 text-green-800 border-2 border-green-400'
                            : a.checkInStatus === 'almostLate'
                            ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                            : 'bg-red-100 text-red-800 border-2 border-red-400'
                        }`}
                      >
                        {a.checkInStatus === 'onTime' ? '✓ On Time' : a.checkInStatus === 'almostLate' ? '⚠ Almost Late' : '✗ Late'}
                      </span>
                    )}
                    {/* Jika Hadir tapi belum ada checkInStatus, tampilkan Hadir */}
                    {a.status === 'Hadir' && a.checkIn && !a.checkInStatus && (
                      <span className="status-chip status-success">
                        Hadir
                      </span>
                    )}
                    {/* Status Break Late */}
                    {a.breakLate && (
                      <span className="status-chip bg-orange-100 text-orange-800 border border-orange-300 font-medium">
                        ⏰ Break Late
                      </span>
                    )}
                    {/* Status Early Leave */}
                    {a.earlyLeave && (
                      <span className="status-chip bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                        🏃 Early Leave
                      </span>
                    )}
                    {/* Jika tidak ada status apapun */}
                    {!a.checkIn && a.status !== 'Izin' && a.status !== 'Sakit' && a.status !== 'Alfa' && (
                      <span className="status-chip status-default">
                        Belum Absen
                      </span>
                    )}
                  </div>
                  <div className={`text-sm mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        CheckIn: {a.checkIn || '-'}
                      </span>
                      {(a.breakStart || a.breakEnd) && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Break: {a.breakStart || '-'} - {a.breakEnd || '-'}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        CheckOut: {a.checkOut || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {a.checkInPhotoPath && (
                      <a href={`http://localhost:4000${a.checkInPhotoPath}`} target="_blank" rel="noreferrer" className="group">
                        <img src={`http://localhost:4000${a.checkInPhotoPath}`} alt="checkin" className={`w-20 h-20 object-cover rounded-lg border-2 transition-colors shadow-sm ${
                          theme === 'dark' 
                            ? 'border-gray-600 group-hover:border-purple-500' 
                            : 'border-gray-200 group-hover:border-indigo-400'
                        }`} />
                      </a>
                    )}
                    {a.breakPhotoPath && (
                      <a href={`http://localhost:4000${a.breakPhotoPath}`} target="_blank" rel="noreferrer" className="group">
                        <img src={`http://localhost:4000${a.breakPhotoPath}`} alt="break" className={`w-20 h-20 object-cover rounded-lg border-2 transition-colors shadow-sm ${
                          theme === 'dark' 
                            ? 'border-gray-600 group-hover:border-purple-500' 
                            : 'border-gray-200 group-hover:border-indigo-400'
                        }`} />
                      </a>
                    )}
                    {a.checkOutPhotoPath && (
                      <a href={`http://localhost:4000${a.checkOutPhotoPath}`} target="_blank" rel="noreferrer" className="group">
                        <img src={`http://localhost:4000${a.checkOutPhotoPath}`} alt="checkout" className={`w-20 h-20 object-cover rounded-lg border-2 transition-colors shadow-sm ${
                          theme === 'dark' 
                            ? 'border-gray-600 group-hover:border-purple-500' 
                            : 'border-gray-200 group-hover:border-indigo-400'
                        }`} />
                      </a>
                    )}
                  </div>
                  {a.note && (
                    <div className={`mt-3 text-sm rounded-lg p-2 border transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-300 bg-gray-700 border-gray-600' 
                        : 'text-gray-600 bg-gray-50 border-gray-200'
                    }`}>
                      {a.note}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
