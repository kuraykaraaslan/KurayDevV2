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
    <style>
      #${UID}-grid .mlc {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        background: #f9fafb;
        transition: border-color .15s, box-shadow .15s;
        display: flex;
        flex-direction: column;
      }
      #${UID}-grid .mlc:hover { border-color: #6366f1; box-shadow: 0 0 0 2px #6366f140; }
      #${UID}-grid .mlc:hover .mlc-ov { opacity: 1; }
      #${UID}-grid .mlc-th {
        position: relative;
        width: 100%;
        padding-bottom: 100%;
        background: #e5e7eb;
        overflow: hidden;
      }
      #${UID}-grid .mlc-th img {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover;
      }
      #${UID}-grid .mlc-th .mlc-ic {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 30px;
      }
      #${UID}-grid .mlc-ov {
        position: absolute; inset: 0;
        background: rgba(0,0,0,.5);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 6px;
        opacity: 0;
        transition: opacity .15s;
      }
      #${UID}-grid .mlc-ov button {
        padding: 5px 14px;
        border-radius: 6px;
        background: #fff;
        color: #111;
        border: none;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: background .12s, color .12s;
      }
      #${UID}-grid .mlc-ov button:hover { background: #6366f1; color: #fff; }
      #${UID}-grid .mlc-info { padding: 6px 8px; }
      #${UID}-grid .mlc-name {
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #${UID}-grid .mlc-foot {
        display: flex; justify-content: space-between; align-items: center;
        margin-top: 3px;
      }
      #${UID}-grid .mlc-size { font-size: 10px; opacity: .45; }
      #${UID}-grid .mlc-folder {
        font-size: 10px;
        padding: 1px 5px;
        background: rgba(0,0,0,.07);
        border-radius: 3px;
        opacity: .7;
      }
    </style>
    <div style="display:flex;gap:8px;padding:0 0 12px;flex-wrap:wrap;align-items:center">
      <input id="${UID}-search" type="text" placeholder="Dosya ara…"
        style="flex:1;min-width:150px;padding:7px 11px;border-radius:6px;border:1px solid #d1d5db;outline:none;font-size:13px" />
      <select id="${UID}-folder"
        style="padding:7px 11px;border-radius:6px;border:1px solid #d1d5db;font-size:13px;background:#fff;cursor:pointer">
        <option value="">Tüm klasörler</option>
      </select>
    </div>
    <div id="${UID}-grid"
      style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;min-height:220px;max-height:420px;overflow-y:auto;padding:2px">
      <div style="grid-column:1/-1;text-align:center;padding:48px;opacity:.45;font-size:13px">Yükleniyor…</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;font-size:12px;opacity:.6">
      <span id="${UID}-info"></span>
      <div style="display:flex;gap:5px;align-items:center">
        <button id="${UID}-prev"
          style="padding:3px 11px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;background:#fff;font-size:13px">‹</button>
        <span id="${UID}-page" style="min-width:60px;text-align:center"></span>
        <button id="${UID}-next"
          style="padding:3px 11px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;background:#fff;font-size:13px">›</button>
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
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;opacity:.45;font-size:13px">Yükleniyor…</div>'

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
          grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;opacity:.45;font-size:13px">Sonuç bulunamadı.</div>'
          return
        }

        files.forEach((file) => {
          const mime = file.mimeType ?? ''
          const name = file.originalName ?? file.name ?? file.key.split('/').pop() ?? ''
          const isImage = mime.startsWith('image/')
          const isVideo = mime.startsWith('video/')

          // ── Card ──────────────────────────────────────────────────────
          const card = document.createElement('div')
          card.className = 'mlc'

          // ── Thumbnail ─────────────────────────────────────────────────
          const thumb = document.createElement('div')
          thumb.className = 'mlc-th'

          if (isImage) {
            const img = document.createElement('img')
            img.src = file.url
            img.alt = name
            img.loading = 'lazy'
            thumb.appendChild(img)
          } else if (isVideo) {
            const vid = document.createElement('video')
            vid.src = file.url
            vid.muted = true
            vid.loop = true
            vid.playsInline = true
            vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'
            vid.onmouseenter = () => void vid.play()
            vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0 }
            thumb.appendChild(vid)
            // play icon badge
            const badge = document.createElement('div')
            badge.style.cssText =
              'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none'
            badge.innerHTML =
              '<span style="background:rgba(0,0,0,.5);color:#fff;border-radius:50%;' +
              'width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px">▶</span>'
            thumb.appendChild(badge)
          } else {
            const ic = document.createElement('div')
            ic.className = 'mlc-ic'
            ic.textContent = getMimeIcon(mime, name)
            thumb.appendChild(ic)
          }

          // ── Hover overlay ─────────────────────────────────────────────
          const overlay = document.createElement('div')
          overlay.className = 'mlc-ov'
          const insertBtn = document.createElement('button')
          insertBtn.textContent = 'Editöre Ekle'
          overlay.appendChild(insertBtn)
          thumb.appendChild(overlay)

          // ── Info ──────────────────────────────────────────────────────
          const info = document.createElement('div')
          info.className = 'mlc-info'
          info.innerHTML =
            `<div class="mlc-name" title="${name}">${name}</div>` +
            `<div class="mlc-foot">` +
            `<span class="mlc-size">${formatBytes(file.size)}</span>` +
            `<span class="mlc-folder">${file.folder}</span>` +
            `</div>`

          card.appendChild(thumb)
          card.appendChild(info)

          const doInsert = () => {
            editor.execCommand('mceInsertContent', false, buildInsertHtml(file))
            dialogApi?.close()
          }

          insertBtn.onclick = (e) => { e.stopPropagation(); doInsert() }
          card.onclick = doInsert

          grid.appendChild(card)
        })
      } catch {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:#ef4444;font-size:13px">Yüklenemedi.</div>'
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
