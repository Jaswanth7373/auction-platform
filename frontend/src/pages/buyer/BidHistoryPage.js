import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdGavel } from 'react-icons/md';
import { FiExternalLink, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { AuctionTimer } from '../../components/auction/AuctionCard';
import { userAPI } from '../../services/api';

const BidHistoryPage = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    userAPI.getBids({ limit: 100 }).then(({ data }) => {
      setBids(data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = bids.filter(b => {
    if (filter === 'winning') return b.status === 'active' || b.isWinning;
    if (filter === 'outbid') return b.status === 'outbid';
    if (filter === 'won') return b.status === 'won';
    return true;
  });

  const statusIcon = (status) => {
    if (status === 'active' || status === 'won') return <FiTrendingUp className="text-green-400" />;
    if (status === 'outbid') return <FiTrendingDown className="text-red-400" />;
    return <FiMinus className="text-dark-500" />;
  };

  const statusColor = (status) => {
    if (status === 'won') return 'text-green-400 bg-green-500/10';
    if (status === 'outbid') return 'text-red-400 bg-red-500/10';
    if (status === 'active') return 'text-primary-400 bg-primary-500/10';
    return 'text-dark-400 bg-dark-700';
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="buyer" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-white">Bid History</h1>
              <p className="text-dark-400 text-sm mt-1">{bids.length} total bids placed</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {[['all', 'All Bids'], ['winning', 'Winning'], ['outbid', 'Outbid'], ['won', 'Won']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === val ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:text-white bg-dark-800/60'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="glass-dark rounded-2xl p-16 text-center">
              <MdGavel className="text-dark-700 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-400 mb-2">No bids found</h3>
              <Link to="/auctions" className="btn-primary mt-4 inline-block">Browse Auctions</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((bid) => (
                <motion.div key={bid._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-dark p-4 rounded-xl flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
                    {bid.auction?.images?.[0]?.url
                      ? <img src={bid.auction.images[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><MdGavel className="text-dark-600 text-2xl" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/auctions/${bid.auction?._id}`} className="font-semibold text-white hover:text-primary-400 transition-colors flex items-center gap-1.5 truncate">
                      {bid.auction?.title || 'Auction'} <FiExternalLink className="text-xs flex-shrink-0" />
                    </Link>
                    <p className="text-xs text-dark-500 mt-0.5">{new Date(bid.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {bid.auction?.status === 'active' && bid.auction?.endTime && (
                      <AuctionTimer endTime={bid.auction.endTime} size="sm" />
                    )}
                    <div className="text-right">
                      <p className="font-black text-white text-lg">${bid.amount?.toFixed(2)}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </div>
                    {statusIcon(bid.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BidHistoryPage;
