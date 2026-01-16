'use strict';

// --- Global Data Access ---
const DEFAULT_QUESTIONS = window.QUIZ_DATA || [];

// --- State Management ---
const initialState = {
  user: {
    name: 'Estudante',
    email: '',
    password: '',
    xp: 0,
    level: 1,
    quizzesCompleted: 0,
    correctAnswers: 0,
    totalQuestionsAnswered: 0,
    streak: 0,
    lastLogin: null,
    achievements: [],
    history: [], // { quizId, date, score, total, theme }
    notes: [] // { id, title, content, attachment, createdAt }
  },
  quizzes: [],
  currentView: 'dashboard',
  activeQuiz: null,
  editingQuizId: null,
  searchTerm: ''
};

let state = { ...initialState };
let nextViewAfterLogin = null;

// --- DOM Elements ---
const elements = {
  mainContent: document.getElementById('mainContent'),
  pageTitle: document.getElementById('pageTitle'),
  sidebarItems: document.querySelectorAll('.sidebar__item'),
  menuToggle: document.getElementById('menuToggle'),
  sidebar: document.getElementById('sidebar'),
  app: document.querySelector('.app'),
  searchInput: document.getElementById('searchInput'),
  
  // Header Stats
  headerXpBar: document.getElementById('headerXpBar'),
  headerLevel: document.getElementById('headerLevel'),
  userXp: document.getElementById('userXp'),
  userAvatar: document.getElementById('userAvatar'),
  userNameDisplay: document.getElementById('userNameDisplay')
};

// --- Gamification Config ---
const XP_PER_LEVEL = 500;
const XP_CORRECT = 50;
const XP_COMPLETION = 100;

const ACHIEVEMENTS = [
  { id: 'first_win', title: 'Primeiros Passos', desc: 'Complete seu primeiro quiz', icon: '🎯', condition: (u) => u.quizzesCompleted >= 1 },
  { id: 'scholar', title: 'Estudioso', desc: 'Responda 10 perguntas corretamente', icon: '📚', condition: (u) => u.correctAnswers >= 10 },
  { id: 'expert', title: 'Expert', desc: 'Alcance o nível 5', icon: '⭐', condition: (u) => u.level >= 5 },
  { id: 'master', title: 'Mestre do Quiz', desc: 'Complete 50 quizzes', icon: '👑', condition: (u) => u.quizzesCompleted >= 50 },
  { id: 'streak_3', title: 'Persistente', desc: 'Estude por 3 dias seguidos', icon: '🔥', condition: (u) => u.streak >= 3 },
  { id: 'streak_7', title: 'Imparável', desc: 'Estude por 7 dias seguidos', icon: '🚀', condition: (u) => u.streak >= 7 },
];

// --- Initialization ---
function init() {
  loadData();
  setupEventListeners();
  updateHeaderStats();
  checkStreak();
  renderView('dashboard');
}

function loadData() {
  try {
    const saved = localStorage.getItem('quizApp_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { 
        ...initialState, 
        user: { ...initialState.user, ...(parsed.user || {}) },
        quizzes: parsed.quizzes || [] // Trust the saved quizzes, even if empty
      };
      
      // If we have saved data, we do NOT re-initialize defaults unless explicitly requested.
      // However, if the saved state had NO quizzes because it was a fresh empty state (unlikely if defaults exist),
      // we might want to checking a flag. But for now, assuming "saved" means "user touched it".
      // Actually, if saved.quizzes is explicitly empty array, it means user deleted them.
      
    } else {
      state = { ...initialState };
      
      // Initialize default data ONLY if no saved data found (Fresh Start or Logout)
      if (DEFAULT_QUESTIONS.length > 0) {
        console.log('Initializing default quizzes...');
        const themes = [...new Set(DEFAULT_QUESTIONS.map(q => q.theme))];
        state.quizzes = themes.map(theme => ({
          id: 'default_' + theme.toLowerCase().replace(/\s+/g, '-'),
          title: `Quiz de ${theme}`,
          theme: theme,
          questions: DEFAULT_QUESTIONS.filter(q => q.theme === theme),
          isDefault: true,
          createdAt: new Date().toISOString()
        }));
        saveData();
      }
    }
  } catch (e) {
    console.error('Error loading data:', e);
    state = { ...initialState };
  }
}

function saveData() {
  localStorage.setItem('quizApp_v1', JSON.stringify({
    user: state.user,
    quizzes: state.quizzes
  }));
}

function checkStreak() {
  const today = new Date().toDateString();
  const lastLogin = state.user.lastLogin;

  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastLogin === yesterday.toDateString()) {
      state.user.streak = (state.user.streak || 0) + 1;
    } else {
      state.user.streak = 1;
    }
    state.user.lastLogin = today;
    saveData();
    
    // Check streak achievements
    checkAchievements();
  }
}

