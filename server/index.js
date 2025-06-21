const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// In-Memory 데이터베이스
const data = {
  users: new Map(), // 학번 -> 사용자 정보
  rooms: [
    { id: 1, name: '스터디룸 1', capacity: 4 },
    { id: 2, name: '스터디룸 2', capacity: 4 },
    { id: 3, name: '스터디룸 3', capacity: 4 },
    { id: 4, name: '스터디룸 4', capacity: 4 },
    { id: 5, name: '스터디룸 5', capacity: 4 },
    { id: 6, name: '스터디룸 6', capacity: 4 }
  ],
  bookings: new Map(), // 예약 ID -> 예약 정보
  queue: [], // 대기열
  nextBookingId: 1
};

// 유틸리티 함수
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

// API 엔드포인트

// 로그인
app.post('/api/login', (req, res) => {
  const { studentId } = req.body;
  
  if (!studentId || studentId.length !== 10) {
    return res.status(400).json({ error: '올바른 10자리 학번을 입력해주세요.' });
  }
  
  // 관리자 로그인 체크
  if (studentId === '관리자1234') {
    return res.json({ 
      success: true, 
      user: { studentId, isAdmin: true, name: '관리자' }
    });
  }
  
  // 일반 사용자 로그인
  if (!data.users.has(studentId)) {
    data.users.set(studentId, {
      studentId,
      name: `학생${studentId.slice(-4)}`,
      isAdmin: false,
      totalBookingHours: 0
    });
  }
  
  const user = data.users.get(studentId);
  res.json({ success: true, user });
});

// 스터디룸 목록 조회
app.get('/api/rooms', (req, res) => {
  res.json(data.rooms);
});

// 예약 현황 조회
app.get('/api/bookings', (req, res) => {
  const date = req.query.date || getTodayString();
  const todayBookings = Array.from(data.bookings.values())
    .filter(booking => booking.date === date);
  
  res.json(todayBookings);
});

// 신규 예약 생성
app.post('/api/bookings', (req, res) => {
  const { studentId, roomId, date, startTime, endTime, members } = req.body;
  
  // 유효성 검사
  if (!studentId || !roomId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }
  
  // 당일 예약만 허용
  if (date !== getTodayString()) {
    return res.status(400).json({ error: '당일 예약만 가능합니다.' });
  }
  
  // 시간 중복 체크
  const existingBooking = Array.from(data.bookings.values())
    .find(booking => 
      booking.roomId === roomId && 
      booking.date === date && 
      booking.startTime === startTime
    );
  
  if (existingBooking) {
    return res.status(400).json({ error: '해당 시간은 이미 예약되어 있습니다.' });
  }
  
  // 사용자 일일 예약 시간 체크 (최대 4시간)
  const userTodayBookings = Array.from(data.bookings.values())
    .filter(booking => booking.studentId === studentId && booking.date === date);
  
  const totalHours = userTodayBookings.length + 1; // 현재 예약 포함
  if (totalHours > 4) {
    return res.status(400).json({ error: '하루 최대 4시간까지만 예약 가능합니다.' });
  }
  
  // 예약 생성
  const bookingId = data.nextBookingId++;
  const booking = {
    id: bookingId,
    studentId,
    roomId,
    date,
    startTime,
    endTime,
    members: members || [],
    createdAt: new Date().toISOString()
  };
  
  data.bookings.set(bookingId, booking);
  
  // 실시간 업데이트 전송
  io.emit('newBooking', booking);
  
  res.json({ success: true, booking });
});

// 예약 취소
app.delete('/api/bookings/:id', (req, res) => {
  const bookingId = parseInt(req.params.id);
  const { studentId } = req.body;
  
  const booking = data.bookings.get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
  }
  
  // 본인 예약이거나 관리자인지 확인
  const user = data.users.get(studentId);
  if (booking.studentId !== studentId && !user?.isAdmin) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }
  
  data.bookings.delete(bookingId);
  
  // 실시간 업데이트 전송
  io.emit('cancelBooking', { bookingId });
  
  res.json({ success: true });
});

// 내 예약 조회
app.get('/api/my-bookings', (req, res) => {
  const { studentId } = req.query;
  
  if (!studentId) {
    return res.status(400).json({ error: '학번이 필요합니다.' });
  }
  
  const myBookings = Array.from(data.bookings.values())
    .filter(booking => booking.studentId === studentId)
    .sort((a, b) => new Date(a.date + ' ' + a.startTime) - new Date(b.date + ' ' + b.startTime));
  
  res.json(myBookings);
});

// 관리자 전용 API
app.get('/api/admin/bookings', (req, res) => {
  const { studentId } = req.query;
  
  const user = data.users.get(studentId);
  if (!user?.isAdmin) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  
  const allBookings = Array.from(data.bookings.values());
  res.json(allBookings);
});

// Socket.IO 대기열 시스템
io.on('connection', (socket) => {
  console.log('사용자 연결:', socket.id);
  
  // 대기열 진입
  socket.on('enterQueue', (userData) => {
    const queueItem = {
      socketId: socket.id,
      studentId: userData.studentId,
      joinTime: new Date().toISOString()
    };
    
    data.queue.push(queueItem);
    
    // 대기열 업데이트 전송
    io.emit('queueUpdate', {
      queueLength: data.queue.length,
      position: data.queue.findIndex(item => item.socketId === socket.id) + 1
    });
    
    // 첫 번째 사용자라면 즉시 예약 페이지로
    if (data.queue.length === 1) {
      setTimeout(() => {
        socket.emit('yourTurn');
        data.queue.shift(); // 대기열에서 제거
        io.emit('queueUpdate', {
          queueLength: data.queue.length
        });
      }, 1000);
    }
  });
  
  // 예약 완료 또는 시간 초과 시 다음 사용자 처리
  socket.on('bookingComplete', () => {
    // 다음 사용자에게 차례 알림
    if (data.queue.length > 0) {
      const nextUser = data.queue.shift();
      io.to(nextUser.socketId).emit('yourTurn');
      
      io.emit('queueUpdate', {
        queueLength: data.queue.length
      });
    }
  });
  
  // 연결 해제 시 대기열에서 제거
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
    const queueIndex = data.queue.findIndex(item => item.socketId === socket.id);
    if (queueIndex !== -1) {
      data.queue.splice(queueIndex, 1);
      io.emit('queueUpdate', {
        queueLength: data.queue.length
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

