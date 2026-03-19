import { useEffect, useState, useCallback } from 'react'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

let addToastFn: ((type: ToastMessage['type'], message: string) => void) | null = null

export function toast(type: ToastMessage['type'], message: string) {
  addToastFn?.(type, message)
}

const typeClasses: Record<string, string> = {
  success: 'bg-success-50 text-success-800 border-success-200',
  error: 'bg-error-50 text-error-800 border-error-200',
  info: 'bg-info-50 text-info-800 border-info-200',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => {
      addToastFn = null
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm shadow-md animate-[slideIn_0.2s_ease-out] ${typeClasses[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
