import { createClient } from '@supabase/supabase-js'
import { products as mockProducts } from './mockData'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const USE_MOCK = !SUPABASE_URL || !SUPABASE_KEY

export const supabase = USE_MOCK ? null : createClient(SUPABASE_URL, SUPABASE_KEY)

export async function getProducts() {
  if (USE_MOCK) return mockProducts
  const { data, error } = await supabase.from('products').select('*').order('name')
  if (error) throw error
  return data
}

export async function getProductById(id) {
  if (USE_MOCK) return mockProducts.find((p) => p.id === id) ?? null
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createProduct(product) {
  const { error } = await supabase.from('products').insert([product])
  if (error) throw error
}

export async function updateProduct(id, product) {
  const { error } = await supabase.from('products').update(product).eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id, imageUrl, imageUrls = [], stlUrl = null) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error

  const allUrls = [...new Set([imageUrl, ...imageUrls].filter(Boolean))]
  await deleteProductImages(allUrls)
  if (stlUrl) await deleteSTLFile(stlUrl)
}

export async function deleteProductImages(urls = []) {
  if (!supabase) return
  const filenames = urls
    .filter(u => u && u.includes('/storage/v1/object/public/produtos/'))
    .map(u => u.split('/storage/v1/object/public/produtos/')[1])
    .filter(Boolean)
  if (filenames.length > 0) {
    await supabase.storage.from('produtos').remove(filenames)
  }
}

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('produtos').upload(filename, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('produtos').getPublicUrl(filename)
  return data.publicUrl
}

export async function uploadSTLFile(file) {
  const filename = `stl/${Date.now()}.stl`
  const { error } = await supabase.storage.from('produtos').upload(filename, file, {
    upsert: true,
    contentType: 'application/octet-stream',
  })
  if (error) throw error
  const { data } = supabase.storage.from('produtos').getPublicUrl(filename)
  return data.publicUrl
}

export async function deleteSTLFile(url) {
  if (!supabase || !url) return
  const match = url.match(/\/storage\/v1\/object\/public\/produtos\/(.+)/)
  if (match) {
    await supabase.storage.from('produtos').remove([match[1]])
  }
}

// ── Settings ──────────────────────────────────────────────
export async function getSettings() {
  if (USE_MOCK) return null
  const { data, error } = await supabase.from('settings').select('*')
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.key, r.value]))
}

export async function saveSetting(key, value) {
  if (USE_MOCK) return
  const { error } = await supabase.from('settings').upsert({ key, value })
  if (error) throw error
}
