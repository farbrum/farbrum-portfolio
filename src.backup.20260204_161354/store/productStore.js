import { create } from 'zustand'
import { db, settings } from '../services/supabase'


export const GROUPES_CATEGORIES = [
  { id: 'assainissement', nom: 'Assainissement', ordre: 1 },
  { id: 'materiaux', nom: 'Matériaux & Fournitures', ordre: 2 },
  { id: 'terrassement', nom: 'Terrassement & Remblais', ordre: 3 },
  { id: 'divers', nom: 'Divers', ordre: 4 },
]
export const TYPES_CATEGORIE = [
  { id: 'cuve', nom: 'Cuve / Filière', description: '1 à 4 cuves, dimensions, matériau, carrossable' },
  { id: 'tube', nom: 'Tube / Raccord', description: 'Diamètre, angle, prix unitaire' },
  { id: 'remblai', nom: 'Remblai / Granulat', description: 'Poids/m³, prix/m³' },
  { id: 'accessoire', nom: 'Accessoire', description: 'Prix unitaire, unité' },
  { id: 'autre', nom: 'Autre', description: 'Prix unitaire libre' },
]
export const MATERIAUX = [
  { id: 'pvc', nom: 'PVC' }, { id: 'beton', nom: 'Béton' }, { id: 'pehd', nom: 'PEHD' }, { id: 'autre', nom: 'Autre' },
]
export const TYPES_CUVE = [
  { id: 'principale', nom: 'Cuve principale' }, { id: 'filtre', nom: 'Filtre / Lit filtrant' },
  { id: 'decanteur', nom: 'Décanteur' }, { id: 'relevage', nom: 'Poste de relevage' }, { id: 'autre', nom: 'Autre' },
]

export const ENGINS = [
  { id: 'pelle_1_2t', nom: 'Mini-pelle 1,2t', rendementM3h: 2, coutHoraire: 25, consommationLH: 3, deplacement: 100 },
  { id: 'pelle_2_5t', nom: 'Mini-pelle 2,5t', rendementM3h: 4, coutHoraire: 30, consommationLH: 5, deplacement: 120 },
  { id: 'pelle_3t', nom: 'Mini-pelle 3t', rendementM3h: 5, coutHoraire: 35, consommationLH: 6, deplacement: 150 },
  { id: 'pelle_8t', nom: 'Pelle 8t', rendementM3h: 10, coutHoraire: 65, consommationLH: 12, deplacement: 250 },
  { id: 'pelle_13t', nom: 'Pelle 13t', rendementM3h: 15, coutHoraire: 85, consommationLH: 18, deplacement: 350 },
  { id: 'brh', nom: 'Brise-roche hydraulique', rendementM3h: 0, coutHoraire: 30, consommationLH: 8, deplacement: 100 },
  { id: 'camion_grue', nom: 'Camion grue (pose cuve)', rendementM3h: 0, coutHoraire: 95, consommationLH: 15, deplacement: 300 },
  { id: 'compacteur', nom: 'Compacteur plaque', rendementM3h: 0, coutHoraire: 15, consommationLH: 3, deplacement: 50 },
]

// ===== RESSOURCES HUMAINES =====
export const RESSOURCES_HUMAINES_DEFAULT = [
  { id: 'pelleur_1', nom: 'Pelleur / Conducteur engin', pin: '1234', roles: ['pelleur'], role: 'pelleur', tarifJournalier: 280, tarifHoraire: 35, competences: ['excavation','pose','remblai'], joursTravail: [1,2,3,4,5,6], vacances: [], indisponibilites: [] },
  { id: 'chauffeur_1', nom: 'Chauffeur PL / Tracteur', pin: '5678', roles: ['chauffeur'], role: 'chauffeur', tarifJournalier: 250, tarifHoraire: 31.25, competences: ['transport','livraison'], joursTravail: [1,2,3,4,5], vacances: [], indisponibilites: [] },
  { id: 'poseur_1', nom: 'Poseur / Tuyauteur', pin: '9012', roles: ['poseur'], role: 'poseur', tarifJournalier: 260, tarifHoraire: 32.5, competences: ['pose','tuyauterie','collage'], joursTravail: [1,2,3,4,5], vacances: [], indisponibilites: [] },
]

// ===== TARIFS MATÉRIAUX =====
export const TARIFS_MATERIAUX_DEFAULT = {
  pvcMl: 12, coudePVC: 5, terreVegetaleM3: 25, graineM2: 3,
  cableElec25Ml: 6, cableElec4Ml: 8, cableElec6Ml: 12, fourreauElec: 25,
  mortierM3: 120,
}

// ===== TARIFS CHANTIER (paramètres globaux) =====
export const TARIFS_CHANTIER_DEFAULT = {
  prixGasoilL: 1.80,                  // €/litre gasoil
  forfaitDepartOperateur: 50,          // € forfait départ opérateur (fixe)
  prixKmOperateur: 0.55,              // €/km déplacement opérateur
  tempsChargementMin: 10,              // min chargement camion par voyage
  tempsDechargementMin: 7,             // min déchargement par voyage
  tempsAttenteChantierMortierMin: 15,  // min attente sur chantier pour mortier
  tempsAttenteLivraisonMin: 30,        // min attente livraison matériaux
  coeffFoisonnement: 1.3,              // terre foisonnée = excavé × 1.3
  densiteMortier: 2.3,                 // t/m³ pour mortier béton
  heuresJourChantier: 8,              // heures travail par jour
}

// ===== TYPES DE SOL (multiplicateur temps) =====
export const TYPES_SOL = [
  { id: 'terre', nom: 'Terre / Sable', multiplicateur: 1, densite: 1.5, couleur: 'emerald' },
  { id: 'mixte', nom: 'Mixte terre/roche', multiplicateur: 2.5, densite: 2.0, couleur: 'amber' },
  { id: 'roche', nom: 'Roche', multiplicateur: 6.5, densite: 2.5, couleur: 'red' },
]

export const KITS_ASSOCIES = {
  microstation: [
    { nom: 'Sable de pose (lit 10cm)', categorie: 'remblai', obligatoire: true, prix: 180 },
    { nom: 'Remblais technique 0/20', categorie: 'remblai', obligatoire: true, prix: 220 },
    { nom: 'Géotextile', categorie: 'accessoire', obligatoire: true, prix: 90 },
    { nom: 'Dalle béton / mortier de calage', categorie: 'accessoire', obligatoire: false, prix: 150 },
    { nom: 'Ferraillage (treillis soudé)', categorie: 'accessoire', obligatoire: false, prix: 110 },
  ],
  filtre_compact: [
    { nom: 'Sable de pose (lit 10cm)', categorie: 'remblai', obligatoire: true, prix: 180 },
    { nom: 'Remblais technique 0/20', categorie: 'remblai', obligatoire: true, prix: 220 },
    { nom: 'Géotextile', categorie: 'accessoire', obligatoire: true, prix: 90 },
    { nom: 'Dalle béton / mortier de calage', categorie: 'accessoire', obligatoire: false, prix: 150 },
    { nom: 'Gravier lavé (média filtrant)', categorie: 'remblai', obligatoire: false, prix: 200 },
  ],
  filtre_epandage: [
    { nom: 'Sable de pose (lit 10cm)', categorie: 'remblai', obligatoire: true, prix: 180 },
    { nom: 'Gravier roulé lavé 20/40', categorie: 'remblai', obligatoire: true, prix: 250 },
    { nom: 'Géotextile', categorie: 'accessoire', obligatoire: true, prix: 90 },
    { nom: "Tuyaux d'épandage", categorie: 'tube', obligatoire: true, prix: 180 },
    { nom: 'Regard de répartition', categorie: 'accessoire', obligatoire: true, prix: 120 },
    { nom: 'Regard de bouclage', categorie: 'accessoire', obligatoire: false, prix: 100 },
  ],
  fosse_epandage: [
    { nom: 'Sable de pose (lit 10cm)', categorie: 'remblai', obligatoire: true, prix: 180 },
    { nom: 'Gravier roulé lavé 20/40', categorie: 'remblai', obligatoire: true, prix: 250 },
    { nom: 'Géotextile', categorie: 'accessoire', obligatoire: true, prix: 90 },
    { nom: "Tuyaux d'épandage", categorie: 'tube', obligatoire: true, prix: 180 },
    { nom: 'Regard de répartition', categorie: 'accessoire', obligatoire: true, prix: 120 },
    { nom: 'Remblais technique 0/20', categorie: 'remblai', obligatoire: false, prix: 220 },
  ],
  autre: [],
}

// ===== CALCULS =====
function calcVolCuveStrict(c) {
  const L = parseFloat(c.longueur)||0, l = parseFloat(c.largeur)||0, H = parseFloat(c.hauteur)||0
  return L * l * H
}
function calcVolFouilleCuve(L, l, H, profMin) {
  if (!L || !l || !H) return 0
  return (L + 0.80) * (l + 0.80) * (H + (profMin || 0))
}
export function calcVolumeFouilleProduit(p) {
  const cuves = p.cuves || [], profMin = parseFloat(p.profondeurMin) || 0
  if (cuves.length === 0) return 0
  let total = 0
  for (let i = 0; i < cuves.length; i++) {
    const c = cuves[i]
    const L = parseFloat(c.longueur)||0, l = parseFloat(c.largeur)||0, H = parseFloat(c.hauteur)||0
    total += calcVolFouilleCuve(L, l, H, profMin)
    if (i > 0) {
      const esp = parseFloat(c.espacement) || 0.50
      const lM = Math.max((parseFloat(cuves[i-1].largeur)||0)+0.80, l+0.80)
      const hM = Math.max((parseFloat(cuves[i-1].hauteur)||0)+profMin, H+profMin)
      total += esp * lM * hM
    }
  }
  return total
}
export function calcVolumeCuvesStrict(p) { return (p.cuves || []).reduce((s, c) => s + calcVolCuveStrict(c), 0) }
export function calcVolumeRemblais(volFouille, volCuves) { return Math.max(0, volFouille - volCuves) }
export function calcVolumeSablePVC(mlEnterres) { return mlEnterres * 0.15 }
export function calcMLPVCEnterres(form) {
  const avant = parseFloat(form.tuyauxAvantFiliere) || 0, apres = parseFloat(form.tuyauxApresFiliere) || 0
  const aeration = parseFloat(form.longueurAeration) || 0
  const ventTotal = parseFloat(form.longueurVentilation) || 0, ventAerien = parseFloat(form.ventilationAerienne) || 0
  return avant + apres + aeration + Math.max(0, ventTotal - ventAerien)
}
export function calcRehausses(profondeur) {
  const prof = parseFloat(profondeur) || 0.5
  return prof <= 0.5 ? 0 : Math.ceil((prof - 0.5) / 0.30)
}

// ===== ÉPANDAGE (DT 64.1) =====
export function calcEpandage(surfaceM2, nbDrains) {
  if (!surfaceM2 || surfaceM2 <= 0) return null
  const drains = nbDrains || Math.ceil(surfaceM2 / 15 * 2)
  const longueurDrainTotal = surfaceM2 * 2.13, longueurParDrain = longueurDrainTotal / Math.max(drains, 1)
  const profondeurFouille = 0.60, surfaceFouille = surfaceM2 * 1.2
  const volumeFouilleEpandage = surfaceFouille * profondeurFouille
  const volumeGravier = surfaceFouille * 0.40
  const terreEvacuee = volumeFouilleEpandage, foisonneEpandage = terreEvacuee * 1.3
  return { surfaceM2, nbDrains: drains,
    longueurDrainTotal: Math.round(longueurDrainTotal*10)/10, longueurParDrain: Math.round(longueurParDrain*10)/10,
    surfaceFouille: Math.round(surfaceFouille*10)/10, volumeFouilleEpandage: Math.round(volumeFouilleEpandage*10)/10,
    volumeGravier: Math.round(volumeGravier*10)/10, terreEvacuee: Math.round(terreEvacuee*10)/10,
    foisonneEpandage: Math.round(foisonneEpandage*10)/10, profondeurFouille }
}

