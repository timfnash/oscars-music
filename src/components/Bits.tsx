import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mediaUrl } from '../lib/supabase'
import { fmt, highlight } from '../lib/util'
import type { Link } from '../lib/types'

export function Cover({ title, path, className = '' }: { title: string; path: string | null; className?: string }) {
  const url = mediaUrl(path)
  return (
    <div className={`cover ${url ? 'has' : ''} ${className}`} aria-hidden="true">
      {url ? <img src={url} alt="" loading="lazy" /> : title[0]?.toUpperCase()}
    </div>
  )
}

export function Hl({ text, q }: { text: string; q: string }): ReactNode {
  const h = highlight(text, q)
  if (typeof h === 'string') return h
  return <>{h[0]}<mark>{h[1].m}</mark>{h[2]}</>
}

export function Links({ links, label, onRemove }: { links: Link[]; label: string; onRemove?: (i: number) => void }) {
  if (!links.length) return null
  return (
    <div className="links">
      <span className="label">{label}</span>
      {links.map((l, i) => (
        <span className="lk" key={i}>
          <a className="chip" href={l.u} target="_blank" rel="noopener noreferrer">{l.t} ↗</a>
          {onRemove && <button className="x" aria-label={`Remove ${l.t} link`} onClick={() => onRemove(i)}>×</button>}
        </span>
      ))}
    </div>
  )
}

/** Streaming-only audio player: custom controls, no download button. */
export function AudioPlayer({ path }: { path: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(0)
  useEffect(() => { setPlaying(false); setPos(0); setDur(0) }, [path])
  const a = ref.current
  const toggle = () => { if (!a) return; a.paused ? a.play() : a.pause() }
  return (
    <div className="player" onContextMenu={(e) => e.preventDefault()}>
      <audio ref={ref} src={mediaUrl(path)!} preload="metadata" controlsList="nodownload"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
      <button className="play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing
          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M4 2h3.5v14H4zM10.5 2H14v14h-3.5z" /></svg>
          : <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M4 2l12 7-12 7z" /></svg>}
      </button>
      <div className="track">
        <input type="range" min={0} max={dur || 0} step={1} value={Math.min(pos, dur || 0)} aria-label="Seek"
          onChange={(e) => { if (a) a.currentTime = +e.target.value }} />
        <div className="time"><span>{fmt(pos)}</span><span>{dur ? fmt(dur) : '–:––'}</span></div>
      </div>
    </div>
  )
}

/** Square image / file picker with preview. */
export function ImagePick({ current, title, onPick, onClear }: {
  current: string | null; title: string; onPick: (f: File) => void; onClear?: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const src = preview || mediaUrl(current)
  return (
    <span className="drop">
      <span className={`cover ${src ? 'has' : ''}`} style={{ width: 56 }}>{src ? <img src={src} alt="" /> : (title[0] || '?').toUpperCase()}</span>
      <input type="file" accept="image/*" onChange={(e) => {
        const f = e.target.files?.[0]; if (!f) return
        setPreview(URL.createObjectURL(f)); onPick(f)
      }} />
      {(src && onClear) && <button type="button" className="btn small" onClick={() => { setPreview(null); onClear() }}>Remove image</button>}
    </span>
  )
}
