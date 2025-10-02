# Admin Settings Implementation Guide

## Quick Start

This guide provides step-by-step instructions for implementing the admin settings page for Consult On platform.

---

## Prerequisites

✅ Admin authentication working
✅ AdminSidebar component exists
✅ API routes protected with admin guards
✅ Prisma schema accessible
✅ Environment variables configured

---

## Implementation Checklist

### Phase 1: Database Setup (Day 1)

- [ ] **1.1 Create Prisma Schema**
  ```prisma
  // Add to apps/api/prisma/schema.prisma

  model PlatformSettings {
    id        Int      @id @default(autoincrement())
    category  String
    key       String
    value     Json
    dataType  String
    isPublic  Boolean  @default(false)
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

- [ ] **1.2 Run Migration**
  ```bash
  cd apps/api
  npx prisma migrate dev --name add_platform_settings
  npx prisma generate
  ```

- [ ] **1.3 Create Seed Data**
  ```bash
  # Create apps/api/prisma/seeds/settings.seed.ts
  # Run: npx prisma db seed
  ```

### Phase 2: Backend API (Day 2-3)

- [ ] **2.1 Create Settings Service**
  ```typescript
  // apps/api/src/admin/settings/settings.service.ts

  @Injectable()
  export class SettingsService {
    constructor(private prisma: PrismaService) {}

    async getAllSettings() { }
    async getSettingsByCategory(category: string) { }
    async updateSettings(category: string, data: any) { }
    async resetSettings(category: string) { }
    async getChangeHistory() { }
  }
  ```

- [ ] **2.2 Create Settings Controller**
  ```typescript
  // apps/api/src/admin/settings/settings.controller.ts

  @Controller('admin/settings')
  @UseGuards(AdminGuard)
  export class SettingsController {
    constructor(private settingsService: SettingsService) {}

    @Get()
    async getAllSettings() { }

    @Get(':category')
    async getCategorySettings(@Param('category') category: string) { }

    @Put(':category')
    async updateSettings(@Param('category') category: string, @Body() data: any) { }

    @Post('reset/:category')
    async resetSettings(@Param('category') category: string) { }

    @Get('history')
    async getHistory() { }
  }
  ```

- [ ] **2.3 Add to Admin Module**
  ```typescript
  // apps/api/src/admin/admin.module.ts

  @Module({
    imports: [PrismaModule],
    controllers: [SettingsController],
    providers: [SettingsService],
  })
  export class AdminModule {}
  ```

- [ ] **2.4 Test API Endpoints**
  ```bash
  # Test with curl or Postman
  GET http://localhost:3000/api/admin/settings
  GET http://localhost:3000/api/admin/settings/general
  PUT http://localhost:3000/api/admin/settings/general
  ```

### Phase 3: TypeScript Types (Day 3)

- [ ] **3.1 Create Settings Types**
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

  export interface GeneralSettings { /* ... */ }
  export interface ExpertSettings { /* ... */ }
  // ... etc
  ```

### Phase 4: Reusable Components (Day 4-5)

- [ ] **4.1 SettingSection Component**
  ```typescript
  // apps/web/src/components/admin/settings/SettingSection.tsx

  interface SettingSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    alert?: { type: string; message: string };
  }

  export function SettingSection({ ... }: SettingSectionProps) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="border-b pb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
        {alert && <Alert type={alert.type}>{alert.message}</Alert>}
        <div className="space-y-4 mt-4">{children}</div>
      </div>
    );
  }
  ```

- [ ] **4.2 Input Components**
  - `InputField.tsx` - Text/email/number inputs
  - `ToggleSwitch.tsx` - Toggle switches
  - `SelectField.tsx` - Dropdown selects
  - `TextareaField.tsx` - Multi-line text
  - `PasswordField.tsx` - Password with show/hide
  - `JsonEditor.tsx` - JSON editing with validation

- [ ] **4.3 Utility Components**
  - `SaveButton.tsx` - Save action button
  - `Alert.tsx` - Alert messages
  - `LoadingSpinner.tsx` - Loading states
  - `Toast.tsx` - Toast notifications

### Phase 5: Settings Tabs (Day 6-10)

- [ ] **5.1 General Settings Tab**
  ```typescript
  // apps/web/src/components/admin/settings/GeneralSettings.tsx

  export function GeneralSettings() {
    const [settings, setSettings] = useState<GeneralSettings>({});
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
      // Save logic
    };

    return (
      <>
        <SettingSection title="Platform Information">
          <InputField label="Platform Name" value={settings.platformName} />
          <InputField label="Platform Tagline" value={settings.platformTagline} />
          <SaveButton onClick={handleSave} loading={loading} />
        </SettingSection>
      </>
    );
  }
  ```

