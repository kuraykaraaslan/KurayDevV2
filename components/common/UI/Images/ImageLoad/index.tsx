'use client'

import { useEffect, useRef, useState } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rawSourceBlobRef = useRef<string | null>(null)
  const previewBlobRef = useRef<string | null>(null)

  const [rawSource, setRawSource] = useState<string | null>(null)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)

  const onFileSelect = (file: File) => {
    // Revoke previous raw source blob before creating new one
    if (rawSourceBlobRef.current) URL.revokeObjectURL(rawSourceBlobRef.current)
    const url = URL.createObjectURL(file)
    rawSourceBlobRef.current = url
    setRawSource(url)
    setRawImage(url)
    setOutputBlob(null)
  }

  const openCrop = () => {
    if (!rawSource) return
    setRawImage(rawSource)
  }

  const applyCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return
    const blob = await getCroppedImg(rawImage, croppedAreaPixels, 'image/jpeg', outputQuality)
    // Revoke previous preview blob before creating new one
    if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current)
    const previewUrl = URL.createObjectURL(blob)
    previewBlobRef.current = previewUrl
    setOutputBlob(blob)
    setImage(previewUrl)
    setRawImage(null)
  }

  const uploadImage = async () => {
    if (!outputBlob) return
    try {
      setUploading(true)
      const file = new File([outputBlob], 'image.jpg', { type: 'image/jpeg' })
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

  const removeImage = () => {
    if (rawSourceBlobRef.current) {
      URL.revokeObjectURL(rawSourceBlobRef.current)
      rawSourceBlobRef.current = null
    }
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = null
    }
    setImage('')
    setRawSource(null)
    setRawImage(null)
    setOutputBlob(null)
  }

  useEffect(() => {
    if (!rawImage) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
  }, [rawImage])

  // Revoke any remaining blob URLs on unmount
  useEffect(() => {
    return () => {
      if (rawSourceBlobRef.current) URL.revokeObjectURL(rawSourceBlobRef.current)
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* ── PREVIEW ── */}
      <div
        className="relative group rounded-xl overflow-hidden border-2 border-dashed border-base-300 bg-base-200 transition-colors duration-200 hover:border-base-content/30"
        style={{ width: '100%', maxWidth: width, aspectRatio: aspect }}
      >
        {image ? (
          <>
            <img
              src={image}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Preview"
            />

            {/* Pending-upload indicator */}
            {outputBlob && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-warning/90 text-warning-content text-xs font-semibold px-2 py-1 rounded-full shadow backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Unsaved
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              {rawSource && (
                <button
                  type="button"
                  onClick={openCrop}
                  className="btn btn-sm btn-neutral gap-1.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                  </svg>
                  Re-crop
                </button>
              )}
              <button
                type="button"
                onClick={removeImage}
                className="btn btn-sm btn-error gap-1.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                {t('common.image_load.remove')}
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <button
            type="button"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-base-content/40 hover:text-base-content/60 hover:bg-base-300/40 transition-all duration-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-sm font-medium">Click to select</span>
            <span className="text-xs opacity-70">JPEG · PNG</span>
          </button>
        )}
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
            e.target.value = ''
          }}
        />

        {/* Select file */}
        <button
          type="button"
          className="btn btn-neutral btn-sm gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          Select
        </button>

        {/* Upload */}
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={uploadImage}
          disabled={!outputBlob || uploading}
        >
          {uploading ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              {t('common.image_load.uploading')}
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              {t('common.image_load.upload')}
            </>
          )}
        </button>

        {/* Remove (only visible when image exists) */}
        {image && (
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10 hover:text-error"
            onClick={removeImage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            {t('common.image_load.remove')}
          </button>
        )}
      </div>

      {/* ── CROP MODAL ── */}
      {rawImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setRawImage(null)}
          />

          {/* Panel */}
          <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-base-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
              <div className="flex items-center gap-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                  <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                </svg>
                <h3 className="font-semibold text-base">Crop Image</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setRawImage(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Cropper area */}
            <div className="relative h-72 bg-black">
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

            {/* Zoom slider */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
                  Zoom
                </span>
                <span className="text-xs font-mono text-base-content/50">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="range range-primary range-sm w-full"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-base-300">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRawImage(null)}
              >
                {t('common.image_load.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2"
                onClick={applyCrop}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t('common.image_load.apply_crop')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageLoad
