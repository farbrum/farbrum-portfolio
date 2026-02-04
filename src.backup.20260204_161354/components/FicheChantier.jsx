import { useState, useRef } from 'react'
import { useDevisStore } from '../store/devisStore'
import { useProductStore, ENGINS } from '../store/productStore'
import { Camera, CheckCircle2, Circle, Clock, MapPin, Truck, HardHat, AlertTriangle, ChevronDown, ChevronUp, Image, Upload, Trash2, Navigation, Package, Wrench, Layers, FileCheck, Phone, Award } from 'lucide-react'

// ===== ÉTAPES DE PROCÉDURE =====
const ETAPES = [
  { id:'arrivee', num:1, titre:'Arrivée sur site', desc:'Arriver sur le chantier, vérifier l\'accès, sécuriser la zone de travail.', photoLabel:'Photos état des lieux initial (terrain, accès, maison, voisinage)', photoRequired:true, icon:'MapPin' },
  { id:'photos_initial', num:2, titre:'Dossier photos initial', desc:'Prendre toutes les photos avant travaux : façade maison, terrain, emplacement prévu, regards existants, réseaux visibles.', photoLabel:'Photos complètes avant travaux (min. 10 photos)', photoRequired:true, icon:'Camera' },
  { id:'trace', num:3, titre:'Tracé de la fouille', desc:'Tracer au sol l\'emplacement exact de la fouille selon le plan. Vérifier les distances réglementaires (maison, limites, arbres, puits).', photoLabel:'Photos du tracé au sol', photoRequired:true, icon:'Wrench' },
  { id:'terrassement', num:4, titre:'Terrassement', desc:'Excavation de la fouille aux dimensions requises. Vérifier la profondeur et les niveaux.', photoLabel:'Photos de la fouille ouverte avec mesures visibles', photoRequired:true, icon:'HardHat' },
  { id:'evacuation', num:5, titre:'Évacuation des terres', desc:'Chargement et transport des terres excavées vers le site de dépôt.', photoLabel:'Photos chargement et départ camion', photoRequired:true, icon:'Truck' },
  { id:'dalle_mortier', num:6, titre:'Dalle de mortier + ferraillage', desc:'Couler la dalle de mortier au fond de la fouille. Poser le ferraillage. Vérifier l\'horizontalité.', photoLabel:'Photos de la dalle coulée avec ferraillage', photoRequired:true, icon:'Layers' },
  { id:'attente_sechage', num:7, titre:'Temps d\'attente séchage', desc:'Attendre le séchage de la dalle de mortier selon les conditions météo. Minimum 24h recommandé.', photoLabel:'Photo de la dalle après séchage', photoRequired:true, icon:'Clock' },
  { id:'fouille_tuyaux', num:8, titre:'Fouilles pour tuyaux', desc:'Creuser les tranchées pour les tuyaux d\'arrivée (entrée) et de sortie. Respecter les pentes réglementaires (1 à 2%).', photoLabel:'Photos des tranchées avec niveau de pente', photoRequired:true, icon:'Wrench' },
  { id:'tuyaux_aeration', num:9, titre:'Tuyaux aération & ventilation', desc:'Poser les tuyaux d\'aération et de ventilation. Vérifier l\'étanchéité des raccords.', photoLabel:'Photos des tuyaux posés et raccords', photoRequired:true, icon:'Wrench' },
  { id:'travaux_facade', num:10, titre:'Travaux en façade', desc:'Installation de la ventilation aérienne en façade de la maison. Fixation des tuyaux de ventilation haute.', photoLabel:'Photos des travaux en façade (ventilation)', photoRequired:true, icon:'HardHat' },
  { id:'pose_cuves', num:11, titre:'Pose des cuves', desc:'Descendre et positionner les cuves dans la fouille. Vérifier l\'horizontalité et la stabilité. Raccorder les tuyaux d\'entrée et sortie.', photoLabel:'Photos des cuves en place et raccordements', photoRequired:true, icon:'Package' },
  { id:'pose_epandage', num:12, titre:'Pose de l\'épandage', desc:'Installer le système d\'épandage : lit de gravier, drains, géotextile.', photoLabel:'Photos de l\'épandage installé', photoRequired:true, icon:'Wrench', optional:'epandage' },
  { id:'remblais', num:13, titre:'Pose des remblais', desc:'Remblayer autour des cuves avec le matériau 0/20 approprié. Compacter par couches de 30cm.', photoLabel:'Photos du remblaiement en cours', photoRequired:true, icon:'Layers' },
  { id:'geotextile', num:14, titre:'Pose du géotextile', desc:'Poser le géotextile de protection au-dessus des cuves avant rebouchage final.', photoLabel:'Photos du géotextile posé', photoRequired:true, icon:'Layers' },
  { id:'rebouchage', num:15, titre:'Rebouchage', desc:'Reboucher la fouille avec les terres de remblai. Compacter régulièrement.', photoLabel:'Photos du rebouchage', photoRequired:true, icon:'Layers' },
  { id:'finitions', num:16, titre:'Finitions', desc:'Niveler le terrain, remettre en état les accès, nettoyer le chantier. Vérifier les tampons de visite.', photoLabel:'Photos du terrain remis en état', photoRequired:true, icon:'Wrench' },
  { id:'tests', num:17, titre:'Tests de fonctionnement', desc:'Effectuer les tests d\'étanchéité et de fonctionnement. Vérifier les débits et les niveaux.', photoLabel:'Photos des tests (niveau d\'eau, etc.)', photoRequired:true, icon:'FileCheck' },
  { id:'rdv_spanc', num:18, titre:'RDV avec le SPANC', desc:'Prendre rendez-vous avec le SPANC pour le contrôle de conformité. Préparer les documents nécessaires.', photoLabel:'Photo du courrier/email de RDV', photoRequired:true, icon:'Phone' },
  { id:'validation_spanc', num:19, titre:'Validation SPANC', desc:'Contrôle par le SPANC. Obtenir l\'attestation de conformité.', photoLabel:'Photo de l\'attestation de conformité SPANC', photoRequired:true, icon:'Award' },
]

