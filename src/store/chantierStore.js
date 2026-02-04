import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ═══════════════════════════════════════════════════════════════
// PROCÉDURE ANC — Définition des phases et étapes
// ═══════════════════════════════════════════════════════════════

export const PROCEDURE_ANC = [
  {
    id: 'arrivee',
    phase: 1,
    titre: 'Arrivée chantier',
    icon: '🚗',
    etapes: [
      { id: 'arrivee_scan', label: 'Pointage arrivée', type: 'auto', description: 'Horodatage automatique au scan QR' },
      { id: 'arrivee_etat_lieux', label: 'Photo état des lieux', type: 'photo', obligatoire: true, description: 'Vue générale du terrain avant travaux' },
      { id: 'arrivee_acces', label: 'Photo accès chantier', type: 'photo', obligatoire: true, description: 'Accès véhicules et engins' },
      { id: 'arrivee_securite', label: 'Balisage & sécurité', type: 'check', description: 'Zone balisée, signalisation en place' },
      { id: 'arrivee_materiel', label: 'Vérification matériel reçu', type: 'check', description: 'Cuves, tuyaux, coudes, raccords, sable/gravier' },
    ]
  },
  {
    id: 'terrassement',
    phase: 2,
    titre: 'Terrassement',
    icon: '⛏️',
    etapes: [
      { id: 'terra_implantation', label: 'Photo implantation', type: 'photo', obligatoire: true, description: 'Piquetage selon plan' },
      { id: 'terra_excavation', label: 'Excavation fouille', type: 'check', description: 'Creuser selon dimensions du devis' },
      { id: 'terra_fouille_finie', label: 'Photo fouille terminée', type: 'photo', obligatoire: true, description: 'Profondeur + dimensions conformes' },
      { id: 'terra_verification', label: 'Vérification fond de fouille', type: 'check', description: 'Sol stable, pas d\'eau stagnante' },
      { id: 'terra_evacuation', label: 'Évacuation terres excédentaires', type: 'check', description: 'Terres chargées et évacuées' },
    ]
  },
  {
    id: 'lit_pose',
    phase: 3,
    titre: 'Lit de pose',
    icon: '🧱',
    etapes: [
      { id: 'lit_mise_place', label: 'Mise en place sable/mortier', type: 'check', description: 'Épaisseur conforme au devis' },
      { id: 'lit_photo', label: 'Photo lit de pose', type: 'photo', obligatoire: true, description: 'Épaisseur visible et uniforme' },
      { id: 'lit_niveau', label: 'Vérification planéité/niveau', type: 'check', description: 'Niveau à bulle OK' },
    ]
  },
  {
    id: 'pose_cuve',
    phase: 4,
    titre: 'Pose de la cuve',
    icon: '🏗️',
    etapes: [
      { id: 'cuve_descente', label: 'Descente cuve', type: 'check', description: 'Grue ou pelle, élingues conformes' },
      { id: 'cuve_photo', label: 'Photo cuve posée', type: 'photo', obligatoire: true, description: 'Cuve dans la fouille, bien positionnée' },
      { id: 'cuve_niveau', label: 'Vérification niveau/aplomb', type: 'check', description: 'Cuve de niveau dans les 2 sens' },
      { id: 'cuve_calage', label: 'Calage si nécessaire', type: 'check', description: 'Calage stable sous la cuve' },
    ]
  },
  {
    id: 'raccordements',
    phase: 5,
    titre: 'Raccordements',
    icon: '🔧',
    etapes: [
      { id: 'racc_entree', label: 'Pose tuyaux PVC entrée', type: 'check', description: 'Pente conforme (1 à 3%)' },
      { id: 'racc_sortie', label: 'Pose tuyaux PVC sortie', type: 'check', description: 'Raccordement vers exutoire' },
      { id: 'racc_coudes', label: 'Pose coudes / raccords', type: 'check', description: 'Collage et ajustement' },
      { id: 'racc_photo', label: 'Photo raccordements', type: 'photo', obligatoire: true, description: 'Vue entrée + sortie' },
      { id: 'racc_etancheite', label: 'Test étanchéité raccords', type: 'check', description: 'Pas de fuite visible' },
      { id: 'racc_photo_test', label: 'Photo test étanchéité', type: 'photo', obligatoire: true, description: 'Preuve du test réalisé' },
    ]
  },
  {
    id: 'ventilation',
    phase: 6,
    titre: 'Ventilation',
    icon: '💨',
    etapes: [
      { id: 'vent_primaire', label: 'Pose ventilation primaire', type: 'check', description: 'Mise en place colonne de ventilation' },
      { id: 'vent_haute', label: 'Pose ventilation haute (si prévue)', type: 'check', description: 'Ventilation aérienne ou extracteur' },
      { id: 'vent_photo', label: 'Photo ventilation installée', type: 'photo', obligatoire: true, description: 'Vue d\'ensemble ventilation' },
    ]
  },
  {
    id: 'mise_en_eau',
    phase: 7,
    titre: 'Mise en eau & test',
    icon: '💧',
    etapes: [
      { id: 'eau_remplissage', label: 'Remplissage cuve', type: 'check', description: 'Remplir la cuve aux 3/4 minimum' },
      { id: 'eau_test', label: 'Test étanchéité cuve', type: 'check', description: 'Vérifier absence de fuite après 30min' },
      { id: 'eau_photo', label: 'Photo niveau eau + test', type: 'photo', obligatoire: true, description: 'Preuve du remplissage et résultat test' },
      { id: 'eau_photo_ouvert', label: 'Photo installation ouverte', type: 'photo', obligatoire: true, description: 'Vue complète pour le SPANC (fouille ouverte)' },
    ]
  },
  {
    id: 'remblaiement',
    phase: 8,
    titre: 'Remblaiement',
    icon: '🚜',
    etapes: [
      { id: 'remblai_couches', label: 'Remblai par couches', type: 'check', description: 'Remblai progressif latéral' },
      { id: 'remblai_photo_cours', label: 'Photo remblai en cours', type: 'photo', obligatoire: true, description: 'Montrer le remblai par couches' },
      { id: 'remblai_compactage', label: 'Compactage', type: 'check', description: 'Compactage couche par couche' },
      { id: 'remblai_photo_fini', label: 'Photo remblai terminé', type: 'photo', obligatoire: true, description: 'Fouille entièrement remblayée' },
    ]
  },
  {
    id: 'restauration',
    phase: 9,
    titre: 'Restauration surface',
    icon: '🌱',
    etapes: [
      { id: 'resto_terre', label: 'Remise en place terre végétale', type: 'check', description: 'Surface nivelée' },
      { id: 'resto_graine', label: 'Épandage graine (si prévu)', type: 'check', description: 'Semis gazon ou couvert végétal' },
      { id: 'resto_photo', label: 'Photo état final terrain', type: 'photo', obligatoire: true, description: 'Vue du terrain restauré' },
    ]
  },
  {
    id: 'cloture',
    phase: 10,
    titre: 'Clôture chantier',
    icon: '✅',
    etapes: [
      { id: 'fin_nettoyage', label: 'Nettoyage zone de travail', type: 'check', description: 'Chantier propre, déchets évacués' },
      { id: 'fin_photo', label: 'Photo finale (vue générale)', type: 'photo', obligatoire: true, description: 'Vue d\'ensemble du chantier terminé' },
      { id: 'fin_verification', label: 'Vérification complète', type: 'check', description: 'Toutes les étapes validées' },
      { id: 'fin_signature', label: 'Signature fin de chantier', type: 'signature', description: 'Validation et horodatage départ' },
    ]
  },
]

