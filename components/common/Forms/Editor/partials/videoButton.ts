import type { Editor } from 'tinymce'
import axiosInstance from '@/libs/axios'

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024 // 200 MB

function uploadVideo(editor: Editor): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/mp4,video/webm,video/quicktime,video/x-msvideo'

  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      editor.notificationManager.open({
        text: 'Video dosyası 200 MB sınırını aşıyor.',
        type: 'error',
        timeout: 4000,
      })
      return
    }

    const notif = editor.notificationManager.open({ text: 'Video yükleniyor…', type: 'info' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'videos')

    try {
      const res = await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.url as string
      editor.execCommand(
        'mceInsertContent',
        false,
        `<video controls style="max-width:100%;"><source src="${url}" type="${file.type}" /></video>`,
      )
    } catch {
      editor.notificationManager.open({ text: 'Video yüklenemedi.', type: 'error', timeout: 4000 })
    } finally {
      notif.close()
    }
  }

  input.click()
}

function openCameraRecorder(editor: Editor): void {
  const UID = `cam-${Date.now()}`
  const VID = `${UID}-v`
  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let closed = false

  const stopAll = () => {
    stream?.getTracks().forEach((t) => t.stop())
    if (recorder?.state === 'recording') recorder.stop()
  }

  const attachStream = () => {
    requestAnimationFrame(() => {
      const v = document.getElementById(VID) as HTMLVideoElement | null
      if (v && stream) { v.srcObject = stream; v.muted = true }
    })
  }

  const vidPanel = (caption: string, captionColor = 'inherit') => ({
    type: 'panel' as const,
    items: [{
      type: 'htmlpanel' as const,
      html: `<div style="padding:4px 0">
        <video id="${VID}" autoplay muted playsinline
          style="width:100%;border-radius:4px;background:#000;max-height:280px;display:block"></video>
        <p style="margin:6px 0 0;font-size:12px;text-align:center;color:${captionColor}">${caption}</p>
      </div>`,
    }],
  })

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((s) => {
      stream = s

      const api = editor.windowManager.open({
        title: 'Kamera Kaydı',
        size: 'medium',
        body: vidPanel('Kayda hazır'),
        buttons: [
          { type: 'cancel' as const, text: 'İptal' },
          { type: 'custom' as const, name: 'start', text: 'Kaydı Başlat', buttonType: 'primary' as const },
        ],
        onAction: (_, { name }) => { if (name === 'start') goRecording() },
        onClose: () => { closed = true; stopAll() },
      })

      attachStream()

      function goRecording() {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm'
        recorder = new MediaRecorder(s, { mimeType })
        chunks = []
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
        recorder.onstop = () => { if (!closed) goReview() }
        recorder.start()

        api.redial({
          title: 'Kamera Kaydı',
          size: 'medium',
          body: vidPanel('● Kaydediliyor…', '#ef4444'),
          buttons: [
            { type: 'cancel' as const, text: 'İptal' },
            { type: 'custom' as const, name: 'stop', text: 'Durdur', buttonType: 'primary' as const },
          ],
          onAction: (_, { name }) => { if (name === 'stop') recorder?.stop() },
          onClose: () => { closed = true; stopAll() },
        })
        attachStream()
      }

      function goReview() {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const blobUrl = URL.createObjectURL(blob)
        let inserting = false

        api.redial({
          title: 'Kamera Kaydı — Önizleme',
          size: 'medium',
          body: {
            type: 'panel',
            items: [{
              type: 'htmlpanel',
              html: `<div style="padding:4px 0">
                <video id="${VID}" src="${blobUrl}" controls
                  style="width:100%;border-radius:4px;background:#000;max-height:280px;display:block"></video>
                <p style="margin:6px 0 0;font-size:12px;text-align:center;opacity:.6">Kaydı inceleyebilirsiniz.</p>
              </div>`,
            }],
          },
          buttons: [
            { type: 'cancel' as const, text: 'İptal' },
            { type: 'custom' as const, name: 'retry', text: 'Yeniden Kaydet' },
            { type: 'custom' as const, name: 'insert', text: 'Editöre Ekle', buttonType: 'primary' as const },
          ],
          onAction: (_, { name }) => {
            if (name === 'retry') { URL.revokeObjectURL(blobUrl); goRetry() }
            if (name === 'insert' && !inserting) {
              inserting = true
              void doInsert(blob).then(() => {
                URL.revokeObjectURL(blobUrl)
                if (!closed) api.close()
              })
            }
          },
          onClose: () => { closed = true; stopAll(); URL.revokeObjectURL(blobUrl) },
        })
      }

      function goRetry() {
        api.redial({
          title: 'Kamera Kaydı',
          size: 'medium',
          body: vidPanel('Kayda hazır'),
          buttons: [
            { type: 'cancel' as const, text: 'İptal' },
            { type: 'custom' as const, name: 'start', text: 'Kaydı Başlat', buttonType: 'primary' as const },
          ],
          onAction: (_, { name }) => { if (name === 'start') goRecording() },
          onClose: () => { closed = true; stopAll() },
        })
        attachStream()
      }

      async function doInsert(blob: Blob): Promise<void> {
        const file = new File([blob], `camera-${Date.now()}.webm`, { type: 'video/webm' })
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'videos')
        const notif = editor.notificationManager.open({ text: 'Video yükleniyor…', type: 'info' })
        try {
          const res = await axiosInstance.post('/api/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          editor.execCommand(
            'mceInsertContent',
            false,
            `<video controls style="max-width:100%;"><source src="${res.data.url as string}" type="video/webm" /></video>`,
          )
        } catch {
          editor.notificationManager.open({ text: 'Yükleme başarısız.', type: 'error', timeout: 4000 })
        } finally {
          notif.close()
        }
      }
    })
    .catch(() => {
      editor.notificationManager.open({
        text: 'Kamera erişimi reddedildi.',
        type: 'error',
        timeout: 4000,
      })
    })
}

export function registerVideoMenuButton(editor: Editor): void {
  editor.ui.registry.addIcon(
    'ml-video',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
  )
  editor.ui.registry.addMenuButton('videomenu', {
    icon: 'ml-video',
    tooltip: 'Video ekle',
    fetch: (callback) => {
      callback([
        {
          type: 'menuitem',
          text: 'Dosyadan yükle',
          onAction: () => uploadVideo(editor),
        },
        {
          type: 'menuitem',
          text: 'Kameradan kaydet',
          onAction: () => openCameraRecorder(editor),
        },
      ])
    },
  })
}
