import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmailOtp.css';
import logoImage from '../../../assets/mentorlink-logo.png';
import { userAPI } from '../../../services/api';
import { FiMail, FiRefreshCw, FiCheck, FiAlertCircle } from 'react-icons/fi';

const EmailOtp = () => {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(300);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const verifyCode = localStorage.getItem('verifyCode');

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value && element.nextSibling) element.nextSibling.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    pastedData.split('').forEach((char, idx) => { if (idx < 6) newOtp[idx] = char; });
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleContinue = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit OTP' });
      return;
    }

    const email = localStorage.getItem('signupEmail');
    const role = localStorage.getItem('signupRole');

    if (!email || !role) {
      setMessage({ type: 'error', text: 'Session expired. Please sign up again.' });
      setTimeout(() => navigate('/signup'), 2000);
      return;
    }

    try {
      setMessage({ type: 'loading', text: 'Verifying OTP...' });
      const res = await userAPI.verifyOTP({ email, otp: code });
      if (res?.token) localStorage.setItem('token', res.token);
      const userId = res?.user?.id;
      if (userId) localStorage.setItem('userId', userId);

      setMessage({ type: 'success', text: 'Verification successful!' });
      setTimeout(() => {
        if (role === 'student') navigate('/student-form', { state: { userId } });
        else if (role === 'mentor') navigate('/mentor-form', { state: { userId } });
        else if (role === 'organizer') navigate('/event-organizer', { state: { userId } });
        else navigate('/home');
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Invalid or expired OTP' });
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setMessage({ type: 'loading', text: 'Resending OTP...' });
    try {
      const email = localStorage.getItem('signupEmail');
      if (!email) {
        setMessage({ type: 'error', text: 'Session expired. Please sign up again.' });
        setTimeout(() => navigate('/signup'), 2000);
        return;
      }
      await userAPI.resendOTP({ email });
      setTimer(300);
      setOtp(new Array(6).fill(''));
      setMessage({ type: 'success', text: 'OTP resent! Check your email.' });
      inputRefs.current[0]?.focus();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to resend OTP. Please try again.' });
    } finally {
      setIsResending(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div className="otp-page">
      <div className="otp-bg-decoration">
        <div className="otp-circle otp-circle-1"></div>
        <div className="otp-circle otp-circle-2"></div>
        <div className="otp-circle otp-circle-3"></div>
      </div>

      <div className="otp-container">
        <div className="otp-logo-container">
          <img src={logoImage} alt="MentorLink" className="otp-logo" />
          <span className="otp-logo-text">MentorLink</span>
        </div>

        <div className="otp-header">
          <h1 className="otp-title">Verify Your Email</h1>
          <p className="otp-subtitle">We've sent a 6-digit verification code to</p>
          <p className="otp-email">{localStorage.getItem('signupEmail')}</p>
        </div>

        {verifyCode && (
          <div style={{
            background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 12,
            padding: '16px 24px', margin: '12px 0', textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px', color: '#065f46', fontWeight: 600, fontSize: 14 }}>
              Your Verification Code
            </p>
            <div style={{
              fontSize: 32, letterSpacing: 10, fontWeight: 800,
              color: '#047857', fontFamily: 'monospace'
            }}>
              {verifyCode}
            </div>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
              Copy and enter this code below
            </p>
          </div>
        )}

        <div className="otp-form">
          <label className="otp-label">Enter Verification Code</label>

          <div className="otp-input-group">
            {otp.map((data, index) => (
              <input
                key={index}
                className={`otp-input ${data ? 'otp-input-filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={data}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onFocus={e => e.target.select()}
                onPaste={index === 0 ? handlePaste : undefined}
                ref={el => (inputRefs.current[index] = el)}
                autoComplete="off"
              />
            ))}
          </div>

          {message.text && (
            <div className={`otp-message otp-message-${message.type}`}>
              {message.type === 'error' && <FiAlertCircle />}
              {message.type === 'success' && <FiCheck />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="otp-resend-section">
            <p className="otp-resend-text">
              Didn't receive the code?{' '}
              <button
                className={`otp-resend-button ${timer > 0 ? 'otp-resend-disabled' : ''}`}
                onClick={handleResend}
                disabled={timer > 0 || isResending}
              >
                {isResending ? (
                  <><FiRefreshCw className="otp-spin" /> Resending...</>
                ) : (
                  <><FiRefreshCw /> Resend OTP</>
                )}
              </button>
            </p>
            {timer > 0 && (
              <div className="otp-timer-container">
                <div className="otp-timer-bar" style={{ width: `${(timer / 300) * 100}%` }}></div>
              </div>
            )}
            {timer > 0 && (
              <p className="otp-timer-text">
                Resend available in <span className="otp-timer-highlight">{formatTime(timer)}</span>
              </p>
            )}
          </div>

          <button
            className={`otp-continue-btn ${isOtpComplete ? 'otp-continue-active' : ''}`}
            onClick={handleContinue}
            disabled={!isOtpComplete}
          >
            {message.type === 'loading' ? (
              <><div className="otp-spinner"></div>Verifying...</>
            ) : (
              <>Verify & Continue <span className="otp-arrow">→</span></>
            )}
          </button>
        </div>

        <div className="otp-footer">
          <p>Need help? <a href="/contact" className="otp-footer-link">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
};

export default EmailOtp;
