import ViewerService from '@/services/ViewerService'
import redis from '@/libs/redis'

// ViewerService uses redis.pipeline() + redis.zcard() directly.
// We override the global redis mock for this file to include pipeline support.

const mockPipeline = {
  zadd: jest.fn(),
  zremrangebyscore: jest.fn(),
  expire: jest.fn(),
  exec: jest.fn(),
}

jest.mock('@/libs/redis', () => ({
  pipeline: jest.fn(() => mockPipeline),
  zcard: jest.fn(),
}))

const redisMock = redis as jest.Mocked<typeof redis> & {
  pipeline: jest.Mock
  zcard: jest.Mock
}

beforeEach(() => {
  jest.clearAllMocks()
  // Make pipeline chainable
  mockPipeline.zadd.mockReturnValue(mockPipeline)
  mockPipeline.zremrangebyscore.mockReturnValue(mockPipeline)
  mockPipeline.expire.mockReturnValue(mockPipeline)
  mockPipeline.exec.mockResolvedValue([])
})

// ── heartbeat ─────────────────────────────────────────────────────────────────

describe('ViewerService.heartbeat', () => {
  it('registers a new viewer and returns active count', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(1)

    const count = await ViewerService.heartbeat('my-post', 'token-abc')

    expect(redisMock.pipeline).toHaveBeenCalled()
    expect(mockPipeline.zadd).toHaveBeenCalledWith('viewers:my-post', expect.any(Number), 'token-abc')
    expect(mockPipeline.zremrangebyscore).toHaveBeenCalled()
    expect(mockPipeline.expire).toHaveBeenCalledWith('viewers:my-post', 90)
    expect(mockPipeline.exec).toHaveBeenCalled()
    expect(count).toBe(1)
  })

  it('upserts same token and returns updated count (idempotent for same viewer)', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(1)

    // Two heartbeats with the same token should both succeed
    await ViewerService.heartbeat('my-post', 'token-abc')
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(1)
    const count = await ViewerService.heartbeat('my-post', 'token-abc')

    // zadd upserts — count stays at 1 not 2
    expect(count).toBe(1)
    expect(mockPipeline.zadd).toHaveBeenCalledTimes(2)
  })

  it('returns count of 2 when two distinct tokens are active', async () => {
    ;(redisMock.zcard as jest.Mock)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)

    await ViewerService.heartbeat('my-post', 'token-1')
    const count = await ViewerService.heartbeat('my-post', 'token-2')

    expect(count).toBe(2)
  })

  it('evicts stale viewers by calling zremrangebyscore with a cutoff', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(0)

    const before = Date.now()
    await ViewerService.heartbeat('my-post', 'token-stale')
    const after = Date.now()

    const [, scoreLow, scoreHigh] = mockPipeline.zremrangebyscore.mock.calls[0]
    expect(scoreLow).toBe(0)
    // cutoff should be roughly now - 45000 ms
    expect(scoreHigh).toBeGreaterThanOrEqual(before - 45_000)
    expect(scoreHigh).toBeLessThanOrEqual(after - 45_000 + 100)
  })

  it('stores viewer under key scoped to slug (viewers:<slug>)', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(1)

    await ViewerService.heartbeat('hello-world', 'tok')

    expect(mockPipeline.zadd).toHaveBeenCalledWith('viewers:hello-world', expect.any(Number), 'tok')
    expect(mockPipeline.expire).toHaveBeenCalledWith('viewers:hello-world', expect.any(Number))
  })

  it('handles anonymous viewer token (empty-string slug still produces a key)', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(1)

    await ViewerService.heartbeat('', 'anon-token')

    expect(mockPipeline.zadd).toHaveBeenCalledWith('viewers:', expect.any(Number), 'anon-token')
  })
})

// ── getCount ──────────────────────────────────────────────────────────────────

describe('ViewerService.getCount', () => {
  it('returns the current active viewer count without adding a viewer', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(3)

    const count = await ViewerService.getCount('my-post')

    expect(count).toBe(3)
    // Should evict stale entries but NOT call zadd
    expect(mockPipeline.zremrangebyscore).toHaveBeenCalled()
    expect(mockPipeline.zadd).not.toHaveBeenCalled()
  })

  it('returns 0 when no active viewers remain after eviction', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(0)

    const count = await ViewerService.getCount('empty-post')
    expect(count).toBe(0)
  })

  it('still resets TTL even when count is zero', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(0)

    await ViewerService.getCount('my-post')

    expect(mockPipeline.expire).toHaveBeenCalledWith('viewers:my-post', 90)
  })

  it('scopes count key to the given slug', async () => {
    ;(redisMock.zcard as jest.Mock).mockResolvedValueOnce(5)

    await ViewerService.getCount('some-other-slug')

    expect(mockPipeline.expire).toHaveBeenCalledWith('viewers:some-other-slug', expect.any(Number))
    expect(redisMock.zcard).toHaveBeenCalledWith('viewers:some-other-slug')
  })
})
