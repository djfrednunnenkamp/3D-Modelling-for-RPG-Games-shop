export const DEFAULT_MATERIALS = ['PLA', 'Resin', 'PETG', 'ABS']
export const DEFAULT_CATEGORIES = ['Monsters', 'Heroes', 'Terrain', 'Vehicles', 'Accessories']
export const DEFAULT_WHATSAPP = '999311574'

export function getSetting(key, defaultValue) {
  try {
    const val = localStorage.getItem(`dp_${key}`)
    return val !== null ? JSON.parse(val) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setSetting(key, value) {
  try {
    localStorage.setItem(`dp_${key}`, JSON.stringify(value))
  } catch {}
}
