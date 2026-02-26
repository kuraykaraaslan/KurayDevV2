'use client'
import Image from 'next/image'

interface ImageCellProps {
  src?: string | null
  alt: string
  size?: number
}

const ImageCell = ({ src, alt, size = 32 }: ImageCellProps) => {
  if (src) {
    return (
      <Image
        width={size}
        height={size}
        src={src}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        alt={alt}
      />
    )
  }
  return <div className="bg-base-300 rounded-full" style={{ width: size, height: size }} />
}

export default ImageCell
