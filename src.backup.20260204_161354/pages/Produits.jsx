import { useState, useRef } from 'react'
import { useProductStore, GROUPES_CATEGORIES, TYPES_CATEGORIE, MATERIAUX, TYPES_CUVE, calcVolumeFouilleProduit, calcPoidsTotal } from '../store/productStore'
import { Plus, Pencil, Trash2, X, Check, Package, Layers, Truck, Search, FileText, Users, Upload, File as FileIcon, ChevronDown, ChevronUp } from 'lucide-react'
import Window from '../components/Window'

// ---- UI ----
function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-rose shadow-[0_0_40px_rgba(200,80,155,0.15)]">
        <div className="sticky top-0 z-10 h-9 bg-bg-card border-b border-rose/40 flex items-center justify-between px-3">
          <span className="text-xs font-semibold text-gray-300">{title}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-rose"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-bg-card p-5">{children}</div>
      </div>
    </div>
  )
}

const inp = "w-full h-9 px-3 bg-bg-input border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose transition-all"
const lbl = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1"

function Field({label,type='text',value,onChange,placeholder,step,min,suffix,textarea,select,options,disabled}) {
  return (
    <div>
      {label && <label className={lbl}>{label}</label>}
      <div className="relative">
        {select ? (
          <select value={value||''} onChange={e=>onChange(e.target.value)} className={inp} disabled={disabled}>
            <option value="">Sélectionner...</option>
            {(options||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : textarea ? (
          <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} className={inp+' h-auto py-2'} />
        ) : (
          <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} step={step} min={min} disabled={disabled}
            className={inp+(suffix?' pr-14':'')+(disabled?' opacity-50':'')} />
        )}
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">{suffix}</span>}
      </div>
    </div>
  )
}

function Btn({children,onClick,variant='primary',className=''}) {
  const cls = variant==='primary'?'bg-rose hover:bg-rose-light text-white shadow-[0_0_12px_rgba(200,80,155,0.15)]':variant==='ghost'?'text-gray-500 hover:text-white hover:bg-white/5':'text-gray-500 hover:text-red-400 hover:bg-red-500/5'
  return <button type="button" onClick={onClick} className={`h-8 px-3 text-xs font-semibold rounded transition-all flex items-center space-x-1.5 ${cls} ${className}`}>{children}</button>
}

function Empty({label,onAdd}) {
  return <div className="py-10 text-center"><Package className="w-7 h-7 text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-500 mb-2">Aucun {label}.</p><button onClick={onAdd} className="text-xs text-rose font-medium"><Plus className="w-3 h-3 inline mr-1"/>Ajouter</button></div>
}

function Info({children}) { return <div className="bg-rose/5 border border-rose/15 rounded p-2.5 text-[10px] text-gray-400">{children}</div> }

// ---- TABS ----
const TABS = [
  {id:'categories',label:'Catégories',icon:Layers},
  {id:'fournisseurs',label:'Fournisseurs',icon:Users},
  {id:'produits',label:'Produits',icon:Package},
  {id:'vehicules',label:'Véhicules',icon:Truck},
]

export default function Produits() {
  const [tab, setTab] = useState('categories')
  const [search, setSearch] = useState('')
  return (
    <div className="space-y-4">
      <div><h1 className="font-display text-xl font-bold text-white">Base de données</h1><p className="text-xs text-gray-500 mt-0.5">Catégories → Fournisseurs → Produits</p></div>
      <Window title="Navigation"><div className="flex p-1 flex-wrap gap-1">
        {TABS.map(t=>(<button key={t.id} onClick={()=>{setTab(t.id);setSearch('')}} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${tab===t.id?'bg-rose text-white shadow-[0_0_10px_rgba(200,80,155,0.2)]':'text-gray-500 hover:text-white hover:bg-white/5'}`}><t.icon className="w-3.5 h-3.5"/><span>{t.label}</span></button>))}
      </div></Window>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-3 bg-bg-card border border-rose/15 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose/40"/>
      </div>
      {tab==='categories'&&<CategoriesTab search={search}/>}
      {tab==='fournisseurs'&&<FournisseursTab search={search}/>}
      {tab==='produits'&&<ProduitsTab search={search}/>}
      {tab==='vehicules'&&<VehiculesTab search={search}/>}
    </div>
  )
}

// ========== CATEGORIES ==========
function CategoriesTab({search}) {
  const {categories,getCategoriesSorted,addCategorie,updateCategorie,deleteCategorie,produits,fournisseurs} = useProductStore()
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({nom:'',typeCategorie:'cuve',groupeId:'assainissement',description:''})
  const sorted=getCategoriesSorted().filter(c=>c.nom.toLowerCase().includes(search.toLowerCase()))
  const grouped={}; sorted.forEach(c=>{const g=c.groupeId||'divers';if(!grouped[g])grouped[g]=[];grouped[g].push(c)})
  const openAdd=()=>{setForm({nom:'',typeCategorie:'cuve',groupeId:'assainissement',description:''});setModal('add')}
  const openEdit=(c)=>{setForm({nom:c.nom,typeCategorie:c.typeCategorie||'autre',groupeId:c.groupeId||'divers',description:c.description||''});setModal(c)}
  const save=()=>{if(!form.nom.trim())return;modal==='add'?addCategorie(form):updateCategorie(modal.id,form);setModal(null)}
  return (<>
    <Window title={`Catégories (${sorted.length})`} icon={Layers}><div className="p-3">
      <div className="flex justify-end mb-3"><Btn onClick={openAdd}><Plus className="w-3 h-3"/><span>Ajouter</span></Btn></div>
      {sorted.length===0?<Empty label="catégorie" onAdd={openAdd}/>:(
        <div className="space-y-4">{GROUPES_CATEGORIES.map(g=>{const cats=grouped[g.id];if(!cats?.length)return null;return(
          <div key={g.id}><p className="text-[10px] font-bold text-rose uppercase tracking-widest mb-1.5 px-1">{g.nom}</p><div className="space-y-1">{cats.map(c=>{
            const nbP=produits.filter(p=>p.categorieId===c.id).length;const tl=TYPES_CATEGORIE.find(t=>t.id===c.typeCategorie)?.nom||'?'
            return(<div key={c.id} className="flex items-center justify-between px-3 py-2 rounded bg-bg-input border border-white/5 hover:border-rose/20 transition-all">
              <div><div className="flex items-center space-x-2"><span className="text-sm font-medium text-white">{c.nom}</span><span className="px-1.5 py-0.5 bg-white/5 text-gray-400 rounded text-[9px] font-bold">{tl}</span></div><p className="text-[10px] text-gray-500">{nbP} produit(s)</p></div>
              <div className="flex space-x-1"><Btn variant="ghost" onClick={()=>openEdit(c)}><Pencil className="w-3 h-3"/></Btn><Btn variant="danger" onClick={()=>{if(confirm('Supprimer ?'))deleteCategorie(c.id)}}><Trash2 className="w-3 h-3"/></Btn></div>
            </div>)})}</div></div>)})}</div>
      )}
    </div></Window>
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='add'?'Nouvelle catégorie':'Modifier'}>
      <div className="space-y-3">
        <Field label="Nom *" value={form.nom} onChange={v=>setForm({...form,nom:v})} placeholder="Ex: Microstations"/>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Type *" value={form.typeCategorie} onChange={v=>setForm({...form,typeCategorie:v})} select options={TYPES_CATEGORIE.map(t=>({value:t.id,label:t.nom}))}/>
          <Field label="Groupe *" value={form.groupeId} onChange={v=>setForm({...form,groupeId:v})} select options={GROUPES_CATEGORIES.map(g=>({value:g.id,label:g.nom}))}/>
        </div>
        <Info><strong className="text-gray-300">Type «{TYPES_CATEGORIE.find(t=>t.id===form.typeCategorie)?.nom}»:</strong> {TYPES_CATEGORIE.find(t=>t.id===form.typeCategorie)?.description}</Info>
        <Field label="Description" value={form.description} onChange={v=>setForm({...form,description:v})} textarea placeholder="Optionnel..."/>
        <div className="flex justify-end space-x-2 pt-2"><Btn variant="ghost" onClick={()=>setModal(null)}>Annuler</Btn><Btn onClick={save}><Check className="w-3 h-3"/><span>OK</span></Btn></div>
      </div>
    </Modal>
  </>)
}

// ========== FOURNISSEURS ==========
function FournisseursTab({search}) {
  const {fournisseurs,categories,getCategoriesSorted,addFournisseur,updateFournisseur,deleteFournisseur}=useProductStore()
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({nom:'',contact:'',telephone:'',email:'',categorieIds:[],notes:''})
  const filtered=fournisseurs.filter(f=>f.nom.toLowerCase().includes(search.toLowerCase()))
  const openAdd=()=>{setForm({nom:'',contact:'',telephone:'',email:'',categorieIds:[],notes:''});setModal('add')}
  const openEdit=(f)=>{setForm({nom:f.nom,contact:f.contact||'',telephone:f.telephone||'',email:f.email||'',categorieIds:f.categorieIds||[],notes:f.notes||''});setModal(f)}
  const save=()=>{if(!form.nom.trim())return;modal==='add'?addFournisseur(form):updateFournisseur(modal.id,form);setModal(null)}
  const toggleCat=(id)=>setForm(f=>({...f,categorieIds:f.categorieIds.includes(id)?f.categorieIds.filter(x=>x!==id):[...f.categorieIds,id]}))
  return (<>
    <Window title={`Fournisseurs (${filtered.length})`} icon={Users}><div className="p-3">
      <div className="flex justify-end mb-3"><Btn onClick={openAdd}><Plus className="w-3 h-3"/><span>Ajouter</span></Btn></div>
      {filtered.length===0?<Empty label="fournisseur" onAdd={openAdd}/>:(
        <div className="space-y-1.5">{filtered.map(f=>(<div key={f.id} className="flex items-center justify-between px-3 py-2.5 rounded bg-bg-input border border-white/5 hover:border-rose/20 transition-all">
          <div><p className="text-sm font-medium text-white">{f.nom}</p>
            <div className="flex items-center flex-wrap gap-1 mt-1">{(f.categorieIds||[]).map(cid=>{const c=categories.find(x=>x.id===cid);return c?<span key={cid} className="px-1.5 py-0.5 bg-rose/10 text-rose border border-rose/20 rounded text-[9px] font-bold">{c.nom}</span>:null})}{f.telephone&&<span className="text-[10px] text-gray-500">· {f.telephone}</span>}</div></div>
          <div className="flex space-x-1"><Btn variant="ghost" onClick={()=>openEdit(f)}><Pencil className="w-3 h-3"/></Btn><Btn variant="danger" onClick={()=>{if(confirm('Supprimer ?'))deleteFournisseur(f.id)}}><Trash2 className="w-3 h-3"/></Btn></div>
        </div>))}</div>
      )}
    </div></Window>
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='add'?'Nouveau fournisseur':'Modifier'}>
      <div className="space-y-3">
        <Field label="Nom *" value={form.nom} onChange={v=>setForm({...form,nom:v})} placeholder="Ex: Sotralentz, Nicoll..."/>
        <Field label="Contact" value={form.contact} onChange={v=>setForm({...form,contact:v})} placeholder="Commercial"/>
        <div className="grid grid-cols-2 gap-2"><Field label="Téléphone" value={form.telephone} onChange={v=>setForm({...form,telephone:v})} placeholder="06..."/><Field label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="contact@..."/></div>
        <div><label className={lbl}>Catégories fournies *</label><div className="space-y-0.5 max-h-40 overflow-y-auto">{getCategoriesSorted().map(c=>(<label key={c.id} className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer"><input type="checkbox" checked={form.categorieIds.includes(c.id)} onChange={()=>toggleCat(c.id)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs text-gray-300">{c.nom}</span></label>))}</div></div>
        <Field label="Notes" value={form.notes} onChange={v=>setForm({...form,notes:v})} textarea placeholder="Infos..."/>
        <div className="flex justify-end space-x-2 pt-2"><Btn variant="ghost" onClick={()=>setModal(null)}>Annuler</Btn><Btn onClick={save}><Check className="w-3 h-3"/><span>OK</span></Btn></div>
      </div>
    </Modal>
  </>)
}

// ========== PRODUITS ==========
const EMPTY_CUVE = { typeCuve:'principale', longueur:'', largeur:'', hauteur:'', poids:'', espacement:'0.5' }

function ProduitsTab({search}) {
  const {produits,categories,getCategoriesSorted,fournisseurs,addProduit,updateProduit,deleteProduit}=useProductStore()
  const [modal,setModal]=useState(null)
  const [filterFourn,setFilterFourn]=useState('')
  const [filterCat,setFilterCat]=useState('')
  const fileRef=useRef(null)

  const emptyForm = {
    nom:'',fournisseurId:'',categorieId:'',prixHT:'',
    materiau:'pvc', carrossable:false, tonnageCarrossable:'3.5',
    cuves:[{...EMPTY_CUVE}],
    profondeurMin:'0.5', relevageIntegre:false, recommandationFournisseur:'',
    diametre:'',angle:'',unite:'',
    poidsM3:'',prixM3HT:'',
    pdfUrl:'',pdfLocal:'',pdfLocalName:'',
    description:'',
  }
  const [form, setForm] = useState(emptyForm)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const selectedCat = categories.find(c=>c.id===form.categorieId)
  const typeCat = selectedCat?.typeCategorie || 'autre'
  const isCuve = typeCat==='cuve'
  const isTube = typeCat==='tube'
  const isRemblai = typeCat==='remblai'

  const volumeFouille = isCuve ? calcVolumeFouilleProduit(form) : 0
  const poidsTotal = isCuve ? calcPoidsTotal(form) : 0
  const fournForCat = form.categorieId ? fournisseurs.filter(f=>(f.categorieIds||[]).includes(form.categorieId)) : fournisseurs

  const filtered = produits.filter(p=>{
    const q=search.toLowerCase()
    const mS=p.nom.toLowerCase().includes(q)||fournisseurs.find(f=>f.id===p.fournisseurId)?.nom.toLowerCase().includes(q)
    return mS && (!filterFourn||p.fournisseurId===filterFourn) && (!filterCat||p.categorieId===filterCat)
  })

  const openAdd=()=>{setForm({...emptyForm,cuves:[{...EMPTY_CUVE}]});setModal('add')}
  const openEdit=(p)=>{
    const cuves = p.cuves?.length ? p.cuves : [{...EMPTY_CUVE,longueur:p.longueur1||'',largeur:p.largeur1||'',hauteur:p.hauteur1||'',poids:p.poidsProduit||''}]
    setForm({...emptyForm,...p,cuves})
    setModal(p)
  }

  const setCuve=(idx,k,v)=>{
    setForm(f=>{const cuves=[...f.cuves];cuves[idx]={...cuves[idx],[k]:v};return{...f,cuves}})
  }
  const addCuve=()=>{if(form.cuves.length<4)setForm(f=>({...f,cuves:[...f.cuves,{...EMPTY_CUVE}]}))}
  const removeCuve=(idx)=>{if(form.cuves.length>1)setForm(f=>({...f,cuves:f.cuves.filter((_,i)=>i!==idx)}))}

  const handleFile=(e)=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=(ev)=>setForm(f=>({...f,pdfLocal:ev.target.result,pdfLocalName:file.name}));r.readAsDataURL(file)}

  const save=()=>{
    if(!form.nom.trim())return
    const d={...form,prixHT:parseFloat(form.prixHT)||0,profondeurMin:parseFloat(form.profondeurMin)||0,poidsM3:parseFloat(form.poidsM3)||0,prixM3HT:parseFloat(form.prixM3HT)||0,volumeFouille,poidsTotal}
    modal==='add'?addProduit(d):updateProduit(modal.id,d);setModal(null)
  }

  return (<>
    <Window title={`Produits (${filtered.length})`} icon={Package}><div className="p-3">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select value={filterFourn} onChange={e=>setFilterFourn(e.target.value)} className="h-8 px-2 bg-bg-input border border-white/10 rounded text-xs text-gray-300"><option value="">Tous fournisseurs</option>{fournisseurs.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}</select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="h-8 px-2 bg-bg-input border border-white/10 rounded text-xs text-gray-300"><option value="">Toutes catégories</option>{getCategoriesSorted().map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select>
        <div className="flex-1"/><Btn onClick={openAdd}><Plus className="w-3 h-3"/><span>Ajouter</span></Btn>
      </div>
      {filtered.length===0?<Empty label="produit" onAdd={openAdd}/>:(
        <div className="space-y-1.5">{filtered.map(p=>{
          const cat=categories.find(c=>c.id===p.categorieId);const fourn=fournisseurs.find(f=>f.id===p.fournisseurId);const tc=cat?.typeCategorie;const nbCuves=(p.cuves||[]).length
          const matLabel=MATERIAUX.find(m=>m.id===p.materiau)?.nom
          return(<div key={p.id} className="px-3 py-2.5 rounded bg-bg-input border border-white/5 hover:border-rose/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-sm font-medium text-white">{p.nom}</span>
                  {cat&&<span className="px-1.5 py-0.5 bg-rose/10 text-rose border border-rose/20 rounded text-[9px] font-bold">{cat.nom}</span>}
                  {tc==='cuve'&&matLabel&&<span className="px-1.5 py-0.5 bg-white/5 text-gray-400 rounded text-[9px] font-bold">{matLabel}</span>}
                  {p.carrossable&&<span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold">🚗 {p.tonnageCarrossable||'3.5'}t</span>}
                  {tc==='cuve'&&nbCuves>1&&<span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold">{nbCuves} cuves</span>}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {fourn?.nom||'—'}
                  {tc==='cuve'&&p.cuves?.length>0&&` · ${p.cuves.map((c,i)=>`C${i+1}:${c.longueur||'?'}×${c.largeur||'?'}×${c.hauteur||'?'}m`).join(' + ')}`}
                  {tc==='cuve'&&p.volumeFouille>0&&` · Vol.fouille: ${p.volumeFouille.toFixed(1)}m³`}
                  {tc==='cuve'&&p.poidsTotal>0&&` · ${p.poidsTotal}kg`}
                  {tc==='tube'&&p.diametre&&` · Ø${p.diametre}mm`}
                  {tc==='remblai'&&p.poidsM3>0&&` · ${p.poidsM3}t/m³`}
                </p>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <span className="text-sm font-bold text-rose mr-1">{p.prixHT>0?`${p.prixHT}€`:p.prixM3HT>0?`${p.prixM3HT}€/m³`:'—'}</span>
                {(p.pdfLocal||p.pdfUrl)&&<button onClick={()=>window.open(p.pdfUrl||p.pdfLocal)} className="p-1.5 text-gray-600 hover:text-rose"><FileText className="w-3 h-3"/></button>}
                <Btn variant="ghost" onClick={()=>openEdit(p)}><Pencil className="w-3 h-3"/></Btn>
                <Btn variant="danger" onClick={()=>{if(confirm('Supprimer ?'))deleteProduit(p.id)}}><Trash2 className="w-3 h-3"/></Btn>
              </div>
            </div>
          </div>)
        })}</div>
      )}
    </div></Window>

    {/* MODAL PRODUIT */}
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='add'?'Nouveau produit':'Modifier le produit'}>
      <div className="space-y-3">
        <Field label="Nom du produit *" value={form.nom} onChange={v=>set('nom',v)} placeholder="Ex: Biodisc BA6..."/>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Catégorie *" value={form.categorieId} onChange={v=>{set('categorieId',v);set('fournisseurId','')}} select options={getCategoriesSorted().map(c=>({value:c.id,label:c.nom}))}/>
          <Field label="Fournisseur *" value={form.fournisseurId} onChange={v=>set('fournisseurId',v)} select options={fournForCat.map(f=>({value:f.id,label:f.nom}))} disabled={!form.categorieId}/>
        </div>

        {/* ===== CUVE ===== */}
        {isCuve && (<>
          {/* Propriétés */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Matériau" value={form.materiau} onChange={v=>set('materiau',v)} select options={MATERIAUX.map(m=>({value:m.id,label:m.nom}))}/>
            <div>
              <label className={lbl}>Carrossable</label>
              <div className="flex items-center space-x-2 h-9">
                <input type="checkbox" checked={form.carrossable||false} onChange={e=>set('carrossable',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/>
                {form.carrossable && <input type="text" value={form.tonnageCarrossable||''} onChange={e=>set('tonnageCarrossable',e.target.value)} placeholder="3.5" className="w-16 h-7 px-2 bg-bg-input border border-white/10 rounded text-xs text-white"/>}
                {form.carrossable && <span className="text-[10px] text-gray-500">tonnes</span>}
              </div>
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer py-0.5">
            <input type="checkbox" checked={form.relevageIntegre||false} onChange={e=>set('relevageIntegre',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/>
            <span className="text-xs text-gray-300">Relevage intégré</span>
          </label>

          {/* CUVES 1 à 4 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={lbl+" mb-0"}>{form.cuves.length} cuve(s)</label>
              {form.cuves.length<4&&<button type="button" onClick={addCuve} className="text-[10px] text-rose font-semibold hover:text-rose-light"><Plus className="w-3 h-3 inline mr-0.5"/>Ajouter cuve</button>}
            </div>
            <div className="space-y-2">
              {form.cuves.map((cuve,idx)=>(
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-gray-400">CUVE {idx+1}</span>
                      <select value={cuve.typeCuve||'principale'} onChange={e=>setCuve(idx,'typeCuve',e.target.value)} className="h-6 px-1.5 bg-bg-input border border-white/10 rounded text-[10px] text-gray-300">
                        {TYPES_CUVE.map(t=><option key={t.id} value={t.id}>{t.nom}</option>)}
                      </select>
                    </div>
                    {form.cuves.length>1&&<button type="button" onClick={()=>removeCuve(idx)} className="text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[['longueur','L (m)'],['largeur','l (m)'],['hauteur','H (m)'],['poids','Poids (kg)']].map(([k,p])=>(
                      <div key={k}><label className="text-[8px] text-gray-600 block mb-0.5">{p}</label>
                        <input type="number" value={cuve[k]||''} onChange={e=>setCuve(idx,k,e.target.value)} step={k==='poids'?'1':'0.01'} min="0" placeholder="—" className="w-full h-7 px-2 bg-bg-input border border-white/10 rounded text-[11px] text-white"/></div>
                    ))}
                  </div>
                  {idx>0&&(
                    <div className="mt-1.5"><label className="text-[8px] text-gray-600">Espacement avec cuve {idx} (m)</label>
                      <input type="number" value={cuve.espacement||''} onChange={e=>setCuve(idx,'espacement',e.target.value)} step="0.1" min="0" placeholder="0.5" className="w-24 h-7 px-2 bg-bg-input border border-white/10 rounded text-[11px] text-white mt-0.5"/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Profondeur min dessus cuve" type="number" value={form.profondeurMin} onChange={v=>set('profondeurMin',v)} suffix="m" step="0.1"/>
          <Field label="Prix HT" type="number" value={form.prixHT} onChange={v=>set('prixHT',v)} suffix="€ HT"/>

          {/* Calculs auto */}
          {(volumeFouille>0||poidsTotal>0)&&(
            <Info>
              <div className="space-y-1">
                {volumeFouille>0&&<div className="flex justify-between"><span>📐 <strong className="text-white">Volume fouille :</strong></span><span className="font-display text-sm font-bold text-rose">{volumeFouille.toFixed(2)} m³</span></div>}
                {poidsTotal>0&&<div className="flex justify-between"><span>⚖️ <strong className="text-white">Poids total cuves :</strong></span><span className="font-display text-sm font-bold text-white">{poidsTotal} kg</span></div>}
                <p className="text-[8px] text-gray-600 mt-1">Fouille = (L+0.70)×(l+0.70)×(H+prof.min) par cuve + espacements</p>
              </div>
            </Info>
          )}

          <Field label="Recommandation fournisseur" value={form.recommandationFournisseur} onChange={v=>set('recommandationFournisseur',v)} textarea placeholder="Ex: Lit de sable 10cm, remblaiement spécifique..."/>
        </>)}

        {/* ===== TUBE ===== */}
        {isTube&&(<>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Diamètre" value={form.diametre} onChange={v=>set('diametre',v)} placeholder="100" suffix="mm"/>
            <Field label="Angle (coude)" value={form.angle} onChange={v=>set('angle',v)} placeholder="90" suffix="°"/>
          </div>
          <Field label="Prix unitaire HT" type="number" value={form.prixHT} onChange={v=>set('prixHT',v)} suffix="€"/>
          <Field label="Unité" value={form.unite} onChange={v=>set('unite',v)} placeholder="ml, pièce..."/>
        </>)}

        {/* ===== REMBLAI ===== */}
        {isRemblai&&(<div className="grid grid-cols-2 gap-2">
          <Field label="Poids/m³" type="number" value={form.poidsM3} onChange={v=>set('poidsM3',v)} suffix="t/m³" step="0.1"/>
          <Field label="Prix/m³ HT" type="number" value={form.prixM3HT} onChange={v=>set('prixM3HT',v)} suffix="€/m³"/>
        </div>)}

        {/* ===== ACCESSOIRE/AUTRE ===== */}
        {!isCuve&&!isTube&&!isRemblai&&(<>
          <Field label="Prix HT" type="number" value={form.prixHT} onChange={v=>set('prixHT',v)} suffix="€"/>
          <Field label="Unité" value={form.unite} onChange={v=>set('unite',v)} placeholder="pièce, m²..."/>
        </>)}

        {/* PDF */}
        <div>
          <label className={lbl}>Fiche technique PDF</label>
          <div className="flex items-center gap-2 mb-1.5">
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden"/>
            <button type="button" onClick={()=>fileRef.current?.click()} className="h-8 px-3 bg-bg-input border border-white/10 rounded text-xs text-gray-400 hover:text-white hover:border-rose/30 flex items-center space-x-1.5 transition-all"><Upload className="w-3 h-3"/><span>PDF local</span></button>
            {form.pdfLocalName&&(<div className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded"><FileIcon className="w-3 h-3 text-emerald-400"/><span className="text-[10px] text-emerald-400">{form.pdfLocalName}</span><button type="button" onClick={()=>{set('pdfLocal','');set('pdfLocalName','')}} className="text-gray-500 hover:text-red-400 ml-1"><X className="w-3 h-3"/></button></div>)}
          </div>
          <Field value={form.pdfUrl} onChange={v=>set('pdfUrl',v)} placeholder="Ou URL cloud : https://..."/>
          {form.pdfLocal&&form.pdfUrl&&<p className="text-[9px] text-amber-400 mt-1">⚡ L'URL cloud est prioritaire.</p>}
        </div>

        <Field label="Description / Notes" value={form.description} onChange={v=>set('description',v)} textarea placeholder="Infos..."/>
        <div className="flex justify-end space-x-2 pt-2"><Btn variant="ghost" onClick={()=>setModal(null)}>Annuler</Btn><Btn onClick={save}><Check className="w-3 h-3"/><span>Enregistrer</span></Btn></div>
      </div>
    </Modal>
  </>)
}

// ========== VEHICULES ==========
function VehiculesTab({search}) {
  const {vehicules,addVehicule,updateVehicule,deleteVehicule}=useProductStore()
  const [modal,setModal]=useState(null)
  const empty={nom:'',ptac:'',poidsVide:'',capaciteM3:'',vitesseKmh:'45',prixKm:''}
  const [form,setForm]=useState(empty)
  const filtered=vehicules.filter(v=>v.nom.toLowerCase().includes(search.toLowerCase()))
  const openAdd=()=>{setForm(empty);setModal('add')}
  const openEdit=(v)=>{setForm({nom:v.nom,ptac:String(v.ptac),poidsVide:String(v.poidsVide||''),capaciteM3:String(v.capaciteM3),vitesseKmh:String(v.vitesseKmh||45),prixKm:String(v.prixKm||v.tauxHoraire||'')});setModal(v)}
  const save=()=>{if(!form.nom.trim())return;const d={nom:form.nom,ptac:parseFloat(form.ptac)||0,poidsVide:parseFloat(form.poidsVide)||0,capaciteM3:parseFloat(form.capaciteM3)||0,vitesseKmh:parseFloat(form.vitesseKmh)||45,prixKm:parseFloat(form.prixKm)||0,chargeUtile:(parseFloat(form.ptac)||0)-(parseFloat(form.poidsVide)||0)};modal==='add'?addVehicule(d):updateVehicule(modal.id,d);setModal(null)}
  return (<>
    <Window title={`Véhicules (${filtered.length})`} icon={Truck}><div className="p-3">
      <div className="flex justify-end mb-3"><Btn onClick={openAdd}><Plus className="w-3 h-3"/><span>Ajouter</span></Btn></div>
      {filtered.length===0?<Empty label="véhicule" onAdd={openAdd}/>:(
        <div className="space-y-1.5">{filtered.map(v=>{const cu=(v.ptac||0)-(v.poidsVide||0);return(
          <div key={v.id} className="flex items-center justify-between px-3 py-2.5 rounded bg-bg-input border border-white/5 hover:border-rose/20 transition-all">
            <div><p className="text-sm font-medium text-white">{v.nom}</p><p className="text-[10px] text-gray-500">PTAC {v.ptac}t · Vide {v.poidsVide||'?'}t · <strong className="text-gray-300">CU {cu>0?cu.toFixed(1):'?'}t</strong> · {v.capaciteM3}m³ · {v.vitesseKmh}km/h{v.prixKm>0&&` · ${v.prixKm}€/km`}</p></div>
            <div className="flex space-x-1"><Btn variant="ghost" onClick={()=>openEdit(v)}><Pencil className="w-3 h-3"/></Btn><Btn variant="danger" onClick={()=>{if(confirm('Supprimer ?'))deleteVehicule(v.id)}}><Trash2 className="w-3 h-3"/></Btn></div>
          </div>)})}</div>
      )}
    </div></Window>
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==='add'?'Nouveau véhicule':'Modifier'}>
      <div className="space-y-3">
        <Field label="Nom *" value={form.nom} onChange={v=>setForm({...form,nom:v})} placeholder="Camion benne 17t"/>
        <div className="grid grid-cols-3 gap-2">
          <Field label="PTAC" type="number" value={form.ptac} onChange={v=>setForm({...form,ptac:v})} suffix="t" step="0.5"/>
          <Field label="Poids à vide" type="number" value={form.poidsVide} onChange={v=>setForm({...form,poidsVide:v})} suffix="t" step="0.5"/>
          <Field label="Capacité" type="number" value={form.capaciteM3} onChange={v=>setForm({...form,capaciteM3:v})} suffix="m³" step="0.5"/>
        </div>
        {form.ptac&&form.poidsVide&&<Info><strong className="text-white">Charge utile :</strong> {((parseFloat(form.ptac)||0)-(parseFloat(form.poidsVide)||0)).toFixed(1)} t</Info>}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Vitesse moy." type="number" value={form.vitesseKmh} onChange={v=>setForm({...form,vitesseKmh:v})} suffix="km/h"/>
          <Field label="Prix kilométrique" type="number" value={form.prixKm} onChange={v=>setForm({...form,prixKm:v})} suffix="€/km" step="0.1"/>
        </div>
        <div className="flex justify-end space-x-2 pt-2"><Btn variant="ghost" onClick={()=>setModal(null)}>Annuler</Btn><Btn onClick={save}><Check className="w-3 h-3"/><span>OK</span></Btn></div>
      </div>
    </Modal>
  </>)
}
