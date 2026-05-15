import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, User, Mail, Phone, Lock, MapPin } from 'lucide-react'
import { Spinner } from '../components/UI'

const DISTRICTS = [
  'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi',
  'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi',
  'South West Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Outer Delhi', 'Outer North Delhi'
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    district: '', address: '', pincode: ''
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Invalid mobile number'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      await register(form)
      toast.success('Registration successful! Please login with your credentials.')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
    }
  }

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1628 0%, #1a4480 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '96px 24px 48px'
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Card */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '32px 36px 24px',
            background: 'linear-gradient(135deg, #0a1628, #1a4480)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏛️</div>
            <h2 style={{ color: 'white', marginBottom: 4, fontSize: '1.5rem' }}>
              Citizen Registration
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0 }}>
              Government of NCT of Delhi — Grievance Portal
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px 36px' }}>
            <form onSubmit={handleSubmit} id="register-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                {/* Full Name */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} />Full Name *</label>
                  <input
                    id="fullName"
                    className={`input ${errors.fullName ? 'error' : ''}`}
                    placeholder="As per Aadhaar card"
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                  />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />Email *</label>
                  <input
                    id="email"
                    type="email"
                    className={`input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label"><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Mobile Number</label>
                  <input
                    id="phone"
                    className={`input ${errors.phone ? 'error' : ''}`}
                    placeholder="10-digit mobile"
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    maxLength={10}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>

                {/* Password */}
                <div className="form-group" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                  <label className="form-label"><Lock size={13} style={{ display: 'inline', marginRight: 4 }} />Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      className={`input ${errors.password ? 'error' : ''}`}
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={e => handleChange('password', e.target.value)}
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                {/* District */}
                <div className="form-group">
                  <label className="form-label"><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />District</label>
                  <select id="district" className="select input" value={form.district} onChange={e => handleChange('district', e.target.value)}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Pincode */}
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    id="pincode"
                    className="input"
                    placeholder="110 001"
                    value={form.pincode}
                    onChange={e => handleChange('pincode', e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="register-submit-btn" style={{ marginTop: 8 }}>
                {loading ? <><Spinner size={18} light /> Creating Account...</> : '🚀 Create Account'}
              </button>
            </form>

            <div className="divider-text" style={{ margin: '20px 0' }}>
              <span className="divider-text">already have an account?</span>
            </div>

            <Link to="/login" className="btn btn-secondary btn-full" id="go-to-login-btn">
              Sign In Instead
            </Link>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: 20 }}>
              By registering, you agree to our <a href="#" style={{ color: '#1a4480' }}>Terms of Service</a> and <a href="#" style={{ color: '#1a4480' }}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
