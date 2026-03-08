import type { Editor } from 'tinymce'
import axiosInstance from '@/libs/axios'

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB

const ACCEPTED_TYPES = [
  // Documents
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
  // Archives
  '.zip,.tar,.gz,.rar,.7z',
].join(',')

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📝', docx: '📝',
  xls: '📊', xlsx: '📊',
  ppt: '📽', pptx: '📽',
  txt: '📃', csv: '📃',
  zip: '🗜', tar: '🗜', gz: '🗜', rar: '🗜', '7z': '🗜',
}

function getIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return FILE_ICONS[ext] ?? '📁'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function uploadFile(editor: Editor): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = ACCEPTED_TYPES

  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      editor.notificationManager.open({
        text: 'Dosya 100 MB sınırını aşıyor.',
        type: 'error',
        timeout: 4000,
      })
      return
    }

    const notif = editor.notificationManager.open({ text: 'Dosya yükleniyor…', type: 'info' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'files')

    try {
      const res = await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.url as string
      const icon = getIcon(file.name)
      const size = formatBytes(file.size)

      editor.execCommand(
        'mceInsertContent',
        false,
        `<a href="${url}" download="${file.name}" target="_blank" rel="noopener noreferrer"` +
        ` style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;` +
        `border:1px solid currentColor;border-radius:4px;text-decoration:none;">` +
        `${icon} ${file.name} <span style="opacity:.6;font-size:.85em;">(${size})</span></a>`,
      )
    } catch {
      editor.notificationManager.open({
        text: 'Dosya yüklenemedi.',
        type: 'error',
        timeout: 4000,
      })
    } finally {
      notif.close()
    }
  }

  input.click()
}

function insertFileLink(editor: Editor): void {
  editor.windowManager.open({
    title: 'Dosya Linki Ekle',
    body: {
      type: 'panel',
      items: [
        {
          type: 'input',
          name: 'url',
          label: 'Dosya URL',
          placeholder: 'https://example.com/file.zip',
        },
        {
          type: 'input',
          name: 'label',
          label: 'Link metni',
          placeholder: 'Dosyayı indir',
        },
      ],
    },
    buttons: [
      { type: 'cancel', text: 'İptal' },
      { type: 'submit', text: 'Ekle', buttonType: 'primary' },
    ],
    onSubmit: (dialogApi) => {
      const data = dialogApi.getData() as { url: string; label: string }
      const url = data.url.trim()
      const label = data.label.trim() || url

      if (!url) {
        editor.notificationManager.open({
          text: 'URL boş olamaz.',
          type: 'error',
          timeout: 3000,
        })
        return
      }

      editor.execCommand(
        'mceInsertContent',
        false,
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
      )
      dialogApi.close()
    },
  })
}

export function registerFileMenuButton(editor: Editor): void {
  editor.ui.registry.addIcon(
    'ml-file',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>',
  )
  editor.ui.registry.addMenuButton('filemenu', {
    icon: 'ml-file',
    tooltip: 'Dosya ekle / link ver',
    fetch: (callback) => {
      callback([
        {
          type: 'menuitem',
          text: 'Dosya yükle ve link ekle',
          onAction: () => uploadFile(editor),
        },
        {
          type: 'menuitem',
          text: 'URL ile link ekle',
          onAction: () => insertFileLink(editor),
        },
      ])
    },
  })
}
