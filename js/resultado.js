(function () {
const { CARS, TEXTS } = MB.config;
const { enter, duration, prefersReduced } = MB.motion;

const $ = (id) => document.getElementById(id);

function renderResult({ winnerId }) {
  const car = CARS[winnerId];
  const img = $('result-img');
  img.src = car.image;
  img.alt = `Mercedes-Benz ${car.name}`;
  $('result-name').textContent = car.name;
  $('result-tagline').textContent = car.tagline;
  $('result-affinity').textContent = TEXTS.affinityLabel;
  $('result-desc').textContent = car.description;
  $('result-features').replaceChildren(
    ...car.features.map((text) => Object.assign(document.createElement('li'), { textContent: text }))
  );
}

// Una sola coreografía de entrada, con jerarquía: imagen → nombre → descripción/características → formulario.
// Con reduced motion todo aparece a la vez con un fundido.
function playResultIntro() {
  const root = $('screen-resultado');
  const steps = [1, 2, 3, 4].map((n) => [...root.querySelectorAll(`[data-step="${n}"]`)]);
  const reduced = prefersReduced();
  const ms = duration.slow();
  const delays = [0, 160, 320, 480];

  steps.forEach((els, i) => {
    els.forEach((el) => {
      const isStudio = el.classList.contains('studio');
      enter(el, {
        x: isStudio ? '-12%' : 0,   // el carro mira a la derecha: entra desde la izquierda
        y: !isStudio && !reduced && i > 0 ? '8px' : 0,
        ms,
        delay: reduced ? 0 : delays[i],
      });
    });
  });
}

MB.resultado = { renderResult, playResultIntro };
})();
