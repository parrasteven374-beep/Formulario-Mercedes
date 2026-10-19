// Helpers de movimiento (Web Animations API). Solo transform y opacity.
(function () {
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = () => reducedQuery.matches;

  const rootStyle = getComputedStyle(document.documentElement);
  const readToken = (name) => parseFloat(rootStyle.getPropertyValue(name)) || 0;
  const EASE = rootStyle.getPropertyValue('--ease-out').trim() || 'cubic-bezier(0.22, 1, 0.36, 1)';

  // Duraciones desde los tokens CSS: una sola fuente de verdad
  const duration = {
    fast: () => readToken('--motion-fast') || 160,
    medium: () => readToken('--motion-medium') || 280,
    slow: () => readToken('--motion-slow') || 500,
    car: () => readToken('--motion-car') || 1500,
    car: () => readToken('--motion-car') || 1500,
    exit: (ms) => Math.round(ms * (readToken('--motion-exit-ratio') || 0.65)),
  };

  const running = new WeakMap();

  // Reproduce una animación; si había otra en curso sobre el elemento, la cancela (interrumpible).
  // La promesa SIEMPRE resuelve (también si se cancela), para no romper flujos.
  function play(el, keyframes, { ms, delay = 0, fill = 'backwards' } = {}) {
    running.get(el)?.cancel();
    const anim = el.animate(keyframes, { duration: ms, delay, easing: EASE, fill });
    running.set(el, anim);
    return anim.finished.then(() => undefined, () => undefined);
  }

  // Cancela y devuelve el elemento a su estado CSS por defecto (el final)
  function cancel(el) {
    running.get(el)?.cancel();
    running.delete(el);
  }

  // Entrada: desde un desplazamiento con opacity. Reduced motion: solo fundido.
  function enter(el, { x = 0, y = 0, ms = duration.medium(), delay = 0 } = {}) {
    const from = prefersReduced() || (!x && !y)
      ? { opacity: 0 }
      : { opacity: 0, transform: `translate(${x || 0}, ${y || 0})` };
    return play(el, [from, { opacity: 1, transform: 'none' }], { ms, delay });
  }

  // Salida: más corta, también ease-out. Queda en el estado final hasta que se cancele/reemplace.
  function leave(el, { x = 0, ms = duration.exit(duration.medium()) } = {}) {
    const to = prefersReduced() || !x
      ? { opacity: 0 }
      : { opacity: 0, transform: `translateX(${x})` };
    return play(el, [{ opacity: 1, transform: 'none' }, to], { ms, fill: 'forwards' });
  }

  window.MB = window.MB || {};
  MB.motion = { prefersReduced, duration, play, cancel, enter, leave };
})();
