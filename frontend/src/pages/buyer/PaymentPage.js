import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiShield, FiCheckCircle, FiLock } from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { auctionAPI, paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });

  useEffect(() => {
    const init = async () => {
      try {
        const { data: auctionRes } = await auctionAPI.getOne(auctionId);
        setAuction(auctionRes.data);
        const { data: payRes } = await paymentAPI.createIntent({ auctionId });
        setPaymentData(payRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initialize payment');
        navigate('/dashboard/wins');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [auctionId, navigate]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
      toast.error('Please fill all card details');
      return;
    }
    setProcessing(true);
    try {
      // In production, use Stripe Elements/PaymentElement for real card processing
      await paymentAPI.confirm({
        paymentIntentId: paymentData?.payment?.stripePaymentIntentId,
        paymentId: paymentData?.payment?._id,
      });
      setPaid(true);
      toast.success('Payment successful! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (paid) {
    return (
      <div className="flex min-h-screen bg-dark-950">
        <Sidebar type="buyer" />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="text-green-400 text-4xl" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Payment Successful!</h2>
              <p className="text-dark-400 mb-2">You've successfully purchased:</p>
              <p className="text-primary-400 font-semibold mb-6">{auction?.title}</p>
              <p className="text-2xl font-black text-white mb-8">${paymentData?.amount?.toFixed(2)}</p>
              <button onClick={() => navigate('/dashboard/wins')} className="btn-primary w-full">View My Wins</button>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="buyer" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-black text-white mb-6">Complete Payment</h1>

          {loading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8 max-w-4xl">
              {/* Order summary */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-dark p-5 rounded-2xl">
                  <h2 className="font-bold text-white mb-4">Order Summary</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
                      {auction?.images?.[0]?.url && <img src={auction.images[0].url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm line-clamp-2">{auction?.title}</p>
                      <p className="text-xs text-dark-500 mt-0.5">{auction?.seller?.businessName}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm border-t border-dark-700 pt-4">
                    <div className="flex justify-between text-dark-300"><span>Winning Bid</span><span>${paymentData?.amount?.toFixed(2)}</span></div>
                    <div className="flex justify-between text-dark-300"><span>Platform Fee</span><span>${paymentData?.platformFee?.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black text-white text-base pt-2 border-t border-dark-700">
                      <span>Total</span><span>${paymentData?.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="glass-dark p-4 rounded-2xl flex items-center gap-3">
                  <FiShield className="text-green-400 text-xl flex-shrink-0" />
                  <p className="text-xs text-dark-400">Your payment is protected by 256-bit SSL encryption and Stripe's fraud detection.</p>
                </div>
              </div>

              {/* Payment form */}
              <div className="lg:col-span-3">
                <div className="glass-dark p-6 rounded-2xl">
                  <h2 className="font-bold text-white mb-5 flex items-center gap-2"><FiCreditCard />Card Details</h2>
                  <form onSubmit={handlePay} className="space-y-4">
                    <div>
                      <label className="text-sm text-dark-400 mb-1.5 block">Cardholder Name</label>
                      <input type="text" value={cardDetails.name} onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        placeholder="John Doe" className="input-field" required />
                    </div>
                    <div>
                      <label className="text-sm text-dark-400 mb-1.5 block">Card Number</label>
                      <input type="text" value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                        placeholder="4242 4242 4242 4242" className="input-field font-mono" maxLength={19} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-dark-400 mb-1.5 block">Expiry</label>
                        <input type="text" value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          placeholder="MM/YY" className="input-field font-mono" maxLength={5} required />
                      </div>
                      <div>
                        <label className="text-sm text-dark-400 mb-1.5 block">CVC</label>
                        <input type="text" value={cardDetails.cvc} onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          placeholder="123" className="input-field font-mono" maxLength={4} required />
                      </div>
                    </div>
                    <button type="submit" disabled={processing} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                      {processing
                        ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                        : <><FiLock />Pay ${paymentData?.amount?.toFixed(2)}</>}
                    </button>
                    <p className="text-center text-xs text-dark-500">
                      For testing use card: 4242 4242 4242 4242, any future expiry, any CVC
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PaymentPage;
