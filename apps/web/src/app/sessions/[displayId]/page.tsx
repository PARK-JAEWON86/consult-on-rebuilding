'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { issueTokens, startSession, endSession, getSessionDetail } from '@/lib/sessions';
import { createReview } from '@/lib/reviews';
import { useDynamicAgora } from '@/features/sessions/useAgoraClient';
import { useRtmChat } from '@/features/sessions/useRtmChat';
import { useRtmMembers } from '@/features/sessions/useRtmMembers';
import { useSessionTimer } from '@/features/sessions/useSessionTimer';
import { useSessionNote } from '@/features/sessions/useSessionNote';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SessionRoomPage() {
  const { displayId } = useParams<{ displayId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { rtcRef, rtmRef, loadRtc, loadRtm } = useDynamicAgora();
  const { messages, bind, send } = useRtmChat();
  const { members, bindMemberEvents, reset: resetMembers } = useRtmMembers();

  // 입장 윈도우 규칙 상수
  const ENTER_EARLY_MIN = 5;   // 시작 5분 전부터 입장 허용
  const LEAVE_GRACE_MIN = 10;  // 종료 10분 후까지 재입장/입장 허용

  // 세션 상세 정보
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 타이머 및 페이즈
  const { phase, timeLeft } = useSessionTimer(
    sessionDetail?.reservation?.startAt || null,
    sessionDetail?.reservation?.endAt || null
  );

  // 노트 (사용자 ID)
  const userId = user?.id || 1;
  const { content: noteContent, updateContent: updateNote, save: saveNote, saving: noteSaving } = useSessionNote(displayId, userId);

  // 세션 상태
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [role, setRole] = useState<'host'|'audience'>('host');

  // 새로운 기능 상태들
  const [autoJoin, setAutoJoin] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [rtcStats, setRtcStats] = useState<any>(null);
  const [remoteStats, setRemoteStats] = useState<any>(null);

  // UI 상태
  const [activeTab, setActiveTab] = useState<'chat'|'note'>('chat');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, content: '' });

  const localWrapRef = useRef<HTMLDivElement>(null);
  const remoteWrapRef = useRef<HTMLDivElement>(null);
  const localTracksRef = useRef<{ mic?: any; cam?: any }>({});
  const screenTrackRef = useRef<any>(null);

  const uid = useMemo(() => `user-${Math.random().toString(36).slice(2, 8)}`, []);

  // 세션 상세 정보 로드
  useEffect(() => {
    const loadDetail = async () => {
      try {
        const detail = await getSessionDetail(displayId);
        setSessionDetail(detail);
      } catch (error) {
        console.error('Failed to load session detail:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [displayId]);

  // 자동 입장 처리
  useEffect(() => {
    if (!sessionDetail?.reservation) return;

    const interval = setInterval(() => {
      if (phase === 'OPEN' && autoJoin && !joined && !joining) {
        join();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, autoJoin, joined, joining, sessionDetail]);

  // 네트워크 품질 모니터링
  useEffect(() => {
    if (!joined || !rtcRef.current) return;

    const interval = setInterval(() => {
      try {
        const client = rtcRef.current;
        const stats = client.getRTCStats?.();
        setRtcStats(stats || null);

        // 원격 사용자 통계 (가능한 범위 내에서)
        const users = (client as any)?._users;
        if (users) {
          const remoteUser = Array.from(users.values()).find((u: any) => u.videoTrack || u.audioTrack);
          if (remoteUser) {
            const remoteStats = (remoteUser as any).videoTrack?.getStats?.() || (remoteUser as any).audioTrack?.getStats?.();
            setRemoteStats(remoteStats || null);
          }
        }
      } catch (error) {
        // 통계 수집 실패는 무시
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [joined]);

  // 입장
  const join = async () => {
    if (joining || joined || phase === 'WAIT') return;
    setJoining(true);
    try {
      // 상태 LIVE 전환 시도 (실패해도 무시)
      try { await startSession(displayId); } catch {}

      const tok = await issueTokens(displayId, { uid, role });
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
          div.style.borderRadius = '8px';
          div.style.overflow = 'hidden';
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

  // 퇴장
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

  // 종료(호스트만)
  const end = async () => {
    try { await endSession(displayId); } catch {}
    await leave();
    // 후기 모달 표시
    if (sessionDetail?.reservation) {
      setShowReviewModal(true);
    } else {
      router.replace('/dashboard/reservations');
    }
  };

  // 토글: 마이크
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

  // 토글: 카메라
  const toggleCam = async () => {
    if (!joined) return;
    const RTC = await loadRtc();
    const client = rtcRef.current;

    if (!camOn) {
      if (!localTracksRef.current.cam) {
        const [cam] = await RTC.createCameraVideoTrack ? [await RTC.createCameraVideoTrack()] : await RTC.createMicrophoneAndCameraTracks().then(([_, cam]: any) => [cam]);
        localTracksRef.current.cam = cam;
      }
      // local preview
      if (localWrapRef.current) {
        localWrapRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.borderRadius = '8px';
        div.style.overflow = 'hidden';
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

  // 토글: 화면공유 (호스트 전용)
  const toggleScreen = async () => {
    if (!joined || role !== 'host') return;
    const RTC = await loadRtc();
    const client = rtcRef.current;

    if (!screenOn) {
      try {
        const screenTrack = await RTC.createScreenVideoTrack({ encoderConfig: 'auto' }, 'auto');
        screenTrackRef.current = screenTrack;

        // 기존 카메라 트랙 언퍼블리시
        if (localTracksRef.current.cam && camOn) {
          try { await client.unpublish([localTracksRef.current.cam]); } catch {}
        }

        // 화면공유 트랙 퍼블리시
        await client.publish([screenTrack]);

        // 로컬 프리뷰
        if (localWrapRef.current) {
          localWrapRef.current.innerHTML = '';
          const div = document.createElement('div');
          div.style.width = '100%';
          div.style.height = '100%';
          div.style.borderRadius = '8px';
          div.style.overflow = 'hidden';
          localWrapRef.current.appendChild(div);
          (screenTrack as any).play(div);
        }

        setScreenOn(true);
      } catch (error) {
        console.error('Screen share failed:', error);
        alert('화면공유 권한이 필요합니다. 브라우저에서 화면공유를 허용해주세요.');
      }
    } else {
      try {
        // 화면공유 트랙 정리
        if (screenTrackRef.current) {
          await client.unpublish([screenTrackRef.current]);
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }

        // 카메라가 켜져있었다면 다시 퍼블리시
        if (localTracksRef.current.cam && camOn) {
          await client.publish([localTracksRef.current.cam]);
          if (localWrapRef.current) {
            localWrapRef.current.innerHTML = '';
            const div = document.createElement('div');
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.borderRadius = '8px';
            div.style.overflow = 'hidden';
            localWrapRef.current.appendChild(div);
            localTracksRef.current.cam.play(div);
          }
        } else if (localWrapRef.current) {
          localWrapRef.current.innerHTML = '';
        }

        setScreenOn(false);
      } catch (error) {
        console.error('Stop screen share failed:', error);
      }
    }
  };

  // 후기 제출
  const submitReview = async () => {
    if (!sessionDetail?.reservation || reviewData.content.length < 10) return;

    try {
      await createReview({
        userId,
        expertId: sessionDetail.reservation.expertId,
        reservationId: sessionDetail.reservation.id,
        rating: reviewData.rating,
        content: reviewData.content,
        isPublic: true
      });

      alert('후기가 등록되었습니다.');
      setShowReviewModal(false);
      router.replace('/dashboard/reservations');
    } catch (error) {
      console.error('Review submission failed:', error);
      alert('후기 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    // 페이지 떠날 때 정리
    return () => { leave(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 사용자 역할 판단 (expert인지 client인지)
  const userRole = user?.role || 'user';
  const dashboardVariant = userRole === 'expert' ? 'expert' : 'user';

  if (loading) {
    return (
      <DashboardLayout variant={dashboardVariant}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">세션 정보를 불러오는 중...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant={dashboardVariant}>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">상담 세션</h1>
            <p className="text-sm text-gray-600">세션 ID: {displayId}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 대기실/입장 상태 표시 */}
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

            <select
              value={role}
              onChange={(e)=>setRole(e.target.value as any)}
              className="rounded-lg border px-3 py-2 text-sm"
              aria-label="역할 선택"
            >
              <option value="host">호스트</option>
              <option value="audience">참가자</option>
            </select>

            {/* 자동 입장 체크박스 */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoJoin}
                onChange={(e) => setAutoJoin(e.target.checked)}
                className="rounded"
              />
              자동 입장
            </label>

            {!joined ? (
              <button
                onClick={join}
                disabled={joining || phase === 'WAIT' || phase === 'CLOSED'}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {joining ? '입장 중…' : '입장하기'}
              </button>
            ) : (
              <>
                <button onClick={toggleMic} className="rounded-lg border px-3 py-2">
                  {micOn ? '마이크 끄기' : '마이크 켜기'}
                </button>
                <button onClick={toggleCam} className="rounded-lg border px-3 py-2">
                  {camOn ? '카메라 끄기' : '카메라 켜기'}
                </button>
                {role === 'host' && (
                  <button onClick={toggleScreen} className="rounded-lg border px-3 py-2">
                    {screenOn ? '화면공유 중지' : '화면공유 시작'}
                  </button>
                )}
                <button onClick={leave} className="rounded-lg border px-3 py-2">나가기</button>
                {role === 'host' && phase !== 'CLOSED' && (
                  <button onClick={end} className="rounded-lg border px-3 py-2 text-red-600">
                    세션 종료
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {/* 정책 안내 박스 */}
        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="text-sm text-gray-700 space-y-1">
            <div className="font-medium text-gray-900 mb-2">세션 이용 안내</div>
            <div>• 입장 가능: 시작 {ENTER_EARLY_MIN}분 전부터</div>
            <div>• 지연 허용: 종료 후 {LEAVE_GRACE_MIN}분까지 재입장 가능</div>
            <div>• 노쇼 정책: 시작 후 15분 미접속 시 노쇼 처리될 수 있습니다</div>
            <div>• 환불 정책: 노쇼/부분 참여 시 환불 불가(또는 부분 환불 규정에 따름)</div>
            {/* 추후 CMS/설정으로 치환 예정 */}
          </div>
        </div>

        {/* 상담 영역 - 단일 컬럼 레이아웃 */}
        <section className="space-y-6">
          {/* 상단: 비디오 화면들 */}
          <div className="bg-white rounded-2xl border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">화상 상담</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {/* 참가자 정보 */}
                <div className="flex items-center gap-2">
                  <span className="font-medium">참가자:</span>
                  <div className="flex gap-2">
                    {members.map(id => (
                      <div key={id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-xs">
                          {id[0]?.toUpperCase()}
                        </span>
                        <span className="text-xs">{id}{id === uid ? ' (나)' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 네트워크 품질 */}
                {joined && rtcStats && (
                  <div className="text-xs text-gray-500">
                    네트워크: {rtcStats?.uplinkBitrate ? `${Math.round(rtcStats.uplinkBitrate / 1000)}kbps` : '-'} /
                    {rtcStats?.rtt ? ` ${rtcStats.rtt}ms` : ' -ms'}
                  </div>
                )}
              </div>
            </div>

            {/* 비디오 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium mb-2 text-gray-700">내 화면</div>
                <div ref={localWrapRef} className="aspect-video rounded-lg bg-gray-200 overflow-hidden" />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium mb-2 text-gray-700">상대방 화면</div>
                <div ref={remoteWrapRef} className="aspect-video rounded-lg bg-gray-200 overflow-hidden" />
              </div>
            </div>
          </div>

          {/* 하단: 채팅/메모 영역 */}
          <div className="bg-white rounded-2xl border p-6">
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
              <div className="flex flex-col h-[400px]">
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
              </div>
            ) : (
              <div className="flex flex-col h-[400px]">
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
              </div>
            )}
          </div>
        </section>

        {/* 후기 모달 */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" role="dialog" aria-modal="true">
              <h3 className="text-lg font-semibold mb-4">상담 후기 작성</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">별점</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">후기 (10-500자)</label>
                <textarea
                  value={reviewData.content}
                  onChange={(e) => setReviewData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="상담에 대한 후기를 작성해주세요..."
                  className="w-full h-24 p-3 border rounded-lg resize-none text-sm"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {reviewData.content.length}/500자
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm"
                >
                  나중에
                </button>
                <button
                  onClick={submitReview}
                  disabled={reviewData.content.length < 10}
                  className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
                >
                  제출
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}