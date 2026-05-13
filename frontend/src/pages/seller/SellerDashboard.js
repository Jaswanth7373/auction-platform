import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiTrendingUp, FiDollarSign, FiShoppingBag, FiStar, FiArrowRight, FiUsers } from 'react-icons/fi';
import { MdGavel, MdVerified } from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { sellerAPI } from '../../services/api';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="glass-card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="text-white text-lg" />
      </div>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="text-dark-400 text-sm mt-0.5">{label}</p>
    {sub && <p className="text-xs text-dark-500 mt-1">{sub}</p>}
  </div>
);

const SellerDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerAPI.getDashboard().then(({ data }) => setDashData(data.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const seller = dashData?.seller;
  const stats = dashData?.stats || {};

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
      <Sidebar type="seller" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-black text-white">Seller Dashboard</h1>
                {seller?.verificationBadge && <MdVerified className="text-blue-400 text-2xl" />}
              </div>
              <p className="text-dark-400">{seller?.businessName}</p>
            </div>
            <Link to="/seller/auctions/create" className="btn-primary flex items-center gap-2">
              <FiPlus />New Auction
            </Link>
          </div>

          {/* Verification banner */}
          {seller && seller.verificationStatus !== 'verified' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-300">Complete Verification</p>
                <p className="text-amber-400/70 text-sm">Verify your account to create auctions and receive payments.</p>
              </div>
              <Link to="/seller/profile" className="btn-gold text-sm py-2 px-4 flex-shrink-0">Verify Now</Link>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FiShoppingBag} label="Total Auctions" value={stats.totalAuctions || 0} color="from-primary-500 to-blue-600" />
                <StatCard icon={MdGavel} label="Active Now" value={stats.activeAuctions || 0} color="from-green-500 to-emerald-600" />
                <StatCard icon={FiDollarSign} label="Total Revenue" value={`$${(stats.totalRevenue || 0).toFixed(0)}`} color="from-amber-500 to-orange-500" />
                <StatCard icon={FiStar} label="Rating" value={`${(stats.rating || 0).toFixed(1)} ⭐`} sub={`${stats.reviewCount || 0} reviews`} color="from-purple-500 to-pink-500" />
              </div>

              {/* Revenue Chart */}
              {dashData?.revenueByMonth?.length > 0 && (
                <div className="glass-dark p-6 rounded-2xl">
                  <h2 className="font-bold text-white mb-4 flex items-center gap-2"><FiTrendingUp className="text-primary-400" />Revenue Over Time</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dashData.revenueByMonth}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Active Auctions */}
                <div className="glass-dark p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white">Active Auctions</h2>
                    <Link to="/seller/auctions" className="text-xs text-primary-400 flex items-center gap-1">View all <FiArrowRight /></Link>
                  </div>
                  {!dashData?.activeAuctions?.length ? (
                    <div className="text-center py-8">
                      <p className="text-dark-500 text-sm mb-3">No active auctions</p>
                      <Link to="/seller/auctions/create" className="btn-primary text-sm py-2 px-4">Create Auction</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dashData.activeAuctions.map((a) => (
                        <Link key={a._id} to={`/auctions/${a._id}`}
                          className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                            {a.images?.[0]?.url ? <img src={a.images[0].url} alt="" className="w-full h-full object-cover" /> : <MdGavel className="text-dark-600 text-xl m-2.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{a.title}</p>
                            <p className="text-xs text-dark-500">{a.bidCount} bids · ${a.currentBid?.toFixed(2)}</p>
                          </div>
                          <span className="text-xs text-green-400 flex-shrink-0">Live</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Bids */}
                <div className="glass-dark p-5 rounded-2xl">
                  <h2 className="font-bold text-white mb-4">Recent Bids</h2>
                  {!dashData?.recentBids?.length ? (
                    <p className="text-center text-dark-500 text-sm py-8">No recent bids</p>
                  ) : (
                    <div className="space-y-2">
                      {dashData.recentBids.slice(0, 5).map((bid) => (
                        <div key={bid._id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {bid.bidder?.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{bid.bidder?.name}</p>
                            <p className="text-xs text-dark-500 truncate">{bid.auction?.title}</p>
                          </div>
                          <span className="text-sm font-black text-primary-400 flex-shrink-0">${bid.amount}</span>
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

export default SellerDashboard;
