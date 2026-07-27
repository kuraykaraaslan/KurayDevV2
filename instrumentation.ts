/**
 * Next.js instrumentation hook — runs once when the server process starts.
 *
 * Warms up the local embedding model (transformers.js / nomic-embed-text) so the
 * first chatbot message doesn't pay the multi-second cold-start model load inside
 * a live request. Fire-and-forget: boot is not blocked by the warmup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { default: LocalEmbedService } = await import('@/services/PostService/LocalEmbedService')
  const { default: Logger } = await import('@/libs/logger')

  Logger.info('[Instrumentation] Warming up local embedding model...')
  LocalEmbedService.embed(['warmup'])
    .then(() => Logger.info('[Instrumentation] Embedding model warm-up complete.'))
    .catch((err) => Logger.warn(`[Instrumentation] Embedding warm-up failed: ${err}`))
}
