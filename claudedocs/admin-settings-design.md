# Admin Settings Page Design - Consult On Platform

## Executive Summary

This document outlines the comprehensive design for the Admin Settings page, the final menu item in the admin sidebar. The settings page will provide administrators with centralized control over platform configuration, business rules, and operational parameters.

---

## 1. Platform Analysis

### Current System Architecture

**Service**: Consult On - Expert Consultation Platform

**Key Features**:
- User management (Clients, Experts, Admins)
- Expert application & approval workflow
- Reservation & session management
- Payment processing (Toss integration)
- AI chat consultation with token system
- Community platform (posts, comments, likes)
- Multi-tier expert ranking system
- Review & rating system
- Real-time notifications
- Comprehensive analytics

**Admin Menu Structure**:
1. Dashboard (Analytics overview)
2. Expert Applications (Application management)
3. User Management (User administration)
4. Analytics (Detailed metrics)
5. Content (Content moderation)
6. **Settings** ← NEW PAGE TO DESIGN

---

## 2. UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                    [Save All] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │              │  │                                │  │
│  │  Tab Menu    │  │     Content Area              │  │
│  │              │  │                                │  │
│  │  • General   │  │  Setting sections with         │  │
│  │  • Expert    │  │  - Headers                     │  │
│  │  • Payment   │  │  - Form inputs                 │  │
│  │  • AI Chat   │  │  - Toggle switches             │  │
│  │  • Community │  │  - Select dropdowns            │  │
│  │  • Notify    │  │  - Save buttons                │  │
│  │  • Security  │  │                                │  │
│  │  • Analytics │  │                                │  │
│  │              │  │                                │  │
│  └──────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Visual Design Principles

- **Consistency**: Match existing admin interface (gray-900 sidebar, blue-600 accents)
- **Clarity**: Clear section headers, descriptive labels, helper text
- **Efficiency**: Auto-save indicators, bulk save options
- **Feedback**: Toast notifications for save confirmations
- **Responsive**: Mobile-friendly with collapsible sidebar

---

## 3. Settings Categories

### 3.1 General Settings

**Purpose**: Core platform configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Platform Name | Text | "Consult On" | Display name across the platform |
| Platform Tagline | Text | "전문가 상담 플랫폼" | Subtitle for branding |
| Contact Email | Email | "support@consulton.com" | Primary contact email |
| Support Phone | Tel | "+82-10-xxxx-xxxx" | Support phone number |
| Business Address | Textarea | - | Physical business address |
| Timezone | Select | "Asia/Seoul" | Platform timezone |
| Default Language | Select | "ko" | Korean/English |
| Maintenance Mode | Toggle | OFF | Enable/disable platform access |
| Maintenance Message | Textarea | - | Message shown during maintenance |
| Max Upload Size | Number | 10 | Max file upload size (MB) |
| Allowed File Types | Multi-select | jpg,png,pdf | Permitted upload formats |

**UI Component**:
```tsx
<SettingSection title="General Settings" description="Core platform configuration">
  <InputField label="Platform Name" value="Consult On" />
  <InputField label="Platform Tagline" value="전문가 상담 플랫폼" />
  <InputField label="Contact Email" type="email" />
  <ToggleSwitch label="Maintenance Mode" />
  <SaveButton />
</SettingSection>
```

---

### 3.2 Expert Management Settings

**Purpose**: Configure expert-related business rules

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Auto-Approve Applications | Toggle | OFF | Auto-approve expert applications |
| Min Experience Years | Number | 1 | Minimum required experience |
| Require Certifications | Toggle | ON | Mandate certification uploads |
| Max Categories Per Expert | Number | 5 | Category selection limit |
| Min Hourly Rate | Number | 30000 | Minimum hourly rate (KRW) |
| Max Hourly Rate | Number | 500000 | Maximum hourly rate (KRW) |
| Default Hourly Rate | Number | 60000 | Default rate for new experts |
| Expert Level System | Toggle | ON | Enable tier/ranking system |
| Level Calculation Method | Select | "Score-based" | Algorithm for level calculation |
| Profile Review Required | Toggle | ON | Admin review before publishing |
| Profile Completion % | Number | 80 | Min completion for activation |
| Response Time Threshold | Select | "24 hours" | Max response time for experts |
| Auto-Deactivate Inactive | Toggle | OFF | Auto-deactivate after inactivity |
| Inactivity Period | Number | 90 | Days before deactivation |
| Commission Rate | Number | 15 | Platform commission % |

