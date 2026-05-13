import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiTrendingUp, FiHeart, FiDollarSign, FiArrowRight, FiAward } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { AuctionTimer } from '../../components/auction/AuctionCard';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to || '#'}>
    <motion.div whileHover={{ y: -2 }} className="glass-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-white text-xl" />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-dark-400 text-sm">{label}</p>
      </div>
    </motion.div>
  </Link>
);

const UserDashboard = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [wins, setWins] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bidsRes, winsRes, wlRes] = await Promise.all([
          userAPI.getBids({ limit: 5 }),
          userAPI.getWins(),
          userAPI.getWatchlist(),
        ]);
        setBids(bidsRes.data.data || []);
        setWins(winsRes.data.data || []);
        setWatchlist(wlRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeBids = bids.filter(b => b.auction?.status === 'active');
  const pendingPayments = wins.filter(w => !w.payment && w.status === 'sold');

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="buyer" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-black text-white">
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-dark-400 mt-1">Here's what's happening with your auctions.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FiClock} label="Active Bids" value={activeBids.length} color="from-primary-500 to-blue-600" to="/dashboard/bids" />
            <StatCard icon={FiAward} label="Auctions Won" value={user?.totalWins || wins.length} color="from-amber-500 to-orange-500" to="/dashboard/wins" />
            <StatCard icon={FiHeart} label="Watchlist" value={watchlist.length} color="from-red-500 to-pink-500" to="/dashboard/watchlist" />
            <StatCard icon={FiDollarSign} label="Total Spent" value={`$${(user?.totalSpent || 0).toFixed(0)}`} color="from-green-500 to-emerald-600" to="/dashboard/wins" />
          </div>

          {/* Pending Payments Alert */}
          {pendingPayments.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <FiDollarSign className="text-amber-400 text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-amber-300">Payment Required</p>
                  <p className="text-amber-400/70 text-sm">You have {pendingPayments.length} auction(s) awaiting payment</p>
                </div>
              </div>
              <Link to="/dashboard/wins" className="btn-gold py-2 px-4 text-sm flex-shrink-0">Pay Now</Link>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Active Bids */}
            <div className="glass-dark rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2"><MdGavel className="text-primary-400" />Active Bids</h2>
                <Link to="/dashboard/bids" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <FiArrowRight /></Link>
              </div>
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
              ) : activeBids.length === 0 ? (
                <div className="text-center py-8">
                  <MdGavel className="text-dark-700 text-4xl mx-auto mb-2" />
                  <p className="text-dark-500 text-sm">No active bids</p>
                  <Link to="/auctions" className="text-primary-400 text-xs hover:underline">Browse auctions →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBids.slice(0, 4).map((bid) => (
                    <Link key={bid._id} to={`/auctions/${bid.auction?._id}`}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                          {bid.auction?.images?.[0]?.url
                            ? <img src={bid.auction.images[0].url} alt="" className="w-full h-full object-cover" />
                            : <MdGavel className="text-dark-500 text-xl m-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{bid.auction?.title}</p>
                          <p className="text-xs text-dark-500">Your bid: <span className="text-primary-400">${bid.amount}</span></p>
                        </div>
                      </div>
                      {bid.auction?.endTime && (
                        <div className="flex-shrink-0 ml-2">
                          <AuctionTimer endTime={bid.auction.endTime} size="sm" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Watchlist Preview */}
            <div className="glass-dark rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2"><FiHeart className="text-red-400" />Watchlist</h2>
                <Link to="/dashboard/watchlist" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <FiArrowRight /></Link>
              </div>
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
              ) : watchlist.length === 0 ? (
                <div className="text-center py-8">
                  <FiHeart className="text-dark-700 text-4xl mx-auto mb-2" />
                  <p className="text-dark-500 text-sm">No items in watchlist</p>
                  <Link to="/auctions" className="text-primary-400 text-xs hover:underline">Discover auctions →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlist.slice(0, 4).map((item) => (
                    <Link key={item._id} to={`/auctions/${item.auction?._id}`}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
                          {item.auction?.images?.[0]?.url
                            ? <img src={item.auction.images[0].url} alt="" className="w-full h-full object-cover" />
                            : <MdGavel className="text-dark-500 text-xl m-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.auction?.title}</p>
                          <p className="text-xs text-green-400 font-semibold">${item.auction?.currentBid?.toFixed(2)}</p>
                        </div>
                      </div>
                      {item.auction?.status === 'active' && item.auction?.endTime && (
                        <AuctionTimer endTime={item.auction.endTime} size="sm" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
