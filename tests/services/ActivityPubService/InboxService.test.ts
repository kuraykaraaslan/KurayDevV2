import InboxService from '@/services/ActivityPubService/InboxService'
import DeliveryService from '@/services/ActivityPubService/DeliveryService'
import ActorService from '@/services/ActivityPubService/ActorService'
import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import ActivityPubMessages from '@/messages/ActivityPubMessages'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    activityPubFollower: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))
jest.mock('@/libs/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}))
jest.mock('@/libs/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))
jest.mock('@/services/ActivityPubService/ActorService', () => ({
  fetchRemoteActor: jest.fn(),
}))
jest.mock('@/services/ActivityPubService/DeliveryService', () => ({
  deliverActivity: jest.fn(),
}))
jest.mock('@/services/ActivityPubService/config', () => ({
  getActorUrl: jest.fn().mockReturnValue('https://site.example/api/activitypub/actor'),
  getSiteUrl: jest.fn().mockReturnValue('https://site.example'),
  getFollowersUrl: jest.fn().mockReturnValue('https://site.example/api/activitypub/followers'),
}))

const prismaMock = prisma as any
const redisMock = redis as jest.Mocked<typeof redis>
const loggerMock = Logger as jest.Mocked<typeof Logger>
const actorMock = ActorService as jest.Mocked<typeof ActorService>
const deliveryMock = DeliveryService as jest.Mocked<typeof DeliveryService>

/** Minimal APActor shape satisfying the full interface. */
const makeRemoteActor = (sharedInbox?: string) => ({
  id: 'https://remote/actor',
  type: 'Person',
  preferredUsername: 'remote-user',
  inbox: 'https://remote/inbox',
  outbox: 'https://remote/outbox',
  followers: 'https://remote/followers',
  following: 'https://remote/following',
  publicKey: { id: 'https://remote/actor#main-key', owner: 'https://remote/actor', publicKeyPem: 'pem' },
  endpoints: sharedInbox ? { sharedInbox } : undefined,
})

describe('InboxService.handleInboxActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.activityPubFollower.upsert.mockResolvedValue({})
    prismaMock.activityPubFollower.deleteMany.mockResolvedValue({ count: 1 })
  })

  it('handles Follow activity and delivers Accept', async () => {
    actorMock.fetchRemoteActor.mockResolvedValue(makeRemoteActor())
    deliveryMock.deliverActivity.mockResolvedValue(undefined)

    const activity = {
      type: 'Follow',
      actor: 'https://remote/actor',
    }

    await InboxService.handleInboxActivity(activity)
    expect(deliveryMock.deliverActivity).toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Accepted Follow'))
  })

  it('logs error and throws if actor fetch fails during Follow', async () => {
    actorMock.fetchRemoteActor.mockRejectedValue(new Error('fail'))
    const activity = {
      type: 'Follow',
      actor: 'https://remote/actor',
    }
    await expect(InboxService.handleInboxActivity(activity)).rejects.toThrow(ActivityPubMessages.ACTOR_FETCH_FAILED)
    expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch actor'))
  })

  it('handles Undo Follow and removes follower', async () => {
    const activity = {
      type: 'Undo',
      actor: 'https://remote/actor',
      object: { type: 'Follow' },
    }
    await InboxService.handleInboxActivity(activity)
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Removed follower'))
  })

  it('handles Delete and removes follower/actor cache', async () => {
    const activity = {
      type: 'Delete',
      actor: 'https://remote/actor',
    }
    await InboxService.handleInboxActivity(activity)
    expect(redisMock.del).toHaveBeenCalledWith('activitypub:actor:https://remote/actor')
  })

  it('logs info for unhandled activity type', async () => {
    const activity = {
      type: 'UnknownType',
      actor: 'https://remote/actor',
    }
    await InboxService.handleInboxActivity(activity)
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Received unhandled activity type'))
  })
})

// ── Phase 22: InboxService ActivityPub extensions ─────────────────────────

