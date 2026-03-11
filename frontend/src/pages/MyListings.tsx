import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Product, ProductListResponse } from '../types'


export default function MyListings() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)


  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<ProductListResponse>('/products/mine')
      setProducts(response.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your listings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div className="h-9 bg-gray-200 rounded-xl w-40" />
          <div className="h-10 bg-gray-200 rounded-full w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-9 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-danger">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Listings</h1>
          <p className="text-gray-500 mt-1">{products.length} active listing{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/sell"
          className="btn-gradient no-underline"
        >
          + New Listing
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-4">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No listings yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first listing and start selling.</p>
          <Link to="/sell" className="btn-gradient no-underline">
            + Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <Link to={`/product/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-gray-50">
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <div className="p-4">
                <Link to={`/product/${product.id}`} className="no-underline">
                  <h3 className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-emerald-600">${product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {product.location}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="text-center py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 no-underline transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="py-2 rounded-lg text-xs font-semibold border border-red-200 text-danger hover:bg-red-50 hover:border-red-300 disabled:opacity-60 transition-colors"
                  >
                    {deletingId === product.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
