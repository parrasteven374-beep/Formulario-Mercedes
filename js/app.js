(function () {
  const { CONFIG, CARS } = MB.config;
  const { computeResult, simulateAll } = MB.scoring;
  const { enter, leave, cancel, duration } = MB.motion;

  function boot() {
    const screens = Object.fromEntries(
      [...document.querySelectorAll('[data-screen]')].map((el) => [el.dataset.screen, el])
    );
    let navToken = 0;
    let result = null;

    // Transición entre pantallas (nivel lento): la saliente se va a la izquierda más rápido; la entrante llega desde la derecha.
    // Interrumpible: la última navegación gana y cancela las animaciones anteriores.
    async function show(name) {
      const token = ++navToken;
      const next = screens[name];
      const leaving = Object.values(screens).filter((s) => !s.hidden && s !== next);
      const slow = duration.slow();

      await Promise.all(leaving.map((s) => leave(s, { x: '-24px', ms: duration.exit(slow) })));
      if (token !== navToken) return;

      leaving.forEach((s) => { cancel(s); s.hidden = true; });
      MB.inicio.settleLoop();
      next.hidden = false;
      window.scrollTo(0, 0);

      if (name === 'resultado') {
        cancel(next);
        MB.resultado.playResultIntro(); // coreografía propia con jerarquía
      } else {
        enter(next, { x: '24px', ms: slow });
      }
      if (name === 'inicio') { MB.inicio.playIntro(); MB.loop.start(); }

      // El foco va al título; scroll-margin-top evita que quede tras el header
      (next.querySelector('.screen__title') ?? next).focus({ preventScroll: true });
    }

    // Confirmación de salida: solo si el test está en curso y ya hay respuestas
    function confirmLeave() {
      if (screens.test.hidden || !MB.test.getChoices().length) return true;
      return window.confirm(MB.config.TEXTS.exitConfirm);
    }

    // Inicio / menú / hero -> pregunta 1 (reinicia cualquier test previo)
    function startTest() { MB.test.startTest(); return show('test'); }
    function goStart() {
      if (!confirmLeave()) return;
      return startTest();
    }
    // Atrás en la pregunta 1: de vuelta al Inicio
    function backToHome() { MB.test.resetTest(); return show('inicio'); }
    function goHome() {
      // Ya estamos en Inicio: solo volver arriba, sin repetir la transición
      if (!screens.inicio.hidden) { window.scrollTo(0, 0); return; }
      if (!confirmLeave()) return;
      MB.test.resetTest();
      MB.form.resetForm();
      result = null;
      return show('inicio');
    }

    // Pantalla "MATCH" antes del resultado: el resultado se prepara debajo y se revela al terminar
    let matching = false;
    async function finishTest() {
      if (matching) return;
      matching = true;
      result = computeResult(MB.test.getChoices());
      MB.resultado.renderResult(result);
      MB.form.resetForm();
      await MB.match.show(CARS[result.winnerId]);
      // El test sale detrás de la pantalla MATCH; al empezar la entrada del resultado se retira el velo
      const shown = show('resultado');
      await new Promise((r) => setTimeout(r, duration.exit(duration.slow()) + 40));
      await MB.match.hide();
      await shown;
      matching = false;
    }

    MB.loop.init();
    MB.match.init();
    MB.test.initTest({ onFinish: finishTest, onBackToHome: backToHome });
    MB.form.initForm(() => ({
      answers: MB.test.getAnswers(),
      winner: { id: result.winnerId, name: CARS[result.winnerId].name },
      affinity: result.affinity, // dato interno para el asesor; no se muestra en pantalla
    }));
    MB.header.init({ onHome: goHome, onStart: goStart });

    document.querySelectorAll('[data-action="start"]').forEach((btn) =>
      btn.addEventListener('click', goStart)
    );
    document.getElementById('retry').addEventListener('click', goHome);
    // TODO(cliente): reemplazar el href="#" de la política de privacidad; mientras tanto no navegar
    document.querySelectorAll('[data-privacy-link]').forEach((a) =>
      a.addEventListener('click', (e) => { if (a.getAttribute('href') === '#') e.preventDefault(); })
    );

    MB.inicio.playIntro();
    MB.inicio.initLoop();
    MB.loop.start();
    MB.inicio.initShowcase();

    // Solo pruebas: window.simulateAll() disponible únicamente con CONFIG.DEBUG = true
    if (CONFIG.DEBUG) window.simulateAll = simulateAll;
  }

  // Los scripts van con defer, así que el DOM ya existe; el guard cubre cualquier cambio de orden
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
