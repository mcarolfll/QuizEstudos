import React from 'react'

export default function QuestionExplanation({ question, userAnswer, isCorrect, onClose }) {
  if (!question.explanation) {
    return null
  }
  
  return (
    <div className="explanation-overlay" onClick={onClose}>
      <div className="explanation-card" onClick={e => e.stopPropagation()}>
        <div className={`explanation-header ${isCorrect ? 'correct' : 'incorrect'}`}>
          <span className="explanation-icon">
            {isCorrect ? '✅' : '❌'}
          </span>
          <span className="explanation-title">
            {isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}
          </span>
        </div>
        
        <div className="explanation-content">
          <div className="explanation-question">
            <strong>Pergunta:</strong> {question.text}
          </div>
          
          <div className="explanation-answer">
            <strong>Sua resposta:</strong> {question.options[userAnswer]}
          </div>
          
          {!isCorrect && (
            <div className="explanation-correct">
              <strong>Resposta correta:</strong> {question.options[question.correct]}
            </div>
          )}
          
          <div className="explanation-text">
            <strong>Explicação:</strong>
            <p>{question.explanation}</p>
          </div>
        </div>
        
        <button className="explanation-close" onClick={onClose}>
          Continuar
        </button>
      </div>
    </div>
  )
}
