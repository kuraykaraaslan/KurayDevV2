import axios from 'axios'
import WeChatService from '@/services/AuthService/SSOService/WeChatService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('WeChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    WeChatService.CLIENT_ID = 'test-wechat-app-id'
    WeChatService.CLIENT_SECRET = 'test-wechat-app-secret'
    // CALLBACK_URL is constructed at class load time from the static fields above;
    // reassign directly so tests use a predictable value.
    WeChatService.CALLBACK_URL = 'https://localhost/api/auth/callback/wechat'
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the WeChat QR connect endpoint', () => {
      const url = WeChatService.generateAuthUrl('state-xyz')
      expect(url).toContain('open.weixin.qq.com/connect/qrconnect')
    })

    it('includes the appid in the query string', () => {
      const url = WeChatService.generateAuthUrl('state-abc')
      expect(url).toContain('appid=test-wechat-app-id')
    })

    it('includes response_type=code', () => {
      const url = WeChatService.generateAuthUrl('state')
      expect(url).toContain('response_type=code')
    })

    it('includes scope=snsapi_login', () => {
      const url = WeChatService.generateAuthUrl('state')
      expect(url).toContain('scope=snsapi_login')
    })

    it('includes the provided state parameter', () => {
      const url = WeChatService.generateAuthUrl('my-state-value')
      expect(url).toContain('state=my-state-value')
    })

    it('ends with #wechat_redirect fragment', () => {
      const url = WeChatService.generateAuthUrl('state')
      expect(url).toMatch(/#wechat_redirect$/)
    })
  })

  // ── getAccessToken ───────────────────────────────────────────────────
  describe('getAccessToken', () => {
    it('returns token data from WeChat access token endpoint', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { access_token: 'wechat-access-token', openid: 'wechat-openid-123', expires_in: 7200 },
      })

      const result = await WeChatService.getAccessToken('auth-code-wechat')
      expect(result.access_token).toBe('wechat-access-token')
      expect(result.openid).toBe('wechat-openid-123')
    })

    it('performs a GET request to the WeChat token URL with correct parameters', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { access_token: 'at', openid: 'oid' },
      })

      await WeChatService.getAccessToken('my-code')
      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('api.weixin.qq.com/sns/oauth2/access_token')
      )
      const calledUrl: string = axiosMock.get.mock.calls[0][0] as string
      expect(calledUrl).toContain('appid=test-wechat-app-id')
      expect(calledUrl).toContain('secret=test-wechat-app-secret')
      expect(calledUrl).toContain('code=my-code')
      expect(calledUrl).toContain('grant_type=authorization_code')
    })

    it('throws when WeChat returns an errcode in the response body', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { errcode: 40029, errmsg: 'invalid code' },
      })

      await expect(WeChatService.getAccessToken('bad-code')).rejects.toThrow('invalid code')
    })

    it('throws when the HTTP request itself fails', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Network error'))
      await expect(WeChatService.getAccessToken('code')).rejects.toThrow('Network error')
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps the WeChat user info response to a profile object', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          unionid: 'wechat-unionid-999',
          openid: 'wechat-openid-999',
          nickname: 'WeChatUser',
          headimgurl: 'https://wx.qlogo.cn/mmopen/avatar.jpg',
        },
      })

      const profile = await WeChatService.getUserInfo('access-token', 'openid-123')
      expect(profile.id).toBe('wechat-unionid-999')
      expect(profile.name).toBe('WeChatUser')
      expect(profile.email).toBeNull()
      expect(profile.avatar).toBe('https://wx.qlogo.cn/mmopen/avatar.jpg')
      expect(profile.provider).toBe('wechat')
    })

    it('falls back to openid when unionid is not present', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          openid: 'only-openid',
          nickname: 'NoUnionId',
          headimgurl: '',
        },
      })

      const profile = await WeChatService.getUserInfo('access-token', 'only-openid')
      expect(profile.id).toBe('only-openid')
    })

    it('performs a GET request to the WeChat userinfo URL with correct parameters', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { openid: 'oid', nickname: 'N', headimgurl: '' },
      })

      await WeChatService.getUserInfo('my-token', 'my-openid')
      const calledUrl: string = axiosMock.get.mock.calls[0][0] as string
      expect(calledUrl).toContain('api.weixin.qq.com/sns/userinfo')
      expect(calledUrl).toContain('access_token=my-token')
      expect(calledUrl).toContain('openid=my-openid')
    })

    it('throws when WeChat returns an errcode in the user info response', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { errcode: 40001, errmsg: 'invalid token' },
      })

      await expect(WeChatService.getUserInfo('bad-token', 'oid')).rejects.toThrow('invalid token')
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Connection refused'))
      await expect(WeChatService.getUserInfo('tok', 'oid')).rejects.toThrow('Connection refused')
    })
  })

  // ── authCallback ─────────────────────────────────────────────────────
  describe('authCallback', () => {
    it('combines getAccessToken and getUserInfo into a full profile', async () => {
      // First call → getAccessToken
      axiosMock.get.mockResolvedValueOnce({
        data: { access_token: 'combined-token', openid: 'combined-openid' },
      })
      // Second call → getUserInfo
      axiosMock.get.mockResolvedValueOnce({
        data: {
          unionid: 'combined-unionid',
          nickname: 'CombinedUser',
          headimgurl: 'https://wx.qlogo.cn/combined.jpg',
        },
      })

      const user = await WeChatService.authCallback('combined-code')
      expect(user.id).toBe('combined-unionid')
      expect(user.name).toBe('CombinedUser')
      expect(user.provider).toBe('wechat')
      expect(axiosMock.get).toHaveBeenCalledTimes(2)
    })

    it('throws when getAccessToken fails inside authCallback', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { errcode: 40029, errmsg: 'invalid code in callback' },
      })

      await expect(WeChatService.authCallback('bad-code')).rejects.toThrow('invalid code in callback')
    })
  })
})
