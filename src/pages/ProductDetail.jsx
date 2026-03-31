import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WhatsAppButton from '../components/WhatsAppButton'
import CroppedImage from '../components/CroppedImage'
import { getProductById } from '../lib/supabase'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    setSelectedIdx(0)
    getProductById(id)
      .then(setProduct)
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
        </div>

        <div className="detail-info">
          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-price">{formattedPrice}</p>

          <div className="detail-badges">
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

          <p className="detail-description">{product.description}</p>

          <div className="detail-divider" />

          <WhatsAppButton productName={product.name} />

          <p className="detail-hint">
            Click the button above to contact us via WhatsApp and complete your order.
          </p>
        </div>
      </div>
    </div>
  )
}
