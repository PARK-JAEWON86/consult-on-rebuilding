import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AdminGuard } from '../guards/admin.guard';
import { Request } from 'express';

@Controller('admin/settings')
@UseGuards(AdminGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /admin/settings
   * Get all settings grouped by category
   */
  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  /**
   * GET /admin/settings/:category
   * Get settings for a specific category
   */
  @Get(':category')
  async getCategorySettings(@Param('category') category: string) {
    return this.settingsService.getSettingsByCategory(category);
  }

  /**
   * PUT /admin/settings/:category
   * Update settings for a category
   */
  @Put(':category')
  async updateSettings(
    @Param('category') category: string,
    @Body() data: Record<string, any>,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const adminUserId = user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.settingsService.updateSettings(
      category,
      data,
      adminUserId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * POST /admin/settings/reset/:category
   * Reset settings to default values
   */
  @Post('reset/:category')
  async resetSettings(@Param('category') category: string) {
    return this.settingsService.resetSettings(category);
  }

  /**
   * GET /admin/settings/history
   * Get change history
   */
  @Get('history/all')
  async getHistory(
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.settingsService.getChangeHistory(limitNum, category);
  }

  /**
   * GET /admin/settings/:category/:key
   * Get a single setting
   */
  @Get(':category/:key')
  async getSetting(
    @Param('category') category: string,
    @Param('key') key: string,
  ) {
    return this.settingsService.getSetting(category, key);
  }
}
