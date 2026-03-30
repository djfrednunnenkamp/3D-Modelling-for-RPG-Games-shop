export function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, -pixelCrop.x, -pixelCrop.y)
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas is empty')); return }
        resolve(new File([blob], `crop_${Date.now()}.jpg`, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    img.onerror = reject
    img.src = imageSrc
  })
}
