// cropImage.ts
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: any,
  outputType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) return reject(new Error('Canvas context missing'))

      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Blob creation failed'))
          resolve(blob)
        },
        outputType,
        quality
      )
    }

    image.onerror = () => reject(new Error('Image load failed'))
    image.src = imageSrc
  })
}
