import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImages,
} from '../lib/supabase'
import {
  getSetting,
  setSetting,
  DEFAULT_MATERIALS,
  DEFAULT_CATEGORIES,
  DEFAULT_WHATSAPP,
} from '../lib/settings'
import ImageUploadZone from '../components/ImageUploadZone'
import './Admin.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  image_urls: [],
  image_crops: [],
  categories: [],
  material: '',
  painted: false,
}

export default function Admin() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Tabs
  const [activeTab, setActiveTab] = useState('products')

  // Products
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [descModalOpen, setDescModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')

  // Materials
  const [materials, setMaterials] = useState(() => getSetting('materials', DEFAULT_MATERIALS))
  const [newMaterial, setNewMaterial] = useState('')

  // Categories
  const [categories, setCategories] = useState(() => getSetting('categories', DEFAULT_CATEGORIES))
  const [newCategory, setNewCategory] = useState('')

  // Settings
  const [whatsapp, setWhatsapp] = useState(() => getSetting('whatsapp', DEFAULT_WHATSAPP))
  const [whatsappSaved, setWhatsappSaved] = useState(false)

  // Toast
  const [message, setMessage] = useState(null)

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  function showMessage(text, type = 'success') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // ── Products ──────────────────────────────────────────────
  function handleEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image_url: product.image_url || '',
      image_urls: product.image_urls || [],
      image_crops: product.image_crops || [],
      categories: product.categories ?? (product.category ? [product.category] : []),
      material: product.material || '',
      painted: product.painted ?? false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const image_url = form.image_urls[0] || form.image_url || ''
      if (editingId) {
        const original = products.find(p => p.id === editingId)
        const originalUrls = original?.image_urls || []
        const removedUrls = originalUrls.filter(u => !form.image_urls.includes(u))
        if (removedUrls.length > 0) await deleteProductImages(removedUrls)
        await updateProduct(editingId, { ...form, price: parseFloat(form.price), image_url })
        showMessage('Product updated successfully!')
      } else {
        await createProduct({ ...form, price: parseFloat(form.price), image_url })
        showMessage('Product added successfully!')
      }
      setEditingId(null)
      setForm(EMPTY_FORM)
      await loadProducts()
    } catch (err) {
      showMessage(`Erro ao salvar: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, imageUrl, imageUrls) {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(id, imageUrl, imageUrls)
      showMessage('Product deleted!')
      await loadProducts()
    } catch (err) {
      showMessage(`Erro ao excluir: ${err.message}`, 'error')
    }
  }

  // ── Materials ─────────────────────────────────────────────
  function addMaterial() {
    const name = newMaterial.trim()
    if (!name) return
    if (materials.map(m => m.toLowerCase()).includes(name.toLowerCase())) {
      showMessage('Material already exists.', 'error')
      return
    }
    const updated = [...materials, name]
    setMaterials(updated)
    setSetting('materials', updated)
    setNewMaterial('')
    showMessage(`"${name}" added!`)
  }

  function removeMaterial(mat) {
    const updated = materials.filter(m => m !== mat)
    setMaterials(updated)
    setSetting('materials', updated)
  }

  // ── Categories ────────────────────────────────────────────
  function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    if (categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
      showMessage('Category already exists.', 'error')
      return
    }
    const updated = [...categories, name]
    setCategories(updated)
    setSetting('categories', updated)
    setNewCategory('')
    showMessage(`"${name}" added!`)
  }

  function removeCategory(cat) {
    const updated = categories.filter(c => c !== cat)
    setCategories(updated)
    setSetting('categories', updated)
  }

  // ── Settings ──────────────────────────────────────────────
  function saveWhatsapp() {
    setSetting('whatsapp', whatsapp.trim())
    setWhatsappSaved(true)
    setTimeout(() => setWhatsappSaved(false), 2500)
  }

  // ── Logout ────────────────────────────────────────────────
  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  const tabTitles = {
    products: editingId ? 'Edit Product' : 'Add Product',
    attributes: 'Attributes',
    settings: 'Settings',
  }
  const tabSubtitles = {
    products: `${products.length} product${products.length !== 1 ? 's' : ''} registered`,
    attributes: `${materials.length} material${materials.length !== 1 ? 's' : ''} · ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`,
    settings: 'WhatsApp & general configuration',
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⬡</div>
          <span>Peças 3D</span>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="nav-icon">◈</span> Products
          </button>
          <button
            className={`sidebar-link ${activeTab === 'attributes' ? 'active' : ''}`}
            onClick={() => setActiveTab('attributes')}
          >
            <span className="nav-icon">⬡</span> Attributes
          </button>
          <button
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙</span> Settings
          </button>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⎋</span> Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
            <div>
            <h1>{tabTitles[activeTab]}</h1>
            <p>{tabSubtitles[activeTab]}</p>
          </div>
        </div>

        {message && (
          <div className={`admin-toast ${message.type}`}>
            <span>{message.type === 'success' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}

        {/* ── TAB: PRODUCTS ── */}
        {activeTab === 'products' && (
          <div className="admin-layout">
            <section className="admin-form-card">
              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Piece Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Dragon Miniature"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <div className="desc-label-row">
                      <label>Categories</label>
                      {categories.length > 0 && (
                        <button
                          type="button"
                          className="desc-expand-btn"
                          onClick={() => { setCatSearch(''); setCatModalOpen(true) }}
                        >
                          ⤢ Select
                        </button>
                      )}
                    </div>
                    {categories.length === 0 ? (
                      <p className="no-categories-hint">Add categories in the Attributes tab first.</p>
                    ) : (
                      <button
                        type="button"
                        className="cat-selector-btn"
                        onClick={() => { setCatSearch(''); setCatModalOpen(true) }}
                      >
                        {form.categories.length === 0
                          ? <span className="cat-selector-placeholder">None selected</span>
                          : form.categories.join(', ')
                        }
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="desc-label-row">
                    <label>Description</label>
                    <button
                      type="button"
                      className="desc-expand-btn"
                      onClick={() => setDescModalOpen(true)}
                      title="Open full editor"
                    >
                      ⤢ Expand
                    </button>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the piece in detail..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Price (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Material</label>
                  <select
                    value={form.material}
                    onChange={e => setForm({ ...form, material: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {materials.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-group-toggle">
                  <label>Finish</label>
                  <div className="toggle-row">
                    <button
                      type="button"
                      className={`toggle-btn ${!form.painted ? 'active-unpainted' : ''}`}
                      onClick={() => setForm({ ...form, painted: false })}
                    >
                      Unpainted
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${form.painted ? 'active-painted' : ''}`}
                      onClick={() => setForm({ ...form, painted: true })}
                    >
                      ✦ Painted
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Photos {form.image_urls.length > 0 && `(${form.image_urls.length})`}</label>
                  <ImageUploadZone
                    images={form.image_urls}
                    crops={form.image_crops}
                    onChange={(urls, crops) => setForm(f => ({ ...f, image_urls: urls, image_crops: crops }))}
                    uploading={uploading}
                    onUploadingChange={setUploading}
                    showMessage={showMessage}
                  />
                </div>

                <div className="form-actions">
                  {editingId && (
                    <button type="button" className="btn-cancel" onClick={handleCancel}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn-save" disabled={saving || uploading}>
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : '+ Add Product'}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-products-card">
              <div className="products-header">
                <h2>Products</h2>
              </div>
              {loading ? (
                <div className="products-loading">
                  <div className="spinner" />
                  <span>Loading...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="products-empty">
                  <div className="empty-icon">◈</div>
                  <p>No products yet</p>
                  <span>Add your first product on the left</span>
                </div>
              ) : (
                <div className="products-list">
                  {products.map(p => {
                    const thumb = p.image_urls?.[0] || p.image_url
                    return (
                      <div key={p.id} className={`product-row ${editingId === p.id ? 'editing' : ''}`}>
                        <div className="product-thumb">
                          {thumb
                            ? <img src={thumb} alt={p.name} />
                            : <div className="thumb-placeholder">◈</div>
                          }
                        </div>
                        <div className="product-info">
                          <strong>{p.name}</strong>
                          {p.category && <span className="product-tag">{p.category}</span>}
                          <span className="product-price">R$ {Number(p.price).toFixed(2)}</span>
                        </div>
                        <div className="product-actions">
                          <button className="btn-edit" onClick={() => handleEdit(p)} title="Edit">✎</button>
                          <button className="btn-delete" onClick={() => handleDelete(p.id, p.image_url, p.image_urls)} title="Delete">✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── TAB: ATTRIBUTES ── */}
        {activeTab === 'attributes' && (
          <div className="attributes-layout">

            {/* Materials */}
            <section className="admin-form-card">
              <h2 className="settings-section-title">Materials</h2>
              <p className="settings-section-desc">
                Appear in the "Material" dropdown when adding or editing a product.
              </p>
              <div className="materials-add-row">
                <input
                  className="settings-input"
                  type="text"
                  value={newMaterial}
                  onChange={e => setNewMaterial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                  placeholder="New material (e.g. TPU)"
                  maxLength={40}
                />
                <button className="btn-save btn-add-material" type="button" onClick={addMaterial}>
                  + Add
                </button>
              </div>
              {materials.length === 0 ? (
                <div className="materials-empty">No materials yet.</div>
              ) : (
                <ul className="materials-list">
                  {materials.map(mat => (
                    <li key={mat} className="material-item">
                      <span className="material-chip">⬡</span>
                      <span className="material-name">{mat}</span>
                      <button className="material-remove" onClick={() => removeMaterial(mat)}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Categories */}
            <section className="admin-form-card">
              <h2 className="settings-section-title">Categories</h2>
              <p className="settings-section-desc">
                Appear in the "Category" dropdown when adding or editing a product.
              </p>
              <div className="materials-add-row">
                <input
                  className="settings-input"
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="New category (e.g. Dragons)"
                  maxLength={40}
                />
                <button className="btn-save btn-add-material" type="button" onClick={addCategory}>
                  + Add
                </button>
              </div>
              {categories.length === 0 ? (
                <div className="materials-empty">No categories yet.</div>
              ) : (
                <ul className="materials-list">
                  {categories.map(cat => (
                    <li key={cat} className="material-item">
                      <span className="material-chip">◈</span>
                      <span className="material-name">{cat}</span>
                      <button className="material-remove" onClick={() => removeCategory(cat)}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

          </div>
        )}

        {/* ── TAB: SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="settings-layout">
            <section className="admin-form-card">
              <h2 className="settings-section-title">WhatsApp</h2>
              <p className="settings-section-desc">
                This number is used in the "Buy via WhatsApp" button on every product page.
                Use the international format without spaces or symbols (e.g. <code>5511999991234</code>).
              </p>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label>Phone Number</label>
                <div className="settings-phone-row">
                  <span className="phone-prefix">wa.me/</span>
                  <input
                    className="settings-input settings-input-phone"
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    placeholder="5511999991234"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn-save" type="button" onClick={saveWhatsapp}>
                  {whatsappSaved ? '✓ Saved!' : 'Save Number'}
                </button>
              </div>

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-test-link"
                >
                  ↗ Test this number
                </a>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ── Category selector modal ── */}
      {catModalOpen && (
        <div className="desc-modal-backdrop" onClick={() => setCatModalOpen(false)}>
          <div className="desc-modal cat-modal" onClick={e => e.stopPropagation()}>
            <div className="desc-modal-header">
              <h3>Categories</h3>
              <button type="button" className="desc-modal-close" onClick={() => setCatModalOpen(false)}>✕</button>
            </div>
            <div className="cat-modal-search-row">
              <input
                className="cat-modal-search"
                type="text"
                placeholder="Search categories..."
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="cat-modal-list">
              {categories
                .filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))
                .map(c => {
                  const selected = form.categories.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`cat-modal-item ${selected ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({
                        ...f,
                        categories: selected
                          ? f.categories.filter(x => x !== c)
                          : [...f.categories, c],
                      }))}
                    >
                      <span className="cat-modal-check">{selected ? '✓' : ''}</span>
                      {c}
                    </button>
                  )
                })}
              {categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                <p className="cat-modal-empty">No categories match.</p>
              )}
            </div>
            <div className="desc-modal-footer">
              <button type="button" className="btn-save" onClick={() => setCatModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Description full-screen editor modal ── */}
      {descModalOpen && (
        <div className="desc-modal-backdrop" onClick={() => setDescModalOpen(false)}>
          <div className="desc-modal" onClick={e => e.stopPropagation()}>
            <div className="desc-modal-header">
              <h3>Description</h3>
              <button type="button" className="desc-modal-close" onClick={() => setDescModalOpen(false)}>✕</button>
            </div>
            <textarea
              className="desc-modal-textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the piece in detail..."
              autoFocus
            />
            <div className="desc-modal-footer">
              <button type="button" className="btn-save" onClick={() => setDescModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
