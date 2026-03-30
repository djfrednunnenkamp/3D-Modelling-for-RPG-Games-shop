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
import ImageUploadZone from '../components/ImageUploadZone'
import './Admin.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  image_urls: [],
  category: '',
  material: '',
  painted: false,
}

export default function Admin() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
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

  function handleEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image_url: product.image_url || '',
      image_urls: product.image_urls || [],
      category: product.category || '',
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

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
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
          <a className="sidebar-link active">
            <span className="nav-icon">◈</span> Products
          </a>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⎋</span> Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>{editingId ? 'Edit Product' : 'Add Product'}</h1>
            <p>{products.length} product{products.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        {message && (
          <div className={`admin-toast ${message.type}`}>
            <span>{message.type === 'success' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}

        <div className="admin-layout">
          {/* Formulário */}
          <section className="admin-form-card">
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Piece Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Dragon Miniature"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Ex: Monsters"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Material</label>
                <select
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="PLA">PLA</option>
                  <option value="Resin">Resin</option>
                  <option value="PETG">PETG</option>
                  <option value="ABS">ABS</option>
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
                  onChange={(urls) => setForm(f => ({ ...f, image_urls: urls }))}
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

          {/* Lista de produtos */}
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
                {products.map((p) => {
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
      </main>
    </div>
  )
}
