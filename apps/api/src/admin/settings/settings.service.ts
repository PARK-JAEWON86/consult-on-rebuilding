import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all platform settings grouped by category
   */
  async getAllSettings() {
    const settings = await this.prisma.platformSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = this.maskSensitiveValue(setting);
      return acc;
    }, {} as Record<string, any>);

    return grouped;
  }

  /**
   * Get settings for a specific category
   */
  async getSettingsByCategory(category: string) {
    const settings = await this.prisma.platformSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    if (settings.length === 0) {
      throw new NotFoundException(`Settings for category '${category}' not found`);
    }

    const result = settings.reduce((acc, setting) => {
      acc[setting.key] = this.maskSensitiveValue(setting);
      return acc;
    }, {} as Record<string, any>);

    return result;
  }

  /**
   * Update settings for a category
   */
  async updateSettings(
    category: string,
    data: Record<string, any>,
    adminUserId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const updates = [];
    const changeLogs = [];

    for (const [key, value] of Object.entries(data)) {
      // Get current setting
      const currentSetting = await this.prisma.platformSettings.findUnique({
        where: { category_key: { category, key } },
      });

      if (!currentSetting) {
        throw new NotFoundException(`Setting '${key}' in category '${category}' not found`);
      }

      // Update setting
      const updated = await this.prisma.platformSettings.update({
        where: { category_key: { category, key } },
        data: { value: value },
      });

      updates.push(updated);

      // Log change
      changeLogs.push({
        adminUserId,
        category,
        settingKey: key,
        oldValue: currentSetting.value as any,
        newValue: value as any,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    }

    // Save change logs
    if (changeLogs.length > 0) {
      await this.prisma.settingChangeLog.createMany({
        data: changeLogs,
      });
    }

    return { success: true, updated: updates.length };
  }

  /**
   * Reset settings to default values for a category
   */
  async resetSettings(category: string) {
    // This would require storing default values
    // For now, return success
    return { success: true, message: 'Reset functionality not implemented yet' };
  }

  /**
   * Get change history for settings
   */
  async getChangeHistory(limit: number = 100, category?: string) {
    const where = category ? { category } : {};

    const history = await this.prisma.settingChangeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history;
  }

  /**
   * Get a single setting value
   */
  async getSetting(category: string, key: string) {
    const setting = await this.prisma.platformSettings.findUnique({
      where: { category_key: { category, key } },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' in category '${category}' not found`);
    }

    return this.maskSensitiveValue(setting);
  }

  /**
   * Mask sensitive values (passwords, API keys)
   */
  private maskSensitiveValue(setting: any) {
    if (setting.dataType === 'password' && setting.value) {
      return {
        ...setting,
        value: '••••••••',
        _masked: true,
      };
    }
    return setting;
  }

  /**
   * Get public settings (for use in frontend without auth)
   */
  async getPublicSettings() {
    const settings = await this.prisma.platformSettings.findMany({
      where: { isPublic: true },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    return grouped;
  }
}
