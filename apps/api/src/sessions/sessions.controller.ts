import { Controller, Post, Body, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const EnsureSchema = z.object({ 
  reservationId: z.number().int().positive() 
});

const TokensSchema = z.object({ 
  uid: z.string().min(1), 
  role: z.enum(['host', 'audience']).optional() 
});

@Controller('sessions')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Post()
  async ensure(@Body(new ZodValidationPipe(EnsureSchema)) body: any) {
    const s = await this.svc.ensure(body.reservationId);
    return { 
      success: true, 
      data: { 
        displayId: s.displayId, 
        channel: s.channel, 
        status: s.status 
      } 
    };
  }

  @Post(':displayId/start')
  async start(@Param('displayId') id: string) {
    const s = await this.svc.start(id);
    return { 
      success: true, 
      data: { 
        displayId: id, 
        status: s.status, 
        startedAt: s.startedAt 
      } 
    };
  }

  @Post(':displayId/end')
  async end(@Param('displayId') id: string) {
    const s = await this.svc.end(id);
    return { 
      success: true, 
      data: { 
        displayId: id, 
        status: s.status, 
        endedAt: s.endedAt 
      } 
    };
  }

  @Post(':displayId/tokens')
  async tokens(@Param('displayId') id: string, @Body(new ZodValidationPipe(TokensSchema)) body: any) {
    const data = await this.svc.issueTokens(id, body.uid, body.role);
    return { success: true, data };
  }
}
