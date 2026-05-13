import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiEye, FiSearch } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusColor = (s) => {
  const map = {
    verified: 'text-green-400 bg-green-500/10 border-green-500/20',
    under_review: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    pending: 'text-dark-400 bg-dark-700 border-dark-600',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return map[s] || 'text-dark-400 bg-dark-700 border-dark-600';
};

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [verifyModal, setVerifyModal] = useState(null);
  const [notes, setNotes] = useState('');

  const fetchSellers = async () => {
    setLoading(true);
    try {
      // Reuse admin users endpoint filtered to sellers
      const params = { page, limit: 15, role: 'seller' };
      if (search) params.search = search;
      const { data } = await adminAPI.getUsers(params);
      // For demo, show users with role seller; in production query sellers collection
      setSellers(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load sellers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSellers(); }, [page, statusFilter]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchSellers(); };

  const handleVerify = async (status) => {
    if (!verifyModal) return;
    try {
      await adminAPI.verifySeller(verifyModal.sellerId || verifyModal._id, { status, notes });
      toast.success(`Seller ${status}!`);
      setVerifyModal(null);
      setNotes('');
      fetchSellers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <MdVerified className="text-primary-400" />Seller Management
          </h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-64">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sellers..." className="input-field pl-10 w-full" />
              </div>
              <button type="submit" className="btn-primary px-4 py-2.5">Search</button>
            </form>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-auto">
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="under_review">Under Review</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : (
            <>
              <div className="glass-dark rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      {['Seller', 'Email', 'Joined', 'Verification', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide last:text-right">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {sellers.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-dark-500">No sellers found</td></tr>
                    ) : sellers.map((seller) => (
                      <motion.tr key={seller._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-dark-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center overflow-hidden flex-shrink-0 text-white text-sm font-bold">
                              {seller.avatar ? <img src={seller.avatar} alt="" className="w-full h-full object-cover" /> : seller.name?.[0]?.toUpperCase()}
                            </div>
                            <p className="font-semibold text-white text-sm">{seller.name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-dark-400">{seller.email}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-dark-400">{new Date(seller.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColor('pending')}`}>
                            Registered
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setVerifyModal({ ...seller, sellerId: seller._id })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/20 rounded-lg text-xs font-semibold transition-all">
                              <FiEye className="text-xs" />Review
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Previous</button>
                  <span className="px-4 py-2 text-sm text-dark-400">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Verify Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-dark p-6 rounded-2xl w-full max-w-md border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-1">Review Seller</h2>
            <p className="text-dark-400 text-sm mb-4">{verifyModal.name} · {verifyModal.email}</p>
            <div className="mb-4">
              <label className="text-sm text-dark-400 mb-1.5 block">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or reason for decision..." rows={3}
                className="input-field resize-none" />
            </div>
            <div className="flex gap-3 mb-3">
              <button onClick={() => handleVerify('verified')}
                className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2">
                <FiCheckCircle />Verify Seller
              </button>
              <button onClick={() => handleVerify('rejected')}
                className="flex-1 btn-danger py-3 text-sm flex items-center justify-center gap-2">
                <FiXCircle />Reject
              </button>
            </div>
            <button onClick={() => { setVerifyModal(null); setNotes(''); }}
              className="btn-secondary w-full py-2.5 text-sm">Cancel</button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminSellersPage;
