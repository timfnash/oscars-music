import type { Link } from './types'

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
export const sortKey = (t: string) => (t.replace(/^(the|an?) /i, '')[0] || '#').toUpperCase()
export const byTitle = <T extends { sort_title: string }>(a: T[]) =>
  [...a].sort((x, y) => x.sort_title.localeCompare(y.sort_title, undefined, { sensitivity: 'base' }))
export const names = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)
export const credits = (lw: string[], mw: string[]) =>
  [lw.length ? 'Words: ' + lw.join(', ') : '', mw.length ? 'Music: ' + mw.join(', ') : ''].filter(Boolean).join(' · ')
export const cleanLinks = (ls: Link[]) => ls.filter((l) => /^https?:\/\//i.test(l.u))
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export const LINK_TYPES = ['YouTube', 'Spotify', 'Apple Music', 'Video', 'Other']

export function highlight(text: string, q: string) {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  return [text.slice(0, i), { m: text.slice(i, i + q.length) }, text.slice(i + q.length)] as const
}