**UI Component**:
```tsx
<SettingSection title="Expert Management" description="Configure expert-related rules">
  <div className="grid grid-cols-2 gap-4">
    <ToggleSwitch label="Auto-Approve Applications" />
    <NumberInput label="Min Experience Years" min={0} max={30} />
  </div>
  <NumberInput label="Commission Rate" suffix="%" min={0} max={50} />
  <SaveButton />
</SettingSection>
```

---

### 3.3 Payment Settings

**Purpose**: Payment processing configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Payment Provider | Select | "Toss" | Active payment provider |
| Toss API Key | Password | - | Toss Payments API key |
| Toss Secret Key | Password | - | Toss Payments secret |
| Currency | Select | "KRW" | Default currency |
| Enable Credit System | Toggle | ON | Enable credit purchases |
| Credit to KRW Ratio | Number | 1000 | 1 credit = X KRW |
| Min Credit Purchase | Number | 10 | Minimum credit purchase |
| Max Credit Purchase | Number | 1000 | Maximum credit purchase |
| Credit Bonus Tiers | JSON Editor | [] | Bulk purchase bonuses |
| Refund Policy Period | Number | 7 | Days for refund eligibility |
| Auto-Refund Cancellations | Toggle | ON | Auto-refund canceled bookings |
| Refund Processing Fee | Number | 0 | Fee for refund processing (%) |
| Platform Fee | Number | 15 | Platform transaction fee (%) |
| Expert Payout Schedule | Select | "Weekly" | Payout frequency |
| Min Payout Amount | Number | 50000 | Min amount for payout (KRW) |

**UI Component**:
```tsx
<SettingSection title="Payment Settings" description="Configure payment processing">
  <SelectField label="Payment Provider" options={["Toss", "Stripe", "PayPal"]} />
  <PasswordField label="Toss API Key" />
  <NumberInput label="Platform Fee" suffix="%" />
  <JsonEditor label="Credit Bonus Tiers" />
  <SaveButton />
</SettingSection>
```

---

### 3.4 AI Chat Settings

**Purpose**: AI consultation configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable AI Chat | Toggle | ON | Enable AI consultation feature |
| AI Provider | Select | "OpenAI" | AI service provider |
| OpenAI API Key | Password | - | OpenAI API key |
| Default Model | Select | "gpt-4" | AI model to use |
| Free Tokens Per Month | Number | 10000 | Free tokens for users |
| Token Reset Day | Number | 1 | Day of month for reset |
| Max Tokens Per Request | Number | 4000 | Max tokens per AI request |
| Token Price (per 1000) | Number | 100 | Token purchase price (KRW) |
| Enable Token Purchase | Toggle | ON | Allow token purchases |
| System Prompt | Textarea | - | Default AI system prompt |
| Max Chat History | Number | 50 | Max messages per session |
| Enable Chat Export | Toggle | ON | Allow users to export chats |
| Data Retention Days | Number | 90 | Days to keep chat history |

**UI Component**:
```tsx
<SettingSection title="AI Chat Settings" description="Configure AI consultation">
  <ToggleSwitch label="Enable AI Chat" />
  <SelectField label="AI Provider" options={["OpenAI", "Anthropic"]} />
  <NumberInput label="Free Tokens Per Month" />
  <TextareaField label="System Prompt" rows={6} />
  <SaveButton />
</SettingSection>
```

---

### 3.5 Community Settings

