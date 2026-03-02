import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type {  UserSummary } from '../types'
export default function Signup() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient.post('/auth/signup', {
        email,
        full_name: fullName,
        password,
      })
      
      // Auto login after signup
      const tokenData = await apiClient.post<{ access_token: string; token_type: string }>('/auth/login', {
        email,
        password,
      })
      
      // Set token temporarily to fetch user data
      useAuthStore.setState({ token: tokenData.access_token })
      
      const userData = await apiClient.get<UserSummary>('/auth/me')
      
      setAuth(userData, tokenData.access_token)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof Error) {
        // Provide user-friendly error messages
        if (err.message.includes('Email already registered') || err.message.includes('already exists')) {
          setError('This email is already registered. Please use a different email or try logging in.')
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.')
        } else if (err.message.includes('validation') || err.message.includes('required')) {
          setError('Please fill in all required fields correctly.')
        } else {
          setError(err.message || 'Signup failed. Please try again.')
        }
      } else {
        setError('Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium disabled:bg-gray-400"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
