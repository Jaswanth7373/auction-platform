import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { AuctionTimer } from '../../components/auction/AuctionCard';
import { userAPI, auctionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const WatchlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getWatchlist().then(({ data }) => {
      setItems(data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (auctionId) => {
    try {
      await auctionAPI.removeFromWatchlist(auctionId);
      setItems(prev => prev.filter(i => i.auction?._id !== auctionId));
      toast.success('Removed from watchlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="buyer" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <FiHeart className="text-red-400" />Watchlist
            </h1>
            <p className="text-dark-400 text-sm mt-1">{items.length} items saved</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="glass-dark rounded-2xl p-16 text-center">
              <FiHeart className="text-dark-700 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-400 mb-2">Your watchlist is empty</h3>
              <p className="text-dark-500 text-sm mb-6">Save auctions to track them easily</p>
              <Link to="/auctions" className="btn-primary">Browse Auctions</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <motion.div key={item._id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass-card overflow-hidden group">
                  <div className="relative h-40 bg-dark-800">
                    {item.auction?.images?.[0]?.url
                      ? <img src={item.auction.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><MdGavel className="text-dark-600 text-4xl" /></div>}
                    <button onClick={() => handleRemove(item.auction?._id)}
                      className="absolute top-3 right-3 p-2 bg-dark-900/80 text-red-400 rounded-xl hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100">
                      <FiTrash2 className="text-sm" />
                    </button>
                    {item.auction?.status === 'active' && (
                      <div className="absolute bottom-3 left-3 bg-dark-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <AuctionTimer endTime={item.auction.endTime} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Link to={`/auctions/${item.auction?._id}`} className="font-semibold text-white hover:text-primary-400 text-sm line-clamp-2 transition-colors">
                      {item.auction?.title}
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-black text-gradient">${item.auction?.currentBid?.toFixed(2)}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${item.auction?.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-dark-400 bg-dark-700'}`}>
                        {item.auction?.status}
                      </span>
                    </div>
                    <Link to={`/auctions/${item.auction?._id}`} className="btn-outline text-xs py-2 w-full text-center mt-3 block">
                      {item.auction?.status === 'active' ? 'Bid Now' : 'View Auction'}
                    </Link>
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

export default WatchlistPage;
