// Session types for consultation system

export type SessionStatus =
  | 'SCHEDULED'    // 예약됨 (아직 입장 불가)
  | 'PRE_SESSION'  // 사전 준비 (5-10분 전부터)
  | 'WAITING_ROOM' // 대기실 (양쪽 입장 가능)
  | 'ACTIVE'       // 활성 세션 진행중
  | 'COMPLETED'    // 세션 완료

export type ConsultationType = 'chat' | 'voice' | 'video'

export type ParticipantRole = 'client' | 'expert'

export interface DeviceStatus {
  camera: boolean
  microphone: boolean
  speaker: boolean
  permissions: {
    camera: boolean
    microphone: boolean
  }
}

export interface NetworkQuality {
  rtt: number // Round-trip time in ms
  bandwidth: number // in kbps
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  lastUpdated: number
}

export interface ParticipantState {
  userId: string
  role: ParticipantRole
  name: string
  avatar?: string
  ready: boolean
  online: boolean
  deviceStatus: DeviceStatus
  networkQuality?: NetworkQuality
  joinedAt?: number
}

export interface SessionState {
  sessionId: string
  displayId: string
  status: SessionStatus
  consultationType: ConsultationType
  scheduledStartTime: string
  scheduledEndTime: string
  duration: number // in minutes
  participants: {
    client?: ParticipantState
    expert?: ParticipantState
  }
  timeRemaining: number
  phase: 'WAIT' | 'OPEN' | 'CLOSED'
  canStart: boolean
  reservation?: {
    id: number
    expertId: number
    clientId: number
    startAt: string
    endAt: string
    note?: string
    price: number
  }
}

export interface SessionEvent {
  type: 'participant_joined' | 'participant_ready' | 'session_started' |
        'participant_left' | 'session_ended' | 'device_status_changed' |
        'network_quality_updated' | 'status_changed'
  data: any
  timestamp: number
  userId?: string
}

export interface SessionActions {
  joinSession: () => Promise<void>
  leaveSession: () => Promise<void>
  setReady: (ready: boolean) => Promise<void>
  updateDeviceStatus: (deviceStatus: Partial<DeviceStatus>) => Promise<void>
  startSession: () => Promise<void>
  endSession: () => Promise<void>
  updateNetworkQuality: (quality: NetworkQuality) => void
}