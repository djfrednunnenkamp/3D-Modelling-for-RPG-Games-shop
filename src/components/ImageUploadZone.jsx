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

export default function ImageUploadZone({ images, onChange, uploading, onUploadingChange, showMessage }) {
  const fileInputRef = useRef(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [reCropUrl, setReCropUrl] = useState(null)   // URL being replaced (null = new upload)
  const [originalSrcs, setOriginalSrcs] = useState({}) // { uploadedUrl: blobUrl | remoteUrl }
  const [uploadProgress, setUploadProgress] = useState(0)

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id)
      const newIndex = images.indexOf(over.id)
      onChange(arrayMove(images, oldIndex, newIndex))
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
    setReCropUrl(null)
    setCropSrc(URL.createObjectURL(file))
  }

  function handleReCrop(url) {
    // Use stored original (blob or remote URL) if available, else use the URL directly
    const src = originalSrcs[url] || url
    setReCropUrl(url)
    setCropSrc(src)
  }

  async function handleCropConfirm(croppedFile) {
    const isReCrop = reCropUrl !== null
    const srcWasBlob = cropSrc?.startsWith('blob:')
    const isSavedBlob = isReCrop && originalSrcs[reCropUrl]?.startsWith('blob:')

    // Only revoke if this is a fresh blob that we won't keep
    // (fresh new upload blobs are kept in originalSrcs — don't revoke)
    if (!isReCrop && !srcWasBlob) {
      URL.revokeObjectURL(cropSrc)
    }

    const currentCropSrc = cropSrc
    setCropSrc(null)
    onUploadingChange(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(interval); return prev }
        return prev + Math.random() * 12
      })
    }, 200)

    try {
      const newUrl = await uploadProductImage(croppedFile)
      clearInterval(interval)
      setUploadProgress(100)

      if (isReCrop) {
        // Replace old URL with new one
        onChange(images.map(u => u === reCropUrl ? newUrl : u))
        // Transfer original source to new URL key
        setOriginalSrcs(prev => {
          const orig = prev[reCropUrl] || reCropUrl
          const { [reCropUrl]: _, ...rest } = prev
          return { ...rest, [newUrl]: orig }
        })
        showMessage('Image updated!')
      } else {
        // New upload — keep the blob URL as original for future re-crop
        onChange([...images, newUrl])
        setOriginalSrcs(prev => ({ ...prev, [newUrl]: currentCropSrc }))
        showMessage('Image uploaded!')
      }

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
    const isReCrop = reCropUrl !== null
    // Only revoke if it's a freshly created blob (new upload that was cancelled)
    if (!isReCrop && cropSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(cropSrc)
    }
    setCropSrc(null)
    setReCropUrl(null)
  }

  function handleRemove(url) {
    // Revoke blob URL if stored
    const orig = originalSrcs[url]
    if (orig?.startsWith('blob:')) URL.revokeObjectURL(orig)
    setOriginalSrcs(prev => { const { [url]: _, ...rest } = prev; return rest })
    onChange(images.filter(u => u !== url))
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
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
