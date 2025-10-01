'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { SessionState, SessionActions, SessionEvent, ParticipantState, DeviceStatus, NetworkQuality } from './types'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSessionDetail, startSession, endSession, issueTokens } from '@/lib/sessions'
import { useSessionTimer } from './useSessionTimer'

interface SessionContextType {
  state: SessionState
  actions: SessionActions
  isLoading: boolean
  error: string | null
}

const SessionContext = createContext<SessionContextType | null>(null)

type SessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: SessionState }
  | { type: 'UPDATE_STATUS'; payload: SessionState['status'] }
  | { type: 'UPDATE_PARTICIPANT'; payload: { role: 'client' | 'expert'; participant: Partial<ParticipantState> } }
  | { type: 'SET_READY'; payload: { role: 'client' | 'expert'; ready: boolean } }
  | { type: 'UPDATE_DEVICE_STATUS'; payload: { role: 'client' | 'expert'; deviceStatus: Partial<DeviceStatus> } }
  | { type: 'UPDATE_NETWORK_QUALITY'; payload: { role: 'client' | 'expert'; quality: NetworkQuality } }
  | { type: 'UPDATE_TIMER'; payload: { timeRemaining: number; phase: 'WAIT' | 'OPEN' | 'CLOSED' } }

const initialState: SessionState = {
  sessionId: '',
  displayId: '',
  status: 'SCHEDULED',
  consultationType: 'video',
  scheduledStartTime: '',
  scheduledEndTime: '',
  duration: 0,
  participants: {},
  timeRemaining: 0,
  phase: 'WAIT',
  canStart: false
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...action.payload }

    case 'UPDATE_STATUS':
      return { ...state, status: action.payload }

    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.role]: {
            ...state.participants[action.payload.role],
            ...action.payload.participant
          }
        }
      }

    case 'SET_READY':
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.role]: {
            ...state.participants[action.payload.role]!,
            ready: action.payload.ready
          }
        },
        canStart: state.participants.client?.ready && state.participants.expert?.ready
      }

    case 'UPDATE_DEVICE_STATUS':
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.role]: {
            ...state.participants[action.payload.role]!,
            deviceStatus: {
              ...state.participants[action.payload.role]!.deviceStatus,
              ...action.payload.deviceStatus
            }
          }
        }
      }

    case 'UPDATE_NETWORK_QUALITY':
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.role]: {
            ...state.participants[action.payload.role]!,
            networkQuality: action.payload.quality
          }
        }
      }

    case 'UPDATE_TIMER':
      return {
        ...state,
        timeRemaining: action.payload.timeRemaining,
        phase: action.payload.phase
      }

    default:
      return state
  }
}

interface SessionProviderProps {
  children: React.ReactNode
  sessionId?: string
}

