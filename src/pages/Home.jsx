import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">&#9632; Precision 3D Printing</p>
          <h1 className="hero-title">
            Custom 3D pieces<br />
            <span className="hero-accent">for your campaign</span>
          </h1>
          <p className="hero-subtitle">
            We craft miniatures, terrain, props and custom components with premium materials.
            High quality, fast delivery — ready for your table.
          </p>
          <button className="cta-btn" onClick={() => navigate('/catalogo')}>
            Explore Catalog →
          </button>
        </div>
        <div className="hero-visual">
          <div className="hero-grid">
            <div className="grid-item" style={{ '--delay': '0s' }}></div>
            <div className="grid-item" style={{ '--delay': '0.1s' }}></div>
            <div className="grid-item" style={{ '--delay': '0.2s' }}></div>
            <div className="grid-item" style={{ '--delay': '0.3s' }}></div>
            <div className="grid-item accent" style={{ '--delay': '0.15s' }}></div>
            <div className="grid-item" style={{ '--delay': '0.25s' }}></div>
            <div className="grid-item" style={{ '--delay': '0.05s' }}></div>
            <div className="grid-item" style={{ '--delay': '0.35s' }}></div>
            <div className="grid-item accent" style={{ '--delay': '0.2s' }}></div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <span className="feature-icon">⬡</span>
          <h3>Eco-Friendly Materials</h3>
          <p>Our miniatures are printed in PLA, a biodegradable filament made from renewable resources.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">⬡</span>
          <h3>High Detail</h3>
          <p>Fine layer resolution for crisp details on miniatures, weapons, armor and dungeon tiles.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">⬡</span>
          <h3>Fast Delivery</h3>
          <p>Catalog items ready fast. Custom orders shipped as agreed. Your quest won't wait.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">⬡</span>
          <h3>Expert Support</h3>
          <p>WhatsApp support for questions about sizing, painting and custom requests.</p>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to find your next piece?</h2>
        <button className="cta-btn" onClick={() => navigate('/catalogo')}>
          View Full Catalog →
        </button>
      </section>
    </div>
  )
}
