# 세션 시스템 구현 가이드

새로운 클라이언트-전문가 상담 세션 시스템의 구현이 완료되었습니다. 이 가이드는 새 컴포넌트들을 기존 시스템에 통합하는 방법을 안내합니다.

## 📁 파일 구조

```
apps/web/src/
├── features/sessions/
│   ├── types.ts                    # 세션 타입 정의
│   ├── SessionContext.tsx          # 세션 상태 관리 컨텍스트
│   └── useDeviceTest.ts            # 기기 테스트 훅
├── components/sessions/
│   ├── SessionCard.tsx             # 통합 세션 카드 컴포넌트
│   ├── SessionPreparation.tsx      # 사전 준비 모달
│   └── WaitingRoom.tsx             # 대기실 컴포넌트
└── app/
    ├── expert-consultation-new/    # 새 클라이언트 상담 페이지
    └── dashboard/expert/consultation-sessions-new/  # 새 전문가 세션 페이지
```

## 🚀 기존 페이지 마이그레이션

### 1. 기존 페이지 백업 및 교체

```bash
# 기존 페이지 백업
mv apps/web/src/app/expert-consultation/page.tsx apps/web/src/app/expert-consultation/page.tsx.backup
mv apps/web/src/app/dashboard/expert/consultation-sessions/page.tsx apps/web/src/app/dashboard/expert/consultation-sessions/page.tsx.backup

# 새 페이지로 교체
mv apps/web/src/app/expert-consultation-new/page.tsx apps/web/src/app/expert-consultation/page.tsx
mv apps/web/src/app/dashboard/expert/consultation-sessions-new/page.tsx apps/web/src/app/dashboard/expert/consultation-sessions/page.tsx
```

### 2. 레이아웃 업데이트

기존 레이아웃에 SessionProvider 추가:

```tsx
// apps/web/src/app/layout.tsx 또는 관련 레이아웃 파일
import { SessionProvider } from '@/features/sessions/SessionContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

## 🧩 핵심 컴포넌트 사용법

### 1. SessionProvider 설정

```tsx
'use client'

import { SessionProvider } from '@/features/sessions/SessionContext'

function MyPage() {
  const sessionId = useSearchParams().get('session')

  return (
    <SessionProvider sessionId={sessionId || undefined}>
      <PageContent />
    </SessionProvider>
  )
}
```

### 2. SessionCard 사용

```tsx
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionState } from '@/features/sessions/types'

function SessionList() {
  const handleSessionAction = (session: SessionState, action: string) => {
    switch (action) {
      case 'prepare':
        setShowPreparation(true)
        break
      case 'join':
        setShowWaitingRoom(true)
        break
      case 'start':
        router.push(`/sessions/${session.displayId}`)
        break
    }
  }

  return (
    <SessionCard
      session={sessionState}
      participantInfo={{
        name: '전문가명',
        specialty: '전문 분야',
        price: 50000
      }}
      userRole="client" // or "expert"
      onAction={handleSessionAction}
    />
  )
}
```

### 3. SessionPreparation 모달

```tsx
import { SessionPreparation } from '@/components/sessions/SessionPreparation'

function Page() {
  const [showPreparation, setShowPreparation] = useState(false)

  return (
    <SessionPreparation
      isOpen={showPreparation}
      onClose={() => setShowPreparation(false)}
      onReady={() => {
        setShowPreparation(false)
        setShowWaitingRoom(true)
      }}
      participantName="전문가명"
    />
  )
}
```

### 4. WaitingRoom 컴포넌트

```tsx
import { WaitingRoom } from '@/components/sessions/WaitingRoom'

function Page() {
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)

  return (
    <WaitingRoom
      isOpen={showWaitingRoom}
      onClose={() => setShowWaitingRoom(false)}
      onStartSession={() => {
        setShowWaitingRoom(false)
        router.push(`/sessions/${sessionId}`)
      }}
      participantName="전문가명"
    />
  )
}
```

## 🔗 기존 시스템과의 통합

### 1. Agora 연동

기존 Agora 훅들과의 호환성:

```tsx
// 기존 useAgoraClient, useRtmChat 등과 함께 사용
import { useDynamicAgora } from '@/features/sessions/useAgoraClient'
import { useRtmChat } from '@/features/sessions/useRtmChat'
import { useSession } from '@/features/sessions/SessionContext'

function SessionRoom() {
  const { state, actions } = useSession()
  const { rtcRef, rtmRef } = useDynamicAgora()
  const { messages, send } = useRtmChat()

  // 세션 상태와 Agora 상태를 동기화
  useEffect(() => {
    if (state.status === 'ACTIVE') {
      // Agora 연결 시작
    }
  }, [state.status])
}
```

### 2. 예약 시스템 연동

```tsx
import { listReservationsByUser } from '@/features/reservations/api'
import { SessionState } from '@/features/sessions/types'

