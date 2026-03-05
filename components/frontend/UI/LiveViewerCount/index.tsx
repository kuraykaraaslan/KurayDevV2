import ViewerService from '@/services/ViewerService'
import ViewerHeartbeat from './Heartbeat'

interface Props {
  slug: string
}

/** Server component — fetches initial viewer count from Redis, delegates display + heartbeat to client. */
export default async function LiveViewerCount({ slug }: Props) {
  const count = await ViewerService.getCount(slug).catch(() => 0)
  return <ViewerHeartbeat slug={slug} initialCount={count} />
}
