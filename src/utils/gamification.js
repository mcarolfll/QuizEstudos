// Sistema de Gamificação
export const XP_PER_CORRECT = 10
export const XP_PER_QUIZ = 50
export const XP_PER_STREAK_DAY = 20

export function calculateLevel(xp) {
  // Fórmula: nível = sqrt(xp / 100)
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function getXPForLevel(level) {
  return Math.pow(level - 1, 2) * 100
}

export function getXPProgress(xp) {
  const currentLevel = calculateLevel(xp)
  const xpForCurrentLevel = getXPForLevel(currentLevel)
  const xpForNextLevel = getXPForLevel(currentLevel + 1)
  const xpInCurrentLevel = xp - xpForCurrentLevel
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel
  
  return {
    level: currentLevel,
    xp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progress: (xpInCurrentLevel / xpNeededForNextLevel) * 100
  }
}

export const ACHIEVEMENTS = [
  { id: 'first_quiz', name: 'Primeiro Passo', description: 'Complete seu primeiro quiz', icon: '🎯', xp: 50 },
  { id: 'perfect_score', name: 'Perfeição', description: 'Acerte todas as questões de um quiz', icon: '⭐', xp: 100 },
  { id: 'streak_7', name: 'Semana de Foco', description: 'Estude 7 dias consecutivos', icon: '🔥', xp: 150 },
  { id: 'streak_30', name: 'Mestre da Disciplina', description: 'Estude 30 dias consecutivos', icon: '👑', xp: 500 },
  { id: 'level_5', name: 'Estudante Avançado', description: 'Alcance o nível 5', icon: '📚', xp: 200 },
  { id: 'level_10', name: 'Mestre dos Estudos', description: 'Alcance o nível 10', icon: '🏆', xp: 500 },
  { id: 'review_10', name: 'Revisor Dedicado', description: 'Complete 10 revisões', icon: '🔄', xp: 150 },
  { id: 'favorites_20', name: 'Colecionador', description: 'Marque 20 questões como favoritas', icon: '⭐', xp: 200 }
]

export function checkAchievements(userStats, history, favorites, reviews) {
  const unlocked = []
  
  // Primeiro quiz
  if (history.length > 0 && !userStats.achievements.includes('first_quiz')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'first_quiz'))
  }
  
  // Score perfeito
  const hasPerfect = history.some(h => h.score === h.total)
  if (hasPerfect && !userStats.achievements.includes('perfect_score')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'perfect_score'))
  }
  
  // Streaks
  if (userStats.streak >= 7 && !userStats.achievements.includes('streak_7')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'streak_7'))
  }
  if (userStats.streak >= 30 && !userStats.achievements.includes('streak_30')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'streak_30'))
  }
  
  // Níveis
  const level = calculateLevel(userStats.xp)
  if (level >= 5 && !userStats.achievements.includes('level_5')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'level_5'))
  }
  if (level >= 10 && !userStats.achievements.includes('level_10')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'level_10'))
  }
  
  // Revisões
  if (reviews.length >= 10 && !userStats.achievements.includes('review_10')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'review_10'))
  }
  
  // Favoritos
  if (favorites.length >= 20 && !userStats.achievements.includes('favorites_20')) {
    unlocked.push(ACHIEVEMENTS.find(a => a.id === 'favorites_20'))
  }
  
  return unlocked.filter(Boolean)
}
