/* VARIABLES GLOBAIS DE CONTROLE */
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
let currentSlide = 0;
let isTransitioning = false;

// Variáveis globais para as simulações e timeouts
let hasOpenedFolder = false;
let s2Timeline = null;
let t3SimTimeout1 = null;
let t3SimTimeout2 = null;
let t3SimTimeout3 = null;
let ghostLoop = null;
let s7Timeouts = [];
let s11Timeouts = [];
let s13Timeouts = [];
let s13Animations = [];
let isJornadaRunning = false;
let s13CurrentStep = 0; // Controle do passo atual no Slide 13 (0 a 10)
let s6CurrentStep = 0; // Controle do passo atual no Slide 6 (0 a 5)

// Componentes DOM de Navegação
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const progressBar = document.getElementById('progress-bar');
const slideCounter = document.getElementById('slide-counter');
const btnFullscreen = document.getElementById('btn-fullscreen');

/* EVENT LISTENERS INICIAIS */
document.addEventListener('keydown', handleKeydown);
btnPrev.addEventListener('click', () => navigateSlide('prev'));
btnNext.addEventListener('click', () => navigateSlide('next'));
btnFullscreen.addEventListener('click', toggleFullscreen);

// Adicionar escutas estáticas da abertura
document.getElementById('opening-folder').addEventListener('click', openFolderAnimation);
document.getElementById('opening-folder').addEventListener('dblclick', openFolderAnimation);

// Adicionar escutas de clique na timeline do Slide 13
document.querySelectorAll('#slide-13 .timeline-point').forEach((point, idx) => {
  point.addEventListener('click', () => {
    jumpToJornadaStep(idx + 1);
  });
});

// Configurar o slide inicial
updateNavControls();

function handleKeydown(e) {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    navigateSlide('next');
  } else if (e.key === 'ArrowLeft') {
    navigateSlide('prev');
  }
}

function navigateSlide(direction) {
  if (isTransitioning) return;
  
  // Override para o Slide 13 (Timeline Final)
  if (currentSlide === 12) {
    if (direction === 'next') {
      if (s13CurrentStep === 0) {
        startJornadaTimeline();
        return;
      } else if (s13CurrentStep >= 1 && s13CurrentStep < 9) {
        jumpToJornadaStep(s13CurrentStep + 1);
        return;
      } else if (s13CurrentStep === 9) {
        finishJornadaTimeline();
        return;
      } else {
        return; // Fim do slide final, não faz nada
      }
    } else { // prev
      if (s13CurrentStep === 10) {
        jumpToJornadaStep(9);
        return;
      } else if (s13CurrentStep > 1 && s13CurrentStep <= 9) {
        jumpToJornadaStep(s13CurrentStep - 1);
        return;
      } else if (s13CurrentStep === 1) {
        initSlide13();
        return;
      }
      // Se s13CurrentStep for 0, deixa passar para o slide anterior (Slide 12)
    }
  }

  // Override para o Slide 6 (Ciclo de Vida do Processo)
  if (currentSlide === 5) {
    if (direction === 'next') {
      if (s6CurrentStep < 5) {
        setLifecycleStep(s6CurrentStep + 1);
        return;
      }
      // Se s6CurrentStep for 5, deixa passar para o próximo slide
    } else { // prev
      if (s6CurrentStep > 0) {
        setLifecycleStep(s6CurrentStep - 1);
        return;
      }
      // Se s6CurrentStep for 0, deixa passar para o slide anterior
    }
  }

  let nextIndex = currentSlide;
  if (direction === 'next') {
    if (currentSlide === totalSlides - 1) return;
    nextIndex = currentSlide + 1;
  } else {
    if (currentSlide === 0) return;
    nextIndex = currentSlide - 1;
  }

  // Intercept Slide 2 -> 3 (zoom in)
  if (currentSlide === 1 && direction === 'next') {
    cleanupAllAnimations();
    isTransitioning = true;
    const oldSlide = slides[currentSlide];
    const newSlide = slides[nextIndex];
    
    const cpuSvg = document.getElementById('cpu-svg');
    const s2Left = oldSlide.querySelector('.slide2-left');
    const s2Title = oldSlide.querySelector('.slide-title');
    const s3Content = document.getElementById('slide3-real-content');
    
    oldSlide.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
    newSlide.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
    newSlide.classList.add('active');
    
    s3Content.style.opacity = '0';
    
    // Calculate dynamic centering coordinates for the RAM module
    const ramGroup = document.getElementById('ram-group');
    const ramRect = ramGroup.getBoundingClientRect();
    const ramCenterX = ramRect.left + ramRect.width / 2;
    const ramCenterY = ramRect.top + ramRect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    const moveX = viewportCenterX - ramCenterX;
    const moveY = viewportCenterY - ramCenterY;
    
    cpuSvg.style.transformOrigin = '440px 175px';
    
    anime.timeline({
      easing: 'easeOutQuad',
      complete: () => {
        oldSlide.classList.remove('active');
        
        setTimeout(() => {
          anime.set(cpuSvg, {
            scale: 1,
            translateX: 0,
            translateY: 0,
            opacity: 1
          });
          s2Left.style.opacity = '1';
          s2Title.style.opacity = '1';
        }, 700);
        
        currentSlide = nextIndex;
        updateNavControls();
        isTransitioning = false;
        triggerSlideInitializer(currentSlide);
      }
    })
    .add({
      targets: cpuSvg,
      scale: 8,
      translateX: moveX,
      translateY: moveY,
      opacity: 0,
      duration: 1000,
      easing: 'cubicBezier(0.4, 0, 0.2, 1)'
    })
    .add({
      targets: [s2Left, s2Title],
      opacity: 0,
      duration: 600,
      offset: 0
    })
    .add({
      targets: s3Content,
      opacity: 1,
      duration: 800,
      offset: 200
    });
    
    return;
  }
  
  // Intercept Slide 3 -> 2 (zoom out)
  if (currentSlide === 2 && direction === 'prev') {
    cleanupAllAnimations();
    isTransitioning = true;
    const oldSlide = slides[currentSlide];
    const newSlide = slides[nextIndex];
    
    const cpuSvg = document.getElementById('cpu-svg');
    const s2Left = newSlide.querySelector('.slide2-left');
    const s2Title = newSlide.querySelector('.slide-title');
    const s3Content = document.getElementById('slide3-real-content');
    
    oldSlide.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
    newSlide.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
    newSlide.classList.add('active');
    
    // Calculate dynamic centering coordinates for the RAM module
    const ramGroup = document.getElementById('ram-group');
    const ramRect = ramGroup.getBoundingClientRect();
    const ramCenterX = ramRect.left + ramRect.width / 2;
    const ramCenterY = ramRect.top + ramRect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    const moveX = viewportCenterX - ramCenterX;
    const moveY = viewportCenterY - ramCenterY;
    
    cpuSvg.style.transformOrigin = '440px 175px';
    anime.set(cpuSvg, {
      scale: 8,
      translateX: moveX,
      translateY: moveY,
      opacity: 0
    });
    
    s2Left.style.opacity = '0';
    s2Title.style.opacity = '0';
    
    anime.timeline({
      easing: 'easeOutQuad',
      complete: () => {
        oldSlide.classList.remove('active');
        
        setTimeout(() => {
          s3Content.style.opacity = '0';
        }, 700);
        
        currentSlide = nextIndex;
        updateNavControls();
        isTransitioning = false;
        triggerSlideInitializer(currentSlide);
      }
    })
    .add({
      targets: s3Content,
      opacity: 0,
      duration: 600
    })
    .add({
      targets: cpuSvg,
      scale: 1,
      translateX: 0,
      translateY: 0,
      opacity: 1,
      duration: 1000,
      easing: 'cubicBezier(0.4, 0, 0.2, 1)',
      offset: 0
    })
    .add({
      targets: [s2Left, s2Title],
      opacity: 1,
      duration: 800,
      offset: 200
    });
    
    return;
  }

  cleanupAllAnimations();

  isTransitioning = true;
  const oldSlide = slides[currentSlide];
  const newSlide = slides[nextIndex];

  // Remove classes antigas
  oldSlide.classList.remove('active');
  if (direction === 'next') {
    oldSlide.classList.add('exit-left');
    oldSlide.classList.remove('exit-right', 'enter-left', 'enter-right');
  } else {
    oldSlide.classList.add('exit-right');
    oldSlide.classList.remove('exit-left', 'enter-left', 'enter-right');
  }

  // Preparar novo slide
  newSlide.classList.remove('active', 'exit-left', 'exit-right');
  if (direction === 'next') {
    newSlide.classList.add('enter-right');
    newSlide.classList.remove('enter-left');
  } else {
    newSlide.classList.add('enter-left');
    newSlide.classList.remove('enter-right');
  }

  // Forçar reflow
  newSlide.offsetHeight;

  // Executar transição
  newSlide.classList.remove('enter-left', 'enter-right');
  newSlide.classList.add('active');

  currentSlide = nextIndex;

  // Atualizar progresso e controles
  setTimeout(() => {
    updateNavControls();
    isTransitioning = false;
    // Chamar inicializadores de animações
    triggerSlideInitializer(currentSlide);
  }, 600);
}

