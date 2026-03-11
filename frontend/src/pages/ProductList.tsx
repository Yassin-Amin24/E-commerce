import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { conversationsApi } from '../api/conversations'
import { Product, ProductListResponse } from '../types'
import { useAuthStore } from '../store/authStore'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'none'>('none')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (minPrice) params.append('min_price', minPrice)
      if (maxPrice) params.append('max_price', maxPrice)
      if (locationFilter) params.append('location', locationFilter)
      
      const response = await apiClient.get<ProductListResponse>(`/products?${params.toString()}`)
      let sortedProducts = [...response.products]
      
      // Sort by price if requested
      if (sortBy === 'price_asc') {
        sortedProducts.sort((a, b) => a.price - b.price)
      } else if (sortBy === 'price_desc') {
        sortedProducts.sort((a, b) => b.price - a.price)
      }
      
      setProducts(sortedProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFilter = () => {
    fetchProducts()
  }

  const handleContactSeller = async (productId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const conversation = await conversationsApi.start(productId)
      navigate(`/chats/${conversation.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to contact seller')
    }
  }

  const handleDelete = async (productId: string) => {
    if (!user) return
    const confirmed = window.confirm('Delete this listing? This cannot be undone.')
    if (!confirmed) return

    try {
      setDeletingId(productId)
      await apiClient.delete(`/products/${productId}`)
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }


  if (loading) {
    return (
      <>
        {/* Hero skeleton */}
        <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 py-16 px-4">
          <div className="max-w-3xl mx-auto text-center animate-pulse">
            <div className="h-10 bg-white/20 rounded-xl w-2/3 mx-auto mb-4" />
            <div className="h-5 bg-white/20 rounded-lg w-1/2 mx-auto" />
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-9 bg-gray-200 rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600">Error: {error}</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Hero Banner ────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
              Discover great <span className="text-yellow-300">second-hand</span> deals
            </h1>
            <p className="text-indigo-100 text-lg">
              Browse hundreds of quality items at unbeatable prices.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Filter toggle (mobile) ──────────────────── */}
        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="md:hidden btn btn-outline-primary w-full justify-between mb-4"
        >
          <span>Filters &amp; Sort</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zM7 9a1 1 0 000 2h10a1 1 0 000-2H7zm2 5a1 1 0 000 2h6a1 1 0 000-2H9z" />
          </svg>
        </button>

        {/* ── Filters & Controls ─────────────────────── */}
        <div className={`card mb-8 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="text-base font-semibold text-gray-800">Refine Results</h2>
              <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-4 lg:col-span-4">
                <label className="form-label">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Keywords (e.g., 'jacket')"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-control pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  placeholder="City or ZIP"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="form-control"
                />
              </div>

              {/* Price Range */}
              <div className="md:col-span-3 lg:col-span-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Min $</label>
                  <input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="form-control" min="0" />
                </div>
                <div>
                  <label className="form-label">Max $</label>
                  <input type="number" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="form-control" min="0" />
                </div>
              </div>

              {/* Apply */}
              <div className="md:col-span-3 lg:col-span-2 flex items-end">
                <button onClick={handleFilter} className="btn btn-primary w-full">
                  Apply
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                <strong className="text-gray-700">{products.length}</strong> result{products.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'price_asc' | 'price_desc' | 'none')
                    if (e.target.value !== 'none') {
                      const sorted = [...products]
                      if (e.target.value === 'price_asc') sorted.sort((a, b) => a.price - b.price)
                      else sorted.sort((a, b) => b.price - a.price)
                      setProducts(sorted)
                    }
                  }}
                  className="form-control py-1.5 px-2 text-sm w-auto"
                >
                  <option value="none">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Grid ────────────────────────────── */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <Link to={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <img
                      src={product.image_urls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                      {product.location}
                    </span>
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <Link to={`/product/${product.id}`} className="no-underline flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
                        {product.name}
                      </h3>
                    </Link>
                    <span className="text-base font-bold text-emerald-600 whitespace-nowrap flex-shrink-0">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {product.seller.full_name}
                    </span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleContactSeller(product.id)}
                      className="btn btn-outline-primary w-full btn-sm"
                    >
                      Contact Seller
                    </button>
                    {user && user.id === product.seller.id && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="btn btn-danger w-full btn-sm"
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-4">
              <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your search or clearing the filters.</p>
            <button
              onClick={() => {
                setSearch('')
                setMinPrice('')
                setMaxPrice('')
                setLocationFilter('')
                fetchProducts()
              }}
              className="btn btn-primary"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </>
  )
}