**Purpose**: Community moderation configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable Community | Toggle | ON | Enable community features |
| Post Approval Required | Toggle | OFF | Require admin approval |
| Comment Approval Required | Toggle | OFF | Require comment approval |
| Allow Anonymous Posts | Toggle | ON | Allow anonymous posting |
| Allow Anonymous Comments | Toggle | ON | Allow anonymous comments |
| Max Post Length | Number | 10000 | Max characters in post |
| Max Comment Length | Number | 1000 | Max characters in comment |
| Max Attachments | Number | 5 | Max files per post |
| Banned Words | Textarea | - | Comma-separated banned words |
| Auto-Moderate Keywords | Textarea | - | Auto-flag keywords |
| Min Reputation for Posting | Number | 0 | Min rep to create posts |
| Min Reputation for Comments | Number | 0 | Min rep to comment |
| Report Threshold | Number | 5 | Reports before auto-hide |
| Pin Posts Duration | Number | 30 | Days before auto-unpin |
| Enable Post Reactions | Toggle | ON | Allow post likes |
| Enable Comment Reactions | Toggle | ON | Allow comment likes |

**UI Component**:
```tsx
<SettingSection title="Community Settings" description="Configure community moderation">
  <div className="grid grid-cols-2 gap-4">
    <ToggleSwitch label="Enable Community" />
    <ToggleSwitch label="Post Approval Required" />
  </div>
  <TextareaField label="Banned Words" placeholder="word1, word2, word3" />
  <NumberInput label="Report Threshold" min={1} max={100} />
  <SaveButton />
</SettingSection>
```

---

### 3.6 Notification Settings

**Purpose**: Notification system configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable Email Notifications | Toggle | ON | Enable email system |
| Email Provider | Select | "SendGrid" | Email service provider |
| SMTP Host | Text | - | SMTP server hostname |
| SMTP Port | Number | 587 | SMTP port |
| SMTP Username | Text | - | SMTP auth username |
| SMTP Password | Password | - | SMTP auth password |
| From Email | Email | "noreply@consulton.com" | Sender email address |
| From Name | Text | "Consult On" | Sender display name |
| Enable Push Notifications | Toggle | ON | Enable push notifications |
| Firebase Server Key | Password | - | Firebase Cloud Messaging key |
| Enable SMS Notifications | Toggle | OFF | Enable SMS alerts |
| SMS Provider | Select | "Twilio" | SMS service provider |
| Notification Retention | Number | 90 | Days to keep notifications |
| Default Priority | Select | "MEDIUM" | Default notification priority |
| Batch Digest Schedule | Select | "Daily" | Digest email frequency |
| Max Notifications Per Day | Number | 50 | Rate limit per user |

**Email Templates**:
- Reservation Confirmed
- Expert Approved
- Payment Success
- Review Received
- Session Starting Soon
- Password Reset
- Email Verification

**UI Component**:
```tsx
<SettingSection title="Notification Settings" description="Configure notification system">
  <Tabs>
    <Tab label="Email">
      <ToggleSwitch label="Enable Email Notifications" />
      <InputField label="SMTP Host" />
      <PasswordField label="SMTP Password" />
    </Tab>
    <Tab label="Push">
      <ToggleSwitch label="Enable Push Notifications" />
      <PasswordField label="Firebase Server Key" />
    </Tab>
    <Tab label="Templates">
      <EmailTemplateEditor templates={emailTemplates} />
    </Tab>
  </Tabs>
  <SaveButton />
</SettingSection>
```

---

### 3.7 Security Settings

**Purpose**: Platform security configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Session Timeout | Number | 60 | Minutes before auto-logout |
| Password Min Length | Number | 8 | Minimum password length |
| Require Uppercase | Toggle | ON | Require uppercase letters |
| Require Numbers | Toggle | ON | Require numbers in password |
| Require Symbols | Toggle | ON | Require special characters |
| Max Login Attempts | Number | 5 | Attempts before lockout |
| Lockout Duration | Number | 30 | Minutes for account lockout |
| Enable 2FA | Toggle | OFF | Two-factor authentication |
| 2FA Method | Select | "SMS" | SMS/Email/Authenticator |
| Enable IP Whitelist | Toggle | OFF | Restrict admin by IP |
| Whitelisted IPs | Textarea | - | Comma-separated IPs |
| Enable CORS | Toggle | ON | Cross-origin requests |
| Allowed Origins | Textarea | - | Allowed CORS origins |
| Rate Limit (API) | Number | 100 | Requests per minute |
| Enable Audit Logging | Toggle | ON | Log admin actions |
| Audit Retention Days | Number | 365 | Days to keep audit logs |
| Privacy Mode | Toggle | OFF | Enhanced privacy features |
| Data Encryption | Toggle | ON | Encrypt sensitive data |

