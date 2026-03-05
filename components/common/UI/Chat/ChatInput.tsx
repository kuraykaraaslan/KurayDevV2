'use client'

import { KeyboardEvent, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  /** Disable the input & button */
  disabled?: boolean
  /** Show spinner on send button */
  sending?: boolean
  placeholder?: string
  sendLabel?: string
  /** Auto-focus when the component mounts or when `autoFocusTrigger` changes */
  autoFocusTrigger?: unknown
  /** Container className */
  className?: string
  /** Variant: 'compact' for chat widget, 'full' for admin pages */
  variant?: 'compact' | 'full'
}

const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  sending = false,
  placeholder = 'Type a message...',
  sendLabel,
  autoFocusTrigger,
  className = '',
  variant = 'compact',
}: ChatInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocusTrigger !== undefined) {
      inputRef.current?.focus()
    }
  }, [autoFocusTrigger])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const isCompact = variant === 'compact'

  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || sending}
        className={`textarea textarea-bordered flex-1 resize-none ${
          isCompact
            ? 'textarea-sm min-h-[40px] max-h-[100px] leading-snug'
            : 'min-h-[48px] max-h-[120px]'
        }`}
        rows={1}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim() || sending}
        className={`btn btn-primary ${isCompact ? 'btn-sm btn-circle' : ''}`}
        aria-label="Send"
      >
        {sending ? (
          <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
        ) : (
          <FontAwesomeIcon icon={faPaperPlane} className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
        {sendLabel && !isCompact && <span>{sendLabel}</span>}
      </button>
    </div>
  )
}

export default ChatInput
