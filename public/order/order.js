// "Order a project" form: validates in the browser, then POSTs to the /api/order Pages Function.
const form = document.getElementById('order-form');
const errorEl = document.getElementById('form-error');
const done = document.getElementById('order-done');
const submit = form.querySelector('.submit');
const brief = form.elements.brief;
const count = document.getElementById('brief-count');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(msg, field) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
  for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

function validate(data) {
  if (!data.name.trim()) return ['Please tell me your name.', form.elements.name];
  if (!EMAIL_RE.test(data.email.trim())) return ['Please enter a valid email address.', form.elements.email];
  if (data.brief.trim().length < 20) return ['Please describe the project in a few sentences (20+ characters).', brief];
  return null;
}

brief.addEventListener('input', () => { count.textContent = brief.value.length; });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const problem = validate(data);
  if (problem) return showError(...problem);

  errorEl.hidden = true;
  submit.disabled = true;
  submit.textContent = 'Sending…';
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) throw new Error(body.error || 'Sending failed. Please try again in a moment.');
    form.hidden = true;
    done.hidden = false;
    done.focus();
  } catch (err) {
    showError(err.message || 'Sending failed. Please try again in a moment.');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Send request';
  }
});
