export type Link = { t: string; u: string }
export type Song = {
  id: string; title: string; sort_title: string; lyrics_by: string[]; music_by: string[]; note: string
  musical_key: string; image_path: string | null; audio_path: string | null; lyrics: string; chords: string
  score_path: string | null; links: Link[]
}
export type Collection = { id: string; title: string; sort_title: string; note: string; image_path: string | null; links: Link[] }
export type CollectionSong = { collection_id: string; song_id: string; position: number }
export type Session = {
  id: string; title: string; starts_at: string; venue: string; city: string; kind: string; note: string
  link_label: string; link_url: string
}
export type About = { heading: string; tagline: string; body: string; image_path: string | null; donate_url: string }
export type Enquiry = {
  id: string; reason: string; name: string; email: string; message: string; details: Record<string, string>; created_at: string
}
