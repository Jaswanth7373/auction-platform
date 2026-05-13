// pages/auth/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { MdGavel } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      toast.success('Welcome back!');
      const role = data.user?.role;
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'seller' ? '/seller/dashboard' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.data?.requiresVerification) {
        toast.error('Please verify your email first');
        navigate('/verify-otp', { state: { userId: err.response.data.userId, email: form.email } });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="glass-dark p-8 rounded-3xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center">
                <MdGavel className="text-white text-xl" />
              </div>
              <span className="text-xl font-black text-gradient">AuctionPro</span>
            </Link>
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="text-dark-400 text-sm mt-1">Sign in to continue bidding</p>
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 btn-secondary py-3 mb-6 hover:border-dark-500">
            <FcGoogle className="text-xl" />Sign in with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-dark-700" />
            <span className="text-dark-500 text-xs">or email</span>
            <div className="flex-1 h-px bg-dark-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-dark-400 mb-1.5 block">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required placeholder="your@email.com" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-dark-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300">Forgot password?</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required placeholder="Enter password" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
