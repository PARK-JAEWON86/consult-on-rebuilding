'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Phone,
  User,
  FileText,
  Plus,
  Play,
  Square,
  Clock as ClockIcon,
  Heart,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  MonitorOff,
  Settings,
  Users,
  Wifi,
  WifiOff,
  ArrowLeft,
  X,
} from 'lucide-react';
import { listReservationsByUser, Reservation } from '@/features/reservations/api';
import { ensureSession, startSession, endSession, getSessionDetail, issueTokens } from '@/lib/sessions';
import { useQuery } from '@tanstack/react-query';
import { useDynamicAgora } from '@/features/sessions/useAgoraClient';
import { useRtmChat } from '@/features/sessions/useRtmChat';
import { useRtmMembers } from '@/features/sessions/useRtmMembers';
import { useSessionTimer } from '@/features/sessions/useSessionTimer';
import { useSessionNote } from '@/features/sessions/useSessionNote';

interface ExpertInfo {
  id: number;
  name: string;
  avatar?: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  expertLevel: number;
}

interface ConsultationSession {
  id: string;
  expertId: string;
  expertName: string;
  expertAvatar: string;
  expertSpecialty: string;
  topic: string;
  scheduledTime: string;
  duration: number;
  consultationType: "chat" | "voice" | "video";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  expertLevel: number;
  description?: string;
  reservationId: number;
}

