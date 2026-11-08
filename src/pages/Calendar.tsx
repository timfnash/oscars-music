import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase } from '../lib/supabase'
import { MONTHS, WEEKDAYS } from '../lib/util'
import type { Session } from '../lib/types'

const KINDS = ['Concert', 'Workshop', 'Session', 'Private event']
const blank = { title: '', date: '', time: '19:30', venue: '', city: '', kind: 'Concert', note: '', link_label: '', link_url: '' }
const pad = (n: number) => String(n).padStart(2, '0')

export default function Calendar() {
  const { sessions, isAdmin, reload, loading } = useData()
  const [f, setF] = useState(blank)
  const [editId, setEditId] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const upcoming = sessions.filter((s) => new Date(s.starts_at) >= startOfToday)
  const past = isAdmin ? sessions.filter((s) => new Date(s.starts_at) < startOfToday).reverse() : []

  const edit = (s: Session) => {
    const d = new Date(s.starts_at)
    setEditId(s.id)
    setF({ title: s.title, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      venue: s.venue, city: s.city, kind: s.kind, note: s.note, link_label: s.link_label, link_url: s.link_url })
    document.getElementById('session-form')?.scrollIntoView({ behavior: 'smooth' })
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    const row = { title: f.title.trim(), starts_at: new Date(`${f.date}T${f.time}`).toISOString(), venue: f.venue.trim(), city: f.city.trim(),
      kind: f.kind, note: f.note.trim(), link_url: f.link_url.trim(), link_label: f.link_label.trim() || (f.link_url.trim() ? 'More info' : '') }
    const { error } = editId ? await supabase.from('sessions').update(row).eq('id', editId) : await supabase.from('sessions').insert(row)
    setBusy(false)
    if (error) return setErr(error.message)
    setF(blank); setEditId(null); reload()
  }
  const remove = async (id: string) => { await supabase.from('sessions').delete().eq('id', id); reload() }

  const render = (list: Session[], dim = false) => {
    let cur = ''
    return list.map((s) => {
      const d = new Date(s.starts_at); const m = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; const head = m !== cur; cur = m
      return (
        <div key={s.id} style={dim ? { opacity: .6 } : undefined}>
          {head && <div className="letter">{m}</div>}
          <article className="event">
            <div className="date"><b>{d.getDate()}</b><span>{WEEKDAYS[d.getDay()]}</span></div>
            <div className="what">
              <div className="evtop"><h3>{s.title}</h3><span className="tag">{s.kind}</span></div>
              <div className="by">{pad(d.getHours())}:{pad(d.getMinutes())}{s.venue || s.city ? ' · ' : ''}{[s.venue, s.city].filter(Boolean).join(', ')}</div>
              {s.note && <div className="small" style={{ marginTop: 4 }}>{s.note}</div>}
            </div>
            <div className="acts">
              {s.link_url && <a className="btn small" href={s.link_url} target="_blank" rel="noopener noreferrer">{s.link_label || 'More info'} ↗</a>}
              {isAdmin && <><button className="btn small" onClick={() => edit(s)}>Edit</button><button className="btn small danger" onClick={() => remove(s.id)}>Remove</button></>}
            </div>
          </article>
        </div>
      )
    })
  }

  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  return (
    <>
      <div className="head">
        <div><h1>Calendar</h1><div className="muted">Where Oscar is leading live sessions</div></div>
        <Link className="btn primary" to="/contact?r=booking">Book Oscar</Link>
      </div>
      {loading ? <div className="empty">Loading…</div> : upcoming.length ? render(upcoming)
        : <div className="empty">No sessions are scheduled right now. Check back soon, or <Link to="/contact?r=booking">get in touch</Link> to arrange one.</div>}
      {past.length > 0 && <><h2 style={{ marginTop: 36 }}>Past sessions <span className="small muted">(only admins see these)</span></h2>{render(past, true)}</>}
      {isAdmin && (
        <form className="f box" id="session-form" style={{ marginTop: 32 }} onSubmit={submit}>
          <h3>{editId ? 'Edit session' : 'Add a session'}</h3>
          <label>Title<input type="text" required value={f.title} onChange={set('title')} /></label>
          <div className="two"><label>Date<input type="date" required value={f.date} onChange={set('date')} /></label><label>Start time<input type="time" required value={f.time} onChange={set('time')} /></label></div>
          <div className="two"><label>Venue<input type="text" value={f.venue} onChange={set('venue')} /></label><label>Town or city<input type="text" value={f.city} onChange={set('city')} /></label></div>
          <div className="two"><label>Type<select value={f.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label>Button text <span className="hint">e.g. Tickets, More info</span><input type="text" value={f.link_label} onChange={set('link_label')} /></label></div>
          <label>Booking or info link <span className="hint">Optional</span><input type="url" value={f.link_url} onChange={set('link_url')} placeholder="https://" /></label>
          <label>Note <span className="hint">Optional</span><input type="text" value={f.note} onChange={set('note')} /></label>
          {err && <div className="error" role="alert">{err}</div>}
          <div className="row-admin"><button className="btn primary" disabled={busy}>{editId ? 'Save changes' : 'Add to calendar'}</button>
            {editId && <button type="button" className="btn" onClick={() => { setEditId(null); setF(blank) }}>Cancel</button>}</div>
        </form>
      )}
    </>
  )
}
