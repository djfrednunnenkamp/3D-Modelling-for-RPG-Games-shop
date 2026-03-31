import { useRef, useState, useLayoutEffect } from 'react'

// crop = { x, y, width, height, naturalWidth, naturalHeight } in natural image pixels
// containerHeight — fixed px height (cards). Omit to use aspect-ratio from the crop (detail page).
// className / style — forwarded to the outer container div (for CSS transitions, transforms, etc.)
export default function CroppedImage({ src, crop, alt, containerHeight, className, style, onError }) {
  const ref = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hasValidCrop =
    crop && crop.width && crop.height && crop.naturalWidth && crop.naturalHeight

  // Container style: fixed height for cards, aspect-ratio for detail page
  const aspectRatio = hasValidCrop ? `${crop.width}/${crop.height}` : '4/3'
  const baseStyle = containerHeight != null
    ? { width: '100%', height: containerHeight, overflow: 'hidden', position: 'relative' }
    : { width: '100%', aspectRatio, overflow: 'hidden', position: 'relative' }
  const containerStyle = { ...baseStyle, ...style }

  const W = size.w
  const H = containerHeight ?? size.h

  if (!hasValidCrop || !W || !H) {
    return (
      <div ref={ref} className={className} style={containerStyle}>
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
  const scale = Math.max(W / width, H / height)
  const imgW = Math.round(naturalWidth * scale)
  const imgH = Math.round(naturalHeight * scale)
  const left = Math.round(-(x * scale) + (W - width * scale) / 2)
  const top = Math.round(-(y * scale) + (H - height * scale) / 2)

  return (
    <div ref={ref} className={className} style={containerStyle}>
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