const ICONS = { MapPin, Camera, Wrench, Truck, Layers, Clock, HardHat, Package, Phone, Award, FileCheck, Navigation, Circle }

export default function FicheChantier({ devis }) {
  const { updateDevis } = useDevisStore()
  const { vehicules } = useProductStore()
  const [expanded, setExpanded] = useState(null)
  const fileInputRef = useRef(null)
  const [uploadingStep, setUploadingStep] = useState(null)

  // Init fiche data
  const fiche = devis.ficheChantier || { etapes: {}, startedAt: null }
  const scenario = (devis.scenarios || [])[0] || {}
  const vehicule = vehicules.find(v => v.id === devis.vehiculeId)

  // Calculs logistique
  const distanceKm = devis.distanceTransportKm || 0
  const distanceLivraisonKm = devis.distanceLivraisonKm || 0
  const vitesse = vehicule?.vitesseKmh || 45
  const tempsTrajetMin = distanceKm > 0 ? Math.round((distanceKm / vitesse) * 60) : 0
  const tempsTrajetAR = tempsTrajetMin * 2
  const nbVoyages = scenario.nbVoyages || 0
  const tempsTransportTotal = tempsTrajetAR * nbVoyages
  const hTransport = Math.floor(tempsTransportTotal / 60)
  const mTransport = tempsTransportTotal % 60
  const tempsLivraisonMin = distanceLivraisonKm > 0 ? Math.round((distanceLivraisonKm / vitesse) * 60) : 0
  const tempsLivraisonAR = tempsLivraisonMin * 2

  // Filtrer les étapes selon le devis
  const etapesFiltrees = ETAPES.filter(e => {
    if (e.optional === 'epandage' && !devis.epandage) return false
    return true
  })

  const saveFiche = (newFiche) => {
    updateDevis(devis.id, { ficheChantier: newFiche })
  }

  const toggleEtape = (etapeId) => {
    const newFiche = { ...fiche, etapes: { ...fiche.etapes } }
    const current = newFiche.etapes[etapeId] || {}
    if (!current.done) {
      // Vérifier si photo requise et pas encore uploadée
      const etape = ETAPES.find(e => e.id === etapeId)
      if (etape?.photoRequired && (!current.photos || current.photos.length === 0)) {
        // Ouvrir l'étape pour obliger la photo
        setExpanded(etapeId)
        return
      }
      newFiche.etapes[etapeId] = { ...current, done: true, doneAt: new Date().toISOString() }
      if (!newFiche.startedAt) newFiche.startedAt = new Date().toISOString()
    } else {
      newFiche.etapes[etapeId] = { ...current, done: false, doneAt: null }
    }
    saveFiche(newFiche)
  }

  const handlePhotoUpload = (etapeId, e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newFiche = { ...fiche, etapes: { ...fiche.etapes } }
    const current = newFiche.etapes[etapeId] || {}
    const existingPhotos = current.photos || []
    // Convertir en base64 pour stockage local
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const photo = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: file.name,
          data: ev.target.result,
          takenAt: new Date().toISOString(),
        }
        const updFiche = { ...fiche, etapes: { ...fiche.etapes } }
        const updCurrent = updFiche.etapes[etapeId] || {}
        updFiche.etapes[etapeId] = { ...updCurrent, photos: [...(updCurrent.photos || []), photo] }
        saveFiche(updFiche)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (etapeId, photoId) => {
    const newFiche = { ...fiche, etapes: { ...fiche.etapes } }
    const current = newFiche.etapes[etapeId] || {}
    newFiche.etapes[etapeId] = { ...current, photos: (current.photos || []).filter(p => p.id !== photoId) }
    saveFiche(newFiche)
  }

  const setNotes = (etapeId, notes) => {
    const newFiche = { ...fiche, etapes: { ...fiche.etapes } }
    const current = newFiche.etapes[etapeId] || {}
    newFiche.etapes[etapeId] = { ...current, notes }
    saveFiche(newFiche)
  }

  // Progression
  const totalEtapes = etapesFiltrees.length
  const etapesTerminees = etapesFiltrees.filter(e => fiche.etapes[e.id]?.done).length
  const pctProgress = totalEtapes > 0 ? Math.round((etapesTerminees / totalEtapes) * 100) : 0

  return (
    <div className="space-y-3">
      {/* HEADER PROGRESSION */}
      <div className="bg-gradient-to-r from-rose/10 to-amber-500/10 border border-rose/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardHat className="w-4 h-4 text-rose" /> Fiche Chantier
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${pctProgress === 100 ? 'bg-emerald-500/20 text-emerald-400' : pctProgress > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>
            {pctProgress}% ({etapesTerminees}/{totalEtapes})
          </span>
        </div>
        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctProgress}%`, background: pctProgress === 100 ? '#10b981' : 'linear-gradient(90deg, #c8509b, #f59e0b)' }} />
        </div>
      </div>

      {/* LOGISTIQUE */}
      <div className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-3">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation className="w-3 h-3" /> Logistique & Véhicules
        </h4>

        {/* Client */}
        <div className="bg-white/3 rounded p-2.5">
          <p className="text-[9px] text-gray-600 uppercase mb-0.5">Client</p>
          <p className="text-xs font-bold text-white">{devis.client?.nomComplet}</p>
          <p className="text-[10px] text-gray-400">{devis.client?.adresse}, {devis.client?.codePostal} {devis.client?.ville}</p>
          {devis.client?.telephone && <p className="text-[10px] text-rose">{devis.client.telephone}</p>}
        </div>

        {/* Engins */}
        <div>
          <p className="text-[9px] text-gray-600 uppercase mb-1">Engins de chantier</p>
          <div className="space-y-1">
            {(scenario.enginsDetails || []).map((e, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded px-2.5 py-1.5">
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <p className="text-[10px] font-bold text-white">{e.nom}</p>
                  <p className="text-[8px] text-gray-500">{e.coutHoraire}€/h · Déplacement : {e.deplacement}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Véhicule transport */}
        {vehicule && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase mb-1">Véhicule de transport</p>
            <div className="bg-blue-500/5 border border-blue-500/15 rounded px-2.5 py-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold text-white">{vehicule.nom}</p>
                  <p className="text-[8px] text-gray-500">
                    PTAC {vehicule.ptac}t · CU {((vehicule.ptac||0)-(vehicule.poidsVide||0)).toFixed(1)}t · {vehicule.capaciteM3}m³ · {vehicule.prixKm}€/km
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Détails transport évacuation */}
        {distanceKm > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase mb-1">Transport évacuation (ANC → Dépôt)</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Stat label="Distance (aller)" value={`${distanceKm.toFixed(1)} km`} />
              <Stat label="Distance A/R" value={`${(distanceKm * 2).toFixed(1)} km`} />
              <Stat label="Temps trajet A/R" value={tempsTrajetAR > 60 ? `${Math.floor(tempsTrajetAR/60)}h${String(tempsTrajetAR%60).padStart(2,'0')}` : `${tempsTrajetAR} min`} />
              <Stat label="Vitesse moy." value={`${vitesse} km/h`} />
              <Stat label="Nombre de voyages" value={`${nbVoyages} voyages`} highlight />
              <Stat label="km total transport" value={`${(nbVoyages * distanceKm * 2).toFixed(0)} km`} />
              <Stat label="Temps total transport" value={hTransport > 0 ? `${hTransport}h${String(mTransport).padStart(2,'0')}` : `${mTransport} min`} highlight />
              <Stat label="Coût transport" value={`${scenario.coutTransport || 0} €`} />
            </div>
          </div>
        )}

        {/* Détails livraison fournisseur */}
        {distanceLivraisonKm > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase mb-1">Livraison (Fournisseur → Chantier)</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Stat label="Distance (aller)" value={`${distanceLivraisonKm.toFixed(1)} km`} />
              <Stat label="Distance A/R" value={`${(distanceLivraisonKm * 2).toFixed(1)} km`} />
              <Stat label="Temps trajet A/R" value={tempsLivraisonAR > 60 ? `${Math.floor(tempsLivraisonAR/60)}h${String(tempsLivraisonAR%60).padStart(2,'0')}` : `${tempsLivraisonAR} min`} />
              <Stat label="Coût livraison" value={`${scenario.coutLivraison || 0} €`} highlight />
            </div>
          </div>
        )}

        {/* Détails transport mortier */}
        {(scenario.volMortier > 0 || (devis.distanceMortierKm||0) > 0) && (
          <div>
            <p className="text-[9px] text-green-400 uppercase mb-1">🏗️ Mortier (Centrale → Chantier)</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Stat label="Surface fouille" value={`${(devis.surfaceFouille||0).toFixed(1)} m²`} />
              <Stat label="Épaisseur" value={`${(devis.epaisseurMortier||0.20)} m`} />
              <Stat label="Volume mortier" value={`${(scenario.volMortier||0).toFixed(2)} m³`} highlight />
              <Stat label="Nb voyages" value={`${scenario.nbVoyMortier||0}`} />
              {(devis.distanceMortierKm||0)>0 && <>
                <Stat label="Distance A/R" value={`${((devis.distanceMortierKm||0)*2).toFixed(1)} km`} />
                <Stat label="Coût km mortier" value={`${scenario.coutMortierVehiculeKm||0} €`} />
              </>}
              <Stat label="Coût matière" value={`${scenario.coutMortierMatiere||0} €`} highlight />
            </div>
          </div>
        )}

        {/* Temps de travail estimé — détaillé */}
        <div>
          <p className="text-[9px] text-gray-600 uppercase mb-1">Temps de travail estimés</p>
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label="Terrassement" value={`${scenario.hExcav || 0}h`} />
            <Stat label="Chauffeur (total)" value={`${scenario.mainOeuvre?.hChauffeurTotal || 0}h`} />
            <Stat label={`Poseur ×${scenario.mainOeuvre?.nbPoseurs||2} (durée)`} value={`${scenario.mainOeuvre?.hPoseDuree || 0}h`} />
          </div>
          {scenario.mainOeuvre && <div className="mt-1 grid grid-cols-3 gap-1">
            {[
              ['PVC (15min/ml)', `${scenario.mainOeuvre.hPVC||0}h`],
              ['Coudes (7min/u)', `${scenario.mainOeuvre.hCoudes||0}h`],
              ['Pose cuves', `${scenario.mainOeuvre.hPoseCuves||0}h`],
              [`Remblai cuves`, `${scenario.mainOeuvre.hRemblaiCuves||0}h`],
              ['Ventilation', `${scenario.mainOeuvre.hVentilation||0}h`],
              ['Restauration', `${scenario.mainOeuvre.hRestauration||0}h`],
            ].filter(([,v]) => v !== '0h').map(([l,v]) => (
              <div key={l} className="bg-black/20 rounded px-1.5 py-0.5"><p className="text-[7px] text-gray-600">{l}</p><p className="text-[9px] text-white font-medium">{v}</p></div>
            ))}
          </div>}
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <Stat label="Total jours" value={`${scenario.mainOeuvre?.totalJours || 0} j`} highlight />
            <Stat label="Coût MO + engins" value={`${(scenario.coutTerrassementTotal||0) + (scenario.coutEvacuationTotal||0) + (scenario.coutPoseur||0)} €`} highlight />
          </div>
        </div>

        {/* Matériaux à livrer */}
        <div>
          <p className="text-[9px] text-gray-600 uppercase mb-1">Matériaux à charger</p>
          <div className="space-y-0.5 text-[10px]">
            {[
              devis.produitNom && `📦 ${devis.produitNom}`,
              devis.volumeRemblais > 0 && `🪨 Remblais 0/20 : ${devis.volumeRemblais.toFixed(1)} m³`,
              devis.volumeSablePVC > 0 && `🏖️ Sable PVC : ${devis.volumeSablePVC.toFixed(2)} m³`,
              devis.tuyauxAvantFiliere > 0 && `🔧 PVC avant filière : ${devis.tuyauxAvantFiliere} ml`,
              devis.tuyauxApresFiliere > 0 && `🔧 PVC après filière : ${devis.tuyauxApresFiliere} ml`,
              devis.nbCoudesPVC > 0 && `🔩 Coudes PVC : ${devis.nbCoudesPVC}`,
              devis.longueurAeration > 0 && `💨 Aération : ${devis.longueurAeration} ml`,
              devis.longueurVentilation > 0 && `🌀 Ventilation : ${devis.longueurVentilation} ml`,
              devis.epandage && `🌿 Gravier épandage : ${devis.epandage.volumeGravier} m³`,
              devis.epandage && `🌿 Drains : ${devis.epandage.longueurDrainTotal} ml`,
              devis.posteRelevage && `⚡ Poste relevage + câble ${devis.longueurCableElec || '?'}ml (${devis.sectionCable || '4'}mm²)`,
              devis.nbRehausses > 0 && `🔲 Rehausses : ${devis.nbRehausses}`,
              ...(devis.produitsAssocies || []).map(p => `✓ ${p}`),
              ...(devis.produitsSup || []).map(p => `➕ ${p.nom} — ${p.prixHT}€`),
            ].filter(Boolean).map((l, i) => (
              <p key={i} className="text-gray-300">{l}</p>
            ))}
          </div>
        </div>

        {/* Notes installateur */}
        {devis.notesInstallateur && (
          <div className="bg-amber-500/5 border border-amber-500/15 rounded p-2.5">
            <p className="text-[9px] text-amber-400 uppercase font-bold mb-1">⚠️ Notes particulières</p>
            <p className="text-[10px] text-amber-300">{devis.notesInstallateur}</p>
          </div>
        )}
      </div>

      {/* PROCÉDURE INTERACTIVE */}
      <div className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-2">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <FileCheck className="w-3 h-3" /> Procédure de travail
        </h4>

        {etapesFiltrees.map((etape, idx) => {
          const etat = fiche.etapes[etape.id] || {}
          const isDone = etat.done
          const isExpanded = expanded === etape.id
          const photos = etat.photos || []
          const hasPhotos = photos.length > 0
          const canCheck = !etape.photoRequired || hasPhotos
          const IconComp = ICONS[etape.icon] || Circle
          const prevDone = idx === 0 || fiche.etapes[etapesFiltrees[idx - 1]?.id]?.done

          return (
            <div key={etape.id} className={`border rounded-lg overflow-hidden transition-all ${isDone ? 'border-emerald-500/30 bg-emerald-500/5' : prevDone ? 'border-rose/20 bg-rose/5' : 'border-white/5 bg-white/2'}`}>
              {/* Header étape */}
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : etape.id)}>
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (canCheck) toggleEtape(etape.id) }}
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 text-white' : canCheck ? 'border-2 border-gray-600 hover:border-rose' : 'border-2 border-red-500/50'}`}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <IconComp className={`w-3.5 h-3.5 flex-shrink-0 ${isDone ? 'text-emerald-400' : 'text-gray-500'}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold ${isDone ? 'text-emerald-400' : 'text-gray-600'}`}>#{etape.num}</span>
                    <span className={`text-[11px] font-medium truncate ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>{etape.titre}</span>
                  </div>
                  {isDone && etat.doneAt && (
                    <p className="text-[8px] text-emerald-500/60">✓ {new Date(etat.doneAt).toLocaleString('fr-FR')}</p>
                  )}
                </div>

                {/* Indicateurs */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {etape.photoRequired && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${hasPhotos ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      📷 {hasPhotos ? photos.length : '!'}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                </div>
              </div>

              {/* Contenu expandé */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                  <p className="text-[10px] text-gray-400 leading-relaxed">{etape.desc}</p>

                  {/* Info spéciale transport */}
                  {etape.id === 'evacuation' && nbVoyages > 0 && (
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded p-2 space-y-0.5 text-[9px]">
                      <p className="text-blue-400 font-bold">📊 Détail évacuation :</p>
                      <p className="text-gray-300">• <strong>{nbVoyages} voyages</strong> nécessaires</p>
                      <p className="text-gray-300">• Distance A/R : <strong>{(distanceKm * 2).toFixed(1)} km</strong> par voyage</p>
                      <p className="text-gray-300">• Temps par voyage : <strong>{tempsTrajetAR > 60 ? `${Math.floor(tempsTrajetAR/60)}h${String(tempsTrajetAR%60).padStart(2,'0')}` : `${tempsTrajetAR} min`}</strong></p>
                      <p className="text-gray-300">• Total km : <strong>{(nbVoyages * distanceKm * 2).toFixed(0)} km</strong></p>
                      <p className="text-gray-300">• Temps total : <strong>{hTransport > 0 ? `${hTransport}h${String(mTransport).padStart(2,'0')}` : `${mTransport} min`}</strong></p>
                    </div>
                  )}

                  {/* Info spéciale terrassement */}
                  {etape.id === 'terrassement' && (
                    <div className="bg-amber-500/5 border border-amber-500/15 rounded p-2 space-y-0.5 text-[9px]">
                      <p className="text-amber-400 font-bold">📊 Détail terrassement :</p>
                      <p className="text-gray-300">• Volume fouille : <strong>{devis.volumeFouille?.toFixed(1) || '?'} m³</strong></p>
                      <p className="text-gray-300">• Volume foisonné : <strong>{((devis.volumeFouille||0)*1.3).toFixed(1)} m³</strong></p>
                      <p className="text-gray-300">• Temps estimé : <strong>{scenario.tempsTerrassement || 0}h</strong></p>
                      <p className="text-gray-300">• Profondeur : <strong>{devis.profondeur || 0.5} m</strong></p>
                    </div>
                  )}

                  {/* Info spéciale remblais */}
                  {etape.id === 'remblais' && (
                    <div className="bg-green-500/5 border border-green-500/15 rounded p-2 space-y-0.5 text-[9px]">
                      <p className="text-green-400 font-bold">📊 Détail remblais :</p>
                      <p className="text-gray-300">• Volume remblais 0/20 : <strong>{devis.volumeRemblais?.toFixed(1) || '?'} m³</strong></p>
                      <p className="text-gray-300">• Volume sable PVC : <strong>{devis.volumeSablePVC?.toFixed(2) || '?'} m³</strong></p>
                    </div>
                  )}

                  {/* Zone photos */}
                  {etape.photoRequired && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className={`text-[9px] font-bold ${hasPhotos ? 'text-emerald-400' : 'text-red-400'}`}>
                          📷 {etape.photoLabel}
                        </p>
                      </div>

                      {/* Photos existantes */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-1">
                          {photos.map(p => (
                            <div key={p.id} className="relative group">
                              <img src={p.data} alt={p.name} className="w-full h-14 object-cover rounded border border-white/10" />
                              <button
                                type="button"
                                onClick={() => removePhoto(etape.id, p.id)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-white" />
                              </button>
                              <p className="text-[7px] text-gray-600 mt-0.5 truncate">{new Date(p.takenAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bouton upload */}
                      <label className="flex items-center justify-center gap-1.5 h-8 bg-rose/10 hover:bg-rose/20 text-rose text-[10px] font-bold rounded border border-rose/30 cursor-pointer transition-all">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{photos.length > 0 ? 'Ajouter des photos' : 'Prendre / Ajouter des photos'}</span>
                        <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(etape.id, e)} />
                      </label>

                      {!hasPhotos && (
                        <p className="text-[8px] text-red-400/60 text-center">⚠️ Photos obligatoires avant de valider cette étape</p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <textarea
                      placeholder="Notes / remarques..."
                      value={etat.notes || ''}
                      onChange={(e) => setNotes(etape.id, e.target.value)}
                      className="w-full h-14 px-2 py-1.5 bg-bg-input border border-white/10 rounded text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose/30 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* RÉSUMÉ FINAL */}
      {pctProgress === 100 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
          <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-emerald-400">Chantier terminé !</p>
          <p className="text-[10px] text-gray-400 mt-1">Toutes les étapes ont été validées avec photos.</p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded p-1.5 text-center ${highlight ? 'bg-rose/10 border border-rose/20' : 'bg-white/3 border border-white/5'}`}>
      <p className="text-[7px] text-gray-600 uppercase">{label}</p>
      <p className={`text-[11px] font-bold ${highlight ? 'text-rose' : 'text-white'}`}>{value}</p>
    </div>
  )
}
