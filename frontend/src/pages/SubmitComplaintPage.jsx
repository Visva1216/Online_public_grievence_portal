import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { complaintService, departmentService } from '../services/complaintService'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Spinner, ConfidenceBar } from '../components/UI'
import {
  Mic, MicOff, X, Upload, MapPin, Brain,
  ChevronRight, CheckCircle2
} from 'lucide-react'

const CATEGORIES = [
  { value: 'SANITATION', label: '🗑️ Sanitation' },
  { value: 'WATER_SUPPLY', label: '💧 Water Supply' },
  { value: 'ELECTRICITY', label: '⚡ Electricity' },
  { value: 'ROAD_MAINTENANCE', label: '🛣️ Road Maintenance' },
  { value: 'PUBLIC_SAFETY', label: '🚔 Public Safety' },
  { value: 'PARKS_GARDENS', label: '🌿 Parks & Gardens' },
  { value: 'NOISE_POLLUTION', label: '🔊 Noise Pollution' },
  { value: 'ANIMAL_NUISANCE', label: '🐾 Animal Nuisance' },
  { value: 'OTHER', label: '📌 Other' },
]
const LANGUAGES = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'hi', label: '🇮🇳 Hindi (हिंदी)' },
  { value: 'ur', label: '🇵🇰 Urdu (اردو)' },
  { value: 'pa', label: '🇮🇳 Punjabi (ਪੰਜਾਬੀ)' },
  { value: 'bn', label: '🇧🇩 Bengali (বাংলা)' },
]
const STEPS = ['Description', 'Location', 'Evidence', 'Review']

function LocationPicker({ value, onChange }) {
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    })
    return null
  }

  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
  })

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: 12, fontSize: '0.85rem' }}>
        <MapPin size={14} />
        <span>Click on the map to pin exact location of the issue</span>
      </div>
      <div className="map-container" style={{ height: 320 }}>
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
          <MapEvents />
          {value.lat && value.lng && (
            <Marker position={[value.lat, value.lng]} icon={icon} />
          )}
        </MapContainer>
      </div>
      {value.lat && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, fontSize: '0.8rem', color: '#1a4480', fontFamily: 'monospace' }}>
          📍 {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}

