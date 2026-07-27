'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RADIUS_CLASS } from './constants'
import { parseButtons } from './utils'
import { CloseBtn } from './CloseBtn'
import type { CardProps } from './types'

export function PopupCard({ p, isEditor, onClose, animStyle, onAnimEnd }: CardProps) {
  const title = (p.title as string | undefined) ?? ''
  const desc = p.description as string | undefined
  const image = p.image as string | undefined
  const imageAction = (p.imageAction as string) || ''
  const imageActionUrl = (p.imageActionUrl as string) || ''
  const imageActionOpenNewTab = (p.imageActionOpenNewTab as boolean) || false
  const buttons = parseButtons(p.buttons)
  const bgColor = (p.backgroundColor as string) || 'var(--color-neutral)'
  const radius = (p.borderRadius as string) || 'lg'
  const closePos = (p.closeButtonPosition as string) || 'top-right'
  const clStyle = (p.closeButtonStyle as string) || 'circle'
  const clSize = (p.closeButtonSize as string) || 'md'
  const clColor = (p.closeButtonColor as string) || '#ffffff'
  const clBg = (p.closeButtonBg as string) || '#000000'

  const hasContent = title || desc || buttons.length > 0
  const radiusClass = RADIUS_CLASS[radius] ?? 'rounded-lg'

  return (
    <div className={`relative overflow-hidden shadow-2xl ${radiusClass}`}
      style={animStyle} onAnimationEnd={onAnimEnd}>

      {image && (
        <div className="relative w-full aspect-video"
          onClick={() => {
            if (imageAction === 'link') {
              document.getElementById('popup-image')?.style.setProperty('cursor', 'pointer')
              if (imageActionOpenNewTab) {
                window.open(imageActionUrl, '_blank')
              } else {
                window.location.href = imageActionUrl
              }
            } else if (imageAction === 'modal') {
              onClose?.()
            }
          }}>
          <Image src={image} alt={title || 'popup'} fill className="object-cover"
            sizes="(max-width:640px) 100vw, 800px" />
        </div>
      )}

      {hasContent && (
        <div className="p-5" style={{ backgroundColor: bgColor }}>
          {(title || desc) && (
            <div className={closePos.startsWith('top') && closePos !== 'hidden' ? 'pr-10' : ''}>
              {title && <p className="font-semibold text-neutral-content text-lg">{title}</p>}
              {desc && <p className="text-neutral-content/70 text-sm mt-1">{desc}</p>}
            </div>
          )}
          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {buttons.map((btn, i) => {
                const s = btn.variant === 'filled'
                  ? { backgroundColor: btn.bgColor, color: btn.textColor }
                  : btn.variant === 'outlined'
                    ? { border: `1.5px solid ${btn.bgColor}`, color: btn.bgColor, backgroundColor: 'transparent' }
                    : { color: btn.bgColor, backgroundColor: 'transparent' }
                return isEditor
                  ? <span key={i} className="px-4 py-1.5 text-sm font-medium rounded cursor-default" style={s}>{btn.text}</span>
                  : <Link key={i} href={btn.link || '/'} target={btn.openNewTab ? '_blank' : undefined}
                    rel={btn.openNewTab ? 'noopener noreferrer' : undefined}
                    className="px-4 py-2 text-sm font-medium rounded transition-opacity hover:opacity-80" style={s}
                    onClick={onClose}>{btn.text}</Link>
              })}
            </div>
          )}
        </div>
      )}

      <CloseBtn pos={closePos} style={clStyle} size={clSize}
        color={clColor} bgColor={clBg} isEditor={isEditor} onClose={onClose} />
    </div>
  )
}
