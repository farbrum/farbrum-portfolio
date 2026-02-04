import { create } from 'zustand'
import { db } from '../services/supabase'

function genNum(existing) {
  const t = new Date()
  const p = `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,'0')}${String(t.getDate()).padStart(2,'0')}`
  return `${p}-${String(existing.filter(d=>d.numero_devis?.startsWith(p)).length+1).padStart(3,'0')}`
}

// Transformer un devis Supabase → format app (compatibilité)
function fromDb(d) {
  return {
    ...d,
    // Mapper les noms de colonnes DB vers les noms utilisés dans l'app
    numeroDevis: d.numero_devis || d.numeroDevis,
    dateCreation: d.date_creation || d.dateCreation,
    // Merger les données flexibles du champ JSONB
    ...(d.data || {}),
  }
}

// Transformer un devis app → format Supabase
function toDb(d) {
  const { id, numeroDevis, dateCreation, statut, data: _d, created_at, updated_at, numero_devis, date_creation, ...rest } = d
  return {
    id: id || Date.now().toString(),
    numero_devis: numeroDevis || numero_devis,
    date_creation: dateCreation || date_creation || new Date().toISOString(),
    statut: statut || 'brouillon',
    client_nom: rest.client?.nom || rest.client_nom || '',
    client_adresse: rest.client?.adresse || rest.client_adresse || '',
    client_telephone: rest.client?.telephone || rest.client_telephone || '',
    client_email: rest.client?.email || rest.client_email || '',
    chantier_adresse: rest.chantier?.adresse || rest.chantier_adresse || '',
    chantier_lat: rest.chantier?.lat || rest.chantier_lat || null,
    chantier_lng: rest.chantier?.lng || rest.chantier_lng || null,
    data: rest, // Tout le reste va dans le champ JSONB flexible
    updated_at: new Date().toISOString(),
  }
}

export const useDevisStore = create((set, get) => ({
  devis: [],
  loaded: false,
  loading: false,

  // ─── Charger les devis depuis Supabase ───
  init: async () => {
    if (get().loaded) return
    set({ loading: true })
    try {
      const data = await db.getAll('devis')
      set({ devis: (data || []).map(fromDb), loaded: true, loading: false })
    } catch (err) {
      console.error('[Devis] init error:', err)
      set({ loading: false })
    }
  },

  // ─── Ajouter un devis ───
  addDevis: async (d) => {
    const existing = get().devis
    const newDevis = {
      ...d,
      id: d.id || Date.now().toString(),
      numeroDevis: d.numeroDevis || genNum(existing),
      dateCreation: d.dateCreation || new Date().toISOString(),
      statut: d.statut || 'brouillon',
    }
    // Ajouter immédiatement dans le state local
    set(s => ({ devis: [...s.devis, newDevis] }))
    // Sauvegarder dans Supabase en background
    db.upsert('devis', toDb(newDevis)).catch(err => console.error('[Devis] save error:', err))
    return newDevis
  },

  // ─── Modifier un devis ───
  updateDevis: async (id, updates) => {
    set(s => ({ devis: s.devis.map(d => d.id === id ? { ...d, ...updates } : d) }))
    // Récupérer le devis complet mis à jour
    const updated = get().devis.find(d => d.id === id)
    if (updated) {
      db.upsert('devis', toDb(updated)).catch(err => console.error('[Devis] update error:', err))
    }
  },

  // ─── Supprimer un devis ───
  deleteDevis: async (id) => {
    set(s => ({ devis: s.devis.filter(d => d.id !== id) }))
    db.delete('devis', id).catch(err => console.error('[Devis] delete error:', err))
  },

  // ─── Getter ───
  getDevisById: (id) => get().devis.find(d => d.id === id),
}))