export function SessionProvider({ children, sessionId }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { user } = useAuth()
  const rtmRef = useRef<any>(null)
  const channelRef = useRef<any>(null)

  // Timer integration
  const { phase, timeLeft } = useSessionTimer(
    state.scheduledStartTime || null,
    state.scheduledEndTime || null
  )

  // Update timer state
  useEffect(() => {
    dispatch({
      type: 'UPDATE_TIMER',
      payload: { timeRemaining: timeLeft.total, phase }
    })
  }, [timeLeft.total, phase])

  // Load session detail when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId])

  // RTM setup for real-time synchronization
  useEffect(() => {
    if (state.sessionId && user) {
      setupRTM()
    }
    return () => {
      cleanupRTM()
    }
  }, [state.sessionId, user])

  const loadSession = async (displayId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const sessionDetail = await getSessionDetail(displayId)

      // Determine user role
      const userRole: 'client' | 'expert' =
        user?.role === 'expert' ? 'expert' : 'client'

      // Create session state
      const sessionState: SessionState = {
        sessionId: sessionDetail.id,
        displayId: sessionDetail.displayId,
        status: 'SCHEDULED',
        consultationType: 'video', // Default, should come from reservation
        scheduledStartTime: sessionDetail.reservation?.startAt || '',
        scheduledEndTime: sessionDetail.reservation?.endAt || '',
        duration: sessionDetail.reservation ?
          Math.ceil((new Date(sessionDetail.reservation.endAt).getTime() -
                    new Date(sessionDetail.reservation.startAt).getTime()) / (1000 * 60)) : 60,
        participants: {
          [userRole]: {
            userId: user?.id || '',
            role: userRole,
            name: user?.name || 'User',
            avatar: user?.avatar,
            ready: false,
            online: true,
            deviceStatus: {
              camera: false,
              microphone: false,
              speaker: false,
              permissions: {
                camera: false,
                microphone: false
              }
            }
          }
        },
        timeRemaining: 0,
        phase: 'WAIT',
        canStart: false,
        reservation: sessionDetail.reservation
      }

      dispatch({ type: 'SET_SESSION', payload: sessionState })

    } catch (err) {
      console.error('Failed to load session:', err)
      setError('세션을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const setupRTM = async () => {
    try {
      if (!state.sessionId || !user) return

      // Get RTM token
      const tokens = await issueTokens(state.displayId, {
        uid: user.id.toString(),
        role: 'host'
      })

      // Setup RTM client (using existing hook pattern)
      // This would integrate with existing useRtmChat and useRtmMembers
      // For now, we'll set up a basic RTM connection

    } catch (err) {
      console.error('RTM setup failed:', err)
    }
  }

  const cleanupRTM = () => {
    // Cleanup RTM connections
    if (channelRef.current) {
      channelRef.current.leave?.()
    }
    if (rtmRef.current) {
      rtmRef.current.logout?.()
    }
  }

  // Session Actions
  const joinSession = useCallback(async () => {
    try {
      const userRole = user?.role === 'expert' ? 'expert' : 'client'

      dispatch({
        type: 'UPDATE_PARTICIPANT',
        payload: {
          role: userRole,
          participant: { online: true, joinedAt: Date.now() }
        }
      })

      // Update status based on phase
      if (state.phase === 'OPEN') {
        dispatch({ type: 'UPDATE_STATUS', payload: 'WAITING_ROOM' })
      } else {
        dispatch({ type: 'UPDATE_STATUS', payload: 'PRE_SESSION' })
      }

    } catch (err) {
      console.error('Join session failed:', err)
      setError('세션 참여에 실패했습니다.')
    }
  }, [user, state.phase])

  const leaveSession = useCallback(async () => {
    try {
      const userRole = user?.role === 'expert' ? 'expert' : 'client'

      dispatch({
        type: 'UPDATE_PARTICIPANT',
        payload: {
          role: userRole,
          participant: { online: false, ready: false }
        }
      })

      dispatch({ type: 'UPDATE_STATUS', payload: 'SCHEDULED' })

    } catch (err) {
      console.error('Leave session failed:', err)
    }
  }, [user])

  const setReady = useCallback(async (ready: boolean) => {
    try {
      const userRole = user?.role === 'expert' ? 'expert' : 'client'

      dispatch({
        type: 'SET_READY',
        payload: { role: userRole, ready }
      })

    } catch (err) {
      console.error('Set ready failed:', err)
    }
  }, [user])

  const updateDeviceStatus = useCallback(async (deviceStatus: Partial<DeviceStatus>) => {
    try {
      const userRole = user?.role === 'expert' ? 'expert' : 'client'

      dispatch({
        type: 'UPDATE_DEVICE_STATUS',
        payload: { role: userRole, deviceStatus }
      })

    } catch (err) {
      console.error('Update device status failed:', err)
    }
  }, [user])

  const startSessionAction = useCallback(async () => {
    try {
      if (state.canStart && state.phase === 'OPEN') {
        await startSession(state.displayId)
        dispatch({ type: 'UPDATE_STATUS', payload: 'ACTIVE' })
      }
    } catch (err) {
      console.error('Start session failed:', err)
      setError('세션 시작에 실패했습니다.')
    }
  }, [state.canStart, state.phase, state.displayId])

  const endSessionAction = useCallback(async () => {
    try {
      await endSession(state.displayId)
      dispatch({ type: 'UPDATE_STATUS', payload: 'COMPLETED' })
    } catch (err) {
      console.error('End session failed:', err)
      setError('세션 종료에 실패했습니다.')
    }
  }, [state.displayId])

  const updateNetworkQuality = useCallback((quality: NetworkQuality) => {
    const userRole = user?.role === 'expert' ? 'expert' : 'client'

    dispatch({
      type: 'UPDATE_NETWORK_QUALITY',
      payload: { role: userRole, quality }
    })
  }, [user])

  const actions: SessionActions = {
    joinSession,
    leaveSession,
    setReady,
    updateDeviceStatus,
    startSession: startSessionAction,
    endSession: endSessionAction,
    updateNetworkQuality
  }

  const contextValue: SessionContextType = {
    state,
    actions,
    isLoading,
    error
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}