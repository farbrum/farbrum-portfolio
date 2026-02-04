import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LayoutDashboard, FileText, Database, Settings, LogOut, Menu, Shield, User, ChevronRight, Users } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    ...(isAdmin ? [
      { to: '/devis/nouveau', icon: FileText, label: 'Nouveau devis' },
      { to: '/produits', icon: Database, label: 'Base de données' },
      { to: '/ressources', icon: Users, label: 'Ressources' },
      { to: '/admin', icon: Settings, label: 'Paramètres' },
    ] : []),
  ]

  const isActive = (p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)

  const Nav = () => (
    <div className="flex flex-col h-full">
      {/* Logo F.Arbrum */}
      <div className="px-4 py-4 border-b border-rose/30">
        <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center space-x-3">
          <img src="/logo.jpg" alt="F.Arbrum" className="w-10 h-10 rounded-lg object-cover border border-rose/30" />
          <div>
            <h1 className="font-display font-bold text-white text-sm leading-tight">F.Arbrum</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Gestion de devis</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const active = isActive(item.to)
          return (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded text-[13px] font-medium transition-all ${
                active
                  ? 'bg-rose/15 text-rose border-l-2 border-rose'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
              }`}>
              <item.icon className={`w-4 h-4 ${active ? 'text-rose' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-rose/20">
        <div className="flex items-center space-x-2.5 px-3 py-2 mb-1">
          <div className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold border ${
            isAdmin ? 'bg-rose/15 text-rose border-rose/30' : 'bg-white/5 text-gray-400 border-white/10'
          }`}>{user?.prenom?.[0] || '?'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }}
          className="flex items-center space-x-2.5 px-3 py-2 w-full rounded text-[13px] text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut className="w-4 h-4" /><span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 bg-bg-card border-r border-rose/25 fixed h-full z-30">
        <Nav />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-bg-card border-r border-rose/25"><Nav /></aside>
        </div>
      )}

      <div className="flex-1 lg:ml-56">
        {/* Mobile header */}
        <header className="lg:hidden bg-bg-card border-b border-rose/25 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 h-12">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-gray-400 hover:text-rose"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="" className="w-6 h-6 rounded object-cover" />
              <span className="font-display font-bold text-white text-sm">F.Arbrum</span>
            </div>
            <div className="w-8" />
          </div>
        </header>
        <main className="p-4 sm:p-5 lg:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
