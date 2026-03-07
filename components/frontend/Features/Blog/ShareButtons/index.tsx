'use client'

import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook, faLinkedin, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { faLink, faCheck } from '@fortawesome/free-solid-svg-icons'

interface ShareButtonsProps {
  title?: string
  description?: string
  url?: string
}

const ShareButtons = ({ title = '', description = '', url }: ShareButtonsProps) => {
  const { t } = useTranslation()
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const [copied, setCopied] = useState(false)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Truncate description if longer than 100 characters
  const shortDescription =
    description.length > 100 ? description.substring(0, 97) + '...' : description
  const textToShare = useMemo(
    () => `${title}\n\n${shortDescription}\n\n${currentUrl}`,
    [title, shortDescription, currentUrl]
  )

  const shareLinks = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`,
    }),
    [currentUrl, textToShare]
  )

  const handleCopyShortLink = useCallback(async () => {
    setLoading(true)
    try {
      let urlToCopy = shortUrl
      if (!urlToCopy) {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl }),
        })
        const data = await res.json()
        urlToCopy = data.shortUrl
        setShortUrl(data.shortUrl)
      }
      await navigator.clipboard.writeText(urlToCopy!)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [currentUrl, shortUrl])

  return (
    <div className="flex gap-2">
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-primary"
      >
        <FontAwesomeIcon icon={faFacebook} size="lg" />
      </a>

      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-info"
      >
        <FontAwesomeIcon icon={faXTwitter} size="lg" />
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-accent"
      >
        <FontAwesomeIcon icon={faLinkedin} size="lg" />
      </a>

      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-success"
      >
        <FontAwesomeIcon icon={faWhatsapp} size="lg" />
      </a>

      <button
        onClick={handleCopyShortLink}
        disabled={loading}
        title={t('admin.share.copy_short_link')}
        className="btn btn-circle btn-outline btn-sm hover:btn-neutral"
      >
        <FontAwesomeIcon icon={copied ? faCheck : faLink} size="lg" className={copied ? 'text-success' : ''} />
      </button>
    </div>
  )
}

export default ShareButtons
