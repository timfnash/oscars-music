import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase, uploadMedia } from '../lib/supabase'
import { Cover, ImagePick, Links } from '../components/Bits'
import LinkEditor from '../components/LinkEditor'
import { byTitle, credits } from '../lib/util'
import type { Link as L } from '../lib/types'

export default function Collection() {
  const { id } = useParams()
  const nav = useNavigate()
  const { collections, collectionSongs, songs, isAdmin, reload, loading } = useData()
  const c = collections.find((x) => x.id === id)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(''); const [note, setNote] = useState(''); const [links, setLinks] = useState<L[]>([])
  const [img, setImg] = useState<File | null>(null); const [clearImg, setClearImg] = useState(false)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const [pick, setPick] = useState(''); const [confirmDel, setConfirmDel] = useState(false)
  useEffect(() => { if (c) { setTitle(c.title); setNote(c.note); setLinks(c.links) } }, [c?.id, editing]) // eslint-disable-line

  if (!c) return <div className="empty">{loading ? 'Loading…' : 'That collection could not be found.'} <div><Link to="/collections">All collections</Link></div></div>
  const rows = collectionSongs.filter((l) => l.collection_id === c.id).sort((a, b) => a.position - b.position)
  const items = rows.map((r) => songs.find((s) => s.id === r.song_id)!).filter(Boolean)
  const addable = byTitle(songs).filter((s) => !items.includes(s))

  const saveOrder = async (ids: string[]) => {
    await Promise.all(ids.map((sid, i) => supabase.from('collection_songs').update({ position: i }).eq('collection_id', c.id).eq('song_id', sid)))
    reload()
  }
  const move = (i: number, d: number) => { const ids = items.map((s) => s.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; saveOrder(ids) }
  const remove = async (sid: string) => {
    await supabase.from('collection_songs').delete().eq('collection_id', c.id).eq('song_id', sid)
    await saveOrder(items.filter((s) => s.id !== sid).map((s) => s.id))
  }
  const add = async () => {
    const sid = pick || addable[0]?.id; if (!sid) return
    await supabase.from('collection_songs').insert({ collection_id: c.id, song_id: sid, position: items.length }); setPick(''); reload()
  }
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const row: Record<string, unknown> = { title: title.trim() || c.title, note: note.trim(), links }
      if (img) row.image_path = await uploadMedia(img, 'images'); else if (clearImg) row.image_path = null
      const { error } = await supabase.from('collections').update(row).eq('id', c.id)
      if (error) throw error
      await reload(); setEditing(false); setImg(null); setClearImg(false)
    } catch (ex: any) { setErr(ex.message) } finally { setBusy(false) }
  }
  const del = async () => { await supabase.from('collections').delete().eq('id', c.id); await reload(); nav('/collections') }
  const total = items.length

  return (
    <>
      <Link className="back" to="/collections">← All collections</Link>
      <div className="detail-head">
        <Cover title={c.title} path={c.image_path} />
        <div className="info">
          <h1>{c.title}</h1>
          <div className="muted">{total} song{total === 1 ? '' : 's'}</div>
          {c.note ? <div className="note">{c.note}</div> : <div className="muted small">No note for this collection.</div>}
          <Links links={c.links} label="Watch and listen" />
          {isAdmin && (
            <div className="row-admin">
              <button className="btn small" onClick={() => setEditing(!editing)}>{editing ? 'Close editor' : 'Edit details'}</button>
              {confirmDel
                ? <><span className="small">Delete this collection? Songs stay.</span><button className="btn small danger" onClick={del}>Yes, delete</button><button className="btn small" onClick={() => setConfirmDel(false)}>Keep</button></>
                : <button className="btn small danger" onClick={() => setConfirmDel(true)}>Delete collection</button>}
            </div>
          )}
        </div>
      </div>

      {isAdmin && editing && (
        <form className="f box" style={{ marginBottom: 28 }} onSubmit={save}>
          <h3>Edit collection</h3>
          <label>Title<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <label>Square image <span className="hint">Optional</span>
            <ImagePick current={clearImg ? null : c.image_path} title={title} onPick={(f) => { setImg(f); setClearImg(false) }} onClear={() => { setImg(null); setClearImg(true) }} /></label>
          <div style={{ display: 'grid', gap: 4 }}><span style={{ fontWeight: 500 }}>Recording links <span className="small muted" style={{ fontWeight: 400 }}>For example a whole live session on YouTube.</span></span>
            <LinkEditor links={links} onChange={setLinks} /></div>
          {err && <div className="error" role="alert">{err}</div>}
          <div className="row-admin"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
      )}

      {items.length ? (
        <ol className="tracks">
          {items.map((s, i) => (
            <li key={s.id}>
              <span className="n">{i + 1}</span>
              <Cover title={s.title} path={s.image_path} />
              <Link className="go" to={`/songs/${s.id}`}><div style={{ fontWeight: 600 }}>{s.title}</div><div className="small muted">{credits(s.lyrics_by, s.music_by)}</div></Link>
              {isAdmin && (
                <span className="ctl">
                  <button className="ib" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button className="ib" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button className="ib" aria-label="Remove from collection" onClick={() => remove(s.id)}>×</button>
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : <div className="empty">This collection has no songs yet.</div>}
      {isAdmin && addable.length > 0 && (
        <div className="row-admin" style={{ marginTop: 18 }}>
          <select className="inp" style={{ width: 'auto' }} aria-label="Add a song" value={pick || addable[0].id} onChange={(e) => setPick(e.target.value)}>
            {addable.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <button className="btn" onClick={add}>Add to collection</button>
        </div>
      )}
    </>
  )
}
