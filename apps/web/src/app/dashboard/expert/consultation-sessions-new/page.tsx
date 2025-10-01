'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Calendar } from 'lucide-react'

// New components
import { SessionProvider, useSession } from '@/features/sessions/SessionContext'
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionPreparation } from '@/components/sessions/SessionPreparation'
import { WaitingRoom } from '@/components/sessions/WaitingRoom'
import { SessionState } from '@/features/sessions/types'

// Mock data for expert sessions
const mockExpertSessions: SessionState[] = [
  {
    sessionId: '1',
    displayId: 'sess_001',
    status: 'WAITING_ROOM',
    consultationType: 'video',
    scheduledStartTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    scheduledEndTime: new Date(Date.now() + 70 * 60 * 1000).toISOString(), // 70 minutes from now
    duration: 60,
    participants: {
      expert: {
        userId: 'expert_1',
        role: 'expert',
        name: '전문가',
        ready: true,
        online: true,
        deviceStatus: {
          camera: true,
          microphone: true,
          speaker: true,
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
          camera: false,
          microphone: false,
          speaker: false,
          permissions: { camera: false, microphone: false }
        }
      }
    },
    timeRemaining: 600, // 10 minutes
    phase: 'WAIT',
    canStart: false,
    reservation: {
      id: 1,
      expertId: 1,
      clientId: 1,
      startAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 70 * 60 * 1000).toISOString(),
      note: '계약서 검토 및 법적 조언',
      price: 50000
    }
  },
  {
    sessionId: '2',
    displayId: 'sess_002',
    status: 'ACTIVE',
    consultationType: 'voice',
    scheduledStartTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Started 15 minutes ago
    scheduledEndTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes remaining
    duration: 45,
    participants: {
      expert: {
        userId: 'expert_1',
        role: 'expert',
        name: '전문가',
        ready: true,
        online: true,
        deviceStatus: {
          camera: false,
          microphone: true,
          speaker: true,
          permissions: { camera: true, microphone: true }
        }
      },
      client: {
        userId: 'client_2',
        role: 'client',
        name: '이영희',
        ready: true,
        online: true,
        deviceStatus: {
          camera: false,
          microphone: true,
          speaker: true,
          permissions: { camera: true, microphone: true }
        }
      }
    },
    timeRemaining: 1800, // 30 minutes
    phase: 'OPEN',
    canStart: true,
    reservation: {
      id: 2,
      expertId: 1,
      clientId: 2,
      startAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      note: '스트레스 관리 상담',
      price: 40000
    }
  },
  {
    sessionId: '3',
    displayId: 'sess_003',
    status: 'SCHEDULED',
    consultationType: 'video',
    scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    scheduledEndTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours from now
    duration: 90,
    participants: {
      expert: {
        userId: 'expert_1',
        role: 'expert',
        name: '전문가',
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
    timeRemaining: 7200, // 2 hours
    phase: 'WAIT',
    canStart: false,
    reservation: {
      id: 3,
      expertId: 1,
      clientId: 3,
      startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
      note: '포트폴리오 리밸런싱',
      price: 75000
    }
  }
]

function ExpertSessionsContent() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { state: sessionState, actions: sessionActions } = useSession()

  const [sessions, setSessions] = useState<SessionState[]>(mockExpertSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showPreparation, setShowPreparation] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [currentParticipantName, setCurrentParticipantName] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true

    switch (filter) {
      case 'upcoming':
        return session.status === 'SCHEDULED' || session.status === 'PRE_SESSION' || session.status === 'WAITING_ROOM'
      case 'ongoing':
        return session.status === 'ACTIVE'
      case 'completed':
        return session.status === 'COMPLETED'
      default:
        return true
    }
  })

  // Handle session card actions
  const handleSessionAction = async (session: SessionState, action: 'prepare' | 'join' | 'start' | 'manage') => {
    setSelectedSessionId(session.displayId)

    // Get client name
    const clientName = session.participants.client?.name || '클라이언트'
    setCurrentParticipantName(clientName)

    switch (action) {
      case 'prepare':
        setShowPreparation(true)
        break
      case 'join':
        setShowWaitingRoom(true)
        break
      case 'start':
        // Navigate to active session
        router.push(`/sessions/${session.displayId}`)
        break
      case 'manage':
        // Navigate to active session
        router.push(`/sessions/${session.displayId}`)
        break
    }
  }

  const handlePreparationReady = () => {
    setShowPreparation(false)
    setShowWaitingRoom(true)
  }

  const handleStartSession = () => {
    setShowWaitingRoom(false)
    if (selectedSessionId) {
      router.push(`/sessions/${selectedSessionId}`)
    }
  }

  // Get participant info for session card
  const getParticipantInfo = (session: SessionState) => {
    const client = session.participants.client
    return {
      name: client?.name || '클라이언트',
      avatar: client?.name?.charAt(0) || 'C',
      specialty: session.reservation?.note || '상담',
      email: `${client?.name || 'client'}@example.com`,
      price: session.reservation?.price || 0
    }
  }

  // Calculate statistics
  const stats = {
    upcoming: sessions.filter(s => ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM'].includes(s.status)).length,
    ongoing: sessions.filter(s => s.status === 'ACTIVE').length,
    completed: sessions.filter(s => s.status === 'COMPLETED').length,
    todayEarnings: sessions
      .filter(s => s.status === 'COMPLETED' && isToday(s.scheduledStartTime))
      .reduce((sum, s) => sum + (s.reservation?.price || 0), 0)
  }

  function isToday(dateString: string) {
    const today = new Date().toDateString()
    const sessionDate = new Date(dateString).toDateString()
    return today === sessionDate
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">상담 세션</h1>
          <p className="text-blue-700 mt-1">
            예정된 상담 세션을 관리하고 참여하세요
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="upcoming">예정</option>
            <option value="ongoing">진행중</option>
            <option value="completed">완료</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-blue-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">예정된 세션</p>
              <p className="text-2xl font-bold text-blue-900">{stats.upcoming}건</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">진행 중</p>
              <p className="text-2xl font-bold text-green-900">{stats.ongoing}건</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">완료된 세션</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}건</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-purple-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">오늘 수익</p>
              <p className="text-2xl font-bold text-purple-900">
                ₩{stats.todayEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sessions Highlight */}
      {sessions.some(s => isToday(s.scheduledStartTime) && ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM', 'ACTIVE'].includes(s.status)) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 상담 세션</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions
              .filter(s => isToday(s.scheduledStartTime) && ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM', 'ACTIVE'].includes(s.status))
              .map(session => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  participantInfo={getParticipantInfo(session)}
                  userRole="expert"
                  onAction={(action) => handleSessionAction(session, action)}
                  className="border-blue-200"
                />
              ))}
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">상담 세션 목록</h3>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filter === 'all' ? '상담 세션이 없습니다.' : `${filter === 'upcoming' ? '예정된' : filter === 'ongoing' ? '진행 중인' : '완료된'} 세션이 없습니다.`}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                participantInfo={getParticipantInfo(session)}
                userRole="expert"
                onAction={(action) => handleSessionAction(session, action)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedSessionId && (
        <>
          <SessionPreparation
            isOpen={showPreparation}
            onClose={() => setShowPreparation(false)}
            onReady={handlePreparationReady}
            participantName={currentParticipantName}
          />

          <WaitingRoom
            isOpen={showWaitingRoom}
            onClose={() => setShowWaitingRoom(false)}
            onStartSession={handleStartSession}
            participantName={currentParticipantName}
          />
        </>
      )}
    </div>
  )
}

export default function ExpertConsultationSessionsPageNew() {
  return (
    <SessionProvider>
      <ExpertSessionsContent />
    </SessionProvider>
  )
}