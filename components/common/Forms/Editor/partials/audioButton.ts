import type { Editor } from 'tinymce'
import axiosInstance from '@/libs/axios'

function uploadAudio(editor: Editor): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/mpeg,audio/wav,audio/ogg,audio/mp4'

  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    const notif = editor.notificationManager.open({ text: 'Ses dosyası yükleniyor…', type: 'info' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'audios')

    try {
      const res = await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.url as string
      editor.execCommand(
        'mceInsertContent',
        false,
        `<audio controls style="width:100%;"><source src="${url}" type="${file.type}" /></audio>`,
      )
    } catch {
      editor.notificationManager.open({
        text: 'Ses dosyası yüklenemedi.',
        type: 'error',
        timeout: 4000,
      })
    } finally {
      notif.close()
    }
  }

  input.click()
}

function recordAudio(editor: Editor): void {
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let recordingMimeType = 'audio/webm'

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        recordingMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/ogg;codecs=opus'

        mediaRecorder = new MediaRecorder(stream, { mimeType: recordingMimeType })
        chunks = []

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          const audioBlob = new Blob(chunks, { type: recordingMimeType })
          const blobUrl = URL.createObjectURL(audioBlob)

          editor.windowManager.open({
            title: 'Ses Kaydı',
            body: {
              type: 'panel',
              items: [
                {
                  type: 'htmlpanel',
                  html: `<div style="padding:8px 0"><audio controls src="${blobUrl}" style="width:100%"></audio></div>`,
                },
              ],
            },
            buttons: [
              { type: 'cancel', text: 'İptal' },
              { type: 'submit', text: 'Editöre Ekle', buttonType: 'primary' },
            ],
            onSubmit: async (dialogApi) => {
              dialogApi.close()
              const ext = recordingMimeType.includes('ogg') ? 'ogg' : 'webm'
              const file = new File([audioBlob], `recording-${Date.now()}.${ext}`, {
                type: recordingMimeType,
              })
              const formData = new FormData()
              formData.append('file', file)
              formData.append('folder', 'audios')
              const notif = editor.notificationManager.open({
                text: 'Ses kaydı yükleniyor…',
                type: 'info',
              })
              try {
                const res = await axiosInstance.post('/api/media', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                })
                const url = res.data.url as string
                const baseMime = recordingMimeType.split(';')[0]
                editor.execCommand(
                  'mceInsertContent',
                  false,
                  `<audio controls style="width:100%;"><source src="${url}" type="${baseMime}" /></audio>`,
                )
              } catch {
                editor.notificationManager.open({
                  text: 'Ses kaydı eklenemedi.',
                  type: 'error',
                  timeout: 4000,
                })
              } finally {
                notif.close()
                URL.revokeObjectURL(blobUrl)
              }
            },
            onClose: () => URL.revokeObjectURL(blobUrl),
          })
        }

        mediaRecorder.start()

        // Stop dialog
        editor.windowManager.open({
          title: 'Kaydediliyor…',
          body: {
            type: 'panel',
            items: [
              {
                type: 'htmlpanel',
                html: '<p style="margin:0;font-size:13px">Kaydı durdurmak için "Durdur" butonuna tıklayın.</p>',
              },
            ],
          },
          buttons: [{ type: 'submit', text: 'Durdur', buttonType: 'primary' }],
          onSubmit: (stopDialogApi) => {
            mediaRecorder?.stop()
            stopDialogApi.close()
          },
          onClose: () => {
            if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
          },
        })
      })
      .catch(() => {
        editor.notificationManager.open({
          text: 'Mikrofon erişimi reddedildi.',
          type: 'error',
          timeout: 4000,
        })
      })
  }

  startRecording()
}

export function registerAudioMenuButton(editor: Editor): void {
  editor.ui.registry.addIcon(
    'ml-audio',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
  )
  editor.ui.registry.addMenuButton('audiomenu', {
    icon: 'ml-audio',
    tooltip: 'Ses ekle',
    fetch: (callback) => {
      callback([
        {
          type: 'menuitem',
          text: 'Dosyadan yükle',
          onAction: () => uploadAudio(editor),
        },
        {
          type: 'menuitem',
          text: 'Mikrofon kaydı',
          onAction: () => recordAudio(editor),
        },
      ])
    },
  })
}
