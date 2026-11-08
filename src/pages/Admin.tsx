import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase } from '../lib/supabase'
import type { Enquiry } from '../lib/types'

export default function Admin() {
  const { auth, isAdmin, authReady } = useData()
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
