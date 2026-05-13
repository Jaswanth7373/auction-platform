// pages/auth/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: searchParams.get('role') === 'seller' ? 'seller' : 'user' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const data = await register(form);
      toast.success('Account created! Check your email for the OTP.');
      navigate('/verify-otp', { state: { userId: data.userId, email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="glass-dark p-8 rounded-3xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center">
                <MdGavel className="text-white text-xl" />
              </div>
              <span className="text-xl font-black text-gradient">AuctionPro</span>
            </Link>
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="text-dark-400 text-sm mt-1">Start bidding on amazing items today</p>
          </div>

          {/* Role selector */}
          <div className="flex gap-2 mb-6 p-1 bg-dark-800/60 rounded-xl">
            {['user', 'seller'].map((role) => (
              <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all ${form.role === role ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'}`}>
                {role === 'user' ? '🛒 Buyer' : '🏪 Seller'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-dark-400 mb-1.5 block">Full Name</label>
              <div className="relative"><FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1.5 block">Email</label>
              <div className="relative"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="your@email.com" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1.5 block">Password</label>
              <div className="relative"><FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Min 8 characters" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">{showPw ? <FiEyeOff /> : <FiEye />}</button>
              </div>
            </div>

            <p className="text-xs text-dark-500">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
