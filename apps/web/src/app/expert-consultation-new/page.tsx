'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Calendar, Plus } from 'lucide-react'
import { listReservationsByUser, Reservation } from '@/features/reservations/api'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'

// New components
import { SessionProvider, useSession } from '@/features/sessions/SessionContext'
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionPreparation } from '@/components/sessions/SessionPreparation'
import { WaitingRoom } from '@/components/sessions/WaitingRoom'
import { SessionState } from '@/features/sessions/types'

function ConsultationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { state: sessionState, actions: sessionActions, isLoading: sessionLoading } = useSession()

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    searchParams.get('session')
  )
  const [showPreparation, setShowPreparation] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [currentParticipantName, setCurrentParticipantName] = useState('')

  // Load reservations
  const { data: reservationsData, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', user?.id],
    queryFn: () => listReservationsByUser(Number(user?.id) || 0),
    enabled: !!user?.id && isAuthenticated,
  })

  // Convert reservations to session states
  const consultationSessions: SessionState[] = reservationsData?.data?.map((reservation: Reservation) => ({
    sessionId: reservation.id.toString(),
    displayId: reservation.displayId,
    status: 'SCHEDULED' as const,
    consultationType: 'video' as const,
    scheduledStartTime: reservation.startAt,
    scheduledEndTime: reservation.endAt,
    duration: Math.ceil((new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / (1000 * 60)),
    participants: {
      client: {
        userId: user?.id?.toString() || '',
        role: 'client' as const,
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
    phase: 'WAIT' as const,
    canStart: false,
    reservation: reservation
  })) || []

  // Handle session card actions
  const handleSessionAction = async (session: SessionState, action: 'prepare' | 'join' | 'start' | 'manage') => {
    setSelectedSessionId(session.displayId)
    setCurrentParticipantName(`전문가 ${session.reservation?.expertId}`)

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

  const handleNewConsultation = () => {
    router.push("/experts")
  }

  // Get participant info for selected session
  const getParticipantInfo = (session: SessionState) => {
    return {
      name: `전문가 ${session.reservation?.expertId}`,
      avatar: `전문가 ${session.reservation?.expertId}`.charAt(0),
      specialty: '전문 상담',
      email: `expert${session.reservation?.expertId}@example.com`,
      price: 50000 // Default price, should come from reservation
    }
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout variant="user">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-6">전문가 상담을 이용하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push('/auth/login?redirect=/expert-consultation')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              로그인하기
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout variant="user">
      <div className="max-w-7xl mx-auto px-10 py-10 space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전문가 상담</h1>
          <p className="mt-2 text-gray-600">
            예약된 상담을 관리하고 실시간으로 전문가와 상담하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Session List */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Session List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">예약된 상담</h2>
                    <button
                      onClick={handleNewConsultation}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      새 상담
                    </button>
                  </div>
                </div>

                {/* Session Cards */}
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {isLoadingReservations ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">예약 정보를 불러오는 중...</p>
                    </div>
                  ) : consultationSessions.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">예약된 상담이 없습니다</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        새로운 상담을 예약해보세요
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={handleNewConsultation}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          상담 예약하기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      {consultationSessions.map((session) => (
                        <SessionCard
                          key={session.sessionId}
                          session={session}
                          participantInfo={getParticipantInfo(session)}
                          userRole="client"
                          onAction={(action) => handleSessionAction(session, action)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Session Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">상담을 선택해주세요</h3>
              <p className="mt-1 text-sm text-gray-500">
                왼쪽에서 예약된 상담을 선택하면 상담을 시작할 수 있습니다
              </p>
            </div>
          </div>
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
    </DashboardLayout>
  )
}

export default function ExpertConsultationPageNew() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  return (
    <SessionProvider sessionId={sessionId || undefined}>
      <ConsultationContent />
    </SessionProvider>
  )
}