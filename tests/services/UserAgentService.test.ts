import * as UserAgentService from '@/services/UserAgentService'

describe('UserAgentService', () => {
  it('exports functions and is usable', () => {
    expect(UserAgentService).toBeDefined()
    const target = (UserAgentService as any).default ?? UserAgentService
    const props = Object.getOwnPropertyNames(target)
    const hasFunction = props.some((p) => typeof (target as any)[p] === 'function')
    expect(hasFunction).toBe(true)
  })
})
