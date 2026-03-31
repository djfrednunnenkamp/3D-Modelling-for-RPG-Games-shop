import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import './ImageCropModal.css'

// Calculate what % of the 4:3 crop height is actually visible in the catalog card
// Grid: repeat(auto-fill, minmax(260px, 1fr)), card height fixed at 200px
function calcGuideHeightPct() {
  // Catalog: padding 3rem 4rem = 64px each side = 128px total; gap 1.5rem = 24px
  const availableWidth = Math.min(window.innerWidth, 1400) - 128
  const gapSize = 24 // 1.5rem
  const minCardWidth = 260
  const cols = Math.max(1, Math.floor((availableWidth + gapSize) / (minCardWidth + gapSize)))
  const cardWidth = (availableWidth - (cols - 1) * gapSize) / cols
  const cardHeight = 200
  const cropAspect = 4 / 3
  const cardAspect = cardWidth / cardHeight

  if (cardAspect > cropAspect) {
    // Card wider than crop → scales by width → clips top/bottom
    const renderedHeight = cardWidth / cropAspect
    return Math.round((cardHeight / renderedHeight) * 100)
  }
  // Card narrower than crop → full height visible, clips sides
  return 100
}

export default function ImageCropModal({
  imageSrc,
  isReCrop,
  initialCrop,
  initialZoom,
  onConfirm,
  onCancel,
}) {
  const [crop, setCrop] = useState(initialCrop ?? { x: 0, y: 0 })
  const [zoom, setZoom] = useState(initialZoom ?? 1)
  const [guideHeightPct, setGuideHeightPct] = useState(calcGuideHeightPct)

  useEffect(() => {
    function onResize() { setGuideHeightPct(calcGuideHeightPct()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [naturalSize, setNaturalSize] = useState(null)

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const onMediaLoaded = useCallback(({ naturalWidth, naturalHeight }) => {
    setNaturalSize({ naturalWidth, naturalHeight })
  }, [])

  function handleConfirm() {
    if (!croppedAreaPixels || !naturalSize) return
    onConfirm(croppedAreaPixels, naturalSize, { crop, zoom })
  }

  return (
    <div className="crop-backdrop">
      <div className="crop-card">
        <h3 className="crop-title">{isReCrop ? 'Re-crop Image' : 'Crop Image'}</h3>

        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
          />

          {/* Card thumbnail guide overlay */}
          <div className="card-guide-overlay" aria-hidden="true">
            <div
              className="card-guide-rect"
              style={{ height: `${guideHeightPct}%` }}
            >
              <span className="card-guide-label">Card view</span>
            </div>
          </div>
        </div>

        <div className="crop-zoom-row">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="crop-zoom-slider"
          />
        </div>

        <div className="crop-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleConfirm} disabled={!croppedAreaPixels || !naturalSize}>
            {isReCrop ? '✎ Re-crop' : 'Crop & Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
