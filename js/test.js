(function () {
const { CONFIG, QUESTIONS, TEXTS } = MB.config;
const { enter, leave, cancel, duration } = MB.motion;

const stage = document.getElementById('test-stage');
const countEl = document.getElementById('test-count');
const progress = document.getElementById('test-progress');
const bar = document.getElementById('test-progress-bar');
const backBtn = document.getElementById('test-back');

let choices = [];   // índice de opción elegida por pregunta
let index = 0;      // pregunta mostrada (o destino de la navegación en curso)
let timer = null;   // avance automático pendiente
let navToken = 0;   // invalida navegaciones anteriores si el usuario toca rápido
let lastKeyWasArrow = false;
let onFinish = () => {};
let onBackToHome = () => {};

function initTest(callbacks) {
  onFinish = callbacks.onFinish;
  onBackToHome = callbacks.onBackToHome;
  backBtn.addEventListener('click', () => (index === 0 ? onBackToHome() : go(index - 1)));
}

function startTest() {
  clearTimeout(timer);
  navToken++;
  choices = [];
  index = 0;
  render(0, { animate: false });
}

function resetTest() {
  clearTimeout(timer);
  navToken++;
  choices = [];
  stage.replaceChildren();
}

// Respuestas para el asesor: pregunta + texto de la opción elegida
function getAnswers() {
  return QUESTIONS.map((q, i) => ({ question: q.text, option: q.options[choices[i]].label }));
}
const getChoices = () => [...choices];

function render(i, { animate = true, dir = 1 } = {}) {
  const q = QUESTIONS[i];
  const field = document.createElement('fieldset');
  field.className = 'question';
  field.dataset.q = i;
  field.innerHTML = `
    <legend class="question__title"></legend>
    <p class="sr-only"></p>
    <div class="question__options"></div>`;
  field.querySelector('legend').textContent = q.text;
  field.querySelector('.sr-only').textContent = TEXTS.keyboardHint;

  const list = field.querySelector('.question__options');
  q.options.forEach((opt, k) => {
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `
      <input class="option__input sr-only" type="radio" name="q${i}" value="${k}">
      <span class="option__card"><span class="option__mark" aria-hidden="true"></span><span class="option__label"></span></span>`;
    label.querySelector('.option__label').textContent = opt.label;
    const input = label.querySelector('input');
    input.checked = choices[i] === k;
    input.addEventListener('click', () => choose(i, k));
    list.append(label);
  });

  field.addEventListener('keydown', (e) => {
    lastKeyWasArrow = e.key.startsWith('Arrow');
    // Enter confirma con teclado cuando ya hay una opción elegida
    if (e.key === 'Enter' && choices[i] !== undefined) { e.preventDefault(); advance(); }
  });

  stage.replaceChildren(field);

  countEl.textContent = TEXTS.progress(i + 1, CONFIG.TOTAL_QUESTIONS);
  progress.setAttribute('aria-valuenow', String(i + 1));
  bar.style.transform = `scaleX(${(i + 1) / CONFIG.TOTAL_QUESTIONS})`;
  backBtn.hidden = false; // en la pregunta 1 vuelve al Inicio
  backBtn.setAttribute('aria-label', i === 0 ? TEXTS.backToHome : TEXTS.back);

  if (animate) enter(field, { x: `${24 * dir}px`, ms: duration.medium() });
}

function choose(i, k) {
  if (i !== index) return;
  choices[i] = k;
  clearTimeout(timer);
  // Con flechas el usuario está explorando: no avanzamos solos (Enter confirma)
  if (lastKeyWasArrow) { lastKeyWasArrow = false; return; }
  timer = setTimeout(advance, CONFIG.AUTO_ADVANCE_MS);
}

function advance() {
  clearTimeout(timer);
  go(index + 1);
}

// Navega a la pregunta `target`. La última llamada gana; las anteriores se descartan sin dejar la UI a medias.
async function go(target) {
  if (target < 0) return;
  clearTimeout(timer);
  const token = ++navToken;
  index = target;

  const current = stage.firstElementChild;
  // Adelante: sale a la izquierda y entra desde la derecha. Atrás: al revés.
  const dir = current && target < Number(current.dataset.q) ? -1 : 1;
  if (current) {
    current.inert = true; // no admite toques mientras sale
    await leave(current, { x: `${-24 * dir}px`, ms: duration.exit(duration.medium()) });
    if (token !== navToken) return;
    cancel(current);
  }

  if (target >= QUESTIONS.length) { onFinish(); return; }
  render(target, { dir });
}

MB.test = { initTest, startTest, resetTest, getAnswers, getChoices };
})();
