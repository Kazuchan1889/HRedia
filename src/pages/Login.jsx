import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const IconLock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const IconEye = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const IconEyeOff = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
  </svg>
)

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const nav = useNavigate()

  // Slideshow images
  const slides = [
    'https://media.istockphoto.com/id/1352594706/photo/empty-open-plan-office-at-night-with-neon-lights.jpg?s=612x612&w=0&k=20&c=h2DCiR6b64wFNqehFN4o9jCnkdH16ulTKRdX72xI_xY=',
    'https://media.istockphoto.com/id/2072805054/photo/futuristic-office-with-asian-mature-businesswoman-using-digital-tablet-in-office.jpg?s=612x612&w=0&k=20&c=jExStLwhnjq2z9MTSlaHxpboRTceE2B2f2HRB8wklOA=',
    'https://images.stockcake.com/public/5/e/e/5ee6ad54-6795-46bc-b041-da0c8d04a917_large/future-office-meeting-stockcake.jpg'
  ]

  // Taglines for each slide (HR Management related)
  const taglines = [
    {
      title: 'Maximizing Productivity,',
      subtitle: 'Optimizing Performance',
      description: 'Kelola Kehadiran dengan Efisiensi Maksimal'
    },
    {
      title: 'Innovative Solutions,',
      subtitle: 'Digital Transformation',
      description: 'Teknologi HR Terdepan untuk Masa Depan'
    },
    {
      title: 'Building Teams,',
      subtitle: 'Creating Success',
      description: 'Kolaborasi yang Membangun Keberhasilan Bersama'
    }
  ]

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [slides.length])

  // Redirect to dashboard if already logged in with valid token
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        // Validate token by calling API
        const res = await axios.get('http://localhost:4000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        // Token is valid, redirect to dashboard
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data))
          nav('/')
        } else {
          // No user data, clear invalid token
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (err) {
        // Token is invalid or expired, clear it
        console.error('Token validation failed:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    checkAuth()
  }, [nav])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', { username, password })
      localStorage.setItem('token', res.data.token)
      // Store user data including profilePicture
      localStorage.setItem('user', JSON.stringify(res.data.user))
      nav('/')
    } catch (err) {
      setErr(err.response?.data?.message || 'Login gagal. Periksa kembali username dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Visual/Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Slideshow Background Images */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${slide})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Overlay gradient untuk readability */}
              <div className="absolute inset-0" style={{ 
                background: 'linear-gradient(135deg, rgba(38, 53, 93, 0.7) 0%, rgba(26, 36, 64, 0.6) 50%, rgba(175, 71, 210, 0.7) 100%)'
              }}></div>
            </div>
          ))}
        </div>

        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
              A
            </div>
            <span className="text-white text-2xl font-bold">Absensi</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="absolute bottom-16 left-8 z-10 transition-all duration-1000 ease-in-out">
          <h2 className="text-white text-4xl font-bold mb-2 leading-tight">
            <span className="inline-block">{taglines[currentSlide].title}</span><br />
            <span className="inline-block">{taglines[currentSlide].subtitle}</span>
          </h2>
          <p className="text-white/80 text-lg mt-4">{taglines[currentSlide].description}</p>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-8 z-10 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#26355D' }}>
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Login</h1>
            <p className="text-white/70">
              Belum punya akun?{' '}
              <span className="text-white underline cursor-pointer hover:opacity-80">Hubungi admin</span>
            </p>
          </div>

          {/* Error Message */}
          {err && (
            <div className="mb-6 p-4 rounded-xl border-2 animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <p className="text-sm text-red-300 font-medium">{err}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={submit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#AF47D2' }}>
                  <IconUser />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-white placeholder:text-white/50"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(175, 71, 210, 0.3)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#AF47D2'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(175, 71, 210, 0.3)'}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#AF47D2' }}>
                  <IconLock />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-200 text-white placeholder:text-white/50"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(175, 71, 210, 0.3)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#AF47D2'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(175, 71, 210, 0.3)'}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                  style={{ color: '#AF47D2' }}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base font-bold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#AF47D2' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
