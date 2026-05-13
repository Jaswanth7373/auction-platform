import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiDollarSign, FiActivity, FiTrendingUp } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(({ data: res }) => setData(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};

  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <motion.div whileHover={{ y: -2 }} className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="text-white text-lg" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-dark-400 text-sm">{label}</p>
      {sub && <p className="text-xs text-dark-500 mt-0.5">{sub}</p>}
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-dark p-3 rounded-xl border border-dark-700 text-sm">
        <p className="text-dark-400">{label}</p>
        <p className="text-primary-400 font-bold">${payload[0]?.value?.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl font-black text-white">Admin <span className="text-gradient">Dashboard</span></h1>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={FiUsers} label="Total Users" value={(stats.totalUsers || 0).toLocaleString()} color="from-primary-500 to-blue-600" />
                <StatCard icon={FiShoppingBag} label="Sellers" value={(stats.totalSellers || 0).toLocaleString()} color="from-purple-500 to-pink-500" />
                <StatCard icon={MdGavel} label="Total Auctions" value={(stats.totalAuctions || 0).toLocaleString()} sub={`${stats.activeAuctions || 0} active`} color="from-amber-500 to-orange-500" />
                <StatCard icon={FiActivity} label="Active Now" value={stats.activeAuctions || 0} color="from-green-500 to-emerald-600" />
                <StatCard icon={FiDollarSign} label="Platform Revenue" value={`$${(stats.platformRevenue || 0).toFixed(0)}`} color="from-teal-500 to-cyan-500" />
                <StatCard icon={FiTrendingUp} label="Paid Transactions" value={stats.completedPayments || 0} color="from-rose-500 to-red-500" />
              </div>

              {/* Revenue chart */}
              {data?.revenueData?.length > 0 && (
                <div className="glass-dark p-6 rounded-2xl">
                  <h2 className="font-bold text-white mb-4">Platform Revenue (Last 12 Months)</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.revenueData}>
                      <defs>
                        <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="_id" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#adminRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="glass-dark p-5 rounded-2xl">
                  <h2 className="font-bold text-white mb-4">Recent Users</h2>
                  <div className="space-y-2">
                    {(data?.recentUsers || []).map(u => (
                      <div key={u._id} className="flex items-center gap-3 p-2.5 bg-dark-800/50 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                          {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{u.name}</p>
                          <p className="text-xs text-dark-500 truncate">{u.email}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 capitalize flex-shrink-0">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Verifications */}
                <div className="glass-dark p-5 rounded-2xl">
                  <h2 className="font-bold text-white mb-4">Pending Seller Verifications</h2>
                  {!data?.pendingSellers?.length ? (
                    <p className="text-center text-dark-500 text-sm py-8">No pending verifications</p>
                  ) : (
                    <div className="space-y-2">
                      {data.pendingSellers.map(s => (
                        <div key={s._id} className="flex items-center gap-3 p-2.5 bg-dark-800/50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{s.businessName}</p>
                            <p className="text-xs text-dark-500 truncate">{s.user?.email}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Under Review</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
