import { Link } from 'react-router-dom'
import { useDevisStore } from '../store/devisStore'
import { useProductStore } from '../store/productStore'
import { useAuthStore } from '../store/authStore'
import { FileText, Plus, Eye, Package, Database, Clock, CheckCircle, LayoutDashboard } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Window from '../components/Window'

export default function Dashboard() {
  const { devis } = useDevisStore()
  const { produits, fournisseurs } = useProductStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const stats = {
    total: devis.length,
    enCours: devis.filter(d => ['en_cours','envoyé'].includes(d.statut)).length,
    termines: devis.filter(d => ['terminé','accepté'].includes(d.statut)).length,
    produits: produits.length,
  }

  const stStyle = {
    brouillon:'text-gray-400 bg-white/5', envoyé:'text-blue-400 bg-blue-500/10',
    accepté:'text-emerald-400 bg-emerald-500/10', refusé:'text-red-400 bg-red-500/10',
    en_cours:'text-amber-400 bg-amber-500/10', terminé:'text-teal-400 bg-teal-500/10',
  }
  const stLabel = {brouillon:'Brouillon',envoyé:'Envoyé',accepté:'Accepté',refusé:'Refusé',en_cours:'En cours',terminé:'Terminé'}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Bonjour, {user?.prenom || user?.nom} 👋</h1>
          <p className="text-xs text-gray-500 mt-0.5">{isAdmin ? 'Gérez vos devis et produits.' : 'Consultez les devis.'}</p>
        </div>
        {isAdmin && (
          <Link to="/devis/nouveau" className="flex items-center space-x-1.5 h-9 px-4 bg-rose hover:bg-rose-light text-white text-xs font-semibold rounded shadow-[0_0_15px_rgba(200,80,155,0.2)] transition-all">
            <Plus className="w-3.5 h-3.5" /><span>Nouveau devis</span>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {l:'Total devis',v:stats.total,icon:FileText,c:'rose'},
          {l:'En cours',v:stats.enCours,icon:Clock,c:'amber'},
          {l:'Terminés',v:stats.termines,icon:CheckCircle,c:'emerald'},
          {l:'Produits',v:stats.produits,icon:Package,c:'blue'},
        ].map(({l,v,icon:I,c})=>(
          <Window key={l} title={l} icon={I}>
            <div className="p-4 text-center">
              <p className="font-display text-3xl font-bold text-white">{v}</p>
            </div>
          </Window>
        ))}
      </div>

      {/* Quick access */}
      {isAdmin && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/produits">
            <Window title="Base de données" icon={Database}>
              <div className="p-4 flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-rose/10 border border-rose/20 rounded flex items-center justify-center">
                  <Database className="w-5 h-5 text-rose" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200 group-hover:text-rose transition-colors">Gérer les produits</p>
                  <p className="text-[11px] text-gray-500">{fournisseurs.length} fournisseurs · {produits.length} produits</p>
                </div>
              </div>
            </Window>
          </Link>
          <Link to="/devis/nouveau">
            <Window title="Nouveau devis" icon={FileText}>
              <div className="p-4 flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200 group-hover:text-rose transition-colors">Créer un devis</p>
                  <p className="text-[11px] text-gray-500">Client, produit, calculs</p>
                </div>
              </div>
            </Window>
          </Link>
        </div>
      )}

      {/* Devis list */}
      <Window title="Derniers devis" icon={LayoutDashboard}>
        {devis.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun devis.</p>
            {isAdmin && <Link to="/devis/nouveau" className="text-xs text-rose font-medium mt-2 inline-block">+ Créer un devis</Link>}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {[...devis].reverse().slice(0,10).map(d=>(
              <Link key={d.id} to={`/devis/${d.id}`} className="flex items-center px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-rose transition-colors">N° {d.numeroDevis}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${stStyle[d.statut]}`}>{stLabel[d.statut]}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 truncate">{d.client?.nomComplet} · {d.client?.ville}</p>
                </div>
                <div className="text-right ml-3 hidden sm:block">
                  {d.totalTTC && <p className="text-sm font-bold text-rose">{(()=>{const n=Number(d.totalTTC||0);const p=n.toFixed(2).split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');return p.join(',')+' €'})()}</p>}
                  <p className="text-[10px] text-gray-600">{format(new Date(d.dateCreation),'dd MMM yyyy',{locale:fr})}</p>
                </div>
                <Eye className="w-3.5 h-3.5 text-gray-700 group-hover:text-rose ml-3" />
              </Link>
            ))}
          </div>
        )}
      </Window>
    </div>
  )
}
