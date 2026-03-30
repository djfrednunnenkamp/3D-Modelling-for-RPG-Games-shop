import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '../lib/cropUtils'
import './ImageCropModal.css'

export default function ImageCropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels)
      onConfirm(file)
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="crop-backdrop">
      <div className="crop-card">
        <h3 className="crop-title">Crop Image</h3>
        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
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
          <button className="btn-cancel" onClick={onCancel} disabled={processing}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleConfirm} disabled={processing}>
            {processing ? 'Processing...' : 'Crop & Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
