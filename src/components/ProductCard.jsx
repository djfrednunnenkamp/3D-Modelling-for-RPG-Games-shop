import { useNavigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import CroppedImage from './CroppedImage'
import './ProductCard.css'

const STLViewer = lazy(() => import('./STLViewer'))

export default function ProductCard({ product }) {
  const navigate = useNavigate()

  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const showSTL = !!product.stl_url && (product.stl_as_cover ?? true)
  const src = product.image_urls?.[0] || product.image_url || '/placeholder.svg'
  const crop = product.image_crops?.[0] ?? null

  return (
    <div className="product-card" onClick={() => navigate(`/produto/${product.id}`)}>
      <div className="card-image-wrapper">
        {showSTL ? (
          <Suspense fallback={<div className="card-stl-fallback" />}>
            <STLViewer
              url={product.stl_url}
              cameraAngle={product.stl_camera_angle}
              interactive={false}
              height={200}
            />
          </Suspense>
        ) : (
          <CroppedImage
            src={src}
            crop={crop}
            alt={product.name}
            containerHeight={200}
            onError={e => { e.currentTarget.src = '/placeholder.svg' }}
          />
        )}
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
