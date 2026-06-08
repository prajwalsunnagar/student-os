import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, GraduationCap } from 'lucide-react';
import { API_BASE_URL } from '../config';
function Auth({ login, addToast }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!isLoginTab && !formData.name.trim()) {
      addToast('Name is required', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      addToast('Email is required', 'error');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      addToast('Please enter a valid email address', 'error');
      return false;
    }
    if (!formData.password) {
      addToast('Password is required', 'error');
      return false;
    }
    if (formData.password.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const endpoint = isLoginTab ? `${API_BASE_URL}/users/login` : `${API_BASE_URL}/users/register`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (isLoginTab) {
        // Success login
        login(data.accessToken, data.refreshToken, data.user);
      } else {
        // Success register
        addToast('Registration successful! Logging you in...', 'success');

        const loginResponse = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
          login(loginData.accessToken, loginData.refreshToken, loginData.user);
        } else {
          setIsLoginTab(true);
          addToast('Please log in with your credentials.', 'info');
        }
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={32} />
          </div>
          <h1 className="auth-title">StudentOS</h1>
          <p className="auth-subtitle">Manage your studies, tasks, and notes efficiently</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => setIsLoginTab(true)}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => setIsLoginTab(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="input-container">
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <User className="input-icon" size={18} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-container">
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-container">
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            ) : isLoginTab ? (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
