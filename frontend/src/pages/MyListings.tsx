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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading your listings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Link
          to="/sell"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
        >
          Create Listing
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-12">You have no listings yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Link to={`/product/${product.id}`}>
                <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-contain" />
                </div>
              </Link>
              <div className="p-4 space-y-2">
                <Link to={`/product/${product.id}`} className="text-lg font-semibold hover:text-blue-600">
                  {product.name}
                </Link>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">{product.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="text-center py-2 rounded-md font-medium border border-gray-200 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="text-center py-2 rounded-md font-medium border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-60"
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