function updateNavControls() {
  if (currentSlide === 0) {
    btnPrev.classList.add('hidden');
  } else {
    btnPrev.classList.remove('hidden');
  }

  if (currentSlide === totalSlides - 1) {
    // No slide 13, o botão de avanço (Next) deve continuar visível enquanto a jornada não estiver concluída
    if (currentSlide === 12 && s13CurrentStep < 10) {
      btnNext.classList.remove('hidden');
    } else {
      btnNext.classList.add('hidden');
    }
  } else {
    btnNext.classList.remove('hidden');
  }

  const percentage = ((currentSlide + 1) / totalSlides) * 100;
  progressBar.style.width = `${percentage}%`;

  slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Erro ao tentar ativar tela cheia: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

/* ----------------------------------------------------
   INICIALIZADORES E CONTROLADORES DE SLIDES INDIVIDUAIS
   ---------------------------------------------------- */
const slideInitializers = {
  0: initSlide1,
  1: initSlide2,
  2: initSlide3,
  3: initSlide4,
  4: initSlide5,
  5: initSlide6,
  6: initSlide7,
  7: initSlide8,
  8: initSlide9,
  9: initSlide10,
  10: initSlide11,
  11: initSlide12,
  12: initSlide13
};

function triggerSlideInitializer(index) {
  if (slideInitializers[index]) {
    slideInitializers[index]();
  }
}

// Inicializar slide ativo por padrão
triggerSlideInitializer(0);

// Limpeza de todas as animações correndo em paralelo
function cleanupAllAnimations() {
  // Slide 3 timeouts
  clearTimeout(t3SimTimeout1);
  clearTimeout(t3SimTimeout2);
  clearTimeout(t3SimTimeout3);
  
  // Slide 6 ghost loop
  if (ghostLoop) {
    ghostLoop.pause();
    ghostLoop = null;
  }
  
  // Slide 7 timeouts
  s7Timeouts.forEach(t => clearTimeout(t));
  s7Timeouts = [];
  
  // Slide 11 timeouts
  s11Timeouts.forEach(t => clearTimeout(t));
  s11Timeouts = [];
  
  // Slide 13 timeouts e animações
  s13Timeouts.forEach(t => clearTimeout(t));
  s13Timeouts = [];
  s13Animations.forEach(a => a.pause());
  s13Animations = [];
  isJornadaRunning = false;
}

/* ----------------------------------------------------
   SLIDE 1 — ANIMAÇÕES (ABERTURA)
   ---------------------------------------------------- */
hasOpenedFolder = false;

function initSlide1() {
  hasOpenedFolder = false;
  
  anime({
    targets: '#slide1-main-title',
    opacity: [0, 1],
    translateY: [25, 0],
    duration: 1000,
    easing: 'easeOutQuad'
  });

  const lid = document.getElementById('folder-lid');
  const docs = document.getElementById('folder-docs');
  const svgEl = document.getElementById('folder-svg-element');
  
  lid.style.transform = 'rotateX(0)';
  docs.style.transform = 'translateY(0)';
  svgEl.style.transform = 'scale(1)';
  svgEl.style.opacity = '1';
  svgEl.style.filter = 'blur(0)';
}

function openFolderAnimation() {
  if (hasOpenedFolder) return;
  hasOpenedFolder = true;

  const lid = document.getElementById('folder-lid');
  const docs = document.getElementById('folder-docs');
  const svgEl = document.getElementById('folder-svg-element');
  
  lid.style.transform = 'rotateX(-60deg) skewX(10deg) scaleY(0.6)';
  
  anime({
    targets: docs,
    translateY: -35,
    duration: 600,
    easing: 'easeOutQuad'
  });

  const rect = svgEl.getBoundingClientRect();
  const sparkX = rect.left + rect.width / 2;
  const sparkY = rect.top + 60;
  
  createSparks(sparkX, sparkY);

  anime({
    targets: svgEl,
    scale: 1.25,
    opacity: [1, 0],
    filter: ['blur(0px)', 'blur(6px)'],
    delay: 500,
    duration: 700,
    easing: 'easeInOutQuad',
    complete: () => {
      navigateSlide('next');
    }
  });
}

function createSparks(x, y) {
  const container = document.getElementById('particles-container');
  container.innerHTML = '';
  
  for (let i = 0; i < 45; i++) {
    const p = document.createElement('div');
    const colors = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#ffffff'];
    const size = Math.random() * 8 + 4;
    
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = '50%';
    p.style.position = 'fixed';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.boxShadow = `0 0 10px ${p.style.background}`;
    p.style.pointerEvents = 'none';
    container.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 160 + 60;
    const destX = Math.cos(angle) * speed;
    const destY = Math.sin(angle) * speed - 80;

    anime({
      targets: p,
      translateX: destX,
      translateY: destY,
      scale: [1, 0],
      opacity: [1, 0],
      duration: Math.random() * 900 + 700,
      easing: 'easeOutQuad',
      complete: () => p.remove()
    });
  }
}

/* ----------------------------------------------------
   SLIDE 2 — ANIMAÇÕES (CPU EXECUTANDO PROCESSO)
   ---------------------------------------------------- */
s2Timeline = null;
function initSlide2() {
  if (s2Timeline) s2Timeline.pause();
  
  const p1 = document.getElementById('s2-para-1');
  const p2 = document.getElementById('s2-para-2');
  const p3 = document.getElementById('s2-para-3');
  
  p1.style.opacity = '0';
  p1.style.transform = 'translateY(10px)';
  p2.style.opacity = '0';
  p2.style.transform = 'translateY(10px)';
  p3.style.opacity = '0';
  p3.style.transform = 'translateY(10px)';
  
  const loadDot = document.getElementById('load-dot');
  loadDot.style.opacity = '0';
  
  const env = document.getElementById('process-envelope-container');
  env.style.transform = 'translate(250px, 175px) scale(0)';
  
  const envRect = document.getElementById('env-rect');
  if (envRect) {
    envRect.style.stroke = '#3b82f6';
    envRect.setAttribute('filter', 'url(#glow-blue)');
  }
  
  const envState = document.getElementById('env-state-val');
  envState.textContent = 'PRONTO';
  envState.style.fill = 'var(--green)';
  
  const cpuRect = document.getElementById('cpu-rect');
  if (cpuRect) {
    cpuRect.style.stroke = 'var(--blue)';
    cpuRect.setAttribute('filter', 'url(#glow-blue)');
  }
  
  // Garantir chip com transform inicial
  const cpuGroup = document.getElementById('cpu-chip-group');
  cpuGroup.style.transform = 'translate(250px, 175px) scale(1)';
  
  s2Timeline = anime.timeline({
    easing: 'easeOutQuad'
  });
  
  const path = anime.path('#load-path');
  
  s2Timeline.add({
    targets: '#s2-para-1',
    opacity: 1,
    translateY: 0,
    duration: 800
  })
  .add({
    targets: loadDot,
    opacity: [0, 1, 0],
    translateX: path('x'),
    translateY: path('y'),
    duration: 1500,
    easing: 'linear',
    offset: 500
  })
  .add({
    targets: '#cpu-chip-group',
    transform: [
      { value: 'translate(250px, 175px) scale(1)', duration: 0 },
      { value: 'translate(250px, 175px) scale(1.1)', duration: 250 },
      { value: 'translate(250px, 175px) scale(1)', duration: 250 }
    ],
    duration: 500,
    easing: 'easeInOutQuad',
    offset: 1800,
    changeBegin: () => {
      if (cpuRect) {
        cpuRect.style.stroke = 'var(--orange)';
        cpuRect.setAttribute('filter', 'url(#glow-orange)');
      }
    },
    changeComplete: () => {
      if (cpuRect) {
        cpuRect.style.stroke = 'var(--blue)';
        cpuRect.setAttribute('filter', 'url(#glow-blue)');
      }
    }
  })
  .add({
    targets: '#s2-para-2',
    opacity: 1,
    translateY: 0,
    duration: 800,
    offset: 2300
  })
  .add({
    targets: env,
    transform: [
      { value: 'translate(250px, 175px) scale(0)', duration: 0 },
      { value: 'translate(250px, 175px) scale(1.15)', duration: 600, easing: 'easeOutBack' },
      { value: 'translate(250px, 175px) scale(1)', duration: 200 }
    ],
    offset: 2500
  })
  .add({
    targets: '#s2-para-3',
    opacity: 1,
    translateY: 0,
    duration: 800,
    offset: 4500
  })
  .add({
    targets: env,
    transform: 'translate(440px, 175px) scale(1)',
    duration: 1200,
    easing: 'cubicBezier(0.4, 0, 0.2, 1)',
    offset: 4800,
    changeComplete: () => {
      envState.textContent = 'EXECUTANDO';
      envState.style.fill = 'var(--green)';
      
      if (envRect) {
        envRect.style.stroke = 'var(--green)';
        envRect.setAttribute('filter', 'url(#glow-green)');
      }
      
      anime({
        targets: '#process-envelope-content',
        opacity: [1, 0.5, 1],
        duration: 400,
        loop: 2
      });
    }
  });
}

/* ----------------------------------------------------
   SLIDE 3 — ANIMAÇÕES (THREADS ZOOM E INDEPENDÊNCIA)
   ---------------------------------------------------- */
t3SimTimeout1 = null;
t3SimTimeout2 = null;
t3SimTimeout3 = null;

function initSlide3() {
  const realContent = document.getElementById('slide3-real-content');
  realContent.style.opacity = '1';
  resetThreadsIndependenceSim();
}

function resetThreadsIndependenceSim() {
  clearTimeout(t3SimTimeout1);
  clearTimeout(t3SimTimeout2);
  clearTimeout(t3SimTimeout3);
  
  const btn = document.getElementById('btn-slide3-demo');
  if (btn) btn.disabled = false;
  
  const t2Row = document.getElementById('t3-row-2');
  if (t2Row) {
    t2Row.classList.remove('paused');
    t2Row.style.opacity = '1';
    const circle = t2Row.querySelector('.thread-circle');
    if (circle) circle.style.background = 'var(--purple)';
  }
  
  const processBox = document.getElementById('s3-process-box');
  if (processBox) {
    processBox.style.boxShadow = 'none';
    processBox.style.borderColor = 'var(--blue)';
  }
  
  const sharedHeap = document.getElementById('s3-shared-heap');
  const sharedCode = document.getElementById('s3-shared-code');
  if (sharedHeap) {
    sharedHeap.style.background = 'rgba(255, 255, 255, 0.02)';
    sharedHeap.style.borderColor = 'var(--card-border)';
    sharedHeap.style.color = 'rgba(255,255,255,0.6)';
  }
  if (sharedCode) {
    sharedCode.style.background = 'rgba(255, 255, 255, 0.02)';
    sharedCode.style.borderColor = 'var(--card-border)';
    sharedCode.style.color = 'rgba(255,255,255,0.6)';
  }
  
  const statusText = document.getElementById('slide3-status-text');
  const statusIcon = document.getElementById('slide3-status-icon');
  if (statusText) statusText.textContent = 'Explore a concorrência das threads executando instruções de forma assíncrona e independente.';
  if (statusIcon) {
    statusIcon.textContent = '✦';
    statusIcon.style.color = 'var(--blue)';
  }
}

function runThreadsIndependenceSim() {
  const btn = document.getElementById('btn-slide3-demo');
  if (btn) btn.disabled = true;
  
  const t2Row = document.getElementById('t3-row-2');
  const statusText = document.getElementById('slide3-status-text');
  const statusIcon = document.getElementById('slide3-status-icon');
  const processBox = document.getElementById('s3-process-box');
  const sharedHeap = document.getElementById('s3-shared-heap');
  const sharedCode = document.getElementById('s3-shared-code');
  
  // Passo 1: Pausar Thread 2
  statusText.textContent = 'Thread 2 bloqueada por E/S (Input/Output). T1 e T3 continuam executando!';
  statusIcon.textContent = '⏸';
  statusIcon.style.color = 'var(--yellow)';
  if (t2Row) {
    t2Row.classList.add('paused');
    t2Row.style.opacity = '0.4';
    const circle = t2Row.querySelector('.thread-circle');
    if (circle) circle.style.background = '#4b5563';
  }
  
  // Passo 2: Retomar Thread 2 após 1.5s
  t3SimTimeout1 = setTimeout(() => {
    if (t2Row) {
      t2Row.classList.remove('paused');
      t2Row.style.opacity = '1';
      const circle = t2Row.querySelector('.thread-circle');
      if (circle) circle.style.background = 'var(--purple)';
    }
    statusText.textContent = 'Thread 2 concluída e desbloqueada pelo SO. Todas ativas novamente!';
    statusIcon.textContent = '▶';
    statusIcon.style.color = 'var(--green)';
  }, 1500);
  
  // Passo 3: Simulação de Agrupamento aos 3s
  t3SimTimeout2 = setTimeout(() => {
    statusText.textContent = 'Três linhas de execução. Um único processo. Uma única memória compartilhada.';
    statusIcon.textContent = '✦';
    statusIcon.style.color = 'var(--purple)';
    
    if (processBox) {
      processBox.style.boxShadow = '0 0 25px rgba(59, 130, 246, 0.4)';
      processBox.style.borderColor = '#ffffff';
    }
    
    if (sharedHeap) {
      sharedHeap.style.background = 'rgba(255, 255, 255, 0.2)';
      sharedHeap.style.borderColor = '#ffffff';
      sharedHeap.style.color = '#ffffff';
    }
    if (sharedCode) {
      sharedCode.style.background = 'rgba(255, 255, 255, 0.2)';
      sharedCode.style.borderColor = '#ffffff';
      sharedCode.style.color = '#ffffff';
    }
    
    anime({
      targets: [sharedHeap, sharedCode],
      scale: [1, 1.05, 1],
      duration: 400,
      easing: 'easeInOutQuad'
    });
  }, 3000);
  
  // Passo 4: Habilitar reiniciar o simulador aos 5.5s
  t3SimTimeout3 = setTimeout(() => {
    if (btn) btn.disabled = false;
    if (processBox) {
      processBox.style.boxShadow = 'none';
      processBox.style.borderColor = 'var(--blue)';
    }
    if (sharedHeap) {
      sharedHeap.style.background = 'rgba(255, 255, 255, 0.02)';
      sharedHeap.style.borderColor = 'var(--card-border)';
      sharedHeap.style.color = 'rgba(255,255,255,0.6)';
    }
    if (sharedCode) {
      sharedCode.style.background = 'rgba(255, 255, 255, 0.02)';
      sharedCode.style.borderColor = 'var(--card-border)';
      sharedCode.style.color = 'rgba(255,255,255,0.6)';
    }
  }, 5500);
}

/* ----------------------------------------------------
   SLIDE 4 — ANIMAÇÕES (ANATOMIA DO PROCESSO)
   ---------------------------------------------------- */
function initSlide4() {
  const layers = document.querySelectorAll('#slide-4 .mem-layer');
  anime({
    targets: layers,
    translateX: [200, 0],
    opacity: [0, 1],
    delay: anime.stagger(150),
    duration: 700,
    easing: 'easeOutBack'
  });

  const tooltip = document.getElementById('mem-tooltip');
  tooltip.textContent = 'Passe o mouse por cima de qualquer bloco de memória para entender o seu papel na execução.';
  tooltip.style.borderColor = 'rgba(255,255,255,0.06)';
  tooltip.style.background = 'rgba(255,255,255,0.02)';

  layers.forEach(layer => {
    layer.addEventListener('mouseenter', () => {
      tooltip.textContent = layer.getAttribute('data-desc');
      tooltip.style.transition = 'all 200ms';
      
      if (layer.classList.contains('layer-kernel')) {
        tooltip.style.borderColor = 'var(--purple)';
        tooltip.style.background = 'rgba(139, 92, 246, 0.05)';
      } else if (layer.classList.contains('layer-stack')) {
        tooltip.style.borderColor = 'var(--blue)';
        tooltip.style.background = 'rgba(59, 130, 246, 0.05)';
      } else if (layer.classList.contains('layer-heap')) {
        tooltip.style.borderColor = 'var(--green)';
        tooltip.style.background = 'rgba(16, 185, 129, 0.05)';
      } else if (layer.classList.contains('layer-code')) {
        tooltip.style.borderColor = 'var(--orange)';
        tooltip.style.background = 'rgba(249, 115, 22, 0.05)';
      } else {
        tooltip.style.borderColor = 'rgba(255,255,255,0.2)';
        tooltip.style.background = 'rgba(255,255,255,0.02)';
      }
    });
  });

  const connectorPath = document.getElementById('slide4-path');
  const containerRect = document.querySelector('#slide-4 .grid-2').getBoundingClientRect();
  const leftEl = document.querySelector('#slide-4 .memory-stack').getBoundingClientRect();
  const rightEl = document.getElementById('pcb-card').getBoundingClientRect();
  
  const startX = leftEl.right - containerRect.left;
  const startY = leftEl.top + leftEl.height / 2 - containerRect.top;
  const endX = rightEl.left - containerRect.left;
  const endY = rightEl.top + 50 - containerRect.top;

  connectorPath.setAttribute('d', `M ${startX},${startY} C ${startX + 100},${startY} ${endX - 100},${endY} ${endX},${endY}`);
  connectorPath.style.strokeDashoffset = '1000';
  anime({
    targets: connectorPath,
    strokeDashoffset: [anime.setDashoffset, 0],
    duration: 1000,
    easing: 'easeOutSine',
    delay: 500
  });

  const fields = document.querySelectorAll('#slide-4 .pcb-field');
  anime({
    targets: fields,
    backgroundColor: ['rgba(249, 115, 22, 0.3)', 'rgba(255,255,255,0.01)'],
    borderColor: ['var(--orange)', 'rgba(255,255,255,0.05)'],
    delay: anime.stagger(120, {start: 900}),
    duration: 500,
    easing: 'easeOutQuad'
  });
}

/* ----------------------------------------------------
   SLIDE 5 — ANIMAÇÕES (COMPARATIVO PROCESSO VS THREAD)
   ---------------------------------------------------- */
function initSlide5() {
  const rows = document.querySelectorAll('#slide-5 .table-row');
  anime({
    targets: rows,
    translateX: [-60, 0],
    opacity: [0, 1],
    delay: anime.stagger(150),
    duration: 650,
    easing: 'easeOutQuad'
  });

  anime({
    targets: '.slide5-footer-text',
    opacity: [0, 1],
    translateY: [20, 0],
    delay: 800,
    duration: 800,
    easing: 'easeOutQuad'
  });
}

/* ----------------------------------------------------
   SLIDE 6 — ANIMAÇÕES (CICLO DE VIDA)
   ---------------------------------------------------- */
ghostLoop = null;

function initSlide6() {
  const lines = document.querySelectorAll('#slide-6 .lifecycle-line');
  lines.forEach(l => {
    l.style.strokeDashoffset = '1000';
    l.style.stroke = 'rgba(255,255,255,0.15)';
    l.setAttribute('marker-end', 'url(#lf-arrow)');
  });

  anime({
    targets: lines,
    strokeDashoffset: [anime.setDashoffset, 0],
    delay: anime.stagger(120),
    duration: 1000,
    easing: 'easeInOutQuad'
  });

  s6CurrentStep = 0;

  document.getElementById('lifecycle-title').textContent = 'Selecione um Estado';
  document.getElementById('lifecycle-desc').textContent = 'Clique nos círculos do diagrama de estados ou use as setas do teclado (Esquerda/Direita) para guiar o processo manualmente por cada etapa.';
  document.getElementById('lifecycle-title').style.color = 'var(--blue)';

  const nodes = document.querySelectorAll('#slide-6 .node-circle');
  nodes.forEach(n => {
    n.setAttribute('fill', 'var(--gray-dark)');
  });

  const ghost = document.getElementById('ghost-process');
  if (ghost) {
    ghost.style.opacity = '0';
  }
}

const nodeDescriptions = {
  'NOVO': {
    title: 'Estado: Novo',
    desc: 'O processo está em fase de criação pelo Sistema Operacional. A estrutura de dados (PCB) está sendo alocada, o executável está sendo lido da memória persistente e o PID é registrado.',
    color: 'var(--purple)'
  },
  'PRONTO': {
    title: 'Estado: Pronto',
    desc: 'O processo já está carregado na memória RAM principal, contendo todas as dependências e recursos mapeados. Ele aguarda unicamente o escalonador do SO selecioná-lo para execução na CPU.',
    color: 'var(--yellow)'
  },
  'EXECUTANDO': {
    title: 'Estado: Executando',
    desc: 'A CPU está interpretando e executando as instruções deste processo. Em sistemas com único núcleo, apenas um processo pode estar neste estado a cada instante por vez.',
    color: 'var(--blue)'
  },
  'BLOQUEADO': {
    title: 'Estado: Bloqueado / Espera',
    desc: 'O processo solicitou um recurso lento ou externo (ex: entrada do teclado, leitura de HD, requisição de rede) e foi suspenso para não consumir CPU. Ao término do sinal do hardware, retorna para PRONTO.',
    color: 'var(--red)'
  },
  'TERMINADO': {
    title: 'Estado: Terminado',
    desc: 'A execução chegou ao fim (sucesso ou crash). Seus contextos de registradores, arquivos e espaços na memória RAM são limpos e liberados de volta para o sistema operacional.',
    color: 'var(--green)'
  }
};

function selectLifecycleNode(nodeId) {
  const nodes = document.querySelectorAll('#slide-6 .node-circle');
  nodes.forEach(n => {
    n.setAttribute('fill', 'var(--gray-dark)');
  });

  const activeCircle = document.getElementById(`node-${nodeId}`);
  const info = nodeDescriptions[nodeId];

  if (activeCircle && info) {
    activeCircle.setAttribute('fill', 'rgba(255,255,255,0.05)');
    const titleEl = document.getElementById('lifecycle-title');
    titleEl.textContent = info.title;
    titleEl.style.color = info.color;
    document.getElementById('lifecycle-desc').textContent = info.desc;
  }
}

function highlightNode(nodeId) {
  selectLifecycleNode(nodeId);
  const activeCircle = document.getElementById(`node-${nodeId}`);
  if (activeCircle) {
    anime({
      targets: activeCircle,
      r: [40, 45, 40],
      strokeWidth: [2, 4, 2],
      duration: 400,
      easing: 'easeInOutQuad'
    });
  }
}

function setLifecycleStep(step) {
  if (ghostLoop) {
    ghostLoop.pause();
  }
  
  s6CurrentStep = step;
  const ghost = document.getElementById('ghost-process');
  if (ghost) ghost.style.opacity = step > 0 ? '1' : '0';
  
  // Reset paths to default
  const paths = [
    'path-novo-pronto',
    'path-pronto-exec',
    'path-exec-pronto',
    'path-exec-bloq',
    'path-bloq-pronto',
    'path-exec-term'
  ];
  paths.forEach(pId => {
    const p = document.getElementById(pId);
    if (p) {
      p.style.stroke = 'rgba(255,255,255,0.15)';
      p.style.strokeWidth = '2px';
    }
  });
  
  if (step === 0) {
    document.getElementById('lifecycle-title').textContent = 'Selecione um Estado';
    document.getElementById('lifecycle-desc').textContent = 'Clique nos círculos do diagrama de estados ou use as setas do teclado (Esquerda/Direita) para guiar o processo manualmente por cada etapa.';
    document.getElementById('lifecycle-title').style.color = 'var(--blue)';
    const nodes = document.querySelectorAll('#slide-6 .node-circle');
    nodes.forEach(n => n.setAttribute('fill', 'var(--gray-dark)'));
    return;
  }
  
  let targetState = '';
  let cx = 80, cy = 200;
  
  switch (step) {
    case 1:
      targetState = 'NOVO';
      cx = 80; cy = 200;
      break;
    case 2:
      targetState = 'PRONTO';
      cx = 250; cy = 120;
      const pathNP = document.getElementById('path-novo-pronto');
      if (pathNP) pathNP.style.stroke = 'var(--blue)';
      break;
    case 3:
      targetState = 'EXECUTANDO';
      cx = 450; cy = 120;
      const pathPE = document.getElementById('path-pronto-exec');
      if (pathPE) pathPE.style.stroke = 'var(--blue)';
      break;
    case 4:
      targetState = 'BLOQUEADO';
      cx = 350; cy = 280;
      const pathEB = document.getElementById('path-exec-bloq');
      if (pathEB) pathEB.style.stroke = 'var(--red)';
      break;
    case 5:
      targetState = 'TERMINADO';
      cx = 680; cy = 200;
      const pathET = document.getElementById('path-exec-term');
      if (pathET) pathET.style.stroke = 'var(--green)';
      break;
  }
  
  highlightNode(targetState);
  
  anime({
    targets: ghost,
    cx: cx,
    cy: cy,
    duration: 500,
    easing: 'easeInOutQuad'
  });
}

function userSelectLifecycleNode(nodeId) {
  const stepMap = {
    'NOVO': 1,
    'PRONTO': 2,
    'EXECUTANDO': 3,
    'BLOQUEADO': 4,
    'TERMINADO': 5
  };
  if (stepMap[nodeId] !== undefined) {
    setLifecycleStep(stepMap[nodeId]);
  }
}

function startGhostSimulation() {
  const ghost = document.getElementById('ghost-process');
  ghost.style.opacity = '1';

  if (ghostLoop) ghostLoop.pause();

  ghostLoop = anime.timeline({
    loop: true,
    delay: 800
  });

  ghostLoop
    .add({
      targets: ghost,
      cx: 80, cy: 200,
      duration: 0,
      changeBegin: () => highlightNode('NOVO')
    })
    .add({
      targets: ghost,
      cx: 250, cy: 120,
      duration: 800,
      delay: 800,
      easing: 'easeInOutQuad',
      changeBegin: () => {
        highlightNode('PRONTO');
        document.getElementById('path-novo-pronto').style.stroke = 'var(--blue)';
      }
    })
    .add({
      targets: ghost,
      cx: 450, cy: 120,
      duration: 800,
      delay: 800,
      easing: 'easeInOutQuad',
      changeBegin: () => {
        highlightNode('EXECUTANDO');
        document.getElementById('path-pronto-exec').style.stroke = 'var(--blue)';
      }
    })
    .add({
      targets: ghost,
      cx: 350, cy: 280,
      duration: 800,
      delay: 800,
      easing: 'easeInOutQuad',
      changeBegin: () => {
        highlightNode('BLOQUEADO');
        document.getElementById('path-exec-bloq').style.stroke = 'var(--red)';
      }
    })
    .add({
      targets: ghost,
      cx: 250, cy: 120,
      duration: 800,
      delay: 800,
      easing: 'easeInOutQuad',
      changeBegin: () => {
        highlightNode('PRONTO');
        document.getElementById('path-bloq-pronto').style.stroke = 'var(--blue)';
      }
    })
    .add({
      targets: ghost,
      cx: 450, cy: 120,
      duration: 800,
      delay: 800,
      easing: 'easeInOutQuad',
      changeBegin: () => {
        highlightNode('EXECUTANDO');
        document.getElementById('path-pronto-exec').style.stroke = 'var(--blue)';
      }
    })
    .add({
      targets: ghost,
      cx: 680, cy: 200,
      duration: 800,
      delay: 800,
      easing: 'easeInOutQuad',
      changeBegin: () => {
        highlightNode('TERMINADO');
        document.getElementById('path-exec-term').style.stroke = 'var(--green)';
      }
    });
}

/* ----------------------------------------------------
   SLIDE 7 — ANIMAÇÕES (SIMULADOR RACE CONDITION)
   ---------------------------------------------------- */
s7Timeouts = [];

function initSlide7() {
  resetRaceConditionSim();
}

function resetRaceConditionSim() {
  s7Timeouts.forEach(t => clearTimeout(t));
  s7Timeouts = [];
  
  document.getElementById('btn-start-sim').disabled = false;

  const boxA = document.getElementById('sim-ta');
  const boxB = document.getElementById('sim-tb');
  const boxBal = document.getElementById('sim-bal');
  const valA = document.getElementById('sim-ta-val');
  const valB = document.getElementById('sim-tb-val');
  const valBal = document.getElementById('sim-bal-val');
  const log = document.getElementById('sim-log-text');
  const explanation = document.getElementById('sim-explanation');
  const lineA = document.getElementById('line-ta-bal');
  const lineB = document.getElementById('line-tb-bal');

  boxA.className = 'sim-thread-box';
  boxB.className = 'sim-thread-box';
  boxBal.className = 'sim-balance-box';
  
  valA.textContent = 'local: --';
  valB.textContent = 'local: --';
  valBal.textContent = 'R$ 1.000';
  log.textContent = 'Pressione Simular para ver a colisão de gravação em tempo real.';
  explanation.style.opacity = '0';
  explanation.style.transform = 'translateY(20px)';

  lineA.style.stroke = 'rgba(255,255,255,0.05)';
  lineB.style.stroke = 'rgba(255,255,255,0.05)';
  lineA.removeAttribute('stroke-dasharray');
  lineB.removeAttribute('stroke-dasharray');
}

function runRaceConditionSim() {
  resetRaceConditionSim();
  document.getElementById('btn-start-sim').disabled = true;

  const boxA = document.getElementById('sim-ta');
  const boxB = document.getElementById('sim-tb');
  const boxBal = document.getElementById('sim-bal');
  const valA = document.getElementById('sim-ta-val');
  const valB = document.getElementById('sim-tb-val');
  const valBal = document.getElementById('sim-bal-val');
  const log = document.getElementById('sim-log-text');
  const explanation = document.getElementById('sim-explanation');
  const lineA = document.getElementById('line-ta-bal');
  const lineB = document.getElementById('line-tb-bal');

  const steps = [
    {
      delay: 0,
      fn: () => {
        boxA.classList.add('active');
        lineA.style.stroke = 'var(--blue)';
        lineA.setAttribute('stroke-dasharray', '5 3');
        log.textContent = 'Thread A lê o saldo compartilhado...';
      }
    },
    {
      delay: 800,
      fn: () => {
        valA.textContent = 'local: R$ 1.000';
        log.textContent = 'Thread A carregou localmente: R$ 1.000';
        lineA.style.stroke = 'rgba(255,255,255,0.05)';
        lineA.removeAttribute('stroke-dasharray');
        boxA.classList.remove('active');
      }
    },
    {
      delay: 1600,
      fn: () => {
        boxB.classList.add('active-purple');
        lineB.style.stroke = 'var(--purple)';
        lineB.setAttribute('stroke-dasharray', '5 3');
        log.textContent = 'Preempção: Thread B também lê o saldo compartilhado...';
      }
    },
    {
      delay: 2400,
      fn: () => {
        valB.textContent = 'local: R$ 1.000';
        log.textContent = 'Thread B carregou localmente: R$ 1.000 (Sem saber sobre A)';
        lineB.style.stroke = 'rgba(255,255,255,0.05)';
        lineB.removeAttribute('stroke-dasharray');
        boxB.classList.remove('active-purple');
      }
    },
    {
      delay: 3200,
      fn: () => {
        boxA.classList.add('active');
        valA.textContent = 'local: R$ 1.000 - 500';
        log.textContent = 'Thread A calcula: R$ 1.000 - R$ 500 = R$ 500';
      }
    },
    {
      delay: 4000,
      fn: () => {
        valA.textContent = 'local: R$ 500';
        boxA.classList.remove('active');
      }
    },
    {
      delay: 4800,
      fn: () => {
        boxB.classList.add('active-purple');
        valB.textContent = 'local: R$ 1.000 - 500';
        log.textContent = 'Thread B calcula: R$ 1.000 - R$ 500 = R$ 500';
      }
    },
    {
      delay: 5600,
      fn: () => {
        valB.textContent = 'local: R$ 500';
        boxB.classList.remove('active-purple');
      }
    },
    {
      delay: 6400,
      fn: () => {
        boxA.classList.add('active');
        lineA.style.stroke = 'var(--blue)';
        lineA.setAttribute('stroke-dasharray', '5 3');
        log.textContent = 'Thread A escreve seu valor local no saldo compartilhado...';
      }
    },
    {
      delay: 7200,
      fn: () => {
        valBal.textContent = 'R$ 500';
        lineA.style.stroke = 'rgba(255,255,255,0.05)';
        lineA.removeAttribute('stroke-dasharray');
        boxA.classList.remove('active');
      }
    },
    {
      delay: 8000,
      fn: () => {
        boxB.classList.add('active-purple');
        lineB.style.stroke = 'var(--purple)';
        lineB.setAttribute('stroke-dasharray', '5 3');
        log.textContent = 'Thread B escreve seu valor local no saldo compartilhado...';
      }
    },
    {
      delay: 8800,
      fn: () => {
        valBal.textContent = 'R$ 500';
        boxBal.classList.add('error');
        lineB.style.stroke = 'rgba(255,255,255,0.05)';
        lineB.removeAttribute('stroke-dasharray');
        boxB.classList.remove('active-purple');
        log.textContent = 'FIM DA SIMULAÇÃO: O saldo resultou em R$ 500!';
        
        explanation.style.opacity = '1';
        explanation.style.transform = 'translateY(0)';
      }
    }
  ];

  steps.forEach(step => {
    const tId = setTimeout(step.fn, step.delay);
    s7Timeouts.push(tId);
  });
}

/* ----------------------------------------------------
   SLIDE 8 — ANIMAÇÕES (DESAFIOS CONCORRENTES)
   ---------------------------------------------------- */
function initSlide8() {
  const cards = document.querySelectorAll('#slide-8 .card-3d');
  cards.forEach(c => c.classList.remove('flipped'));

  anime({
    targets: cards,
    translateY: [60, 0],
    opacity: [0, 1],
    delay: anime.stagger(150),
    duration: 800,
    easing: 'easeOutBack'
  });

  const footer = document.getElementById('slide8-footer');
  footer.style.opacity = '0';
  anime({
    targets: footer,
    opacity: [0, 1],
    delay: 1100,
    duration: 600,
    easing: 'easeOutQuad'
  });
}

/* ----------------------------------------------------
   SLIDE 9 — ANIMAÇÕES (DEADLOCK CONCEITO)
   ---------------------------------------------------- */
function initSlide9() {
  document.body.style.filter = 'blur(5px)';
  setTimeout(() => {
    document.body.style.filter = 'none';
  }, 200);

  const items = document.querySelectorAll('#slide-9 .coffman-item');
  items.forEach(it => it.classList.remove('active'));

  anime({
    targets: '#slide-9 .slide9-left',
    opacity: [0, 1],
    translateX: [-50, 0],
    duration: 700,
    easing: 'easeOutQuad'
  });

  anime({
    targets: items,
    translateY: [30, 0],
    opacity: [0, 1],
    delay: anime.stagger(200, {start: 300}),
    duration: 600,
    easing: 'easeOutQuad'
  });
}

function toggleCoffman(element) {
  const items = document.querySelectorAll('.coffman-item');
  items.forEach(it => {
    if (it !== element) {
      it.classList.remove('active');
    }
  });
  element.classList.toggle('active');
}

/* ----------------------------------------------------
   SLIDE 10 — ANIMAÇÕES (JANTAR DOS FILÓSOFOS)
   ---------------------------------------------------- */
function initSlide10() {
  resetPhilosophersSim();
}

function resetPhilosophersSim() {
  const container = document.getElementById('philo-table-container');
  if (container) container.classList.remove('deadlock-active');

  const btn = document.getElementById('btn-philo-sim');
  if (btn) btn.disabled = false;

  const txt = document.getElementById('philo-status-text');
  if (txt) {
    txt.classList.remove('pulse');
    txt.style.opacity = '0';
  }

  document.getElementById('wait-arrows-group').innerHTML = '';

  const forkCoords = {
    'fork-1': { x2: 326, y2: 145 },
    'fork-2': { x2: 374, y2: 290 },
    'fork-3': { x2: 250, y2: 380 },
    'fork-4': { x2: 126, y2: 290 },
    'fork-5': { x2: 174, y2: 145 }
  };

  for (let id in forkCoords) {
    const f = document.getElementById(id);
    if (f) {
      f.setAttribute('x2', forkCoords[id].x2);
      f.setAttribute('y2', forkCoords[id].y2);
      f.style.stroke = 'rgba(255,255,255,0.4)';
    }
  }
}

function runPhilosophersSim() {
  const btn = document.getElementById('btn-philo-sim');
  if (btn) btn.disabled = true;

  const actions = [
    { forkId: 'fork-5', x2: 250, y2: 104, color: '#F97316', delay: 100 },
    { forkId: 'fork-1', x2: 389, y2: 205, color: '#3B82F6', delay: 400 },
    { forkId: 'fork-2', x2: 336, y2: 368, color: '#8B5CF6', delay: 700 },
    { forkId: 'fork-3', x2: 164, y2: 368, color: '#10B981', delay: 1000 },
    { forkId: 'fork-4', x2: 111, y2: 205, color: '#F59E0B', delay: 1300 }
  ];

  actions.forEach(act => {
    setTimeout(() => {
      const f = document.getElementById(act.forkId);
      if (f) {
        anime({
          targets: f,
          x2: act.x2,
          y2: act.y2,
          duration: 400,
          easing: 'easeOutQuad'
        });
        f.style.stroke = act.color;
      }
    }, act.delay);
  });

  setTimeout(() => {
    const arrowsGroup = document.getElementById('wait-arrows-group');
    if (arrowsGroup) {
      arrowsGroup.innerHTML = `
        <defs>
          <marker id="red-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--red)" />
          </marker>
        </defs>
        <path d="M 250,110 A 140 140 0 0 1 383,207" class="wait-arrow" marker-end="url(#red-arr)" fill="none" />
        <path d="M 383,207 A 140 140 0 0 1 332,363" class="wait-arrow" marker-end="url(#red-arr)" fill="none" />
        <path d="M 332,363 A 140 140 0 0 1 168,363" class="wait-arrow" marker-end="url(#red-arr)" fill="none" />
        <path d="M 168,363 A 140 140 0 0 1 117,207" class="wait-arrow" marker-end="url(#red-arr)" fill="none" />
        <path d="M 117,207 A 140 140 0 0 1 250,110" class="wait-arrow" marker-end="url(#red-arr)" fill="none" />
      `;
    }

    const container = document.getElementById('philo-table-container');
    if (container) container.classList.add('deadlock-active');
    
    const txt = document.getElementById('philo-status-text');
    if (txt) {
      txt.style.opacity = '1';
      txt.classList.add('pulse');
    }
  }, 2000);
}

/* ----------------------------------------------------
   SLIDE 11 — ANIMAÇÕES (DEADLOCK NO CÓDIGO)
   ---------------------------------------------------- */
s11Timeouts = [];

s11Timeouts = [];

function initSlide11() {
  s11Timeouts.forEach(t => clearTimeout(t));
  s11Timeouts = [];
  
  const lines = document.querySelectorAll('#slide-11 .code-line');
  lines.forEach(l => {
    l.style.opacity = '0';
    l.style.transform = 'translateX(-15px)';
    l.classList.remove('wait-highlight');
  });
  
  const arrow = document.getElementById('code-deadlock-line');
  if (arrow) arrow.style.opacity = '0';
  
  const footer = document.getElementById('slide11-footer');
  if (footer) footer.style.opacity = '0';
  
  // Step 1: Thread A locks mutex_1, Thread B locks mutex_2
  s11Timeouts.push(setTimeout(() => {
    animateLineAppearance(lines[0]); // lock(mutex_1) (Thread A)
    animateLineAppearance(lines[6]); // lock(mutex_2) (Thread B)
  }, 300));
  
  // Step 2: Thread A waits mutex_2, Thread B waits mutex_1
  s11Timeouts.push(setTimeout(() => {
    animateLineAppearance(lines[1]); // lock(mutex_2) (Thread A)
    animateLineAppearance(lines[7]); // lock(mutex_1) (Thread B)
  }, 1100));
  
  // Step 3: Deadlock locks and connections appear
  s11Timeouts.push(setTimeout(() => {
    lines[1].classList.add('wait-highlight');
    lines[7].classList.add('wait-highlight');
    
    // Calculate responsive coordinates dynamically
    const svgEl = document.getElementById('code-connector-svg');
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      
      const lineA1 = lines[0].getBoundingClientRect(); // A holds mutex_1
      const lineA2 = lines[1].getBoundingClientRect(); // A waits mutex_2
      const lineB2 = lines[6].getBoundingClientRect(); // B holds mutex_2
      const lineB1 = lines[7].getBoundingClientRect(); // B waits mutex_1
      
      const a2_x = lineA2.right - svgRect.left;
      const a2_y = lineA2.top + lineA2.height / 2 - svgRect.top;
      const b2_x = lineB2.left - svgRect.left;
      const b2_y = lineB2.top + lineB2.height / 2 - svgRect.top;
      
      const b1_x = lineB1.left - svgRect.left;
      const b1_y = lineB1.top + lineB1.height / 2 - svgRect.top;
      const a1_x = lineA1.right - svgRect.left;
      const a1_y = lineA1.top + lineA1.height / 2 - svgRect.top;
      
      const pathAtoB = document.getElementById('path-code-a-to-b');
      const pathBtoA = document.getElementById('path-code-b-to-a');
      
      if (pathAtoB) pathAtoB.setAttribute('d', `M ${a2_x},${a2_y} C ${a2_x + 50},${a2_y} ${b2_x - 50},${b2_y} ${b2_x},${b2_y}`);
      if (pathBtoA) pathBtoA.setAttribute('d', `M ${b1_x},${b1_y} C ${b1_x - 50},${b1_y} ${a1_x + 50},${a1_y} ${a1_x},${a1_y}`);
    }
    
    if (arrow) {
      arrow.style.opacity = '1';
      anime({
        targets: arrow,
        opacity: [1, 0.4, 1],
        duration: 1000,
        loop: true,
        easing: 'easeInOutQuad'
      });
    }
    
    // Display critical sections and unlocks faded out (since they never run!)
    for (let i = 2; i <= 5; i++) {
      if (lines[i]) {
        lines[i].style.opacity = '0.15';
        lines[i].style.transform = 'translateX(0)';
      }
    }
    for (let i = 8; i <= 11; i++) {
      if (lines[i]) {
        lines[i].style.opacity = '0.15';
        lines[i].style.transform = 'translateX(0)';
      }
    }
    
    if (footer) {
      footer.style.opacity = '1';
      anime({
        targets: footer,
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad'
      });
    }
  }, 1900));
}

