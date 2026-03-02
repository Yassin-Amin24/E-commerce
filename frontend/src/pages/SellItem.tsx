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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Sell an Item</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="e.g., Vintage Denim Jacket"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Describe the condition, size, and any details buyers should know."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md"
                placeholder="e.g., 75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md"
                placeholder="City, State"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Image URLs</label>
            <textarea
              value={images}
              onChange={(e) => setImages(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Paste one image URL per line"
            />
            <p className="text-xs text-gray-500 mt-2">
              We currently support image links only. Upload your photos elsewhere (e.g., Imgur) and paste the URLs here.
            </p>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md font-medium disabled:opacity-70"
          >
            {submitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
