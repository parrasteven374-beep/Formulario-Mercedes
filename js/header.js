(function () {
  const { enter, leave, cancel, duration } = MB.motion;

  const btn = document.getElementById('menu-btn');
  const panel = document.getElementById('site-menu');
  const backdropTargets = () => document.querySelectorAll('[data-screen]');
  let isOpen = false;
  let savedScroll = 0;
  let token = 0;

  const focusables = () => [btn, ...panel.querySelectorAll('a[href], button:not([disabled])')];

  function lockScroll() {
    savedScroll = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScroll}px`;
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScroll);
  }
  function setBackgroundInert(on) {
    backdropTargets().forEach((el) => {
      el.inert = on;
      if (on) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden');
    });
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    token++;
    lockScroll();
    setBackgroundInert(true);
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    enter(panel, { x: '-24px', ms: duration.medium() });
    panel.querySelector('a, button').focus({ preventScroll: true });
  }

  // Cierre: 65 % de la entrada. Interrumpible: si se vuelve a abrir mientras cierra, gana la apertura.
  async function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    const mine = ++token;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    await leave(panel, { x: '-24px', ms: duration.exit(duration.medium()) });
    if (mine !== token) return;
    cancel(panel);
    panel.hidden = true;
    setBackgroundInert(false);
    unlockScroll();
    if (restoreFocus) btn.focus({ preventScroll: true });
  }

  function init({ onHome, onStart }) {
    btn.addEventListener('click', () => (isOpen ? close() : open()));

    // El logo lleva siempre al inicio (cierra el menú si está abierto)
    document.getElementById('brand-home').addEventListener('click', async (e) => {
      e.preventDefault();
      await close({ restoreFocus: false });
      onHome();
    });

    panel.addEventListener('click', async (e) => {
      const item = e.target.closest('[data-menu]');
      if (!item) return;
      const kind = item.dataset.menu;
      if (kind === 'privacy') {
        // TODO(cliente): reemplazar el href="#" por la URL oficial de la política de privacidad
        if (item.getAttribute('href') === '#') e.preventDefault();
        await close();
        return;
      }
      await close({ restoreFocus: false });
      if (kind === 'home') onHome();
      if (kind === 'start') onStart();
    });

    // Navegación de escritorio: el enlace "Inicio" (el CTA y la privacidad ya los enlaza app.js)
    document.querySelectorAll('[data-nav="home"]').forEach((a) =>
      a.addEventListener('click', (e) => { e.preventDefault(); onHome(); })
    );

    // Si se ensancha la ventana a escritorio con el menú móvil abierto, se cierra
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
      if (e.matches) close({ restoreFocus: false });
    });

    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  MB.header = { init, close };
})();
