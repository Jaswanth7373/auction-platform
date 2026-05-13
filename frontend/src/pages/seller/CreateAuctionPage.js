import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX, FiPlus, FiImage } from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { auctionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['electronics','fashion','art','collectibles','jewelry','vehicles','real-estate','sports','books','music','furniture','vintage','gaming','other'];
const CONDITIONS = ['new','like-new','excellent','good','fair','poor'];

const CreateAuctionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [tags, setTags] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: '', condition: '',
    startingBid: '', reservePrice: '', buyNowPrice: '',
    startTime: '', endTime: '', minimumBidIncrement: '1',
    shippingIncluded: false, autoExtend: true,
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 8 - images.length;
    const newFiles = files.slice(0, remaining);
    setImages([...images, ...newFiles]);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Images optional in development
    if (!form.category) { toast.error('Please select a category'); return; }
    if (!form.condition) { toast.error('Please select item condition'); return; }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (end <= start) { toast.error('End time must be after start time'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      images.forEach(img => fd.append('images', img));
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (tags.trim()) fd.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      const validSpecs = specs.filter(s => s.key && s.value);
      if (validSpecs.length) fd.append('specifications', JSON.stringify(validSpecs));

      const { data } = await auctionAPI.create(fd);
      toast.success('Auction created successfully!');
      navigate(`/auctions/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const minStart = now.toISOString().slice(0, 16);

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar type="seller" />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black text-white mb-6">Create New Auction</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Images */}
              <div className="glass-dark p-6 rounded-2xl">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2"><FiImage className="text-primary-400" />Images <span className="text-dark-500 text-sm font-normal">({images.length}/8)</span></h2>
                <div className="grid grid-cols-4 gap-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded-md">Primary</span>}
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-dark-900/90 text-red-400 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-dark-600 hover:border-primary-500 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                      <FiUpload className="text-dark-500 text-xl group-hover:text-primary-400 transition-colors mb-1" />
                      <span className="text-xs text-dark-500 group-hover:text-primary-400 transition-colors">Upload</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="glass-dark p-6 rounded-2xl space-y-4">
                <h2 className="font-bold text-white">Basic Information</h2>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required maxLength={200} placeholder="e.g. Vintage Rolex Submariner 1968" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Description *</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required rows={4} maxLength={5000} placeholder="Detailed description of the item, its history, condition details..."
                    className="input-field resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="input-field">
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Condition *</label>
                    <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} required className="input-field">
                      <option value="">Select condition</option>
                      {CONDITIONS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">Tags (comma-separated)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                    placeholder="vintage, rolex, watch, luxury" className="input-field" />
                </div>
              </div>

              {/* Pricing */}
              <div className="glass-dark p-6 rounded-2xl space-y-4">
                <h2 className="font-bold text-white">Pricing</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Starting Bid ($) *</label>
                    <input type="number" value={form.startingBid} onChange={(e) => setForm({ ...form, startingBid: e.target.value })}
                      required min="0.01" step="0.01" placeholder="0.00" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Min. Bid Increment ($)</label>
                    <input type="number" value={form.minimumBidIncrement} onChange={(e) => setForm({ ...form, minimumBidIncrement: e.target.value })}
                      min="0.01" step="0.01" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Reserve Price ($) <span className="text-dark-600">optional</span></label>
                    <input type="number" value={form.reservePrice} onChange={(e) => setForm({ ...form, reservePrice: e.target.value })}
                      min="0" step="0.01" placeholder="Hidden minimum" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Buy Now Price ($) <span className="text-dark-600">optional</span></label>
                    <input type="number" value={form.buyNowPrice} onChange={(e) => setForm({ ...form, buyNowPrice: e.target.value })}
                      min="0" step="0.01" placeholder="Instant purchase" className="input-field" />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="glass-dark p-6 rounded-2xl space-y-4">
                <h2 className="font-bold text-white">Schedule</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Start Time *</label>
                    <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      min={minStart} required className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">End Time *</label>
                    <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      min={form.startTime || minStart} required className="input-field" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.autoExtend} onChange={(e) => setForm({ ...form, autoExtend: e.target.checked })} className="accent-primary-500 w-4 h-4" />
                    <span className="text-sm text-dark-300">Auto-extend if bid in last 5 minutes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.shippingIncluded} onChange={(e) => setForm({ ...form, shippingIncluded: e.target.checked })} className="accent-primary-500 w-4 h-4" />
                    <span className="text-sm text-dark-300">Shipping included</span>
                  </label>
                </div>
              </div>

              {/* Specs */}
              <div className="glass-dark p-6 rounded-2xl space-y-4">
                <h2 className="font-bold text-white">Specifications <span className="text-dark-500 text-sm font-normal">(optional)</span></h2>
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="text" value={spec.key} onChange={(e) => setSpecs(specs.map((s, si) => si === i ? { ...s, key: e.target.value } : s))}
                      placeholder="e.g. Material" className="input-field flex-1" />
                    <input type="text" value={spec.value} onChange={(e) => setSpecs(specs.map((s, si) => si === i ? { ...s, value: e.target.value } : s))}
                      placeholder="e.g. Stainless Steel" className="input-field flex-1" />
                    {specs.length > 1 && (
                      <button type="button" onClick={() => setSpecs(specs.filter((_, si) => si !== i))} className="p-2 text-red-400 hover:text-red-300"><FiX /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])}
                  className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                  <FiPlus />Add Specification
                </button>
              </div>

              <div className="flex gap-4">
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-4 text-base flex items-center justify-center gap-2">
                  {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</> : '🔨 Create Auction'}
                </button>
                <button type="button" onClick={() => navigate('/seller/auctions')} className="btn-secondary px-8">Cancel</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateAuctionPage;
