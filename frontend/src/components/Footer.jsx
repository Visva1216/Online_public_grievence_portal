import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="page-container">
        <div className="footer-grid">
          {/* About */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '2rem' }}>🏛️</span>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>Delhi Grievance Portal</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Government of NCT of Delhi</div>
              </div>
            </div>
            <p>An AI-powered online platform for citizens to lodge grievances, track status in real-time, and receive timely resolution.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {['📘', '🐦', '📺', '📸'].map((icon, i) => (
                <a key={i} href="#" style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', transition: 'background 0.2s',
                  color: 'white'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >{icon}</a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4>Quick Links</h4>
            {[
              { to: '/submit', label: 'File a Complaint' },
              { to: '/track', label: 'Track Complaint' },
              { to: '/map', label: 'Complaint Map' },
              { to: '/transparency', label: 'Transparency Dashboard' },
              { to: '/register', label: 'Citizen Registration' },
            ].map(l => (
              <Link key={l.to} to={l.to}>{l.label}</Link>
            ))}
          </div>

          {/* Departments */}
          <div>
            <h4>Departments</h4>
            {[
              'MCD – Sanitation', 'Delhi Jal Board', 'BSES Electricity',
              'Public Works Dept.', 'Delhi Police', 'Delhi Development Authority'
            ].map(d => (
              <a key={d} href="#">{d}</a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="tel:1800110093" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} /> 1800-110-093 (Toll Free)
              </a>
              <a href="mailto:grievance@delhi.gov.in" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} /> grievance@delhi.gov.in
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                Delhi Secretariat, I.P. Estate, New Delhi – 110002
              </a>
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Helpline Hours</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Mon – Sat: 9 AM to 6 PM</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Government of NCT of Delhi. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Disclaimer</a>
            <a href="#">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
