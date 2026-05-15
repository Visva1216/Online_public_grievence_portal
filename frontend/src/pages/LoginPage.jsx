import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Spinner } from '../components/UI'
import { useGoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, googleLogin, loading } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const from = location.state?.from?.pathname || '/dashboard'

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.fullName?.split(' ')[0]}!`)
      navigate(user.role === 'ADMIN' ? '/admin' : from)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    }
  }

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      const user = await googleLogin(tokenResponse.access_token);
      toast.success(`Welcome back, ${user.fullName?.split(' ')[0]}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : from);
    } catch(err) {
      toast.error(err.response?.data?.message || 'Google login failed!');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error('Google Login Failed')
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1628 0%, #1a4480 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '96px 24px 48px'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <div style={{
            padding: '32px 36px 24px',
            background: 'linear-gradient(135deg, #0a1628, #1a4480)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏛️</div>
            <h2 style={{ color: 'white', marginBottom: 4, fontSize: '1.5rem' }}>Welcome Back</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0 }}>
              Delhi Grievance Portal — Secure Login
            </p>
          </div>

          <div style={{ padding: '32px 36px' }}>


            <form onSubmit={handleSubmit} id="login-form">
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className={`input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })) }}
                  autoFocus
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label"><Lock size={13} style={{ display: 'inline', marginRight: 4 }} />Password</label>
                  <a href="#" style={{ fontSize: '0.8rem', color: '#1a4480', fontWeight: 600 }}>Forgot password?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    className={`input ${errors.password ? 'error' : ''}`}
                    placeholder="Your password"
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: undefined })) }}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <button type="submit" id="login-submit-btn" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><Spinner size={18} light /> Signing In...</> : '🔐 Sign In'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}></div>
                <div style={{ padding: '0 12px', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>OR CONTINUE WITH</div>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}></div>
              </div>

              <button 
                type="button" 
                onClick={() => loginWithGoogle()}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: 8,
                  fontSize: '0.95rem', fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 20, height: 20 }} />
                Sign in with Google
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Don't have an account? </span>
              <Link to="/register" style={{ color: '#1a4480', fontWeight: 700, fontSize: '0.875rem' }}>Register here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
