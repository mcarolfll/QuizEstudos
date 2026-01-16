const questions = [
  {
    id: 'q1',
    text: 'O que é uma linguagem de programação de alto nível?',
    options: [
      'Uma linguagem que interage diretamente com o hardware',
      'Uma linguagem com abstrações próximas ao humano',
      'Uma linguagem sem necessidade de compilação',
      'Uma linguagem apenas para scripts'
    ],
    correct: 1,
    theme: 'Programação',
    explanation: 'Linguagens de alto nível são projetadas para serem mais próximas da linguagem humana, facilitando a programação através de abstrações que escondem detalhes do hardware.'
  },
  {
    id: 'q2',
    text: 'Qual dessas opções é uma linguagem tipada estaticamente?',
    options: ['Python', 'JavaScript', 'Java', 'Ruby'],
    correct: 2,
    theme: 'Programação',
    explanation: 'Java é uma linguagem tipada estaticamente, onde os tipos são verificados em tempo de compilação. Python, JavaScript e Ruby são tipadas dinamicamente.'
  },
  {
    id: 'q3',
    text: 'O que significa API?',
    options: ['Application Programming Interface', 'Applied Program Integration', 'Automatic Program Index', 'Array Processing Interface'],
    correct: 0,
    theme: 'Desenvolvimento Web',
    explanation: 'API significa Application Programming Interface - um conjunto de protocolos e ferramentas para construir aplicações de software, permitindo comunicação entre diferentes sistemas.'
  },
  {
    id: 'q4',
    text: 'O que é controle de versão distribuído popularizado pelo Git?',
    options: ['SVN', 'Mercurial', 'Distribuição de arquivos', 'Sistema onde cada clone tem histórico completo'],
    correct: 3,
    theme: 'Ferramentas',
    explanation: 'Git é um sistema de controle de versão distribuído onde cada repositório local contém uma cópia completa do histórico, permitindo trabalho offline e maior flexibilidade.'
  },
  {
    id: 'q5',
    text: 'O que é um framework?',
    options: ['Uma biblioteca pequena', 'Um conjunto estruturado de ferramentas e convenções', 'Um editor de código', 'Um sistema operacional'],
    correct: 1,
    theme: 'Desenvolvimento Web',
    explanation: 'Um framework fornece uma estrutura base e conjunto de ferramentas que facilitam o desenvolvimento, estabelecendo padrões e convenções para criar aplicações.'
  },
  {
    id: 'q6',
    text: 'O que significa "frontend" em desenvolvimento web?',
    options: ['Servidor e banco de dados', 'Interface visível ao usuário', 'APIs internas', 'Processos em background'],
    correct: 1,
    theme: 'Desenvolvimento Web',
    explanation: 'Frontend refere-se à parte da aplicação que o usuário vê e interage diretamente, incluindo HTML, CSS e JavaScript executados no navegador.'
  },
  {
    id: 'q7',
    text: 'Qual destas ferramentas é usada para empacotar e construir aplicações web modernas?',
    options: ['Docker', 'Vite', 'MySQL', 'Nginx'],
    correct: 1,
    theme: 'Ferramentas',
    explanation: 'Vite é um build tool moderno que oferece desenvolvimento rápido e builds otimizados para aplicações web, especialmente com frameworks como React e Vue.'
  },
  {
    id: 'q8',
    text: 'O que é REST?',
    options: ['Um estilo arquitetural para APIs', 'Um banco de dados', 'Uma linguagem de programação', 'Um framework front-end'],
    correct: 0,
    theme: 'Desenvolvimento Web',
    explanation: 'REST (Representational State Transfer) é um estilo arquitetural para design de APIs web que utiliza métodos HTTP padrão e recursos identificados por URLs.'
  },
  {
    id: 'q9',
    text: 'O que é "CI/CD"?',
    options: ['Controle de integração', 'Integração contínua e entrega/implantação contínua', 'Uma biblioteca JS', 'Um tipo de teste'],
    correct: 1,
    theme: 'DevOps',
    explanation: 'CI/CD significa Continuous Integration/Continuous Deployment - práticas que automatizam a integração de código e a entrega de software, melhorando a qualidade e velocidade de desenvolvimento.'
  },
  {
    id: 'q10',
    text: 'Qual é o propósito principal de testes unitários?',
    options: ['Testar a integração com o banco', 'Testar pequenas unidades de código isoladamente', 'Testar a interface do usuário', 'Substituir revisão de código'],
    correct: 1,
    theme: 'Qualidade de Código',
    explanation: 'Testes unitários verificam unidades individuais de código (funções, métodos) de forma isolada, garantindo que cada parte funcione corretamente antes da integração.'
  }
];

// Expose to window for global access
window.QUIZ_DATA = questions;
