import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Trash2, Settings, BarChart3 } from 'lucide-react';
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

const AdminPage = ({ user }) => {
  const [allBookings, setAllBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings?studentId=${user.studentId}`);
      const data = await response.json();
      setAllBookings(data);
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
        setAllBookings(allBookings.filter(booking => booking.id !== bookingId));
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

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(b => b.date === today);
    const totalUsers = new Set(allBookings.map(b => b.studentId)).size;
    const totalHours = allBookings.length;
    
    return {
      todayBookings: todayBookings.length,
      totalUsers,
      totalHours,
      totalBookings: allBookings.length
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">관리자 대시보드</h1>
          <p className="text-gray-300">스터디룸 예약 시스템 관리</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              개요
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-600">
              예약 관리
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="glass-card border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.todayBookings}</p>
                      <p className="text-sm text-gray-300">오늘 예약</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      <p className="text-sm text-gray-300">총 사용자</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalHours}</p>
                      <p className="text-sm text-gray-300">총 예약 시간</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
                      <p className="text-sm text-gray-300">총 예약 건수</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">최근 예약 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allBookings.slice(0, 5).map(booking => {
                    const status = getBookingStatus(booking);
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge className={`${status.color} text-white`}>
                            {status.label}
                          </Badge>
                          <div className="text-white">
                            <span className="font-medium">스터디룸 {booking.roomId}</span>
                            <span className="text-gray-300 ml-2">
                              {booking.date} {booking.startTime}-{booking.endTime}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-300 text-sm">
                          {booking.studentId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">전체 예약 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allBookings.map(booking => {
                    const status = getBookingStatus(booking);
                    
                    return (
                      <div key={booking.id} className="booking-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                            <div className="text-white">
                              <span className="font-medium">스터디룸 {booking.roomId}</span>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                강제 취소
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-card border-white/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  예약을 강제 취소하시겠습니까?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  {booking.studentId}의 스터디룸 {booking.roomId} 예약이 취소됩니다.
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
                                  강제 취소
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="text-gray-300">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(booking.date)}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-4 h-4" />
                              <span>{booking.startTime} - {booking.endTime}</span>
                            </div>
                          </div>
                          
                          <div className="text-gray-300">
                            <div>예약자: {booking.studentId}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Users className="w-4 h-4" />
                              <span>{booking.members.length + 1}명</span>
                            </div>
                          </div>
                          
                          <div className="text-gray-300">
                            <div>예약 시간:</div>
                            <div>{new Date(booking.createdAt).toLocaleString('ko-KR')}</div>
                          </div>
                        </div>
                        
                        {booking.members.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="text-white font-medium mb-1">팀원:</div>
                            <div className="text-sm text-gray-300">
                              {booking.members.map((member, index) => (
                                <span key={index}>
                                  {member.name} ({member.studentId})
                                  {index < booking.members.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>시스템 설정</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">설정 기능</h3>
                    <p className="text-gray-400">
                      향후 업데이트에서 예약 규칙, 시간 제한 등의 설정 기능이 추가될 예정입니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;

