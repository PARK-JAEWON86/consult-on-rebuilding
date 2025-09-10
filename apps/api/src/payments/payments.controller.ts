import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const CreateIntentSchema = z.object({ amount: z.number().int().positive() });
const ConfirmSchema = z.object({
  paymentKey: z.string().min(3),
  orderId: z.string().min(3),
  amount: z.number().int().positive(),
});

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('intents')
  async createIntent(@Body(new ZodValidationPipe(CreateIntentSchema)) body: any) {
    const userId = 1; // TODO: Auth 연동 후 교체
    const data = await this.svc.createIntent(userId, body.amount);
    return { success: true, data };
  }

  @Get('intents/:displayId')
  async getIntent(@Param('displayId') displayId: string) {
    const data = await this.svc.getIntent(displayId);
    return { success: true, data };
  }

  @Post('confirm')
  async confirm(@Body(new ZodValidationPipe(ConfirmSchema)) body: any) {
    const data = await this.svc.confirmWithToss(body);
    return { success: true, data };
  }
}
