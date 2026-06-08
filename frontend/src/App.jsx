import React, { useState, useEffect, useCallback } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { API_BASE_URL } from './config';
function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('student_os_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to add transient toast notifications
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Login handler
  const login = useCallback((accessToken, refreshToken, userData) => {
    const fullUserData = { ...userData, accessToken, refreshToken };
    localStorage.setItem('student_os_user', JSON.stringify(fullUserData));
    setUser(fullUserData);
    addToast('Welcome back, ' + userData.name + '!', 'success');
  }, [addToast]);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('student_os_user');
    setUser(null);
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  // Unified fetch helper that automatically adds Authorization header and handles token refreshing
  const apiFetch = useCallback(async (url, options = {}) => {
  let currentUser = user;

  if (!currentUser) {
    const savedUser = localStorage.getItem('student_os_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (currentUser?.accessToken) {
    headers['Authorization'] = `Bearer ${currentUser.accessToken}`;
  }

  let response = await fetch(
    `${API_BASE_URL}${url}`,
    { ...options, headers }
  );

  // Handle token expired (401)
  if (response.status === 401 && currentUser?.refreshToken) {
    try {
      const refreshResponse = await fetch(
        `${API_BASE_URL}/users/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refreshToken: currentUser.refreshToken
          })
        }
      );

      if (refreshResponse.ok) {
        const refreshData =
          await refreshResponse.json();

        const updatedUser = {
          ...currentUser,
          accessToken:
            refreshData.accessToken
        };

        localStorage.setItem(
          'student_os_user',
          JSON.stringify(updatedUser)
        );

        setUser(updatedUser);

        headers['Authorization'] =
          `Bearer ${refreshData.accessToken}`;

        response = await fetch(
          `${API_BASE_URL}${url}`,
          { ...options, headers }
        );
      } else {
        logout();
        addToast(
          'Session expired. Please log in again.',
          'error'
        );
      }
    } catch (err) {
      logout();

      addToast(
        'Network error during session refresh.',
        'error'
      );
    }
  }

  return response;
},[user, logout, addToast]);

  return (
    <>
      {/* Background Ambient Glows */}
      <div className="ambient-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      {/* Global Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <span>✓</span>}
            {t.type === 'error' && <span>✕</span>}
            {t.type === 'info' && <span>🛈</span>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="app-container">
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading StudentOS...</p>
          </div>
        ) : !user ? (
          <Auth login={login} addToast={addToast} />
        ) : (
          <Dashboard 
            user={user} 
            logout={logout} 
            apiFetch={apiFetch} 
            addToast={addToast} 
          />
        )}
      </div>
    </>
  );
}

export default App;
