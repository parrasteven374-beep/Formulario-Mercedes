// Pantalla "MATCH": aparece entre el test y el resultado.
// Secuencia sobria: el logo gira una vez, las letras entran una a una, las líneas de carretera corren
// y el carro se desliza hasta su sitio. Solo transform/opacity (Web Animations API).
// Se puede saltar con clic, Esc o Enter. Con reduced motion: fundido corto, sin movimiento.
(function () {
  const { play, cancel, duration, prefersReduced } = MB.motion;
  const $ = (id) => document.getElementById(id);

  let skipFlag = false;
  let wake = null;

  // Espera que se interrumpe al saltar
  const sleep = (ms) => new Promise((res) => {
    if (skipFlag) return res();
    const t = setTimeout(() => { wake = null; res(); }, ms);
    wake = () => { clearTimeout(t); wake = null; res(); };
  });

  function skip() {
    skipFlag = true;
    wake?.();
  }

  async function playMatch(car) {
    const root = $('match');
    const eyebrow = $('match-eyebrow');
    const letters = [...$('match-word').children];
    const sub = $('match-sub');
    const carWrap = $('match-car');
    const logo = $('match-logo');
    const reduced = prefersReduced();

    skipFlag = false;
    $('match-img').src = car.image;
    sub.replaceChildren(Object.assign(document.createElement('strong'), { textContent: car.name }));

    document.documentElement.classList.add('is-matching');
    root.hidden = false;
    root.focus({ preventScroll: true });

    play(root, [{ opacity: 0 }, { opacity: 1 }], { ms: reduced ? duration.medium() : 300 });

    if (reduced) {
      await sleep(1500);
      return;
    }

    // Todo parte oculto; cada elemento se revela en su momento
    const hidden = [logo, eyebrow, sub, carWrap, ...letters];
    hidden.forEach((el) => { el.style.opacity = '0'; });
    const reveal = (el, keyframes, opts) => { el.style.opacity = ''; return play(el, keyframes, opts); };

    root.classList.add('is-playing');
    await sleep(150);

    // 1) Letras escalonadas + antetítulo
    reveal(eyebrow, [{ opacity: 0 }, { opacity: 1 }], { ms: 600 });
    letters.forEach((l, i) =>
      reveal(l, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { ms: 800, delay: i * 90 })
    );

    // 2) Logo: aparece con un giro único y suave
    reveal(logo, [
      { opacity: 0, transform: 'rotate(-180deg) scale(0.85)' },
      { opacity: 1, transform: 'none' },
    ], { ms: 1100 });
    await sleep(750);

    // 3) El carro se desliza desde la izquierda y se asienta (sin rebote)
    reveal(carWrap, [
      { opacity: 1, transform: 'translateX(-115vw)' },
      { opacity: 1, transform: 'none' },
    ], { ms: 1600 });
    await sleep(1350);

    // 4) Nombre del modelo entre filetes
    reveal(sub, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { ms: 700 });
    await sleep(1500);
  }

  // Muestra la pantalla y resuelve cuando termina la secuencia (o al saltarla)
  function show(car) {
    return playMatch(car);
  }

  // Desvanece y retira la pantalla (ya con el resultado debajo)
  async function hide() {
    const root = $('match');
    if (root.hidden) return;
    await play(root, [{ opacity: 1 }, { opacity: 0 }], { ms: prefersReduced() ? duration.medium() : 600, fill: 'forwards' });
    cancel(root);
    root.hidden = true;
    root.classList.remove('is-playing');
    document.documentElement.classList.remove('is-matching');
    const parts = [$('match-logo'), $('match-eyebrow'), $('match-sub'), $('match-car'), ...$('match-word').children];
    parts.forEach((el) => { cancel(el); el.style.opacity = ''; });
  }

  function init() {
    const root = $('match');
    root.addEventListener('click', skip);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); }
    });
  }

  MB.match = { init, show, hide };
})();
