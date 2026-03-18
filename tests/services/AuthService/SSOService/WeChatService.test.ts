jest.mock('axios')

import axios from 'axios'
import WeChatService from '@/services/AuthService/SSOService/WeChatService'

const axiosMock = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
  WeChatService.CLIENT_ID = 'wechat-app-id'
  WeChatService.CLIENT_SECRET = 'wechat-secret'
  WeChatService.CALLBACK_URL = 'https://example.com/api/auth/callback/wechat'
})

describe('WeChatService', () => {
  describe('generateAuthUrl', () => {
    it('returns URL containing WeChat QR connect base', () => {
      const url = WeChatService.generateAuthUrl('state-abc')
      expect(url).toContain('https://open.weixin.qq.com/connect/qrconnect')
    })

    it('includes appid, state, and wechat_redirect anchor', () => {
      const url = WeChatService.generateAuthUrl('my-state')
      expect(url).toContain('appid=wechat-app-id')
      expect(url).toContain('state=my-state')
      expect(url).toContain('#wechat_redirect')
    })
  })

  describe('getAccessToken', () => {
    it('returns token data on success', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { access_token: 'wc-access', openid: 'openid-1' },
      })
      const data = await WeChatService.getAccessToken('wc-code')
      expect(data.access_token).toBe('wc-access')
      expect(data.openid).toBe('openid-1')
    })

    it('throws when response contains errcode', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { errcode: 40029, errmsg: 'invalid code' },
      })
      await expect(WeChatService.getAccessToken('bad-code')).rejects.toThrow('invalid code')
    })
  })

  describe('getUserInfo', () => {
    it('returns user data with unionid when present', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          unionid: 'union-1',
          openid: 'open-1',
          nickname: 'WeChatUser',
          headimgurl: 'https://thirdwx.qlogo.cn/avatar.jpg',
        },
      })
      const user = await WeChatService.getUserInfo('wc-token', 'open-1')
      expect(user.id).toBe('union-1')
      expect(user.name).toBe('WeChatUser')
      expect(user.avatar).toBe('https://thirdwx.qlogo.cn/avatar.jpg')
      expect(user.provider).toBe('wechat')
    })

    it('falls back to openid when unionid is absent', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { openid: 'only-openid', nickname: 'User', headimgurl: '' },
      })
      const user = await WeChatService.getUserInfo('wc-token', 'only-openid')
      expect(user.id).toBe('only-openid')
    })

    it('throws when response contains errcode', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { errcode: 40001, errmsg: 'invalid credential' },
      })
      await expect(WeChatService.getUserInfo('bad-token', 'oid')).rejects.toThrow('invalid credential')
    })
  })

  describe('authCallback', () => {
    it('chains getAccessToken → getUserInfo and returns combined user', async () => {
      axiosMock.get
        .mockResolvedValueOnce({ data: { access_token: 'wc-tok', openid: 'oid-1' } })
        .mockResolvedValueOnce({ data: { openid: 'oid-1', nickname: 'CBUser', headimgurl: '' } })

      const user = await WeChatService.authCallback('cb-code')
      expect(user.name).toBe('CBUser')
    })
  })
})
