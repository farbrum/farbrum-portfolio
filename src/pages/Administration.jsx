import { useState, useRef } from 'react'
import { Database, Download, Upload, Settings, Trash2, Shield, CheckCircle, AlertTriangle, Users, DollarSign, Wrench, Plus } from 'lucide-react'
import { useProductStore } from '../store/productStore'
import { useDevisStore } from '../store/devisStore'
import Window from '../components/Window'

export default function Administration() {
  const [msg, setMsg] = useState(null)
  const fileRef = useRef()

  const { categories, fournisseurs, produits, vehicules, ressources, tarifsMateriaux, updateTarifs, tarifsChantier, updateTarifsChantier, addRessource, updateRessource, deleteRessource, enginsData, updateEngin, addEngin, deleteEngin } = useProductStore()
  const { devis } = useDevisStore()

  // ===== EXPORT =====
  const exportData = () => {
    const data = {
      _export: {
        app: 'F.Arbrum',
        version: '5L',
        date: new Date().toISOString(),
      },
      categories: useProductStore.getState().categories,
      fournisseurs: useProductStore.getState().fournisseurs,
      produits: useProductStore.getState().produits,
      vehicules: useProductStore.getState().vehicules,
      ressources: useProductStore.getState().ressources,
      tarifsMateriaux: useProductStore.getState().tarifsMateriaux,
      tarifsChantier: useProductStore.getState().tarifsChantier,
      enginsData: useProductStore.getState().enginsData,
      devis: useDevisStore.getState().devis,
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const d = new Date()
    a.href = url
    a.download = `F_Arbrum_backup_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ type: 'ok', text: `Export réussi ! ${data.produits.length} produits, ${data.devis.length} devis, ${data.fournisseurs.length} fournisseurs.` })
    setTimeout(() => setMsg(null), 5000)
  }

  // ===== IMPORT =====
  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data._export || !data._export.app) {
          setMsg({ type: 'err', text: "Fichier invalide — ce n'est pas un export F.Arbrum." })
          return
        }

        // Restaurer les données
        const ps = useProductStore.getState()
        const ds = useDevisStore.getState()

        if (data.categories?.length > 0) {
          // Merge : ajouter les catégories manquantes
          const existingIds = ps.categories.map(c => c.id)
          data.categories.forEach(c => {
            if (!existingIds.includes(c.id)) ps.addCategorie(c)
            else ps.updateCategorie(c.id, c)
          })
        }
        if (data.fournisseurs?.length > 0) {
          const existingIds = ps.fournisseurs.map(f => f.id)
          data.fournisseurs.forEach(f => {
            if (!existingIds.includes(f.id)) ps.addFournisseur(f)
            else ps.updateFournisseur(f.id, f)
          })
        }
        if (data.produits?.length > 0) {
          const existingIds = ps.produits.map(p => p.id)
          data.produits.forEach(p => {
            if (!existingIds.includes(p.id)) ps.addProduit(p)
            else ps.updateProduit(p.id, p)
          })
        }
        if (data.vehicules?.length > 0) {
          const existingIds = ps.vehicules.map(v => v.id)
          data.vehicules.forEach(v => {
            if (!existingIds.includes(v.id)) ps.addVehicule(v)
            else ps.updateVehicule(v.id, v)
          })
        }
        if (data.devis?.length > 0) {
          const existingIds = ds.devis.map(d => d.id)
          data.devis.forEach(d => {
            if (!existingIds.includes(d.id)) ds.addDevis(d)
            else ds.updateDevis(d.id, d)
          })
        }

        const counts = `${data.produits?.length||0} produits, ${data.devis?.length||0} devis, ${data.fournisseurs?.length||0} fournisseurs, ${data.categories?.length||0} catégories`
        setMsg({ type: 'ok', text: `Import réussi ! ${counts}` })
      } catch (err) {
        setMsg({ type: 'err', text: `Erreur : ${err.message}` })
      }
    }
    reader.readAsText(file)
    e.target.value = '' // reset pour pouvoir reimporter le même fichier
    setTimeout(() => setMsg(null), 8000)
  }

  // ===== REMPLACEMENT TOTAL =====
  const importReplace = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('⚠️ ATTENTION : Ceci va REMPLACER toutes vos données actuelles par le contenu du fichier. Continuer ?')) { e.target.value=''; return }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data._export) { setMsg({type:'err',text:"Fichier invalide."}); return }

        // Écrire directement dans localStorage
        if (data.categories || data.fournisseurs || data.produits || data.vehicules) {
          localStorage.setItem('product-storage', JSON.stringify({
            state: {
              categories: data.categories || [],
              fournisseurs: data.fournisseurs || [],
              produits: data.produits || [],
              vehicules: data.vehicules || [],
              ressources: data.ressources || [],
              tarifsMateriaux: data.tarifsMateriaux || {},
              tarifsChantier: data.tarifsChantier || {},
              enginsData: data.enginsData || [],
            },
            version: 0
          }))
        }
        if (data.devis) {
          localStorage.setItem('devis-storage', JSON.stringify({
            state: { devis: data.devis || [] },
            version: 0
          }))
        }

        setMsg({type:'ok',text:'Remplacement total effectué ! Rechargement...'})
        setTimeout(() => window.location.reload(), 1500)
      } catch(err) { setMsg({type:'err',text:`Erreur: ${err.message}`}) }
    }
    reader.readAsText(file)
    e.target.value=''
  }

  const replaceRef = useRef()

  // Stats
  const stats = [
    { l: 'Catégories', v: categories.length },
    { l: 'Fournisseurs', v: fournisseurs.length },
    { l: 'Produits', v: produits.length },
    { l: 'Véhicules', v: vehicules.length },
    { l: 'Engins', v: (enginsData||[]).length },
    { l: 'Ressources', v: (ressources||[]).length },
    { l: 'Devis', v: devis.length },
  ]

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold text-white">Paramètres</h1>

      {/* Message */}
      {msg && (
        <div className={`flex items-center space-x-2 px-4 py-3 rounded border ${msg.type==='ok' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          {msg.type==='ok' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0"/> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0"/>}
          <p className={`text-xs ${msg.type==='ok'?'text-emerald-400':'text-red-400'}`}>{msg.text}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">

        {/* STATS */}
        <Window title="Base de données" icon={Database}>
          <div className="p-5">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {stats.map(s => (
                <div key={s.l} className="bg-bg-input border border-white/5 rounded p-2 text-center">
                  <p className="text-lg font-bold text-rose">{s.v}</p>
                  <p className="text-[8px] text-gray-500 uppercase">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="p-2.5 bg-rose/5 border border-rose/15 rounded">
              <p className="text-[10px] text-gray-400">💡 <strong className="text-rose">Pensez à exporter régulièrement !</strong> Les données sont stockées dans votre navigateur (localStorage). Un nettoyage du cache les supprime.</p>
            </div>
          </div>
        </Window>

        {/* EXPORT / IMPORT */}
        <Window title="Sauvegarde & Restauration" icon={Shield}>
          <div className="p-5 space-y-3">

            {/* EXPORT */}
            <button onClick={exportData}
              className="w-full h-11 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded border border-emerald-500/25 flex items-center justify-center space-x-2 transition-all">
              <Download className="w-4 h-4" />
              <span>Exporter toutes les données (JSON)</span>
            </button>
            <p className="text-[9px] text-gray-600">Télécharge un fichier JSON avec produits, fournisseurs, catégories, véhicules et devis.</p>

            <div className="border-t border-white/5 pt-3" />

            {/* IMPORT FUSION */}
            <input ref={fileRef} type="file" accept=".json" onChange={importData} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-11 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-semibold rounded border border-blue-500/25 flex items-center justify-center space-x-2 transition-all">
              <Upload className="w-4 h-4" />
              <span>Importer (fusion)</span>
            </button>
            <p className="text-[9px] text-gray-600">Ajoute les données du fichier sans supprimer les existantes. Idéal pour restaurer après un nettoyage.</p>

            <div className="border-t border-white/5 pt-3" />

            {/* IMPORT REMPLACEMENT */}
            <input ref={replaceRef} type="file" accept=".json" onChange={importReplace} className="hidden" />
            <button onClick={() => replaceRef.current?.click()}
              className="w-full h-11 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold rounded border border-amber-500/25 flex items-center justify-center space-x-2 transition-all">
              <Upload className="w-4 h-4" />
              <span>Importer (remplacement total)</span>
            </button>
            <p className="text-[9px] text-gray-600">⚠️ Remplace TOUTES les données actuelles par le fichier importé.</p>
          </div>
        </Window>

        {/* RESSOURCES HUMAINES */}
        <Window title="Ressources humaines" icon={Users}>
          <div className="p-5 space-y-3">
            {(ressources||[]).map(r=>(
              <div key={r.id} className="bg-bg-input border border-white/5 rounded p-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">{r.nom}</p>
                  <p className="text-[9px] text-gray-500">{r.tarifJournalier}€/jour · {r.tarifHoraire}€/h · {(r.competences||[]).join(', ')}</p>
                </div>
                <button onClick={()=>deleteRessource(r.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
              </div>
            ))}
            <button onClick={()=>addRessource({nom:'Nouveau ouvrier',tarifJournalier:250,tarifHoraire:31.25,competences:['pose']})} className="w-full h-8 bg-rose/10 hover:bg-rose/20 text-rose text-xs font-semibold rounded border border-rose/25">+ Ajouter une ressource</button>
          </div>
        </Window>

        {/* TARIFS MATÉRIAUX */}
        <Window title="Tarifs matériaux" icon={DollarSign}>
          <div className="p-5 space-y-2">
            {tarifsMateriaux && Object.entries({pvcMl:'Tube PVC (€/ml)',coudePVC:'Coude PVC (€/u)',terreVegetaleM3:'Terre végétale (€/m³)',graineM2:'Graine gazon (€/m²)',cableElec25Ml:'Câble 2,5mm² (€/ml)',cableElec4Ml:'Câble 4mm² (€/ml)',cableElec6Ml:'Câble 6mm² (€/ml)',fourreauElec:'Fourreau élec (€)',mortierM3:'Mortier de calage (€/m³)'}).map(([k,label])=>(
              <div key={k} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{label}</span>
                <input type="number" value={tarifsMateriaux[k]||0} onChange={e=>updateTarifs({[k]:parseFloat(e.target.value)||0})} step="0.5" className="w-20 h-7 px-2 bg-bg-input border border-white/10 rounded text-xs text-white text-right"/>
              </div>
            ))}
            <p className="text-[8px] text-gray-600 mt-2">Ces tarifs sont utilisés automatiquement dans les calculs de devis.</p>
          </div>
        </Window>

        <Window title="Paramètres chantier" icon={Settings}>
          <div className="p-5 space-y-2">
            {tarifsChantier && Object.entries({
              prixGasoilL:'Prix gasoil (€/L)',
              forfaitDepartOperateur:'Forfait départ opérateur (€)',
              prixKmOperateur:'Déplacement opérateur (€/km)',
              tempsChargementMin:'Temps chargement camion (min)',
              tempsDechargementMin:'Temps déchargement (min)',
              tempsAttenteChantierMortierMin:'Attente chantier mortier (min)',
              tempsAttenteLivraisonMin:'Attente livraison (min)',
              coeffFoisonnement:'Coeff. foisonnement',
              densiteMortier:'Densité mortier (t/m³)',
              heuresJourChantier:'Heures/jour chantier',
            }).map(([k,label])=>(
              <div key={k} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{label}</span>
                <input type="number" value={tarifsChantier[k]||0} onChange={e=>updateTarifsChantier({[k]:parseFloat(e.target.value)||0})} step="0.1" className="w-20 h-7 px-2 bg-bg-input border border-white/10 rounded text-xs text-white text-right"/>
              </div>
            ))}
            <p className="text-[8px] text-gray-600 mt-2">Ces paramètres influencent tous les calculs de coûts (terrassement, transport, main d'œuvre).</p>
          </div>
        </Window>

        {/* ENGINS — pleine largeur */}
        <div className="md:col-span-2">
          <Window title={`Engins & Machines (${(enginsData||[]).length})`} icon={Wrench}>
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {(enginsData||[]).map(e=>(
                  <div key={e.id} className="bg-bg-input border border-white/10 rounded-lg p-4 space-y-3 hover:border-rose/30 transition-colors">
                    {/* Nom engin */}
                    <div className="flex items-center justify-between">
                      <input type="text" value={e.nom} onChange={ev=>updateEngin(e.id,{nom:ev.target.value})} className="flex-1 h-8 px-3 bg-white/5 border border-white/10 rounded text-sm text-white font-medium"/>
                      <button onClick={()=>{if(confirm('Supprimer '+e.nom+' ?'))deleteEngin(e.id)}} className="ml-2 w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded" title="Supprimer">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                    {/* Champs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-wide">Rendement</label>
                        <div className="flex items-center mt-0.5">
                          <input type="number" value={e.rendementM3h||0} onChange={ev=>updateEngin(e.id,{rendementM3h:parseFloat(ev.target.value)||0})} step="0.5" className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-sm text-white text-right"/>
                          <span className="ml-1.5 text-[10px] text-gray-500 whitespace-nowrap">m³/h</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-wide">Location</label>
                        <div className="flex items-center mt-0.5">
                          <input type="number" value={e.coutHoraire||0} onChange={ev=>updateEngin(e.id,{coutHoraire:parseFloat(ev.target.value)||0})} step="1" className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-sm text-white text-right"/>
                          <span className="ml-1.5 text-[10px] text-gray-500 whitespace-nowrap">€/h</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-wide">Gasoil</label>
                        <div className="flex items-center mt-0.5">
                          <input type="number" value={e.consommationLH||0} onChange={ev=>updateEngin(e.id,{consommationLH:parseFloat(ev.target.value)||0})} step="0.5" className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-sm text-white text-right"/>
                          <span className="ml-1.5 text-[10px] text-gray-500 whitespace-nowrap">L/h</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-wide">Déplacement</label>
                        <div className="flex items-center mt-0.5">
                          <input type="number" value={e.deplacement||0} onChange={ev=>updateEngin(e.id,{deplacement:parseFloat(ev.target.value)||0})} step="10" className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-sm text-white text-right"/>
                          <span className="ml-1.5 text-[10px] text-gray-500 whitespace-nowrap">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Bouton ajouter */}
                <button onClick={()=>addEngin({nom:'Nouvel engin',rendementM3h:5,coutHoraire:30,consommationLH:5,deplacement:100})} className="border-2 border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors min-h-[160px]">
                  <Plus size={24} className="text-emerald-400"/>
                  <span className="text-xs text-emerald-400">Ajouter un engin</span>
                </button>
              </div>
              <p className="text-[9px] text-gray-500">Rendement = en terre (sol normal) • Le multiplicateur sol s'applique automatiquement (mixte ×2.5, roche ×6.5) • Déplacement = forfait transport de l'engin sur chantier</p>
            </div>
          </Window>
        </div>

        {/* VERSION */}
        <Window title="Version" icon={Settings}>
          <div className="p-5">
            <p className="text-sm text-gray-400 mb-3">F.Arbrum v5L — Application Web</p>
            <div className="space-y-1.5">
              {['Création de devis (7 étapes)','3 scénarios sol automatiques','Base de données complète','Carte GPS avec recherche','PDF professionnel (logo transparent)','Main d\'œuvre auto-calculée','Restauration surface (terre + graine)','Calendrier de pose disponibilité','Ressources humaines & tarifs','Fiche technique annexe','Combinaison PDF multi-scénarios','Export / Import JSON'].map(t=>(
                <div key={t} className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-emerald-500/10 text-emerald-400 rounded flex items-center justify-center text-[8px] border border-emerald-500/20">✓</span>
                  <span className="text-xs text-gray-300">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </Window>

        {/* DANGER */}
        <Window title="Zone de danger">
          <div className="p-5">
            <button onClick={() => {
              if (confirm('⚠️ Supprimer TOUTES les données ? Cette action est irréversible !')) {
                if (confirm('Vraiment sûr ? Exportez d\'abord si vous voulez garder vos données.')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }
            }}
              className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded border border-red-500/25 flex items-center justify-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Réinitialiser toutes les données</span>
            </button>
            <p className="text-[9px] text-gray-600 mt-1">Supprime tout : produits, fournisseurs, devis... Irréversible sans export préalable.</p>
          </div>
        </Window>
      </div>
    </div>
  )
}
