import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { complaintService } from '../services/complaintService'
import { StatusBadge, PriorityBadge, CategoryBadge, FormatDate, SkeletonCard } from '../components/UI'
import { Search, MapPin, Clock, Building2, ChevronRight, ExternalLink, Star, Timer, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

// Feature 7: Citizen Satisfaction Rating component
function SatisfactionRating({ complaint, onRated }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(complaint.satisfactionRating || 0)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (submitted > 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #bbf7d0', borderRadius: 16, padding: '20px 24px',
        textAlign: 'center', marginBottom: 20
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🙏</div>
        <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>Thank you for your feedback!</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={20} style={{ color: s <= submitted ? '#fbbf24' : '#e5e7eb', fill: s <= submitted ? '#fbbf24' : 'transparent' }} />
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Your {submitted}-star rating helps improve government service</div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!rating) return
    setLoading(true)
    try {
      // Store rating locally (backend integration can be added later)
      localStorage.setItem(`rating_${complaint.complaintId}`, rating)
      setSubmitted(rating)
      toast.success(`Thank you! ${rating}-star rating submitted ⭐`)
      if (onRated) onRated(rating)
    } catch {
      toast.error('Could not submit rating')
    } finally {
      setLoading(false)
    }
  }

  const savedRating = parseInt(localStorage.getItem(`rating_${complaint.complaintId}`) || '0')
  if (savedRating > 0 && !submitted) {
    setSubmitted(savedRating)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      border: '1px solid #fde68a', borderRadius: 16, padding: '20px 24px', marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Star size={18} style={{ color: '#d97706', fill: '#d97706' }} />
        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>Rate Your Experience</div>
      </div>
      <p style={{ color: '#78350f', fontSize: '0.85rem', marginBottom: 16 }}>
        Your complaint was resolved! How satisfied are you with the government's response?
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {[1,2,3,4,5].map(s => {
          const isActive = s <= (hovered || rating)
          const labels = ['😞 Poor', '😕 Fair', '😐 OK', '😊 Good', '🤩 Excellent']
          return (
            <button key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                transform: isActive ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
              }}
            >
              <Star size={32} style={{ color: isActive ? '#fbbf24' : '#d1d5db', fill: isActive ? '#fbbf24' : 'transparent', transition: 'color 0.15s' }} />
            </button>
          )
        })}
      </div>
      {(hovered || rating) > 0 && (
        <div style={{ textAlign: 'center', color: '#d97706', fontWeight: 700, fontSize: '0.875rem', marginBottom: 12 }}>
          {['', '😞 Poor — Needs major improvement', '😕 Fair — Some improvement needed', '😐 Okay — Average service', '😊 Good — Satisfactory resolution', '🤩 Excellent — Highly satisfied!'][hovered || rating]}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!rating || loading}
          style={{ minWidth: 140 }}
        >
          {loading ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} /> : <Star size={15} />}
          Submit Rating
        </button>
      </div>
    </div>
  )
}

// Feature 6: AI Resolution Time display
function AIResolutionTag({ complaint }) {
  if (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED') return null
  if (!complaint.createdAt || !complaint.resolvedAt) return null

  const created = new Date(complaint.createdAt)
  const resolved = new Date(complaint.resolvedAt)
  const hours = Math.round((resolved - created) / (1000 * 60 * 60))

  const getSpeedLabel = (h) => {
    if (h < 6) return { label: 'Lightning Fast', color: '#22c55e', bg: '#dcfce7', icon: '⚡' }
    if (h < 24) return { label: 'Fast Resolution', color: '#3b82f6', bg: '#dbeafe', icon: '🚀' }
    if (h < 72) return { label: 'Standard', color: '#d97706', bg: '#fef3c7', icon: '⏱️' }
    return { label: 'Delayed', color: '#dc2626', bg: '#fee2e2', icon: '🐢' }
  }

  const speed = getSpeedLabel(hours)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: speed.bg, color: speed.color,
      padding: '6px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700,
      border: `1px solid ${speed.color}20`
    }}>
      <span>{speed.icon}</span>
      <span>AI Resolution: {hours}h — {speed.label}</span>
    </div>
  )
}

