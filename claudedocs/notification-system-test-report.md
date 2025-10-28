# Notification System Test Report

## 📋 Test Overview

**Date**: 2025-10-28
**Component**: Notification Bell System (Frontend + Backend Integration)
**Status**: ✅ Fixed and Ready for Manual Testing

---

## 🔍 Issue Identified and Fixed

### Problem
NotificationBell component was filtering ALL notifications using only `USER_NOTIFICATION_TYPES` regardless of user mode, causing expert-specific notifications (`INQUIRY_RECEIVED`, `RESERVATION_PENDING`) to be hidden even when properly created in the database.

### Root Cause
```typescript
// ❌ Before (Line 98-106)
const notifications = useMemo(() => {
  const allNotifications = notificationsData?.data || [];

  // Only filtered by USER_NOTIFICATION_TYPES
  const filtered = allNotifications.filter(notification =>
    USER_NOTIFICATION_TYPES.includes(notification.type)
  );

  return filtered;
}, [notificationsData]); // Missing isExpertMode dependency
```

### Solution Applied
```typescript
// ✅ After (Line 98-118)
const notifications = useMemo(() => {
  const allNotifications = notificationsData?.data || [];

  // Conditional filtering based on user mode
  const allowedTypes = isExpertMode ? EXPERT_NOTIFICATION_TYPES : USER_NOTIFICATION_TYPES;

  const filtered = allNotifications.filter(notification =>
    allowedTypes.includes(notification.type)
  );

  console.log('[NotificationBell] 알림 데이터:', {
    mode: isExpertMode ? '전문가' : '사용자',
    total: allNotifications.length,
    filtered: filtered.length,
    types: filtered.map(n => n.type),
    unreadCount: filtered.filter(n => !n.isRead).length
  });

  return filtered;
}, [notificationsData, isExpertMode]); // Added isExpertMode dependency
```

---

## ✅ Backend Verification Complete

### 1. Inquiry Notification System
**File**: `apps/api/src/inquiry/inquiry.service.ts:83-92`

```typescript
// ✅ INQUIRY_RECEIVED notification created when inquiry is sent
if (expert.userId) {
  this.notificationsService
    .createInquiryReceivedNotification(
      expert.userId,        // Expert receives notification
      inquiry.id,
      client?.name || '고객',
      dto.subject
    )
}
```

**File**: `apps/api/src/inquiry/inquiry.service.ts:335`

```typescript
// ✅ INQUIRY_REPLY notification created when expert replies
this.notificationsService.createInquiryReplyNotification(
  inquiry.userId,         // Client receives notification
  inquiry.id,
  expertName,
  inquiry.subject
)
```

### 2. Reservation Notification System
**File**: `apps/api/src/reservations/reservations.service.ts:182-190`

```typescript
// ✅ RESERVATION_PENDING notification created when reservation is made
if (expert.userId) {
  this.notificationsService
    .createReservationPendingNotification(
      expert.userId,        // Expert receives notification
      displayId,
      client?.name || '고객',
      start
    )
}
```

**File**: `apps/api/src/reservations/reservations.service.ts:697`

```typescript
// ✅ RESERVATION_APPROVED notification when approved
await this.notificationsService.createReservationApprovedNotification(
  reservation.userId,     // Client receives notification
  reservation.displayId,
  expert?.name || '전문가',
  reservation.startAt
);
```

**File**: `apps/api/src/reservations/reservations.service.ts:792`

```typescript
// ✅ RESERVATION_REJECTED notification when rejected
await this.notificationsService.createReservationRejectedNotification(
  reservation.userId,     // Client receives notification
  reservation.displayId,
  expert?.name || '전문가',
  reason
);
```

---

## 🧪 Manual Test Plan

### Test Case 1: User → Expert Inquiry Flow

**Objective**: Verify expert receives INQUIRY_RECEIVED notification

**Steps**:
1. Login as regular user (client mode)
2. Navigate to expert profile page
3. Click "문의 보내기" (Send Inquiry)
4. Fill inquiry form and submit
5. **Switch to expert mode** (전문가 모드)
6. Check notification bell in top navigation

