# Expert Profile Data Flow - Implementation Summary

## 📋 Overview
Complete implementation of expert application → admin approval → profile edit/view workflow with file upload system.

## ✅ Completed Features

### Phase 1-5: Basic Data Flow
1. ✅ **Admin Approval Data Transfer** - All application data now flows to Expert table
2. ✅ **Profile Update DTO** - Comprehensive validation with UpdateExpertProfileDto
3. ✅ **Profile Update Service** - Automatic profile completeness checking
4. ✅ **API Endpoint** - PUT /experts/:displayId/profile with JWT authentication
5. ✅ **Frontend Integration** - Profile edit page uses actual displayId

### Advanced Features (Phase 6-9)
6. ✅ **Category Integration** - ExpertCategory automatic creation on approval
7. ✅ **Availability Slots** - ExpertAvailability automatic slot creation
8. ✅ **File Upload System** - Profile images, portfolio, certifications
9. ✅ **Enhanced Validation** - ArrayMinSize, MinLength on all critical fields

## 🔧 Technical Implementation

### Backend Changes

#### 1. Admin Approval Service
**File**: `apps/api/src/admin/expert-applications/expert-applications.service.ts` (Lines 182-320)

**Key Changes**:
- Complete data mapping from ExpertApplication → Expert
- Added categoryId handling for ExpertCategory creation
- Added availabilitySlots handling for ExpertAvailability creation
- Transaction-based operation ensuring data consistency

```typescript
// Creates Expert record with ALL application data
const expert = await tx.expert.create({
  data: {
    displayId: `EXP${Date.now()}${application.userId}`,
    userId: application.userId,
    name: application.name,
    specialty: application.specialty,
    bio: application.bio,
    experienceYears: application.experienceYears,
    mbti: application.mbti,
    consultationStyle: application.consultationStyle,
    // ... all fields mapped
  }
});

// Auto-create category relationship
if (appData.categoryId) {
  await tx.expertCategory.create({
    data: { expertId: expert.id, categoryId: appData.categoryId }
  });
}

// Auto-create availability slots
if (appData.availabilitySlots) {
  await tx.expertAvailability.createMany({
    data: slots,
    skipDuplicates: true
  });
}
```

#### 2. Expert Service
**File**: `apps/api/src/experts/experts.service.ts`

**New Methods**:
- `updateProfile(id, updateDto)` - Lines 1159-1268
  - Updates all profile fields
  - Automatic profile completeness calculation
  - Validates required fields before marking complete

- `uploadFile(expertId, uploadDto)` - Lines 1270-1329
  - Handles profile images (updates avatarUrl)
  - Handles portfolio/certification files (stores in portfolioFiles JSON)
  - Base64 encoding support

- `deleteFile(expertId, fileId)` - Lines 1331-1367
  - Removes files from portfolioFiles array by ID

#### 3. Expert Controller
**File**: `apps/api/src/experts/experts.controller.ts`

**New Endpoints**:
```typescript
PUT /v1/experts/:displayId/profile    // Update profile
POST /v1/experts/:displayId/upload    // Upload files
DELETE /v1/experts/:displayId/files/:fileId  // Delete files
```

All endpoints protected by JWT authentication and ownership validation.

#### 4. DTOs
**New Files Created**:

**`apps/api/src/experts/dto/update-expert-profile.dto.ts`**
```typescript
export class UpdateExpertProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다' })
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 학력 정보가 필요합니다' })
  education?: any[];

  // ... 30+ validated fields
}
```

**`apps/api/src/experts/dto/upload-file.dto.ts`**
```typescript
export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileData!: string; // Base64

  @IsOptional()
  @IsString()
  fileCategory?: 'profile' | 'portfolio' | 'certification';
}
```

**Updated**: `apps/api/src/experts/dto/expert-application.dto.ts`
- Added `categoryId?: number` (optional)
- Added `availabilitySlots?: AvailabilitySlot[]` (optional)

### Frontend Changes

#### 1. Profile Edit Page
**File**: `apps/web/src/app/dashboard/expert/profile/page.tsx` (Lines 356-368)

