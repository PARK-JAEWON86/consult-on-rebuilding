'use client'

import React, { useMemo } from 'react'
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Phone,
  User,
  Play,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon
} from 'lucide-react'
import { SessionState, ConsultationType, SessionStatus } from '@/features/sessions/types'

interface SessionCardProps {
  session: SessionState
  participantInfo: {
    name: string
    avatar?: string
    specialty?: string
    email?: string
    price?: number
  }
  userRole: 'client' | 'expert'
  onAction: (action: 'prepare' | 'join' | 'start' | 'manage') => void
  className?: string
}

export function SessionCard({
  session,
  participantInfo,
  userRole,
  onAction,
  className = ''
}: SessionCardProps) {

  // Status configuration
  const statusConfig = useMemo(() => {
    switch (session.status) {
      case 'SCHEDULED':
        return {
          label: '예약됨',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: ClockIcon,
          canAct: false,
          actionLabel: '곧 시작'
        }
      case 'PRE_SESSION':
        return {
          label: '준비 가능',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: Settings,
          canAct: true,
          actionLabel: '준비하기'
        }
      case 'WAITING_ROOM':
        return {
          label: '입장 가능',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: Play,
          canAct: true,
          actionLabel: '입장하기'
        }
      case 'ACTIVE':
        return {
          label: '진행중',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          icon: Video,
          canAct: true,
          actionLabel: '참여중'
        }
      case 'COMPLETED':
        return {
          label: '완료',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: CheckCircle,
          canAct: false,
          actionLabel: '완료됨'
        }
      default:
        return {
          label: '알 수 없음',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: AlertCircle,
          canAct: false,
          actionLabel: '오류'
        }
    }
  }, [session.status])

  // Consultation type configuration
  const typeConfig = useMemo(() => {
    switch (session.consultationType) {
      case 'chat':
        return {
          label: '채팅 상담',
          icon: MessageCircle,
          emoji: '💬'
        }
      case 'voice':
        return {
          label: '음성 상담',
          icon: Phone,
          emoji: '📞'
        }
      case 'video':
        return {
          label: '화상 상담',
          icon: Video,
          emoji: '📹'
        }
    }
  }, [session.consultationType])

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "오늘"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "내일"
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
  }

  const isToday = (dateString: string) => {
    const today = new Date().toDateString()
    const sessionDate = new Date(dateString).toDateString()
    return today === sessionDate
  }

  // Handle action click
  const handleActionClick = () => {
    if (!statusConfig.canAct) return

    switch (session.status) {
      case 'PRE_SESSION':
        onAction('prepare')
        break
      case 'WAITING_ROOM':
        onAction('join')
        break
      case 'ACTIVE':
        onAction('manage')
        break
      default:
        break
    }
  }

  // Get other participant info
  const otherParticipant = userRole === 'client' ? session.participants.expert : session.participants.client
  const isOtherParticipantOnline = otherParticipant?.online || false
  const isOtherParticipantReady = otherParticipant?.ready || false

  const StatusIcon = statusConfig.icon
  const TypeIcon = typeConfig.icon

  return (
    <div className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Profile Avatar */}
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              {participantInfo.avatar || participantInfo.name[0]}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {participantInfo.name}
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Today badge */}
                  {isToday(session.scheduledStartTime) && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      오늘
                    </span>
                  )}
                  {/* Status badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Specialty or email */}
              {participantInfo.specialty && (
                <p className="text-sm text-gray-600 mb-1">
                  {participantInfo.specialty}
                </p>
              )}

              {/* Session type and duration */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <TypeIcon className="h-4 w-4 mr-1" />
                  <span>{typeConfig.label}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{session.duration}분</span>
                </div>
                {participantInfo.price && (
                  <div className="flex items-center font-medium text-blue-600">
                    <span>₩{participantInfo.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(session.scheduledStartTime)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatTime(session.scheduledStartTime)}</span>
            </div>
          </div>

          {/* Timer info for active sessions */}
          {session.status === 'ACTIVE' && session.timeRemaining > 0 && (
            <div className="text-sm text-gray-500">
              남은 시간: {Math.floor(session.timeRemaining / 60)}:{(session.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}

          {/* Countdown for upcoming sessions */}
          {(session.status === 'PRE_SESSION' || session.status === 'WAITING_ROOM') && session.phase === 'WAIT' && (
            <div className="text-sm text-yellow-600">
              시작까지: {Math.floor(session.timeRemaining / 60)}:{(session.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      {/* Participant Status (if other participant exists) */}
      {otherParticipant && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">상대방 상태:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOtherParticipantOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={isOtherParticipantOnline ? 'text-green-600' : 'text-gray-500'}>
                {isOtherParticipantOnline ? (isOtherParticipantReady ? '준비 완료' : '온라인') : '오프라인'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-4">
        <button
          onClick={handleActionClick}
          disabled={!statusConfig.canAct}
          className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            statusConfig.canAct
              ? session.status === 'ACTIVE'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
        >
          {statusConfig.actionLabel}
        </button>

        {/* Additional info for disabled states */}
        {!statusConfig.canAct && session.status === 'SCHEDULED' && session.phase === 'WAIT' && (
          <p className="text-xs text-gray-500 text-center mt-2">
            시작 5분 전부터 입장 가능
          </p>
        )}
      </div>
    </div>
  )
}