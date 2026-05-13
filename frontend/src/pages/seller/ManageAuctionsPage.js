import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiEye, FiTrash2, FiPlus, FiFilter } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { AuctionTimer } from '../../components/auction/AuctionCard';
import { sellerAPI, auctionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusColor = (s) => {
  const map = { active: 'text-green-400 bg-green-500/10', scheduled: 'text-amber-400 bg-amber-500/10', ended: 'text-dark-400 bg-dark-700', sold: 'text-blue-400 bg-blue-500/10', cancelled: 'text-red-400 bg-red-500/10', draft: 'text-dark-500 bg-dark-800' };
  return map[s] || 'text-dark-400 bg-dark-700';
};

const ManageAuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await sellerAPI.getMyAuctions(params);
      setAuctions(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load auctions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAuctions(); }, [statusFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this auction?')) return;
    try {
      await auctionAPI.delete(id);
      toast.success('Auction cancelled');
      fetchAuctions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="seller" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-white">My Auctions</h1>
            <Link to="/seller/auctions/create" className="btn-primary flex items-center gap-2"><FiPlus />New Auction</Link>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[['', 'All'], ['active', 'Active'], ['scheduled', 'Scheduled'], ['ended', 'Ended'], ['sold', 'Sold'], ['draft', 'Draft']].map(([val, label]) => (
              <button key={val} onClick={() => { setStatusFilter(val); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === val ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:text-white bg-dark-800/60'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : auctions.length === 0 ? (
            <div className="glass-dark rounded-2xl p-16 text-center">
              <MdGavel className="text-dark-700 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-400 mb-2">No auctions found</h3>
              <Link to="/seller/auctions/create" className="btn-primary mt-4 inline-flex items-center gap-2"><FiPlus />Create First Auction</Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {auctions.map((auction) => (
                  <motion.div key={auction._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-dark p-4 rounded-xl flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
                      {auction.images?.[0]?.url
                        ? <img src={auction.images[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><MdGavel className="text-dark-600 text-xl" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{auction.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(auction.status)}`}>{auction.status}</span>
                        <span className="text-xs text-dark-500">{auction.bidCount} bids</span>
                        <span className="text-xs text-primary-400 font-semibold">${auction.currentBid?.toFixed(2)}</span>
                      </div>
                    </div>
                    {auction.status === 'active' && auction.endTime && (
                      <div className="hidden sm:block flex-shrink-0">
                        <AuctionTimer endTime={auction.endTime} size="sm" />
                      </div>
                    )}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link to={`/auctions/${auction._id}`}
                        className="p-2 text-dark-400 hover:text-white bg-dark-800 rounded-xl transition-colors" title="View"><FiEye /></Link>
                      {['draft', 'scheduled'].includes(auction.status) && (
                        <Link to={`/seller/auctions/edit/${auction._id}`}
                          className="p-2 text-dark-400 hover:text-primary-400 bg-dark-800 rounded-xl transition-colors" title="Edit"><FiEdit /></Link>
                      )}
                      {!['sold', 'cancelled'].includes(auction.status) && (
                        <button onClick={() => handleDelete(auction._id)}
                          className="p-2 text-dark-400 hover:text-red-400 bg-dark-800 rounded-xl transition-colors" title="Cancel"><FiTrash2 /></button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Prev</button>
                  <span className="px-4 py-2 text-sm text-dark-400">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ManageAuctionsPage;
