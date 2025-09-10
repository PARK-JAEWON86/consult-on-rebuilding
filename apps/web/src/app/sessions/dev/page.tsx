'use client';

import { useState, useRef } from 'react';
import { ensureSession, startSession, endSession, issueTokens } from '@/lib/sessions';

export default function SessionDevPage() {
  const [reservationId, setReservationId] = useState<number>(1);
  const [displayId, setDisplayId] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [status, setStatus] = useState<'SCHEDULED'|'LIVE'|'ENDED'|''>('');
  const [role, setRole] = useState<'host'|'audience'>('host');
  const [uid, setUid] = useState<string>('user-1');
  const [log, setLog] = useState<string>('');

  const rtcClientRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);

  const appendLog = (m: string) => setLog((s) => s + (s ? '\n' : '') + m);

  const ensure = async () => {
    const s = await ensureSession(reservationId);
    setDisplayId(s.displayId);
    setChannel(s.channel);
    setStatus(s.status);
    appendLog(`ensure → ${s.displayId} / ${s.channel} / ${s.status}`);
  };

  const start = async () => {
    if (!displayId) return;
    const s = await startSession(displayId);
    setStatus(s.status);
    appendLog(`start → ${s.status}`);
  };

  const join = async () => {
    if (!displayId) return;
    const tok = await issueTokens(displayId, { uid, role });
    appendLog('token issued');

    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
    // create client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    rtcClientRef.current = client;

    // join with token
    await client.join(tok.appId, tok.channel, tok.rtcToken, uid);

    if (role === 'host') {
      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTrackRef.current = { mic, cam };
      // play local
      if (localContainerRef.current) {
        localContainerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '220px';
        localContainerRef.current.appendChild(div);
        cam.play(div);
      }
      await client.publish([mic, cam]);
      appendLog('published local mic/cam');
    }

    // subscribe remote
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      appendLog(`subscribed: ${user.uid} / ${mediaType}`);
      if (mediaType === 'video' && remoteContainerRef.current) {
        remoteContainerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '220px';
        remoteContainerRef.current.appendChild(div);
        user.videoTrack?.play(div);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });
  };

  const leave = async () => {
    try {
      const client = rtcClientRef.current;
      if (localTrackRef.current?.cam) {
        localTrackRef.current.cam.stop();
        localTrackRef.current.cam.close();
      }
      if (localTrackRef.current?.mic) {
        localTrackRef.current.mic.stop();
        localTrackRef.current.mic.close();
      }
      await client?.leave();
      appendLog('left channel');
    } catch (e) {
      console.error(e);
    }
  };

  const end = async () => {
    if (!displayId) return;
    await endSession(displayId);
    setStatus('ENDED');
    appendLog('ended');
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">세션(개발용) — ensure/start/join/end</h1>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border p-4 space-y-2">
          <label className="block">
            <span className="text-sm text-gray-600">Reservation ID</span>
            <input type="number" value={reservationId} onChange={(e)=>setReservationId(parseInt(e.target.value||'0',10))}
                   className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Role</span>
            <select value={role} onChange={(e)=>setRole(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="host">host</option>
              <option value="audience">audience</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">UID</span>
            <input value={uid} onChange={(e)=>setUid(e.target.value)}
                   className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={ensure} className="rounded-xl border px-3 py-2">1) ensure</button>
            <button onClick={start} disabled={!displayId || status==='LIVE' || status==='ENDED'} className="rounded-xl border px-3 py-2 disabled:opacity-50">2) start</button>
            <button onClick={join} disabled={!displayId} className="rounded-xl border px-3 py-2 disabled:opacity-50">3) join</button>
            <button onClick={leave} className="rounded-xl border px-3 py-2">leave</button>
            <button onClick={end} disabled={!displayId || status==='ENDED'} className="rounded-xl border px-3 py-2 disabled:opacity-50">4) end</button>
          </div>

          <div className="text-sm text-gray-600">
            <div>displayId: <b>{displayId || '-'}</b></div>
            <div>channel: <b>{channel || '-'}</b></div>
            <div>status: <b>{status || '-'}</b></div>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold mb-1">Local</div>
            <div ref={localContainerRef} className="h-[220px] w-full rounded-xl bg-gray-100" />
          </div>
          <div>
            <div className="text-sm font-semibold mb-1">Remote</div>
            <div ref={remoteContainerRef} className="h-[220px] w-full rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>

      <pre className="rounded-xl bg-gray-50 p-3 text-xs whitespace-pre-wrap">{log}</pre>
    </main>
  );
}