// ===== SECTIONS RÉDACTIONNELLES =====
export const SECTIONS_REDACTIONNELLES = [
  { id: 1, titre: '1. Définition globale du projet', defaut: "Le présent devis concerne la mise en place d'un système d'assainissement non collectif (ANC) conforme aux normes en vigueur. L'installation sera réalisée selon les préconisations du SPANC et de l'étude de sol." },
  { id: 2, titre: '2. Terrassement et aménagement du terrain', defaut: "Les travaux de terrassement comprennent l'excavation de la fouille aux dimensions requises, la mise en place du lit de pose, et le remblaiement technique autour des cuves avec des matériaux certifiés." },
  { id: 3, titre: '3. Gestion des eaux pluviales', defaut: "La gestion des eaux pluviales sera assurée conformément aux règles de l'art. Les eaux pluviales ne seront en aucun cas dirigées vers le système d'assainissement." },
  { id: 4, titre: '4. Gestion des remblais et divers', defaut: "Les remblais excédentaires seront évacués vers un site agréé. Le volume foisonné sera calculé avec un coefficient de 1.3 appliqué au volume excavé." },
  { id: 5, titre: '5. Préparation pour la pose de la filière', defaut: "Le lit de pose sera constitué de sable ou gravier selon les prescriptions du fabricant. Les cuves seront posées de niveau et calées conformément aux recommandations." },
  { id: 6, titre: '6. Contraintes logistiques & techniques', defaut: "L'accès au chantier doit permettre le passage des engins et véhicules de transport. Toute difficulté d'accès non signalée lors de la visite préalable pourra entraîner un surcoût." },
  { id: 7, titre: '7. Estimation de la durée des travaux', defaut: "La durée estimée des travaux est calculée automatiquement en fonction du volume à excaver, du nombre de voyages, et du temps de pose. Un planning détaillé sera communiqué avant le démarrage." },
  { id: 8, titre: '8. Structure du devis', defaut: "Le présent devis détaille l'ensemble des postes de dépenses : terrassement, transport, matériel ANC, fournitures, main d'œuvre et prestations annexes." },
  { id: 9, titre: '9. Clause de transparence financière', defaut: "Dans un contexte où les tentatives de fraude se multiplient et où les communications électroniques peuvent être interceptées ou usurpées, nous tenons à rappeler que personne n'est autorisé à réclamer un quelconque paiement ou acompte au nom de notre société avant qu'un devis daté, écrit et signé par les deux parties n'ait été validé et confirmé par l'envoi de différents codes et niveau de vérification. Cette mesure vise à protéger nos clients comme notre entreprise, en garantissant que toute transaction financière repose sur un accord clair, formel et sécurisé. Toute demande de versement en dehors de ce cadre serait considérée comme non conforme à nos procédures internes et devra être immédiatement portée à notre connaissance." },
  { id: 10, titre: '10. Conclusion', defaut: "Nous restons à votre disposition pour toute question relative à ce devis. Notre engagement est de vous fournir une installation conforme, durable et respectueuse de l'environnement." },
]

export function calcPoidsTotal(p) { return (p.cuves||[]).reduce((s, c) => s + (parseFloat(c.poids)||0), 0) }

export function calcSurfaceFouilleProduit(p) {
  const cuves = p.cuves || []
  if (cuves.length === 0) return 0
  let total = 0
  for (const c of cuves) { const L = parseFloat(c.longueur)||0, l = parseFloat(c.largeur)||0; total += (L+0.80)*(l+0.80) }
  return total
}

// ===== RESTAURATION SURFACE =====
// Surface fouille × 3 × 0.25m épaisseur terre végétale + graine gazon 3€/m²
export function calcRestauration(surfaceFouille, tarifs) {
  if (!surfaceFouille || surfaceFouille <= 0) return null
  const surfaceRestauree = Math.round(surfaceFouille * 3 * 10) / 10
  const volumeTerre = Math.round(surfaceRestauree * 0.25 * 10) / 10
  const pxTerre = tarifs?.terreVegetaleM3 || 25
  const pxGraine = tarifs?.graineM2 || 3
  const coutTerre = Math.round(volumeTerre * pxTerre * 100) / 100
  const coutGraine = Math.round(surfaceRestauree * pxGraine * 100) / 100
  return { surfaceRestauree, volumeTerre, pxTerre, coutTerre, pxGraine, coutGraine, coutTotal: Math.round((coutTerre + coutGraine)*100)/100 }
}

