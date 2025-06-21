import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';

const HomePage = ({ user }) => {
  const navigate = useNavigate();

  const handleBookingClick = () => {
    navigate('/queue');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          안녕하세요, {user?.name || user?.studentId}님
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          스터디룸 예약을 시작해보세요
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <Button
          onClick={handleBookingClick}
          className="floating-button w-64 h-20 text-2xl font-bold text-white rounded-2xl"
        >
          예약하기
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="glass-card p-6 rounded-xl text-center">
            <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">당일 예약</h3>
            <p className="text-gray-300 text-sm">
              오늘 날짜의 스터디룸만 예약 가능합니다
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl text-center">
            <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">최대 4시간</h3>
            <p className="text-gray-300 text-sm">
              1인당 하루 최대 4시간까지 예약 가능합니다
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl text-center">
            <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">팀 예약</h3>
            <p className="text-gray-300 text-sm">
              최대 4명까지 함께 예약할 수 있습니다
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-400 text-sm">
          공정한 선착순 대기열 시스템으로 운영됩니다
        </p>
      </div>
    </div>
  );
};

export default HomePage;

