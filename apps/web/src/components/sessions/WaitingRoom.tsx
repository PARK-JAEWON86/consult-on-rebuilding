'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Settings,
  Users,
  Clock,
  Play,
  ArrowLeft
} from 'lucide-react'
import { useSession } from '@/features/sessions/SessionContext'

interface WaitingRoomProps {
  isOpen: boolean
  onClose: () => void
  onStartSession: () => void
  participantName: string
}

export function WaitingRoom({
  isOpen,
  onClose,
  onStartSession,
  participantName
}: WaitingRoomProps) {
  const { state, actions } = useSession()
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true)
  const [localAudioEnabled, setLocalAudioEnabled] = useState(false) // Start muted

  // Get current user and other participant
  const currentUser = state.participants.client?.userId === state.participants.expert?.userId
    ? state.participants.client || state.participants.expert
    : null
  const otherParticipant = state.participants.client?.userId !== state.participants.expert?.userId
    ? (state.participants.client || state.participants.expert)
    : null

  // Check if both participants are ready
  const bothReady = Boolean(
    state.participants.client?.ready && state.participants.expert?.ready
  )

  // Check if we can start early (both ready and within 5 minutes of start time)
  const canStartEarly = bothReady && state.phase === 'WAIT' && state.timeRemaining <= 300 // 5 minutes

  // Auto-start when phase becomes OPEN
  useEffect(() => {
    if (state.phase === 'OPEN' && bothReady) {
      // Auto-start after a short delay
      const timer = setTimeout(() => {
        onStartSession()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [state.phase, bothReady, onStartSession])

  const handleToggleVideo = () => {
    setLocalVideoEnabled(!localVideoEnabled)
    // Update device status
    actions.updateDeviceStatus({
      camera: !localVideoEnabled
    })
  }

  const handleToggleAudio = () => {
    setLocalAudioEnabled(!localAudioEnabled)
    // Update device status
    actions.updateDeviceStatus({
      microphone: !localAudioEnabled
    })
  }

  const handleStartEarly = () => {
    if (canStartEarly) {
      actions.startSession()
      onStartSession()
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getCountdownColor = () => {
    if (state.timeRemaining <= 60) return 'text-red-600'
    if (state.timeRemaining <= 300) return 'text-yellow-600'
    return 'text-blue-600'
  }

  const getParticipantStatusColor = (participant: any) => {
    if (!participant.online) return 'bg-gray-400'
    if (participant.ready) return 'bg-green-500'
    return 'bg-yellow-500'
  }

  const getParticipantStatusText = (participant: any) => {
    if (!participant.online) return '오프라인'
    if (participant.ready) return '준비 완료'
    return '준비 중'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {participantName}과의 상담
              </h3>
              <p className="text-sm text-gray-600">세션 ID: {state.displayId}</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${getCountdownColor()}`}>
              {state.phase === 'WAIT' ? '시작까지' : '입장 가능'}
            </div>
            {state.phase === 'WAIT' && (
              <div className={`text-3xl font-mono ${getCountdownColor()}`}>
                {formatTime(state.timeRemaining)}
              </div>
            )}
            {state.phase === 'OPEN' && (
              <div className="text-lg text-green-600 font-medium">
                지금 시작할 수 있습니다
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Side - Video Preview */}
          <div className="flex-1 p-6">
            <div className="h-full space-y-4">
              {/* Camera Preview */}
              <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
                {localVideoEnabled ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <div className="text-white text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">카메라 프리뷰</p>
                      <p className="text-sm opacity-75">실제 구현시 비디오 스트림이 표시됩니다</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-gray-400 text-center">
                      <CameraOff className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg">카메라 꺼짐</p>
                    </div>
                  </div>
                )}

                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-3 bg-black bg-opacity-50 rounded-lg p-2">
                    <button
                      onClick={handleToggleAudio}
                      className={`p-2 rounded-lg transition-colors ${
                        localAudioEnabled
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {localAudioEnabled ? (
                        <Mic className="h-4 w-4" />
                      ) : (
                        <MicOff className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={handleToggleVideo}
                      className={`p-2 rounded-lg transition-colors ${
                        localVideoEnabled
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {localVideoEnabled ? (
                        <Camera className="h-4 w-4" />
                      ) : (
                        <CameraOff className="h-4 w-4" />
                      )}
                    </button>

                    <button className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">상담 방식:</span>
                    <span className="ml-2 font-medium">
                      {state.consultationType === 'video' && '화상 상담'}
                      {state.consultationType === 'voice' && '음성 상담'}
                      {state.consultationType === 'chat' && '채팅 상담'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">예상 시간:</span>
                    <span className="ml-2 font-medium">{state.duration}분</span>
                  </div>
                  <div>
                    <span className="text-gray-600">시작 시간:</span>
                    <span className="ml-2 font-medium">
                      {new Date(state.scheduledStartTime).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">네트워크:</span>
                    <span className="ml-2 font-medium">
                      {currentUser?.networkQuality?.quality === 'excellent' && '최고'}
                      {currentUser?.networkQuality?.quality === 'good' && '양호'}
                      {currentUser?.networkQuality?.quality === 'fair' && '보통'}
                      {currentUser?.networkQuality?.quality === 'poor' && '불량'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Participants & Controls */}
          <div className="w-80 border-l border-gray-200 p-6 space-y-6">
            {/* Participants */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">참가자</h4>
              </div>

              <div className="space-y-3">
                {/* Current User */}
                {currentUser && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${getParticipantStatusColor(currentUser)}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{currentUser.name} (나)</p>
                      <p className="text-sm text-gray-600">{getParticipantStatusText(currentUser)}</p>
                    </div>
                    {currentUser.ready && (
                      <div className="text-green-600">
                        <Clock className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                )}

                {/* Other Participant */}
                {otherParticipant ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${getParticipantStatusColor(otherParticipant)}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{otherParticipant.name}</p>
                      <p className="text-sm text-gray-600">{getParticipantStatusText(otherParticipant)}</p>
                    </div>
                    {otherParticipant.ready && (
                      <div className="text-green-600">
                        <Clock className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{participantName}</p>
                      <p className="text-sm text-gray-600">참여 대기 중...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Status */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">세션 상태</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">현재 상태:</span>
                  <span className="font-medium">
                    {state.status === 'WAITING_ROOM' && '대기실'}
                    {state.status === 'PRE_SESSION' && '사전 준비'}
                    {state.status === 'ACTIVE' && '진행 중'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">양쪽 준비:</span>
                  <span className={`font-medium ${bothReady ? 'text-green-600' : 'text-yellow-600'}`}>
                    {bothReady ? '완료' : '대기 중'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Early Start Button */}
              {canStartEarly && (
                <button
                  onClick={handleStartEarly}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  <span>지금 시작하기</span>
                </button>
              )}

              {/* Auto Start Message */}
              {state.phase === 'OPEN' && bothReady && (
                <div className="text-center">
                  <div className="text-sm text-green-600 font-medium mb-2">
                    자동으로 세션이 시작됩니다...
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-600 h-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              {/* Leave Button */}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                대기실 나가기
              </button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 text-center">
              <p>• 예정 시간 5분 전부터 입장 가능</p>
              <p>• 양쪽이 준비되면 조기 시작 가능</p>
              <p>• 세션 시작 후 자동으로 연결됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}