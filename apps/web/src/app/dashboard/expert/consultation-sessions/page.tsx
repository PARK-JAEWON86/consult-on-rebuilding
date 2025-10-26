'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Calendar, Video } from 'lucide-react'

// New components
import { SessionProvider, useSession } from '@/features/sessions/SessionContext'
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionPreparation } from '@/components/sessions/SessionPreparation'
import { WaitingRoom } from '@/components/sessions/WaitingRoom'
import { SessionState } from '@/features/sessions/types'

// 실제 세션 데이터는 API에서 가져옴

function ExpertSessionsContent() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { state: sessionState, actions: sessionActions } = useSession()

  const [sessions, setSessions] = useState<SessionState[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showPreparation, setShowPreparation] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [currentParticipantName, setCurrentParticipantName] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('all')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
    // 실제 전문가의 pricePerMinute 사용 (레벨별 분당 크레딧)
    const expertPricePerMinute = user?.expert?.hourlyRate ? Math.round(user.expert.hourlyRate / 60) : 1000 // 시간당 요금을 분당으로 계산
    const sessionDuration = session.duration || 60 // 기본 60분
    const calculatedPrice = Math.round(expertPricePerMinute * sessionDuration) // 분당 크레딧 계산

    return {
      name: client?.name || '클라이언트',
      avatar: client?.name?.charAt(0) || 'C',
      specialty: session.reservation?.note || '상담',
      email: client?.email || 'client@consult-on.com',
      price: calculatedPrice
    }
  }

  // Calculate statistics
  const stats = {
    upcoming: sessions.filter(s => ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM'].includes(s.status)).length,
    ongoing: sessions.filter(s => s.status === 'ACTIVE').length,
    completed: sessions.filter(s => s.status === 'COMPLETED').length,
    todayEarnings: sessions
      .filter(s => s.status === 'COMPLETED' && isToday(s.scheduledStartTime))
      .reduce((sum, s) => {
        const expertPricePerMinute = user?.expert?.hourlyRate ? Math.round(user.expert.hourlyRate / 60) : 1000 // 시간당 요금을 분당으로 계산
        const sessionDuration = s.duration || 60
        const calculatedPrice = Math.round(expertPricePerMinute * sessionDuration)
        return sum + calculatedPrice
      }, 0)
  }

  function isToday(dateString: string) {
    const today = new Date().toDateString()
    const sessionDate = new Date(dateString).toDateString()
    return today === sessionDate
  }

  function isSameDay(date1: Date, date2: Date) {
    return date1.toDateString() === date2.toDateString()
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      days.push({ date: currentDate, isCurrentMonth: true })
    }

    // Next month's leading days
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  function getSessionsForDate(date: Date) {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledStartTime)
      return isSameDay(sessionDate, date)
    })
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
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-900">상담 세션</h1>
            </div>
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
                {stats.todayEarnings.toLocaleString()} 크레딧
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sessions Highlight */}
      {sessions.some(s => isToday(s.scheduledStartTime) && ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM', 'ACTIVE'].includes(s.status)) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 상담 세션</h3>
          <div className="space-y-3">
            {sessions
              .filter(s => isToday(s.scheduledStartTime) && ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM', 'ACTIVE'].includes(s.status))
              .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
              .map(session => {
                const startTime = new Date(session.scheduledStartTime)
                const timeString = startTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
                const participantInfo = getParticipantInfo(session)

                return (
                  <div key={session.sessionId} className="bg-white rounded-lg border border-blue-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-blue-600 min-w-[60px]">
                        {timeString}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {participantInfo.avatar}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{participantInfo.name}</div>
                          <div className="text-sm text-gray-500">{session.reservation?.note || '상담'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {session.consultationType === 'video' ? '화상 상담' : '음성 상담'}
                        </div>
                        <div className="text-lg font-semibold text-purple-600">
                          {participantInfo.price.toLocaleString()} 크레딧
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {session.status === 'WAITING_ROOM' && (
                          <button
                            onClick={() => handleSessionAction(session, 'join')}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            참여
                          </button>
                        )}
                        {session.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleSessionAction(session, 'manage')}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            관리
                          </button>
                        )}
                        {session.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleSessionAction(session, 'prepare')}
                            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                          >
                            준비
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Session List with Calendar */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">상담 세션 목록</h3>
        </div>

        <div className="flex">
          {/* Calendar Section */}
          <div className="w-96 border-r border-gray-200 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-xl font-bold text-gray-900">
                {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={day} className={`text-center text-sm font-semibold py-3 ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentMonth).map((dayData, index) => {
                const daySessions = getSessionsForDate(dayData.date)
                const isSelected = isSameDay(dayData.date, selectedDate)
                const isToday = isSameDay(dayData.date, new Date())
                const dayOfWeek = dayData.date.getDay()

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dayData.date)}
                    className={`
                      relative p-3 text-sm h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-200
                      ${dayData.isCurrentMonth ?
                        (dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-gray-900') :
                        'text-gray-300'}
                      ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105' :
                        isToday ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300' :
                        daySessions.length > 0 ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-100'}
                      ${!isSelected && daySessions.length > 0 ? 'border-2 border-green-200' : ''}
                    `}
                  >
                    <span className="font-medium">{dayData.date.getDate()}</span>
                    {daySessions.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-green-700'}`}>
                          {daySessions.length}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Session List Section */}
          <div className="flex-1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 세션
              </h4>
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

            {(() => {
              const selectedDateSessions = getSessionsForDate(selectedDate).filter(session => {
                if (filter === 'all') return true
                switch (filter) {
                  case 'upcoming':
                    return ['SCHEDULED', 'PRE_SESSION', 'WAITING_ROOM'].includes(session.status)
                  case 'ongoing':
                    return session.status === 'ACTIVE'
                  case 'completed':
                    return session.status === 'COMPLETED'
                  default:
                    return true
                }
              })

              return selectedDateSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg">선택된 날짜에 {filter === 'all' ? '세션이' : `${filter === 'upcoming' ? '예정된' : filter === 'ongoing' ? '진행 중인' : '완료된'} 세션이`} 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateSessions
                    .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
                    .map((session) => {
                      const startTime = new Date(session.scheduledStartTime)
                      const endTime = new Date(session.scheduledEndTime)
                      const timeString = startTime.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                      const endTimeString = endTime.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                      const participantInfo = getParticipantInfo(session)

                      const statusConfig = {
                        'SCHEDULED': { text: '예정', color: 'bg-gray-100 text-gray-700', button: '준비', buttonColor: 'bg-gray-600 hover:bg-gray-700' },
                        'PRE_SESSION': { text: '준비중', color: 'bg-yellow-100 text-yellow-700', button: '참여', buttonColor: 'bg-yellow-600 hover:bg-yellow-700' },
                        'WAITING_ROOM': { text: '대기중', color: 'bg-orange-100 text-orange-700', button: '참여', buttonColor: 'bg-green-600 hover:bg-green-700' },
                        'ACTIVE': { text: '진행중', color: 'bg-green-100 text-green-700', button: '관리', buttonColor: 'bg-blue-600 hover:bg-blue-700' },
                        'COMPLETED': { text: '완료', color: 'bg-blue-100 text-blue-700', button: '보기', buttonColor: 'bg-gray-600 hover:bg-gray-700' }
                      }

                      const config = statusConfig[session.status] || statusConfig['SCHEDULED']

                      return (
                        <div key={session.sessionId} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-center min-w-[80px]">
                                <div className="text-lg font-bold text-blue-600">{timeString}</div>
                                <div className="text-xs text-gray-500">~ {endTimeString}</div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {participantInfo.avatar}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{participantInfo.name}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                    {session.reservation?.note || '상담'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="text-center">
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                  {config.text}
                                </div>
                                <div className="text-sm font-semibold text-purple-600 mt-1">
                                  {participantInfo.price.toLocaleString()} 크레딧
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  const actionMap: Record<string, 'prepare' | 'join' | 'start' | 'manage'> = {
                                    '준비': 'prepare',
                                    '참여': 'join',
                                    '관리': 'manage',
                                    '보기': 'start'
                                  }
                                  handleSessionAction(session, actionMap[config.button] || 'prepare')
                                }}
                                className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${config.buttonColor}`}
                              >
                                {config.button}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )
            })()}
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
  )
}

export default function ExpertConsultationSessionsPageNew() {
  return (
    <SessionProvider>
      <ExpertSessionsContent />
    </SessionProvider>
  )
}