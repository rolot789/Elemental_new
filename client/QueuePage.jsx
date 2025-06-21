import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, ArrowLeft } from 'lucide-react';

const QueuePage = ({ socket, user }) => {
  const navigate = useNavigate();
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [isWaiting, setIsWaiting] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3분

  useEffect(() => {
    if (!socket) return;

    // 대기열 진입
    socket.emit('enterQueue', { studentId: user.studentId });

    // 대기열 업데이트 수신
    socket.on('queueUpdate', (data) => {
      setQueueLength(data.queueLength);
      if (data.position) {
        setQueuePosition(data.position);
      }
    });

    // 차례 알림 수신
    socket.on('yourTurn', () => {
      setIsWaiting(false);
      navigate('/booking');
    });

    return () => {
      socket.off('queueUpdate');
      socket.off('yourTurn');
    };
  }, [socket, user, navigate]);

  useEffect(() => {
    if (!isWaiting) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 시간 초과 시 홈으로 돌아가기
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWaiting, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg glass-card border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            대기열
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="queue-animation mb-6">
              <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 border-t-transparent loading-spinner"></div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-white">
                <Users className="w-5 h-5" />
                <span className="text-lg">
                  현재 대기 인원: <span className="font-bold text-blue-400">{queueLength}명</span>
                </span>
              </div>
              
              {queuePosition > 0 && (
                <div className="text-white">
                  <span className="text-lg">
                    내 순서: <span className="font-bold text-purple-400">{queuePosition}번째</span>
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span>
                  남은 시간: <span className="font-mono text-red-400">{formatTime(timeRemaining)}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            <p>잠시만 기다려주세요.</p>
            <p>차례가 되면 자동으로 예약 페이지로 이동합니다.</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueuePage;