// ═══════════════════════════════════════════════════════════════
// STORE — État des chantiers (suivi pose)
// ═══════════════════════════════════════════════════════════════

export const useChantierStore = create(
  persist(
    (set, get) => ({
      // { [devisId]: { etapes: {}, passages: [], spanc: [], photos: [], notes: '' } }
      chantiers: {},

      // ─── Initialiser un chantier ───
      initChantier: (devisId, poseurNom) => set(s => {
        if (s.chantiers[devisId]) return s
        return {
          chantiers: {
            ...s.chantiers,
            [devisId]: {
              devisId,
              statut: 'en_cours', // en_cours, pause_spanc, termine
              etapes: {},        // { [etapeId]: { fait: true, timestamp, poseur, photos: [] } }
              passages: [],      // [{ poseur, arrivee, depart }]
              spanc: [],         // [{ timestamp, inspecteur, conforme, commentaire, photoUrl }]
              photos: [],        // toutes les photos avec metadata
              notes: '',
              dateCreation: new Date().toISOString(),
            }
          }
        }
      }),

      // ─── Pointer arrivée ───
      pointerArrivee: (devisId, poseurNom) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const passages = [...ch.passages, { poseur: poseurNom, arrivee: new Date().toISOString(), depart: null }]
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, passages, statut: 'en_cours' } } }
      }),

      // ─── Pointer départ (pause ou fin) ───
      pointerDepart: (devisId, raison = 'pause') => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const passages = ch.passages.map((p, i) =>
          i === ch.passages.length - 1 && !p.depart
            ? { ...p, depart: new Date().toISOString(), raison }
            : p
        )
        const statut = raison === 'termine' ? 'termine' : raison === 'spanc' ? 'pause_spanc' : 'pause'
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, passages, statut } } }
      }),

      // ─── Valider une étape ───
      validerEtape: (devisId, etapeId, poseurNom) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const etapes = {
          ...ch.etapes,
          [etapeId]: {
            ...(ch.etapes[etapeId] || {}),
            fait: true,
            timestamp: new Date().toISOString(),
            poseur: poseurNom,
          }
        }
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, etapes } } }
      }),

      // ─── Dévalider une étape ───
      devaliderEtape: (devisId, etapeId) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const etapes = { ...ch.etapes }
        delete etapes[etapeId]
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, etapes } } }
      }),

      // ─── Ajouter une photo à une étape ───
      ajouterPhoto: (devisId, etapeId, photoData, poseurNom) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const photo = {
          id: Date.now().toString(),
          etapeId,
          dataUrl: photoData, // base64
          timestamp: new Date().toISOString(),
          poseur: poseurNom,
        }
        // Ajouter aux photos globales
        const photos = [...ch.photos, photo]
        // Ajouter la ref à l'étape
        const etapeExistante = ch.etapes[etapeId] || {}
        const etapes = {
          ...ch.etapes,
          [etapeId]: {
            ...etapeExistante,
            photos: [...(etapeExistante.photos || []), photo.id],
          }
        }
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, photos, etapes } } }
      }),

      // ─── Supprimer une photo ───
      supprimerPhoto: (devisId, photoId) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const photos = ch.photos.filter(p => p.id !== photoId)
        // Nettoyer les refs dans les étapes
        const etapes = { ...ch.etapes }
        Object.keys(etapes).forEach(k => {
          if (etapes[k].photos) {
            etapes[k] = { ...etapes[k], photos: etapes[k].photos.filter(id => id !== photoId) }
          }
        })
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, photos, etapes } } }
      }),

      // ─── Visite SPANC ───
      ajouterSPANC: (devisId, data) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const visite = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          inspecteur: data.inspecteur || '',
          conforme: data.conforme, // true / false / null (en attente)
          commentaire: data.commentaire || '',
          photoUrl: data.photoUrl || null,
        }
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, spanc: [...ch.spanc, visite] } } }
      }),

      // ─── Notes chantier ───
      setNotes: (devisId, notes) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, notes } } }
      }),

      // ─── Getters ───
      getChantier: (devisId) => get().chantiers[devisId] || null,

      getProgression: (devisId) => {
        const ch = get().chantiers[devisId]
        if (!ch) return { total: 0, fait: 0, pct: 0 }
        const totalEtapes = PROCEDURE_ANC.reduce((acc, phase) => acc + phase.etapes.length, 0)
        const etapesFaites = Object.values(ch.etapes).filter(e => e.fait).length
        return { total: totalEtapes, fait: etapesFaites, pct: Math.round((etapesFaites / totalEtapes) * 100) }
      },

      getPhotosEtape: (devisId, etapeId) => {
        const ch = get().chantiers[devisId]
        if (!ch) return []
        return ch.photos.filter(p => p.etapeId === etapeId)
      },

      // ─── Reset chantier ───
      resetChantier: (devisId) => set(s => {
        const chantiers = { ...s.chantiers }
        delete chantiers[devisId]
        return { chantiers }
      }),
    }),
    { name: 'chantier-storage' }
  )
)
