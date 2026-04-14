import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WhatsAppButton from '../components/WhatsAppButton'
import CroppedImage from '../components/CroppedImage'
import { getProductById } from '../lib/supabase'
import './ProductDetail.css'

const STLViewer = lazy(() => import('../components/STLViewer'))

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [view, setView] = useState('photos') // 'photos' | '3d'

  useEffect(() => {
    setSelectedIdx(0)
    getProductById(id)
      .then(p => {
        setProduct(p)
        // Default to 3D view if product has STL but no images
        const hasImg = p?.image_urls?.length > 0 || !!p?.image_url
        setView(p?.stl_url && !hasImg ? '3d' : 'photos')
      })
      .finally(() => setLoading(false))
  }, [id])

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  if (loading) {
    return <div className="detail-loading">Loading...</div>
  }

  if (!product) {
    return (
      <div className="detail-not-found">
        <p>Piece not found.</p>
        <button className="back-btn" onClick={() => navigate('/catalogo')}>
          ← Back to Catalog
        </button>
      </div>
    )
  }

  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : ['/placeholder.svg']

  const crops = product.image_crops ?? []
  const hasRealImage = product.image_urls?.length > 0 || !!product.image_url
  const hasSTL = !!product.stl_url

  function prev() {
    setSelectedIdx(i => (i - 1 + images.length) % images.length)
  }

  function next() {
    setSelectedIdx(i => (i + 1) % images.length)
  }

  return (
    <div className="detail">
      <button className="back-btn" onClick={() => navigate('/catalogo')}>
        ← Back to Catalog
      </button>

      <div className="detail-layout">
        <div className="detail-image-col">

          {/* View toggle tabs — only when product has BOTH STL and photos */}
          {hasSTL && hasRealImage && (
            <div className="detail-view-tabs">
              <button
                className={`detail-view-tab ${view === 'photos' ? 'active' : ''}`}
                onClick={() => setView('photos')}
              >
                Fotos
              </button>
              <button
                className={`detail-view-tab ${view === '3d' ? 'active' : ''}`}
                onClick={() => setView('3d')}
              >
                ◈ Visualizar 3D
              </button>
            </div>
          )}

          {/* 3D Viewer — shown when view is 3d OR product has only STL */}
          {hasSTL && (view === '3d' || !hasRealImage) && (
            <div className="detail-stl-viewer">
              <Suspense fallback={<div className="detail-stl-loading">Carregando modelo 3D...</div>}>
                <STLViewer
                  url={product.stl_url}
                  cameraAngle={product.stl_camera_angle}
                  interactive={true}
                  height={420}
                />
              </Suspense>
            </div>
          )}

          {/* Photos viewer — shown when view is photos OR product has only images */}
          {hasRealImage && (view === 'photos' || !hasSTL) && (
            <>
              <div
                className={`detail-image-wrapper ${hasRealImage && zoomed ? 'is-zoomed' : ''}`}
                onMouseEnter={() => hasRealImage && setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
                onMouseMove={hasRealImage ? handleMouseMove : undefined}
              >
                <span className="detail-category">{product.category}</span>

                {hasRealImage && !zoomed && (
                  <span className="zoom-hint">🔍 Hover to zoom</span>
                )}

                <CroppedImage
                  src={images[selectedIdx]}
                  crop={crops[selectedIdx] ?? null}
                  alt={product.name}
                  className="detail-image"
                  style={hasRealImage && zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                  onError={e => { e.currentTarget.src = '/placeholder.svg' }}
                />

                {images.length > 1 && (
                  <>
                    <button className="img-nav-btn img-nav-prev" onClick={e => { e.stopPropagation(); prev() }}>
                      ‹
                    </button>
                    <button className="img-nav-btn img-nav-next" onClick={e => { e.stopPropagation(); next() }}>
                      ›
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="detail-thumbnails">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      className={`detail-thumb-btn ${i === selectedIdx ? 'active' : ''}`}
                      onClick={() => setSelectedIdx(i)}
                    >
                      <CroppedImage
                        src={url}
                        crop={crops[i] ?? null}
                        alt={`${product.name} ${i + 1}`}
                        containerHeight={64}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="detail-info">
          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-price">{formattedPrice}</p>

          <div className="detail-badges">
            {(product.categories?.length > 0 ? product.categories : (product.category ? [product.category] : [])).map(c => (
              <span key={c} className="detail-badge badge-category">{c}</span>
            ))}
            {product.material && (
              <span className="detail-badge badge-material">⬡ {product.material}</span>
            )}
            {product.painted ? (
              <span className="detail-badge badge-painted">✦ Painted</span>
            ) : (
              <span className="detail-badge badge-unpainted">Unpainted</span>
            )}
          </div>

          <div className="detail-divider" />

          <WhatsAppButton productName={product.name} />

          <div className="detail-divider" />

          <p className="detail-description">{product.description}</p>
        </div>
      </div>
    </div>
  )
}
