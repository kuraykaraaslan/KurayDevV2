'use client'

import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { getCroppedImg } from './cropImage'

interface ImageLoadProps {
  image: string
  setImage: (value: string) => void
  uploadFolder?: string
  toast?: any

  label?: string
  aspect?: number
  outputQuality?: number
  width?: number
  height?: number
}

const ImageLoad = ({
  image,
  setImage,
  uploadFolder = 'default',
  toast,
  label,
  aspect = 3 / 2,
  outputQuality = 1,
  width = 384,
  height = 256,
}: ImageLoadProps) => {
  const { t } = useTranslation()

  /** RAW never changes unless new file selected */
  const [rawSource, setRawSource] = useState<string | null>(null)

  /** Crop modal */
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  /** Uploadable output */
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)

  /* ======================
       FILE SELECT
    ====================== */
  const onFileSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    setRawSource(url)
    setRawImage(url)
    setOutputBlob(null)
  }

  /* ======================
       OPEN RE-CROP
    ====================== */
  const openCrop = () => {
    if (!rawSource) return
    setRawImage(rawSource)
  }

  /* ======================
       APPLY CROP
    ====================== */
  const applyCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return

    const blob = await getCroppedImg(rawImage, croppedAreaPixels, 'image/jpeg', outputQuality)

    const previewUrl = URL.createObjectURL(blob)

    setOutputBlob(blob) // 🔑 upload edilecek veri
    setImage(previewUrl) // sadece preview
    setRawImage(null)
  }

  /* ======================
       UPLOAD (ESKİ API)
    ====================== */
  const uploadImage = async () => {
    if (!outputBlob) return

    try {
      setUploading(true)

      const file = new File([outputBlob], 'image.jpg', {
        type: 'image/jpeg',
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', uploadFolder)

      const res = await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImage(res.data.url)
      setOutputBlob(null)

      toast?.success(t('common.image.upload_success'))
    } catch (err) {
      toast?.error(t('common.image.upload_error'))
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  /* ======================
       REMOVE IMAGE
    ====================== */
  const removeImage = () => {
    setImage('')
    setRawSource(null)
    setRawImage(null)
    setOutputBlob(null)
  }

  /* ======================
       RESET CROP STATE
    ====================== */
  useEffect(() => {
    if (!rawImage) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
  }, [rawImage])

  useEffect(() => {
    return () => {
      if (rawSource?.startsWith('blob:')) {
        URL.revokeObjectURL(rawSource)
      }
      if (image?.startsWith('blob:')) {
        URL.revokeObjectURL(image)
      }
    }
  }, [rawSource, image])

  return (
    <>
      {label && <label className="label font-medium text-sm">{label}</label>}
      {/* PREVIEW */}
      <img
        src={image || `https://placehold.co/${width}x${height}`}
        width={width}
        height={height}
        className="object-cover rounded-lg cursor-pointer"
        onClick={openCrop}
        alt="Image"
      />

      {/* ACTION BUTTONS */}
      <div className="flex gap-2 mt-2">
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="input input-bordered p-3 h-12"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />

        <button
          type="button"
          className="btn btn-primary px-4 h-12"
          onClick={uploadImage}
          disabled={!outputBlob || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>

        <button
          type="button"
          className="btn btn-error px-4 h-12"
          onClick={removeImage}
          disabled={!image}
        >
          Remove Image
        </button>
      </div>

      {/* CROP MODAL */}
      {rawImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-base-100 p-4 rounded-lg w-[420px]">
            <div className="relative w-full h-72">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="range mt-4"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setRawImage(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={applyCrop}>
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ImageLoad
