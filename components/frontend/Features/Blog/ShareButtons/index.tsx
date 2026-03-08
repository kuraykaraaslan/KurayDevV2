'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook, faLinkedin, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { faLink, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons'

interface ShareButtonsProps {
  title?: string
  description?: string
  url?: string
  /** Post ID — when provided the component uses /api/posts/[postId]/share to generate the short link */
  postId?: string
  /** Locale string forwarded to the share endpoint so the short link resolves to the correct locale URL */
  lang?: string
}

const ShareButtons = ({ title = '', description = '', url, postId, lang = 'en' }: ShareButtonsProps) => {
  const { t } = useTranslation()
  const fallbackUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  /** Fetch the short link once on mount (fire-and-forget, non-blocking) */
  const fetchShortUrl = useCallback(async () => {
    if (shortUrl || loading) return
    setLoading(true)
    try {
      let data: { shortUrl?: string }
      if (postId) {
        const res = await fetch(`/api/posts/${postId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang }),
        })
        data = await res.json()
      } else {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fallbackUrl }),
        })
        data = await res.json()
      }
      if (data.shortUrl) setShortUrl(data.shortUrl)
    } catch {
      // non-fatal — share buttons still work with the full URL
    } finally {
      setLoading(false)
    }
  }, [postId, lang, fallbackUrl, shortUrl, loading])

  useEffect(() => {
    void fetchShortUrl()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** URL used in all share actions — short link if available, full URL otherwise */
  const shareUrl = shortUrl ?? fallbackUrl

  const shortDescription =
    description.length > 100 ? description.substring(0, 97) + '...' : description

  const textToShare = useMemo(
    () => `${title}\n\n${shortDescription}\n\n${shareUrl}`,
    [title, shortDescription, shareUrl]
  )

  const shareLinks = useMemo(
    () => ({
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`,
    }),
    [shareUrl, textToShare]
  )

  const handleCopyShortLink = useCallback(async () => {
    const urlToCopy = shortUrl ?? fallbackUrl
    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [shortUrl, fallbackUrl])

  return (
    <div className="flex gap-2">
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-info"
        title="X (Twitter)"
      >
        <FontAwesomeIcon icon={faXTwitter} size="lg" />
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-accent"
        title="LinkedIn"
      >
        <FontAwesomeIcon icon={faLinkedin} size="lg" />
      </a>

      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-success"
        title="WhatsApp"
      >
        <FontAwesomeIcon icon={faWhatsapp} size="lg" />
      </a>

      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-primary"
        title="Facebook"
      >
        <FontAwesomeIcon icon={faFacebook} size="lg" />
      </a>

      <button
        onClick={handleCopyShortLink}
        disabled={loading}
        title={loading ? t('admin.share.generating') : t('admin.share.copy_short_link')}
        className="btn btn-circle btn-outline btn-sm hover:btn-neutral"
      >
        <FontAwesomeIcon
          icon={loading ? faSpinner : copied ? faCheck : faLink}
          size="lg"
          spin={loading}
          className={copied ? 'text-success' : ''}
        />
      </button>
    </div>
  )
}

export default ShareButtons
