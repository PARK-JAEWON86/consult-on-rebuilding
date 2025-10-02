import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const defaultSettings = {
  general: {
    platformName: { value: 'Consult On', dataType: 'string', isPublic: true },
    platformTagline: { value: '전문가 상담 플랫폼', dataType: 'string', isPublic: true },
    contactEmail: { value: 'support@consulton.com', dataType: 'string', isPublic: true },
    supportPhone: { value: '+82-10-xxxx-xxxx', dataType: 'string', isPublic: true },
    businessAddress: { value: '', dataType: 'string', isPublic: true },
    timezone: { value: 'Asia/Seoul', dataType: 'string', isPublic: false },
    defaultLanguage: { value: 'ko', dataType: 'string', isPublic: false },
    maintenanceMode: { value: false, dataType: 'boolean', isPublic: false },
    maintenanceMessage: { value: '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.', dataType: 'string', isPublic: false },
    maxUploadSize: { value: 10, dataType: 'number', isPublic: false },
    allowedFileTypes: { value: ['jpg', 'png', 'pdf', 'doc', 'docx'], dataType: 'json', isPublic: false },
  },
  expert: {
    autoApproveApplications: { value: false, dataType: 'boolean', isPublic: false },
    minExperienceYears: { value: 1, dataType: 'number', isPublic: false },
    requireCertifications: { value: true, dataType: 'boolean', isPublic: false },
    maxCategoriesPerExpert: { value: 5, dataType: 'number', isPublic: false },
    minHourlyRate: { value: 30000, dataType: 'number', isPublic: true },
    maxHourlyRate: { value: 500000, dataType: 'number', isPublic: true },
    defaultHourlyRate: { value: 60000, dataType: 'number', isPublic: true },
    expertLevelSystem: { value: true, dataType: 'boolean', isPublic: false },
    levelCalculationMethod: { value: 'score-based', dataType: 'string', isPublic: false },
    profileReviewRequired: { value: true, dataType: 'boolean', isPublic: false },
    profileCompletionPercentage: { value: 80, dataType: 'number', isPublic: false },
    responseTimeThreshold: { value: '24 hours', dataType: 'string', isPublic: false },
    autoDeactivateInactive: { value: false, dataType: 'boolean', isPublic: false },
    inactivityPeriodDays: { value: 90, dataType: 'number', isPublic: false },
    commissionRate: { value: 15, dataType: 'number', isPublic: false },
  },
  payment: {
    paymentProvider: { value: 'toss', dataType: 'string', isPublic: false },
    tossApiKey: { value: '', dataType: 'password', isPublic: false },
    tossSecretKey: { value: '', dataType: 'password', isPublic: false },
    currency: { value: 'KRW', dataType: 'string', isPublic: true },
    enableCreditSystem: { value: true, dataType: 'boolean', isPublic: false },
    creditToKrwRatio: { value: 1000, dataType: 'number', isPublic: true },
    minCreditPurchase: { value: 10, dataType: 'number', isPublic: true },
    maxCreditPurchase: { value: 1000, dataType: 'number', isPublic: true },
    creditBonusTiers: {
      value: [
        { minAmount: 100, bonusPercentage: 5 },
        { minAmount: 500, bonusPercentage: 10 },
        { minAmount: 1000, bonusPercentage: 15 }
      ],
      dataType: 'json',
      isPublic: true
    },
    refundPolicyPeriodDays: { value: 7, dataType: 'number', isPublic: true },
    autoRefundCancellations: { value: true, dataType: 'boolean', isPublic: false },
    refundProcessingFee: { value: 0, dataType: 'number', isPublic: true },
    platformFee: { value: 15, dataType: 'number', isPublic: false },
    expertPayoutSchedule: { value: 'weekly', dataType: 'string', isPublic: false },
    minPayoutAmount: { value: 50000, dataType: 'number', isPublic: false },
    autoSettlement: { value: true, dataType: 'boolean', isPublic: false },
    settlementCycleDays: { value: 7, dataType: 'number', isPublic: false },
  },
  aiChat: {
    enableAiChat: { value: true, dataType: 'boolean', isPublic: false },
    aiProvider: { value: 'openai', dataType: 'string', isPublic: false },
    openaiApiKey: { value: '', dataType: 'password', isPublic: false },
    defaultModel: { value: 'gpt-4', dataType: 'string', isPublic: false },
    freeTokensPerMonth: { value: 10000, dataType: 'number', isPublic: true },
    tokenResetDay: { value: 1, dataType: 'number', isPublic: false },
    maxTokensPerRequest: { value: 2000, dataType: 'number', isPublic: false },
    dailyRequestLimit: { value: 50, dataType: 'number', isPublic: false },
    tokenPricePer1000: { value: 100, dataType: 'number', isPublic: true },
    enableTokenPurchase: { value: true, dataType: 'boolean', isPublic: false },
    systemPrompt: {
      value: 'You are a helpful AI consultant for Consult On. Provide professional, accurate advice to users. Always be respectful and maintain confidentiality.',
      dataType: 'string',
      isPublic: false
    },
    responseStyle: { value: 'professional', dataType: 'string', isPublic: false },
    enableConversationMemory: { value: true, dataType: 'boolean', isPublic: false },
    maxChatHistory: { value: 50, dataType: 'number', isPublic: false },
    enableChatExport: { value: true, dataType: 'boolean', isPublic: false },
    dataRetentionDays: { value: 90, dataType: 'number', isPublic: false },
    autoDeleteOldData: { value: true, dataType: 'boolean', isPublic: false },
  },
  community: {
    enableCommunity: { value: true, dataType: 'boolean', isPublic: false },
    postApprovalRequired: { value: false, dataType: 'boolean', isPublic: false },
    commentApprovalRequired: { value: false, dataType: 'boolean', isPublic: false },
    allowAnonymousPosts: { value: true, dataType: 'boolean', isPublic: true },
    allowAnonymousComments: { value: true, dataType: 'boolean', isPublic: true },
    maxPostLength: { value: 10000, dataType: 'number', isPublic: true },
    maxCommentLength: { value: 1000, dataType: 'number', isPublic: true },
    maxAttachments: { value: 5, dataType: 'number', isPublic: true },
    bannedWords: { value: '', dataType: 'string', isPublic: false },
    autoModerateKeywords: { value: '', dataType: 'string', isPublic: false },
    minReputationForPosting: { value: 0, dataType: 'number', isPublic: true },
    minReputationForComments: { value: 0, dataType: 'number', isPublic: true },
    reportThreshold: { value: 5, dataType: 'number', isPublic: false },
    pinPostsDuration: { value: 30, dataType: 'number', isPublic: false },
    enablePostReactions: { value: true, dataType: 'boolean', isPublic: true },
    enableCommentReactions: { value: true, dataType: 'boolean', isPublic: true },
  },
  notification: {
    enableEmailNotifications: { value: true, dataType: 'boolean', isPublic: false },
    emailProvider: { value: 'sendgrid', dataType: 'string', isPublic: false },
    smtpHost: { value: '', dataType: 'string', isPublic: false },
    smtpPort: { value: 587, dataType: 'number', isPublic: false },
    smtpUsername: { value: '', dataType: 'string', isPublic: false },
    smtpPassword: { value: '', dataType: 'password', isPublic: false },
    fromEmail: { value: 'noreply@consulton.com', dataType: 'string', isPublic: false },
    fromName: { value: 'Consult On', dataType: 'string', isPublic: false },
    enablePushNotifications: { value: true, dataType: 'boolean', isPublic: false },
    firebaseServerKey: { value: '', dataType: 'password', isPublic: false },
    enableSmsNotifications: { value: false, dataType: 'boolean', isPublic: false },
    smsProvider: { value: 'twilio', dataType: 'string', isPublic: false },
    notificationRetentionDays: { value: 90, dataType: 'number', isPublic: false },
    defaultPriority: { value: 'MEDIUM', dataType: 'string', isPublic: false },
    batchDigestSchedule: { value: 'daily', dataType: 'string', isPublic: false },
    maxNotificationsPerDay: { value: 50, dataType: 'number', isPublic: false },
  },
  security: {
    sessionTimeoutMinutes: { value: 60, dataType: 'number', isPublic: false },
    passwordMinLength: { value: 8, dataType: 'number', isPublic: true },
    requireUppercase: { value: true, dataType: 'boolean', isPublic: true },
    requireNumbers: { value: true, dataType: 'boolean', isPublic: true },
    requireSymbols: { value: true, dataType: 'boolean', isPublic: true },
    maxLoginAttempts: { value: 5, dataType: 'number', isPublic: false },
    lockoutDurationMinutes: { value: 30, dataType: 'number', isPublic: false },
    enable2fa: { value: false, dataType: 'boolean', isPublic: false },
    twoFaMethod: { value: 'sms', dataType: 'string', isPublic: false },
    enableIpWhitelist: { value: false, dataType: 'boolean', isPublic: false },
    whitelistedIps: { value: '', dataType: 'string', isPublic: false },
    enableCors: { value: true, dataType: 'boolean', isPublic: false },
    allowedOrigins: { value: '', dataType: 'string', isPublic: false },
    rateLimitPerMinute: { value: 100, dataType: 'number', isPublic: false },
    enableAuditLogging: { value: true, dataType: 'boolean', isPublic: false },
    auditRetentionDays: { value: 365, dataType: 'number', isPublic: false },
    privacyMode: { value: false, dataType: 'boolean', isPublic: false },
    dataEncryption: { value: true, dataType: 'boolean', isPublic: false },
  },
  analytics: {
    enableAnalytics: { value: true, dataType: 'boolean', isPublic: false },
    googleAnalyticsId: { value: '', dataType: 'string', isPublic: false },
    enableMixpanel: { value: false, dataType: 'boolean', isPublic: false },
    mixpanelToken: { value: '', dataType: 'password', isPublic: false },
    enableHotjar: { value: false, dataType: 'boolean', isPublic: false },
    hotjarSiteId: { value: '', dataType: 'string', isPublic: false },
    trackUserBehavior: { value: true, dataType: 'boolean', isPublic: false },
    trackExpertPerformance: { value: true, dataType: 'boolean', isPublic: false },
    trackRevenueMetrics: { value: true, dataType: 'boolean', isPublic: false },
    dataRetentionPeriodDays: { value: 365, dataType: 'number', isPublic: false },
    enableDataExport: { value: true, dataType: 'boolean', isPublic: false },
    exportFormat: { value: 'csv', dataType: 'string', isPublic: false },
    autoGenerateReports: { value: true, dataType: 'boolean', isPublic: false },
    reportSchedule: { value: 'weekly', dataType: 'string', isPublic: false },
    reportRecipients: { value: '', dataType: 'string', isPublic: false },
    dashboardRefreshRate: { value: 60, dataType: 'number', isPublic: false },
  },
};

export async function seedSettings() {
  console.log('🌱 Seeding platform settings...');

  for (const [category, settings] of Object.entries(defaultSettings)) {
    for (const [key, config] of Object.entries(settings)) {
      await prisma.platformSettings.upsert({
        where: {
          category_key: {
            category,
            key,
          },
        },
        update: {},
        create: {
          category,
          key,
          value: config.value,
          dataType: config.dataType,
          isPublic: config.isPublic,
        },
      });
    }
  }

  console.log('✅ Platform settings seeded successfully');
}

// Run if called directly
if (require.main === module) {
  seedSettings()
    .catch((e) => {
      console.error('❌ Error seeding settings:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
