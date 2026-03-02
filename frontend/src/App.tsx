import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Navbar from './components/Navbar'
import { useAuthStore } from './store/authStore'
import SellItem from './pages/SellItem'
import Chats from './pages/Chats'
import MyListings from './pages/MyListings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-dark font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chats/:conversationId" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
