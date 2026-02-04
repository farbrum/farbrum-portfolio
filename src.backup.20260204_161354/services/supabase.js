import { createClient } from '@supabase/supabase-js'

// ─── Configuration Supabase ───
const SUPABASE_URL = 'https://fqnsfjfhrpvtnxaxfmjk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_sN2N7KM-of_237NL0HHs0A_ZCLWfaX5'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ═══════════════════════════════════════════════════════════
// SERVICE GÉNÉRIQUE CRUD
// ═══════════════════════════════════════════════════════════

export const db = {
  async getAll(table) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) { console.error(`[DB] getAll ${table}:`, error); return [] }
    return data || []
  },

  async getById(table, id) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    if (error) { console.error(`[DB] getById ${table}:`, error); return null }
    return data
  },

  async insert(table, record) {
    const { data, error } = await supabase.from(table).insert(record).select().single()
    if (error) { console.error(`[DB] insert ${table}:`, error); return null }
    return data
  },

  async insertMany(table, records) {
    if (!records?.length) return []
    const { data, error } = await supabase.from(table).insert(records).select()
    if (error) { console.error(`[DB] insertMany ${table}:`, error); return [] }
    return data || []
  },

  async update(table, id, updates) {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
    if (error) { console.error(`[DB] update ${table}:`, error); return null }
    return data
  },

  async upsert(table, record) {
    const { data, error } = await supabase.from(table).upsert(record).select().single()
    if (error) { console.error(`[DB] upsert ${table}:`, error); return null }
    return data
  },

  async upsertMany(table, records) {
    if (!records?.length) return []
    const { data, error } = await supabase.from(table).upsert(records).select()
    if (error) { console.error(`[DB] upsertMany ${table}:`, error); return [] }
    return data || []
  },

  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { console.error(`[DB] delete ${table}:`, error); return false }
    return true
  },

  async deleteAll(table) {
    const { error } = await supabase.from(table).delete().neq('id', '__impossible__')
    if (error) { console.error(`[DB] deleteAll ${table}:`, error); return false }
    return true
  },
}

// ═══════════════════════════════════════════════════════════
// SETTINGS (clé-valeur)
// ═══════════════════════════════════════════════════════════

export const settings = {
  async get(key) {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()
    if (error) return null
    return data?.value
  },

  async set(key, value) {
    const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) console.error(`[Settings] set ${key}:`, error)
  },
}

// ═══════════════════════════════════════════════════════════
// STORAGE — Upload/Download photos
// ═══════════════════════════════════════════════════════════

