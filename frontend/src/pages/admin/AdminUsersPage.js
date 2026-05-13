import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiShield, FiSlash, FiUser, FiMail } from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminAPI.getUsers(params);
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

  const handleBanToggle = async () => {
    if (!banModal) return;
    try {
      await adminAPI.banUser(banModal._id, { reason: banReason, ban: !banModal.isBanned });
      toast.success(`User ${banModal.isBanned ? 'unbanned' : 'banned'} successfully`);
      setBanModal(null);
      setBanReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const roleColor = (role) => {
    const map = { admin: 'text-red-400 bg-red-500/10', seller: 'text-amber-400 bg-amber-500/10', user: 'text-primary-400 bg-primary-500/10' };
    return map[role] || 'text-dark-400 bg-dark-700';
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <FiUser className="text-primary-400" />User Management
          </h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-64">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..." className="input-field pl-10 w-full" />
              </div>
              <button type="submit" className="btn-primary px-4 py-2.5">Search</button>
            </form>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input-field w-auto">
              <option value="">All Roles</option>
              <option value="user">Buyer</option>
              <option value="seller">Seller</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : (
            <>
              <div className="glass-dark rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide">User</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide hidden sm:table-cell">Role</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide hidden md:table-cell">Joined</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide">Status</th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-dark-400 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                      {users.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-dark-500">No users found</td></tr>
                      ) : users.map((user) => (
                        <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="hover:bg-dark-800/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center overflow-hidden flex-shrink-0 text-white text-sm font-bold">
                                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.name?.[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                                <p className="text-xs text-dark-500 flex items-center gap-1 truncate"><FiMail className="text-xs" />{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleColor(user.role)}`}>{user.role}</span>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <span className="text-sm text-dark-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="px-5 py-4">
                            {user.isBanned ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-red-400 bg-red-500/10">Banned</span>
                            ) : user.isVerified ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-green-400 bg-green-500/10">Active</span>
                            ) : (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-dark-400 bg-dark-700">Unverified</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => setBanModal(user)}
                              className={`p-2 rounded-xl transition-all text-sm ${user.isBanned ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                              title={user.isBanned ? 'Unban user' : 'Ban user'}>
                              {user.isBanned ? <FiShield /> : <FiSlash />}
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Previous</button>
                  <span className="px-4 py-2 text-sm text-dark-400">{page} / {pagination.pages} ({pagination.total} users)</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-dark p-6 rounded-2xl w-full max-w-md border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-2">
              {banModal.isBanned ? 'Unban' : 'Ban'} User
            </h2>
            <p className="text-dark-400 text-sm mb-4">
              {banModal.isBanned ? `Remove ban from ${banModal.name}?` : `Ban ${banModal.name} from the platform?`}
            </p>
            {!banModal.isBanned && (
              <div className="mb-4">
                <label className="text-sm text-dark-400 mb-1.5 block">Reason</label>
                <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban (e.g. fraud, spam, abuse)..." rows={3}
                  className="input-field resize-none" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleBanToggle}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${banModal.isBanned ? 'btn-primary' : 'btn-danger'}`}>
                {banModal.isBanned ? 'Unban User' : 'Ban User'}
              </button>
              <button onClick={() => { setBanModal(null); setBanReason(''); }} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