**Expected Results**:
- ✅ Expert mode notification bell shows unread count badge
- ✅ Console log shows:
  ```
  [NotificationBell] 알림 데이터: {
    mode: '전문가',
    total: X,
    filtered: X,
    types: ['INQUIRY_RECEIVED', ...],
    unreadCount: 1
  }
  ```
- ✅ Notification displays with:
  - 🔵 Blue message icon
  - Title: "새로운 문의가 도착했습니다"
  - Message: "{사용자명}님이 \"{제목}\" 주제로 문의를 남겼습니다"
  - Priority: 중요 (MEDIUM)
  - Orange border (MEDIUM priority)
- ✅ Clicking notification navigates to `/dashboard/expert/inquiries/{inquiryId}`

---

### Test Case 2: Expert → User Reply Flow

**Objective**: Verify user receives INQUIRY_REPLY notification

**Steps**:
1. Login as expert (expert mode)
2. Navigate to inbox/messages
3. Open inquiry from Test Case 1
4. Write reply and send
5. **Switch to user mode** (사용자 모드)
6. Check notification bell in top navigation

**Expected Results**:
- ✅ User mode notification bell shows unread count badge
- ✅ Console log shows:
  ```
  [NotificationBell] 알림 데이터: {
    mode: '사용자',
    total: X,
    filtered: X,
    types: ['INQUIRY_REPLY', ...],
    unreadCount: 1
  }
  ```
- ✅ Notification displays with:
  - 🟢 Green message icon
  - Title: "문의에 대한 답변이 도착했습니다"
  - Message: "{전문가명}님이 \"{제목}\" 문의에 답변했습니다"
  - Priority: 긴급 (HIGH)
  - Red border (HIGH priority)
- ✅ Clicking notification navigates to `/dashboard/inquiries/{inquiryId}`

---

### Test Case 3: User → Expert Reservation Flow

**Objective**: Verify expert receives RESERVATION_PENDING notification

**Steps**:
1. Login as regular user (client mode)
2. Navigate to expert profile page
3. Click "예약하기" (Make Reservation)
4. Complete 3-step reservation process:
   - Step 1: Select date and time
   - Step 2: Confirm reservation details
   - Step 3: Click "예약 요청" button
5. **Switch to expert mode** (전문가 모드)
6. Check notification bell in top navigation

**Expected Results**:
- ✅ Expert mode notification bell shows unread count badge
- ✅ Console log shows:
  ```
  [NotificationBell] 알림 데이터: {
    mode: '전문가',
    total: X,
    filtered: X,
    types: ['RESERVATION_PENDING', ...],
    unreadCount: 1
  }
  ```
- ✅ Notification displays with:
  - 🟠 Orange clock icon
  - Title: "새로운 예약 요청"
  - Message: "{사용자명}님의 예약 요청이 있습니다 (YYYY. MM. DD)"
  - Priority: 긴급 (HIGH)
  - Red border (HIGH priority)
- ✅ Clicking notification navigates to `/dashboard/expert/reservations`

---

### Test Case 4: Expert → User Approval Flow

**Objective**: Verify user receives RESERVATION_APPROVED notification

**Steps**:
1. Login as expert (expert mode)
2. Navigate to `/dashboard/expert/reservations`
3. Find pending reservation from Test Case 3
4. Click "승인" (Approve) button
5. **Switch to user mode** (사용자 모드)
6. Check notification bell in top navigation

**Expected Results**:
- ✅ User mode notification bell shows unread count badge
- ✅ Console log shows:
  ```
  [NotificationBell] 알림 데이터: {
    mode: '사용자',
    total: X,
    filtered: X,
    types: ['RESERVATION_APPROVED', ...],
    unreadCount: 1
  }
  ```
- ✅ Notification displays with:
  - ✅ Green user-check icon
  - Title: "예약이 승인되었습니다"
  - Message: "{전문가명}님이 예약을 승인했습니다 (YYYY. MM. DD)"
  - Priority: 긴급 (HIGH)
  - Red border (HIGH priority)