// ===== MAIN D'OEUVRE AUTO (modèle horaire additif) =====
export function calcMainOeuvre(engin, typeSol, distanceChantierKm, vehicule, volFouille, volDeco, epandageData, tarifsChantier, opts = {}) {
  const tc = { ...TARIFS_CHANTIER_DEFAULT, ...tarifsChantier }
  const {
    tuyauxAvant = 0, tuyauxApres = 0, nbCoudes = 0,
    nbCuves = 1, nbPoseurs = 2, restauration = false,
    surfaceFouille = 0, epaisseurMortier = 0.20,
    distanceMortierKm = 0, vehiculeMortier = null,
    distanceLivraisonKm = 0,
    ventilationAerienne = 0,
  } = opts

  const volTotal = volFouille + volDeco
  const volEp = epandageData ? epandageData.volumeFouilleEpandage : 0
  const volumeExcav = volTotal + volEp
  const hJour = tc.heuresJourChantier || 8

  // ─── 1. EXCAVATION (engin + pelleur) ───
  // Rendement effectif = rendement engin en terre ÷ multiplicateur sol
  const rendementEffectif = (engin?.rendementM3h || 5) / (typeSol?.multiplicateur || 1)
  const hExcav = volumeExcav > 0 ? volumeExcav / rendementEffectif : 0
  // Minimum 1 journée — on ne déplace pas un engin pour 2h
  const hEnginMin = hExcav > 0 ? Math.max(hExcav, hJour) : 0
  const joursEngin = hEnginMin > 0 ? Math.ceil(hEnginMin / hJour) : 0

  // ─── 2. TRANSPORT ÉVACUATION (véhicule + chauffeur) ───
  const volFoison = volumeExcav * tc.coeffFoisonnement
  const poids = volFoison * (typeSol?.densite || 1.5)
  let nbVoyEvac = 0
  if (vehicule && volFoison > 0) {
    const cu = (vehicule.ptac || 0) - (vehicule.poidsVide || 0)
    const parVol = vehicule.capaciteM3 > 0 ? Math.ceil(volFoison / vehicule.capaciteM3) : 0
    const parPoids = cu > 0 ? Math.ceil(poids / cu) : 0
    nbVoyEvac = Math.max(parVol, parPoids, 1) // minimum 1 voyage
  }
  // Temps par voyage A/R = route + chargement + déchargement
  const hRouteEvacAR = (vehicule?.vitesseKmh > 0 && distanceChantierKm > 0)
    ? (distanceChantierKm * 2) / vehicule.vitesseKmh : 0
  const hChargement = tc.tempsChargementMin / 60
  const hDechargement = tc.tempsDechargementMin / 60
  const hParVoyEvac = hRouteEvacAR + hChargement + hDechargement
  const hChauffeurEvac = nbVoyEvac * hParVoyEvac

  // Pelliste attend pendant les A/R évacuation (il charge, puis attend le retour)
  // Temps d'attente = temps total transport - temps de chargement (il est actif pendant le chargement)
  const hPellisteAttenteEvac = nbVoyEvac > 0 ? nbVoyEvac * (hRouteEvacAR + hDechargement) : 0

  // ─── 3. TRANSPORT MORTIER ───
  const volMortier = surfaceFouille > 0 ? Math.round(surfaceFouille * epaisseurMortier * 100) / 100 : 0
  const vMort = vehiculeMortier || vehicule
  let nbVoyMortier = 0
  if (vMort && volMortier > 0 && distanceMortierKm > 0) {
    const cuMort = (vMort.ptac || 0) - (vMort.poidsVide || 0)
    const parVol = vMort.capaciteM3 > 0 ? Math.ceil(volMortier / vMort.capaciteM3) : 0
    const parPoids = cuMort > 0 ? Math.ceil((volMortier * tc.densiteMortier) / cuMort) : 0
    nbVoyMortier = Math.max(parVol, parPoids, 1) // minimum 1 voyage
  }
  const hRouteMortierAR = (vMort?.vitesseKmh > 0 && distanceMortierKm > 0)
    ? (distanceMortierKm * 2) / vMort.vitesseKmh : 0
  const hAttenteChantierMortier = tc.tempsAttenteChantierMortierMin / 60
  const hParVoyMortier = hRouteMortierAR + hAttenteChantierMortier
  const hChauffeurMortier = nbVoyMortier * hParVoyMortier

  // ─── 4. LIVRAISON MATÉRIAUX (1 A/R) ───
  const hRouteLivraison = (vehicule?.vitesseKmh > 0 && distanceLivraisonKm > 0)
    ? (distanceLivraisonKm * 2) / vehicule.vitesseKmh : 0
  const hAttenteLivraison = distanceLivraisonKm > 0 ? tc.tempsAttenteLivraisonMin / 60 : 0
  const hChauffeurLivraison = hRouteLivraison + hAttenteLivraison

  // ─── Total chauffeur ───
  const hChauffeurTotal = hChauffeurEvac + hChauffeurMortier + hChauffeurLivraison

  // ─── 5. PELLEUR : excavation + attente pendant évacuation ───
  const hPelleurExcav = hExcav
  const hPelleurTotal = hPelleurExcav + hPellisteAttenteEvac
  // Minimum 1 jour si excavation
  const hPelleurFacture = hPelleurTotal > 0 ? Math.max(hPelleurTotal, hJour) : 0

  // ─── 6. POSE DÉTAILLÉE (poseurs) ───
  const mlPVC = tuyauxAvant + tuyauxApres
  const hPVC = mlPVC * (15 / 60)              // 15 min/ml
  const hCoudes = nbCoudes * (7 / 60)          // 7 min/coude collé
  const hPoseCuves = 2                         // 2h pour poser la ou les cuves
  const hRemblaiCuves = 2.5 * nbCuves          // 2.5h par cuve (remblaiement)
  const hVentilation = ventilationAerienne > 0 ? 2 : 0
  const hRestauration = restauration ? 6 : 0

  const hPoseDuree = hPVC + hCoudes + hPoseCuves + hRemblaiCuves + hVentilation + hRestauration
  const hPoseCout = hPoseDuree * nbPoseurs

  // ─── DURÉE CHANTIER ───
  // Parallélisme: pelleur et chauffeur travaillent en même temps
  const hPhaseTerrassement = Math.max(hPelleurFacture, hChauffeurTotal)
  const totalDuree = hPhaseTerrassement + hPoseDuree
  const jours = Math.max(1, Math.ceil(totalDuree / hJour))

  const r1 = v => Math.round(v * 10) / 10
  return {
    // Volumes
    volumeExcav, volFoison: r1(volFoison), poids: r1(poids),
    // Excavation
    rendementEffectif: Math.round(rendementEffectif * 100) / 100,
    hExcav: r1(hExcav), hEnginMin: r1(hEnginMin), joursEngin,
    // Pelleur
    hPelleurExcav: r1(hPelleurExcav),
    hPellisteAttenteEvac: r1(hPellisteAttenteEvac),
    hPelleurTotal: r1(hPelleurTotal),
    hPelleurFacture: r1(hPelleurFacture),
    // Chauffeur détaillé
    hChauffeurEvac: r1(hChauffeurEvac), hChauffeurMortier: r1(hChauffeurMortier),
    hChauffeurLivraison: r1(hChauffeurLivraison), hChauffeurTotal: r1(hChauffeurTotal),
    hParVoyEvac: Math.round(hParVoyEvac * 60), // en minutes
    hParVoyMortier: Math.round(hParVoyMortier * 60),
    nbVoyEvac, nbVoyMortier, volMortier,
    // Pose détaillée
    hPVC: r1(hPVC), hCoudes: r1(hCoudes), hPoseCuves, hRemblaiCuves: r1(hRemblaiCuves),
    hVentilation, hRestauration,
    hPoseDuree: r1(hPoseDuree), hPoseCout: r1(hPoseCout), nbPoseurs,
    // Totaux
    totalH: r1(totalDuree), totalJours: jours,
  }
}

// ===== JOURS FÉRIÉS FRANÇAIS =====
export function getJoursFeries(annee) {
  const a=annee%19,b=Math.floor(annee/100),c=annee%100
  const d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25)
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30
  const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7
  const m=Math.floor((a+11*h+22*l)/451)
  const mo=Math.floor((h+l-7*m+114)/31)-1, jo=(h+l-7*m+114)%31+1
  const paques = new Date(annee, mo, jo)
  const fmt = dt => dt.toISOString().split('T')[0]
  const add = (dt,n) => { const r=new Date(dt); r.setDate(dt.getDate()+n); return r }
  return [`${annee}-01-01`,fmt(add(paques,1)),`${annee}-05-01`,`${annee}-05-08`,fmt(add(paques,39)),fmt(add(paques,50)),`${annee}-07-14`,`${annee}-08-15`,`${annee}-11-01`,`${annee}-11-11`,`${annee}-12-25`]
}