function animateLineAppearance(el) {
  if (!el) return;
  el.style.transition = 'opacity 400ms, transform 400ms';
  el.style.opacity = '1';
  el.style.transform = 'translateX(0)';
}

/* ----------------------------------------------------
   SLIDE 12 — ANIMAÇÕES (ESTRATÉGIAS DE TRATAMENTO)
   ---------------------------------------------------- */
function initSlide12() {
  const cards = document.querySelectorAll('#slide-12 .treatment-card');
  cards.forEach(c => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(-40px)';
  });

  anime({
    targets: cards,
    translateY: [-40, 0],
    opacity: [0, 1],
    delay: anime.stagger(150),
    duration: 800,
    easing: 'easeOutBack'
  });
}

/* ----------------------------------------------------
   SLIDE 13 — ANIMAÇÕES (TIMELINE INTERATIVA JORNADA MANUAL)
   ---------------------------------------------------- */
s13Timeouts = [];
s13Animations = [];
isJornadaRunning = false;
s13CurrentStep = 0;

function initSlide13() {
  s13Timeouts.forEach(t => clearTimeout(t));
  s13Timeouts = [];
  s13Animations.forEach(a => a.pause());
  s13Animations = [];
  isJornadaRunning = false;
  s13CurrentStep = 0;
  
  document.getElementById('btn-start-jornada').disabled = false;
  document.getElementById('btn-start-jornada').textContent = '▶ Iniciar jornada';
  document.getElementById('slide13-init-state').style.display = 'flex';
  document.getElementById('slide13-init-state').style.opacity = '1';
  
  const particleWrapper = document.getElementById('jornada-particle-wrapper');
  particleWrapper.style.opacity = '0';
  particleWrapper.style.left = '50%';
  particleWrapper.style.top = '30%';
  
  const particle = document.getElementById('jornada-particle');
  particle.style.transform = 'scale(1)';
  particle.style.background = '#ffffff';
  particle.style.boxShadow = '0 0 20px #ffffff';
  
  const points = document.querySelectorAll('#slide-13 .timeline-point');
  points.forEach(p => p.classList.remove('reached'));
  
  document.getElementById('timeline-track-drawn').style.width = '0%';
  
  const scenes = document.querySelectorAll('#slide-13 .node-scene');
  scenes.forEach(s => s.classList.remove('active'));
  
  const concl = document.getElementById('slide13-conclusion');
  concl.style.opacity = '0';
  concl.innerHTML = '"Entender processos e threads não é só saber o que eles são — é entender a dança delicada que o sistema operacional orquestra a cada segundo para que seus programas funcionem."';

  updateNavControls();
}

