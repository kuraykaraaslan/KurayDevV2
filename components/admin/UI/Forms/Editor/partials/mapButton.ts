import type { Editor } from 'tinymce'

function buildOSMSrc(lat: number, lng: number, zoom: number): string {
  const delta = 0.005 * Math.pow(2, 14 - Math.min(zoom, 18))
  const bbox = [lng - delta, lat - delta * 0.6, lng + delta, lat + delta * 0.6]
    .map((n) => n.toFixed(6))
    .join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

function buildIframeHtml(src: string, height: number, title: string): string {
  const cap = title
    ? `<figcaption style="text-align:center;font-size:13px;padding:6px 0;opacity:.65">${title}</figcaption>`
    : ''
  return (
    `<figure style="margin:1.5em 0;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">` +
    `<iframe src="${src}" width="100%" height="${height}" style="border:0;display:block" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>` +
    `${cap}</figure>`
  )
}

function openMapDialog(editor: Editor): void {
  const UID = `map-${Date.now()}`

  const row = 'display:flex;gap:8px;margin-bottom:8px'
  const input =
    'width:100%;padding:7px 10px;border-radius:6px;border:1px solid #d1d5db;font-size:13px;box-sizing:border-box'
  const label = 'display:block;font-size:12px;margin-bottom:4px'
  const hint = 'font-size:11px;opacity:.5;margin:6px 0 0'

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;padding:2px">

      <div>
        <label style="${label}font-weight:600">Kaynak</label>
        <select id="${UID}-source"
          style="${input}background:#fff;cursor:pointer">
          <option value="osm">OpenStreetMap (Koordinat ile)</option>
          <option value="google">Google Maps iframe Kodu</option>
        </select>
      </div>

      <div id="${UID}-osm-sec">
        <div style="${row}">
          <div style="flex:1">
            <label style="${label}">Enlem</label>
            <input id="${UID}-lat" type="text" placeholder="41.0082" style="${input}" />
          </div>
          <div style="flex:1">
            <label style="${label}">Boylam</label>
            <input id="${UID}-lng" type="text" placeholder="28.9784" style="${input}" />
          </div>
          <div style="width:80px">
            <label style="${label}">Zoom</label>
            <input id="${UID}-zoom" type="number" value="13" min="1" max="19"
              style="${input}" />
          </div>
        </div>
        <label style="${label}">Başlık (opsiyonel)</label>
        <input id="${UID}-title" type="text" placeholder="İstanbul, Türkiye"
          style="${input}" />
        <p style="${hint}">💡 Google Maps'te konuma sağ tıklayıp koordinatları kopyalayabilirsiniz.</p>
      </div>

      <div id="${UID}-google-sec" style="display:none">
        <label style="${label}font-weight:600">Google Maps &lt;iframe&gt; Kodu</label>
        <textarea id="${UID}-icode" rows="4"
          placeholder='&lt;iframe src="https://www.google.com/maps/embed?pb=..." ...&gt;&lt;/iframe&gt;'
          style="${input}font-family:monospace;font-size:11px;resize:vertical"></textarea>
        <p style="${hint}">💡 Google Maps → Paylaş → Harita Göm → iframe kodunu buraya yapıştırın.</p>
      </div>

      <div>
        <label style="${label}">Yükseklik (px)</label>
        <input id="${UID}-height" type="number" value="400" min="100" max="900" step="50"
          style="width:110px;padding:7px 10px;border-radius:6px;border:1px solid #d1d5db;font-size:13px" />
      </div>

    </div>
  `

  editor.windowManager.open({
    title: 'Harita Ekle',
    size: 'medium',
    body: { type: 'panel', items: [{ type: 'htmlpanel', html }] },
    buttons: [
      { type: 'cancel' as const, text: 'İptal' },
      { type: 'custom' as const, name: 'insert', text: 'Haritayı Ekle', buttonType: 'primary' as const },
    ],
    onAction: (dialogApi, { name }) => {
      if (name !== 'insert') return

      const get = <T extends HTMLElement>(id: string) =>
        document.getElementById(`${UID}-${id}`) as T | null

      const source = get<HTMLSelectElement>('source')?.value ?? 'osm'
      const height =
        parseInt(get<HTMLInputElement>('height')?.value ?? '400') || 400

      if (source === 'osm') {
        const latStr = get<HTMLInputElement>('lat')?.value.trim() ?? ''
        const lngStr = get<HTMLInputElement>('lng')?.value.trim() ?? ''
        const zoom = parseInt(get<HTMLInputElement>('zoom')?.value ?? '13') || 13
        const title = get<HTMLInputElement>('title')?.value.trim() ?? ''

        const lat = parseFloat(latStr)
        const lng = parseFloat(lngStr)

        if (isNaN(lat) || isNaN(lng)) {
          editor.notificationManager.open({
            text: 'Lütfen geçerli enlem ve boylam değerleri girin.',
            type: 'warn',
            timeout: 3000,
          })
          return
        }

        editor.execCommand('mceInsertContent', false, buildIframeHtml(buildOSMSrc(lat, lng, zoom), height, title))
        dialogApi.close()
      } else {
        const code = get<HTMLTextAreaElement>('icode')?.value.trim() ?? ''

        if (!code) {
          editor.notificationManager.open({
            text: 'iframe kodunu yapıştırın.',
            type: 'warn',
            timeout: 3000,
          })
          return
        }

        // Extract only the src — never insert raw user HTML to prevent XSS
        const srcMatch = /\bsrc="([^"]+)"/.exec(code)
        if (!srcMatch) {
          editor.notificationManager.open({
            text: 'Geçerli bir Google Maps iframe kodu bulunamadı.',
            type: 'warn',
            timeout: 3000,
          })
          return
        }

        const src = srcMatch[1]
        if (!src.startsWith('https://www.google.com/maps/')) {
          editor.notificationManager.open({
            text: 'Yalnızca Google Maps embed URL\'leri desteklenir.',
            type: 'warn',
            timeout: 3000,
          })
          return
        }

        editor.execCommand('mceInsertContent', false, buildIframeHtml(src, height, ''))
        dialogApi.close()
      }
    },
  })

  // Source selector toggle
  requestAnimationFrame(() => {
    const sourceEl = document.getElementById(`${UID}-source`) as HTMLSelectElement | null
    const osmSec = document.getElementById(`${UID}-osm-sec`) as HTMLDivElement | null
    const googleSec = document.getElementById(`${UID}-google-sec`) as HTMLDivElement | null
    if (!sourceEl || !osmSec || !googleSec) return

    sourceEl.addEventListener('change', () => {
      const v = sourceEl.value
      osmSec.style.display = v === 'osm' ? '' : 'none'
      googleSec.style.display = v === 'google' ? '' : 'none'
    })
  })
}

export function registerMapButton(editor: Editor): void {
  editor.ui.registry.addIcon(
    'ml-map',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
  )
  editor.ui.registry.addButton('mapbutton', {
    icon: 'ml-map',
    tooltip: 'Harita ekle',
    onAction: () => openMapDialog(editor),
  })
}
