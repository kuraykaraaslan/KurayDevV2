'use client'

import { useEffect, useState, useCallback } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDesktop,
  faMobile,
  faTablet,
  faGlobe,
  faLocationDot,
  faTrash,
  faRotateRight,
  faBan,
} from '@fortawesome/free-solid-svg-icons'

import { SessionResponse } from '@/types/user/UserSessionTypes'

function DeviceIcon({ device }: { device: string | null }) {
  const d = device?.toLowerCase() ?? ''
  if (d.includes('mobile') || d.includes('phone')) return <FontAwesomeIcon icon={faMobile} className="w-5 h-5" />
  if (d.includes('tablet')) return <FontAwesomeIcon icon={faTablet} className="w-5 h-5" />
  return <FontAwesomeIcon icon={faDesktop} className="w-5 h-5" />
}

export default function SessionsTab() {
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [terminating, setTerminating] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/api/auth/sessions')
      setSessions(res.data.sessions)
    } catch {
      toast.error('Oturumlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const terminateSession = async (sessionId: string) => {
    if (!confirm('Bu oturumu sonlandırmak istediğinizden emin misiniz?')) return
    setTerminating(sessionId)
    try {
      await axiosInstance.delete(`/api/auth/sessions/${sessionId}`)
      toast.success('Oturum sonlandırıldı')
      setSessions((prev) => prev.filter((s) => s.userSessionId !== sessionId))
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Oturum sonlandırılamadı')
    } finally {
      setTerminating(null)
    }
  }

  const terminateAllOthers = async () => {
    if (!confirm('Mevcut oturum dışındaki tüm oturumları sonlandırmak istediğinizden emin misiniz?')) return
    setTerminatingAll(true)
    try {
      await axiosInstance.delete('/api/auth/sessions')
      toast.success('Diğer tüm oturumlar sonlandırıldı')
      setSessions((prev) => prev.filter((s) => s.isCurrent))
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'İşlem başarısız')
    } finally {
      setTerminatingAll(false)
    }
  }

  const terminateAll = async () => {
    if (!confirm('Tüm oturumlar sonlandırılacak ve çıkış yapılacak. Devam etmek istiyor musunuz?')) return
    setTerminatingAll(true)
    try {
      await axiosInstance.delete('/api/auth/sessions?all=true')
      toast.success('Tüm oturumlar sonlandırıldı')
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'İşlem başarısız')
      setTerminatingAll(false)
    }
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Aktif Oturumlar</h2>
          <p className="text-sm text-base-content/60 mt-0.5">
            Hesabınıza bağlı cihaz ve tarayıcıları yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="btn btn-sm btn-ghost"
            title="Yenile"
          >
            <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
          </button>
          {otherSessions.length > 0 && (
            <button
              onClick={terminateAllOthers}
              disabled={terminatingAll}
              className="btn btn-sm btn-error btn-outline gap-1"
            >
              <FontAwesomeIcon icon={faBan} />
              {terminatingAll ? 'Sonlandırılıyor...' : 'Diğerlerini Kapat'}
            </button>
          )}
          {sessions.length > 0 && (
            <button
              onClick={terminateAll}
              disabled={terminatingAll}
              className="btn btn-sm btn-error gap-1"
            >
              <FontAwesomeIcon icon={faTrash} />
              {terminatingAll ? 'Sonlandırılıyor...' : 'Hepsini Sonlandır'}
            </button>
          )}
        </div>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-base-content/50 text-center py-8">Aktif oturum bulunamadı.</p>
      ) : (
        <div className="space-y-3">
          {sessions
            .sort((a, _b) => (a.isCurrent ? -1 : 1))
            .map((session) => (
              <div
                key={session.userSessionId}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  session.isCurrent
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-base-200 bg-base-100 hover:bg-base-50'
                }`}
              >
                {/* Device icon */}
                <div
                  className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.isCurrent ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50'
                  }`}
                >
                  <DeviceIcon device={session.device} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {session.browser ?? 'Bilinmeyen tarayıcı'}
                      {session.os ? ` / ${session.os}` : ''}
                    </span>
                    {session.isCurrent && (
                      <span className="badge badge-primary badge-sm">Mevcut</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {(session.city || session.country) && (
                      <span className="flex items-center gap-1 text-xs text-base-content/50">
                        <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                        {[session.city, session.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {session.ip && (
                      <span className="flex items-center gap-1 text-xs text-base-content/50">
                        <FontAwesomeIcon icon={faGlobe} className="w-3 h-3" />
                        {session.ip}
                      </span>
                    )}
                    <span className="text-xs text-base-content/40">
                      Giriş: {new Date(session.createdAt).toLocaleString('tr-TR')}
                    </span>
                    <span className="text-xs text-base-content/40">
                      Süre: {new Date(session.sessionExpiry).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {/* Terminate button */}
                {!session.isCurrent && (
                  <button
                    onClick={() => terminateSession(session.userSessionId)}
                    disabled={terminating === session.userSessionId}
                    className="btn btn-sm btn-ghost text-error shrink-0"
                    title="Oturumu sonlandır"
                  >
                    {terminating === session.userSessionId ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} />
                    )}
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
