import { useNavigate } from 'react-router-dom'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const navigate = useNavigate()

  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="product-card" onClick={() => navigate(`/produto/${product.id}`)}>
      <div className="card-image-wrapper">
        <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="card-image" onError={e => { e.currentTarget.src = '/placeholder.svg' }} />
        {product.category && <span className="card-category">{product.category}</span>}
      </div>
      <div className="card-body">
        <h3 className="card-name">{product.name}</h3>
        <div className="card-tags">
          {product.material
            ? <span className="card-material">{product.material}</span>
            : <span />
          }
          {product.painted
            ? <span className="card-badge-inline badge-painted-inline">✦ Painted</span>
            : <span className="card-unpainted">Unpainted</span>
          }
        </div>
        <p className="card-price">{formattedPrice}</p>
      </div>
    </div>
  )
}
