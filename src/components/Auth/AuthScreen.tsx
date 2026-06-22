// src/components/Auth/AuthScreen.tsx
import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthScreen.css';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

export function AuthScreen({ initialMode = 'login', onBack }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Reset error
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      // AuthContext will handle navigation via currentUser state
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // User-friendly error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Failed to ' + (isLogin ? 'log in' : 'sign up') + '. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack} disabled={loading}>
            <ArrowLeft size={16} /> Back to home
          </button>
        )}
        <div className="auth-brand">
          <img src="/logo.svg" alt="" className="auth-logo" width={72} height={72} />
          <h1>Little Food Forests</h1>
          <p>Design your regenerative food forest</p>
        </div>

        <div className="auth-card">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Log in to continue your food forest journey' 
              : 'Start designing your food forest today'}
          </p>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <Mail size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="auth-input-group">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {!isLogin && (
              <div className="auth-input-group">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button 
              type="button"
              onClick={switchMode}
              className="auth-switch-btn"
              disabled={loading}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        <p className="auth-footer">
          Free forever • No credit card required • Your data is private
        </p>
      </div>
    </div>
  );
}