**UI Component**:
```tsx
<SettingSection title="Security Settings" description="Configure security policies">
  <Alert type="warning">
    Changing security settings may affect user access. Proceed with caution.
  </Alert>
  <NumberInput label="Session Timeout" suffix="minutes" />
  <div className="border p-4 rounded">
    <h4 className="font-semibold mb-2">Password Policy</h4>
    <ToggleSwitch label="Require Uppercase" />
    <ToggleSwitch label="Require Numbers" />
    <ToggleSwitch label="Require Symbols" />
  </div>
  <ToggleSwitch label="Enable 2FA" />
  <SaveButton variant="danger" />
</SettingSection>
```

---

### 3.8 Analytics Settings

**Purpose**: Analytics and reporting configuration

**Settings**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable Analytics | Toggle | ON | Collect analytics data |
| Google Analytics ID | Text | - | GA tracking ID |
| Enable Mixpanel | Toggle | OFF | Mixpanel integration |
| Mixpanel Token | Password | - | Mixpanel project token |
| Enable Hotjar | Toggle | OFF | Hotjar heatmaps |
| Hotjar Site ID | Text | - | Hotjar tracking ID |
| Track User Behavior | Toggle | ON | Track user interactions |
| Track Expert Performance | Toggle | ON | Monitor expert metrics |
| Track Revenue Metrics | Toggle | ON | Revenue analytics |
| Data Retention Period | Number | 365 | Days to keep analytics data |
| Enable Data Export | Toggle | ON | Allow data exports |
| Export Format | Select | "CSV" | Default export format |
| Auto-Generate Reports | Toggle | ON | Scheduled report generation |
| Report Schedule | Select | "Weekly" | Report frequency |
| Report Recipients | Textarea | - | Email addresses for reports |
| Dashboard Refresh Rate | Number | 60 | Seconds between updates |

**UI Component**:
```tsx
<SettingSection title="Analytics Settings" description="Configure analytics and reporting">
  <ToggleSwitch label="Enable Analytics" />
  <InputField label="Google Analytics ID" placeholder="G-XXXXXXXXXX" />
  <SelectField label="Report Schedule" options={["Daily", "Weekly", "Monthly"]} />
  <TextareaField label="Report Recipients" placeholder="email1@example.com, email2@example.com" />
  <SaveButton />
</SettingSection>
```

---

## 4. Component Architecture

### File Structure

```
apps/web/src/
├── app/
│   └── admin/
│       └── settings/
│           └── page.tsx                    # Main settings page
├── components/
│   └── admin/
│       └── settings/
│           ├── SettingsTabs.tsx           # Tab navigation
│           ├── SettingSection.tsx         # Reusable section wrapper
│           ├── GeneralSettings.tsx        # Tab 1
│           ├── ExpertSettings.tsx         # Tab 2
│           ├── PaymentSettings.tsx        # Tab 3
│           ├── AIChatSettings.tsx         # Tab 4
│           ├── CommunitySettings.tsx      # Tab 5
│           ├── NotificationSettings.tsx   # Tab 6
│           ├── SecuritySettings.tsx       # Tab 7
│           └── AnalyticsSettings.tsx      # Tab 8
└── types/
    └── admin/
        └── settings.ts                     # TypeScript interfaces
```

### Component Hierarchy

```tsx
<AdminSettingsPage>
  <PageHeader title="Settings" />

  <SettingsTabs>
    <Tab id="general">
      <GeneralSettings />
    </Tab>
    <Tab id="expert">
      <ExpertSettings />
    </Tab>
    <Tab id="payment">
      <PaymentSettings />
    </Tab>
    <Tab id="ai-chat">
      <AIChatSettings />
    </Tab>
    <Tab id="community">
      <CommunitySettings />
    </Tab>
    <Tab id="notification">
      <NotificationSettings />
    </Tab>
    <Tab id="security">
      <SecuritySettings />
    </Tab>
    <Tab id="analytics">
      <AnalyticsSettings />
    </Tab>
  </SettingsTabs>
</AdminSettingsPage>
```

