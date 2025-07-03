// services/AuthService/SSOService/WeChatService.ts
import axios from 'axios';
import qs from 'querystring';

export default class WeChatService {
  static CLIENT_ID = process.env.WECHAT_APP_ID!;
  static CLIENT_SECRET = process.env.WECHAT_APP_SECRET!;
  static CALLBACK_URL = `${process.env.APPLICATION_HOST}/api/auth/callback/wechat`;

  static AUTH_URL = 'https://open.weixin.qq.com/connect/qrconnect';
  static TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token';
  static USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo';

  static generateAuthUrl(state: string): string {
    const params = {
      appid: this.CLIENT_ID,
      redirect_uri: encodeURIComponent(this.CALLBACK_URL),
      response_type: 'code',
      scope: 'snsapi_login',
      state
    };

    return `${this.AUTH_URL}?${qs.stringify(params)}#wechat_redirect`;
  }

  static async getAccessToken(code: string) {
    const url = `${this.TOKEN_URL}?appid=${this.CLIENT_ID}&secret=${this.CLIENT_SECRET}&code=${code}&grant_type=authorization_code`;

    const { data } = await axios.get(url);

    if (data.errcode) throw new Error(data.errmsg);
    return data; // contains access_token, openid, etc.
  }

  static async getUserInfo(accessToken: string, openid: string) {
    const url = `${this.USERINFO_URL}?access_token=${accessToken}&openid=${openid}`;
    const { data } = await axios.get(url);

    if (data.errcode) throw new Error(data.errmsg);
    return {
      id: data.unionid || data.openid,
      name: data.nickname,
      email: null,
      avatar: data.headimgurl,
      provider: 'wechat'
    };
  }

  static async authCallback(code: string) {
    const tokenData = await this.getAccessToken(code);
    const user = await this.getUserInfo(tokenData.access_token, tokenData.openid);
    return user;
  }
}
