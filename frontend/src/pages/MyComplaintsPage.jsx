import { useState, useEffect } from 'react'
import { complaintService } from '../services/complaintService'
import { StatusBadge, PriorityBadge, CategoryBadge, FormatDate, EmptyState, SkeletonCard } from '../components/UI'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, ArrowRight } from 'lucide-react'

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchComplaints()
  }, [page])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await complaintService.getMyComplaints(page, 10)
      const d = res.data.data
      setComplaints(d.content || [])
      setTotalPages(d.totalPages || 0)
    } catch (err) {
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = complaints.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.complaintId?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>📋 My Complaints</h1>
          <p>Track all your submitted grievances</p>
        </div>
        <Link to="/submit" className="btn btn-primary" id="my-complaints-new-btn">
          <PlusCircle size={16} /> File New Complaint
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          className="input"
          placeholder="Search by title or complaint ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
          id="my-complaints-search"
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No complaints found"
          description="You haven't filed any complaints yet. Help improve Delhi by reporting civic issues."
          action={<Link to="/submit" className="btn btn-primary">File Your First Complaint</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(c => (
            <Link key={c.id} to={`/track/${c.complaintId}`} style={{ textDecoration: 'none' }}>
              <div className="complaint-card" id={`complaint-card-${c.complaintId}`}>
                <div className="complaint-card-header">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="complaint-id">{c.complaintId}</span>
                    <CategoryBadge category={c.category} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <div className="complaint-title">{c.title}</div>
                <div className="complaint-desc">{c.description}</div>
                <div className="complaint-meta">
                  <span className="complaint-meta-item">🏢 {c.departmentName || 'Pending'}</span>
                  {c.district && <span className="complaint-meta-item">📍 {c.district}</span>}
                  <span className="complaint-meta-item">📅 <FormatDate date={c.createdAt} /></span>
                  <span style={{ marginLeft: 'auto', color: '#1a4480', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View Details <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} className={`btn btn-sm ${i === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</button>
        </div>
      )}
    </div>
  )
}