**Fix**: Changed from temporary numeric ID to actual displayId
```typescript
// Before: /experts/123/profile (wrong - numeric ID)
// After:  /experts/EXP1697123456789/profile (correct - displayId)

const response = await api.put(`/experts/${currentDisplayId}/profile`, {
  ...updated,
  id: currentExpertId,
});
```

#### 2. API Client
**File**: `apps/web/src/lib/api.ts` (Lines 190-253)

**New Methods**:
```typescript
async uploadExpertFile(
  displayId: string,
  file: File | string,
  fileCategory: 'profile' | 'portfolio' | 'certification'
): Promise<ApiResponse<{ fileUrl?: string; file?: any }>>

async deleteExpertFile(
  displayId: string,
  fileId: number
): Promise<ApiResponse>
```

Both methods:
- Handle File object → Base64 conversion automatically
- Support direct Base64 string input
- Return standardized ApiResponse format

## 🧪 Testing Plan

### Manual Testing Steps

#### 1. Test Expert Application Submission
```bash
# Navigate to expert application form
http://localhost:3001/dashboard/expert/become

# Fill out form with:
- name: "Test Expert"
- email: "test@example.com"
- specialty: "커리어 코칭"
- experienceYears: 5
- bio: "30+ characters of professional bio"
- categoryId: 1 (if UI supports it)
- availabilitySlots: [Monday 9am-5pm, Tuesday 9am-5pm]
- consultationTypes: ["video", "chat"]

# Submit application
# Expected: Application created with status PENDING
```

#### 2. Test Admin Approval
```bash
# Login as admin
# Navigate to: http://localhost:3001/dashboard/admin/applications

# Find the test application
# Click "승인" (Approve)

# Expected Results:
✅ ExpertApplication status → APPROVED
✅ Expert record created with ALL application data
✅ ExpertCategory record created (if categoryId provided)
✅ ExpertAvailability slots created (if availabilitySlots provided)
✅ User role updated to include EXPERT
```

**Verification Query** (PostgreSQL):
```sql
-- Check Expert record
SELECT id, "displayId", name, specialty, "experienceYears", mbti, "isProfileComplete"
FROM "Expert"
WHERE email = 'test@example.com';

-- Check Category relationship
SELECT ec.id, ec."expertId", ec."categoryId", c.name as category_name
FROM "ExpertCategory" ec
JOIN "Category" c ON c.id = ec."categoryId"
WHERE ec."expertId" = [EXPERT_ID];

-- Check Availability slots
SELECT id, "expertId", "dayOfWeek", "startTime", "endTime", "isActive"
FROM "ExpertAvailability"
WHERE "expertId" = [EXPERT_ID];
```

#### 3. Test Profile Edit Mode
```bash
# Login as the approved expert
# Navigate to: http://localhost:3001/dashboard/expert/profile

# Expected:
✅ All fields populated from application data
✅ Edit mode enabled
✅ displayId visible in URL and console logs
```

#### 4. Test Profile Save
```bash
# In profile edit mode, modify fields:
- bio: Change to new bio (30+ characters)
- experienceYears: Change to 7
- specialties: Add/remove items
- education: Add new entry

# Click "저장" (Save)

# Expected:
✅ Success toast: "프로필이 성공적으로 업데이트되었습니다"
✅ Data persisted to database
✅ Profile completeness auto-calculated
✅ Validation errors shown for invalid data (e.g., bio < 30 chars)
```

**Console Verification**:
```javascript
// Should see in browser console:
🔄 전문가 프로필 API 저장: ID=[id], displayId=EXP...
✅ 프로필 업데이트 성공
```

#### 5. Test File Upload
```bash
# In profile edit mode, test file uploads:

# A. Profile Image
- Click profile image upload
- Select image file
- Expected: avatarUrl updated immediately

# B. Portfolio File
- Click "포트폴리오 추가"
- Select document/image
- Expected: File added to portfolioFiles array

# C. Certification
- Click "자격증 추가"
- Select certificate image
- Expected: File added to portfolioFiles array
```

**API Call Verification**:
```bash
# Profile image upload
POST http://localhost:4000/v1/experts/EXP.../upload
Content-Type: application/json
{
  "fileName": "profile.jpg",
  "fileType": "image/jpeg",
  "fileData": "base64string...",
  "fileCategory": "profile"
}

# Expected Response:
{
  "success": true,
  "data": {
    "fileUrl": "data:image/jpeg;base64,...",
    "message": "프로필 이미지가 업로드되었습니다."
  }
}
```