// ===== CALENDRIER DISPONIBILITÉ =====
export function getJoursDisponibles(ressources, enginsData, enginsRequis, mois, annee, poseSamedi=false) {
  const jours = [], nb = new Date(annee, mois+1, 0).getDate()
  const feries = getJoursFeries(annee)
  for (let d = 1; d <= nb; d++) {
    const dt = new Date(annee, mois, d), dow = dt.getDay()
    if (dow===0) continue // dimanche toujours fermé
    if (dow===6 && !poseSamedi) continue // samedi fermé sauf si option
    const ds = dt.toISOString().split('T')[0]
    const isClosedDefault = dow===6 || feries.includes(ds)
    const rOk = ressources.every(r=>{
      const inList = (r.indisponibilites||[]).includes(ds)
      return isClosedDefault ? inList : !inList // samedi/férié: dispo si dans la liste (inversé)
    })
    const eOk = enginsRequis.every(eid=>{ const eg=enginsData.find(e=>e.id===eid); return eg?!(eg.indisponibilites||[]).includes(ds):true })
    if (rOk && eOk) jours.push(ds)
  }
  return jours
}

export function trouverProchainCreneau(ressources, enginsData, enginsRequis, nbJours, fromDate, poseSamedi=false) {
  const start = fromDate || new Date(), max = 180
  const feriesCache = {}
  const getFeries = (y) => { if(!feriesCache[y]) feriesCache[y]=getJoursFeries(y); return feriesCache[y] }
  let cons = []
  for (let i = 0; i < max; i++) {
    const dt = new Date(start); dt.setDate(start.getDate() + i)
    const dow = dt.getDay()
    if (dow===0) { cons = []; continue }
    if (dow===6 && !poseSamedi) { cons = []; continue }
    const ds = dt.toISOString().split('T')[0]
    const feries = getFeries(dt.getFullYear())
    const isClosedDefault = dow===6 || feries.includes(ds)
    const rOk = ressources.every(r=>{const inList=(r.indisponibilites||[]).includes(ds);return isClosedDefault?inList:!inList})
    const eOk = enginsRequis.every(eid=>{ const eg=enginsData.find(e=>e.id===eid); return eg?!(eg.indisponibilites||[]).includes(ds):true })
    if (rOk && eOk) { cons.push(ds); if (cons.length >= nbJours) return cons } else { cons = [] }
  }
  return cons
}

