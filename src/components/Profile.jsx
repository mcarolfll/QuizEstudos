import React, { useMemo } from 'react'
import { getXPProgress, ACHIEVEMENTS } from '../utils/gamification'

export default function Profile({ userStats, history, favorites, wrongQuestions }) {
  const xpProgress = useMemo(() => getXPProgress(userStats.xp || 0), [userStats.xp])
  
  const performanceByTheme = useMemo(() => {
    const themes = {}
    history.forEach(attempt => {
      if (!themes[attempt.theme]) {
        themes[attempt.theme] = { correct: 0, total: 0 }
      }
      themes[attempt.theme].correct += attempt.score
      themes[attempt.theme].total += attempt.total
    })
    
    return Object.entries(themes).map(([theme, data]) => ({
      theme: theme || 'Geral',
      percent: Math.round((data.correct / data.total) * 100),
      correct: data.correct,
      total: data.total
    }))
  }, [history])
  
  const weeklyData = useMemo(() => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      
      const dayAttempts = history.filter(h => {
        const attemptDate = new Date(h.createdAt).toDateString()
        return attemptDate === dateStr
      })
      
      const totalXP = dayAttempts.reduce((sum, a) => sum + (a.xpEarned || 0), 0)
      const avgScore = dayAttempts.length > 0
        ? Math.round(dayAttempts.reduce((sum, a) => sum + (a.score / a.total * 100), 0) / dayAttempts.length)
        : 0
      
      last7Days.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        xp: totalXP,
        score: avgScore,
        quizzes: dayAttempts.length
      })
    }
    
    return last7Days
  }, [history])
  
  const maxXP = Math.max(...weeklyData.map(d => d.xp), 1)
  const maxScore = Math.max(...weeklyData.map(d => d.score), 1)
  
  const unlockedAchievements = ACHIEVEMENTS.filter(a => 
    userStats.achievements?.includes(a.id)
  )
  
  return (
    <div className="profile-container">
      {/* Perfil (XP + nível) */}
      <div className="card profile-main">
        <h2>Perfil do Estudante</h2>
        
        {/* XP e Nível */}
        <div className="xp-section">
          <div className="level-badge">
            <div className="level-number">Nível {xpProgress.level}</div>
            <div className="level-xp">{xpProgress.xp} XP</div>
          </div>
          
          <div className="xp-bar-container">
            <div className="xp-bar-label">
              <span>Progresso para nível {xpProgress.level + 1}</span>
              <span>{Math.round(xpProgress.progress)}%</span>
            </div>
            <div className="xp-bar">
              <div 
                className="xp-bar-fill" 
                style={{ width: `${xpProgress.progress}%` }}
              ></div>
            </div>
            <div className="xp-bar-info">
              {xpProgress.xpInCurrentLevel} / {xpProgress.xpNeededForNextLevel} XP
            </div>
          </div>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="card profile-stats">
        <h2>Estatísticas</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{userStats.streak || 0}</div>
            <div className="stat-label">Dias consecutivos</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{history.length}</div>
            <div className="stat-label">Quizzes completados</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{favorites.length}</div>
            <div className="stat-label">Favoritos</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-value">{wrongQuestions.length}</div>
            <div className="stat-label">Para revisar</div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de evolução semanal */}
      <div className="card weekly-chart">
        <h3>Evolução Semanal</h3>
        <div className="chart-container">
          <div className="chart-bars">
            {weeklyData.map((day, i) => (
              <div key={i} className="chart-bar-group">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar xp-bar-chart"
                    style={{ height: `${(day.xp / maxXP) * 100}%` }}
                    title={`${day.xp} XP`}
                  ></div>
                  <div 
                    className="chart-bar score-bar-chart"
                    style={{ height: `${(day.score / maxScore) * 100}%` }}
                    title={`${day.score}%`}
                  ></div>
                </div>
                <div className="chart-label">{day.date}</div>
                <div className="chart-quizzes">{day.quizzes} quiz</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Desempenho por tema */}
      {performanceByTheme.length > 0 && (
        <div className="card theme-performance-card">
          <h3>Desempenho por Tema</h3>
          <div className="theme-performance">
            {performanceByTheme.map((item, i) => (
              <div key={i} className="theme-performance-item">
                <div className="theme-name">{item.theme}</div>
                <div className="theme-bar-container">
                  <div 
                    className="theme-bar"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                  <span className="theme-percent">{item.percent}%</span>
                </div>
                <div className="theme-details">
                  {item.correct}/{item.total} acertos
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Conquistas */}
      <div className="card achievements-card">
        <h3>Conquistas</h3>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map(achievement => {
            const unlocked = unlockedAchievements.some(a => a.id === achievement.id)
            return (
              <div 
                key={achievement.id} 
                className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-desc">{achievement.description}</div>
                {unlocked && (
                  <div className="achievement-xp">+{achievement.xp} XP</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
