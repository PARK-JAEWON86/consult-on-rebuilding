import { Controller, Post, Req } from '@nestjs/common';
import { verifyTossSignature } from './webhook.util';

@Controller('payments')
export class WebhookController {
  @Post('webhook')
  async webhook(@Req() req: any) {
    // HMAC 서명 검증
    const ok = verifyTossSignature(
      req.rawBody || JSON.stringify(req.body), 
      req.headers['toss-signature'] as string, 
      process.env.TOSS_WEBHOOK_SECRET!
    );
    
    if (!ok) {
      return { 
        success: false, 
        error: { 
          code: 'E_WEBHOOK_SIG', 
          message: 'Invalid signature' 
        } 
      };
    }

    const payload = req.body;
    
    // 이벤트 중복 처리 (eventId 또는 paymentKey로 체크)
    const eventId = payload?.eventId || payload?.paymentKey;
    if (eventId) {
      // 실제 구현에서는 Redis나 DB로 중복 체크
      // 여기서는 간단히 로깅만 수행
      console.log('[toss-webhook] Processing event:', eventId, payload?.eventType, payload?.status);
    }
    
    console.log('[toss-webhook]', payload?.eventType, payload?.status);
    return { success: true, data: { received: true } };
  }
}
