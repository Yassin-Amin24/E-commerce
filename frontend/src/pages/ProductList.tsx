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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Collection</h1>
          <p className="text-gray-500">Find huge discounts on quality second-hand clothing</p>
        </div>
        
        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="md:hidden btn btn-outline-primary w-full justify-between"
        >
          <span>Filters & Sort</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
      
      {/* Filters & Controls */}
      <div className={`card mb-8 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
        <div className="card-body">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-lg font-semibold">Refine Results</h2>
            <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                placeholder="City/Zip"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="form-control"
              />
            </div>

            {/* Price Range */}
            <div className="md:col-span-3 lg:col-span-3 grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Min $</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
              <div>
                <label className="form-label">Max $</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="form-control"
                  min="0"
                />
              </div>
            </div>

            {/* Filter Action */}
            <div className="md:col-span-3 lg:col-span-2 flex items-end">
              <button
                onClick={handleFilter}
                className="btn btn-primary w-full"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing <strong>{products.length}</strong> results
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'price_asc' | 'price_desc' | 'none')
                  if (e.target.value !== 'none') {
                    const sorted = [...products]
                    if (e.target.value === 'price_asc') {
                      sorted.sort((a, b) => a.price - b.price)
                    } else if (e.target.value === 'price_desc') {
                      sorted.sort((a, b) => b.price - a.price)
                    }
                    setProducts(sorted)
                  }
                }}
                className="form-control py-1 px-2 text-sm w-auto"
              >
                <option value="none">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card group hover:shadow-lg transition-all duration-300">
              <Link to={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm">
                  {product.location}
                </div>
              </Link>
              
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-lg font-bold text-gray-800 hover:text-primary transition-colors line-clamp-1" title={product.name}>
                      {product.name}
                    </h3>
                  </Link>
                  <span className="text-lg font-bold text-success">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-secondary mb-4 pb-4 border-b border-gray-100">
                  <span>Seller: {product.seller.full_name}</span>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
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
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          <div className="mt-6">
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
        </div>
      )}
    </div>
  )
}
