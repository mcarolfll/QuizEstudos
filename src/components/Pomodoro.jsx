import React, { useState, useEffect, useRef } from 'react'

const WORK_TIME = 25 * 60 // 25 minutos em segundos
const SHORT_BREAK = 5 * 60 // 5 minutos
const LONG_BREAK = 15 * 60 // 15 minutos

export default function Pomodoro({ onComplete }) {
  const [mode, setMode] = useState('work') // work, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(WORK_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    
    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft])
  
  function handleComplete() {
    setIsRunning(false)
    const newSessions = sessions + 1
    
    if (mode === 'work') {
      setSessions(newSessions)
      
      if (newSessions % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK)
        if (onComplete) onComplete('longBreak')
      } else {
        setMode('shortBreak')
        setTimeLeft(SHORT_BREAK)
        if (onComplete) onComplete('shortBreak')
      }
    } else {
      setMode('work')
      setTimeLeft(WORK_TIME)
      if (onComplete) onComplete('work')
    }
  }
  
  function toggleTimer() {
    setIsRunning(!isRunning)
  }
  
  function resetTimer() {
    setIsRunning(false)
    if (mode === 'work') {
      setTimeLeft(WORK_TIME)
    } else if (mode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK)
    } else {
      setTimeLeft(LONG_BREAK)
    }
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  
  const progress = mode === 'work' 
    ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100
    : mode === 'shortBreak'
    ? ((SHORT_BREAK - timeLeft) / SHORT_BREAK) * 100
    : ((LONG_BREAK - timeLeft) / LONG_BREAK) * 100
  
  const modeLabels = {
    work: 'Foco',
    shortBreak: 'Pausa Curta',
    longBreak: 'Pausa Longa'
  }
  
  return (
    <div className="card pomodoro-card">
      <h2>Modo Foco (Pomodoro)</h2>
      
      <div className="pomodoro-mode">
        <span className={`mode-tag ${mode === 'work' ? 'active' : ''}`}>Foco</span>
        <span className={`mode-tag ${mode === 'shortBreak' ? 'active' : ''}`}>Pausa</span>
        <span className={`mode-tag ${mode === 'longBreak' ? 'active' : ''}`}>Longa</span>
      </div>
      
      <div className="pomodoro-timer">
        <div className="timer-circle">
          <svg className="timer-svg" viewBox="0 0 200 200">
            <circle
              className="timer-bg"
              cx="100"
              cy="100"
              r="90"
            />
            <circle
              className="timer-progress"
              cx="100"
              cy="100"
              r="90"
              style={{
                strokeDasharray: `${2 * Math.PI * 90}`,
                strokeDashoffset: `${2 * Math.PI * 90 * (1 - progress / 100)}`
              }}
            />
          </svg>
          <div className="timer-time">{formatTime(timeLeft)}</div>
          <div className="timer-mode">{modeLabels[mode]}</div>
        </div>
      </div>
      
      <div className="pomodoro-controls">
        <button onClick={toggleTimer} className={isRunning ? 'pause' : 'play'}>
          {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <button onClick={resetTimer}>🔄 Reiniciar</button>
      </div>
      
      <div className="pomodoro-stats">
        <div className="pomodoro-stat">
          <span className="stat-label">Sessões completadas:</span>
          <span className="stat-value">{sessions}</span>
        </div>
      </div>
      
      {mode !== 'work' && (
        <div className="pomodoro-notice">
          💡 Hora de descansar! Volte quando estiver pronto.
        </div>
      )}
    </div>
  )
}
