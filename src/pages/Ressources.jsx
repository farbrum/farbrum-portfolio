import { useState, useMemo } from 'react'
import { useProductStore, ENGINS } from '../store/productStore'
import { useAuthStore } from '../store/authStore'
import Window from '../components/Window'
import { Users, Plus, Trash2, Edit3, Calendar, Save, X, AlertTriangle, ChevronLeft, ChevronRight, Truck, HardHat, Settings } from 'lucide-react'

const inp = "w-full h-9 px-3 bg-bg-input border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose transition-all"
const lbl = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
const COMPETENCES = ['excavation','transport','pose','tuyauterie','collage','remblai','livraison']
const NOMS_MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function getJoursFeries(annee) {
  const a=annee%19,b=Math.floor(annee/100),c=annee%100
  const d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25)
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30
  const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7
  const m=Math.floor((a+11*h+22*l)/451)
  const mois=Math.floor((h+l-7*m+114)/31)-1, jour=(h+l-7*m+114)%31+1
  const paques = new Date(annee, mois, jour)
  const lundiPaques = new Date(paques); lundiPaques.setDate(paques.getDate()+1)
  const ascension = new Date(paques); ascension.setDate(paques.getDate()+39)
  const lundiPentecote = new Date(paques); lundiPentecote.setDate(paques.getDate()+50)
  const fmt = dt => dt.toISOString().split('T')[0]
  return [`${annee}-01-01`,fmt(lundiPaques),`${annee}-05-01`,`${annee}-05-08`,fmt(ascension),fmt(lundiPentecote),`${annee}-07-14`,`${annee}-08-15`,`${annee}-11-01`,`${annee}-11-11`,`${annee}-12-25`]
}
const JOURS_COURT = ['Lu','Ma','Me','Je','Ve','Sa','Di']

function AgendaCalendar({ indisponibilites = [], reservations = [], onToggle }) {
  const now = new Date()
  const [mois, setMois] = useState(now.getMonth())
  const [annee, setAnnee] = useState(now.getFullYear())
  const prevM = () => { if (mois === 0) { setMois(11); setAnnee(a => a - 1) } else setMois(m => m - 1) }
  const nextM = () => { if (mois === 11) { setMois(0); setAnnee(a => a + 1) } else setMois(m => m + 1) }
  const feries = useMemo(() => getJoursFeries(annee), [annee])
  const firstDay = new Date(annee, mois, 1).getDay()
  const nbDays = new Date(annee, mois + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const todayStr = new Date().toISOString().split('T')[0]
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= nbDays; d++) cells.push(d)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevM} className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-bold text-white">{NOMS_MOIS[mois]} {annee}</span>
        <button onClick={nextM} className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">{JOURS_COURT.map(j => (<div key={j} className="text-center text-[9px] font-bold text-gray-600 py-1">{j}</div>))}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="h-8" />
          const dt = new Date(annee, mois, d)
          const ds = dt.toISOString().split('T')[0]
          const dow = dt.getDay()
          const isDimanche = dow === 0, isSamedi = dow === 6, isFerie = feries.includes(ds)
          const isToday = ds === todayStr, inList = indisponibilites.includes(ds), isReserved = reservations.includes(ds)
          const isClosedDefault = isSamedi || isFerie
          const isIndispo = isClosedDefault ? !inList : inList
          let bg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer'
          if (isDimanche) bg = 'bg-white/5 border-white/10 text-gray-700 cursor-not-allowed'
          else if (isReserved) bg = 'bg-rose/15 border-rose/25 text-rose cursor-not-allowed'
          else if (isIndispo) bg = 'bg-red-500/15 border-red-500/20 text-red-400 hover:bg-red-500/25 cursor-pointer'
          return (<button key={i} disabled={isDimanche||isReserved} onClick={()=>!isDimanche&&!isReserved&&onToggle(ds)} className={`h-8 rounded border text-[10px] font-bold flex items-center justify-center transition-all ${bg} ${isToday?'ring-1 ring-white/30':''}`}>{d}</button>)
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/20" /><span className="text-[8px] text-gray-500">Disponible</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/15 border border-red-500/20" /><span className="text-[8px] text-gray-500">Indispo / Fermé</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white/5 border border-white/10" /><span className="text-[8px] text-gray-500">Dimanche</span></div>
      </div>
    </div>
  )
}

function RessourceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { nom:'',role:'pelleur',tarifJournalier:280,tarifHoraire:35,telephone:'',competences:['excavation','pose'] })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const toggleComp = (c) => setForm(f=>({...f,competences:f.competences.includes(c)?f.competences.filter(x=>x!==c):[...f.competences,c]}))
  const ROLES = [{id:'pelleur',nom:'Pelleur / Conducteur engin'},{id:'chauffeur',nom:'Chauffeur PL / Tracteur'},{id:'poseur',nom:'Poseur / Tuyauteur'},{id:'chef',nom:'Chef de chantier'},{id:'manoeuvre',nom:'Manœuvre'}]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Nom complet</label><input value={form.nom} onChange={e=>set('nom',e.target.value)} className={inp} placeholder="Ex: Jean Dupont" /></div>
        <div><label className={lbl}>Rôle</label><select value={form.role} onChange={e=>set('role',e.target.value)} className={inp}>{ROLES.map(r=><option key={r.id} value={r.id}>{r.nom}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Tarif journalier (€)</label><input type="number" value={form.tarifJournalier} onChange={e=>set('tarifJournalier',parseFloat(e.target.value)||0)} className={inp} /></div>
        <div><label className={lbl}>Tarif horaire (€)</label><input type="number" value={form.tarifHoraire} onChange={e=>set('tarifHoraire',parseFloat(e.target.value)||0)} className={inp} /></div>
        <div><label className={lbl}>Téléphone</label><input value={form.telephone||''} onChange={e=>set('telephone',e.target.value)} className={inp} placeholder="06..." /></div>
      </div>
      <div>
        <label className={lbl}>Compétences</label>
        <div className="flex flex-wrap gap-1.5">{COMPETENCES.map(c=>(<button key={c} type="button" onClick={()=>toggleComp(c)} className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${form.competences.includes(c)?'bg-rose/20 text-rose border-rose/30':'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}>{c}</button>))}</div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-8 px-4 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded"><X className="w-3 h-3 inline mr-1"/>Annuler</button>
        <button type="button" onClick={()=>{if(!form.nom.trim())return alert('Nom requis');onSave(form)}} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded flex items-center gap-1.5"><Save className="w-3 h-3"/>Enregistrer</button>
      </div>
    </div>
  )
}

function RessourceCard({ressource,onEdit,onDelete,onSelectCalendar,isSelected}) {
  const nbIndispo = (ressource.indisponibilites||[]).length
  const RL={pelleur:'🚜 Pelleur',chauffeur:'🚛 Chauffeur',poseur:'🔧 Poseur',chef:'👷 Chef',manoeuvre:'🧤 Manœuvre'}
  const RC={pelleur:'text-amber-400',chauffeur:'text-blue-400',poseur:'text-emerald-400',chef:'text-rose',manoeuvre:'text-gray-300'}
  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isSelected?'border-rose/40 bg-rose/5':'border-white/5 bg-bg-card hover:border-white/10'}`}>
      <div className="p-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold ${RC[ressource.role]||'text-white'}`}>{RL[ressource.role]||ressource.role}</span>
          <p className="text-sm font-medium text-white truncate mt-0.5">{ressource.nom}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-gray-500">💰 {ressource.tarifJournalier}€/j</span>
            <span className="text-[10px] text-gray-500">⏱ {ressource.tarifHoraire}€/h</span>
            {ressource.telephone&&<span className="text-[10px] text-gray-500">📱 {ressource.telephone}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">{(ressource.competences||[]).map(c=>(<span key={c} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] text-gray-400 font-medium">{c}</span>))}</div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={()=>onSelectCalendar(ressource.id)} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${isSelected?'bg-rose/20 text-rose':'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}><Calendar className="w-3.5 h-3.5"/></button>
          <button onClick={()=>onEdit(ressource)} className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"><Edit3 className="w-3.5 h-3.5"/></button>
          <button onClick={()=>onDelete(ressource.id)} className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
      </div>
      <div className="h-7 bg-black/20 border-t border-white/5 px-3 flex items-center justify-between">
        <span className="text-[9px] text-gray-600">{nbIndispo>0?`${nbIndispo} jour${nbIndispo>1?'s':''} bloqué${nbIndispo>1?'s':''}`:'\u2705 Aucune indisponibilité'}</span>
        {isSelected&&<span className="text-[9px] text-rose font-bold">▼ Agenda ouvert</span>}
      </div>
    </div>
  )
}

