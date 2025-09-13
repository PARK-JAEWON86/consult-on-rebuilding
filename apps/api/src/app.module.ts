import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { CategoriesModule } from './categories/categories.module'
import { CreditsModule } from './credits/credits.module'
import { ExpertsModule } from './experts/experts.module'
import { FilesModule } from './files/files.module'
import { HealthModule } from './health/health.module'
import { PaymentsModule } from './payments/payments.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { ReservationsModule } from './reservations/reservations.module'
import { ReviewsModule } from './reviews/reviews.module'
import { SessionsModule } from './sessions/sessions.module'
import { UsersModule } from './users/users.module'
import { validateEnv } from './config/env.schema'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    CategoriesModule,
    CreditsModule,
    ExpertsModule,
    FilesModule,
    HealthModule,
    PaymentsModule,
    ReservationsModule,
    ReviewsModule,
    SessionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
