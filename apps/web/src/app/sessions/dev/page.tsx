'use client';

import { useState } from 'react';
import { ensureSession, startSession, endSession } from '@/lib/sessions';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function SessionDevPage() {
  const [reservationId, setReservationId] = useState<number>(1);
  const [displayId, setDisplayId] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [status, setStatus] = useState<'SCHEDULED'|'LIVE'|'ENDED'|''>('');
  const [log, setLog] = useState<string>('');

  const appendLog = (m: string) => setLog((s) => s + (s ? '\n' : '') + m);

  const ensure = async () => {
    try {
      const s = await ensureSession(reservationId);
      setDisplayId(s.displayId);
      setChannel(s.channel);
      setStatus(s.status);
      appendLog(`ensure → ${s.displayId} / ${s.channel} / ${s.status}`);
    } catch (error) {
      appendLog(`ensure failed: ${error}`);
    }
  };

  const start = async () => {
    if (!displayId) return;
    try {
      const s = await startSession(displayId);
      setStatus(s.status);
      appendLog(`start → ${s.status}`);
    } catch (error) {
      appendLog(`start failed: ${error}`);
    }
  };

  const end = async () => {
    if (!displayId) return;
    try {
      await endSession(displayId);
      setStatus('ENDED');
      appendLog('ended');
    } catch (error) {
      appendLog(`end failed: ${error}`);
    }
  };

  return (
    <main className="max-w-screen-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">세션 개발 도구</h1>
        <p className="text-gray-600">세션 관리 기능을 테스트하고 개발할 수 있는 도구입니다</p>
      </div>

      <div className="space-y-6">
        {/* 안내 카드 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">호스트 가이드</h3>
                <p className="text-sm text-gray-600">
                  호스트는 카메라/마이크 권한을 허용해주세요. 상담을 진행하는 전문가가 호스트 역할을 합니다.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">테스트 방법</h3>
                <p className="text-sm text-gray-600">
                  다른 탭에서 audience로 접속해 원격 미리보기를 확인하세요. 실제 상담 환경을 시뮬레이션할 수 있습니다.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 세션 제어 */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">세션 제어</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation ID
              </label>
              <input 
                type="number" 
                value={reservationId} 
                onChange={(e) => setReservationId(parseInt(e.target.value || '0', 10))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예약 ID를 입력하세요"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={ensure} variant="ghost">
                1) Ensure Session
              </Button>
              <Button 
                onClick={start} 
                disabled={!displayId || status === 'LIVE' || status === 'ENDED'}
              >
                2) Start Session
              </Button>
              <Button 
                onClick={end} 
                variant="danger"
                disabled={!displayId || status === 'ENDED'}
              >
                3) End Session
              </Button>
              {displayId && (
                <Button 
                  onClick={() => window.open(`/sessions/${displayId}`, '_blank')}
                  variant="primary"
                >
                  세션 입장 (새 탭)
                </Button>
              )}
            </div>

            {/* 세션 정보 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">세션 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Display ID:</span>
                  <span className="ml-2 font-mono font-semibold">
                    {displayId || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Channel:</span>
                  <span className="ml-2 font-mono font-semibold">
                    {channel || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-semibold ${
                    status === 'LIVE' ? 'text-green-600' :
                    status === 'SCHEDULED' ? 'text-yellow-600' :
                    status === 'ENDED' ? 'text-gray-600' : ''
                  }`}>
                    {status || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 로그 */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">실행 로그</h3>
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">
              {log || '로그가 여기에 표시됩니다...'}
            </pre>
          </div>
        </Card>

        {/* 개발 안내 */}
        <Card>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-green-900 mb-1">Agora 화상 통화 준비 완료!</h4>
                <p className="text-sm text-green-800">
                  Agora RTC + RTM 기능이 구현되었습니다. 세션을 생성한 후 "세션 입장" 버튼을 클릭하여 
                  실제 화상 통화와 채팅 기능을 테스트해보세요. 다른 탭에서 동일한 세션에 audience로 접속하면 
                  상호 화상 통화가 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
