(function () {
  // Al recargar siempre se arranca arriba del todo (sin restaurar el scroll a mitad de la historia)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.addEventListener('pageshow', (e) => { if (e.persisted) window.scrollTo(0, 0); });

  const { play, enter, leave, cancel, duration, prefersReduced } = MB.motion;
  let introPlayed = false;

  // Entrada orquestada, una sola vez: eyebrow → titular → texto.
  // El estado de reposo (CSS) es el final: si el JS falla, todo se ve.
  // El titular (candidato a LCP) solo se desplaza, nunca parte de opacity:0.
  function playIntro() {
    if (introPlayed) return;
    introPlayed = true;
    if (prefersReduced()) return; // sin movimiento: contenido ya visible
    const [eyebrow, title, text] = document.querySelectorAll('.hero [data-seq]');
    const ms = duration.slow();
    enter(eyebrow, { ms });
    play(title, [{ transform: 'translateY(10px)' }, { transform: 'none' }], { ms });
    enter(text, { y: '10px', ms, delay: 90 });
  }

  // Se resuelve cuando termina la entrada de la pasarela; el indicador de scroll espera a este momento
  let resolveCarArrived;
  const carArrived = new Promise((resolve) => { resolveCarArrived = resolve; });

  // Si se navega a otra pantalla en mitad de la animación, la pasarela queda en su posición final.
  function settleLoop() {
    cancel(document.getElementById('loop'));
  }

  // La pasarela aparece una sola vez (fundido + desplazamiento corto) al entrar al viewport.
  // Sin observer queda visible tal cual. Al terminar se libera al indicador de scroll (carArrived).
  function initLoop() {
    const loop = document.getElementById('loop');
    if (!('IntersectionObserver' in window)) { resolveCarArrived(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      enter(loop, { y: '16px', ms: duration.slow() }).then(resolveCarArrived);
    }, { threshold: 0.3 });
    observer.observe(loop);
  }

  // Historia de modelos: un panel por carro con foto, nombre, precio y datos (MB.config.CARS).
  // Cada elemento se despliega una sola vez y espera su propio tramo de scroll. Todo con IntersectionObserver
  // (sin listeners de scroll). Sin observer los paneles quedan visibles (el CSS solo los oculta con .is-armed).
  //  - Con pin (viewport alto): el contenido queda fijo (sticky) y marcas invisibles repartidas por el panel
  //    marcan cuándo toca cada elemento.
  //  - Sin pin (viewport bajo): cada elemento se observa por separado mientras entra en pantalla.
  const PIN_QUERY = '(max-width: 1023px) and (min-height: 760px), (min-width: 1024px) and (min-height: 640px)';
  // Tramo de scroll (en pantallas útiles) tras el cual aparece cada paso; 0 = borde superior del panel bajo el header
  const STEP_START = { car: -0.45, title: -0.05, price: 0.12, specs: 0.27, specGap: 0.15 };
  // Móvil: el mismo recorrido pero comprimido (menos scroll entre dato y dato, paneles más cortos; ver inicio.css)
  const DESKTOP_MQ = '(min-width: 1024px)';
  // Margen superior enorme del observer: lo que ya quedó por encima del viewport también cuenta como "alcanzado"
  const PASSED_MARGIN = '100000px';
  const stepFor = (start, mobile) => (!mobile || start < -0.3 ? start : -0.15 + (start + 0.05) * 0.58);

  function initShowcase() {
    const story = document.getElementById('showcase');
    const cars = Object.values(MB.config.CARS);
    const total = String(cars.length).padStart(2, '0');

    const el = (tag, className, text, attrs) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      if (attrs) Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      return node;
    };

    // Cada panel devuelve sus "pasos": grupos de elementos que aparecen juntos, en orden de scroll
    const buildPanel = (car, index) => {
      const panel = el('article', 'model-panel', null, { 'aria-labelledby': `model-${car.id}-name` });
      const stage = el('div', 'model-panel__stage');
      const inner = el('div', 'container model-panel__inner');
      const steps = [];
      const mark = (start, ...nodes) => {
        nodes.forEach((n) => { if (!n.hasAttribute('data-reveal')) n.setAttribute('data-reveal', ''); });
        steps.push({ start, nodes });
      };

      // Foto: entra desde el lado contrario al texto (--dir) y la pista de luz se abre desde el centro
      const media = el('div', 'model-panel__media');
      const carWrap = el('div', null, null, { 'data-reveal': 'car', style: `--dir:${index % 2 === 0 ? -1 : 1}` });
      const drift = el('div', 'model-panel__drift');
      drift.append(el('img', 'model-panel__img', null, {
        src: car.image, width: 300, height: 170, loading: 'lazy', alt: `Mercedes-Benz ${car.name} visto de lado`,
      }));
      carWrap.append(drift);
      const track = el('div', 'model-panel__track', null, { 'data-reveal': 'line', 'aria-hidden': 'true' });
      media.append(carWrap, track);
      mark(STEP_START.car, carWrap, track);

      const body = el('div', 'model-panel__body');
      const eyebrow = el('p', 'model-panel__eyebrow');
      eyebrow.append(el('span', 'model-panel__count', `${String(index + 1).padStart(2, '0')} / ${total}`), ` · ${car.tagline}`);
      const name = el('h2', 'model-panel__name', car.name, { id: `model-${car.id}-name` });
      const price = el('p', 'model-panel__price', car.price);
      body.append(eyebrow, name, price);
      mark(STEP_START.title, eyebrow, name);
      mark(STEP_START.price, price);

      let next = STEP_START.specs;
      if (car.specs?.length) {
        const list = el('dl', 'model-panel__specs');
        car.specs.forEach((spec) => {
          const item = el('div', 'model-spec');
          // dt antes que dd en el DOM (lectores de pantalla); el CSS invierte el orden visual: valor grande arriba
          item.append(el('dt', 'model-spec__label', spec.label), el('dd', 'model-spec__value', spec.value));
          list.append(item);
          mark(next, item);
          next += STEP_START.specGap;
        });
        body.append(list);
      }
      if (car.note) {
        const note = el('p', 'model-panel__note', car.note);
        body.append(note);
        mark(next, note);
      }

      inner.append(media, body);
      stage.append(inner);
      panel.append(stage);
      return { panel, steps };
    };

    const built = cars.map(buildPanel);
    story.replaceChildren(...built.map((b) => b.panel));
    if (!('IntersectionObserver' in window)) return;

    story.classList.add('is-armed');
    const pinMq = window.matchMedia(PIN_QUERY);
    const desktopMq = window.matchMedia(DESKTOP_MQ);
    let observer;

    const setup = () => {
      observer?.disconnect();
      story.querySelectorAll('.model-panel__step').forEach((m) => m.remove());
      const pinned = pinMq.matches;
      const mobile = !desktopMq.matches;
      story.classList.toggle('is-pinned', pinned);

      const groups = new Map(); // elemento observado -> nodos a desplegar
      built.forEach(({ panel, steps }) => {
        steps.forEach(({ start, nodes }) => {
          if (nodes.every((n) => n.classList.contains('is-in'))) return;
          if (pinned) {
            const marker = el('i', 'model-panel__step', null, { 'aria-hidden': 'true', style: `--s:${stepFor(start, mobile)}` });
            panel.append(marker);
            groups.set(marker, nodes);
          } else {
            groups.set(nodes[0], nodes);
          }
        });
      });

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          groups.get(entry.target).forEach((n) => n.classList.add('is-in'));
        });
      }, pinned ? { rootMargin: `${PASSED_MARGIN} 0px 0px 0px` } : { threshold: 0.5, rootMargin: `${PASSED_MARGIN} 0px -12% 0px` });
      groups.forEach((_, target) => observer.observe(target));
    };

    setup();
    pinMq.addEventListener?.('change', setup);
    desktopMq.addEventListener?.('change', setup);

    // Un panel con todo desplegado ya no necesita sus ~2 pantallas de recorrido: cuando queda completamente por
    // encima del viewport se contrae a una pantalla y se compensa el scroll (el contenido visible no se mueve).
    // Así volver hacia arriba no obliga a recorrer de nuevo tramos sin animaciones. Se evalúa solo al parar el scroll.
    const compact = () => {
      if (!story.classList.contains('is-pinned')) return;
      built.forEach(({ panel, steps }) => {
        if (panel.classList.contains('is-collapsed')) return;
        if (!steps.every((st) => st.nodes.every((n) => n.classList.contains('is-in')))) return;
        const before = panel.getBoundingClientRect();
        if (before.bottom > 0) return; // todavía en pantalla o por delante
        panel.classList.add('is-collapsed');
        window.scrollBy(0, panel.getBoundingClientRect().height - before.height);
      });
    };
    let compactTimer;
    const scheduleCompact = () => { clearTimeout(compactTimer); compactTimer = setTimeout(compact, 180); };
    if ('onscrollend' in window) window.addEventListener('scrollend', scheduleCompact, { passive: true });
    else window.addEventListener('scroll', scheduleCompact, { passive: true });
  }

  // Indicador "scroll para descubrir". Estado base del CSS = visible; aquí solo se programa su aparición
  // (fundido 800 ms después de que aparezca la pasarela) y su salida (scroll o vitrina a la vista, una sola vez).
  const HINT_DELAY = 800;
  const HINT_FAILSAFE = 5000; // si la pasarela nunca aparece (p. ej. no entra al viewport), se muestra igual

  function initScrollHint() {
    const hint = document.getElementById('scroll-hint');
    const sentinel = document.getElementById('scroll-hint-sentinel');
    const showcase = document.getElementById('showcase');
    const home = document.getElementById('screen-inicio');
    if (!hint || !sentinel || !showcase || !home) return;

    // Sin IntersectionObserver no hay forma fiable de saber cuándo ocultarlo: queda estático y visible.
    const canObserve = 'IntersectionObserver' in window;
    let revealed = !canObserve;
    let dismissed = false;
    let observer;
    let timer;
    let failsafe;

    const reveal = () => {
      if (revealed || dismissed) return;
      revealed = true;
      clearTimeout(timer);
      clearTimeout(failsafe);
      if (!prefersReduced()) hint.classList.add('is-running'); // arranca las 3 pasadas del punto
      play(hint, [{ opacity: 0 }, { opacity: 1 }], { ms: duration.medium() });
      hint.style.opacity = ''; // quita el ocultamiento inicial; play() ya lo mantiene en 0 hasta que empiece
    };

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timer);
      clearTimeout(failsafe);
      observer?.disconnect();
      if (!revealed) { hint.hidden = true; return; } // nunca llegó a verse: sin fundido
      leave(hint, { ms: duration.fast() }).then(() => { hint.hidden = true; });
    };

    hint.addEventListener('click', () => {
      dismiss();
      showcase.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
      showcase.focus({ preventScroll: true }); // el foco sigue al destino sin provocar otro salto
    });

    if (!canObserve) return;

    // Oculto hasta su momento (solo desde JS; si algo falla, el failsafe lo revela)
    hint.style.opacity = '0';
    carArrived.then(() => { timer = setTimeout(reveal, HINT_DELAY); });
    failsafe = setTimeout(reveal, HINT_FAILSAFE);

    // Un único observer: el centinela sale por arriba = empezó el scroll; la vitrina entra = ya la ven.
    // Con la pantalla Inicio oculta (test/resultado) todo reporta "fuera": se ignora.
    observer = new IntersectionObserver((entries) => {
      if (home.hidden) return;
      const triggered = entries.some((e) => (e.target === sentinel ? !e.isIntersecting : e.isIntersecting));
      if (triggered) dismiss();
    }, { rootMargin: '0px 0px -10% 0px' });
    observer.observe(sentinel);
    observer.observe(showcase);
  }

  initScrollHint();

  // Botón "Subir": aparece cuando ya se pasó más de la mitad del hero y lleva arriba al instante.
  // Se controla con un IntersectionObserver sobre el hero (sin listeners de scroll).
  function initToTop() {
    const btn = document.getElementById('to-top');
    const hero = document.querySelector('.hero');
    const home = document.getElementById('screen-inicio');
    if (!btn || !hero || !home) return;

    let raf = 0; // subida en curso: mientras dura, el botón no reaparece
    const setVisible = (on) => btn.classList.toggle('is-visible', on);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (raf) return;
        const e = entries[entries.length - 1];
        setVisible(!home.hidden && e.intersectionRatio < 0.5);
      }, { threshold: [0, 0.5, 1] }).observe(hero);
    }

    // Subida rápida con la misma duración sin importar la distancia (~0,7 s, ease-out): arranca veloz y frena al llegar.
    // Interrumpible: si la persona toca, gira la rueda o pulsa una tecla durante la subida, se cancela al instante.
    // Con reduced motion salta directo.
    const RISE_MS = 700;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const stopRise = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.removeEventListener(ev, stopRise));
    };

    btn.addEventListener('click', () => {
      setVisible(false);
      const from = window.scrollY;
      const done = () => home.focus({ preventScroll: true });
      if (prefersReduced() || from < 4) { window.scrollTo(0, 0); done(); return; }

      stopRise();
      ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, stopRise, { passive: true }));
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / RISE_MS);
        window.scrollTo(0, Math.round(from * (1 - easeOut(t))));
        if (t < 1) { raf = requestAnimationFrame(step); return; }
        stopRise();
        done();
      };
      raf = requestAnimationFrame(step);
    });
  }

  initToTop();

  MB.inicio = { playIntro, initLoop, initShowcase, settleLoop };
})();
