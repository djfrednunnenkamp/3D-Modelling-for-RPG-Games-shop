import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../lib/supabase'
import './Catalog.css'

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const categories = ['All', ...new Set(products.map((p) => p.category))]
  const filtered = filter === 'All' ? products : products.filter((p) => p.category === filter)

  return (
    <div className="catalog">
      <div className="catalog-header">
        <h1 className="catalog-title">Piece Catalog</h1>
        <p className="catalog-subtitle">{products.length} pieces available</p>
      </div>

      <div className="catalog-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'Todos' ? 'All' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="catalog-loading">Loading pieces...</div>
      ) : (
        <div className="catalog-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
