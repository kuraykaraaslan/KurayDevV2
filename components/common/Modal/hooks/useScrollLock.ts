import { useEffect } from 'react'

export type ScrollLockStrategy = 'auto' | 'html-overflow' | 'body-fixed'

type UseScrollLockOptions = {
  strategy?: ScrollLockStrategy
}

type SavedStyles = {
  htmlOverflow: string
  htmlPaddingRight: string
  bodyPosition: string
  bodyTop: string
  bodyLeft: string
  bodyRight: string
  bodyWidth: string
  bodyOverflow: string
  bodyPaddingRight: string
}

type ResolvedStrategy = Exclude<ScrollLockStrategy, 'auto'>

let lockCount = 0
let savedStyles: SavedStyles | null = null
let appliedStrategy: ResolvedStrategy | null = null
let fixedBodyScrollY = 0

function isIOS(): boolean {
  const ua = navigator.userAgent || ''
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isAppleMobile || isIPadOS
}

function resolveStrategy(strategy?: ScrollLockStrategy): ResolvedStrategy {
  if (strategy === 'body-fixed') return 'body-fixed'
  if (strategy === 'html-overflow') return 'html-overflow'
  // Default + 'auto'
  return isIOS() ? 'body-fixed' : 'html-overflow'
}

function getScrollbarWidth(): number {
  const html = document.documentElement
  return window.innerWidth - html.clientWidth
}

function saveGlobalStyles(): void {
  if (savedStyles) return
  const html = document.documentElement
  const body = document.body
  savedStyles = {
    htmlOverflow: html.style.overflow,
    htmlPaddingRight: html.style.paddingRight,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
  }
}

function applyHtmlOverflowLock(): void {
  const html = document.documentElement

  // Measure scrollbar width before locking so we can compensate.
  // Without this the page content shifts left when the scrollbar disappears.
  const scrollbarWidth = getScrollbarWidth()

  html.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    html.style.paddingRight = `${scrollbarWidth}px`
  }
}

function applyBodyFixedLock(): void {
  const html = document.documentElement
  const body = document.body
  const scrollbarWidth = getScrollbarWidth()

  fixedBodyScrollY = window.scrollY

  // Also lock the root element to prevent rubber-banding/scroll leaks.
  html.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    html.style.paddingRight = `${scrollbarWidth}px`
  }

  body.style.position = 'fixed'
  body.style.top = `-${fixedBodyScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`
  }
}

function applyStrategy(strategy: ResolvedStrategy): void {
  if (strategy === 'body-fixed') applyBodyFixedLock()
  else applyHtmlOverflowLock()
}

function acquireScrollLock(strategy: ResolvedStrategy): void {
  saveGlobalStyles()
  lockCount += 1

  if (!appliedStrategy) {
    appliedStrategy = strategy
    applyStrategy(strategy)
    return
  }

  // If any nested lock requests the more robust strategy, upgrade.
  if (appliedStrategy === 'html-overflow' && strategy === 'body-fixed') {
    appliedStrategy = 'body-fixed'
    applyStrategy('body-fixed')
  }
}

function releaseScrollLock(): void {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  if (!savedStyles) {
    appliedStrategy = null
    fixedBodyScrollY = 0
    return
  }

  const html = document.documentElement
  const body = document.body

  html.style.overflow = savedStyles.htmlOverflow
  html.style.paddingRight = savedStyles.htmlPaddingRight

  body.style.position = savedStyles.bodyPosition
  body.style.top = savedStyles.bodyTop
  body.style.left = savedStyles.bodyLeft
  body.style.right = savedStyles.bodyRight
  body.style.width = savedStyles.bodyWidth
  body.style.overflow = savedStyles.bodyOverflow
  body.style.paddingRight = savedStyles.bodyPaddingRight

  const shouldRestoreScroll = appliedStrategy === 'body-fixed'
  const restoreY = fixedBodyScrollY

  savedStyles = null
  appliedStrategy = null
  fixedBodyScrollY = 0

  if (shouldRestoreScroll) {
    window.scrollTo(0, restoreY)
  }
}

export function useScrollLock(locked: boolean, options?: UseScrollLockOptions): void {
  const strategy = options?.strategy

  useEffect(() => {
    if (!locked) return
    const resolved = resolveStrategy(strategy)
    acquireScrollLock(resolved)
    return () => releaseScrollLock()
  }, [locked, strategy])
}
