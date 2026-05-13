import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiHeart, FiEye, FiZap, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { MdVerified, MdGavel } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { auctionAPI } from '../../services/api';
import toast from 'react-hot-toast';

// =================== COUNTDOWN TIMER ===================
export const AuctionTimer = ({ endTime, size = 'md', onEnd }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - Date.now();
      setTimeLeft(Math.max(0, diff));
      if (diff <= 0 && onEnd) onEnd();
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime, onEnd]);

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / 1000 / 60 / 60) % 24);
  const days = Math.floor(timeLeft / 1000 / 60 / 60 / 24);

  const isUrgent = timeLeft < 60 * 60 * 1000; // < 1 hour
  const isEnded = timeLeft === 0;

  if (size === 'sm') {
    return (
      <span className={`text-xs font-mono font-bold ${isEnded ? 'text-dark-500' : isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
        {isEnded ? 'Ended' : days > 0 ? `${days}d ${hours}h` : `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {days > 0 && (
        <div className="timer-unit">
          <span className="timer-value">{String(days).padStart(2,'0')}</span>
          <span className="timer-label">days</span>
        </div>
      )}
      {[
        { val: hours, label: 'hrs' },
        { val: minutes, label: 'min' },
        { val: seconds, label: 'sec' },
      ].map(({ val, label }) => (
        <React.Fragment key={label}>
          <div className={`timer-unit ${isUrgent ? 'border-red-500/40 bg-red-900/20' : ''}`}>
            <span className={`timer-value ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {String(val).padStart(2,'0')}
            </span>
            <span className="timer-label">{label}</span>
          </div>
          {label !== 'sec' && <span className="text-dark-500 font-bold text-xl">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// =================== AUCTION CARD ===================
const AuctionCard = ({ auction, onWatchlistChange }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [currentBid, setCurrentBid] = useState(auction.currentBid);

  const primaryImage = auction.images?.find(i => i.isPrimary)?.url || auction.images?.[0]?.url;
  const isActive = auction.status === 'active';
  const isEnded = ['ended', 'sold', 'cancelled'].includes(auction.status);

  const handleWatchlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isWatchlisted) {
        await auctionAPI.removeFromWatchlist(auction._id);
        setIsWatchlisted(false);
        toast.success('Removed from watchlist');
      } else {
        await auctionAPI.addToWatchlist(auction._id);
        setIsWatchlisted(true);
        toast.success('Added to watchlist');
      }
      onWatchlistChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating watchlist');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group cursor-pointer">
      <Link to={`/auctions/${auction._id}`}>
        {/* Image */}
        <div className="relative h-48 bg-dark-800 overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage} alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MdGavel className="text-dark-600 text-5xl" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {isActive && (
              <span className="badge-live">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />LIVE
              </span>
            )}
            {isEnded && <span className="text-[10px] font-bold px-2 py-1 bg-dark-800/90 text-dark-400 rounded-full">Ended</span>}
            {auction.status === 'scheduled' && <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">Upcoming</span>}
          </div>

          {/* Watchlist */}
          <button onClick={handleWatchlist}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-sm transition-all ${isWatchlisted ? 'bg-red-500/30 text-red-400' : 'bg-dark-900/50 text-dark-300 hover:text-red-400'}`}>
            <FiHeart className={`text-base ${isWatchlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Timer on image */}
          {isActive && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-dark-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <FiClock className="text-amber-400 text-xs" />
              <AuctionTimer endTime={auction.endTime} size="sm" />
            </div>
          )}

          {/* View count */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-dark-300 bg-dark-900/70 px-2 py-1 rounded-lg">
            <FiEye className="text-xs" />{auction.viewCount || 0}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category & Seller */}
          <div className="flex items-center justify-between mb-2">
            <span className="badge-category">{auction.category}</span>
            {auction.seller?.verificationBadge && (
              <span className="badge-verified text-[10px]"><MdVerified />Verified</span>
            )}
          </div>

          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-3 group-hover:text-primary-300 transition-colors">
            {auction.title}
          </h3>

          {/* Bid info */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-dark-500 uppercase tracking-wide mb-0.5">Current Bid</p>
              <p className="text-xl font-black text-gradient">${(currentBid || auction.currentBid).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-dark-400 text-xs mb-0.5 justify-end">
                <FiUsers className="text-xs" />
                <span>{auction.bidCount} bids</span>
              </div>
              {auction.buyNowPrice && (
                <p className="text-[10px] text-amber-400">Buy Now: ${auction.buyNowPrice}</p>
              )}
            </div>
          </div>

          {/* Seller */}
          {auction.seller?.businessName && (
            <p className="text-xs text-dark-500 mt-2 truncate">by {auction.seller.businessName}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

// =================== BID PANEL ===================
export const BidPanel = ({ auction, onBidPlaced }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutoBid, setIsAutoBid] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState('');

  const minBid = (auction.currentBid || 0) + (auction.minimumBidIncrement || 1);
  const isActive = auction.status === 'active' && new Date(auction.endTime) > new Date();
  const isOwner = user && auction.seller?.user?._id === user._id;

  const quickBids = [
    minBid,
    minBid + auction.minimumBidIncrement * 4,
    minBid + auction.minimumBidIncrement * 9,
  ];

  const handleBid = async (amount) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const amt = parseFloat(amount || bidAmount);
    if (!amt || amt < minBid) {
      toast.error(`Minimum bid is $${minBid.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await auctionAPI.placeBid(auction._id, {
        amount: amt,
        isAutoBid,
        maxAutoBid: maxAutoBid ? parseFloat(maxAutoBid) : undefined,
      });
      toast.success(`Bid of $${amt.toFixed(2)} placed!`);
      setBidAmount('');
      onBidPlaced?.({ amount: amt });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="glass-dark p-6 rounded-2xl text-center">
        <MdGavel className="text-dark-600 text-4xl mx-auto mb-2" />
        <p className="text-dark-400 font-medium">{auction.status === 'ended' ? 'Auction Ended' : auction.status === 'sold' ? 'Item Sold' : 'Auction Not Active'}</p>
        {auction.winner && <p className="text-sm text-dark-500 mt-1">Winner bid: ${auction.winningBid?.toFixed(2)}</p>}
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="glass-dark p-6 rounded-2xl text-center">
        <p className="text-dark-400">You cannot bid on your own auction.</p>
      </div>
    );
  }

  return (
    <div className="glass-dark p-6 rounded-2xl space-y-4">
      <div>
        <p className="text-xs text-dark-500 mb-1">Minimum bid</p>
        <p className="text-2xl font-black text-gradient">${minBid.toFixed(2)}</p>
      </div>

      {/* Quick bid buttons */}
      <div>
        <p className="text-xs text-dark-500 mb-2">Quick Bid</p>
        <div className="grid grid-cols-3 gap-2">
          {quickBids.map((amt) => (
            <button key={amt} onClick={() => handleBid(amt)} disabled={loading}
              className="btn-secondary py-2 text-sm font-semibold hover:border-primary-500 hover:text-primary-400 transition-all">
              ${amt.toFixed(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom bid */}
      <div className="space-y-2">
        <p className="text-xs text-dark-500">Custom Amount</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-bold">$</span>
            <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
              placeholder={minBid.toFixed(2)} min={minBid} step="0.01"
              className="input-field pl-8" onKeyDown={(e) => e.key === 'Enter' && handleBid()} />
          </div>
          <button onClick={() => handleBid()} disabled={loading || !bidAmount}
            className="btn-primary px-4 py-3 flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><MdGavel /><span>Bid</span></>}
          </button>
        </div>
      </div>

      {/* Auto-bid toggle */}
      <div className="border-t border-dark-700 pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setIsAutoBid(!isAutoBid)}
            className={`relative w-10 h-5 rounded-full transition-colors ${isAutoBid ? 'bg-primary-500' : 'bg-dark-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAutoBid ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-dark-300">Auto-bid (bid automatically up to max)</span>
        </label>
        {isAutoBid && (
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-bold">$</span>
            <input type="number" value={maxAutoBid} onChange={(e) => setMaxAutoBid(e.target.value)}
              placeholder="Maximum auto-bid amount" className="input-field pl-8" />
          </div>
        )}
      </div>

      {/* Buy Now */}
      {auction.buyNowPrice && (
        <button onClick={() => handleBid(auction.buyNowPrice)} disabled={loading}
          className="btn-gold w-full flex items-center justify-center gap-2">
          <FiZap />Buy Now for ${auction.buyNowPrice.toFixed(2)}
        </button>
      )}

      {!isAuthenticated && (
        <p className="text-center text-sm text-dark-400">
          <button onClick={() => navigate('/login')} className="text-primary-400 hover:underline">Log in</button> to place a bid
        </p>
      )}
    </div>
  );
};

// =================== SKELETON ===================
export const AuctionCardSkeleton = () => (
  <div className="glass-card overflow-hidden">
    <div className="skeleton h-48 rounded-none" />
    <div className="p-4 space-y-3">
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-5 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="flex justify-between">
        <div className="skeleton h-7 w-24" />
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  </div>
);

export default AuctionCard;
