import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase, uploadMedia, mediaUrl } from '../lib/supabase'
import { ImagePick } from '../components/Bits'

export default function About() {
  const { about, isAdmin, reload, loading } = useData()
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({ heading: '', tagline: '', body: '', donate_url: '' })
  const [img, setImg] = useState<File | null>(null); const [clearImg, setClearImg] = useState(false)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  useEffect(() => { if (about) setF({ heading: about.heading, tagline: about.tagline, body: about.body, donate_url: about.donate_url }) }, [about, editing])
  if (!about) return <div className="empty">{loading ? 'Loading…' : 'The About page is not available yet.'}</div>
  const img_ = mediaUrl(about.image_path)

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const row: Record<string, unknown> = { ...f, heading: f.heading.trim() || about.heading, donate_url: f.donate_url.trim() }
      if (img) row.image_path = await uploadMedia(img, 'images'); else if (clearImg) row.image_path = null
      const { error } = await supabase.from('about_page').update(row).eq('id', 1)
      if (error) throw error
      await reload(); setEditing(false); setImg(null); setClearImg(false)
    } catch (ex: any) { setErr(ex.message) } finally { setBusy(false) }
  }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="about">
      <div className="head" style={{ margin: 0 }}>
        <div><h1>{about.heading}</h1>{about.tagline && <p className="muted" style={{ margin: '8px 0 0' }}>{about.tagline}</p>}</div>
        {isAdmin && <button className="btn" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit this page'}</button>}
      </div>
      {isAdmin && editing && (
        <form className="f box" onSubmit={save}>
          <h3>Edit About page</h3>
          <label>Page heading<input type="text" value={f.heading} onChange={set('heading')} /></label>
          <label>Short line under the heading<input type="text" value={f.tagline} onChange={set('tagline')} /></label>
          <label>Photo <span className="hint">Optional. Shown as a square.</span>
            <ImagePick current={clearImg ? null : about.image_path} title="ON" onPick={(x) => { setImg(x); setClearImg(false) }} onClear={() => { setImg(null); setClearImg(true) }} /></label>
          <label>Text <span className="hint">Leave a blank line between paragraphs.</span><textarea style={{ minHeight: 240 }} value={f.body} onChange={set('body')} /></label>
          <label>Donation link <span className="hint">Optional. A PayPal, Stripe or other payment page. Shown on the Contact page.</span>
            <input type="url" value={f.donate_url} onChange={set('donate_url')} placeholder="https://" /></label>
          {err && <div className="error" role="alert">{err}</div>}
          <div className="row-admin"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      )}
      <div className="about-grid">
        <div className="portrait">{img_ ? <img src={img_} alt="Oscar Nash" /> : 'ON'}</div>
        <div className="prose">{about.body.split(/\n\s*\n/).filter((p) => p.trim()).map((p, i) => <p key={i}>{p.trim()}</p>)}</div>
      </div>
      <div className="cols">
        <div className="box"><h3>Listen and learn</h3><p className="small" style={{ margin: 0 }}>Stream any song here, read the lyrics, and follow the chords or score. Songs are for listening and singing, not for download.</p><div><Link className="btn small" to="/">Browse songs</Link></div></div>
        <div className="box"><h3>Come to a session</h3><p className="small" style={{ margin: 0 }}>See where Oscar will be leading music next.</p><div><Link className="btn small" to="/calendar">View calendar</Link></div></div>
        <div className="box"><h3>Get in touch</h3><p className="small" style={{ margin: 0 }}>Book Oscar, offer to play together, make a donation or send a message.</p><div className="row-admin"><Link className="btn small" to="/contact?r=booking">Book Oscar</Link><Link className="btn small" to="/contact">Contact</Link></div></div>
      </div>
    </div>
  )
}
