# 세션 시스템 사용 예제

새로운 상담 세션 시스템의 실제 사용 예제들입니다.

## 📱 클라이언트 상담 페이지 예제

```tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionProvider, useSession } from '@/features/sessions/SessionContext'
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionPreparation } from '@/components/sessions/SessionPreparation'
import { WaitingRoom } from '@/components/sessions/WaitingRoom'

function ClientConsultationPage() {
  const router = useRouter()
  const { state } = useSession()

  const [showPreparation, setShowPreparation] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)

  // 예약된 상담 목록 (실제로는 API에서 가져옴)
  const consultations = [
    {
      sessionId: '1',
      displayId: 'session_001',
      status: 'SCHEDULED',
      consultationType: 'video',
      scheduledStartTime: '2024-09-29T14:00:00Z',
      scheduledEndTime: '2024-09-29T15:00:00Z',
      duration: 60,
      participants: {},
      timeRemaining: 3600,
      phase: 'WAIT',
      canStart: false,
      reservation: {
        id: 1,
        expertId: 1,
        price: 50000,
        note: '계약서 검토 상담'
      }
    }
  ]

  const handleSessionAction = (session, action) => {
    setSelectedSession(session)

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">내 상담 예약</h1>

      <div className="space-y-4">
        {consultations.map(session => (
          <SessionCard
            key={session.sessionId}
            session={session}
            participantInfo={{
              name: `전문가 ${session.reservation.expertId}`,
              specialty: '법률 상담',
              price: session.reservation.price
            }}
            userRole="client"
            onAction={(action) => handleSessionAction(session, action)}
          />
        ))}
      </div>

      {/* 사전 준비 모달 */}
      <SessionPreparation
        isOpen={showPreparation}
        onClose={() => setShowPreparation(false)}
        onReady={() => {
          setShowPreparation(false)
          setShowWaitingRoom(true)
        }}
        participantName="김전문가"
      />

      {/* 대기실 모달 */}
      <WaitingRoom
        isOpen={showWaitingRoom}
        onClose={() => setShowWaitingRoom(false)}
        onStartSession={() => {
          setShowWaitingRoom(false)
          router.push(`/sessions/${selectedSession?.displayId}`)
        }}
        participantName="김전문가"
      />
    </div>
  )
}

// SessionProvider로 감싸서 export
export default function ClientPage() {
  return (
    <SessionProvider>
      <ClientConsultationPage />
    </SessionProvider>
  )
}
```

## 👨‍⚕️ 전문가 세션 관리 페이지 예제