- [ ] **5.2 Expert Settings Tab**
- [ ] **5.3 Payment Settings Tab**
- [ ] **5.4 AI Chat Settings Tab**
- [ ] **5.5 Community Settings Tab**
- [ ] **5.6 Notification Settings Tab**
- [ ] **5.7 Security Settings Tab**
- [ ] **5.8 Analytics Settings Tab**

### Phase 6: Main Settings Page (Day 11)

- [ ] **6.1 Create Settings Page**
  ```typescript
  // apps/web/src/app/admin/settings/page.tsx

  'use client'

  import { useState } from 'react';
  import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
  import { ExpertSettings } from '@/components/admin/settings/ExpertSettings';
  // ... import other tabs

  const TABS = [
    { id: 'general', label: 'General', component: GeneralSettings },
    { id: 'expert', label: 'Expert', component: ExpertSettings },
    { id: 'payment', label: 'Payment', component: PaymentSettings },
    { id: 'ai-chat', label: 'AI Chat', component: AIChatSettings },
    { id: 'community', label: 'Community', component: CommunitySettings },
    { id: 'notification', label: 'Notification', component: NotificationSettings },
    { id: 'security', label: 'Security', component: SecuritySettings },
    { id: 'analytics', label: 'Analytics', component: AnalyticsSettings },
  ];

  export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    const ActiveComponent = TABS.find(t => t.id === activeTab)?.component;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            💾 Save All
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    );
  }
  ```

- [ ] **6.2 Update Admin Sidebar Link**
  ```typescript
  // Verify /admin/settings link in AdminSidebar.tsx is pointing correctly
  ```

### Phase 7: State Management & API Integration (Day 12)

- [ ] **7.1 Create Settings API Service**
  ```typescript
  // apps/web/src/lib/api/settings.ts

  import { api } from '@/lib/api';

  export const settingsApi = {
    getAll: () => api.get('/admin/settings'),
    getCategory: (category: string) => api.get(`/admin/settings/${category}`),
    update: (category: string, data: any) =>
      api.put(`/admin/settings/${category}`, data),
    reset: (category: string) =>
      api.post(`/admin/settings/reset/${category}`),
    getHistory: () => api.get('/admin/settings/history'),
  };
  ```

- [ ] **7.2 Implement Auto-Save**
  ```typescript
  // Use debounced auto-save with useEffect

  const debouncedSave = useMemo(
    () => debounce(async (data) => {
      await settingsApi.update(category, data);
      toast.success('Settings saved');
    }, 2000),
    []
  );

  useEffect(() => {
    debouncedSave(settings);
  }, [settings]);
  ```

- [ ] **7.3 Add Validation**
  ```typescript
  // Add Zod schemas for validation

  import { z } from 'zod';

  const generalSettingsSchema = z.object({
    platformName: z.string().min(1).max(100),
    contactEmail: z.string().email(),
    maxUploadSize: z.number().min(1).max(100),
  });
  ```

### Phase 8: Testing (Day 13-14)

- [ ] **8.1 Unit Tests**
  ```typescript
  // apps/web/src/components/admin/settings/__tests__/SettingSection.test.tsx

  import { render, screen } from '@testing-library/react';
  import { SettingSection } from '../SettingSection';

  describe('SettingSection', () => {
    it('renders title and description', () => {
      render(
        <SettingSection title="Test" description="Test description">
          <div>Content</div>
        </SettingSection>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
  ```

- [ ] **8.2 Integration Tests**
  ```typescript
  // Test full settings update flow
  ```

- [ ] **8.3 E2E Tests**
  ```typescript
  // Test with Playwright or Cypress
  ```

### Phase 9: Polish & Optimization (Day 15)

- [ ] **9.1 Add Loading States**
- [ ] **9.2 Add Error Handling**
- [ ] **9.3 Add Toast Notifications**
- [ ] **9.4 Optimize Bundle Size**
- [ ] **9.5 Add Keyboard Shortcuts**
- [ ] **9.6 Test Mobile Responsiveness**
- [ ] **9.7 Accessibility Audit**

### Phase 10: Security & Deployment (Day 16)

- [ ] **10.1 Security Review**
  - Encrypt sensitive settings (API keys)
  - Audit log all changes
  - Rate limiting on endpoints
  - Input validation/sanitization

- [ ] **10.2 Performance Testing**
  - Load testing settings API
  - Check database query performance
  - Optimize re-renders

