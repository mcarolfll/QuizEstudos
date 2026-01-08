import React, { useState } from 'react'

export default function CreateQuiz({ onSave }) {
  const [title, setTitle] = useState('Novo Quiz')
  const [quizTheme, setQuizTheme] = useState('Geral')
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correct: 0, explanation: '', theme: 'Geral' }
  ])

  function updateQuestion(idx, patch) {
    setQuestions(prev =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    )
  }

  function addQuestion() {
    setQuestions(prev => [
      ...prev,
      { text: '', options: ['', '', '', ''], correct: 0, explanation: '', theme: quizTheme }
    ])
  }

  function removeQuestion(idx) {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  function save() {
    const cleaned = questions
      .map((q, idx) => ({
        id: `q${Date.now()}-${idx}`,
        text: q.text.trim(),
        options: q.options.map(o => o.trim()),
        correct: Number(q.correct),
        explanation: q.explanation?.trim() || '',
        theme: q.theme || quizTheme
      }))
      .filter(q => q.text && q.options.every(o => o))

    if (cleaned.length === 0)
      return alert('Adicione ao menos uma pergunta válida.')

    const entry = {
      id: Date.now(),
      title,
      theme: quizTheme,
      questions: cleaned,
      created: new Date().toISOString()
    }

    onSave ? onSave(entry) : (() => {
      const quizzes = JSON.parse(localStorage.getItem('user-quizzes') || '[]')
      quizzes.unshift(entry)
      localStorage.setItem('user-quizzes', JSON.stringify(quizzes))
    })()
  }

  return (
    <div className="card create-quiz">
      <h2>Criar novo quiz</h2>

      <div className="title-input-wrapper">
        <div className="option-edit">
          <input
            className="opt-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: JavaScript Básico"
          />
        </div>
      </div>

      <div className="title-input-wrapper">
        <label className="field-label">Tema do Quiz</label>
        <div className="option-edit">
          <input
            className="opt-input"
            value={quizTheme}
            onChange={e => setQuizTheme(e.target.value)}
            placeholder="Ex: Programação, Matemática, etc."
          />
        </div>
      </div>

      <div className="questions-row">
        {questions.map((q, i) => (
          <div className="question-edit" key={i}>
            <div className="question-header">
              <strong>Pergunta {i + 1}</strong>
              <button
                className="tiny danger"
                onClick={() => removeQuestion(i)}
                disabled={questions.length === 1}
              >
                Remover
              </button>
            </div>

            <input
              className="question-input"
              placeholder="Digite a pergunta"
              value={q.text}
              onChange={e => updateQuestion(i, { text: e.target.value })}
            />

            <textarea
              className="explanation-input"
              placeholder="Explicação (opcional) - será exibida após responder"
              value={q.explanation || ''}
              onChange={e => updateQuestion(i, { explanation: e.target.value })}
              rows="3"
            />

            <div className="options-edit">
              {q.options.map((opt, j) => (
                <label
                  key={j}
                  className={`option-edit ${
                    Number(q.correct) === j ? 'correct' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={Number(q.correct) === j}
                    onChange={() => updateQuestion(i, { correct: j })}
                  />

                  <input
                    className="opt-input"
                    placeholder={`Opção ${j + 1}`}
                    value={opt}
                    onChange={e => {
                      const newOpts = [...q.options]
                      newOpts[j] = e.target.value
                      updateQuestion(i, { options: newOpts })
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="actions-row">
        <button onClick={addQuestion}>+ Pergunta</button>
        <div className="actions-spacer"></div>
        <button onClick={save}>Salvar quiz</button>
      </div>
    </div>
  )
}
