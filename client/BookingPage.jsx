import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Calendar, Clock, Users, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'https://elemental-backend-lcs5.onrender.com';

const BookingPage = ({ socket, user }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', studentId: '', department: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('newBooking', (booking) => {
      setBookings(prev => [...prev, booking]);
    });

    socket.on('cancelBooking', ({ bookingId }) => {
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    });

    return () => {
      socket.off('newBooking');
      socket.off('cancelBooking');
    };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings?date=${today}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const isTimeSlotBooked = (roomId, time) => {
    return bookings.some(booking => 
      booking.roomId === roomId && 
      booking.date === today && 
      booking.startTime === time
    );
  };

  const handleTimeSlotClick = (time) => {
    if (isTimeSlotBooked(selectedRoom, time)) return;
    setSelectedTime(selectedTime === time ? '' : time);
  };

  const addMember = () => {
    if (members.length >= 3) return; // 본인 포함 최대 4명
    if (!newMember.name || !newMember.studentId) return;
    
    setMembers([...members, { ...newMember }]);
    setNewMember({ name: '', studentId: '', department: '' });
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleBooking = async () => {
    if (!selectedTime) {
      setError('시간을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user.studentId,
          roomId: selectedRoom,
          date: today,
          startTime: selectedTime,
          endTime: getEndTime(selectedTime),
          members: members
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('예약이 완료되었습니다!');
        socket?.emit('bookingComplete');
        
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('예약 중 오류가 발생했습니다.');
    }
    
    setIsLoading(false);
  };

  const getEndTime = (startTime) => {
    const [hour] = startTime.split(':');
    return `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-white/20">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">예약 완료!</h2>
            <p className="text-gray-300">{success}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">스터디룸 예약</h1>
          <div className="flex items-center space-x-4 text-gray-300">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{today}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>3분 내에 예약을 완료해주세요</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 스터디룸 선택 */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white">스터디룸 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {rooms.map(room => (
                    <Button
                      key={room.id}
                      variant={selectedRoom === room.id ? "default" : "outline"}
                      onClick={() => setSelectedRoom(room.id)}
                      className={selectedRoom === room.id 
                        ? "floating-button text-white" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                    >
                      {room.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 시간 선택 */}
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">시간 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {timeSlots.map(time => {
                    const isBooked = isTimeSlotBooked(selectedRoom, time);
                    const isSelected = selectedTime === time;
                    
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSlotClick(time)}
                        disabled={isBooked}
                        className={`time-slot p-3 rounded-lg text-sm font-medium ${
                          isBooked 
                            ? 'booked' 
                            : isSelected 
                              ? 'selected' 
                              : 'available'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500"></div>
                    <span className="text-gray-300">예약 가능</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-white/5 border border-white/10"></div>
                    <span className="text-gray-300">예약됨</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <span className="text-gray-300">선택됨</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 예약 정보 */}
          <div>
            <Card className="glass-card border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white">예약 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTime && (
                  <div className="space-y-2">
                    <Badge className="bg-blue-600 text-white">
                      스터디룸 {selectedRoom}
                    </Badge>
                    <div className="text-white">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{selectedTime} - {getEndTime(selectedTime)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-white font-medium mb-2">팀원 추가 (선택사항)</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="이름"
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Input
                      placeholder="학번"
                      value={newMember.studentId}
                      onChange={(e) => setNewMember({...newMember, studentId: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Input
                      placeholder="학과 (선택)"
                      value={newMember.department}
                      onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={addMember}
                      disabled={members.length >= 3 || !newMember.name || !newMember.studentId}
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      팀원 추가
                    </Button>
                  </div>
                </div>

                {members.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">팀원 목록</h4>
                    <div className="space-y-2">
                      {members.map((member, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                          <div className="text-sm text-white">
                            <div>{member.name}</div>
                            <div className="text-gray-400">{member.studentId}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeMember(index)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>총 {members.length + 1}명 (본인 포함)</span>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert className="bg-red-500/20 border-red-500/50 mb-4">
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleBooking}
              disabled={!selectedTime || isLoading}
              className="w-full floating-button text-white font-semibold py-3"
            >
              {isLoading ? '예약 중...' : '예약하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