function setupEventListeners() {
  // Navigation
  elements.sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      navigateTo(view);
    });
  });

  // Mobile Menu
  if (elements.menuToggle) {
    elements.menuToggle.addEventListener('click', () => {
      elements.app.classList.toggle('app--sidebar-open');
    });
  }
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        elements.app.classList.contains('app--sidebar-open') && 
        !elements.sidebar.contains(e.target) && 
        !elements.menuToggle.contains(e.target)) {
      elements.app.classList.remove('app--sidebar-open');
    }
  });

  // Search Listener
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.toLowerCase().trim();
      if (state.currentView === 'quizzes') {
        renderQuizzesList();
      }
    });
    
    // Also handle enter key or search button if exists
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (state.currentView !== 'quizzes') {
          navigateTo('quizzes');
        }
      }
    });

    const searchBtn = document.querySelector('.search__btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        if (state.currentView !== 'quizzes') {
          navigateTo('quizzes');
        } else {
          renderQuizzesList();
        }
      });
    }
  }
}

// --- Navigation & Routing ---
window.navigateTo = function(view) {
  renderView(view);
};

function renderView(view) {
  state.currentView = view;
  
  // Update UI active state
  elements.sidebarItems.forEach(i => {
    if(i.getAttribute('data-view') === view) i.classList.add('sidebar__item--active');
    else i.classList.remove('sidebar__item--active');
  });

  // Close mobile sidebar
  elements.app.classList.remove('app--sidebar-open');

  // Render view
  elements.mainContent.innerHTML = ''; // Clear content
  
  switch(view) {
    case 'login':
      elements.pageTitle.textContent = 'Bem-vindo';
      // Hide sidebar/header on login? Or keep them? 
      // The prompt says "Tela de login (Antes do dashboard)".
      // Usually full screen. But let's keep layout for consistency or hide sidebar.
      // For now, render in mainContent.
      renderLogin();
      break;
    case 'dashboard':
      elements.pageTitle.textContent = 'Dashboard';
      renderDashboard();
      break;
    case 'quizzes':
      elements.pageTitle.textContent = 'Meus Quizzes';
      renderQuizzesList();
      break;
    case 'create-quiz':
      elements.pageTitle.textContent = state.editingQuizId ? 'Editar Quiz' : 'Criar Novo Quiz';
      renderCreateQuiz();
      break;
    case 'performance':
      elements.pageTitle.textContent = 'Meu Desempenho';
      renderPerformance();
      break;
    case 'ranking':
      elements.pageTitle.textContent = 'Ranking Global';
      renderRanking();
      break;
    case 'achievements':
      elements.pageTitle.textContent = 'Conquistas';
      renderAchievements();
      break;
    case 'notes':
      elements.pageTitle.textContent = 'Minhas Anotações';
      renderNotes();
      break;
    case 'profile':
      elements.pageTitle.textContent = 'Perfil do Estudante';
      renderProfile();
      break;
    default:
      renderDashboard();
  }
}

// --- Actions ---

window.saveUserProfile = () => {
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value.trim();
  
  if (!name || !email || !password) {
    alert('Preencha nome, email e senha.');
    return;
  }
  
  state.user.name = name;
  state.user.email = email;
  state.user.password = password;
  
  if (!state.user.lastLogin) {
    state.user.lastLogin = new Date().toDateString();
    state.user.streak = 1;
  }
  
  saveData();
  updateHeaderStats();
  
  const target = nextViewAfterLogin || 'dashboard';
  nextViewAfterLogin = null;
  navigateTo(target);
};

window.logout = () => {
  if(confirm('Deseja realmente sair?')) {
    localStorage.removeItem('quizApp_v1'); // Clear data to restore defaults on next login
    state = { ...initialState };
    // We don't save here, so next load will see empty storage and init defaults
    location.reload(); // Reload to force fresh start logic
  }
};

window.deleteQuiz = (quizId) => {
  const quiz = state.quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  if (!confirm('Tem certeza que deseja excluir este quiz?')) {
    return;
  }
  state.quizzes = state.quizzes.filter(q => q.id !== quizId);
  saveData();
  renderView(state.currentView);
};

window.editQuiz = (quizId) => {
  const quiz = state.quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  if (quiz.isDefault) {
    alert('Você não pode editar quizzes padrão. Tente criar um novo!');
    return;
  }
  state.editingQuizId = quizId;
  navigateTo('create-quiz');
};

window.saveNote = () => {
  const titleEl = document.getElementById('noteTitle');
  const contentEl = document.getElementById('noteContent');
  
  const title = titleEl.value.trim();
  const content = contentEl.value.trim();
  
  if (!title || !content) {
    alert('Preencha título e conteúdo da anotação.');
    return;
  }
  
  const note = {
    id: 'note_' + Date.now(),
    title,
    content,
    createdAt: new Date().toISOString()
  };
  
  state.user.notes = state.user.notes || [];
  state.user.notes.push(note);
  saveData();
  renderNotes();
};

