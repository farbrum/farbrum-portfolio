import { calcBlocsAerien, calcMurSoutenement } from '../store/calcBlocs'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDevisStore } from '../store/devisStore'
import { useProductStore, calcVolumeFouilleProduit, calcVolumeCuvesStrict, calcVolumeRemblais, calcVolumeSablePVC, calcMLPVCEnterres, calcRehausses, calcEpandage, calcSurfaceFouilleProduit, calcRestauration, TYPES_SOL, ENGINS, KITS_ASSOCIES, SECTIONS_REDACTIONNELLES, calcScenario, getJoursDisponibles, trouverProchainCreneau } from '../store/productStore'
import { useAuthStore } from '../store/authStore'
import { rechercherCommunes } from '../services/geoService'
import MapPicker, { roadDistance } from '../components/MapPicker'
import { Save, ArrowLeft, AlertTriangle, MapPin, Navigation, Trash2, HardHat, EyeOff, FileText, Percent, Calendar } from 'lucide-react'
import Window from '../components/Window'

const inp = "w-full h-9 px-3 bg-bg-input border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose transition-all"
const lbl = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
function Info({children}){return<div className="bg-rose/5 border border-rose/15 rounded p-2.5 text-[10px] text-gray-400">{children}</div>}
const fmtC = v => {
  const n = Number(v||0)
  const parts = n.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.join(',') + ' €'
}

const TYPES_INSTALLATION = [
  {id:'microstation',nom:'Microstation'},{id:'filtre_compact',nom:'Filtre compact (sans épandage)'},{id:'filtre_epandage',nom:'Filtre compact + Épandage'},{id:'fosse_epandage',nom:'Fosse toutes eaux + Épandage'},{id:'autre',nom:'Autre'},
]
const MODES_INSTALLATION = [
  {id:'souterrain',nom:'Souterrain (enterré)',d:'Installation classique enterrée'},
  {id:'aerien',nom:'Aérien (hors-sol)',d:'Hors-sol avec murs de soutènement'},
  {id:'semi_enterre',nom:'Semi-enterré',d:'Partie enterrée, partie hors-sol'},
]
const TYPES_REJET = [
  {id:'infiltration',nom:'Infiltration (sol)'},{id:'pluvial',nom:'Réseau pluvial communal'},{id:'cours_eau',nom:"Cours d'eau / fossé"},{id:'puits',nom:"Puits d'infiltration"},
]
const REJETS_LABELS={infiltration:'Infiltration',pluvial:'Pluvial communal',cours_eau:"Cours d'eau",puits:"Puits d'infiltration"}
const hasEpandage = t => t === 'filtre_epandage' || t === 'fosse_epandage'