- [ ] **10.3 Documentation**
  - Add inline code comments
  - Update API documentation
  - Create user guide

- [ ] **10.4 Deploy to Staging**
  - Test in staging environment
  - Verify database migrations
  - Test with real data

- [ ] **10.5 Production Deployment**
  - Run migrations
  - Seed default settings
  - Monitor for errors

---

## File Structure Reference

```
apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma                    # Add PlatformSettings model
│   │   └── seeds/
│   │       └── settings.seed.ts             # Default settings data
│   └── src/
│       └── admin/
│           └── settings/
│               ├── settings.module.ts
│               ├── settings.controller.ts
│               ├── settings.service.ts
│               └── dto/
│                   ├── update-settings.dto.ts
│                   └── settings-response.dto.ts
│
└── web/
    └── src/
        ├── app/
        │   └── admin/
        │       └── settings/
        │           └── page.tsx              # Main settings page
        ├── components/
        │   └── admin/
        │       └── settings/
        │           ├── SettingSection.tsx
        │           ├── GeneralSettings.tsx
        │           ├── ExpertSettings.tsx
        │           ├── PaymentSettings.tsx
        │           ├── AIChatSettings.tsx
        │           ├── CommunitySettings.tsx
        │           ├── NotificationSettings.tsx
        │           ├── SecuritySettings.tsx
        │           ├── AnalyticsSettings.tsx
        │           └── shared/
        │               ├── InputField.tsx
        │               ├── ToggleSwitch.tsx
        │               ├── SelectField.tsx
        │               ├── SaveButton.tsx
        │               └── Alert.tsx
        ├── lib/
        │   └── api/
        │       └── settings.ts               # API service functions
        └── types/
            └── admin/
                └── settings.ts                # TypeScript interfaces
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/settings` | Get all settings |
| GET | `/admin/settings/:category` | Get category settings |
| PUT | `/admin/settings/:category` | Update settings |
| POST | `/admin/settings/reset/:category` | Reset to defaults |
| GET | `/admin/settings/history` | Get change history |

---

## Environment Variables

Add to `.env`:

```env
# Payment
TOSS_API_KEY=
TOSS_SECRET_KEY=

# AI
OPENAI_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# Push Notifications
FIREBASE_SERVER_KEY=

# Analytics
GOOGLE_ANALYTICS_ID=
MIXPANEL_TOKEN=
HOTJAR_SITE_ID=
```

---

## Common Commands

```bash
# Database
npx prisma migrate dev --name add_settings
npx prisma generate
npx prisma db seed
npx prisma studio

# Development
npm run dev                # Start both api and web
npm run dev:api            # API only
npm run dev:web            # Web only

# Testing
npm run test               # Run all tests
npm run test:watch         # Watch mode
npm run test:e2e           # E2E tests

# Build
npm run build
npm run start

# Linting
npm run lint
npm run lint:fix
npm run typecheck
```

---

## Troubleshooting

### Issue: Settings not saving

**Solution**: Check browser console for API errors, verify admin authentication, check API endpoint accessibility.

### Issue: Type errors in TypeScript

**Solution**: Run `npx prisma generate` to update Prisma types, restart TypeScript server.

### Issue: Slow settings page load

**Solution**: Implement pagination for history, add loading skeletons, optimize queries with proper indexes.

### Issue: Missing settings after migration

**Solution**: Run seed script: `npx prisma db seed`

---

## Performance Benchmarks

Target metrics:

- Settings load time: < 500ms
- Settings save time: < 300ms
- Page interactive time: < 1s
- Bundle size: < 200KB (settings page)

---

## Security Checklist

- [x] Admin-only access enforced
- [x] API keys encrypted at rest
- [x] Input validation on all fields
- [x] SQL injection prevention
- [x] XSS attack prevention
- [x] CSRF protection enabled
- [x] Rate limiting configured
- [x] Audit logging enabled
- [x] Sensitive data masked in UI
- [x] HTTPS enforced in production

---

## Next Steps After Implementation

1. **Monitor Usage**: Track which settings are changed most frequently
2. **Gather Feedback**: Ask admins for UI/UX improvements
3. **Add Features**: Import/export settings, version control, A/B testing
4. **Optimize**: Profile performance, reduce bundle size
5. **Document**: Create admin user guide, video tutorials

---

## Support

For questions or issues:
- Review design documents in `claudedocs/`
- Check API documentation
- Contact development team

---

**Estimated Total Time**: 16 days (2-3 weeks)

**Priority**: High
**Complexity**: Medium-High
**Dependencies**: Admin auth, Prisma setup, API infrastructure

---

Good luck with the implementation! 🚀