window.deleteNote = (noteId) => {
  if(!confirm('Excluir anotação?')) return;
  state.user.notes = state.user.notes.filter(n => n.id !== noteId);
  saveData();
  renderNotes();
};

window.viewNote = (noteId) => {
  const note = state.user.notes.find(n => n.id === noteId);
  if(!note) return;
  const date = new Date(note.createdAt).toLocaleDateString();
  // CSS .note-content with white-space: pre-wrap handles newlines now
  const html = `
    <section class="section">
      <button class="secondary-button" onclick="window.navigateTo('notes')">← Voltar para anotações</button>
    </section>
    <section class="section">
      <div class="card">
        <h2>${note.title}</h2>
        <p class="text-muted-message">${date}</p>
        <div class="note-content">${note.content}</div>
        <div class="form-group-spaced">
          <button class="btn-delete" onclick="window.deleteNote('${note.id}')">Excluir anotação</button>
        </div>
      </div>
    </section>
  `;
  elements.mainContent.innerHTML = html;
};

// --- Views ---

function renderLogin() {
  const html = `
    <section class="section">
      <div class="card" style="max-width: 400px; margin: 2rem auto;">
        <h2 style="text-align:center; margin-bottom: 1rem;">Bem-vindo ao QuizEstudos! 🎓</h2>
        <p class="text-muted-message" style="text-align:center; margin-bottom: 2rem;">Crie sua conta para começar.</p>
        
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input type="text" id="userName" class="form-input" placeholder="Como devemos te chamar?" value="${state.user.name !== 'Estudante' ? state.user.name : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="userEmail" class="form-input" placeholder="seu@email.com" value="${state.user.email}">
        </div>
        <div class="form-group">
          <label class="form-label">Senha</label>
          <input type="password" id="userPassword" class="form-input" placeholder="Crie uma senha segura">
        </div>
        <button class="primary-button" style="width:100%" onclick="window.saveUserProfile()">Entrar</button>
      </div>
    </section>
  `;
  elements.mainContent.innerHTML = html;
}

function renderDashboard() {
  const nextLevelXp = state.user.level * XP_PER_LEVEL;
  const progress = (state.user.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  
  // Running Courses (Simulated by Active/Recent Quizzes)
  const userQuizzes = state.quizzes.filter(q => !q.isDefault);
  const recentQuizzes = [...state.quizzes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);
    
  // Suggested Courses (Simulated by Default Quizzes or random ones)
  const suggestedQuizzes = state.quizzes.filter(q => q.isDefault).slice(0, 2);

  const html = `
    <!-- Welcome Banner -->
    <section class="hero-banner">
      <div class="hero-banner__content">
        <h1>Bem vindo, ${state.user.name.split(' ')[0]}! 👋</h1>
        <p>A educação é o passaporte para o futuro. Continue aprendendo mais e mais.</p>
        <button class="hero-banner__btn" onclick="window.navigateTo('quizzes')">Explorar Quizzes</button>
      </div>
      <div class="hero-banner__image">
        <!-- Abstract CSS Shapes/Illustration -->
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3">📚</div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="section">
      <div class="section__header">
        <h3>Ações Rápidas</h3>
      </div>
      <div class="quick-actions-grid">
         <div class="quick-action-card" onclick="state.editingQuizId=null; window.navigateTo('create-quiz')">
           <div class="quick-action-icon" style="background: #e0e7ff; color: #4338ca;">🧩</div>
           <span>Criar Quiz</span>
         </div>
         <div class="quick-action-card" onclick="window.navigateTo('notes')">
           <div class="quick-action-icon" style="background: #fce7f3; color: #be185d;">📝</div>
           <span>Criar Anotação</span>
         </div>
         <div class="quick-action-card" onclick="window.navigateTo('quizzes')">
           <div class="quick-action-icon" style="background: #dcfce7; color: #15803d;">📚</div>
           <span>Meus Quizzes</span>
         </div>
         <div class="quick-action-card" onclick="window.navigateTo('ranking')">
           <div class="quick-action-icon" style="background: #fef9c3; color: #a16207;">🏆</div>
           <span>Ver Ranking</span>
         </div>
      </div>
    </section>

    <!-- Running Courses (Recent) -->
    <section class="section">
      <div class="section__header">
        <h3>Cursos em Andamento</h3>
      
      </div>
      <div class="quizzes-grid running-courses-grid">
        ${recentQuizzes.length > 0 ? recentQuizzes.map(q => createCourseCard(q)).join('') : '<p class="text-muted-message">Nenhum curso iniciado.</p>'}
      </div>
    </section>

    
    </div>
  `;
  
  elements.mainContent.innerHTML = html;
}

// Helper for "Running Course" card style
function createCourseCard(quiz) {
  return `
    <div class="course-card">
      <div class="course-card__header" style="background: ${getRandomGradient(quiz.id)}">
        <span class="course-card__tag">${quiz.theme}</span>
        <button class="btn-delete-course" onclick="event.stopPropagation(); window.deleteQuiz('${quiz.id}')" title="Excluir Quiz">🗑️</button>
      </div>
      <div class="course-card__body">
        <h4 class="course-card__title">${quiz.title}</h4>
        <div class="course-card__author">Autor: ${quiz.isDefault ? 'QuizMaster' : 'Você'}</div>
        <div class="course-card__meta">${quiz.questions.length} questões</div>
      </div>
      <button class="course-card__btn" onclick="window.startQuiz('${quiz.id}')">Começar</button>
    </div>
  `;
}

// Helper for "Suggested Course" card style
function createSuggestedCard(quiz) {
  return `
    <div class="suggested-card" onclick="window.startQuiz('${quiz.id}')">
      <div class="suggested-card__icon" style="background: ${getRandomGradient(quiz.id + 's')}">
        ${quiz.title.charAt(0)}
      </div>
      <div class="suggested-card__info">
        <div class="suggested-card__title">${quiz.title}</div>
        <div class="suggested-card__meta">${quiz.questions.length} aulas • 5.0 ★</div>
      </div>
      <div class="suggested-card__arrow">→</div>
    </div>
  `;
}

function getRandomGradient(seed) {
  const gradients = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  ];
  // Simple hash to pick consistent gradient for same ID
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}


