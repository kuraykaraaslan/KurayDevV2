'use client'

import { Editor } from '@tinymce/tinymce-react'
import type { Editor as TinyMCEEditorInstance } from 'tinymce'
import axiosInstance from '@/libs/axios'
import { useThemeStore } from '@/libs/zustand'
import { registerVideoMenuButton } from './partials/videoButton'
import { registerAudioMenuButton } from './partials/audioButton'
import { registerFileMenuButton } from './partials/fileButton'
import { registerMediaLibraryButton } from './partials/mediaLibraryButton'
import { registerMapButton } from './partials/mapButton'
import { registerCodePlaygroundButton } from './partials/codePlaygroundButton'

const NEXT_PUBLIC_TINYMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

interface BlobInfo {
  blob: () => Blob
  filename: () => string
}

function setupCustomButtons(editor: TinyMCEEditorInstance): void {
  registerMediaLibraryButton(editor)
  registerMapButton(editor)
  registerVideoMenuButton(editor)
  registerAudioMenuButton(editor)
  registerFileMenuButton(editor)
  registerCodePlaygroundButton(editor)
}

const TinyMCEEditor = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const image_upload_handler = (blobInfo: BlobInfo, _progress: (n: number) => void) =>
    new Promise<string>((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', blobInfo.blob(), blobInfo.filename())
      formData.append('folder', 'categories')
      axiosInstance
        .post('/api/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((res) => resolve(res.data.url as string))
        .catch(() => reject('Error uploading image'))
    })

  return (
    <Editor
      key={theme}
      apiKey={NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      id="tinymce-editor"
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height: 500,
        menubar: false,
        skin: isDark ? 'oxide-dark' : 'oxide',
        content_css: isDark ? 'dark' : 'default',
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          'anchor',
          'searchreplace',
          'visualblocks',
          'code',
          'fullscreen',
          'insertdatetime',
          'media',
          'table',
          'help',
          'wordcount',
          'codesample',
        ],
        toolbar:
          'undo redo | blocks | medialibrary mapbutton | image media videomenu audiomenu filemenu | ' +
          'bold italic forecolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | removeformat | code | codeplayground | help',
        content_style:
          'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }',
        images_upload_handler: image_upload_handler as any,
        media_live_embeds: true,
        setup: setupCustomButtons,
      }}
    />
  )
}

export default TinyMCEEditor