#### 6. Test File Delete
```bash
# In profile edit mode with uploaded files:
- Click delete icon on portfolio file
- Confirm deletion

# Expected:
DELETE http://localhost:4000/v1/experts/EXP.../files/[FILE_ID]
✅ File removed from portfolioFiles array
✅ UI updated immediately
```

#### 7. Test Profile View Mode
```bash
# Navigate to profile view:
http://localhost:3001/dashboard/expert/profile?mode=view

# Expected:
✅ All data displayed in read-only format
✅ No edit controls visible
✅ Profile image displayed (if uploaded)
✅ Portfolio files listed with download/view options
```

#### 8. Test Profile Detail Page
```bash
# Navigate to public profile:
http://localhost:3001/experts/EXP.../profile

# Expected:
✅ Public profile view with all approved data
✅ Contact options visible
✅ Reviews section (if any reviews exist)
✅ Availability calendar (if implemented)
```

### API Testing with curl

#### Test Profile Update
```bash
# Login first to get JWT token
TOKEN=$(curl -s -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }' | jq -r '.data.accessToken')

# Update profile
curl -X PUT http://localhost:4000/v1/experts/EXP1234567890/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Name",
    "bio": "Updated bio with more than 30 characters for validation",
    "experienceYears": 10,
    "specialties": ["Leadership", "Career Coaching", "Consulting"]
  }' | jq
```

#### Test File Upload
```bash
# Create base64 test file
echo "Test file content" | base64 > /tmp/test_file_b64.txt
FILE_DATA=$(cat /tmp/test_file_b64.txt)

curl -X POST http://localhost:4000/v1/experts/EXP1234567890/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"fileName\": \"test_portfolio.pdf\",
    \"fileType\": \"application/pdf\",
    \"fileData\": \"$FILE_DATA\",
    \"fileCategory\": \"portfolio\"
  }" | jq
```

#### Test File Delete
```bash
curl -X DELETE http://localhost:4000/v1/experts/EXP1234567890/files/1697123456789 \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Validation Testing

#### Test Validation Rules
```bash
# Test minimum length (should fail)
curl -X PUT http://localhost:4000/v1/experts/EXP.../profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio": "Too short"}' | jq

# Expected: 400 Bad Request with validation error

# Test array minimum size (should fail)
curl -X PUT http://localhost:4000/v1/experts/EXP.../profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"education": []}' | jq

# Expected: 400 Bad Request - "최소 1개의 학력 정보가 필요합니다"

# Test experience years range (should fail)
curl -X PUT http://localhost:4000/v1/experts/EXP.../profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"experienceYears": -5}' | jq

