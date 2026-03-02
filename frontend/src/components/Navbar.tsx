import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2 no-underline hover:text-primary-hover">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.354 6.354a.5.5 0 0 0-.708-.708L8 8.293 6.854 7.146a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/>
                <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              </svg>
              Buy and Sell
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Browsing
            </Link>
            {user ? (
              <>
                <Link
                  to="/sell"
                  className="btn btn-primary btn-sm rounded-full px-4 no-underline"
                >
                  + Sell Item
                </Link>
                
                <div className="relative ml-3" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden lg:block">{user.full_name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 animate-fade-in-down origin-top-right">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-secondary uppercase font-semibold">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                      </div>
                      
                      <Link
                        to="/chats"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Messages
                      </Link>
                      <Link
                        to="/my-listings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Listings
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-danger hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary font-medium text-sm px-3 py-2 no-underline"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary btn-sm rounded-full px-4 no-underline"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
            >
              <span className="sr-only">Open main menu</span>
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Browse Products
            </Link>
            {user ? (
              <>
                <Link
                  to="/sell"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sell an Item
                </Link>
                <Link
                  to="/chats"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to="/my-listings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  My Listings
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-danger hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Link
                  to="/login"
                  className="btn btn-secondary w-full justify-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary w-full justify-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
