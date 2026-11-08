import { useId, useState } from 'react'

/** Co-writer picker: chips for chosen names, with suggestions from names already used on other songs. */
export default function NamesInput({ value, onChange, suggestions, placeholder }: {
  value: string[]; onChange: (v: string[]) => void; suggestions: string[]; placeholder?: string
}) {
  const [text, setText] = useState('')
  const listId = useId()
  const add = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (!name) return
    // Reuse the existing spelling when the name matches one already in use.
    const known = suggestions.find((s) => s.toLowerCase() === name.toLowerCase()) || name
    if (!value.some((v) => v.toLowerCase() === known.toLowerCase())) onChange([...value, known])
    setText('')
  }
  const options = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {value.length > 0 && (
        <div className="links">
          {value.map((n) => (
            <span className="lk chip" key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              {n}
              <button type="button" className="x" aria-label={`Remove ${n}`} onClick={() => onChange(value.filter((v) => v !== n))}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="row-admin">
        <input className="inp" style={{ flex: 1, minWidth: 160, width: 'auto' }} type="text" list={listId} value={text} placeholder={placeholder}
          autoComplete="off" aria-label={placeholder}
          onChange={(e) => {
            const v = e.target.value
            // Picking a suggestion from the list adds it straight away; plain typing does not.
            const it = (e.nativeEvent as InputEvent).inputType
            if (v && options.includes(v) && (it === undefined || it === 'insertReplacementText')) add(v); else setText(v)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text) } }}
          onBlur={() => add(text)} />
        <button type="button" className="btn small" onClick={() => add(text)}>Add</button>
      </div>
      <datalist id={listId}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </div>
  )
}
