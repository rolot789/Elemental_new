import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const API_BASE_URL = 'http://localhost:3001';

const MyBookingsPage = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/my-bookings?studentId=${user.studentId}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      setError('예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: user.studentId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setBookings(bookings.filter(booking => booking.id !== bookingId));
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getBookingStatus = (booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.date + ' ' + booking.startTime);
    const endDate = new Date(booking.date + ' ' + booking.endTime);
    
    if (now > endDate) {
      return { status: 'completed', label: '완료', color: 'bg-gray-500' };
    } else if (now >= bookingDate) {
      return { status: 'ongoing', label: '진행중', color: 'bg-green-500' };
    } else {
      return { status: 'upcoming', label: '예정', color: 'bg-blue-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">내 예약</h1>
          <p className="text-gray-300">예약한 스터디룸 목록을 확인하고 관리하세요</p>
        </div>

        {error && (
          <Alert className="bg-red-500/20 border-red-500/50 mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {bookings.length === 0 ? (
          <Card className="glass-card border-white/20">
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">예약이 없습니다</h3>
              <p className="text-gray-400 mb-6">아직 예약한 스터디룸이 없습니다.</p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="floating-button text-white"
              >
                예약하러 가기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const status = getBookingStatus(booking);
              
              return (
                <Card key={booking.id} className="booking-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">
                        스터디룸 {booking.roomId}
                      </CardTitle>
                      <Badge className={`${status.color} text-white`}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Users className="w-4 h-4" />
                          <span>{booking.members.length + 1}명</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {booking.members.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-1">팀원</h4>
                            <div className="space-y-1">
                              {booking.members.map((member, index) => (
                                <div key={index} className="text-sm text-gray-300">
                                  {member.name} ({member.studentId})
                                  {member.department && ` - ${member.department}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400">
                          예약 시간: {new Date(booking.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                    
                    {status.status === 'upcoming' && (
                      <div className="mt-4 flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              취소
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-card border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                예약을 취소하시겠습니까?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                스터디룸 {booking.roomId} ({booking.date} {booking.startTime}-{booking.endTime}) 예약이 취소됩니다.
                                이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                                취소
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleCancelBooking(booking.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                확인
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;

