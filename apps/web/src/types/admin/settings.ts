// Platform Settings Types

export interface PlatformSettings {
  general: GeneralSettings;
  expert: ExpertSettings;
  payment: PaymentSettings;
  aiChat: AIChatSettings;
  community: CommunitySettings;
  notification: NotificationSettings;
  security: SecuritySettings;
  analytics: AnalyticsSettings;
}

// General Settings
export interface GeneralSettings {
  platformName: string;
  platformTagline: string;
  contactEmail: string;
  supportPhone: string;
  businessAddress: string;
  timezone: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
}

// Expert Settings
export interface ExpertSettings {
  autoApproveApplications: boolean;
  minExperienceYears: number;
  requireCertifications: boolean;
  maxCategoriesPerExpert: number;
  minHourlyRate: number;
  maxHourlyRate: number;
  defaultHourlyRate: number;
  expertLevelSystem: boolean;
  levelCalculationMethod: string;
  profileReviewRequired: boolean;
  profileCompletionPercentage: number;
  responseTimeThreshold: string;
  autoDeactivateInactive: boolean;
  inactivityPeriodDays: number;
  commissionRate: number;
}

// Payment Settings
export interface PaymentSettings {
  paymentProvider: string;
  tossApiKey: string;
  tossSecretKey: string;
  currency: string;
  enableCreditSystem: boolean;
  creditToKrwRatio: number;
  minCreditPurchase: number;
  maxCreditPurchase: number;
  creditBonusTiers: CreditBonusTier[];
  refundPolicyPeriodDays: number;
  autoRefundCancellations: boolean;
  refundProcessingFee: number;
  platformFee: number;
  expertPayoutSchedule: string;
  minPayoutAmount: number;
  autoSettlement: boolean;
  settlementCycleDays: number;
}

export interface CreditBonusTier {
  minAmount: number;
  bonusPercentage: number;
}

// AI Chat Settings
export interface AIChatSettings {
  enableAiChat: boolean;
  aiProvider: string;
  openaiApiKey: string;
  defaultModel: string;
  freeTokensPerMonth: number;
  tokenResetDay: number;
  maxTokensPerRequest: number;
  dailyRequestLimit: number;
  tokenPricePer1000: number;
  enableTokenPurchase: boolean;
  systemPrompt: string;
  responseStyle: string;
  enableConversationMemory: boolean;
  maxChatHistory: number;
  enableChatExport: boolean;
  dataRetentionDays: number;
  autoDeleteOldData: boolean;
}

// Community Settings
export interface CommunitySettings {
  enableCommunity: boolean;
  postApprovalRequired: boolean;
  commentApprovalRequired: boolean;
  allowAnonymousPosts: boolean;
  allowAnonymousComments: boolean;
  maxPostLength: number;
  dailyPostLimit: number;
  maxCommentLength: number;
  maxCommentDepth: number;
  maxAttachments: number;
  maxImagesPerPost: number;
  bannedWords: string[];
  autoModerateKeywords: string;
  enableAutoModeration: boolean;
  minReputationForPosting: number;
  minReputationForComments: number;
  reportThreshold: number;
  anonymousReporting: boolean;
  pinPostsDuration: number;
  enablePostReactions: boolean;
  enableCommentReactions: boolean;
  enableComments: boolean;
  enableSharing: boolean;
}

// Notification Settings
export interface NotificationSettings {
  enableEmailNotifications: boolean;
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  emailFrom: string;
  emailFromName: string;
  enablePushNotifications: boolean;
  firebaseServerKey: string;
  firebaseProjectId: string;
  enableSmsNotifications: boolean;
  smsProvider: string;
  notificationRetentionDays: number;
  autoDeleteOldNotifications: boolean;
  defaultPriority: string;
  batchDigestSchedule: string;
  maxNotificationsPerDay: number;
  notifyNewConsultation: boolean;
  notifyConsultationComplete: boolean;
  notifyPaymentComplete: boolean;
  notifyRefund: boolean;
  notifyExpertApproval: boolean;
  notifyNewReview: boolean;
}

// Security Settings
export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  passwordRequireComplex: boolean;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  accountLockoutMinutes: number;
  enable2fa: boolean;
  twoFaMethod: string;
  require2faForAdmins: boolean;
  recommend2faForExperts: boolean;
  enableIpWhitelist: boolean;
  whitelistedIps: string;
  allowedIpAddresses: string[];
  enableCors: boolean;
  allowedOrigins: string;
  rateLimitPerMinute: number;
  enableAuditLogging: boolean;
  auditRetentionDays: number;
  auditLogRetentionDays: number;
  privacyMode: boolean;
  dataEncryption: boolean;
  encryptSensitiveData: boolean;
  enableAutoBackup: boolean;
  backupFrequencyHours: number;
}

// Analytics Settings
export interface AnalyticsSettings {
  enableAnalytics: boolean;
  googleAnalyticsId: string;
  enableMixpanel: boolean;
  mixpanelToken: string;
  enableHotjar: boolean;
  hotjarSiteId: string;
  trackUserBehavior: boolean;
  trackExpertPerformance: boolean;
  trackRevenueMetrics: boolean;
  defaultDateRange: string;
  showRealTimeData: boolean;
  trackPageViews: boolean;
  trackEvents: boolean;
  trackConversions: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  dataRetentionPeriodDays: number;
  rawDataRetentionDays: number;
  aggregatedDataRetentionDays: number;
  autoCleanupOldData: boolean;
  enableDataExport: boolean;
  exportFormat: string;
  autoGenerateReports: boolean;
  reportSchedule: string;
  reportFrequency: string;
  reportRecipients: string;
  reportEmailRecipients: string;
  dashboardRefreshRate: number;
}

// Setting Change Log
export interface SettingChangeLog {
  id: number;
  adminUserId: number;
  category: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response Types
export interface SettingsResponse {
  [category: string]: {
    [key: string]: any;
  };
}

export interface UpdateSettingsResponse {
  success: boolean;
  updated: number;
}

// Category type
export type SettingsCategory =
  | 'general'
  | 'expert'
  | 'payment'
  | 'aiChat'
  | 'community'
  | 'notification'
  | 'security'
  | 'analytics';

// Tab configuration
export interface SettingsTab {
  id: SettingsCategory;
  label: string;
  icon?: string;
  description?: string;
}
