import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAward, FiCreditCard, FiCheckCircle, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { MdGavel } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { userAPI, paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const WinsPage = () => {
  const [wins, setWins] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userAPI.getWins(), paymentAPI.getHistory()])
      .then(([winsRes, paymentsRes]) => {
        setWins(winsRes.data.data || []);
        setPayments(paymentsRes.data.data || []);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getPaymentStatus = (auctionId) => {
    return payments.find(p => p.auction?._id === auctionId);
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="buyer" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <FiAward className="text-amber-400" />Won Auctions
            </h1>
            <p className="text-dark-400 text-sm mt-1">{wins.length} auctions won</p>
          </div>

          {loading ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
          ) : wins.length === 0 ? (
            <div className="glass-dark rounded-2xl p-16 text-center">
              <FiAward className="text-dark-700 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-400 mb-2">No wins yet</h3>
              <p className="text-dark-500 text-sm mb-6">Start bidding to win amazing items!</p>
              <Link to="/auctions" className="btn-primary">Browse Auctions</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wins.map((win) => {
                const payment = getPaymentStatus(win._id);
                const isPaid = payment?.status === 'completed';
                const isPending = !payment;
                return (
                  <motion.div key={win._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-dark p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
                      {win.images?.[0]?.url
                        ? <img src={win.images[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><MdGavel className="text-dark-600 text-2xl" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/auctions/${win._id}`} className="font-semibold text-white hover:text-primary-400 transition-colors line-clamp-1">
                        {win.title}
                      </Link>
                      <p className="text-xs text-dark-500 mt-0.5">by {win.seller?.businessName}</p>
                      <p className="text-sm font-black text-gradient mt-1">${win.winningBid?.toFixed(2)}</p>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-2">
                      {isPaid ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
                          <FiCheckCircle />Paid
                        </div>
                      ) : isPending ? (
                        <Link to={`/dashboard/payment/${win._id}`} className="btn-gold text-xs py-2 px-3 flex items-center gap-1.5">
                          <FiCreditCard />Pay Now
                        </Link>
                      ) : (
                        <span className="text-xs text-amber-400 capitalize">{payment?.status}</span>
                      )}
                      {payment?.shippingStatus && payment.shippingStatus !== 'not_shipped' && (
                        <div className="flex items-center gap-1 text-xs text-dark-400">
                          <FiPackage className="text-xs" />
                          <span className="capitalize">{payment.shippingStatus.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WinsPage;