describe('InboxService — Phase 22 ActivityPub extensions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.activityPubFollower.upsert.mockResolvedValue({})
    prismaMock.activityPubFollower.deleteMany.mockResolvedValue({ count: 1 })
  })

  // ── unknown activity type: ignored / logged ───────────────────────────
  describe('handleInboxActivity — unknown activity type', () => {
    it('does not throw for unrecognised activity types', async () => {
      await expect(
        InboxService.handleInboxActivity({ type: 'Like', actor: 'https://remote/actor' })
      ).resolves.not.toThrow()
    })

    it('logs the unhandled type to Logger.info', async () => {
      await InboxService.handleInboxActivity({ type: 'Announce', actor: 'https://remote/actor' })
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Received unhandled activity type')
      )
    })

    it('does not call prisma or delivery for unknown types', async () => {
      await InboxService.handleInboxActivity({ type: 'Block', actor: 'https://remote/actor' })
      expect(prismaMock.activityPubFollower.upsert).not.toHaveBeenCalled()
      expect(prismaMock.activityPubFollower.deleteMany).not.toHaveBeenCalled()
      expect(deliveryMock.deliverActivity).not.toHaveBeenCalled()
    })
  })

  // ── malformed JSON / missing type field ───────────────────────────────
  describe('handleInboxActivity — malformed activity', () => {
    it('does not throw when type field is undefined', async () => {
      // type is undefined — falls into default switch case
      await expect(
        InboxService.handleInboxActivity({ actor: 'https://remote/actor' })
      ).resolves.not.toThrow()
    })

    it('does not throw when type field is an unexpected value', async () => {
      await expect(
        InboxService.handleInboxActivity({ type: 42 as any, actor: 'https://remote/actor' })
      ).resolves.not.toThrow()
    })

    it('does not call prisma when actor field is missing in Undo Follow', async () => {
      // The service code: `(activity.actor as { id: string }).id ?? ''`
      // When actor is undefined this throws a TypeError. Confirm graceful handling
      // either by not calling deleteMany (if service guards) or by propagating an error.
      const activity = {
        type: 'Undo',
        // actor intentionally missing — service may throw TypeError
        object: { type: 'Follow' },
      }
      try {
        await InboxService.handleInboxActivity(activity)
        // If it resolved without throwing, deleteMany should not have been called
        expect(prismaMock.activityPubFollower.deleteMany).not.toHaveBeenCalled()
      } catch {
        // If it threw, that is also acceptable behaviour for a malformed activity
        expect(prismaMock.activityPubFollower.deleteMany).not.toHaveBeenCalled()
      }
    })

    it('ignores Undo when the inner object type is not Follow', async () => {
      const activity = {
        type: 'Undo',
        actor: 'https://remote/actor',
        object: { type: 'Like' }, // not Follow
      }
      await InboxService.handleInboxActivity(activity)
      expect(prismaMock.activityPubFollower.deleteMany).not.toHaveBeenCalled()
    })

    it('ignores Undo when inner object is missing', async () => {
      const activity: Record<string, unknown> = {
        type: 'Undo',
        actor: 'https://remote/actor',
        // object intentionally omitted
      }
      await InboxService.handleInboxActivity(activity)
      expect(prismaMock.activityPubFollower.deleteMany).not.toHaveBeenCalled()
    })
  })

  // ── Follow then Undo: correct state transitions ───────────────────────
  describe('handleInboxActivity — Follow then Undo sequence', () => {
    it('upserts follower on Follow, then removes it on Undo Follow', async () => {
      actorMock.fetchRemoteActor.mockResolvedValue(makeRemoteActor())
      deliveryMock.deliverActivity.mockResolvedValue(undefined)

      // Step 1: Follow
      await InboxService.handleInboxActivity({
        type: 'Follow',
        actor: 'https://remote/actor',
      })

      expect(prismaMock.activityPubFollower.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { actorUrl: 'https://remote/actor' },
          create: expect.objectContaining({ accepted: true }),
          update: expect.objectContaining({ accepted: true }),
        })
      )

      jest.clearAllMocks()
      prismaMock.activityPubFollower.upsert.mockResolvedValue({})
      prismaMock.activityPubFollower.deleteMany.mockResolvedValue({ count: 1 })

      // Step 2: Undo Follow
      await InboxService.handleInboxActivity({
        type: 'Undo',
        actor: 'https://remote/actor',
        object: { type: 'Follow' },
      })

      expect(prismaMock.activityPubFollower.deleteMany).toHaveBeenCalledWith({
        where: { actorUrl: 'https://remote/actor' },
      })
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Removed follower via Undo Follow: https://remote/actor')
      )
    })

    it('stores Follow with sharedInbox from remote actor endpoints', async () => {
      actorMock.fetchRemoteActor.mockResolvedValue(
        makeRemoteActor('https://remote/shared-inbox')
      )
      deliveryMock.deliverActivity.mockResolvedValue(undefined)

      await InboxService.handleInboxActivity({
        type: 'Follow',
        actor: 'https://remote/actor',
      })

      expect(prismaMock.activityPubFollower.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            inbox: 'https://remote/inbox',
            sharedInbox: 'https://remote/shared-inbox',
          }),
        })
      )
    })

    it('logs error but does not throw when Accept delivery fails after Follow', async () => {
      actorMock.fetchRemoteActor.mockResolvedValue(makeRemoteActor())
      deliveryMock.deliverActivity.mockRejectedValue(new Error('Network unreachable'))

      await expect(
        InboxService.handleInboxActivity({
          type: 'Follow',
          actor: 'https://remote/actor',
        })
      ).resolves.not.toThrow()

      // Follower should still have been persisted despite delivery failure
      expect(prismaMock.activityPubFollower.upsert).toHaveBeenCalled()
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to deliver Accept')
      )
    })
  })
})
