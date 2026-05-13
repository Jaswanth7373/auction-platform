// pages/auth/VerifyOTPPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdGavel } from 'react-icons/md';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const VerifyOTPPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { userId, email } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!userId) { navigate('/register'); return; }
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [userId, navigate]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (newOtp.every(Boolean)) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleVerify = async (code) => {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ userId, otp: code || otp.join('') });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Email verified! Welcome to AuctionPro!');
      navigate(data.user.role === 'seller' ? '/seller/dashboard' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOTP({ userId });
      toast.success('New OTP sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-dark p-8 rounded-3xl text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center">
              <MdGavel className="text-white text-xl" />
            </div>
            <span className="text-xl font-black text-gradient">AuctionPro</span>
          </Link>
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-2xl font-black text-white mb-2">Verify your email</h1>
          <p className="text-dark-400 text-sm mb-2">We sent a 6-digit code to</p>
          <p className="text-primary-400 font-semibold mb-8">{email}</p>

          <div className="flex gap-3 justify-center mb-6">
            {otp.map((digit, i) => (
              <input key={i} ref={(el) => (inputRefs.current[i] = el)} type="text" inputMode="numeric"
                value={digit} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-black bg-dark-800 border-2 border-dark-600 text-white rounded-xl focus:outline-none focus:border-primary-500 transition-all" />
            ))}
          </div>

          <button onClick={() => handleVerify()} disabled={loading || otp.some(d => !d)}
            className="btn-primary w-full py-3.5 mb-4">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Verify Email'}
          </button>

          <div className="text-sm text-dark-400">
            Didn't receive it? {countdown > 0 ? (
              <span className="text-dark-500">Resend in {countdown}s</span>
            ) : (
              <button onClick={handleResend} disabled={resending} className="text-primary-400 hover:text-primary-300 font-semibold">
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTPPage;
