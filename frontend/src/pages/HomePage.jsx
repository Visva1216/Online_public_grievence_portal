import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { analyticsService } from '../services/complaintService'
import {
  ArrowRight, Zap, Map, Bell, Shield, Brain, Mic,
  Globe, CheckCircle2, Clock, Users, TrendingUp, ChevronRight
} from 'lucide-react'

const CATEGORIES = [
  { icon: '🗑️', label: 'Sanitation', color: '#fef3c7', text: '#92400e', key: 'SANITATION' },
  { icon: '💧', label: 'Water Supply', color: '#dbeafe', text: '#1e40af', key: 'WATER_SUPPLY' },
  { icon: '⚡', label: 'Electricity', color: '#fef9c3', text: '#713f12', key: 'ELECTRICITY' },
  { icon: '🛣️', label: 'Road Maintenance', color: '#f3f4f6', text: '#374151', key: 'ROAD_MAINTENANCE' },
  { icon: '🚔', label: 'Public Safety', color: '#fee2e2', text: '#991b1b', key: 'PUBLIC_SAFETY' },
  { icon: '🌿', label: 'Parks & Gardens', color: '#dcfce7', text: '#166534', key: 'PARKS_GARDENS' },
  { icon: '🔊', label: 'Noise Pollution', color: '#ede9fe', text: '#4c1d95', key: 'NOISE_POLLUTION' },
  { icon: '🐾', label: 'Animal Nuisance', color: '#ffedd5', text: '#9a3412', key: 'ANIMAL_NUISANCE' },
]

