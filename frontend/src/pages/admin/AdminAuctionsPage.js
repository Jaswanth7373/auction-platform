import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiEye, FiStopCircle, FiFilter } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { AuctionTimer } from '../../components/auction/AuctionCard';
import { adminAPI, auctionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusColor = (s) => {
  const map = {
    active: 'text-green-400 bg-green-500/10 border-green-500/20',
    scheduled: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    ended: 'text-dark-400 bg-dark-700 border-dark-600',
    sold: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
    draft: 'text-dark-500 bg-dark-800 border-dark-700',
  };
  return map[s] || 'text-dark-400 bg-dark-700 border-dark-600';
};

const AdminAuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const CATEGORIES = ['electronics','fashion','art','collectibles','jewelry','vehicles','sports','books','gaming','vintage','other'];

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const { data } = await adminAPI.getAuctions(params);
      setAuctions(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load auctions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAuctions(); }, [page, statusFilter, categoryFilter]);

  const handleEndAuction = async (id) => {
    if (!window.confirm('Force-end this auction now?')) return;
    try {
      await auctionAPI.end(id);
      toast.success('Auction ended');
      fetchAuctions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end auction');
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <MdGavel className="text-primary-400" />Auction Management
          </h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-auto">
              <option value="">All Status</option>
              {['active','scheduled','ended','sold','cancelled','draft'].map(s => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="input-field w-auto">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : (
            <>
              <div className="glass-dark rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        {['Auction', 'Category', 'Current Bid', 'Bids', 'Status', 'Time Left', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide first:pl-5 last:pr-5 last:text-right">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                      {auctions.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-dark-500">No auctions found</td></tr>
                      ) : auctions.map((auction) => (
                        <motion.tr key={auction._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="hover:bg-dark-800/30 transition-colors">
                          <td className="px-4 py-4 pl-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                                {auction.images?.[0]?.url
                                  ? <img src={auction.images[0].url} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><MdGavel className="text-dark-600 text-lg" /></div>}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <p className="font-medium text-white text-sm truncate">{auction.title}</p>
                                <p className="text-xs text-dark-500 truncate">{auction.seller?.businessName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="badge-category text-[10px]">{auction.category}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-white text-sm">${auction.currentBid?.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-dark-300">{auction.bidCount}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColor(auction.status)}`}>
                              {auction.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {auction.status === 'active' && auction.endTime ? (
                              <AuctionTimer endTime={auction.endTime} size="sm" />
                            ) : (
                              <span className="text-xs text-dark-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 pr-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/auctions/${auction._id}`}
                                className="p-2 text-dark-400 hover:text-white bg-dark-800 rounded-xl transition-colors" title="View">
                                <FiEye className="text-sm" />
                              </Link>
                              {auction.status === 'active' && (
                                <button onClick={() => handleEndAuction(auction._id)}
                                  className="p-2 text-red-400 hover:bg-red-500/10 bg-dark-800 rounded-xl transition-colors" title="Force End">
                                  <FiStopCircle className="text-sm" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Previous</button>
                  <span className="px-4 py-2 text-sm text-dark-400">{page} / {pagination.pages} ({pagination.total} total)</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminAuctionsPage;
