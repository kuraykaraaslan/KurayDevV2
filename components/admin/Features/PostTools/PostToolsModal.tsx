'use client'

import { useState, useCallback } from 'react'
import { HeadlessModal } from '@/components/admin/UI/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLink,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faExternalLink,
  faWrench,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons'
import { PostWithData } from '@/types/content/BlogTypes'

export type LinkCheckResult = {
  url: string
  ok: boolean | null // null = CORS / bilinmiyor
  error?: string
}

function extractLinks(html: string): string[] {
  const regex = /(?:href|src)=["']([^"']+)["']/gi
  const links = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const url = match[1]
    if (url.startsWith('http://') || url.startsWith('https://')) links.add(url)
  }
  return Array.from(links)
}

async function checkLink(url: string): Promise<LinkCheckResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // CORS engeli aşmak için — opaque response döner
    })
    clearTimeout(timer)
    // no-cors → type === 'opaque', status === 0 ama istek gitti demek = büyük ihtimalle çalışıyor
    return { url, ok: res.type === 'opaque' || res.ok }
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === 'AbortError') return { url, ok: false, error: 'timeout' }
    // network error → muhtemelen bozuk
    return { url, ok: false, error: err.message }
  }
}

interface PostToolsModalProps {
  post: PostWithData
  onClose: () => void
}

type CheckState = 'idle' | 'loading' | 'done'

const PostToolsModal = ({ post, onClose }: PostToolsModalProps) => {
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [results, setResults] = useState<LinkCheckResult[]>([])

  const handleCheckLinks = useCallback(async () => {
    setCheckState('loading')
    setResults([])

    // İçerik post prop'undan gelir — ek fetch yok
    let content = post.content ?? ''

    // Eğer liste sayfasından content kısaltılmışsa tam içeriği çek
    if (!content || content.length < 100) {
      try {
        const res = await fetch(`/api/posts/${post.postId}`)
        const data = await res.json()
        content = data.post?.content ?? ''
      } catch {
        setCheckState('done')
        return
      }
    }

    const urls = extractLinks(content)
    if (urls.length === 0) {
      setCheckState('done')
      return
    }

    const results = await Promise.all(urls.map(checkLink))
    setResults(results)
    setCheckState('done')
  }, [post.postId, post.content])

  const broken = results.filter((r) => r.ok === false)
  const ok = results.filter((r) => r.ok === true)

  return (
    <HeadlessModal
      open={true}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <FontAwesomeIcon icon={faWrench} className="text-base-content/50" />
          Post Araçları — {post.title}
        </span>
      }
      size="md"
    >
      {/* ── Bozuk Link Kontrolü ─────────────────────────── */}
      <div className="border border-base-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faLink} className="text-primary" />
            <span className="font-medium text-sm">Bozuk Link Kontrolü</span>
          </div>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleCheckLinks}
            disabled={checkState === 'loading'}
          >
            {checkState === 'loading' ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Kontrol ediliyor...
              </>
            ) : (
              'Kontrol Et'
            )}
          </button>
        </div>

        {checkState === 'idle' && (
          <p className="text-xs text-base-content/40">
            Yazıdaki tüm harici linkleri tek tıkla kontrol et.
          </p>
        )}

        {checkState === 'loading' && (
          <p className="text-xs text-base-content/40 animate-pulse">
            Linkler kontrol ediliyor, lütfen bekleyin...
          </p>
        )}

        {checkState === 'done' && results.length === 0 && (
          <p className="text-xs text-base-content/40">Bu yazıda harici link bulunamadı.</p>
        )}

        {checkState === 'done' && results.length > 0 && (
          <>
            <div className="flex gap-3 mb-3 text-xs">
              <span className="text-success font-medium">{ok.length} çalışıyor</span>
              <span className="text-error font-medium">{broken.length} bozuk</span>
              <span className="text-base-content/40">{results.length} toplam</span>
            </div>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
              {broken.map((r) => <LinkRow key={r.url} result={r} />)}
              {ok.map((r) => <LinkRow key={r.url} result={r} />)}
            </div>
          </>
        )}
      </div>

      {/* Gelecekte buraya yeni araçlar eklenecek */}
    </HeadlessModal>
  )
}

const LinkRow = ({ result }: { result: LinkCheckResult }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
      result.ok === false ? 'bg-error/5' : 'bg-success/5'
    }`}
  >
    <FontAwesomeIcon
      icon={result.ok === false ? faTimesCircle : result.ok === null ? faQuestionCircle : faCheckCircle}
      className={result.ok === false ? 'text-error shrink-0' : result.ok === null ? 'text-warning shrink-0' : 'text-success shrink-0'}
    />
    <span className="truncate flex-1 font-mono text-base-content/70">{result.url}</span>
    {result.error && (
      <span className="shrink-0 text-error font-semibold">
        {result.error === 'timeout' ? 'Timeout' : 'Hata'}
      </span>
    )}
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-ghost btn-xs shrink-0"
    >
      <FontAwesomeIcon icon={faExternalLink} />
    </a>
  </div>
)

export default PostToolsModal
