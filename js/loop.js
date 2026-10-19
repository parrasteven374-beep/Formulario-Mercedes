(function () {
  const { CARS } = MB.config;
  const { enter, leave, cancel, duration, prefersReduced } = MB.motion;

  const SLOT_MS = 3000;       // debe coincidir con --loop-t (loop.css)
  const NAME_LEAD = 0.5;      // el nombre cambia cuando el siguiente carro ya está más cerca del centro que el actual
  const list = Object.values(CARS);

  let screen, imgs, nameEl, modelEl;
  let timer = 0;
  let shown = -1;
  let t0 = 0;

  // Pasarela del hero: las imágenes y el nombre salen de la configuración (nada de datos en el HTML)
  function init() {
    screen = document.getElementById('screen-inicio');
    nameEl = document.getElementById('loop-name');
    modelEl = document.getElementById('loop-model');

    imgs = list.map((car, i) => {
      const img = document.createElement('img');
      img.className = 'loop__car';
      img.src = car.image;
      img.width = 300;
      img.height = 150;
      img.alt = `Mercedes-Benz ${car.name} visto de lado`;
      img.style.setProperty('--i', i);
      return img;
    });
    document.getElementById('loop-stage').append(...imgs);
  }

  const writeName = (i) => {
    modelEl.textContent = list[i].name;
    shown = i;
  };

  // Cambio de nombre con fundido corto (opacity). Si llega otro cambio mientras tanto, gana el último.
  function setName(i, { instant = false } = {}) {
    if (i === shown) return;
    if (instant) { cancel(nameEl); writeName(i); return; }
    shown = i; // reserva el turno
    leave(nameEl, { ms: duration.fast() }).then(() => {
      if (shown !== i) return;
      writeName(i);
      enter(nameEl, { ms: duration.fast() });
    });
  }

  const stop = () => { clearTimeout(timer); timer = 0; };

  // Movimiento normal: la animación CSS manda. El carro i está al frente en t = i · SLOT_MS dentro de un ciclo
  // de n · SLOT_MS; se lee el reloj real de la animación para que el nombre nunca se desfase.
  function tickMotion() {
    if (screen.hidden) return stop();
    const anim = imgs[0].getAnimations()[0];
    const cycle = SLOT_MS * list.length;
    const elapsed = anim ? Number(anim.currentTime) % cycle : (performance.now() - t0) % cycle;
    const slot = Math.floor((elapsed + NAME_LEAD * SLOT_MS) / SLOT_MS);
    setName(slot % list.length);
    const wait = (slot + 1) * SLOT_MS - NAME_LEAD * SLOT_MS - elapsed;
    timer = setTimeout(tickMotion, Math.max(60, wait));
  }

  // Reduced motion: sin órbita; un carro a la vez que cambia con fundido (CSS) cada SLOT_MS
  function tickStatic(i) {
    if (screen.hidden) return stop();
    imgs.forEach((img, k) => img.classList.toggle('is-active', k === i));
    setName(i);
    timer = setTimeout(() => tickStatic((i + 1) % list.length), SLOT_MS);
  }

  // Arranca el ciclo de cero; se llama al cargar y cada vez que se vuelve al Inicio
  // (el CSS reinicia la animación al salir de display:none)
  function start() {
    stop();
    t0 = performance.now();
    shown = -1;
    setName(0, { instant: true });
    if (prefersReduced()) {
      imgs.forEach((img) => img.classList.remove('is-active'));
      tickStatic(0);
    } else {
      timer = setTimeout(tickMotion, SLOT_MS * (1 - NAME_LEAD));
    }
  }

  MB.loop = { init, start };
})();