function renderQuizzesList() {
  const filteredQuizzes = state.quizzes.filter(quiz => {
    if (!state.searchTerm) return true;
    const term = state.searchTerm.toLowerCase();
    return quiz.title.toLowerCase().includes(term) || 
           quiz.theme.toLowerCase().includes(term);
  });

  const html = `
    <section class="section">
      <div class="section-toolbar">
        <h3>Meus Quizzes ${state.searchTerm ? `(Busca: "${state.searchTerm}")` : ''}</h3>
        <button class="primary-button" onclick="state.editingQuizId=null; window.navigateTo('create-quiz')">+ Novo Quiz</button>
      </div>
      ${filteredQuizzes.length > 0 ? `
        <div class="quizzes-grid" id="quizzesGrid">
          ${filteredQuizzes.map(quiz => createQuizCard(quiz)).join('')}
        </div>
      ` : `
        <div class="card empty-state-card">
          <p>${state.searchTerm ? 'Nenhum quiz encontrado para sua busca.' : 'Você ainda não tem quizzes.'}</p>
          ${!state.searchTerm ? '<button class="btn-link" onclick="window.navigateTo(\'create-quiz\')">Criar o primeiro</button>' : ''}
        </div>
      `}
    </section>
  `;
  
  elements.mainContent.innerHTML = html;
}

function createQuizCard(quiz) {
  // Using the Learn Content style (Image 1)
  // Gradient header, tags, title, meta, actions
  const gradient = getRandomGradient(quiz.id);
  
  return `
    <div class="course-card">
      <div class="course-card__header" style="background: ${gradient}">
        <span class="course-card__tag">${quiz.theme}</span>
        ${quiz.isDefault ? '<span class="badge-default-sm">Padrão</span>' : ''}
      </div>
      <div class="course-card__body">
        <h4 class="course-card__title">${quiz.title}</h4>
        <div class="course-card__author">
           ${quiz.questions.length} questões • ${quiz.isDefault ? 'Oficial' : 'Criado por você'}
        </div>
        
        <div class="card-actions-row">
            <button class="primary-button btn-sm btn-full" onclick="window.startQuiz('${quiz.id}')">Começar</button>
            <div class="card-actions-icons">
                ${!quiz.isDefault ? `
                <button class="icon-btn-styled" title="Editar" onclick="window.editQuiz('${quiz.id}')">✏️</button>
                ` : ''}
                <button class="icon-btn-styled delete" title="Excluir" onclick="window.deleteQuiz('${quiz.id}')">🗑️</button>
            </div>
        </div>
      </div>
    </div>
  `;
}

