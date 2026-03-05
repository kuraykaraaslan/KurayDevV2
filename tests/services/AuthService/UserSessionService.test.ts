import * as UserSessionService from '@/services/AuthService/UserSessionService'
import * as TokenService from '@/services/AuthService/TokenService'
import * as DeviceFingerprintService from '@/services/AuthService/DeviceFingerprintService'
import * as AuthMiddleware from '@/services/AuthService/AuthMiddleware'

describe('AuthService - UserSessionService', () => {
  it('should be defined', () => {
    expect(UserSessionService).toBeDefined()
  })
})

describe('AuthService - TokenService', () => {
  it('should be defined', () => {
    expect(TokenService).toBeDefined()
  })
})

describe('AuthService - DeviceFingerprintService', () => {
  it('should be defined', () => {
    expect(DeviceFingerprintService).toBeDefined()
  })
})

describe('AuthService - AuthMiddleware', () => {
  it('should be defined', () => {
    expect(AuthMiddleware).toBeDefined()
  })
})
