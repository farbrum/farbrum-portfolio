import { useState, useRef, useEffect } from 'react'
import { Database, Download, Upload, Settings, Trash2, Shield, CheckCircle, AlertTriangle, Users, DollarSign, Wrench, Plus, Eye, EyeOff, Key, UserPlus, Lock, Cloud, HardDrive } from 'lucide-react'
import { useProductStore } from '../store/productStore'
import { useDevisStore } from '../store/devisStore'
import { useAuthStore } from '../store/authStore'
import { backup } from '../services/supabase'
import Window from '../components/Window'

export default function Administration() {
  const [msg, setMsg] = useState(null)
  const fileRef = useRef()

  const { categories, fournisseurs, produits, vehicules, ressources, tarifsMateriaux, updateTarifs, tarifsChantier, updateTarifsChantier, addRessource, updateRessource, deleteRessource, enginsData, updateEngin, addEngin, deleteEngin } = useProductStore()
  const { devis } = useDevisStore()
  const { users, codeEntreprise, setCodeEntreprise, addUser, updateUser, deleteUser, init: initAuth } = useAuthStore()
  const [showPasswords, setShowPasswords] = useState({})
  const [newUser, setNewUser] = useState(null)

  useEffect(() => { initAuth() }, [])

  // ===== EXPORT (depuis Supabase) =====
  const exportData = async () => {
    setMsg({ type: 'ok', text: 'Téléchargement en cours...' })
    const result = await backup.downloadBackup()
    if (result.success) {
      setMsg({ type: 'ok', text: `✅ Export réussi ! Fichier téléchargé.` })
    } else {
      setMsg({ type: 'err', text: `Erreur export : ${result.error}` })
    }
    setTimeout(() => setMsg(null), 5000)
  }

  // ===== IMPORT (vers Supabase — fusion) =====
  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        setMsg({ type: 'ok', text: 'Import en cours...' })
        const result = await backup.restoreFromBackup(ev.target.result, 'merge')
        if (result.success) {
          const r = result.results
          const counts = Object.entries(r).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(', ')
          setMsg({ type: 'ok', text: `✅ Import réussi ! ${counts}. Rechargement...` })
          setTimeout(() => window.location.reload(), 2000)
        } else {
          setMsg({ type: 'err', text: `Erreur : ${result.error}` })
        }
      } catch (err) {
        setMsg({ type: 'err', text: `Erreur : ${err.message}` })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setTimeout(() => setMsg(null), 8000)
  }

  // ===== REMPLACEMENT TOTAL (vers Supabase) =====
  const importReplace = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('⚠️ ATTENTION : Ceci va REMPLACER toutes vos données actuelles par le contenu du fichier. Continuer ?')) { e.target.value=''; return }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        setMsg({ type: 'ok', text: 'Remplacement en cours...' })
        const result = await backup.restoreFromBackup(ev.target.result, 'replace')
        if (result.success) {
          setMsg({ type: 'ok', text: '✅ Remplacement total effectué ! Rechargement...' })
          setTimeout(() => window.location.reload(), 2000)
        } else {
          setMsg({ type: 'err', text: `Erreur: ${result.error}` })
        }
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
            <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded">
              <p className="text-[10px] text-gray-400">☁️ <strong className="text-emerald-400">Données stockées sur Supabase</strong> (serveur sécurisé). Exportez régulièrement un backup local par sécurité.</p>
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

        {/* SÉCURITÉ — Panneau complet de gestion des accès */}
        <div className="md:col-span-2">
          <Window title="Sécurité & Gestion des accès" icon={Shield}>
            <div className="p-5 space-y-6">

              {/* ─── Code entreprise (1er verrou) ─── */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lock size={16} className="text-rose" />
                  <h3 className="text-sm font-bold text-white">Code d'accès entreprise</h3>
                  <span className="text-[8px] px-2 py-0.5 rounded bg-rose/10 text-rose border border-rose/20">1er VERROU</span>
                </div>
                <div className="bg-bg-input border border-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="text-[9px] text-gray-500 uppercase mb-1 block">Code actuel</label>
                      <input
                        type="text"
                        id="codeEntreprise"
                        defaultValue={codeEntreprise}
                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded text-sm text-white font-mono uppercase tracking-widest"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const val = document.getElementById('codeEntreprise').value.trim()
                        if (val.length < 4) { setMsg({type:'err',text:'Le code doit faire au moins 4 caractères'}); return }
                        await setCodeEntreprise(val)
                        setMsg({type:'ok',text:'Code entreprise mis à jour : ' + val.toUpperCase()})
                        setTimeout(() => setMsg(null), 3000)
                      }}
                      className="h-10 px-5 bg-rose/10 hover:bg-rose/20 text-rose text-xs font-semibold rounded border border-rose/25 mt-4"
                    >
                      Modifier
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-600 mt-2">Ce code est demandé avant l'écran de connexion. Partagez-le uniquement avec vos collaborateurs autorisés.</p>
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* ─── Utilisateurs (2ème verrou) ─── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Key size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Comptes utilisateurs</h3>
                    <span className="text-[8px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">2ème VERROU</span>
                  </div>
                  <button
                    onClick={() => setNewUser({ email: '', password: '', nom: '', prenom: '', role: 'admin' })}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded border border-emerald-500/25"
                  >
                    <UserPlus size={12} />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {users.map(user => (
                    <div key={user.id} className="bg-bg-input border border-white/10 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                        {/* Nom */}
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Nom</label>
                          <input
                            type="text"
                            value={user.nom}
                            onChange={e => updateUser(user.id, { nom: e.target.value })}
                            className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white"
                          />
                        </div>
                        {/* Email */}
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Email</label>
                          <input
                            type="email"
                            value={user.email}
                            onChange={e => updateUser(user.id, { email: e.target.value })}
                            className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white"
                          />
                        </div>
                        {/* Mot de passe */}
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Mot de passe</label>
                          <div className="relative">
                            <input
                              type={showPasswords[user.id] ? 'text' : 'password'}
                              value={user.password}
                              onChange={e => updateUser(user.id, { password: e.target.value })}
                              className="w-full h-8 px-2 pr-8 bg-white/5 border border-white/10 rounded text-xs text-white font-mono"
                            />
                            <button
                              onClick={() => setShowPasswords(p => ({ ...p, [user.id]: !p[user.id] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                            >
                              {showPasswords[user.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                        </div>
                        {/* Rôle */}
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Rôle</label>
                          <select
                            value={user.role}
                            onChange={e => updateUser(user.id, { role: e.target.value })}
                            className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white"
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="ouvrier">🔧 Consultation</option>
                          </select>
                        </div>
                        {/* Supprimer */}
                        <div className="flex items-end">
                          {users.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer le compte de ${user.nom} ?`)) deleteUser(user.id)
                              }}
                              className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded border border-red-500/25 flex items-center space-x-1"
                            >
                              <Trash2 size={11} />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Formulaire nouvel utilisateur */}
                  {newUser && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                      <p className="text-xs font-bold text-emerald-400 mb-3">Nouveau compte</p>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Nom</label>
                          <input type="text" value={newUser.nom} onChange={e => setNewUser(n => ({...n, nom: e.target.value}))} placeholder="Nom" className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Email</label>
                          <input type="email" value={newUser.email} onChange={e => setNewUser(n => ({...n, email: e.target.value}))} placeholder="email@..." className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Mot de passe</label>
                          <input type="text" value={newUser.password} onChange={e => setNewUser(n => ({...n, password: e.target.value}))} placeholder="Min. 6 car." className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono" />
                        </div>
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase">Rôle</label>
                          <select value={newUser.role} onChange={e => setNewUser(n => ({...n, role: e.target.value}))} className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white">
                            <option value="admin">👑 Admin</option>
                            <option value="ouvrier">🔧 Consultation</option>
                          </select>
                        </div>
                        <div className="flex items-end space-x-2">
                          <button
                            onClick={async () => {
                              if (!newUser.email || !newUser.password || newUser.password.length < 6) {
                                setMsg({type:'err', text:'Email requis et mot de passe min. 6 caractères'})
                                return
                              }
                              await addUser(newUser)
                              setNewUser(null)
                              setMsg({type:'ok', text:'Compte créé avec succès !'})
                              setTimeout(() => setMsg(null), 3000)
                            }}
                            className="h-8 px-3 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded border border-emerald-500/30"
                          >
                            ✓ Créer
                          </button>
                          <button onClick={() => setNewUser(null)} className="h-8 px-3 bg-white/5 text-gray-400 text-xs rounded border border-white/10">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* ─── Info poseur ─── */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Accès poseur</h3>
                  <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">QR CODE</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-4">
                  <p className="text-xs text-emerald-400 font-medium mb-1">🔒 Accès séparé et isolé</p>
                  <p className="text-[9px] text-gray-400">Les poseurs accèdent uniquement à leur fiche chantier via le QR code imprimé sur le devis + leur code PIN personnel. Ils ne peuvent pas voir les devis, produits, prix ou paramètres.</p>
                </div>
              </div>

              {/* ─── Résumé sécurité ─── */}
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <p className="text-[9px] text-gray-500 uppercase font-semibold mb-2">Architecture de sécurité</p>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-rose/10 text-rose flex items-center justify-center text-[9px] font-bold border border-rose/20">1</span>
                    <span className="text-[10px] text-gray-300">Code entreprise → bloque les inconnus</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-[9px] font-bold border border-amber-500/20">2</span>
                    <span className="text-[10px] text-gray-300">Email + mot de passe → identifie l'utilisateur</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[9px] font-bold border border-emerald-500/20">3</span>
                    <span className="text-[10px] text-gray-300">Poseurs → QR code + PIN isolé (pas d'accès admin)</span>
                  </div>
                </div>
              </div>
            </div>
          </Window>
        </div>

        {/* VERSION */}
        <Window title="Version" icon={Settings}>
          <div className="p-5">
            <p className="text-sm text-gray-400 mb-3">F.Arbrum v7 — Supabase Cloud</p>
            <div className="space-y-1.5">
              {['Création de devis (7 étapes)','3 scénarios sol automatiques','Base de données Supabase (cloud)','Carte GPS avec recherche','PDF professionnel (logo transparent)','Main d\'œuvre auto-calculée','Restauration surface (terre + graine)','Calendrier de pose disponibilité','Ressources humaines & tarifs','Fiche technique annexe','Combinaison PDF multi-scénarios','Export / Import JSON → Supabase','Photos chantier cloud (1 Go)','Sauvegarde locale automatique','Double verrou sécurité'].map(t=>(
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
          <div className="p-5 space-y-3">
            <button onClick={() => {
              try { localStorage.clear() } catch(e) {}
              setMsg({type:'ok', text:'Cache local vidé.'})
              setTimeout(() => setMsg(null), 3000)
            }}
              className="w-full h-10 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold rounded border border-amber-500/25 flex items-center justify-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Vider le cache local</span>
            </button>
            <p className="text-[9px] text-gray-600">Vide le cache navigateur. Les données Supabase ne sont pas affectées.</p>
          </div>
        </Window>
      </div>
    </div>
  )
}
