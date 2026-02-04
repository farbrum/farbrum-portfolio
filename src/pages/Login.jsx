import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Window from '../components/Window'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = login(email, password)
    user ? navigate('/') : setError('Email ou mot de passe incorrect')
  }

  const fillDemo = (t) => { setEmail(t==='admin'?'admin@test.com':'ouvrier@test.com'); setPassword('password'); setError('') }

  const inp = "w-full h-10 px-3 bg-bg-input border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/40 focus:border-rose transition-all"

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="F.Arbrum" className="w-24 h-24 mx-auto rounded-xl border-2 border-rose/30 shadow-[0_0_30px_rgba(200,80,155,0.2)] object-cover mb-4" />
          <h1 className="font-display text-3xl font-extrabold text-white">F.Arbrum</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion de devis d'assainissement</p>
        </div>

        <Window title="Connexion">
          <div className="p-5">
            {error && <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inp} placeholder="votre@email.com" required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className={inp+' pr-10'} placeholder="••••••••" required />
                  <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-rose">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full h-10 bg-rose hover:bg-rose-light text-white font-semibold rounded text-sm transition-all shadow-[0_0_20px_rgba(200,80,155,0.3)] hover:shadow-[0_0_30px_rgba(200,80,155,0.5)] flex items-center justify-center space-x-2">
                <span>Se connecter</span><ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/5">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Démo</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>fillDemo('admin')} className="px-3 py-2 bg-bg-input border border-white/5 hover:border-rose/40 rounded transition-all text-left">
                  <p className="text-[11px] font-semibold text-gray-300">👑 Admin</p>
                  <p className="text-[9px] text-gray-600">Accès complet</p>
                </button>
                <button onClick={()=>fillDemo('ouvrier')} className="px-3 py-2 bg-bg-input border border-white/5 hover:border-rose/40 rounded transition-all text-left">
                  <p className="text-[11px] font-semibold text-gray-300">🔧 Ouvrier</p>
                  <p className="text-[9px] text-gray-600">Consultation</p>
                </button>
              </div>
            </div>
          </div>
        </Window>
      </div>
    </div>
  )
}