export default function NewDevis() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const { user } = useAuthStore()
  const { addDevis, updateDevis, getDevisById } = useDevisStore()
  const { produits, categories, fournisseurs, vehicules, ressources, tarifsMateriaux, tarifsChantier, enginsData, controleursSPANC } = useProductStore()
  const isEdit = !!editId
  const existingDevis = isEdit ? getDevisById(editId) : null

  if (user?.role !== 'admin') return <Window title="Accès refusé"><div className="p-8 text-center"><AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2"/><p className="text-sm text-gray-400">Réservé aux administrateurs.</p></div></Window>

  const [step, setStep] = useState(1)
  const [showFiche, setShowFiche] = useState(false)
  const [form, setForm] = useState({
    nom:'',prenom:'',adresse:'',codePostal:'',ville:'',telephone:'',email:'',communesSuggestions:[],
    typeInstallation:'microstation',modeInstallation:'souterrain',absenceEtudeSol:false,
    deconstruction:false,decoLongueur:'',decoLargeur:'',decoHauteur:'',
    produitId:'',produitsAssocies:[],produitsSup:[],
    gpsAncLat:null,gpsAncLng:null,gpsRemblaisLat:null,gpsRemblaisLng:null,gpsFournisseurLat:null,gpsFournisseurLng:null,gpsMortierLat:null,gpsMortierLng:null,gpsDechetterieLat:null,gpsDechetterieLng:null,activeMapMarker:null,
    profondeur:'0.5',vehiculeId:'',vehiculeMortierId:'',enginId:'pelle_8t',typeSolId:'terre',
    distanceDepotChantierKm:'30',
    nbPoseurs:'2',epaisseurMortier:'0.20',
    tuyauxAvantFiliere:'',tuyauxApresFiliere:'',
    nbCoudesPVC:'',
    longueurAeration:'',longueurVentilation:'',ventilationAerienne:'',
    typeRejet:'infiltration',
    posteRelevage:false,longueurCableElec:'',sectionCable:'4',
    nbRehausses:'0',prixRehausse:'35',
    restaurationSurface:false,restaurationDetails:'',
    terreVegetaleM3:'',prixTerreVegetaleM3:'25',
    notesInstallateur:'',
    // Blocs à bancher (aérien)
    prixBlocBancher:'2.50',prixBlocAngle:'3.00',prixBetonBlocM3:'120',prixFerT10Kg:'1.50',
    // Mur soutènement
    murSoutenement:false,murLongueur:'',murHauteur:'',murEpaisseur:'0.20',murFondation:false,murFondLargeur:'0.40',murFondHauteur:'0.30',
    accessTransport:'semi',
    poseSamedi:false,
    // Épandage
    epandageSurface:'',epandageNbDrains:'',
    // Remise
    remiseType:'pourcent', // pourcent | montant
    remisePourcent:'',remiseMontant:'',
    // Sections rédactionnelles
    sections: SECTIONS_REDACTIONNELLES.map(s => ({ ...s, texte: s.defaut })),
  })

  useEffect(() => {
    if (!existingDevis) return
    const d = existingDevis
    setForm({
      nom:d.client?.nom||'',prenom:d.client?.prenom||'',adresse:d.client?.adresse||'',codePostal:d.client?.codePostal||'',ville:d.client?.ville||'',telephone:d.client?.telephone||'',email:d.client?.email||'',communesSuggestions:[],
      typeInstallation:d.typeInstallation||'microstation',modeInstallation:d.modeInstallation||'souterrain',absenceEtudeSol:d.absenceEtudeSol||false,
      deconstruction:d.deconstruction||false,decoLongueur:d.decoLongueur?String(d.decoLongueur):'',decoLargeur:d.decoLargeur?String(d.decoLargeur):'',decoHauteur:d.decoHauteur?String(d.decoHauteur):'',
      produitId:d.produitId||'',produitsAssocies:d.produitsAssocies||[],produitsSup:d.produitsSup||[],
      gpsAncLat:d.gpsAnc?.lat||null,gpsAncLng:d.gpsAnc?.lng||null,gpsRemblaisLat:d.gpsRemblais?.lat||null,gpsRemblaisLng:d.gpsRemblais?.lng||null,gpsFournisseurLat:d.gpsFournisseur?.lat||null,gpsFournisseurLng:d.gpsFournisseur?.lng||null,gpsMortierLat:d.gpsMortier?.lat||null,gpsMortierLng:d.gpsMortier?.lng||null,gpsDechetterieLat:d.gpsDechetterie?.lat||null,gpsDechetterieLng:d.gpsDechetterie?.lng||null,activeMapMarker:null,
      profondeur:d.profondeur?String(d.profondeur):'0.5',vehiculeId:d.vehiculeId||'',vehiculeMortierId:d.vehiculeMortierId||'',enginId:d.enginId||'pelle_8t',typeSolId:d.typeSolId||'terre',
      distanceDepotChantierKm:d.distanceDepotChantierKm?String(d.distanceDepotChantierKm):'30',
      nbPoseurs:d.nbPoseurs?String(d.nbPoseurs):'2',epaisseurMortier:d.epaisseurMortier?String(d.epaisseurMortier):'0.20',
      tuyauxAvantFiliere:d.tuyauxAvantFiliere?String(d.tuyauxAvantFiliere):'',tuyauxApresFiliere:d.tuyauxApresFiliere?String(d.tuyauxApresFiliere):'',
      nbCoudesPVC:d.nbCoudesPVC?String(d.nbCoudesPVC):'',
      longueurAeration:d.longueurAeration?String(d.longueurAeration):'',longueurVentilation:d.longueurVentilation?String(d.longueurVentilation):'',ventilationAerienne:d.ventilationAerienne?String(d.ventilationAerienne):'',
      typeRejet:d.typeRejet||'infiltration',
      posteRelevage:d.posteRelevage||false,longueurCableElec:d.longueurCableElec?String(d.longueurCableElec):'',sectionCable:d.sectionCable||'4',
      nbRehausses:d.nbRehausses?String(d.nbRehausses):'0',prixRehausse:d.prixRehausse?String(d.prixRehausse):'35',
      restaurationSurface:d.restaurationSurface||false,restaurationDetails:d.restaurationDetails||'',
      terreVegetaleM3:d.terreVegetaleM3?String(d.terreVegetaleM3):'',prixTerreVegetaleM3:d.prixTerreVegetaleM3?String(d.prixTerreVegetaleM3):'25',
      notesInstallateur:d.notesInstallateur||'',
      prixBlocBancher:d.prixBlocBancher?String(d.prixBlocBancher):'2.50',prixBlocAngle:d.prixBlocAngle?String(d.prixBlocAngle):'3.00',prixBetonBlocM3:d.prixBetonBlocM3?String(d.prixBetonBlocM3):'120',prixFerT10Kg:d.prixFerT10Kg?String(d.prixFerT10Kg):'1.50',
      murSoutenement:d.murSoutenement||false,murLongueur:d.murLongueur?String(d.murLongueur):'',murHauteur:d.murHauteur?String(d.murHauteur):'',murEpaisseur:d.murEpaisseur?String(d.murEpaisseur):'0.20',murFondation:d.murFondation||false,murFondLargeur:d.murFondLargeur?String(d.murFondLargeur):'0.40',murFondHauteur:d.murFondHauteur?String(d.murFondHauteur):'0.30',accessTransport:d.accessTransport||'semi',poseSamedi:d.poseSamedi||false,
      epandageSurface:d.epandage?.surfaceM2?String(d.epandage.surfaceM2):'',epandageNbDrains:d.epandage?.nbDrains?String(d.epandage.nbDrains):'',
      remiseType:d.remisePourcent>0?'pourcent':'montant',remisePourcent:d.remisePourcent?String(d.remisePourcent):'',remiseMontant:d.remiseMontant?String(d.remiseMontant):'',
      sections:d.sectionsRedactionnelles||SECTIONS_REDACTIONNELLES.map(s=>({...s,texte:s.defaut})),
    })
  }, [editId])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Auto-suggestion engin + véhicule selon accès chantier
  const suggestEnginVehicule = (access) => {
    // Mapping accès → engins recommandés (par ordre de préférence)
    const ACCESS_ENGIN_MAP = {
      semi:  ['pelle_13t','pelle_8t','pelle_3t'],  // Gros accès → grosse pelle
      '17t': ['pelle_8t','pelle_3t','pelle_2_5t'],  // Moyen → pelle 8t max
      '10t': ['pelle_3t','pelle_2_5t','pelle_1_2t'], // Réduit → mini-pelle
      benne: ['pelle_2_5t','pelle_1_2t'],            // Très réduit → mini-pelle
    }
    const ACCESS_VEHICULE_MAP = {
      semi: 'semi', '17t': 'camion17', '10t': 'camion10', benne: 'camion_benne',
    }
    // Trouver le meilleur engin disponible
    const enginPrefs = ACCESS_ENGIN_MAP[access] || ['pelle_8t']
    const bestEngin = enginPrefs.find(id => enginsData.some(e => e.id === id && e.rendementM3h > 0)) || enginsData.find(e => e.rendementM3h > 0)?.id
    const bestVehicule = ACCESS_VEHICULE_MAP[access] || ''
    return { enginId: bestEngin, vehiculeId: vehicules.some(v => v.id === bestVehicule) ? bestVehicule : vehicules[0]?.id || '' }
  }

  const handleAccessChange = (access) => {
    set('accessTransport', access)
    const suggested = suggestEnginVehicule(access)
    if (suggested.enginId) setForm(f => ({ ...f, accessTransport: access, enginId: suggested.enginId, vehiculeId: suggested.vehiculeId || f.vehiculeId }))
  }

  const sel = produits.find(p=>p.id===form.produitId)

  useEffect(()=>{
    if(form.codePostal?.length===5){rechercherCommunes(form.codePostal).then(c=>{set('communesSuggestions',c);if(c.length===1&&!form.ville)set('ville',c[0].nom)})}else set('communesSuggestions',[])
  },[form.codePostal])

  useEffect(()=>{
    if(sel&&sel.cuves?.some(c=>c.typeCuve==='relevage')&&!form.posteRelevage)set('posteRelevage',true)
  },[sel])

  useEffect(()=>{set('nbRehausses',String(calcRehausses(form.profondeur)))},[form.profondeur])

  // Auto-sélection du premier véhicule si aucun choisi
  useEffect(()=>{
    if(!form.vehiculeId && vehicules.length > 0) set('vehiculeId', vehicules[0].id)
  },[vehicules])

  const distanceKm = (form.gpsAncLat && form.gpsRemblaisLat) ? roadDistance(form.gpsAncLat,form.gpsAncLng,form.gpsRemblaisLat,form.gpsRemblaisLng) : 0
  const distanceLivraisonKm = (form.gpsAncLat && form.gpsFournisseurLat) ? roadDistance(form.gpsFournisseurLat,form.gpsFournisseurLng,form.gpsAncLat,form.gpsAncLng) : 0
  const distanceMortierKm = (form.gpsAncLat && form.gpsMortierLat) ? roadDistance(form.gpsMortierLat,form.gpsMortierLng,form.gpsAncLat,form.gpsAncLng) : 0
  const distanceDechetterieKm = (form.gpsAncLat && form.gpsDechetterieLat) ? roadDistance(form.gpsAncLat,form.gpsAncLng,form.gpsDechetterieLat,form.gpsDechetterieLng) : 0
  const selVehiculeMortier = vehicules.find(v=>v.id===form.vehiculeMortierId)
  const produitsFiltered = useMemo(()=>{
    if(form.typeInstallation==='autre') return produits
    // Mapper le type d'installation vers les catégories de cuves correspondantes
    const INSTALL_TO_CAT = {
      microstation: ['microstations'],
      filtre_compact: ['filtres_compacts'],
      filtre_epandage: ['filtres_compacts', 'fosses'],
      fosse_epandage: ['fosses'],
    }
    const allowedCats = INSTALL_TO_CAT[form.typeInstallation] || []
    if (allowedCats.length > 0) {
      const filtered = produits.filter(p => allowedCats.includes(p.categorieId))
      if (filtered.length > 0) return filtered
    }
    // Fallback: toutes les cuves
    const cp = produits.filter(p=>{const cat=categories.find(c=>c.id===p.categorieId);return cat&&cat.typeCategorie==='cuve'})
    return cp.length>0?cp:produits
  },[produits,categories,form.typeInstallation])

  const volFouille = sel ? (sel.volumeFouille||calcVolumeFouilleProduit(sel)) : 0
  const volCuves = sel ? calcVolumeCuvesStrict(sel) : 0
  const nbCuves = sel?.cuves?.length || 1
  const volRemblais = calcVolumeRemblais(volFouille, volCuves)
  const surfaceFouille = sel ? calcSurfaceFouilleProduit(sel) : 0
  const mlPVCEnterres = calcMLPVCEnterres(form)
  const volSablePVC = calcVolumeSablePVC(mlPVCEnterres)
  const volDeco = form.deconstruction ? (parseFloat(form.decoLongueur)||0)*(parseFloat(form.decoLargeur)||0)*(parseFloat(form.decoHauteur)||0) : 0

  // Auto-calcul terre végétale : emprise fouille × 3 × 0.25m
  const restauration = (form.restaurationSurface && surfaceFouille > 0) ? calcRestauration(surfaceFouille, tarifsMateriaux) : null
  useEffect(()=>{
    if(form.restaurationSurface && surfaceFouille > 0 && !form.terreVegetaleM3){
      const tv = Math.round(surfaceFouille * 3 * 0.25 * 10) / 10
      set('terreVegetaleM3', String(tv))
      set('prixTerreVegetaleM3', String(tarifsMateriaux?.terreVegetaleM3 || 25))
    }
  },[form.restaurationSurface, surfaceFouille])
  const selVehicule = vehicules.find(v=>v.id===form.vehiculeId)
  const kitAssocies = KITS_ASSOCIES[form.typeInstallation]||[]
  const toggleAssoc = (nom) => setForm(f=>({...f,produitsAssocies:f.produitsAssocies.includes(nom)?f.produitsAssocies.filter(x=>x!==nom):[...f.produitsAssocies,nom]}))

  useEffect(()=>{
    if(isEdit)return
    const kit=KITS_ASSOCIES[form.typeInstallation]||[]
    set('produitsAssocies',kit.filter(k=>k.obligatoire).map(k=>k.nom))
  },[form.typeInstallation])

  // Épandage
  const epandageData = hasEpandage(form.typeInstallation) && parseFloat(form.epandageSurface)>0
    ? calcEpandage(parseFloat(form.epandageSurface), parseInt(form.epandageNbDrains)||0)
    : null

  // Coûts
  const coutCoudes = (parseInt(form.nbCoudesPVC)||0) * (tarifsMateriaux?.coudePVC||5)
  const coutRehausses = (parseInt(form.nbRehausses)||0) * (parseFloat(form.prixRehausse)||0)
  const prixCableMl = form.sectionCable==='2.5'?(tarifsMateriaux?.cableElec25Ml||6):form.sectionCable==='6'?(tarifsMateriaux?.cableElec6Ml||12):(tarifsMateriaux?.cableElec4Ml||8)
  const coutElec = form.posteRelevage ? ((parseFloat(form.longueurCableElec)||0) * prixCableMl + (tarifsMateriaux?.fourreauElec||25)) : 0
  // ─── Blocs à bancher (aérien/semi-enterré) ───
  const tarifsBlocs = {prixBlocBancher:form.prixBlocBancher,prixBlocAngle:form.prixBlocAngle,prixBetonM3:form.prixBetonBlocM3,prixFerT10Kg:form.prixFerT10Kg}
  const isAerien = form.modeInstallation === 'aerien' || form.modeInstallation === 'semi_enterre'
  const blocsAerien = (isAerien && sel?.cuves?.length > 0) ? calcBlocsAerien(sel.cuves, tarifsBlocs) : null
  const coutBlocsAerien = blocsAerien?.couts?.coutTotal || 0

  // ─── Mur de soutènement ───
  const murData = form.murSoutenement ? calcMurSoutenement({longueur:form.murLongueur,hauteur:form.murHauteur,epaisseur:form.murEpaisseur,fondation:form.murFondation,fondLargeur:form.murFondLargeur,fondHauteur:form.murFondHauteur}, tarifsBlocs) : null
  const coutMurSoutenement = murData?.couts?.coutTotal || 0

  const coutTerreVegetale = restauration ? restauration.coutTotal : 0
  const coutEpandage = epandageData ? (epandageData.volumeGravier * 45 + epandageData.longueurDrainTotal * 3) : 0
  const COUT_DOSSIER_PHOTO = 100

  const moOpts = useMemo(()=>({
    tuyauxAvant: parseFloat(form.tuyauxAvantFiliere)||0, tuyauxApres: parseFloat(form.tuyauxApresFiliere)||0,
    nbCoudes: parseInt(form.nbCoudesPVC)||0, nbCuves, nbPoseurs: parseInt(form.nbPoseurs)||2,
    restauration: form.restaurationSurface, surfaceFouille,
    epaisseurMortier: parseFloat(form.epaisseurMortier)||0.20,
    distanceMortierKm, vehiculeMortier: selVehiculeMortier || selVehicule,
    distanceLivraisonKm,
    ventilationAerienne: parseFloat(form.ventilationAerienne)||0,
    distanceChantierKm: parseFloat(form.distanceDepotChantierKm)||0,
  }),[form.tuyauxAvantFiliere,form.tuyauxApresFiliere,form.nbCoudesPVC,nbCuves,form.nbPoseurs,form.restaurationSurface,surfaceFouille,form.epaisseurMortier,distanceMortierKm,selVehiculeMortier,selVehicule,distanceLivraisonKm,form.ventilationAerienne,form.distanceDepotChantierKm])

  const selEngin = enginsData.find(e=>e.id===form.enginId) || enginsData.find(e=>e.rendementM3h>0) || ENGINS[3]

  const scenarios = useMemo(()=>{
    // Si pas d'étude de sol → 3 scénarios (terre, mixte, roche)
    // Sinon → 1 seul scénario avec le type de sol choisi
    const solTypes = form.absenceEtudeSol ? TYPES_SOL : [TYPES_SOL.find(s=>s.id===form.typeSolId) || TYPES_SOL[0]]
    return solTypes.map(sol=>{
      const calc=calcScenario(selEngin,sol,volFouille,volDeco,distanceKm,selVehicule,epandageData,ressources,tarifsMateriaux,tarifsChantier,moOpts)
      const coutMateriel=sel?(sel.prixHT||0):0
      const coutProduitsSup=form.produitsSup.reduce((s,p)=>s+(p.prixHT||0),0)
      const coutAssocies=form.produitsAssocies.reduce((s,nom)=>{
        const kit=kitAssocies.find(k=>k.nom===nom)
        return s + (kit?.prix || 150)
      },0)
      const extras = coutCoudes + coutRehausses + coutElec + coutTerreVegetale + coutEpandage + COUT_DOSSIER_PHOTO
      // Total = tous les coûts CLIENT (opérateurs déjà inclus dans les postes)
      const sousTotal = calc.coutTerrassementClient + calc.coutTransportClient + calc.coutMortierTranspClient + calc.coutMortierMatiere + calc.coutLivraisonClient + calc.coutPoseur + coutMateriel + coutProduitsSup + coutAssocies + extras
      // Remise
      let montantRemise = 0
      if(form.remiseType==='pourcent' && parseFloat(form.remisePourcent)>0){
        montantRemise = sousTotal * (parseFloat(form.remisePourcent)/100)
      } else if(form.remiseType==='montant' && parseFloat(form.remiseMontant)>0){
        montantRemise = parseFloat(form.remiseMontant)
      }
      const totalHT = Math.max(0, sousTotal - montantRemise)
      return{...calc,coutMateriel,coutProduitsSup,coutAssocies,coutCoudes,coutRehausses,coutElec,coutTerreVegetale,coutEpandage,coutDossierPhoto:COUT_DOSSIER_PHOTO,montantRemise,totalHT,totalTVA:totalHT*0.2,totalTTC:totalHT*1.2}
    })
  },[volFouille,volDeco,distanceKm,selVehicule,selEngin,sel,form.produitsSup,form.produitsAssocies,coutCoudes,coutRehausses,coutElec,coutTerreVegetale,coutEpandage,form.remisePourcent,form.remiseMontant,form.remiseType,epandageData,ressources,tarifsMateriaux,tarifsChantier,moOpts,form.absenceEtudeSol,form.typeSolId,form.distanceDepotChantierKm])

  const handleMapPlace = useCallback((id,lat,lng)=>{
    if(id==='anc'){set('gpsAncLat',lat);set('gpsAncLng',lng)}
    if(id==='remblais'){set('gpsRemblaisLat',lat);set('gpsRemblaisLng',lng)}
    if(id==='fournisseur'){set('gpsFournisseurLat',lat);set('gpsFournisseurLng',lng)}
    if(id==='mortier'){set('gpsMortierLat',lat);set('gpsMortierLng',lng)}
    if(id==='dechetterie'){set('gpsDechetterieLat',lat);set('gpsDechetterieLng',lng)}
  },[])

  const mapMarkers = [
    ...(form.gpsAncLat?[{id:'anc',label:'📍 Installation ANC',lat:form.gpsAncLat,lng:form.gpsAncLng,color:'red'}]:[]),
    ...(form.gpsRemblaisLat?[{id:'remblais',label:'🚛 Dépôt remblais',lat:form.gpsRemblaisLat,lng:form.gpsRemblaisLng,color:'orange'}]:[]),
    ...(form.gpsFournisseurLat?[{id:'fournisseur',label:'🏭 Fournisseur',lat:form.gpsFournisseurLat,lng:form.gpsFournisseurLng,color:'blue'}]:[]),
    ...(form.gpsMortierLat?[{id:'mortier',label:'🏗️ Centrale béton',lat:form.gpsMortierLat,lng:form.gpsMortierLng,color:'green'}]:[]),
    ...(form.gpsDechetterieLat?[{id:'dechetterie',label:'♻️ Déchetterie',lat:form.gpsDechetterieLat,lng:form.gpsDechetterieLng,color:'purple'}]:[]),
  ]

  const updateSection = (idx, texte) => {
    const s = [...form.sections]; s[idx] = { ...s[idx], texte }; set('sections', s)
  }

  const buildDevisData = () => ({
    client:{nom:form.nom,prenom:form.prenom,nomComplet:`${form.prenom} ${form.nom}`,adresse:form.adresse,codePostal:form.codePostal,ville:form.ville,telephone:form.telephone,email:form.email},
    typeInstallation:form.typeInstallation,modeInstallation:form.modeInstallation,absenceEtudeSol:form.absenceEtudeSol,
    deconstruction:form.deconstruction,volumeDeconstruction:volDeco,decoLongueur:parseFloat(form.decoLongueur)||0,decoLargeur:parseFloat(form.decoLargeur)||0,decoHauteur:parseFloat(form.decoHauteur)||0,
    produitId:form.produitId,produitNom:sel?.nom||'',produitDescription:sel?.description||'',produitsAssocies:form.produitsAssocies,
    produitsAssociesDetail:form.produitsAssocies.map(nom=>{const k=kitAssocies.find(x=>x.nom===nom);return{nom,prix:k?.prix||150}}),
    produitsSup:form.produitsSup,
    gpsAnc:form.gpsAncLat?{lat:form.gpsAncLat,lng:form.gpsAncLng}:null,
    gpsRemblais:form.gpsRemblaisLat?{lat:form.gpsRemblaisLat,lng:form.gpsRemblaisLng}:null,
    gpsFournisseur:form.gpsFournisseurLat?{lat:form.gpsFournisseurLat,lng:form.gpsFournisseurLng}:null,
    gpsMortier:form.gpsMortierLat?{lat:form.gpsMortierLat,lng:form.gpsMortierLng}:null,
    gpsDechetterie:form.gpsDechetterieLat?{lat:form.gpsDechetterieLat,lng:form.gpsDechetterieLng}:null,
    distanceTransportKm:distanceKm,distanceLivraisonKm,distanceMortierKm,distanceDechetterieKm,distanceDepotChantierKm:parseFloat(form.distanceDepotChantierKm)||0,profondeur:parseFloat(form.profondeur)||0.5,
    volumeFouille:volFouille,volumeCuves:volCuves,volumeRemblais:volRemblais,surfaceFouille,nbCuves,
    mlPVCEnterres,volumeSablePVC:volSablePVC,
    vehiculeId:form.vehiculeId,vehiculeNom:selVehicule?.nom||'',
    vehiculeMortierId:form.vehiculeMortierId,vehiculeMortierNom:selVehiculeMortier?.nom||selVehicule?.nom||'',
    enginId:form.enginId,enginNom:selEngin?.nom||'',typeSolId:form.typeSolId,
    nbPoseurs:parseInt(form.nbPoseurs)||2,epaisseurMortier:parseFloat(form.epaisseurMortier)||0.20,
    tuyauxAvantFiliere:parseFloat(form.tuyauxAvantFiliere)||0,tuyauxApresFiliere:parseFloat(form.tuyauxApresFiliere)||0,
    nbCoudesPVC:parseInt(form.nbCoudesPVC)||0,prixCoudePVC:tarifsMateriaux?.coudePVC||5,
    longueurAeration:parseFloat(form.longueurAeration)||0,longueurVentilation:parseFloat(form.longueurVentilation)||0,ventilationAerienne:parseFloat(form.ventilationAerienne)||0,
    typeRejet:form.typeRejet,
    posteRelevage:form.posteRelevage,longueurCableElec:parseFloat(form.longueurCableElec)||0,sectionCable:form.sectionCable,prixCableMl,prixFourreau:tarifsMateriaux?.fourreauElec||25,coutLigneElec:coutElec,
    nbRehausses:parseInt(form.nbRehausses)||0,prixRehausse:parseFloat(form.prixRehausse)||0,
    restaurationSurface:form.restaurationSurface,restaurationDetails:form.restaurationDetails,
    restauration,
    terreVegetaleM3:restauration?.volumeTerre||0,prixTerreVegetaleM3:tarifsMateriaux?.terreVegetaleM3||25,coutTerreVegetale,
    accessTransport:form.accessTransport,notesInstallateur:form.notesInstallateur,poseSamedi:form.poseSamedi,
    epandage:epandageData,
    remisePourcent:form.remiseType==='pourcent'?parseFloat(form.remisePourcent)||0:0,
    remiseMontant:form.remiseType==='montant'?parseFloat(form.remiseMontant)||0:0,
    sectionsRedactionnelles:form.sections,
    // Blocs à bancher
    blocsAerien,coutBlocsAerien,
    prixBlocBancher:parseFloat(form.prixBlocBancher)||2.50,prixBlocAngle:parseFloat(form.prixBlocAngle)||3.00,prixBetonBlocM3:parseFloat(form.prixBetonBlocM3)||120,prixFerT10Kg:parseFloat(form.prixFerT10Kg)||1.50,
    // Mur soutènement
    murSoutenement:form.murSoutenement,murLongueur:parseFloat(form.murLongueur)||0,murHauteur:parseFloat(form.murHauteur)||0,murEpaisseur:parseFloat(form.murEpaisseur)||0.20,
    murFondation:form.murFondation,murFondLargeur:parseFloat(form.murFondLargeur)||0.40,murFondHauteur:parseFloat(form.murFondHauteur)||0.30,
    murData,coutMurSoutenement,
    scenarios:form.absenceEtudeSol?scenarios:[scenarios[0]],
    totalHT:scenarios[0]?.totalHT||0,totalTVA:scenarios[0]?.totalTVA||0,totalTTC:scenarios[0]?.totalTTC||0,
  })

  const submit = async (e) => {
    e.preventDefault()
    if(!form.typeInstallation){alert('Veuillez sélectionner un type ANC');setStep(2);return}
    const data=buildDevisData()
    if(isEdit){updateDevis(editId,data);navigate(`/devis/${editId}`,{replace:true})}
    else{const saved=await addDevis(data);navigate(`/devis/${saved?.id||'/'}`,{replace:true})}  }

  const steps=[{n:1,l:'Client'},{n:2,l:'Install.'},{n:3,l:'Produit'},{n:4,l:'GPS'},{n:5,l:'Technique'},{n:6,l:'Rédaction'},{n:7,l:'Devis'}]
  const scColors={terre:'border-emerald-500/30 bg-emerald-500/5',mixte:'border-amber-500/30 bg-amber-500/5',roche:'border-red-500/30 bg-red-500/5'}
  const scText={terre:'text-emerald-400',mixte:'text-amber-400',roche:'text-red-400'}

  const FicheInstallateur = () => (
    <div className="bg-bg-card border border-amber-500/25 rounded-lg overflow-hidden sticky top-4">
      <div className="h-8 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between px-3">
        <div className="flex items-center space-x-1.5"><HardHat className="w-3.5 h-3.5 text-amber-400"/><span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Fiche Installateur</span></div>
        <button type="button" onClick={()=>setShowFiche(false)} className="text-amber-400/60 hover:text-amber-400"><EyeOff className="w-3.5 h-3.5"/></button>
      </div>
      <div className="p-3 space-y-2 text-[10px] max-h-[80vh] overflow-y-auto">
        <div className="bg-amber-500/5 border border-amber-500/15 rounded p-2 text-amber-400/80">⚠️ Interne — absent du PDF client.</div>
        <Sec t="Client"><p className="text-white font-medium">{form.prenom} {form.nom}</p><p className="text-gray-500">{form.adresse}, {form.codePostal} {form.ville}</p></Sec>
        <Sec t="🔧 Liste matériaux">
          <ul className="space-y-0.5 text-white">{[
            sel&&`ANC : ${sel.nom}`,
            (parseFloat(form.tuyauxAvantFiliere)||0)>0&&`PVC avant : ${form.tuyauxAvantFiliere} ml`,
            (parseFloat(form.tuyauxApresFiliere)||0)>0&&`PVC après : ${form.tuyauxApresFiliere} ml`,
            (parseInt(form.nbCoudesPVC)||0)>0&&`Coudes : ${form.nbCoudesPVC}`,
            volRemblais>0&&`Remblais 0/20 : ${volRemblais.toFixed(1)} m³`,
            volSablePVC>0&&`Sable PVC : ${volSablePVC.toFixed(2)} m³`,
            blocsAerien&&`Blocs bancher : ${blocsAerien.blocs.totalBlocsDroits} droits + ${blocsAerien.blocs.totalBlocsAngle} angles`,
            blocsAerien&&`Béton remplissage : ${blocsAerien.blocs.volBeton} m³`,
            blocsAerien&&`Fer T10 : ${blocsAerien.blocs.nbBarres6m} barres 6m (${blocsAerien.blocs.poidsFer} kg)`,
            murData&&`Mur soutènement : ${murData.totalBlocs} blocs, ${murData.volBetonTotal} m³ béton`,
            epandageData&&`Gravier épandage : ${epandageData.volumeGravier} m³`,
            epandageData&&`Drains : ${epandageData.longueurDrainTotal} ml`,
            form.posteRelevage&&`Câble élec : ${form.longueurCableElec||'?'} ml (${form.sectionCable}mm²)`,
            form.posteRelevage&&'Fourreau électrique',
            'Dossier photo : 100€',
            ...form.produitsAssocies.map(p=>{const k=kitAssocies.find(x=>x.nom===p);return`✓ ${p} — ${fmtC(k?.prix||150)}`}),
            ...form.produitsSup.map(p=>`➕ ${p.nom} — ${p.prixHT}€`),
          ].filter(Boolean).map((l,i)=><li key={i}>• {l}</li>)}</ul>
        </Sec>
        <Sec t="🧰 Outillage à emmener">
          <ul className="space-y-0.5 text-white">{[
            '🔑 Clé à pipe / clé plate',
            '🪛 Visseuse + forets béton',
            '⛏️ Pelle manuelle + pioche',
            '🪓 Barre à mine / bêche',
            'Niveau à bulle (1m)',
            'Mètre + cordeau',
            'Scie à PVC + colle PVC',
            'Massette + burin',
            selEngin&&`⛽ Gasoil engin (~${Math.ceil((selEngin.consommationLH||8)*8)}L/jour)`,
            form.posteRelevage&&'🔌 Rallonge électrique',
            form.deconstruction&&'Masse + disqueuse',
            form.restaurationSurface&&'Râteau + rouleau gazon',
            'Gants + EPI',
            '📸 Smartphone (photos chantier)',
          ].filter(Boolean).map((l,i)=><li key={i}>• {l}</li>)}</ul>
        </Sec>
        <Sec t="Volumes"><G2 items={[['Fouille',volFouille.toFixed(1)+' m³'],['Remblais',volRemblais.toFixed(1)+' m³'],['Foisonné',(volFouille*1.3).toFixed(1)+' m³']]}/></Sec>
        <Sec t="Notes"><textarea value={form.notesInstallateur} onChange={e=>set('notesInstallateur',e.target.value)} rows={3} placeholder="Notes libres..." className="w-full mt-0.5 px-2 py-1.5 bg-bg-input border border-white/10 rounded text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"/></Sec>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>navigate(isEdit?`/devis/${editId}`:'/')} className="flex items-center space-x-1 text-gray-500 hover:text-rose text-xs font-medium"><ArrowLeft className="w-3.5 h-3.5"/><span>Retour</span></button>
        <button type="button" onClick={()=>setShowFiche(!showFiche)} className={`h-7 px-2.5 text-[10px] font-semibold rounded border flex items-center space-x-1 transition-all ${showFiche?'bg-amber-500/20 text-amber-400 border-amber-500/40':'bg-white/5 text-gray-400 border-white/10 hover:border-amber-500/30'}`}><HardHat className="w-3.5 h-3.5"/><span>{showFiche?'Masquer':'Fiche'}</span></button>
      </div>
      <h1 className="font-display text-xl font-bold text-white mb-1">{isEdit?`Modifier N° ${existingDevis?.numeroDevis||''}`:'Nouveau devis'}</h1>

      <div className="flex items-center space-x-0.5 mb-4 flex-wrap gap-y-1">{steps.map((s,i)=>(
        <div key={s.n} className="flex items-center"><button type="button" onClick={()=>setStep(s.n)} className={`flex items-center space-x-0.5 px-1.5 py-1 rounded text-[9px] font-semibold transition-all ${step===s.n?'bg-rose text-white shadow-[0_0_10px_rgba(200,80,155,0.2)]':step>s.n?'bg-rose/10 text-rose':'bg-white/5 text-gray-500'}`}><span className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center text-[7px]">{s.n}</span><span>{s.l}</span></button>{i<6&&<div className="w-1.5 h-px bg-white/10 mx-0.5"/>}</div>
      ))}</div>

      <div className={`grid gap-4 ${showFiche?'lg:grid-cols-[1fr,260px]':''}`}>
        <form onSubmit={submit}>

          {step===1&&<Window title="1 — Client"><div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>Nom *</label><input value={form.nom} onChange={e=>set('nom',e.target.value)} className={inp} required placeholder="Dupont"/></div><div><label className={lbl}>Prénom *</label><input value={form.prenom} onChange={e=>set('prenom',e.target.value)} className={inp} required placeholder="Jean"/></div></div>
            <div><label className={lbl}>Adresse *</label><input value={form.adresse} onChange={e=>set('adresse',e.target.value)} className={inp} required placeholder="12 rue des Lilas"/></div>
            <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>Code postal *</label><input value={form.codePostal} onChange={e=>set('codePostal',e.target.value)} className={inp} required placeholder="75000" maxLength={5}/></div><div><label className={lbl}>Ville *</label>{form.communesSuggestions.length>1?<select value={form.ville} onChange={e=>set('ville',e.target.value)} className={inp} required><option value="">— Commune —</option>{form.communesSuggestions.map((c,i)=><option key={i} value={c.nom}>{c.nom}</option>)}</select>:<input value={form.ville} onChange={e=>set('ville',e.target.value)} className={inp} required placeholder="Ville"/>}</div></div>
            <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>Téléphone *</label><input type="tel" value={form.telephone} onChange={e=>set('telephone',e.target.value)} className={inp} required placeholder="06..."/></div><div><label className={lbl}>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} className={inp} placeholder="client@..."/></div></div>
            <div className="flex justify-end pt-2"><button type="button" onClick={()=>setStep(2)} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded">Suivant →</button></div>
          </div></Window>}

          {step===2&&<Window title="2 — Installation"><div className="p-5 space-y-4">
            <div><label className={lbl}>Type ANC *</label><div className="space-y-1">{TYPES_INSTALLATION.map(t=>(<label key={t.id} className={`flex items-center space-x-3 px-3 py-2 rounded border cursor-pointer transition-all ${form.typeInstallation===t.id?'bg-rose/10 border-rose/40 text-white':'bg-bg-input border-white/5 text-gray-400 hover:border-white/15'}`}><input type="radio" name="ti" value={t.id} checked={form.typeInstallation===t.id} onChange={e=>{set('typeInstallation',e.target.value);if(!isEdit)set('produitId','')}} className="w-3.5 h-3.5 text-rose bg-bg-input border-gray-600"/><span className="text-xs font-medium">{t.nom}</span></label>))}</div></div>
            <div><label className={lbl}>Mode *</label><div className="space-y-1">{MODES_INSTALLATION.map(m=>(<label key={m.id} className={`flex items-start space-x-3 px-3 py-2 rounded border cursor-pointer transition-all ${form.modeInstallation===m.id?'bg-rose/10 border-rose/40 text-white':'bg-bg-input border-white/5 text-gray-400 hover:border-white/15'}`}><input type="radio" name="mi" value={m.id} checked={form.modeInstallation===m.id} onChange={e=>set('modeInstallation',e.target.value)} className="w-3.5 h-3.5 mt-0.5 text-rose bg-bg-input border-gray-600"/><div><span className="text-xs font-medium">{m.nom}</span><p className="text-[10px] text-gray-500">{m.d}</p></div></label>))}</div></div>
            <div className="border-t border-white/5 pt-3"><label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" checked={form.absenceEtudeSol} onChange={e=>set('absenceEtudeSol',e.target.checked)} className="w-4 h-4 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs font-medium text-gray-300">Absence d'étude de sol</span></label>{form.absenceEtudeSol&&<Info>⚠️ <strong className="text-amber-300">3 devis seront générés</strong></Info>}</div>
            <div className="border-t border-white/5 pt-3"><label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" checked={form.deconstruction} onChange={e=>set('deconstruction',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs font-medium text-gray-300">Déconstruction existante</span></label>{form.deconstruction&&<div className="ml-6 grid grid-cols-3 gap-1.5">{[['decoLongueur','Long.'],['decoLargeur','Larg.'],['decoHauteur','Prof.']].map(([k,p])=>(<div key={k}><label className="text-[8px] text-gray-600">{p} (m)</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} step="0.1" min="0" className={inp}/></div>))}</div>}</div>
            <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(1)} className="h-8 px-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded">← Retour</button><button type="button" onClick={()=>setStep(3)} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded">Suivant →</button></div>
          </div></Window>}

          {step===3&&<Window title="3 — Produit"><div className="p-5 space-y-4">
            {produitsFiltered.length===0?<div className="py-6 text-center bg-amber-500/5 border border-amber-500/15 rounded space-y-3"><p className="text-xs text-amber-400">Aucun produit.</p><button type="button" onClick={()=>navigate('/produits')} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded">📦 Base données</button></div>:(<>
              <div><label className={lbl}>Modèle ANC *</label><select value={form.produitId} onChange={e=>set('produitId',e.target.value)} className={`${inp} ${!form.produitId?'border-red-500/40':''}`} required><option value="">— Sélectionner —</option>{(() => {
                  // Grouper par fournisseur, trier par nom
                  const grouped = {}
                  produitsFiltered.forEach(p => {
                    const f = fournisseurs.find(x => x.id === p.fournisseurId)
                    const fNom = f?.nom || 'Autre'
                    if (!grouped[fNom]) grouped[fNom] = []
                    grouped[fNom].push(p)
                  })
                  return Object.keys(grouped).sort().map(fNom => (
                    <optgroup key={fNom} label={fNom}>
                      {grouped[fNom].sort((a,b) => (a.nom||'').localeCompare(b.nom||'')).map(p => (
                        <option key={p.id} value={p.id}>{p.nom}{p.materiau ? ` [${p.materiau.toUpperCase()}]` : ''} — {p.prixHT ? `${p.prixHT}€` : 'N/D'}</option>
                      ))}
                    </optgroup>
                  ))
                })()}</select></div>
              {!form.produitId&&<div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">⚠️ Sélectionnez un produit ANC pour continuer</div>}
              {sel&&<div className="bg-rose/10 border border-rose/25 rounded p-3"><p className="text-sm font-medium text-rose">{sel.nom}</p><div className="text-[10px] text-rose/70 space-y-0.5">{sel.cuves?.length>0&&<p>{sel.cuves.length} cuve(s): {sel.cuves.map((c,i)=>`C${i+1}: ${c.longueur||'?'}×${c.largeur||'?'}×${c.hauteur||'?'}m`).join(' + ')}</p>}{volFouille>0&&<p>Fouille: {volFouille.toFixed(1)}m³ | Cuves: {volCuves.toFixed(1)}m³ | Remblais: {volRemblais.toFixed(1)}m³</p>}{sel.prixHT>0&&<p className="font-bold text-rose text-xs">{sel.prixHT}€ HT</p>}</div></div>}
            </>)}
            {kitAssocies.length>0&&<div className="border-t border-white/5 pt-3"><label className={lbl}>Fournitures associées</label><div className="space-y-1">{kitAssocies.map((k,i)=>(<label key={i} className={`flex items-center space-x-2 px-3 py-2 rounded border cursor-pointer transition-all ${form.produitsAssocies.includes(k.nom)?'bg-rose/10 border-rose/30':'bg-bg-input border-white/5 hover:border-white/15'}`}><input type="checkbox" checked={form.produitsAssocies.includes(k.nom)} onChange={()=>toggleAssoc(k.nom)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs text-gray-300 flex-1">{k.nom}{k.obligatoire&&<span className="ml-1.5 text-[8px] text-rose font-bold">OBLIGATOIRE</span>}</span><span className="text-[10px] text-gray-500 font-medium">{fmtC(k.prix||150)}</span></label>))}</div>{form.produitsAssocies.length>0&&<p className="text-[9px] text-gray-500 mt-1">Total fournitures : {fmtC(form.produitsAssocies.reduce((s,nom)=>{const k=kitAssocies.find(x=>x.nom===nom);return s+(k?.prix||150)},0))}</p>}</div>}

            {/* Produits supplémentaires depuis la BD ou saisie libre */}
            <div className="border-t border-white/5 pt-3">
              <label className={lbl}>Produits supplémentaires (poste de relevage, cuves, etc.)</label>
              {form.produitsSup.length>0&&<div className="space-y-1 mb-2">{form.produitsSup.map((ps,i)=>{
                const pObj=produits.find(p=>p.id===ps.id)
                return<div key={i} className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div><p className="text-xs font-medium text-white">{pObj?.nom||ps.nom||'?'}{ps.custom&&<span className="ml-1 text-[8px] text-amber-400">(libre)</span>}</p><p className="text-[9px] text-blue-400">{ps.prixHT}€ HT</p></div>
                  <button type="button" onClick={()=>set('produitsSup',form.produitsSup.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              })}</div>}
              <select value="" onChange={e=>{
                const p=produits.find(x=>x.id===e.target.value)
                if(p&&!form.produitsSup.find(x=>x.id===p.id)){
                  set('produitsSup',[...form.produitsSup,{id:p.id,nom:p.nom,prixHT:p.prixHT||0}])
                }
              }} className={inp}>
                <option value="">+ Ajouter depuis le catalogue…</option>
                {produits.filter(p=>p.id!==form.produitId&&!form.produitsSup.find(x=>x.id===p.id)).sort((a,b)=>(a.nom||'').localeCompare(b.nom||'')).map(p=>{
                  const f=fournisseurs.find(x=>x.id===p.fournisseurId)
                  const cat=categories.find(c=>c.id===p.categorieId)
                  return<option key={p.id} value={p.id}>{cat?`[${cat.nom}] `:''}{p.nom} ({f?.nom||'?'}) — {p.prixHT?`${p.prixHT}€`:'N/D'}</option>
                })}
              </select>
              {/* Saisie libre */}
              <div className="flex items-center gap-1 mt-1.5">
                <input id="psl_nom" type="text" placeholder="Nom libre (ex: Pompe de relevage)" className={`${inp} flex-1`}/>
                <input id="psl_prix" type="number" placeholder="€ HT" min="0" className={`${inp} w-20`}/>
                <button type="button" onClick={()=>{
                  const n=document.getElementById('psl_nom'), p=document.getElementById('psl_prix')
                  if(n?.value?.trim()&&parseFloat(p?.value)>=0){
                    set('produitsSup',[...form.produitsSup,{id:'custom_'+Date.now(),nom:n.value.trim(),prixHT:parseFloat(p.value)||0,custom:true}])
                    n.value='';p.value=''
                  }
                }} className="h-9 px-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs rounded hover:bg-blue-500/30">+ Libre</button>
              </div>
              {form.produitsSup.length>0&&<p className="text-[9px] text-gray-500 mt-1">Total suppl. : {fmtC(form.produitsSup.reduce((s,p)=>s+(p.prixHT||0),0))}</p>}
            </div>

            <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(2)} className="h-8 px-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded">← Retour</button><button type="button" onClick={()=>{if(!form.produitId){alert('Veuillez sélectionner un produit ANC');return};setStep(4)}} className={`h-8 px-4 text-white text-xs font-semibold rounded ${form.produitId?'bg-rose':'bg-gray-600 cursor-not-allowed'}`}>Suivant →</button></div>
          </div></Window>}

          {step===4&&<Window title="4 — GPS"><div className="p-5 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={()=>set('activeMapMarker',form.activeMapMarker==='anc'?null:'anc')} className={`h-8 px-3 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all ${form.activeMapMarker==='anc'?'bg-red-500/20 text-red-400 border border-red-500/40 ring-2 ring-red-500/20':'bg-bg-input border border-white/10 text-gray-400 hover:border-rose/30'}`}><MapPin className="w-3 h-3"/><span>📍 ANC{form.gpsAncLat?' ✓':''}</span></button>
              <button type="button" onClick={()=>set('activeMapMarker',form.activeMapMarker==='remblais'?null:'remblais')} className={`h-8 px-3 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all ${form.activeMapMarker==='remblais'?'bg-orange-500/20 text-orange-400 border border-orange-500/40 ring-2 ring-orange-500/20':'bg-bg-input border border-white/10 text-gray-400 hover:border-rose/30'}`}><Navigation className="w-3 h-3"/><span>🚛 Dépôt{form.gpsRemblaisLat?' ✓':''}</span></button>
              <button type="button" onClick={()=>set('activeMapMarker',form.activeMapMarker==='fournisseur'?null:'fournisseur')} className={`h-8 px-3 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all ${form.activeMapMarker==='fournisseur'?'bg-blue-500/20 text-blue-400 border border-blue-500/40 ring-2 ring-blue-500/20':'bg-bg-input border border-white/10 text-gray-400 hover:border-rose/30'}`}><MapPin className="w-3 h-3"/><span>🏭 Fournisseur{form.gpsFournisseurLat?' ✓':''}</span></button>
              <button type="button" onClick={()=>set('activeMapMarker',form.activeMapMarker==='mortier'?null:'mortier')} className={`h-8 px-3 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all ${form.activeMapMarker==='mortier'?'bg-green-500/20 text-green-400 border border-green-500/40 ring-2 ring-green-500/20':'bg-bg-input border border-white/10 text-gray-400 hover:border-rose/30'}`}><MapPin className="w-3 h-3"/><span>🏗️ Centrale béton{form.gpsMortierLat?' ✓':''}</span></button>
              {form.deconstruction&&<button type="button" onClick={()=>set('activeMapMarker',form.activeMapMarker==='dechetterie'?null:'dechetterie')} className={`h-8 px-3 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all ${form.activeMapMarker==='dechetterie'?'bg-purple-500/20 text-purple-400 border border-purple-500/40 ring-2 ring-purple-500/20':'bg-bg-input border border-white/10 text-gray-400 hover:border-rose/30'}`}><MapPin className="w-3 h-3"/><span>♻️ Déchetterie{form.gpsDechetterieLat?' ✓':''}</span></button>}
            </div>
            {form.activeMapMarker&&<div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400">➤ Mode <strong>{form.activeMapMarker==='anc'?'ANC':form.activeMapMarker==='remblais'?'Dépôt':form.activeMapMarker==='fournisseur'?'Fournisseur':form.activeMapMarker==='dechetterie'?'Déchetterie':'Centrale béton'}</strong> — cliquez sur la carte.</div>}
            <MapPicker markers={mapMarkers} activeMarker={form.activeMapMarker} onMarkerPlace={handleMapPlace} height="340px"/>
            <div className="space-y-1">
              {distanceKm>0&&<Info>🚛 Évacuation (ANC → Dépôt) : <strong className="text-white">{distanceKm.toFixed(1)} km</strong> — A/R : {(distanceKm*2).toFixed(1)} km</Info>}
              {distanceLivraisonKm>0&&<Info>🏭 Livraison (Fournisseur → ANC) : <strong className="text-blue-400">{distanceLivraisonKm.toFixed(1)} km</strong> — A/R : {(distanceLivraisonKm*2).toFixed(1)} km</Info>}
              {distanceMortierKm>0&&<Info>🏗️ Mortier (Centrale → ANC) : <strong className="text-green-400">{distanceMortierKm.toFixed(1)} km</strong> — A/R : {(distanceMortierKm*2).toFixed(1)} km</Info>}
              {distanceDechetterieKm>0&&<Info>♻️ Déchetterie (ANC → Déchetterie) : <strong className="text-purple-400">{distanceDechetterieKm.toFixed(1)} km</strong> — A/R : {(distanceDechetterieKm*2).toFixed(1)} km</Info>}
            </div>
            <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(3)} className="h-8 px-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded">← Retour</button><button type="button" onClick={()=>setStep(5)} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded">Suivant →</button></div>
          </div></Window>}

          {step===5&&<Window title="5 — Technique"><div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div><label className={lbl}>Profondeur fil d'eau (m)</label><input type="number" value={form.profondeur} onChange={e=>set('profondeur',e.target.value)} step="0.1" min="0.3" className={inp}/></div>
              <div><label className={lbl}>Accès chantier</label><select value={form.accessTransport} onChange={e=>handleAccessChange(e.target.value)} className={inp}><option value="semi">Semi-remorque OK</option><option value="17t">17 tonnes max</option><option value="10t">10 tonnes max</option><option value="benne">Benne 3.5t seulement</option></select></div>
              <div><label className={lbl}>Nb poseurs sur chantier</label><input type="number" value={form.nbPoseurs} onChange={e=>set('nbPoseurs',e.target.value)} min="1" max="6" className={inp}/></div>
              <div><label className={lbl}>Contrôleur SPANC</label><select value={form.spancId||''} onChange={e=>set('spancId',e.target.value)} className={inp}><option value="">— Aucun —</option>{(controleursSPANC||[]).map(c=><option key={c.id} value={c.id}>{c.nom}{c.organisme?' — '+c.organisme:''}</option>)}</select></div>
            </div>
            {/* ENGIN + TYPE DE SOL */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>🏗️ Engin de terrassement 
                  {suggestEnginVehicule(form.accessTransport).enginId === form.enginId 
                    ? <span className="ml-1.5 text-emerald-400 text-[8px]">✓ auto</span>
                    : <span className="ml-1.5 text-amber-400 text-[8px]">⚠ override</span>}
                </label>
                <select value={form.enginId} onChange={e=>set('enginId',e.target.value)} className={inp}>{enginsData.filter(e=>e.rendementM3h>0).map(e=><option key={e.id} value={e.id}>{e.nom} ({e.rendementM3h}m³/h · {e.coutHoraire}€/h · {e.consommationLH}L/h)</option>)}</select>
              </div>
              {!form.absenceEtudeSol&&<div><label className={lbl}>🪨 Type de sol</label><select value={form.typeSolId} onChange={e=>set('typeSolId',e.target.value)} className={inp}>{TYPES_SOL.map(s=><option key={s.id} value={s.id}>{s.nom} (×{s.multiplicateur})</option>)}</select></div>}
              {form.absenceEtudeSol&&<div><label className={lbl}>🪨 Type de sol</label><p className="h-9 flex items-center text-xs text-amber-400 font-medium">⚠️ 3 scénarios (terre, mixte, roche)</p></div>}
            </div>
            {selEngin&&<Info>⚙️ <strong className="text-white">{selEngin.nom}</strong> : rendement base {selEngin.rendementM3h} m³/h
              {!form.absenceEtudeSol&&` → sol ${(TYPES_SOL.find(s=>s.id===form.typeSolId)||TYPES_SOL[0]).nom} (×${(TYPES_SOL.find(s=>s.id===form.typeSolId)||TYPES_SOL[0]).multiplicateur}) = ${(selEngin.rendementM3h / (TYPES_SOL.find(s=>s.id===form.typeSolId)||TYPES_SOL[0]).multiplicateur).toFixed(1)} m³/h effectif`}
               · conso {selEngin.consommationLH} L/h · dépl. {selEngin.deplacement}€</Info>}
            <div className="grid grid-cols-3 gap-2">
              <div><label className={lbl}>🚛 Véhicule évacuation</label><select value={form.vehiculeId} onChange={e=>set('vehiculeId',e.target.value)} className={inp}><option value="">— Sélectionner —</option>{vehicules.map(v=>{const cu=(v.ptac||0)-(v.poidsVide||0);return<option key={v.id} value={v.id}>{v.nom} (CU {cu.toFixed(1)}t · {v.capaciteM3}m³ · {v.prixKm||0}€/km)</option>})}</select></div>
              <div><label className={lbl}>🏗️ Véhicule mortier</label><select value={form.vehiculeMortierId} onChange={e=>set('vehiculeMortierId',e.target.value)} className={inp}><option value="">— Même véhicule —</option>{vehicules.map(v=>{const cu=(v.ptac||0)-(v.poidsVide||0);return<option key={v.id} value={v.id}>{v.nom} (CU {cu.toFixed(1)}t · {v.capaciteM3}m³ · {v.prixKm||0}€/km)</option>})}</select></div>
              <div><label className={lbl}>📍 Distance dépôt → chantier (km)</label><input type="number" value={form.distanceDepotChantierKm} onChange={e=>set('distanceDepotChantierKm',e.target.value)} min="0" step="1" className={inp} placeholder="30"/></div>
            </div>
            {/* DALLE MORTIER AUTO */}
            {sel?.dalleMortierObligatoire&&<div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 font-bold">🏗️ Ce produit exige une dalle de mortier — section ci-dessous pré-activée.</div>}
            {surfaceFouille>0&&<div className="bg-green-500/5 border border-green-500/15 rounded p-3">
              <label className={lbl}>🏗️ Dalle mortier (fond de fouille)</label>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[9px] text-gray-600">Surface fouille (m²)</label><p className="h-9 flex items-center text-sm text-green-400 font-medium">{surfaceFouille.toFixed(1)} m²</p></div>
                <div><label className="text-[9px] text-gray-600">Épaisseur (m)</label><input type="number" value={form.epaisseurMortier} onChange={e=>set('epaisseurMortier',e.target.value)} step="0.05" min="0.05" max="0.50" className={inp}/></div>
                <div><label className="text-[9px] text-gray-600">Volume mortier</label><p className="h-9 flex items-center text-sm text-green-400 font-medium">{(surfaceFouille*(parseFloat(form.epaisseurMortier)||0.20)).toFixed(2)} m³</p></div>
              </div>
              {scenarios[0]&&<div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">{[
                ['Voyages',`${scenarios[0].nbVoyMortier}`],
                ['Matière',`${scenarios[0].volMortier.toFixed(2)} m³ × ${tarifsMateriaux?.mortierM3||120}€ = ${fmtC(scenarios[0].coutMortierMatiere)}`],
                ['Transport km',`${fmtC(scenarios[0].coutMortierVehiculeKm)}`],
              ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-green-300 font-medium">{v}</p></div>)}</div>}
              {!form.gpsMortierLat&&<p className="text-[9px] text-amber-400 mt-1">⚠️ Placez le point GPS « 🏗️ Mortier » à l'étape 4 pour calculer le transport</p>}
            </div>}

            {parseInt(form.nbRehausses)>0&&<div className="bg-amber-500/5 border border-amber-500/15 rounded p-3"><p className="text-[10px] text-amber-400 font-bold mb-1">⚠️ Rehausses nécessaires</p><div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] text-gray-600">Nb</label><input type="number" value={form.nbRehausses} onChange={e=>set('nbRehausses',e.target.value)} min="0" className={inp}/></div><div><label className="text-[9px] text-gray-600">Prix u. (€)</label><input type="number" value={form.prixRehausse} onChange={e=>set('prixRehausse',e.target.value)} className={inp}/></div></div><p className="text-[9px] text-gray-500 mt-1">Total : {fmtC(coutRehausses)}</p></div>}

            <div className="border-t border-white/5 pt-3"><label className={lbl}>🔧 Tuyauterie PVC</label><div className="grid grid-cols-3 gap-2"><div><label className="text-[9px] text-gray-600">Avant filière (ml)</label><input type="number" value={form.tuyauxAvantFiliere} onChange={e=>set('tuyauxAvantFiliere',e.target.value)} step="0.5" min="0" className={inp} placeholder="0"/></div><div><label className="text-[9px] text-gray-600">Après filière (ml)</label><input type="number" value={form.tuyauxApresFiliere} onChange={e=>set('tuyauxApresFiliere',e.target.value)} step="0.5" min="0" className={inp} placeholder="0"/></div><div><label className="text-[9px] text-gray-600">Coudes (qté)</label><input type="number" value={form.nbCoudesPVC} onChange={e=>set('nbCoudesPVC',e.target.value)} min="0" className={inp} placeholder="0"/></div></div>{parseInt(form.nbCoudesPVC)>0&&<p className="text-[9px] text-gray-500 mt-1">Coudes : {form.nbCoudesPVC} × {fmtC(tarifsMateriaux?.coudePVC||5)} = {fmtC(coutCoudes)} <span className="text-gray-600">(prix dans Paramètres → Tarifs)</span></p>}</div>

            <div className="border-t border-white/5 pt-3"><label className={lbl}>🌬️ Aération & Ventilation</label><div className="grid grid-cols-3 gap-2"><div><label className="text-[9px] text-gray-600">Aération (ml)</label><input type="number" value={form.longueurAeration} onChange={e=>set('longueurAeration',e.target.value)} step="0.5" min="0" className={inp} placeholder="0"/></div><div><label className="text-[9px] text-gray-600">Ventilation (ml)</label><input type="number" value={form.longueurVentilation} onChange={e=>set('longueurVentilation',e.target.value)} step="0.5" min="0" className={inp} placeholder="0"/></div><div><label className="text-[9px] text-gray-600">dont aérien (ml)</label><input type="number" value={form.ventilationAerienne} onChange={e=>set('ventilationAerienne',e.target.value)} step="0.5" min="0" className={inp} placeholder="0"/></div></div>
              {mlPVCEnterres>0&&<Info>📐 PVC enterrés : <strong className="text-white">{mlPVCEnterres.toFixed(1)} ml</strong> → Sable : <strong className="text-white">{volSablePVC.toFixed(2)} m³</strong></Info>}
            </div>

            <div className="border-t border-white/5 pt-3"><label className={lbl}>🌊 Type de rejet</label><div className="grid grid-cols-2 gap-1">{TYPES_REJET.map(r=>(<label key={r.id} className={`flex items-center space-x-2 px-3 py-2 rounded border cursor-pointer transition-all ${form.typeRejet===r.id?'bg-rose/10 border-rose/40 text-white':'bg-bg-input border-white/5 text-gray-400 hover:border-white/15'}`}><input type="radio" name="rejet" value={r.id} checked={form.typeRejet===r.id} onChange={e=>set('typeRejet',e.target.value)} className="w-3 h-3 text-rose bg-bg-input border-gray-600"/><span className="text-[10px] font-medium">{r.nom}</span></label>))}</div></div>

            <div className="border-t border-white/5 pt-3"><label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" checked={form.posteRelevage} onChange={e=>set('posteRelevage',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs font-medium text-gray-300">⚡ Poste de relevage</span></label>
              {form.posteRelevage&&<div className="ml-6 space-y-2"><Info>Le client devra faire installer un fusible dédié + fourreau au tableau électrique.</Info>
                {!form.longueurCableElec&&<div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-bold">⚠️ Longueur de câble électrique obligatoire !</div>}
                <div className="grid grid-cols-3 gap-2"><div><label className="text-[9px] text-gray-600">Câble élec (ml) *</label><input type="number" value={form.longueurCableElec} onChange={e=>set('longueurCableElec',e.target.value)} min="0" className={`${inp} ${!form.longueurCableElec?'border-red-500/40 ring-1 ring-red-500/20':''}`} placeholder="obligatoire"/></div><div><label className="text-[9px] text-gray-600">Section câble</label><select value={form.sectionCable} onChange={e=>set('sectionCable',e.target.value)} className={inp}><option value="2.5">2,5 mm² ({tarifsMateriaux?.cableElec25Ml||6}€/ml)</option><option value="4">4 mm² ({tarifsMateriaux?.cableElec4Ml||8}€/ml)</option><option value="6">6 mm² ({tarifsMateriaux?.cableElec6Ml||12}€/ml)</option></select></div><div><label className="text-[9px] text-gray-600">Fourreau</label><p className="h-9 flex items-center text-sm text-gray-400">{fmtC(tarifsMateriaux?.fourreauElec||25)}</p></div></div>{coutElec>0&&<p className="text-[9px] text-gray-500">Total élec : {fmtC(coutElec)} <span className="text-gray-600">(câble {prixCableMl}€/ml × {form.longueurCableElec}ml + fourreau {fmtC(tarifsMateriaux?.fourreauElec||25)})</span></p>}</div>}
            </div>

            {/* BLOCS À BANCHER (aérien/semi-enterré) */}
            {isAerien&&sel&&<div className="border-t border-white/5 pt-3 bg-orange-500/5 border border-orange-500/15 rounded p-3">
              <label className={lbl}>🧱 Blocs à bancher — habillage aérien</label>
              {blocsAerien ? (<>
                <div className="grid grid-cols-4 gap-1 mb-2 text-[10px]">{[
                  ['Emprise ext.',`${blocsAerien.emprise.longueurExt}×${blocsAerien.emprise.largeurExt}m`],
                  ['Hauteur mur',`${blocsAerien.emprise.hauteurMur}m (${blocsAerien.blocs.nbRangs} rangs)`],
                  ['Blocs droits',`${blocsAerien.blocs.totalBlocsDroits}`],
                  ['Blocs angle',`${blocsAerien.blocs.totalBlocsAngle}`],
                  ['Total blocs',`${blocsAerien.blocs.totalBlocs}`],
                  ['Béton rempl.',`${blocsAerien.blocs.volBeton} m³`],
                  ['Fer T10',`${blocsAerien.blocs.mlFerTotal} ml (${blocsAerien.blocs.poidsFer} kg)`],
                  ['Barres 6m',`${blocsAerien.blocs.nbBarres6m}`],
                ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-orange-300 font-medium">{v}</p></div>)}</div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div><label className="text-[9px] text-gray-600">Prix bloc droit (€)</label><input type="number" value={form.prixBlocBancher} onChange={e=>set('prixBlocBancher',e.target.value)} step="0.10" className={inp}/></div>
                  <div><label className="text-[9px] text-gray-600">Prix bloc angle (€)</label><input type="number" value={form.prixBlocAngle} onChange={e=>set('prixBlocAngle',e.target.value)} step="0.10" className={inp}/></div>
                  <div><label className="text-[9px] text-gray-600">Béton (€/m³)</label><input type="number" value={form.prixBetonBlocM3} onChange={e=>set('prixBetonBlocM3',e.target.value)} step="5" className={inp}/></div>
                  <div><label className="text-[9px] text-gray-600">Fer T10 (€/kg)</label><input type="number" value={form.prixFerT10Kg} onChange={e=>set('prixFerT10Kg',e.target.value)} step="0.10" className={inp}/></div>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px]">{[
                  ['Blocs droits',`${blocsAerien.blocs.totalBlocsDroits} × ${blocsAerien.couts.prixBloc}€ = ${blocsAerien.couts.coutBlocsDroits}€`],
                  ['Blocs angle',`${blocsAerien.blocs.totalBlocsAngle} × ${blocsAerien.couts.prixBlocAngle}€ = ${blocsAerien.couts.coutBlocsAngle}€`],
                  ['Béton',`${blocsAerien.blocs.volBeton}m³ × ${blocsAerien.couts.prixBetonM3}€ = ${blocsAerien.couts.coutBeton}€`],
                  ['Ferraillage',`${blocsAerien.blocs.poidsFer}kg × ${blocsAerien.couts.prixFerKg}€ = ${blocsAerien.couts.coutFer}€`],
                ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-white font-medium">{v}</p></div>)}</div>
                <p className="text-xs text-orange-400 font-bold mt-2 text-right">Total habillage : {fmtC(blocsAerien.couts.coutTotal)}</p>
              </>) : <p className="text-[10px] text-gray-500">Sélectionnez un produit ANC pour voir le calcul</p>}
            </div>}

            {/* MUR DE SOUTÈNEMENT */}
            <div className="border-t border-white/5 pt-3">
              <label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" checked={form.murSoutenement} onChange={e=>set('murSoutenement',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs font-medium text-gray-300">🧱 Mur de soutènement</span></label>
              {form.murSoutenement&&<div className="ml-6 bg-purple-500/5 border border-purple-500/15 rounded p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[9px] text-gray-600">Longueur (m) *</label><input type="number" value={form.murLongueur} onChange={e=>set('murLongueur',e.target.value)} step="0.5" min="0" className={inp} placeholder="ex: 6"/></div>
                  <div><label className="text-[9px] text-gray-600">Hauteur (m) *</label><input type="number" value={form.murHauteur} onChange={e=>set('murHauteur',e.target.value)} step="0.2" min="0" className={inp} placeholder="ex: 1.20"/></div>
                  <div><label className="text-[9px] text-gray-600">Épaisseur (m)</label><select value={form.murEpaisseur} onChange={e=>set('murEpaisseur',e.target.value)} className={inp}><option value="0.20">20 cm (standard)</option><option value="0.27">27 cm (renforcé)</option></select></div>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.murFondation} onChange={e=>set('murFondation',e.target.checked)} className="w-3 h-3 rounded border-gray-600 text-purple-400 bg-bg-input"/><span className="text-[10px] text-gray-400">Semelle de fondation</span></label>
                {form.murFondation&&<div className="grid grid-cols-2 gap-2 ml-5">
                  <div><label className="text-[9px] text-gray-600">Largeur fondation (m)</label><input type="number" value={form.murFondLargeur} onChange={e=>set('murFondLargeur',e.target.value)} step="0.05" className={inp}/></div>
                  <div><label className="text-[9px] text-gray-600">Hauteur fondation (m)</label><input type="number" value={form.murFondHauteur} onChange={e=>set('murFondHauteur',e.target.value)} step="0.05" className={inp}/></div>
                </div>}
                {murData&&<div className="mt-2 space-y-1">
                  <div className="grid grid-cols-4 gap-1 text-[10px]">{[
                    ['Rangs',`${murData.nbRangs} (${murData.hauteur}m)`],
                    ['Blocs',`${murData.totalBlocs}`],
                    ['Béton mur',`${murData.volBetonMur} m³`],
                    murData.fondation&&['Béton fondation',`${murData.volBetonFondation} m³`],
                    ['Béton total',`${murData.volBetonTotal} m³`],
                    ['Fer T10',`${murData.mlFerTotal} ml (${murData.poidsFer}kg)`],
                    ['Barres 6m',`${murData.nbBarres6m}`],
                    ['TOTAL',fmtC(murData.couts.coutTotal)],
                  ].filter(Boolean).map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className={`font-medium ${l==='TOTAL'?'text-purple-400':'text-white'}`}>{v}</p></div>)}</div>
                </div>}
              </div>}
            </div>

                        {/* ÉPANDAGE */}
            {hasEpandage(form.typeInstallation)&&<div className="border-t border-white/5 pt-3 bg-blue-500/5 border border-blue-500/15 rounded p-3"><label className={lbl}>🌿 Épandage (DT 64.1)</label><div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] text-gray-600">Surface épandage (m²)</label><input type="number" value={form.epandageSurface} onChange={e=>set('epandageSurface',e.target.value)} min="0" step="1" className={inp} placeholder="ex: 15"/></div><div><label className="text-[9px] text-gray-600">Nb drains (auto si vide)</label><input type="number" value={form.epandageNbDrains} onChange={e=>set('epandageNbDrains',e.target.value)} min="0" className={inp} placeholder="auto"/></div></div>
              {epandageData&&<div className="mt-2 space-y-1 text-[10px]"><div className="grid grid-cols-3 gap-1">{[['Drains',`${epandageData.nbDrains} × ${epandageData.longueurParDrain}ml`],['Total drains',`${epandageData.longueurDrainTotal} ml`],['Gravier 20/40',`${epandageData.volumeGravier} m³`],['Terre évacuée',`${epandageData.terreEvacuee} m³`],['Foisonné ép.',`${epandageData.foisonneEpandage} m³`],['Coût ép.',fmtC(coutEpandage)]].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-white font-medium">{v}</p></div>)}</div></div>}
            </div>}

            <div className="border-t border-white/5 pt-3"><label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" checked={form.restaurationSurface} onChange={e=>set('restaurationSurface',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-xs font-medium text-gray-300">🌿 Restauration surface</span></label>
              {form.restaurationSurface&&<div className="ml-6 space-y-2">{restauration&&<Info>Auto-calcul : emprise {surfaceFouille.toFixed(1)} m² × 3 = <strong className="text-white">{restauration.surfaceRestauree} m²</strong> restaurés<br/>Terre végétale : {restauration.surfaceRestauree} × 0.25m = <strong className="text-white">{restauration.volumeTerre} m³</strong> × {fmtC(restauration.pxTerre)}/m³ = {fmtC(restauration.coutTerre)}<br/>Graine gazon : {restauration.surfaceRestauree} m² × {fmtC(restauration.pxGraine)}/m² = {fmtC(restauration.coutGraine)}<br/>🏷️ <strong className="text-rose">Total restauration : {fmtC(restauration.coutTotal)}</strong></Info>}<textarea value={form.restaurationDetails} onChange={e=>set('restaurationDetails',e.target.value)} rows={1} placeholder="Détails..." className={inp+" !h-auto py-2 resize-none"}/></div>}
            </div>

            {/* COÛTS ADDITIFS DÉTAILLÉS */}
            {scenarios[0]?.mainOeuvre&&<div className="border-t border-white/5 pt-3 bg-rose/5 border border-rose/15 rounded p-3">
              <label className={lbl}>💰 Décomposition des coûts — {scenarios[0].scenarioNom}</label>
              {/* A. TERRASSEMENT */}
              <p className="text-[9px] text-gray-500 font-bold mt-1 mb-0.5">⛏️ A. Terrassement (creuser) = {fmtC(scenarios[0].coutTerrassementTotal)}</p>
              <div className="grid grid-cols-3 gap-1 mb-2">{[
                ['Engin location',`${scenarios[0].hEnginMin}h × ${selEngin?.coutHoraire||0}€/h = ${fmtC(scenarios[0].coutEnginLocation)}`],
                ['Gasoil engin',`${scenarios[0].hEnginMin}h × ${selEngin?.consommationLH||0}L/h × ${tarifsChantier?.prixGasoilL||1.80}€ = ${fmtC(scenarios[0].coutGasoilEngin)}`],
                ['Dépl. engin (forfait)',`${fmtC(scenarios[0].coutDeplEngin)}`],
                ['Pelleur',`${scenarios[0].mainOeuvre.hPelleurFacture}h × ${scenarios[0].tarifHPelleur}€/h = ${fmtC(scenarios[0].coutPelleurExcav)}`],
                ['Dépl. opérateur',`${fmtC(tarifsChantier?.forfaitDepartOperateur||50)} + ${form.distanceDepotChantierKm||0}km × ${tarifsChantier?.prixKmOperateur||0.55}€ = ${fmtC(scenarios[0].coutDeplOperateur)}`],
              ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-[10px] text-white font-medium">{v}</p></div>)}</div>
              <p className="text-[8px] text-gray-600 mb-2">Excavation {scenarios[0].mainOeuvre.hExcav}h réelles → min {scenarios[0].joursEngin}j × {tarifsChantier?.heuresJourChantier||8}h = {scenarios[0].hEnginMin}h facturées · Pelleur : excav {scenarios[0].mainOeuvre.hPelleurExcav}h + attente {scenarios[0].mainOeuvre.hPellisteAttenteEvac}h = {scenarios[0].mainOeuvre.hPelleurTotal}h → facturé {scenarios[0].mainOeuvre.hPelleurFacture}h</p>
              {/* B. ÉVACUATION */}
              <p className="text-[9px] text-gray-500 font-bold mt-1 mb-0.5">🚛 B. Évacuation remblais = {fmtC(scenarios[0].coutEvacuationTotal)}</p>
              <div className="grid grid-cols-3 gap-1 mb-2">{[
                ['Véhicule km',`${scenarios[0].nbVoyages} voy. × ${distanceKm.toFixed(0)}km A/R × ${selVehicule?.prixKm||0}€/km = ${fmtC(scenarios[0].coutEvacVehiculeKm)}`],
                ['Chauffeur',`${scenarios[0].mainOeuvre.hChauffeurEvac}h (${scenarios[0].mainOeuvre.nbVoyEvac} × ${scenarios[0].mainOeuvre.hParVoyEvac}min) × ${scenarios[0].tarifHChauffeur}€/h = ${fmtC(scenarios[0].coutEvacChauffeur)}`],
                ['Attente pelliste',`${scenarios[0].mainOeuvre.hPellisteAttenteEvac}h × ${scenarios[0].tarifHPelleur}€/h = ${fmtC(scenarios[0].coutEvacAttentePelliste)}`],
              ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-[10px] text-white font-medium">{v}</p></div>)}</div>
              {/* C. MORTIER */}
              {scenarios[0].coutMortierTotal>0&&<><p className="text-[9px] text-gray-500 font-bold mt-1 mb-0.5">🏗️ C. Mortier = {fmtC(scenarios[0].coutMortierTotal)}</p>
              <div className="grid grid-cols-3 gap-1 mb-2">{[
                ['Véhicule km',`${scenarios[0].nbVoyMortier} voy. × ${(distanceMortierKm*2).toFixed(0)}km A/R × ${(selVehiculeMortier||selVehicule)?.prixKm||0}€/km = ${fmtC(scenarios[0].coutMortierVehiculeKm)}`],
                ['Chauffeur',`${scenarios[0].mainOeuvre.hChauffeurMortier}h × ${scenarios[0].tarifHChauffeur}€/h = ${fmtC(scenarios[0].coutMortierChauffeur)}`],
                ['Matière',`${scenarios[0].volMortier.toFixed(2)}m³ × ${tarifsMateriaux?.mortierM3||120}€ = ${fmtC(scenarios[0].coutMortierMatiere)}`],
              ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-[10px] text-white font-medium">{v}</p></div>)}</div></>}
              {/* D. LIVRAISON */}
              {scenarios[0].coutLivraisonTotal>0&&<><p className="text-[9px] text-gray-500 font-bold mt-1 mb-0.5">📦 D. Livraison matériaux = {fmtC(scenarios[0].coutLivraisonTotal)}</p>
              <div className="grid grid-cols-3 gap-1 mb-2">{[
                ['Véhicule km',`1 voy. × ${(distanceLivraisonKm*2).toFixed(0)}km A/R × ${selVehicule?.prixKm||0}€/km = ${fmtC(scenarios[0].coutLivraisonVehiculeKm)}`],
                ['Chauffeur',`${scenarios[0].mainOeuvre.hChauffeurLivraison}h × ${scenarios[0].tarifHChauffeur}€/h = ${fmtC(scenarios[0].coutLivraisonChauffeur)}`],
              ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-[10px] text-white font-medium">{v}</p></div>)}</div></>}
              {/* E. POSE */}
              <p className="text-[9px] text-gray-500 font-bold mt-1 mb-0.5">👷 E. Pose × {scenarios[0].mainOeuvre.nbPoseurs} poseurs = {fmtC(scenarios[0].coutPoseur)}</p>
              <div className="grid grid-cols-3 gap-1 mb-2">{[
                ['PVC (15min/ml)',`${scenarios[0].mainOeuvre.hPVC}h`],
                ['Coudes (7min/u)',`${scenarios[0].mainOeuvre.hCoudes}h`],
                ['Pose cuves',`${scenarios[0].mainOeuvre.hPoseCuves}h`],
                [`Remblai (${nbCuves} cuve${nbCuves>1?'s':''})`,`${scenarios[0].mainOeuvre.hRemblaiCuves}h`],
                ['Ventilation',`${scenarios[0].mainOeuvre.hVentilation}h`],
                ['Restauration',`${scenarios[0].mainOeuvre.hRestauration}h`],
                ['Durée sur site',`${scenarios[0].mainOeuvre.hPoseDuree}h`],
                [`Coût (×${scenarios[0].mainOeuvre.nbPoseurs})`,`${scenarios[0].mainOeuvre.hPoseCout}h × ${scenarios[0].tarifHPoseur}€/h = ${fmtC(scenarios[0].coutPoseur)}`],
              ].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-[10px] text-white font-medium">{v}</p></div>)}</div>
              {/* Totaux */}
              <div className="grid grid-cols-3 gap-1 mt-2 border-t border-rose/20 pt-2">{[
                ['Durée chantier',`${scenarios[0].mainOeuvre.totalH}h`],
                ['Jours ouvrés',`${scenarios[0].mainOeuvre.totalJours} j`],
                ['Total MO + engins',fmtC(scenarios[0].coutTerrassementTotal + scenarios[0].coutEvacuationTotal + scenarios[0].coutMortierChauffeur + scenarios[0].coutMortierVehiculeKm + scenarios[0].coutLivraisonTotal + scenarios[0].coutPoseur)],
              ].map(([l,v])=><div key={l} className="bg-rose/10 rounded p-1.5"><p className="text-[8px] text-gray-600">{l}</p><p className="text-[10px] text-rose font-bold">{v}</p></div>)}</div>
            </div>}

            {/* CALENDRIER DE POSE */}
            <div className="border-t border-white/5 pt-3">
              <label className={lbl}><Calendar className="w-3 h-3 inline mr-1"/>Calendrier de pose</label>
              <label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" checked={form.poseSamedi} onChange={e=>set('poseSamedi',e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 text-rose bg-bg-input"/><span className="text-[10px] text-gray-400">Autoriser la pose le samedi</span></label>
              <MiniCalendar ressources={ressources||[]} enginsData={enginsData||[]} enginsRequis={[form.enginId||'pelle_8t']} nbJours={scenarios[0]?.mainOeuvre?.totalJours||2} poseSamedi={form.poseSamedi}/>
            </div>

            <div className="bg-rose/5 border border-rose/15 rounded p-3 space-y-1 text-[10px]">
              <p className="font-bold text-gray-300 mb-1">📐 Récapitulatif volumes</p>
              <div className="grid grid-cols-3 gap-1">{[['Fouille',volFouille.toFixed(1)+' m³'],['Cuves',volCuves.toFixed(1)+' m³'],['Remblais',volRemblais.toFixed(1)+' m³'],['Foisonné',(volFouille*1.3).toFixed(1)+' m³'],['Sable PVC',volSablePVC.toFixed(2)+' m³'],['PVC ent.',mlPVCEnterres.toFixed(0)+' ml']].map(([l,v])=><div key={l} className="bg-black/20 rounded p-1.5"><p className="text-[8px] text-gray-600">{l}</p><p className="text-white font-medium">{v}</p></div>)}</div>
            </div>

            <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(4)} className="h-8 px-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded">← Retour</button><button type="button" onClick={()=>setStep(6)} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded">Suivant →</button></div>
          </div></Window>}

          {/* ÉTAPE 6 — RÉDACTIONNEL */}
          {step===6&&<Window title="6 — Structure rédactionnelle"><div className="p-5 space-y-3">
            <Info>📝 10 sections du devis. Modifiez le texte de chaque section pour personnaliser votre devis client.</Info>
            {form.sections.map((sec,idx)=>(
              <div key={sec.id} className="border border-white/5 rounded overflow-hidden">
                <div className="h-7 bg-white/3 border-b border-white/5 flex items-center px-3">
                  <span className="text-[10px] font-bold text-rose">{sec.titre}</span>
                </div>
                <textarea value={sec.texte} onChange={e=>updateSection(idx,e.target.value)} rows={sec.id===9?5:2} className="w-full px-3 py-2 bg-bg-input text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose/30 resize-y border-none"/>
              </div>
            ))}
            <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(5)} className="h-8 px-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded">← Retour</button><button type="button" onClick={()=>setStep(7)} className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded">Suivant →</button></div>
          </div></Window>}

          {/* ÉTAPE 7 — DEVIS FINAL */}
          {step===7&&<Window title={form.absenceEtudeSol?"7 — 3 Scénarios":"7 — Récapitulatif"}><div className="p-5 space-y-4">
            {form.absenceEtudeSol&&<Info>⚠️ <strong className="text-amber-300">Absence d'étude de sol</strong> — 3 devis.</Info>}

            {/* REMISE */}
            <div className="border border-white/5 rounded p-3">
              <label className={lbl}><Percent className="w-3 h-3 inline mr-1"/>Remise</label>
              <div className="flex items-center space-x-2 mb-2">
                <label className={`flex items-center space-x-1 px-2 py-1 rounded border text-[10px] cursor-pointer ${form.remiseType==='pourcent'?'bg-rose/10 border-rose/30 text-rose':'bg-bg-input border-white/5 text-gray-500'}`}><input type="radio" name="rt" value="pourcent" checked={form.remiseType==='pourcent'} onChange={()=>set('remiseType','pourcent')} className="w-2.5 h-2.5"/><span>%</span></label>
                <label className={`flex items-center space-x-1 px-2 py-1 rounded border text-[10px] cursor-pointer ${form.remiseType==='montant'?'bg-rose/10 border-rose/30 text-rose':'bg-bg-input border-white/5 text-gray-500'}`}><input type="radio" name="rt" value="montant" checked={form.remiseType==='montant'} onChange={()=>set('remiseType','montant')} className="w-2.5 h-2.5"/><span>€</span></label>
                <div className="flex-1">{form.remiseType==='pourcent'?<input type="number" value={form.remisePourcent} onChange={e=>set('remisePourcent',e.target.value)} min="0" max="100" step="0.5" className={inp} placeholder="ex: 5%"/>:<input type="number" value={form.remiseMontant} onChange={e=>set('remiseMontant',e.target.value)} min="0" className={inp} placeholder="ex: 200€"/>}</div>
              </div>
            </div>

            <div className="space-y-4">{(form.absenceEtudeSol?scenarios:[scenarios[0]]).map((sc,idx)=>(
              <div key={sc.scenarioId} className={`border rounded-lg p-4 ${scColors[sc.scenarioId]||''}`}>
                <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${scText[sc.scenarioId]||'text-white'}`}>{sc.scenarioNom}</h3></div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">{[{l:'Terrassement',v:`${sc.joursEngin||1}j (${sc.hExcav||'?'}h excav.)`},{l:'Voyages évac.',v:`${sc.nbVoyages}`},{l:'Vol. foisonné',v:`${sc.volFoison?.toFixed(1)||'?'}m³`}].map(i=><div key={i.l} className="bg-black/20 rounded p-1.5"><p className="text-[8px] text-gray-600">{i.l}</p><p className="text-[10px] font-medium text-white">{i.v}</p></div>)}</div>
                <div className="space-y-1 text-[10px]">
                  {[['⛏️ Terrassement',sc.coutTerrassementClient],['🚛 Évacuation (km+chauffeur+attente)',sc.coutTransportClient],sc.coutMortierTranspClient>0&&['🏗️ Transport mortier',sc.coutMortierTranspClient],sc.coutMortierMatiere>0&&[`🏗️ Mortier matière (${sc.volMortier?.toFixed(2)||0}m³)`,sc.coutMortierMatiere],sc.coutLivraisonClient>0&&['📦 Livraison matériaux',sc.coutLivraisonClient],[sel?.nom||'Matériel ANC',sc.coutMateriel],sc.coutProduitsSup>0&&['Produits suppl.',sc.coutProduitsSup],['Fournitures',sc.coutAssocies],coutCoudes>0&&['Coudes PVC',coutCoudes],coutRehausses>0&&['Rehausses',coutRehausses],coutElec>0&&['Électrique',coutElec],coutEpandage>0&&['Épandage',coutEpandage],coutBlocsAerien>0&&['🧱 Habillage aérien',coutBlocsAerien],coutMurSoutenement>0&&['🧱 Mur soutènement',coutMurSoutenement],coutTerreVegetale>0&&['Terre vég.',coutTerreVegetale],["👷 Pose",sc.coutPoseur],['Dossier photo',COUT_DOSSIER_PHOTO]].filter(Boolean).map(([l,v])=>(<div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="text-gray-300">{fmtC(v)}</span></div>))}
                  {sc.montantRemise>0&&<div className="flex justify-between text-green-400 font-bold"><span>Remise {form.remiseType==='pourcent'?form.remisePourcent+'%':''}</span><span>- {fmtC(sc.montantRemise)}</span></div>}
                  <div className="flex justify-between pt-1 border-t border-white/10 font-bold"><span className="text-white">Total HT</span><span className="text-white">{fmtC(sc.totalHT)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">TVA 20%</span><span>{fmtC(sc.totalTVA)}</span></div>
                  <div className="flex justify-between pt-1 border-t border-white/10"><span className={`font-display font-bold ${scText[sc.scenarioId]||'text-rose'}`}>Total TTC</span><span className={`font-display text-lg font-bold ${scText[sc.scenarioId]||'text-rose'}`}>{fmtC(sc.totalTTC)}</span></div>
                </div>
              </div>
            ))}</div>
            <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(6)} className="h-8 px-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded">← Retour</button><button type="submit" className="h-8 px-4 bg-rose text-white text-xs font-semibold rounded shadow-[0_0_15px_rgba(200,80,155,0.25)] flex items-center space-x-1.5"><Save className="w-3.5 h-3.5"/><span>{isEdit?'Mettre à jour':'Enregistrer'}</span></button></div>
          </div></Window>}
        </form>
        {showFiche&&<FicheInstallateur/>}
      </div>
    </div>
  )
}

function Sec({t,children}){return<div><p className="text-[8px] text-gray-600 uppercase font-bold">{t}</p>{children}</div>}
function G2({items}){return<div className="grid grid-cols-2 gap-1">{items.map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-white">{v}</p></div>)}</div>}

function MiniCalendar({ressources,enginsData,enginsRequis,nbJours,poseSamedi=false}){
  const [mois,setMois]=useState(new Date().getMonth())
  const [annee,setAnnee]=useState(new Date().getFullYear())
  const NOMS_MOIS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  const JOURS=['Lu','Ma','Me','Je','Ve','Sa','Di']
  const joursDispos=getJoursDisponibles(ressources,enginsData,enginsRequis,mois,annee,poseSamedi)
  const creneau=trouverProchainCreneau(ressources,enginsData,enginsRequis,nbJours,new Date(),poseSamedi)
  const premierJour=new Date(annee,mois,1).getDay()
  const offset=(premierJour+6)%7
  const nbJoursMois=new Date(annee,mois+1,0).getDate()
  const cells=[]
  for(let i=0;i<offset;i++) cells.push(null)
  for(let d=1;d<=nbJoursMois;d++) cells.push(d)
  const prevM=()=>{if(mois===0){setMois(11);setAnnee(a=>a-1)}else setMois(m=>m-1)}
  const nextM=()=>{if(mois===11){setMois(0);setAnnee(a=>a+1)}else setMois(m=>m+1)}
  return(
    <div className="bg-black/20 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevM} className="text-xs text-gray-500 hover:text-white px-1">◀</button>
        <span className="text-[11px] font-bold text-white">{NOMS_MOIS[mois]} {annee}</span>
        <button type="button" onClick={nextM} className="text-xs text-gray-500 hover:text-white px-1">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-px mb-1">{JOURS.map(j=><div key={j} className="text-center text-[8px] font-bold text-gray-600">{j}</div>)}</div>
      <div className="grid grid-cols-7 gap-px">{cells.map((d,i)=>{
        if(!d) return <div key={i}/>
        const ds=`${annee}-${String(mois+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        const dispo=joursDispos.includes(ds)
        const inCreneau=creneau.includes(ds)
        const dow=new Date(annee,mois,d).getDay()
        const isDim=dow===0
        const isSam=dow===6
        return <div key={i} className={`text-center text-[9px] py-0.5 rounded ${inCreneau?'bg-rose text-white font-bold':dispo?'bg-rose/20 text-rose':isDim?'text-gray-700':isSam&&!poseSamedi?'text-gray-700':isSam?'text-amber-600':'text-gray-500'}`}>{d}</div>
      })}</div>
      {creneau.length>=nbJours&&<p className="text-[9px] text-rose mt-2 font-medium">📅 Prochain créneau : <strong>{new Date(creneau[0]).toLocaleDateString('fr-FR')}</strong> → {new Date(creneau[creneau.length-1]).toLocaleDateString('fr-FR')} ({nbJours} jour{nbJours>1?'s':''})</p>}
      <p className="text-[8px] text-gray-600 mt-1">Rose clair = jours disponibles · Rose foncé = créneau proposé{poseSamedi?' · Samedi inclus':''}</p>
    </div>
  )
}