function renderNotes() {
  const notes = state.user.notes || [];
  
  // Pastel colors for notes (Image 2 style)
  const getNoteColor = (index) => {
    const colors = ['#e0f2fe', '#fce7f3', '#dcfce7', '#fef9c3', '#f3e8ff']; // Blue, Pink, Green, Yellow, Purple (Pastel)
    return colors[index % colors.length];
  };

  const html = `
    <section class="section">
      <div class="section-toolbar">
        <h3>Minhas Anotações</h3>
        <button class="primary-button" onclick="window.toggleNoteForm()">+ Nova Anotação</button>
      </div>
      
      <!-- Hidden Form Container (Toggled via JS) -->
      <div id="noteFormContainer" class="card note-form-card" style="display: none; margin-bottom: 24px;">
         <h4>Nova Anotação</h4>
         <div class="form-group">
            <input type="text" id="noteTitle" class="form-input" placeholder="Título da anotação...">
         </div>
         <div class="form-group">
            <textarea id="noteContent" class="form-input" rows="4" placeholder="Escreva aqui..."></textarea>
         </div>
         <div class="form-actions-right">
            <button class="secondary-button" onclick="window.toggleNoteForm()">Cancelar</button>
            <button class="primary-button" onclick="window.saveNote()">Salvar</button>
         </div>
      </div>

      <div class="notes-grid">
        ${notes.length > 0 ? notes.slice().reverse().map((n, index) => `
          <div class="note-card-pastel" style="background-color: ${getNoteColor(index)}">
            <div class="note-pastel-header">
               <span class="note-pastel-date">${new Date(n.createdAt).toLocaleDateString()}</span>
               <div class="note-pastel-actions">
                  <button class="icon-btn-simple" onclick="window.viewNote('${n.id}')">👁️</button>
                  <button class="icon-btn-simple" onclick="window.deleteNote('${n.id}')">🗑️</button>
               </div>
            </div>
            <h4 class="note-pastel-title">${n.title}</h4>
            <p class="note-pastel-preview">${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}</p>
            <div class="note-pastel-footer">
               <span class="note-tag">Anotação</span>
            </div>
          </div>
        `).join('') : `
          <div class="empty-notes-placeholder">
             <p>Nenhuma anotação encontrada.</p>
          </div>
        `}
      </div>
    </section>
  `;
  elements.mainContent.innerHTML = html;
}

window.toggleNoteForm = () => {
  const el = document.getElementById('noteFormContainer');
  if (el.style.display === 'none') {
    el.style.display = 'block';
    document.getElementById('noteTitle').focus();
  } else {
    el.style.display = 'none';
  }
};

function renderCreateQuiz() {
  const isEdit = !!state.editingQuizId;
  let quizData = { title: '', theme: '', questions: [] };
  
  if (isEdit) {
    quizData = state.quizzes.find(q => q.id === state.editingQuizId);
  }

  const html = `
    <div class="card quiz-creation-container">
      <div class="quiz-details-section">
        <h3>${isEdit ? 'Editar Quiz' : 'Criar Novo Quiz'}</h3>
        <div class="form-group form-group-spaced">
          <label class="form-label">Título do Quiz</label>
          <input type="text" id="quizTitle" class="form-input" placeholder="Ex: Matemática Básica" value="${quizData.title}">
        </div>
        <div class="form-group">
          <label class="form-label">Tema</label>
          <input type="text" id="quizTheme" class="form-input" placeholder="Ex: Matemática" value="${quizData.theme}">
        </div>
      </div>

      <div id="questionsContainer" class="questions-grid">
        <!-- Questions will be added here -->
      </div>

      <button class="secondary-button btn-add-question" onclick="window.addQuestionField()">
        + Adicionar Pergunta
      </button>

      <div class="form-actions">
        <button class="secondary-button" onclick="window.navigateTo('quizzes')">Cancelar</button>
        <button class="primary-button" onclick="window.saveNewQuiz()">${isEdit ? 'Salvar Alterações' : 'Criar Quiz'}</button>
      </div>
    </div>
  `;
  
  elements.mainContent.innerHTML = html;
  
  if (isEdit && quizData.questions.length > 0) {
    quizData.questions.forEach(q => window.addQuestionField(q));
  } else {
    window.addQuestionField();
  }
}

window.addQuestionField = (existingData = null) => {
  const container = document.getElementById('questionsContainer');
  const index = container.children.length;
  
  const div = document.createElement('div');
  div.className = 'question-editor';
  div.dataset.index = index;
  
  const text = existingData ? existingData.text : '';
  const explanation = existingData ? existingData.explanation : '';
  const correct = existingData ? existingData.correct : 0;
  const options = existingData ? existingData.options : ['', '', '', ''];

  div.innerHTML = `
    <div class="question-header">
      <strong>Pergunta ${index + 1}</strong>
      ${index > 0 ? `<button onclick="this.closest('.question-editor').remove()" class="btn-remove-question">Remover</button>` : ''}
    </div>
    
    <div class="form-group">
      <label class="form-label">Enunciado</label>
      <input type="text" class="form-input q-text" placeholder="Digite a pergunta..." value="${text}" required>
    </div>

    <label class="form-label">Alternativas (Selecione a correta)</label>
    <div class="alternatives-grid">
      ${options.map((opt, i) => `
        <div class="alternative-item">
          <input type="radio" name="correct_${index}_${Date.now()}" value="${i}" ${i === correct ? 'checked' : ''}>
          <input type="text" class="form-input q-opt" placeholder="Opção ${i + 1}" value="${opt}" required>
        </div>
      `).join('')}
    </div>

    <div class="form-group">
      <label class="form-label">Explicação (Opcional)</label>
      <input type="text" class="form-input q-expl" placeholder="Explicação exibida após a resposta..." value="${explanation}">
    </div>
  `;
  
  container.appendChild(div);
};

