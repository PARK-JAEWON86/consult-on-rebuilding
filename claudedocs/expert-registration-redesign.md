# Expert Registration Flow Redesign

## 📋 Overview

**Current State**: 4-step registration (기본정보 → 전문정보 → 일정/자격증 → 검수 및 약관)
**Target State**: 3-step registration (기본정보 + 본인인증 → 전문정보 + 일정/자격증 → 검수 및 약관)

**Key Improvements**:
1. ✅ Add phone verification to step 1 (신뢰성 확보)
2. ✅ Merge steps 2 & 3 into consolidated expert information page
3. ✅ Reference expert profile detail page for consistent UX
4. ✅ Streamline registration flow for better conversion

---

## 🎯 Design Goals

- **Trust Building**: Phone verification establishes credibility early
- **Efficiency**: Reduce steps from 4 to 3 without information loss
- **Consistency**: Match expert profile detail layout for familiarity
- **Conversion**: Minimize drop-off with logical information grouping

---

## 📊 Registration Flow Comparison

### Current Flow (4 Steps)
```
Step 1: 기본정보
├─ 이름, 이메일, 직무
└─ 프로필 이미지

Step 2: 전문정보
├─ 전문분야, 경력
├─ 자기소개, 키워드
└─ 상담 유형

Step 3: 일정/자격증
├─ 주간 가능 일정
└─ 자격증 목록

Step 4: 검수 및 약관
├─ 검수 안내
└─ 약관 동의
```

### New Flow (3 Steps)
```
Step 1: 기본정보 + 본인인증
├─ 이름, 이메일, 직무
├─ 프로필 이미지
└─ 📱 휴대폰 본인인증 (NEW)

Step 2: 전문정보 (통합)
├─ 전문분야, 경력
├─ 자기소개, 키워드
├─ 상담 유형
├─ 주간 가능 일정 (MERGED)
└─ 자격증 목록 (MERGED)

Step 3: 검수 및 약관
├─ 검수 안내
└─ 약관 동의
```

---

## 🔐 Step 1: Basic Information + Phone Verification

### Layout Structure

```tsx
<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Row 1: Personal Info */}
  <div>이름</div>
  <div>이메일</div>

  {/* Row 2: Professional & Profile */}
  <div>직무</div>
  <div>프로필 이미지</div>

  {/* Row 3: Phone Verification (Full Width) */}
  <div className="md:col-span-2">
    휴대폰 본인인증
  </div>
</section>
```

### Phone Verification Component Design

#### Visual Design
```tsx
<div className="border border-gray-300 rounded-lg p-5 bg-gray-50">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center">
      <Phone className="h-5 w-5 text-blue-600 mr-2" />
      <h3 className="text-sm font-semibold text-gray-900">
        휴대폰 본인인증
      </h3>
      <Badge variant="blue" className="ml-2">필수</Badge>
    </div>
    {verified && (
      <Badge variant="green" className="flex items-center">
        <CheckCircle className="h-4 w-4 mr-1" />
        인증완료
      </Badge>
    )}
  </div>

  <p className="text-sm text-gray-600 mb-4">
    전문가 신뢰도 확보를 위해 본인인증이 필요합니다
  </p>

  {!verified ? (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="휴대폰 번호 (예: 01012345678)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          maxLength={11}
        />
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium whitespace-nowrap"
        >
          인증번호 발송
        </button>
      </div>

      {codeSent && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="인증번호 6자리"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            maxLength={6}
          />
          <button
            type="button"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            인증 확인
          </button>
        </div>
      )}

      {codeSent && (
        <p className="text-xs text-gray-500">
          {timeLeft > 0
            ? `인증번호 유효시간: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
            : '인증번호가 만료되었습니다. 재발송 해주세요.'
          }
        </p>
      )}
    </div>
  ) : (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        <div>
          <p className="text-sm font-medium text-green-900">
            본인인증이 완료되었습니다
          </p>
          <p className="text-xs text-green-700 mt-1">
            {verifiedPhone}
          </p>
        </div>
      </div>
    </div>
  )}
</div>
```

#### Validation Rules
```typescript
const canGoNextStep1 =
  fullName.trim() !== '' &&
  email.trim() !== '' &&
  jobTitle.trim() !== '' &&
  phoneVerified === true  // NEW: Phone verification required
```

#### State Management
```typescript
// Phone verification state
const [phoneNumber, setPhoneNumber] = useState('')
const [verificationCode, setVerificationCode] = useState('')
const [codeSent, setCodeSent] = useState(false)
const [phoneVerified, setPhoneVerified] = useState(false)
const [verifiedPhone, setVerifiedPhone] = useState('')
const [timeLeft, setTimeLeft] = useState(180) // 3 minutes