- ✅ Clicking notification navigates to `/dashboard/consultations/{reservationId}`

---

### Test Case 5: Expert → User Rejection Flow

**Objective**: Verify user receives RESERVATION_REJECTED notification

**Steps**:
1. Create another reservation (repeat Test Case 3 steps 1-4)
2. Login as expert (expert mode)
3. Navigate to `/dashboard/expert/reservations`
4. Find pending reservation
5. Click "거절" (Reject) button
6. (Optional) Provide rejection reason
7. **Switch to user mode** (사용자 모드)
8. Check notification bell in top navigation

**Expected Results**:
- ✅ User mode notification bell shows unread count badge
- ✅ Console log shows:
  ```
  [NotificationBell] 알림 데이터: {
    mode: '사용자',
    total: X,
    filtered: X,
    types: ['RESERVATION_REJECTED', ...],
    unreadCount: 1
  }
  ```
- ✅ Notification displays with:
  - ❌ Red user-x icon
  - Title: "예약이 거절되었습니다"
  - Message: "{전문가명}님이 예약을 거절했습니다" or with reason
  - Priority: 긴급 (HIGH)
  - Red border (HIGH priority)
- ✅ Clicking notification navigates to `/dashboard/consultations`

---

## 🔧 Notification Type Reference

### User Mode (사용자 모드)
```typescript
USER_NOTIFICATION_TYPES = [
  'INQUIRY_REPLY',              // ✉️ Expert replied to inquiry
  'RESERVATION_APPROVED',       // ✅ Expert approved reservation
  'RESERVATION_REJECTED',       // ❌ Expert rejected reservation
  'CONSULTATION_UPCOMING',      // 📅 Upcoming consultation reminder
  'CONSULTATION_COMPLETED',     // ✔️ Consultation completed
  'CREDIT_LOW',                 // 💳 Low credit balance
  'EXPERT_APPLICATION_UPDATE',  // 📋 Expert application status update
  'SYSTEM',                     // ⚙️ System notifications
  'SYSTEM_ADMIN'                // 📢 Admin announcements
]
```

### Expert Mode (전문가 모드)
```typescript
EXPERT_NOTIFICATION_TYPES = [
  'INQUIRY_RECEIVED',           // ✉️ New inquiry received
  'RESERVATION_PENDING',        // ⏳ New reservation request
  'CONSULTATION_UPCOMING',      // 📅 Upcoming consultation reminder
  'CONSULTATION_COMPLETED',     // ✔️ Consultation completed
  'CREDIT_LOW',                 // 💳 Low credit balance
  'REVIEW_REQUEST',             // ⭐ Review request
  'SYSTEM',                     // ⚙️ System notifications
  'SYSTEM_ADMIN'                // 📢 Admin announcements
]
```

---

## 📊 Debugging Information

### Console Logs to Monitor

When testing, watch browser console for these logs:

```javascript
// Notification filtering log (every 10 seconds + on refetch)
[NotificationBell] 알림 데이터: {
  mode: '전문가' | '사용자',
  total: 5,           // Total notifications from API
  filtered: 3,        // After mode-based filtering
  types: ['INQUIRY_RECEIVED', 'SYSTEM'],  // Notification types shown
  unreadCount: 2      // Unread notifications count
}
```

### Expected Behavior by Mode

**When isExpertMode = true**:
- Only shows: INQUIRY_RECEIVED, RESERVATION_PENDING, + shared types
- Badge color: Blue (`bg-blue-500`)
- Button hover: Blue background

**When isExpertMode = false**:
- Only shows: INQUIRY_REPLY, RESERVATION_APPROVED, RESERVATION_REJECTED, + shared types
- Badge color: Red (`bg-red-500`)
- Button hover: Gray background

---

## 🐛 Known Issues (Resolved)

### ✅ Issue 1: Port 3001 Conflict
**Status**: Resolved
**Solution**: Killed existing process with `lsof -ti:3001 | xargs kill`

