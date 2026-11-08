import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session as AuthSession } from '@supabase/supabase-js'
import { supabase, configured } from './supabase'
import type { About, Collection, CollectionSong, Session, Song } from './types'

type Data = {
  songs: Song[]; collections: Collection[]; collectionSongs: CollectionSong[]; sessions: Session[]; about: About | null
  loading: boolean; error: string | null; reload: () => Promise<void>
  auth: AuthSession | null; isAdmin: boolean; authReady: boolean
}
const Ctx = createContext<Data>(null as unknown as Data)
export const useData = () => useContext(Ctx)

export function DataProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionSongs, setCS] = useState<CollectionSong[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [about, setAbout] = useState<About | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auth, setAuth] = useState<AuthSession | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  const reload = useCallback(async () => {
    if (!configured) { setLoading(false); setError('The site is not connected to its database yet.'); return }
    const [s, c, cs, ev, ab] = await Promise.all([
      supabase.from('songs').select('*'),
      supabase.from('collections').select('*'),
      supabase.from('collection_songs').select('*').order('position'),
      supabase.from('sessions').select('*').order('starts_at'),
      supabase.from('about_page').select('*').eq('id', 1).maybeSingle(),
    ])
    const err = s.error || c.error || cs.error || ev.error || ab.error
    if (err) setError(err.message)
    else setError(null)
    setSongs((s.data as Song[]) || [])
    setCollections((c.data as Collection[]) || [])
    setCS((cs.data as CollectionSong[]) || [])
    setSessions((ev.data as Session[]) || [])
    setAbout((ab.data as About) || null)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (!configured) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setAuth(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuth(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!auth) { setIsAdmin(false); return }
    // Only admins can read the admins table, so a row coming back means this user is an admin.
    supabase.from('admins').select('email').limit(1).then(({ data }) => setIsAdmin(Boolean(data && data.length)))
  }, [auth])

  const value = useMemo(
    () => ({ songs, collections, collectionSongs, sessions, about, loading, error, reload, auth, isAdmin, authReady }),
    [songs, collections, collectionSongs, sessions, about, loading, error, reload, auth, isAdmin, authReady],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
