import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connect = () => {
      // 이미 연결 중이거나 연결되어 있으면 중복 방지
      if (wsRef.current && 
          (wsRef.current.readyState === WebSocket.CONNECTING || 
           wsRef.current.readyState === WebSocket.OPEN)) {
        return;
      }

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('WebSocket 연결됨');
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          setSocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
          } catch (err) {
            console.error('메시지 파싱 오류:', err);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket 연결 해제됨');
          setIsConnected(false);
          wsRef.current = null;
          
          // 재연결 시도
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
              connect();
            }, delay);
          } else {
            setError('최대 재연결 시도 횟수에 도달했습니다.');
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket 오류:', err);
          setError('WebSocket 연결 오류');
        };
        
      } catch (err) {
        console.error('WebSocket 연결 실패:', err);
        setError('WebSocket 연결에 실패했습니다.');
      }
    };

    connect();

    // cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket이 연결되지 않았습니다.');
    }
  };

  return {
    socket,
    lastMessage,
    isConnected,
    error,
    sendMessage
  };
};

export default useWebSocket;