import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/store'
import { Cover, Hl } from '../components/Bits'
import { byTitle, credits, sortKey } from '../lib/util'

export default function Songs() {
  const { songs, loading, error, isAdmin } = useData()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return byTitle(songs).filter((x) => !s || [x.title, ...x.lyrics_by, ...x.music_by].some((n) => n.toLowerCase().includes(s)))
  }, [songs, q])
  const have = new Set(list.map((s) => sortKey(s.title)))
  let cur = ''
  return (
    <>
      <div className="head">
        <div><h1>Songs</h1><div className="muted">{loading ? 'Loading…' : q ? `${list.length} of ${songs.length} songs match` : `${songs.length} songs, A to Z`}</div></div>
        <div className="search"><input type="search" aria-label="Search by title or co-writer" placeholder="Search by title or co-writer" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {isAdmin && <Link className="btn primary" to="/songs/new">+ Add song</Link>}
      </div>
      {error && <div className="empty error">{error}</div>}
      {!error && !loading && !songs.length && (
        <div className="empty">No songs yet.{isAdmin ? ' Use “Add song” to add the first one.' : ' Check back soon.'}</div>
      )}
      {!error && songs.length > 0 && !list.length && <div className="empty">No songs match “{q}”. Try a title or a co-writer's name.</div>}
      {list.length > 0 && (
        <div className="list-wrap">
          <div>
            {list.map((s) => {
              const L = sortKey(s.title); const head = L !== cur; cur = L
              return (
                <div key={s.id}>
                  {head && <div className="letter" id={`L${L}`}>{L}</div>}
                  <Link className="row" to={`/songs/${s.id}`}>
                    <Cover title={s.title} path={s.image_path} />
                    <div className="meta">
                      <div className="title"><Hl text={s.title} q={q.trim()} /></div>
                      <div className="by"><Hl text={credits(s.lyrics_by, s.music_by) || 'No credits'} q={q.trim()} /></div>
                    </div>
                    <div className="tags">
                      {s.audio_path && <span className="tag">Audio</span>}
                      {s.lyrics && <span className="tag">Lyrics</span>}
                      {s.chords && <span className="tag">Chords</span>}
                      {s.score_path && <span className="tag">Score</span>}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
          <div className="az" aria-label="Jump to letter">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
              <a key={l} href={`#L${l}`} className={have.has(l) ? '' : 'off'}
                onClick={(e) => { e.preventDefault(); document.getElementById(`L${l}`)?.scrollIntoView({ behavior: 'smooth' }) }}>{l}</a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