export default function SubmitComplaintPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    originalLanguage: 'en',
    category: searchParams.get('category') || '',
    latitude: null,
    longitude: null,
    address: '',
    ward: '',
    district: '',
    pincode: '',
  })
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [aiHint, setAiHint] = useState(null)
  const [submittedId, setSubmittedId] = useState(null)

  // Dropzone
  const onDrop = useCallback(acceptedFiles => {
    const newFiles = acceptedFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }))
    setImages(prev => [...prev, ...newFiles].slice(0, 5))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 10 * 1024 * 1024
  })

  // AI Categorize on description change
  useEffect(() => {
    if (form.description.length < 30) { setAiHint(null); return }
    const timeout = setTimeout(() => {
      // Client-side rule-based hint (mirror of backend fallback)
      const text = form.description.toLowerCase()
      let cat = null
      if (['garbage', 'waste', 'trash', 'kuda', 'गंदगी', 'कूड़ा'].some(k => text.includes(k))) cat = 'SANITATION'
      else if (['water', 'pipe', 'leak', 'पानी', 'नल'].some(k => text.includes(k))) cat = 'WATER_SUPPLY'
      else if (['electricity', 'power', 'light', 'bulb', 'बिजली'].some(k => text.includes(k))) cat = 'ELECTRICITY'
      else if (['road', 'pothole', 'सड़क', 'गड्ढा'].some(k => text.includes(k))) cat = 'ROAD_MAINTENANCE'
      else if (['noise', 'loud', 'शोर'].some(k => text.includes(k))) cat = 'NOISE_POLLUTION'
      if (cat) {
        setAiHint(cat)
        if (!form.category) setForm(f => ({ ...f, category: cat }))
      }
    }, 800)
    return () => clearTimeout(timeout)
  }, [form.description])

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      const chunks = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        // Use Web Speech API for transcription
        const recognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (recognition) {
          const r = new recognition()
          r.lang = form.originalLanguage === 'hi' ? 'hi-IN' : 'en-IN'
          r.onresult = (e) => {
            const transcript = e.results[0][0].transcript
            setForm(f => ({
              ...f,
              description: f.description ? f.description + ' ' + transcript : transcript
            }))
            toast.success('Voice transcribed successfully!')
          }
          r.start()
        }
      }
      mr.start()
      setIsRecording(true)
      let t = 0
      timerRef.current = setInterval(() => setRecordingTime(++t), 1000)
    } catch (err) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordingTime(0)
  }

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!form.title.trim()) e.title = 'Title is required'
      if (!form.description || form.description.length < 10) e.description = 'Description must be at least 10 characters'
    }
    if (step === 1) {
      if (!form.latitude) e.location = 'Please select location on map'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validateStep()) setStep(s => s + 1) }
  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      const data = { ...form }
      if (!data.category) delete data.category;
      fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))

      images.forEach(({ file }) => fd.append('images', file))
      if (audioBlob) fd.append('voice', new File([audioBlob], 'voice.webm', { type: 'audio/webm' }))

      const res = await complaintService.submit(fd)
      const complaintId = res.data.data.complaintId
      setSubmittedId(complaintId)
      toast.success('Complaint submitted successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`

  if (submittedId) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
        <div className="card page-enter" style={{ padding: '48px 32px' }}>
          <div style={{
            width: 80, height: 80, background: '#dcfce7', color: '#16a34a',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '2.5rem'
          }}>
            ✅
          </div>
          <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: 16 }}>Submission Successful!</h1>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: 32 }}>
            Thank you for bringing this to our attention. Your complaint has been received and is being processed by our AI system.
          </p>

          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 24, marginBottom: 32, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>
              Your Complaint ID
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1a4480', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              {submittedId}
            </div>
            <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#9ca3af' }}>
              Please save this ID for future tracking and reference.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={() => navigate(`/track/${submittedId}`)}
              style={{ padding: '14px' }}
            >
              Track Status Now
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setSubmittedId(null)
                  setStep(0)
                  setForm({
                    title: '', description: '', originalLanguage: 'en', category: '',
                    latitude: null, longitude: null, address: '', ward: '', district: '', pincode: ''
                  })
                  setImages([])
                  setAudioBlob(null)
                }}
              >
                File Another Complaint
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, fontSize: '0.875rem', color: '#6b7280' }}>
          A confirmation email has been sent to your registered email address.
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '100px 24px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#9ca3af', marginBottom: 12 }}>
          <a href="/" style={{ color: '#1a4480' }}>Home</a>
          <ChevronRight size={14} />
          <span>File a Complaint</span>
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>📝 File a Complaint</h1>
        <p style={{ color: '#6b7280' }}>Report a civic issue to the relevant government department</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%', height: 4, borderRadius: 99,
              background: i <= step ? '#1a4480' : '#e5e7eb',
              transition: 'background 0.3s'
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: i === step ? 700 : 400, color: i === step ? '#1a4480' : '#9ca3af' }}>
              {i < step ? '✓ ' : ''}{s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Description */}
      {step === 0 && (
        <div className="card page-enter">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem' }}>🗒️ Complaint Details</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Language */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Language</label>
              <select className="select input" value={form.originalLanguage}
                onChange={e => setForm(f => ({ ...f, originalLanguage: e.target.value }))}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <span className="form-hint">If not English, we'll auto-translate for processing.</span>
            </div>

            {/* Title */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Complaint Title *</label>
              <input
                id="complaint-title"
                className={`input ${errors.title ? 'error' : ''}`}
                placeholder="e.g., Open manhole near Gate No. 5, Lajpat Nagar"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(e2 => ({ ...e2, title: undefined })) }}
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Category */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Category
                {aiHint && <span style={{ marginLeft: 8, fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 99 }}>🧠 AI Suggested: {aiHint.replace('_', ' ')}</span>}
              </label>
              <select id="category-select" className="select input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Let AI detect automatically</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description *</label>
              <textarea
                id="complaint-description"
                className={`textarea ${errors.description ? 'error' : ''}`}
                placeholder="Please describe the issue in detail – include when it started, how it's affecting residents, etc."
                value={form.description}
                rows={5}
                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(e2 => ({ ...e2, description: undefined })) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {errors.description
                  ? <span className="form-error">{errors.description}</span>
                  : <span className="form-hint">{form.description.length} chars — min 10</span>}
              </div>
            </div>

            {/* Voice Input */}
            <div>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>🎤 Voice Complaint (Optional)</label>
              <div className={`voice-recorder ${isRecording ? 'recording' : ''}`}>
                <button type="button" id="record-btn" className={`record-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <div style={{ textAlign: 'center' }}>
                  {isRecording
                    ? <><div style={{ fontWeight: 700, color: '#dc2626', fontSize: '1.1rem' }}>🔴 Recording {formatTime(recordingTime)}</div><div style={{ fontSize: '0.8rem', color: '#dc2626', opacity: 0.7 }}>Click to stop and transcribe</div></>
                    : <><div style={{ fontWeight: 600 }}>Click to record voice complaint</div><div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Speech will be transcribed and added to description</div></>
                  }
                </div>
                {audioBlob && !isRecording && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#166534', background: '#dcfce7', padding: '8px 16px', borderRadius: 8 }}>
                    <CheckCircle2 size={16} /> Voice recorded & transcribed
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleNext} id="step0-next-btn">
              Next: Location <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="card page-enter">
          <div className="card-header"><h3 style={{ fontSize: '1.1rem' }}>📍 Complaint Location</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <LocationPicker
              value={{ lat: form.latitude, lng: form.longitude }}
              onChange={async ({ lat, lng }) => {
                setForm(f => ({ ...f, latitude: lat, longitude: lng }));
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                  const data = await res.json();
                  if (data && data.address) {
                    const addr = data.address;
                    let foundDistrict = addr.state_district || addr.city_district || addr.district || addr.county || addr.suburb || addr.city;
                    
                    // Delhi specific robust fallback
                    if (!foundDistrict && data.display_name.includes('Delhi')) {
                      const text = data.display_name;
                      if (text.includes('South Delhi')) foundDistrict = 'South Delhi';
                      else if (text.includes('North Delhi')) foundDistrict = 'North Delhi';
                      else if (text.includes('East Delhi')) foundDistrict = 'East Delhi';
                      else if (text.includes('West Delhi')) foundDistrict = 'West Delhi';
                      else if (text.includes('Central Delhi')) foundDistrict = 'Central Delhi';
                      else if (text.includes('New Delhi')) foundDistrict = 'New Delhi';
                      else foundDistrict = 'Delhi / General';
                    }

                    setForm(f => ({
                      ...f,
                      address: data.display_name || f.address,
                      district: foundDistrict || 'Unmapped District',
                      pincode: addr.postcode || f.pincode,
                      ward: addr.neighbourhood || addr.suburb || addr.village || f.ward
                    }));
                  }
                } catch (err) {
                  console.error("Reverse geocoding failed", err);
                }
              }}
            />
            {errors.location && <div className="alert alert-danger"><span>⚠️ {errors.location}</span></div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Address</label>
                <input className="input" placeholder="Street, Area, Landmark" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ward</label>
                <input className="input" placeholder="Ward name / number" value={form.ward}
                  onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">District</label>
                <input className="input" placeholder="e.g. South Delhi" value={form.district}
                  onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pincode</label>
                <input className="input" placeholder="110 001" value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} maxLength={6} />
              </div>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={handleBack}>← Back</button>
            <button className="btn btn-primary" onClick={handleNext} id="step1-next-btn">
              Next: Photos <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Evidence */}
      {step === 2 && (
        <div className="card page-enter">
          <div className="card-header"><h3 style={{ fontSize: '1.1rem' }}>📸 Photo Evidence (Optional)</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} id="image-dropzone">
              <input {...getInputProps()} />
              <div className="dropzone-icon">📤</div>
              <div style={{ fontWeight: 600, color: '#374151' }}>
                {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to browse'}
              </div>
              <p>JPG, PNG, WebP — max 10MB each (up to 5 images)</p>
              <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#1a4480', fontWeight: 600 }}>
                🧠 AI will analyze images to detect issue type automatically
              </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                    <img src={img.preview} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                      <X size={12} />
                    </button>
                    <div style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#6b7280', background: '#f9fafb', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {img.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={handleBack}>← Back</button>
            <button className="btn btn-primary" onClick={handleNext} id="step2-next-btn">
              Review Complaint <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="page-enter">
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem' }}>✅ Review & Submit</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Title', value: form.title },
                { label: 'Category', value: form.category || 'Auto-detect by AI' },
                { label: 'Language', value: LANGUAGES.find(l => l.value === form.originalLanguage)?.label },
                { label: 'Location', value: form.latitude ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}` : 'Not set' },
                { label: 'Address', value: form.address || '—' },
                { label: 'Photos', value: `${images.length} image(s) attached` },
                { label: 'Voice', value: audioBlob ? 'Voice complaint attached' : 'Not recorded' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 12, borderBottom: '1px solid #f5f5f5', paddingBottom: 12 }}>
                  <span style={{ minWidth: 120, fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{row.label}</span>
                  <span style={{ fontSize: '0.9rem', color: '#111' }}>{row.value}</span>
                </div>
              ))}
              {form.description && (
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Description</span>
                  <p style={{ background: '#f9fafb', padding: 12, borderRadius: 8, fontSize: '0.9rem', color: '#374151' }}>{form.description}</p>
                </div>
              )}
            </div>
          </div>


          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={handleBack} disabled={loading}>← Back</button>
            <button id="submit-complaint-btn" className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><Spinner size={18} light /> Submitting...</>
                : <>🚀 Submit Complaint</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