export const storage = {
  async uploadPhoto(devisId, etapeId, base64Data) {
    try {
      const res = await fetch(base64Data)
      const blob = await res.blob()
      const fileName = `${devisId}/${etapeId}/${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) { console.error('[Storage] upload:', error); return null }
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
      return urlData?.publicUrl || null
    } catch (err) {
      console.error('[Storage] uploadPhoto error:', err)
      return null
    }
  },

  async deletePhoto(filePath) {
    const { error } = await supabase.storage.from('photos').remove([filePath])
    if (error) console.error('[Storage] delete:', error)
  },

  getPhotoUrl(filePath) {
    const { data } = supabase.storage.from('photos').getPublicUrl(filePath)
    return data?.publicUrl || ''
  },
}

// ═══════════════════════════════════════════════════════════
// AUTH — Vérification utilisateurs
// ═══════════════════════════════════════════════════════════

export const auth = {
  async login(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .single()
    if (error || !data) return null
    const { password: _, ...safe } = data
    return safe
  },

  async getUsers() { return await db.getAll('users') },
  async addUser(userData) { return await db.insert('users', { ...userData, email: userData.email.toLowerCase() }) },
  async updateUser(id, updates) {
    if (updates.email) updates.email = updates.email.toLowerCase()
    return await db.update('users', id, updates)
  },
  async deleteUser(id) { return await db.delete('users', id) },

  async verifyCodeEntreprise(code) {
    const stored = await settings.get('code_entreprise')
    return code.toUpperCase().trim() === (stored || 'FARB2025').toUpperCase()
  },

  async setCodeEntreprise(newCode) {
    await settings.set('code_entreprise', newCode.toUpperCase().trim())
  },
}

// ═══════════════════════════════════════════════════════════
// BACKUP — Sauvegarde automatique locale
// ═══════════════════════════════════════════════════════════

export const backup = {
  async downloadBackup() {
    try {
      const [categories, fournisseurs, produits, vehicules, engins, ressources, devisData, chantiers, users, tarifsMateriaux, tarifsChantier, codeEntreprise] = await Promise.all([
        db.getAll('categories'),
        db.getAll('fournisseurs'),
        db.getAll('produits'),
        db.getAll('vehicules'),
        db.getAll('engins'),
        db.getAll('ressources'),
        db.getAll('devis'),
        db.getAll('chantiers'),
        db.getAll('users'),
        settings.get('tarifs_materiaux'),
        settings.get('tarifs_chantier'),
        settings.get('code_entreprise'),
      ])

      const data = {
        _export: { app: 'F.Arbrum', version: '7-supabase', date: new Date().toISOString(), source: 'backup' },
        categories, fournisseurs, produits, vehicules,
        enginsData: engins, ressources, devis: devisData, chantiers,
        users: (users || []).map(u => ({ ...u, password: '***' })),
        tarifsMateriaux: tarifsMateriaux || {},
        tarifsChantier: tarifsChantier || {},
        codeEntreprise: codeEntreprise || 'FARB2025',
      }

      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const d = new Date()
      a.href = url
      a.download = `F_Arbrum_backup_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}.json`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 1000)
      return { success: true }
    } catch (err) {
      console.error('[Backup] error:', err)
      return { success: false, error: err.message }
    }
  },

  async restoreFromBackup(jsonData, mode = 'merge') {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      if (!data._export?.app) throw new Error("Fichier invalide")

      if (mode === 'replace') {
        await Promise.all([
          db.deleteAll('categories'), db.deleteAll('fournisseurs'), db.deleteAll('produits'),
          db.deleteAll('vehicules'), db.deleteAll('engins'), db.deleteAll('ressources'),
          db.deleteAll('devis'), db.deleteAll('chantiers'),
        ])
      }

      const results = {}

      if (data.categories?.length) {
        await db.upsertMany('categories', data.categories.map(c => ({
          id: c.id, nom: c.nom,
          groupe: c.groupeId || c.groupe || 'divers',
          type: c.typeCategorie || c.type || 'autre',
          data: { typeCategorie: c.typeCategorie || c.type, groupeId: c.groupeId || c.groupe, ordre: c.ordre },
        })))
        results.categories = data.categories.length
      }

      if (data.fournisseurs?.length) {
        await db.upsertMany('fournisseurs', data.fournisseurs.map(f => ({
          id: f.id, nom: f.nom, contact: f.contact || '', telephone: f.telephone || '',
          email: f.email || '', adresse: f.adresse || '', notes: f.notes || '', data: f,
        })))
        results.fournisseurs = data.fournisseurs.length
      }

      if (data.produits?.length) {
        await db.upsertMany('produits', data.produits.map(p => ({
          id: p.id, nom: p.nom,
          categorie_id: p.categorieId || p.categorie_id || null,
          fournisseur_id: p.fournisseurId || p.fournisseur_id || null,
          prix: p.prix || p.prixUnitaire || 0, unite: p.unite || 'u', data: p,
        })))
        results.produits = data.produits.length
      }

      if (data.vehicules?.length) {
        await db.upsertMany('vehicules', data.vehicules.map(v => ({
          id: v.id, nom: v.nom, immatriculation: v.immatriculation || '',
          capacite_m3: v.capaciteM3 || v.capacite_m3 || 0,
          cout_km: v.prixKm || v.cout_km || 0, data: v,
        })))
        results.vehicules = data.vehicules.length
      }

      if (data.enginsData?.length) {
        await db.upsertMany('engins', data.enginsData.map(e => ({
          id: e.id, nom: e.nom,
          rendement_m3h: e.rendementM3h || e.rendement_m3h || 0,
          cout_horaire: e.coutHoraire || e.cout_horaire || 0,
          consommation_lh: e.consommationLH || e.consommation_lh || 0,
          deplacement: e.deplacement || 0, data: e,
        })))
        results.engins = data.enginsData.length
      }

      if (data.ressources?.length) {
        await db.upsertMany('ressources', data.ressources.map(r => ({
          id: r.id, nom: r.nom, pin: r.pin || '', role: r.role || 'poseur',
          tarif_journalier: r.tarifJournalier || r.tarif_journalier || 0,
          tarif_horaire: r.tarifHoraire || r.tarif_horaire || 0,
          competences: r.competences || [], jours_travail: r.joursTravail || r.jours_travail || [1,2,3,4,5],
          data: r,
        })))
        results.ressources = data.ressources.length
      }

      if (data.devis?.length) {
        for (const d of data.devis) {
          await db.upsert('devis', {
            id: d.id,
            numero_devis: d.numeroDevis || d.numero_devis || '',
            date_creation: d.dateCreation || d.date_creation || new Date().toISOString(),
            statut: d.statut || 'brouillon',
            client_nom: d.client?.nomComplet || d.client?.nom || d.client_nom || '',
            client_adresse: d.client?.adresse || d.client_adresse || '',
            client_telephone: d.client?.telephone || d.client_telephone || '',
            client_email: d.client?.email || d.client_email || '',
            chantier_adresse: d.chantier?.adresse || d.chantier_adresse || '',
            chantier_lat: d.chantier?.lat || d.chantier_lat || null,
            chantier_lng: d.chantier?.lng || d.chantier_lng || null,
            data: d,
          })
        }
        results.devis = data.devis.length
      }

      if (data.tarifsMateriaux && Object.keys(data.tarifsMateriaux).length) {
        await settings.set('tarifs_materiaux', data.tarifsMateriaux)
      }
      if (data.tarifsChantier && Object.keys(data.tarifsChantier).length) {
        await settings.set('tarifs_chantier', data.tarifsChantier)
      }

      return { success: true, results }
    } catch (err) {
      console.error('[Backup] restore error:', err)
      return { success: false, error: err.message }
    }
  },
}
