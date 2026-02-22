import UserSessionService from '@/services/AuthService/UserSessionService'
import InAppNotificationService from '@/services/InAppNotificationService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user } = await UserSessionService.authenticateUserByRequest({
    request,
    requiredUserRole: 'ADMIN',
  })

  const subscriber = InAppNotificationService.createSubscriber()
  const channel = `notifications:${user.userId}`

  const stream = new ReadableStream({
    start(controller) {
      const encode = (data: string) => new TextEncoder().encode(data)

      // Send a heartbeat comment every 25 s to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25_000)

      subscriber.subscribe(channel, (err) => {
        if (err) {
          controller.error(err)
          return
        }
      })

      subscriber.on('message', (_ch: string, message: string) => {
        try {
          controller.enqueue(encode(`data: ${message}\n\n`))
        } catch {
          // client disconnected
        }
      })

      // Clean up when the client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        subscriber.unsubscribe(channel)
        subscriber.disconnect()
        controller.close()
      })
    },
    cancel() {
      subscriber.unsubscribe(channel)
      subscriber.disconnect()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
