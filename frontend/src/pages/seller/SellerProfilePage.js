import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiUpload, FiShield } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { sellerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SellerProfilePage = () => {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ businessName: '', description: '', website: '', businessType: 'individual', categories: [] });
  const [verifyDocs, setVerifyDocs] = useState([]);

  useEffect(() => {
    sellerAPI.getDashboard().then(({ data }) => {
      const s = data.data?.seller;
      setSeller(s);
      if (s) setForm({ businessName: s.businessName || '', description: s.description || '', website: s.website || '', businessType: s.businessType || 'individual', categories: s.categories || [] });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (Array.isArray(v)) fd.append(k, JSON.stringify(v)); else if (v) fd.append(k, v); });
      await sellerAPI.updateProfile(fd);
      toast.success('Seller profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyDocs.length) { toast.error('Please upload verification documents'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      verifyDocs.forEach(f => fd.append('documents', f));
      fd.append('policiesAgreed', 'true');
      await sellerAPI.submitVerification(fd);
      toast.success('Verification documents submitted! Review takes 2-3 business days.');
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSaving(false); }
  };

  const CATEGORIES = ['electronics','fashion','art','collectibles','jewelry','vehicles','sports','books','gaming','vintage'];

  if (loading) return (
    <div className="flex min-h-screen bg-dark-950"><Sidebar type="seller" />
      <div className="flex-1 flex flex-col"><Navbar /><main className="p-8 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</main></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="seller" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-black text-white">Seller Profile</h1>
            {seller?.verificationBadge && <MdVerified className="text-blue-400 text-2xl" />}
            <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${seller?.verificationStatus === 'verified' ? 'text-green-400 bg-green-500/10' : seller?.verificationStatus === 'under_review' ? 'text-amber-400 bg-amber-500/10' : 'text-dark-400 bg-dark-700'}`}>
              {seller?.verificationStatus || 'pending'}
            </span>
          </div>

          <div className="flex gap-2 mb-6">
            {[['profile', 'Profile'], ['verification', 'Verification']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:text-white bg-dark-800/60'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-dark p-6 rounded-2xl">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Business Name *</label>
                  <input type="text" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1000} placeholder="Tell buyers about your business..." className="input-field resize-none" />
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Website</label>
                  <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yourstore.com" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Business Type</label>
                  <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="input-field">
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="nonprofit">Non-Profit</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-2 block">Categories You Sell</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => {
                        const has = form.categories.includes(cat);
                        setForm({ ...form, categories: has ? form.categories.filter(c => c !== cat) : [...form.categories, cat] });
                      }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${form.categories.includes(cat) ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:text-white bg-dark-800'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSave />Save Profile</>}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'verification' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-dark p-5 rounded-2xl border border-primary-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <FiShield className="text-primary-400 text-xl" />
                  <h2 className="font-bold text-white">Seller Verification</h2>
                </div>
                <p className="text-dark-400 text-sm mb-4">Verified sellers get a badge, higher trust, and more visibility. Upload government-issued ID or business registration documents.</p>
                {seller?.verificationStatus === 'verified' ? (
                  <div className="flex items-center gap-2 text-green-400"><MdVerified className="text-xl" /><span className="font-semibold">Your account is verified!</span></div>
                ) : seller?.verificationStatus === 'under_review' ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-400 font-semibold">Documents under review</p>
                    <p className="text-amber-400/70 text-sm mt-1">We'll notify you within 2-3 business days.</p>
                  </div>
                ) : (
                  <form onSubmit={handleVerifySubmit} className="space-y-4">
                    <div>
                      <label className="text-sm text-dark-400 mb-1.5 block">Upload Documents (ID, business registration, etc.)</label>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-dark-600 hover:border-primary-500 rounded-xl p-8 cursor-pointer transition-colors">
                        <FiUpload className="text-dark-500 text-2xl mb-2" />
                        <p className="text-dark-400 text-sm">{verifyDocs.length ? `${verifyDocs.length} file(s) selected` : 'Click to upload documents'}</p>
                        <input type="file" multiple accept="image/*,.pdf" onChange={(e) => setVerifyDocs(Array.from(e.target.files))} className="hidden" />
                      </label>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" required className="accent-primary-500 mt-0.5" />
                      <span className="text-sm text-dark-400">I agree to AuctionPro's Seller Terms of Service and confirm the submitted documents are authentic.</span>
                    </label>
                    <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiUpload />Submit for Verification</>}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerProfilePage;
