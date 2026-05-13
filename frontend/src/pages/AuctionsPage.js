import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiGrid, FiList, FiX, FiChevronDown } from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import AuctionCard, { AuctionCardSkeleton } from '../components/auction/AuctionCard';
import { auctionAPI } from '../services/api';

const CATEGORIES = ['electronics','fashion','art','collectibles','jewelry','vehicles','real-estate','sports','books','music','furniture','vintage','gaming','other'];
const CONDITIONS = ['new','like-new','excellent','good','fair','poor'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'endTime', label: 'Ending Soon' },
  { value: '-currentBid', label: 'Highest Bid' },
  { value: 'currentBid', label: 'Lowest Bid' },
  { value: '-bidCount', label: 'Most Bids' },
  { value: '-viewCount', label: 'Most Viewed' },
];

const AuctionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [viewMode, setViewMode] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || 'active',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt',
    featured: searchParams.get('featured') || '',
    page: 1,
  });

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== null));
      const { data } = await auctionAPI.getAll({ ...params, limit: 12 });
      setAuctions(data.data || []);
      setPagination(data.pagination || {});
    } catch {
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  // Sync URL params
  useEffect(() => {
    const newParams = {};
    if (filters.search) newParams.search = filters.search;
    if (filters.category) newParams.category = filters.category;
    if (filters.status && filters.status !== 'active') newParams.status = filters.status;
    if (filters.featured) newParams.featured = filters.featured;
    setSearchParams(newParams, { replace: true });
  }, [filters.search, filters.category, filters.status, filters.featured]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  const clearFilters = () => setFilters({ search: '', category: '', status: 'active', condition: '', minPrice: '', maxPrice: '', sort: '-createdAt', featured: '', page: 1 });
  const hasActiveFilters = filters.category || filters.condition || filters.minPrice || filters.maxPrice || filters.featured || filters.status !== 'active';

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Header */}
      <div className="bg-dark-900/60 border-b border-dark-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white mb-4">
            {filters.category ? <span className="capitalize">{filters.category}</span> : 'All'} <span className="text-gradient">Auctions</span>
            <span className="ml-3 text-lg font-normal text-dark-500">({pagination.total || 0})</span>
          </h1>

          {/* Search & Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input type="text" value={filters.search} onChange={(e) => setFilter('search', e.target.value)}
                placeholder="Search auctions..."
                className="input-field w-full" />
            </div>
            <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}
              className="input-field w-auto">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setFiltersOpen(!filtersOpen)}
                className={`btn-secondary flex items-center gap-2 ${filtersOpen || hasActiveFilters ? 'border-primary-500 text-primary-400' : ''}`}>
                <FiFilter /><span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
              </button>
              <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="btn-secondary p-2.5">
                {viewMode === 'grid' ? <FiList className="text-lg" /> : <FiGrid className="text-lg" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 overflow-hidden">
                <div className="w-64 glass-dark p-5 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Filters</h3>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <FiX />Clear All
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-dark-500 mb-2 uppercase tracking-wide">Status</p>
                    {['active','scheduled','ended','sold'].map((s) => (
                      <label key={s} className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <input type="radio" name="status" checked={filters.status === s} onChange={() => setFilter('status', s)}
                          className="accent-primary-500" />
                        <span className="text-sm text-dark-300 capitalize">{s}</span>
                      </label>
                    ))}
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-xs text-dark-500 mb-2 uppercase tracking-wide">Category</p>
                    <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}
                      className="input-field text-sm py-2">
                      <option value="">All Categories</option>
                      {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <p className="text-xs text-dark-500 mb-2 uppercase tracking-wide">Condition</p>
                    <select value={filters.condition} onChange={(e) => setFilter('condition', e.target.value)}
                      className="input-field text-sm py-2">
                      <option value="">Any Condition</option>
                      {CONDITIONS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <p className="text-xs text-dark-500 mb-2 uppercase tracking-wide">Price Range</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min $" value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)}
                        className="input-field text-sm py-2 w-full" />
                      <input type="number" placeholder="Max $" value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)}
                        className="input-field text-sm py-2 w-full" />
                    </div>
                  </div>

                  {/* Featured */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.featured === 'true'} onChange={(e) => setFilter('featured', e.target.checked ? 'true' : '')}
                      className="accent-primary-500" />
                    <span className="text-sm text-dark-300">Featured Only</span>
                  </label>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Auctions Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {Array(9).fill(0).map((_, i) => <AuctionCardSkeleton key={i} />)}
              </div>
            ) : auctions.length === 0 ? (
              <div className="text-center py-24 glass-dark rounded-2xl">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No auctions found</h3>
                <p className="text-dark-400 mb-6">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {auctions.map((auction) => <AuctionCard key={auction._id} auction={auction} onWatchlistChange={fetchAuctions} />)}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button onClick={() => setFilter('page', Math.max(1, filters.page - 1))} disabled={filters.page === 1}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Previous</button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button key={p} onClick={() => setFilter('page', p)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${filters.page === p ? 'btn-primary' : 'btn-secondary'}`}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setFilter('page', Math.min(pagination.pages, filters.page + 1))} disabled={filters.page === pagination.pages}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionsPage;
