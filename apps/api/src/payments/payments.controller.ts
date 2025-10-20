import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtGuard } from '../auth/jwt.guard';
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
  @UseGuards(JwtGuard)
  async createIntent(
    @Request() req: any,
    @Body(new ZodValidationPipe(CreateIntentSchema)) body: any
  ) {
    const userId = req.user.id;
    const data = await this.svc.createIntent(userId, body.amount);
    return { success: true, data };
  }

  @Get('intents/:displayId')
  @UseGuards(JwtGuard)
  async getIntent(
    @Request() req: any,
    @Param('displayId') displayId: string
  ) {
    const data = await this.svc.getIntent(displayId);
    return { success: true, data };
  }

  @Post('confirm')
  @UseGuards(JwtGuard)
  async confirm(
    @Request() req: any,
    @Body(new ZodValidationPipe(ConfirmSchema)) body: any
  ) {
    const data = await this.svc.confirmWithToss(body);
    return { success: true, data };
  }
}
