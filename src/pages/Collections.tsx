import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../lib/store'
import { supabase } from '../lib/supabase'
import { Cover, Hl } from '../components/Bits'
import { byTitle } from '../lib/util'

export default function Collections() {
  const { collections, collectionSongs, isAdmin, loading, reload } = useData()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const list = byTitle(collections).filter((c) => !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase()))
  const create = async () => {
    const { data } = await supabase.from('collections').insert({ title: 'New collection' }).select('id').single()
    await reload(); if (data) nav(`/collections/${data.id}`)
  }
  return (
    <>
      <div className="head">
        <div><h1>Collections</h1><div className="muted">{loading ? 'Loading…' : `${collections.length} collections, A to Z`}</div></div>
        <div className="search"><input type="search" aria-label="Search collections" placeholder="Search collections" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {isAdmin && <button className="btn primary" onClick={create}>+ New collection</button>}
      </div>
      {!loading && !collections.length && <div className="empty">No collections yet.</div>}
      {collections.length > 0 && !list.length && <div className="empty">No collections match “{q}”.</div>}
      <div className="grid">
        {list.map((c) => {
          const n = collectionSongs.filter((l) => l.collection_id === c.id).length
          return (
            <Link className="card" key={c.id} to={`/collections/${c.id}`}>
              <Cover title={c.title} path={c.image_path} />
              <div><div className="title"><Hl text={c.title} q={q.trim()} /></div><div className="small muted">{n} song{n === 1 ? '' : 's'}</div></div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
