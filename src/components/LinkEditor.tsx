import { useState } from 'react'
import type { Link } from '../lib/types'
import { LINK_TYPES } from '../lib/util'

/** Editable list of recording links (YouTube, Spotify, Apple Music and so on). */
export default function LinkEditor({ links, onChange }: { links: Link[]; onChange: (l: Link[]) => void }) {
  const [t, setT] = useState(LINK_TYPES[0])
  const [u, setU] = useState('')
  const add = () => {
    const url = u.trim()
    if (!/^https?:\/\//i.test(url)) return
    onChange([...links, { t, u: url }]); setU('')
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {links.map((l, i) => (
        <div className="row-admin" key={i}>
          <span className="chip">{l.t}</span>
          <span className="small muted" style={{ overflowWrap: 'anywhere', flex: 1, minWidth: 0 }}>{l.u}</span>
          <button type="button" className="btn small" onClick={() => onChange(links.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <div className="row-admin">
        <select className="inp" style={{ width: 'auto' }} aria-label="Link type" value={t} onChange={(e) => setT(e.target.value)}>
          {LINK_TYPES.map((x) => <option key={x}>{x}</option>)}
        </select>
        <input className="inp" style={{ flex: 1, minWidth: 180, width: 'auto' }} type="url" aria-label="Link address" placeholder="https://…"
          value={u} onChange={(e) => setU(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" className="btn small" onClick={add}>Add link</button>
      </div>
    </div>
  )
}