// Handlers
const handleSendVerificationCode = async () => {
  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    })
    const result = await response.json()
    if (result.success) {
      setCodeSent(true)
      setTimeLeft(180)
      showToast('success', '인증번호가 발송되었습니다')
    }
  } catch (error) {
    showToast('error', '인증번호 발송에 실패했습니다')
  }
}

const handleVerifyCode = async () => {
  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code: verificationCode })
    })
    const result = await response.json()
    if (result.success) {
      setPhoneVerified(true)
      setVerifiedPhone(phoneNumber)
      showToast('success', '본인인증이 완료되었습니다')
    } else {
      showToast('error', '인증번호가 일치하지 않습니다')
    }
  } catch (error) {
    showToast('error', '인증 확인에 실패했습니다')
  }
}
```

---

## 🎓 Step 2: Professional Information (Consolidated)

### Layout Strategy

Reference expert profile detail page sections:
- ✅ Basic expert info (name, specialty, experience)
- ✅ Bio/description with 30+ character validation
- ✅ Keywords for consultation topics
- ✅ Consultation types (video, chat, voice)
- ✅ **Availability schedule** (merged from step 3)
- ✅ **Certifications** (merged from step 3)

### Tabbed Interface Design

```tsx
<div className="space-y-6">
  {/* Tab Navigation */}
  <div className="border-b border-gray-200">
    <nav className="flex space-x-8">
      <button
        onClick={() => setActiveSubTab('basic')}
        className={`py-3 px-1 border-b-2 font-medium text-sm ${
          activeSubTab === 'basic'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        기본 정보
      </button>
      <button
        onClick={() => setActiveSubTab('schedule')}
        className={`py-3 px-1 border-b-2 font-medium text-sm ${
          activeSubTab === 'schedule'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        일정 및 자격증
      </button>
    </nav>
  </div>

  {/* Tab Content */}
  <div className="pt-4">
    {activeSubTab === 'basic' && <BasicInfoSection />}
    {activeSubTab === 'schedule' && <ScheduleCertSection />}
  </div>
</div>
```

### Section 1: Basic Information

```tsx
<div className="space-y-6">
  {/* Specialty & Experience (Row 1) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        전문 분야 <span className="text-red-500">*</span>
      </label>
      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">선택하세요</option>
        {categories.map((category) => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        경력 (년) <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        min={0}
        value={experienceYears}
        onChange={(e) => setExperienceYears(parseInt(e.target.value || '0'))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  </div>

  {/* Bio (Full Width) */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      자기소개 <span className="text-red-500">*</span>
      <span className="text-xs text-gray-500 ml-2">
        (최소 30자, {bio.length}/30)
      </span>
    </label>
    <textarea
      value={bio}
      onChange={(e) => setBio(e.target.value)}
      rows={5}
      placeholder="전문 분야와 상담 방식, 강점을 소개해 주세요..."
      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
    />
  </div>

  {/* Keywords */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      키워드 (상담 주제)
    </label>
    {/* ... keyword management UI ... */}
  </div>

  {/* Consultation Types */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      제공 가능한 상담 유형 <span className="text-red-500">*</span>
    </label>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ... consultation type cards ... */}
    </div>
  </div>
</div>
```

### Section 2: Schedule & Certifications

```tsx
<div className="space-y-8">
  {/* Schedule Section */}
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
      상담 가능한 일정
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      고객이 예약할 수 있는 주간 일정을 설정하세요
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(Object.keys(dayLabels) as DayKey[]).map((day) => (
        <div key={day} className="p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-800">
              {dayLabels[day]}
            </span>
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={availability[day].available}
                onChange={(e) =>
                  handleAvailabilityChange(day, 'available', e.target.checked)
                }
                className="mr-2"
              />
              가능
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={availability[day].hours}
              onChange={(e) =>
                handleAvailabilityChange(day, 'hours', e.target.value)
              }
              placeholder="예: 09:00-18:00"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!availability[day].available}
            />
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Certifications Section */}
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <Award className="h-5 w-5 text-blue-600 mr-2" />
      자격증 및 발급기관
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      보유하신 자격증을 추가하여 전문성을 어필하세요
    </p>

    <div className="space-y-3">
      {certifications.map((cert, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <input
            type="text"
            value={cert.name}
            onChange={(e) => updateCertification(idx, 'name', e.target.value)}
            placeholder="자격증명 (예: 임상심리사 1급)"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cert.issuer}
              onChange={(e) => updateCertification(idx, 'issuer', e.target.value)}
              placeholder="발급기관 (예: 한국산업인력공단)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            {certifications.length > 1 && (
              <button
                type="button"
                onClick={() => removeCertification(idx)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={addCertification}
      className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
    >
      <Plus className="w-4 h-4 mr-1" /> 자격증 추가
    </button>
  </div>
</div>
```

### Validation Rules

```typescript
const canGoNextStep2 =
  specialty.trim() !== '' &&
  experienceYears >= 0 &&
  bio.trim().length >= 30 &&
  consultationTypes.length > 0 &&
  // No strict validation for schedule/certifications
  // (optional fields)
  true
```

---

## 📝 Step 3: Review & Terms (Unchanged)

Remains the same as current implementation:
- Review notification
- Terms & conditions checkbox
- Final submission

---

## 🎨 UI/UX Enhancements

### Progress Indicator Update

```tsx
<nav className="mb-6">
  <ol className="flex items-center gap-3 text-sm">
    <li className={`px-3 py-1 rounded-full border ${
      step >= 1
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-gray-50 text-gray-500 border-gray-200'
    }`}>
      1. 기본정보 + 본인인증
    </li>
    <li className={`px-3 py-1 rounded-full border ${
      step >= 2
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-gray-50 text-gray-500 border-gray-200'
    }`}>
      2. 전문정보
    </li>
    <li className={`px-3 py-1 rounded-full border ${
      step >= 3
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-gray-50 text-gray-500 border-gray-200'
    }`}>
      3. 검수 및 약관
    </li>
  </ol>
</nav>
```

### Section Dividers

Add visual separation in merged step 2:

```tsx
{/* Between tabs */}
<div className="border-t border-gray-200 my-6"></div>

{/* Between major sections */}
<div className="relative my-8">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-300"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-3 bg-white text-gray-500 font-medium">
      일정 및 자격증 정보
    </span>
  </div>
</div>
```

### Help Text & Tooltips

```tsx
{/* Contextual help */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  <div className="flex items-start">
    <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
    <div>
      <h4 className="text-sm font-semibold text-blue-900 mb-1">
        전문정보 작성 가이드
      </h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• 자기소개는 구체적으로 작성할수록 고객 신뢰도가 높아집니다</li>
        <li>• 키워드는 고객이 검색할 때 사용하는 용어로 설정하세요</li>
        <li>• 일정은 나중에 대시보드에서 수정할 수 있습니다</li>
      </ul>
    </div>
  </div>
</div>
```

---

## 🔌 API Requirements

### Phone Verification Endpoints

#### Send Verification Code
```typescript
POST /api/auth/send-verification
Request: {
  phoneNumber: string  // Format: "01012345678"
}
Response: {
  success: boolean
  message: string
  expiresAt: string    // ISO timestamp
}
```

#### Verify Code
```typescript
POST /api/auth/verify-code
Request: {
  phoneNumber: string
  code: string         // 6-digit code
}
Response: {
  success: boolean
  verified: boolean
  message: string
  token?: string       // Verification token for later use
}
```

### Expert Registration Data Structure

```typescript
interface ExpertRegistrationData {
  // Step 1: Basic Info + Phone Verification
  basicInfo: {
    name: string
    email: string
    jobTitle: string
    profileImage: string | null
    phoneNumber: string           // NEW
    phoneVerified: boolean        // NEW
    verificationToken?: string    // NEW
  }

  // Step 2: Professional Info (Consolidated)
  professionalInfo: {
    specialty: string
    experienceYears: number
    bio: string
    keywords: string[]
    consultationTypes: ('video' | 'chat' | 'voice')[]

    // Merged from old step 3
    availability: {
      [key in DayKey]: {
        available: boolean
        hours: string
      }
    }
    certifications: Array<{
      name: string
      issuer: string
    }>
  }

  // Step 3: Terms & Agreement
  agreement: {
    termsAccepted: boolean
    privacyAccepted: boolean
    timestamp: string
  }
}
```

---

## 📱 Responsive Design Considerations

### Mobile View Adjustments

```tsx
{/* Stack on mobile, side-by-side on desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Fields */}
</div>

{/* Full width phone verification on all screens */}
<div className="md:col-span-2">
  {/* Phone verification component */}
</div>

{/* Tabs - scrollable on mobile */}
<nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
  {/* Tab buttons */}
</nav>

{/* Schedule grid - single column on mobile */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Day slots */}
</div>
```

---

## ✅ Validation & Error Handling

### Field Validation

```typescript
const validationRules = {
  step1: {
    fullName: (val: string) => val.trim().length >= 2,
    email: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    jobTitle: (val: string) => val.trim().length >= 2,
    phoneNumber: (val: string) => /^01[0-9]{8,9}$/.test(val),
    phoneVerified: (val: boolean) => val === true
  },
  step2: {
    specialty: (val: string) => val.trim() !== '',
    experienceYears: (val: number) => val >= 0,
    bio: (val: string) => val.trim().length >= 30,
    consultationTypes: (arr: string[]) => arr.length > 0
  },
  step3: {
    termsAccepted: (val: boolean) => val === true
  }
}
```

### Error Messages

```typescript
const errorMessages = {
  phoneNumber: {
    invalid: '올바른 휴대폰 번호를 입력해주세요',
    required: '본인인증은 필수입니다',
    verificationFailed: '인증번호가 일치하지 않습니다',
    expired: '인증번호가 만료되었습니다. 재발송 해주세요'
  },
  bio: {
    tooShort: '자기소개는 최소 30자 이상 작성해주세요',
    required: '자기소개를 입력해주세요'
  },
  consultationTypes: {
    required: '최소 1개 이상의 상담 유형을 선택해주세요'
  }
}
```

---

## 🚀 Implementation Checklist

### Phase 1: Phone Verification (Step 1)
- [ ] Create phone verification API endpoints
- [ ] Implement SMS service integration (e.g., NCP SENS, Twilio)
- [ ] Build phone verification UI component
- [ ] Add verification state management
- [ ] Implement countdown timer
- [ ] Add validation to step 1 next button

### Phase 2: Consolidate Steps 2 & 3
- [ ] Create tabbed interface for step 2
- [ ] Move schedule section from step 3 to step 2
- [ ] Move certifications section from step 3 to step 2
- [ ] Update step navigation (4 steps → 3 steps)
- [ ] Adjust validation rules for consolidated step
- [ ] Test form state persistence between tabs

### Phase 3: UI/UX Polish
- [ ] Update progress indicator labels
- [ ] Add section dividers in consolidated step
- [ ] Implement contextual help text
- [ ] Ensure responsive design on mobile
- [ ] Add loading states for verification
- [ ] Implement toast notifications

### Phase 4: Testing & Refinement
- [ ] Unit tests for phone verification logic
- [ ] Integration tests for registration flow
- [ ] E2E tests for complete registration
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile device testing

---

## 📊 Success Metrics

### Quantitative Metrics
- **Completion Rate**: Target >85% (from current baseline)
- **Time to Complete**: Target <5 minutes average
- **Drop-off by Step**: Monitor each step, target <10% per step
- **Phone Verification Success Rate**: Target >95%

### Qualitative Metrics
- **User Feedback**: Survey after registration
- **Trust Perception**: "How trustworthy is this platform?" (1-5 scale)
- **Ease of Use**: "How easy was registration?" (1-5 scale)

---

## 🔄 Migration Strategy

### Backward Compatibility
- Existing experts with old data structure remain valid
- New registrations use consolidated structure
- Admin dashboard shows verification status

### Data Migration
```sql
-- Add phone verification columns
ALTER TABLE experts
ADD COLUMN phone_number VARCHAR(15),
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_verified_at TIMESTAMP;

-- Create verification codes table
CREATE TABLE phone_verification_codes (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 Design Reference

Reference expert profile detail page (`ExpertProfileDetail.tsx`):
- Line 289-416: Basic expert info card layout
- Line 445-507: Education & career section
- Line 509-550: Certifications display
- Line 838-951: Availability schedule display

Match these visual patterns for consistency between registration and profile views.

---

## 📝 Notes

1. **Phone Verification Provider**: Recommend NCP SENS (Naver Cloud Platform) for Korea-specific SMS
2. **Rate Limiting**: Implement rate limiting for verification code requests (max 3 per hour per number)
3. **Security**: Store verification codes hashed, implement expiration (3 minutes)
4. **Accessibility**: Ensure screen reader compatibility for all new components
5. **i18n**: Keep Korean text in components for now, extract to i18n files later if needed

---

## 🔗 Related Files

- `/apps/web/src/app/experts/become/page.tsx` - Current registration page
- `/apps/web/src/components/experts/ExpertProfileDetail.tsx` - Profile detail reference
- `/apps/api/src/experts/experts.service.ts` - Expert service (API)
- `/apps/api/prisma/schema.prisma` - Database schema

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Status**: Design Complete - Ready for Implementation