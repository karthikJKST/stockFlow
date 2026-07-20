import { useState } from 'react'
import { X, LogIn, UserPlus, DollarSign, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const err = mode === 'login'
      ? await login(username, password)
      : await register(username, password, displayName)

    if (err) {
      setError(err)
    } else {
      // Close modal on successful login/register
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal glass" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="auth-brand">
          <DollarSign size={28} />
          <h2>StockFlow</h2>
          <p>Sign in to your trading dashboard</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            <LogIn size={15} /> Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            <UserPlus size={15} /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label>Display Name (optional)</label>
              <input
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label>Password</label>
            <div className="pwd-input">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'login' && (
            <div className="auth-demo">
              <p>Demo accounts: <strong>demo</strong> / <strong>demo123</strong></p>
              <p className="auth-demo-sub"><strong>alice</strong> / <strong>alice123</strong> · <strong>bob</strong> / <strong>bob123</strong></p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
