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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4 pt-4">
            <div className="h-8 bg-gray-200 rounded-xl w-3/4" />
            <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-12 bg-gray-200 rounded-xl mt-8" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600">{error || 'Product not found'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        {/* ── Product Images ─────────────────────────── */}
        <div className="space-y-3">
          <div className="w-full aspect-square bg-gray-50 rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          {product.image_urls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.image_urls.slice(1).map((img) => (
                <div key={img} className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  <img src={img} alt={product.name} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ───────────────────────────── */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-4xl font-extrabold text-emerald-600">
              ${product.price.toFixed(2)}
            </span>
            <span className="badge badge-success text-sm">In stock</span>
          </div>

          {/* Seller & location info */}
          <div className="flex flex-col gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {product.seller.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Sold by</p>
                <p className="text-sm font-semibold text-gray-800">{product.seller.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 pl-11">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {product.location}
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6 flex-1">{product.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleContactSeller}
              className="btn-gradient py-3 text-base"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Seller
            </button>
            {user && product.seller.id === user.id && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger py-3 text-base"
              >
                {deleting ? 'Deleting...' : 'Delete Listing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Listing Details ────────────────────────────── */}
      <div className="card">
        <div className="card-header">Listing Details</div>
        <div className="card-body">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Listed on</dt>
              <dd className="text-sm font-semibold text-gray-800">{new Date(product.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Seller contact</dt>
              <dd className="text-sm font-semibold text-gray-800">{product.seller.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Location</dt>
              <dd className="text-sm font-semibold text-gray-800">{product.location}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
