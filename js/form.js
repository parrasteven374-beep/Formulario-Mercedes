(function () {
const { TEXTS } = MB.config;
const { enter, duration } = MB.motion;

const form = document.getElementById('lead-form');
const submitBtn = document.getElementById('lead-submit');
const statusEl = document.getElementById('lead-status');
const doneEl = document.getElementById('lead-done');

const fields = {
  name: document.getElementById('f-name'),
  phone: document.getElementById('f-phone'),
  email: document.getElementById('f-email'),
  consent: document.getElementById('f-consent'),
};
const errorEl = (key) => document.getElementById(`e-${key}`);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validators = {
  name: (v) => (v.trim().length >= 3 ? '' : TEXTS.errors.name),
  phone: (v) => (/^[+\d][\d\s\-().]*$/.test(v.trim()) && v.replace(/\D/g, '').length >= 8 ? '' : TEXTS.errors.phone),
  email: (v) => (!v.trim() ? TEXTS.errors.emailEmpty : EMAIL_RE.test(v.trim()) ? '' : TEXTS.errors.emailInvalid),
  consent: (_v, el) => (el.checked ? '' : TEXTS.errors.consent),
};

function setError(key, message) {
  errorEl(key).textContent = message;
  fields[key].setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateField(key) {
  const message = validators[key](fields[key].value, fields[key]);
  setError(key, message);
  return !message;
}

// TODO(cliente/backend): conectar aquí el endpoint o servicio de correo (fetch POST del payload como JSON).
// Debe lanzar un error si el envío falla; la UI muestra el mensaje de error y deja reintentar.
async function sendLead(payload) {
  console.info('[sendLead] envío simulado. Payload:', payload);
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true };
}

let getContext = () => ({});

function initForm(contextGetter) {
  getContext = contextGetter;

  // Validación al salir del campo; al corregir, el error desaparece de inmediato
  Object.keys(fields).forEach((key) => {
    const evt = key === 'consent' ? 'change' : 'blur';
    fields[key].addEventListener(evt, () => validateField(key));
    fields[key].addEventListener('input', () => {
      if (fields[key].getAttribute('aria-invalid') === 'true') validateField(key);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = Object.keys(fields).map((k) => [k, validateField(k)]);
    const firstInvalid = results.find(([, ok]) => !ok);
    if (firstInvalid) { fields[firstInvalid[0]].focus(); return; }

    setLoading(true);
    try {
      const { answers, winner, affinity } = getContext();
      await sendLead({
        user: {
          name: fields.name.value.trim(),
          phone: fields.phone.value.trim(),
          email: fields.email.value.trim(),
          consent: fields.consent.checked,
        },
        answers,
        winner,
        affinity,
      });
      showDone();
    } catch (err) {
      console.error(err);
      statusEl.textContent = TEXTS.sendError;
    } finally {
      setLoading(false);
    }
  });
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.setAttribute('aria-busy', String(on));
  submitBtn.textContent = on ? TEXTS.submit.loading : TEXTS.submit.idle;
  if (on) statusEl.textContent = '';
}

function showDone() {
  document.getElementById('lead-done-text').textContent = TEXTS.success;
  form.hidden = true;
  doneEl.hidden = false;
  doneEl.tabIndex = -1;
  enter(doneEl, { y: '8px', ms: duration.medium() });
  doneEl.focus({ preventScroll: true });
}

function resetForm() {
  form.reset();
  form.hidden = false;
  doneEl.hidden = true;
  statusEl.textContent = '';
  setLoading(false);
  Object.keys(fields).forEach((k) => setError(k, ''));
  Object.values(fields).forEach((el) => el.removeAttribute('aria-invalid'));
}

MB.form = { sendLead, initForm, resetForm };
})();
