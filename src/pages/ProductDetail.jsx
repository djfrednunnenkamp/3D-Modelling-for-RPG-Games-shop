import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WhatsAppButton from '../components/WhatsAppButton'
import { getProductById } from '../lib/supabase'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductById(id)
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [id])

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

  return (
    <div className="detail">
      <button className="back-btn" onClick={() => navigate('/catalogo')}>
        ← Back to Catalog
      </button>

      <div className="detail-layout">
        <div className="detail-image-wrapper">
          <span className="detail-category">{product.category}</span>
          <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="detail-image" onError={e => { e.currentTarget.src = '/placeholder.svg' }} />
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