### Reusable Components

**SettingSection.tsx**
```tsx
interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  alert?: {
    type: 'info' | 'warning' | 'error';
    message: string;
  };
}

export function SettingSection({ title, description, children, alert }: SettingSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      {alert && <Alert type={alert.type}>{alert.message}</Alert>}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
```

**InputField.tsx**
```tsx
interface InputFieldProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
}

export function InputField({ label, value, onChange, type = 'text', ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
      {props.helpText && <p className="text-xs text-gray-500 mt-1">{props.helpText}</p>}
    </div>
  );
}
```

**ToggleSwitch.tsx**
```tsx
interface ToggleSwitchProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ label, checked, onChange, description, disabled }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
```

---

## 5. API Structure

### Backend Endpoints

**Base Path**: `/admin/settings`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/admin/settings` | Get all settings | - | `{ settings: Settings }` |
| GET | `/admin/settings/:category` | Get category settings | - | `{ settings: CategorySettings }` |
| PUT | `/admin/settings/:category` | Update category settings | `{ [key]: value }` | `{ success: true }` |
| POST | `/admin/settings/reset/:category` | Reset to defaults | - | `{ success: true }` |
| GET | `/admin/settings/history` | Get change history | - | `{ history: ChangeLog[] }` |
| POST | `/admin/settings/export` | Export settings | - | `{ file: string }` |
| POST | `/admin/settings/import` | Import settings | `{ file: string }` | `{ success: true }` |

### TypeScript Interfaces

```typescript
// apps/web/src/types/admin/settings.ts

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
}

export interface CreditBonusTier {
  minAmount: number;
  bonusPercentage: number;
}

export interface AIChatSettings {
  enableAiChat: boolean;
  aiProvider: string;
  openaiApiKey: string;
  defaultModel: string;
  freeTokensPerMonth: number;
  tokenResetDay: number;
  maxTokensPerRequest: number;
  tokenPricePer1000: number;
  enableTokenPurchase: boolean;
  systemPrompt: string;
  maxChatHistory: number;
  enableChatExport: boolean;
  dataRetentionDays: number;
}

export interface CommunitySettings {
  enableCommunity: boolean;
  postApprovalRequired: boolean;
  commentApprovalRequired: boolean;
  allowAnonymousPosts: boolean;
  allowAnonymousComments: boolean;
  maxPostLength: number;
  maxCommentLength: number;
  maxAttachments: number;
  bannedWords: string;
  autoModerateKeywords: string;
  minReputationForPosting: number;
  minReputationForComments: number;
  reportThreshold: number;
  pinPostsDuration: number;
  enablePostReactions: boolean;
  enableCommentReactions: boolean;
}

export interface NotificationSettings {
  enableEmailNotifications: boolean;
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enablePushNotifications: boolean;
  firebaseServerKey: string;
  enableSmsNotifications: boolean;
  smsProvider: string;
  notificationRetentionDays: number;
  defaultPriority: string;
  batchDigestSchedule: string;
  maxNotificationsPerDay: number;
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  enable2fa: boolean;
  twoFaMethod: string;
  enableIpWhitelist: boolean;
  whitelistedIps: string;
  enableCors: boolean;
  allowedOrigins: string;
  rateLimitPerMinute: number;
  enableAuditLogging: boolean;
  auditRetentionDays: number;
  privacyMode: boolean;
  dataEncryption: boolean;
}

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
  dataRetentionPeriodDays: number;
  enableDataExport: boolean;
  exportFormat: string;
  autoGenerateReports: boolean;
  reportSchedule: string;
  reportRecipients: string;
  dashboardRefreshRate: number;
}

