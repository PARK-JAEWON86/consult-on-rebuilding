import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';

@Module({
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
