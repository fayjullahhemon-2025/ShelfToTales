'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

import { roomPlaylistService } from '@/lib/api';
import { useLofi } from './LofiContext';

const RoomMusicContext = createContext(null);

export function RoomMusicProvider({ roomId, stompClient, connected, children }) {
  const [tracks, setTracks] = useState([]);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [senderEmail, setSenderEmail] = useState(null);
  const audioRef = useRef(null);
  const currentTrackIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const suppressBroadcastRef = useRef(false);

  const { isPlaying: globalLofiPlaying, setIsPlaying: setGlobalLofiPlaying } = useLofi();

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
        } catch (e) {
          console.error('Failed to clean up room music audio on unmount:', e);
        }
      }
    };
  }, []);

  // Pause global lofi when room music starts playing
  useEffect(() => {
    if (isPlaying && globalLofiPlaying) {
      setGlobalLofiPlaying(false);
    }
  }, [isPlaying, globalLofiPlaying, setGlobalLofiPlaying]);

  // Load tracks + seed player state on mount
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await roomPlaylistService.list(roomId);
        if (!cancelled) setTracks(res.data || []);
      } catch { /* ignore */ }
      try {
        const stateRes = await roomPlaylistService.getPlayerState(roomId);
        if (!cancelled && stateRes && stateRes.data) {
          const s = stateRes.data;
          if (s.currentTrackId != null && s.currentTrackId !== -1) {
            setCurrentTrackId(s.currentTrackId);
            currentTrackIdRef.current = s.currentTrackId;
          }
          setIsPlaying(!!s.playing);
          isPlayingRef.current = !!s.playing;
          setPositionMs(s.positionMs || 0);
        }
      } catch { /* ignore 204 */ }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  // Subscribe to /topic/room/{id}/music
  useEffect(() => {
    if (!stompClient || !connected || !roomId) return;
    const sub = stompClient.subscribe(`/topic/room/${roomId}/music`, (msg) => {
      try {
        const body = JSON.parse(msg.body);
        if (body.action === 'ended') {
          suppressBroadcastRef.current = true;
          setCurrentTrackId(null);
          currentTrackIdRef.current = null;
          setIsPlaying(false);
          isPlayingRef.current = false;
          setPositionMs(0);
          return;
        }
        if (body.trackId != null && body.trackId !== -1) {
          setCurrentTrackId(body.trackId);
          currentTrackIdRef.current = body.trackId;
        }
        if (typeof body.positionMs === 'number') setPositionMs(body.positionMs);
        setIsPlaying(!!body.playing);
        isPlayingRef.current = !!body.playing;
        setSenderEmail(body.senderEmail || null);
      } catch { /* ignore */ }
    });
    return () => { try { sub.unsubscribe(); } catch { /* noop */ } };
  }, [stompClient, connected, roomId]);

  // Drive local <audio> from server state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'auto';
      audioRef.current = a;
    }
    const track = tracks.find(t => t.id === currentTrackId);
    const a = audioRef.current;
    if (!track) {
      try { a.pause(); } catch { /* noop */ }
      return;
    }
    if (a.src !== track.fileUrl) {
      a.src = track.fileUrl;
      a.load();
    }
    a.volume = 1.0;
    if (isPlaying) {
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      a.pause();
    }
  }, [currentTrackId, isPlaying, tracks]);

  // Keep audio position in sync with server position (soft rebase)
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !isPlaying) return;
    const drift = Math.abs((a.currentTime * 1000) - positionMs);
    if (drift > 1500) {
      try { a.currentTime = positionMs / 1000; } catch { /* noop */ }
    }
  }, [positionMs, isPlaying]);

  const currentTrack = useMemo(
    () => tracks.find(t => t.id === currentTrackId) || null,
    [tracks, currentTrackId]
  );

  const publish = useCallback((action, body) => {
    if (!stompClient || !connected) return;
    try {
      stompClient.publish({
        destination: `/app/room/${roomId}/music/${action}`,
        body: JSON.stringify(body || {}),
      });
    } catch { /* ignore */ }
  }, [stompClient, connected, roomId]);

  const togglePlay = useCallback(() => {
    if (!currentTrackIdRef.current) return;
    if (isPlayingRef.current) {
      publish('pause', { trackId: currentTrackIdRef.current, positionMs: positionMs });
    } else {
      publish('play', { trackId: currentTrackIdRef.current, positionMs: positionMs });
    }
  }, [publish, positionMs]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex(t => t.id === currentTrackIdRef.current);
    const next = tracks[(idx + 1) % tracks.length];
    publish('track', { trackId: next.id });
  }, [publish, tracks]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex(t => t.id === currentTrackIdRef.current);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    publish('track', { trackId: prev.id });
  }, [publish, tracks]);

  const playTrack = useCallback((trackId) => {
    publish('track', { trackId });
  }, [publish]);

  const seek = useCallback((newPositionMs) => {
    publish('seek', { positionMs: newPositionMs });
  }, [publish]);

  const refreshTracks = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await roomPlaylistService.list(roomId);
      setTracks(res.data || []);
    } catch { /* ignore */ }
  }, [roomId]);

  const value = useMemo(() => ({
    tracks,
    currentTrack,
    currentTrackId,
    isPlaying,
    positionMs,
    senderEmail,
    togglePlay,
    nextTrack,
    prevTrack,
    playTrack,
    seek,
    refreshTracks,
  }), [tracks, currentTrack, currentTrackId, isPlaying, positionMs, senderEmail, togglePlay, nextTrack, prevTrack, playTrack, seek, refreshTracks]);

  return <RoomMusicContext.Provider value={value}>{children}</RoomMusicContext.Provider>;
}

export function useRoomMusic() {
  const ctx = useContext(RoomMusicContext);
  if (!ctx) {
    throw new Error('useRoomMusic must be used within a RoomMusicProvider');
  }
  return ctx;
}

export default RoomMusicContext;
