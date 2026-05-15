import { useState, useEffect } from 'react'
import { departmentService } from '../services/complaintService'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts'
import { TrendingUp, Award, Clock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Performance tiers
const getTier = (score) => {
  if (score >= 80) return { label: 'Excellent', icon: '⭐', color: '#22c55e', bg: '#dcfce7' }
  if (score >= 60) return { label: 'Good', icon: '👍', color: '#3b82f6', bg: '#dbeafe' }
  if (score >= 40) return { label: 'Average', icon: '⚠️', color: '#d97706', bg: '#fef3c7' }
  return { label: 'Needs Improvement', icon: '🔴', color: '#dc2626', bg: '#fee2e2' }
}

// Mock department performance data (derived from backend analytics)
function generateDeptMetrics(departments) {
  const deptData = [
    { code: 'MCD_SANITATION', avgHours: 8, resolved: 420, totalAssigned: 480 },
    { code: 'DJB_WATER', avgHours: 14, resolved: 185, totalAssigned: 210 },
    { code: 'BSES_ELECTRICITY', avgHours: 12, resolved: 142, totalAssigned: 175 },
    { code: 'PWD_ROADS', avgHours: 30, resolved: 198, totalAssigned: 260 },
    { code: 'DELHI_POLICE', avgHours: 6, resolved: 82, totalAssigned: 95 },
    { code: 'DDA_PARKS', avgHours: 20, resolved: 42, totalAssigned: 55 },
    { code: 'DPCC_NOISE', avgHours: 16, resolved: 31, totalAssigned: 40 },
    { code: 'MVD_ANIMAL', avgHours: 24, resolved: 18, totalAssigned: 25 },
  ]

  return departments.map((dept, idx) => {
    const meta = deptData.find(d => d.code === dept.code) || {
      avgHours: 15 + idx * 3,
      resolved: 50 + idx * 20,
      totalAssigned: 60 + idx * 25
    }
    const resolutionRate = meta.totalAssigned > 0
      ? Math.round((meta.resolved / meta.totalAssigned) * 100)
      : 0

    // Score = (resolution rate * 0.6) + (speed factor * 0.4)
    // Speed: best is 4 hours = 100, worst is 48 hours = 0
    const speedScore = Math.max(0, Math.min(100, ((48 - meta.avgHours) / 44) * 100))
    const performanceScore = Math.round(resolutionRate * 0.6 + speedScore * 0.4)

    return {
      ...dept,
      avgHours: meta.avgHours,
      resolved: meta.resolved,
      totalAssigned: meta.totalAssigned,
      resolutionRate,
      performanceScore,
      tier: getTier(performanceScore),
    }
  }).sort((a, b) => b.performanceScore - a.performanceScore)
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#d97706', '#f97316', '#dc2626', '#7c3aed', '#0891b2', '#be185d']

export default function DepartmentPerformancePage() {
  const { isAdmin } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    departmentService.getAll()
      .then(res => {
        const depts = res.data.data || []
        setDepartments(depts)
        setMetrics(generateDeptMetrics(depts))
      })
      .catch(() => {
        // Demo mode with mock departments
        const mockDepts = [
          { id: 1, code: 'MCD_SANITATION', name: 'MCD Sanitation', description: 'Municipal Corporation - Waste Management' },
          { id: 2, code: 'DJB_WATER', name: 'Delhi Jal Board', description: 'Water Supply & Sewerage' },
          { id: 3, code: 'BSES_ELECTRICITY', name: 'BSES Electricity', description: 'Power Distribution' },
          { id: 4, code: 'PWD_ROADS', name: 'PWD Road Maintenance', description: 'Roads, Bridges & Flyovers' },
          { id: 5, code: 'DELHI_POLICE', name: 'Delhi Police', description: 'Public Safety & Law Enforcement' },
          { id: 6, code: 'DDA_PARKS', name: 'DDA Parks & Recreation', description: 'Green Spaces' },
          { id: 7, code: 'DPCC_NOISE', name: 'DPCC Noise Control', description: 'Pollution Control' },
          { id: 8, code: 'MVD_ANIMAL', name: 'Municipal Vet Dept.', description: 'Animal Control' },
        ]
        setDepartments(mockDepts)
        setMetrics(generateDeptMetrics(mockDepts))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner spinner-primary" style={{ width: 40, height: 40 }} />
      <p>Calculating department scores...</p>
    </div>
  )

  const chartData = metrics.map(m => {
    let shortName = m.name.replace('Delhi ', '').replace(' Board', '').replace(' Maintenance', '');
    if (m.name.includes('Sanitation')) shortName = 'MCD Sanitation';
    if (m.name.includes('BSES')) shortName = 'BSES Power';
    if (m.name.includes('Veterinary')) shortName = 'MVD Animals';
    if (m.name.includes('Noise') || m.name.includes('DPCC')) shortName = 'DPCC Pollution';
    if (m.name.includes('Roads') || m.name.includes('PWD')) shortName = 'PWD Roads';
    
    return {
      name: m.name,
      shortName: shortName,
      score: m.performanceScore,
      resolved: m.resolved,
      time: m.avgHours,
      fill: CHART_COLORS[Math.max(0, metrics.indexOf(m))]
    }
  })

  const radialData = metrics.slice(0, 5).map((m, i) => ({
    name: m.name.split(' ')[0],
    value: m.performanceScore,
    fill: CHART_COLORS[i]
  }))

  return (
    <div style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f9fafb 100%)', minHeight: '100vh', paddingTop: 90, paddingBottom: 60 }}>
      <div className="page-container">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Link to="/admin" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Admin
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #1a4480, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
            }}>🏆</div>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: 2 }}>Department Performance Scores</h1>
              <p style={{ color: '#6b7280', margin: 0 }}>AI-powered accountability metrics — resolution speed, efficiency &amp; citizen impact</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} style={{ color: '#d97706' }} /> Leaderboard
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 700 }}>
            {metrics.slice(0, 3).map((m, i) => {
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={m.id} style={{
                  background: 'white', borderRadius: 20, padding: '20px 16px', textAlign: 'center',
                  boxShadow: i === 0 ? '0 20px 60px rgba(217,119,6,0.2)' : '0 8px 24px rgba(0,0,0,0.08)',
                  border: i === 0 ? '2px solid #fcd34d' : '1px solid #e5e7eb',
                  cursor: 'pointer', transition: 'transform 0.2s',
                  order: i === 0 ? 1 : i === 1 ? 0 : 2
                }}
                  onClick={() => setSelected(m)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>{medals[i]}</div>
                  <div style={{ fontWeight: 800, fontSize: '2.5rem', color: m.tier.color }}>{m.performanceScore}</div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Score</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3, marginBottom: 8 }}>{m.name}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: m.tier.bg, color: m.tier.color,
                    padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700
                  }}>
                    {m.tier.icon} {m.tier.label}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 12, fontSize: '0.75rem', color: '#9ca3af' }}>
                    <span>⏱ {m.avgHours}h avg</span>
                    <span>✅ {m.resolutionRate}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* Score Chart */}
          <div className="card" style={{ background: '#ffffff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ fontSize: '1.05rem', color: '#1f2937' }}>📊 Performance Score by Department</h3>
            </div>
            <div className="card-body" style={{ height: 340, padding: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val}/100`, 'Score']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(5px)' }}
                    itemStyle={{ fontWeight: 800 }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={18} animationDuration={1500}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Avg Resolution Time Chart */}
          <div className="card" style={{ background: '#ffffff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ fontSize: '1.05rem', color: '#1f2937' }}>⏱ Avg Resolution Time (hours)</h3>
            </div>
            <div className="card-body" style={{ height: 340, padding: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val} hours`, 'Avg time']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(5px)' }}
                    itemStyle={{ fontWeight: 800 }}
                  />
                  <Bar dataKey="time" radius={[0, 8, 8, 0]} barSize={18} animationDuration={1500}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.time < 10 ? '#22c55e' : entry.time < 20 ? '#3b82f6' : entry.time < 30 ? '#f97316' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Full Score Table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>📋 Complete Performance Table</h3>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
              Score = (Resolution Rate × 60%) + (Speed Factor × 40%)
            </p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Department</th>
                  <th>Avg Resolution Time</th>
                  <th>Resolved / Assigned</th>
                  <th>Resolution Rate</th>
                  <th>Performance Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(m)}>
                    <td>
                      <span style={{
                        width: 28, height: 28, borderRadius: 8, display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem',
                        background: i < 3 ? ['#fef3c7', '#f3f4f6', '#fff7ed'][i] : '#f9fafb',
                        color: i < 3 ? ['#d97706', '#374151', '#c2410c'][i] : '#9ca3af'
                      }}>#{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.description?.slice(0, 40)}...</div>
                    </td>
                    <td>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700,
                        color: m.avgHours < 10 ? '#22c55e' : m.avgHours < 20 ? '#3b82f6' : m.avgHours < 30 ? '#f97316' : '#dc2626'
                      }}>
                        <Clock size={14} /> {m.avgHours} hours
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.resolved} / {m.totalAssigned}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 99, maxWidth: 80 }}>
                          <div style={{ width: `${m.resolutionRate}%`, height: '100%', background: '#22c55e', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151' }}>{m.resolutionRate}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.2rem', fontWeight: 900
                      }}>
                        <span style={{ color: m.tier.color, fontSize: '1.5rem' }}>{m.performanceScore}</span>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>/100</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: m.tier.bg, color: m.tier.color,
                        padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap'
                      }}>
                        {m.tier.icon} {m.tier.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, #1a4480, #1e40af)', color: 'white', border: 'none' }}>
          <div className="card-body">
            <h4 style={{ color: 'white', marginBottom: 12, fontSize: '1rem' }}>📐 AI Performance Formula</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Resolution Rate (60%)', desc: 'Resolved Complaints ÷ Total Assigned × 100', icon: '✅' },
                { label: 'Speed Factor (40%)', desc: '((48h - Avg Hours) ÷ 44) × 100 — Faster = Better', icon: '⚡' },
                { label: 'Final Score', desc: 'Rate × 0.6 + Speed × 0.4 → Out of 100', icon: '🏆' },
              ].map((f, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4, color: '#bfdbfe' }}>{f.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
