import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Product } from '../types'

export default function SellItem() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [images, setImages] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const imageUrls = images
      .split(/[\n,]+/)
      .flatMap((chunk) => chunk.split(/\s+/))
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url) => (url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`))
      .filter((url, index, arr) => arr.indexOf(url) === index)

    if (imageUrls.length === 0) {
      setError('Please provide at least one image URL')
      return
    }

    try {
      setSubmitting(true)
      const product = await apiClient.post<Product>('/products', {
        name,
        description,
        price: Number(price),
        location,
        image_urls: imageUrls,
      })
      navigate(`/product/${product.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">List an Item</h1>
        <p className="text-gray-500 mt-1">Share your item with buyers in your area</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="form-label">Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control"
                placeholder="e.g., Vintage Denim Jacket"
              />
            </div>

            {/* Description */}
            <div>
              <label className="form-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="form-control resize-none"
                placeholder="Describe the condition, size, brand, and any other details buyers should know."
              />
            </div>

            {/* Price + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Price (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="form-control pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="form-control"
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Image URLs */}
            <div>
              <label className="form-label">Image URLs</label>
              <textarea
                value={images}
                onChange={(e) => setImages(e.target.value)}
                required
                rows={3}
                className="form-control resize-none"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="mt-2 text-xs text-gray-400 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Upload to Imgur or similar, then paste the URL(s) here — one per line.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient w-full py-3 text-base"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing...
                </span>
              ) : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
