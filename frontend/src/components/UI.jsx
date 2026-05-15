// Shared UI helper components

// ── Status Badge ──
export function StatusBadge({ status }) {
  const label = status?.replace('_', ' ')
  return (
    <span className={`badge badge-${status?.toLowerCase()}`}>
      {statusIcon(status)} {label}
    </span>
  )
}

function statusIcon(s) {
  const icons = {
    SUBMITTED: '📬', ASSIGNED: '👤', IN_PROGRESS: '🔧',
    RESOLVED: '✅', CLOSED: '🔒', REJECTED: '❌'
  }
  return icons[s] || '📋'
}

// ── Priority Badge ──
export function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge-${priority?.toLowerCase()}`}>
      <span className={`priority-dot ${priority}`}></span>
      {priority}
    </span>
  )
}

// ── Category Badge ──
export function CategoryBadge({ category }) {
  const label = category?.replace('_', ' ')
  const icon = catIcon(category)
  return (
    <span className={`badge cat-${category}`} style={{ fontWeight: 600 }}>
      {icon} {label}
    </span>
  )
}

function catIcon(cat) {
  const icons = {
    SANITATION: '🗑️', WATER_SUPPLY: '💧', ELECTRICITY: '⚡',
    ROAD_MAINTENANCE: '🛣️', PUBLIC_SAFETY: '🚔', PARKS_GARDENS: '🌿',
    NOISE_POLLUTION: '🔊', ANIMAL_NUISANCE: '🐾', OTHER: '📌'
  }
  return icons[cat] || '📌'
}

// ── Loading spinner ──
export function Spinner({ size = 20, light = false }) {
  return (
    <div
      className={`spinner ${light ? '' : 'spinner-primary'}`}
      style={{ width: size, height: size }}
    />
  )
}

// ── Page loading skeleton ──
export function SkeletonCard() {
  return (
    <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 20, width: '60%' }} />
      <div className="skeleton" style={{ height: 14, width: '100%' }} />
      <div className="skeleton" style={{ height: 14, width: '80%' }} />
      <div className="skeleton" style={{ height: 14, width: '40%' }} />
    </div>
  )
}

// ── Empty state ──
export function EmptyState({ icon = '📂', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

// ── Format date ──
export function FormatDate({ date }) {
  if (!date) return null
  return (
    <time dateTime={date}>
      {new Date(date).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })}
    </time>
  )
}

// ── Complaint ID ──
export function ComplaintIdBadge({ id }) {
  return <span className="complaint-id">{id}</span>
}

// ── AI Confidence indicator ──
export function ConfidenceBar({ value, label }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div style={{ fontSize: '0.8rem', color: '#666' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: '#1a4480' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #1a4480, #3b82c4)',
          borderRadius: 99,
          transition: 'width 0.6s ease'
        }} />
      </div>
    </div>
  )
}
