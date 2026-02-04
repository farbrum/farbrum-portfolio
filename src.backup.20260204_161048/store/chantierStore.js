import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from '../services/supabase'

// ═══════════════════════════════════════════════════════════
// PROCÉDURE ANC — Définition des phases et étapes
// ═══════════════════════════════════════════════════════════

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
      { id: 'cuve_levage', label: 'Photo levage cuve', type: 'photo', obligatoire: true, description: 'Cuve en phase de mise en fouille' },
      { id: 'cuve_calage', label: 'Calage & niveau', type: 'check', description: 'Cuve calée, vérification niveau' },
      { id: 'cuve_posee', label: 'Photo cuve posée', type: 'photo', obligatoire: true, description: 'Cuve en place, de niveau, dans la fouille' },
    ]
  },
  {
    id: 'raccordements',
    phase: 5,
    titre: 'Raccordements',
    icon: '🔧',
    etapes: [
      { id: 'racc_entree', label: 'Raccordement entrée', type: 'check', description: 'Raccord collecteur → cuve' },
      { id: 'racc_sortie', label: 'Raccordement sortie', type: 'check', description: 'Raccord cuve → exutoire' },
      { id: 'racc_photo', label: 'Photo raccordements', type: 'photo', obligatoire: true, description: 'Tous les raccords visibles' },
      { id: 'racc_ventilation', label: 'Mise en place ventilation', type: 'check', description: 'Ventilation primaire + secondaire' },
      { id: 'racc_electrique', label: 'Raccordement électrique', type: 'check', description: 'Si microstation : alimentation + disjoncteur' },
    ]
  },
  {
    id: 'remblai',
    phase: 6,
    titre: 'Remblaiement',
    icon: '⬆️',
    etapes: [
      { id: 'remb_lateral', label: 'Remblaiement latéral', type: 'check', description: 'Par couches de 30cm avec compactage' },
      { id: 'remb_photo_mi', label: 'Photo mi-remblai', type: 'photo', obligatoire: false, description: 'Niveau intermédiaire visible' },
      { id: 'remb_superieur', label: 'Remblaiement supérieur', type: 'check', description: 'Remise en état du terrain' },
      { id: 'remb_photo_fin', label: 'Photo remblai terminé', type: 'photo', obligatoire: true, description: 'Remblai final, terrain restauré' },
    ]
  },
  {
    id: 'essais',
    phase: 7,
    titre: 'Essais & Mise en eau',
    icon: '💧',
    etapes: [
      { id: 'essai_etancheite', label: 'Test étanchéité', type: 'check', description: 'Remplissage, observation 24h' },
      { id: 'essai_mise_eau', label: 'Mise en eau initiale', type: 'check', description: 'Remplissage cuve au niveau de fonctionnement' },
      { id: 'essai_photo', label: 'Photo mise en eau', type: 'photo', obligatoire: true, description: 'Niveau d\'eau visible dans la cuve' },
    ]
  },
  {
    id: 'spanc',
    phase: 8,
    titre: 'Contrôle SPANC',
    icon: '📋',
    etapes: [
      { id: 'spanc_avant_remblai', label: 'Visite SPANC avant remblai', type: 'check', description: 'Contrôle conformité par le SPANC (obligatoire)' },
      { id: 'spanc_photo', label: 'Photo visite SPANC', type: 'photo', obligatoire: false, description: 'Inspecteur sur site, PV si disponible' },
      { id: 'spanc_pv', label: 'PV SPANC reçu', type: 'check', description: 'Procès-verbal signé conforme/non-conforme' },
    ]
  },
  {
    id: 'finitions',
    phase: 9,
    titre: 'Finitions',
    icon: '✨',
    etapes: [
      { id: 'fin_nettoyage', label: 'Nettoyage chantier', type: 'check', description: 'Terrain propre, déchets évacués' },
      { id: 'fin_photo_finale', label: 'Photo finale chantier', type: 'photo', obligatoire: true, description: 'Vue d\'ensemble chantier terminé' },
      { id: 'fin_regards', label: 'Photo regards accessibles', type: 'photo', obligatoire: true, description: 'Tous les regards visibles et accessibles' },
    ]
  },
  {
    id: 'cloture',
    phase: 10,
    titre: 'Clôture chantier',
    icon: '🏁',
    etapes: [
      { id: 'clo_check_final', label: 'Vérification liste complète', type: 'check', description: 'Toutes les étapes obligatoires validées' },
      { id: 'fin_signature', label: 'Signature fin de chantier', type: 'signature', description: 'Signature du client ou responsable' },
      { id: 'clo_depart', label: 'Pointage départ', type: 'auto', description: 'Horodatage automatique fin de chantier' },
    ]
  },
]

