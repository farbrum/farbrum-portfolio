// ═══════════════════════════════════════════════════════════
// Calcul blocs à bancher — F_Arbrum v7.4
// Blocs 20×20×50 cm · Fers T10 · Béton remplissage
// ═══════════════════════════════════════════════════════════

// Constantes bloc standard
const BLOC_L = 0.50  // longueur (m)
const BLOC_H = 0.20  // hauteur (m)
const BLOC_EP = 0.20 // épaisseur (m)

// ─── Calcul emprise mur aérien autour des cuves ───
// cuves = [{longueur, largeur, hauteur}, ...]
// marge = 0.40m tout autour, entreCuves = 0.50m entre deux cuves
export function calcEmpriseAerienne(cuves, marge = 0.40, entreCuves = 0.50) {
  if (!cuves || cuves.length === 0) return null

  // Largeur interne = plus grande largeur de cuve + 2 × marge
  const largMax = Math.max(...cuves.map(c => parseFloat(c.largeur) || 0))
  const largeurInt = largMax + 2 * marge
  const largeurExt = largeurInt + 2 * BLOC_EP

  // Longueur interne = somme longueurs cuves + marges + entre-cuves
  const sommeLong = cuves.reduce((s, c) => s + (parseFloat(c.longueur) || 0), 0)
  const longueurInt = sommeLong + 2 * marge + Math.max(0, cuves.length - 1) * entreCuves
  const longueurExt = longueurInt + 2 * BLOC_EP

  // Hauteur = max hauteur cuve + 1 rang (20cm)
  const hautMax = Math.max(...cuves.map(c => parseFloat(c.hauteur) || 0))
  const hauteurMur = hautMax + 0.20 // +1 rang au-dessus

  return {
    longueurInt: round2(longueurInt),
    largeurInt: round2(largeurInt),
    longueurExt: round2(longueurExt),
    largeurExt: round2(largeurExt),
    hauteurMur: round2(hauteurMur),
    hauteurCuve: round2(hautMax),
    marge,
    entreCuves,
    nbCuves: cuves.length,
  }
}

// ─── Calcul blocs pour un mur rectangulaire ───
// perimetre = périmètre intérieur en mètres
// hauteur = hauteur en mètres
export function calcBlocsRectangle(longueurInt, largeurInt, hauteur) {
  const nbRangs = Math.ceil(hauteur / BLOC_H)
  const hauteurReelle = nbRangs * BLOC_H

  // Périmètre intérieur
  const perimetre = 2 * (longueurInt + largeurInt)

  // Blocs par rang sur chaque côté (sans compter les angles)
  // Côté long : blocsParCote = ceil(longueurInt / BLOC_L) - on garde 4 angles
  // Chaque angle utilise 1 bloc angle par rang
  const nbBlocsCoteLong = Math.ceil(longueurInt / BLOC_L)
  const nbBlocsCoteLarg = Math.ceil(largeurInt / BLOC_L)

  // Les 4 angles prennent 1 bloc angle chacun par rang
  const blocsAngleParRang = 4
  // Blocs droits = total par rang - angles
  const blocsTotalParRang = 2 * nbBlocsCoteLong + 2 * nbBlocsCoteLarg
  const blocsDroitsParRang = blocsTotalParRang - blocsAngleParRang

  const totalBlocsDroits = blocsDroitsParRang * nbRangs
  const totalBlocsAngle = blocsAngleParRang * nbRangs
  const totalBlocs = totalBlocsDroits + totalBlocsAngle

  // Volume béton de remplissage
  // Volume intérieur d'un bloc ≈ 50% du volume extérieur
  const volBlocInterieur = BLOC_L * BLOC_H * BLOC_EP * 0.50
  const volBeton = round2(totalBlocs * volBlocInterieur)

  // Ferraillage T10
  // Verticaux : 1 fer tous les 50cm sur le périmètre
  const nbFersVerticaux = Math.ceil(perimetre / BLOC_L)
  const longueurFerVertical = hauteurReelle + 0.30 // +30cm ancrage
  const mlFersVerticaux = round2(nbFersVerticaux * longueurFerVertical)

  // Horizontaux : 1 fer par rang sur tout le périmètre
  const mlFersHorizontaux = round2(nbRangs * perimetre)

  const mlFerTotal = round2(mlFersVerticaux + mlFersHorizontaux)
  // Poids T10 : 0.617 kg/m
  const poidsFer = round2(mlFerTotal * 0.617)
  // Barres standard 6m
  const nbBarres6m = Math.ceil(mlFerTotal / 6)

  return {
    nbRangs,
    hauteurReelle: round2(hauteurReelle),
    perimetre: round2(perimetre),
    totalBlocsDroits,
    totalBlocsAngle,
    totalBlocs,
    volBeton,
    nbFersVerticaux,
    longueurFerVertical: round2(longueurFerVertical),
    mlFersVerticaux,
    mlFersHorizontaux,
    mlFerTotal,
    poidsFer,
    nbBarres6m,
  }
}