// ===== CALCUL SCÉNARIO COMPLET (modèle additif) =====
// Chaque poste = somme de composantes (véhicule km + chauffeur h + pelliste h + gasoil + forfaits)
export function calcScenario(engin, typeSol, volumeFouille, volumeDeco, distanceEvacKm, vehicule, epandageData, ressources, tarifsMateriaux, tarifsChantier, opts = {}) {
  const tc = { ...TARIFS_CHANTIER_DEFAULT, ...tarifsChantier }
  const tarifs = { ...TARIFS_MATERIAUX_DEFAULT, ...tarifsMateriaux }
  const ress = ressources || RESSOURCES_HUMAINES_DEFAULT
  const hJour = tc.heuresJourChantier || 8

  // Distance dépôt→chantier pour l'opérateur
  const distanceChantierKm = parseFloat(opts.distanceChantierKm) || 0

  // Tarifs horaires des ressources
  const tarifHPelleur = ress.find(r => r.id === 'pelleur_1')?.tarifHoraire || 35
  const tarifHChauffeur = ress.find(r => r.id === 'chauffeur_1')?.tarifHoraire || 31.25
  const tarifHPoseur = ress.find(r => r.id === 'poseur_1')?.tarifHoraire || 32.5

  // Main d'œuvre détaillée (heures)
  const mo = calcMainOeuvre(engin, typeSol, distanceEvacKm, vehicule, volumeFouille, volumeDeco, epandageData, tarifsChantier, opts)

  // ═══════════════════════════════════════════════════════
  // A. TERRASSEMENT (creuser) — coûts additifs
  // ═══════════════════════════════════════════════════════
  // A1. Engin : heures × coût horaire
  const coutEnginLocation = Math.ceil(mo.hEnginMin * (engin?.coutHoraire || 0))
  // A2. Gasoil engin : heures × conso L/h × prix gasoil
  const coutGasoilEngin = Math.ceil(mo.hEnginMin * (engin?.consommationLH || 0) * tc.prixGasoilL)
  // A3. Déplacement engin : forfait BD
  const coutDeplEngin = engin?.deplacement || 0
  // A4. Opérateur (pelleur) : heures facturées × tarif horaire
  const coutPelleurExcav = Math.ceil(mo.hPelleurFacture * tarifHPelleur)
  // A5. Déplacement opérateur : forfait départ + km × prix/km
  const coutDeplOperateur = mo.hEnginMin > 0
    ? Math.ceil(tc.forfaitDepartOperateur + (distanceChantierKm * tc.prixKmOperateur))
    : 0

  const coutTerrassementTotal = coutEnginLocation + coutGasoilEngin + coutDeplEngin + coutPelleurExcav + coutDeplOperateur

  // ═══════════════════════════════════════════════════════
  // B. ÉVACUATION REMBLAIS — coûts additifs
  // ═══════════════════════════════════════════════════════
  // B1. Véhicule km : nb voyages × distance A/R × prix/km
  let coutEvacVehiculeKm = 0
  if (vehicule && mo.nbVoyEvac > 0 && distanceEvacKm > 0) {
    coutEvacVehiculeKm = Math.ceil(mo.nbVoyEvac * (distanceEvacKm * 2) * (vehicule.prixKm || 0))
  }
  // B2. Chauffeur : heures transport évac × tarif horaire
  const coutEvacChauffeur = Math.ceil(mo.hChauffeurEvac * tarifHChauffeur)
  // B3. Attente pelliste pendant transport : heures × tarif pelleur
  const coutEvacAttentePelliste = Math.ceil(mo.hPellisteAttenteEvac * tarifHPelleur)

  const coutEvacuationTotal = coutEvacVehiculeKm + coutEvacChauffeur + coutEvacAttentePelliste

  // ═══════════════════════════════════════════════════════
  // C. MORTIER — coûts additifs
  // ═══════════════════════════════════════════════════════
  const vMort = opts.vehiculeMortier || vehicule
  // C1. Véhicule km mortier
  const coutMortierVehiculeKm = (mo.nbVoyMortier > 0 && (opts.distanceMortierKm || 0) > 0 && vMort)
    ? Math.ceil(mo.nbVoyMortier * ((opts.distanceMortierKm || 0) * 2) * (vMort.prixKm || 0)) : 0
  // C2. Chauffeur mortier
  const coutMortierChauffeur = Math.ceil(mo.hChauffeurMortier * tarifHChauffeur)
  // C3. Matière mortier
  const coutMortierMatiere = Math.ceil(mo.volMortier * (tarifs.mortierM3 || 120))

  const coutMortierTotal = coutMortierVehiculeKm + coutMortierChauffeur + coutMortierMatiere

  // ═══════════════════════════════════════════════════════
  // D. LIVRAISON MATÉRIAUX — coûts additifs
  // ═══════════════════════════════════════════════════════
  // D1. Véhicule km livraison
  const coutLivraisonVehiculeKm = ((opts.distanceLivraisonKm || 0) > 0 && vehicule)
    ? Math.ceil((opts.distanceLivraisonKm || 0) * 2 * (vehicule.prixKm || 0)) : 0
  // D2. Chauffeur livraison
  const coutLivraisonChauffeur = Math.ceil(mo.hChauffeurLivraison * tarifHChauffeur)

  const coutLivraisonTotal = coutLivraisonVehiculeKm + coutLivraisonChauffeur

  // ═══════════════════════════════════════════════════════
  // E. POSE — coûts additifs
  // ═══════════════════════════════════════════════════════
  const coutPoseur = Math.ceil(mo.hPoseCout * tarifHPoseur)

  // ═══════════════════════════════════════════════════════
  // SYNTHÈSE POUR LE CLIENT (postes fusionnés)
  // ═══════════════════════════════════════════════════════
  // Le client voit des postes clairs, pas le détail opérateurs
  const coutTerrassementClient = coutTerrassementTotal
  const coutTransportClient = coutEvacuationTotal
  const coutMortierTranspClient = coutMortierVehiculeKm + coutMortierChauffeur
  const coutLivraisonClient = coutLivraisonTotal

  return {
    // Identifiants
    scenarioId: typeSol.id, scenarioNom: `${engin?.nom || '?'} — ${typeSol.nom}`,
    enginId: engin?.id, enginNom: engin?.nom, typeSolId: typeSol.id, typeSolNom: typeSol.nom,
    couleur: typeSol.couleur,
    // Volumes
    volTotal: mo.volumeExcav, volFoison: mo.volFoison, poidsTonnes: mo.poids,
    densite: typeSol.densite, multiplicateur: typeSol.multiplicateur,
    rendementEffectif: mo.rendementEffectif,
    // ── A. TERRASSEMENT détail ──
    hExcav: mo.hExcav, hEnginMin: mo.hEnginMin, joursEngin: mo.joursEngin,
    coutEnginLocation, coutGasoilEngin, coutDeplEngin,
    coutPelleurExcav, coutDeplOperateur,
    coutTerrassementTotal,
    // ── B. ÉVACUATION détail ──
    nbVoyages: mo.nbVoyEvac,
    coutEvacVehiculeKm, coutEvacChauffeur, coutEvacAttentePelliste,
    coutEvacuationTotal,
    // ── C. MORTIER détail ──
    volMortier: mo.volMortier, nbVoyMortier: mo.nbVoyMortier,
    coutMortierVehiculeKm, coutMortierChauffeur, coutMortierMatiere,
    coutMortierTotal,
    // ── D. LIVRAISON détail ──
    coutLivraisonVehiculeKm, coutLivraisonChauffeur,
    coutLivraisonTotal,
    // ── E. POSE ──
    coutPoseur,
    // ── Main d'œuvre complète (détail heures) ──
    mainOeuvre: mo,
    // Tarifs utilisés
    tarifHPelleur, tarifHChauffeur, tarifHPoseur,
    // ── Coûts fusionnés (vue client) ──
    coutTerrassementClient, coutTransportClient,
    coutMortierTranspClient, coutLivraisonClient,
  }
}


// ═══════════════════════════════════════════════════════════
// STORE — Zustand SANS localStorage, avec sync Supabase
// ═══════════════════════════════════════════════════════════

