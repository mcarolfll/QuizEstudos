import React, { useState, useEffect } from 'react'
import QuestionExplanation from './QuestionExplanation'

export default function ReviewMode({ wrongQuestions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [reviewed, setReviewed] = useState(new Set())
  
  useEffect(() => {
    if (wrongQuestions.length === 0 && onComplete) {
      onComplete()
    }
  }, [wrongQuestions.length, onComplete])
  
  if (wrongQuestions.length === 0) {
    return (
      <div className="card">
        <h2>Nada para revisar! 🎉</h2>
        <p>Parabéns! Você não tem questões erradas para revisar.</p>
        <button onClick={onComplete}>Voltar</button>
      </div>
    )
  }
  
  const currentQuestion = wrongQuestions[index]
  
  function selectOption(optIdx) {
    if (showExplanation) return
    
    setCurrentAnswer(optIdx)
    const correct = optIdx === currentQuestion.correct
    setIsCorrect(correct)
    setAnswers(prev => ({ ...prev, [index]: optIdx }))
    
    if (correct && currentQuestion.id) {
      setReviewed(prev => new Set([...prev, currentQuestion.id]))
    }
    
    if (currentQuestion.explanation) {
      setShowExplanation(true)
    }
  }
  
  function handleNext() {
    setShowExplanation(false)
    setCurrentAnswer(null)
    
    if (index < wrongQuestions.length - 1) {
      setIndex(index + 1)
    } else {
      // Revisão completa
      if (onComplete) {
        onComplete(reviewed)
      }
    }
  }
  
  function handlePrev() {
    if (index > 0) {
      setIndex(index - 1)
      setShowExplanation(false)
      setCurrentAnswer(null)
    }
  }
  
  return (
    <>
      <div className="card">
        <div className="review-header">
          <h2>Modo Revisão</h2>
          <div className="review-progress">
            Questão {index + 1} de {wrongQuestions.length}
          </div>
        </div>
        
        <div className="question">
          <p className="question-text">{currentQuestion.text}</p>
        </div>
        
        <div className="options">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = currentAnswer === i
            const isCorrectOption = i === currentQuestion.correct
            const showResult = showExplanation
            
            let className = 'option'
            if (showResult) {
              if (isCorrectOption) className += ' correct-answer'
              if (isSelected && !isCorrectOption) className += ' wrong-answer'
            }
            if (isSelected) className += ' selected'
            
            return (
              <label 
                key={i} 
                className={className}
                onClick={() => !showResult && selectOption(i)}
              >
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => {}}
                  disabled={showResult}
                />
                {opt}
                {showResult && isCorrectOption && <span className="check-mark">✓</span>}
              </label>
            )
          })}
        </div>
        
        <div className="controls">
          <button onClick={handlePrev} disabled={index === 0}>
            Anterior
          </button>
          <button onClick={handleNext}>
            {index < wrongQuestions.length - 1 ? 'Próxima' : 'Finalizar Revisão'}
          </button>
        </div>
      </div>
      
      {showExplanation && currentQuestion.explanation && (
        <QuestionExplanation
          question={currentQuestion}
          userAnswer={currentAnswer}
          isCorrect={isCorrect}
          onClose={handleNext}
        />
      )}
    </>
  )
}