window.saveNewQuiz = () => {
  const title = document.getElementById('quizTitle').value;
  const theme = document.getElementById('quizTheme').value;
  
  if (!title || !theme) {
    alert('Por favor, preencha o título e o tema.');
    return;
  }

  const questionEls = document.querySelectorAll('.question-editor');
  const questions = [];

  for (let el of questionEls) {
    const text = el.querySelector('.q-text').value;
    const options = Array.from(el.querySelectorAll('.q-opt')).map(opt => opt.value);
    const radioChecked = el.querySelector('input[type="radio"]:checked');
    const correct = radioChecked ? parseInt(radioChecked.value) : 0;
    const explanation = el.querySelector('.q-expl').value || 'Sem explicação.';

    if (!text || options.some(o => !o)) {
      alert('Preencha todos os campos das perguntas.');
      return;
    }

    questions.push({
      id: 'q_' + Date.now() + Math.random(),
      text,
      options,
      correct,
      explanation
    });
  }

  if (questions.length === 0) {
    alert('Adicione pelo menos uma pergunta.');
    return;
  }

  if (state.editingQuizId) {
    // Update existing
    const quizIndex = state.quizzes.findIndex(q => q.id === state.editingQuizId);
    if (quizIndex > -1) {
      state.quizzes[quizIndex] = {
        ...state.quizzes[quizIndex],
        title,
        theme,
        questions,
        updatedAt: new Date().toISOString()
      };
      alert('Quiz atualizado com sucesso!');
    }
    state.editingQuizId = null;
  } else {
    // Create new
    const newQuiz = {
      id: 'quiz_' + Date.now(),
      title,
      theme,
      questions,
      createdAt: new Date().toISOString(),
      isDefault: false
    };
    state.quizzes.push(newQuiz);
    alert('Quiz criado com sucesso!');
  }

  saveData();
  window.navigateTo('quizzes');
};

function renderPerformance() {
  const accuracy = calculateAccuracy();
  
  const html = `
    <section class="section">
      <h3>Seu Desempenho</h3>
      <div class="stats-grid-profile">
        <div class="stat-item">
          <span class="stat-label">XP Total</span>
          <span class="stat-value">${state.user.xp}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Nível</span>
          <span class="stat-value">${state.user.level}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Perguntas Respondidas</span>
          <span class="stat-value">${state.user.totalQuestionsAnswered}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Taxa de Acerto</span>
          <span class="stat-value">${accuracy}%</span>
        </div>
      </div>
    </section>
      
    <section class="section">
      <h3>Histórico Detalhado</h3>
      <div class="card">
        ${state.user.history.length > 0 ? `
          <ul class="history-list">
            ${state.user.history.slice().reverse().map(h => `
              <li class="history-item">
                <div class="history-info-col">
                   <span class="history-title">${h.theme}</span>
                   <span class="history-date">${new Date(h.date).toLocaleDateString()}</span>
                </div>
                <div class="history-score-badge ${h.score > h.total/2 ? 'score-good' : 'score-bad'}">
                  ${h.score}/${h.total}
                </div>
              </li>
            `).join('')}
          </ul>
        ` : '<p class="text-muted-message">Nenhum histórico disponível.</p>'}
      </div>
    </section>
  `;
  elements.mainContent.innerHTML = html;
}

function renderRanking() {
  const MOCK_LEADERBOARD = [
    { name: 'Ana Silva', xp: 12500, level: 25, avatar: 'A' },
    { name: 'João Santos', xp: 9800, level: 19, avatar: 'J' },
    { name: 'Maria Oliveira', xp: 8400, level: 16, avatar: 'M' },
    { name: 'Pedro Costa', xp: 6200, level: 12, avatar: 'P' },
    { name: 'Lucas Pereira', xp: 4500, level: 9, avatar: 'L' },
  ];

  // Merge user and mock data
  const rankingData = [
    ...MOCK_LEADERBOARD,
    { 
      name: state.user.name, 
      xp: state.user.xp, 
      level: state.user.level, 
      avatar: state.user.name.charAt(0).toUpperCase(),
      isUser: true 
    }
  ];

  // Sort by XP descending
  rankingData.sort((a, b) => b.xp - a.xp);

  const html = `
    <div class="card">
      <h3>Top Estudantes</h3>
      <div class="ranking-list">
        ${rankingData.map((user, index) => `
          <div class="ranking-item ${user.isUser ? 'ranking-item--current' : ''}">
            <div class="ranking-rank">#${index + 1}</div>
            <div class="ranking-avatar">${user.avatar}</div>
            <div class="ranking-info">
              <div class="ranking-name">${user.name} ${user.isUser ? '(Você)' : ''}</div>
              <div class="ranking-level">Nível ${user.level}</div>
            </div>
            <div class="ranking-xp">
              <strong>${user.xp}</strong> XP
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  elements.mainContent.innerHTML = html;
}



