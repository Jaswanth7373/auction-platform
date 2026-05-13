import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiClock, FiHeart, FiTrendingUp, FiUser, FiCreditCard,
  FiMenu, FiX, FiShoppingBag, FiPlusCircle, FiBarChart2,
  FiUsers, FiSettings, FiShield, FiChevronRight, FiLogOut
} from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const buyerLinks = [
  { to: '/dashboard', icon: FiGrid, label: 'Overview' },
  { to: '/dashboard/bids', icon: FiClock, label: 'My Bids' },
  { to: '/dashboard/wins', icon: FiTrendingUp, label: 'Won Auctions' },
  { to: '/dashboard/watchlist', icon: FiHeart, label: 'Watchlist' },
  { to: '/dashboard/profile', icon: FiUser, label: 'Profile' },
];

const sellerLinks = [
  { to: '/seller/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/seller/auctions/create', icon: FiPlusCircle, label: 'Create Auction' },
  { to: '/seller/auctions', icon: MdGavel, label: 'My Auctions' },
  { to: '/seller/analytics', icon: FiBarChart2, label: 'Analytics' },
  { to: '/seller/profile', icon: FiUser, label: 'Seller Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/admin/users', icon: FiUsers, label: 'Users' },
  { to: '/admin/sellers', icon: FiShield, label: 'Sellers' },
  { to: '/admin/auctions', icon: MdGavel, label: 'Auctions' },
];

const Sidebar = ({ type = 'buyer' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const links = type === 'admin' ? adminLinks : type === 'seller' ? sellerLinks : buyerLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-dark-700/50`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center">
              <MdGavel className="text-white text-base" />
            </div>
            <span className="text-sm font-black text-gradient">AuctionPro</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all hidden lg:flex">
          <FiChevronRight className={`text-base transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="p-4 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 capitalize">{type}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`}>
              <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Switcher & logout */}
      <div className="p-3 border-t border-dark-700/50 space-y-1">
        {type !== 'buyer' && (
          <Link to="/dashboard" className={`nav-item ${collapsed ? 'justify-center px-3' : ''}`}>
            <FiGrid className="text-lg flex-shrink-0" />
            {!collapsed && <span className="text-sm">Buyer Dashboard</span>}
          </Link>
        )}
        <button onClick={logout} className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-3' : ''}`}>
          <FiLogOut className="text-lg flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2.5 bg-dark-800 border border-dark-700 rounded-xl text-dark-300 hover:text-white shadow-lg">
        <FiMenu className="text-xl" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-dark-900 border-r border-dark-700/50 z-50">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-dark-400 hover:text-white">
                <FiX className="text-xl" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:block flex-shrink-0 h-screen sticky top-0 bg-dark-900 border-r border-dark-700/50 overflow-hidden">
        <SidebarContent />
      </motion.aside>
    </>
  );
};

export default Sidebar;
