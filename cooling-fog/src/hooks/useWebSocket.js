import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket 연결됨');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // 연결 유지를 위한 ping 메시지
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        ws.pingInterval = pingInterval;
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
        
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }
        
        // 자동 재연결
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2000 * reconnectAttempts.current); // 지수 백오프
        } else {
          setError('최대 재연결 시도 횟수에 도달했습니다.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        setError('WebSocket 연결 오류가 발생했습니다.');
      };

      setSocket(ws);
    } catch (err) {
      console.error('WebSocket 연결 실패:', err);
      setError('WebSocket 연결에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      if (socket) {
        if (socket.pingInterval) {
          clearInterval(socket.pingInterval);
        }
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
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