// ═══════════════════════════════════════════════════════════
// STORE — Chantiers avec photos sur Supabase Storage
// ═══════════════════════════════════════════════════════════

export const useChantierStore = create(
  persist(
    (set, get) => ({
      chantiers: {},

      // ─── Initialiser un chantier ───
      initChantier: (devisId, poseurNom) => set(s => {
        if (s.chantiers[devisId]) return s
        return {
          chantiers: {
            ...s.chantiers,
            [devisId]: {
              devisId,
              statut: 'en_cours',
              etapes: {},
              passages: [],
              spanc: [],
              photos: [],       // Ne contient plus de base64, juste des URLs
              signatures: [],
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

      // ─── Pointer départ ───
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

      // ─── Ajouter une photo → Upload Supabase Storage ───
      ajouterPhoto: (devisId, etapeId, photoData, poseurNom, geo = null) => {
        const photoId = Date.now().toString()
        
        // 1. Ajouter immédiatement avec le base64 (pour affichage instantané)
        set(s => {
          const ch = s.chantiers[devisId]
          if (!ch) return s
          const photo = {
            id: photoId,
            etapeId,
            dataUrl: photoData, // temporaire, sera remplacé par l'URL
            photoUrl: null,     // sera rempli après upload
            timestamp: new Date().toISOString(),
            poseur: poseurNom,
            geo: geo || null,
            uploading: true,
          }
          const photos = [...ch.photos, photo]
          const etapeExistante = ch.etapes[etapeId] || {}
          const etapes = {
            ...ch.etapes,
            [etapeId]: {
              ...etapeExistante,
              photos: [...(etapeExistante.photos || []), photoId],
            }
          }
          return { chantiers: { ...s.chantiers, [devisId]: { ...ch, photos, etapes } } }
        })

        // 2. Upload en arrière-plan vers Supabase Storage
        storage.uploadPhoto(devisId, etapeId, photoData).then(url => {
          if (url) {
            // Remplacer le base64 par l'URL Supabase
            set(s => {
              const ch = s.chantiers[devisId]
              if (!ch) return s
              const photos = ch.photos.map(p =>
                p.id === photoId
                  ? { ...p, photoUrl: url, dataUrl: null, uploading: false }
                  : p
              )
              return { chantiers: { ...s.chantiers, [devisId]: { ...ch, photos } } }
            })
          } else {
            // Upload échoué — garder le base64 en fallback
            set(s => {
              const ch = s.chantiers[devisId]
              if (!ch) return s
              const photos = ch.photos.map(p =>
                p.id === photoId ? { ...p, uploading: false, uploadFailed: true } : p
              )
              return { chantiers: { ...s.chantiers, [devisId]: { ...ch, photos } } }
            })
          }
        })
      },

      // ─── Supprimer une photo ───
      supprimerPhoto: (devisId, photoId) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const photos = ch.photos.filter(p => p.id !== photoId)
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
          conforme: data.conforme,
          commentaire: data.commentaire || '',
          photoUrl: data.photoUrl || null,
        }
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, spanc: [...ch.spanc, visite] } } }
      }),

      // ─── Signature fin de chantier ───
      ajouterSignature: (devisId, signatureData) => set(s => {
        const ch = s.chantiers[devisId]
        if (!ch) return s
        const signatures = [...(ch.signatures || []), {
          id: Date.now().toString(),
          ...signatureData,
        }]
        return { chantiers: { ...s.chantiers, [devisId]: { ...ch, signatures } } }
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

      // Helper: obtenir l'URL d'affichage d'une photo
      getPhotoSrc: (photo) => {
        if (photo.photoUrl) return photo.photoUrl     // URL Supabase
        if (photo.dataUrl) return photo.dataUrl       // Base64 fallback
        return ''
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
