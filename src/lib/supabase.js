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
  const { data, error } = await supabase.from('products').insert([product]).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, product) {
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id, imageUrl) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error

  // Apaga a imagem do Storage se for do Supabase
  if (imageUrl && imageUrl.includes('/storage/v1/object/public/produtos/')) {
    const filename = imageUrl.split('/storage/v1/object/public/produtos/')[1]
    if (filename) {
      await supabase.storage.from('produtos').remove([filename])
    }
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
