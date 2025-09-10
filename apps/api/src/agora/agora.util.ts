import { RtcRole, RtmRole, RtcTokenBuilder, RtmTokenBuilder } from 'agora-access-token';

export function buildRtcToken(appId: string, appCert: string, channel: string, uid: string, ttlSec: number, role: number) {
  const expire = Math.floor(Date.now() / 1000) + ttlSec;
  return RtcTokenBuilder.buildTokenWithAccount(appId, appCert, channel, uid, role, expire);
}

export function buildRtmToken(appId: string, appCert: string, uid: string, ttlSec: number) {
  const expire = Math.floor(Date.now() / 1000) + ttlSec;
  return RtmTokenBuilder.buildToken(appId, appCert, uid, RtmRole.Rtm_User, expire);
}