const FEATURES = [
  {
    icon: '🧠', title: 'AI-Powered Categorization', color: '#dbeafe', textColor: '#1e40af',
    desc: 'NLP automatically detects complaint category and suggests priority, saving you time.'
  },
  {
    icon: '📷', title: 'Image Evidence Upload', color: '#dcfce7', textColor: '#166534',
    desc: 'Upload photos and our AI analyzes them to detect potholes, garbage, leakages, and more.'
  },
  {
    icon: '🎤', title: 'Voice Complaints', color: '#fee2e2', textColor: '#991b1b',
    desc: 'Speak your complaint in your own language. Automatically transcribed and translated to English.'
  },
  {
    icon: '🗺️', title: 'Interactive Map', color: '#fef3c7', textColor: '#92400e',
    desc: 'All complaints visualized on a live map with heatmaps, filters and department layers.'
  },
  {
    icon: '📧', title: 'Real-time Notifications', color: '#ede9fe', textColor: '#4c1d95',
    desc: 'Automated email updates at every stage from submission to resolution.'
  },
  {
    icon: '🔄', title: 'Duplicate Detection', color: '#ffedd5', textColor: '#9a3412',
    desc: 'AI merges duplicate complaints from the same area to streamline department workflow.'
  },
]

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const [stats, setStats] = useState({ total: '—', resolved: '—', pending: '—', response: '—' })

  useEffect(() => {
    if (!isLoggedIn) {
      setStats({ total: '1,240', resolved: '876', pending: '364', response: '48h' })
      return
    }
    
    analyticsService.getAnalytics().then(res => {
      const d = res.data.data
      setStats({
        total: d.total?.toLocaleString() || '0',
        resolved: d.resolved?.toLocaleString() || '0',
        pending: (d.submitted + d.assigned + d.inProgress)?.toLocaleString() || '0',
        response: '48h',
      })
    }).catch(() => {
      setStats({ total: '1,240', resolved: '876', pending: '364', response: '48h' })
    })
  }, [isLoggedIn])

  return (
    <div className="app-wrapper">
      {/* ── Hero / Portal Selection ── */}
      {!isLoggedIn ? (
        <section className="hero" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
          <div className="hero-glow" />
          <div className="hero-glow-2" />
          <div className="page-container" style={{ width: '100%' }}>
            <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
              <div className="hero-badge" style={{ margin: '0 auto 16px' }}>🏛️ Official Grievance Portal</div>
              <h1 style={{ fontSize: '3.5rem', marginBottom: 16 }}>
                Government of <span className="accent-text">NCT of Delhi</span>
              </h1>
              <p style={{ maxWidth: 700, margin: '0 auto', fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)' }}>
                Welcome to the unified digital platform for public grievances. To ensure privacy and security, 
                complaint details and analytics are restricted to authorized users.
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: 32, 
              maxWidth: 900, 
              margin: '0 auto' 
            }}>
              {/* Citizen Module */}
              <div className="card card-hover" style={{ 
                padding: 40, 
                background: 'rgba(255,255,255,0.03)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
                borderRadius: 24
              }}>
                <div style={{ fontSize: '4rem', marginBottom: 20 }}>👥</div>
                <h3 style={{ color: 'white', fontSize: '1.75rem', marginBottom: 12 }}>Citizen Portal</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                  Submit complaints, track your files, and interact with departments.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Link to="/login" className="btn btn-accent btn-lg btn-full" style={{ justifyContent: 'center' }}>
                    Citizen Login
                  </Link>
                  <Link to="/register" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    Don't have an account? <strong>Register here</strong>
                  </Link>
                </div>
              </div>

              {/* Admin Module */}
              <div className="card card-hover" style={{ 
                padding: 40, 
                background: 'rgba(255,255,255,0.03)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
                borderRadius: 24
              }}>
                <div style={{ fontSize: '4rem', marginBottom: 20 }}>🏛️</div>
                <h3 style={{ color: 'white', fontSize: '1.75rem', marginBottom: 12 }}>Official Portal</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                  Internal gateway for Department Officers and Administrators only.
                </p>
                <Link to="/login" className="btn btn-accent btn-lg btn-full" style={{ justifyContent: 'center' }}>
                  Admin/Officer Login
                </Link>
                <div style={{ height: 21, marginTop: 12 }} /> {/* Spacing to match citizen module */}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-glow-2" />
          <div className="page-container">
            <div className="hero-content page-enter">
              <div className="hero-badge">
                <span style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
                AI-Powered Grievance Management System
              </div>
              <h1>
                Your Voice,<br />
                <span className="accent-text">Delhi's Future</span>
              </h1>
              <p>
                Submit civic complaints, upload photo evidence, track resolution in real time — powered by NLP, computer vision and smart routing to the right department.
              </p>
              <div className="hero-cta">
                <Link to="/submit" className="btn btn-accent btn-lg" id="hero-file-complaint-btn">
                  📝 File a Complaint
                  <ArrowRight size={18} />
                </Link>
                <Link to="/track" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }} id="hero-track-btn">
                  Track Status
                </Link>
                <Link to="/map" className="btn btn-ghost btn-lg" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}>
                  <Map size={16} /> View Map
                </Link>
              </div>

              {/* Stats */}
              <div className="hero-stats">
                {[
                  { num: stats.total, label: 'Total Complaints' },
                  { num: stats.resolved, label: 'Resolved' },
                  { num: stats.pending, label: 'In Progress' },
                  { num: stats.response, label: 'Avg Response' },
                ].map((s, i) => (
                  <div key={i} className="hero-stat">
                    <span className="hero-stat-num">{s.num}</span>
                    <span className="hero-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="section" style={{ background: 'white' }}>
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">⚡ Simple Process</div>
            <h2>Submit a Complaint in Minutes</h2>
            <p>Our AI-assisted workflow makes it fast and simple for every citizen to report civic issues.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📝', title: 'Register & Describe', desc: 'Create account and describe your complaint in any language. Upload photos or use voice input.' },
              { step: '02', icon: '🧠', title: 'AI Analyzes', desc: 'Our AI categorizes the complaint, detects priority, and auto-assigns to the right department.' },
              { step: '03', icon: '📋', title: 'Department Assigned', desc: 'Relevant government department receives the complaint and gets to work immediately.' },
              { step: '04', icon: '✅', title: 'Resolved & Notified', desc: 'You receive email updates at every step and a final notification when resolved.' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 20px', position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a4480, #3b82c4)',
                  color: 'white', fontWeight: 900, fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(26,68,128,0.25)'
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{item.icon}</div>
                <h4 style={{ marginBottom: 8, color: '#111' }}>{item.title}</h4>
                <p style={{ fontSize: '0.9rem' }}>{item.desc}</p>
                {i < 3 && (
                  <div style={{
                    position: 'absolute', right: -12, top: '40%',
                    color: '#d1d5db', fontSize: '1.5rem'
                  }}>
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">📋 Complaint Categories</div>
            <h2>What Issues Can You Report?</h2>
            <p>Covering all major civic departments across New Delhi</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.key}
                to={`/submit?category=${cat.key}`}
                className="card card-hover"
                style={{ padding: '24px 16px', textAlign: 'center', cursor: 'pointer', textDecoration: 'none' }}
                id={`cat-${cat.key}`}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: cat.color, margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem'
                }}>
                  {cat.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{cat.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Features ── */}
      <section className="section" style={{ background: 'white' }}>
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">🤖 Powered by AI</div>
            <h2>Intelligent Features for Faster Resolution</h2>
            <p>Advanced AI and machine learning at every step of your grievance journey</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <h4 style={{ color: '#111', marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a4480 60%, #2060b0 100%)',
        padding: '72px 0', textAlign: 'center'
      }}>
        <div className="page-container">
          <div className="hero-badge" style={{ margin: '0 auto 20px', width: 'fit-content' }}>
            🏛️ Government of NCT of Delhi
          </div>
          <h2 style={{ color: 'white', marginBottom: 16 }}>
            Be a Responsible Citizen.<br />Report. Track. Resolve.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Join thousands of Delhiites actively improving their neighbourhood through the Grievance Portal.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {!isLoggedIn && (
              <Link to="/register" className="btn btn-accent btn-lg" id="cta-register-btn">
                Register Now — It's Free
              </Link>
            )}
            <Link to="/submit" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
              File a Complaint Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
