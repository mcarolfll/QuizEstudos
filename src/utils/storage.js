// Gerenciamento de armazenamento local
export const STORAGE_KEYS = {
  THEME: 'quiz-theme',
  QUIZZES: 'user-quizzes',
  HISTORY: 'quiz-history',
  USER_STATS: 'user-stats',
  FAVORITES: 'question-favorites',
  WRONG_QUESTIONS: 'wrong-questions',
  STUDY_STREAK: 'study-streak'
}

export function getStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (e) {
    console.error(`Error reading ${key}:`, e)
    return defaultValue
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Error writing ${key}:`, e)
  }
}

export function updateStreak() {
  const today = new Date().toDateString()
  const streakData = getStorage(STORAGE_KEYS.STUDY_STREAK, { lastDate: null, count: 0 })
  
  if (streakData.lastDate === today) {
    return streakData.count // Já estudou hoje
  }
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  
  if (streakData.lastDate === yesterdayStr) {
    // Continua o streak
    streakData.count += 1
  } else if (streakData.lastDate === null || streakData.lastDate !== today) {
    // Novo streak ou quebrou
    streakData.count = 1
  }
  
  streakData.lastDate = today
  setStorage(STORAGE_KEYS.STUDY_STREAK, streakData)
  return streakData.count
}