### ✅ Issue 2: Reservation Button Not Working
**Status**: Resolved
**Solution**: Fixed error handling in ReservationModalImproved.tsx to support both API interceptor and Axios error structures

### ✅ Issue 3: Alert Modals Instead of UI Modals
**Status**: Resolved
**Solution**: Replaced alert() calls with proper modal state management in ExpertProfileDetail.tsx

### ✅ Issue 4: Wrong Message Management Path
**Status**: Resolved
**Solution**: Changed navigation from `/dashboard/user/messages` to `/dashboard/client/messages`

### ✅ Issue 5: Expert Notifications Not Showing
**Status**: Resolved
**Solution**: Added EXPERT_NOTIFICATION_TYPES and conditional filtering based on isExpertMode in NotificationBell.tsx

---

## 📝 Testing Checklist

Use this checklist during manual testing:

- [ ] Test Case 1: User sends inquiry → Expert receives INQUIRY_RECEIVED
- [ ] Test Case 2: Expert replies → User receives INQUIRY_REPLY
- [ ] Test Case 3: User makes reservation → Expert receives RESERVATION_PENDING
- [ ] Test Case 4: Expert approves → User receives RESERVATION_APPROVED
- [ ] Test Case 5: Expert rejects → User receives RESERVATION_REJECTED
- [ ] Verify console logs show correct mode and filtering
- [ ] Verify notification badge counts are correct
- [ ] Verify notification icons and colors are correct
- [ ] Verify priority borders (red/yellow/blue) display correctly
- [ ] Verify click navigation goes to correct pages
- [ ] Verify "모두 읽음" button marks all as read
- [ ] Verify individual notification deletion works
- [ ] Verify notification settings toggles work
- [ ] Verify 10-second auto-refresh works
- [ ] Verify tab focus refresh works

---

## 🎯 Success Criteria

All tests pass if:

1. ✅ Experts see INQUIRY_RECEIVED and RESERVATION_PENDING notifications
2. ✅ Users see INQUIRY_REPLY, RESERVATION_APPROVED, and RESERVATION_REJECTED notifications
3. ✅ Console logs show correct mode and filtered types
4. ✅ Notification counts match unread notifications
5. ✅ All navigation links work correctly
6. ✅ No JavaScript errors in console
7. ✅ Notifications appear within 10 seconds (auto-refresh interval)
8. ✅ Visual styling matches mode (blue for expert, gray/red for user)

---

## 🔗 Related Files

### Frontend
- [NotificationBell.tsx](../apps/web/src/components/dashboard/NotificationBell.tsx) - Main notification component (MODIFIED)
- [notifications.ts](../apps/web/src/lib/notifications.ts) - API client functions
- [ReservationModalImproved.tsx](../apps/web/src/components/reservation/ReservationModalImproved.tsx) - Reservation UI (MODIFIED)
- [ExpertProfileDetail.tsx](../apps/web/src/components/experts/ExpertProfileDetail.tsx) - Inquiry UI (MODIFIED)

### Backend
- [notifications.service.ts](../apps/api/src/notifications/notifications.service.ts) - Notification creation logic
- [notifications.controller.ts](../apps/api/src/notifications/notifications.controller.ts) - API endpoints
- [reservations.service.ts](../apps/api/src/reservations/reservations.service.ts) - Reservation notification calls
- [inquiry.service.ts](../apps/api/src/inquiry/inquiry.service.ts) - Inquiry notification calls

---

## 📌 Notes

- Notification polling interval: **10 seconds** (refetchInterval: 10000)
- Auto-refresh triggers: Window focus, component mount, manual refresh button
- Notification settings stored per-user in `UserNotificationSetting` table
- All backend notification creation wrapped in `.catch()` to prevent blocking main operations
- Database: Notifications stored in `Notification` table with `NotificationType` enum

---

**Test Report Generated**: 2025-10-28
**Next Step**: Execute manual testing following test cases 1-5
