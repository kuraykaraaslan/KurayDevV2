'use client'

import React, { useMemo } from 'react'

export interface ScoreRule {
  /** Short label shown as a chip (keep ≤ 20 chars) */
  label: string
  /** Returns true when the rule passes for the given value */
  check: (value: string) => boolean
  /** Weight of this rule in the total score (arbitrary units, component converts to %) */
  points: number
  /** Optional tooltip text shown on hover */
  hint?: string
}

export interface ContentScoreBarProps {
  /** The current string value to evaluate */
  value: string
  /** Scoring rules — prefer stable references (module-level constants) to avoid extra recalculations */
  rules: ScoreRule[]
  /** Optional label shown next to the score */
  label?: string
  className?: string
}

type Tier = 'great' | 'ok' | 'poor'

const TIERS: Record<Tier, { bar: string; ring: string; text: string; bg: string; dot: string; label: string }> = {
  great: {
    bar: 'bg-success',
    ring: 'ring-success/30',
    text: 'text-success',
    bg: 'bg-success/10',
    dot: 'bg-success',
    label: 'İyi',
  },
  ok: {
    bar: 'bg-warning',
    ring: 'ring-warning/30',
    text: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
    label: 'Orta',
  },
  poor: {
    bar: 'bg-error',
    ring: 'ring-error/30',
    text: 'text-error',
    bg: 'bg-error/10',
    dot: 'bg-error',
    label: 'Zayıf',
  },
}

const ContentScoreBar: React.FC<ContentScoreBarProps> = ({
  value,
  rules,
  label,
  className = '',
}) => {
  const { score, results } = useMemo(() => {
    let earned = 0
    let total = 0
    const results = rules.map((rule) => {
      const pass = rule.check(value)
      if (pass) earned += rule.points
      total += rule.points
      return { label: rule.label, pass, hint: rule.hint }
    })
    return {
      score: total > 0 ? Math.round((earned / total) * 100) : 0,
      results,
    }
  }, [value, rules])

  const tier: Tier = score >= 70 ? 'great' : score >= 40 ? 'ok' : 'poor'
  const t = TIERS[tier]
  const passCount = results.filter((r) => r.pass).length

  return (
    <div
      className={`mt-2 rounded-lg border border-base-content/10 ${t.bg} ring-1 ${t.ring} px-3 pt-2.5 pb-2 flex flex-col gap-2 transition-colors duration-300 ${className}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${t.dot} shrink-0`} />
        {label && (
          <span className="text-xs font-semibold text-base-content/60 tracking-wide uppercase">
            {label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`text-[11px] font-medium ${t.text} opacity-70`}>{t.label}</span>
          <span
            className={`text-sm font-bold tabular-nums leading-none ${t.text}`}
            aria-label={`${label ?? 'İçerik skoru'}: ${score}%`}
          >
            {score}%
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative h-1.5 w-full rounded-full bg-base-content/10 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${t.bar} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Rule chips */}
      <div className="flex flex-wrap gap-1">
        {results.map((r, i) => (
          <span
            key={i}
            title={r.hint}
            className={[
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none transition-opacity duration-200 cursor-default select-none',
              r.pass
                ? `${t.bg} ${t.text} ring-1 ${t.ring}`
                : 'bg-base-content/5 text-base-content/30 ring-1 ring-base-content/10',
            ].join(' ')}
          >
            {r.pass && (
              <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {r.label}
          </span>
        ))}
      </div>

      {/* Footer sub-text */}
      <p className="text-[10px] text-base-content/30 leading-none">
        {passCount} / {results.length} kural sağlandı
      </p>
    </div>
  )
}

export default ContentScoreBar
