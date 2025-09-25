import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIUsageModule } from '../ai-usage/ai-usage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AIUsageModule, AuthModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}