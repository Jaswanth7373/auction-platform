import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiTrendingUp, FiShield, FiStar, FiUsers } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import Navbar from '../components/common/Navbar';
import AuctionCard, { AuctionCardSkeleton } from '../components/auction/AuctionCard';
import { auctionAPI, analyticsAPI } from '../services/api';

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'jewelry', label: 'Jewelry', icon: '💎' },
  { id: 'collectibles', label: 'Collectibles', icon: '🏆' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'vintage', label: 'Vintage', icon: '🕰️' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [stats, setStats] = useState({ totalAuctions: 0, activeAuctions: 0, totalBids: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, liveRes, statsRes] = await Promise.all([
          auctionAPI.getFeatured(),
          auctionAPI.getAll({ status: 'active', limit: 8, sort: '-bidCount' }),
          analyticsAPI.getStats().catch(() => ({ data: { data: {} } })),
        ]);
        setFeaturedAuctions(featuredRes.data.data || []);
        setLiveAuctions(liveRes.data.data || []);
        setStats(statsRes.data.data || {});
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/auctions?search=${encodeURIComponent(searchQuery)}`);
  };

  const statsDisplay = [
    { label: 'Live Auctions', value: stats.activeAuctions?.toLocaleString() || '0', icon: FiZap, color: 'text-green-400' },
    { label: 'Total Bids', value: stats.totalBids?.toLocaleString() || '0', icon: MdGavel, color: 'text-primary-400' },
    { label: 'Total Volume', value: `$${(stats.totalVolume || 0).toLocaleString()}`, icon: FiTrendingUp, color: 'text-amber-400' },
    { label: 'Happy Buyers', value: '10,000+', icon: FiUsers, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {stats.activeAuctions || 0} auctions live right now
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              Bid. Win.{' '}
              <span className="text-gradient">Celebrate.</span>
            </h1>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              The premium real-time auction platform where exclusive items meet passionate collectors.
              Every second counts. Every bid matters.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mb-8">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search auctions, categories, items..."
                className="flex-1 input-field text-base" />
              <button type="submit" className="btn-primary px-8 flex-shrink-0">Search</button>
            </form>

            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/auctions" className="btn-primary text-base py-3.5 px-8 flex items-center gap-2">
                Browse Auctions <FiArrowRight />
              </Link>
              <Link to="/register?role=seller" className="btn-secondary text-base py-3.5 px-8">
                Become a Seller
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statsDisplay.map(({ label, value, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <Icon className={`text-2xl ${color} mx-auto mb-2`} />
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-dark-400 text-sm">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-8">Browse <span className="text-gradient">Categories</span></h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/auctions?category=${cat.id}`}
                  className="glass-card p-4 text-center hover:border-primary-500/40 group flex flex-col items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-dark-300 group-hover:text-white transition-colors">{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="py-16 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-semibold uppercase tracking-wide">Live Now</span>
              </div>
              <h2 className="text-3xl font-black text-white">Active <span className="text-gradient">Auctions</span></h2>
            </div>
            <Link to="/auctions?status=active" className="btn-outline text-sm py-2 px-4 flex items-center gap-2">
              View All <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {loading ? Array(8).fill(0).map((_, i) => <AuctionCardSkeleton key={i} />) :
              liveAuctions.length > 0 ? liveAuctions.map((auction) => <AuctionCard key={auction._id} auction={auction} />) :
              <div className="col-span-full text-center py-16 text-dark-400">No active auctions right now. Check back soon!</div>
            }
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Why Choose <span className="text-gradient">AuctionPro?</span></h2>
            <p className="text-dark-400 text-lg">Built for serious buyers and sellers who demand the best.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FiZap, title: 'Real-Time Bidding', desc: 'Lightning-fast Socket.IO bidding with instant updates. Never miss a beat.', color: 'from-primary-500 to-blue-500' },
              { icon: FiShield, title: 'Secure & Trusted', desc: 'Bank-grade security, Stripe payments, and verified sellers for your peace of mind.', color: 'from-green-500 to-emerald-500' },
              { icon: FiStar, title: 'Premium Items', desc: 'Curated selection of exclusive items from verified sellers worldwide.', color: 'from-amber-500 to-orange-500' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-8 text-center group">
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-dark-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark-900/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-5xl font-black text-white mb-4">Ready to start bidding?</h2>
            <p className="text-dark-400 text-xl mb-8">Join thousands of buyers winning amazing deals every day.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg py-4 px-10">Create Free Account</Link>
              <Link to="/auctions" className="btn-secondary text-lg py-4 px-10">Browse Auctions</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-dark-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MdGavel className="text-primary-500 text-xl" />
            <span className="font-black text-gradient text-lg">AuctionPro</span>
          </div>
          <p>© {new Date().getFullYear()} AuctionPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
