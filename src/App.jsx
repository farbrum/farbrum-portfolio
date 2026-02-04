import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewDevis from './pages/NewDevis'
import DevisDetail from './pages/DevisDetail'
import Produits from './pages/Produits'
import Administration from './pages/Administration'
import Ressources from './pages/Ressources'
import FichePoseur from './pages/FichePoseur'
import Layout from './components/Layout'

export default function App() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
