import type { Editor } from 'tinymce'
import axiosInstance from '@/libs/axios'
import type { MediaFile } from '@/types/features/MediaTypes'

const PAGE_SIZE = 24

interface MediaPage {
  files: MediaFile[]
  total: number
  totalPages: number
  folders: string[]
}

function getMimeIcon(mimeType = '', originalName = ''): string {
  if (mimeType.startsWith('image/')) return '🖼'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  const ext = originalName.split('.').pop()?.toLowerCase() ?? ''
  if (mimeType === 'application/pdf' || ext === 'pdf') return '📄'
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return '🗜'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📽'
  return '📁'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function buildInsertHtml(file: MediaFile): string {
  const mime = file.mimeType ?? ''
  const name = file.originalName ?? file.name ?? file.key.split('/').pop() ?? 'dosya'
  const url = file.url

  if (mime.startsWith('image/')) {
    const alt = file.altText ?? name
    return `<img src="${url}" alt="${alt}" style="max-width:100%;" />`
  }
  if (mime.startsWith('video/')) {
    return `<video controls style="max-width:100%;"><source src="${url}" type="${mime}" /></video>`
  }
  if (mime.startsWith('audio/')) {
    return `<audio controls style="width:100%;"><source src="${url}" type="${mime}" /></audio>`
  }
  // file / archive / document → download link
  const icon = getMimeIcon(mime, name)
  const size = formatBytes(file.size)
  return (
    `<a href="${url}" download="${name}" target="_blank" rel="noopener noreferrer"` +
    ` style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;` +
    `border:1px solid currentColor;border-radius:4px;text-decoration:none;">` +
    `${icon} ${name} <span style="opacity:.6;font-size:.85em;">(${size})</span></a>`
  )
}

function openMediaLibrary(editor: Editor): void {
  const UID = `ml-${Date.now()}`
  let currentPage = 0
  let currentFolder = ''
  let currentSearch = ''
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  let folders: string[] = []
  let dialogApi: { close(): void } | null = null

  const html = `
    <div style="display:flex;gap:8px;padding:0 0 10px;flex-wrap:wrap">
      <input id="${UID}-search" type="text" placeholder="Ara…"
        style="flex:1;min-width:140px;padding:5px 10px;border-radius:4px;border:1px solid #ccc;outline:none" />
      <select id="${UID}-folder"
        style="padding:5px 10px;border-radius:4px;border:1px solid #ccc">
        <option value="">Tüm klasörler</option>
      </select>
    </div>
    <div id="${UID}-grid"
      style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;min-height:200px;max-height:360px;overflow-y:auto;padding:2px">
      <div style="grid-column:1/-1;text-align:center;padding:40px;opacity:.5">Yükleniyor…</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;font-size:13px;opacity:.7">
      <span id="${UID}-info"></span>
      <div style="display:flex;gap:6px;align-items:center">
        <button id="${UID}-prev" style="padding:3px 10px;border-radius:4px;cursor:pointer">‹</button>
        <span id="${UID}-page"></span>
        <button id="${UID}-next" style="padding:3px 10px;border-radius:4px;cursor:pointer">›</button>
      </div>
    </div>
  `

  dialogApi = editor.windowManager.open({
    title: 'Medya Kütüphanesi',
    size: 'large',
    body: {
      type: 'panel',
      items: [{ type: 'htmlpanel', html }],
    },
    buttons: [{ type: 'cancel', text: 'Kapat' }],
    onClose: () => { dialogApi = null },
  })

  requestAnimationFrame(() => {
    const grid = document.getElementById(`${UID}-grid`) as HTMLDivElement | null
    const infoEl = document.getElementById(`${UID}-info`) as HTMLSpanElement | null
    const pageEl = document.getElementById(`${UID}-page`) as HTMLSpanElement | null
    const prevBtn = document.getElementById(`${UID}-prev`) as HTMLButtonElement | null
    const nextBtn = document.getElementById(`${UID}-next`) as HTMLButtonElement | null
    const searchInput = document.getElementById(`${UID}-search`) as HTMLInputElement | null
    const folderSelect = document.getElementById(`${UID}-folder`) as HTMLSelectElement | null

    if (!grid) return

    const load = async () => {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;opacity:.5">Yükleniyor…</div>'

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
        ...(currentFolder ? { folder: currentFolder } : {}),
        ...(currentSearch ? { search: currentSearch } : {}),
      })

      try {
        const res = await axiosInstance.get<MediaPage>(`/api/media?${params}`)
        const { files, total, totalPages, folders: fl } = res.data

        if (folders.length === 0 && fl.length > 0 && folderSelect) {
          folders = fl
          fl.forEach((f) => {
            const opt = document.createElement('option')
            opt.value = f
            opt.textContent = f
            folderSelect.appendChild(opt)
          })
        }

        if (infoEl) infoEl.textContent = `${total} dosya`
        if (pageEl) pageEl.textContent = totalPages > 1 ? `${currentPage + 1} / ${totalPages}` : ''
        if (prevBtn) prevBtn.disabled = currentPage === 0
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1

        grid.innerHTML = ''

        if (files.length === 0) {
          grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;opacity:.5">Sonuç bulunamadı.</div>'
          return
        }

        files.forEach((file) => {
          const mime = file.mimeType ?? ''
          const name = file.originalName ?? file.name ?? file.key.split('/').pop() ?? ''
          const isImage = mime.startsWith('image/')

          const card = document.createElement('div')
          card.style.cssText =
            'border:1px solid #ccc;border-radius:6px;overflow:hidden;cursor:pointer;' +
            'display:flex;flex-direction:column;transition:border-color .15s'
          card.onmouseenter = () => { card.style.borderColor = '#3b82f6' }
          card.onmouseleave = () => { card.style.borderColor = '#ccc' }

          const thumb = document.createElement('div')
          thumb.style.cssText =
            'height:80px;display:flex;align-items:center;justify-content:center;' +
            'background:#f3f4f6;font-size:32px;overflow:hidden'

          if (isImage) {
            const img = document.createElement('img')
            img.src = file.url
            img.alt = name
            img.style.cssText = 'width:100%;height:100%;object-fit:cover'
            thumb.appendChild(img)
          } else {
            thumb.textContent = getMimeIcon(mime, name)
          }

          const meta = document.createElement('div')
          meta.style.cssText = 'padding:5px 6px;font-size:11px;overflow:hidden'
          meta.innerHTML =
            `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${name}">${name}</div>` +
            `<div style="opacity:.6">${formatBytes(file.size)}</div>`

          card.appendChild(thumb)
          card.appendChild(meta)

          card.onclick = () => {
            editor.execCommand('mceInsertContent', false, buildInsertHtml(file))
            dialogApi?.close()
          }

          grid.appendChild(card)
        })
      } catch {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#ef4444">Yüklenemedi.</div>'
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (searchTimer) clearTimeout(searchTimer)
        searchTimer = setTimeout(() => {
          currentSearch = searchInput.value.trim()
          currentPage = 0
          void load()
        }, 350)
      })
    }

    if (folderSelect) {
      folderSelect.addEventListener('change', () => {
        currentFolder = folderSelect.value
        currentPage = 0
        void load()
      })
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { currentPage--; void load() })
    if (nextBtn) nextBtn.addEventListener('click', () => { currentPage++; void load() })

    void load()
  })
}

export function registerMediaLibraryButton(editor: Editor): void {
  editor.ui.registry.addIcon(
    'ml-library',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>',
  )
  editor.ui.registry.addButton('medialibrary', {
    icon: 'ml-library',
    tooltip: 'Medya kütüphanesinden seç',
    onAction: () => openMediaLibrary(editor),
  })
}