const STATUS_STEPS = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function StatusTimeline({ currentStatus, logs = [] }) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus)

  return (
    <div className="timeline">
      {STATUS_STEPS.map((s, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        const log = [...logs].reverse().find(l => l.newStatus === s)

        return (
          <div key={s} className="timeline-item">
            <div className={`timeline-dot ${isActive ? 'active' : isDone ? 'done' : 'pending'}`} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isActive ? '#1a4480' : isDone ? '#166534' : '#9ca3af' }}>
                  {isActive ? '▶ ' : isDone ? '✓ ' : ''}{s.replace('_', ' ')}
                </div>
                {log?.remarks && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>{log.remarks}</div>
                )}
              </div>
              {log?.createdAt && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>
                  <FormatDate date={log.createdAt} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function TrackComplaintPage() {
  const { complaintId: paramId } = useParams()
  const [inputId, setInputId] = useState(paramId || '')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (paramId) fetchComplaint(paramId)
  }, [paramId])

  const fetchComplaint = async (id) => {
    if (!id.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await complaintService.track(id.trim())
      setComplaint(res.data.data)
    } catch (err) {
      setComplaint(null)
      toast.error('Complaint not found. Check your complaint ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchComplaint(inputId)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px 48px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Track Your Complaint</h1>
        <p>Enter your Complaint ID to check real-time status and updates</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="track-input-row" style={{ maxWidth: 600, margin: '0 auto 40px' }}>
        <input
          id="track-complaint-id"
          className="input"
          placeholder="e.g. DEL-2024-00001"
          value={inputId}
          onChange={e => setInputId(e.target.value.toUpperCase())}
          style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' }}
        />
        <button type="submit" id="track-search-btn" className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
          {loading ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white', border: '2px solid rgba(255,255,255,0.3)' }} /> : <Search size={16} />}
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Not found */}
      {searched && !loading && !complaint && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔎</div>
          <h3 style={{ color: '#374151', marginBottom: 8 }}>Complaint Not Found</h3>
          <p>No complaint found with ID <strong>{inputId}</strong>. Please check and try again.</p>
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/submit" className="btn btn-primary">File New Complaint</Link>
          </div>
        </div>
      )}

      {/* Complaint Details */}
      {complaint && !loading && (
        <div className="page-enter">
          {/* Status Banner */}
          <div style={{
            padding: '20px 24px',
            borderRadius: '16px 16px 0 0',
            background: complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
              ? 'linear-gradient(135deg, #166534, #22c55e)'
              : 'linear-gradient(135deg, #1a4480, #3b82c4)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 4 }}>Complaint ID</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'monospace' }}>
                {complaint.complaintId}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={complaint.status} />
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: 6 }}>
                Filed on <FormatDate date={complaint.createdAt} />
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none' }}>
            <div className="card-body">
              {/* Title & Badges */}
              <h2 style={{ fontSize: '1.25rem', marginBottom: 12 }}>{complaint.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                <CategoryBadge category={complaint.category} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.isDuplicate && (
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    ⚠️ Duplicate of {complaint.duplicateOf}
                  </span>
                )}
              </div>

              {/* Description */}
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Description</div>
                <p style={{ color: '#374151', fontSize: '0.9375rem' }}>{complaint.description}</p>
                {complaint.descriptionTranslated && complaint.descriptionTranslated !== complaint.description && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>🌐 Auto-translated (English)</div>
                    <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>{complaint.descriptionTranslated}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Location */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>📍 Location</div>
                  <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                    {complaint.address || '—'}{complaint.district ? `, ${complaint.district}` : ''}
                    {complaint.ward ? ` (${complaint.ward})` : ''}
                  </div>
                  {complaint.latitude && (
                    <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '0.8rem', color: '#1a4480', fontWeight: 600 }}>
                      <ExternalLink size={12} /> View on Google Maps
                    </a>
                  )}
                </div>

                {/* Department */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>🏢 Department</div>
                  <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 600 }}>
                    {complaint.departmentName || 'Pending assignment'}
                  </div>
                  {complaint.assignedAt && (
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4 }}>
                      Assigned: <FormatDate date={complaint.assignedAt} />
                    </div>
                  )}
                </div>
              </div>

              {/* AI Tags */}
              {complaint.aiImageTags?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>🧠 AI Detected Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {complaint.aiImageTags.map(tag => (
                      <span key={tag} style={{ background: '#ede9fe', color: '#4c1d95', padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {complaint.images?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>📸 Evidence Photos</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                    {complaint.images.map(img => (
                      <a key={img.id} href={`/api${img.imageUrl}`} target="_blank" rel="noopener noreferrer">
                        <div style={{ height: 90, background: '#f3f4f6', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                          <img src={`/api${img.imageUrl}`} alt={img.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {complaint.resolutionNote && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <span>✅</span>
                  <div>
                    <strong>Resolution:</strong> {complaint.resolutionNote}
                    {complaint.resolvedAt && <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Resolved on <FormatDate date={complaint.resolvedAt} /></div>}
                  </div>
                </div>
              )}

              {/* Feature 6: AI Resolution Time */}
              {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
                <div style={{ marginBottom: 20 }}>
                  <AIResolutionTag complaint={complaint} />
                </div>
              )}
            </div>

            {/* Feature 7: Citizen Satisfaction Rating – shown when resolved */}
            {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
              <div style={{ padding: '0 24px 24px' }}>
                <SatisfactionRating complaint={complaint} />
              </div>
            )}

            {/* Status Timeline */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0' }}>
              <h4 style={{ marginBottom: 20, fontSize: '1rem' }}>📋 Complaint History</h4>
              <StatusTimeline currentStatus={complaint.status} logs={complaint.statusLogs || []} />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/submit" className="btn btn-primary">File Another Complaint</Link>
            <Link to="/map" className="btn btn-ghost">View on Map</Link>
          </div>
        </div>
      )}
    </div>
  )
}