// ===== SECTION ENGINS =====
function EnginsSection() {
  const { enginsData, updateEngin, addEngin, deleteEngin, toggleEnginIndispo, tarifsChantier } = useProductStore()
  const [editId, setEditId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({})
  const [calendarId, setCalendarId] = useState(null)
  const prixGasoil = tarifsChantier?.prixGasoilL || 1.80

  const startEdit = (e) => { setEditId(e.id); setForm({...e}); setAdding(false) }
  const startAdd = () => { setAdding(true); setEditId(null); setForm({nom:'',rendementM3h:5,coutHoraire:35,consommationLH:6,deplacement:150}) }
  const cancelEdit = () => { setEditId(null); setAdding(false); setForm({}) }
  const saveEdit = () => {
    if (!form.nom?.trim()) return alert('Nom requis')
    const data = { nom:form.nom, rendementM3h:parseFloat(form.rendementM3h)||0, coutHoraire:parseFloat(form.coutHoraire)||0, consommationLH:parseFloat(form.consommationLH)||0, deplacement:parseFloat(form.deplacement)||0 }
    if (adding) { addEngin(data); setAdding(false) }
    else if (editId) { updateEngin(editId, data); setEditId(null) }
    setForm({})
  }
  const handleDelete = (id) => { if(confirm('Supprimer cet engin ?')) deleteEngin(id) }
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const calendarEngin = calendarId ? enginsData.find(e=>e.id===calendarId) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white flex items-center gap-2"><HardHat className="w-4 h-4 text-amber-400"/> Engins de terrassement</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Rendement en terre, coût horaire location, consommation gasoil, forfait déplacement</p>
        </div>
        {!adding&&!editId&&<button onClick={startAdd} className="h-8 px-4 bg-amber-500 text-white text-xs font-semibold rounded flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/> Ajouter</button>}
      </div>

      {(adding||editId)&&(
        <Window title={adding?'➕ Nouvel engin':`✏️ ${form.nom}`}>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Nom de l'engin</label><input value={form.nom||''} onChange={e=>set('nom',e.target.value)} className={inp} placeholder="Ex: Pelle 8t"/></div>
              <div><label className={lbl}>Rendement (m³/h en terre)</label><input type="number" step="0.5" value={form.rendementM3h||''} onChange={e=>set('rendementM3h',e.target.value)} className={inp}/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Coût horaire location (€/h)</label><input type="number" step="1" value={form.coutHoraire||''} onChange={e=>set('coutHoraire',e.target.value)} className={inp}/></div>
              <div><label className={lbl}>Consommation gasoil (L/h)</label><input type="number" step="0.5" value={form.consommationLH||''} onChange={e=>set('consommationLH',e.target.value)} className={inp}/></div>
              <div><label className={lbl}>Forfait déplacement (€)</label><input type="number" step="10" value={form.deplacement||''} onChange={e=>set('deplacement',e.target.value)} className={inp}/></div>
            </div>
            <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded">
              <p className="text-[10px] text-amber-400 font-semibold mb-1">📊 Aperçu coût pour 1 journée (8h en terre) :</p>
              <p className="text-[10px] text-gray-400">
                Location: <strong className="text-white">{((parseFloat(form.coutHoraire)||0)*8).toFixed(0)}€</strong> · 
                Gasoil: <strong className="text-white">{((parseFloat(form.consommationLH)||0)*8*prixGasoil).toFixed(0)}€</strong> · 
                Dépl: <strong className="text-white">{(parseFloat(form.deplacement)||0).toFixed(0)}€</strong> → 
                <strong className="text-amber-300 ml-1">
                  Total journée: {((parseFloat(form.coutHoraire)||0)*8 + (parseFloat(form.consommationLH)||0)*8*prixGasoil + (parseFloat(form.deplacement)||0)).toFixed(0)}€
                </strong>
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Volume excavé/jour (terre): <strong className="text-emerald-400">{((parseFloat(form.rendementM3h)||0)*8).toFixed(0)} m³</strong> · 
                Mixte (×2.5): <strong className="text-amber-300">{((parseFloat(form.rendementM3h)||0)/2.5*8).toFixed(0)} m³</strong> · 
                Roche (×6.5): <strong className="text-red-400">{((parseFloat(form.rendementM3h)||0)/6.5*8).toFixed(0)} m³</strong>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={cancelEdit} className="h-8 px-4 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded"><X className="w-3 h-3 inline mr-1"/>Annuler</button>
              <button onClick={saveEdit} className="h-8 px-4 bg-amber-500 text-white text-xs font-semibold rounded flex items-center gap-1.5"><Save className="w-3 h-3"/>Enregistrer</button>
            </div>
          </div>
        </Window>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {enginsData.map(e=>(
          <div key={e.id} className={`border rounded-lg overflow-hidden transition-all ${calendarId===e.id?'border-amber-500/40 bg-amber-500/5':'border-white/5 bg-bg-card hover:border-white/10'}`}>
            <div className="p-3 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-400">{e.nom}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <span className="text-[10px] text-gray-400">⛏️ Rendement: <strong className="text-white">{e.rendementM3h} m³/h</strong></span>
                  <span className="text-[10px] text-gray-400">💰 Location: <strong className="text-white">{e.coutHoraire}€/h</strong></span>
                  <span className="text-[10px] text-gray-400">⛽ Gasoil: <strong className="text-white">{e.consommationLH} L/h</strong> ({(e.consommationLH*prixGasoil).toFixed(1)}€/h)</span>
                  <span className="text-[10px] text-gray-400">🚚 Dépl: <strong className="text-white">{e.deplacement}€</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button onClick={()=>setCalendarId(prev=>prev===e.id?null:e.id)} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${calendarId===e.id?'bg-amber-500/20 text-amber-400':'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}><Calendar className="w-3.5 h-3.5"/></button>
                <button onClick={()=>startEdit(e)} className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"><Edit3 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>handleDelete(e.id)} className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
            <div className="h-7 bg-black/20 border-t border-white/5 px-3 flex items-center">
              <span className="text-[9px] text-gray-600">
                Journée 8h terre: <strong className="text-amber-400/70">{(e.coutHoraire*8+e.consommationLH*8*prixGasoil+e.deplacement).toFixed(0)}€</strong> · 
                Vol/jour: <strong className="text-emerald-400/70">{(e.rendementM3h*8).toFixed(0)} m³</strong> terre · <strong className="text-amber-300/70">{(e.rendementM3h/2.5*8).toFixed(0)} m³</strong> mixte · <strong className="text-red-400/70">{(e.rendementM3h/6.5*8).toFixed(0)} m³</strong> roche
              </span>
            </div>
          </div>
        ))}
      </div>

      {calendarEngin&&(
        <Window title={`📅 Disponibilité : ${calendarEngin.nom}`}>
          <div className="p-5">
            <div className="mb-3 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded">
              <p className="text-[10px] text-gray-400">👆 <strong className="text-amber-400">Cliquez sur un jour</strong> pour bloquer/libérer l'engin.</p>
            </div>
            <AgendaCalendar indisponibilites={calendarEngin.indisponibilites||[]} reservations={[]} onToggle={(dateStr)=>toggleEnginIndispo(calendarEngin.id,dateStr)}/>
          </div>
        </Window>
      )}
    </div>
  )
}

// ===== SECTION VÉHICULES =====
function VehiculesSection() {
  const { vehicules, addVehicule, updateVehicule, deleteVehicule } = useProductStore()
  const [editId, setEditId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({})
  const startEdit = (v) => { setEditId(v.id); setForm({...v}); setAdding(false) }
  const startAdd = () => { setAdding(true); setEditId(null); setForm({nom:'',ptac:10,poidsVide:5,capaciteM3:6,vitesseKmh:45,prixKm:1.8}) }
  const cancelEdit = () => { setEditId(null); setAdding(false); setForm({}) }
  const saveEdit = () => {
    if (!form.nom?.trim()) return alert('Nom requis')
    const data = { nom:form.nom, ptac:parseFloat(form.ptac)||0, poidsVide:parseFloat(form.poidsVide)||0, capaciteM3:parseFloat(form.capaciteM3)||0, vitesseKmh:parseFloat(form.vitesseKmh)||45, prixKm:parseFloat(form.prixKm)||0 }
    if (adding) { addVehicule(data); setAdding(false) }
    else if (editId) { updateVehicule(editId, data); setEditId(null) }
    setForm({})
  }
  const handleDelete = (id) => { if(confirm('Supprimer ce véhicule ?')) deleteVehicule(id) }
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white flex items-center gap-2"><Truck className="w-4 h-4 text-blue-400"/> Véhicules de transport</p>
          <p className="text-[10px] text-gray-500 mt-0.5">PTAC, charge utile, capacité m³, vitesse moyenne, prix/km</p>
        </div>
        {!adding&&!editId&&<button onClick={startAdd} className="h-8 px-4 bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/> Ajouter</button>}
      </div>

      {(adding||editId)&&(
        <Window title={adding?'➕ Nouveau véhicule':`✏️ ${form.nom}`}>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Nom</label><input value={form.nom||''} onChange={e=>set('nom',e.target.value)} className={inp}/></div>
              <div><label className={lbl}>Vitesse moyenne (km/h)</label><input type="number" value={form.vitesseKmh||''} onChange={e=>set('vitesseKmh',e.target.value)} className={inp}/></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div><label className={lbl}>PTAC (t)</label><input type="number" step="0.5" value={form.ptac||''} onChange={e=>set('ptac',e.target.value)} className={inp}/></div>
              <div><label className={lbl}>Poids vide (t)</label><input type="number" step="0.5" value={form.poidsVide||''} onChange={e=>set('poidsVide',e.target.value)} className={inp}/></div>
              <div><label className={lbl}>Capacité (m³)</label><input type="number" step="1" value={form.capaciteM3||''} onChange={e=>set('capaciteM3',e.target.value)} className={inp}/></div>
              <div><label className={lbl}>Prix (€/km)</label><input type="number" step="0.1" value={form.prixKm||''} onChange={e=>set('prixKm',e.target.value)} className={inp}/></div>
            </div>
            <div className="p-2.5 bg-blue-500/5 border border-blue-500/15 rounded">
              <p className="text-[10px] text-blue-400">Charge utile : <strong className="text-white">{((parseFloat(form.ptac)||0)-(parseFloat(form.poidsVide)||0)).toFixed(1)}t</strong> · Coût A/R 30km : <strong className="text-white">{((parseFloat(form.prixKm)||0)*60).toFixed(0)}€</strong></p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={cancelEdit} className="h-8 px-4 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded"><X className="w-3 h-3 inline mr-1"/>Annuler</button>
              <button onClick={saveEdit} className="h-8 px-4 bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1.5"><Save className="w-3 h-3"/>Enregistrer</button>
            </div>
          </div>
        </Window>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {vehicules.map(v=>(
          <div key={v.id} className="border border-white/5 bg-bg-card hover:border-white/10 rounded-lg overflow-hidden transition-all">
            <div className="p-3 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-400">{v.nom}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <span className="text-[10px] text-gray-400">⚖️ PTAC: <strong className="text-white">{v.ptac}t</strong> (CU: {(v.ptac-v.poidsVide).toFixed(1)}t)</span>
                  <span className="text-[10px] text-gray-400">📦 Capacité: <strong className="text-white">{v.capaciteM3} m³</strong></span>
                  <span className="text-[10px] text-gray-400">🚗 Vitesse: <strong className="text-white">{v.vitesseKmh} km/h</strong></span>
                  <span className="text-[10px] text-gray-400">💶 Prix: <strong className="text-white">{v.prixKm}€/km</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button onClick={()=>startEdit(v)} className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"><Edit3 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>handleDelete(v.id)} className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== SECTION TARIFS =====
function TarifsSection() {
  const { tarifsChantier, updateTarifsChantier, tarifsMateriaux, updateTarifs } = useProductStore()
  const tc = tarifsChantier||{}
  const tm = tarifsMateriaux||{}
  const setTC = (k,v) => updateTarifsChantier({[k]:parseFloat(v)||0})
  const setTM = (k,v) => updateTarifs({[k]:parseFloat(v)||0})
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-emerald-400"/> Paramètres globaux chantier</p>
      <Window title="⛽ Carburant & Déplacement opérateur">
        <div className="p-4 grid grid-cols-3 gap-3">
          <div><label className={lbl}>Prix gasoil (€/L)</label><input type="number" step="0.01" value={tc.prixGasoilL||''} onChange={e=>setTC('prixGasoilL',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Forfait départ opérateur (€)</label><input type="number" step="5" value={tc.forfaitDepartOperateur||''} onChange={e=>setTC('forfaitDepartOperateur',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Prix km opérateur (€/km)</label><input type="number" step="0.05" value={tc.prixKmOperateur||''} onChange={e=>setTC('prixKmOperateur',e.target.value)} className={inp}/></div>
        </div>
      </Window>
      <Window title="🚛 Temps chargement / attente">
        <div className="p-4 grid grid-cols-2 gap-3">
          <div><label className={lbl}>Temps chargement (min/voyage)</label><input type="number" value={tc.tempsChargementMin||''} onChange={e=>setTC('tempsChargementMin',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Temps déchargement (min/voyage)</label><input type="number" value={tc.tempsDechargementMin||''} onChange={e=>setTC('tempsDechargementMin',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Attente mortier chantier (min)</label><input type="number" value={tc.tempsAttenteChantierMortierMin||''} onChange={e=>setTC('tempsAttenteChantierMortierMin',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Attente livraison matériaux (min)</label><input type="number" value={tc.tempsAttenteLivraisonMin||''} onChange={e=>setTC('tempsAttenteLivraisonMin',e.target.value)} className={inp}/></div>
        </div>
      </Window>
      <Window title="📐 Coefficients & Matériaux">
        <div className="p-4 grid grid-cols-3 gap-3">
          <div><label className={lbl}>Coeff. foisonnement</label><input type="number" step="0.1" value={tc.coeffFoisonnement||''} onChange={e=>setTC('coeffFoisonnement',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Densité mortier (t/m³)</label><input type="number" step="0.1" value={tc.densiteMortier||''} onChange={e=>setTC('densiteMortier',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Heures/jour chantier</label><input type="number" step="1" value={tc.heuresJourChantier||''} onChange={e=>setTC('heuresJourChantier',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Mortier (€/m³)</label><input type="number" step="5" value={tm.mortierM3||''} onChange={e=>setTM('mortierM3',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>PVC (€/ml)</label><input type="number" step="1" value={tm.pvcMl||''} onChange={e=>setTM('pvcMl',e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Coude PVC (€)</label><input type="number" step="1" value={tm.coudePVC||''} onChange={e=>setTM('coudePVC',e.target.value)} className={inp}/></div>
        </div>
      </Window>
    </div>
  )
}

// ===== PAGE PRINCIPALE =====
export default function Ressources() {
  const { user } = useAuthStore()
  const { ressources, addRessource, updateRessource, deleteRessource, toggleRessourceIndispo } = useProductStore()
  const [tab, setTab] = useState('personnel')
  const [mode, setMode] = useState('list')
  const [editTarget, setEditTarget] = useState(null)
  const [selectedCalId, setSelectedCalId] = useState(null)

  if (user?.role !== 'admin') {
    return (<Window title="Accès refusé"><div className="p-8 text-center"><AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2"/><p className="text-sm text-gray-400">Réservé aux administrateurs.</p></div></Window>)
  }

  const resList = ressources||[]
  const selectedRess = selectedCalId ? resList.find(r=>r.id===selectedCalId) : null
  const handleAdd = (data) => { addRessource(data); setMode('list') }
  const handleEdit = (data) => { if(editTarget) updateRessource(editTarget.id,data); setMode('list'); setEditTarget(null) }
  const handleDelete = (id) => { if(confirm('Supprimer cette ressource ?')) { deleteRessource(id); if(selectedCalId===id) setSelectedCalId(null) } }
  const handleStartEdit = (r) => { setEditTarget(r); setMode('edit') }
  const handleToggleCal = (id) => { setSelectedCalId(prev=>prev===id?null:id) }

  const TABS = [
    {id:'personnel',label:'👷 Personnel'},
    {id:'engins',label:'🏗️ Engins'},
    {id:'vehicules',label:'🚛 Véhicules'},
    {id:'tarifs',label:'⚙️ Tarifs'},
  ]

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-rose"/> Ressources & Configuration</h1>
      <div className="flex gap-1 bg-bg-card border border-white/5 rounded-lg p-1">
        {TABS.map(t=>(<button key={t.id} onClick={()=>{setTab(t.id);setMode('list');setEditTarget(null)}} className={`flex-1 h-9 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${tab===t.id?'bg-white/10 text-white':'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{t.label}</button>))}
      </div>

      {tab==='personnel'&&(
        <>
          <div className="grid grid-cols-4 gap-3">
            {[{l:'Total',v:resList.length,c:'text-rose'},{l:'Pelleurs',v:resList.filter(r=>r.role==='pelleur').length,c:'text-amber-400'},{l:'Chauffeurs',v:resList.filter(r=>r.role==='chauffeur').length,c:'text-blue-400'},{l:'Poseurs',v:resList.filter(r=>r.role==='poseur'||r.role==='manoeuvre'||r.role==='chef').length,c:'text-emerald-400'}].map(s=>(
              <div key={s.l} className="bg-bg-card border border-white/5 rounded-lg p-3 text-center"><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p><p className="text-[9px] text-gray-500 uppercase">{s.l}</p></div>
            ))}
          </div>
          {mode==='list'&&<div className="flex justify-end"><button onClick={()=>setMode('add')} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-[0_0_12px_rgba(200,80,155,0.2)]"><Plus className="w-3.5 h-3.5"/> Ajouter</button></div>}
          {mode==='add'&&<Window title="➕ Nouvelle ressource"><div className="p-5"><RessourceForm onSave={handleAdd} onCancel={()=>setMode('list')}/></div></Window>}
          {mode==='edit'&&editTarget&&<Window title={`✏️ Modifier : ${editTarget.nom}`}><div className="p-5"><RessourceForm initial={editTarget} onSave={handleEdit} onCancel={()=>{setMode('list');setEditTarget(null)}}/></div></Window>}
          <div className="grid md:grid-cols-2 gap-3">
            {resList.map(r=>(<RessourceCard key={r.id} ressource={r} onEdit={handleStartEdit} onDelete={handleDelete} onSelectCalendar={handleToggleCal} isSelected={selectedCalId===r.id}/>))}
            {resList.length===0&&<div className="col-span-2 text-center py-12"><Users className="w-12 h-12 text-gray-700 mx-auto mb-3"/><p className="text-sm text-gray-500">Aucune ressource</p></div>}
          </div>
          {selectedRess&&(
            <Window title={`📅 Agenda de ${selectedRess.nom}`}>
              <div className="p-5">
                <div className="mb-3 p-2.5 bg-rose/5 border border-rose/15 rounded"><p className="text-[10px] text-gray-400">👆 <strong className="text-rose">Cliquez</strong> pour basculer disponible/indisponible.</p></div>
                <AgendaCalendar indisponibilites={selectedRess.indisponibilites||[]} reservations={[]} onToggle={(ds)=>toggleRessourceIndispo(selectedRess.id,ds)}/>
                {(selectedRess.indisponibilites||[]).length>0&&(
                  <div className="mt-3 p-2.5 bg-red-500/5 border border-red-500/15 rounded">
                    <p className="text-[10px] text-gray-400 mb-1">🔴 Jours indisponibles :</p>
                    <div className="flex flex-wrap gap-1">{[...(selectedRess.indisponibilites||[])].sort().map(d=>(<span key={d} className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400">{new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>))}</div>
                  </div>
                )}
              </div>
            </Window>
          )}
        </>
      )}

      {tab==='engins'&&<EnginsSection/>}
      {tab==='vehicules'&&<VehiculesSection/>}
      {tab==='tarifs'&&<TarifsSection/>}
    </div>
  )
}