function startJornadaTimeline() {
  if (isJornadaRunning) return;
  isJornadaRunning = true;
  s13CurrentStep = 1;
  
  anime({
    targets: '#slide13-init-state',
    opacity: 0,
    duration: 400,
    complete: () => {
      document.getElementById('slide13-init-state').style.display = 'none';
    }
  });
  
  const particleWrapper = document.getElementById('jornada-particle-wrapper');
  particleWrapper.style.opacity = '1';
  
  jumpToJornadaStep(1);
}

function runJornadaStep(step) {
  // Chamado para fins de compatibilidade estrutural
  jumpToJornadaStep(step);
}

function jumpToJornadaStep(step) {
  if (step < 1 || step > 9) return;
  
  // Limpar timeouts/animações pendentes do slide 13
  s13Timeouts.forEach(t => clearTimeout(t));
  s13Timeouts = [];
  s13Animations.forEach(a => a.pause());
  s13Animations = [];
  
  // Garantir que o estado de início suma
  document.getElementById('slide13-init-state').style.display = 'none';
  document.getElementById('slide13-init-state').style.opacity = '0';
  
  const particleWrapper = document.getElementById('jornada-particle-wrapper');
  particleWrapper.style.opacity = '1';
  
  // Configurar pontos alcançados
  const points = document.querySelectorAll('#slide-13 .timeline-point');
  points.forEach((p, idx) => {
    if (idx < step) {
      p.classList.add('reached');
    } else {
      p.classList.remove('reached');
    }
  });
  
  // Desenhar preenchimento da linha do tempo
  const drawnTrack = document.getElementById('timeline-track-drawn');
  const widthPct = ((step - 1) / 8) * 88;
  drawnTrack.style.width = `${widthPct}%`;
  
  // Alternar cenas ativas
  const scenes = document.querySelectorAll('#slide-13 .node-scene');
  scenes.forEach(s => s.classList.remove('active'));
  
  const activeScene = document.getElementById(`scene-${step}`);
  if (activeScene) {
    activeScene.classList.add('active');
  }
  
  // Posicionar a partícula no ponto atual
  const currentPoint = document.getElementById(`tp-${step}`);
  const containerRect = document.querySelector('.particle-timeline-container').getBoundingClientRect();
  const tpRect = currentPoint.getBoundingClientRect();
  const x = tpRect.left + tpRect.width / 2 - containerRect.left;
  const y = tpRect.top + tpRect.height / 2 - containerRect.top;
  
  s13Animations.push(anime({
    targets: particleWrapper,
    left: `${x}px`,
    top: `${y}px`,
    duration: 600,
    easing: 'easeInOutQuad'
  }));
  
  // Animador principal da partícula
  const mainParticle = document.getElementById('jornada-particle');
  mainParticle.style.transform = 'scale(1)';
  mainParticle.style.opacity = '1';
  if (step === 9) {
    mainParticle.style.background = 'var(--green)';
    mainParticle.style.boxShadow = '0 0 25px var(--green)';
  } else {
    mainParticle.style.background = '#ffffff';
    mainParticle.style.boxShadow = '0 0 20px #ffffff';
  }
  
  // Executar animação visual interna da cena
  runMiniSceneAnimation(step);
  
  s13CurrentStep = step;
  isJornadaRunning = true;
  updateNavControls();
}

