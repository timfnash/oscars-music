import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase, mediaUrl } from '../lib/supabase'
import { AudioPlayer, Cover, Links } from '../components/Bits'
import { byTitle, credits } from '../lib/util'

type Tab = 'lyrics' | 'chords' | 'score'

export default function Song() {
  const { id } = useParams()
  const nav = useNavigate()
  const { songs, collections, collectionSongs, isAdmin, reload, loading } = useData()
  const [tab, setTab] = useState<Tab>('lyrics')
  const [pick, setPick] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const s = songs.find((x) => x.id === id)
  if (!s) return <div className="empty">{loading ? 'Loading…' : 'That song could not be found.'} <div><Link to="/">All songs</Link></div></div>

  const inCols = collections.filter((c) => collectionSongs.some((l) => l.collection_id === c.id && l.song_id === s.id))
  const addable = byTitle(collections).filter((c) => !inCols.includes(c))
  const scoreUrl = mediaUrl(s.score_path)
  const isPdf = s.score_path?.toLowerCase().endsWith('.pdf')

  const addToCollection = async () => {
    const cid = pick || addable[0]?.id; if (!cid) return
    const pos = collectionSongs.filter((l) => l.collection_id === cid).length
    await supabase.from('collection_songs').insert({ collection_id: cid, song_id: s.id, position: pos })
    setPick(''); reload()
  }
  const del = async () => { await supabase.from('songs').delete().eq('id', s.id); await reload(); nav('/') }

  return (
    <>
      <Link className="back" to="/">← All songs</Link>
      <div className="detail-head">
        <Cover title={s.title} path={s.image_path} />
        <div className="info">
          <h1>{s.title}</h1>
          <dl className="credits">
            <dt>Lyrics by</dt><dd>{s.lyrics_by.join(', ') || '—'}</dd>
            <dt>Music by</dt><dd>{s.music_by.join(', ') || '—'}</dd>
            {s.musical_key && <><dt>Key</dt><dd>{s.musical_key}</dd></>}
            {inCols.length > 0 && <><dt>Collections</dt><dd>{inCols.map((c, i) => <span key={c.id}>{i > 0 && ', '}<Link to={`/collections/${c.id}`}>{c.title}</Link></span>)}</dd></>}
          </dl>
          {s.note && <div className="note">{s.note}</div>}
          <Links links={s.links} label="Also on" />
          {isAdmin && (
            <>
              <div className="row-admin">
                <Link className="btn small" to={`/songs/${s.id}/edit`}>Edit song</Link>
                {confirmDel
                  ? <><span className="small">Delete “{s.title}” for good?</span><button className="btn small danger" onClick={del}>Yes, delete</button><button className="btn small" onClick={() => setConfirmDel(false)}>Keep</button></>
                  : <button className="btn small danger" onClick={() => setConfirmDel(true)}>Delete song</button>}
              </div>
              {addable.length > 0 && (
                <div className="row-admin">
                  <select className="inp" style={{ width: 'auto' }} aria-label="Add to a collection" value={pick || addable[0].id} onChange={(e) => setPick(e.target.value)}>
                    {addable.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button className="btn small" onClick={addToCollection}>Add to collection</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {s.audio_path ? <AudioPlayer path={s.audio_path} /> : <div className="player off">No recording yet.</div>}

      <div className="tabs" role="tablist">
        {(['lyrics', 'chords', 'score'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'lyrics' && (s.lyrics
        ? <div className="lyrics">{s.lyrics.split(/(\[[^\]]+\])/).map((p, i) => /^\[[^\]]+\]$/.test(p) ? <span className="sec" key={i}>{p.slice(1, -1)}</span> : p)}</div>
        : <div className="placeholder">No lyrics added yet.</div>)}
      {tab === 'chords' && (s.chords ? <pre className="chords">{s.chords}</pre> : <div className="placeholder">No chords added yet.</div>)}
      {tab === 'score' && (scoreUrl
        ? <div className="scorebox" onContextMenu={(e) => e.preventDefault()}>
            {isPdf ? <iframe src={`${scoreUrl}#toolbar=0&navpanes=0`} title={`Score for ${s.title}`} /> : <img src={scoreUrl} alt={`Score for ${s.title}`} />}
          </div>
        : <div className="placeholder">No score uploaded yet.</div>)}
      <p className="small muted" style={{ marginTop: 24 }}>{credits(s.lyrics_by, s.music_by)}</p>
    </>
  )
}