export interface SettingChangeLog {
  id: number;
  adminUserId: number;
  category: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  changedAt: Date;
  ipAddress: string;
}
```

---

## 6. Database Schema

### New Table: PlatformSettings

```prisma
model PlatformSettings {
  id        Int      @id @default(autoincrement())
  category  String   // 'general', 'expert', 'payment', etc.
  key       String   // Setting key name
  value     Json     // Setting value (flexible type)
  dataType  String   // 'string', 'number', 'boolean', 'json', 'password'
  isPublic  Boolean  @default(false) // Whether setting is publicly visible
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([category, key])
  @@index([category])
}

model SettingChangeLog {
  id          Int      @id @default(autoincrement())
  adminUserId Int
  category    String
  settingKey  String
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([adminUserId, createdAt])
  @@index([category, settingKey])
  @@index([createdAt])
}
```

### Seed Data (Default Settings)

```typescript
// apps/api/prisma/seeds/platform-settings.seed.ts

export const defaultSettings = {
  general: {
    platformName: 'Consult On',
    platformTagline: '전문가 상담 플랫폼',
    contactEmail: 'support@consulton.com',
    supportPhone: '+82-10-xxxx-xxxx',
    timezone: 'Asia/Seoul',
    defaultLanguage: 'ko',
    maintenanceMode: false,
    maxUploadSize: 10,
    allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx']
  },
  expert: {
    autoApproveApplications: false,
    minExperienceYears: 1,
    requireCertifications: true,
    maxCategoriesPerExpert: 5,
    minHourlyRate: 30000,
    maxHourlyRate: 500000,
    defaultHourlyRate: 60000,
    expertLevelSystem: true,
    profileReviewRequired: true,
    profileCompletionPercentage: 80,
    commissionRate: 15
  },
  payment: {
    paymentProvider: 'toss',
    currency: 'KRW',
    enableCreditSystem: true,
    creditToKrwRatio: 1000,
    minCreditPurchase: 10,
    maxCreditPurchase: 1000,
    platformFee: 15,
    expertPayoutSchedule: 'weekly',
    minPayoutAmount: 50000
  },
  aiChat: {
    enableAiChat: true,
    aiProvider: 'openai',
    defaultModel: 'gpt-4',
    freeTokensPerMonth: 10000,
    tokenResetDay: 1,
    maxTokensPerRequest: 4000,
    maxChatHistory: 50,
    enableChatExport: true,
    dataRetentionDays: 90
  },
  community: {
    enableCommunity: true,
    postApprovalRequired: false,
    commentApprovalRequired: false,
    allowAnonymousPosts: true,
    allowAnonymousComments: true,
    maxPostLength: 10000,
    maxCommentLength: 1000,
    maxAttachments: 5,
    reportThreshold: 5,
    enablePostReactions: true,
    enableCommentReactions: true
  },
  notification: {
    enableEmailNotifications: true,
    emailProvider: 'sendgrid',
    smtpPort: 587,
    fromEmail: 'noreply@consulton.com',
    fromName: 'Consult On',
    enablePushNotifications: true,
    notificationRetentionDays: 90,
    defaultPriority: 'MEDIUM',
    maxNotificationsPerDay: 50
  },
  security: {
    sessionTimeoutMinutes: 60,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    enable2fa: false,
    enableCors: true,
    rateLimitPerMinute: 100,
    enableAuditLogging: true,
    auditRetentionDays: 365,
    dataEncryption: true
  },
  analytics: {
    enableAnalytics: true,
    trackUserBehavior: true,
    trackExpertPerformance: true,
    trackRevenueMetrics: true,
    dataRetentionPeriodDays: 365,
    enableDataExport: true,
    exportFormat: 'csv',
    autoGenerateReports: true,
    reportSchedule: 'weekly',
    dashboardRefreshRate: 60
  }
};
```

---

## 7. Implementation Priority

### Phase 1: Core Settings (Week 1)
- ✅ Create database schema
- ✅ Build API endpoints
- ✅ Implement General Settings tab
- ✅ Implement Expert Settings tab
- ✅ Implement Payment Settings tab

### Phase 2: Feature Settings (Week 2)
- ✅ Implement AI Chat Settings tab
- ✅ Implement Community Settings tab
- ✅ Implement Notification Settings tab

### Phase 3: Advanced Settings (Week 3)
- ✅ Implement Security Settings tab
- ✅ Implement Analytics Settings tab
- ✅ Add settings change history
- ✅ Add import/export functionality

### Phase 4: Polish & Testing (Week 4)
- ✅ Auto-save functionality
- ✅ Validation and error handling
- ✅ Toast notifications
- ✅ Mobile responsiveness
- ✅ Integration testing
- ✅ Security audit

---

## 8. Security Considerations

### Access Control
- Only users with `ADMIN` role can access settings
- Certain sensitive settings require `SUPER_ADMIN` role
- Audit log all settings changes with IP and timestamp

### Data Protection
- Encrypt sensitive settings (API keys, passwords) in database
- Mask sensitive values in UI (show as `••••••••`)
- Never expose sensitive settings in API responses to non-admins

### Validation
- Server-side validation for all settings updates
- Rate limiting on settings API endpoints
- Prevent SQL injection with parameterized queries

### Change Management
- Require confirmation for critical settings changes
- Ability to rollback to previous settings
- Email notifications to admins on settings changes

---

## 9. User Experience Features

### Auto-Save
- Debounced auto-save after 2 seconds of inactivity
- Visual indicator showing "Saving..." → "Saved ✓"
- Prevent navigation with unsaved changes warning

### Search & Filter
- Search bar to find specific settings
- Filter settings by category
- Quick navigation sidebar

### Validation & Feedback
- Real-time validation for email, URL, number formats
- Color-coded validation states (red for error, green for success)
- Helpful error messages with suggestions
- Success toast notifications on save

### Help & Documentation
- Tooltip icons (?) next to complex settings
- Link to documentation for detailed explanations
- Example values for complex JSON settings
- Warning alerts for settings with significant impact

### Responsive Design
- Mobile-friendly layout with collapsible sidebar
- Touch-friendly toggle switches
- Optimized for tablets and mobile devices

---

## 10. Testing Strategy

### Unit Tests
- Test each settings component renders correctly
- Test form validation logic
- Test API service functions

### Integration Tests
- Test settings save and retrieve flow
- Test settings cascade effects (e.g., changing payment provider updates related fields)
- Test permission-based access control

### E2E Tests
- Test complete settings update workflow
- Test import/export functionality
- Test settings history and rollback

### Security Tests
- Test unauthorized access attempts
- Test SQL injection prevention
- Test XSS attack prevention
- Test sensitive data encryption

---

## 11. Performance Optimization

### Lazy Loading
- Load settings tabs on demand
- Lazy load heavy components (JSON editors, file uploaders)

### Caching
- Cache settings in Redis with 5-minute TTL
- Invalidate cache on settings update
- Client-side cache with SWR or React Query

### Optimization
- Debounce search and filter inputs
- Optimize re-renders with React.memo
- Use virtual scrolling for long lists

---

## 12. Monitoring & Analytics

### Metrics to Track
- Settings change frequency by category
- Most frequently changed settings
- Settings errors and validation failures
- Average time to save settings
- Admin user engagement with settings

### Alerts
- Email alert on critical settings changes
- Slack notification for security settings changes
- Log alerts for failed settings updates

---

## Summary

This comprehensive design provides a complete, production-ready admin settings page for the Consult On platform. The settings are organized into 8 logical categories covering all aspects of platform configuration:

1. **General** - Core platform settings
2. **Expert** - Expert management rules
3. **Payment** - Payment processing config
4. **AI Chat** - AI consultation settings
5. **Community** - Community moderation
6. **Notification** - Notification system
7. **Security** - Security policies
8. **Analytics** - Analytics tracking

The design emphasizes:
- ✅ **Usability** - Clear organization, helpful UI components
- ✅ **Security** - Role-based access, audit logging, encryption
- ✅ **Scalability** - Flexible JSON storage, easy to extend
- ✅ **Maintainability** - Reusable components, TypeScript types
- ✅ **Performance** - Caching, lazy loading, optimized updates

This design can be implemented in phases, starting with core settings and progressively adding advanced features.
