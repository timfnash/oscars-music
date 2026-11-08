import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
export const configured = Boolean(url && key)

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const mediaUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from('media').getPublicUrl(path).data.publicUrl : null

/** Centre-crop an image to a square and shrink it to 900px, so covers stay light. */
async function squareImage(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const side = Math.min(bmp.width, bmp.height)
    const out = Math.min(900, side)
    const c = document.createElement('canvas'); c.width = c.height = out
    c.getContext('2d')!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out)
    const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej()), 'image/jpeg', 0.86))
    return new File([blob], 'cover.jpg', { type: 'image/jpeg' })
  } catch { return file }
}

/** Upload a file to the public media bucket and return its storage path. */
export async function uploadMedia(file: File, folder: 'images' | 'audio' | 'scores'): Promise<string> {
  if (folder === 'images') file = await squareImage(file)
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type || undefined })
  if (error) throw error
  return path
}
