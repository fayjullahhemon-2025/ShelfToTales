import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export function useStompRoom({ wsUrl, roomId, token, onMessage }) {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(onMessage);
  handlersRef.current = onMessage;

  useEffect(() => {
    if (!token || !roomId) return undefined;
    const url = wsUrl || 'http://localhost:8080/ws';
    const c = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });
    c.onConnect = () => {
      setConnected(true);
      c.subscribe(`/topic/room/${roomId}`, (msg) => {
        try { handlersRef.current?.(JSON.parse(msg.body), 'chat'); } catch { /* noop */ }
      });
      c.subscribe(`/topic/room/${roomId}/music`, (msg) => {
        try { handlersRef.current?.(JSON.parse(msg.body), 'music'); } catch { /* noop */ }
      });
      setClient(c);
    };
    c.onDisconnect = () => setConnected(false);
    c.onStompError = (frame) => {
      console.error('STOMP error from server:', frame.headers['message'], frame.body);
      setConnected(false);
    };
    c.activate();
    return () => { try { c.deactivate(); } catch { /* noop */ } };
  }, [wsUrl, roomId, token]);

  return { client, connected };
}