function runMiniSceneAnimation(step) {
  if (step === 1) {
    const cursor = document.getElementById('scene1-cursor');
    const prog = document.getElementById('scene1-prog');
    cursor.style.transform = 'translate(0px, 0px)';
    
    s13Animations.push(anime({
      targets: cursor,
      translateX: [-15, 0],
      translateY: [15, 0],
      duration: 500,
      easing: 'easeOutBack',
      complete: () => {
        s13Animations.push(anime({
          targets: prog,
          scale: [1, 1.1, 0.9, 1.05, 1],
          rotate: [0, 5, -5, 3, 0],
          duration: 400,
          easing: 'easeInOutQuad'
        }));
      }
    }));
  }
  else if (step === 2) {
    const env = document.getElementById('scene2-env');
    env.style.transform = 'scale(0)';
    s13Animations.push(anime({
      targets: env,
      scale: [0, 1.2, 1],
      duration: 600,
      easing: 'easeOutBack'
    }));
  }
  else if (step === 3) {
    const t1 = document.getElementById('s3-t1');
    const t2 = document.getElementById('s3-t2');
    const t3 = document.getElementById('s3-t3');
    const c1 = document.getElementById('s3-c1');
    const c2 = document.getElementById('s3-c2');
    const c3 = document.getElementById('s3-c3');
    
    t1.style.strokeDashoffset = '30';
    t2.style.strokeDashoffset = '35';
    t3.style.strokeDashoffset = '25';
    c1.style.opacity = '0';
    c2.style.opacity = '0';
    c3.style.opacity = '0';
    
    s13Animations.push(anime({
      targets: [t1, t2, t3],
      strokeDashoffset: 0,
      duration: 600,
      easing: 'easeOutQuad',
      complete: () => {
        s13Animations.push(anime({
          targets: [c1, c2, c3],
          opacity: 1,
          scale: [0.5, 1],
          duration: 300,
          easing: 'easeOutBack'
        }));
      }
    }));
  }
  else if (step === 4) {
    const b1 = document.getElementById('s4-b1');
    const b2 = document.getElementById('s4-b2');
    const b3 = document.getElementById('s4-b3');
    
    b1.setAttribute('cx', '10');
    b2.setAttribute('cx', '10');
    b3.setAttribute('cx', '10');
    
    s13Animations.push(anime({
      targets: b1,
      cx: 70,
      duration: 1000,
      direction: 'alternate',
      loop: true,
      easing: 'linear'
    }));
    s13Animations.push(anime({
      targets: b2,
      cx: 70,
      duration: 1200,
      direction: 'alternate',
      loop: true,
      easing: 'linear'
    }));
    s13Animations.push(anime({
      targets: b3,
      cx: 70,
      duration: 800,
      direction: 'alternate',
      loop: true,
      easing: 'linear'
    }));
  }
  else if (step === 5) {
    const c1 = document.getElementById('s5-c1');
    const c2 = document.getElementById('s5-c2');
    const c3 = document.getElementById('s5-c3');
    const clash = document.getElementById('s5-clash');
    const clock = document.getElementById('s5-clock');
    
    c1.setAttribute('cx', '15'); c1.setAttribute('cy', '45');
    c2.setAttribute('cx', '40'); c2.setAttribute('cy', '45');
    c3.setAttribute('cx', '65'); c3.setAttribute('cy', '45');
    clash.style.opacity = '0';
    clock.style.opacity = '0';
    
    s13Animations.push(anime({
      targets: [c1, c3],
      cx: 40,
      cy: 23,
      duration: 800,
      easing: 'easeOutQuad',
      complete: () => {
        clash.style.opacity = '1';
        clock.style.opacity = '1';
        
        s13Animations.push(anime({
          targets: clash,
          opacity: [1, 0.3, 1],
          duration: 400,
          loop: true
        }));
      }
    }));
  }
  else if (step === 6) {
    const shackle = document.getElementById('s6-lock-shackle');
    const c1 = document.getElementById('s6-c1');
    const c2 = document.getElementById('s6-c2');
    const c3 = document.getElementById('s6-c3');
    
    shackle.style.transform = 'translateY(-3px)';
    c1.setAttribute('cx', '12');
    c2.setAttribute('cx', '24');
    c3.setAttribute('cx', '36');
    
    s13Animations.push(anime({
      targets: shackle,
      translateY: 0,
      duration: 400,
      easing: 'easeOutBounce',
      complete: () => {
        s13Animations.push(anime({
          targets: [c1, c2, c3],
          cx: '+=15',
          delay: anime.stagger(150),
          duration: 500,
          easing: 'easeOutQuad'
        }));
      }
    }));
  }
  else if (step === 7) {
    const sceneEl = document.getElementById('scene-7');
    s13Animations.push(anime({
      targets: sceneEl,
      borderColor: ['var(--card-border)', 'var(--red)', 'var(--card-border)'],
      duration: 1000,
      loop: true,
      easing: 'easeInOutQuad'
    }));
  }
  else if (step === 8) {
    const slash = document.getElementById('s8-slash');
    const shield = document.getElementById('s8-shield');
    
    slash.style.transform = 'scale(0)';
    shield.style.opacity = '0';
    shield.style.transform = 'scale(0)';
    
    s13Animations.push(anime({
      targets: slash,
      scale: [0, 1.2, 1],
      duration: 500,
      easing: 'easeOutBack',
      complete: () => {
        slash.style.transform = 'scale(1)';
        s13Animations.push(anime({
          targets: shield,
          opacity: 1,
          scale: [0, 1.1, 1],
          duration: 500,
          easing: 'easeOutBack'
        }));
      }
    }));
  }
  else if (step === 9) {
    const burstSvg = document.getElementById('s9-burst-svg');
    burstSvg.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '40');
      circle.setAttribute('cy', '30');
      circle.setAttribute('r', (Math.random() * 3 + 2).toString());
      circle.setAttribute('fill', 'var(--green)');
      circle.style.opacity = '1';
      burstSvg.appendChild(circle);
      
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 25 + 10;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      
      s13Animations.push(anime({
        targets: circle,
        cx: 40 + tx,
        cy: 30 + ty,
        opacity: 0,
        duration: 800,
        easing: 'easeOutQuad'
      }));
    }
    
    const mainParticle = document.getElementById('jornada-particle');
    mainParticle.style.background = 'var(--green)';
    mainParticle.style.boxShadow = '0 0 25px var(--green)';
  }
}

