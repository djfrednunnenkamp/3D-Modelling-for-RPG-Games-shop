import { useRef, useState, useLayoutEffect } from 'react'

// crop = { x, y, width, height, naturalWidth, naturalHeight } in natural image pixels
// Applies the crop to display exactly the cropped region, scaled to fill the container
// like object-fit: cover but on the crop area, not the full original.
export default function CroppedImage({ src, crop, alt, containerHeight = 200, onError }) {
  const ref = useRef(null)
  const [w, setW] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.offsetWidth)
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hasValidCrop =
    crop && crop.width && crop.height && crop.naturalWidth && crop.naturalHeight

  if (!hasValidCrop || !w) {
    return (
      <div ref={ref} style={{ width: '100%', height: containerHeight, overflow: 'hidden' }}>
        <img
          src={src}
          alt={alt}
          onError={onError}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  const { x, y, width, height, naturalWidth, naturalHeight } = crop
  const H = containerHeight
  const scale = Math.max(w / width, H / height)
  const imgW = Math.round(naturalWidth * scale)
  const imgH = Math.round(naturalHeight * scale)
  const left = Math.round(-(x * scale) + (w - width * scale) / 2)
  const top = Math.round(-(y * scale) + (H - height * scale) / 2)

  return (
    <div ref={ref} style={{ width: '100%', height: H, overflow: 'hidden', position: 'relative' }}>
      <img
        src={src}
        alt={alt}
        onError={onError}
        style={{
          position: 'absolute',
          width: imgW,
          height: imgH,
          left,
          top,
          maxWidth: 'none',
          display: 'block',
        }}
      />
    </div>
  )
}
