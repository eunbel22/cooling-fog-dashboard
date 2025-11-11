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
        console.log('⚠️ [WebSocket] 이미 연결 중이거나 연결됨, 중복 연결 방지');
        return;
      }

      try {
        console.log(`🔵 [WebSocket] 연결 시도: ${url}`);
        const ws = new WebSocket(url);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('✅ [WebSocket] 연결 성공!');
          console.log(`   URL: ${url}`);
          console.log(`   시간: ${new Date().toLocaleTimeString()}`);
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          setSocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 [WebSocket] 메시지 수신:', data);
            setLastMessage(data);
          } catch (err) {
            console.error('❌ [WebSocket] 메시지 파싱 오류:', err);
            console.error('   원본 데이터:', event.data);
          }
        };

        ws.onclose = (event) => {
          console.log('⚠️ [WebSocket] 연결 해제됨');
          console.log(`   코드: ${event.code}`);
          console.log(`   이유: ${event.reason || '없음'}`);
          setIsConnected(false);
          wsRef.current = null;
          
          // 재연결 시도
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            
            console.log(`🔄 [WebSocket] ${delay/1000}초 후 재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            const errorMsg = '최대 재연결 시도 횟수에 도달했습니다.';
            console.error(`❌ [WebSocket] ${errorMsg}`);
            setError(errorMsg);
          }
        };

        ws.onerror = (err) => {
          console.error('❌ [WebSocket] 연결 오류:', err);
          console.error(`   URL: ${url}`);
          console.error(`   ReadyState: ${ws.readyState}`);
          setError('WebSocket 연결 오류');
        };
        
      } catch (err) {
        console.error('❌ [WebSocket] 연결 실패:', err);
        setError('WebSocket 연결에 실패했습니다.');
      }
    };

    console.log('🚀 [WebSocket] Hook 초기화');
    connect();

    // cleanup
    return () => {
      console.log('🧹 [WebSocket] Cleanup');
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
      const messageStr = JSON.stringify(message);
      console.log('📤 [WebSocket] 메시지 전송:', message);
      wsRef.current.send(messageStr);
    } else {
      console.warn('⚠️ [WebSocket] 연결되지 않음, 메시지 전송 실패');
      console.warn('   ReadyState:', wsRef.current?.readyState);
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