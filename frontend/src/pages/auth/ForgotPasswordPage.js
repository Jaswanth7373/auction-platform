// pages/auth/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-dark p-8 rounded-3xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center">
                <MdGavel className="text-white text-xl" />
              </div>
              <span className="text-xl font-black text-gradient">AuctionPro</span>
            </Link>
            {sent ? (
              <>
                <div className="text-5xl mb-4">📬</div>
                <h1 className="text-2xl font-black text-white">Check your email</h1>
                <p className="text-dark-400 text-sm mt-2">We sent a password reset link to <span className="text-primary-400">{email}</span></p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-black text-white">Forgot password?</h1>
                <p className="text-dark-400 text-sm mt-1">Enter your email to receive a reset link</p>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="your@email.com" className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors mt-6">
            <FiArrowLeft />Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