```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { SessionProvider, useSession } from '@/features/sessions/SessionContext'
import { SessionCard } from '@/components/sessions/SessionCard'

function ExpertSessionManagement() {
  const { user } = useAuth()
  const { state, actions } = useSession()

  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('all')

  // 전문가의 세션 목록 로드
  useEffect(() => {
    loadExpertSessions()
  }, [user])

  const loadExpertSessions = async () => {
    // 실제 API 호출
    const mockSessions = [
      {
        sessionId: '1',
        displayId: 'session_001',
        status: 'WAITING_ROOM',
        consultationType: 'video',
        scheduledStartTime: new Date(Date.now() + 10 * 60000).toISOString(),
        scheduledEndTime: new Date(Date.now() + 70 * 60000).toISOString(),
        duration: 60,
        participants: {
          expert: {
            userId: user?.id,
            role: 'expert',
            name: user?.name,
            ready: true,
            online: true,
            deviceStatus: {
              camera: true, microphone: true, speaker: true,
              permissions: { camera: true, microphone: true }
            }
          },
          client: {
            userId: 'client_1',
            role: 'client',
            name: '김철수',
            ready: false,
            online: true,
            deviceStatus: {
              camera: false, microphone: false, speaker: false,
              permissions: { camera: false, microphone: false }
            }
          }
        },
        timeRemaining: 600,
        phase: 'WAIT',
        canStart: false,
        reservation: {
          id: 1,
          clientId: 1,
          price: 50000,
          note: '투자 포트폴리오 상담'
        }
      }
    ]
    setSessions(mockSessions)
  }

  const handleSessionAction = (session, action) => {
    switch (action) {
      case 'prepare':
        // 전문가도 사전 준비 필요시
        break
      case 'join':
        // 세션 참여
        actions.joinSession()
        break
      case 'manage':
        // 진행중인 세션 관리 페이지로
        window.open(`/sessions/${session.displayId}`, '_blank')
        break
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.status.toLowerCase() === filter
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">내 상담 세션</h1>
          <p className="text-gray-600">클라이언트와의 상담을 관리하세요</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">전체</option>
          <option value="scheduled">예정</option>
          <option value="active">진행중</option>
          <option value="completed">완료</option>
        </select>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {sessions.filter(s => s.status === 'SCHEDULED').length}
          </div>
          <div className="text-sm text-blue-600">예정된 세션</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {sessions.filter(s => s.status === 'ACTIVE').length}
          </div>
          <div className="text-sm text-green-600">진행중</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {sessions.filter(s => s.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-gray-600">완료</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            ₩{sessions.reduce((sum, s) => sum + (s.reservation?.price || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-purple-600">총 수익</div>
        </div>
      </div>

      {/* 세션 목록 */}
      <div className="space-y-4">
        {filteredSessions.map(session => (
          <SessionCard
            key={session.sessionId}
            session={session}
            participantInfo={{
              name: session.participants.client?.name || '클라이언트',
              specialty: session.reservation?.note || '상담',
              price: session.reservation?.price
            }}
            userRole="expert"
            onAction={(action) => handleSessionAction(session, action)}
          />
        ))}
      </div>
    </div>
  )
}

export default function ExpertPage() {
  return (
    <SessionProvider>
      <ExpertSessionManagement />
    </SessionProvider>
  )
}
```

## 🔧 커스텀 훅 예제

```tsx
// useSessionFlow.ts - 세션 플로우 관리 커스텀 훅
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/features/sessions/SessionContext'

export function useSessionFlow() {
  const router = useRouter()
  const { state, actions } = useSession()

  const [currentModal, setCurrentModal] = useState<'preparation' | 'waiting' | null>(null)
  const [selectedSession, setSelectedSession] = useState(null)

  const startSessionFlow = useCallback((session) => {
    setSelectedSession(session)

    // 세션 상태에 따라 적절한 모달 표시
    switch (session.status) {
      case 'PRE_SESSION':
        setCurrentModal('preparation')
        break
      case 'WAITING_ROOM':
        setCurrentModal('waiting')
        break
      case 'ACTIVE':
        router.push(`/sessions/${session.displayId}`)
        break
      default:
        // 아직 시간이 안됨
        alert('아직 입장할 수 없습니다')
    }
  }, [router])

  const handlePreparationComplete = useCallback(() => {
    setCurrentModal('waiting')
    actions.setReady(true)
  }, [actions])

  const handleSessionStart = useCallback(() => {
    setCurrentModal(null)
    if (selectedSession) {
      router.push(`/sessions/${selectedSession.displayId}`)
    }
  }, [router, selectedSession])

  const closeModals = useCallback(() => {
    setCurrentModal(null)
    setSelectedSession(null)
  }, [])

  return {
    currentModal,
    selectedSession,
    startSessionFlow,
    handlePreparationComplete,
    handleSessionStart,
    closeModals
  }
}
```

## 🎭 실시간 상태 동기화 예제

