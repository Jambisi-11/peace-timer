import React, { useEffect, useRef, useState } from 'react'
import './App.css'
import PeaceLogo from './assets/peace-logo.jpg'

/**
 * Countdown Timer App
 * - Click the small gear icon (top-left) to open operator controls.
 * - Controls are hidden by default so audience sees only the big timer.
 * - Background upload can be local-only (URL.createObjectURL) or you can
 *   POST files to the optional server endpoint (/upload) if you run the server.
 */
export default function App() {
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(300) // default 5:00
  const [running, setRunning] = useState(false)
  const endRef = useRef(null)
  const timerRef = useRef(null)

  // Controls state
  const [showControls, setShowControls] = useState(false) // toggled by gear
  const [minutesInput, setMinutesInput] = useState('')
  const [bgUrl, setBgUrl] = useState(null)
  const [uploadingToServer, setUploadingToServer] = useState(false) // optional server upload

  const radius = 140
  const circumference = 2 * Math.PI * radius

  // stroke offset calculated from secondsLeft
  const progress =
    (secondsLeft / (Number(minutesInput || secondsLeft / 60) * 60)) *
    circumference

  // Tick logic
  useEffect(() => {
    // cleanup on unmount
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (running) {
      // ensure an end timestamp exists
      if (!endRef.current) endRef.current = Date.now() + secondsLeft * 1000
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        const remain = Math.max(
          0,
          Math.round((endRef.current - Date.now()) / 1000)
        )
        setSecondsLeft(remain)
        if (remain <= 0) {
          clearInterval(timerRef.current)
          setRunning(false)
          endRef.current = null
          // You can replace this with audio or visual cue
          // alert('Time is up!');
        }
      }, 250)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [running])

  // Format mm:ss
  function formatTime(s) {
    const hh = Math.floor(s / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  // Control actions
  function applyMinutes() {
    const n = Number(minutesInput)
    if (!Number.isFinite(n) || n <= 0) return alert('Enter minutes > 0')
    setSecondsLeft(Math.round(n * 60))
    // stop any running timer so operator can start when ready
    setRunning(false)
    endRef.current = null
  }

  function handleLocalUpload(file) {
    if (!file) return
    // revoke prior objectUrl if any
    if (bgUrl && bgUrl.startsWith('blob:')) URL.revokeObjectURL(bgUrl)
    const obj = URL.createObjectURL(file)
    setBgUrl(obj)
  }

  async function handleServerUpload(file) {
    if (!file) return
    setUploadingToServer(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      // server returns { filename: 'uploads/....' }
      // the backend serves it at http://localhost:4000/uploads/...
      setBgUrl(`http://localhost:4000/${json.filename}`)
    } catch (err) {
      console.error(err)
      alert('Upload failed. Is the server running on port 4000?')
    } finally {
      setUploadingToServer(false)
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Use local object URL by default
    handleLocalUpload(file)
  }

  function onFileChangeServer(e) {
    const file = e.target.files?.[0]
    if (!file) return
    handleServerUpload(file)
  }

  function startTimer() {
    if (secondsLeft <= 0) return alert('Set minutes first')

    setShowControls(false)

    endRef.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }

  function pauseTimer() {
    // stop and preserve remaining seconds
    clearInterval(timerRef.current)
    setRunning(false)
    endRef.current = null
  }

  function resumeTimer() {
    if (secondsLeft <= 0) return
    endRef.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }

  function resetTimer() {
    clearInterval(timerRef.current)
    setRunning(false)
    endRef.current = null
    setSecondsLeft(0)
  }

  function clearBg() {
    if (bgUrl && bgUrl.startsWith('blob:')) URL.revokeObjectURL(bgUrl)
    setBgUrl(null)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  return (
    <div
      className="cs-container"
      style={{
        backgroundImage: bgUrl
          ? `url(${bgUrl})`
          : `linear-gradient(180deg,#0b1020,#101827)`,
      }}
    >
      {/* small gear icon - visible to operator; click to toggle control panel */}
      <button
        className="cs-gear"
        aria-label="Toggle operator controls"
        onClick={() => setShowControls((s) => !s)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
            strokeWidth="1.2"
          />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09c0-.6-.39-1.12-.98-1.45a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06c.38-.38.5-.96.33-1.46A1.65 1.65 0 0 0 3 15v-1a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1-1.51H2a2 2 0 1 1 0-4h.09c.6 0 1.12-.39 1.45-.98.18-.5.05-1.08-.33-1.46L3.15 3.15A2 2 0 1 1 5.98.32l.06.06c.38.38.96.5 1.46.33.6-.27 1.12-.98 1.45-1.45H10a2 2 0 1 1 4 0v.09c0 .6.39 1.12.98 1.45.5.18 1.08.05 1.46-.33l.06-.06A2 2 0 1 1 18.85 3.15l-.06.06c-.38.38-.5.96-.33 1.46.27.6.98 1.12 1.45 1.45H22a2 2 0 1 1 0 4h-.09c-.6 0-1.12.39-1.45.98-.18.5-.05 1.08.33 1.46l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06c-.38-.38-.96-.5-1.46-.33-.6.27-1.12.98-1.45 1.45V15z"
            strokeWidth="0.6"
          />
        </svg>
      </button>

      {/* Operator control panel - only visible after gear click */}
      {showControls && (
        <div
          className="cs-controls"
          role="region"
          aria-label="Operator controls"
        >
          <div className="row">
            <input
              type="number"
              min="1"
              placeholder="Minutes"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
            />
            <button onClick={applyMinutes}>Set</button>
          </div>

          <div className="row">
            <label className="file-label">
              Upload (local)
              <input type="file" accept="image/*" onChange={onFileChange} />
            </label>

            <label className="file-label">
              Upload (server)
              <input
                type="file"
                accept="image/*"
                onChange={onFileChangeServer}
              />
            </label>
          </div>

          <div className="row">
            <button onClick={startTimer}>Start</button>
            <button onClick={pauseTimer}>Pause</button>
            <button onClick={resumeTimer}>Resume</button>
            <button onClick={resetTimer}>Reset</button>
          </div>

          <div className="row">
            <button onClick={toggleFullscreen}>Fullscreen</button>
            <button onClick={clearBg}>Clear BG</button>
            <div style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
              {uploadingToServer ? 'Uploading...' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Central circular timer */}
      <div className="cs-center">
        <svg width="350" height="350" className="progress-ring">
          <circle
            r={radius}
            cx="175"
            cy="175"
            stroke="#ffffff20"
            strokeWidth="12"
            fill="none"
          />

          <circle
            r={radius}
            cx="175"
            cy="175"
            stroke="url(#grad)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />

          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffbb00" />
              <stop offset="100%" stopColor="#e9142dff" />
            </linearGradient>
          </defs>
        </svg>

        <div className="cs-inner">
           <img src={PeaceLogo} alt="Logo" className="cs-logo" />

          <div className="cs-time">{formatTime(secondsLeft)}</div>
          <div className="cs-sub">HS | MS | SS</div>

          {/* Warning for last quarter */}
          {secondsLeft <= Math.ceil((Number(minutesInput || 5) * 60) / 4) &&
            secondsLeft > 0 && (
              <div className="cs-warning">
                Only {formatTime(secondsLeft)} remaining!
              </div>
            )}

          {/* Time up caption */}
          {secondsLeft === 0 && <div className="cs-caption">Time up!</div>}
        </div>
      </div>
    </div>
  )
}
