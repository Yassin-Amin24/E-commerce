import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { UserSummary } from '../types'
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tokenData = await apiClient.post<{ access_token: string; token_type: string }>('/auth/login', {
        email,
        password,
      })
      
      // Set token temporarily to fetch user data
      useAuthStore.setState({ token: tokenData.access_token })
      
      const userData = await apiClient.get<UserSummary>('/auth/me')
      
      setAuth(userData, tokenData.access_token)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof Error) {
        // Provide user-friendly error messages
        if (err.message.includes('401') || err.message.includes('Incorrect email or password')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          setError('Unable to connect to the server. Please check your internet connection.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-500 hover:text-blue-600">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
