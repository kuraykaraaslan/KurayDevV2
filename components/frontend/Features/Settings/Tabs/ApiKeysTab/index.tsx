'use client'

import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKey,
  faPlus,
  faTrash,
  faCopy,
  faEye,
  faEyeSlash,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import type { ApiKeyResponse } from '@/dtos/ApiKeyDTO'

interface NewKeyReveal {
  rawKey: string
  visible: boolean
}

export default function ApiKeysTab() {
  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Create-form state
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [creating, setCreating] = useState(false)

  // After creation: show raw key once
  const [newKey, setNewKey] = useState<NewKeyReveal | undefined>(undefined)

  // Confirmation for delete
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/api/auth/me/api-keys')
      setApiKeys(res.data.apiKeys ?? [])
    } catch {
      toast.error('API anahtarları yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchKeys()
  }, [fetchKeys])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Anahtar adı zorunludur')

    setCreating(true)
    try {
      const payload: Record<string, string> = { name: name.trim() }
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString()

      const res = await axiosInstance.post('/api/auth/me/api-keys', payload)
      setNewKey({ rawKey: res.data.rawKey as string, visible: false })
      setApiKeys((prev) => [res.data.apiKey as ApiKeyResponse, ...prev])
      setName('')
      setExpiresAt('')
      toast.success('API anahtarı oluşturuldu')
    } catch {
      toast.error('API anahtarı oluşturulamadı')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (apiKeyId: string) => {
    setDeletingId(apiKeyId)
    try {
      await axiosInstance.delete(`/api/auth/me/api-keys/${apiKeyId}`)
      setApiKeys((prev) => prev.filter((k) => k.apiKeyId !== apiKeyId))
      toast.success('API anahtarı silindi')
    } catch {
      toast.error('API anahtarı silinemedi')
    } finally {
      setDeletingId(undefined)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Panoya kopyalandı'))
  }

  return (
    <div className="space-y-6">
      {/* ── Create Key Form ─────────────────────────────────────────────── */}
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
        <FormHeader title="Yeni API Anahtarı Oluştur" titleClassName="text-lg" />
        <p className="text-sm text-base-content/70 -mt-4">
          API anahtarları, uygulamalarınızın hesabınıza programatik olarak erişmesini sağlar.
          Anahtarı yalnızca oluşturulduğu anda görebilirsiniz.
        </p>

        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Anahtar Adı</span>
            </label>
            <input
              type="text"
              placeholder="Örn: CI/CD Pipeline, Mobil Uygulama"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Son Kullanma Tarihi</span>
              <span className="label-text-alt text-base-content/50">İsteğe bağlı</span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn btn-primary w-full"
          >
            {creating ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} />
                Anahtar Oluştur
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── New Key Reveal Banner ────────────────────────────────────────── */}
      {newKey && (
        <div
          role="alert"
          className="alert alert-warning border border-warning shadow-sm flex-col items-start gap-3"
        >
          <div className="font-semibold text-sm">
            ⚠️ Bu anahtar yalnızca bir kez gösterilecek. Şimdi kopyalayın!
          </div>
          <div className="flex items-center gap-2 w-full">
            <code className="flex-1 font-mono text-sm bg-base-200 text-base-content rounded px-3 py-2 break-all">
              {newKey.visible ? newKey.rawKey : '•'.repeat(newKey.rawKey.length)}
            </code>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setNewKey((prev) => prev ? { ...prev, visible: !prev.visible } : prev)}
              title={newKey.visible ? 'Gizle' : 'Göster'}
            >
              <FontAwesomeIcon icon={newKey.visible ? faEyeSlash : faEye} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => copyToClipboard(newKey.rawKey)}
              title="Kopyala"
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
          </div>
          <button
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => setNewKey(undefined)}
          >
            Tamam, sakladım
          </button>
        </div>
      )}

      {/* ── Existing Keys List ──────────────────────────────────────────── */}
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-4">
        <FormHeader title="Mevcut API Anahtarları" titleClassName="text-lg" />

        {loading ? (
          <div className="flex justify-center py-8">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-base-content/40" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-base-content/40">
            <FontAwesomeIcon icon={faKey} className="text-4xl" />
            <p className="text-sm">Henüz API anahtarı oluşturulmadı</p>
          </div>
        ) : (
          <ul className="divide-y divide-base-200">
            {apiKeys.map((key) => (
              <li key={key.apiKeyId} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-base-200 text-base-content/60">
                    <FontAwesomeIcon icon={faKey} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{key.name}</p>
                    <p className="text-xs text-base-content/50 font-mono">{key.prefix}••••••••••••••••••••</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs text-base-content/40">
                        Oluşturulma:{' '}
                        {new Date(key.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                      {key.lastUsedAt && (
                        <span className="text-xs text-base-content/40">
                          Son kullanım:{' '}
                          {new Date(key.lastUsedAt).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      {key.expiresAt && (
                        <span
                          className={`text-xs ${new Date(key.expiresAt) < new Date() ? 'text-error' : 'text-base-content/40'}`}
                        >
                          {new Date(key.expiresAt) < new Date() ? '⚠ Süresi doldu' : `Son: ${new Date(key.expiresAt).toLocaleDateString('tr-TR')}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={deletingId === key.apiKeyId}
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                  onClick={() => handleDelete(key.apiKeyId)}
                  title="Anahtarı iptal et"
                >
                  {deletingId === key.apiKeyId ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