# Expected: 400 Bad Request - "경력은 0 이상이어야 합니다"
```

## 📊 Data Flow Diagram

```
┌─────────────────────┐
│ Expert Application  │
│    (User submits)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Admin Approval     │
│  (Transaction)      │
├─────────────────────┤
│ 1. Create Expert    │
│ 2. Update User Role │
│ 3. Create Category  │
│ 4. Create Slots     │
│ 5. Update App Status│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Expert Profile     │
│   (Edit Mode)       │
├─────────────────────┤
│ - Load all data     │
│ - Display in UI     │
│ - Enable editing    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Profile Save      │
│   (PUT endpoint)    │
├─────────────────────┤
│ - Validate DTO      │
│ - Update DB         │
│ - Calc completeness │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Profile View/Detail│
│   (Public Display)  │
└─────────────────────┘
```

## 🔍 Key Implementation Details

### Profile Completeness Calculation
**Location**: `experts.service.ts` updateProfile()

**Required for Complete Profile**:
- ✅ name (non-empty)
- ✅ specialty (non-empty)
- ✅ bio (non-empty, 30+ chars)
- ✅ experienceYears (> 0)
- ✅ education (array with 1+ items)
- ✅ specialties (array with 1+ items)
- ✅ consultationTypes (array with 1+ items)

**Auto-Calculated**: `isProfileComplete` boolean field updates automatically on save.

### File Storage Strategy
**Base64 Encoding**: Files stored as Base64 strings in database
- **Profile images**: Stored in `Expert.avatarUrl` field
- **Portfolio/Certifications**: Stored in `Expert.portfolioFiles` JSON array

**Structure**:
```typescript
portfolioFiles: [
  {
    id: 1697123456789,
    name: "certificate.pdf",
    type: "application/pdf",
    size: 12345,
    data: "data:application/pdf;base64,...",
    category: "certification",
    uploadedAt: "2025-10-16T07:00:00.000Z"
  }
]
```

### Authentication & Authorization
All profile operations require:
1. Valid JWT token in Authorization header
2. User must own the profile being edited (userId match)

**Enforcement**: Controllers check `req.user.id === expert.userId`

## 🚨 Known Limitations

1. **File Size**: Base64 encoding increases storage by ~33%. Consider cloud storage for large files.
2. **Concurrent Updates**: No optimistic locking - last write wins.
3. **Validation Messages**: Currently in Korean only.
4. **File Types**: No server-side MIME type validation.

## 📈 Next Steps (Not Implemented)

- [ ] Implement optimistic locking for concurrent edits
- [ ] Add cloud storage integration (S3, GCS) for large files
- [ ] Add file type validation on server
- [ ] Add file size limits
- [ ] Implement profile version history
- [ ] Add audit logging for profile changes
- [ ] Implement profile change notifications

## 🎯 Success Criteria

Implementation is successful if:
- ✅ Application data flows completely from submission → approval → profile
- ✅ Expert can edit and save profile with validation
- ✅ Files can be uploaded and deleted successfully
- ✅ Profile view and detail pages display all data correctly
- ✅ Category and availability relationships are created automatically
- ✅ Profile completeness is calculated accurately
- ✅ All validation rules are enforced properly

## 📝 Testing Checklist

- [ ] Submit expert application with all fields
- [ ] Approve application as admin
- [ ] Verify Expert record created with all data
- [ ] Verify ExpertCategory relationship created
- [ ] Verify ExpertAvailability slots created
- [ ] Login as expert and access profile edit
- [ ] Verify all application data loaded correctly
- [ ] Edit multiple profile fields
- [ ] Save profile and verify success
- [ ] Test validation errors (bio too short, etc.)
- [ ] Upload profile image
- [ ] Upload portfolio file
- [ ] Upload certification
- [ ] Delete uploaded file
- [ ] Switch to view mode
- [ ] Access public profile detail page
- [ ] Verify all data displays correctly

## 🔧 Troubleshooting

### Issue: Profile not loading
**Check**:
1. Is user authenticated? (Check JWT token in cookies)
2. Does expert record exist? (Query Expert table)
3. Is displayId correct? (Check URL and database)
4. Check browser console for API errors

### Issue: Save fails with validation error
**Check**:
1. Bio length ≥ 30 characters
2. Arrays have at least 1 item (education, specialties, consultationTypes)
3. Experience years 0-50 range
4. All required string fields non-empty

### Issue: File upload fails
**Check**:
1. File is converted to Base64 correctly
2. fileCategory is one of: 'profile', 'portfolio', 'certification'
3. JWT token is valid
4. Expert owns the profile (userId match)

### Issue: Approval doesn't create Expert
**Check**:
1. Transaction completed successfully (check logs)
2. All required fields present in application
3. userId exists and is valid
4. No database constraints violated

## 📚 Related Documentation

- [UpdateExpertProfileDto](apps/api/src/experts/dto/update-expert-profile.dto.ts) - Full validation rules
- [UploadFileDto](apps/api/src/experts/dto/upload-file.dto.ts) - File upload structure
- [Expert Application Schema](apps/api/src/experts/dto/expert-application.dto.ts) - Application validation
- [API Client](apps/web/src/lib/api.ts) - Frontend API methods
- [Profile Page](apps/web/src/app/dashboard/expert/profile/page.tsx) - Edit UI implementation

---

**Implementation Date**: 2025-10-16
**Status**: ✅ Complete - Ready for Testing
**API Server**: http://localhost:4000
**Web App**: http://localhost:3001
