import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiSettings,
  FiChevronDown, FiSearch, FiGrid, FiShoppingBag
} from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/auctions?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/auctions', label: 'Browse Auctions' },
    { to: '/auctions?status=active', label: 'Live Now' },
    { to: '/auctions?featured=true', label: 'Featured' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <MdGavel className="text-white text-xl" />
            </div>
            <span className="text-xl font-black text-gradient hidden sm:block">AuctionPro</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to.split('?')[0]
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/60'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all">
              <FiSearch className="text-xl" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead(); }}
                    className="relative p-2.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all">
                    <FiBell className="text-xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 glass-dark rounded-2xl shadow-2xl border border-dark-700/50 overflow-hidden z-50">
                        <div className="flex items-center justify-between p-4 border-b border-dark-700">
                          <span className="font-semibold text-white">Notifications</span>
                          <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">Mark all read</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-dark-400 text-sm">No notifications yet</div>
                          ) : (
                            notifications.slice(0, 10).map((n) => (
                              <div key={n._id} className={`p-4 border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary-500/5' : ''}`}>
                                <p className="text-sm font-medium text-dark-100">{n.title}</p>
                                <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-dark-500 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User menu */}
                <div ref={userMenuRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-dark-700 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center overflow-hidden">
                      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <span className="text-sm font-medium text-dark-200 hidden sm:block max-w-[100px] truncate">{user?.name}</span>
                    <FiChevronDown className={`text-dark-400 text-sm transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 glass-dark rounded-2xl shadow-2xl border border-dark-700/50 overflow-hidden z-50">
                        <div className="p-3 border-b border-dark-700">
                          <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
                          <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                          <span className="mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 capitalize">{user?.role}</span>
                        </div>
                        <div className="p-2">
                          {[
                            { to: '/dashboard', icon: FiGrid, label: 'My Dashboard' },
                            { to: '/dashboard/profile', icon: FiUser, label: 'Profile' },
                            ...(isSeller ? [{ to: '/seller/dashboard', icon: FiShoppingBag, label: 'Seller Portal' }] : []),
                            ...(isAdmin ? [{ to: '/admin/dashboard', icon: FiSettings, label: 'Admin Panel' }] : []),
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-dark-700/60 transition-all text-sm">
                              <Icon className="text-base" />{label}
                            </Link>
                          ))}
                          <button onClick={() => { setUserMenuOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm mt-1">
                            <FiLogOut className="text-base" />Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Login</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm hidden sm:block">Get Started</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all">
              {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-dark-700/50">
              <form onSubmit={handleSearch} className="flex items-center gap-3 py-3">
                <FiSearch className="text-dark-400 text-xl flex-shrink-0" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                  placeholder="Search auctions, items, categories..."
                  className="flex-1 bg-transparent text-dark-100 placeholder-dark-400 outline-none text-sm" />
                <button type="submit" className="btn-primary py-2 px-4 text-sm">Search</button>
                <button type="button" onClick={() => setSearchOpen(false)} className="p-2 text-dark-400 hover:text-white"><FiX /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-dark-700/50 pb-4">
              <div className="flex flex-col gap-1 pt-3">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700/60 rounded-xl transition-all text-sm font-medium">
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary mt-2 text-center">Get Started</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
