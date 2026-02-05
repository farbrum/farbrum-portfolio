import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from './store/authStore'
import { useProductStore } from './store/productStore'
import { useDevisStore } from './store/devisStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewDevis from './pages/NewDevis'
import DevisDetail from './pages/DevisDetail'
import Produits from './pages/Produits'
import Administration from './pages/Administration'
import Ressources from './pages/Ressources'
import FichePoseur from './pages/FichePoseur'
import Layout from './components/Layout'

const INACTIVITY_TIMEOUT = 4 * 60 * 1000 // 4 minutes

function InactivityGuard({ children }) {
  const logout = useAuthStore(s => s.logout)
  const user = useAuthStore(s => s.user)
  const timerRef = useRef(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (useAuthStore.getState().user) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }, INACTIVITY_TIMEOUT)
  }, [])

  useEffect(() => {
    if (!user) return
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user, resetTimer])

  return children
}

function AppLoader({ children }) {
  const [ready, setReady] = useState(false)
  const initProducts = useProductStore(s => s.init)
  const initDevis = useDevisStore(s => s.init)
  const initAuth = useAuthStore(s => s.init)

  useEffect(() => {
    Promise.all([initProducts(), initDevis(), initAuth()])
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-rose border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-400">Chargement des données...</p>
      </div>
    </div>
  )
  return children
}

export default function App() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  return (
    <BrowserRouter>
      <AppLoader>
        <InactivityGuard>
        <Routes>
          {/* Route poseur — accessible SANS login via QR code */}
          <Route path="/chantier/:devisId" element={<FichePoseur />} />

          <Route path="/login" element={<Login />} />
          {user ? (
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/devis/nouveau" element={isAdmin ? <NewDevis /> : <Navigate to="/" />} />
              <Route path="/devis/:id/edit" element={isAdmin ? <NewDevis /> : <Navigate to="/" />} />
              <Route path="/devis/:id" element={<DevisDetail />} />
              <Route path="/produits" element={isAdmin ? <Produits /> : <Navigate to="/" />} />
              <Route path="/ressources" element={isAdmin ? <Ressources /> : <Navigate to="/" />} />
              <Route path="/admin" element={isAdmin ? <Administration /> : <Navigate to="/" />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
        </InactivityGuard>
      </AppLoader>
    </BrowserRouter>
  )
}
