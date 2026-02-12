'use client'
import { Editor } from '@tinymce/tinymce-react'
import axiosInstance from '@/libs/axios'

const NEXT_PUBLIC_TINYMCE_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

const TinyMCEEditor = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  function onInit() {
    console.log('TinyMCE Editor initialized')
  }

  const image_upload_handler = (blobInfo: any) =>
    new Promise(async (resolve, reject) => {
      const formData = new FormData()
      formData.append('file', blobInfo.blob(), blobInfo.filename())
      formData.append('folder', 'categories')

      await axiosInstance
        .post('/api/aws', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((res) => {
          resolve(res.data.url)
        })
        .catch(() => {
          reject('Error uploading image')
        })
    })

  return (
    <Editor
      apiKey={NEXT_PUBLIC_TINYMCE_API_KEY}
      onInit={onInit}
      value={value}
      id="tinymce-editor"
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height: 500,
        menubar: false,
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
          //'paste',
          'help',
          'wordcount',
          'codesample',
        ],
        toolbar:
          'undo redo | blocks | image | bold italic forecolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | removeformat | code | help',
        content_style:
          'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; background-color: transparent; }',
        images_upload_handler: image_upload_handler as any,
      }}
    />
  )
}

export default TinyMCEEditor
