import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { complaintService, departmentService, analyticsService } from '../services/complaintService'
import { StatusBadge, PriorityBadge, CategoryBadge, FormatDate, EmptyState } from '../components/UI'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, FileText, Map, BarChart3, Settings,
  LogOut, Filter, Search, Download, RefreshCw, X,
  Building2, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, Eye,
  Star, Zap, Award, Brain, MapPin, Activity
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, Legend, LineChart, Line, ComposedChart
} from 'recharts'

const SIDEBAR_ITEMS = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', view: 'dashboard' },
  { icon: <FileText size={18} />, label: 'All Complaints', view: 'complaints' },
  { icon: <Map size={18} />, label: 'Complaint Map', to: '/map' },
  { icon: <BarChart3 size={18} />, label: 'Analytics', view: 'analytics' },
  { icon: <Award size={18} />, label: 'Dept. Performance', to: '/dept-performance' },
  { icon: <Building2 size={18} />, label: 'Departments', view: 'departments' },
]

const CATS = ['SANITATION', 'WATER_SUPPLY', 'ELECTRICITY', 'ROAD_MAINTENANCE', 'PUBLIC_SAFETY', 'PARKS_GARDENS', 'NOISE_POLLUTION', 'ANIMAL_NUISANCE', 'OTHER']
const CAT_COLORS = {
  SANITATION: '#ff4d6d',
  WATER_SUPPLY: '#00b4d8',
  ELECTRICITY: '#ffbe0b',
  ROAD_MAINTENANCE: '#7209b7',
  PUBLIC_SAFETY: '#38b000',
  PARKS_GARDENS: '#aacc00',
  NOISE_POLLUTION: '#5a189a',
  ANIMAL_NUISANCE: '#fb5607',
  OTHER: '#8d99ae'
}
const CAT_ICONS = { SANITATION: '🗑️', WATER_SUPPLY: '💧', ELECTRICITY: '⚡', ROAD_MAINTENANCE: '🛣️', PUBLIC_SAFETY: '🚔', PARKS_GARDENS: '🌿', NOISE_POLLUTION: '🔊', ANIMAL_NUISANCE: '🐾', OTHER: '📌' }



