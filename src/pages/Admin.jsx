import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImages,
  deleteSTLFile,
  uploadSTLFile,
  getSettings,
  saveSetting,
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

const STLViewer = lazy(() => import('../components/STLViewer'))

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
  stl_url: '',
  stl_camera_angle: null,
  stl_as_cover: true,
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
  const [uploadingSTL, setUploadingSTL] = useState(false)
  const [saving, setSaving] = useState(false)
  const [descModalOpen, setDescModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [currentAngle, setCurrentAngle] = useState(null)
  const [stlAngleModalOpen, setStlAngleModalOpen] = useState(false)
  const [modalDraftAngle, setModalDraftAngle] = useState(null)
  const stlInputRef = useRef()

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

  useEffect(() => {
    loadProducts()
    loadSettings()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  async function loadSettings() {
    try {
      const data = await getSettings()
      if (!data) return
      if (data.materials) {
        setMaterials(data.materials)
        setSetting('materials', data.materials)
      }
      if (data.categories) {
        setCategories(data.categories)
        setSetting('categories', data.categories)
      }
      if (data.whatsapp !== undefined) {
        setWhatsapp(data.whatsapp)
        setSetting('whatsapp', data.whatsapp)
      }
    } catch {}
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
      stl_url: product.stl_url || '',
      stl_camera_angle: product.stl_camera_angle || null,
      stl_as_cover: product.stl_as_cover ?? true,
    })
    setCurrentAngle(product.stl_camera_angle || null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setCurrentAngle(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const image_url = form.image_urls[0] || ''
      const payload = { ...form, price: parseFloat(form.price), image_url }
      if (editingId) {
        const original = products.find(p => p.id === editingId)
        const originalUrls = original?.image_urls || []
        const removedUrls = originalUrls.filter(u => !form.image_urls.includes(u))
        if (removedUrls.length > 0) await deleteProductImages(removedUrls)
        // If STL was replaced, delete the old one
        if (original?.stl_url && original.stl_url !== form.stl_url) {
          await deleteSTLFile(original.stl_url)
        }
        await updateProduct(editingId, payload)
        showMessage('Product updated successfully!')
      } else {
        await createProduct(payload)
        showMessage('Product added successfully!')
      }
      setEditingId(null)
      setForm(EMPTY_FORM)
      setCurrentAngle(null)
      await loadProducts()
    } catch (err) {
      showMessage(`Erro ao salvar: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, imageUrl, imageUrls, stlUrl) {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(id, imageUrl, imageUrls, stlUrl)
      showMessage('Product deleted!')
      await loadProducts()
    } catch (err) {
      showMessage(`Erro ao excluir: ${err.message}`, 'error')
    }
  }

  async function handleSTLUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.stl')) {
      showMessage('Apenas arquivos .STL são aceitos.', 'error')
      return
    }
    setUploadingSTL(true)
    try {
      const url = await uploadSTLFile(file)
      setForm(f => ({ ...f, stl_url: url, stl_camera_angle: null }))
      setCurrentAngle(null)
      setModalDraftAngle(null)
      setStlAngleModalOpen(true)
    } catch (err) {
      showMessage(`Erro ao enviar STL: ${err.message}`, 'error')
    } finally {
      setUploadingSTL(false)
      if (stlInputRef.current) stlInputRef.current.value = ''
    }
  }

  function handleRemoveSTL() {
    setForm(f => ({ ...f, stl_url: '', stl_camera_angle: null }))
    setCurrentAngle(null)
    setStlAngleModalOpen(false)
  }

  function openAngleModal() {
    setModalDraftAngle(form.stl_camera_angle)
    setStlAngleModalOpen(true)
  }

  function handleModalSaveAngle() {
    if (!modalDraftAngle) return
    setForm(f => ({ ...f, stl_camera_angle: modalDraftAngle }))
    setCurrentAngle(modalDraftAngle)
    setStlAngleModalOpen(false)
    showMessage('Ângulo da capa salvo!')
  }

  function handleModalClose() {
    setStlAngleModalOpen(false)
  }

  async function handleDownloadSTL() {
    if (!form.stl_url) return
    try {
      const res = await fetch(form.stl_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name || 'modelo'}.stl`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showMessage('Erro ao baixar o arquivo STL.', 'error')
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
    saveSetting('materials', updated)
    setNewMaterial('')
    showMessage(`"${name}" added!`)
  }

  function removeMaterial(mat) {
    const updated = materials.filter(m => m !== mat)
    setMaterials(updated)
    setSetting('materials', updated)
    saveSetting('materials', updated)
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
    saveSetting('categories', updated)
    setNewCategory('')
    showMessage(`"${name}" added!`)
  }

  function removeCategory(cat) {
    const updated = categories.filter(c => c !== cat)
    setCategories(updated)
    setSetting('categories', updated)
    saveSetting('categories', updated)
  }

  // ── Settings ──────────────────────────────────────────────
  function saveWhatsapp() {
    const val = whatsapp.trim()
    setSetting('whatsapp', val)
    saveSetting('whatsapp', val)
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
          <img src="/favicon.png" alt="Dungeon Prints" className="sidebar-logo-img" />
          <span>Dungeon Prints</span>
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
        <button className="sidebar-back" onClick={() => navigate('/')}>
          <span>←</span> Back to site
        </button>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⎋</span> Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Mobile tab bar (sidebar is hidden on small screens) */}
        <div className="admin-mobile-tabs">
          <button
            className={`admin-mobile-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            ◈ Products
          </button>
          <button
            className={`admin-mobile-tab ${activeTab === 'attributes' ? 'active' : ''}`}
            onClick={() => setActiveTab('attributes')}
          >
            ⬡ Attributes
          </button>
          <button
            className={`admin-mobile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙ Settings
          </button>
          <button className="admin-mobile-tab" onClick={() => navigate('/')}>
            ← Site
          </button>
        </div>

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
                    <label>Categories</label>
                    {categories.length === 0 ? (
                      <p className="no-categories-hint">Add categories in the Attributes tab first.</p>
                    ) : (
                      <button
                        type="button"
                        className="cat-selector-btn"
                        onClick={() => { setCatSearch(''); setCatModalOpen(true) }}
                      >
                        {form.categories.length === 0
                          ? <span className="cat-selector-placeholder">Select categories</span>
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
                  <label>Arquivo 3D (.STL) — capa do produto</label>
                  {form.stl_url ? (
                    <div className="stl-upload-preview">
                      <div className="stl-preview-viewer stl-preview-clickable" onClick={openAngleModal}>
                        <Suspense fallback={<div style={{ height: 180, background: '#141414' }} />}>
                          <STLViewer
                            key={JSON.stringify(form.stl_camera_angle)}
                            url={form.stl_url}
                            cameraAngle={form.stl_camera_angle}
                            interactive={false}
                            height={180}
                          />
                        </Suspense>
                        <div className="stl-preview-overlay">
                          {form.stl_camera_angle ? '✎ Clique para mudar o ângulo' : '⊕ Clique para definir o ângulo'}
                        </div>
                      </div>
                      <div className="stl-preview-footer">
                        {form.stl_camera_angle
                          ? <span className="stl-angle-saved">✓ Ângulo da capa definido</span>
                          : <span className="stl-angle-pending">Ângulo não definido — clique no modelo acima</span>
                        }
                        <div className="stl-preview-btns">
                          <button
                            type="button"
                            className="btn-download-stl"
                            onClick={handleDownloadSTL}
                            title="Baixar arquivo STL"
                          >
                            ↓ Baixar STL
                          </button>
                          <button type="button" className="btn-remove-stl" onClick={handleRemoveSTL}>
                            ✕ Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="stl-upload-zone"
                      onClick={() => stlInputRef.current?.click()}
                    >
                      <input
                        ref={stlInputRef}
                        type="file"
                        accept=".stl,.STL"
                        style={{ display: 'none' }}
                        onChange={handleSTLUpload}
                      />
                      {uploadingSTL ? (
                        <div className="stl-uploading">
                          <div className="stl-spinner-sm" />
                          Enviando...
                        </div>
                      ) : (
                        <>
                          <span className="stl-upload-icon">◈</span>
                          <span className="stl-upload-label">Clique para enviar arquivo .STL</span>
                          <span className="stl-upload-sub">O modelo 3D será exibido como capa do produto</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {form.stl_url && form.image_urls.length > 0 && (
                  <div className="form-group">
                    <label>Capa do produto</label>
                    <div className="toggle-row">
                      <button
                        type="button"
                        className={`toggle-btn ${form.stl_as_cover ? 'active-painted' : ''}`}
                        onClick={() => setForm(f => ({ ...f, stl_as_cover: true }))}
                      >
                        ◈ Modelo 3D
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${!form.stl_as_cover ? 'active-unpainted' : ''}`}
                        onClick={() => setForm(f => ({ ...f, stl_as_cover: false }))}
                      >
                        ⬜ Foto
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Fotos {form.image_urls.length > 0 && `(${form.image_urls.length})`}</label>
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
                  <button type="submit" className="btn-save" disabled={saving || uploading || uploadingSTL}>
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : '+ Add Product'}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-products-card">
              <div className="products-header">
                <h2>Products</h2>
                <input
                  type="text"
                  className="products-search"
                  placeholder="Buscar por nome..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
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
                  {products.filter(p =>
                    p.name.toLowerCase().includes(productSearch.toLowerCase())
                  ).map(p => {
                    const showSTL = !!p.stl_url && (p.stl_as_cover ?? true)
                    const thumb = p.image_urls?.[0] || p.image_url
                    return (
                      <div key={p.id} className={`product-row ${editingId === p.id ? 'editing' : ''}`}>
                        <div className="product-thumb">
                          {showSTL ? (
                            <Suspense fallback={<div className="thumb-placeholder">◈</div>}>
                              <STLViewer
                                url={p.stl_url}
                                cameraAngle={p.stl_camera_angle}
                                interactive={false}
                                height={56}
                              />
                            </Suspense>
                          ) : thumb ? (
                            <img src={thumb} alt={p.name} />
                          ) : (
                            <div className="thumb-placeholder">◈</div>
                          )}
                        </div>
                        <div className="product-info">
                          <strong>{p.name}</strong>
                          {p.category && <span className="product-tag">{p.category}</span>}
                          <span className="product-price">R$ {Number(p.price).toFixed(2)}</span>
                        </div>
                        <div className="product-actions">
                          {p.stl_url && (
                            <a className="btn-download" href={p.stl_url} download title="Download STL">↓</a>
                          )}
                          <button className="btn-edit" onClick={() => handleEdit(p)} title="Edit">✎</button>
                          <button className="btn-delete" onClick={() => handleDelete(p.id, p.image_url, p.image_urls, p.stl_url)} title="Delete">✕</button>
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

      {/* ── STL Angle picker modal ── */}
      {stlAngleModalOpen && form.stl_url && (
        <div className="desc-modal-backdrop" onClick={handleModalClose}>
          <div className="stl-angle-modal" onClick={e => e.stopPropagation()}>
            <div className="desc-modal-header">
              <h3>Definir ângulo da capa</h3>
              <button type="button" className="desc-modal-close" onClick={handleModalClose}>✕</button>
            </div>
            <p className="stl-modal-hint">
              Gire o modelo até o ângulo desejado e clique em <strong>Salvar ângulo</strong>.
            </p>
            <div className="stl-modal-viewer">
              <Suspense fallback={<div style={{ height: 400, background: '#141414' }} />}>
                <STLViewer
                  url={form.stl_url}
                  cameraAngle={modalDraftAngle ?? form.stl_camera_angle}
                  onAngleChange={setModalDraftAngle}
                  height={400}
                />
              </Suspense>
            </div>
            <div className="desc-modal-footer">
              <button type="button" className="btn-cancel" onClick={handleModalClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleModalSaveAngle}
                disabled={!modalDraftAngle}
              >
                Salvar ângulo
              </button>
            </div>
          </div>
        </div>
      )}

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