function renderAchievements() {
  const html = `
    <div class="achievements-grid">
      ${ACHIEVEMENTS.map(ach => {
        const unlocked = state.user.achievements.includes(ach.id);
        return `
          <div class="achievement-card ${unlocked ? 'unlocked' : ''}">
            <span class="achievement-icon">${ach.icon}</span>
            <div class="achievement-title">${ach.title}</div>
            <div class="achievement-desc">${ach.desc}</div>
            <div class="achievement-status ${unlocked ? 'unlocked' : 'locked'}">
              ${unlocked ? 'Desbloqueado' : 'Bloqueado'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  elements.mainContent.innerHTML = html;
}

function renderProfile() {
  const accuracy = calculateAccuracy();
  const activeDaysMap = {};
  state.user.history.forEach(h => {
    const key = new Date(h.date).toLocaleDateString();
    if (!activeDaysMap[key]) activeDaysMap[key] = 0;
    activeDaysMap[key]++;
  });
  const activeDays = Object.keys(activeDaysMap);
  
  const html = `
    <section class="section">
      <div class="card profile-header-card">
         <div class="profile-header-main">
           <div class="profile-avatar-xl">${state.user.name.charAt(0).toUpperCase()}</div>
           <div class="profile-info-block">
             <h2>${state.user.name}</h2>
             <p class="text-muted-message">${state.user.email}</p>
             <div class="level-badge">Nível ${state.user.level}</div>
           </div>
         </div>
         <div class="profile-actions">
           <button class="btn-delete" onclick="window.location.href='login.html'">Sair da Conta</button>

         </div>
      </div>
    </section>

    <div class="dashboard-grid-2col">
      <section class="section">
        <h3>Estatísticas</h3>
        <div class="card">
          <div class="stats-grid-profile">
             <div class="stat-item">
               <span class="stat-label">XP Total</span>
               <span class="stat-value">${state.user.xp}</span>
             </div>
             <div class="stat-item">
               <span class="stat-label">Ofensiva</span>
               <span class="stat-value">${state.user.streak || 0} 🔥</span>
             </div>
             <div class="stat-item">
               <span class="stat-label">Quizzes Feitos</span>
               <span class="stat-value">${state.user.quizzesCompleted}</span>
             </div>
             <div class="stat-item">
               <span class="stat-label">Precisão</span>
               <span class="stat-value">${accuracy}%</span>
             </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h3>Histórico Recente</h3>
        <div class="card">
          ${state.user.history.length > 0 ? `
            <ul class="history-list">
              ${state.user.history.slice().reverse().slice(0, 5).map(h => `
                <li class="history-item">
                  <span class="history-date">${new Date(h.date).toLocaleDateString()}</span>
                  <span class="history-score">${h.score}/${h.total} acertos</span>
                </li>
              `).join('')}
            </ul>
          ` : '<p class="text-muted-message">Nenhuma atividade recente.</p>'}
        </div>
      </section>
    </div>
  `;
  elements.mainContent.innerHTML = html;
}

// --- Quiz Study Logic ---

window.startQuiz = (quizId) => {
  const quiz = state.quizzes.find(q => q.id === quizId);
  if (!quiz) return;

  const studyQuestions = [...quiz.questions].sort(() => 0.5 - Math.random());

  state.activeQuiz = {
    id: quiz.id,
    title: quiz.title,
    theme: quiz.theme,
    questions: studyQuestions,
    currentIndex: 0,
    score: 0,
    wrongQuestions: [] // Array of question objects
  };
  
  renderQuestion();
};

window.startRevision = () => {
  if (!state.activeQuiz || !state.activeQuiz.wrongQuestions.length) return;
  
  // Create a new session with only wrong questions
  state.activeQuiz = {
    id: state.activeQuiz.id + '_revision',
    title: 'Revisão: ' + state.activeQuiz.title,
    theme: state.activeQuiz.theme,
    questions: [...state.activeQuiz.wrongQuestions],
    currentIndex: 0,
    score: 0,
    wrongQuestions: []
  };
  
  renderQuestion();
};

function renderQuestion() {
  const quiz = state.activeQuiz;
  if (!quiz) return;

  const question = quiz.questions[quiz.currentIndex];
  
  const html = `
    <div class="quiz-active-container">
      <div class="quiz-title-row">
        <span class="quiz-title-text">${quiz.title}</span>
        <span class="badge">Questão ${quiz.currentIndex + 1}/${quiz.questions.length}</span>
      </div>
      
      <div class="progress-track progress-track--quiz">
        <div class="progress-fill" style="width: ${(quiz.currentIndex / quiz.questions.length) * 100}%;"></div>
      </div>

      <div class="question-card">
        <div class="question-text">${question.text}</div>
        
        <div class="options-grid">
          ${question.options.map((opt, idx) => `
            <button class="option-btn" onclick="window.selectAnswer(${idx})">
              ${opt}
            </button>
          `).join('')}
        </div>
        
        <div id="feedback" class="feedback-area"></div>
        
        <div class="quiz-footer" id="quizFooter" style="display:none;">
          <button class="primary-button" onclick="window.nextQuestion()">
            ${quiz.currentIndex === quiz.questions.length - 1 ? 'Finalizar Quiz' : 'Próxima Pergunta'}
          </button>
        </div>
      </div>
    </div>
  `;
  
  elements.mainContent.innerHTML = html;
}

window.selectAnswer = (selectedIndex) => {
  const quiz = state.activeQuiz;
  if (!quiz) return;

  const question = quiz.questions[quiz.currentIndex];
  const buttons = document.querySelectorAll('.option-btn');
  const feedback = document.getElementById('feedback');
  const footer = document.getElementById('quizFooter');
  
  buttons.forEach(btn => btn.disabled = true);
  
  const isCorrect = selectedIndex === question.correct;
  
  buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    buttons[question.correct].classList.add('correct');
    // Add to revision list
    quiz.wrongQuestions.push(question);
  }
  
  feedback.className = `feedback-area visible ${isCorrect ? 'success' : 'error'}`;
  feedback.innerHTML = isCorrect 
    ? `<strong>Correto!</strong> +${XP_CORRECT} XP` 
    : `<strong>Incorreto.</strong> ${question.explanation}`;
    
  if (isCorrect) quiz.score++;
  
  footer.style.display = 'flex';
};

