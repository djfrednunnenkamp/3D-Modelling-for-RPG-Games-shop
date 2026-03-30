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

function SortableImage({ url, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="sortable-img-item">
      <div className="drag-handle" {...attributes} {...listeners}>⠿</div>
      <img src={url} alt={`Photo ${index + 1}`} />
      {index === 0 && <span className="thumb-label">★</span>}
      <button type="button" className="remove-img-btn" onClick={() => onRemove(url)}>✕</button>
    </div>
  )
}

export default function ImageUploadZone({ images, onChange, uploading, onUploadingChange, showMessage }) {
  const fileInputRef = useRef(null)
  const [cropSrc, setCropSrc] = useState(null)
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
    setCropSrc(URL.createObjectURL(file))
  }

  async function handleCropConfirm(croppedFile) {
    URL.revokeObjectURL(cropSrc)
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
      const url = await uploadProductImage(croppedFile)
      clearInterval(interval)
      setUploadProgress(100)
      onChange([...images, url])
      showMessage('Image uploaded!')
      setTimeout(() => setUploadProgress(0), 800)
    } catch (err) {
      clearInterval(interval)
      setUploadProgress(0)
      showMessage(`Upload error: ${err.message}`, 'error')
    } finally {
      onUploadingChange(false)
    }
  }

  function handleCropCancel() {
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function handleRemove(url) {
    onChange(images.filter(u => u !== url))
  }

  return (
    <div className="image-upload-zone">
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={horizontalListSortingStrategy}>
            <div className="sortable-images-row">
              {images.map((url, i) => (
                <SortableImage key={url} url={url} index={i} onRemove={handleRemove} />
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
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
