import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from '../prisma/prisma.module'
import { MailModule } from '../mail/mail.module'
import { AuthModule } from '../auth/auth.module'
import { ExpertApplicationsController } from './expert-applications/expert-applications.controller'
import { ExpertApplicationsService } from './expert-applications/expert-applications.service'
import { AnalyticsController } from './analytics/analytics.controller'
import { AnalyticsService } from './analytics/analytics.service'
import { UsersController } from './users/users.controller'
import { UsersService } from './users/users.service'
import { ContentController } from './content/content.controller'
import { ContentService } from './content/content.service'
import { SettingsController } from './settings/settings.controller'
import { SettingsService } from './settings/settings.service'
import { TokenStatsController } from './token-stats/token-stats.controller'
import { TokenStatsService } from './token-stats/token-stats.service'
import { AdminGuard } from './guards/admin.guard'
import { AdminRoleGuard } from './guards/admin-role.guard'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
  ],
  controllers: [
    ExpertApplicationsController,
    AnalyticsController,
    UsersController,
    ContentController,
    SettingsController,
    TokenStatsController,
  ],
  providers: [
    ExpertApplicationsService,
    AnalyticsService,
    UsersService,
    ContentService,
    SettingsService,
    TokenStatsService,
    AdminGuard,
    AdminRoleGuard,
  ],
  exports: [
    ExpertApplicationsService,
    AnalyticsService,
    UsersService,
    ContentService,
    SettingsService,
  ],
})
export class AdminModule {}