window.nextQuestion = () => {
  const quiz = state.activeQuiz;
  if (!quiz) return;
  
  if (quiz.currentIndex < quiz.questions.length - 1) {
    quiz.currentIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
};

function finishQuiz() {
  const quiz = state.activeQuiz;
  const xpEarned = (quiz.score * XP_CORRECT) + XP_COMPLETION;
  const accuracy = Math.round((quiz.score / quiz.questions.length) * 100);
  
  // Update User Stats (only if not revision, or maybe partial XP for revision? Let's keep it simple)
  // Revisions shouldn't count as "Quizzes Completed" to avoid farming? Or maybe yes.
  // Let's count them.
  
  state.user.quizzesCompleted++;
  state.user.totalQuestionsAnswered += quiz.questions.length;
  state.user.correctAnswers += quiz.score;
  state.user.history.push({
    date: new Date().toISOString(),
    theme: quiz.theme,
    score: quiz.score,
    total: quiz.questions.length
  });
  
  addXp(xpEarned);
  checkAchievements();
  saveData();
  
  const hasErrors = quiz.wrongQuestions.length > 0;
  
  const html = `
    <div class="quiz-active-container">
      <div class="question-card">
        <div class="result-emoji">${accuracy >= 70 ? '🎉' : '📚'}</div>
        <h2>Quiz Finalizado!</h2>
        <p>Você acertou ${quiz.score} de ${quiz.questions.length} questões.</p>
        
        <div class="result-stats-grid">
          <div class="stat">
            <span class="stat__label">Precisão</span>
            <span class="stat__value stat-value-lg">${accuracy}%</span>
          </div>
          <div class="stat">
            <span class="stat__label">XP Ganho</span>
            <span class="stat__value stat-value-lg text-primary">+${xpEarned} XP</span>
          </div>
        </div>
        
        <div class="result-actions">
          <button class="secondary-button" onclick="window.navigateTo('dashboard')">Voltar ao Dashboard</button>
          ${hasErrors ? `<button class="primary-button" onclick="window.startRevision()">Revisar ${quiz.wrongQuestions.length} Erros</button>` : ''}
          <button class="secondary-button" onclick="window.startQuiz('${quiz.id.replace('_revision', '')}')">Refazer Completo</button>
        </div>
      </div>
    </div>
  `;
  
  elements.mainContent.innerHTML = html;
  // Don't null activeQuiz yet if we might revise
}

function calculateAccuracy() {
  if (state.user.totalQuestionsAnswered === 0) return 0;
  return Math.round((state.user.correctAnswers / state.user.totalQuestionsAnswered) * 100);
}

function addXp(amount) {
  state.user.xp += amount;
  const newLevel = Math.floor(state.user.xp / XP_PER_LEVEL) + 1;
  
  if (newLevel > state.user.level) {
    state.user.level = newLevel;
    alert(`Parabéns! Você subiu para o Nível ${newLevel}! 🚀`);
  }
  updateHeaderStats();
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (!state.user.achievements.includes(ach.id) && ach.condition(state.user)) {
      state.user.achievements.push(ach.id);
      alert(`🏆 Nova Conquista Desbloqueada: ${ach.title}`);
    }
  });
}

function updateHeaderStats() {
  const progress = (state.user.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  elements.headerXpBar.style.width = `${progress}%`;
  elements.headerLevel.textContent = `Lvl ${state.user.level}`;
  elements.userXp.textContent = `${state.user.xp} XP`;
  if (elements.userNameDisplay) {
    elements.userNameDisplay.textContent = state.user.name || 'Estudante';
  }
  if (elements.userAvatar) {
    const firstLetter = (state.user.name || 'S').charAt(0).toUpperCase();
    elements.userAvatar.textContent = firstLetter;
  }
}

// Start
init();
