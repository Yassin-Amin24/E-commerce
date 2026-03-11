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
    <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200/60 group-hover:shadow-lg group-hover:shadow-indigo-300/60 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Marketplace
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline"
            >
              Browse
            </Link>
            {user ? (
              <>
                <Link
                  to="/sell"
                  className="btn-gradient btn-sm ml-1 no-underline"
                >
                  + Sell Item
                </Link>

                <div className="relative ml-1" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {user.full_name.split(' ')[0]}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in-down">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link
                        to="/chats"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 no-underline"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Messages
                      </Link>
                      <Link
                        to="/my-listings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 no-underline"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        My Listings
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setUserMenuOpen(false); logout() }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium text-sm px-3 py-2 rounded-lg transition-colors no-underline"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-gradient btn-sm no-underline"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 animate-fade-in">
          <div className="pt-2 pb-4 space-y-1 px-4">
            <Link
              to="/"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 no-underline"
              onClick={() => setMobileOpen(false)}
            >
              Browse Products
            </Link>
            {user ? (
              <>
                <Link to="/sell" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 no-underline" onClick={() => setMobileOpen(false)}>+ Sell Item</Link>
                <Link to="/chats" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 no-underline" onClick={() => setMobileOpen(false)}>Messages</Link>
                <Link to="/my-listings" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 no-underline" onClick={() => setMobileOpen(false)}>My Listings</Link>
                <div className="border-t border-gray-100 my-2 pt-2">
                  <button
                    onClick={() => { setMobileOpen(false); logout() }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 no-underline" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link to="/signup" className="flex-1 text-center py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white no-underline" onClick={() => setMobileOpen(false)}>Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
