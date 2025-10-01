'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Camera,
  Mic,
  Speaker,
  Wifi,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Volume2,
  Settings
} from 'lucide-react'
import { useDeviceTest } from '@/features/sessions/useDeviceTest'
import { useSession } from '@/features/sessions/SessionContext'

interface SessionPreparationProps {
  isOpen: boolean
  onClose: () => void
  onReady: () => void
  participantName: string
}

export function SessionPreparation({
  isOpen,
  onClose,
  onReady,
  participantName
}: SessionPreparationProps) {
  const { state, actions } = useSession()
  const {
    isLoading,
    testResults,
    networkResult,
    videoRef,
    runDeviceTests,
    testNetwork,
    getMicrophoneLevel,
    cleanup,
    getDeviceStatus
  } = useDeviceTest()

  const [isReady, setIsReady] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [isRetesting, setIsRetesting] = useState(false)
  const [playingTestSound, setPlayingTestSound] = useState(false)

  // Update mic level periodically
  useEffect(() => {
    if (!isOpen || !testResults?.microphone.available) return

    const interval = setInterval(() => {
      setMicLevel(getMicrophoneLevel())
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, testResults?.microphone.available, getMicrophoneLevel])

  // Run initial tests when modal opens
  useEffect(() => {
    if (isOpen) {
      handleRunTests()
    } else {
      cleanup()
    }
  }, [isOpen])

  // Update session device status when test results change
  useEffect(() => {
    if (testResults) {
      const deviceStatus = getDeviceStatus()
      if (deviceStatus) {
        actions.updateDeviceStatus(deviceStatus)
      }
    }
  }, [testResults, actions, getDeviceStatus])

  // Update network quality
  useEffect(() => {
    if (networkResult) {
      actions.updateNetworkQuality(networkResult)
    }
  }, [networkResult, actions])

  // Check if all tests passed and user can be ready
  useEffect(() => {
    if (testResults && networkResult) {
      const allDevicesWorking = testResults.camera.available &&
                               testResults.microphone.available &&
                               testResults.speaker.available
      const networkGood = networkResult.quality !== 'poor'

      setIsReady(allDevicesWorking && networkGood)
    }
  }, [testResults, networkResult])

  const handleRunTests = async () => {
    setIsRetesting(true)
    try {
      await runDeviceTests()
      await testNetwork()
    } catch (error) {
      console.error('Tests failed:', error)
    } finally {
      setIsRetesting(false)
    }
  }

  const handleTestSpeaker = async () => {
    setPlayingTestSound(true)
    try {
      // Play test sound - this is handled in the useDeviceTest hook
      setTimeout(() => setPlayingTestSound(false), 2000)
    } catch (error) {
      console.error('Speaker test failed:', error)
      setPlayingTestSound(false)
    }
  }

  const handleReady = () => {
    actions.setReady(true)
    onReady()
  }

  const renderTestStatus = (available: boolean, error?: string) => {
    if (available) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">정상</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-red-600">
          <XCircle className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{error || '실패'}</span>
        </div>
      )
    }
  }

  const renderNetworkStatus = () => {
    if (!networkResult) {
      return (
        <div className="flex items-center text-gray-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">테스트 중...</span>
        </div>
      )
    }

    const { quality, rtt } = networkResult
    let color = 'text-gray-500'
    let label = '알 수 없음'

    switch (quality) {
      case 'excellent':
        color = 'text-green-600'
        label = `최고 - ${rtt}ms`
        break
      case 'good':
        color = 'text-green-600'
        label = `양호 - ${rtt}ms`
        break
      case 'fair':
        color = 'text-yellow-600'
        label = `보통 - ${rtt}ms`
        break
      case 'poor':
        color = 'text-red-600'
        label = `불량 - ${rtt}ms`
        break
    }

    return (
      <div className={`flex items-center ${color}`}>
        <Wifi className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    )
  }

  const renderMicLevel = () => {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded ${
                i < Math.floor(micLevel / 10) ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{micLevel}%</span>
      </div>
    )
  }

  // Get other participant info
  const otherParticipant = state.participants.client?.userId !== state.participants.expert?.userId
    ? (state.participants.client || state.participants.expert)
    : null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">세션 준비</h3>
            <p className="text-sm text-gray-600 mt-1">
              {participantName}과의 상담 준비
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Device Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">기기 점검</h4>
              <button
                onClick={handleRunTests}
                disabled={isLoading || isRetesting}
                className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${(isLoading || isRetesting) ? 'animate-spin' : ''}`} />
                다시 테스트
              </button>
            </div>

            {/* Camera Test */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Camera className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="font-medium text-gray-900">카메라</span>
                  {testResults?.camera.label && (
                    <p className="text-xs text-gray-500">{testResults.camera.label}</p>
                  )}
                </div>
              </div>
              {isLoading ? (
                <div className="animate-pulse text-gray-500">테스트 중...</div>
              ) : testResults ? (
                renderTestStatus(testResults.camera.available, testResults.camera.error)
              ) : null}
            </div>

            {/* Microphone Test */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mic className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">마이크</span>
                  {testResults?.microphone.label && (
                    <p className="text-xs text-gray-500">{testResults.microphone.label}</p>
                  )}
                  {testResults?.microphone.available && (
                    <div className="mt-2">
                      {renderMicLevel()}
                    </div>
                  )}
                </div>
              </div>
              {isLoading ? (
                <div className="animate-pulse text-gray-500">테스트 중...</div>
              ) : testResults ? (
                renderTestStatus(testResults.microphone.available, testResults.microphone.error)
              ) : null}
            </div>

            {/* Speaker Test */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Speaker className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="font-medium text-gray-900">스피커</span>
                  <button
                    onClick={handleTestSpeaker}
                    disabled={playingTestSound}
                    className="ml-2 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded disabled:opacity-50"
                  >
                    <Volume2 className="h-3 w-3 inline mr-1" />
                    {playingTestSound ? '재생 중...' : '테스트'}
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="animate-pulse text-gray-500">테스트 중...</div>
              ) : testResults ? (
                renderTestStatus(testResults.speaker.available, testResults.speaker.error)
              ) : null}
            </div>

            {/* Network Test */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Wifi className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">네트워크</span>
              </div>
              {renderNetworkStatus()}
            </div>
          </div>

          {/* Video Preview */}
          {testResults?.camera.available && (
            <div className="space-y-2">
              <h4 className="text-lg font-medium text-gray-900">카메라 미리보기</h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  미리보기
                </div>
              </div>
            </div>
          )}

          {/* Other Participant Status */}
          {otherParticipant && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">상대방 상태</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    otherParticipant.online ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm text-gray-600">
                    {otherParticipant.online
                      ? otherParticipant.ready
                        ? '준비 완료'
                        : '준비 중...'
                      : '대기 중...'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleReady}
              disabled={!isReady}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isReady ? '준비 완료' : '준비 중...'}
            </button>
          </div>

          {/* Help Text */}
          {!isReady && testResults && (
            <div className="text-sm text-gray-500 text-center">
              모든 기기가 정상 작동해야 세션에 참여할 수 있습니다.
              {testResults.permissions.camera === false && ' 카메라 권한을 허용해주세요.'}
              {testResults.permissions.microphone === false && ' 마이크 권한을 허용해주세요.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}