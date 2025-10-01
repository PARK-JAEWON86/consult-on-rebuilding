'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DeviceStatus, NetworkQuality } from './types'

interface DeviceTestResult {
  camera: {
    available: boolean
    deviceId?: string
    label?: string
    error?: string
  }
  microphone: {
    available: boolean
    deviceId?: string
    label?: string
    level?: number
    error?: string
  }
  speaker: {
    available: boolean
    error?: string
  }
  permissions: {
    camera: boolean
    microphone: boolean
  }
}

interface NetworkTestResult extends NetworkQuality {
  timestamp: number
}

export function useDeviceTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<DeviceTestResult | null>(null)
  const [networkResult, setNetworkResult] = useState<NetworkTestResult | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micLevelRef = useRef<number>(0)

  // Test camera
  const testCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })

      const videoTrack = stream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()

      setVideoStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      return {
        available: true,
        deviceId: settings.deviceId,
        label: videoTrack.label,
        error: undefined
      }
    } catch (error: any) {
      console.error('Camera test failed:', error)
      return {
        available: false,
        error: error.name === 'NotAllowedError'
          ? '카메라 권한이 필요합니다'
          : error.name === 'NotFoundError'
          ? '카메라를 찾을 수 없습니다'
          : '카메라 테스트 실패'
      }
    }
  }, [])

  // Test microphone with level detection
  const testMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const audioTrack = stream.getAudioTracks()[0]
      const settings = audioTrack.getSettings()

      setAudioStream(stream)

      // Setup audio level detection
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start level monitoring
      const monitorLevel = () => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        micLevelRef.current = Math.round((average / 255) * 100)
      }

      const levelInterval = setInterval(monitorLevel, 100)

      // Clean up function
      setTimeout(() => {
        clearInterval(levelInterval)
      }, 5000)

      return {
        available: true,
        deviceId: settings.deviceId,
        label: audioTrack.label,
        level: 0,
        error: undefined
      }
    } catch (error: any) {
      console.error('Microphone test failed:', error)
      return {
        available: false,
        error: error.name === 'NotAllowedError'
          ? '마이크 권한이 필요합니다'
          : error.name === 'NotFoundError'
          ? '마이크를 찾을 수 없습니다'
          : '마이크 테스트 실패'
      }
    }
  }, [])

  // Test speaker with audio playback
  const testSpeaker = useCallback(async () => {
    try {
      // Create a test audio element
      const audio = new Audio()

      // Use a short beep sound (data URL)
      const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDCH0fPTgjMGHm7A7+OZURE='

      audio.src = beepSound
      audio.volume = 0.1 // Low volume for test

      return new Promise((resolve) => {
        audio.oncanplaythrough = () => {
          audio.play()
            .then(() => {
              resolve({
                available: true,
                error: undefined
              })
            })
            .catch(() => {
              resolve({
                available: false,
                error: '스피커 재생 실패'
              })
            })
        }

        audio.onerror = () => {
          resolve({
            available: false,
            error: '스피커 테스트 실패'
          })
        }

        // Timeout after 3 seconds
        setTimeout(() => {
          resolve({
            available: false,
            error: '스피커 테스트 시간초과'
          })
        }, 3000)
      })
    } catch (error) {
      console.error('Speaker test failed:', error)
      return {
        available: false,
        error: '스피커 테스트 실패'
      }
    }
  }, [])

  // Test network quality
  const testNetwork = useCallback(async () => {
    try {
      const startTime = performance.now()

      // Test with multiple endpoints for more accurate results
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://www.gstatic.com/images/branding/product/1x/keep_48dp.png'
      ]

      const tests = endpoints.map(async (url) => {
        const testStart = performance.now()
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-cache'
          })
          const testEnd = performance.now()
          return {
            url,
            success: response.ok,
            latency: testEnd - testStart,
            size: parseInt(response.headers.get('content-length') || '0')
          }
        } catch {
          return {
            url,
            success: false,
            latency: Infinity,
            size: 0
          }
        }
      })

      const results = await Promise.all(tests)
      const successfulTests = results.filter(r => r.success && r.latency < 5000)

      if (successfulTests.length === 0) {
        throw new Error('모든 네트워크 테스트 실패')
      }

      const avgLatency = successfulTests.reduce((sum, r) => sum + r.latency, 0) / successfulTests.length
      const totalTime = performance.now() - startTime

      // Estimate bandwidth (rough calculation)
      const totalSize = successfulTests.reduce((sum, r) => sum + r.size, 0)
      const bandwidth = totalSize > 0 ? (totalSize * 8) / (totalTime / 1000) / 1000 : 0 // kbps

      // Determine quality based on latency
      let quality: NetworkQuality['quality']
      if (avgLatency < 50) {
        quality = 'excellent'
      } else if (avgLatency < 150) {
        quality = 'good'
      } else if (avgLatency < 300) {
        quality = 'fair'
      } else {
        quality = 'poor'
      }

      const networkResult: NetworkTestResult = {
        rtt: Math.round(avgLatency),
        bandwidth: Math.round(bandwidth),
        quality,
        lastUpdated: Date.now(),
        timestamp: Date.now()
      }

      setNetworkResult(networkResult)
      return networkResult

    } catch (error) {
      console.error('Network test failed:', error)
      const networkResult: NetworkTestResult = {
        rtt: -1,
        bandwidth: 0,
        quality: 'poor',
        lastUpdated: Date.now(),
        timestamp: Date.now()
      }
      setNetworkResult(networkResult)
      return networkResult
    }
  }, [])

  // Run all device tests
  const runDeviceTests = useCallback(async () => {
    setIsLoading(true)

    try {
      // Check initial permissions
      const permissions = await navigator.permissions?.query({ name: 'camera' as PermissionName })
        .then(result => ({ camera: result.state === 'granted' }))
        .catch(() => ({ camera: false }))

      const micPermissions = await navigator.permissions?.query({ name: 'microphone' as PermissionName })
        .then(result => ({ microphone: result.state === 'granted' }))
        .catch(() => ({ microphone: false }))

      // Run tests in parallel
      const [cameraResult, microphoneResult, speakerResult] = await Promise.all([
        testCamera(),
        testMicrophone(),
        testSpeaker()
      ])

      const finalPermissions = {
        camera: cameraResult.available,
        microphone: microphoneResult.available
      }

      const results: DeviceTestResult = {
        camera: cameraResult,
        microphone: microphoneResult,
        speaker: speakerResult,
        permissions: finalPermissions
      }

      setTestResults(results)
      return results

    } catch (error) {
      console.error('Device tests failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [testCamera, testMicrophone, testSpeaker])

  // Get current microphone level
  const getMicrophoneLevel = useCallback(() => {
    return micLevelRef.current
  }, [])

  // Cleanup streams
  const cleanup = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
    }

    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
  }, [videoStream, audioStream])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Convert test results to DeviceStatus format
  const getDeviceStatus = useCallback((): DeviceStatus | null => {
    if (!testResults) return null

    return {
      camera: testResults.camera.available,
      microphone: testResults.microphone.available,
      speaker: testResults.speaker.available,
      permissions: testResults.permissions
    }
  }, [testResults])

  return {
    isLoading,
    testResults,
    networkResult,
    videoStream,
    videoRef,
    runDeviceTests,
    testNetwork,
    getMicrophoneLevel,
    cleanup,
    getDeviceStatus
  }
}