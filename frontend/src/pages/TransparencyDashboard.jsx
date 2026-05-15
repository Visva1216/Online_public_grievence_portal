import { useState, useEffect } from 'react'
import { analyticsService } from '../services/complaintService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { TrendingUp, CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react'

const COLORS = ['#1a4480', '#22c55e', '#f97316', '#dc2626', '#7c3aed', '#0891b2', '#d97706', '#be185d']

const CAT_LABELS = {
  SANITATION: '🗑️ Sanitation', WATER_SUPPLY: '💧 Water', ELECTRICITY: '⚡ Electricity',
  ROAD_MAINTENANCE: '🛣️ Roads', PUBLIC_SAFETY: '🚔 Safety', PARKS_GARDENS: '🌿 Parks',
  NOISE_POLLUTION: '🔊 Noise', ANIMAL_NUISANCE: '🐾 Animals', OTHER: '📌 Other'
}

const MOCK_TREND = [
  { month: 'Oct', submitted: 180, resolved: 140 },
  { month: 'Nov', submitted: 210, resolved: 175 },
  { month: 'Dec', submitted: 195, resolved: 168 },
  { month: 'Jan', submitted: 280, resolved: 210 },
  { month: 'Feb', submitted: 245, resolved: 230 },
  { month: 'Mar', submitted: 320, resolved: 275 },
]

export default function TransparencyDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsService.getAnalytics()
      .then(res => setData(res.data.data))
      .catch(() => {
        // Demo data
        setData({
          total: 1240, submitted: 180, assigned: 95, inProgress: 89, resolved: 820, closed: 56,
          byCategory: { SANITATION: 380, WATER_SUPPLY: 210, ELECTRICITY: 175, ROAD_MAINTENANCE: 260, PUBLIC_SAFETY: 95, PARKS_GARDENS: 55, NOISE_POLLUTION: 40, ANIMAL_NUISANCE: 25 },
          byPriority: { CRITICAL: 45, HIGH: 280, MEDIUM: 650, LOW: 265 },
          last7Days: 87, last30Days: 320
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner spinner-primary" style={{ width: 40, height: 40 }} />
      <p>Loading analytics...</p>
    </div>
  )

  const totalPending = (data?.submitted || 0) + (data?.assigned || 0) + (data?.inProgress || 0)
  const resolutionRate = data?.total ? Math.round((data.resolved / data.total) * 100) : 0

  const categoryData = Object.entries(data?.byCategory || {}).map(([key, val]) => ({
    name: CAT_LABELS[key] || key, value: val
  }))

  const priorityData = Object.entries(data?.byPriority || {}).map(([key, val]) => ({
    name: key, value: val,
    fill: { CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#d97706', LOW: '#22c55e' }[key] || '#1a4480'
  }))

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh', paddingTop: 90, paddingBottom: 60 }}>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ background: 'transparent', borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #1a4480, #3b82c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              📊
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem' }}>Transparency Dashboard</h1>
              <p style={{ margin: 0 }}>Public grievance statistics for Government of NCT of Delhi</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          {[
            { icon: '📬', label: 'Total Complaints', value: data?.total?.toLocaleString(), color: 'blue', sub: `+${data?.last7Days} this week` },
            { icon: '✅', label: 'Resolved', value: data?.resolved?.toLocaleString(), color: 'green', sub: `${resolutionRate}% resolution rate` },
            { icon: '⏳', label: 'Pending', value: totalPending.toLocaleString(), color: 'orange', sub: 'Awaiting resolution' },
            { icon: '🔴', label: 'Submitted Today-ish', value: data?.last7Days?.toLocaleString(), color: 'red', sub: 'Last 7 days' },
            { icon: '🔵', label: 'In Progress', value: data?.inProgress?.toLocaleString(), color: 'blue', sub: 'Being resolved' },
            { icon: '🔒', label: 'Closed', value: data?.closed?.toLocaleString(), color: 'purple', sub: 'Fully closed' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.color}`}>
              <div className="stat-icon" style={{
                background: { blue: '#dbeafe', green: '#dcfce7', orange: '#ffedd5', red: '#fee2e2', purple: '#ede9fe', yellow: '#fef3c7' }[s.color]
              }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value || '—'}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Category Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem' }}>📊 Complaints by Category</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Complaints" radius={[4, 4, 0, 0]}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Pie */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem' }}>🎯 Complaints by Priority</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {priorityData.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.fill }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.value}</span>
                  </div>
                ))}
                {/* Resolution rate */}
                <div style={{ marginTop: 16, padding: '12px', background: '#f0f9ff', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#1a4480', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Resolution Rate</div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99 }}>
                    <div style={{ width: `${resolutionRate}%`, height: '100%', background: '#22c55e', borderRadius: 99, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', marginTop: 6 }}>{resolutionRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>📈 Complaint Submission vs Resolution Trend (Last 6 Months)</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={MOCK_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#1a4480" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Table */}
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
                  const val = data?.[key] || 0
                  const pct = data?.total ? Math.round((val / data.total) * 100) : 0
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
  )
}
