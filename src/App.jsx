import React, { useEffect, useMemo, useState } from 'react'
import questionsDefault from './questions'
import CreateQuiz from './CreateQuiz'
import Profile from './components/Profile'
import Pomodoro from './components/Pomodoro'
import ReviewMode from './components/ReviewMode'
import QuestionExplanation from './components/QuestionExplanation'
import { 
  getStorage, 
  setStorage, 
  STORAGE_KEYS, 
  updateStreak 
} from './utils/storage'
import { 
  XP_PER_CORRECT, 
  XP_PER_QUIZ, 
  checkAchievements,
  getXPProgress 
} from './utils/gamification'

export default function App() {
  const [view, setView] = useState('home')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [theme, setTheme] = useState(() => getStorage(STORAGE_KEYS.THEME, 'default'))
  const [userQuizzes, setUserQuizzes] = useState(() => getStorage(STORAGE_KEYS.QUIZZES, []))
  const [currentQuizId, setCurrentQuizId] = useState('default')
  const [history, setHistory] = useState(() => getStorage(STORAGE_KEYS.HISTORY, []))
  const [favorites, setFavorites] = useState(() => getStorage(STORAGE_KEYS.FAVORITES, []))
  const [wrongQuestions, setWrongQuestions] = useState(() => getStorage(STORAGE_KEYS.WRONG_QUESTIONS, []))
  const [userStats, setUserStats] = useState(() => getStorage(STORAGE_KEYS.USER_STATS, {
    xp: 0,
    achievements: [],
    streak: 0
  }))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setStorage(STORAGE_KEYS.THEME, theme)
  }, [theme])

  useEffect(() => {
    setStorage(STORAGE_KEYS.HISTORY, history)
  }, [history])

  useEffect(() => {
    setStorage(STORAGE_KEYS.FAVORITES, favorites)
  }, [favorites])

  useEffect(() => {
    setStorage(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions)
  }, [wrongQuestions])

  useEffect(() => {
    setStorage(STORAGE_KEYS.USER_STATS, userStats)
  }, [userStats])

  const [questions, setQuestions] = useState(questionsDefault)

  function toggleFavorite(questionId) {
    setFavorites(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId)
      } else {
        return [...prev, questionId]
      }
    })
  }

  function selectOption(qIdx, optIdx) {
    if (showExplanation) return
    
    setCurrentAnswer(optIdx)
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
    
    const question = questions[qIdx]
    const isCorrect = optIdx === question.correct
    
    if (!isCorrect && question.id) {
      // Adiciona à lista de questões erradas se não estiver lá
      setWrongQuestions(prev => {
        const exists = prev.some(q => q.id === question.id)
        if (!exists) {
          return [...prev, { ...question, quizId: currentQuizId }]
        }
        return prev
      })
    }
    
    // Mostra explicação se existir
    if (question.explanation) {
      setShowExplanation(true)
    }
  }

  function handleExplanationClose() {
    setShowExplanation(false)
    setCurrentAnswer(null)
  }

  function next() {
    if (showExplanation) {
      handleExplanationClose()
    }
    
    if (index < questions.length - 1) {
      setIndex(index + 1)
    } else {
      finish()
    }
  }

  function prev() {
    if (index > 0) {
      setIndex(index - 1)
      setShowExplanation(false)
      setCurrentAnswer(null)
    }
  }

  function finish() {
    let s = 0
    const wrong = []
    
    questions.forEach((q, i) => {
      if (Number(answers[i]) === q.correct) {
        s++
      } else if (q.id) {
        wrong.push({ ...q, quizId: currentQuizId })
      }
    })

    // Calcula XP
    const xpEarned = (s * XP_PER_CORRECT) + XP_PER_QUIZ
    const newXP = (userStats.xp || 0) + xpEarned
    
    // Atualiza streak
    const streak = updateStreak()
    
    // Atualiza estatísticas
    const newStats = {
      ...userStats,
      xp: newXP,
      streak
    }
    
    // Verifica conquistas
    const newAchievements = checkAchievements(newStats, history, favorites, [])
    if (newAchievements.length > 0) {
      newStats.xp += newAchievements.reduce((sum, a) => sum + a.xp, 0)
      newStats.achievements = [
        ...(newStats.achievements || []),
        ...newAchievements.map(a => a.id)
      ]
    }
    
    setUserStats(newStats)

    const attempt = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      quizId: currentQuizId,
      theme: questions[0]?.theme || 'Geral',
      createdAt: new Date().toISOString(),
      total: questions.length,
      score: s,
      percent: Math.round((s / questions.length) * 100),
      xpEarned
    }

    setHistory(prev => [attempt, ...prev].slice(0, 100))
    
    // Adiciona questões erradas
    setWrongQuestions(prev => {
      const existingIds = new Set(prev.map(q => q.id))
      const newWrong = wrong.filter(q => !existingIds.has(q.id))
      return [...prev, ...newWrong]
    })
    
    setScore(s)
    setShowResult(true)
    setShowExplanation(false)
  }

  function handleSaveQuiz(entry) {
    const updated = [entry, ...userQuizzes]
    setUserQuizzes(updated)
    setStorage(STORAGE_KEYS.QUIZZES, updated)
    setView('list')
  }

  function loadQuiz(qz) {
    setQuestions(qz.questions)
    setIndex(0)
    setAnswers({})
    setShowResult(false)
    setShowExplanation(false)
    setCurrentAnswer(null)
    setCurrentQuizId(qz.id)
    setView('play')
  }

  function deleteQuiz(id) {
    if (!confirm('Excluir este quiz?')) return
    const updated = userQuizzes.filter(q => q.id !== id)
    setUserQuizzes(updated)
    setStorage(STORAGE_KEYS.QUIZZES, updated)
  }

  function startReview() {
    if (wrongQuestions.length === 0) {
      alert('Você não tem questões para revisar!')
      return
    }
    setView('review')
  }

  function handleReviewComplete(reviewedIds) {
    if (reviewedIds && reviewedIds.size > 0) {
      setWrongQuestions(prev => prev.filter(q => !reviewedIds.has(q.id)))
    }
    setView('home')
  }

  function handlePomodoroComplete(mode) {
    // Ganha XP extra por completar sessão de foco
    if (mode === 'work') {
      const xpEarned = 25
      setUserStats(prev => ({
        ...prev,
        xp: (prev.xp || 0) + xpEarned
      }))
    }
  }

  const lastPerformance = useMemo(() => {
    if (!history.length) return null
    return history[0]
  }, [history])

  const overallPerformance = useMemo(() => {
    if (!history.length) return null
    const totalRight = history.reduce((acc, a) => acc + a.score, 0)
    const totalQuestions = history.reduce((acc, a) => acc + a.total, 0)
    return Math.round((totalRight / totalQuestions) * 100)
  }, [history])

  const xpProgress = useMemo(() => getXPProgress(userStats.xp || 0), [userStats.xp])

  const q = questions[index]
  const isFavorite = q?.id && favorites.includes(q.id)

  return (
    <div className="app">
      {/* HEADER */}
      <header>
        <div className="brand">
          <h1>Study Quiz</h1>
          <span>Aprenda de forma ativa e personalizada</span>
        </div>

        <div className="header-stats">
          {xpProgress.level > 0 && (
            <div className="xp-display">
              <span className="level-badge-small">Nível {xpProgress.level}</span>
              <span className="xp-text">{xpProgress.xp} XP</span>
            </div>
          )}
          {userStats.streak > 0 && (
            <div className="streak-display">
              🔥 {userStats.streak} dias
            </div>
          )}
        </div>

        <div className="theme-row">
          <label>Tema</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            <option value="default">Padrão</option>
            <option value="dark">Escuro</option>
            <option value="solar">Solar</option>
            <option value="blue">Azul</option>
          </select>
        </div>

        <nav>
          <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>
            Início
          </button>
          <button onClick={() => setView('create')} className={view === 'create' ? 'active' : ''}>
            Criar Quiz
          </button>
          <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>
            Meus Quizzes
          </button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'active' : ''}>
            Perfil
          </button>
          <button onClick={() => setView('pomodoro')} className={view === 'pomodoro' ? 'active' : ''}>
            Foco
          </button>
        </nav>
      </header>

      {/* MAIN */}
      <main>
        {showResult && (
          <div className="card">
            <h2>Resultado</h2>
            <p>Você acertou {score} de {questions.length}</p>
            <p className="xp-earned">+{score * XP_PER_CORRECT + XP_PER_QUIZ} XP ganhos!</p>
            <div className="result-actions">
              <button onClick={() => { 
                setShowResult(false); 
                setIndex(0); 
                setAnswers({}) 
              }}>
                Refazer
              </button>
              {wrongQuestions.length > 0 && (
                <button onClick={startReview} className="review-btn">
                  Revisar Erros ({wrongQuestions.length})
                </button>
              )}
            </div>
          </div>
        )}

        {!showResult && view === 'home' && (
          <div className="home-grid">
            {/* CARD - Criar Quiz */}
            <div className="tile" onClick={() => setView('create')}>
              <div className="tile-content">
                <h3>Criar Quiz</h3>
                <p>Crie quizzes personalizados para estudar.</p>
                <button>Começar</button>
              </div>
            </div>

            {/* CARD - Quizzes Salvos */}
            <div className="tile" onClick={() => setView('list')}>
              <div className="tile-content">
                <h3>Quizzes Salvos</h3>
                <p>Acesse seus quizzes salvos.</p>
                <button>Ver</button>
              </div>
            </div>

            {/* CARD - Revisão */}
            <div className="tile" onClick={startReview}>
              <div className="tile-content">
                <h3>Revisar Erros</h3>
                <p>{wrongQuestions.length} questões para revisar</p>
                <button disabled={wrongQuestions.length === 0}>
                  {wrongQuestions.length > 0 ? 'Revisar' : 'Nada para revisar'}
                </button>
              </div>
            </div>

            {/* CARD - Desempenho */}
            <div className="tile">
              <div className="tile-content">
                <h3>Seu Desempenho</h3>
                <p>Último quiz concluído</p>
                <strong
                  style={{
                    fontSize: '2.4rem',
                    fontWeight: 900,
                    color: 'var(--accent)'
                  }}
                >
                  {lastPerformance ? `${lastPerformance.percent}%` : '--'}
                </strong>
                <span style={{ color: 'var(--muted)', fontSize: '.95rem' }}>
                  {overallPerformance != null
                    ? `Média geral: ${overallPerformance}%`
                    : 'Jogue para ver sua evolução'}
                </span>
              </div>
            </div>

            {/* CARD - Favoritos */}
            <div className="tile" onClick={() => setView('favorites')}>
              <div className="tile-content">
                <h3>Favoritos</h3>
                <p>{favorites.length} questões favoritadas</p>
                <button>Ver Favoritos</button>
              </div>
            </div>
          </div>
        )}

        {view === 'list' && !showResult && (
          <div className="card">
            <h2>Meus quizzes</h2>
            {userQuizzes.length === 0 && <p>Nenhum quiz salvo ainda.</p>}
            <ul>
              {userQuizzes.map(qz => (
                <li key={qz.id} className="quiz-item">
                  <div>
                    <strong>{qz.title}</strong>
                    <div className="muted small-text">
                      {qz.questions.length} perguntas • {qz.theme || 'Geral'} • criado em {new Date(qz.created).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="quiz-actions">
                    <button className="small" onClick={() => loadQuiz(qz)}>Jogar</button>
                    <button className="small danger" onClick={() => deleteQuiz(qz.id)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'create' && !showResult && (
          <CreateQuiz onSave={handleSaveQuiz} />
        )}

        {view === 'favorites' && !showResult && (
          <div className="card">
            <h2>Questões Favoritas</h2>
            {favorites.length === 0 ? (
              <p>Você ainda não tem questões favoritadas.</p>
            ) : (
              <div className="favorites-list">
                {favorites.map(favId => {
                  // Busca a questão em todos os quizzes
                  let question = null
                  userQuizzes.forEach(qz => {
                    const q = qz.questions.find(q => q.id === favId)
                    if (q) question = { ...q, quizTitle: qz.title }
                  })
                  if (!question) {
                    const q = questionsDefault.find(q => q.id === favId)
                    if (q) question = { ...q, quizTitle: 'Quiz Padrão' }
                  }
                  
                  if (!question) return null
                  
                  return (
                    <div key={favId} className="favorite-item">
                      <div className="favorite-content">
                        <h4>{question.text}</h4>
                        <p className="favorite-theme">{question.quizTitle} • {question.theme}</p>
                        {question.explanation && (
                          <p className="favorite-explanation">{question.explanation}</p>
                        )}
                      </div>
                      <button 
                        className="small danger"
                        onClick={() => toggleFavorite(favId)}
                      >
                        Remover
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {view === 'profile' && !showResult && (
          <Profile 
            userStats={userStats}
            history={history}
            favorites={favorites}
            wrongQuestions={wrongQuestions}
          />
        )}

        {view === 'pomodoro' && !showResult && (
          <Pomodoro onComplete={handlePomodoroComplete} />
        )}

        {view === 'review' && !showResult && (
          <ReviewMode 
            wrongQuestions={wrongQuestions}
            onComplete={handleReviewComplete}
          />
        )}

        {view === 'play' && q && (
          <>
            <div className="card">
              <div className="question-header-row">
                <h2>Questão {index + 1} de {questions.length}</h2>
                {q.id && (
                  <button 
                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(q.id)}
                    title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {isFavorite ? '⭐' : '☆'}
                  </button>
                )}
              </div>
              {q.theme && <div className="question-theme">Tema: {q.theme}</div>}
              <p className="question">{q.text}</p>

              <div className="options">
                {q.options.map((opt, i) => {
                  const isSelected = answers[index] === i
                  const showResult = showExplanation
                  const isCorrect = i === q.correct
                  
                  let className = 'option'
                  if (showResult) {
                    if (isCorrect) className += ' correct-answer'
                    if (isSelected && !isCorrect) className += ' wrong-answer'
                  }
                  if (isSelected) className += ' selected'
                  
                  return (
                    <label 
                      key={i} 
                      className={className}
                      onClick={() => !showResult && selectOption(index, i)}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={showResult}
                      />
                      {opt}
                      {showResult && isCorrect && <span className="check-mark">✓</span>}
                    </label>
                  )
                })}
              </div>

              <div className="controls">
                <button onClick={prev} disabled={index === 0}>
                  Anterior
                </button>
                <button onClick={next}>
                  {index < questions.length - 1 ? 'Próxima' : 'Finalizar'}
                </button>
              </div>
            </div>

            {showExplanation && q.explanation && (
              <QuestionExplanation
                question={q}
                userAnswer={currentAnswer}
                isCorrect={currentAnswer === q.correct}
                onClose={handleExplanationClose}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