// ─── Calcul complet pour installation aérienne ───
export function calcBlocsAerien(cuves, tarifsBlocs = {}) {
  const emprise = calcEmpriseAerienne(cuves)
  if (!emprise) return null

  const blocs = calcBlocsRectangle(emprise.longueurInt, emprise.largeurInt, emprise.hauteurMur)

  // Coûts
  const prixBloc = parseFloat(tarifsBlocs.prixBlocBancher) || 2.50
  const prixBlocAngle = parseFloat(tarifsBlocs.prixBlocAngle) || 3.00
  const prixBetonM3 = parseFloat(tarifsBlocs.prixBetonM3) || 120
  const prixFerKg = parseFloat(tarifsBlocs.prixFerT10Kg) || 1.50

  const coutBlocsDroits = round2(blocs.totalBlocsDroits * prixBloc)
  const coutBlocsAngle = round2(blocs.totalBlocsAngle * prixBlocAngle)
  const coutBeton = round2(blocs.volBeton * prixBetonM3)
  const coutFer = round2(blocs.poidsFer * prixFerKg)
  const coutTotal = round2(coutBlocsDroits + coutBlocsAngle + coutBeton + coutFer)

  return {
    type: 'aerien',
    emprise,
    blocs,
    couts: {
      prixBloc, prixBlocAngle, prixBetonM3, prixFerKg,
      coutBlocsDroits, coutBlocsAngle, coutBeton, coutFer, coutTotal,
    }
  }
}

// ─── Calcul mur de soutènement (saisie libre) ───
export function calcMurSoutenement(params, tarifsBlocs = {}) {
  const longueur = parseFloat(params.longueur) || 0
  const hauteur = parseFloat(params.hauteur) || 0
  const epaisseur = parseFloat(params.epaisseur) || 0.20
  const fondation = !!params.fondation
  const fondLargeur = parseFloat(params.fondLargeur) || 0.40
  const fondHauteur = parseFloat(params.fondHauteur) || 0.30

  if (longueur <= 0 || hauteur <= 0) return null

  const nbRangs = Math.ceil(hauteur / BLOC_H)
  const hauteurReelle = nbRangs * BLOC_H

  // Mur linéaire (pas rectangulaire fermé)
  // Blocs droits = longueur / 0.50 par rang
  const blocsParRang = Math.ceil(longueur / BLOC_L)
  // Pas de coins si c'est un mur droit, sauf si L ou U
  // Simplification : on considère un mur droit sans angle
  // L'utilisateur peut ajouter des angles manuellement
  const totalBlocsDroits = blocsParRang * nbRangs
  const totalBlocsAngle = 0
  const totalBlocs = totalBlocsDroits

  // Volume béton remplissage
  const volBlocInterieur = BLOC_L * BLOC_H * epaisseur * 0.50
  const volBetonMur = round2(totalBlocs * volBlocInterieur)

  // Fondation
  let volBetonFondation = 0
  if (fondation) {
    volBetonFondation = round2(longueur * fondLargeur * fondHauteur)
  }

  const volBetonTotal = round2(volBetonMur + volBetonFondation)

  // Ferraillage T10
  const nbFersVerticaux = Math.ceil(longueur / BLOC_L)
  const longueurFerVertical = hauteurReelle + (fondation ? fondHauteur : 0) + 0.30
  const mlFersVerticaux = round2(nbFersVerticaux * longueurFerVertical)
  const mlFersHorizontaux = round2(nbRangs * longueur)
  // Fondation : 2 filants
  const mlFersFondation = fondation ? round2(2 * longueur) : 0
  const mlFerTotal = round2(mlFersVerticaux + mlFersHorizontaux + mlFersFondation)
  const poidsFer = round2(mlFerTotal * 0.617)
  const nbBarres6m = Math.ceil(mlFerTotal / 6)

  // Coûts
  const prixBloc = parseFloat(tarifsBlocs.prixBlocBancher) || 2.50
  const prixBetonM3 = parseFloat(tarifsBlocs.prixBetonM3) || 120
  const prixFerKg = parseFloat(tarifsBlocs.prixFerT10Kg) || 1.50

  const coutBlocs = round2(totalBlocs * prixBloc)
  const coutBeton = round2(volBetonTotal * prixBetonM3)
  const coutFer = round2(poidsFer * prixFerKg)
  const coutTotal = round2(coutBlocs + coutBeton + coutFer)

  return {
    type: 'soutenement',
    longueur, hauteur: hauteurReelle, epaisseur,
    nbRangs,
    totalBlocsDroits, totalBlocsAngle: 0, totalBlocs,
    volBetonMur, volBetonFondation, volBetonTotal,
    fondation, fondLargeur, fondHauteur,
    mlFersVerticaux, mlFersHorizontaux, mlFersFondation, mlFerTotal,
    poidsFer, nbBarres6m,
    couts: {
      prixBloc, prixBetonM3, prixFerKg,
      coutBlocs, coutBeton, coutFer, coutTotal,
    }
  }
}

function round2(v) { return Math.round(v * 100) / 100 }
