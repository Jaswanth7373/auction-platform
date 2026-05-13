import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiHeart, FiShare2, FiChevronLeft, FiChevronRight, FiZap, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';
import { MdVerified, MdGavel } from 'react-icons/md';
import Navbar from '../components/common/Navbar';
import { AuctionTimer, BidPanel } from '../components/auction/AuctionCard';
import { auctionAPI } from '../services/api';
import { getSocket, joinAuctionRoom, leaveAuctionRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [recommendation, setRecommendation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('bids'); // bids | details | seller
  const bidListRef = useRef(null);

  const fetchAuction = useCallback(async () => {
    try {
      const { data } = await auctionAPI.getOne(id);
      setAuction(data.data);
      setBids(data.recentBids || []);
      setIsWatchlisted(data.isWatchlisted || false);
    } catch {
      toast.error('Auction not found');
      navigate('/auctions');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchRecommendation = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await auctionAPI.getRecommendation(id);
      setRecommendation(data.data);
    } catch { /* ignore */ }
  }, [id, isAuthenticated]);

  useEffect(() => {
    fetchAuction();
    fetchRecommendation();

    const socket = getSocket();
    if (socket) {
      joinAuctionRoom(id);

      socket.on('bid_update', (data) => {
        if (data.auctionId !== id) return;
        setAuction((prev) => prev ? {
          ...prev,
          currentBid: data.currentBid,
          bidCount: data.bidCount,
          currentBidder: data.currentBidder,
          endTime: data.endTime,
        } : prev);
        setBids((prev) => [data.bid, ...prev.slice(0, 19)]);
        if (bidListRef.current) bidListRef.current.classList.add('bid-flash');
        setTimeout(() => bidListRef.current?.classList.remove('bid-flash'), 500);
        if (data.timeExtended) toast('⏰ Auction extended by 5 minutes!', { icon: '⏰' });
      });

      socket.on('auction_update', (data) => {
        setAuction((prev) => prev ? { ...prev, ...data } : prev);
        if (data.status === 'sold') toast.success('Auction has ended!');
      });

      socket.on('viewer_count', ({ auctionId, count }) => {
        if (auctionId === id) setViewerCount(count);
      });
    }

    return () => {
      leaveAuctionRoom(id);
      const s = getSocket();
      if (s) { s.off('bid_update'); s.off('auction_update'); s.off('viewer_count'); }
    };
  }, [id, fetchAuction, fetchRecommendation]);

  const handleWatchlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isWatchlisted) {
        await auctionAPI.removeFromWatchlist(id);
        setIsWatchlisted(false);
        toast.success('Removed from watchlist');
      } else {
        await auctionAPI.addToWatchlist(id);
        setIsWatchlisted(true);
        toast.success('Added to watchlist');
      }
    } catch (err) {
      if (err.response?.status === 400) {
        await auctionAPI.removeFromWatchlist(id);
        setIsWatchlisted(false);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) return null;

  const images = auction.images || [];
  const isActive = auction.status === 'active' && new Date(auction.endTime) > new Date();

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <Link to="/auctions" className="hover:text-primary-400 transition-colors">Auctions</Link>
          <span>/</span>
          <span className="capitalize text-dark-300">{auction.category}</span>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{auction.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image Gallery */}
            <div className="relative">
              <div className="relative h-80 sm:h-96 lg:h-[480px] bg-dark-800 rounded-2xl overflow-hidden">
                {images.length > 0 ? (
                  <motion.img key={activeImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    src={images[activeImage]?.url} alt={auction.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MdGavel className="text-dark-600 text-8xl" />
                  </div>
                )}

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-dark-900/80 text-white rounded-xl hover:bg-dark-800 transition-all">
                      <FiChevronLeft className="text-xl" />
                    </button>
                    <button onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-dark-900/80 text-white rounded-xl hover:bg-dark-800 transition-all">
                      <FiChevronRight className="text-xl" />
                    </button>
                  </>
                )}

                {/* Status badge */}
                <div className="absolute top-4 left-4">
                  {isActive ? (
                    <span className="badge-live"><span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />LIVE</span>
                  ) : (
                    <span className="bg-dark-800/90 text-dark-400 text-xs font-bold px-3 py-1 rounded-full capitalize">{auction.status}</span>
                  )}
                </div>

                {/* Viewer count */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-dark-900/80 px-3 py-1.5 rounded-lg text-xs text-dark-300">
                  <FiEye className="text-xs" />{viewerCount || auction.viewCount || 0} watching
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-primary-500' : 'border-dark-700 opacity-60'}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Actions */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{auction.title}</h1>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={handleWatchlist}
                    className={`p-2.5 rounded-xl border transition-all ${isWatchlisted ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'border-dark-700 text-dark-400 hover:text-red-400 hover:border-red-500/30'}`}>
                    <FiHeart className={isWatchlisted ? 'fill-current' : ''} />
                  </button>
                  <button onClick={handleShare} className="p-2.5 rounded-xl border border-dark-700 text-dark-400 hover:text-white transition-all">
                    <FiShare2 />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="badge-category">{auction.category}</span>
                <span className="text-xs text-dark-500 capitalize bg-dark-800 px-3 py-1 rounded-full">{auction.condition}</span>
                {auction.location?.city && <span className="text-xs text-dark-500">📍 {auction.location.city}, {auction.location.country}</span>}
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div className="flex gap-1 mb-4 bg-dark-800/60 p-1 rounded-xl">
                {[['bids', 'Bid History'], ['details', 'Details'], ['seller', 'Seller']].map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'bids' && (
                <div ref={bidListRef} className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {bids.length === 0 ? (
                    <div className="text-center py-8 text-dark-400 text-sm">No bids yet. Be the first!</div>
                  ) : bids.map((bid, i) => (
                    <motion.div key={bid._id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-800/50'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {bid.bidder?.avatar ? <img src={bid.bidder.avatar} alt="" className="w-full h-full object-cover" /> : bid.bidder?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{bid.bidder?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-dark-500">{new Date(bid.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${i === 0 ? 'text-primary-400 text-base' : 'text-dark-300'}`}>${bid.amount?.toFixed(2)}</p>
                        {i === 0 && <span className="text-[10px] text-green-400">Highest</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="glass-dark p-4 rounded-xl">
                    <h3 className="font-semibold text-white mb-2">Description</h3>
                    <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-line">{auction.description}</p>
                  </div>
                  {auction.specifications?.length > 0 && (
                    <div className="glass-dark p-4 rounded-xl">
                      <h3 className="font-semibold text-white mb-3">Specifications</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {auction.specifications.map(({ key, value }) => (
                          <div key={key} className="bg-dark-800/60 rounded-lg p-2">
                            <p className="text-xs text-dark-500">{key}</p>
                            <p className="text-sm text-dark-200 font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {auction.shippingOptions?.length > 0 && (
                    <div className="glass-dark p-4 rounded-xl">
                      <h3 className="font-semibold text-white mb-3">Shipping Options</h3>
                      {auction.shippingOptions.map((opt, i) => (
                        <div key={i} className="flex justify-between text-sm py-1.5 border-b border-dark-700 last:border-0">
                          <span className="text-dark-300">{opt.name} ({opt.estimatedDays} days)</span>
                          <span className="text-white font-medium">{opt.price === 0 ? 'Free' : `$${opt.price}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'seller' && auction.seller && (
                <div className="glass-dark p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center overflow-hidden">
                      {auction.seller.logo ? <img src={auction.seller.logo} alt="" className="w-full h-full object-cover" /> : <MdGavel className="text-white text-xl" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{auction.seller.businessName}</p>
                        {auction.seller.verificationBadge && <MdVerified className="text-blue-400 text-lg" />}
                      </div>
                      <p className="text-xs text-dark-400">⭐ {auction.seller.rating || 0} · {auction.seller.reviewCount || 0} reviews</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/sellers/${auction.seller._id}`} className="btn-secondary text-sm py-2 flex-1 text-center">View Profile</Link>
                    {isAuthenticated && (
                      <button onClick={() => setShowChat(true)} className="btn-outline text-sm py-2 flex-1 flex items-center justify-center gap-2">
                        <FiMessageCircle />Message
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Bid Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current bid */}
            <div className="glass-dark p-5 rounded-2xl">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wide mb-1">Current Bid</p>
                  <motion.p key={auction.currentBid} initial={{ scale: 1.1, color: '#6366f1' }} animate={{ scale: 1, color: '#ffffff' }}
                    className="text-4xl font-black text-white">${(auction.currentBid || 0).toFixed(2)}</motion.p>
                </div>
                <div className="text-right">
                  <p className="text-dark-400 text-sm">{auction.bidCount} bids</p>
                  {auction.watchCount > 0 && <p className="text-dark-500 text-xs">{auction.watchCount} watching</p>}
                </div>
              </div>

              {/* Timer */}
              {isActive && (
                <div>
                  <p className="text-xs text-dark-500 mb-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    Time Remaining
                  </p>
                  <AuctionTimer endTime={auction.endTime} />
                </div>
              )}
            </div>

            {/* Bid Panel */}
            <BidPanel auction={auction} onBidPlaced={(bid) => {
              setAuction((prev) => prev ? { ...prev, currentBid: bid.amount, bidCount: (prev.bidCount || 0) + 1 } : prev);
            }} />

            {/* AI Recommendation */}
            {recommendation && isActive && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-dark p-5 rounded-2xl border border-primary-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FiZap className="text-primary-400" />
                  <p className="font-semibold text-white text-sm">AI Bid Recommendation</p>
                  <span className="ml-auto text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{recommendation.confidence}% confident</span>
                </div>
                <p className="text-2xl font-black text-gradient mb-2">${recommendation.recommendedBid?.toFixed(2)}</p>
                <p className="text-xs text-dark-400 mb-3">{recommendation.reasoning}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(recommendation.marketInsights || {}).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="bg-dark-800/60 rounded-lg p-2">
                      <p className="text-dark-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-dark-200 font-medium">{val}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
