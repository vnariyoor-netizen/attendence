import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import {
  Camera,
  ScanFace,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Clock,
  Users,
} from 'lucide-react'
import { markAttendance } from '../utils/api'

export default function Capture() {
  const webcamRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [autoCapture, setAutoCapture] = useState(false)
  const [results, setResults] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')
  const [sessionCount, setSessionCount] = useState(0)
  const intervalRef = useRef(null)

  const captureFrame = useCallback(async () => {
    if (!webcamRef.current) return
    setCapturing(true)
    setError('')

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        setError('Failed to capture frame')
        setCapturing(false)
        return
      }

      // Convert base64 to blob
      const res = await fetch(imageSrc)
      const blob = await res.blob()

      const response = await markAttendance(blob)
      const data = response.data

      if (data.status === 'success') {
        const result = {
          ...data,
          time: new Date().toLocaleTimeString(),
          id: Date.now(),
        }
        setLastResult(result)
        setResults((prev) => [result, ...prev].slice(0, 20))
        setSessionCount((c) => c + 1)
      } else if (data.status === 'no_face') {
        setLastResult({ status: 'no_face', time: new Date().toLocaleTimeString() })
      } else if (data.status === 'unknown') {
        setLastResult({
          status: 'unknown',
          confidence: data.confidence,
          time: new Date().toLocaleTimeString(),
        })
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend not available — start the FastAPI server')
      setLastResult(null)
    } finally {
      setCapturing(false)
    }
  }, [])

  // Auto capture mode
  useEffect(() => {
    if (autoCapture) {
      intervalRef.current = setInterval(captureFrame, 3000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoCapture, captureFrame])

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <h1 className="page-title">Attendance Capture</h1>
        <p className="page-subtitle">
          Point the camera at students to mark attendance via face recognition
        </p>
      </div>

      <div style={styles.layout}>
        {/* Left: Camera */}
        <div style={styles.cameraSection} className="animate-in animate-in-delay-1">
          <div className="webcam-container" style={styles.webcamWrap}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.8}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: 'user',
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Scan line */}
            {(capturing || autoCapture) && <div className="webcam-scan" />}

            {/* Corner brackets */}
            <div style={styles.corners}>
              <div style={{ ...styles.corner, top: 16, left: 16, borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
              <div style={{ ...styles.corner, top: 16, right: 16, borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
              <div style={{ ...styles.corner, bottom: 16, left: 16, borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
              <div style={{ ...styles.corner, bottom: 16, right: 16, borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
            </div>

            {/* Status overlay */}
            <div style={styles.cameraStatus}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="live-dot" />
                <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 500 }}>
                  LIVE
                </span>
              </div>
              {capturing && (
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 500 }}>
                  Processing...
                </span>
              )}
            </div>

            {/* Last result overlay */}
            {lastResult && lastResult.status === 'success' && (
              <div style={styles.resultOverlay}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem' }}>
                  {lastResult.student?.name} — {(lastResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button
              className="btn btn-primary"
              onClick={captureFrame}
              disabled={capturing}
              style={{ flex: 1 }}
            >
              <Camera size={18} />
              {capturing ? 'Processing...' : 'Capture & Identify'}
            </button>
            <button
              className={`btn ${autoCapture ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setAutoCapture(!autoCapture)}
              style={{ flex: 1 }}
            >
              <Zap size={18} />
              {autoCapture ? 'Stop Auto' : 'Auto Capture'}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginTop: 12 }}>
              <XCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div style={styles.resultsSection} className="animate-in animate-in-delay-2">
          {/* Session stats */}
          <div style={styles.sessionStats}>
            <div className="card" style={styles.miniStat}>
              <Users size={16} color="var(--accent)" />
              <div>
                <div style={styles.miniValue}>{sessionCount}</div>
                <div style={styles.miniLabel}>Captured</div>
              </div>
            </div>
            <div className="card" style={styles.miniStat}>
              <Clock size={16} color="var(--text-muted)" />
              <div>
                <div style={styles.miniValue}>
                  {results[0]?.time || '--:--'}
                </div>
                <div style={styles.miniLabel}>Last Scan</div>
              </div>
            </div>
          </div>

          {/* Recognition feed */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Recognition Feed</span>
              {results.length > 0 && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => { setResults([]); setSessionCount(0) }}
                >
                  <RefreshCw size={12} />
                  Clear
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div style={styles.emptyFeed}>
                <ScanFace size={40} color="var(--text-muted)" strokeWidth={1} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 12 }}>
                  No faces captured yet. Click capture or enable auto mode.
                </p>
              </div>
            ) : (
              <div style={styles.feedList}>
                {results.map((r) => (
                  <div key={r.id} style={styles.feedItem}>
                    <div style={{
                      ...styles.feedAvatar,
                      background: r.status === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
                      color: r.status === 'success' ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {r.status === 'success' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.feedName}>
                        {r.status === 'success'
                          ? r.student?.name || 'Identified'
                          : 'Unknown Face'}
                      </div>
                      <div style={styles.feedMeta}>
                        {r.status === 'success' && r.student?.roll_number && (
                          <span>{r.student.roll_number}</span>
                        )}
                        <span>{r.time}</span>
                      </div>
                    </div>
                    {r.confidence && (
                      <div style={styles.confidencePill}>
                        <div style={{
                          ...styles.confBar,
                          width: `${r.confidence * 100}%`,
                          background: r.confidence >= 0.85
                            ? 'var(--success)'
                            : r.confidence >= 0.7
                              ? 'var(--warning)'
                              : 'var(--danger)',
                        }} />
                        <span style={styles.confText}>
                          {(r.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  cameraSection: {
    flex: '0 0 55%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  webcamWrap: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 30px rgba(79,110,247,0.1)',
  },
  corners: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 3,
  },
  cameraStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10,14,26,0.85)',
    backdropFilter: 'blur(8px)',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid rgba(34,197,94,0.3)',
  },
  controls: {
    display: 'flex',
    gap: 12,
  },
  resultsSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: 500,
  },
  sessionStats: {
    display: 'flex',
    gap: 12,
  },
  miniStat: {
    flex: 1,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  miniValue: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  miniLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  emptyFeed: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 400,
    overflowY: 'auto',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background 0.2s',
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedName: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  feedMeta: {
    display: 'flex',
    gap: 8,
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  confidencePill: {
    position: 'relative',
    width: 56,
    textAlign: 'center',
  },
  confBar: {
    height: 4,
    borderRadius: 2,
    background: 'var(--ink-border)',
    marginBottom: 4,
    transition: 'width 0.4s ease',
  },
  confText: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
}
