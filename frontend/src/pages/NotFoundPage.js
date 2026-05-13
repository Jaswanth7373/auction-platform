import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';

const NotFoundPage = () => (
  <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-purple rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
        <MdGavel className="text-white text-4xl" />
      </div>
      <h1 className="text-8xl font-black text-gradient mb-4">404</h1>
      <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
      <p className="text-dark-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-primary flex items-center justify-center gap-2">
          <FiArrowLeft />Go Home
        </Link>
        <Link to="/auctions" className="btn-secondary">Browse Auctions</Link>
      </div>
    </motion.div>
  </div>
);

export default NotFoundPage;
