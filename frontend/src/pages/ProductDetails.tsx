import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { conversationsApi } from '../api/conversations'
import { Product } from '../types'
import { useAuthStore } from '../store/authStore'

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get<Product>(`/products/${id}`)
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!product || !user || product.seller.id !== user.id) return
    const confirmed = window.confirm('Delete this listing? This cannot be undone.')
    if (!confirmed) return

    try {
      setDeleting(true)
      await apiClient.delete(`/products/${product.id}`)
      navigate('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete listing')
    } finally {
      setDeleting(false)
    }
  }

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!id) {
      return
    }

    try {
      const conversation = await conversationsApi.start(id)
      navigate(`/chats/${conversation.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to contact seller')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Error: {error || 'Product not found'}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="w-full aspect-square bg-gray-100 rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          {product.image_urls.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {product.image_urls.slice(1).map((img) => (
                <div key={img} className="bg-gray-100 rounded-md h-24 w-full flex items-center justify-center overflow-hidden">
                  <img src={img} alt={product.name} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-4">
            ${product.price.toFixed(2)}
          </p>
          
          <div className="space-y-2 mb-6">
            <p className="text-gray-700">
              <span className="font-semibold">Seller:</span> {product.seller.full_name}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Location:</span> {product.location}
            </p>
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleContactSeller}
              className="w-full py-3 rounded-md font-medium text-lg bg-blue-500 hover:bg-blue-600 text-white"
            >
              Contact Seller
            </button>
            {user && product.seller.id === user.id && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-3 rounded-md font-medium text-lg border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete Listing'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Listing Details</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            <span className="font-semibold">Listed on:</span> {new Date(product.created_at).toLocaleDateString()}
          </li>
          <li>
            <span className="font-semibold">Seller contact:</span> {product.seller.email}
          </li>
          <li>
            <span className="font-semibold">Location:</span> {product.location}
          </li>
        </ul>
      </div>
    </div>
  )
}
