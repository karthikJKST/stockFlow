import { useEffect, useCallback, useState, createContext, useContext, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set())

  const removeToast = useCallback((id: number) => {
    // Start exit animation
    setRemovingIds(prev => new Set(prev).add(id))
    // Actually remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 250)
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, type, message, duration }])
  }, [])

  const toastCtx: ToastContextType = {
    addToast,
    success: (m: string) => addToast('success', m),
    error: (m: string) => addToast('error', m),
    warning: (m: string) => addToast('warning', m),
    info: (m: string) => addToast('info', m),
  }

  return (
    <ToastContext.Provider value={toastCtx}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} removing={removingIds.has(toast.id)} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

function ToastItem({ toast, removing, onDismiss }: { toast: Toast; removing: boolean; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div className={`toast-item toast-${toast.type}${removing ? ' removing' : ''}`} role="alert">
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
