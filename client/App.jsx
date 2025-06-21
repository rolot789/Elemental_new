import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';

// 컴포넌트 import
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import QueuePage from './components/QueuePage';
import BookingPage from './components/BookingPage';
import MyBookingsPage from './components/MyBookingsPage';
import AdminPage from './components/AdminPage';
import Header from './components/Header';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem('elemental_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // 사용자가 로그인했을 때 Socket.IO 연결
    if (user && !socket) {
      const newSocket = io(API_BASE_URL);
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, socket]);

  const login = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('elemental_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: '서버 연결에 실패했습니다.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('elemental_user');
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  if (isLoading) {
    return (
      <div className="elemental-bg flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="dark">
      <Router>
        <div className="elemental-bg">
          {user && <Header user={user} onLogout={logout} />}
          
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/" /> : <LoginPage onLogin={login} />
              } 
            />
            <Route 
              path="/" 
              element={
                user ? <HomePage user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/queue" 
              element={
                user ? <QueuePage socket={socket} user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/booking" 
              element={
                user ? <BookingPage socket={socket} user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/my-bookings" 
              element={
                user ? <MyBookingsPage user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/admin" 
              element={
                user?.isAdmin ? <AdminPage user={user} /> : <Navigate to="/" />
              } 
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;

