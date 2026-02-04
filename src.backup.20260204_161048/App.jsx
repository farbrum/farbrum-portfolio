import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
      </AppLoader>
    </BrowserRouter>
  )
}