export const useProductStore = create((set, get) => ({
  categories: [
    { id: 'microstations', nom: 'Microstations', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 1 },
    { id: 'filtres_compacts', nom: 'Filtres compacts', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 2 },
    { id: 'fosses', nom: 'Fosses toutes eaux', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 3 },
    { id: 'postes_relevage', nom: 'Postes de relevage', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 4 },
    { id: 'tubes_pvc', nom: 'Tubes PVC', typeCategorie: 'tube', groupeId: 'materiaux', ordre: 5 },
    { id: 'coudes_raccords', nom: 'Coudes & Raccords', typeCategorie: 'tube', groupeId: 'materiaux', ordre: 6 },
    { id: 'remblais', nom: 'Remblais', typeCategorie: 'remblai', groupeId: 'terrassement', ordre: 7 },
    { id: 'accessoires', nom: 'Accessoires', typeCategorie: 'accessoire', groupeId: 'divers', ordre: 8 },
  ],
  fournisseurs: [],
  produits: [],
  vehicules: [
    { id: 'semi', nom: 'Semi-remorque', ptac: 30, poidsVide: 15, capaciteM3: 20, vitesseKmh: 45, prixKm: 2.5 },
    { id: 'camion17', nom: 'Camion 17t', ptac: 17, poidsVide: 8, capaciteM3: 10, vitesseKmh: 45, prixKm: 2.0 },
    { id: 'camion10', nom: 'Camion 10t', ptac: 10, poidsVide: 5, capaciteM3: 6, vitesseKmh: 45, prixKm: 1.8 },
    { id: 'camion_benne', nom: 'Camion benne 3.5t', ptac: 3.5, poidsVide: 1.8, capaciteM3: 3, vitesseKmh: 45, prixKm: 1.5 },
    { id: 'tracteur_remorque', nom: 'Tracteur + remorque', ptac: 8, poidsVide: 4, capaciteM3: 6, vitesseKmh: 16, prixKm: 1.2 },
  ],
  ressources: [...RESSOURCES_HUMAINES_DEFAULT],
  tarifsMateriaux: { ...TARIFS_MATERIAUX_DEFAULT },
  tarifsChantier: { ...TARIFS_CHANTIER_DEFAULT },
  enginsData: ENGINS.map(e => ({ ...e, indisponibilites: [] })),
  loaded: false,
  loading: false,

  // ─── INIT : Charger depuis Supabase ───
  init: async () => {
    if (get().loaded) return
    set({ loading: true })
    try {
      const [cats, fourns, prods, vehs, engs, ress, tMat, tCh] = await Promise.all([
        db.getAll('categories'),
        db.getAll('fournisseurs'),
        db.getAll('produits'),
        db.getAll('vehicules'),
        db.getAll('engins'),
        db.getAll('ressources'),
        settings.get('tarifs_materiaux'),
        settings.get('tarifs_chantier'),
      ])
      set({
        categories: cats?.length > 0 ? cats.map(c => ({ id: c.id, nom: c.nom, typeCategorie: c.data?.typeCategorie || c.type || 'autre', groupeId: c.data?.groupeId || c.groupe || 'divers', ordre: c.data?.ordre || 0, ...(c.data || {}) })) : get().categories,
        fournisseurs: fourns?.length > 0 ? fourns.map(f => ({ id: f.id, nom: f.nom, contact: f.contact, telephone: f.telephone, email: f.email, adresse: f.adresse, notes: f.notes, ...(f.data || {}) })) : get().fournisseurs,
        produits: prods?.length > 0 ? prods.map(p => ({ id: p.id, nom: p.nom, categorieId: p.categorie_id, fournisseurId: p.fournisseur_id, prix: p.prix, unite: p.unite, ...(p.data || {}) })) : get().produits,
        vehicules: vehs?.length > 0 ? vehs.map(v => ({ id: v.id, nom: v.nom, ...(v.data || {}) })) : get().vehicules,
        enginsData: engs?.length > 0 ? engs.map(e => ({ id: e.id, nom: e.nom, rendementM3h: e.rendement_m3h, coutHoraire: e.cout_horaire, consommationLH: e.consommation_lh, deplacement: e.deplacement, indisponibilites: e.data?.indisponibilites || [], ...(e.data || {}) })) : get().enginsData,
        ressources: ress?.length > 0 ? ress.map(r => ({ id: r.id, nom: r.nom, pin: r.pin, role: r.role, tarifJournalier: r.tarif_journalier, tarifHoraire: r.tarif_horaire, competences: r.competences || [], joursTravail: r.jours_travail || [1,2,3,4,5], indisponibilites: r.data?.indisponibilites || [], ...(r.data || {}) })) : get().ressources,
        tarifsMateriaux: tMat ? { ...TARIFS_MATERIAUX_DEFAULT, ...tMat } : get().tarifsMateriaux,
        tarifsChantier: tCh ? { ...TARIFS_CHANTIER_DEFAULT, ...tCh } : get().tarifsChantier,
        loaded: true, loading: false,
      })
      console.log('[ProductStore] ✅ Données chargées depuis Supabase')
    } catch (err) {
      console.error('[ProductStore] init error:', err)
      set({ loaded: true, loading: false })
    }
  },

  // ─── CRUD Catégories ───
  addCategorie: (d) => {
    const c = { id: Date.now().toString(), ordre: get().categories.length + 1, ...d }
    set(s => ({ categories: [...s.categories, c] }))
    db.upsert('categories', { id: c.id, nom: c.nom, groupe: c.groupeId || 'divers', type: c.typeCategorie || 'autre', data: c }).catch(e => console.error('[DB]', e))
    return c
  },
  updateCategorie: (id, d) => {
    set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...d } : c) }))
    const updated = get().categories.find(c => c.id === id)
    if (updated) db.upsert('categories', { id, nom: updated.nom, groupe: updated.groupeId || 'divers', type: updated.typeCategorie || 'autre', data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteCategorie: (id) => {
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }))
    db.delete('categories', id).catch(e => console.error('[DB]', e))
  },
  getCategoriesSorted: () => {
    const go = { assainissement: 1, materiaux: 2, terrassement: 3, divers: 4 }
    return [...get().categories].sort((a, b) => { const ga = go[a.groupeId] || 99, gb = go[b.groupeId] || 99; return ga !== gb ? ga - gb : (a.ordre || 99) - (b.ordre || 99) })
  },

  // ─── CRUD Fournisseurs ───
  addFournisseur: (d) => {
    const f = { id: Date.now().toString(), ...d }
    set(s => ({ fournisseurs: [...s.fournisseurs, f] }))
    db.upsert('fournisseurs', { id: f.id, nom: f.nom, contact: f.contact || '', telephone: f.telephone || '', email: f.email || '', adresse: f.adresse || '', notes: f.notes || '', data: f }).catch(e => console.error('[DB]', e))
    return f
  },
  updateFournisseur: (id, d) => {
    set(s => ({ fournisseurs: s.fournisseurs.map(f => f.id === id ? { ...f, ...d } : f) }))
    const updated = get().fournisseurs.find(f => f.id === id)
    if (updated) db.upsert('fournisseurs', { id, nom: updated.nom, contact: updated.contact || '', telephone: updated.telephone || '', email: updated.email || '', adresse: updated.adresse || '', notes: updated.notes || '', data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteFournisseur: (id) => {
    set(s => ({ fournisseurs: s.fournisseurs.filter(f => f.id !== id) }))
    db.delete('fournisseurs', id).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Produits ───
  addProduit: (d) => {
    const p = { id: Date.now().toString(), dateAjout: new Date().toISOString(), ...d }
    set(s => ({ produits: [...s.produits, p] }))
    db.upsert('produits', { id: p.id, nom: p.nom, categorie_id: p.categorieId || null, fournisseur_id: p.fournisseurId || null, prix: p.prix || p.prixUnitaire || 0, unite: p.unite || 'u', data: p }).catch(e => console.error('[DB]', e))
    return p
  },
  updateProduit: (id, d) => {
    set(s => ({ produits: s.produits.map(p => p.id === id ? { ...p, ...d } : p) }))
    const updated = get().produits.find(p => p.id === id)
    if (updated) db.upsert('produits', { id, nom: updated.nom, categorie_id: updated.categorieId || null, fournisseur_id: updated.fournisseurId || null, prix: updated.prix || updated.prixUnitaire || 0, unite: updated.unite || 'u', data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteProduit: (id) => {
    set(s => ({ produits: s.produits.filter(p => p.id !== id) }))
    db.delete('produits', id).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Véhicules ───
  addVehicule: (d) => {
    const v = { id: Date.now().toString(), ...d }
    set(s => ({ vehicules: [...s.vehicules, v] }))
    db.upsert('vehicules', { id: v.id, nom: v.nom, immatriculation: v.immatriculation || '', capacite_m3: v.capaciteM3 || 0, cout_km: v.prixKm || 0, data: v }).catch(e => console.error('[DB]', e))
    return v
  },
  updateVehicule: (id, d) => {
    set(s => ({ vehicules: s.vehicules.map(v => v.id === id ? { ...v, ...d } : v) }))
    const updated = get().vehicules.find(v => v.id === id)
    if (updated) db.upsert('vehicules', { id, nom: updated.nom, immatriculation: updated.immatriculation || '', capacite_m3: updated.capaciteM3 || 0, cout_km: updated.prixKm || 0, data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteVehicule: (id) => {
    set(s => ({ vehicules: s.vehicules.filter(v => v.id !== id) }))
    db.delete('vehicules', id).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Ressources ───
  addRessource: (d) => {
    const r = { id: Date.now().toString(), indisponibilites: [], ...d }
    set(s => ({ ressources: [...s.ressources, r] }))
    db.upsert('ressources', { id: r.id, nom: r.nom, pin: r.pin || '', role: r.role || 'poseur', tarif_journalier: r.tarifJournalier || 0, tarif_horaire: r.tarifHoraire || 0, competences: r.competences || [], jours_travail: r.joursTravail || [1,2,3,4,5], data: r }).catch(e => console.error('[DB]', e))
    return r
  },
  updateRessource: (id, d) => {
    set(s => ({ ressources: s.ressources.map(r => r.id === id ? { ...r, ...d } : r) }))
    const updated = get().ressources.find(r => r.id === id)
    if (updated) db.upsert('ressources', { id, nom: updated.nom, pin: updated.pin || '', role: updated.role || 'poseur', tarif_journalier: updated.tarifJournalier || 0, tarif_horaire: updated.tarifHoraire || 0, competences: updated.competences || [], jours_travail: updated.joursTravail || [1,2,3,4,5], data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteRessource: (id) => {
    set(s => ({ ressources: s.ressources.filter(r => r.id !== id) }))
    db.delete('ressources', id).catch(e => console.error('[DB]', e))
  },
  toggleRessourceIndispo: (id, dateStr) => {
    set(s => ({
      ressources: s.ressources.map(r => r.id === id ? { ...r, indisponibilites: (r.indisponibilites || []).includes(dateStr) ? r.indisponibilites.filter(d => d !== dateStr) : [...(r.indisponibilites || []), dateStr] } : r)
    }))
    const updated = get().ressources.find(r => r.id === id)
    if (updated) db.upsert('ressources', { id, nom: updated.nom, pin: updated.pin || '', role: updated.role || 'poseur', tarif_journalier: updated.tarifJournalier || 0, tarif_horaire: updated.tarifHoraire || 0, competences: updated.competences || [], jours_travail: updated.joursTravail || [1,2,3,4,5], data: updated }).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Engins ───
  addEngin: (d) => {
    const e = { id: Date.now().toString(), indisponibilites: [], ...d }
    set(s => ({ enginsData: [...s.enginsData, e] }))
    db.upsert('engins', { id: e.id, nom: e.nom, rendement_m3h: e.rendementM3h || 0, cout_horaire: e.coutHoraire || 0, consommation_lh: e.consommationLH || 0, deplacement: e.deplacement || 0, data: e }).catch(err => console.error('[DB]', err))
    return e
  },
  updateEngin: (id, d) => {
    set(s => ({ enginsData: s.enginsData.map(e => e.id === id ? { ...e, ...d } : e) }))
    const updated = get().enginsData.find(e => e.id === id)
    if (updated) db.upsert('engins', { id, nom: updated.nom, rendement_m3h: updated.rendementM3h || 0, cout_horaire: updated.coutHoraire || 0, consommation_lh: updated.consommationLH || 0, deplacement: updated.deplacement || 0, data: updated }).catch(err => console.error('[DB]', err))
  },
  deleteEngin: (id) => {
    set(s => ({ enginsData: s.enginsData.filter(e => e.id !== id) }))
    db.delete('engins', id).catch(e => console.error('[DB]', e))
  },
  toggleEnginIndispo: (id, dateStr) => {
    set(s => ({
      enginsData: s.enginsData.map(e => e.id === id ? { ...e, indisponibilites: (e.indisponibilites || []).includes(dateStr) ? e.indisponibilites.filter(d => d !== dateStr) : [...(e.indisponibilites || []), dateStr] } : e)
    }))
    const updated = get().enginsData.find(e => e.id === id)
    if (updated) db.upsert('engins', { id, nom: updated.nom, rendement_m3h: updated.rendementM3h || 0, cout_horaire: updated.coutHoraire || 0, consommation_lh: updated.consommationLH || 0, deplacement: updated.deplacement || 0, data: updated }).catch(err => console.error('[DB]', err))
  },

  // ─── Tarifs ───
  updateTarifs: (d) => {
    set(s => ({ tarifsMateriaux: { ...s.tarifsMateriaux, ...d } }))
    const updated = get().tarifsMateriaux
    settings.set('tarifs_materiaux', updated).catch(e => console.error('[DB]', e))
  },
  updateTarifsChantier: (d) => {
    set(s => ({ tarifsChantier: { ...s.tarifsChantier, ...d } }))
    const updated = get().tarifsChantier
    settings.set('tarifs_chantier', updated).catch(e => console.error('[DB]', e))
  },
}))
