// Receives the Contact form, stores the enquiry, and emails Oscar through Resend.
// Secrets: RESEND_API_KEY, CONTACT_TO (default oscar@nash.je), CONTACT_FROM (default Resend's test sender).
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const LABELS: Record<string, string> = {
  booking: 'Booking enquiry', play: 'Play or record together', donate: 'Donation interest', message: 'Message',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }

  if (body.website) return json({ ok: true }) // honeypot: bots fill hidden fields
  const reason = String(body.reason || 'message')
  const name = String(body.name || '').slice(0, 200).trim()
  const email = String(body.email || '').slice(0, 200).trim()
  const message = String(body.message || '').slice(0, 5000).trim()
  const details = typeof body.details === 'object' && body.details ? body.details : {}
  if (!LABELS[reason]) return json({ error: 'Unknown reason' }, 400)
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Please give your name and a valid email address.' }, 400)
  if (!message && reason === 'message') return json({ error: 'Please write a message.' }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { error: dbErr } = await db.from('enquiries').insert({ reason, name, email, message, details })
  if (dbErr) return json({ error: 'Could not save your message. Please try again.' }, 500)

  const key = Deno.env.get('RESEND_API_KEY')
  let emailed = false
  if (key) {
    const rows = Object.entries(details).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(String(v))}</td></tr>`).join('')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('CONTACT_FROM') || "Oscar's Music <onboarding@resend.dev>",
        to: [Deno.env.get('CONTACT_TO') || 'oscar@nash.je'],
        reply_to: email,
        subject: `${LABELS[reason]} from ${name}`,
        html: `<p><b>${esc(LABELS[reason])}</b> from ${esc(name)} (${esc(email)})</p><table cellpadding="4">${rows}</table><p style="white-space:pre-wrap">${esc(message)}</p>`,
      }),
    })
    emailed = res.ok
    if (!res.ok) console.error('Resend error', res.status, await res.text())
  }
  // The enquiry is stored either way, so nothing is lost if email fails.
  return json({ ok: true, emailed })
})
