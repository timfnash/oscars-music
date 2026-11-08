import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase, uploadMedia, mediaUrl } from '../lib/supabase'
import { ImagePick } from '../components/Bits'
import LinkEditor from '../components/LinkEditor'
import { names } from '../lib/util'
import type { Link as L } from '../lib/types'

export default function SongForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { songs, isAdmin, authReady, reload } = useData()
  const existing = songs.find((s) => s.id === id)
  const [f, setF] = useState({ title: '', lw: '', mw: '', note: '', key: '', lyrics: '', chords: '' })
  const [links, setLinks] = useState<L[]>([])
  const [img, setImg] = useState<File | null>(null)
  const [audio, setAudio] = useState<File | null>(null)
  const [score, setScore] = useState<File | null>(null)
  const [clear, setClear] = useState({ img: false, audio: false, score: false })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!existing) return
    setF({ title: existing.title, lw: existing.lyrics_by.join(', '), mw: existing.music_by.join(', '), note: existing.note,
      key: existing.musical_key, lyrics: existing.lyrics, chords: existing.chords })
    setLinks(existing.links)
  }, [existing?.id]) // eslint-disable-line

  if (!authReady) return <div className="empty">Loading…</div>
  if (!isAdmin) return <div className="empty">Please <Link to="/admin">sign in as an admin</Link> to edit songs.</div>

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const row: Record<string, unknown> = {
        title: f.title.trim(), lyrics_by: names(f.lw), music_by: names(f.mw), note: f.note.trim(), musical_key: f.key.trim(),
        lyrics: f.lyrics.trim(), chords: f.chords.replace(/\s+$/, ''), links,
      }
      if (img) row.image_path = await uploadMedia(img, 'images'); else if (clear.img) row.image_path = null
      if (audio) row.audio_path = await uploadMedia(audio, 'audio'); else if (clear.audio) row.audio_path = null
      if (score) row.score_path = await uploadMedia(score, 'scores'); else if (clear.score) row.score_path = null
      const q = existing ? supabase.from('songs').update(row).eq('id', existing.id).select('id').single()
                         : supabase.from('songs').insert(row).select('id').single()
      const { data, error } = await q
      if (error) throw error
      await reload(); nav(`/songs/${data!.id}`)
    } catch (ex: any) { setErr(ex.message || 'Could not save the song.'); setBusy(false) }
  }

  return (
    <>
      <Link className="back" to={existing ? `/songs/${existing.id}` : '/'}>← {existing ? 'Back to song' : 'All songs'}</Link>
      <h1 style={{ marginBottom: 20 }}>{existing ? 'Edit song' : 'Add a song'}</h1>
      <form className="f" onSubmit={submit}>
        <label>Title<input type="text" required value={f.title} onChange={set('title')} /></label>
        <div className="two">
          <label>Lyrics co-writers<input type="text" value={f.lw} onChange={set('lw')} placeholder="Names, separated by commas" /><span className="hint">Leave blank for an instrumental.</span></label>
          <label>Music co-writers<input type="text" value={f.mw} onChange={set('mw')} placeholder="Names, separated by commas" /></label>
        </div>
        <label>Key <span className="hint">Optional</span><input type="text" value={f.key} onChange={set('key')} placeholder="e.g. G major" /></label>
        <label>Note<textarea value={f.note} onChange={set('note')} placeholder="Background, performance tips, who it's for" /></label>
        <label>Square image <span className="hint">Optional. Cropped to a square automatically.</span>
          <ImagePick current={clear.img ? null : existing?.image_path ?? null} title={f.title} onPick={(x) => { setImg(x); setClear({ ...clear, img: false }) }}
            onClear={() => { setImg(null); setClear({ ...clear, img: true }) }} />
        </label>
        <label>Audio recording <span className="hint">Optional. MP3, M4A or WAV. {existing?.audio_path && !clear.audio && !audio ? 'A recording is already attached; choose a file to replace it.' : ''}</span>
          <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
          {existing?.audio_path && !clear.audio && <button type="button" className="btn small" style={{ justifySelf: 'start' }} onClick={() => { setAudio(null); setClear({ ...clear, audio: true }) }}>Remove recording</button>}
        </label>
        <div style={{ display: 'grid', gap: 4 }}><span style={{ fontWeight: 500 }}>Links to recordings <span className="hint" style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '.88rem' }}>Optional. YouTube, Spotify, Apple Music and so on.</span></span>
          <LinkEditor links={links} onChange={setLinks} /></div>
        <label>Lyrics<textarea style={{ minHeight: 200 }} value={f.lyrics} onChange={set('lyrics')} placeholder={'[Verse 1]\nFirst line…'} /><span className="hint">Put section names in [brackets].</span></label>
        <label>Chords <span className="hint">Paste a chord sheet with the chords on the line above each lyric line. Spacing is kept exactly.</span>
          <textarea style={{ minHeight: 200, fontFamily: 'var(--f-mono)' }} value={f.chords} onChange={set('chords')} /></label>
        <label>Score <span className="hint">Optional. PDF or image. {existing?.score_path && !clear.score && !score ? 'A score is already attached; choose a file to replace it.' : ''}</span>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setScore(e.target.files?.[0] ?? null)} />
          {existing?.score_path && !clear.score && <span className="small"><a href={mediaUrl(existing.score_path)!} target="_blank" rel="noreferrer">View current score</a> · <button type="button" className="btn small" onClick={() => { setScore(null); setClear({ ...clear, score: true }) }}>Remove score</button></span>}
        </label>
        {err && <div className="error" role="alert">{err}</div>}
        <div className="row-admin"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save song'}</button><Link className="btn" to={existing ? `/songs/${existing.id}` : '/'}>Cancel</Link></div>
      </form>
    </>
  )
}
