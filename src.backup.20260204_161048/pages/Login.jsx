import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ArrowRight, Eye, EyeOff, Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react'
import Window from '../components/Window'

// ─── Écran 1 : Code Entreprise ───
function EcranCodeEntreprise({ onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [tentatives, setTentatives] = useState(0)
  const [bloque, setBloque] = useState(false)
  const [tempsRestant, setTempsRestant] = useState(0)
  const [checking, setChecking] = useState(false)
  const inputRef = useRef(null)
  const verifierCodeEntreprise = useAuthStore(s => s.verifierCodeEntreprise)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (tempsRestant > 0) {
      const timer = setTimeout(() => setTempsRestant(t => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (bloque) {
      setBloque(false)
    }
  }, [tempsRestant, bloque])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (bloque || checking) return

    setChecking(true)
    try {
      const ok = await verifierCodeEntreprise(code)
      if (ok) {
        sessionStorage.setItem('farbrum-access', 'granted')
        onSuccess()
      } else {
        const newTentatives = tentatives + 1
        setTentatives(newTentatives)
        setError('Code incorrect')
        setCode('')

        if (newTentatives >= 5) {
          const blocDuree = Math.min(newTentatives * 10, 120)
          setBloque(true)
          setTempsRestant(blocDuree)
          setError(`Trop de tentatives. Réessayez dans ${blocDuree}s.`)
        }
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    }
    setChecking(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="F.Arbrum" className="w-20 h-20 mx-auto rounded-xl border-2 border-rose/30 shadow-[0_0_30px_rgba(200,80,155,0.2)] object-cover mb-4" />
          <h1 className="font-display text-2xl font-extrabold text-white">F.Arbrum</h1>
          <p className="text-xs text-gray-500 mt-1">Espace réservé</p>
        </div>
        <Window title="Accès sécurisé" icon={Shield}>
          <div className="p-5">
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose/10 border border-rose/20 flex items-center justify-center mb-3">
                <Lock className="w-8 h-8 text-rose" />
              </div>
              <p className="text-xs text-gray-400">Entrez le code d'accès entreprise</p>
            </div>
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-center space-x-2">
                <AlertTriangle size={14} /><span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="password"
                value={code}
                onChange={e => { setCode(e.target.value); setError('') }}
                className="w-full h-14 px-4 bg-bg-input border border-white/10 rounded-xl text-xl text-white text-center tracking-[0.5em] font-mono placeholder:text-gray-700 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-rose/40 focus:border-rose transition-all"
                placeholder="• • • • • • • •"
                disabled={bloque || checking}
                autoComplete="off"
                required
              />
              <button
                type="submit"
                disabled={bloque || !code.trim() || checking}
                className={`w-full h-11 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 ${
                  bloque || !code.trim() || checking
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-rose hover:bg-rose-light text-white shadow-[0_0_20px_rgba(200,80,155,0.3)]'
                }`}
              >
                {checking ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Vérification...</span></>
                ) : bloque ? (
                  <span>⏳ Bloqué ({tempsRestant}s)</span>
                ) : (
                  <><Shield className="w-4 h-4" /><span>Accéder</span></>
                )}
              </button>
            </form>
            {tentatives > 0 && tentatives < 5 && (
              <p className="text-[9px] text-gray-600 text-center mt-3">
                {5 - tentatives} tentative{5 - tentatives > 1 ? 's' : ''} restante{5 - tentatives > 1 ? 's' : ''} avant blocage
              </p>
            )}
          </div>
        </Window>
        <p className="text-[9px] text-gray-700 text-center mt-4">Accès non autorisé interdit. Toute tentative est enregistrée.</p>
      </div>
    </div>
  )
}

// ─── Écran 2 : Login classique ───
function EcranLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const ok = await login(email, password)
      if (ok) {
        navigate('/')
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    }
    setLoading(false)
  }

  const inp = "w-full h-10 px-3 bg-bg-input border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/40 focus:border-rose transition-all"

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="F.Arbrum" className="w-24 h-24 mx-auto rounded-xl border-2 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] object-cover mb-4" />
          <h1 className="font-display text-3xl font-extrabold text-white">F.Arbrum</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion de devis d'assainissement</p>
          <div className="flex items-center justify-center space-x-1 mt-2">
            <Shield size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400">Accès vérifié</span>
          </div>
        </div>
        <Window title="Identification">
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
              <button type="submit" disabled={loading} className="w-full h-10 bg-rose hover:bg-rose-light text-white font-semibold rounded text-sm transition-all shadow-[0_0_20px_rgba(200,80,155,0.3)] hover:shadow-[0_0_30px_rgba(200,80,155,0.5)] flex items-center justify-center space-x-2 disabled:opacity-50">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Connexion...</span></>
                ) : (
                  <><span>Se connecter</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </Window>
      </div>
    </div>
  )
}

// ─── Page Login principale ───
export default function Login() {
  const [codeValide, setCodeValide] = useState(
    () => sessionStorage.getItem('farbrum-access') === 'granted'
  )
  const init = useAuthStore(s => s.init)

  // Charger les données auth au démarrage
  useEffect(() => { init() }, [])

  if (!codeValide) {
    return <EcranCodeEntreprise onSuccess={() => setCodeValide(true)} />
  }
  return <EcranLogin />
}
