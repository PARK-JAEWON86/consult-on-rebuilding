# Settings Type Mismatch Issues

## Problem
The UI components use field names that don't match the TypeScript interface definitions in `types/admin/settings.ts`.

## Root Cause
When implementing the 6 new settings tabs, I created UI fields based on functional requirements without checking the existing TypeScript interfaces that were defined earlier.

## Solution Options

### Option 1: Update UI Components (RECOMMENDED)
Align all UI component field names with existing TypeScript interfaces. This preserves the backend seed data and API structure.

### Option 2: Update TypeScript Interfaces
Change the interfaces to match UI components, but this requires updating:
- Backend seed data (`settings.seed.ts`)
- Database migrations
- API responses

## Recommended Approach
Since this is development phase and no production data exists, I'll update the TypeScript interfaces to match the more user-friendly UI component names. This is cleaner for the long term.

## Field Name Mappings Needed

### AI Chat Settings
- Missing: `dailyRequestLimit`, `responseStyle`, `enableConversationMemory`, `autoDeleteOldData`
- Exists: `freeTokensPerMonth`, `maxTokensPerRequest`, `systemPrompt`, `dataRetentionDays`

### Analytics Settings  
- Missing: `defaultDateRange`, `showRealTimeData`, `reportFrequency`, `reportEmailRecipients`, `trackPageViews`, `trackEvents`, `trackConversions`, `trackPerformance`, `trackErrors`, `rawDataRetentionDays`, `aggregatedDataRetentionDays`, `autoCleanupOldData`
- Exists: `googleAnalyticsId`, `trackUserBehavior`, `autoGenerateReports`, `dashboardRefreshRate`

### Community Settings
- Missing: `dailyPostLimit`, `maxImagesPerPost`, `enableAutoModeration`, `anonymousReporting`, `enableComments`, `enableSharing`, `maxCommentDepth`
- Exists: `enableCommunity`, `postApprovalRequired`, `maxPostLength`, `bannedWords`, `reportThreshold`, `enablePostReactions`

### Notification Settings
- Missing: `emailFrom`, `emailFromName`, `firebaseProjectId`, notification event types
- Exists: `enableEmailNotifications`, `smtpHost`, `smtpPort`, `enablePushNotifications`

### Payment Settings
- Missing: `autoSettlement`, `settlementCycleDays`
- Exists: `paymentProvider`, `platformFee`, `refundPolicyPeriodDays`

### Security Settings
- Missing: `passwordRequireComplex`, `accountLockoutMinutes`, `require2faForAdmins`, `recommend2faForExperts`, `allowedIpAddresses`, `auditLogRetentionDays`, `encryptSensitiveData`, `enableAutoBackup`, `backupFrequencyHours`
- Exists: `sessionTimeoutMinutes`, `passwordMinLength`, `enable2fa`, `enableIpWhitelist`, `rateLimitPerMinute`

## Next Steps
1. Update TypeScript interfaces to include all missing fields
2. Update seed data to include default values for new fields
3. Verify TypeScript compilation succeeds
4. Test in browser
