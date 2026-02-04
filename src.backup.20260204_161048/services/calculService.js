// Service de calcul des devis
export const calculService = {
  
  // Calcul volume fouille
  calculerVolumeFouille({ fosse, filiere, profondeur, spanc }) {
    let volume = 0
    
    if (fosse) {
      const margin = 0.35
      volume += (fosse.longueur + 2 * margin) * 
                (fosse.largeur + 2 * margin) * 
                (fosse.hauteur + profondeur)
    }
    
    if (filiere) {
      const margin = 0.35
      volume += (filiere.longueur + 2 * margin) * 
                (filiere.largeur + 2 * margin) * 
                (filiere.hauteur + profondeur)
    }
    
    // Dalle SPANC
    if (spanc && fosse) {
      volume += (fosse.longueur + 0.7) * (fosse.largeur + 0.7) * 0.2
    }
    
    return volume
  },
  
  // Foisonnement +30%
  calculerVolumeFoison(volumeFouille) {
    return volumeFouille * 1.3
  },
  
  // Nombre de voyages
  calculerNombreVoyages(volumeFoison, ptacCamion, densiteMateriau) {
    const poidsTonnes = volumeFoison * densiteMateriau
    return Math.ceil(poidsTonnes / ptacCamion)
  },
  
  // Coudes PVC (tous les 3m)
  calculerNombreCoudes(distance) {
    if (distance <= 0) return 0
    return Math.ceil(distance / 3)
  },
  
  // Géotextile +30%
  calculerSurfaceGeotextile(longueur, largeur) {
    return longueur * largeur * 1.3
  },
  
  // Ferraillage 10kg/m²
  calculerFerraillage(surface) {
    return surface * 10
  },
  
  // Installation aérienne
  calculerAerienne({ fosse, profondeur, murPartiel }) {
    if (!fosse) return null
    
    const surfaceDalle = (fosse.longueur + 0.7) * (fosse.largeur + 0.7)
    const hauteurMur = murPartiel ? profondeur / 2 : profondeur
    const perimetre = 2 * (fosse.longueur + 0.7 + fosse.largeur + 0.7)
    
    const nbRangees = Math.ceil(hauteurMur / 0.25)
    const nbBlocsParRangee = Math.ceil(perimetre / 0.5)
    const nbBlocs = nbRangees * nbBlocsParRangee
    const nbBarres = nbBlocsParRangee
    const volumeBeton = nbBlocs * 0.5 * 0.2 * 0.25 * 0.5
    
    return {
      surfaceDalle,
      nbBlocs,
      nbBarres,
      volumeBeton,
      hauteurMur
    }
  },
  
  // Épandage
  calculerEpandage(surface, profondeur) {
    const volumeCailloux = surface * (profondeur + 0.2)
    const longueurDrains = Math.sqrt(surface) * 10
    const volumeTerreEvacuee = surface * 0.4
    
    return {
      volumeCailloux,
      longueurDrains,
      volumeTerreEvacuee
    }
  },
  
  // Déconstruction
  calculerDeconstruction(longueur, largeur, hauteur) {
    const volume = longueur * largeur * hauteur
    const poidsTonnes = volume * 1.8
    
    return { volume, poidsTonnes }
  },
  
  // Coût terrassement avec facteurs
  calculerCoutTerrassement({
    volumeFouille,
    tauxHoraire,
    heuresParM3 = 0.5,
    absenceSol = false,
    inclinaison = 0
  }) {
    let multiplicateur = 1.0
    
    if (absenceSol) multiplicateur *= 3
    if (inclinaison > 30) multiplicateur *= 1.2
    
    const heures = volumeFouille * heuresParM3 * multiplicateur
    return heures * tauxHoraire
  },
  
  // Coût transport A/R
  calculerCoutTransport({
    nombreVoyages,
    distanceAllerKm,
    vitesseKmh = 45,
    tauxHoraire,
    tempsChargement = 4,
    tempsDechargement = 2,
    tempsFixe = 15
  }) {
    const heuresTrajetAR = (distanceAllerKm * 2) / vitesseKmh
    const heuresManoeuvres = (tempsChargement + tempsDechargement + tempsFixe) / 60
    const heuresParVoyage = heuresTrajetAR + heuresManoeuvres
    
    return nombreVoyages * heuresParVoyage * tauxHoraire
  },
  
  // Total devis
  calculerTotalDevis({
    coutTerrassement,
    coutMateriel,
    coutTransport,
    coutMainOeuvre,
    tauxTVA = 0.20
  }) {
    const totalHT = coutTerrassement + coutMateriel + coutTransport + coutMainOeuvre
    const totalTVA = totalHT * tauxTVA
    const totalTTC = totalHT + totalTVA
    
    return { totalHT, totalTVA, totalTTC }
  },
  
  // Validation
  validerDevis({ fosse, filiere, profondeur, distanceMaisonFiliere }) {
    const erreurs = []
    
    if (!fosse && !filiere) {
      erreurs.push('⚠️ Aucun équipement sélectionné')
    }
    
    if (profondeur < 0.5) {
      erreurs.push('⚠️ Profondeur minimale de 0.5m requise')
    }
    
    if (fosse && profondeur < fosse.profondeurMin) {
      erreurs.push(`⚠️ Profondeur insuffisante pour la fosse (min ${fosse.profondeurMin}m)`)
    }
    
    if (distanceMaisonFiliere > 0 && distanceMaisonFiliere < 3) {
      erreurs.push('⚠️ Distance maison-filière très courte (< 3m)')
    }
    
    return erreurs
  },
  
  // Estimation délai et personnel
  estimerDelaiEtPersonnel({ volumeFouille, aeriennes, epandage, deconstruction }) {
    let nbPersonnes = 2
    let joursChantier = 2
    
    if (volumeFouille > 50) {
      nbPersonnes = 3
      joursChantier += 1
    }
    
    if (aeriennes) {
      nbPersonnes = Math.max(nbPersonnes, 3)
      joursChantier += 2
    }
    
    if (epandage) joursChantier += 1
    if (deconstruction) joursChantier += 1
    
    return {
      nbPersonnes,
      joursChantier,
      delaiRealisationJours: joursChantier + 2
    }
  }
}