function finishJornadaTimeline() {
  const particleWrapper = document.getElementById('jornada-particle-wrapper');
  const particle = document.getElementById('jornada-particle');
  
  // Limpar qualquer cena ativa
  const scenes = document.querySelectorAll('#slide-13 .node-scene');
  scenes.forEach(s => s.classList.remove('active'));

  s13Animations.push(anime({
    targets: particleWrapper,
    left: '50%',
    top: '30%',
    duration: 1000,
    easing: 'easeInOutQuad',
    complete: () => {
      s13Animations.push(anime({
        targets: particle,
        scale: 8,
        opacity: 0,
        duration: 800,
        easing: 'easeInQuad',
        complete: () => {
          particleWrapper.style.opacity = '0';
          
          const concl = document.getElementById('slide13-conclusion');
          concl.style.opacity = '1';
          
          const rawText = concl.textContent.trim();
          concl.innerHTML = '';
          const words = rawText.split(/\s+/);
          
          words.forEach((word, index) => {
            const span = document.createElement('span');
            span.innerHTML = word + '&nbsp;';
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(5px)';
            span.style.transition = 'opacity 300ms, transform 300ms';
            concl.appendChild(span);
            
            s13Timeouts.push(setTimeout(() => {
              span.style.opacity = '1';
              span.style.transform = 'translateY(0)';
            }, index * 60));
          });
          
          s13Timeouts.push(setTimeout(() => {
            isJornadaRunning = false;
            document.getElementById('slide13-init-state').style.display = 'flex';
            document.getElementById('btn-start-jornada').disabled = false;
            document.getElementById('btn-start-jornada').textContent = '🔄 Reiniciar jornada';
            anime({
              targets: '#slide13-init-state',
              opacity: 1,
              duration: 400
            });
          }, words.length * 60 + 2000));
        }
      }));
    }
  }));

  s13CurrentStep = 10;
  updateNavControls();
}
