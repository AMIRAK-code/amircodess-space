// Cloudflare Pages Function: POST /api/order
// Receives an "Order a project" request and emails it to Amir via Brevo's transactional API.
//
// Required environment variables (Pages → Settings → Variables and Secrets, encrypted):
//   BREVO_API_KEY     Brevo API key (v3)
//   ORDER_TO_EMAIL    inbox that receives the requests
//   ORDER_FROM_EMAIL  a sender address verified in Brevo
// Optional:
//   ORDER_FROM_NAME   display name of the sender (default "Amir Codes Space")

const LIMITS = { name: 100, email: 200, company: 120, type: 60, budget: 60, timeline: 60, brief: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function clean(data) {
  const out = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const v = typeof data[key] === 'string' ? data[key].trim() : '';
    out[key] = v.slice(0, max);
  }
  return out;
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'Could not read the form.' }, 400);
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so bots move on.
  if (typeof data.website === 'string' && data.website.trim()) return json({ ok: true });

  const f = clean(data);
  if (!f.name) return json({ ok: false, error: 'Please tell me your name.' }, 400);
  if (!EMAIL_RE.test(f.email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (f.brief.length < 20) return json({ ok: false, error: 'Please describe the project in a few sentences (20+ characters).' }, 400);

  if (!env.BREVO_API_KEY || !env.ORDER_TO_EMAIL || !env.ORDER_FROM_EMAIL) {
    return json({ ok: false, error: 'The order form is not configured yet. Please try again later.' }, 503);
  }

  const rows = [
    ['Name', f.name],
    ['Email', f.email],
    ['Company', f.company],
    ['Project type', f.type],
    ['Budget', f.budget],
    ['Timeline', f.timeline],
  ].filter(([, v]) => v);

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nProject brief:\n${f.brief}\n`;
  const html =
    `<h2>New project request</h2><table cellpadding="4">` +
    rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('') +
    `</table><h3>Project brief</h3><p style="white-space:pre-wrap">${esc(f.brief)}</p>`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: env.ORDER_FROM_EMAIL, name: env.ORDER_FROM_NAME || 'Amir Codes Space' },
      to: [{ email: env.ORDER_TO_EMAIL }],
      replyTo: { email: f.email, name: f.name },
      subject: `New project request from ${f.name}${f.type ? ` (${f.type})` : ''}`,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    console.error('Brevo send failed', res.status, await res.text());
    return json({ ok: false, error: 'Sending failed. Please try again in a moment.' }, 502);
  }
  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed.' }, 405);
}
