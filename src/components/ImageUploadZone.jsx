import { useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ImageCropModal from './ImageCropModal'
import { uploadProductImage } from '../lib/supabase'
import './ImageUploadZone.css'

function SortableImage({ url, index, onRemove, onReCrop }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="sortable-img-item">
      <div className="drag-handle" {...attributes} {...listeners}>⠿</div>
      <div className="img-thumb-wrap" onClick={() => onReCrop(url)}>
        <img src={url} alt={`Photo ${index + 1}`} />
        <div className="recrop-overlay">✎ Re-crop</div>
      </div>
      {index === 0 && <span className="thumb-label">★</span>}
      <button type="button" className="remove-img-btn" onClick={() => onRemove(url)}>✕</button>
    </div>
  )
}

// images: string[] — URLs of original images in storage
// crops: CropData[] — crop params per image, parallel array to images
// CropData = { x, y, width, height, naturalWidth, naturalHeight, modalCrop, modalZoom }
export default function ImageUploadZone({ images, crops = [], onChange, uploading, onUploadingChange, showMessage }) {
  const fileInputRef = useRef(null)
  const originalFiles = useRef({}) // { [blobUrl]: File } — pending uploads only

  const [cropSrc, setCropSrc] = useState(null)
  const [reCropUrl, setReCropUrl] = useState(null)
  const [cropModalState, setCropModalState] = useState(null) // { crop, zoom } | null
  const [uploadProgress, setUploadProgress] = useState(0)

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id)
      const newIndex = images.indexOf(over.id)
      onChange(arrayMove(images, oldIndex, newIndex), arrayMove(crops, oldIndex, newIndex))
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file only.', 'error')
      return
    }
    const blobUrl = URL.createObjectURL(file)
    originalFiles.current[blobUrl] = file
    setReCropUrl(null)
    setCropModalState(null)
    setCropSrc(blobUrl)
  }

  function handleReCrop(url) {
    const idx = images.indexOf(url)
    const savedCrop = crops[idx]
    setReCropUrl(url)
    // Restore previous crop position and zoom if available
    setCropModalState(savedCrop
      ? { crop: savedCrop.modalCrop, zoom: savedCrop.modalZoom }
      : null
    )
    // Load original directly from storage — no re-upload needed
    setCropSrc(url)
  }

  async function handleCropConfirm(croppedAreaPixels, naturalSize, cropState) {
    const cropData = {
      x: croppedAreaPixels.x,
      y: croppedAreaPixels.y,
      width: croppedAreaPixels.width,
      height: croppedAreaPixels.height,
      naturalWidth: naturalSize.naturalWidth,
      naturalHeight: naturalSize.naturalHeight,
      modalCrop: cropState.crop,
      modalZoom: cropState.zoom,
    }

    const isReCrop = reCropUrl !== null

    if (isReCrop) {
      // Re-crop: just update crop params, no upload needed
      const idx = images.indexOf(reCropUrl)
      const newCrops = [...crops]
      newCrops[idx] = cropData
      onChange(images, newCrops)
      showMessage('Crop updated!')
      setCropSrc(null)
      setCropModalState(null)
      setReCropUrl(null)
      return
    }

    // New image: upload the original file
    const currentBlobUrl = cropSrc
    const file = originalFiles.current[currentBlobUrl]

    setCropSrc(null)
    setCropModalState(null)
    onUploadingChange(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(interval); return prev }
        return prev + Math.random() * 12
      })
    }, 200)

    try {
      const newUrl = await uploadProductImage(file)
      clearInterval(interval)
      setUploadProgress(100)

      URL.revokeObjectURL(currentBlobUrl)
      delete originalFiles.current[currentBlobUrl]

      onChange([...images, newUrl], [...crops, cropData])
      showMessage('Image uploaded!')
      setTimeout(() => setUploadProgress(0), 800)
    } catch (err) {
      clearInterval(interval)
      setUploadProgress(0)
      showMessage(`Upload error: ${err.message}`, 'error')
    } finally {
      setReCropUrl(null)
      onUploadingChange(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(cropSrc)
      delete originalFiles.current[cropSrc]
    }
    setCropSrc(null)
    setCropModalState(null)
    setReCropUrl(null)
  }

  function handleRemove(url) {
    const idx = images.indexOf(url)
    onChange(
      images.filter((_, i) => i !== idx),
      crops.filter((_, i) => i !== idx),
    )
  }

  return (
    <div className="image-upload-zone">
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={horizontalListSortingStrategy}>
            <div className="sortable-images-row">
              {images.map((url, i) => (
                <SortableImage
                  key={url}
                  url={url}
                  index={i}
                  onRemove={handleRemove}
                  onReCrop={handleReCrop}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div
        className={`add-photo-btn ${uploading ? 'uploading' : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div className="upload-progress-mini">
            <div className="upload-icon">↑</div>
            <span>{Math.round(Math.min(uploadProgress, 100))}%</span>
            <div className="progress-bar-wrap" style={{ width: '100%', marginTop: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="upload-icon">+</div>
            <span>Add photo</span>
          </>
        )}
      </div>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          isReCrop={reCropUrl !== null}
          initialCrop={cropModalState?.crop ?? undefined}
          initialZoom={cropModalState?.zoom ?? undefined}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
