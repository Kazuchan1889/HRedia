import React, { createContext, useContext, useState, useEffect } from 'react'

const ToastContext = createContext();

export const useToasts = () => useContext(ToastContext)

const IconSuccess = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconError = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconInfo = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconWarning = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const IconClose = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

function Toast({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
    
    // Auto dismiss
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(), 300) // Wait for animation
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <IconSuccess className="text-green-600" />,
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <IconError className="text-red-600" />,
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <IconWarning className="text-yellow-600" />,
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        }
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <IconInfo className="text-blue-600" />,
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        }
    }
  }

  const styles = getToastStyles()

  return (
    <div
      className={`${styles.bg} border rounded-xl shadow-lg p-4 min-w-[320px] max-w-md backdrop-blur-sm transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className={`font-semibold text-sm ${styles.titleColor} mb-1`}>
              {toast.title}
            </div>
          )}
          <div className={`text-sm ${styles.messageColor}`}>{toast.message}</div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(), 300)
          }}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${styles.messageColor}`}
        >
          <IconClose />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function push(t) {
    const id = Date.now() + Math.random()
    const newToast = { id, type: 'info', ...t }
    setToasts((s) => [...s, newToast])
  }

  function remove(id) {
    setToasts((s) => s.filter((x) => x.id !== id))
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed right-4 bottom-4 space-y-3 z-[100] pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onClose={() => remove(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
