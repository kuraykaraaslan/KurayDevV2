'use client'

import { useMemo, useState, useCallback } from 'react'
import { HeadlessModal } from '@/components/admin/UI/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFacebook,
  faXTwitter,
  faLinkedin,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons'
import { faCopy, faCheck, faExternalLink } from '@fortawesome/free-solid-svg-icons'
import { PostWithData } from '@/types/content/BlogTypes'

const FRONTEND_URL = process.env.NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000'

interface PostShareModalProps {
  post: PostWithData
  onClose: () => void
}

const PostShareModal = ({ post, onClose }: PostShareModalProps) => {
  const [copied, setCopied] = useState(false)

  const postUrl = useMemo(
    () => `${FRONTEND_URL}/en/blog/${post.category.slug}/${post.slug}`,
    [post]
  )

  const textToShare = useMemo(
    () =>
      `${post.title}${post.description ? `\n\n${post.description.substring(0, 120)}...` : ''}\n\n${postUrl}`,
    [post, postUrl]
  )

  const shareLinks = useMemo(
    () => ({
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`,
    }),
    [postUrl, textToShare]
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const input = document.createElement('input')
      input.value = postUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [postUrl])

  const platforms = [
    {
      key: 'twitter',
      label: 'X (Twitter)',
      icon: faXTwitter,
      href: shareLinks.twitter,
      className: 'hover:bg-base-200',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: faLinkedin,
      href: shareLinks.linkedin,
      className: 'hover:bg-blue-50 dark:hover:bg-blue-950',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: faFacebook,
      href: shareLinks.facebook,
      className: 'hover:bg-blue-50 dark:hover:bg-blue-950',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: faWhatsapp,
      href: shareLinks.whatsapp,
      className: 'hover:bg-green-50 dark:hover:bg-green-950',
    },
  ]

  return (
    <HeadlessModal
      open={true}
      onClose={onClose}
      title="Share Post"
      size="sm"
    >
      {/* Post title */}
      <p className="text-sm text-base-content/60 mb-4 line-clamp-2">{post.title}</p>

      {/* URL + copy */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 bg-base-200 rounded-lg px-3 py-2 text-xs text-base-content/70 truncate font-mono">
          {postUrl}
        </div>
        <button
          onClick={handleCopy}
          className="btn btn-sm btn-ghost shrink-0"
          title="Copy link"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? 'text-success' : ''} />
        </button>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-ghost shrink-0"
          title="Open post"
        >
          <FontAwesomeIcon icon={faExternalLink} />
        </a>
      </div>

      {/* Platform buttons */}
      <div className="grid grid-cols-2 gap-2">
        {platforms.map(({ key, label, icon, href, className }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-base-200 transition-colors cursor-pointer ${className}`}
          >
            <FontAwesomeIcon icon={icon} className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </a>
        ))}
      </div>
    </HeadlessModal>
  )
}

export default PostShareModal