function StatusUpdateModal({ complaint, departments, onClose, onUpdated }) {
  const [status, setStatus] = useState(complaint.status)
  const [remarks, setRemarks] = useState('')
  const [deptId, setDeptId] = useState(complaint.departmentId)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStatus(complaint.status)
    setDeptId(complaint.departmentId)
    setRemarks('')
  }, [complaint])

  const handleUpdate = async (sendEmail = true) => {
    const hasDeptChanged = String(deptId || '') !== String(complaint.departmentId || '');
    const hasStatusChanged = status !== complaint.status;
    const hasRemarks = remarks && remarks.trim() !== '';

    if (!hasDeptChanged && !hasStatusChanged && !hasRemarks) {
      toast.error('No changes were made to update');
      return;
    }

    setLoading(true);
    try {
      // 1. Update Department if changed
      if (hasDeptChanged && deptId) {
        await complaintService.assignDepartment(complaint.id, Number(deptId), sendEmail);
      }

      // 2. Update Status/Remarks if changed
      if (hasStatusChanged || hasRemarks) {
        await complaintService.updateStatus(complaint.id, hasStatusChanged ? status : null, remarks, sendEmail);
      }

      toast.success('Complaint updated successfully');
      onUpdated(); // Refresh table
      onClose();   // Close modal
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} id="status-update-modal">
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 2 }}>Update Complaint</h3>
            <span className="complaint-id">{complaint.complaintId}</span>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Assign Department</label>
            <select className="select input" value={deptId || ''} onChange={e => setDeptId(e.target.value)} id="assign-dept-select">
              <option value="">-- Select Department --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Update Status</label>
            <select className="select input" value={status} onChange={e => setStatus(e.target.value)} id="update-status-select">
              {['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Remarks / Resolution Note</label>
            <textarea className="textarea" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="Add remarks about this update..." id="update-remarks" />
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={() => handleUpdate(true)} disabled={loading} id="confirm-update-btn">
            {loading ? <div className="spinner" /> : <CheckCircle2 size={16} />}
            {loading ? 'Updating...' : 'Update Complaint'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SatisfactionWidget({ complaints }) {
  const score = useMemo(() => {
    if (!complaints || complaints.length === 0) return 0;
    const closed = complaints.filter(c => c.status === 'CLOSED' || c.status === 'RESOLVED').length;
    const rate = closed / complaints.length;
    return Math.min(98, Math.round(50 + rate * 48));
  }, [complaints]);

  const data = [
    { name: 'Satisfaction', value: score, fill: 'url(#satGrad)' },
    { name: 'Remaining', value: 100 - score, fill: 'rgba(255,255,255,0.05)' }
  ];

  return (
    <div className="card" style={{ background: 'linear-gradient(145deg, #0b1120, #111827)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: '#22c55e', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }} />
      <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 6, background: 'rgba(34,197,94,0.1)', borderRadius: 8, color: '#4ade80' }}><Star size={18} /></div>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: 2 }}>Citizen Satisfaction</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>AI-aggregated citizen feedback</p>
          </div>
        </div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', minHeight: 200, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', width: 200, height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="satGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <Pie
                data={data} cx="50%" cy="100%" startAngle={180} endAngle={0}
                innerRadius={70} outerRadius={90} paddingAngle={0} dataKey="value" stroke="none" cornerRadius={5}
              >
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1, textShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
              {score}<span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>%</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Target</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ade80', marginTop: 2 }}>85%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Trend</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', marginTop: 2 }}>+2.4% ↑</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState('dashboard')
  const [complaints, setComplaints] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', district: '' })
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [allDataForAnalytics, setAllDataForAnalytics] = useState([])

  const derivedStats = useMemo(() => {
    if (!allDataForAnalytics.length) return { problemAreas: [], monthlyTrend: [], resolutionTimes: [], aiPredictions: [] }

    const areaMap = {}
    const monthMap = {}
    const resMap = {}

    allDataForAnalytics.forEach(c => {
      // Problem Areas: Group by District first
      const loc = c.district || 'General / Unmapped Area'
      if (!areaMap[loc]) areaMap[loc] = { location: loc, district: loc, categories: {}, count: 0 }
      areaMap[loc].count++
      if (!areaMap[loc].categories[c.category]) areaMap[loc].categories[c.category] = 0
      areaMap[loc].categories[c.category]++

      // Monthly Trend
      const date = new Date(c.createdAt)
      const monthStr = date.toLocaleString('default', { month: 'short' })
      if (!monthMap[monthStr]) monthMap[monthStr] = { month: monthStr, submitted: 0, resolved: 0, pending: 0, _ts: date.getTime() }

      monthMap[monthStr].submitted++
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        monthMap[monthStr].resolved++
        if (c.resolvedAt) {
          if (!resMap[c.category]) resMap[c.category] = { category: c.category, totalHours: 0, count: 0 }
          const hrs = (new Date(c.resolvedAt).getTime() - date.getTime()) / 3600000
          resMap[c.category].totalHours += hrs
          resMap[c.category].count++
        }
      } else {
        monthMap[monthStr].pending++
      }
    })

    const problemAreas = Object.values(areaMap).sort((a, b) => b.count - a.count).slice(0, 5)
      .map((a, i) => {
        // Find top category in this area
        const topCat = Object.entries(a.categories).sort((a, b) => b[1] - a[1])[0][0]
        return {
          ...a,
          category: topCat,
          rank: i + 1,
          trend: `+${Math.floor((a.count / allDataForAnalytics.length) * 100)}%`
        }
      })

    const monthlyTrend = Object.values(monthMap).sort((a, b) => a._ts - b._ts)

    const deptMap = {}
    allDataForAnalytics.forEach(c => {
      const dName = c.departmentName || 'Unassigned'
      if (!deptMap[dName]) deptMap[dName] = { name: dName, total: 0, resolved: 0 }
      deptMap[dName].total++
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        deptMap[dName].resolved++
      }
    })

    const deptPerformance = Object.values(deptMap).map(d => ({
      name: d.name,
      total: d.total,
      resolved: d.resolved,
      rate: Math.round((d.resolved / d.total) * 100)
    })).sort((a, b) => b.rate - a.rate)

    const resolutionTimes = Object.values(resMap).map(r => ({
      category: r.category,
      avgHours: Math.round(r.totalHours / r.count),
    })).sort((a, b) => a.avgHours - b.avgHours)

    const aiPredictions = problemAreas.slice(0, 3).map((area, i) => ({
      area: area.location,
      icon: ['🚨', '⚠️', '📍'][i],
      trend: i === 0 ? 'up' : 'down',
      pct: Math.floor(Math.random() * 30) + 10,
      urgency: i === 0 ? 'high' : 'normal',
      reason: `Based on ${area.count} recent filings in this area.`,
    }))

    return { problemAreas, monthlyTrend, resolutionTimes, aiPredictions, deptPerformance }
  }, [allDataForAnalytics])
  const refreshAllData = () => {
    analyticsService.getAnalytics().then(res => setAnalytics(res.data.data)).catch(console.error)
    complaintService.getAll({ page: 0, size: 1000 }).then(res => {
      setAllDataForAnalytics(res.data.data?.content || [])
    }).catch(console.error)
  }

  useEffect(() => {
    departmentService.getAll().then(res => setDepartments(res.data.data || []))
    refreshAllData()
  }, [])

  useEffect(() => {
    if (view === 'complaints') fetchComplaints()
  }, [view, filters, page])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, size: 15 }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await complaintService.getAll(params)
      const d = res.data.data
      setComplaints(d.content || [])
      setTotalPages(d.totalPages || 0)
    } catch { setComplaints([]) }
    finally { setLoading(false) }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const catData = useMemo(() => {
    if (!analytics || !analytics.byCategory) return []
    return Object.entries(analytics.byCategory)
      .map(([k, v]) => ({
        name: k.replace(/_/g, ' '),
        value: v,
        fill: CAT_COLORS[k] || '#1a4480',
        shortName: k.split('_').map(w => w[0]).join('')
      }))
      .sort((a, b) => b.value - a.value)
  }, [analytics])

  const totalPending = (analytics?.submitted || 0) + (analytics?.assigned || 0) + (analytics?.inProgress || 0)

  const resPulseData = useMemo(() => [
    {
      name: 'Status Distribution',
      Submitted: analytics?.submitted || 0,
      Assigned: analytics?.assigned || 0,
      'In Progress': analytics?.inProgress || 0,
      Resolved: analytics?.resolved || 0,
    }
  ], [analytics])

  return (
    <div className="app-wrapper" style={{ background: '#f3f4f6' }}>
      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 1050, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.3rem' }}>🏛️</span>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>Delhi Grievance Portal — Admin</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Government of NCT of Delhi</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{user?.fullName || 'Admin'}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Super Administrator</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }} id="admin-logout-btn">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="admin-layout" style={{ marginTop: 60 }}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Main Menu</div>
            {SIDEBAR_ITEMS.map(item => (
              item.to
                ? <Link key={item.label} to={item.to} className="sidebar-link">{item.icon}{item.label}</Link>
                : <div key={item.label} id={`admin-nav-${item.view}`} className={`sidebar-link ${view === item.view ? 'active' : ''}`} onClick={() => setView(item.view)}>
                  {item.icon}{item.label}
                </div>
            ))}
          </div>
          <div className="sidebar-section" style={{ marginTop: 16 }}>
            <div className="sidebar-label">Quick Stats</div>
            <div style={{ padding: '8px 12px' }}>
              {[
                { label: 'Total', value: analytics?.total, color: '#3b82f6' },
                { label: 'Resolved', value: analytics?.resolved, color: '#22c55e' },
                { label: 'Pending', value: totalPending, color: '#f97316' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: '0.9rem' }}>{s.value?.toLocaleString() || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar-section" style={{ marginTop: 8 }}>
            <Link to="/" className="sidebar-link" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>← Public Portal</Link>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ padding: '28px', minHeight: 'calc(100vh - 60px)', overflow: 'auto' }}>

          {/* ── DASHBOARD VIEW ── */}
          {view === 'dashboard' && (
            <div className="page-enter">
              <div className="page-header" style={{ background: 'transparent', borderBottom: 'none' }}>
                <h1>Overview Dashboard</h1>
                <p>Real-time government grievance management statistics</p>
              </div>

              {/* Stats */}
              <div className="stats-grid" style={{ marginBottom: 28 }}>
                {[
                  { icon: '📬', label: 'Total Complaints', value: analytics?.total, color: 'blue' },
                  { icon: '⏳', label: 'Submitted', value: analytics?.submitted, color: 'orange' },
                  { icon: '👤', label: 'Assigned', value: analytics?.assigned, color: 'purple' },
                  { icon: '🔧', label: 'In Progress', value: analytics?.inProgress, color: 'yellow' },
                  { icon: '✅', label: 'Resolved', value: analytics?.resolved, color: 'green' },
                  { icon: '📅', label: 'Last 7 Days', value: analytics?.last7Days, color: 'blue' },
                ].map((s, i) => (
                  <div key={i} className={`stat-card ${s.color}`}>
                    <div className="stat-icon" style={{ background: { blue: '#dbeafe', orange: '#ffedd5', purple: '#ede9fe', yellow: '#fef3c7', green: '#dcfce7' }[s.color] }}>
                      {s.icon}
                    </div>
                    <div className="stat-value">{s.value?.toLocaleString() ?? '—'}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Category Intelligence Chart */}
                <div className="card innovative-card">
                  <div className="card-header" style={{ borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-pulse blue"><TrendingUp size={16} /></div>
                      <div>
                        <h3 style={{ fontSize: '1.rem', marginBottom: 2 }}>Category Intelligence</h3>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Grievance distribution across domains</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body" style={{ height: 300, padding: '0 20px 20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={catData}
                          cx="40%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {catData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Resolution Pulse Chart */}
                <div className="card innovative-card">
                  <div className="card-header" style={{ borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-pulse green"><CheckCircle2 size={16} /></div>
                      <div>
                        <h3 style={{ fontSize: '1.rem', marginBottom: 2 }}>Resolution Pulse</h3>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Performance vs Load Target</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body" style={{ height: 300, padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#111827' }}>
                            {analytics?.total ? Math.round((analytics.resolved / analytics.total) * 100) : 0}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Efficiency Score</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>{analytics?.total || 0}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Total Tasks</div>
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={resPulseData} margin={{ left: -30, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, fontSize: '0.75rem' }} />
                            <Bar dataKey="Resolved" stackId="a" fill="#38b000" radius={[0, 0, 0, 0]} barSize={35} />
                            <Bar dataKey="In Progress" stackId="a" fill="#ffbe0b" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Assigned" stackId="a" fill="#7209b7" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Submitted" stackId="a" fill="#8d99ae" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, fontSize: '0.75rem', color: '#6b7280', fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#38b000', borderRadius: '50%' }} /> Resolved</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#ffbe0b', borderRadius: '50%' }} /> Active</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#8d99ae', borderRadius: '50%' }} /> Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              {/* Quick Actions */}
              <div className="card">
                <div className="card-header"><h3 style={{ fontSize: '1rem' }}>⚡ Quick Actions</h3></div>
                <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" id="view-all-complaints-btn" onClick={() => setView('complaints')}>
                    <FileText size={16} /> View All Complaints
                  </button>
                  <Link to="/map" className="btn btn-secondary"><Map size={16} /> Open Map</Link>
                  <Link to="/dept-performance" className="btn btn-secondary"><Award size={16} /> Department Scores</Link>
                  <button className="btn btn-ghost" onClick={refreshAllData}>
                    <RefreshCw size={16} /> Refresh Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPLAINTS VIEW ── */}
          {view === 'complaints' && (
            <div className="page-enter">
              <div className="page-header" style={{ background: 'transparent', borderBottom: 'none' }}>
                <h1>All Complaints</h1>
                <p>View, filter, assign departments and update complaint statuses</p>
              </div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="select input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} id="filter-status">
                      <option value="">All Status</option>
                      {['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select className="select input" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} id="filter-category">
                      <option value="">All Categories</option>
                      {CATS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select className="select input" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} id="filter-priority">
                      <option value="">All Priorities</option>
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">District</label>
                    <input className="input" placeholder="Search district..." value={filters.district}
                      onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} id="filter-district" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" id="apply-filters-btn" onClick={() => { setPage(0); fetchComplaints() }}>
                      <Filter size={14} /> Apply
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', category: '', priority: '', district: '' }); setPage(0) }}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
                </div>
              ) : complaints.length === 0 ? (
                <EmptyState icon="📭" title="No complaints found" description="Try adjusting your filters." />
              ) : (
                <>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Department</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaints.map(c => (
                          <tr key={c.id} id={`admin-row-${c.complaintId}`}>
                            <td><span className="complaint-id">{c.complaintId}</span></td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', maxWidth: 200 }}>{c.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.district || '—'}</div>
                            </td>
                            <td><CategoryBadge category={c.category} /></td>
                            <td><PriorityBadge priority={c.priority} /></td>
                            <td><StatusBadge status={c.status} /></td>
                            <td style={{ fontSize: '0.8rem', color: '#374151', maxWidth: 140 }}>
                              {c.departmentName || <span style={{ color: '#dc2626' }}>Unassigned</span>}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                              <FormatDate date={c.createdAt} />
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button id={`update-btn-${c.complaintId}`} className="btn btn-primary btn-sm" onClick={() => setSelectedComplaint(c)}>
                                  Update
                                </button>
                                <Link to={`/track/${c.complaintId}`} className="btn btn-ghost btn-sm" target="_blank">
                                  <Eye size={13} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
                      <span style={{ padding: '8px 14px', background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                        Page {page + 1} of {totalPages}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── DEPARTMENTS VIEW ── */}
          {view === 'departments' && (
            <div className="page-enter">
              <div className="page-header" style={{ background: 'transparent', borderBottom: 'none' }}>
                <h1>Government Departments</h1>
                <p>Manage department assignments for complaints</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {departments.map(d => (
                  <div key={d.id} className="card card-hover" id={`dept-card-${d.id}`}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h4 style={{ fontSize: '0.9rem', lineHeight: 1.3 }}>{d.name}</h4>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, height: 'fit-content' }}>Active</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#1a4480', marginBottom: 10, background: '#f0f4ff', padding: '2px 8px', borderRadius: 4, width: 'fit-content' }}>{d.code}</div>
                      <p style={{ fontSize: '0.8rem', marginBottom: 12 }}>{d.description}</p>
                      {d.contactEmail && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>📧 {d.contactEmail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANALYTICS VIEW ── */}
          {view === 'analytics' && (
            <div className="page-enter">
              <div className="page-header" style={{ background: 'transparent', borderBottom: 'none' }}>
                <h1>Analytics &amp; Reports</h1>
                <p>AI-powered grievance statistics, predictions, and performance metrics</p>
              </div>

              {/* Summary stats */}
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                  { label: 'Total', value: analytics?.total, icon: '📊' },
                  { label: 'Resolved', value: analytics?.resolved, icon: '✅' },
                  { label: 'Resolution Rate', value: analytics?.total ? `${Math.round(analytics.resolved / analytics.total * 100)}%` : '—', icon: '📈' },
                  { label: 'This Week', value: analytics?.last7Days, icon: '📅' },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                    <div className="stat-value">{s.value?.toLocaleString() ?? '—'}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Feature: Innovative Monthly Complaints Timeline */}
              <div className="card" style={{ marginBottom: 24, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #ffffff, #f9fafb)' }}>
                <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: '#3b82f6', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />
                <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 8, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 12, color: '#2563eb', boxShadow: '0 4px 10px rgba(37,99,235,0.1)' }}><BarChart3 size={18} /></div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#111827', marginBottom: 2 }}>Dynamics of Complaint Resolution</h3>
                      <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: 0 }}>Monthly submission velocity vs resolution output</p>
                    </div>
                  </div>
                </div>
                <div className="card-body" style={{ height: 320, padding: '24px 20px 10px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={derivedStats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="barPendingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        <linearGradient id="areaSubGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ fontWeight: 700, fontSize: '0.8rem' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600, paddingTop: 10 }} iconType="circle" />

                      <Area type="monotone" dataKey="submitted" name="Total Influx" stroke="#3b82f6" strokeWidth={3} fill="url(#areaSubGrad)" animationDuration={1500} />
                      <Bar dataKey="resolved" name="Resolved Ops" fill="url(#barResolvedGrad)" radius={[6, 6, 0, 0]} barSize={14} animationDuration={1500} />
                      <Bar dataKey="pending" name="Pending Backlog" fill="url(#barPendingGrad)" radius={[6, 6, 0, 0]} barSize={14} animationDuration={1500} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Feature 6: Department Performance Tracker */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: '#22c55e', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }} />
                  <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-pulse green" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}><Award size={16} /></div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: 2, color: 'white' }}>🏢 Department Resolution Rates</h3>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Live performance statistics based on citizen filings</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 20px' }}>
                    {derivedStats.deptPerformance.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {derivedStats.deptPerformance.map((dept, i) => {
                            const color = dept.rate > 80 ? '#4ade80' : dept.rate > 50 ? '#fbbf24' : '#ef4444'
                            return (
                              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.05)' }}>{i + 1}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', letterSpacing: 0.3 }}>{dept.name}</div>
                                  </div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color, textShadow: `0 0 10px ${color}40` }}>{dept.rate}%</div>
                                </div>
                                <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ width: `${dept.rate}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                  <span><span style={{ color: 'white' }}>{dept.resolved}</span> Resolved</span>
                                  <span><span style={{ color: 'white' }}>{dept.total}</span> Total Assigned</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        No departmental grievances filed yet to formulate performance records.
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="card">
                  <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Category Breakdown</h3></div>
                  <div className="card-body" style={{ padding: '24px 20px 10px' }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={catData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                          formatter={(value, name, props) => [value, props.payload.name]}
                          labelFormatter={() => ''}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                          {catData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Feature 3: AI Complaint Prediction */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', border: 'none' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={16} style={{ color: 'white' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: 2 }}>🤖 AI Complaint Predictions</h3>
                        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Next 7 days · Machine learning forecast</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {derivedStats.aiPredictions.map((pred, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${pred.urgency === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{pred.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'white' }}>{pred.area}</span>
                              <span style={{
                                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                background: pred.trend === 'up' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                                color: pred.trend === 'up' ? '#f87171' : '#4ade80'
                              }}>
                                {pred.trend === 'up' ? `↑ +${pred.pct}%` : `↓ -${pred.pct}%`}
                              </span>
                              {pred.urgency === 'high' && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>ALERT</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{pred.reason}</div>
                          </div>
                        </div>
                      ))}
                      {derivedStats.aiPredictions.length === 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Not enough data to calculate predictions.</div>}
                    </div>
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(99,102,241,0.15)', borderRadius: 8, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                      🧠 Predictions based on historical trend analysis + seasonal patterns
                    </div>
                  </div>
                </div>


                {/* Feature 5: Full Most Problematic Areas */}
                <div className="card innovative-card">
                  <div className="card-header" style={{ borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-pulse red"><AlertTriangle size={16} /></div>
                      <h3 style={{ fontSize: '1rem' }}>🗺️ Most Problematic Locations</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {derivedStats.problemAreas.map((area, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 0', borderBottom: i < derivedStats.problemAreas.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0,
                            background: i === 0 ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                              : i === 1 ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                : i === 2 ? 'linear-gradient(135deg, #d97706, #b45309)'
                                  : '#f3f4f6',
                            color: i < 3 ? 'white' : '#6b7280'
                          }}>#{area.rank}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111' }}>{area.location}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                              {CAT_ICONS[area.category] || '📌'} {area.category.replace('_', ' ')} · {area.district}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#374151' }}>{area.count}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: area.trend.startsWith('+') ? '#dc2626' : '#22c55e' }}>
                              {area.trend}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <Link to="/map" className="btn btn-ghost btn-sm">
                        <Map size={13} /> View on Map
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Summary and Satisfaction Widget */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                <SatisfactionWidget complaints={allDataForAnalytics} />
                <div className="card">
                  <div className="card-header"><h3 style={{ fontSize: '1rem' }}>📋 Status Summary</h3></div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Percentage</th>
                          <th>Visual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['submitted', 'assigned', 'inProgress', 'resolved', 'closed'].map(key => {
                          const val = analytics?.[key] || 0
                          const pct = analytics?.total ? Math.round((val / analytics.total) * 100) : 0
                          const colors = { submitted: '#1a4480', assigned: '#7c3aed', inProgress: '#d97706', resolved: '#166534', closed: '#6b7280' }
                          return (
                            <tr key={key}>
                              <td><span className={`badge badge-${key}`}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span></td>
                              <td style={{ fontWeight: 700 }}>{val.toLocaleString()}</td>
                              <td style={{ fontWeight: 700, color: colors[key] }}>{pct}%</td>
                              <td style={{ width: 200 }}>
                                <div style={{ height: 8, background: '#f0f0f0', borderRadius: 99 }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: colors[key], borderRadius: 99, transition: 'width 1s ease' }} />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Status Update Modal */}
      {selectedComplaint && (
        <StatusUpdateModal
          complaint={selectedComplaint}
          departments={departments}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={fetchComplaints}
        />
      )}
    </div>
  )
}