```tsx
// RealTimeSessionStatus.tsx - 실시간 상태 표시 컴포넌트
import React, { useEffect, useState } from 'react'
import { useSession } from '@/features/sessions/SessionContext'

export function RealTimeSessionStatus({ sessionId }) {
  const { state, actions } = useSession()
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    // 세션 상태 변화 감지
    if (state.sessionId === sessionId) {
      console.log('Session status changed:', state.status)

      // 상대방 참여 상태 확인
      const otherParticipant = state.participants.client || state.participants.expert
      if (otherParticipant?.online) {
        setConnectionStatus('connected')
      }
    }
  }, [state, sessionId])

  // 네트워크 품질 표시
  const getNetworkColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      {/* 연결 상태 */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
        }`} />
        <span className="text-sm">
          {connectionStatus === 'connected' ? '연결됨' : '연결 중...'}
        </span>
      </div>

      {/* 참가자 상태 */}
      <div className="text-sm">
        참가자: {Object.keys(state.participants).length}/2
      </div>

      {/* 네트워크 품질 */}
      {state.participants.client?.networkQuality && (
        <div className={`text-sm ${getNetworkColor(state.participants.client.networkQuality.quality)}`}>
          네트워크: {state.participants.client.networkQuality.quality}
        </div>
      )}

      {/* 세션 타이머 */}
      {state.timeRemaining > 0 && (
        <div className="text-sm text-gray-600">
          {state.phase === 'WAIT' ? '시작까지' : '남은시간'}: {Math.floor(state.timeRemaining / 60)}분
        </div>
      )}
    </div>
  )
}
```

## 📱 모바일 대응 예제

```tsx
// MobileSessionCard.tsx - 모바일 최적화 세션 카드
import React from 'react'
import { SessionCard } from '@/components/sessions/SessionCard'

export function MobileSessionCard({ session, participantInfo, userRole, onAction }) {
  return (
    <div className="w-full">
      {/* 데스크톱에서는 일반 카드, 모바일에서는 전체폭 */}
      <SessionCard
        session={session}
        participantInfo={participantInfo}
        userRole={userRole}
        onAction={onAction}
        className="md:max-w-md w-full" // 모바일에서 전체폭
      />

      {/* 모바일 전용 빠른 액션 버튼 */}
      <div className="md:hidden mt-2 flex space-x-2">
        {session.status === 'WAITING_ROOM' && (
          <button
            onClick={() => onAction('join')}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg text-center font-medium"
          >
            입장
          </button>
        )}
        {session.status === 'ACTIVE' && (
          <button
            onClick={() => onAction('manage')}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg text-center font-medium"
          >
            참여
          </button>
        )}
      </div>
    </div>
  )
}
```

## 🔗 기존 Agora 시스템과의 통합 예제

```tsx
// IntegratedSessionRoom.tsx - 기존 Agora 시스템과 통합
import React, { useEffect } from 'react'
import { useSession } from '@/features/sessions/SessionContext'
import { useDynamicAgora } from '@/features/sessions/useAgoraClient'
import { useRtmChat } from '@/features/sessions/useRtmChat'

export function IntegratedSessionRoom({ sessionId }) {
  const { state, actions } = useSession()
  const { rtcRef, rtmRef, loadRtc, loadRtm } = useDynamicAgora()
  const { messages, send } = useRtmChat()

  // 세션 상태가 ACTIVE가 되면 Agora 연결 시작
  useEffect(() => {
    if (state.status === 'ACTIVE') {
      initializeAgoraConnection()
    }
  }, [state.status])

  const initializeAgoraConnection = async () => {
    try {
      // 기존 Agora 초기화 로직 활용
      await loadRtc()
      await loadRtm()

      // 세션 컨텍스트에 연결 상태 업데이트
      actions.updateDeviceStatus({
        camera: true,
        microphone: true,
        speaker: true
      })
    } catch (error) {
      console.error('Agora connection failed:', error)
    }
  }

  return (
    <div className="session-room">
      {/* 세션 상태 표시 */}
      <div className="session-header">
        <h2>세션 진행중</h2>
        <div>참가자: {Object.keys(state.participants).length}</div>
      </div>

      {/* 기존 Agora UI 컴포넌트들 */}
      <div className="video-container">
        {/* 비디오 스트림 */}
      </div>

      <div className="chat-container">
        {messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>

      {/* 세션 컨트롤 */}
      <div className="session-controls">
        <button onClick={() => actions.endSession()}>
          세션 종료
        </button>
      </div>
    </div>
  )
}
```

이러한 예제들을 참고하여 프로젝트의 요구사항에 맞게 커스터마이징하여 사용하시면 됩니다.