export default function ExpertConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  // URL 파라미터에서 세션 ID 확인
  const sessionId = searchParams.get('session');
  
  // 상태 관리
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Agora 관련 상태
  const { rtcRef, rtmRef, loadRtc, loadRtm } = useDynamicAgora();
  const { messages, bind, send } = useRtmChat();
  const { members, bindMemberEvents, reset: resetMembers } = useRtmMembers();
  
  // 세션 타이머
  const { phase, timeLeft } = useSessionTimer(
    sessionDetail?.reservation?.startAt || null,
    sessionDetail?.reservation?.endAt || null
  );
  
  // 노트 기능
  const userId = Number(user?.id) || 1;
  const { content: noteContent, updateContent: updateNote, save: saveNote, saving: noteSaving } = useSessionNote(
    sessionDetail?.displayId || '',
    userId
  );
  
  // 세션 상태
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [role, setRole] = useState<'host'|'audience'>('host');
  const [activeTab, setActiveTab] = useState<'chat'|'note'>('chat');
  
  // UI 상태
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, content: '' });
  
  // Refs
  const localWrapRef = useRef<HTMLDivElement>(null);
  const remoteWrapRef = useRef<HTMLDivElement>(null);
  const localTracksRef = useRef<{ mic?: any; cam?: any }>({});
  const screenTrackRef = useRef<any>(null);
  
  const uid = useMemo(() => `user-${Math.random().toString(36).slice(2, 8)}`, []);

  // 예약 데이터 로드
  const { data: reservationsData, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', user?.id],
    queryFn: () => listReservationsByUser(Number(user?.id) || 0),
    enabled: !!user?.id && isAuthenticated,
  });

  // 예약 데이터를 상담 세션 형태로 변환
  const consultations: ConsultationSession[] = reservationsData?.data?.map((reservation: Reservation) => ({
    id: reservation.displayId,
    expertId: reservation.expertId.toString(),
    expertName: `전문가 ${reservation.expertId}`,
    expertAvatar: `전문가 ${reservation.expertId}`.charAt(0),
    expertSpecialty: '전문 상담',
    topic: reservation.note || '상담 예약',
    scheduledTime: reservation.startAt,
    duration: Math.ceil((new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / (1000 * 60)),
    consultationType: 'video' as const,
    status: reservation.status === 'CONFIRMED' ? 'scheduled' as const : 
            reservation.status === 'CANCELED' ? 'cancelled' as const : 'scheduled' as const,
    expertLevel: 1,
    description: reservation.note || undefined,
    reservationId: reservation.id,
  })) || [];

  // URL에서 세션 ID가 있으면 해당 세션 로드
  useEffect(() => {
    if (sessionId) {
      loadSessionDetail(sessionId);
    }
  }, [sessionId]);

  // 세션 상세 정보 로드
  const loadSessionDetail = async (displayId: string) => {
    try {
      setLoading(true);
      const detail = await getSessionDetail(displayId);
      setSessionDetail(detail);
      
      // 해당하는 상담 정보 찾기
      const consultation = consultations.find(c => c.id === displayId);
      if (consultation) {
        setSelectedConsultation(consultation);
        setIsSessionActive(true);
      }
    } catch (error) {
      console.error('Failed to load session detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 상담 시작
  const handleStartConsultation = async (consultation: ConsultationSession) => {
    try {
      // 세션 생성 또는 확인
      const sessionData = await ensureSession(consultation.reservationId);
      
      // URL 업데이트하여 세션 모드로 전환
      const newUrl = `/expert-consultation?session=${sessionData.displayId}`;
      window.history.pushState({}, '', newUrl);
      
      // 세션 상세 정보 로드
      await loadSessionDetail(sessionData.displayId);
    } catch (error) {
      console.error('상담 세션 시작 실패:', error);
      alert('상담을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  // 상담 종료
  const handleEndSession = async () => {
    try {
      if (sessionDetail?.displayId) {
        await endSession(sessionDetail.displayId);
      }
      await leave();
      
      // URL을 원래 상태로 복원
      window.history.pushState({}, '', '/expert-consultation');
      
      setIsSessionActive(false);
      setSelectedConsultation(null);
      setSessionDetail(null);
    } catch (error) {
      console.error('상담 종료 실패:', error);
    }
  };

  // Agora 세션 입장
  const join = async () => {
    if (joining || joined || phase === 'WAIT' || !sessionDetail) return;
    setJoining(true);
    
    try {
      // 상태 LIVE 전환 시도
      try { await startSession(sessionDetail.displayId); } catch {}
      
      const tok = await issueTokens(sessionDetail.displayId, { uid, role });
      const AgoraRTC = await loadRtc();
      const RTC = AgoraRTC;

      // RTC client
      const client = RTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtcRef.current = client;

      // Remote 구독 이벤트
      client.on('user-published', async (user: any, mediaType: any) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video' && remoteWrapRef.current) {
          remoteWrapRef.current.innerHTML = '';
          const div = document.createElement('div');
          div.style.width = '100%';
          div.style.height = '100%';
          remoteWrapRef.current.appendChild(div);
          user.videoTrack?.play(div);
        }
        if (mediaType === 'audio') user.audioTrack?.play();
      });

      await client.join(tok.appId, tok.channel, tok.rtcToken, uid);

      // RTM
      const AgoraRTM = await loadRtm();
      const rtmClient = (AgoraRTM as any).default.createInstance(tok.appId);
      rtmRef.current = rtmClient;
      await rtmClient.login({ uid, token: tok.rtmToken });
      const channel = await rtmClient.createChannel(tok.channel);
      await channel.join();
      bind(rtmClient, channel);
      bindMemberEvents(channel);

      setJoined(true);
    } catch (e) {
      console.error(e);
      alert('세션 입장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setJoining(false);
    }
  };

  // Agora 세션 퇴장
  const leave = async () => {
    try {
      const client = rtcRef.current;
      try {
        if (localTracksRef.current.cam) { localTracksRef.current.cam.stop(); localTracksRef.current.cam.close(); }
        if (localTracksRef.current.mic) { localTracksRef.current.mic.stop(); localTracksRef.current.mic.close(); }
        await client?.leave();
      } catch {}
      
      // RTM 정리
      try {
        const rtm = rtmRef.current;
        const channels = (rtm as any)?._channels ? Array.from((rtm as any)._channels.values()) : [];
        for (const ch of channels) await (ch as any).leave?.();
        await rtm?.logout?.();
      } catch {}
      
      setJoined(false);
      setMicOn(false);
      setCamOn(false);
      resetMembers();
    } catch (e) {
      console.error(e);
    }
  };

  // 마이크 토글
  const toggleMic = async () => {
    if (!joined) return;
    const RTC = await loadRtc();
    const client = rtcRef.current;

    if (!micOn) {
      if (!localTracksRef.current.mic) {
        const mic = await RTC.createMicrophoneAudioTrack();
        localTracksRef.current.mic = mic;
      }
      await client.publish([localTracksRef.current.mic]);
      setMicOn(true);
    } else {
      try { await client.unpublish([localTracksRef.current.mic]); } catch {}
      try { localTracksRef.current.mic.stop(); localTracksRef.current.mic.close(); } catch {}
      localTracksRef.current.mic = undefined;
      setMicOn(false);
    }
  };

  // 카메라 토글
  const toggleCam = async () => {
    if (!joined) return;
    const RTC = await loadRtc();
    const client = rtcRef.current;

    if (!camOn) {
      if (!localTracksRef.current.cam) {
        const [cam] = await RTC.createCameraVideoTrack ? [await RTC.createCameraVideoTrack()] : await RTC.createMicrophoneAndCameraTracks().then(([_, cam]: any) => [cam]);
        localTracksRef.current.cam = cam;
      }
      if (localWrapRef.current) {
        localWrapRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '100%';
        localWrapRef.current.appendChild(div);
        localTracksRef.current.cam.play(div);
      }
      await client.publish([localTracksRef.current.cam]);
      setCamOn(true);
    } else {
      try { await client.unpublish([localTracksRef.current.cam]); } catch {}
      try { localTracksRef.current.cam.stop(); localTracksRef.current.cam.close(); } catch {}
      localTracksRef.current.cam = undefined;
      if (localWrapRef.current) localWrapRef.current.innerHTML = '';
      setCamOn(false);
    }
  };

  // 상담 예약 페이지로 이동
  const handleNewConsultation = () => {
    router.push("/experts");
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "내일";
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  // 상태에 따른 아이콘과 색상
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', text: '예약됨' };
      case 'in-progress':
        return { icon: Play, color: 'text-green-600', bgColor: 'bg-green-100', text: '진행중' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-gray-600', bgColor: 'bg-gray-100', text: '완료' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', text: '취소됨' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100', text: '알 수 없음' };
    }
  };

  // 로그인하지 않은 경우 처리
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    );
  }

  // 상담 세션이 활성화된 경우
  if (isSessionActive && sessionDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 세션 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleEndSession}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">상담 세션</h1>
                  <p className="text-sm text-gray-600">세션 ID: {sessionDetail.displayId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 세션 상태 표시 */}
                {phase === 'WAIT' && (
                  <span className="text-sm text-gray-600 px-3 py-1 bg-yellow-50 rounded-lg">
                    시작까지 {timeLeft.mm}:{timeLeft.ss}
                  </span>
                )}
                {phase === 'OPEN' && (
                  <span className="text-sm text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">
                    입장 가능
                  </span>
                )}
                {phase === 'CLOSED' && (
                  <span className="text-sm text-red-600 px-3 py-1 bg-red-50 rounded-lg">
                    세션 종료
                  </span>
                )}
                
                {/* 상담 컨트롤 */}
                {!joined ? (
                  <button 
                    onClick={join} 
                    disabled={joining || phase === 'WAIT' || phase === 'CLOSED'} 
                    className="rounded-lg border px-4 py-2 disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {joining ? '입장 중…' : '입장하기'}
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button onClick={toggleMic} className={`p-2 rounded-lg ${micOn ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {micOn ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <button onClick={toggleCam} className={`p-2 rounded-lg ${camOn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {camOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <button onClick={handleEndSession} className="p-2 rounded-lg bg-red-600 text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 좌: 채팅/노트 */}
            <div className="lg:col-span-3">
              {/* 참가자 목록 */}
              <div className="rounded-2xl border p-3 mb-4">
                <div className="text-sm font-medium mb-2">참가자</div>
                <div className="flex flex-wrap gap-2">
                  {members.map(id => (
                    <div key={id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-xs">
                        {id[0]?.toUpperCase()}
                      </span>
                      <span className="text-xs">{id}{id === uid ? ' (나)' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 채팅/메모 탭 */}
              <div className="rounded-2xl border p-4 flex flex-col h-[600px]">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    채팅
                  </button>
                  <button
                    onClick={() => setActiveTab('note')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'note' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    메모
                  </button>
                </div>

                {activeTab === 'chat' ? (
                  <>
                    <div className="flex-1 overflow-auto space-y-3 pr-2 mb-4">
                      {messages.map(m => (
                        <div key={m.id} className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${
                          m.uid === 'me' ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="text-xs opacity-70 mb-1">{m.uid}</div>
                          <div className="leading-relaxed">{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <form
                      className="flex gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem('msg') as HTMLInputElement);
                        const v = input.value;
                        send(v);
                        input.value = '';
                      }}
                    >
                      <input
                        name="msg"
                        placeholder="메시지를 입력하세요"
                        className="flex-1 rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="rounded-lg bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700">
                        전송
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <textarea
                        value={noteContent}
                        onChange={(e) => updateNote(e.target.value)}
                        placeholder="개인 메모를 작성하세요..."
                        className="w-full h-full p-4 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => saveNote(noteContent)}
                      disabled={noteSaving}
                      className="mt-3 rounded-lg bg-blue-600 text-white px-6 py-3 text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
                    >
                      {noteSaving ? '저장 중...' : '저장'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 우: 비디오 화면들 */}
            <aside className="space-y-4">
              <div className="rounded-2xl border p-3">
                <div className="text-sm font-medium mb-2">내 화면</div>
                <div ref={localWrapRef} className="h-[180px] rounded-xl bg-gray-100" />
              </div>
              <div className="rounded-2xl border p-3">
                <div className="text-sm font-medium mb-2">상대 화면</div>
                <div ref={remoteWrapRef} className="h-[180px] rounded-xl bg-gray-100" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // 일반 상담 목록 보기
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전문가 상담</h1>
          <p className="mt-2 text-gray-600">
            예약된 상담을 관리하고 실시간으로 전문가와 상담하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 패널: 예약된 상담 목록 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* 예약된 상담 목록 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* 패널 헤더 */}
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

                {/* 상담 목록 */}
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {isLoadingReservations ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">예약 정보를 불러오는 중...</p>
                    </div>
                  ) : consultations.length === 0 ? (
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
                    consultations.map((consultation) => {
                      const statusInfo = getStatusInfo(consultation.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div
                          key={consultation.id}
                          className={`px-6 py-4 cursor-pointer transition-colors ${
                            selectedConsultation?.id === consultation.id
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedConsultation(consultation)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {consultation.expertAvatar}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {consultation.expertName}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusInfo.text}
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {consultation.expertSpecialty}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {consultation.topic}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{formatDate(consultation.scheduledTime)}</span>
                                <span className="mx-1">•</span>
                                <span>{formatTime(consultation.scheduledTime)}</span>
                                <span className="mx-1">•</span>
                                <span>{consultation.duration}분</span>
                              </div>
                              <div className="flex items-center mt-2">
                                {consultation.consultationType === "chat" && (
                                  <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
                                )}
                                {consultation.consultationType === "voice" && (
                                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                )}
                                {consultation.consultationType === "video" && (
                                  <Video className="h-4 w-4 text-gray-400 mr-2" />
                                )}
                                <span className="text-xs text-gray-500 capitalize">
                                  {consultation.consultationType === "chat" && "채팅"}
                                  {consultation.consultationType === "voice" && "음성"}
                                  {consultation.consultationType === "video" && "화상"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 패널: 상담 세션 */}
          <div className="lg:col-span-2">
            {selectedConsultation ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* 상담 정보 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600">
                          {selectedConsultation.expertAvatar}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedConsultation.expertName} 전문가
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConsultation.expertSpecialty} • {selectedConsultation.duration}분
                        </p>
                        <div className="flex items-center mt-1">
                          {selectedConsultation.consultationType === "chat" && (
                            <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
                          )}
                          {selectedConsultation.consultationType === "voice" && (
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          )}
                          {selectedConsultation.consultationType === "video" && (
                            <Video className="h-4 w-4 text-gray-400 mr-2" />
                          )}
                          <span className="text-sm text-gray-600">
                            {selectedConsultation.consultationType === "chat" && "채팅 상담"}
                            {selectedConsultation.consultationType === "voice" && "음성 상담"}
                            {selectedConsultation.consultationType === "video" && "화상 상담"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">상담 시간</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(selectedConsultation.scheduledTime)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(selectedConsultation.scheduledTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 상담 주제 */}
                {selectedConsultation.description && (
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">상담 주제</h4>
                    <p className="text-sm text-gray-600">{selectedConsultation.description}</p>
                  </div>
                )}

                {/* 상담 컨트롤 */}
                <div className="px-6 py-6">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">상담 준비 완료</h4>
                    <p className="text-sm text-gray-600 mb-6">
                      예약된 {selectedConsultation.consultationType === "chat" ? "채팅" : 
                             selectedConsultation.consultationType === "voice" ? "음성" : "화상"} 상담을 시작할 준비가 되었습니다.
                    </p>
                    
                    <div className="flex items-center justify-center space-x-4">
                      {selectedConsultation.status === 'scheduled' ? (
                        <button
                          onClick={() => handleStartConsultation(selectedConsultation)}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          상담 시작하기
                        </button>
                      ) : selectedConsultation.status === 'completed' ? (
                        <div className="text-center">
                          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                          <p className="text-sm text-gray-600">상담이 완료되었습니다</p>
                        </div>
                      ) : selectedConsultation.status === 'cancelled' ? (
                        <div className="text-center">
                          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                          <p className="text-sm text-gray-600">상담이 취소되었습니다</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Clock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                          <p className="text-sm text-gray-600">상담 대기 중입니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">상담을 선택해주세요</h3>
                <p className="mt-1 text-sm text-gray-500">
                  왼쪽에서 예약된 상담을 선택하면 상담을 시작할 수 있습니다
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}