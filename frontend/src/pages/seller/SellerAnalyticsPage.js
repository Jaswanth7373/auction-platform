import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiBarChart2, FiDollarSign } from 'react-icons/fi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { analyticsAPI } from '../../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-dark p-3 rounded-xl border border-dark-700 text-sm">
      <p className="text-dark-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-bold">${p.value?.toFixed(2)}</p>)}
    </div>
  );
};

const SellerAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getSeller().then(({ data: res }) => setData(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="seller" /><div className="flex-1 flex flex-col"><Navbar />
        <main className="flex-1 p-8 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</main>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="seller" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><FiBarChart2 className="text-primary-400" />Analytics</h1>

          {/* Revenue chart */}
          <div className="glass-dark p-6 rounded-2xl">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><FiTrendingUp className="text-primary-400" />Daily Revenue (Last 30 Days)</h2>
            {data?.revenueData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.revenueData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-dark-500 py-12">No revenue data yet</p>}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top auctions */}
            <div className="glass-dark p-6 rounded-2xl">
              <h2 className="font-bold text-white mb-4">Top Performing Auctions</h2>
              {data?.topAuctions?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.topAuctions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="title" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(0, 12) + '...'} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="currentBid" fill="#6366f1" radius={[4, 4, 0, 0]} name="Bid" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-dark-500 py-12">No auction data yet</p>}
            </div>

            {/* Category breakdown */}
            <div className="glass-dark p-6 rounded-2xl">
              <h2 className="font-bold text-white mb-4">Category Breakdown</h2>
              {data?.categoryBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.categoryBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-dark-500 py-12">No category data yet</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
