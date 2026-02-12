jest.mock('@/libs/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn().mockResolvedValue(['0', []]),
  mget: jest.fn(),
  hset: jest.fn(),
  exists: jest.fn(),
}))

jest.mock('@/libs/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))