// 예약 데이터를 SessionState로 변환
const convertReservationToSession = (reservation: Reservation): SessionState => ({
  sessionId: reservation.id.toString(),
  displayId: reservation.displayId,
  status: 'SCHEDULED',
  consultationType: 'video',
  scheduledStartTime: reservation.startAt,
  scheduledEndTime: reservation.endAt,
  duration: Math.ceil((new Date(reservation.endAt).getTime() -
                      new Date(reservation.startAt).getTime()) / (1000 * 60)),
  participants: {
    client: {
      userId: user?.id?.toString() || '',
      role: 'client',
      name: user?.name || 'User',
      ready: false,
      online: false,
      deviceStatus: {
        camera: false,
        microphone: false,
        speaker: false,
        permissions: { camera: false, microphone: false }
      }
    }
  },
  timeRemaining: 0,
  phase: 'WAIT',
  canStart: false,
  reservation: reservation
})
```

## 📱 모바일 최적화

컴포넌트들은 이미 모바일 반응형으로 설계되었습니다:

```css
/* SessionCard는 자동으로 모바일 레이아웃 적용 */
@media (max-width: 768px) {
  .session-card {
    /* 스택 레이아웃으로 변경 */
  }
}

/* SessionPreparation 모달도 모바일 크기에 맞게 조정 */
@media (max-width: 640px) {
  .preparation-modal {
    /* 전체 화면 모달로 변경 */
  }
}
```

## 🔧 커스터마이징

### 1. 세션 상태 확장

새로운 세션 상태가 필요한 경우:

```tsx
// types.ts에 추가
export type SessionStatus =
  | 'SCHEDULED'
  | 'PRE_SESSION'
  | 'WAITING_ROOM'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CUSTOM_STATUS'  // 새 상태 추가

// SessionContext.tsx에서 상태 처리 로직 추가
```

### 2. 새로운 컴포넌트 추가

```tsx
// components/sessions/CustomComponent.tsx
import { useSession } from '@/features/sessions/SessionContext'

export function CustomComponent() {
  const { state, actions } = useSession()

  // 세션 상태를 사용한 커스텀 로직
  return <div>...</div>
}
```

### 3. 기기 테스트 확장

```tsx
// useDeviceTest.ts 확장
export function useDeviceTest() {
  // 기존 기능...

  const testCustomDevice = useCallback(async () => {
    // 새로운 기기 테스트 로직
  }, [])

  return {
    // 기존 반환값...
    testCustomDevice
  }
}
```

## 🧪 테스트

### 1. 컴포넌트 테스트

```tsx
// __tests__/SessionCard.test.tsx
import { render, screen } from '@testing-library/react'
import { SessionCard } from '@/components/sessions/SessionCard'

test('renders session card with correct info', () => {
  const mockSession = {
    // 테스트 데이터
  }

  render(
    <SessionCard
      session={mockSession}
      participantInfo={{ name: 'Test Expert' }}
      userRole="client"
      onAction={jest.fn()}
    />
  )

  expect(screen.getByText('Test Expert')).toBeInTheDocument()
})
```

### 2. 통합 테스트

```tsx
// __tests__/SessionFlow.test.tsx
test('complete session flow', async () => {
  // 1. 세션 카드 클릭
  // 2. 기기 준비 모달 열기
  // 3. 대기실 진입
  // 4. 세션 시작
})
```

## 🚨 주의사항

### 1. 성능 최적화

- SessionProvider는 앱 최상위에 한 번만 설정
- 불필요한 리렌더링 방지를 위해 useMemo/useCallback 적극 활용
- 기기 테스트는 사용자 액션에 의해서만 실행

### 2. 브라우저 호환성

- 기기 접근 권한은 HTTPS에서만 작동
- Safari에서 getUserMedia 지원 확인 필요
- 모바일 브라우저의 제한사항 고려

### 3. 에러 처리

```tsx
// 기기 접근 실패 시 대체 플로우
const handleDeviceError = (error: Error) => {
  if (error.name === 'NotAllowedError') {
    // 권한 거부 안내
  } else if (error.name === 'NotFoundError') {
    // 기기 없음 안내
  }
}
```

## 📈 향후 개선사항

1. **네트워크 품질 실시간 모니터링**
2. **세션 녹화 기능**
3. **화면 공유 개선**
4. **모바일 앱 네이티브 연동**
5. **AI 기반 세션 품질 분석**

## 🔗 관련 문서

- [원본 설계 문서](./consultation-session-ux-design.md)
- [API 문서](./api-documentation.md)
- [컴포넌트 스토리북](./storybook-components.md)

---

이 구현으로 클라이언트와 전문가 모두에게 일관되고 전문적인 상담 세션 경험을 제공할 수 있습니다.