import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase } from '../lib/supabase'

const REASONS: [string, string, string][] = [
  ['booking', 'Book Oscar', 'Concerts, workshops, services, private events.'],
  ['play', 'Play or record together', 'Share a song idea or offer to collaborate.'],
  ['donate', 'Donate', 'Support the music with a gift.'],
  ['message', 'Send a message', 'Say hello, ask a question, share feedback.'],
]
const AMOUNTS = [10, 25, 50, 100]

export default function Contact() {
  const [params, setParams] = useSearchParams()
  const { about } = useData()
  const r = REASONS.some(([k]) => k === params.get('r')) ? params.get('r')! : 'message'
  const [d, setD] = useState<Record<string, string>>({})
  const [amount, setAmount] = useState(25)
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [err, setErr] = useState('')
  const donateUrl = about?.donate_url
  const set = (k: string) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('sending'); setErr('')
    const { name = '', email = '', message = '', website = '', ...details } = d
    if (r === 'donate') details.amount = `£${amount}`
    const { error } = await supabase.functions.invoke('contact', { body: { reason: r, name, email, message, website, details } })
    if (error) { setErr('Sorry, that did not send. Please check your details and try again.'); setState('idle'); return }
    setState('sent')
  }

  const f = (id: string, label: string, type = 'text', req = false, ph = '') =>
    <label>{label}<input type={type} value={d[id] || ''} onChange={set(id)} required={req} placeholder={ph} /></label>

  return (
    <>
      <div className="head"><div><h1>Contact Oscar</h1><div className="muted">Choose what you'd like to do.</div></div></div>
      <div className="reasons" role="radiogroup" aria-label="Reason for contact">
        {REASONS.map(([k, n, desc]) => (
          <button key={k} className="reason" role="radio" aria-checked={k === r} onClick={() => { setParams({ r: k }, { replace: true }); setState('idle') }}>
            <b>{n}</b><span className="small muted">{desc}</span>
          </button>
        ))}
      </div>
      {state === 'sent' ? (
        <div className="note"><h3>Thank you</h3><p style={{ margin: '6px 0 0' }}>Your message has been sent to Oscar. He will reply to {d.email}.</p></div>
      ) : (
        <>
          {r === 'donate' && (
            <div className="box" style={{ marginBottom: 24, maxWidth: 660 }}>
              <h3>Give to the music</h3>
              {donateUrl
                ? <><p style={{ margin: 0 }}>Donations go through a secure payment page. This site never sees or stores card details.</p>
                    <div><a className="btn primary" href={donateUrl} target="_blank" rel="noopener noreferrer">Donate ↗</a></div></>
                : <p style={{ margin: 0 }}>Online donations are being set up. Leave your details below and Oscar will get in touch with how to give.</p>}
            </div>
          )}
          {(r !== 'donate' || !donateUrl) && (
            <form className="f" onSubmit={submit}>
              <div className="two">{f('name', 'Your name', 'text', true)}{f('email', 'Email address', 'email', true)}</div>
              {r === 'booking' && <>
                <div className="two">{f('Event date', 'Event date', 'date')}{f('Venue and town', 'Venue and town', 'text', false, 'e.g. Village hall, Wells')}</div>
                <label>Type of event<select value={d['Type of event'] || 'Concert'} onChange={set('Type of event')}>
                  {['Concert', 'Workshop or singing day', 'Wedding or celebration', 'Church or community service', 'Something else'].map((x) => <option key={x}>{x}</option>)}</select></label></>}
              {r === 'play' && <>
                {f('What you play or sing', 'What do you play or sing?', 'text', false, 'e.g. cello, harmony vocals')}
                {f('Link to your music', 'Link to your music', 'url', false, 'https://')}
                <label>What would you like to do together?<select value={d['Together'] || 'Play live'} onChange={set('Together')}>
                  {['Play live', 'Record a track', 'Write together', 'Not sure yet'].map((x) => <option key={x}>{x}</option>)}</select></label></>}
              {r === 'donate' && <div><div className="label" style={{ marginBottom: 6 }}>Amount you have in mind</div>
                <div className="amts">{AMOUNTS.map((n) => <button type="button" className="chip" key={n} aria-pressed={amount === n} onClick={() => setAmount(n)}>£{n}</button>)}</div></div>}
              <label>{{ booking: 'Tell us more', play: 'Tell us about your idea', donate: 'Add a message for Oscar (optional)', message: 'Your message' }[r]}
                <textarea value={d.message || ''} onChange={set('message')} required={r === 'message'} /></label>
              <div className="hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={d.website || ''} onChange={set('website')} /></label></div>
              {err && <div className="error" role="alert">{err}</div>}
              <div><button className="btn primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : { booking: 'Send booking enquiry', play: 'Send my idea', donate: 'Let Oscar know', message: 'Send message' }[r]}</button></div>
            </form>
          )}
        </>
      )}
    </>
  )
}
