import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase } from '../lib/supabase'
import type { Enquiry, Song } from '../lib/types'

/** Lists every co-writer name in use, with rename (fixes or merges spellings) and remove (takes the name off every song). */
function Cowriters({ songs, reload }: { songs: Song[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const map = new Map<string, Set<string>>()
  for (const s of songs) for (const n of [...s.lyrics_by, ...s.music_by]) (map.get(n) ?? map.set(n, new Set()).get(n)!).add(s.id)
  const names = [...map.keys()].sort((a, b) => a.localeCompare(b))

  const apply = async (name: string, fn: (arr: string[]) => string[]) => {
    setBusy(true); setErr('')
    const dedupe = (a: string[]) => a.filter((n, i) => a.findIndex((m) => m.toLowerCase() === n.toLowerCase()) === i)
    const results = await Promise.all(songs.filter((s) => s.lyrics_by.includes(name) || s.music_by.includes(name)).map((s) =>
      supabase.from('songs').update({ lyrics_by: dedupe(fn(s.lyrics_by)), music_by: dedupe(fn(s.music_by)) }).eq('id', s.id)))
    const bad = results.find((r) => r.error)
    if (bad?.error) setErr(bad.error.message)
    await reload(); setBusy(false); setEditing(null); setConfirm(null)
  }
  const rename = (old: string) => {
    const next = text.trim().replace(/\s+/g, ' ')
    if (!next || next === old) return setEditing(null)
    const known = names.find((n) => n.toLowerCase() === next.toLowerCase() && n !== old) || next
    apply(old, (arr) => arr.map((n) => (n === old ? known : n)))
  }

  return (
    <section>
      <h2 style={{ marginBottom: 6 }}>Co-writers</h2>
      <p className="muted small" style={{ margin: '0 0 12px' }}>Every name used on a song. Rename fixes a spelling on every song at once, and merges two spellings if you rename one to match the other. Remove takes the name off every song it is on.</p>
      {err && <div className="error" role="alert">{err}</div>}
      {names.length === 0 ? <div className="muted">No co-writers yet. Names appear here once they are added to a song.</div> : (
        <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Name</th><th>Songs</th><th /></tr></thead><tbody>
          {names.map((n) => (
            <tr key={n}>
              <td>{editing === n
                ? <input className="inp" style={{ maxWidth: 260 }} aria-label={`New spelling for ${n}`} value={text} autoFocus onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') rename(n); if (e.key === 'Escape') setEditing(null) }} />
                : n}</td>
              <td>{map.get(n)!.size}</td>
              <td>
                {editing === n ? (
                  <span className="row-admin"><button className="btn small primary" disabled={busy} onClick={() => rename(n)}>Save</button><button className="btn small" onClick={() => setEditing(null)}>Cancel</button></span>
                ) : confirm === n ? (
                  <span className="row-admin"><span className="small">Remove from {map.get(n)!.size} song{map.get(n)!.size === 1 ? '' : 's'}?</span>
                    <button className="btn small danger" disabled={busy} onClick={() => apply(n, (arr) => arr.filter((x) => x !== n))}>Yes, remove</button>
                    <button className="btn small" onClick={() => setConfirm(null)}>Keep</button></span>
                ) : (
                  <span className="row-admin"><button className="btn small" onClick={() => { setEditing(n); setText(n); setConfirm(null) }}>Rename</button>
                    <button className="btn small danger" onClick={() => { setConfirm(n); setEditing(null) }}>Remove</button></span>
                )}
              </td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </section>
  )
}

export default function Admin() {
  const { auth, isAdmin, authReady, songs, reload } = useData()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [enq, setEnq] = useState<Enquiry[]>([])
  const [npw, setNpw] = useState(''); const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('enquiries').select('*').order('created_at', { ascending: false }).then(({ data }) => setEnq((data as Enquiry[]) || []))
  }, [isAdmin])

  const signIn = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
    setBusy(false); if (error) setErr('Email or password not recognised.')
  }
  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: npw })
    setPwMsg(error ? error.message : 'Password changed.'); if (!error) setNpw('')
  }
  const removeEnq = async (id: string) => { await supabase.from('enquiries').delete().eq('id', id); setEnq(enq.filter((x) => x.id !== id)) }

  if (!authReady) return <div className="empty">Loading…</div>
  if (!auth) return (
    <>
      <h1 style={{ marginBottom: 18 }}>Admin sign in</h1>
      <form className="f" style={{ maxWidth: 380 }} onSubmit={signIn}>
        <label>Email address<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {err && <div className="error" role="alert">{err}</div>}
        <div><button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></div>
      </form>
    </>
  )
  if (!isAdmin) return (
    <><h1>Not an admin</h1><p>You are signed in as {auth.user.email}, which is not on the admin list.</p>
      <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button></>
  )
  return (
    <div style={{ display: 'grid', gap: 36 }}>
      <div><h1>Admin</h1><p className="muted">Signed in as {auth.user.email}. You can add and edit songs, collections, calendar sessions and the About page from their own pages.</p>
        <div className="row-admin"><Link className="btn small" to="/songs/new">+ Add song</Link><Link className="btn small" to="/collections">Collections</Link><Link className="btn small" to="/calendar">Calendar</Link><Link className="btn small" to="/about">About page</Link></div></div>
      <section>
        <h2 style={{ marginBottom: 12 }}>Enquiries</h2>
        {enq.length === 0 ? <div className="muted">No enquiries yet. Messages from the Contact page appear here and are also emailed to Oscar.</div> : (
          <div style={{ overflowX: 'auto' }}><table><thead><tr><th>When</th><th>Type</th><th>From</th><th>Details</th><th /></tr></thead><tbody>
            {enq.map((x) => (
              <tr key={x.id}><td className="small">{new Date(x.created_at).toLocaleString()}</td><td>{x.reason}</td>
                <td>{x.name}<div className="small"><a href={`mailto:${x.email}`}>{x.email}</a></div></td>
                <td className="small">{Object.entries(x.details).map(([k, v]) => <div key={k}><b>{k}:</b> {String(v)}</div>)}<div style={{ whiteSpace: 'pre-wrap' }}>{x.message}</div></td>
                <td><button className="btn small danger" onClick={() => removeEnq(x.id)}>Delete</button></td></tr>
            ))}</tbody></table></div>
        )}
      </section>
      <Cowriters songs={songs} reload={reload} />
      <section>
        <h2 style={{ marginBottom: 12 }}>Change password</h2>
        <form className="f" style={{ maxWidth: 380 }} onSubmit={changePw}>
          <label>New password <span className="hint">At least 8 characters</span><input type="password" minLength={8} required autoComplete="new-password" value={npw} onChange={(e) => setNpw(e.target.value)} /></label>
          {pwMsg && <div className="small" role="status">{pwMsg}</div>}
          <div><button className="btn">Change password</button></div>
        </form>
      </section>
    </div>
  )
}
